import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * カメラ制御
 */
export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.target = null; // 追従対象（プレイヤー）
    this.offset = new THREE.Vector3(
      0,
      CONFIG.CAMERA_HEIGHT,
      CONFIG.CAMERA_DISTANCE
    );
  }
  
  /**
   * 追従対象を設定
   */
  setTarget(target) {
    this.target = target;
  }
  
  /**
   * カメラを更新
   */
  update() {
    if (!this.target) return;
    
    // プレイヤーの位置を取得
    const targetPosition = this.target.position || this.target;
    
    // カメラの位置を計算
    const cameraPosition = new THREE.Vector3(
      targetPosition.x + this.offset.x,
      targetPosition.y + this.offset.y,
      targetPosition.z + this.offset.z
    );
    
    // カメラを移動
    this.camera.position.copy(cameraPosition);
    
    // プレイヤーを見る
    this.camera.lookAt(
      targetPosition.x,
      targetPosition.y,
      targetPosition.z
    );
  }
}
