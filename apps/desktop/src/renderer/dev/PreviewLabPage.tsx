import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format, strings } from "../i18n/index.ts";
import {
  ModelViewer,
  type DemoAssetEntry,
  type ModelLoadStatus,
} from "./preview-lab/ModelViewer.tsx";
import { TurntablePlayer } from "../components/preview/TurntablePlayer.tsx";
import "./preview-lab/preview-lab.css";

/**
 * 预览实验室(本地演示工程 spike,DEV-only ?dev=preview-lab):
 * T1 webview 直渲素材 与 T2 Unity 烘焙成品 分节对照。
 *
 * 数据全部来自用户侧 Unity 工程的 .vrcua/bridge/demo-lab.json,经 vite
 * /@fs/ 读取(query 参数 demoRoot 指向工程根);付费素材不入库,repo 内
 * 不含任何项目绝对路径(vite.config.ts 的 fs.allow 行为 spike 例外,已标注)。
 * main.tsx 以 lazy() 挂载本页,three 不进主 chunk。
 */

interface DemoLabProduct {
  id: string;
  kind: "vrm" | "turntable";
  label: string;
  path: string;
}

interface DemoLab {
  schemaVersion: number;
  sources: DemoAssetEntry[];
  products: DemoLabProduct[];
}

type ManifestPhase =
  | { state: "loading" }
  | { state: "ready"; lab: DemoLab }
  | { state: "failed" };

const copy = strings.previewLab;
const MANIFEST_REL = ".vrcua/bridge/demo-lab.json";

/** ?demoRoot= 归一化:反斜杠转正、去尾斜杠;缺失返回 null(needRoot 诚实态) */
function readDemoRoot(): string | null {
  const raw = new URLSearchParams(window.location.search).get("demoRoot");
  if (!raw) return null;
  const normalized = raw.replace(/\\/g, "/").replace(/\/+$/, "");
  return normalized === "" ? null : normalized;
}

function kindLabel(kind: string): string {
  if (kind === "fbx") return copy.kindFbx;
  if (kind === "vrm") return copy.kindVrm;
  return copy.kindTurntable;
}

/** 卡片壳:标题/类型徽标/状态灯 + 舞台区 + 路径脚注;加载与失败态在此统一渲染 */
function LabCard({
  label,
  kind,
  path,
  failedHint,
  render,
}: {
  label: string;
  kind: string;
  path: string;
  /** 失败时替代默认文案的具体提示(如烘焙未就绪) */
  failedHint?: string | undefined;
  render: (onStatus: (status: ModelLoadStatus) => void) => ReactNode;
}) {
  const [status, setStatus] = useState<ModelLoadStatus>("loading");
  return (
    <article className="preview-lab__card">
      <header className="preview-lab__card-head">
        <span className="preview-lab__card-title">{label}</span>
        <span className="preview-lab__kind">{kindLabel(kind)}</span>
        <span
          className={`preview-lab__status preview-lab__status--${status}`}
          aria-label={status}
        />
      </header>
      <div className="preview-lab__stage">
        {render(setStatus)}
        {status === "loading" && (
          <span className="preview-lab__overlay">{copy.cardStatusLoading}</span>
        )}
        {status === "failed" && (
          <span className="preview-lab__overlay preview-lab__overlay--failed">
            {failedHint ?? copy.cardStatusFailed}
          </span>
        )}
      </div>
      <footer className="preview-lab__card-foot">{path}</footer>
    </article>
  );
}

export function PreviewLabPage() {
  const demoRoot = useMemo(readDemoRoot, []);
  const urlFor = useMemo(() => {
    if (demoRoot === null) return null;
    const base = `/@fs/${demoRoot}`;
    return (rel: string) => encodeURI(`${base}/${rel}`);
  }, [demoRoot]);
  const [phase, setPhase] = useState<ManifestPhase>({ state: "loading" });

  useEffect(() => {
    if (urlFor === null) return;
    let cancelled = false;
    fetch(urlFor(MANIFEST_REL))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<DemoLab>;
      })
      .then((lab) => {
        if (!cancelled) setPhase({ state: "ready", lab });
      })
      .catch(() => {
        if (!cancelled) setPhase({ state: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [urlFor]);

  return (
    <div className="preview-lab">
      <header className="preview-lab__header">
        <h1 className="preview-lab__title">{copy.title}</h1>
        <p className="preview-lab__subtitle">{copy.subtitle}</p>
        {demoRoot !== null && (
          <p className="preview-lab__root">
            {copy.demoRootLabel}: {demoRoot}
          </p>
        )}
      </header>

      {demoRoot === null && (
        <section className="preview-lab__empty">
          <h2>{copy.needRootTitle}</h2>
          <p>{copy.needRootBody}</p>
        </section>
      )}
      {demoRoot !== null && phase.state === "loading" && (
        <section className="preview-lab__empty">
          <p>{copy.manifestLoading}</p>
        </section>
      )}
      {phase.state === "failed" && (
        <section className="preview-lab__empty">
          <h2>{copy.manifestFailedTitle}</h2>
          <p>{format(copy.manifestFailedBody, { path: MANIFEST_REL })}</p>
        </section>
      )}

      {phase.state === "ready" && urlFor !== null && (
        <>
          <section className="preview-lab__section">
            <h2 className="preview-lab__section-title">{copy.sourcesTitle}</h2>
            <p className="preview-lab__note">{copy.sourcesNote}</p>
            <div className="preview-lab__grid">
              {phase.lab.sources.map((source) => (
                <LabCard
                  key={source.id}
                  label={source.label}
                  kind={source.kind}
                  path={source.path}
                  render={(onStatus) => (
                    <ModelViewer asset={source} urlFor={urlFor} onStatus={onStatus} />
                  )}
                />
              ))}
            </div>
          </section>

          <section className="preview-lab__section">
            <h2 className="preview-lab__section-title">{copy.productsTitle}</h2>
            <p className="preview-lab__note">{copy.productsNote}</p>
            <div className="preview-lab__grid">
              {phase.lab.products.map((product) => (
                <LabCard
                  key={product.id}
                  label={product.label}
                  kind={product.kind}
                  path={product.path}
                  failedHint={
                    product.kind === "turntable"
                      ? format(copy.bakePending, { path: product.path })
                      : undefined
                  }
                  render={(onStatus) =>
                    product.kind === "turntable" ? (
                      <TurntablePlayer
                        manifestPath={product.path}
                        urlFor={urlFor}
                        onStatus={onStatus}
                      />
                    ) : (
                      <ModelViewer
                        asset={{
                          id: product.id,
                          kind: "vrm",
                          label: product.label,
                          path: product.path,
                        }}
                        urlFor={urlFor}
                        onStatus={onStatus}
                      />
                    )
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
