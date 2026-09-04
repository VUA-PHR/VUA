import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "./",
  // @vua/contracts 以 CJS dist 经 pnpm link 进入 workspace:vite 默认不预构建链接包,
  // 浏览器按 ESM 解析 CJS 时命名导出全部丢失(renderer 首帧崩溃、黑屏)。
  // 强制预构建做一次 CJS→ESM 互操作。production build 由 rolldown 处理,不受影响。
  optimizeDeps: { include: ["@vua/contracts"] },
  build: { outDir: "dist/renderer", emptyOutDir: true },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
