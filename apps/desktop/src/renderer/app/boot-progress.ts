import { createBootProgress } from "../components/splash/boot-progress-model.ts";

/**
 * 启动进度单例(App 壳与开屏共享;模块加载即 renderer 里程碑到达)。
 * 上报点:App 创建 Gateway 后报 gateway 并发起 provider 探针;
 * AppShell 首个 effect 报 paint。
 */
export const bootProgress = createBootProgress();
