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
    return true;
  }
  
  /**
   * 地面に着地した時の処理
   */
  onGroundCollision() {
    this.jumpCount = 0;
  }
  
  /**
   * 右方向への自動移動
   */
  update(deltaTime) {
    const linvel = this.rigidBody.linvel();
    this.rigidBody.setLinvel({
      x: this.currentSpeed,
      y: linvel.y,
      z: linvel.z
    }, true);

    this.syncMeshToPhysics();

    // 着地判定（Y速度が小さく、地面に近い場合）
    const position = this.rigidBody.translation();
    const groundLevel = CONFIG.PLAYER_SIZE / 2;
    const isOnGround = position.y <= groundLevel + 0.1 && Math.abs(linvel.y) < 0.5;

    if (isOnGround && this.wasInAir) {
      this.onGroundCollision();
    }
    this.wasInAir = !isOnGround;
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
