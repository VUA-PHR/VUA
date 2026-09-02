export type LocaleId = "zh-CN" | "en";

const tables = {
  "zh-CN": {
    appName: "VRC Ultra Assistant",
    regionsAria: "产品区域",
    settings: "设置",
    windowMinimize: "最小化",
    windowMaximize: "最大化或还原",
    windowClose: "关闭",
    taskCenter: "任务中心",
    taskUnavailable: "等待 Orchestrator 接入",
    taskAvailable: "可用",
    modules: { home: "指挥台", env: "环境部署", guide: "游戏引导", production: "模型生产", tools: "工具合集", settings: "设置" },
    pages: {
      home: "总览", "env-play": "游玩环境", "env-create": "生产环境", "guide-start": "开始游玩",
      "guide-devices": "设备操作", warehouse: "Warehouse 仓储", recipe: "Recipe 配方", workshop: "车间",
      release: "Release 发布", "tools-discover": "发现工具", "tools-installed": "已安装",
      "settings-theme": "主题与效果", "settings-about": "关于",
    },
  },
  en: {
    appName: "VRC Ultra Assistant",
    regionsAria: "Product regions",
    settings: "Settings",
    windowMinimize: "Minimize",
    windowMaximize: "Maximize or restore",
    windowClose: "Close",
    taskCenter: "Task center",
    taskUnavailable: "Waiting for the Orchestrator",
    taskAvailable: "Available",
    modules: { home: "Command", env: "Environment", guide: "Guide", production: "Avatar production", tools: "Tools", settings: "Settings" },
    pages: {
      home: "Overview", "env-play": "Play environment", "env-create": "Production environment", "guide-start": "Getting started",
      "guide-devices": "Devices", warehouse: "Warehouse", recipe: "Recipe", workshop: "Workshop",
      release: "Release", "tools-discover": "Discover", "tools-installed": "Installed",
      "settings-theme": "Theme and effects", "settings-about": "About",
    },
  },
} as const;

export function resolveLocale(languages: readonly string[]): LocaleId {
  return languages.some((language) => language.toLowerCase().startsWith("zh")) ? "zh-CN" : "en";
}

export const strings = tables[resolveLocale(navigator.languages ?? [navigator.language])];
