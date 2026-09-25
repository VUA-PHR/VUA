// 顶栏占用查看器 DOM 回归夹具(第 182 批反向审查批,对象 cae84388 五项 UX
// 裁决):合成 system 宿主,零生产/远程服务。钉死六面:
// ①无宿主诚实缺席(整条不出现,不挂占位);②宿主在场读数/弹层 RAM+VRAM
// 词面与 aria;③四条关闭路径(Esc/外击/×/失焦);④VRAM 采集不可用诚实
// 「不可用」词面;⑤单拍失败保留上一帧;⑥首拍即败诚实缺席,不猜造。
// 另提供 lifecycleCycles() 供跑具做开合循环——弹层 blur 监听的「真实注册
// 数」在页面内不可观测(add/remove 调用计数两版本对称,数不出引用失配),
// 该钉由跑具经 CDP DOMDebugger.getEventListeners 取地面真值断言。
// 真机 Chromium DOM 为准,不宣称端到端。
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ResourceMonitor } from "../../src/renderer/features/resource-monitor/ResourceMonitor.tsx";
import { strings } from "../../src/renderer/i18n/index.ts";
import type { SystemResourceUsageV1 } from "@vua/contracts";

const root = createRoot(document.getElementById("root")!);
const wait = (ms = 40) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const results: string[] = [];
function check(ok: unknown, name: string) {
  if (!ok) throw new Error(name);
  results.push(name);
}

/* ---- 合成 system 宿主:载荷由 mode 切换(full / ram-only / fail) ---- */
const GIB = 1024 ** 3;
type UsageMode = "full" | "ram-only" | "fail";
let usageMode: UsageMode = "full";
let pollFailures = 0;
function snapshot(): SystemResourceUsageV1 {
  return {
    schemaVersion: 1,
    ramUsedBytes: 24 * GIB,
    ramTotalBytes: 50 * GIB,
    vramUsedBytes: usageMode === "ram-only" ? null : 5.5 * GIB,
    vramTotalBytes: usageMode === "ram-only" ? null : 34 * GIB,
    sampledAt: new Date().toISOString(),
  };
}
function installSystemHost(): void {
  (window as any).vua = {
    system: {
      readResourceUsage: async () => {
        if (usageMode === "fail") {
          pollFailures += 1;
          throw new Error("synthetic transport failure");
        }
        return snapshot();
      },
    },
  };
}

/* ---- 宿主:key 变更强制重挂(轮询 effect 仅在挂载时读宿主) ---- */
function Harness() {
  const [gen, setGen] = useState(0);
  (window as any).__remount = () => setGen((g) => g + 1);
  return (
    <StrictMode>
      <ResourceMonitor key={gen} />
    </StrictMode>
  );
}

function toggle(): HTMLButtonElement {
  const found = document.querySelector<HTMLButtonElement>(".vua-shell__usage");
  if (!found) throw new Error("usage indicator button missing");
  return found;
}
function indicatorAbsent(): boolean {
  return document.querySelector(".vua-shell__usage") === null;
}
function panel(): ParentNode | null {
  return document.querySelector(".vua-usage-panel");
}
async function key(value: string) {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }),
  );
  await wait();
}
const copy = strings.resourceMonitor;
const sampledPrefix = copy.sampledAt.split("{time}")[0].trim();

/* ---- ①无宿主诚实缺席:桩未装,轮询不挂,整条不出现 ---- */
async function hostAbsentHonestAbsence() {
  check(indicatorAbsent(), "无宿主时指示器整条缺席(不渲染占位假陈述)");
}

/* ---- ②宿主在场:读数=RAM/VRAM 取高,弹层双行词面＋aria ---- */
async function indicatorAndPanelFullFace() {
  installSystemHost();
  (window as any).__remount();
  await wait();
  const button = toggle();
  check(button.textContent?.includes("48%"), "顶栏读数=RAM 48%/VRAM 16% 取高=48%");
  check(button.getAttribute("aria-expanded") === "false", "初始 aria-expanded=false");
  button.click();
  await wait();
  const layer = panel();
  check(layer !== null, "点击展开详情弹层(portal 至 body)");
  check(button.getAttribute("aria-expanded") === "true", "展开后 aria-expanded=true");
  const text = layer!.textContent ?? "";
  check(text.includes(copy.title), "弹层标题词面在场");
  check(text.includes(copy.ram), "RAM 行标签在场");
  check(text.includes(copy.vram), "VRAM 行标签在场");
  check(layer!.querySelectorAll('[role="meter"]').length === 2, "RAM/VRAM 双 meter 语义在场");
  check(text.includes("24.0 / 50.0 GB"), "RAM 字节读数 GiB 口径");
  check(text.includes("5.5 / 34.0 GB"), "VRAM 字节读数 GiB 口径");
  check(text.includes("48%") && text.includes("16%"), "双行百分比读数在场");
  check(text.includes(sampledPrefix), "采样时刻词面在场(诚实时间戳)");
}

/* ---- ③四条关闭路径 ---- */
async function closePaths() {
  // Esc
  await key("Escape");
  await wait();
  check(panel() === null, "Esc 关闭弹层");
  check(toggle().getAttribute("aria-expanded") === "false", "Esc 后 aria-expanded 复位");
  // 外击
  toggle().click();
  await wait();
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  await wait();
  check(panel() === null, "弹层外点击关闭");
  // × 按钮
  toggle().click();
  await wait();
  const close = document.querySelector<HTMLButtonElement>(".vua-usage-panel__close");
  check(close !== null, "× 关闭按钮在场");
  check(close!.getAttribute("aria-label") === copy.closeAria, "× 按钮具名(aria-label)");
  close!.click();
  await wait();
  check(panel() === null, "× 关闭弹层");
  // 失焦
  toggle().click();
  await wait();
  check(panel() !== null, "失焦场景前置:弹层已开");
  window.dispatchEvent(new Event("blur"));
  await wait();
  check(panel() === null, "窗口失焦关闭弹层");
}

/* ---- ④开合循环(无断言;真实注册数由跑具 CDP 断言) ---- */
async function lifecycleCycles() {
  for (let cycle = 0; cycle < 3; cycle += 1) {
    toggle().click();
    await wait();
    toggle().click();
    await wait();
  }
}

/* ---- ⑤VRAM 不可用诚实词面 ---- */
async function vramUnavailableHonestFace() {
  usageMode = "ram-only";
  (window as any).__remount();
  await wait();
  check(toggle().textContent?.includes("48%"), "VRAM 缺席时顶栏读数退化为 RAM(不猜值)");
  toggle().click();
  await wait();
  const text = panel()?.textContent ?? "";
  check(text.includes(copy.vramUnavailable), "VRAM 采集不可用如实呈现「不可用」词面");
  check(!text.includes("16%"), "不可用时不渲染 VRAM 百分比(不编造读数)");
  await key("Escape");
  await wait();
  check(panel() === null, "不可用场景收尾:弹层已关");
}

/* ---- ⑥a 单拍失败保留上一帧(不重挂:实例已有上一拍成功帧) ---- */
async function singlePollFailureRetainsFrame() {
  usageMode = "fail";
  await wait(2_300);
  check(pollFailures >= 1, "至少经历一拍合成失败");
  check(toggle().textContent?.includes("48%"), "单拍失败保留上一帧(不猜造新读数、不整条消失)");
}

/* ---- ⑥b 首拍即败:重挂后无任何成功帧 → 诚实缺席 ---- */
async function firstPollFailureHonestAbsence() {
  (window as any).__remount();
  await wait();
  await wait(2_300);
  check(
    indicatorAbsent(),
    "首拍未回即诚实缺席(无宿主同形:整条不出现,不渲染假读数)",
  );
  usageMode = "full";
}

// base/failureFaces 各返回「本阶段新增」快照:results 系模块级累计数组,
// 直接返回同一引用会让跑具把 base 阶段断言双计(集成第 200 批勘误:
// 「50」系计数伪影,唯一断言 29=21 行为+1 CDP+7 失败面)。
window.resourceMonitorSmoke = {
  base: async () => {
    const start = results.length;
    root.render(<Harness />);
    await wait();
    await hostAbsentHonestAbsence();
    await indicatorAndPanelFullFace();
    await closePaths();
    return results.slice(start);
  },
  lifecycleCycles,
  failureFaces: async () => {
    const start = results.length;
    await vramUnavailableHonestFace();
    await singlePollFailureRetainsFrame();
    await firstPollFailureHonestAbsence();
    return results.slice(start);
  },
  run: async () => {
    const base = await window.resourceMonitorSmoke.base();
    await lifecycleCycles();
    const faces = await window.resourceMonitorSmoke.failureFaces();
    return [...base, ...faces];
  },
};
