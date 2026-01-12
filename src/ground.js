import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * 3D地面と障害物の管理
 */
export class GroundManager3D {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.grounds = [];
    this.walls = [];
  }
  
  /**
   * 初期地面を生成
   */
  createInitialGrounds() {
    const groundCount = Math.ceil(20 / CONFIG.GROUND_WIDTH) + 3;
    for (let i = 0; i < groundCount; i++) {
      const x = i * CONFIG.GROUND_WIDTH;
      this.createGround(x, false);
    }
  }
  
  /**
   * 地面を生成
   */
  createGround(x, canHaveGap = true) {
    // ランダムで穴にするか判定
    if (canHaveGap && Math.random() < CONFIG.GAP_CHANCE) {
      return null;
    }
    
    // 3Dメッシュ作成
    const geometry = new THREE.BoxGeometry(
      CONFIG.GROUND_WIDTH,
      CONFIG.GROUND_HEIGHT,
      CONFIG.GROUND_DEPTH
    );
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4a4a4a,
      metalness: 0.1,
      roughness: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      x,
      -CONFIG.GROUND_HEIGHT / 2,
      0
    );
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    
    // 物理ボディ作成
    const halfSize = [
      CONFIG.GROUND_WIDTH / 2,
      CONFIG.GROUND_HEIGHT / 2,
      CONFIG.GROUND_DEPTH / 2
    ];
    const rigidBody = this.physicsWorld.createStaticBody([
      x,
      -CONFIG.GROUND_HEIGHT / 2,
      0
    ]);
    this.physicsWorld.createCollider(halfSize, rigidBody);
    
    const ground = { mesh, rigidBody, x };
    this.grounds.push(ground);
    
    // ランダムで壁を配置
    if (canHaveGap && Math.random() < CONFIG.WALL_CHANCE) {
      this.createWall(x);
    }
    
    return ground;
  }
  
  /**
   * 壁を生成
   */
  createWall(x) {
    // 3Dメッシュ作成
    const geometry = new THREE.BoxGeometry(
      CONFIG.WALL_WIDTH,
      CONFIG.WALL_HEIGHT,
      CONFIG.WALL_DEPTH
    );
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff4444,
      metalness: 0.2,
      roughness: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      x,
      CONFIG.WALL_HEIGHT / 2,
      0
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    
    // 物理ボディ作成
    const halfSize = [
      CONFIG.WALL_WIDTH / 2,
      CONFIG.WALL_HEIGHT / 2,
      CONFIG.WALL_DEPTH / 2
    ];
    const rigidBody = this.physicsWorld.createStaticBody([
      x,
      CONFIG.WALL_HEIGHT / 2,
      0
    ]);
    this.physicsWorld.createCollider(halfSize, rigidBody);
    
    const wall = { mesh, rigidBody, x };
    this.walls.push(wall);
    
    return wall;
  }
  
  /**
   * 地面を更新（移動とリスポーン）
   */
  updateGrounds(moveAmount, playerX) {
    this.grounds.forEach((ground) => {
      if (!ground.mesh) return;
      
      ground.x -= moveAmount;
      ground.mesh.position.x = ground.x;
      
      // 物理ボディも更新
      const translation = ground.rigidBody.translation();
      ground.rigidBody.setTranslation(
        { x: ground.x, y: translation.y, z: translation.z },
        true
      );
      
      // 画面外に出た地面を右端に再配置
      if (ground.x < playerX - 20) {
        const rightmostX = this.getMaxX(this.grounds);
        
        if (Math.random() < CONFIG.GAP_CHANCE) {
          ground.x = rightmostX + CONFIG.GROUND_WIDTH * 2;
        } else {
          ground.x = rightmostX + CONFIG.GROUND_WIDTH;
          
          if (Math.random() < CONFIG.WALL_CHANCE) {
            this.createWall(ground.x);
          }
        }
        
        ground.mesh.position.x = ground.x;
        const trans = ground.rigidBody.translation();
        ground.rigidBody.setTranslation(
          { x: ground.x, y: trans.y, z: trans.z },
          true
        );
      }
    });
  }
  
  /**
   * 壁を更新
   */
  updateWalls(moveAmount, playerX) {
    this.walls.forEach((wall) => {
      if (!wall.mesh) return;
      
      wall.x -= moveAmount;
      wall.mesh.position.x = wall.x;
      
      // 物理ボディも更新
      const translation = wall.rigidBody.translation();
      wall.rigidBody.setTranslation(
        { x: wall.x, y: translation.y, z: translation.z },
        true
      );
      
      // 画面外に出た壁を削除
      if (wall.x < playerX - 20) {
        this.scene.remove(wall.mesh);
        wall.mesh.geometry.dispose();
        wall.mesh.material.dispose();
        this.physicsWorld.removeRigidBody(wall.rigidBody);
        const index = this.walls.indexOf(wall);
        if (index > -1) {
          this.walls.splice(index, 1);
        }
      }
    });
  }
  
  /**
   * グループ内で最も右にあるオブジェクトのX座標を取得
   */
  getMaxX(group) {
    let maxX = 0;
    group.forEach((obj) => {
      if (obj && obj.x > maxX) maxX = obj.x;
    });
    return maxX;
  }
  
  /**
   * クリーンアップ
   */
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
  }
}
