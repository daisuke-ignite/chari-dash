// ゲーム設定定数（3D版）
export const CONFIG = {
  // 画面
  WIDTH: 800,
  HEIGHT: 400,
  
  // 物理（3D用に調整）
  GRAVITY: 9.81,        // 重力（m/s²）- Rapierは実世界単位を使用
  JUMP_VELOCITY: 8,     // ジャンプ初速（m/s）
  
  // ゲーム進行
  GROUND_SPEED: 5,      // 地面の初期移動速度（m/s）
  SPEED_INCREMENT: 0.5, // 速度増加量
  MAX_SPEED: 12,        // 速度上限
  
  // サイズ（3D用、メートル単位）
  PLAYER_SIZE: 0.5,     // プレイヤーのサイズ（m）
  GROUND_HEIGHT: 0.5,   // 地面の高さ（m）
  GROUND_WIDTH: 2,      // 地面1ブロックの幅（m）
  GROUND_DEPTH: 10,     // 地面の奥行き（m）
  
  // 障害物（動的難易度）
  INITIAL_GAP_CHANCE: 0.05,   // 穴の初期出現確率
  MAX_GAP_CHANCE: 0.12,       // 穴の最大出現確率
  INITIAL_WALL_CHANCE: 0.06,  // 壁の初期出現確率
  MAX_WALL_CHANCE: 0.12,      // 壁の最大出現確率
  GAP_WIDTH: 1.5,             // 穴の幅（m）
  WALL_WIDTH: 0.5,            // 壁の幅（m）
  WALL_HEIGHT: 0.8,           // 壁の高さ（m）- ジャンプで越えやすく
  WALL_DEPTH: 0.5,            // 壁の奥行き（m）
  WALL_MIN_SPACING: 5,        // 壁の最小間隔（地面ブロック数）

  // 高低差のある地形
  SLOPE_CHANCE: 0.15,         // 坂道の出現確率
  PLATFORM_CHANCE: 0.10,      // 高台の出現確率
  SLOPE_HEIGHT: 1.5,          // 坂の高さ（m）
  PLATFORM_HEIGHT: 2.0,       // 高台の高さ（m）
  PLATFORM_LENGTH: 4,         // 高台の長さ（ブロック数）
  
  // ジャンプ
  MAX_JUMPS: 2,         // 二段ジャンプ
  
  // カメラ
  CAMERA_DISTANCE: 8,   // カメラとプレイヤーの距離
  CAMERA_HEIGHT: 3,     // カメラの高さ
  CAMERA_ANGLE: -0.3,   // カメラの角度（ラジアン）
};

// ゲーム状態
export const STATE = {
  PLAYING: 'playing',
  GAMEOVER: 'gameover'
};
