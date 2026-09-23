// 素材导入弹窗 DOM 回归夹具(W25 走查缺陷③根因修复批,操作者第 178 批派单):
// 合成 Gateway,零生产/远程服务。钉死三条用户关闭路径(Esc/背板/×)与两条
// 提交终态(受理自动关闭/失败驻留醒目可关),另钉「受理窗口内手动关闭后
// 重开不被陈旧定时器误关」。真机浏览器 DOM 为准,不宣称端到端。
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ContentDialog } from "../../src/renderer/components/primitives/ContentDialog.tsx";
import { ImportPage } from "../../src/renderer/features/import/ImportPage.tsx";
import { GatewayProvider } from "../../src/renderer/gateway/GatewayProvider.tsx";
import { emptyGateway } from "../../src/renderer/gateway/empty-gateway.ts";
import { strings } from "../../src/renderer/i18n/index.ts";
import { IMPORT_ACCEPTED_AUTO_CLOSE_MS } from "../../src/renderer/features/import/import-model.ts";

const root = createRoot(document.getElementById("root")!);
// 壳面桩:原生文件夹拾取返回合成路径(零真实对话框);capabilities 缺席 =
// 云端段诚实不可用,本夹具只走本地段与弹窗机制面。
(window as any).vua = {
  dialog: { pickWarehouseFolders: async () => ["C:/synthetic/material-pack"] },
};
const wait = (ms = 40) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const results: string[] = [];
function check(ok: unknown, name: string) {
  if (!ok) throw new Error(name);
  results.push(name);
}
function button(text: string, within: ParentNode = document): HTMLButtonElement {
  const found = [...within.querySelectorAll<HTMLButtonElement>("button")].find(
    (node) => node.textContent?.trim() === text,
  );
  if (!found) {
    const body = (document.body.textContent ?? "").replace(/\s+/g, " ").slice(0, 1200);
    throw new Error("Button missing: " + text + " | BODY: " + body);
  }
  return found;
}
async function key(value: string) {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }),
  );
  await wait();
}

/* ---- 合成写面:importFolders/importDownloads 由场景切换 ok/fail ---- */
const gateway = emptyGateway();
let importMode: "ok" | "fail" = "ok";
const accepted = { taskId: "synthetic-task-1", correlationId: "synthetic-corr-1" };
const failureOutcome = {
  ok: false as const,
  error: {
    kind: "application" as const,
    code: "vua.warehouse.unavailable",
    messageKey: "errors.warehouse.unavailable",
    recoverable: true,
    retryable: false,
  },
};
const syntheticGateway = {
  ...gateway,
  warehouseCommands: {
    ...gateway.warehouseCommands,
    importFolders: async () => (importMode === "ok" ? { ok: true as const, accepted } : failureOutcome),
    importDownloads: async () => (importMode === "ok" ? { ok: true as const, accepted } : failureOutcome),
  },
} as typeof gateway;

/* ---- 宿主:开态/关闭计数由夹具持有,onRequestClose 与 ContentDialog.onClose
 *      同收口(与仓储页宿主同构) ---- */
let closeCount = 0;
function Harness() {
  const [open, setOpen] = useState(false);
  (window as any).__setImportOpen = (value: boolean) => setOpen(value);
  return (
    <StrictMode>
      <GatewayProvider gateway={syntheticGateway}>
        <ContentDialog
          open={open}
          title={strings.importPage.title}
          closeLabel={strings.common.dialogClose}
          onClose={() => {
            closeCount++;
            setOpen(false);
          }}
        >
          <ImportPage
            onRequestClose={() => {
              closeCount++;
              setOpen(false);
            }}
          />
        </ContentDialog>
      </GatewayProvider>
    </StrictMode>
  );
}

async function openDialog() {
  (window as any).__setImportOpen(true);
  await wait();
}
const dialogOpen = () => document.querySelector('[role="dialog"]') !== null;

/* ---- 场景 ---- */

/** 受理段行进:选择本地 → 拾取(合成 pickWarehouseFolders)→ 确认提交。
 *  返回前停在提交回执落定后(等待微任务排空)。 */
async function driveToLocalSubmission() {
  await openDialog();
  check(dialogOpen(), "弹窗打开");
  await button(strings.importPage.chooseLocalCta).click();
  await wait();
  await button(strings.warehouse.acquire.importTitle).click();
  await wait();
  await button(strings.warehouse.acquire.importConfirmCta).click();
  await wait();
}

async function escClosesPath() {
  await openDialog();
  check(dialogOpen(), "Esc 路径:弹窗打开");
  await key("Escape");
  check(!dialogOpen(), "Esc 关闭弹窗(路径一)");
  check(closeCount === 1, "Esc 恰一次关闭请求");
}

async function backdropClosesPath() {
  await openDialog();
  const overlay = document.querySelector(".vua-content-dialog__overlay") as HTMLElement;
  check(overlay !== null, "背板路径:遮罩在场");
  overlay.click();
  await wait();
  check(!dialogOpen(), "背板点击关闭弹窗(路径二)");
}

async function closeButtonClosesPath() {
  await openDialog();
  const close = document.querySelector(".vua-content-dialog__close") as HTMLButtonElement;
  check(close !== null, "× 路径:关闭钮在场");
  close.click();
  await wait();
  check(!dialogOpen(), "× 关闭弹窗(路径三)");
}

async function acceptAutoCloses() {
  importMode = "ok";
  closeCount = 0;
  await driveToLocalSubmission();
  check(document.body.textContent!.includes(strings.warehouse.acquire.importAccepted), "受理词面呈现(已受理)");
  check(
    document.body.textContent!.includes(strings.importPage.acceptedAutoClose),
    "自动关闭提示词面呈现",
  );
  check(dialogOpen(), "时滞内弹窗仍在(用户看得见受理信息)");
  await wait(IMPORT_ACCEPTED_AUTO_CLOSE_MS + 250);
  check(!dialogOpen(), "受理后弹窗自动关闭(不滞留模态)");
  check(closeCount === 1, "自动关闭恰一次请求");
}

async function failureStaysWithProminentClose() {
  importMode = "fail";
  closeCount = 0;
  await driveToLocalSubmission();
  const alert = document.querySelector('[role="alert"]');
  check(alert !== null && alert.textContent!.includes("vua.warehouse.unavailable"), "失败 alert 呈现且含协议稳定码详情(failureLogText 律)");
  const closeActions = document.querySelector(".vua-import__failure-actions");
  check(closeActions !== null, "失败动作位在场");
  const prominent = closeActions!.querySelector<HTMLButtonElement>(".vua-button--primary");
  check(prominent !== null && prominent.textContent?.trim() === strings.common.dialogClose, "醒目主按钮「关闭」在场");
  await wait(IMPORT_ACCEPTED_AUTO_CLOSE_MS + 250);
  check(dialogOpen(), "失败态弹窗驻留(不自动关走,失败需用户知悉)");
  prominent!.click();
  await wait();
  check(!dialogOpen(), "主按钮关闭失败态弹窗(× 仅辅助)");
}

async function manualCloseDuringWindowNoStaleTimer() {
  importMode = "ok";
  closeCount = 0;
  await driveToLocalSubmission();
  check(document.body.textContent!.includes(strings.warehouse.acquire.importAccepted), "受理词面呈现");
  await key("Escape");
  check(!dialogOpen(), "受理窗口内手动 Esc 先关");
  const closesBefore = closeCount;
  await openDialog();
  check(dialogOpen(), "重开弹窗(重挂载)");
  await wait(IMPORT_ACCEPTED_AUTO_CLOSE_MS + 250);
  check(dialogOpen(), "重开弹窗不被陈旧定时器误关(卸载清理兑现)");
  check(closeCount === closesBefore, "重开期间零额外关闭请求");
}

window.importDialog = {
  run: async () => {
    root.render(<Harness />);
    await wait();
    await escClosesPath();
    await backdropClosesPath();
    await closeButtonClosesPath();
    await acceptAutoCloses();
    await failureStaysWithProminentClose();
    await manualCloseDuringWindowNoStaleTimer();
    return results;
  },
};
