import { CONFIG, STATE } from './config.js';
import { GameScene } from './scene.js';
import { PhysicsWorld } from './physics.js';
import { CameraController } from './camera.js';
import { Player3D } from './player.js';
import { GroundManager3D } from './ground.js';

/**
 * メインゲームクラス
 */
export class Game {
  constructor(container) {
    this.container = container;
    this.gameScene = null;
    this.physicsWorld = null;
    this.cameraController = null;
    this.player = null;
    this.groundManager = null;
    
    this.gameState = STATE.PLAYING;
    this.score = 0;
    this.currentSpeed = CONFIG.GROUND_SPEED;
    this.elapsedTime = 0;
    
    this.spaceKeyPressed = false;
    this.lastTime = 0;
    this.animationId = null;
  }
  
  /**
   * ゲームを初期化
   */
  async init() {
    try {
      console.log('Initializing game...');
      
      // Three.jsシーン初期化
      console.log('Initializing Three.js scene...');
      this.gameScene = new GameScene(this.container);
      const { scene, camera, renderer } = this.gameScene.init();
      
      // 物理エンジン初期化
      console.log('Initializing physics engine...');
      this.physicsWorld = new PhysicsWorld();
      await this.physicsWorld.init();
      console.log('Physics engine initialized');
    
    // カメラコントローラー初期化
    this.cameraController = new CameraController(camera);
    
    // 地面マネージャー初期化
    this.groundManager = new GroundManager3D(scene, this.physicsWorld);
    this.groundManager.createInitialGrounds();
    
    // プレイヤー作成
    this.player = new Player3D(scene, this.physicsWorld, [0, 2, 0]);
    this.cameraController.setTarget(this.player);
    
    // UI作成
    this.createUI();
    
    // 入力設定
    this.setupInput();
    
    // リサイズ処理
    window.addEventListener('resize', () => {
      this.gameScene.onResize(window.innerWidth, window.innerHeight);
    });
    
      // ゲームループ開始
      console.log('Starting game loop...');
      this.start();
      console.log('Game initialized successfully');
    } catch (error) {
      console.error('Game initialization error:', error);
      this.container.innerHTML = `
        <div style="color: white; padding: 20px; font-family: Arial;">
          <h2>エラーが発生しました</h2>
          <p>${error.message}</p>
          <pre style="background: rgba(0,0,0,0.5); padding: 10px; overflow: auto;">${error.stack}</pre>
        </div>
      `;
      throw error;
    }
  }
  
  /**
   * UI作成
   */
  createUI() {
    // スコア表示
    this.scoreElement = document.createElement('div');
    this.scoreElement.style.position = 'absolute';
    this.scoreElement.style.top = '16px';
    this.scoreElement.style.left = '16px';
    this.scoreElement.style.color = '#fff';
    this.scoreElement.style.fontSize = '24px';
    this.scoreElement.style.fontFamily = 'Arial';
    this.scoreElement.style.fontWeight = 'bold';
    this.scoreElement.textContent = 'Score: 0';
    this.container.appendChild(this.scoreElement);
    
    // ゲームオーバー表示
    this.gameOverElement = document.createElement('div');
    this.gameOverElement.style.position = 'absolute';
    this.gameOverElement.style.top = '50%';
    this.gameOverElement.style.left = '50%';
    this.gameOverElement.style.transform = 'translate(-50%, -50%)';
    this.gameOverElement.style.color = '#fff';
    this.gameOverElement.style.fontSize = '32px';
    this.gameOverElement.style.fontFamily = 'Arial';
    this.gameOverElement.style.textAlign = 'center';
    this.gameOverElement.style.display = 'none';
    this.container.appendChild(this.gameOverElement);
  }
  
  /**
   * 入力設定
   */
  setupInput() {
    // キーボード入力
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.gameState === STATE.GAMEOVER) {
          this.restart();
        } else {
          this.spaceKeyPressed = true;
        }
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.spaceKeyPressed = false;
      }
    });
    
    // マウス/タッチ入力
    this.container.addEventListener('click', () => {
      if (this.gameState === STATE.GAMEOVER) {
        this.restart();
      } else {
        this.player.tryJump();
      }
    });
  }
  
  /**
   * ゲームループ開始
   */
  start() {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  /**
   * ゲームループ
   */
  gameLoop(currentTime) {
    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));

    try {
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      if (this.gameState === STATE.GAMEOVER) {
        // ゲームオーバー中も描画だけは続ける（真っ暗回避）
        this.gameScene.render();
        return;
      }

      // 物理ステップ更新
      this.physicsWorld.step(deltaTime);

      // プレイヤー更新
      this.player.update(deltaTime);

      // 地面・壁更新
      const moveAmount = this.currentSpeed * deltaTime;
      this.groundManager.updateGrounds(moveAmount, this.player.position.x);
      this.groundManager.updateWalls(moveAmount, this.player.position.x);

      // カメラ更新
      this.cameraController.update();

      // スコア更新
      this.score += this.currentSpeed * deltaTime;
      this.scoreElement.textContent = 'Score: ' + Math.floor(this.score);

      // 速度アップ
      this.elapsedTime += deltaTime * 1000;
      if (this.elapsedTime > 5000) {
        this.elapsedTime = 0;
        this.currentSpeed = Math.min(
          this.currentSpeed + CONFIG.SPEED_INCREMENT,
          CONFIG.MAX_SPEED
        );
        this.player.setSpeed(this.currentSpeed);
      }

      // ジャンプ入力（押しっぱなし防止）
      if (this.spaceKeyPressed) {
        this.player.tryJump();
        this.spaceKeyPressed = false;
      }

      // ゲームオーバー判定
      if (this.player.isGameOver()) {
        this.triggerGameOver();
      }

      // レンダリング
      this.gameScene.render();
    } catch (error) {
      console.error('Runtime error in gameLoop:', error);
      this.gameState = STATE.GAMEOVER;
      this.gameOverElement.textContent =
        'RUNTIME ERROR\n\n' +
        (error && (error.stack || error.message) ? (error.stack || error.message) : String(error));
      this.gameOverElement.style.display = 'block';
    }
  }
  
  /**
   * ゲームオーバー処理
   */
  triggerGameOver() {
    this.gameState = STATE.GAMEOVER;
    this.player.stop();
    
    this.gameOverElement.textContent = 
      'GAME OVER\n\n' +
      'Score: ' + Math.floor(this.score) + '\n\n' +
      'SPACE / Click to Retry';
    this.gameOverElement.style.display = 'block';
  }
  
  /**
   * リスタート
   */
  restart() {
    // アニメーション停止
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // リソースクリーンアップ
    this.player.dispose();
    this.groundManager.dispose();
    
    // 状態リセット
    this.gameState = STATE.PLAYING;
    this.score = 0;
    this.currentSpeed = CONFIG.GROUND_SPEED;
    this.elapsedTime = 0;
    this.gameOverElement.style.display = 'none';
    
    // 再初期化
    this.init();
  }
}
