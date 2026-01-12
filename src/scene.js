import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Three.jsシーンの管理
 */
export class GameScene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
  }
  
  /**
   * シーンを初期化
   */
  init() {
    // シーン作成
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    
    // カメラ作成（後でcamera.jsで設定）
    this.camera = new THREE.PerspectiveCamera(
      75,
      CONFIG.WIDTH / CONFIG.HEIGHT,
      0.1,
      1000
    );
    
    // レンダラー作成
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(CONFIG.WIDTH, CONFIG.HEIGHT);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // ライティング設定
    this.setupLighting();
    
    return {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer
    };
  }
  
  /**
   * ライティング設定
   */
  setupLighting() {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // 指向性ライト（太陽光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
  }
  
  /**
   * レンダリング
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  /**
   * リサイズ処理
   */
  onResize(width, height) {
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }
}
