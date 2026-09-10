import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import { useAcquireView } from "../../gateway/index.ts";
import { format, strings } from "../../i18n/index.ts";
import {
  composeAddItemAction,
  composeDraftToSaveDocument,
  composeRemoveItemAction,
  composeSavedAction,
  composeSetNameHintAction,
  composeUndoAction,
  useComposeDraft,
} from "../../app/compose-draft-store.ts";

/**
 * 搭配草稿页(019 批 B,桌面切片):项目无关的素材搭配草稿——从素材库
 * (warehouse 读面)直接把素材加入当前搭配,无须先创建 Unity 项目(UI-03)。
 *
 * - 共享草稿状态在容器层(app/compose-draft-store signal),跨 UI 根切换
 *   保留;本页只是其呈现/操作面之一;
 * - 保存链(批 B 保存链,core 路由裁定零词表扩展):挂载选择器按
 *   entrypointSelector anyOf 由用户输入(nameHint 用户命名提示;首次保存
 *   由 recipeId 生成,再保存沿用)——recipe.save 原样承载;「已保存」仅在
 *   持久化回执后显示,失败保留内容并提供重试(UI-03/06);
 * - 撤销只回退本地未提交编辑,不反向执行已提交命令。
 */
const copy = strings.compose;

export function ComposePage() {
  const view = useAcquireView();
  const draft = useComposeDraft();
  const [sourceIndex, setSourceIndex] = useState(0);
  /** 已保存事实(recipeId/revision;null=本会话未成功保存) */

  const [saveState, setSaveState] = useState<"idle" | "saving" | "failed">("idle");
  /** 保存过的文档身份(再次保存沿用 recipeId;baseRevision=服务端修订) */
  const savedRef = useRef<{ recipeId: string; revision: number } | null>(null);
  savedRef.current = draft.saved;

  const entries = view.kind === "entries" ? view.entries : [];
  const canUndo = draft.undoStack.length > 0;
  const source = entries[sourceIndex];

  const saveDraft = () => {
    if (saveState === "saving") return;
    const now = new Date().toISOString();
    const document = composeDraftToSaveDocument({
      savedRecipeId: savedRef.current?.recipeId ?? null,
      savedRevision: savedRef.current?.revision ?? 0,
      items: draft.items,
      now,
    });
    if (document === null) return;
    setSaveState("saving");
    void window.vua?.gateway
      .invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "recipe.save",
        params: {
          recipeDocument: document as unknown as Record<string, unknown>,
          baseRevision: savedRef.current?.revision ?? 0,
        },
      })
      .then((result) => {
        if (!result.ok) {
          // 失败如实呈现:保留内容与未保存标记,提供重试(UI-03/06);
          // 超时不等于失败,不自动重试
          setSaveState("failed");
          return;
        }
        const payload = result.value as { recipeId?: unknown; revision?: unknown };
        const recipeId = typeof payload.recipeId === "string" ? payload.recipeId : null;
        const revision = typeof payload.revision === "number" ? payload.revision : null;
        if (recipeId === null || revision === null) {
          setSaveState("failed");
          return;
        }
        setSaveState("idle");
        // 保存对齐:脏标记清除＋saved 身份入容器层(请求解析入口据此启用)
        composeSavedAction(recipeId, revision);
      });
  };

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
                    <input
                      type="text"
                      value={item.nameHint ?? ""}
                      placeholder={copy.nameHintPlaceholder}
                      aria-label={format(copy.nameHintAria, { title: item.title })}
                      onChange={(event) =>
                        composeSetNameHintAction(item.warehouseItemId, event.target.value)
                      }
                    />
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
              <Button
                variant="primary"
                disabled={
                  draft.items.length === 0 ||
                  saveState === "saving" ||
                  draft.items.some((item) => (item.nameHint ?? "").trim() === "")
                }
                onClick={saveDraft}
              >
                {saveState === "saving" ? copy.savingCta : copy.saveCta}
              </Button>
            </div>
            {saveState === "failed" ? (
              <p className="vua-caption vua-text-secondary" role="alert">
                {copy.saveFailedNote}
              </p>
            ) : null}
            {draft.saved !== null ? (
              <p className="vua-caption vua-text-secondary" role="status">
                {format(copy.savedNote, { revision: String(draft.saved.revision) })}
              </p>
            ) : null}
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
                          nameHint: null,
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
