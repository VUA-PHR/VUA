import type { ComponentType } from "react";

/**
 * UI 变体动态发现(019 批 D D-2,UI-05/AC-12):
 * 森林绿 UI 源码位于 gitignored 本地路径 `src/ui-variants/forest/`(019 红线:
 * 永不进入 git;check:forest-leak 门守卫)。接线层用 Vite `import.meta.glob`
 * 在构建期静态发现该目录下的入口模块——干净检出(目录不存在)时 glob 解析为
 * 空表,构建恒安全;本机放置骨架后无需改接线即被发现。
 *
 * 诚实纪律(UI-08):发现结果只有两种事实——absent(本构建无此变体,如实
 * 呈现不可用)与 present(入口存在,尝试加载;加载失败如实呈现失败态)。
 * 不猜测、不用占位内容顶替、不在 absent 时伪装可用。
 *
 * 入口约定:唯一的变体入口是目录下的 `root.tsx`,其默认导出名为
 * `ForestUiRoot` 的组件。目录里有其他文件但无 root.tsx = 变体未就绪,
 * 按 absent 处理——不挑选别的文件充当入口。
 */

/** 变体根组件契约:接线层与 gitignored 骨架之间的入库边界。 */
export type ForestUiRootProps = {
  /** 迁移退路(UI-05/批 D 完成条件):返回现有 UI 的入口,由共享容器提供 */
  onBackToCurrent: () => void;
};

export type ForestVariantDiscovery =
  | { status: "absent" }
  | { status: "present"; load: () => Promise<{ ForestUiRoot: ComponentType<ForestUiRootProps> }> };

/** 变体入口的约定路径(import.meta.glob 键,相对本模块) */
const entryPath = "../../ui-variants/forest/root.tsx";

/**
 * 从构建期 glob 结果解析变体发现状态(纯函数;glob 表注入,测试覆盖
 * absent/present/未就绪三态)。present 的 load 透传原始动态 import,
 * 本函数不吞加载错误。
 */
export function resolveForestVariant(
  entries: Record<string, () => Promise<unknown>>,
): ForestVariantDiscovery {
  const load = entries[entryPath];
  if (!load) return { status: "absent" };
  return {
    status: "present",
    load: () => load() as Promise<{ ForestUiRoot: ComponentType<ForestUiRootProps> }>,
  };
}

/**
 * 构建期发现表:Vite 静态分析此调用;`src/ui-variants/forest/root.tsx`
 * 不存在时(干净检出)编译为空对象,构建与类型检查均安全。
 */
export const forestVariantEntries = import.meta.glob(
  "../../ui-variants/forest/root.tsx",
) as Record<string, () => Promise<unknown>>;
