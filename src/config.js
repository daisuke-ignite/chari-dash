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
  
  // 障害物
  GAP_CHANCE: 0.25,     // 穴が出現する確率
  GAP_WIDTH: 1.5,       // 穴の幅（m）
  WALL_CHANCE: 0.3,      // 壁が出現する確率
  WALL_WIDTH: 0.5,      // 壁の幅（m）
  WALL_HEIGHT: 1.5,     // 壁の高さ（m）
  WALL_DEPTH: 0.5,      // 壁の奥行き（m）
  
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
