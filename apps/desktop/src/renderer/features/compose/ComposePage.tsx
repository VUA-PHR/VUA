import { useMemo, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import { useAcquireView } from "../../gateway/index.ts";
import { format, strings } from "../../i18n/index.ts";
import {
  composeAddItemAction,
  composeRemoveItemAction,
  composeUndoAction,
  useComposeDraft,
} from "../../app/compose-draft-store.ts";

/**
 * 搭配草稿页(019 批 B,桌面切片):项目无关的素材搭配草稿——从素材库
 * (warehouse 读面)直接把素材加入当前搭配,无须先创建 Unity 项目(UI-03)。
 *
 * - 共享草稿状态在容器层(app/compose-draft-store signal),跨 UI 根切换
 *   保留;本页只是其呈现/操作面之一;
 * - 保存入口诚实禁用:recipe.save 需要 entrypoint 选择器等素材实例化
 *   事实——事实源切片接入前不伪造保存(UI-03「已保存」仅在持久化成功
 *   后显示;当前有草稿内容即未保存);
 * - 撤销只回退本地未提交编辑,不反向执行已提交命令。
 */
const copy = strings.compose;

export function ComposePage() {
  const view = useAcquireView();
  const draft = useComposeDraft();
  const [sourceIndex, setSourceIndex] = useState(0);

  const entries = view.kind === "entries" ? view.entries : [];
  const canUndo = draft.undoStack.length > 0;
  const source = entries[sourceIndex];

  const sourceLines = useMemo(() => {
    if (view.kind !== "entries") return [];
    return view.entries.map((entry) => ({
      id: entry.warehouseItemId,
      title: entry.displayName,
      added: draft.items.some((item) => item.warehouseItemId === entry.warehouseItemId),
    }));
  }, [view, draft.items]);

  return (
    <div className="vua-page">
      <section className="vua-page__hero">
        <h1 className="vua-title">{strings.nav.pages.composePage}</h1>
        <p className="vua-caption vua-text-secondary">{copy.subtitle}</p>
      </section>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.draftTitle}</h3>
            {draft.items.length === 0 ? (
              <EmptyState title={copy.draftEmptyTitle} description={copy.draftEmptyDesc} />
            ) : (
              <ul className="vua-project-compat__specs">
                {draft.items.map((item) => (
                  <li key={item.warehouseItemId}>
                    <strong>{item.title}</strong>{" "}
                    <span className="vua-caption vua-text-secondary">
                      {item.role === null ? "" : format(copy.roleLine, { role: item.role })}
                    </span>{" "}
                    <Button
                      variant="subtle"
                      aria-label={format(copy.removeItemAria, { title: item.title })}
                      onClick={() => composeRemoveItemAction(item.warehouseItemId)}
                    >
                      {copy.removeCta}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="vua-project-compat__row">
              <Button variant="subtle" disabled={!canUndo} onClick={composeUndoAction}>
                {copy.undoCta}
              </Button>
              <Button variant="primary" disabled aria-disabled>
                {copy.saveCta}
              </Button>
              <span className="vua-caption vua-text-secondary">{copy.saveDisabledNote}</span>
            </div>
            {draft.dirty && draft.items.length > 0 ? (
              <p className="vua-caption vua-text-secondary" role="status">
                {copy.unsavedNote}
              </p>
            ) : null}
          </section>
        </div>
      </Card>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.sourceTitle}</h3>
            <p className="vua-caption vua-text-secondary">{copy.sourceDesc}</p>
            {entries.length === 0 ? (
              <EmptyState title={copy.sourceEmptyTitle} description={copy.sourceEmptyDesc} />
            ) : null}
            <ul className="vua-project-compat__specs">
              {sourceLines.map((line, index) => (
                <li key={line.id}>
                  <button
                    type="button"
                    style={{ all: "unset", cursor: index === sourceIndex ? "default" : "pointer" }}
                    onClick={() => setSourceIndex(index)}
                  >
                    <strong>{line.title}</strong>
                  </button>{" "}
                  {line.added ? <Badge tone="success">{copy.inDraftBadge}</Badge> : null}{" "}
                  {index === sourceIndex ? (
                    <Button
                      variant="default"
                      onClick={() =>
                        composeAddItemAction({
                          warehouseItemId: line.id,
                          title: line.title,
                          role: null,
                        })
                      }
                    >
                      {copy.addCta}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Card>
    </div>
  );
}
