import { useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { useEnvironmentView } from "../../gateway/index.ts";
import { strings } from "../../i18n/index.ts";
import "./project-compat.css";

/**
 * F6 项目兼容页(M6 T-C;product-boundary 1.2.0 权威语义,U3 裁决):
 * 对 ALCOM/VCC 管理的项目只读兼容呈现与「导入为 VUA 管理的副本」入口。
 *
 * 数据源两段(诚实纪律):
 * - 环境状态段:env 引擎 presence 模型(create 辖区版本轨道)先行消费,
 *   恒标注「VUA 侧检测,非 ALCOM/VCC 记录」;
 * - 项目检测段:环境 T-B 检测读面(发现/识别/包/SDK/兼容性)未接线——
 *   以能力不可用诚实占位,不猜测数据;
 * - 副本导入:入口与五项规格呈现先落地;执行调用(环境 T-A 读面/能力面)
 *   未接线,点击后如实反馈未接线(同 008 先例),恒可交互不冒充可用。
 *
 * 写操作交接:呈现 1.2.0 禁止清单要点与「交接给对应管理器」引导;
 * 交接的具体交互形态(外部拉起等)待规格确认,本批不实现。
 */
const copy = strings.projectCompat;

export function ProjectCompatPage() {
  const environment = useEnvironmentView();
  const [importRequested, setImportRequested] = useState(false);

  return (
    <div className="vua-page">
      <section className="vua-page__hero">
        <h1 className="vua-title">{strings.nav.pages.projectCompat}</h1>
      </section>

      <Card>
        <div className="vua-page__stack">
          <h2 className="vua-title">{copy.title}</h2>
          <p className="vua-caption vua-text-secondary">{copy.subtitle}</p>

          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.readOnlyTitle}</h3>
            <p className="vua-text-secondary">{copy.readOnlyDesc}</p>
          </section>

          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.detectionTitle}</h3>
            <p className="vua-caption vua-text-secondary">{copy.detectionSource}</p>
            <p className="vua-caption vua-text-secondary">{copy.detectionItemsTitle}</p>
            <ul className="vua-project-compat__specs">
              {copy.detectionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="vua-caption vua-text-secondary" role="note">
              {copy.detectionNotWired}
            </p>
          </section>

          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.envStatusTitle}</h3>
            <p className="vua-caption vua-text-secondary">{copy.envStatusSource}</p>
            {environment.versions.create.length > 0 ? (
              <ul className="vua-project-compat__env-list">
                {environment.versions.create.map((track) => (
                  <li key={track.id}>
                    <strong>{track.title}</strong>{" "}
                    <span className="vua-caption vua-text-secondary">
                      {track.installed ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </Card>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.handoverTitle}</h3>
            <p className="vua-text-secondary">{copy.handoverDesc}</p>
          </section>
        </div>
      </Card>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">
              {copy.importTitle} <Badge tone="error">⚠</Badge>
            </h3>
            <p className="vua-text-secondary">{copy.importSpecIntro}</p>
            <ul className="vua-project-compat__specs">
              {copy.importSpecs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
            {importRequested ? (
              <p className="vua-caption vua-text-secondary" role="status">
                {copy.importNotWired}
              </p>
            ) : null}
            <Button variant="default" onClick={() => setImportRequested(true)}>
              {copy.importCta}
            </Button>
          </section>
        </div>
      </Card>
    </div>
  );
}
