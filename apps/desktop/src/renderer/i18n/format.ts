/**
 * 具名参数插值(i18n 预备纪律:禁止字符串拼接造句)。
 * "还差 {count} 项准备" + { count: 2 } → "还差 2 项准备"。
 * 未提供的参数保留原占位符,让漏传在开发期直接可见。
 */
export function format(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (raw, name: string) =>
    params[name] !== undefined ? String(params[name]) : raw,
  );
}
