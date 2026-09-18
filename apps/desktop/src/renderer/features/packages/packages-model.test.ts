import assert from "node:assert/strict";
import { test } from "vitest";
import type {
  PackageChangePreview,
  PackageProject,
  PackageRow,
} from "../../gateway/index.ts";
import { strings } from "../../i18n/strings.en.ts";
import {
  bulkCapabilities,
  bulkRequests,
  changeKindOrder,
  changeKindTextKeys,
  conflictMessageKey,
  filterPackages,
  groupPreviewItems,
  invalidReasonKey,
  isEmptyPreview,
  looksPrerelease,
  migrationSummaryKey,
  rangeSelect,
  relativeCheckedTime,
  removeEnvelopeErrorKey,
  removeGuardKey,
  repoHealthTextKeys,
  requestForVersion,
  rowStatus,
  sortPackages,
  sortProjects,
  sourceTextKeys,
  versionGroups,
  emptyPackageQuery,
} from "./packages-model.ts";

/**
 * 包管理页模型测试(S-XVI):纯函数行为 + 词表键与 en 源表对齐。
 * 词表对齐用例如有新增 source/health/kind,先扩源表再扩映射,否则此处失败。
 */

function row(partial: Partial<PackageRow> & { id: string }): PackageRow {
  return {
    displayName: partial.id,
    source: "community",
    installedVersion: null,
    latestVersion: null,
    updateAvailable: false,
    versions: [],
    ...partial,
  };
}

function project(partial: Partial<PackageProject> & { id: string }): PackageProject {
  return {
    name: partial.id,
    path: `~/Projects/${partial.id}`,
    valid: true,
    favorite: false,
    ...partial,
  };
}

/* ---- 筛选 / 排序 ---- */

test("filterPackages: 文本命中名称/ID/描述,大小写不敏感", () => {
  const rows = [
    row({ id: "com.example.toon", displayName: "Toon Shader", description: "cel shading" }),
    row({ id: "com.example.closet", displayName: "Modular Closet" }),
    row({ id: "vrchat.avatars", displayName: "SDK", description: "Official base" }),
  ];
  const byName = filterPackages(rows, { ...emptyPackageQuery, text: "toon" });
  assert.deepEqual(byName.map((r) => r.id), ["com.example.toon"]);
  const byId = filterPackages(rows, { ...emptyPackageQuery, text: "VRCHAT" });
  assert.deepEqual(byId.map((r) => r.id), ["vrchat.avatars"]);
  const byDescription = filterPackages(rows, { ...emptyPackageQuery, text: "CEL" });
  assert.deepEqual(byDescription.map((r) => r.id), ["com.example.toon"]);
});

test("filterPackages: 来源筛选与空筛选", () => {
  const rows = [
    row({ id: "a", source: "official" }),
    row({ id: "b", source: "local" }),
  ];
  assert.equal(filterPackages(rows, { ...emptyPackageQuery, source: "local" }).length, 1);
  assert.equal(filterPackages(rows, emptyPackageQuery).length, 2);
});

test("sortPackages: 按显示名字典序且不改变入参数组", () => {
  const rows = [row({ id: "b", displayName: "beta" }), row({ id: "a", displayName: "Alpha" })];
  const sorted = sortPackages(rows);
  assert.deepEqual(sorted.map((r) => r.id), ["a", "b"]);
  assert.deepEqual(rows.map((r) => r.id), ["b", "a"]);
});

test("sortProjects: 收藏置顶,其余按名称", () => {
  const projects = [
    project({ id: "p1", name: "Zulu" }),
    project({ id: "p2", name: "Beta", favorite: true }),
    project({ id: "p3", name: "Alpha" }),
  ];
  assert.deepEqual(sortProjects(projects).map((p) => p.id), ["p2", "p3", "p1"]);
});

/* ---- 版本分组与预发布开关 ---- */

test("versionGroups: 不兼容版本归入分隔线下方,预发布默认隐藏", () => {
  const target = row({
    id: "x",
    versions: [
      { version: "3.2.0-beta.1", compatible: true },
      { version: "3.1.0", compatible: true },
      { version: "3.0.0", compatible: false },
    ],
  });
  const hidden = versionGroups(target, false);
  assert.deepEqual(hidden.compatible.map((v) => v.version), ["3.1.0"]);
  assert.deepEqual(hidden.incompatible.map((v) => v.version), ["3.0.0"]);
  const shown = versionGroups(target, true);
  assert.deepEqual(shown.compatible.map((v) => v.version), ["3.2.0-beta.1", "3.1.0"]);
});

test("looksPrerelease: 仅 semver 预发布形状,不误伤正式版", () => {
  assert.equal(looksPrerelease("3.2.0-beta.1"), true);
  assert.equal(looksPrerelease("3.2.0"), false);
  assert.equal(looksPrerelease("0.9.4"), false);
});

/* ---- 行状态(消费端口事实,不比较版本号) ---- */

test("rowStatus: 未安装 / 可升级 / 已是最新", () => {
  assert.equal(rowStatus(row({ id: "a" })), "notInstalled");
  assert.equal(
    rowStatus(row({ id: "b", installedVersion: "1.0.0", updateAvailable: true })),
    "updateAvailable",
  );
  assert.equal(
    rowStatus(row({ id: "c", installedVersion: "1.0.0", updateAvailable: false })),
    "upToDate",
  );
});

/* ---- 批量能力交集与请求聚合 ---- */

test("bulkCapabilities: 只取选中集交集;空集全否", () => {
  assert.deepEqual(bulkCapabilities([]), {
    updateAll: false,
    installAll: false,
    removeAll: false,
  });
  const mixed = [
    row({ id: "a", installedVersion: "1.0.0", updateAvailable: true }),
    row({ id: "b" }),
  ];
  assert.deepEqual(bulkCapabilities(mixed), {
    updateAll: false,
    installAll: false,
    removeAll: false,
  });
  const upgradable = [
    row({ id: "a", installedVersion: "1.0.0", updateAvailable: true }),
    row({ id: "b", installedVersion: "0.9.0", updateAvailable: true }),
  ];
  assert.deepEqual(bulkCapabilities(upgradable), {
    updateAll: true,
    installAll: false,
    removeAll: true,
  });
});

test("bulkRequests: 全部升级合并为一条 bulk-update-latest", () => {
  const rows = [
    row({ id: "a", installedVersion: "1.0.0", updateAvailable: true }),
    row({ id: "b", installedVersion: "0.9.0", updateAvailable: true }),
  ];
  assert.deepEqual(bulkRequests("updateAll", rows), [
    { kind: "bulk-update-latest", packageIds: ["a", "b"] },
  ]);
  assert.deepEqual(bulkRequests("removeAll", rows), [
    { kind: "remove", packageId: "a" },
    { kind: "remove", packageId: "b" },
  ]);
  const notInstalled = [row({ id: "c" })];
  assert.deepEqual(bulkRequests("installAll", notInstalled), [
    { kind: "install", packageId: "c" },
  ]);
});

test("requestForVersion: 未安装 → install,已安装 → update", () => {
  assert.deepEqual(requestForVersion(row({ id: "a" }), "2.0.0"), {
    kind: "install",
    packageId: "a",
    version: "2.0.0",
  });
  assert.deepEqual(requestForVersion(row({ id: "a", installedVersion: "1.0.0" }), "2.0.0"), {
    kind: "update",
    packageId: "a",
    version: "2.0.0",
  });
});

/* ---- Shift 范围选 ---- */

test("rangeSelect: 正向/反向范围,anchor 失效退化单选", () => {
  const ids = ["a", "b", "c", "d"];
  assert.deepEqual(rangeSelect(ids, "a", "c"), ["a", "b", "c"]);
  assert.deepEqual(rangeSelect(ids, "d", "b"), ["b", "c", "d"]);
  assert.deepEqual(rangeSelect(ids, null, "b"), ["b"]);
  assert.deepEqual(rangeSelect(ids, "gone", "b"), ["b"]);
  assert.deepEqual(rangeSelect(ids, "a", "gone"), []);
});

/* ---- 变更预览分组与空预览 ---- */

test("groupPreviewItems: 固定顺序,空组省略", () => {
  const preview: PackageChangePreview = {
    id: "p1",
    items: [
      { kind: "remove", packageId: "a", displayName: "A", fromVersion: "1.0.0" },
      { kind: "install", packageId: "b", displayName: "B", toVersion: "2.0.0" },
      { kind: "majorUpgrade", packageId: "c", displayName: "C", fromVersion: "1.0.0", toVersion: "2.0.0" },
    ],
    conflicts: [],
    legacyRemovals: [],
    destructive: true,
  };
  assert.deepEqual(
    groupPreviewItems(preview.items).map((group) => group.kind),
    ["install", "majorUpgrade", "remove"],
  );
  assert.equal(isEmptyPreview(preview), false);
  assert.equal(
    isEmptyPreview({ id: "p2", items: [], conflicts: [], legacyRemovals: [], destructive: false }),
    true,
  );
  // 固定顺序覆盖全部种类
  assert.deepEqual(changeKindOrder, [
    "install",
    "majorUpgrade",
    "upgrade",
    "downgrade",
    "remove",
    "reinstall",
  ]);
});

/* ---- 词表键与 en 源表对齐 ---- */

test("词表映射:source/health/changeKind 键全部存在于源表", () => {
  for (const key of Object.values(sourceTextKeys)) {
    assert.ok(key in strings.packages.sources, `sources.${key} 缺失`);
  }
  for (const key of Object.values(repoHealthTextKeys)) {
    assert.ok(key in strings.packages.repos.health, `repos.health.${key} 缺失`);
  }
  for (const key of Object.values(changeKindTextKeys)) {
    assert.ok(key in strings.packages.changes.kinds, `changes.kinds.${key} 缺失`);
  }
});

test("词表回落:未知原因/迁移/冲突键不猜测", () => {
  assert.equal(invalidReasonKey("folderMissing"), "folderMissing");
  assert.equal(invalidReasonKey("somethingElse"), "unknown");
  assert.equal(invalidReasonKey(undefined), "unknown");
  assert.equal(migrationSummaryKey("vpmProject"), "vpmProject");
  assert.equal(migrationSummaryKey("unity2022"), null);
  assert.equal(conflictMessageKey("requiredBy"), "requiredBy");
  assert.equal(conflictMessageKey("other"), "unknown");
  // 回落键本身必须存在于源表
  assert.ok("unknown" in strings.packages.projects.invalidReasons);
  assert.ok("unknown" in strings.packages.changes.conflicts);
  assert.ok("vpmProject" in strings.packages.migration.summaries);
});

  test("removeGuardKey maps the frozen three-value closed set and falls back to unknown (026 A1)", () => {
    assert.equal(removeGuardKey("preview_drift"), "preview_drift");
    assert.equal(removeGuardKey("package_not_found"), "package_not_found");
    assert.equal(removeGuardKey("execution_failed"), "execution_failed");
    // 词外 guard:诚实回落 unknown,不猜测
    assert.equal(removeGuardKey("plan_drift"), "unknown");
    assert.equal(removeGuardKey(""), "unknown");
  });

  test("removeGuardKey unknown falls back maps to the i18n guards table without inventing words", () => {
    // 四语 guards 表含恰四键(三码 + unknown),映射键闭集与 i18n 同步
    const guards = strings.packages.remove.guards;
    for (const key of ["preview_drift", "package_not_found", "execution_failed", "unknown"] as const) {
      assert.equal(typeof guards[key], "string");
      assert.ok(guards[key].length > 0);
    }
  });

  test("removeEnvelopeErrorKey maps the declared reused codes and falls back to unknown", () => {
    assert.equal(removeEnvelopeErrorKey("vua.project.project_not_found"), "projectNotFound");
    assert.equal(removeEnvelopeErrorKey("vua.packages.package_not_found"), "packageNotFound");
    assert.equal(removeEnvelopeErrorKey("vua.vpm.capability_missing"), "capabilityMissing");
    assert.equal(removeEnvelopeErrorKey("vua.packages.invalid_params"), "invalidParams");
    // 词外码(vua.vpm.* 端口族透传/任务 error.code)回落 unknown 原词插值
    assert.equal(removeEnvelopeErrorKey("vua.vpm.preview_drift"), "unknown");
    assert.equal(removeEnvelopeErrorKey("packages_task_not_succeeded"), "unknown");
  });

/* ---- 相对时间 ---- */

test("relativeCheckedTime: 分钟/小时/天分档,非法与未来时间回落 null", () => {
  const now = Date.parse("2026-08-26T12:00:00.000Z");
  assert.deepEqual(relativeCheckedTime("2026-08-26T11:59:40.000Z", now), {
    key: "checkedJustNow",
    count: 0,
  });
  assert.deepEqual(relativeCheckedTime("2026-08-26T11:30:00.000Z", now), {
    key: "checkedMinutesAgo",
    count: 30,
  });
  assert.deepEqual(relativeCheckedTime("2026-08-26T06:00:00.000Z", now), {
    key: "checkedHoursAgo",
    count: 6,
  });
  assert.deepEqual(relativeCheckedTime("2026-08-18T14:05:00.000Z", now), {
    key: "checkedDaysAgo",
    count: 7,
  });
  assert.equal(relativeCheckedTime(undefined, now), null);
  assert.equal(relativeCheckedTime("not-a-date", now), null);
  assert.equal(relativeCheckedTime("2026-08-27T00:00:00.000Z", now), null);
});
