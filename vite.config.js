import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [wasm()],
  server: {
    port: 3000,
    open: true,
    // localhost(IPv6 ::1) で問題が出る環境向けに IPv4 へ固定
    host: '127.0.0.1',
  },
  optimizeDeps: {
    // rapier3d-compat は内部で wasm を扱うため、事前バンドルを避ける
    exclude: ['@dimforge/rapier3d-compat'],
  },
});
