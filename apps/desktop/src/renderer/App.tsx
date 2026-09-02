import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Mascot, StatusLight } from "@vua/design-system";
import type { AppSnapshotV1 } from "@vua/contracts";
import { loadAppSnapshot } from "./gateway.js";
import { strings } from "./i18n.js";
import { moduleForPage, modules, type PageId } from "./navigation.js";

function pageContent(page: PageId, snapshot: AppSnapshotV1 | null) {
  if (page === "home") {
    return (
      <div className="vua-home-grid">
        <Card className="vua-hero-card">
          <Mascot size={96} />
          <div>
            <Badge tone="accent">Electron 迁移基线</Badge>
            <h1>欢迎回到 VUA 工坊</h1>
            <p>旧表现层的视觉与导航已经运行在隔离的 Electron Renderer 中。</p>
          </div>
        </Card>
        <Card><StatusLight level={snapshot ? "ok" : "unknown"} label={snapshot ? "Gateway 已连接" : "正在连接 Gateway"} /></Card>
        <Card><StatusLight level="unknown" label="Orchestrator Provider 尚未接入" /></Card>
        <Card><StatusLight level="unknown" label="后台任务能力尚未接入" /></Card>
      </div>
    );
  }
  if (page === "warehouse") {
    return <EmptyState title="Warehouse 正在迁移" description="素材卡片、相册和详情抽屉会在 Electron 远程浏览与 AMF 契约接入后恢复。" action={<Button variant="primary">选择本地素材</Button>} />;
  }
  if (page === "recipe") {
    return <EmptyState title="Recipe 工作台尚未连接" description="旧列表与图谱表现模型将接到现行 Recipe 契约；当前不会伪造生产数据。" />;
  }
  if (page === "workshop") {
    return (
      <Card className="vua-workshop-card">
        <h1>Assembly → Production → Inspection</h1>
        <div className="vua-track" aria-label="模型生产轨道">
          {['Assembly', 'Production', 'Inspection'].map((stage, index) => <div className="vua-track__stage" key={stage}><span>{index + 1}</span><strong>{stage}</strong></div>)}
        </div>
        <p>轨道演出已恢复为表现层资产；真实状态将在任务事件接入后驱动。</p>
      </Card>
    );
  }
  if (page === "settings-theme") return <ThemeSettings />;
  if (page === "settings-about") {
    return <Card><h1>VRC Ultra Assistant</h1><p>Electron · React · TypeScript · Vite</p><p>版本 {snapshot?.productVersion ?? "读取中"}</p></Card>;
  }
  return <EmptyState title="表现层已就位" description="此页面的旧资产将在对应应用契约确定后继续迁移。" />;
}

function ThemeSettings() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme ?? "dark");
  return (
    <Card>
      <h1>主题与效果</h1>
      <p>保留旧客户端的深色优先和浅色主题切换。</p>
      <Button onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        setTheme(next);
      }}>{theme === "dark" ? "切换到浅色" : "切换到深色"}</Button>
    </Card>
  );
}

export function App() {
  const [page, setPage] = useState<PageId>("home");
  const [snapshot, setSnapshot] = useState<AppSnapshotV1 | null>(null);
  const module = useMemo(() => moduleForPage(page), [page]);

  useEffect(() => { void loadAppSnapshot().then(setSnapshot); }, []);

  return (
    <div className="vua-shell" data-module={module.id}>
      <header className="vua-shell__header">
        <div className="vua-shell__brand"><strong>VUA</strong><span>VRC Ultra Assistant</span></div>
        <nav className="vua-shell__tabs" aria-label={strings.regionsAria}>
          {modules.filter((entry) => entry.id !== "settings").map((entry) => (
            <button key={entry.id} aria-current={module.id === entry.id ? "page" : undefined} onClick={() => setPage(entry.defaultPage)}>{strings.modules[entry.id]}</button>
          ))}
        </nav>
        <button className="vua-shell__settings" aria-current={module.id === "settings" ? "page" : undefined} onClick={() => setPage("settings-theme")}>{strings.settings}</button>
        <div className="vua-window-controls">
          <button aria-label={strings.windowMinimize} onClick={() => void window.vua?.window.minimize()}>—</button>
          <button aria-label={strings.windowMaximize} onClick={() => void window.vua?.window.toggleMaximize()}>□</button>
          <button aria-label={strings.windowClose} onClick={() => void window.vua?.window.close()}>×</button>
        </div>
      </header>
      <div className="vua-shell__body">
        {module.id !== "home" && <aside className="vua-shell__sidebar">{module.pages.map((entry) => <button key={entry.id} aria-current={page === entry.id ? "page" : undefined} onClick={() => setPage(entry.id)}>{strings.pages[entry.id]}</button>)}</aside>}
        <main className="vua-shell__main">{pageContent(page, snapshot)}</main>
      </div>
      <footer className="vua-shell__taskbar"><span>{strings.taskCenter}</span><span>{snapshot?.capabilities.tasks ? strings.taskAvailable : strings.taskUnavailable}</span></footer>
    </div>
  );
}
