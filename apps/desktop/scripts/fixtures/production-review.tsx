import React, { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { ContentDialog } from "../../src/renderer/components/primitives/ContentDialog.tsx";
import { ConfirmDialog } from "../../src/renderer/components/primitives/ConfirmDialog.tsx";
import { useModalOwner } from "../../src/renderer/components/primitives/modal-layer.tsx";
import { RecipePage } from "../../src/renderer/features/recipe/RecipePage.tsx";
import { ImportPage } from "../../src/renderer/features/import/ImportPage.tsx";
import { GatewayProvider } from "../../src/renderer/gateway/GatewayProvider.tsx";
import { emptyGateway } from "../../src/renderer/gateway/empty-gateway.ts";
import { composeAddItemAction, composeSetNameHintAction, useComposeDraft } from "../../src/renderer/app/compose-draft-store.ts";
import { recipePersisted } from "../../src/renderer/app/recipe-library-revision.ts";
import { strings } from "../../src/renderer/i18n/index.ts";

const root = createRoot(document.getElementById("root")!);
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 40));
const results: string[] = [];
function check(ok: unknown, name: string) { if (!ok) throw new Error(name); results.push(name); }
function button(text: string, within: ParentNode = document): HTMLButtonElement {
  const found = [...within.querySelectorAll<HTMLButtonElement>("button")].find((node) => node.textContent?.trim() === text);
  if (!found) throw new Error("Button missing: " + text);
  return found;
}
async function click(text: string, within: ParentNode = document) { button(text, within).click(); await wait(); }
async function key(value: string, shiftKey = false) {
  document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: value, shiftKey, bubbles: true, cancelable: true }));
  await wait();
}
function Satellite() {
  const owner = useModalOwner();
  return createPortal(<div data-vua-modal-owner={owner}><button id="satellite">remote close</button></div>, document.body);
}
function ModalCase() {
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(false);
  const [dynamic, setDynamic] = useState(false);
  return <><button id="opener" onClick={() => setOpen(true)}>open</button><button id="background">background</button>
    <ContentDialog open={open} title="outer" closeLabel="close outer" onClose={() => setOpen(false)}>
      <button id="inner-opener" onClick={() => setInner(true)}>inner</button>
      <button onClick={() => setDynamic(!dynamic)}>toggle dynamic</button>
      {dynamic && <button id="dynamic" onClick={() => setDynamic(false)}>remove me</button>}
      <Satellite />
      <ConfirmDialog open={inner} title="inner" cancelLabel="cancel" confirmLabel="confirm"
        onCancel={() => setInner(false)} onConfirm={() => setInner(false)}>confirmation</ConfirmDialog>
    </ContentDialog></>;
}
async function modalTests() {
  root.render(<StrictMode><ModalCase /></StrictMode>); await wait();
  const opener = document.getElementById("opener")!; opener.focus(); await click("open");
  check(document.activeElement?.getAttribute("aria-label") === "close outer", "initial focus / StrictMode");
  check(!!document.getElementById("background")?.closest("[inert]"), "background inert");
  check(!document.getElementById("satellite")?.closest("[inert]"), "body portal remains active");
  document.getElementById("satellite")!.focus(); await key("Tab");
  check(document.activeElement?.getAttribute("aria-label") === "close outer", "Tab wraps from body portal");
  await key("Tab", true); check(document.activeElement?.id === "satellite", "Shift+Tab wraps to portal");
  document.getElementById("inner-opener")!.focus(); await click("inner");
  check(document.activeElement?.closest('[aria-label="inner"]'), "nested initial focus");
  check(!!document.getElementById("satellite")?.closest("[inert]"), "parent portal inert behind confirmation");
  await key("Escape"); check(document.querySelectorAll('[role="dialog"]').length === 1, "first Esc closes only inner");
  check(document.activeElement?.id === "inner-opener", "nested focus restoration");
  await click("inner"); (document.querySelector(".vua-confirm-dialog__overlay") as HTMLElement).click(); await wait();
  check(document.querySelectorAll('[role="dialog"]').length === 1, "inner backdrop leaves parent open");
  await click("toggle dynamic");
  const dynamic = document.getElementById("dynamic") as HTMLButtonElement;
  dynamic.focus(); dynamic.disabled = true; await wait();
  check(document.activeElement !== dynamic && document.activeElement?.closest('[role="dialog"]'), "disabled focused button recovers focus");
  dynamic.disabled = false; dynamic.focus(); await click("remove me");
  check(document.activeElement?.closest('[role="dialog"]'), "removed focused button recovers focus");
  await key("Escape"); check(!document.querySelector('[role="dialog"]'), "second Esc closes outer");
  check(document.activeElement === opener, "outer focus restoration");
  check(!document.querySelector("[inert]"), "background restored after close");
  await click("open"); root.render(<div>unmounted</div>); await wait();
  check(!document.querySelector("[inert]"), "unmount clears isolation");
}

const gateway = emptyGateway();
let documents: Record<string, any> = {};
let pendingSave: { document: any; resolve: (value: any) => void } | null = null;
let listCalls = 0, getCalls = 0;
let holdList = false, holdGet = false;
let delayed: (() => void)[] = [];
const ok = (value: unknown) => ({ schemaVersion: 1, requestId: "synthetic", ok: true, value });
const failure = () => ({ schemaVersion: 1, requestId: "synthetic", ok: false, error: { code: "internal", messageKey: "synthetic" } });
const invoke = async (request: any) => {
  if (request.method === "recipe.list") {
    listCalls++;
    const response = ok({ entries: Object.values(documents).map((doc: any) => ({ recipeId: doc.recipeId, title: doc.title, revision: doc.revision, updatedAt: doc.updatedAt })) });
    if (holdList) { holdList = false; return new Promise((resolve) => delayed.push(() => resolve(response))); }
    return response;
  }
  if (request.method === "recipe.get") {
    getCalls++;
    // Frozen wire face (production-use-case v0.2 recipe-get.result): the
    // receipt carries required top-level identity fields (recipeId/revision,
    // store-authoritative) plus the transparent `recipeDocument` body; the
    // renderer narrows the chain-selection identity from the receipt (029 A4).
    const stored = documents[request.params.recipeId];
    const response = ok({
      recipeId: stored?.recipeId ?? request.params.recipeId,
      revision: stored?.revision ?? 1,
      recipeDocument: stored,
    });
    if (holdGet) { holdGet = false; return new Promise((resolve) => delayed.push(() => resolve(response))); }
    return response;
  }
  if (request.method === "recipe.save") return new Promise((resolve) => { pendingSave = { document: request.params.recipeDocument, resolve }; });
  return failure();
};
function DraftProbe() { const draft = useComposeDraft(); return <output id="draft-probe">{JSON.stringify(draft)}</output>; }
function recipeRoot() { root.render(<StrictMode><GatewayProvider gateway={gateway}><RecipePage /><DraftProbe /></GatewayProvider></StrictMode>); }
function settleSave(success = true) {
  if (!pendingSave) throw new Error("No pending save");
  const { document, resolve } = pendingSave; pendingSave = null;
  if (!success) { resolve(failure()); return; }
  const revision = (documents[document.recipeId]?.revision ?? 0) + 1;
  documents[document.recipeId] = { ...document, title: "saved-recipe", revision, updatedAt: "2026-09-21T00:00:00Z",
    assets: document.assets.map((asset: any) => ({ ...asset, label: `asset-rev-${revision}` })) };
  resolve(ok({ recipeId: document.recipeId, revision }));
}
async function openCompose() { await click(strings.nav.pages.composePage); }
async function save() { await click(strings.compose.saveCta); }
async function recipeTests() {
  window.vua = { gateway: { invoke } } as any;
  composeAddItemAction({ warehouseItemId: "synthetic-asset", title: "Synthetic", role: "avatar_base", nameHint: "Avatar" });
  recipeRoot(); await wait(); await wait();
  await openCompose(); await save();
  check(!!pendingSave, "first save submitted");
  await key("Escape"); const before = listCalls; settleSave(); await wait(); await wait();
  check(listCalls > before && !!document.querySelector(".vua-recipe-library strong"), "success after dialog close refreshes list");
  (document.querySelector(".vua-recipe-library li button") as HTMLElement).click(); await wait();
  check(document.querySelector(".vua-recipe-library")?.textContent?.includes("asset-rev-1"), "selected persisted document loads details");
  await openCompose(); await save();
  check(document.querySelectorAll('[role="dialog"]').length === 2, "real duplicate save opens nested confirmation");
  await key("Escape"); check(document.querySelectorAll('[role="dialog"]').length === 1 && !pendingSave, "duplicate Esc cancels only confirmation");
  await save(); const confirm = document.querySelector(".vua-confirm-dialog__actions button:last-child") as HTMLElement;
  confirm.click(); await wait(); const getsBefore = getCalls; settleSave(); await wait(); await wait();
  check(getCalls > getsBefore, "new revision refetches selected details");
  await key("Escape");
  check(document.querySelector(".vua-recipe-library")?.textContent?.includes("asset-rev-2"), "new revision displayed");
  const closedCalls = listCalls; await openCompose(); await key("Escape");
  check(listCalls === closedCalls, "closing alone does not invalidate");
  composeSetNameHintAction("synthetic-asset", "changed"); await openCompose(); await save();
  const failedCalls = listCalls; settleSave(false); await wait();
  check(listCalls === failedCalls, "failed save does not invalidate");
  await save(); composeSetNameHintAction("synthetic-asset", "edited while saving"); settleSave(); await wait(); await key("Escape");
  check(JSON.parse(document.getElementById("draft-probe")!.textContent!).dirty, "in-flight draft edits stay dirty");
  holdList = true; holdGet = true; await click(strings.recipe.libraryReload); await wait();
  const id = Object.keys(documents)[0]!;
  documents[id] = { ...documents[id], revision: 4, title: "newest-recipe", assets: [{ id: "synthetic-asset", role: "avatar_base", label: "newest-detail" }] };
  recipePersisted(); await wait(); await wait();
  delayed.forEach((resolve) => resolve()); delayed = []; await wait();
  const library = document.querySelector(".vua-recipe-library")!.textContent!;
  check(library.includes("newest-recipe") && library.includes("newest-detail") && !library.includes("asset-rev-3"), "old list and detail requests cannot overwrite latest reads");
}

async function importTests() {
  let listeners = new Set<(event: any) => void>(); let closed = 0, next = 0;
  window.vua = { gateway: { invoke }, capabilities: { remoteBrowser: true }, remoteContent: {
    events: { subscribe: (listener: any) => { listeners.add(listener); return () => listeners.delete(listener); } },
    open: async () => { const viewId = `synthetic-${++next}`;
      const state = { viewId, currentUrl: "https://booth.pm/", canGoBack: false, canGoForward: false, loading: false };
      queueMicrotask(() => listeners.forEach((listener) => listener({ kind: "view-opened", viewId, url: state.currentUrl })));
      return state; },
    close: async (viewId: string) => { closed++; listeners.forEach((listener) => listener({ kind: "view-closed", viewId })); },
  } } as any;
  root.render(<StrictMode><GatewayProvider gateway={gateway}><ContentDialog open title="import" closeLabel="close" onClose={() => {}}><ImportPage /></ContentDialog></GatewayProvider></StrictMode>);
  await wait(); await wait();
  const bar = document.querySelector<HTMLElement>(".vua-import__browse-bar");
  check(bar && bar.parentElement === document.body && !bar.closest("[inert]"), "actual ImportPage body toolbar is not inert");
  const close = bar!.querySelector<HTMLButtonElement>(".vua-import__browse-button--close")!;
  close.focus(); check(document.activeElement === close, "actual remote close accepts focus");
  const before = closed; close.click(); await wait(); check(closed > before, "actual remote close remains actionable");
  root.render(<div>finished</div>); await wait(); check(!document.querySelector("[inert]"), "import unmount restores background");
}
window.review = {
  nativeStart: async () => { root.render(<StrictMode><ModalCase /></StrictMode>); await wait();
    document.getElementById("opener")!.focus(); await click("open");
    document.getElementById("inner-opener")!.focus(); await click("inner"); },
  nativeCheck: async (remaining: number) => { await wait();
    check(document.querySelectorAll('[role="dialog"]').length === remaining, `native Esc leaves ${remaining} dialogs`);
    return document.activeElement?.id; },
  run: async () => { await modalTests(); await recipeTests(); await importTests(); return results; } };
