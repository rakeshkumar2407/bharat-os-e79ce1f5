export type AppId =
  | "files"
  | "notepad"
  | "calculator"
  | "terminal"
  | "settings"
  | "paint"
  | "browser"
  | "taskmanager"
  | "photos"
  | "about"
  | "kernel";

export type FSNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  parentId: string | null;
  content?: string;
  kind?: "text" | "image";
  modified: number;
};

export type FS = Record<string, FSNode>;

export interface WinState {
  id: string;
  appId: AppId;
  title?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  props?: Record<string, unknown>;
}

export type Accent = "saffron" | "emerald" | "chakra" | "lotus";
export type IconStyle = "windows" | "macos";
export type Lang = "en" | "hi";
export type TimeZone =
  | "Asia/Kolkata"
  | "Europe/London"
  | "America/New_York"
  | "America/Los_Angeles"
  | "UTC";

export interface Settings {
  wallpaper: string;
  accent: Accent;
  iconStyle: IconStyle;
  language: Lang;
  timeZone: TimeZone;
  pinnedApps: AppId[];
  brightness: number;
  nightLight: boolean;
  volume: number;
  userName: string;
  wifi: boolean;
  bluetooth: boolean;
  focus: boolean;
}

export type Phase = "boot" | "setup" | "lock" | "desktop" | "shutdown";
export type Panel = null | "start" | "quick" | "calendar";
