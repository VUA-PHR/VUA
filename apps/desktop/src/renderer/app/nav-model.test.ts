import assert from "node:assert/strict";
import { test } from "vitest";
import { strings } from "../i18n/strings.zh-CN.ts";
import { TERMS, termSequence, type TermId } from "../i18n/terms.ts";
import {
  businessModules,
  clicksToReach,
  defaultPage,
  isPageId,
  moduleOf,
  modules,
  NAV_LEVEL_BUFFER_PX,
  navLevelNext,
  resolveTabLanding,
  settingsModule,
  type ModuleDef,
  type SidebarPage,
} from "./nav-model.ts";

const allPages = modules.flatMap((m) => m.groups.flatMap((g) => g.pages));
const allPageIds = allPages.map((p) => p.id);

function pageLabel(page: SidebarPage): string {
  if (page.labelTerms) return termSequence(page.labelTerms);
  if (page.labelKey) return strings.nav.pages[page.labelKey];
  throw new Error(`page without label: ${page.id}`);
}

function moduleLabel(def: ModuleDef): string {
  return strings.nav.tabs[def.labelKey];
}

test("top-level structure is hub plus four goal tabs plus an independent settings section", () => {
  assert.deepEqual(
    businessModules.map((m) => m.id),
    ["home", "env", "guide", "tools", "production"],
  );
  assert.equal(settingsModule.id, "settings");
  assert.deepEqual(
    modules.map((m) => m.id),
    ["home", "env", "guide", "tools", "production", "settings"],
  );
});

test("every feature page is reachable within two clicks", () => {
  for (const page of allPageIds) {
    assert.ok(clicksToReach(page) <= 2, `${page} needs ${clicksToReach(page)} clicks`);
  }
});

test("no forced redirects: tab landing is unconditional, workshop stays workshop", () => {
  // v0.3.3 §2.1:不自动切页;车间阻断由页面内阻断态表达,导航层不再门控
  assert.equal(resolveTabLanding("production"), "warehouse");
  assert.equal(resolveTabLanding("env"), "env-play");
  assert.equal(resolveTabLanding("guide"), "guide-start");
  assert.equal(resolveTabLanding("tools"), "tools-discover");
  assert.equal(resolveTabLanding("settings"), "settings-goals");
  assert.ok(isPageId("workshop"));
  assert.ok(clicksToReach("workshop") <= 2);
});

test("every page belongs to exactly its own module", () => {
  assert.equal(moduleOf("home"), "home");
  assert.equal(moduleOf("env-play"), "env");
  assert.equal(moduleOf("env-create"), "env");
  assert.equal(moduleOf("guide-start"), "guide");
  assert.equal(moduleOf("guide-tutorials"), "guide");
  assert.equal(moduleOf("warehouse"), "production");
  assert.equal(moduleOf("recipe"), "production");
  assert.equal(moduleOf("release"), "production");
  assert.equal(moduleOf("workshop"), "production");
  assert.equal(moduleOf("packages"), "production");
  assert.equal(moduleOf("tools-discover"), "tools");
  assert.equal(moduleOf("tools-installed"), "tools");
  assert.equal(moduleOf("settings-version"), "settings");
  assert.equal(moduleOf("settings-experimental"), "settings");
  assert.equal(moduleOf("settings-goals"), "settings");
});

test("warehouse, workshop and packages are sidebar groups of production, not modules", () => {
  const production = modules.find((m) => m.id === "production");
  assert.deepEqual(
    production?.groups.map((g) => g.labelKey),
    ["warehouse", "workshop", "packages"],
  );
});

test("every page has exactly one label source", () => {
  for (const m of modules) {
    for (const g of m.groups) {
      for (const p of g.pages) {
        assert.notEqual(p.labelKey !== null, p.labelTerms !== undefined, `page ${p.id} label`);
      }
    }
  }
});

test("label keys resolve in the string table and term ids are valid", () => {
  for (const m of modules) {
    assert.ok(m.labelKey in strings.nav.tabs, `tab key ${m.labelKey}`);
    for (const g of m.groups) {
      if (g.labelKey) assert.ok(g.labelKey in strings.nav.groups, `group key ${g.labelKey}`);
      for (const p of g.pages) {
        if (p.labelKey) assert.ok(p.labelKey in strings.nav.pages, `page key ${p.labelKey}`);
        for (const t of p.labelTerms ?? []) {
          assert.ok(t in TERMS, `page ${p.id} term ${t}`);
        }
      }
    }
  }
});

test("sidebar term labels render as term + local annotation", () => {
  const warehouse = allPages.find((p) => p.id === "warehouse");
  assert.equal(warehouse ? pageLabel(warehouse) : "", "Warehouse 仓储");
  const workshop = allPages.find((p) => p.id === "workshop");
  assert.equal(
    workshop ? pageLabel(workshop) : "",
    "Assembly 装配 → Production 生产 → Inspection 检测",
  );
});

test("tab labels come from the string table (hub + four goals + settings)", () => {
  assert.deepEqual(
    modules.map((m) => moduleLabel(m)),
    ["指挥台", "环境部署", "游戏引导", "工具合集", "模型生产", "设置"],
  );
});

test("nav ladder: 间隙不足先藏副标题,真溢出才折叠,回扩带余量", () => {
  // 0 级:间隙低于 TIGHT_GAP(未溢出)先降 1 级
  assert.equal(
    navLevelNext({ level: 0, required: 585, available: 600, subtitleSaving: 120 }),
    1,
  );
  // 0 级:间隙充足保持
  assert.equal(
    navLevelNext({ level: 0, required: 500, available: 600, subtitleSaving: 120 }),
    0,
  );
  // 1 级:真正溢出才折叠到 2
  assert.equal(
    navLevelNext({ level: 1, required: 601, available: 600, subtitleSaving: 120 }),
    2,
  );
  // 1 级:回扩到 0 要求 Tab + 副标题收益 + 余量都排得下
  assert.equal(
    navLevelNext({
      level: 1,
      required: 400,
      available: 400 + 120 + NAV_LEVEL_BUFFER_PX,
      subtitleSaving: 120,
    }),
    0,
  );
  assert.equal(
    navLevelNext({
      level: 1,
      required: 400,
      available: 400 + 120 + NAV_LEVEL_BUFFER_PX - 1,
      subtitleSaving: 120,
    }),
    1,
  );
  // 2 级:回扩到 1 只要求 Tab 加余量排得下
  assert.equal(
    navLevelNext({
      level: 2,
      required: 400,
      available: 400 + NAV_LEVEL_BUFFER_PX,
      subtitleSaving: 120,
    }),
    1,
  );
  assert.equal(
    navLevelNext({
      level: 2,
      required: 400,
      available: 400 + NAV_LEVEL_BUFFER_PX - 1,
      subtitleSaving: 120,
    }),
    2,
  );
});

test("default landing is the hub home page", () => {
  // S-VFX-2:默认落地页由游戏引导概览改为指挥台首页
  assert.equal(defaultPage, "home");
});

test("isPageId rejects unknown and legacy ids", () => {
  assert.ok(isPageId("env-play"));
  assert.ok(!isPageId("deployer-play"));
  assert.ok(!isPageId("nope"));
  assert.ok(!isPageId(null));
});
