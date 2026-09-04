/**
 * 命令面板模型(C-EFFICIENCY,纯函数可测):
 * - 命令 = 页面跳转 + 全局动作,统一为带分组的 CommandItem;
 * - 过滤:大小写不敏感包含匹配;前缀命中优先于中间命中;
 * - 键盘导航光标在过滤结果内循环;空结果不产生可执行项。
 */

export type CommandGroup = "pages" | "actions";

export interface CommandItem {
  readonly id: string;
  readonly group: CommandGroup;
  /** 展示名(页面名或动作名,来自 strings) */
  readonly label: string;
  /** 额外匹配词(如英文别名、快捷键提示),不参与展示 */
  readonly keywords?: string;
  run(): void;
}

/** 过滤与排序:空前缀命中优先,其余保持注册序 */
export function filterCommands(
  commands: readonly CommandItem[],
  query: string,
): CommandItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...commands];
  const starts: CommandItem[] = [];
  const contains: CommandItem[] = [];
  for (const command of commands) {
    const haystacks = [command.label, command.keywords ?? ""];
    if (haystacks.some((text) => text.toLowerCase().startsWith(q))) {
      starts.push(command);
    } else if (haystacks.some((text) => text.toLowerCase().includes(q))) {
      contains.push(command);
    }
  }
  return [...starts, ...contains];
}

/** 光标循环:空列表恒 0;越界先收敛到末项,再按 delta 循环 */
export function moveCursor(index: number, delta: number, length: number): number {
  if (length === 0) return 0;
  const clamped = Math.min(Math.max(index, 0), length - 1);
  return (clamped + delta + length) % length;
}
