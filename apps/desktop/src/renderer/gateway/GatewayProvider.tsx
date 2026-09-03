import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Button } from "../components/primitives/Button.tsx";
import { Card } from "../components/primitives/Card.tsx";
import { EmptyState } from "../components/primitives/EmptyState.tsx";
import { strings } from "../i18n/index.ts";
import type { EnvironmentView } from "./environment-port.ts";
import type { VuaGateway } from "./gateway.ts";
import type { AcquireView } from "./acquire-port.ts";
import type { ModelProductionView } from "./model-production-port.ts";
import type { PackagesView } from "./packages-port.ts";
import type { SettingsView } from "./settings-port.ts";
import type { TaskCenterView } from "./task-port.ts";
import type { ToolCatalogView } from "./tool-catalog-port.ts";
import type { DataSource } from "./types.ts";
import type { WorkshopView } from "../features/workshop/track-model.ts";

/**
 * GatewayProvider(G3):Gateway 的 React 绑定。
 *
 * 启动时并行拉齐各领域首帧快照后才渲染子树(应用启动加载,非骨架屏);
 * 之后各端口 subscribe 推送增量更新各自切片。教程端口由 G4 表面
 * (?surface=tutorial / SteamVR helper)独立使用,不进入主壳首帧。
 */

interface GatewayViews {
  environment: EnvironmentView;
  modelProduction: ModelProductionView;
  toolCatalog: ToolCatalogView;
  task: TaskCenterView;
  settings: SettingsView;
  acquire: AcquireView;
  packages: PackagesView;
}

interface GatewayContextValue {
  gateway: VuaGateway;
  views: GatewayViews;
}

const GatewayContext = createContext<GatewayContextValue | null>(null);

export function GatewayProvider({
  gateway,
  children,
}: {
  gateway: VuaGateway;
  children: ReactNode;
}) {
  const [views, setViews] = useState<GatewayViews | null>(null);
  // 首帧拉齐失败标记:任一端口 snapshot 拒绝时显式失败态 + 重试,
  // 不得静默停在永久空白(重试经 bootNonce 重走首帧,不修改任何本地数据)
  const [bootFailed, setBootFailed] = useState(false);
  const [bootNonce, setBootNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setBootFailed(false);
    void Promise.all([
      gateway.environment.snapshot(),
      gateway.modelProduction.snapshot(),
      gateway.toolCatalog.snapshot(),
      gateway.task.snapshot(),
      gateway.settings.snapshot(),
      gateway.acquire.snapshot(),
      gateway.packages.snapshot(),
    ])
      .then(([environment, modelProduction, toolCatalog, task, settings, acquire, packages]) => {
        if (active)
          setViews({ environment, modelProduction, toolCatalog, task, settings, acquire, packages });
      })
      .catch(() => {
        if (active) setBootFailed(true);
      });
    const unsubscribes = [
      gateway.environment.subscribe((environment) =>
        setViews((prev) => (prev ? { ...prev, environment } : prev)),
      ),
      gateway.modelProduction.subscribe((modelProduction) =>
        setViews((prev) => (prev ? { ...prev, modelProduction } : prev)),
      ),
      gateway.toolCatalog.subscribe((toolCatalog) =>
        setViews((prev) => (prev ? { ...prev, toolCatalog } : prev)),
      ),
      gateway.task.subscribe((task) => setViews((prev) => (prev ? { ...prev, task } : prev))),
      gateway.settings.subscribe((settings) =>
        setViews((prev) => (prev ? { ...prev, settings } : prev)),
      ),
      gateway.acquire.subscribe((acquire) =>
        setViews((prev) => (prev ? { ...prev, acquire } : prev)),
      ),
      gateway.packages.subscribe((packages) =>
        setViews((prev) => (prev ? { ...prev, packages } : prev)),
      ),
    ];
    return () => {
      active = false;
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [gateway, bootNonce]);

  // 首帧失败:全局诚实失败态(此时应用壳尚未就绪,渲染最小独立页面)
  if (bootFailed) {
    return (
      <div className="vua-page">
        <Card>
          <EmptyState
            title={strings.boot.loadFailedTitle}
            description={strings.boot.loadFailedDescription}
            action={
              <Button variant="primary" onClick={() => setBootNonce((nonce) => nonce + 1)}>
                {strings.boot.retry}
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  // 首帧拉齐前不渲染(启动路径极短;这是应用启动加载,不是内容骨架屏)
  if (!views) return null;
  return <GatewayContext.Provider value={{ gateway, views }}>{children}</GatewayContext.Provider>;
}

function useGatewayContext(): GatewayContextValue {
  const context = useContext(GatewayContext);
  if (!context) throw new Error("useGateway* hooks must be used inside GatewayProvider");
  return context;
}

/** 完整 Gateway:提交意图(cancel / setGoals 等)与 capability 查询 */
export function useGateway(): VuaGateway {
  return useGatewayContext().gateway;
}

export function useEnvironmentView(): EnvironmentView {
  return useGatewayContext().views.environment;
}

export function useWorkshopView(): WorkshopView {
  return useGatewayContext().views.modelProduction.workshop;
}

export function useToolCatalogView(): ToolCatalogView {
  return useGatewayContext().views.toolCatalog;
}

export function useTaskCenter(): TaskCenterView {
  return useGatewayContext().views.task;
}

export function useSettingsView(): SettingsView {
  return useGatewayContext().views.settings;
}

export function useAcquireView(): AcquireView {
  return useGatewayContext().views.acquire;
}

export function usePackagesView(): PackagesView {
  return useGatewayContext().views.packages;
}

/** 数据来源标识:"演示数据"徽标的唯一依据(原则①) */
export function useDataSource(): DataSource {
  return useGatewayContext().gateway.dataSource();
}
