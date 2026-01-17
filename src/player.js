import * as THREE from 'three';
import { CONFIG, STATE } from './config.js';

/**
 * 3Dプレイヤー
 */
export class Player3D {
  constructor(scene, physicsWorld, position) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    
    // 3Dメッシュ作成
    const geometry = new THREE.BoxGeometry(
      CONFIG.PLAYER_SIZE,
      CONFIG.PLAYER_SIZE,
      CONFIG.PLAYER_SIZE
    );
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.7
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(...position);
    scene.add(this.mesh);
    
    // 物理ボディ作成
    const halfSize = CONFIG.PLAYER_SIZE / 2;
    this.rigidBody = physicsWorld.createDynamicBody(position);
    const collider = physicsWorld.createCollider(
      [halfSize, halfSize, halfSize],
      this.rigidBody
    );
    
    // メッシュと物理ボディを同期
    this.syncMeshToPhysics();
    
    this.jumpCount = 0;
    this.currentSpeed = CONFIG.GROUND_SPEED;
    this.wasInAir = false;

    // スクワッシュ＆ストレッチ用
    this.targetScaleY = 1.0;
    this.currentScaleY = 1.0;
    this.scaleSpeed = 10; // 1秒で10倍変化

    // 着地時コールバック
    this.onLand = null;
  }
  
  /**
   * メッシュを物理ボディの位置に同期
   */
  syncMeshToPhysics() {
    const position = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();
    
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
  
  /**
   * ジャンプを試行
   */
  tryJump() {
    if (this.jumpCount >= CONFIG.MAX_JUMPS) return false;

    const linvel = this.rigidBody.linvel();
    this.rigidBody.setLinvel({ x: linvel.x, y: CONFIG.JUMP_VELOCITY, z: linvel.z }, true);
    this.jumpCount++;

    // ジャンプ時：縦に伸びる
    this.targetScaleY = 1.3;

    return true;
  }
  
  /**
   * 地面に着地した時の処理
   */
  onGroundCollision() {
    this.jumpCount = 0;

    // 着地時：潰れる
    this.targetScaleY = 0.6;

    // 着地コールバック呼び出し
    if (this.onLand) {
      this.onLand();
    }
  }
  
  /**
   * 右方向への自動移動
   */
  update(deltaTime) {
    const linvel = this.rigidBody.linvel();
    // X方向に自動移動、Z方向は固定（斜め移動防止）
    this.rigidBody.setLinvel({
      x: this.currentSpeed,
      y: linvel.y,
      z: 0
    }, true);

    // Z位置も強制的に0に固定
    const pos = this.rigidBody.translation();
    if (Math.abs(pos.z) > 0.01) {
      this.rigidBody.setTranslation({ x: pos.x, y: pos.y, z: 0 }, true);
    }

    this.syncMeshToPhysics();

    // 着地判定：レイキャストで地面を検出
    const position = this.rigidBody.translation();
    const halfSize = CONFIG.PLAYER_SIZE / 2;

    // プレイヤー中心から下方向へレイキャスト
    const rayOrigin = { x: position.x, y: position.y, z: position.z };
    const hit = this.physicsWorld.raycastDown(rayOrigin, halfSize + 0.2);

    // 地面に接触しているか（レイキャスト距離がプレイヤーの半分より小さく、下方向速度が小さい）
    const isOnGround = hit && hit.distance <= halfSize + 0.15 && linvel.y <= 0.5;

    if (isOnGround && this.wasInAir) {
      this.onGroundCollision();
    }
    this.wasInAir = !isOnGround;

    // スクワッシュ＆ストレッチのアニメーション
    this.updateSquashStretch(deltaTime);
  }

  /**
   * スクワッシュ＆ストレッチのアニメーション更新
   */
  updateSquashStretch(deltaTime) {
    // 目標スケールに向かって補間
    const diff = this.targetScaleY - this.currentScaleY;
    this.currentScaleY += diff * this.scaleSpeed * deltaTime;

    // 元のサイズに戻す
    if (Math.abs(this.targetScaleY - 1.0) < 0.01) {
      // 既に通常状態
    } else if (Math.abs(this.currentScaleY - this.targetScaleY) < 0.05) {
      // 目標に到達したら元に戻す
      this.targetScaleY = 1.0;
    }

    // メッシュのスケールを更新（体積保存：Y変化分をXZで逆補正）
    const invScale = 1.0 / Math.sqrt(this.currentScaleY);
    this.mesh.scale.set(invScale, this.currentScaleY, invScale);
  }
  
  /**
   * 速度を設定
   */
  setSpeed(speed) {
    this.currentSpeed = speed;
  }
  
  /**
   * ゲームオーバー時の処理
   */
  stop() {
    this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  }
  
  /**
   * 壁との衝突判定
   */
  checkWallCollision(walls) {
    const pos = this.rigidBody.translation();
    const halfSize = CONFIG.PLAYER_SIZE / 2;

    for (const wall of walls) {
      if (!wall.mesh) continue;

      // mesh.position.xを使用（リアルタイムの壁位置）
      const wallX = wall.mesh.position.x;
      const wallLeft = wallX - CONFIG.WALL_WIDTH / 2;
      const wallRight = wallX + CONFIG.WALL_WIDTH / 2;
      const wallBottom = 0;
      const wallTop = CONFIG.WALL_HEIGHT;

      const playerLeft = pos.x - halfSize;
      const playerRight = pos.x + halfSize;
      const playerBottom = pos.y - halfSize;
      const playerTop = pos.y + halfSize;

      // X軸とY軸の両方で重なっているか
      const overlapX = playerRight > wallLeft && playerLeft < wallRight;
      const overlapY = playerTop > wallBottom && playerBottom < wallTop;

      if (overlapX && overlapY) {
        return true;
      }
    }
    return false;
  }

  /**
   * ゲームオーバー判定
   */
  isGameOver() {
    const position = this.rigidBody.translation();
    return position.y < -5; // 画面下に落ちた
  }
  
  /**
   * 位置を取得（カメラ用）
   */
  get position() {
    const pos = this.rigidBody.translation();
    return { x: pos.x, y: pos.y, z: pos.z };
  }
  
  /**
   * クリーンアップ
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.physicsWorld.removeRigidBody(this.rigidBody);
  }
}
