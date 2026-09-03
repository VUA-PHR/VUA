# VUA 桌面应用（@vua/desktop）

[English](README_EN.md) | [简体中文](README_ZH.md)

> 状态：已接受
> 范围：Electron Main / Preload / Renderer、包脚本与质量门
> 更新：2026-09-04
> 规范效力：开发入口与已知事项记录；产品边界与契约以 `docs/` 为准

## 开发命令

在仓库根目录完成 `pnpm install` 后使用：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev`（`pnpm --filter @vua/desktop dev`） | Main + Renderer 联合开发启动 |
| `pnpm --filter @vua/desktop typecheck` | Renderer 与 Electron 双 tsconfig 严格类型检查 |
| `pnpm --filter @vua/desktop test` | vitest 单元测试 |
| `pnpm --filter @vua/desktop build` | 先构建 `@vua/orchestrator-provider`，再产出到 `dist/` |
| `pnpm --filter @vua/desktop check` | typecheck + test + build + 5 个质量门 |
| `pnpm --filter @vua/desktop smoke:remote-permissions` | 真实远程权限冒烟（证据写入 `_local_m1/<版本>/`，不入库） |
| `pnpm --filter @vua/desktop start` | 构建并启动打包产物 |

质量门：`check:boundary`（Gateway 仅经 barrel、renderer 禁止 `electron`/`node:`/`@tauri-apps`）、
`check:i18n` + `check:i18n-tables`（无中文字面量、多语言表对齐）、`check:contrast`（5 上下文 WCAG AA）、
`check:leak`（fixture 生产构建零泄漏）。

## 已知备忘

1. **全新克隆先构建 Provider**：`@vua/orchestrator-provider` 的运行时入口指向
   `dist/index.js`，而 desktop 的 `test` 先于 `build` 执行——全新克隆直接运行
   `pnpm --filter @vua/desktop test`（或 `pnpm install` 后直接跑包级 `test`）会因
   `dist/` 缺失而解析失败。先执行一次 `pnpm build`（根脚本按拓扑序构建全部包）或
   `pnpm --filter @vua/orchestrator-provider build` 再跑测试。该顺序固化（例如纳入根
   `check` 或包 `test` 前置）留待 M2/CI 切片决议。
2. **M 线遗留的过时版本串**：`glm/orchestrator` 分支上 M1 壳的
   `src/renderer/gateway.ts` 浏览器回落快照仍写 `productVersion: "0.4.0-dev"`。该文件
   已在本分支（表现层全量迁移）中删除，由 `src/renderer/gateway/` 端口体系取代；本
   分支合并回主线时自然消失，此前仅在 M 线单独存在期间可见，不阻塞任何门。

## 迁移与验证记录

- 表现层资产迁移台账：[MIGRATION_ASSETS_ZH.md](MIGRATION_ASSETS_ZH.md) / [MIGRATION_ASSETS_EN.md](MIGRATION_ASSETS_EN.md)；
- 旧仓库资产总台账：`docs/migration/asset-ledger.md`；
- 发行说明：`docs/release/`。
