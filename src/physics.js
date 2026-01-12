import * as RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from './config.js';

/**
 * 物理エンジン（Rapier）の管理
 */
export class PhysicsWorld {
  constructor() {
    this.world = null;
    this.eventQueue = null;
  }
  
  /**
   * 物理ワールドを初期化
   */
  async init() {
    try {
      // rapier3d-compatの初期化
      if (RAPIER.initWasm) {
        await RAPIER.initWasm();
      } else if (RAPIER.init) {
        await RAPIER.init();
      }
      // 初期化が不要な場合もある
      
      const gravity = { x: 0.0, y: -CONFIG.GRAVITY, z: 0.0 };
      this.world = new RAPIER.World(gravity);
      this.eventQueue = new RAPIER.EventQueue(true);
    } catch (error) {
      console.error('Physics initialization error:', error);
      throw error;
    }
  }
  
  /**
   * 物理ステップを更新
   */
  step(deltaTime) {
    if (this.world) {
      // Rapierのバージョン差分で step のシグネチャが異なることがあるため安全に呼ぶ
      try {
        this.world.step(this.eventQueue);
      } catch (e) {
        this.world.step();
      }
    }
  }
  
  /**
   * 動的RigidBodyを作成
   */
  createDynamicBody(position, quaternion) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position[0], position[1], position[2]);
    if (quaternion) {
      bodyDesc.setRotation(quaternion);
    }
    return this.world.createRigidBody(bodyDesc);
  }
  
  /**
   * 静的RigidBodyを作成
   */
  createStaticBody(position, quaternion) {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(position[0], position[1], position[2]);
    if (quaternion) {
      bodyDesc.setRotation(quaternion);
    }
    return this.world.createRigidBody(bodyDesc);
  }
  
  /**
   * Colliderを作成
   */
  createCollider(shape, body, translation, rotation) {
    const colliderDesc = RAPIER.ColliderDesc.cuboid(shape[0], shape[1], shape[2]);
    if (translation) {
      colliderDesc.setTranslation(translation[0], translation[1], translation[2]);
    }
    if (rotation) {
      colliderDesc.setRotation(rotation);
    }
    return this.world.createCollider(colliderDesc, body);
  }
  
  /**
   * RigidBodyを削除
   */
  removeRigidBody(body) {
    this.world.removeRigidBody(body);
  }
}
