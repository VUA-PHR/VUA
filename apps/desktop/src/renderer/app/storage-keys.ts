/**
 * 浏览器存储键唯一来源(G2-A):应用代码与调试/走查入口共用同一份定义,
 * 防止键名漂移。
 * - lastPage / goals 用 localStorage(跨会话);
 * - scenario 用 sessionStorage(仅本次会话,见 DevScenarioBar)。
 */
export const storageKeys = {
  lastPage: "vua-last-page",
  scenario: "vua-scenario",
  goals: "vua-goals",
  /** 素材生命周期(G8):版本化 StoredLifecycleV1,见 features/warehouse/asset-lifecycle.ts */
  lifecycle: "vua-asset-lifecycle",
  /** 调试模式(G8 用户反馈):见 app/debug-mode.ts */
  debugMode: "vua-debug-mode",
  /** Recipe 图谱布局(C-RECIPE-2):版本化 StoredRecipeLayoutsV1,见 features/recipe/recipe-layout-model.ts */
  recipeLayout: "vua-recipe-layout",
  /** 配方版本管理器(S-IX-4):版本化 StoredRecipeVersionsV1,见 features/recipe/recipe-versions.ts */
  recipeVersions: "vua-recipe-versions",
  /** 主题(C-RESUME 工作区恢复):dark | light;缺省 dark(§3.1) */
  theme: "vua-theme",
  /** 界面语言(C-I18N):LocaleId;缺省走系统探测,fallback 见 i18n/locales.ts */
  locale: "vua-locale",
  /** 高对比度(C-I18N):"auto" 跟随系统 forced-colors | "on" 始终开启;缺省 auto */
  hc: "vua-hc",
  /** 动态特效总开关(S-VFX-5,VR/省资源):"on" | "off";缺省 on */
  effects: "vua-effects",
  /** SteamVR 运行时自动打开资源节约模式:"on" | "off";缺省 off(检测器接入后生效,issue #27) */
  effectsAuto: "vua-effects-auto-steamvr",
  /** 通知中心已清除通知(proposal 007 路径 b):已清除终态任务 id 的 JSON 数组;
   *  只隐藏通知呈现,任务权威事实仍可经任务列表/详情面查询 */
  notificationDismissed: "vua-notification-dismissed",
  /** 「生成后删除原始素材文件」偏好(W15 重做,proposal 008 未决):"on" | "off";
   *  缺省 off。当前为未接线呈现层偏好——全局自动删除语义超出已冻结的条目级
   *  deleteOriginals,协议面随 proposal 008 裁决;开启仅记录意图,不触发任何
   *  服务端行为 */
  deleteOriginalsAfterGenerate: "vua-delete-originals-after-generate",
  /** 开发模式 per-port 连接目标(018,裁决 13;DEV-only):sessionStorage,
   *  JSON 形态 { [DevPortId]: "live" | "fixture" };解析/校验见
   *  app/dev-port-selection.ts,生产构建恒无此键消费 */
  devPortSelection: "vua-dev-port-selection",
  /** 多套 UI 根选择(019 批 A,需求 §2.1 首批开发设置入口):sessionStorage,
   *  值 = ui-registry 的 UiRootId(current | forest-green);共享容器
   *  (GatewayProvider)不随切换重建 */
  uiRootSelection: "vua-ui-root-selection",
} as const;
