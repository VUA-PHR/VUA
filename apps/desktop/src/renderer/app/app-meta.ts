/**
 * 应用元数据常量(数据,非文案):版本号与仓库地址的唯一代码来源。
 * version 与 apps/desktop/package.json 保持同步,发布流程负责核对。
 * repoUrl 指向旧仓库公开归档;新仓库 GitHub remote 按迁移台账在
 * 旧仓切只读后才配置,届时同步更新此处。
 */
export const appMeta = {
  name: "vua-desktop",
  version: "0.4.1",
  repoUrl: "https://github.com/Aran52/VRC_Ultra_assistant",
} as const;
