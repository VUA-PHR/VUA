/**
 * 教程内容包访问(应用侧)。
 *
 * 旧来源 schemas/tutorial/v1/content.v1.json(旧仓 Rust include_str! + webview
 * 共用)未随本切片迁移;此处按同一定义重建最小 v1 索引:教程 id 与步骤序列
 * 全部来自 i18n strings.tutorial.steps 的既有键(按前缀分组,顺序即声明序)。
 * 正式 schemas/tutorial/(JSON Schema + 跨进程校验)随 Electron 教程切片(M5)
 * 落地后,本模块改为加载并校验该版本化文件,结构不再内联。
 *
 * 文案纪律:本模块不持有任何界面文案;步骤标题/正文仍以 strings.tutorial.steps
 * 为唯一来源,键集合的一致性由 tutorial-port.test 的守卫测试保证。
 */
import { strings } from "../i18n/index.ts";

export interface TutorialContentPackV1 {
  readonly version: 1;
  readonly tutorials: readonly {
    readonly id: string;
    readonly steps: readonly string[];
  }[];
}

/** 教程 id → 步骤 id 前缀(与 strings.tutorial.steps 键的命名约定一致) */
const TUTORIAL_STEP_PREFIXES: readonly { readonly id: string; readonly prefix: string }[] = [
  { id: "demo", prefix: "demo-" },
  { id: "guide-start", prefix: "start-" },
  { id: "guide-basics", prefix: "basics-" },
  { id: "guide-safety", prefix: "safety-" },
  { id: "guide-devices", prefix: "devices-" },
  { id: "guide-tutorials", prefix: "tutorials-" },
];

/** id 词表:小写字母/数字/连字符,1–64 字符(与旧 content.v1.json Schema 对齐) */
const CONTENT_PACK_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

/**
 * 内容包一致性校验(拒绝条件与旧仓 parse_content_pack 对齐):
 * - version 必须为 1;
 * - 教程数量 1–16,每教程步骤数量 1–32;
 * - 教程 id 与步骤 id 满足词表;
 * - 教程 id 全局唯一;步骤 id 跨教程全局唯一(渲染端按 id 查文案,重复即串教程)。
 * 校验失败抛 Error——这是构建期内容损坏,不是运行时分支。
 */
export function validateContentPackV1(pack: TutorialContentPackV1): TutorialContentPackV1 {
  if (pack.version !== 1) throw new Error("tutorial_content_pack_schema_version");
  if (pack.tutorials.length < 1 || pack.tutorials.length > 16) {
    throw new Error("tutorial_content_pack_tutorials_out_of_range");
  }
  for (const tutorial of pack.tutorials) {
    if (!CONTENT_PACK_ID_PATTERN.test(tutorial.id)) {
      throw new Error(`tutorial_content_pack_tutorial_id:${tutorial.id}`);
    }
    if (tutorial.steps.length < 1 || tutorial.steps.length > 32) {
      throw new Error(`tutorial_content_pack_steps_out_of_range:${tutorial.id}`);
    }
    for (const stepId of tutorial.steps) {
      if (!CONTENT_PACK_ID_PATTERN.test(stepId)) {
        throw new Error(`tutorial_content_pack_step_id:${stepId}`);
      }
    }
  }
  const tutorialIds = pack.tutorials.map((tutorial) => tutorial.id);
  if (new Set(tutorialIds).size !== tutorialIds.length) {
    throw new Error("tutorial_content_pack_duplicate_tutorial");
  }
  const stepIds = pack.tutorials.flatMap((tutorial) => tutorial.steps);
  if (new Set(stepIds).size !== stepIds.length) {
    throw new Error("tutorial_content_pack_duplicate_step");
  }
  return pack;
}

/** 按前缀收集 strings.tutorial.steps 的键并保持表内声明顺序 */
function stepIdsWithPrefix(prefix: string): string[] {
  return Object.keys(strings.tutorial.steps).filter((stepId) => stepId.startsWith(prefix));
}

export const contentPack: TutorialContentPackV1 = validateContentPackV1({
  version: 1,
  tutorials: TUTORIAL_STEP_PREFIXES.map(({ id, prefix }) => ({
    id,
    steps: stepIdsWithPrefix(prefix),
  })),
});

/** 全部教程 id(内容包声明顺序) */
export function packTutorialIds(): string[] {
  return contentPack.tutorials.map((tutorial) => tutorial.id);
}

/** 全部步骤 id(跨教程全局唯一,校验保证) */
export function packStepIds(): readonly string[] {
  return contentPack.tutorials.flatMap((tutorial) => tutorial.steps);
}

/** 查教程步骤序列;未知 id 返回 null(调用方决定如何呈现,不得静默落到默认教程) */
export function packStepsOf(tutorialId: string): readonly string[] | null {
  return contentPack.tutorials.find((tutorial) => tutorial.id === tutorialId)?.steps ?? null;
}
