import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * カメラ制御
 */
export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.target = null; // 追従対象（プレイヤー）
    // カメラ位置オフセット（横から見下ろす視点）
    this.offset = new THREE.Vector3(
      0,   // プレイヤーと同じX位置
      5,   // 上から
      15   // 手前から
    );

    // 視点の前方オフセット（コースの先を見る）
    this.lookAheadOffset = 10;

    // FOV演出用
    this.baseFov = 60;
    this.maxFov = 75;
    this.currentFov = this.baseFov;
    this.targetFov = this.baseFov;

    // シェイク演出用
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
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
  update(deltaTime = 0.016) {
    if (!this.target) return;

    // プレイヤーの位置を取得
    const targetPosition = this.target.position || this.target;

    // カメラの位置を計算
    let cameraPosition = new THREE.Vector3(
      targetPosition.x + this.offset.x,
      targetPosition.y + this.offset.y,
      targetPosition.z + this.offset.z
    );

    // シェイク演出
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      const shakeAmount = this.shakeIntensity * (this.shakeTimer / this.shakeDuration);
      cameraPosition.y += (Math.random() - 0.5) * 2 * shakeAmount;
      cameraPosition.x += (Math.random() - 0.5) * 2 * shakeAmount * 0.5;
    }

    // カメラを移動
    this.camera.position.copy(cameraPosition);

    // プレイヤーの前方を見る（コースの先が見える）
    this.camera.lookAt(
      targetPosition.x + this.lookAheadOffset,
      targetPosition.y,
      targetPosition.z
    );

    // FOVアニメーション
    this.currentFov += (this.targetFov - this.currentFov) * 5 * deltaTime;
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 速度に応じてFOVを更新
   */
  setSpeedRatio(ratio) {
    // 0～1の範囲でFOVを変化
    this.targetFov = this.baseFov + (this.maxFov - this.baseFov) * ratio;
  }

  /**
   * カメラシェイクを開始
   */
  shake(intensity = 0.1, duration = 0.2) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }
}
