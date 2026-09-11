import { Card } from "../../components/primitives/Card.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import { strings } from "../../i18n/index.ts";

/**
 * 检查页(BG-15 工单;设计标准 §8.6「Inspection 以报告、证据和下一步为主,
 * 明确区分本地估算与官方结论」):
 * - 信息架构三区:报告(结论)、证据(检查证据链)、下一步(行动引导);
 * - 检查事实源未接入(随 M7 检查切片交付:Bridge 五维产出操作→检查证据
 *   →inspection-queries 读面),三区以诚实空态呈现——不渲染虚构报告、
 *   不以演示替代(UI-08/工单验收「无事实源不渲染检查数据」);
 * - 本地估算与官方结论之分在空态说明中明示(官方 SDK 结论为保留值,SDK
 *   交接切片落地前禁用,016 仲裁纪律);本页不渲染死按钮。
 */
const copy = strings.inspection;

export function InspectionPage() {
  return (
    <div className="vua-page">
      <section className="vua-page__hero">
        <h1 className="vua-title">{strings.nav.pages.inspectionPage}</h1>
        <p className="vua-caption vua-text-secondary">{copy.subtitle}</p>
      </section>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.reportTitle}</h3>
            <EmptyState title={copy.emptyTitle} description={copy.emptyDesc} />
          </section>
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.evidenceTitle}</h3>
            <p className="vua-caption vua-text-secondary">{copy.evidenceEmptyNote}</p>
          </section>
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.nextTitle}</h3>
            <p className="vua-caption vua-text-secondary">{copy.localVsOfficialNote}</p>
          </section>
        </div>
      </Card>
    </div>
  );
}
