import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * 3D地面と障害物の管理（高低差対応版）
 */
export class GroundManager3D {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.grounds = [];
    this.walls = [];
    this.slopes = []; // 坂道
    this.groundsSinceLastWall = 0;
    this.lastHadWall = false;
    this.lastHadGap = false;
    this.totalGroundsCreated = 0;
    this.currentSpeed = CONFIG.GROUND_SPEED;
    this.groundColorIndex = 0;

    // 高低差管理
    this.currentHeight = 0; // 現在の地面の高さ
    this.slopeCounter = 0; // 坂道の連続カウント
    this.platformCounter = 0; // 高台の残りブロック数
    this.lastTerrainType = 'flat'; // flat, slope_up, slope_down, platform
  }

  setSpeed(speed) {
    this.currentSpeed = speed;
  }

  getDynamicChances() {
    const ratio = (this.currentSpeed - CONFIG.GROUND_SPEED) / (CONFIG.MAX_SPEED - CONFIG.GROUND_SPEED);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return {
      gap: CONFIG.INITIAL_GAP_CHANCE + clampedRatio * (CONFIG.MAX_GAP_CHANCE - CONFIG.INITIAL_GAP_CHANCE),
      wall: CONFIG.INITIAL_WALL_CHANCE + clampedRatio * (CONFIG.MAX_WALL_CHANCE - CONFIG.INITIAL_WALL_CHANCE)
    };
  }

  /**
   * 次の地形タイプを決定
   */
  getNextTerrainType() {
    // 高台継続中
    if (this.platformCounter > 0) {
      this.platformCounter--;
      return this.platformCounter === 0 ? 'slope_down' : 'platform';
    }

    // 安全エリアは平坦のみ
    if (this.totalGroundsCreated < 15) {
      return 'flat';
    }

    // 坂を下っている途中
    if (this.lastTerrainType === 'slope_down' && this.currentHeight > 0) {
      return 'slope_down';
    }

    // ランダムで地形を決定
    const rand = Math.random();

    if (rand < CONFIG.SLOPE_CHANCE && this.lastTerrainType === 'flat') {
      // 坂道開始（上り）
      return 'slope_up';
    } else if (rand < CONFIG.SLOPE_CHANCE + CONFIG.PLATFORM_CHANCE && this.lastTerrainType === 'flat') {
      // 高台開始
      this.platformCounter = CONFIG.PLATFORM_LENGTH;
      return 'slope_up';
    }

    // 上り坂の後は高台か下り
    if (this.lastTerrainType === 'slope_up') {
      if (Math.random() < 0.6) {
        this.platformCounter = Math.floor(Math.random() * 3) + 2;
        return 'platform';
      } else {
        return 'slope_down';
      }
    }

    return 'flat';
  }

  createInitialGrounds() {
    const groundCount = Math.ceil(80 / CONFIG.GROUND_WIDTH) + 5;
    for (let i = 0; i < groundCount; i++) {
      const x = i * CONFIG.GROUND_WIDTH;
      this.createGround(x, i > 10); // 最初の10ブロックは障害物なし
    }
  }

  createGround(x, canHaveObstacles = true) {
    const chances = this.getDynamicChances();

    // 穴の判定（高台・坂道中は穴なし）
    if (canHaveObstacles && this.lastTerrainType === 'flat' && this.currentHeight === 0 &&
        !this.lastHadGap && !this.lastHadWall && Math.random() < chances.gap) {
      this.lastHadGap = true;
      this.lastHadWall = false;
      this.totalGroundsCreated++;
      return null;
    }
    this.lastHadGap = false;

    // 地形タイプを決定
    const terrainType = canHaveObstacles ? this.getNextTerrainType() : 'flat';
    this.lastTerrainType = terrainType;

    let groundY = this.currentHeight;
    let color = this.groundColorIndex % 2 === 0 ? 0x3a3a3a : 0x4a4a4a;

    // 地形に応じた高さを設定（回転なし、段差で表現）
    switch (terrainType) {
      case 'slope_up':
        this.currentHeight += CONFIG.SLOPE_HEIGHT;
        groundY = this.currentHeight;
        color = 0x5a8a5a; // 緑っぽい色（上り）
        break;
      case 'slope_down':
        this.currentHeight = Math.max(0, this.currentHeight - CONFIG.SLOPE_HEIGHT);
        groundY = this.currentHeight;
        color = 0x8a5a5a; // 赤っぽい色（下り）
        break;
      case 'platform':
        groundY = this.currentHeight;
        color = 0x5a5a8a; // 青っぽい色（高台）
        break;
      default: // flat
        groundY = this.currentHeight;
        break;
    }

    this.groundColorIndex++;
    this.totalGroundsCreated++;

    // 3Dメッシュ作成
    const geometry = new THREE.BoxGeometry(
      CONFIG.GROUND_WIDTH,
      CONFIG.GROUND_HEIGHT,
      CONFIG.GROUND_DEPTH
    );
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.2,
      roughness: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    // 地面の上面がgroundYになるように配置
    const meshY = groundY - CONFIG.GROUND_HEIGHT / 2;
    mesh.position.set(x, meshY, 0);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);

    // 物理ボディ作成
    const halfSize = [
      CONFIG.GROUND_WIDTH / 2,
      CONFIG.GROUND_HEIGHT / 2,
      CONFIG.GROUND_DEPTH / 2
    ];

    const rigidBody = this.physicsWorld.createKinematicBody([x, meshY, 0]);
    this.physicsWorld.createCollider(halfSize, rigidBody);

    const ground = {
      mesh,
      rigidBody,
      x,
      baseY: meshY,
      terrainType,
      surfaceY: groundY  // 地面の上面の高さ
    };
    this.grounds.push(ground);

    // 壁配置（平坦な場所のみ）
    if (canHaveObstacles && terrainType === 'flat' && this.currentHeight === 0) {
      this.groundsSinceLastWall++;
      if (this.groundsSinceLastWall >= CONFIG.WALL_MIN_SPACING && Math.random() < chances.wall) {
        this.createWall(x, groundY);
        this.groundsSinceLastWall = 0;
        this.lastHadWall = true;
      } else {
        this.lastHadWall = false;
      }
    }

    return ground;
  }

  createWall(x, groundY = 0) {
    const geometry = new THREE.BoxGeometry(
      CONFIG.WALL_WIDTH,
      CONFIG.WALL_HEIGHT,
      CONFIG.WALL_DEPTH
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0x330000,
      emissiveIntensity: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, groundY + CONFIG.WALL_HEIGHT / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const halfSize = [
      CONFIG.WALL_WIDTH / 2,
      CONFIG.WALL_HEIGHT / 2,
      CONFIG.WALL_DEPTH / 2
    ];
    const rigidBody = this.physicsWorld.createKinematicBody([
      x,
      groundY + CONFIG.WALL_HEIGHT / 2,
      0
    ]);
    this.physicsWorld.createCollider(halfSize, rigidBody);

    const wall = { mesh, rigidBody, x, baseY: groundY + CONFIG.WALL_HEIGHT / 2 };
    this.walls.push(wall);
    return wall;
  }

  updateGrounds(moveAmount, playerX) {
    this.grounds.forEach((ground) => {
      if (!ground.mesh) return;

      ground.x -= moveAmount;
      ground.mesh.position.x = ground.x;

      const translation = ground.rigidBody.translation();
      ground.rigidBody.setNextKinematicTranslation(
        { x: ground.x, y: translation.y, z: translation.z }
      );

      // 画面外に出た地面を右端に再配置
      if (ground.x < playerX - 25) {
        const rightmostX = this.getMaxX(this.grounds);

        // 新しい地形を生成
        const chances = this.getDynamicChances();
        const willBeGap = this.lastTerrainType === 'flat' && this.currentHeight === 0 &&
                          !this.lastHadWall && !this.lastHadGap && Math.random() < chances.gap;

        if (willBeGap) {
          ground.x = rightmostX + CONFIG.GROUND_WIDTH * 2;
          this.lastHadGap = true;
          this.lastHadWall = false;
        } else {
          ground.x = rightmostX + CONFIG.GROUND_WIDTH;

          // 地形タイプを再決定
          const terrainType = this.getNextTerrainType();
          this.lastTerrainType = terrainType;
          this.lastHadGap = false;

          let newY = this.currentHeight;
          let color = this.groundColorIndex % 2 === 0 ? 0x3a3a3a : 0x4a4a4a;

          switch (terrainType) {
            case 'slope_up':
              this.currentHeight += CONFIG.SLOPE_HEIGHT;
              newY = this.currentHeight;
              color = 0x5a8a5a;
              break;
            case 'slope_down':
              this.currentHeight = Math.max(0, this.currentHeight - CONFIG.SLOPE_HEIGHT);
              newY = this.currentHeight;
              color = 0x8a5a5a;
              break;
            case 'platform':
              newY = this.currentHeight;
              color = 0x5a5a8a;
              break;
            default:
              newY = this.currentHeight;
              break;
          }

          this.groundColorIndex++;

          // メッシュの色と位置を更新
          const meshY = newY - CONFIG.GROUND_HEIGHT / 2;
          ground.mesh.material.color.setHex(color);
          ground.mesh.position.y = meshY;
          ground.baseY = meshY;
          ground.surfaceY = newY;
          ground.terrainType = terrainType;

          // 物理ボディも更新
          ground.rigidBody.setNextKinematicTranslation({
            x: ground.x,
            y: meshY,
            z: 0
          });

          // 壁配置（surfaceYを使用）
          if (terrainType === 'flat' && this.currentHeight === 0) {
            this.groundsSinceLastWall++;
            if (this.groundsSinceLastWall >= CONFIG.WALL_MIN_SPACING && Math.random() < chances.wall) {
              this.createWall(ground.x, ground.surfaceY);
              this.groundsSinceLastWall = 0;
              this.lastHadWall = true;
            } else {
              this.lastHadWall = false;
            }
          }
        }

        ground.mesh.position.x = ground.x;
      }
    });
  }

  updateWalls(moveAmount, playerX) {
    const wallsToRemove = [];
    this.walls.forEach((wall, index) => {
      if (!wall.mesh) return;

      wall.x -= moveAmount;
      wall.mesh.position.x = wall.x;

      const translation = wall.rigidBody.translation();
      wall.rigidBody.setNextKinematicTranslation(
        { x: wall.x, y: translation.y, z: translation.z }
      );

      if (wall.x < playerX - 25) {
        this.scene.remove(wall.mesh);
        wall.mesh.geometry.dispose();
        wall.mesh.material.dispose();
        this.physicsWorld.removeRigidBody(wall.rigidBody);
        wallsToRemove.push(index);
      }
    });

    // 逆順で削除
    for (let i = wallsToRemove.length - 1; i >= 0; i--) {
      this.walls.splice(wallsToRemove[i], 1);
    }
  }

  getMaxX(group) {
    let maxX = 0;
    group.forEach((obj) => {
      if (obj && obj.x > maxX) maxX = obj.x;
    });
    return maxX;
  }

  dispose() {
    [...this.grounds, ...this.walls].forEach((obj) => {
      if (obj.mesh) {
        this.scene.remove(obj.mesh);
        obj.mesh.geometry.dispose();
        obj.mesh.material.dispose();
      }
      if (obj.rigidBody) {
        this.physicsWorld.removeRigidBody(obj.rigidBody);
      }
    });
    this.grounds = [];
    this.walls = [];
    this.currentHeight = 0;
    this.platformCounter = 0;
    this.lastTerrainType = 'flat';
  }
}
