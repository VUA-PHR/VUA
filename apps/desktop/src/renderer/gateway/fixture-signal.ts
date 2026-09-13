/**
 * DEV fixture 面信号入口(实现见 ./signal.ts):
 * 本模块只服务 fixture-gateway / fixture-acquire / fixture-production
 * 等 DEV 夹具面;共享容器层(生产 store)与 gateway/index.ts 的导出源
 * 是 ./signal.ts(D-5 回归走查更正:此前本文件头自称「仅 DEV 可达」但
 * 生产容器层经 index.ts 同样引用本实现,命名与事实漂移——实现提入
 * signal.ts 后本文件恢复名副其实,夹具数据守卫仍按载荷指纹照常生效)。
 */
export { createSignal } from "./signal.ts";
