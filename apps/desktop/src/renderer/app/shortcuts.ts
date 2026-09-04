/**
 * 快捷键全局注册表(C-EFFICIENCY,ui-ux §6.1):
 *
 * 全局唯一(任何模块同义):
 * - Ctrl/Cmd + P:命令面板开关;
 * - Esc:取消或关闭临时界面(浮层、拖拽取消——各组件本地实现,不入全局监听);
 * - Tab / 方向键 / Enter:遵循 Windows 惯例与 APG 键盘模式(原生控件语义)。
 *
 * 模块本地(含义不跨模块漂移):
 * - Recipe 图谱:方向键 = 移动选中节点(画布获焦时);点击/Enter = 选中;
 * - 车间回放:播放/暂停/重播只用可见按钮,不占键;
 * - 列表/网格:方向键在同组项目间移动(原生列表语义)。
 *
 * 冲突裁决:新快捷键进场必须先查本表;同键不同义即冲突,后到者改键。
 * 全局键位只在本文件注册,模块键位只允许在对应 feature 内实现并在此登记。
 */

/** Ctrl/Cmd + P(macOS 兼容 Cmd);不与 Shift/Alt 组合 */
export function isPaletteToggle(event: KeyboardEvent): boolean {
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.shiftKey &&
    !event.altKey &&
    event.key.toLowerCase() === "p"
  );
}
