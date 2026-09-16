import assert from "node:assert/strict";
import { test } from "vitest";
import { emptyGateway } from "./empty-gateway.ts";
import { fixtureGateway } from "./fixture-gateway.ts";
import type { PackagesPort } from "./packages-port.ts";
import { capabilityDetailKeys, capabilityStates, type CapabilityReport } from "./types.ts";

/**
 * 包管理端口契约测试(S-XVI):fixture / empty 双实现跑同一组用例。
 * 页面只依赖本契约;未来的 live 实现(orchestrator 侧,GitHub issue #25)
 * 必须通过同一契约接入,页面零重写。
 */

function assertCapabilityShape(report: CapabilityReport) {
  assert.ok(
    (capabilityStates as readonly string[]).includes(report.state),
    `unknown capability state: ${report.state}`,
  );
  if (report.detailKey !== undefined) {
    assert.ok(
      (capabilityDetailKeys as readonly string[]).includes(report.detailKey),
      `unknown capability detailKey: ${report.detailKey}`,
    );
  }
}

const implementations: Array<{ label: string; make: () => PackagesPort }> = [
  { label: "fixture(占位)", make: () => fixtureGateway("demo-tasks").packages },
  { label: "empty(not-run)", make: () => emptyGateway().packages },
];

for (const { label, make } of implementations) {
  test(`${label}: 快照带 schemaVersion: 1 且 kind 合法`, async () => {
    const view = await make().snapshot();
    assert.equal(view.schemaVersion, 1);
    assert.ok(view.kind === "not-connected" || view.kind === "ready");
  });

  test(`${label}: capability 形态合法`, async () => {
    assertCapabilityShape(await make().capability());
  });

  test(`${label}: 订阅返回可调用的退订函数`, () => {
    const off = make().subscribe(() => {});
    assert.equal(typeof off, "function");
    off();
  });
}

test("empty: 全部变更入口恒 unavailable,视图恒 not-connected,不编造包清单", async () => {
  const port = emptyGateway().packages;
  const view = await port.snapshot();
  assert.equal(view.kind, "not-connected");
  assert.equal((await port.selectProject("p-1")).kind, "not-connected");
  assert.equal((await port.setRepoEnabled("r-1", false)).kind, "not-connected");
  assert.equal((await port.listInstalled("C:/proj")).kind, "unavailable");
  assert.equal((await port.packageCatalog("C:/proj", "com.example.x")).kind, "unavailable");
  assert.equal((await port.addProject()).kind, "unavailable");
  assert.equal((await port.importLocalPackage()).kind, "unavailable");
  assert.equal(
    (await port.previewChanges([{ kind: "install", packageId: "com.example.x" }])).kind,
    "unavailable",
  );
  assert.equal((await port.applyChanges("preview-1")).kind, "unavailable");
  const capability = await port.capability();
  assert.equal(capability.state, "unavailable");
  assert.equal(capability.detailKey, "packagesEngineMissing");
});

test("fixture(demo-packages): P1 词面恒 unavailable(fixture 不模拟 wire 回执,ready 完整 IA 为其演示面)", async () => {
  const port = fixtureGateway("demo-packages").packages;
  assert.equal((await port.listInstalled("C:/proj")).kind, "unavailable");
});

test("fixture(demo-packages): P2 词面恒 unavailable(025 消费批;同 fixture 纪律不模拟 wire 回执)", async () => {
  const port = fixtureGateway("demo-packages").packages;
  assert.equal(
    (await port.packageCatalog("C:/proj", "com.anatawa12.avatar-optimizer")).kind,
    "unavailable",
  );
});

/* ---- fixture(demo-packages):完整演示态走查 ---- */

test("fixture(demo-packages): ready 视图含项目/包/仓库,无效项目带原因键", async () => {
  const view = await fixtureGateway("demo-packages").packages.snapshot();
  assert.equal(view.schemaVersion, 1);
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") return;
  assert.ok(view.projects.length >= 3);
  assert.ok(view.projects.some((project) => !project.valid && project.invalidReasonKey));
  assert.ok(view.selectedProjectId !== null);
  assert.ok(view.packages.length >= 8);
  // 覆盖:可升级 / 未装 / 本地导入 / yanked 版本 / 不兼容分组
  assert.ok(view.packages.some((row) => row.updateAvailable));
  assert.ok(view.packages.some((row) => row.installedVersion === null));
  assert.ok(view.packages.some((row) => row.source === "local"));
  assert.ok(
    view.packages.some((row) => row.versions.some((entry) => entry.yanked === true)),
  );
  assert.ok(
    view.packages.some((row) => row.versions.some((entry) => !entry.compatible)),
  );
  assert.ok(view.repos.some((repo) => repo.health === "unreachable"));
  assert.ok(view.repos.some((repo) => repo.kind === "official"));
  const capability = await fixtureGateway("demo-packages").packages.capability();
  assert.equal(capability.state, "ready");
});

test("fixture(demo-packages): 升级两阶段——预览分类为大版本升级,应用后落地并广播", async () => {
  const port = fixtureGateway("demo-packages").packages;
  const pushed: number[] = [];
  const off = port.subscribe((view) => {
    if (view.kind === "ready") pushed.push(view.packages.length);
  });
  const previewResult = await port.previewChanges([
    { kind: "update", packageId: "com.example.modular-closet" },
  ]);
  assert.equal(previewResult.kind, "ok");
  if (previewResult.kind !== "ok") return;
  assert.equal(previewResult.preview.items.length, 1);
  assert.equal(previewResult.preview.items[0]?.kind, "majorUpgrade");
  assert.equal(previewResult.preview.destructive, true);
  const applied = await port.applyChanges(previewResult.preview.id);
  assert.equal(applied.kind, "applied");
  if (applied.kind !== "applied" || applied.view.kind !== "ready") return;
  const row = applied.view.packages.find(
    (candidate) => candidate.id === "com.example.modular-closet",
  );
  assert.equal(row?.installedVersion, "2.0.0");
  assert.equal(row?.updateAvailable, false);
  off();
  assert.ok(pushed.length >= 1);
  // 预览一次性:重复应用同一 id 如实失败
  assert.equal((await port.applyChanges(previewResult.preview.id)).kind, "unavailable");
});

test("fixture(demo-packages): 移除换装衣柜触发冲突红名单与 legacy 移除清单", async () => {
  const port = fixtureGateway("demo-packages").packages;
  const result = await port.previewChanges([
    { kind: "remove", packageId: "com.example.modular-closet" },
  ]);
  assert.equal(result.kind, "ok");
  if (result.kind !== "ok") return;
  assert.equal(result.preview.destructive, true);
  assert.ok(result.preview.conflicts.length > 0);
  assert.ok(result.preview.conflicts[0]?.packageIds.includes("com.example.legacy-props"));
  assert.ok(result.preview.legacyRemovals.length > 0);
});

test("fixture(demo-packages): importLocalPackage 首次 added 追加 local 包,重复调用 cancelled", async () => {
  const port = fixtureGateway("demo-packages").packages;
  const added = await port.importLocalPackage();
  assert.equal(added.kind, "added");
  if (added.kind !== "added" || added.view.kind !== "ready") return;
  const localRows = added.view.packages.filter((row) => row.source === "local");
  assert.ok(localRows.length >= 2);
  assert.equal((await port.importLocalPackage()).kind, "cancelled");
});

test("fixture(demo-packages): 降级请求分类为 downgrade 且 destructive", async () => {
  const port = fixtureGateway("demo-packages").packages;
  const result = await port.previewChanges([
    { kind: "update", packageId: "com.example.legacy-props", version: "2.2.1" },
  ]);
  assert.equal(result.kind, "ok");
  if (result.kind !== "ok") return;
  // 2.2.1 即当前版本 → reinstall;再验证真正的降级路径
  assert.equal(result.preview.items[0]?.kind, "reinstall");
  const downgrade = await port.previewChanges([
    { kind: "update", packageId: "com.example.toon-shader", version: "0.9.3" },
  ]);
  assert.equal(downgrade.kind, "ok");
  if (downgrade.kind !== "ok") return;
  assert.equal(downgrade.preview.items[0]?.kind, "downgrade");
  assert.equal(downgrade.preview.destructive, true);
});

test("fixture(demo-packages): setRepoEnabled 启停仓库并广播", async () => {
  const port = fixtureGateway("demo-packages").packages;
  const view = await port.setRepoEnabled("repo-community-b", false);
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") return;
  assert.equal(
    view.repos.find((repo) => repo.id === "repo-community-b")?.enabled,
    false,
  );
});
