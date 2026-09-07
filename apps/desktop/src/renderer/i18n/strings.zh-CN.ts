import type { Strings } from "./strings.en.ts";

/**
 * VUA 界面字符串表(zh-CN,翻译表;源语言为英文,见 strings.en.ts)。
 * 纪律:
 * - 结构键由 Strings 类型编译期强制对齐,插值参数与源表的一致性由
 *   scripts/check-i18n-tables.mjs 校验;
 * - 插值统一用具名参数模板("还差 {count} 项准备"),由 format() 展开,
 *   禁止字符串拼接造句;
 * - 产品术语(Warehouse / Recipe / Assembly / Production / Inspection /
 *   Release / AMF)不进入翻译流程:术语原形见 ./terms.ts,本表 terms.*
 *   只持有其本地注释;文案中引用术语一律走 {placeholder} + termLabel(),
 *   不得把术语写死在句子里;
 * - 演示数据负载文案不在本表,见 ./strings.fixtures.zh-CN.ts(DEV 专用,
 *   仅 gateway fixture 可达,生产构建被 Tree-shaking 剔除)。
 */
export const strings: Strings = {
  /** 术语本地注释(键必须与 terms.ts 的 TERMS 一一对应;空串 = 无注释,仅显示术语) */
  terms: {
    warehouse: "仓储",
    recipe: "配方",
    assembly: "装配",
    production: "生产",
    inspection: "检测",
    release: "出厂",
    amf: "",
  },
  common: {
    fixtureBadge: "演示数据",
    mascotAria: "VUA 吉祥物小机器人",
  },
  /** 启动闸口(GatewayProvider):五领域首帧快照拉齐失败的全局诚实失败态 */
  boot: {
    loadFailedTitle: "启动数据加载失败",
    loadFailedDescription: "读取本地能力快照时出错,界面尚未就绪。重试不会修改任何本地数据。",
    retry: "重试",
  },
  statusLight: {
    ok: "正常",
    warning: "需要确认",
    error: "需要修复",
    unknown: "未知",
  },
  /** 后台任务九态(ui-ux §6.3;键与 app/task-status.ts 的 TaskStatus 一一对应) */
  taskStatus: {
    queued: "等待中",
    preparing: "准备中",
    running: "运行中",
    waitingInput: "等待用户输入",
    paused: "已暂停",
    completed: "已完成",
    completedWithWarnings: "完成但存在警告",
    failed: "失败",
    cancelled: "已取消",
  },
  /** 工作流执行状态(键与 gateway/workflow.ts 的 WorkflowRunState 一一对应;
   *  车间视图细粒度展示用;任务中心只消费投影后的 taskStatus 九态) */
  workflowStage: {
    inspect: "检查项目现状",
    plan: "生成执行计划",
    await_confirmation: "等待确认计划",
    snapshot: "创建快照",
    execute: "执行变更",
    validate: "验证结果",
    completed: "已完成",
    recover: "正在回滚",
    failed: "失败",
    failed_recoverable: "失败(可恢复)",
    expired: "确认已过期",
  },
  /** 能力状态(v0.3.3 §2.6;键与 gateway/types.ts 的 CapabilityState/detailKey 对应) */
  capability: {
    states: {
      unavailable: "不可用",
      unconfigured: "未配置",
      loading: "加载中",
      ready: "就绪",
      blocked: "阻断",
      /** 能力级等待用户操作(如检测需先关闭 VRChat),非页面内表单输入 */
      waitingInput: "等待操作",
      error: "错误",
    },
    details: {
      detectorsMissing: "真实检测器尚未接入",
      taskEngineMissing: "任务引擎尚未接入",
      catalogMissing: "工具目录尚未接入",
      packagesEngineMissing: "包管理引擎尚未接入",
      warehouseMissing: "仓库读取面尚未接入",
    },
  },
  /** 任务中心(G3;九态文案在 taskStatus,此处为框架与操作文案) */
  /** 任务标题模板(F4-9 走查#4 四语化):动词与状态描述走 i18n,实体名保持原文。
   *  fixture 演示任务在装配时按当前语言组合,通知中心零特判渲染。 */
  taskTitles: {
    assembly: "装配 {name}:骨骼绑定与菜单生成",
    download: "下载 {name}",
    downloadInterruptedNote: "下载中断:连接已断开,已接收部分可续传。",
    downloadPolicyRefusedNote: "下载已被策略拒绝:来源或文件形态不在允许清单内,未落盘。",
    envCheck: "创作环境检测",
    envCheckWarning: "VPM 环境未通过验证",
    warehouseScan: "仓库素材扫描",
    generateVpm: "生成 VPM 包:{name}",
    deleteOriginals: "删除原始素材:{name}",
  },
  taskCenter: {
    title: "通知中心",
    expandAria: "展开任务列表,共 {count} 项",
    collapseAria: "收起任务列表",
    runningSummary: "{title} · 等 {count} 项",
    idleSummary: "暂无运行中的任务",
    backToOrigin: "回到来源页",
    cancel: "取消",
    clear: "清除",
    showCompleted: "显示已完成",
    cancelRejected: "该任务当前不可取消",
    retry: "重试",
    retryRejected: "此任务当前无法重试",
demoTaskTitle: "演示任务",
    replay: "回放事件流",
    progress: "{done}/{total}",
  },
  nav: {
    tabs: {
      home: "指挥台",
      env: "环境部署",
      guide: "游戏引导",
      production: "模型生产",
      tools: "工具合集",
      settings: "设置",
    },
    groups: {
      warehouse: "仓库",
      workshop: "车间",
      packages: "包管理",
    },
    pages: {
      home: "指挥台",
      envPlay: "游玩环境",
      envCreate: "生产环境",
      guideStart: "开始游玩",
      guideBasics: "基础操作",
      guideSafety: "安全设置",
      guideDevices: "设备提示",
      guideTutorials: "桌面/VR 教程",
      toolsDiscover: "工具发现",
      toolsDevices: "设备与追踪",
      toolsCalibration: "校准",
      toolsInstalled: "已安装工具",
      settingsGoals: "目标重选",
      settingsLanguage: "语言",
      settingsTheme: "主题",
      settingsExperimental: "实验性",
      settingsVersion: "版本",
      settingsAbout: "关于",
      settingsDonate: "捐赠",
      packages: "包管理器",
    },
  },
  /** 指挥台首页(S-VFX-2):默认落地页 */
  home: {
    tagline: "VRChat 游玩与创作的指挥中心",
    commandCta: "搜索页面、功能与操作…",
    quickHeading: "快速进入",
    statusHeading: "环境状态",
    cardDesc: {
      env: "检测与修复运行环境,一句话结论",
      guide: "从零开始的 VRChat 上手引导",
      production: "素材进仓、配方装配到发布",
      tools: "设备、校准与实用工具",
    },
  },
  app: {
    moduleNavAria: "模块",
    sidebarAria: "功能",
    themeToLight: "切换浅色",
    themeToDark: "切换深色",
    windowMinimize: "最小化",
    windowMaximize: "最大化/还原",
    windowClose: "关闭",
  },
  /** 首次目标引导(美术方案 v0.3.3 §2.2 / §4.3) */
  onboarding: {
    /** 步骤指示(v0.3.3 §2.5:文字+图标+位置同显,不只靠颜色) */
    steps: {
      goals: "选择目标",
      environments: "环境细化",
      confirm: "确认进入",
      counter: "第 {current} 步,共 {total} 步",
      aria: "引导进度",
    },
    step1Title: "你想先完成什么?",
    step1Description: "我们会根据你的目标准备所需环境。目标可以多选,之后可以在设置中随时调整。",
    recommended: "推荐",
    skip: "暂时跳过",
    back: "返回",
    continue: "继续",
    goalRequired: "至少选择一个目标后继续",
    goals: {
      env: {
        title: "环境部署",
        description: "检查并准备游玩 VRChat 或制作 Avatar 所需的软件、空间与设置。",
        impact: "启用环境检查与游玩/生产环境状态页。",
      },
      guide: {
        title: "游戏引导",
        description: "学习进入 VRChat、基础操作、安全设置与设备使用。",
        impact: "启用教程页面与学习进度记录。",
      },
      production: {
        title: "模型生产",
        description: "整理素材、创建 {recipe}、装配、检测并准备发布 Avatar。",
        impact: "启用仓库、配方与车间页面。",
      },
      tools: {
        title: "工具合集",
        description: "发现和管理经过评审的社区工具、设备适配器与校准能力。",
        impact: "启用工具目录与设备入口。",
      },
    },
    step2Title: "要准备哪些环境?",
    step2Description: "两项可以都选,状态会分别计算,互不影响结论。",
    envRequired: "至少选择一个环境后继续",
    environments: {
      play: {
        title: "游玩环境",
        description: "VRChat、本机适用的 VR 运行时或串流方式、网络与必要设置。",
      },
      create: {
        title: "生产环境",
        description: "受支持的 Unity、VPM、磁盘空间以及 Avatar 创作依赖。",
      },
    },
    step3Title: "确认你的选择",
    selectedGoals: "已选目标",
    willCheck: "将进行的检测",
    willCheckItems: "按你选择的环境目标进行本地环境检查;其他功能先保持未接入状态。",
    wontDo: "不会进行的操作",
    wontDoItems: "不会修改系统设置、不会安装软件、不会上传任何数据;任何变更前都会再次询问。",
    confirm: "进入 VUA",
  },
  deployer: {
    zones: {
      play: {
        title: "游玩环境",
        readyHeadline: "可以开始玩 VRChat 了",
        readyDescription: "{zone}检查全部通过,可以进入下一步。",
        pendingDescription: "完成缺失项目后即可开始,修复不会影响已有数据。",
        emptyDescription:
          "环境检测器接入后,此处会逐项显示 VRChat 本体、VR 运行时与串流、网络状态。",
      },
      create: {
        title: "生产环境",
        readyHeadline: "可以开始制作 Avatar 了",
        readyDescription: "{zone}检查全部通过,可以进入下一步。",
        pendingDescription: "完成缺失项目后即可开始创作,修复不会影响已有数据。",
        emptyDescription: "环境检测器接入后,此处会逐项显示 Unity、VPM 与磁盘空间状态。",
      },
    },
    summary: {
      /** 未就绪结论(headlineKey = "pending" 时展开 {count}) */
      pending: "还差 {count} 项准备",
      /** 空列表结论(headlineKey = "empty"):无检测项不得判为就绪(原则①) */
      empty: "暂无检测项目",
      emptyDescription: "数据源未返回本辖区的检测项目。",
      ctaEnterNext: "进入下一步",
      ctaFixAll: "一键修复",
      /** 检测能力可用时的重检入口(修复意图端口接入前的唯一真实动作) */
      ctaRecheck: "重新检测",
    },
    page: {
      notRunTitle: "尚未开始环境检测",
      notRunDescription: "检测完成后,这里会显示{zone}的就绪状态。",
      notRunCta: "开始检测",
      notRunCtaHint: "环境检测器将在后续里程碑接入",
      checkFailed: "检测启动失败,请再试一次。",
      emptyTitle: "还没有检测结果",
      runningTitle: "正在检测{zone}",
      runningDescription: "逐项检查本机环境,期间不会修改任何设置或文件。",
      failedTitle: "检测未能完成",
      failedDescription: "本次检测中断,没有产生新结论。重试不会修改任何本地数据。",
      failedRetry: "重试检测",
      evidenceNote: "结论基于 {time} 的检测。",
      staleNote: "以下为 {time} 的旧结果,仅供参考。",
    },
    /** 修复计划流(C-ENV):计划确认 → 引导执行 → 重检;步骤文案为版本化负载 */
    fix: {
      loading: "正在生成修复计划…",
      unavailable: "修复计划尚未接入。",
      unknownCheck: "该检测项没有可用的修复计划。",
      loadFailed: "修复计划生成失败,请再试一次。",
      impactTitle: "影响范围",
      stepsTitle: "修复步骤",
      confirmStart: "开始执行",
      cancel: "取消",
      openPage: "打开页面",
      openPageFailed: "未能调用系统浏览器,请手动复制链接。",
      stepDone: "我已完成,继续",
      confirmCandidate: "确认并继续",
      recheckNow: "重新检测",
    },
    /** 版本轨道面板(S-XV,借鉴 Comfy-Desktop VersionStatPanel):
     *  事实表呈现;相对时间显示、绝对时间挂 title */
    versions: {
      title: "版本管理",
      installed: "已安装",
      latest: "最新版本",
      lastChecked: "上次核对",
      notInstalled: "未安装",
      stateUpToDate: "已是最新",
      stateUpdate: "有可用更新",
      stateUnknown: "版本未知",
      justNow: "刚刚",
      minutesAgo: "{count} 分钟前",
      hoursAgo: "{count} 小时前",
      daysAgo: "{count} 天前",
    },
    /** 未选择环境部署目标时的中性空态(§2.2:不显示健康结论,不激活英雄区) */
    goalOff: {
      title: "未选择环境部署目标",
      description: "首次引导中未选择环境部署。选择目标后即可启用环境检查与状态结论。",
      cta: "选择环境目标",
    },
    /** 已选环境部署、但本辖区(游玩/生产)未纳入目标时的中性说明 */
    envOff: {
      title: "本环境未纳入检查目标",
      description: "当前只选择了{other}。如需检查{zone},可以重新选择目标。",
      cta: "重新选择目标",
    },
  },
  workshop: {
    title: "工厂车间",
    subtitle: "装配、生产与检测任务会在这里执行并全程可恢复。",
    runningSubtitle: "装配计划已确认,快照已创建,可随时恢复。",
    idleTitle: "生产流程尚未接入",
    idleDescription: "{recipe}与装配流程接入后,这里会显示装配轨道、执行状态与快照恢复入口。",
    /** 生产环境未就绪时的诚实阻断态(v0.3.3 §2.1:不自动切页,由用户点击后才跳转) */
    blocked: {
      title: "生产环境尚未准备",
      description: "车间需要可用的 Unity 与 VPM 生产环境。准备好之后即可开始装配。",
      cta: "前往准备生产环境",
    },
    trackAria: "{amf}生产阶段",
    trackHint: "进料口:{infeed} · 出货口:{outfeed} —— 轨道只连接中间三个车间阶段(§7.1)",
    logTitle: "执行日志",
    logHint: "节点点亮与零件移动由真实日志事件驱动(§7.2);面向新手的简化呈现不越过原则①边界。",
    /** 键与 track-model.ts 的 WorkshopConclusionKind 一一对应 */
    conclusion: {
      running: "流程进行中",
      needsConfirmation: "有检查点等待确认",
      blocked: "流程已阻断,处理后可从快照恢复",
      completed: "全部阶段已完成",
      notStarted: "尚未开始执行",
    },
    /** 键与 track-model.ts 的 StageState 一一对应(节点无障碍名) */
    stageState: {
      completed: "已完成",
      current: "进行中",
      pending: "未开始",
      needsConfirmation: "等待确认",
      blocked: "已阻断",
    },
    /** 工位面板(S-IX-1):轨道可选中,面板展示工位职责与状态事件流 */
    station: {
      title: "工位明细",
      currentState: "当前状态",
      eventsTitle: "状态事件",
      noEventsYet: "到当前时刻,该工位还没有状态事件。",
      livePendingNote: "实时事件流接入后,这里会显示该工位的事件明细。",
      /** 键与 track-model.ts 的 StageId 一一对应(进料口/配方位/三工位/出货口) */
      role: {
        warehouse: "进料口:到达本机的素材经检查后在此排队,等待进入装配。",
        recipe: "配方位:装配的期望状态来源——配方决定装什么、怎么装。",
        assembly: "组装工位:按配方把素材绑定到素体,生成可构建的工程结构。",
        production: "生产工位:执行构建与打包,产出可上传的产物。",
        inspection: "质检工位:对产物执行检查,确认达标后才允许出厂。",
        release: "出货口:质检通过的产物在此登记,进入出厂展柜。",
      },
    },
    /** 流水线条(S-IX-1):配方 → 车间 → 出厂的真实数据链卡,点击跳对应页 */
    pipeline: {
      aria: "生产流水线",
      recipe: "当前配方",
      workshop: "车间",
      release: "最新出厂",
    },
    /** 回放控制(C-WORKSHOP 录制事件流;劳动计数只表达日志可核实的数量,§7.2) */
    replay: {
      play: "播放",
      pause: "暂停",
      restart: "重播",
      controlsAria: "回放控制",
      progressAria: "回放进度 {position} / {duration}",
      /** 劳动可视化:只表达回放带 stat 事件累计的可核实操作数 */
      operationsLine: "已完成 {count} 项自动操作(可由日志核实)",
    },
  },
  /**
   * F3 生产纵向流程(寄宿车间页;交互语义见 docs/protocols/production-use-case-v0.1 草案)。
   * 枚举键与 gateway/model-production-port.ts 的端口联合类型、
   * features/workshop/production-flow-model.ts 的 phase/disabledReasons 一一对应(奇偶测试约束)。
   */
  productionFlow: {
    sectionTitle: "{production}纵向流程",
    sectionAria: "{production}纵向流程",
    material: {
      title: "素材",
      intakeAria: "素材来源",
      intake: {
        direct_unity_package: ".unitypackage 直接导入",
        local_reusable_vpm: "本地 VPM 包",
      },
      intakeNote: {
        direct_unity_package: "将 .unitypackage 原样导入目标项目。",
        local_reusable_vpm: "在隔离暂存工程制作为 local-reusable VPM 包,再经包管理器安装。",
      },
      pick: "选择素材文件…",
      pickFirst: "请先选择素材文件",
      pickedLine: "已选择:{name}",
      start: "开始检查",
      startHint: "检查只读取素材与项目现状,不做任何修改。",
    },
    inspection: {
      title: "素材检查",
      loadingBody: "正在对照目标项目检查素材…",
      findingsTitle: "发现",
      emptyFindings: "没有阻断性发现。",
      findingKind: {
        compat: "兼容",
        missing: "缺失",
        conflict: "冲突",
      },
      recoverable: "可恢复",
      retryable: "可重试",
      plannabilityTitle: "结论",
      plannability: {
        plannable: "可生成计划",
        needs_attention: "可生成计划,但有需要留意的项",
        not_plannable: "暂不可生成计划",
      },
      requestPlan: "生成执行计划",
    },
    plan: {
      title: "计划审阅",
      loadingBody: "正在生成执行计划…",
      revisionLine: "修订 {revision}",
      stagesTitle: "阶段",
      risksTitle: "风险",
      noRisks: "暂无已知风险。",
      estimate: "预计耗时约 {minutes} 分钟",
      estimateUnknown: "暂无可靠预估",
      diffsTitle: "与检查结论的差异",
      diffKind: {
        added: "新增",
        changed: "变更",
        resolved: "解决",
      },
      /** 风险决策(v0.2:四枚举词表与 gateway PlanRiskChoice 一一对应;
       *  需要决策时呈现三个动作项,not_required 用于无需决策的计划) */
      riskDecisionTitle: "风险决策",
      riskDecisionAria: "风险决策选择",
      riskChoice: {
        snapshot_and_continue: "先快照再继续",
        continue: "直接继续",
        cancel: "取消执行",
        not_required: "无需决策",
      },
      riskChoiceNote: {
        snapshot_and_continue: "执行前创建并验证项目快照,失败可回滚。",
        continue: "跳过快照直接执行;失败时无法回滚。",
        cancel: "不执行本次计划。",
        not_required: "本计划无需风险决策,可直接确认。",
      },
      rememberForSession: "本次会话内记住风险决策",
      rememberForSessionAria: "会话内记住风险决策",
      noRiskDecisionNotice: "本计划未要求额外的风险决策。",
      confirm: "确认计划并执行",
      confirmHint: "确认绑定修订 {revision};计划一旦变化,本次确认即失效。",
      expiredTitle: "确认已过期",
      expiredBody: "计划在确认后发生变化,流程未执行任何变更。可在下方恢复:继续或回滚。",
    },
    recover: {
      title: "恢复",
      body: "恢复是任务而非瞬间动作;你的决定会随决定 ID 一并记录。",
      decisionAria: "恢复方式",
      decision: {
        continue: "继续",
        rollback: "回滚",
      },
      continueNote: "从最近的安全点继续,完成剩余阶段。",
      rollbackNote: "恢复到执行前快照,撤销已应用的变更。",
      runningNote: "恢复任务正在执行…",
      confirm: "开始恢复",
    },
    record: {
      title: "构建记录",
      status: {
        completed: "已完成",
        aborted: "已中止",
rolled_back: "已回滚",
        rollback_failed: "回滚失败",
      },
      stagesTitle: "已执行阶段",
      factsTitle: "证据",
      /** evidenceSummary 四节投影(v0.2;未尝试的节如实呈现 null 锚) */
      evidence: {
        snapshot: "快照",
        bridge: "Bridge 作业",
        localVpm: "本地 VPM 包",
        validation: "验证",
        attempted: "已尝试",
        notAttempted: "未尝试",
        success: "成功",
        failed: "失败",
        outcomeUnknown: "结果未知",
        jobsLine: "{count} 个作业",
        allSucceeded: "全部成功",
        notAllSucceeded: "存在失败",
        published: "已发布",
        notPublished: "未发布",
        packageId: "包 id:{packageId}",
        validationStatus: {
          passed: "通过",
          failed: "失败",
          skipped: "跳过",
        },
      },
      finishedAt: "完成于 {time}",
    },
    /** 键与 production-flow-model.ts 的 ProductionFlowPhase 一一对应 */
    phase: {
      inspecting: "正在检查",
      inspectionReady: "检查完成,可生成计划",
      planning: "正在生成计划",
      awaiting: "计划待确认",
      executing: "正在执行",
      recovering: "正在恢复",
      completed: "已完成",
      cancelled: "已取消",
      failed: "失败",
      failedRecoverable: "失败(可恢复)",
      expired: "确认已过期",
    },
    /** 键与 production-flow-model.ts 的 FlowDisabledReason 一一对应 */
    disabledReasons: {
      runActive: "有生产命令仍在执行",
      flowPending: "当前流程尚未结案:请先完成确认或恢复",
      noInspection: "请先完成一次素材检查",
      notPlannable: "检查结论暂不允许生成计划",
      noPlan: "请先生成执行计划",
      notAwaiting: "计划当前不在待确认状态",
      notRecoverable: "只有可恢复失败或过期的运行可以恢复",
    },
    /** 键与 model-production-port.ts 的 ProductionRejectReason 一一对应 */
    rejected: {
      stale_revision: "计划在你确认后已变化:请审阅新修订并重新确认。",
      not_recoverable: "该运行当前不在可恢复状态。",
      invalid_state: "当前状态不接受该操作。",
      unknown_ref: "引用的检查、计划或任务已不存在。",
    },
    states: {
      emptyTitle: "尚无生产运行",
      emptyDescription: "选择素材并开始检查;计划、执行与恢复都在这里进行。",
      loadFailedTitle: "生产状态加载失败",
      loadFailedDescription: "读取生产能力或运行状态时出错。重试不会修改任何本地数据。",
      retry: "重试",
      actionUnavailable: "生产能力当前未连接,操作未发出。",
    },
  },
  /** 游戏引导模块(v0.3.3 §5):G6 起五页接入教程会话,内容为早期占位草稿 */
  guide: {
    progressSlotTitle: "学习目标与进度",
    progressSlotEmpty: "从下方任意一页启动教程后,这里会显示当前学习目标、完成进度和「继续上次教程」。",
    progressSlotActive: "教程进行中:第 {index} / {total} 步——{title}",
    progressSlotCompleted: "教程已完成,可在教程窗口中关闭或重新开始。",
    progressSlotFailed: "教程进度读取失败。",
    progressSlotRetry: "重试",
    startTutorialCta: "在教程窗口中学习本页",
    startTutorialFailed: "教程窗口打开失败,请再试一次。",
    draftNotice: "本页内容为早期占位草稿,正式教程内容将在后续版本(M5)完善。",
    /** 页内自制 SVG 示意图的替代文本(图本身无文字,键名经此处 i18n) */
    mediaAlt: {
      pcKeys: "PC 键盘示意图:高亮说话、聊天、表情轮盘键与空格键",
      vrController: "VR 手柄示意图:高亮扳机与握持区",
    },
    pages: {
      start: {
        title: "开始游玩",
        intro: "从安装到进入第一个世界的最短路径。",
        sections: [
          {
            id: "prepare",
            title: "开始前准备",
            paragraphs: [
              "确认加速器已开启并固定使用同一线路,Steam 已登录。VRChat 本体免费。",
            ],
          },
          {
            id: "first-steps",
            title: "第一步做什么",
            paragraphs: [
              "跟着本页教程走完三件事:进入默认世界、在镜子前挑一个免费模型、学会回家。",
            ],
          },
        ],
      },
      basics: {
        title: "基础操作",
        intro: "菜单、按键与状态标识的速查。",
        sections: [
          {
            id: "menu",
            title: "菜单在哪里",
            paragraphs: ["Esc 快捷菜单覆盖绝大多数日常操作;设置类入口在大菜单里。"],
          },
          {
            id: "keys-pc",
            title: "PC 按键速查",
            media: "pc-keys",
            paragraphs: ["先记住说话、表情、跳跃三类按键,其余用到再查。"],
          },
          {
            id: "keys-vr",
            title: "VR 手柄速查",
            media: "vr-controller",
            paragraphs: ["开麦与跳跃最常用;抓取分前扳机与侧握键两种。"],
          },
        ],
      },
      safety: {
        title: "安全设置",
        intro: "进入人多的世界之前,先花两分钟完成这些设置。",
        sections: [
          {
            id: "open-urls",
            title: "允许不受信任的网址",
            paragraphs: ["不开这个开关,很多世界的视频、图片和音乐无法加载。"],
          },
          {
            id: "personal-space",
            title: "个人空间与传送门确认",
            paragraphs: ["陌生人靠太近会自动隐藏;进入他人丢出的传送门前会有确认提示。"],
          },
          {
            id: "trust",
            title: "信任等级与模型防护",
            paragraphs: ["防护级别决定你能看到谁的模型与特效,遇到不适可一键隐藏对方。"],
          },
        ],
      },
      devices: {
        title: "设备提示",
        intro: "PC、VR 与手机端的差异,以及让画面更顺手的设置。",
        sections: [
          {
            id: "platforms",
            title: "各平台能玩到什么",
            paragraphs: ["各平台同服游玩;模型与世界按平台标识兼容性,注意绿色可用标识。"],
          },
          {
            id: "tracking",
            title: "动捕与 IK",
            paragraphs: ["没有追踪器时游戏用 IK 推算姿态,坐下偶尔穿模属正常现象。"],
          },
          {
            id: "performance",
            title: "画面与性能",
            paragraphs: ["卡顿优先调低模型显示数量与阴影;显存占用高的模型可限制显示。"],
          },
        ],
      },
      tutorials: {
        title: "桌面/VR 教程",
        intro: "同一份教程,桌面窗口与 VR 覆盖层同步进行。",
        sections: [
          {
            id: "surfaces",
            title: "双表面同步",
            paragraphs: ["任意一侧翻页,另一侧即时跟随;关掉 VR 覆盖层会自动回落到桌面窗口。"],
          },
          {
            id: "accounts",
            title: "账号说明",
            paragraphs: ["Steam 免登号数据无法迁移;官网注册并绑定后,收藏与好友才能长期保留。"],
          },
        ],
      },
    },
  },
  /** 工具合集模块(v0.3.3 §8):能力目录未接入前的诚实占位 */
  tools: {
    notConnectedTitle: "工具目录尚未接入",
    /** 工具卡片预留的四要素(§8.1),接入前以说明形式公开契约 */
    cardFieldsNote: "每个工具接入后都会标明:它能解决什么问题、是否已安装、数据会发送到哪里、由谁维护。",
    /** C-TOOLS:用途分组(§8.1);键与 gateway ToolCategory 一一对应 */
    groups: {
      devices: "设备与追踪",
      calibration: "空间校准",
      capture: "捕捉与输入",
    },
    /** 四要素字段名 */
    fields: {
      purpose: "解决什么问题",
      installed: "是否已安装",
      dataDestination: "数据去向",
      maintainer: "维护者",
    },
    installedYes: "已安装",
    installedNo: "未安装",
    openHomepage: "打开官网",
    openHomepageImpact: "将在系统浏览器打开官方网站;应用内启动与配置导入将在后续切片接入。",
    openHomepageFailed: "打开失败,请检查系统浏览器设置后重试。",
    groupEmpty: "这个分组暂时没有工具。",
    installedEmpty: "还没有已安装的工具。",
    pages: {
      discover: {
        title: "工具发现",
        description: "经过评审的社区工具目录将在后续里程碑接入。",
      },
      devices: {
        title: "设备与追踪",
        description: "头显、手柄与追踪器的适配入口将在后续里程碑接入。",
      },
      calibration: {
        title: "校准",
        description: "空间与追踪校准入口将在后续里程碑接入。",
      },
      installed: {
        title: "已安装工具",
        description: "已安装工具的管理与更新将在后续里程碑接入。",
      },
    },
  },
  /** Warehouse 目录浏览(G8):卡片墙、搜索筛选、详情抽屉与三态文案 */
  warehouse: {
    subtitle: "商品目录与到达本机的素材在此汇合;购买与下载始终在系统浏览器或官方工具中完成。",
    searchPlaceholder: "搜索标题或商品 ID",
    searchAria: "搜索目录商品",
    filters: {
      availability: "可用性",
      entityType: "实体类型",
      relationKind: "关系",
      allAvailability: "全部可用性",
      allEntityTypes: "全部实体类型",
      allRelationKinds: "全部关系",
    },
    resultCount: "筛选出 {shown} 件,共 {total} 件",
    resultCountAll: "共 {total} 件商品",
    /** 可用性四态(键与 gateway CatalogAvailability 对应);deleted = 墓碑 */
    availability: {
      available: "在售",
      unavailable: "停售",
      unknown: "未知",
      deleted: "墓碑",
    },
    /** 实体关系种类(键与 gateway CatalogRelationKind 对应) */
    relationKind: {
      compatible_with: "兼容",
      addon_for: "扩展自",
      requires: "依赖于",
    },
    /** 实体类型(键为 BDB entity_type 数据值;词表随数据,未知值 UI 回落原文) */
    entityType: {
      avatar: "素体",
      outfit: "衣装",
      texture: "贴图",
      hair: "发型",
      accessory: "饰品",
      prop: "道具",
      shader: "Shader",
      animation: "动画",
      tool: "工具",
      other: "其他",
    },
    /** 相册(卡片位置翻页 + 详情点击翻页/放大) */
    album: {
      prevImage: "上一张",
      nextImage: "下一张",
      zoomImage: "放大查看",
      closeZoom: "关闭放大视图",
    },
    card: {
      detailsCta: "查看详情",
      markPurchased: "标记已购买",
      unmarkPurchased: "取消已购买标记",
      purchasedBadge: "已购买",
      free: "免费",
      price: "{currency} {amount}",
      noPrice: "无价格信息",
      noImage: "暂无图片",
      entityCount: "{count} 个实体",
    },
    detail: {
      panelAria: "商品详情",
      close: "关闭",
      closeAria: "关闭商品详情",
      notFound: "未找到该商品。它可能已从目录移除,或本地数据需要更新。",
      loadFailed: "详情加载失败。",
      tombstoneNote: "该商品已被删除(墓碑)。目录仅保留其最后标题与主图,供追溯已有引用。",
      /** v0.3:仅显式 BOOTH Adult 徽标为真时显示 */
      adultBadge: "R-18",
      /** v0.3:观测原词证据(availabilityRaw),只在详情展示 */
      availabilityEvidence: "原始标记:{raw}",
      /** v0.3:BOOTH 年龄限制原文 */
      ageRestrictionNote: "年龄限制:{value}",
      entitiesTitle: "实体与关系",
      entitiesEmpty: "该商品尚未解析出实体。",
      attributionTitle: "店铺与作者",
      /** v0.3 增量:多版本商品的变体价(subproducts) */
      subproductsTitle: "版本与价格",
      subproductUnnamed: "未命名版本",
      /** v0.3 增量:详情视频媒体(videoUrls) */
      videosTitle: "视频",
      openVideoFailed: "未能调用系统浏览器,请手动复制视频链接。",
      termsTitle: "标签",
      descriptionTitle: "商品描述",
      sourceTitle: "来源",
      openSource: "在浏览器打开来源页",
      openSourceFailed: "未能调用系统浏览器,请手动复制上方链接。",
      /** 应用内浏览窗口(S-IX-3):仅桌面壳内渲染入口 */
      openInApp: "在应用内窗口打开",
      openInAppFailed: "未能打开应用内窗口,可改用系统浏览器。",
      sourceUrlNote:
        "登录、购买与下载在来源页或 BOOTH 官方 Library Manager 完成;文件到达本机后由{warehouse}扫描接管。",
      retry: "重试",
      /** 3D 预览占位槽(S-VFX-4):VRM 实时预览落地前展示 */
      preview3dTitle: "3D 预览",
      preview3dNote: "VRM 实时预览规划中:到达本机的模型将可在此旋转查看。",
      /** 调试模式开启时的原始数据区块标题(app/debug-mode.ts) */
      debugTitle: "调试信息",
    },
    /** 本地素材接管(C-ACQUIRE,F4-6 条目模型,双轨之二,ui-ux §2.10) */
    acquire: {
      viewCatalog: "目录",
      viewLocal: "本地素材",
      viewSwitchAria: "目录/本地素材视图切换",
      /** 双轨视图头(S-IX-3):轨道卡描述行 */
      trackCatalogDesc: "云端目录快照;购买与下载始终在来源页或官方工具完成",
      trackLocalDesc: "仓库中的素材包条目图册;素材先检查再使用",
      entriesTitle: "仓库条目",
      entriesEmpty: "仓库中还没有素材包条目。素材经授权下载或批量导入进入仓库。",
      entryCount: "共 {count} 个条目",
      artifactsTitle: "条目工件",
      previewEmpty: "预览图尚未提取",
      sizeB: "{amount} B",
      sizeKb: "{amount} KB",
      sizeMb: "{amount} MB",
      sizeGb: "{amount} GB",
      /** 检查状态(键与 gateway WarehouseArtifactState 对应) */
      verdict: {
        pending: "待检查",
        clean: "未见可执行内容",
        quarantined: "已隔离",
      },
      /** 副本角色(键与 gateway WarehouseArtifactRole 对应) */
      role: {
        original: "原始包",
        generated_vpm: "生成 VPM 包",
      },
      /** 条目路径(键与 gateway WarehouseEntryKind 对应) */
      kind: {
        imported_material: "批量导入",
        downloaded_material: "授权下载",
      },
      /** 产物模式(键与 gateway WarehouseArtifactMode 对应;模式行是 F4-9 编辑展示位) */
      mode: {
        use_original_unitypackage: "使用原始 UnityPackage",
        generate_vpm: "生成 VPM 包",
      },
      modeOverride: "覆盖全局",
      modeFollowGlobal: "跟随全局",
      /** F4-9 模式编辑与条目动作(bdl-commands v0.1;全局默认由服务端配置注入,
       *  渲染层只呈现「跟随全局」只读语义,不提供全局默认写入口) */
      modeEditTitle: "产物模式",
      modeFollowGlobalOption: "跟随全局",
      modeApply: "应用覆盖",
      modeApplying: "正在应用…",
      actionsTitle: "条目动作",
      actionGenerateVpm: "生成 VPM 包",
      actionDeleteOriginals: "删除原始素材",
      deleteConfirmNote: "删除不可恢复:原始素材文件将从仓库移除,生成的 VPM 包副本保留。",
      acceptedNote: "已受理,进度请在任务中心查看。",
      commandFailed: "操作未能完成。",
      commandErrors: {
        vua_warehouse_invalid_state: "当前生效模式不是「生成 VPM 包」,此操作不可用。",
        vua_warehouse_generated_artifact_missing: "VPM 包副本缺失或校验未通过,无法删除原始素材。",
        vua_warehouse_no_original_material: "该条目没有原始素材,无法生成。",
        vua_warehouse_already_generated: "已有 VPM 包副本;删除它之后才能重新生成。",
        vua_warehouse_entry_not_found: "未找到该条目,本地数据可能已更新。",
        vua_warehouse_unavailable: "仓库服务尚未接入。",
        vua_warehouse_invalid_params: "请求参数未通过校验。",
        vua_warehouse_storeFailed: "仓库存储故障。",
        vua_warehouse_generation_failed: "生成失败,可重试。",
        vua_warehouse_maintenanceIoFailed: "维护操作遇到文件系统故障,可重试。",
        fallback: "操作未能完成。",
      },
      detailLoadFailed: "条目详情加载失败。",
      detailNotFound: "未找到该条目。它可能已被移除,或本地数据需要更新。",
      neverRunNote: "压缩包内的可执行内容绝不会被自动运行;已隔离素材不能被{recipe}引用。",
      pendingNote: "检查完成前,待检查素材不能被{recipe}引用。",
      states: {
        notConnectedTitle: "本地素材图册尚未接入",
        notConnectedDescription: "能力接入后,这里会以图册显示仓库中的素材包条目与检查结论。",
      },
    },
    states: {
      notConnectedTitle: "目录尚未接入",
      notConnectedDescription: "目录能力接入后,这里会显示可浏览、可搜索的商品目录。",
      loadFailedTitle: "目录加载失败",
      loadFailedDescription: "读取目录数据时出错。重试不会修改任何本地数据。",
      retry: "重试",
      emptyResultTitle: "没有符合条件的商品",
      emptyResultDescription: "尝试更换搜索词或放宽筛选条件。",
    },
  },
  /**
   * 教程会话表面(G4):桌面伴随窗口与 VR overlay 共用的文案。
   * steps 的键覆盖内容包(schemas/tutorial/v1/content.v1.json)的全部步骤 id,
   * 测试守卫两侧同步(缺文案即测试失败)。
   */
  tutorial: {
    surfaceTitle: "教程",
    progress: "第 {index} / {total} 步",
    next: "下一步",
    back: "上一步",
    dismiss: "关闭教程",
    openOnDesktop: "在桌面查看",
    vrDevEntry: "VR 教程(开发验证)",
    vrDevReset: "复位 VR helper(开发诊断)",
    topmostOn: "取消窗口置顶",
    topmostOff: "窗口置顶",
    completedTitle: "教程已完成",
    completedBody: "演示会话已走完。关闭窗口即结束本次教程。",
    inactiveTitle: "当前没有进行中的教程",
    inactiveBody: "从主窗口的游戏引导页启动桌面教程窗口后,这里会显示教程步骤。",
    /** 首帧快照超时/失败时的诚实失败态(不得停留在无关闭路径的空白) */
    loadErrorTitle: "暂时无法连接应用层",
    loadErrorBody:
      "教程快照请求失败或超时。重试不会影响主窗口;直接关闭窗口也不会终止主窗口的教程会话。",
    retry: "重试",
    closeWindow: "关闭窗口",
    steps: {
      "demo-welcome": {
        title: "欢迎使用 VUA 教程",
        body: "这是一个桌面与 VR 共进的教程演示会话,用于验证双表面同步链路。",
      },
      "demo-controls": {
        title: "四个语义动作",
        body: "上一步、下一步、关闭、在桌面查看——VR 教程表面也只会发送这四个动作。",
      },
      "demo-recap": {
        title: "会话状态同步",
        body: "桌面窗口与 VR 教程看到的是同一份会话;任意一侧操作,另一侧即时跟随。",
      },
      "start-prepare": {
        title: "开始前准备",
        body: "确认加速器已开启并固定使用延迟最低的线路,Steam 已登录。",
      },
      "start-first-world": {
        title: "进入第一个世界",
        body: "首次进入会到达默认世界。在镜子前可以从免费模型里挑一个喜欢的形象。",
      },
      "start-find-content": {
        title: "找到更多内容",
        body: "主菜单的「世界」页可以搜索和收藏世界;把常去的世界设为家,上线即直接到达。",
      },
      "basics-menu": {
        title: "菜单在哪里",
        body: "PC 按 Esc 打开快捷菜单,双击齿轮进大菜单;VR 按 Y 或 B 键呼出菜单。",
      },
      "basics-keys-pc": {
        title: "PC 常用按键",
        body: "长按 V 说话,Y 打开聊天输入,R 呼出表情轮盘,空格跳跃,C 蹲下,Z 趴下。",
      },
      "basics-keys-vr": {
        title: "VR 常用按键",
        body: "长按 X 开关麦克风,A 键跳跃,前扳机确认与抓取,侧握键抓取物体。",
      },
      "basics-status": {
        title: "状态颜色的含义",
        body: "绿=在线,蓝=组队中,黄=忙碌,红=请勿打扰。状态会显示在你的名牌上。",
      },
      "safety-open-urls": {
        title: "先打开这个开关",
        body: "设置→舒适与安全中开启「允许不受信任的网址」,否则很多世界的视频和图片无法加载。",
      },
      "safety-personal-space": {
        title: "个人空间与传送门",
        body: "开启个人空间后,陌生人靠太近会自动隐藏;进别人丢的传送门前会有确认提示。",
      },
      "safety-trust": {
        title: "信任等级与防护",
        body: "防护级别决定你能看到谁的模型与特效。遇到不适可在快捷菜单一键隐藏对方模型。",
      },
      "safety-audio": {
        title: "听不清声音时",
        body: "在设置→音频里检查输入输出设备;世界里的视频音量可在播放器上单独调节。",
      },
      "devices-platforms": {
        title: "各平台能玩到什么",
        body: "PC、VR 与手机端同服游玩;模型与世界会按平台标识兼容性,绿色标识代表当前平台可用。",
      },
      "devices-tracking": {
        title: "动捕与 IK",
        body: "腰腿部追踪器能显著提升表现力;没有追踪器时游戏会用 IK 推算姿态,穿模属正常。",
      },
      "devices-performance": {
        title: "画面与性能",
        body: "卡顿优先调低「模型显示数量」与阴影;显存占用高的模型可在安全设置里限制。",
      },
      "tutorials-surfaces": {
        title: "桌面与 VR 双表面",
        body: "同一份教程可以在桌面窗口和 VR 覆盖层里同步进行,任意一侧翻页另一侧即时跟随。",
      },
      "tutorials-faq": {
        title: "常见问题速查",
        body: "模型不显示多半是防护级别或平台兼容问题;掉线先看加速器;更多问题见各引导页。",
      },
      "tutorials-accounts": {
        title: "账号说明",
        body: "Steam 免登号的数据无法迁移;在官网注册正式账号并绑定后,收藏与好友才能长期保留。",
      },
    },
  },
  /** Overlay 双表面(切片五 F7a,§8.8):桌面/VR 覆盖层的全部界面文案;
   *  枚举键(disabledReasons/environmentStates/statusTones)与 TS 联合一一对应 */
  overlay: {
    surfaceTitle: "VUA 覆盖层",
    taskSectionLabel: "当前任务",
    environmentSectionLabel: "环境",
    progress: "{done} / {total}",
    moreEnvironments: "还有 {count} 项",
    actions: {
      openOnDesktop: "在桌面打开",
      dismiss: "关闭覆盖层",
      requestCancel: "请求取消任务",
      cancelConfirm: "确认取消",
      cancelKeep: "继续运行",
    },
    cancelHint: "取消是请求语义:任务会在安全边界结束。",
    cancelArmedHint: "再按一次确认取消。",
    closeWindow: "关闭窗口",
    retry: "重试",
    loadErrorTitle: "暂时无法连接应用层",
    loadErrorBody: "覆盖层快照请求失败或超时。重试不会影响主窗口;关闭本窗口仅关闭覆盖层。",
    inactiveTitle: "当前没有可显示的内容",
    inactiveBody: "覆盖层服务尚未接入。会话开始后,状态会显示在这里。",
    statusTones: {
      inactive: "空闲",
      active: "进行中",
      waiting: "待确认",
      blocked: "已阻断",
    },
    disabledReasons: {
      notAllowed: "当前状态下不可用",
      noTask: "没有进行中的任务",
      notCancellable: "该任务当前不可取消",
    },
    environmentStates: {
      ready: "就绪",
      running: "运行中",
      missing: "未检测到",
    },
    environmentNames: {
      steamvr: "SteamVR",
      unity: "Unity 编辑器",
      vrchat: "VRChat",
      vpm: "VPM",
    },
  },
  /** MediaSlot 媒体槽:加载失败语义(ui-ux §2.8) */
  media: {
    loadFailed: "图片加载失败",
    retry: "重试",
    /** 自动重试模式(auto)的等待指示 aria 文案 */
    loading: "图片加载中",
  },
  /** Recipe 图谱页(C-RECIPE;步骤文案等负载不在本表,见 strings.fixtures) */
  recipe: {
    loadFailed: "配方图谱加载失败。",
    loadFailedDescription: "读取配方数据时出错。重试不会修改任何本地数据。",
    retry: "重试",
    notConnectedTitle: "配方图谱尚未接入",
    notConnectedDescription: "配方数据接入后,这里会显示多层关系图谱。",
    viewGraph: "图谱",
    viewList: "列表",
    viewExploded: "爆炸",
    viewSwitchAria: "图谱/列表/爆炸视图切换",
    /** S-IX-5 爆炸视图:语义层立体展开,只读观看,拖拽请切回图谱 */
    explodedHint: "爆炸视图按语义层立体展开配方结构;此视图不可拖拽,切回图谱可调整布局。",
    layers: {
      body: "身体与基础模型",
      outfit: "衣装与饰品",
      animation: "动画与菜单",
      tech: "Shader 与依赖",
    },
    nodeStates: {
      ready: "就绪",
      conflict: "冲突",
      missing: "本地缺失",
      unresolved: "未解析",
    },
    edgeKinds: {
      composition: "组成",
      wardrobe: "换装可选",
      dependency: "依赖",
    },
    conflictsTitle: "冲突",
    missingTitle: "本地缺失素材",
    detailTitle: "选中节点",
    detailEmpty: "点击节点查看详情。",
    legendAria: "图例",
    /** C-RECIPE-2:拖拽之外的完整非拖动替代(键盘方向键 + 按钮),布局自动保存;
     *  S-XI:力导图自由点——拖拽钉住位置,空白拖拽平移、滚轮缩放 */
    moveHint: "拖拽节点钉住位置;拖空白平移、滚轮缩放画布,选中后也可用方向键或下方按钮微调。布局会自动保存在本机。",
    moveGroupAria: "移动选中节点",
    moveUp: "上移",
    moveDown: "下移",
    moveLeft: "左移",
    moveRight: "右移",
    resetLayout: "恢复自动布局",
    /** S-X-3 径向画布:平移/缩放复位(不动节点布局) */
    resetView: "复位视图",
    /** S-IX-4 配方版本管理器:本机保存布局与结构摘要快照,可恢复/删除 */
    versions: {
      toggle: "版本",
      title: "版本管理",
      saveCta: "保存当前为新版本",
      notePlaceholder: "备注(可选)",
      noteAria: "版本备注",
      currentBadge: "当前",
      restore: "恢复",
      remove: "删除",
      empty: "还没有版本快照。",
      metaLine: "{nodes} 个节点 · 缺失 {missing}",
      scopeNote: "当前版本记录布局与结构摘要;配方内容编辑与分享码接入后纳入版本演进。",
      seedNoteBase: "演示:自动布局基线",
      seedNoteCustom: "演示:自定义布局快照",
    },
    /** 图谱节点右键菜单(S-XII):仅真实动作,不放占位项 */
    contextMenu: {
      viewDetails: "查看详情",
      deselect: "取消选中",
      resetPosition: "恢复自动布局位置",
    },
  },
  /** Release 项目卡片墙(C-RECIPE-3;项目标题等负载在 strings.fixtures) */
  release: {
    loadFailed: "出厂项目加载失败。",
    loadFailedDescription: "读取出厂项目数据时出错。重试不会修改任何本地数据。",
    retry: "重试",
    notConnectedTitle: "出厂项目尚未接入",
    notConnectedDescription: "完成生产流程后,这里会展示可继续编辑、回滚和上传交接的项目卡片。",
    emptyTitle: "还没有出厂项目",
    emptyDescription: "完成一次生产流程后,项目会出现在这里。",
    previewPlaceholder: "预览图尚未生成",
    bakePreviewTitle: "Unity 出厂烘焙预览",
    bakePreviewFailed: "烘焙产物未找到——请先在 Unity 中执行 build_preview。",
    detailTitle: "项目详情",
    detailEmpty: "点击项目卡查看详情。",
    health: {
      healthy: "与配方一致",
      drifted: "与配方有差异",
      "missing-deps": "依赖缺失",
    },
    inspection: {
      passed: "检测通过",
      failed: "检测未通过",
      none: "尚未检测",
    },
    snapshotsLine: "快照 {count} 个",
    metaUnity: "Unity",
    metaPlatforms: "平台",
    metaRecipe: "来源配方",
    metaUpdatedAt: "最近更新",
    /** 传送带与立体展台(S-IX-2) */
    conveyor: {
      aria: "出厂项目传送带",
      prev: "上一个项目",
      next: "下一个项目",
    },
    /** 成品卡右键菜单(S-XII):恢复快照/重新派生/上传交接未接入,不列死按钮 */
    contextMenu: {
      viewDetails: "查看详情",
      collapse: "收起详情",
    },
    pedestalNote: "预览提取尚未接入:展台上的工艺品为示意渲染,不代表真实模型。",
    futureNote:
      "恢复快照、重新派生与上传交接将在后续切片接入;登录与上传始终在 VRChat 官方 SDK 中由你完成。",
  },
  /** 包管理(S-XVI):Recipe 之外的手动 VPM 操作面;玩家语言,不暴露 semver/协议细节 */
  packages: {
    subtitle: "为每个 Unity 项目手动安装、更新与移除包;从{recipe}装配仍是主路径。",
    sections: {
      packages: "包",
      repos: "仓库订阅",
      switchAria: "在包与仓库订阅之间切换",
    },
    toolbar: {
      searchPlaceholder: "搜索名称或包 ID",
      searchAria: "搜索包",
      sourceFilterAria: "按来源筛选",
      allSources: "全部来源",
      importLocal: "导入本地包",
      showPrereleases: "显示预发布版本",
      prereleaseTitle: "显示预发布版本?",
      prereleaseBody:
        "预发布版是作者提前分享的早期构建,可能不稳定。只有在你愿意自行排查问题时才安装它。",
      prereleaseConfirm: "显示预发布",
      prereleaseCancel: "保持隐藏",
    },
    columns: {
      selectAll: "选中列出的全部包",
      selectRow: "选中 {name}",
      name: "包",
      installed: "已装版本",
      latest: "最新版本",
      source: "来源",
      rowMenuAria: "{name} 的更多操作",
      versionSelectAria: "为 {name} 选择版本",
      versionPlaceholder: "选择版本…",
      compatibleGroup: "兼容版本",
      incompatibleGroup: "与当前项目不兼容",
    },
    sources: {
      official: "官方",
      curated: "官方精选",
      community: "社区订阅",
      local: "本地导入",
    },
    states: {
      notInstalled: "未安装",
      upToDate: "已是最新",
      updateAvailable: "有更新",
      yanked: "已撤回",
      prerelease: "预发布",
      versionSuffix: "{version}({suffix})",
    },
    projects: {
      selectorAria: "选择项目",
      addProject: "添加项目文件夹",
      invalidLine: "{name}:{reason}",
      invalidReasons: {
        folderMissing: "找不到该文件夹,可能已被移动或删除。",
        unknown: "此项目暂时无法使用。",
      },
    },
    migration: {
      summaries: {
        vpmProject:
          "这个项目看起来由 VCC / vpm 管理。VUA 可以接管它的包清单,不改动任何文件。",
      },
      note: "迁移将在包管理引擎接入后执行;在此之前不会自动改动任何内容。",
    },
    changes: {
      title: "确认变更",
      cancel: "取消",
      confirm: "应用变更",
      delayedHint: "请先确认上面的清单,确认按钮稍候解锁。",
      kinds: {
        install: "新装",
        upgrade: "升级",
        majorUpgrade: "大版本升级",
        downgrade: "降级",
        remove: "移除",
        reinstall: "重装",
      },
      versionLine: "{from} → {to}",
      majorUpgradeWarning: "大版本升级可能改变行为,应用前请查看更新日志。",
      downgradeWarning: "降级可能破坏依赖新版本的内容。",
      conflictsTitle: "冲突",
      conflicts: {
        requiredBy: "{package} 被 {dependent} 依赖,移除可能导致它无法工作。",
        unknown: "这些包存在冲突,应用前请确认。",
      },
      legacyTitle: "将被移除的旧版(legacy)目录",
    },
    repos: {
      addCommunity: "添加社区仓库",
      riskTitle: "添加社区仓库之前",
      riskBody:
        "社区仓库由第三方维护,未经 VRChat 或 VUA 审核;订阅后其中的包可能发生变化。请只添加你信任的作者发布的仓库。订阅功能将随包管理引擎一同接入,本说明提前展示。",
      riskAcknowledge: "知道了",
      toggleAria: "启用或停用 {name}",
      health: {
        unknown: "未核对",
        ok: "可访问",
        stale: "可能过时",
        unreachable: "无法访问",
      },
      neverChecked: "从未核对",
      checkedJustNow: "刚刚核对",
      checkedMinutesAgo: "{count} 分钟前核对",
      checkedHoursAgo: "{count} 小时前核对",
      checkedDaysAgo: "{count} 天前核对",
      packageCount: "{count} 个包",
    },
    empty: {
      engineTitle: "包管理尚未接入",
      notConnectedTitle: "包数据尚未接入",
      notConnectedDescription: "包管理引擎接入后,你的项目、包与仓库订阅会显示在这里。",
      noProjectsTitle: "还没有项目",
      noProjectsDescription: "添加一个已有的 Unity 项目文件夹,即可在这里管理它的包。",
      noSelectionTitle: "尚未选择项目",
      noSelectionDescription: "在上方选择一个项目,即可查看它的包。",
      noPackagesTitle: "这个项目还没有包",
      noPackagesDescription: "可以在这里导入本地包,或从{recipe}装配项目。",
      noResultTitle: "没有匹配的包",
      noResultDescription: "换个搜索词,或放宽来源筛选试试。",
    },
    drawer: {
      aria: "包详情",
      close: "关闭",
      closeAria: "关闭包详情",
      descriptionHeading: "简介",
      factsHeading: "事实",
      installedLabel: "已装版本",
      latestLabel: "最新版本",
      sourceLabel: "来源",
      idLabel: "包 ID",
      changelogCta: "查看更新日志",
      changelogFailed: "无法调用系统浏览器,请手动复制链接。",
    },
    bulk: {
      selectedCount: "已选 {count} 项",
      updateAll: "全部升级",
      installAll: "全部安装",
      removeAll: "移除所选",
      clear: "清除选择",
    },
    menu: {
      viewDetails: "查看详情",
      updateToLatest: "更新到最新",
      installLatest: "安装最新版",
      remove: "移除",
      updateUnavailableReason: "只有有可用更新的包才能更新",
      removeUnavailableReason: "只有已安装的包才能移除",
    },
    toasts: {
      importAdded: "本地包已导入。",
      projectAdded: "项目文件夹已添加。",
      nothingToChange: "当前选择没有可执行的变更。",
      previewUnavailable: "无法生成变更预览:包管理引擎尚未接入。",
      applyFailed: "变更未能应用:包管理引擎尚未接入。",
      appliedSummary: "已应用 {count} 项变更。",
    },
  },
  /** 命令面板(C-EFFICIENCY,ui-ux §6.1 Ctrl+P) */
  commandPalette: {
    cta: "命令",
    ctaHint: "Ctrl+P",
    aria: "命令面板",
    placeholder: "跳转到页面或执行命令…",
    empty: "没有匹配的命令。",
    groupPages: "页面",
    groupActions: "操作",
    toggleThemeToLight: "切换为浅色主题",
    toggleThemeToDark: "切换为深色主题",
  },
  placeholders: {
    notOpenTitle: "功能尚未开放",
    recipeDescription: "配方搭配与多层关系图谱将在后续里程碑接入。",
    releaseDescription: "成品出厂与交付将在后续里程碑接入。",
    donateDescription: "捐赠渠道将在正式版上线前开放,感谢你的支持。",
    packagesDescription: "Unity 项目的包安装、更新、迁移与备份将在后续里程碑接入;交互设计借鉴 ALCOM 与 VCC,并为新手重新包装。",
  },
  /** 模型生产首次进入覆盖层(假加载页;槽位为最终交付预留,见 ProductionIntroOverlay) */
  productionIntro: {
    title: "模型生产",
    subtitle: "正在准备工作台…",
    skip: "跳过",
  },
  settings: {
    /** 实验性功能页(W15 重做形态,用户走查示意图 A/B):单卡=标题+副题+警示条
     *  +两行开关。行1「生成 VPM 替代」=全局默认模式写面(bdl-commands v0.2 全局层
     *  setGlobalDefaultMode);行2「生成后删除原始素材文件」=危险开关,未接线偏好
     *  (全局自动删除超出已冻结条目级命令,协议面随 proposal 008 裁决),开启必经
     *  危险确认对话框,恒挂未接线标注 */
    experimental: {
      title: "实验性功能",
      subtitle: "默认关闭,使用前请仔细阅读说明",
      badge: "实验性",
      warning: "实验性功能可能产生非预期行为。启用前请确保你理解其影响。",
      generateTitle: "生成 VPM 替代",
      generateDesc: "在装配时自动生成 VPM 兼容包清单(实验性)。",
      globalReadUnknown: "当前全局默认值尚未读取;切换一次后以服务端回执为准。",
      deleteTitle: "生成后删除原始素材文件",
      deleteBadge: "危险",
      deleteDesc: "VPM 生成完成后删除原始 .unitypackage 文件。此操作不可逆,仅可在已确认生成质量后启用。需要「生成 VPM 替代」先开启。",
      notWired: "该功能尚未接线到服务端,开启仅记录意图(协议面随 proposal 008 裁决后实现)。",
      devPrototypeNote: "本原型不会真正删除任何文件。",
      dialogTitle: "危险操作确认",
      dialogBodyA: "启用「生成后删除原始素材文件」后,VPM 生成完成时将",
      dialogBodyEmphasis: "永久删除",
      dialogBodyB: "对应的 .unitypackage 文件。",
      dialogWarning: "此操作不可逆。确保你已验证 VPM 生成结果后再启用。",
      dialogCancel: "取消",
      dialogConfirm: "我已了解风险,启用",
    },
    goals: {
      heading: "目标重选",
      description: "重新进行首次启动的目标选择。当前选择会保留,确认后才会生效。",
      restartCta: "重新选择目标",
    },
    /** 主题页(C-I18N:主题选择归位 + 高对比度开关) */
    theme: {
      appearanceHeading: "外观",
      appearanceAria: "外观主题",
      dark: "深色",
      light: "浅色",
      hcHeading: "高对比度",
      hcDescription:
        "跟随系统:Windows 高对比度开启时自动生效;始终开启:应用内使用高对比配色,不依赖系统设置。",
      hcAria: "高对比度模式",
      hcAuto: "跟随系统",
      hcOn: "始终开启",
      /** 资源节约模式(S-VFX-5 落地:手动 + SteamVR 自动偏好,issue #27) */
      saverHeading: "资源节约模式",
      saverDescription:
        "关闭全部界面动效、光效与 3D 背景,在你游玩 VR 时节约系统资源;界面功能与状态提示不受影响。",
      saverTurnOn: "打开资源节约模式",
      saverTurnOff: "关闭资源节约模式",
      saverStateOff: "当前:已关闭",
      saverStateManual: "当前:已开启(手动)",
      saverStateAuto: "当前:已开启(自动 · SteamVR 运行中)",
      saverAutoLabel: "SteamVR 运行时自动打开",
      saverAutoAria: "SteamVR 运行时自动打开资源节约模式",
      saverAutoNote: "运行检测尚未接入,接入后该选项自动生效。",
    },
    /** 语言页(C-I18N):写存储后整页重载选表;未交付语言在选项内标注 */
    language: {
      heading: "界面语言",
      description: "切换后立即重载生效。更多语言的翻译正在进行中。",
      aria: "界面语言",
      pending: "翻译中",
    },
    version: {
      heading: "VUA 桌面端",
      versionLine: "v0.3.0 · 早期预览",
      description:
        "当前切片:四目标信息架构、首次引导与部署器/车间外壳。环境检测、素材仓储与生产流程将在后续里程碑接入。",
      debugHeading: "调试模式",
      debugDescription:
        "开启后,仓库商品详情会显示完整的结构化数据(含实体 UUID),供排查数据问题。仅影响展示,不修改任何数据。",
      debugToggle: "显示商品调试信息",
      /** 诊断导出(C-SETTINGS):脱敏契约在 features/settings/diagnostics.ts */
      diagnosticsHeading: "诊断导出",
      diagnosticsDescription:
        "导出一份脱敏诊断包,用于排查问题。只包含:应用版本、数据来源、环境检测状态与时间戳、你的目标选择。不包含:文件路径、素材与配方内容、账户或设备标识。",
      diagnosticsExport: "导出诊断包",
      diagnosticsFailed: "导出失败,请重试。",
    },
    about: {
      heading: "VRC Ultra Assistant",
      description: "面向 VRChat 玩家与创作者的一体化助手:游玩/生产环境部署器与 {amf} Avatar 生产线。",
      /** 头图槽位(C-SETTINGS):Banner 依赖吉祥物定稿(美术需求文档 §3),先占位 */
      bannerSlot: "头图槽位:Banner 将在吉祥物定稿后填入。",
      contributorsHeading: "贡献者与源码",
      contributorsDescription:
        "VUA 是开源项目,欢迎贡献代码、文档与社区皮肤;完整约定见仓库 CONTRIBUTING 与 AGENTS。",
      repoCta: "打开项目仓库",
      repoImpact: "将在系统浏览器打开 GitHub 仓库页。",
      repoFailed: "打开失败,请检查系统浏览器设置后重试。",
    },
  },
  dev: {
    tag: "DEV",
    aria: "开发场景切换",
    expandAria: "展开开发场景切换",
    collapseAria: "收起开发场景切换",
    demoMixed: "演示 · 混合态",
    demoAllGreen: "演示 · 全绿",
    demoWorkshop: "演示 · 车间",
    demoWorkshopWarning: "演示 · 车间待确认",
    demoWorkshopBlocked: "演示 · 车间阻断",
    demoWorkshopRecover: "演示 · 车间恢复",
    demoTasks: "演示 · 任务",
    demoEnvFresh: "演示 · 环境未检",
    demoEnvFail: "演示 · 检测失败",
    demoAcquireEmpty: "演示 · 空仓库",
    demoPackages: "演示 · 包管理",
    productionInspect: "演示 · 生产检查",
    productionPlan: "演示 · 生产计划审阅",
    productionRunning: "演示 · 生产执行中",
    productionSuccess: "演示 · 生产成功",
    productionCancelled: "演示 · 生产已取消",
    productionDrifted: "演示 · 生产漂移",
    productionExpired: "演示 · 生产确认过期",
    productionRollback: "演示 · 生产回滚",
    notRun: "诚实空态",
    perfProbe: {
      title: "性能采样",
      longTasks: "长任务 {count} 个",
      measures: "最近测量",
      empty: "暂无采样",
    },
  },
  /** 预览实验室(DEV spike ?dev=preview-lab):T1 webview 直渲素材 / T2 Unity 烘焙成品对照 */
  previewLab: {
    title: "预览实验室",
    subtitle:
      "DEV spike:T1 webview 直渲素材 对照 T2 Unity 烘焙成品;项目数据读取本机 demo 清单,不入库。",
    needRootTitle: "未指定演示工程",
    needRootBody:
      "在 URL 后追加 &demoRoot=<Unity 工程路径>;页面会读取该工程的 .vrcua/bridge/demo-lab.json。",
    demoRootLabel: "工程",
    manifestLoading: "正在读取演示清单…",
    manifestFailedTitle: "演示清单不可用",
    manifestFailedBody:
      "无法读取 {path}。请检查 demoRoot,以及工程内是否存在 .vrcua/bridge/demo-lab.json。",
    sourcesTitle: "素材 · T1 webview 直渲",
    sourcesNote:
      "Unity 自定义 shader 以既有材质 + 主贴图近似,FBX 内嵌贴图保留;光照与着色与 Unity 烘焙存在差异。",
    productsTitle: "成品 · T2 Unity 编辑器烘焙",
    productsNote:
      "转盘帧由 Unity 编辑器桥烘焙到 .vrcua/bridge/preview/;VRM 由 webview 直渲作为对照。",
    cardStatusLoading: "加载中…",
    cardStatusFailed: "加载失败",
    bakePending: "未找到烘焙产物——请先在 Unity 触发 build_preview({path})。",
    bakedMeta: "{frames} 帧 · {width}×{height} · {triangles} 三角面",
    loadingFrames: "正在加载帧 {loaded}/{total}…",
    dragHint: "拖拽旋转",
    kindFbx: "FBX 素材",
    kindVrm: "VRM 导出",
    kindTurntable: "Unity 烘焙",
  },
  /** 组件状态展台(G2-A,dev-only ?dev=showcase):全部标签与示例文案 */
  showcase: {
    title: "组件状态展台",
    subtitle: "开发走查专用页:交互态为强制渲染,取值只引用 Token,不新增视觉值。",
    motionNormal: "正常动画",
    motionReduced: "模拟减少动态效果",
    themeDark: "深色主题",
    themeLight: "浅色主题",
    districtPurple: "VUA 紫辖区(默认)",
    districtOrange: "{amf} 橙辖区(模型生产)",
    themeHc: "高对比度(手动开启预览)",
    loadingNote: "加载中态见骨架屏节;按钮无独立加载态。",
    sections: {
      button: "Button 按钮",
      badge: "Badge 徽标",
      card: "Card 卡片",
      texture: "控件质感(v0.4.0 §3.6)",
      statusLight: "StatusLight 状态灯",
      emptyState: "EmptyState 空状态",
      mascot: "Mascot 吉祥物",
      skeleton: "Skeleton 骨架屏",
      mediaSlot: "MediaSlot 媒体槽",
      navSelected: "导航选中态",
      capability: "Capability 能力状态",
    },
    states: {
      default: "默认",
      hover: "悬停",
      pressed: "按下",
      focused: "聚焦",
      selected: "选中",
      disabled: "禁用",
      loading: "加载中",
      ready: "就绪",
      failed: "失败",
    },
    badgeTones: {
      neutral: "中性",
      brand: "品牌",
      success: "成功",
      warning: "警告",
      error: "错误",
    },
    demo: {
      buttonLabel: "操作",
      cardBody: "卡片内容示例,hover 上浮并泛辖区色边框。",
      emptyTitle: "尚未接入",
      emptyDescription: "空状态示例文案,用于展台走查。",
      navTab: "顶部标签",
      navSidebar: "侧栏条目",
    },
    textureDemo: {
      panel: "玻璃面板:细边框 · 半透明 · 背景模糊",
      panelBody: "卡片与面板以细边框 + 玻璃质感分层,透出画布的紫橙氛围光。",
      elevated: "Elevated 浮层:辉光阴影",
      elevatedBody: "浮层保留环境光 + 辖区色辉光的双层阴影,hover 上浮泛光。",
      input: "输入框:6px 圆角",
      inputPlaceholder: "输入框占位文本",
    },
  },
  wizard: {
    wrongStep: "当前步骤是 {current},不能提交 {submitted}",
    onlyReview: "只有在确认页才能开始执行",
    noProject: "尚未选择项目",
    required: "{label}不能为空",
    labels: {
      outfit: "衣装",
      outfitArmature: "衣装 Armature",
      toggleName: "开关名称",
      workflowId: "工作流 ID",
    },
  },
  /** 应用面错误文案:键 = 线上 messageKey(键先行,provider 在错误通道下发
   *  errors.catalog.*);catalog 浏览器当前将失败回落 not-connected/not-found,
   *  该视图中透传呈现这些键为后续切片 */
  errors: {
    catalog: {
      productNotFound: "未找到该目录条目,它可能已被移除或下架。",
      invalidParams: "目录请求未通过校验。",
      unavailable: "目录服务尚未接入。",
      storeFailed: "目录存储发生故障,请求未完成。",
      fallback: "目录操作未能完成。",
    },
  },
};
