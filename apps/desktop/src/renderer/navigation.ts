export type ModuleId = "home" | "env" | "guide" | "production" | "tools" | "settings";
export type PageId =
  | "home"
  | "env-play"
  | "env-create"
  | "guide-start"
  | "guide-devices"
  | "warehouse"
  | "recipe"
  | "workshop"
  | "release"
  | "tools-discover"
  | "tools-installed"
  | "settings-theme"
  | "settings-about";

export interface ModuleDefinition {
  readonly id: ModuleId;
  readonly defaultPage: PageId;
  readonly pages: readonly { id: PageId }[];
}

export const modules: readonly ModuleDefinition[] = [
  { id: "home", defaultPage: "home", pages: [{ id: "home" }] },
  { id: "env", defaultPage: "env-play", pages: [{ id: "env-play" }, { id: "env-create" }] },
  { id: "guide", defaultPage: "guide-start", pages: [{ id: "guide-start" }, { id: "guide-devices" }] },
  { id: "production", defaultPage: "warehouse", pages: [{ id: "warehouse" }, { id: "recipe" }, { id: "workshop" }, { id: "release" }] },
  { id: "tools", defaultPage: "tools-discover", pages: [{ id: "tools-discover" }, { id: "tools-installed" }] },
  { id: "settings", defaultPage: "settings-theme", pages: [{ id: "settings-theme" }, { id: "settings-about" }] },
];

export function moduleForPage(page: PageId): ModuleDefinition {
  const module = modules.find((candidate) => candidate.pages.some((entry) => entry.id === page));
  if (!module) throw new Error(`unknown page: ${page}`);
  return module;
}
