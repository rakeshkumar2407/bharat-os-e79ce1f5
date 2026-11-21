import type { AppId } from "./types";

export const APP_META: Record<AppId, { w: number; h: number; single?: boolean; minW?: number; minH?: number }> = {
  files: { w: 860, h: 560 },
  notepad: { w: 720, h: 520 },
  calculator: { w: 340, h: 520, single: true, minW: 300, minH: 460 },
  terminal: { w: 760, h: 480 },
  settings: { w: 900, h: 600, single: true },
  paint: { w: 960, h: 640 },
  browser: { w: 1040, h: 680 },
  taskmanager: { w: 780, h: 540, single: true },
  photos: { w: 900, h: 620, single: true },
  about: { w: 520, h: 520, single: true },
  kernel: { w: 700, h: 460, single: true },
};

export const PINNED: AppId[] = ["files", "browser", "terminal", "notepad", "settings", "kernel"];
export const ALL_APPS: AppId[] = [
  "files",
  "browser",
  "notepad",
  "calculator",
  "terminal",
  "paint",
  "photos",
  "taskmanager",
  "settings",
  "about",
  "kernel",
];
