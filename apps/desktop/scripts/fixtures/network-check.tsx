// DOM regression fixture only; never imported by the product entry point.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { NetworkIntent, NetworkRegion, NetworkReport, NetworkStatus } from "@vua/contracts";
import { NETWORK_TARGETS, NETEASE_UU_URL } from "@vua/contracts";
import { GatewayProvider } from "../../src/renderer/gateway/GatewayProvider.tsx";
import { emptyGateway } from "../../src/renderer/gateway/empty-gateway.ts";
import { NetworkPanel } from "../../src/renderer/features/deployer/NetworkPanel.tsx";
import { strings } from "../../src/renderer/i18n/index.ts";
import "@vua/design-system/tokens.css";
import "@vua/design-system/base.css";
import "../../src/renderer/features/deployer/deployer.css";

const copy = strings.network;
const checks: string[] = [];
const root = createRoot(document.getElementById("root")!);
const base = emptyGateway();
let pending: { intent: NetworkIntent; resolve: (report: NetworkReport) => void; reject: () => void } | null = null;
let requestCount = 0;
const gateway = { ...base, environment: { ...base.environment, network: {
  capability: async () => ({ state: "ready" as const }),
  check: (intent: NetworkIntent) => new Promise<NetworkReport>((resolve, reject) => {
    requestCount++; pending = { intent, resolve, reject: () => reject(new Error("synthetic transport failure")) };
  }),
} } };
function assert(value: unknown, name: string) { if (!value) throw new Error(name); checks.push(name); }
const tick = () => new Promise<void>(r => setTimeout(r, 40));
function button(text: string) {
  const value = [...document.querySelectorAll("button")].find(b => b.textContent === text);
  if (!value) throw new Error(`Missing button: ${text}`);
  return value;
}
async function choose(index: number, value: string) {
  const select = document.querySelectorAll("select")[index]!;
  select.value = value; select.dispatchEvent(new Event("change", { bubbles: true })); await tick();
}
async function click(text: string) { button(text).click(); await tick(); }
const uu = () => document.querySelector(`a[href="${NETEASE_UU_URL}"]`);
async function answer(detectedRegion: NetworkRegion, failure?: NetworkStatus) {
  const request = pending!; pending = null;
  const targets = request.intent.route === "pico_pcvr" ? NETWORK_TARGETS : NETWORK_TARGETS.slice(0, 4);
  request.resolve({ schemaVersion: "0.1", intent: request.intent, detectedRegion,
    effectiveRegion: request.intent.region === "auto" ? detectedRegion : request.intent.region,
    capturedAt: "2026-10-03T01:00:00Z", durationMs: failure ? 6000 : 100,
    results: targets.map((target, i) => ({ target, status: i === 1 && failure ? failure : "reachable",
      elapsedMs: 100, httpStatus: i === 1 && failure ? null : 200 })),
  });
  await tick();
}
function mount() { root.render(<StrictMode><GatewayProvider gateway={gateway}><NetworkPanel /></GatewayProvider></StrictMode>); }

Object.assign(window, { networkReview: { run: async () => {
  mount();
  for (let i = 0; i < 100 && !document.querySelector("select"); i++) await tick();
  assert(!uu(), "unknown region has no UU recommendation regardless of language");
  await choose(1, "other"); await click(copy.check);
  assert(button(copy.check).disabled && document.querySelector("fieldset")?.disabled, "in-flight query disables repeat and intent changes");
  await answer("unknown", "timeout");
  assert(document.querySelectorAll(".vua-network__results li").length === 4, "desktop checks exactly four entrances");
  assert(!document.body.textContent?.includes("NetEase UU") && !document.body.textContent?.includes("网易 UU"), "overseas timeout does not recommend UU in any locale");
  assert(!button(copy.continue).disabled, "partial failure never blocks setup");
  assert(document.querySelector("details summary")?.textContent === copy.lagTitle, "cross-region lag guide is independent of accelerator recommendation");
  await choose(1, "china_mainland");
  assert(Boolean(uu()) && document.body.textContent?.includes(copy.uuQualifier), "mainland recommendation has explicit regional scope");
  assert(!document.querySelector(".vua-network__results"), "changing region retires the old report");
  await choose(0, "pico_pcvr"); await click(copy.check); await answer("unknown");
  assert(document.querySelectorAll(".vua-network__results li").length === 5, "PICO adds only its download-page check");
  await click(copy.recheck); pending!.reject(); pending = null; await tick();
  assert(document.body.textContent?.includes(copy.failed) && !document.querySelector(".vua-network__results"), "failed retry clears previous successful results");
  const count = requestCount;
  await click(copy.continue); await click(copy.reopen);
  assert(requestCount === count, "continue and reopen do not launch network requests");
  await choose(1, "auto"); await click(copy.check); await answer("china_mainland");
  assert(Boolean(uu()), "automatic mainland hint shows region-scoped guidance");
  await choose(1, "other"); assert(!uu(), "manual overseas choice overrides an automatic mainland hint");
  await choose(1, "auto"); await click(copy.check); await answer("unknown");
  assert(!uu(), "failed country lookup never assumes mainland China");
  await choose(1, "china_mainland"); await click(copy.check);
  const old = pending!; root.render(null); await tick(); mount(); await tick(); await tick();
  old.resolve({ schemaVersion: "0.1", intent: old.intent, detectedRegion: "unknown", effectiveRegion: "china_mainland", capturedAt: "2026-10-03T01:00:00Z", durationMs: 1, results: [] });
  await tick(); assert(!document.querySelector(".vua-network__results"), "late reply after unmount does not populate a new panel");
  await choose(1, "china_mainland"); await choose(0, "pico_pcvr"); await click(copy.check); await answer("unknown");
  return checks;
} } });
