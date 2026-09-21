import { Button } from "../../components/primitives/Button.tsx";
import { ConfirmDialog } from "../../components/primitives/ConfirmDialog.tsx";
import { format, strings } from "../../i18n/index.ts";
import { recipeDocumentEditRemoveAdditionAction, useRecipeDocumentEdit, useRecipeDocumentSave } from "../../app/recipe-document-edit-store.ts";
import { recipeDocumentEditBlocked } from "./recipe-document-edit-model.ts";

const copy = strings.recipe;

/**
 * 选中配方素材编辑段(proposal 029 A2 消费切片三):配方页选中态的待保存
 * 新增列表与保存入口——平行文档编辑链的呈现面(判决书④核对点②:同一保存
 * 链形状、同一守卫集;D5 查重确认框与搭配草稿同一词面)。诚实边界:
 * - 本段只呈现「待保存」的新增(本地未落库事实),配方三视图仍呈现
 *   recipe.get 回执的已保存文档——本地编辑绝不冒充已保存(诚实律 1);
 * - 「已保存」仅在持久化回执后显示(UI-03/AC-04);失败如实呈现、待保存
 *   新增保留、重试由用户显式发起(UI-06);
 * - 无选中配方时本段结构性不在场。
 */
export function RecipeDocumentEditSection() {
  const edit = useRecipeDocumentEdit();
  const { saveState, duplicate, saveEdit, confirmDuplicateSave, cancelDuplicateSave } =
    useRecipeDocumentSave();

  if (edit === null) return null;
  const blocked = recipeDocumentEditBlocked(edit.additions);
  return (
    <div className="vua-page__stack">
      {edit.additions.length > 0 ? (
        <>
          <h3 className="vua-warehouse-detail__section-title">{copy.editSectionTitle}</h3>
          <ul className="vua-project-compat__specs">
            {edit.additions.map((item) => (
              <li key={item.warehouseItemId}>
                <strong>{item.title}</strong>{" "}
                <Button
                  variant="subtle"
                  aria-label={format(copy.editRemoveAria, { title: item.title })}
                  onClick={() => recipeDocumentEditRemoveAdditionAction(item.warehouseItemId)}
                >
                  {strings.compose.removeCta}
                </Button>
              </li>
            ))}
          </ul>
          <p className="vua-caption vua-text-secondary" role="status">
            {copy.editDirtyNote}
          </p>
        </>
      ) : null}
      <div className="vua-project-compat__row">
        <Button
          variant="primary"
          disabled={
            !edit.dirty ||
            blocked ||
            saveState === "checking" ||
            saveState === "saving"
          }
          onClick={saveEdit}
        >
          {saveState === "saving" ? copy.savingEditCta : copy.saveEditCta}
        </Button>
      </div>
      {saveState === "failed" ? (
        <p className="vua-caption vua-text-secondary" role="alert">
          {copy.editFailedNote}
        </p>
      ) : null}
      {edit.lastSavedRevision !== null ? (
        <p className="vua-caption vua-text-secondary" role="status">
          {format(strings.compose.savedNote, { revision: String(edit.lastSavedRevision) })}
        </p>
      ) : null}
      {/* D5 查重命中确认框:与搭配草稿同一词面、同一保存链守卫(用户显式
          确认才提交新修订) */}
      <ConfirmDialog
        open={duplicate !== null}
        title={strings.compose.dedupTitle}
        cancelLabel={strings.compose.dedupCancelCta}
        confirmLabel={strings.compose.dedupConfirmCta}
        onCancel={cancelDuplicateSave}
        onConfirm={confirmDuplicateSave}
      >
        <p className="vua-text-secondary">
          {duplicate === null
            ? null
            : format(strings.compose.dedupBody, {
                recipeId: duplicate.recipeId,
                revision: String(duplicate.revision),
              })}
        </p>
      </ConfirmDialog>
    </div>
  );
}
