# チャリ走 3D 開発計画（Three.js + Rapier）

このリポジトリは **Three.js + Rapier.js** を使った 3D エンドレスランナーです。
実装が進んだため、過去の「2Dシンプル横スクロール」前提の計画から、現状に合わせた計画・メモに更新します。

---

## 現状（実装済み）

- **操作**: Spaceキー / クリックでジャンプ（`CONFIG.MAX_JUMPS` 回まで）
- **スコア**: 進行距離ベースで加算
- **速度**: 一定間隔で加速（`CONFIG.SPEED_INCREMENT` / `CONFIG.MAX_SPEED`）
- **地形**: 地面タイルを無限生成（ギャップあり）
- **障害物**: 壁をランダム生成（物理的に衝突）
- **ゲームオーバー**: 画面下（Y < -5）に落下
- **リトライ**: Space / クリック

---

## 技術スタック

- **Three.js**: 描画
- **Rapier (`@dimforge/rapier3d-compat`)**: 物理
- **Vite**: 開発・ビルド
- **`vite-plugin-wasm`**: Rapier WASM の取り回し

---

## ファイル構造（現行）

```
src/
├── config.js      # ゲーム設定定数（速度/重力/確率など）
├── scene.js       # Three.js シーン構築（renderer/camera/light）
├── physics.js     # Rapier ワールド初期化・ボディ生成ヘルパ
├── player.js      # プレイヤー（mesh + rigidbody）
├── ground.js      # 地面・壁（kinematic body で移動/再生成）
├── camera.js      # カメラ追従
└── game.js        # メインループ、UI、入力、状態管理
```

---

## チューニング指針（よく触る設定）

`src/config.js` の主なパラメータは以下の役割です。

- **操作感**
  - `GRAVITY`: 落下の速さ
  - `JUMP_VELOCITY`: ジャンプ初速
  - `MAX_JUMPS`: 多段ジャンプ回数
- **難易度**
  - `GROUND_SPEED`: 初期速度
  - `SPEED_INCREMENT`: 加速幅
  - `MAX_SPEED`: 最大速度
  - `GAP_CHANCE`: 穴の確率
  - `WALL_CHANCE`: 壁の確率
- **見た目（スケール感）**
  - `PLAYER_SIZE`
  - `GROUND_WIDTH/HEIGHT/DEPTH`
  - `WALL_WIDTH/HEIGHT/DEPTH`

---

## 次やること（TODO）

- [ ] **壁衝突のゲームオーバー条件**を入れるか決める（現状は落下のみで終了）
- [ ] **接地判定の精度改善**（現在は位置とY速度で擬似判定）
- [ ] **リトライ時のイベント解除/再登録の整理**（複数 init を安全に）
- [ ] **スマホ操作**: タップ長押し/スワイプ等の検討
- [ ] **難易度曲線**: 加速間隔/ギャップ&壁確率の時間変化
- [ ] **視認性**: 影/ライト/フォグ/背景の改善（軽量のまま）

---

## デバッグメモ

- Rapier 初期化は `await RAPIER.init()` が必須（`src/physics.js`）。
- Rapier のバージョン差分で `world.step()` の呼び方が変わることがあるので、
  現状は例外を吸収して安全に呼ぶ実装にしている。

