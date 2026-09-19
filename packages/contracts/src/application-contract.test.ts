import { describe, expect, it } from "vitest";
import {
  APPLICATION_CONTRACT_VERSION,
  EDITOR_REFUSAL_CODES_V01,
  ENVIRONMENT_VERIFY_UNAVAILABLE,
  isApplicationRequestV01,
  isReleaseHandoffFactV01,
  isTerminalTaskStateV01,
  RELEASE_HANDOFF_ERROR_CODES_V01,
  type CatalogProductDetailV03,
  type EditorVerifyRefusedV01,
  type EnvironmentVerifyEditorResultV01,
  type InspectionEvidenceDocumentV01,
  type PackagesInstalledItemV02,
  type PackagesListInstalledResultV02,
  type InspectionGetResultV01,
  type InspectionListResultV01,
  type OverlaySnapshotResultV01,
  type ReleaseHandoffFactV01,
  type TaskDonePayloadV01,
  type TaskSnapshotV01,
} from "./application-contract.js";

describe("application contract v0.1", () => {
  it("accepts only the explicit B1 query and command shapes", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-1",
      correlationId: "correlation-1",
      kind: "query",
      method: "application.getSnapshot",
      params: {},
    })).toBe(true);

    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-2",
      correlationId: "correlation-2",
      commandId: "cancel-1",
      kind: "command",
      method: "task.requestCancellation",
      params: { taskId: "task-1", observedRevision: 8 },
    })).toBe(true);
  });

  it("rejects unknown versions, methods, extra authority, and mixed kinds", () => {
    const base = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-1",
      correlationId: "correlation-1",
      kind: "query",
      method: "task.get",
      params: { taskId: "task-1" },
    };
    expect(isApplicationRequestV01({ ...base, contractVersion: "1.0" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, method: "shell.execute" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, executable: "powershell.exe" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, kind: "command", commandId: "command-1" })).toBe(false);
  });

  it("accepts the F2 environment snapshot query and demo task command", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-3",
      correlationId: "correlation-3",
      kind: "query",
      method: "environment.getSnapshot",
      params: {},
    })).toBe(true);

    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-4",
      correlationId: "correlation-4",
      commandId: "demo-1",
      kind: "command",
      method: "task.startDemo",
      params: {},
    })).toBe(true);
  });

  it("rejects F2 shapes with wrong kind, extra params, or bad identifiers", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-5",
      correlationId: "correlation-5",
      kind: "command",
      method: "environment.getSnapshot",
      params: {},
    })).toBe(false);
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-6",
      correlationId: "correlation-6",
      kind: "query",
      method: "environment.getSnapshot",
      params: { zone: "play" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-7",
      correlationId: "correlation-7",
      commandId: "",
      kind: "command",
      method: "task.startDemo",
      params: {},
    })).toBe(false);
  });

  it("treats only the four committed outcomes as terminal", () => {
    expect(isTerminalTaskStateV01("running")).toBe(false);
    expect(isTerminalTaskStateV01("waiting_for_input")).toBe(false);
    expect(isTerminalTaskStateV01("succeeded")).toBe(true);
    expect(isTerminalTaskStateV01("succeeded_with_warnings")).toBe(true);
    expect(isTerminalTaskStateV01("failed")).toBe(true);
    expect(isTerminalTaskStateV01("cancelled")).toBe(true);
  });
});

describe("bdl-queries v0.2 application surface", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "request-bdl",
    correlationId: "correlation-bdl",
    kind: "query",
  } as const;

  it("accepts the five read-only BDL queries within their closed sets", () => {
    expect(isApplicationRequestV01({ ...base, method: "catalog.list", params: {} })).toBe(true);
    expect(isApplicationRequestV01({
      ...base,
      method: "catalog.list",
      params: { text: "uniform", availabilityStatus: "unknown", limit: 100, offset: 50 },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, method: "catalog.detail", params: { productId: "booth:1000001" },
    })).toBe(true);
    expect(isApplicationRequestV01({ ...base, method: "catalog.status", params: {} })).toBe(true);
    expect(isApplicationRequestV01({ ...base, method: "warehouse.listEntries", params: {} })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, method: "warehouse.entryDetail", params: { warehouseItemId: "wh-entry-1" },
    })).toBe(true);
  });

  it("rejects entity filters, raw-word filters, and malformed identities", () => {
    expect(isApplicationRequestV01({
      ...base, method: "catalog.list", params: { entityType: "avatar" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "catalog.list", params: { availabilityStatus: "InStock" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "catalog.list", params: { limit: 201 },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "catalog.detail", params: { productId: "booth:abc" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "warehouse.entryDetail", params: { warehouseItemId: "" },
    })).toBe(false);
  });
});

describe("bdl-queries v0.3 TS mirror", () => {
  // proposal 002:镜像面与 schemas/bdl-queries/v0.3 的 result 对齐——
  // ageRestriction 是 schema required 字段(登记缺陷回归锁):显式值与
  // null 两态的对象都必须携带该字段,镜像面缺字段在编译期即失败
  const detailBase = {
    productId: "booth:1000001",
    title: "Sample Product",
    price: { amount: "1500", currency: "JPY" },
    imageUrl: null,
    imageUrls: [],
    availabilityRaw: "unknown",
    availabilityStatus: "unknown",
    entityCount: 0 as const,
    entityTypes: [],
    description: null,
    shopName: "Sample Shop",
    shopUrl: "https://sample.booth.pm/",
    adult: false,
    videoUrls: [],
    sourceCategory: null,
    subproducts: [],
  };

  it("mirrors the ageRestriction explicit-value shape required by the v0.3 schema", () => {
    const adult: CatalogProductDetailV03 = { ...detailBase, ageRestriction: "R-18" };
    expect(adult.ageRestriction).toBe("R-18");
  });

  it("mirrors the ageRestriction null shape required by the v0.3 schema", () => {
    const general: CatalogProductDetailV03 = { ...detailBase, ageRestriction: null };
    expect(general.ageRestriction).toBe(null);
  });
});

describe("bdl-commands v0.1 application surface", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "request-whcmd",
    correlationId: "correlation-whcmd",
    kind: "command",
  } as const;

  it("accepts the three warehouse write commands within their closed sets", () => {
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-1", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: "generate_vpm" },
    })).toBe(true);
    // null = 清除条目级覆盖(回落「覆盖 ?? 全局默认」动态解析)
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-2", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: null },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-3", method: "warehouse.generateVpm",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(true);
    // v0.3 词表可选字段:导入编排自动生成携带 importCorrelationId(010 承诺 6)
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-3a", method: "warehouse.generateVpm",
      params: { warehouseItemId: "wh-entry-1", importCorrelationId: "corr-import-1" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-4", method: "warehouse.deleteOriginals",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(true);
  });

  it("rejects mode vocabulary escapes, closed-set violations, and missing command ids", () => {
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-5", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: "R-18" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-6", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: "" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-7", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-8", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: null, extra: 1 },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "warehouse.generateVpm",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-9", method: "warehouse.deleteOriginals",
      params: { warehouseItemId: "", mode: null },
    })).toBe(false);
  });

  it("admits the v0.4 download-adoption command with identity-only closed params", () => {
    // bdl-commands v0.4(IMP-3):只携带下载身份,非空数组
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-1", method: "warehouse.importDownloads",
      params: { downloadIds: ["dl-01hexample0000000000000a", "dl-01hexample0000000000000b"] },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-2", method: "warehouse.importDownloads",
      params: { downloadIds: ["dl-1"] },
    })).toBe(true);
  });

  it("admits the 013 three-query read face with closed params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.listProjects", params: {},
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.inspectProject", params: { projectPath: "C:/proj" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.lockStatus", params: { projectPath: "C:/proj" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.inspectProject", params: {},
    })).toBe(false);
  });

  it("admits the 013 environmentManagers read query with empty params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.environmentManagers", params: {},
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.environmentManagers",
      params: { projectId: "p-1" },
    })).toBe(false);
  });

  it("admits the 024 P1 packages.listInstalled read query with single-key closed params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.listInstalled", params: { projectPath: "C:/proj" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.listInstalled", params: {},
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.listInstalled",
      params: { projectPath: "C:/proj", includePrerelease: true },
    })).toBe(false);
  });

  it("pins the 027 F3 packages-installed v0.2 result word face (judgment pair + disclosure)", () => {
    // 全臂形态:判定真/判定假/判定未执行(null)——编译期钉死键集与可空
    // 性,任何接口形状漂移在此先红。虚假断言防线:判定未执行行
    // (updateAvailable=null)是诚实空态事实,消费端绝不渲染「已最新」。
    const listing: PackagesListInstalledResultV02 = {
      schemaVersion: "vua.packages-installed/v0.2",
      projectPath: "C:/proj",
      packages: [
        {
          packageId: "com.anatawa12.avatar-optimizer",
          version: "1.7.0",
          dependencies: ["com.anatawa12.gists"],
          latestVersion: "1.8.2",
          updateAvailable: true,
        },
        {
          packageId: "com.demo.local-tool",
          version: "0.2.0",
          dependencies: [],
          latestVersion: null,
          updateAvailable: null,
        },
      ],
      cacheSourced: true,
    };
    // 行键闭集(v0.1 三键＋判定对两键,恰五键零多余)
    const row: PackagesInstalledItemV02 = listing.packages[1];
    expect(Object.keys(row).sort()).toEqual([
      "dependencies",
      "latestVersion",
      "packageId",
      "updateAvailable",
      "version",
    ]);
    // 判定未执行臂:双 null 如实缺席,不是 false 不是数字零
    expect(row.latestVersion).toBeNull();
    expect(row.updateAvailable).toBeNull();
    // 文档键闭集(恰四键:family 常量＋projectPath＋packages＋cacheSourced)
    expect(Object.keys(listing).sort()).toEqual([
      "cacheSourced",
      "packages",
      "projectPath",
      "schemaVersion",
    ]);
    expect(listing.cacheSourced).toBe(true);
    // 判定真臂携带版本事实对
    expect(listing.packages[0].updateAvailable).toBe(true);
    expect(listing.packages[0].latestVersion).toBe("1.8.2");
  });

  it("admits the 025 P2 packages.listRepos read query with empty closed params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.listRepos", params: {},
    })).toBe(true);
    // 全局配置面:任何参数键都是词表外形状违反,不是默认
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.listRepos", params: { projectPath: "C:/proj" },
    })).toBe(false);
  });

  it("admits the 025 P2 packages.packageCatalog read query with two-key closed params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.packageCatalog",
      params: { projectPath: "C:/proj", packageId: "com.anatawa12.avatar-optimizer" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.packageCatalog",
      params: { projectPath: "C:/proj" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.packageCatalog",
      params: { projectPath: "C:/proj", packageId: "com.anatawa12.avatar-optimizer", offset: 0 },
    })).toBe(false);
  });

  it("admits the 027 F2 packages.repoCatalog read query with the two-key nullable closed params", () => {
    // 浏览全形态:双 null(全仓库不过滤)
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.repoCatalog",
      params: { repoId: null, packageIds: null },
    })).toBe(true);
    // 仓库范围形态
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.repoCatalog",
      params: { repoId: "official", packageIds: null },
    })).toBe(true);
    // Recipe 需求集合批量过滤形态
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.repoCatalog",
      params: { repoId: null, packageIds: ["com.anatawa12.avatar-optimizer", "com.vrchat.avatars"] },
    })).toBe(true);
    // 双键必带可空闭集:缺键/多键即违反
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.repoCatalog",
      params: { repoId: null },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.repoCatalog",
      params: { repoId: null, packageIds: null, projectPath: "C:/proj" },
    })).toBe(false);
    // 空数组不是空过滤,是形状违反(null 才是不过滤)
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.repoCatalog",
      params: { repoId: null, packageIds: [] },
    })).toBe(false);
    // 需求集合唯一性:重复 id 即违反
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.repoCatalog",
      params: {
        repoId: null,
        packageIds: ["com.anatawa12.avatar-optimizer", "com.anatawa12.avatar-optimizer"],
      },
    })).toBe(false);
  });

  it("admits the 026 A1 packages.previewRemove query with the two-key closed params and explicit non-empty list", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewRemove",
      params: { projectPath: "C:/proj", packageIds: ["com.lilxyzw.liltoon"] },
    })).toBe(true);
    // 无通配:packageIds 显式非空闭列,空数组是形状违反
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewRemove",
      params: { projectPath: "C:/proj", packageIds: [] },
    })).toBe(false);
    // preview 无 digest 位:digest 是 preview 的产物,携即违反
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewRemove",
      params: { projectPath: "C:/proj", packageIds: ["com.lilxyzw.liltoon"], confirmedDigest: "d" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewRemove",
      params: { projectPath: "C:/proj" },
    })).toBe(false);
  });

  it("admits the 026 A1 packages.applyRemove command with the three-key closed params and commandId", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.applyRemove", commandId: "cmd-1",
      params: { projectPath: "C:/proj", packageIds: ["com.lilxyzw.liltoon"], confirmedDigest: "fnv1a-9e3779b9" },
    })).toBe(true);
    // apply 缺确认指纹 = 无可绑定确认,形状违反
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.applyRemove", commandId: "cmd-1",
      params: { projectPath: "C:/proj", packageIds: ["com.lilxyzw.liltoon"] },
    })).toBe(false);
    // 任务化命令缺 commandId = 形状违反
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.applyRemove",
      params: { projectPath: "C:/proj", packageIds: ["com.lilxyzw.liltoon"], confirmedDigest: "d" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.applyRemove", commandId: "cmd-1",
      params: { projectPath: "C:/proj", packageIds: [], confirmedDigest: "d" },
    })).toBe(false);
  });

  it("admits the 026 A2 packages.previewInstall query with the closed request rows and version-selection semantics", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewInstall",
      params: { projectPath: "C:/proj", packages: [{ packageId: "com.lilxyzw.liltoon", version: null }] },
    })).toBe(true);
    // 钉死精确版本 = 升级/降级同语法,合法
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewInstall",
      params: { projectPath: "C:/proj", packages: [{ packageId: "com.another.toolkit", version: "3.1.4" }] },
    })).toBe(true);
    // 请求行缺 version 键 = 形状违反(version 必填可空,null 是显式语义)
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewInstall",
      params: { projectPath: "C:/proj", packages: [{ packageId: "com.lilxyzw.liltoon" }] },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    // 请求行发明词表外键 = 虚假断言防线
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewInstall",
      params: { projectPath: "C:/proj", packages: [{ packageId: "com.lilxyzw.liltoon", version: null, displayName: "lilToon" }] },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    // 空闭列 = 形状违反
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewInstall",
      params: { projectPath: "C:/proj", packages: [] },
    })).toBe(false);
    // preview 无 digest 位:携即违反
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewInstall",
      params: { projectPath: "C:/proj", packages: [{ packageId: "com.lilxyzw.liltoon", version: null }], confirmedDigest: "d" },
    })).toBe(false);
    // 同 packageId 重复 = 词面违反(026 A2 形状核可钉法缺口闭合):
    // 完全重复行(uniqueItems 语义)与同 id 异版本(行间 id 唯一,
    // TS 守卫钉死——Schema uniqueItems 表达不了跨行 id 比较)一律拒绝
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewInstall",
      params: {
        projectPath: "C:/proj",
        packages: [
          { packageId: "com.lilxyzw.liltoon", version: null },
          { packageId: "com.lilxyzw.liltoon", version: null },
        ],
      },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "packages.previewInstall",
      params: {
        projectPath: "C:/proj",
        packages: [
          { packageId: "com.lilxyzw.liltoon", version: null },
          { packageId: "com.lilxyzw.liltoon", version: "7.3.150" },
        ],
      },
    })).toBe(false);
  });

  it("admits the 026 A2 packages.applyInstall command with the three-key closed params and commandId", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.applyInstall", commandId: "cmd-2",
      params: {
        projectPath: "C:/proj",
        packages: [
          { packageId: "com.lilxyzw.liltoon", version: null },
          { packageId: "com.another.toolkit", version: "3.1.4" },
        ],
        confirmedDigest: "fnv1a-7f3a91c2",
      },
    })).toBe(true);
    // apply 缺确认指纹 = 无可绑定确认,形状违反
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.applyInstall", commandId: "cmd-2",
      params: { projectPath: "C:/proj", packages: [{ packageId: "com.lilxyzw.liltoon", version: null }] },
    })).toBe(false);
    // version 数字类型 = 形状违反(string|null 闭集)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.applyInstall", commandId: "cmd-2",
      params: { projectPath: "C:/proj", packages: [{ packageId: "com.lilxyzw.liltoon", version: 1 }], confirmedDigest: "d" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    // 同 id 异版本 = 行间 id 唯一违反(026 A2 形状核可钉法缺口闭合,
    // 与 previewInstall 同一闭列规则)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.applyInstall", commandId: "cmd-2",
      params: {
        projectPath: "C:/proj",
        packages: [
          { packageId: "com.lilxyzw.liltoon", version: null },
          { packageId: "com.lilxyzw.liltoon", version: "7.3.150" },
        ],
        confirmedDigest: "fnv1a-7f3a91c2",
      },
    })).toBe(false);
  });

  it("admits the 026 A3 packages.registerLocalPackage command with the single-key closed params and no digest", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.registerLocalPackage", commandId: "cmd-3",
      params: { packageRoot: "C:/synthetic/generated/com.example.toolkit-1.4.0" },
    })).toBe(true);
    // 缺 packageRoot = 无可注册路径,形状违反
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.registerLocalPackage", commandId: "cmd-3",
      params: {},
    })).toBe(false);
    // 空 packageRoot = 非路径事实
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.registerLocalPackage", commandId: "cmd-3",
      params: { packageRoot: "" },
    })).toBe(false);
    // 发明 projectPath = 词表外键(注册只动后端隔离环境,不触项目)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.registerLocalPackage", commandId: "cmd-3",
      params: { packageRoot: "C:/synthetic/pkg", projectPath: "C:/proj" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    // 携 confirmedDigest = 形状违反(本面无 preview 可漂移,无 digest 位;
    // 用户显式提交即确认)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.registerLocalPackage", commandId: "cmd-3",
      params: { packageRoot: "C:/synthetic/pkg", confirmedDigest: "d" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
  });

  it("admits the 026 A4 repo add/remove commands with the closed params and no digest and no projectPath", () => {
    // addRemoteRepo 双键闭集 {url, name}
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.addRemoteRepo", commandId: "cmd-4",
      params: { url: "https://example.vpm/repos/official.json", name: "Example Official" },
    })).toBe(true);
    // 缺 name = 显示名必填(读面 Option 只投影既有行,不意味新行可无名)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.addRemoteRepo", commandId: "cmd-4",
      params: { url: "https://example.vpm/repos/official.json" },
    })).toBe(false);
    // 空 url = 非事实
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.addRemoteRepo", commandId: "cmd-4",
      params: { url: "", name: "Example Official" },
    })).toBe(false);
    // 携 confirmedDigest = 形状违反(本面无 preview 可漂移,无 digest 位)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.addRemoteRepo", commandId: "cmd-4",
      params: { url: "https://example.vpm/repos/official.json", name: "n", confirmedDigest: "d" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    // 携 projectPath = 词表外键(订阅面只写后端隔离环境,不触项目)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.addRemoteRepo", commandId: "cmd-4",
      params: { url: "https://example.vpm/repos/official.json", name: "n", projectPath: "C:/proj" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    // addLocalRepo 双键闭集 {path, name}
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.addLocalRepo", commandId: "cmd-5",
      params: { path: "D:/synthetic/local-repo", name: "Local Synthetic Repo" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.addLocalRepo", commandId: "cmd-5",
      params: { path: "", name: "Local Synthetic Repo" },
    })).toBe(false);
    // removeRepo 单键闭集 {repoId}
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.removeRepo", commandId: "cmd-6",
      params: { repoId: "repo.example.official" },
    })).toBe(true);
    // 空 repoId = 非行柄
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.removeRepo", commandId: "cmd-6",
      params: { repoId: "" },
    })).toBe(false);
    // 发明 index 键 = 索引寻址不冻结(索引在并发写下漂移)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.removeRepo", commandId: "cmd-6",
      params: { repoId: "repo.example.official", index: 0 },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
  });

  it("admits the 026 A5 create command with the closed params and no digest and no projectPath", () => {
    // createProject 三键闭集 {parent, name, template};template
    // REQUIRED-nullable:null=后端默认模板解析(库路径默认 Avatar 三级
    // 解析序——冻结词面事实,非选择器),非空串=verbatim 透传
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.createProject", commandId: "cmd-7",
      params: { parent: "D:/synthetic/projects", name: "Synthetic Project", template: null },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.createProject", commandId: "cmd-7",
      params: { parent: "D:/synthetic/projects", name: "Synthetic Project", template: "Avatar" },
    })).toBe(true);
    // 缺 parent = 无创建落点
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.createProject", commandId: "cmd-7",
      params: { name: "Synthetic Project", template: null },
    })).toBe(false);
    // 空 name = 非事实
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.createProject", commandId: "cmd-7",
      params: { parent: "D:/synthetic/projects", name: "", template: null },
    })).toBe(false);
    // 空 template 串 = REQUIRED-nullable 的空串不是默认语义(默认=null),
    // minLength 1 拒绝
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.createProject", commandId: "cmd-7",
      params: { parent: "D:/synthetic/projects", name: "Synthetic Project", template: "" },
    })).toBe(false);
    // 缺 template 键 = REQUIRED-nullable(照 A2 版本选择同构:缺席与
    // null 的双态歧义不立,null 即默认)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.createProject", commandId: "cmd-7",
      params: { parent: "D:/synthetic/projects", name: "Synthetic Project" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    // 携 confirmedDigest = 形状违反(全新目录无既有状态可漂移,无
    // preview 对偶——端口事实;用户显式表单提交即确认)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.createProject", commandId: "cmd-7",
      params: { parent: "D:/synthetic/projects", name: "Synthetic Project", template: null, confirmedDigest: "d" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
    // 携 projectPath = 词表外键(创建不寻址任何在册项目,013 复用不适用)
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "packages.createProject", commandId: "cmd-7",
      params: { parent: "D:/synthetic/projects", name: "Synthetic Project", template: null, projectPath: "C:/proj" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
  });

  it("admits the bdl-queries v0.4 completed-downloads read query with empty params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "downloads.listCompleted", params: {},
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "downloads.listCompleted",
      params: { downloadId: "dl-1" },
    })).toBe(false);
  });

  it("rejects download-adoption closed-set violations", () => {
    // 空数组、缺字段、非字符串元素、词表外字段、缺 commandId 一律拒绝
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-3", method: "warehouse.importDownloads",
      params: { downloadIds: [] },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-4", method: "warehouse.importDownloads",
      params: {},
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-5", method: "warehouse.importDownloads",
      params: { downloadIds: ["dl-1", 42] },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-6", method: "warehouse.importDownloads",
      // 客户端断言(路径/大小)永不是请求字段(C-3:契约保持 host/路径无关)
      params: { downloadIds: ["dl-1"], stagingPath: "C:/tmp/x" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "warehouse.importDownloads",
      params: { downloadIds: ["dl-1"] },
    })).toBe(false);
  });
});

describe("amf-production v0.2 application surface", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "request-prod",
    correlationId: "correlation-prod",
  } as const;

  const validQuad = {
    sourceFolder: "C:/materials/source",
    projectRoot: "C:/projects/target",
    artifactOutputRoot: "C:/artifacts",
    projectId: "project",
  };

  const command = (method: string, commandId: string, params: Record<string, unknown>) =>
    isApplicationRequestV01({
      ...base,
      kind: "command",
      method,
      commandId,
      params,
    } as unknown);

  const query = (method: string, params: Record<string, unknown>) =>
    isApplicationRequestV01({
      ...base,
      kind: "query",
      method,
      params,
    } as unknown);

  it("accepts the seven v0.2 shapes with domain ids and closed vocabularies", () => {
    expect(command("production.startInspection", "command-1", validQuad)).toBe(true);
    expect(query("production.getInspection", { inspectionId: "insp-0123456789abcdef" })).toBe(true);
    expect(command("production.requestPlan", "command-2", {
      inspectionId: "insp-0123456789abcdef", mode: "direct_unity_package",
    })).toBe(true);
    expect(command("production.requestPlan", "command-3", {
      inspectionId: "insp-0123456789abcdef", mode: "local_reusable_vpm",
    })).toBe(true);
    expect(query("production.getPlan", { planId: "plan-0123456789abcdef" })).toBe(true);
    expect(command("production.confirmPlan", "command-4", {
      planId: "plan-0123456789abcdef", observedRevision: 2, riskChoice: "snapshot_and_continue",
    })).toBe(true);
    expect(command("production.confirmPlan", "command-5", {
      planId: "plan-0123456789abcdef", observedRevision: 2, riskChoice: "continue",
      rememberForSession: true,
    })).toBe(true);
    expect(command("production.recover", "command-6", {
      taskId: "task-1", decision: "rollback", decisionId: "udid-1",
    })).toBe(true);
    expect(command("production.recover", "command-7", {
      taskId: "task-1", decision: "continue", decisionId: "udid-2", planId: "plan-0123456789abcdef",
    })).toBe(true);
    expect(query("production.getBuildRecord", { buildRecordId: "record-plan-0123456789abcdef" })).toBe(true);
  });

  it("rejects closed-set violations: vocabulary, id patterns, and missing required params", () => {
    // 四元组缺参 / 空值(start-inspection.missing-params 向量的守卫侧镜像)
    expect(command("production.startInspection", "command-1", {
      sourceFolder: "C:/m",
    })).toBe(false);
    expect(command("production.startInspection", "command-2", {
      sourceFolder: "", projectRoot: "p", artifactOutputRoot: "a", projectId: "x",
    })).toBe(false);
    // 域身份模式(insp-/plan- 前缀 + 16 位小写十六进制)
    expect(query("production.getInspection", { inspectionId: "task-1" })).toBe(false);
    expect(query("production.getPlan", { planId: "plan-00000000000000000" })).toBe(false);
    // mode 词表闭集
    expect(command("production.requestPlan", "command-3", {
      inspectionId: "insp-0123456789abcdef", mode: "mystery_mode",
    })).toBe(false);
    // riskChoice 必填且在四枚举内;rememberForSession 词表外拒绝
    expect(command("production.confirmPlan", "command-4", {
      planId: "plan-0123456789abcdef", observedRevision: 2,
    })).toBe(false);
    expect(command("production.confirmPlan", "command-5", {
      planId: "plan-0123456789abcdef", observedRevision: 2, riskChoice: "snapshot_first",
    })).toBe(false);
    expect(command("production.confirmPlan", "command-6", {
      planId: "plan-0123456789abcdef", observedRevision: 2, riskChoice: "continue",
      rememberForSession: "yes",
    })).toBe(false);
    expect(command("production.confirmPlan", "command-7", {
      planId: "plan-0123456789abcdef", observedRevision: 0, riskChoice: "continue",
    })).toBe(false);
    // recover:decisionId 必填;decision 词表闭集
    expect(command("production.recover", "command-8", {
      taskId: "task-1", decision: "rollback",
    })).toBe(false);
    expect(command("production.recover", "command-9", {
      taskId: "task-1", decision: "restart", decisionId: "udid-1",
    })).toBe(false);
  });
});

describe("task snapshot result reflux (BOARD #22, proposal 020)", () => {
  const baseSnapshot = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    taskId: "proj-1",
    revision: 4,
    correlationId: "corr-1",
    state: "succeeded",
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-12T05:30:00Z",
  } satisfies TaskSnapshotV01;

  it("carries the Done payload verbatim on succeeded snapshots", () => {
    // project-ops 族载荷自描述 schemaVersion/operation；快照面对内部形状零承诺。
    const donePayload = {
      schemaVersion: "0.2",
      operation: "project.import-copy",
      result: { kind: "receipt", copiedEntries: ["Assets"] },
    } satisfies TaskDonePayloadV01;
    const snapshot: TaskSnapshotV01 = { ...baseSnapshot, result: donePayload };
    expect(snapshot.result?.["operation"]).toBe("project.import-copy");
  });

  it("treats result as optional and absent on failure faces", () => {
    const failed: TaskSnapshotV01 = {
      ...baseSnapshot,
      state: "failed",
      error: {
        code: "vua.task.timeout",
        category: "timeout",
        messageKey: "errors.task.timeout",
        correlationId: "corr-1",
        recoverable: true,
        retryable: true,
      },
    };
    expect(Object.prototype.hasOwnProperty.call(failed, "result")).toBe(false);
    // 失败事实走 error 字段，绝不伪装成结果文档。
    expect(failed.error?.code).toBe("vua.task.timeout");
  });

  it("lets TaskDonePayloadV01 absorb any operation word list shape", () => {
    // production 族载荷（resolve/job.execute）无自描述键——快照面同样承载，
    // 形状归 production-use-case 词表，本面不窄化。
    const payload: TaskDonePayloadV01 = {
      planId: "plan-00000000000000001",
      planStatus: "draft",
      missingCount: 0,
    };
    const snapshot: TaskSnapshotV01 = { ...baseSnapshot, result: payload };
    expect(snapshot.result?.["planStatus"]).toBe("draft");
  });
});

describe("overlay read face (017 batch 1)", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "req-1",
    correlationId: "corr-1",
  };

  it("admits the polling query with an empty closed param set", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "overlay.getSnapshot", params: {},
    })).toBe(true);
    // 词表外参数拒绝——闭集即契约。
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "overlay.getSnapshot", params: { watch: "all" },
    })).toBe(false);
  });

  it("renders the honest empty state: empty tasks and both-null halves", () => {
    // 空态即终态：权威面无事实即 null/空数组，绝不合成行。
    const result: OverlaySnapshotResultV01 = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      tasks: [],
      productionCard: { currentPlan: null, latestRecord: null },
    };
    expect(result.tasks).toHaveLength(0);
    expect(result.productionCard.currentPlan).toBeNull();
    expect(result.productionCard.latestRecord).toBeNull();
  });

  it("projects the populated cards with field-trimmed verbatim values", () => {
    // 任务卡 state / plan 态 / record 态为属主冻结面原词，本面不重列词表。
    const result: OverlaySnapshotResultV01 = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      tasks: [
        { taskId: "task-1", state: "running", correlationId: "corr-1" },
        { taskId: "task-2", state: "succeeded", correlationId: "corr-2" },
      ],
      productionCard: {
        currentPlan: {
          planId: "plan-1",
          planStatus: "approved",
          createdAt: "2026-09-12T01:00:00.000Z",
          recipeId: "recipe-1",
        },
        latestRecord: {
          buildId: "build-1",
          planId: "plan-1",
          status: "succeeded",
          finishedAt: "2026-09-12T02:00:00.000Z",
        },
      },
    };
    expect(result.tasks[0].state).toBe("running");
    expect(result.productionCard.currentPlan?.planStatus).toBe("approved");
    expect(result.productionCard.latestRecord?.status).toBe("succeeded");
  });

  it("keeps the production card halves independently empty", () => {
    // 计划了但从未构建：plan 半填充，record 半诚实空。
    const planned: OverlaySnapshotResultV01 = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      tasks: [],
      productionCard: {
        currentPlan: {
          planId: "plan-2",
          planStatus: "draft",
          createdAt: "2026-09-12T03:00:00.000Z",
          recipeId: "recipe-1",
        },
        latestRecord: null,
      },
    };
    expect(planned.productionCard.currentPlan).not.toBeNull();
    expect(planned.productionCard.latestRecord).toBeNull();
  });

  it("carries the batch-2 download card with in-flight attempts only", () => {
    // 下载卡（017 批 2）：仅进行中尝试；state 为任务九态原词；无字节
    // 进度（进度在任务事件通道，快照不发明）。downloadCard 为向后兼容
    // 可选增量——缺省即批 1 世代快照仍有效。
    const withDownloads: OverlaySnapshotResultV01 = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      tasks: [],
      productionCard: { currentPlan: null, latestRecord: null },
      downloadCard: {
        activeDownloads: [
          { downloadId: "dl-1", state: "running", updatedAt: "2026-09-15T01:30:00.000Z" },
          { downloadId: "dl-2", state: "queued", updatedAt: "2026-09-15T01:31:00.000Z" },
        ],
      },
    };
    expect(withDownloads.downloadCard?.activeDownloads).toHaveLength(2);
    expect(withDownloads.downloadCard?.activeDownloads[0].state).toBe("running");

    // 批 1 世代快照（无 downloadCard）类型面仍成立——向后兼容。
    const legacy: OverlaySnapshotResultV01 = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      tasks: [],
      productionCard: { currentPlan: null, latestRecord: null },
    };
    expect(legacy.downloadCard).toBeUndefined();
  });
});

describe("inspection-queries v0.1 (M7 检查切片,016 仲裁;数据草案面+核心实现批)", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "req-insp-1",
    correlationId: "corr-insp-1",
  };
  const INSPECTION_ID = "01982b5a-3f10-7c4e-9d2a-4b8e1f6a7c21";

  const evidenceDocument: InspectionEvidenceDocumentV01 = {
    schemaVersion: "0.1",
    inspectionId: INSPECTION_ID,
    avatarRef: { ref: "warehouse:booth-item-1001", label: "Synthetic Avatar A" },
    performedAt: "2026-09-13T00:20:00Z",
    bridge: {
      editorVersion: "2022.3.22f1",
      bridgeSchemaVersion: 3,
      operations: [
        { operation: "inspect_avatar_references", commandId: "insp-01", status: "succeeded" },
      ],
    },
    dimensions: [
      {
        kind: "dependencies",
        status: "fail",
        basis: "bridge_typed_checks",
        checks: [
          {
            code: "references.missing_material",
            severity: "error",
            message: "检测到丢失的材质槽引用。",
          },
        ],
      },
      { kind: "functional", status: "unavailable", basis: "none", checks: [] },
    ],
    overallStatus: "fail",
    notes: "合成消费测试。",
  };

  it("admits inspection.get with the single identity param and rejects extras", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "inspection.get",
      params: { inspectionId: INSPECTION_ID },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "inspection.get", params: {},
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "inspection.get",
      params: { inspectionId: INSPECTION_ID, text: "fuzzy" },
    })).toBe(false);
  });

  it("admits inspection.list with the closed optional param set", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "inspection.list", params: {},
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "inspection.list",
      params: { avatarRef: "warehouse:booth-item-1001", overallStatus: "fail", limit: 50, offset: 0 },
    })).toBe(true);
    // unavailable 不是聚合输出(聚合仅 pass|warn|fail)——拒绝。
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "inspection.list",
      params: { overallStatus: "unavailable" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "inspection.list", params: { text: "fuzzy" },
    })).toBe(false);
  });

  it("admits inspection.requestRun with the two-key closed param set", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "inspection.requestRun",
      params: {
        avatarGlobalObjectId: "scene:0x1",
        avatarRef: { ref: "warehouse:booth-item-1001", label: "Synthetic Avatar A" },
      },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "inspection.requestRun",
      params: { avatarGlobalObjectId: "scene:0x1" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, kind: "command", method: "inspection.requestRun",
      params: { avatarGlobalObjectId: "scene:0x1", avatarRef: { label: "no ref" } },
    })).toBe(false);
  });

  it("consumes the get result as the verbatim evidence document", () => {
    // 读面细节在证据本体(引用不复制);get 原样透传 schemaVersion 钉 0.1。
    const result: InspectionGetResultV01 = {
      inspectionId: INSPECTION_ID,
      inspectionDocument: evidenceDocument,
      schemaVersion: "0.1",
    };
    expect(result.inspectionDocument.overallStatus).toBe("fail");
    expect(result.inspectionDocument.dimensions[0].checks[0].code).toBe("references.missing_material");
    expect(result.inspectionDocument.bridge.bridgeSchemaVersion).toBe(3);
  });

  it("consumes list entries as identity rows without dimension leakage", () => {
    // 身份摘要行刻意窄:无 dimensions/checks,细节经 get 到证据本体。
    const result: InspectionListResultV01 = {
      total: 1,
      entries: [
        {
          inspectionId: INSPECTION_ID,
          avatarRef: { ref: "warehouse:booth-item-1001", label: "Synthetic Avatar A" },
          overallStatus: "fail",
          performedAt: "2026-09-13T00:20:00Z",
        },
      ],
      schemaVersion: "0.1",
    };
    expect(result.total).toBe(1);
    expect(result.entries[0].overallStatus).toBe("fail");
    const row: Record<string, unknown> = result.entries[0];
    expect("dimensions" in row).toBe(false);
    expect("checks" in row).toBe(false);
  });
});

describe("environment.verifyEditor vocabulary row (021, core seven-point ruling)", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "request-90",
    correlationId: "correlation-90",
    kind: "query",
    method: "environment.verifyEditor",
  } as const;

  it("accepts the closed single-key params {path} with minLength 1", () => {
    expect(
      isApplicationRequestV01({ ...base, params: { path: "C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe" } }),
    ).toBe(true);
    expect(isApplicationRequestV01({ ...base, params: { path: "C:\\Editors\\2022.3.22f1" } })).toBe(true);
    expect(isApplicationRequestV01({ ...base, params: { path: "C:\\Editors\\2022.3.22f1\\Editor" } })).toBe(true);
  });

  it("rejects missing/empty path, speculative fields, wrong types, and non-object params", () => {
    // 形状违反走 invalid_params,绝不冒充验证拒绝(拒绝需原语已实际运行)
    expect(isApplicationRequestV01({ ...base, params: {} })).toBe(false);
    expect(isApplicationRequestV01({ ...base, params: { path: "" } })).toBe(false);
    expect(
      isApplicationRequestV01({ ...base, params: { path: "C:\\x", layout: "exe" } }),
    ).toBe(false);
    expect(isApplicationRequestV01({ ...base, params: { path: null } })).toBe(false);
    expect(isApplicationRequestV01({ ...base, params: "C:\\x" })).toBe(false);
  });

  it("pins the two-state tagged union against the frozen vector examples (positive 3)", () => {
    // 向量对表:schemas/editor-verify/v0.1/examples 正 3 场景逐字锚定
    // (exe 直选 production_target / 版本化根 other_unity_version+china /
    // Editor 目录 migration_source);漂移在此先失败
    const exeDirect = {
      verdict: "verified",
      editorRoot: "C:\\Editors\\2022.3.22f1",
      exePath: "C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe",
      version: "2022.3.22f1",
      classification: "production_target",
      guidanceCode: "vua.env_managers.editor_production_target",
      chinaDistribution: false,
      schemaVersion: "0.1",
    } as const;
    const verified: EnvironmentVerifyEditorResultV01 = exeDirect;
    expect(verified.verdict).toBe("verified");
    expect(verified.schemaVersion).toBe("0.1");
    expect(exeDirect.classification).toBe("production_target");

    const versionedRoot: EnvironmentVerifyEditorResultV01 = {
      verdict: "verified",
      editorRoot: "C:\\Editors\\2022.3.6f1c1",
      exePath: "C:\\Editors\\2022.3.6f1c1\\Editor\\Unity.exe",
      version: "2022.3.6f1c1",
      classification: "other_unity_version",
      guidanceCode: "vua.env_managers.editor_other_version",
      chinaDistribution: true,
      schemaVersion: "0.1",
    };
    expect(versionedRoot.chinaDistribution).toBe(true);

    const editorDirectory: EnvironmentVerifyEditorResultV01 = {
      verdict: "verified",
      editorRoot: "C:\\Editors\\2019.4.31f1",
      exePath: "C:\\Editors\\2019.4.31f1\\Editor\\Unity.exe",
      version: "2019.4.31f1",
      classification: "migration_source",
      guidanceCode: "vua.env_managers.editor_migration_source",
      chinaDistribution: false,
      schemaVersion: "0.1",
    };
    expect(editorDirectory.classification).toBe("migration_source");
  });

  it("pins refused as a normal result state with the closed five-code set (nail 1)", () => {
    // 负 3 场景均为 refused 合法 result 态(绝不上浮应用错误信封)
    const refusals: readonly EditorVerifyRefusedV01[] = [
      {
        verdict: "refused",
        exePath: null,
        code: "vua.editor_verify.target_missing",
        detail: "no such path",
        schemaVersion: "0.1",
      },
      {
        verdict: "refused",
        exePath: "C:\\Fake\\2022.3.22f1\\Editor\\Unity.exe",
        code: "vua.editor_verify.not_an_editor",
        detail: "FileVersion \"7.7.7777\" does not match a Unity editor",
        schemaVersion: "0.1",
      },
      {
        verdict: "refused",
        exePath: "C:\\Editors\\2019.4.31f1\\Editor\\Unity.exe",
        code: "vua.editor_verify.exe_missing",
        detail: "Unity.exe not found under the Editor directory",
        schemaVersion: "0.1",
      },
    ];
    for (const refusal of refusals) {
      expect(refusal.verdict).toBe("refused");
      expect(EDITOR_REFUSAL_CODES_V01).toContain(refusal.code);
    }
    // 闭集五码逐字
    expect(EDITOR_REFUSAL_CODES_V01).toEqual([
      "vua.editor_verify.target_missing",
      "vua.editor_verify.exe_missing",
      "vua.editor_verify.identity_unreadable",
      "vua.editor_verify.not_an_editor",
      "vua.editor_verify.unsupported_platform",
    ]);
  });

  it("keeps the absence code out of the refusal family (ruling 5)", () => {
    // 缺席码仅路由未接线/原语不可达,绝不在拒绝码闭集内
    expect(EDITOR_REFUSAL_CODES_V01).not.toContain(ENVIRONMENT_VERIFY_UNAVAILABLE);
    expect(ENVIRONMENT_VERIFY_UNAVAILABLE).toBe("vua.environment.verify_unavailable");
  });
});

describe("release.openForHandoff vocabulary row (023, core freeze batch 2026-09-16)", () => {
  it("accepts the closed single-key params {buildId} and rejects extras", () => {
    // 核心冻结裁决:params 闭集修订 023 §3 草案——工程身份权威在
    // build-record 面,params 重复携带=双源对账零增益
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-handoff-1",
      correlationId: "correlation-handoff-1",
      commandId: "handoff-1",
      kind: "command",
      method: "release.openForHandoff",
      params: { buildId: "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99" },
    })).toBe(true);

    // 词表外键拒绝(projectPath 之类工程身份字段不进 params——闭集)
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-handoff-2",
      correlationId: "correlation-handoff-2",
      commandId: "handoff-2",
      kind: "command",
      method: "release.openForHandoff",
      params: {
        buildId: "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99",
        projectPath: "C:/Projects/SyntheticAvatarA",
      },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);

    // 空 buildId 拒绝(minLength 1)
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-handoff-3",
      correlationId: "correlation-handoff-3",
      commandId: "handoff-3",
      kind: "command",
      method: "release.openForHandoff",
      params: { buildId: "" },
    })).toBe(false);

    // kind 冒充 query 拒绝(命令分型)
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-handoff-4",
      correlationId: "correlation-handoff-4",
      kind: "query",
      method: "release.openForHandoff",
      params: { buildId: "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99" },
    } as unknown as Parameters<typeof isApplicationRequestV01>[0])).toBe(false);
  });

  it("pins the typed error-code closed set at four codes (vua.release_handoff.*)", () => {
    // 闭集四码逐字:unavailable/invalid_params/build_unknown/editor_unresolved
    expect(RELEASE_HANDOFF_ERROR_CODES_V01).toEqual([
      "vua.release_handoff.unavailable",
      "vua.release_handoff.invalid_params",
      "vua.release_handoff.build_unknown",
      "vua.release_handoff.editor_unresolved",
    ]);
  });

  it("admits the handoff fact document and rejects any upload-status field by shape", () => {
    // 正例:VUA 侧终态事实(形状即诚实纪律)
    const fact: ReleaseHandoffFactV01 = {
      schemaVersion: "0.1",
      buildId: "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99",
      projectId: "proj-synthetic-avatar-a",
      editor: { exePath: "C:/Unity/2022.3.22f1/Editor/Unity.exe", version: "2022.3.22f1" },
      occurredAt: "2026-09-16T02:30:00Z",
    };
    expect(isReleaseHandoffFactV01(fact)).toBe(true);

    // 诚实纪律 1/2 负例:携带上传状态字段=形状拒绝(想猜也无从猜起)
    const withUploadState = { ...fact, uploadState: "uploading" };
    expect(isReleaseHandoffFactV01(withUploadState)).toBe(false);

    // 缺字段拒绝
    const { occurredAt, ...incomplete } = fact;
    void occurredAt;
    expect(isReleaseHandoffFactV01(incomplete)).toBe(false);

    // editor 子对象闭集拒绝
    expect(isReleaseHandoffFactV01({
      ...fact,
      editor: { ...fact.editor, editorRoot: "C:/Unity/2022.3.22f1" },
    })).toBe(false);
  });
});
