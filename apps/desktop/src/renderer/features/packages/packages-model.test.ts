import assert from "node:assert/strict";
import { test } from "vitest";
import type {
  PackageChangePreview,
  PackageProject,
  PackageRow,
  RepoCatalogPackageRowV01,
} from "../../gateway/index.ts";
import { strings } from "../../i18n/strings.en.ts";
import {
  bulkCapabilities,
  bulkRequests,
  changeKindOrder,
  changeKindTextKeys,
  conflictMessageKey,
  installedUpdateCellState,
  filterPackages,
  filterRepoCatalogPackages,
  groupPreviewItems,
  installLatestRequests,
  invalidReasonKey,
  isEmptyPreview,
  looksPrerelease,
  migrationSummaryKey,
  rangeSelect,
  relativeCheckedTime,
  createEnvelopeErrorKey,
  createRefusalDetailKey,
  installEnvelopeErrorKey,
  registerEnvelopeErrorKey,
  removeEnvelopeErrorKey,
  removeGuardKey,
  repoEnvelopeErrorKey,
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

/* ---- A2 批量多选安装(C 面自决,026 v0.2 消费面) ---- */

test("installLatestRequests: 批量行 = version null 解析器语义(钉法),行序保持,空选择空数组", () => {
  // 每行 version null = 解析器选最新稳定版(「安装/升级到最新」批量语义,
  // 与单包「安装最新」入口同语义;A2 词面不立 upgrade 动词)
  assert.deepEqual(installLatestRequests(["a", "b"]), [
    { packageId: "a", version: null },
    { packageId: "b", version: null },
  ]);
  // 行序保持给定顺序(已装表行序 = 服务端 packageId 升序,客户端不重排)
  assert.deepEqual(
    installLatestRequests(["z", "m", "a"]).map((row) => row.packageId),
    ["z", "m", "a"],
  );
  // 空选择 = 空数组(调用方拒发空请求——词面 minItems 1,UI 不构造违例请求)
  assert.deepEqual(installLatestRequests([]), []);
  // 无钉版本行:批量面不携带 string 版本(钉版本粒度保留目录面板单包入口)
  for (const row of installLatestRequests(["a", "b"])) {
    assert.equal(row.version, null);
  }
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

  test("installEnvelopeErrorKey maps the declared v0.2 codes incl the new preview_failed and falls back to unknown (026 A2)", () => {
    assert.equal(installEnvelopeErrorKey("vua.project.project_not_found"), "projectNotFound");
    assert.equal(installEnvelopeErrorKey("vua.packages.package_not_found"), "packageNotFound");
    assert.equal(installEnvelopeErrorKey("vua.vpm.capability_missing"), "capabilityMissing");
    assert.equal(installEnvelopeErrorKey("vua.packages.invalid_params"), "invalidParams");
    // A2 信封新码:预览/查询段失败
    assert.equal(installEnvelopeErrorKey("vua.packages.preview_failed"), "previewFailed");
    // 词外码(vua.vpm.* 端口族透传/任务 error.code)回落 unknown 原词插值
    assert.equal(installEnvelopeErrorKey("vua.vpm.preview_drift"), "unknown");
    assert.equal(installEnvelopeErrorKey("vua.packages.apply_failed"), "unknown");
    assert.equal(installEnvelopeErrorKey("packages_task_not_succeeded"), "unknown");
  });

  test("install guard copy mirrors the shared three-value closed set in the i18n install section (026 A2)", () => {
    // 四语 install.guards 表含恰四键(A1 复用守卫三码 + unknown),映射键
    // 闭集与 i18n 同步
    const guards = strings.packages.install.guards;
    for (const key of ["preview_drift", "package_not_found", "execution_failed", "unknown"] as const) {
      assert.equal(typeof guards[key], "string");
      assert.ok(guards[key].length > 0);
    }
    const envelopeErrors = strings.packages.install.envelopeErrors;
    for (const key of ["projectNotFound", "packageNotFound", "capabilityMissing", "invalidParams", "previewFailed", "unknown"] as const) {
      assert.equal(typeof envelopeErrors[key], "string");
      assert.ok(envelopeErrors[key].length > 0);
    }
  });

  test("registerEnvelopeErrorKey maps the declared v0.3 codes and falls back to unknown; the register i18n section mirrors the keys (026 A3)", () => {
    // v0.3 已申报面:能力门控在路由层答(访问器未翻转,绝不进任务)+
    // 请求形状违规。A3 无注册项目检查(project_not_found 不适用)且无
    // preview 段(preview_failed 不存在),两码如实缺席闭集
    assert.equal(registerEnvelopeErrorKey("vua.vpm.capability_missing"), "capabilityMissing");
    assert.equal(registerEnvelopeErrorKey("vua.packages.invalid_params"), "invalidParams");
    assert.equal(registerEnvelopeErrorKey("vua.project.project_not_found"), "unknown");
    assert.equal(registerEnvelopeErrorKey("vua.packages.preview_failed"), "unknown");
    // 词外码(vua.vpm.local_package_invalid / local_package_register_failed
    // 端口族透传/任务 error.code)回落 unknown 原词插值
    assert.equal(registerEnvelopeErrorKey("vua.vpm.local_package_invalid"), "unknown");
    assert.equal(registerEnvelopeErrorKey("packages_task_not_succeeded"), "unknown");
    const guards = strings.packages.register.guards;
    for (const key of ["preview_drift", "package_not_found", "execution_failed", "unknown"] as const) {
      assert.equal(typeof guards[key], "string");
      assert.ok(guards[key].length > 0);
    }
    const envelopeErrors = strings.packages.register.envelopeErrors;
    for (const key of ["capabilityMissing", "invalidParams", "unknown"] as const) {
      assert.equal(typeof envelopeErrors[key], "string");
      assert.ok(envelopeErrors[key].length > 0);
    }
  });

  test("repoEnvelopeErrorKey maps the declared v0.4 codes and falls back to unknown; the repoWrite i18n section mirrors the keys (026 A4)", () => {
    // v0.4 已申报面(接线批落地面):能力门控在路由层按方法作答(三独立
    // 位未声明的方法绝不进任务)+ 请求形状违规
    assert.equal(repoEnvelopeErrorKey("vua.vpm.capability_missing"), "capabilityMissing");
    assert.equal(repoEnvelopeErrorKey("vua.packages.invalid_params"), "invalidParams");
    // 「预览语义不存在」负例:本面照 A3 同律破 preview/apply 对偶——
    // preview_failed 不在闭集,project_not_found 亦不适用(订阅面无项目
    // 身份),两码如实缺席
    assert.equal(repoEnvelopeErrorKey("vua.packages.preview_failed"), "unknown");
    assert.equal(repoEnvelopeErrorKey("vua.project.project_not_found"), "unknown");
    // 词外码(端口四码 vua.vpm.repo_invalid/repo_not_found/
    // repo_fetch_failed/repo_write_failed 全折 execution_failed 的
    // rejected 臂不经此映射;任务 error.code 原词)回落 unknown 原词插值
    assert.equal(repoEnvelopeErrorKey("vua.vpm.repo_invalid"), "unknown");
    assert.equal(repoEnvelopeErrorKey("vua.vpm.repo_not_found"), "unknown");
    assert.equal(repoEnvelopeErrorKey("packages_task_not_succeeded"), "unknown");
    const guards = strings.packages.repoWrite.guards;
    for (const key of ["preview_drift", "package_not_found", "execution_failed", "unknown"] as const) {
      assert.equal(typeof guards[key], "string");
      assert.ok(guards[key].length > 0);
    }
    const envelopeErrors = strings.packages.repoWrite.envelopeErrors;
    for (const key of ["capabilityMissing", "invalidParams", "unknown"] as const) {
      assert.equal(typeof envelopeErrors[key], "string");
      assert.ok(envelopeErrors[key].length > 0);
    }
  });

  test("createEnvelopeErrorKey maps the declared v0.5 envelope codes and falls back to unknown; createRefusalDetailKey detects the four library-leg refusal keys and falls back to unknown; the create i18n section mirrors the keys (026 A5)", () => {
    // v0.5 已申报面(接线批落地面):能力门控在路由层作答(create 位假绝
    // 不进任务)+ 请求形状违规
    assert.equal(createEnvelopeErrorKey("vua.vpm.capability_missing"), "capabilityMissing");
    assert.equal(createEnvelopeErrorKey("vua.packages.invalid_params"), "invalidParams");
    // 负例如实缺席:创建不寻址任何在册项目(project_not_found 复用不适
    // 用)、本面照 A3/A4 同律破 preview/apply 对偶(preview_failed 不存在);
    // 端口三码(template_missing/apply_failed/backend_unavailable)全折
    // execution_failed 的 rejected 臂不经此映射;任务 error.code 原词回落
    assert.equal(createEnvelopeErrorKey("vua.project.project_not_found"), "unknown");
    assert.equal(createEnvelopeErrorKey("vua.packages.preview_failed"), "unknown");
    assert.equal(createEnvelopeErrorKey("vua.vpm.template_missing"), "unknown");
    assert.equal(createEnvelopeErrorKey("vua.vpm.apply_failed"), "unknown");
    assert.equal(createEnvelopeErrorKey("vua.vpm.backend_unavailable"), "unknown");
    assert.equal(createEnvelopeErrorKey("packages_task_not_succeeded"), "unknown");
    // 拒绝 detail 原码检测:库路径四拒绝腿(词面包含关系,不改写不截断)
    assert.equal(
      createRefusalDetailKey("errors.vpm.projectExists: the target path already exists"),
      "projectExists",
    );
    assert.equal(
      createRefusalDetailKey("errors.vpm.projectNameInvalid: the name carries a forbidden character"),
      "projectNameInvalid",
    );
    assert.equal(
      createRefusalDetailKey("errors.vpm.templateMissing: no template directory named Avatar"),
      "templateMissing",
    );
    assert.equal(
      createRefusalDetailKey("errors.vpm.templateCopyFailed: the template copy failed"),
      "templateCopyFailed",
    );
    // CLI 腿(apply_failed/backend_unavailable)与词外 detail 无四键语义,
    // 如实回落 unknown(guard 文案 + detail 原词呈现,绝不猜测)
    assert.equal(createRefusalDetailKey("vua.vpm.apply_failed: exit code 1"), "unknown");
    assert.equal(createRefusalDetailKey("vua.vpm.backend_unavailable: runner gone"), "unknown");
    assert.equal(createRefusalDetailKey(""), "unknown");
    // i18n 镜像:refusals 四键 / guards 四值 / envelopeErrors 三键全非空
    const refusals = strings.packages.create.refusals;
    for (const key of ["projectExists", "projectNameInvalid", "templateMissing", "templateCopyFailed"] as const) {
      assert.equal(typeof refusals[key], "string");
      assert.ok(refusals[key].length > 0);
    }
    const guards = strings.packages.create.guards;
    for (const key of ["preview_drift", "package_not_found", "execution_failed", "unknown"] as const) {
      assert.equal(typeof guards[key], "string");
      assert.ok(guards[key].length > 0);
    }
    const envelopeErrors = strings.packages.create.envelopeErrors;
    for (const key of ["capabilityMissing", "invalidParams", "unknown"] as const) {
      assert.equal(typeof envelopeErrors[key], "string");
      assert.ok(envelopeErrors[key].length > 0);
    }
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

test("filterRepoCatalogPackages matches packageId and displayName (null display falls back to packageId), empty query returns everything verbatim", () => {
  const rows: RepoCatalogPackageRowV01[] = [
    {
      packageId: "com.anatawa12.avatar-optimizer",
      displayName: "Avatar Optimizer",
      description: null,
      latestVersion: "1.9.0",
      versionCount: 7,
    },
    {
      packageId: "com.example.legacy",
      displayName: null,
      description: null,
      latestVersion: null,
      versionCount: 2,
    },
  ];
  // 空查询 = 全量照实返回(同源数组拷贝,不重排)
  assert.deepEqual(filterRepoCatalogPackages(rows, ""), rows);
  assert.deepEqual(filterRepoCatalogPackages(rows, "   "), rows);
  // packageId 子串命中(大小写不敏感)
  assert.deepEqual(filterRepoCatalogPackages(rows, "AVATAR-OPT"), [rows[0]]);
  // displayName 命中
  assert.deepEqual(filterRepoCatalogPackages(rows, "optimizer"), [rows[0]]);
  // displayName null 以 packageId 兼任匹配(与呈现规则一致)
  assert.deepEqual(filterRepoCatalogPackages(rows, "legacy"), [rows[1]]);
  // 无命中 = 诚实空数组
  assert.deepEqual(filterRepoCatalogPackages(rows, "no-such-package"), []);
});

// 027 F3 消费批:「可更新」列三态呈现选择(纯函数四臂;行 = 冻结词面形状)
const V01_ROW = { packageId: "com.a", version: "1.0.0", dependencies: [] };
const V02_ROW = { ...V01_ROW, latestVersion: "1.1.0", updateAvailable: true };
test("installedUpdateCellState: v0.1 row without the judgment pair stays honestly absent", () => {
  assert.equal(installedUpdateCellState(V01_ROW), "absent");
});
test("installedUpdateCellState: null = judgment not executed, never already-latest", () => {
  assert.equal(installedUpdateCellState({ ...V02_ROW, updateAvailable: null }), "notExecuted");
});
test("installedUpdateCellState: false = precise none-under-filter semantics", () => {
  assert.equal(installedUpdateCellState({ ...V02_ROW, updateAvailable: false }), "noneUnderFilter");
});
test("installedUpdateCellState: true = available with inline update key", () => {
  assert.equal(installedUpdateCellState({ ...V02_ROW, updateAvailable: true }), "available");
});
