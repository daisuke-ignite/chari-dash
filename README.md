# チャリ走 3D

Three.js + Rapier.jsを使用した3Dエンドレスランナーゲーム

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

## 操作方法

- **Spaceキー / クリック**: ジャンプ（二段ジャンプ可能）
- **ゲームオーバー時**: Spaceキー / クリックでリトライ

## 技術スタック

- **Three.js**: 3Dレンダリング
- **Rapier.js**: 3D物理エンジン
- **Vite**: ビルドツール

## ファイル構造

```
src/
├── config.js      # ゲーム設定定数
├── scene.js       # Three.jsシーン管理
├── physics.js     # Rapier物理エンジン
├── player.js      # 3Dプレイヤー
├── ground.js      # 3D地面・障害物
├── camera.js      # カメラ制御
└── game.js        # メインゲームループ
```

## ビルド

```bash
npm run build
```

## プレビュー

```bash
npm run preview
```
