import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { APP_META, PINNED } from "./appMeta";
import { createInitialFS, descendants, PROTECTED, ROOT, uid, uniqueName } from "./fs";
import { APP_NAMES, translate, type StringKey } from "./i18n";
import type { PasswordCredential } from "./password";
import type { AppId, FS, FSNode, Panel, Phase, Settings, WinState } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  wallpaper: "dawn",
  accent: "saffron",
  iconStyle: "windows",
  language: "en",
  timeZone: "Asia/Kolkata",
  pinnedApps: [...PINNED],
  brightness: 100,
  nightLight: false,
  volume: 60,
  userName: "Bharat User",
  wifi: true,
  bluetooth: false,
  focus: false,
};

export interface OSState {
  phase: Phase;
  windows: WinState[];
  fs: FS;
  settings: Settings;
  credential: PasswordCredential | null;
  setupComplete: boolean;
  zTop: number;
  hydrated: boolean;
  panel: Panel;
  sessionStart: number;
}

type Action =
  | { type: "hydrate"; fs?: FS; settings?: Partial<Settings>; credential?: PasswordCredential | null; setupComplete: boolean }
  | { type: "completeSetup"; settings: Partial<Settings>; credential: PasswordCredential }
  | { type: "credential"; credential: PasswordCredential }
  | { type: "phase"; phase: Phase }
  | { type: "panel"; panel: Panel }
  | { type: "open"; appId: AppId; props?: Record<string, unknown>; title?: string; vw: number; vh: number }
  | { type: "close"; id: string }
  | { type: "focus"; id: string }
  | { type: "minimize"; id: string }
  | { type: "minimizeAll" }
  | { type: "toggleMax"; id: string; value?: boolean }
  | { type: "bounds"; id: string; x: number; y: number; w?: number; h?: number }
  | { type: "title"; id: string; title: string }
  | { type: "fsCreate"; node: FSNode }
  | { type: "fsUpdate"; id: string; patch: Partial<FSNode> }
  | { type: "fsDelete"; id: string }
  | { type: "settings"; patch: Partial<Settings> };

const initialState: OSState = {
  phase: "boot",
  windows: [],
  fs: createInitialFS(0),
  settings: DEFAULT_SETTINGS,
  credential: null,
  setupComplete: false,
  zTop: 10,
  hydrated: false,
  panel: null,
  sessionStart: 0,
};

function reducer(state: OSState, a: Action): OSState {
  switch (a.type) {
    case "hydrate":
      return {
        ...state,
        hydrated: true,
        fs: a.fs ?? createInitialFS(),
        settings: { ...DEFAULT_SETTINGS, ...a.settings },
        credential: a.credential ?? null,
        setupComplete: a.setupComplete,
      };
    case "completeSetup":
      return {
        ...state,
        phase: "desktop",
        credential: a.credential,
        setupComplete: true,
        settings: { ...state.settings, ...a.settings },
      };
    case "credential":
      return { ...state, credential: a.credential };
    case "phase":
      return {
        ...state,
        phase: a.phase,
        panel: null,
        windows: a.phase === "boot" || a.phase === "shutdown" ? [] : state.windows,
        sessionStart:
          a.phase === "boot" || a.phase === "shutdown"
            ? 0
            : a.phase === "desktop" && !state.sessionStart
              ? Date.now()
              : state.sessionStart,
      };
    case "panel":
      return { ...state, panel: a.panel };
    case "open": {
      const meta = APP_META[a.appId];
      const z = state.zTop + 1;
      if (meta.single) {
        const ex = state.windows.find((w) => w.appId === a.appId);
        if (ex) {
          return {
            ...state,
            zTop: z,
            panel: null,
            windows: state.windows.map((w) =>
              w.id === ex.id ? { ...w, z, minimized: false, props: a.props ?? w.props } : w,
            ),
          };
        }
      }
      const mobile = a.vw < 768;
      const w = Math.min(meta.w, a.vw - 24);
      const h = Math.min(meta.h, a.vh - 110);
      const n = state.windows.length % 6;
      const x = Math.max(8, Math.round((a.vw - w) / 2 + n * 28 - 70));
      const y = Math.max(8, Math.round((a.vh - 80 - h) / 2 + n * 28 - 60));
      const win: WinState = {
        id: uid(),
        appId: a.appId,
        title: a.title,
        x,
        y,
        w,
        h,
        z,
        minimized: false,
        maximized: mobile,
        props: a.props,
      };
      return { ...state, zTop: z, panel: null, windows: [...state.windows, win] };
    }
    case "close":
      return { ...state, windows: state.windows.filter((w) => w.id !== a.id) };
    case "focus": {
      const z = state.zTop + 1;
      return {
        ...state,
        zTop: z,
        windows: state.windows.map((w) => (w.id === a.id ? { ...w, z, minimized: false } : w)),
      };
    }
    case "minimize":
      return { ...state, windows: state.windows.map((w) => (w.id === a.id ? { ...w, minimized: true } : w)) };
    case "minimizeAll": {
      const allMin = state.windows.every((w) => w.minimized);
      return { ...state, panel: null, windows: state.windows.map((w) => ({ ...w, minimized: !allMin })) };
    }
    case "toggleMax":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === a.id ? { ...w, maximized: a.value ?? !w.maximized } : w,
        ),
      };
    case "bounds":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === a.id ? { ...w, x: a.x, y: a.y, w: a.w ?? w.w, h: a.h ?? w.h } : w,
        ),
      };
    case "title":
      return { ...state, windows: state.windows.map((w) => (w.id === a.id ? { ...w, title: a.title } : w)) };
    case "fsCreate":
      return { ...state, fs: { ...state.fs, [a.node.id]: a.node } };
    case "fsUpdate": {
      const node = state.fs[a.id];
      if (!node) return state;
      return { ...state, fs: { ...state.fs, [a.id]: { ...node, ...a.patch, modified: Date.now() } } };
    }
    case "fsDelete": {
      if (PROTECTED.has(a.id)) return state;
      const kill = new Set(descendants(state.fs, a.id));
      const fs = Object.fromEntries(Object.entries(state.fs).filter(([id]) => !kill.has(id)));
      return { ...state, fs };
    }
    case "settings":
      return { ...state, settings: { ...state.settings, ...a.patch } };
  }
}

const STORAGE_KEY = "bharat-os:v1";

interface OSContextValue {
  state: OSState;
  dispatch: React.Dispatch<Action>;
  openApp: (appId: AppId, props?: Record<string, unknown>, title?: string) => void;
  openNode: (node: FSNode) => void;
  createNode: (parentId: string, name: string, type: "file" | "folder", content?: string, kind?: "text" | "image") => FSNode;
  t: (key: StringKey) => string;
  appName: (id: AppId) => string;
}

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const savedFs = parsed?.fs as FS | undefined;
      const fs =
        savedFs && !savedFs["videos"]
          ? {
              ...savedFs,
              videos: {
                id: "videos",
                name: "Videos",
                type: "folder" as const,
                parentId: ROOT,
                modified: Date.now(),
              },
            }
          : savedFs;
      dispatch({
        type: "hydrate",
        ...(fs ? { fs } : {}),
        settings: parsed?.settings,
        credential: parsed?.credential,
        setupComplete: parsed?.setupComplete ?? Boolean(parsed?.settings || parsed?.fs),
      });
    } catch {
      dispatch({ type: "hydrate", setupComplete: false });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fs: state.fs,
          settings: state.settings,
          credential: state.credential,
          setupComplete: state.setupComplete,
        }),
      );
    } catch {
      // storage full — keep running in memory
    }
  }, [state.fs, state.settings, state.credential, state.setupComplete, state.hydrated]);

  const openApp = useCallback((appId: AppId, props?: Record<string, unknown>, title?: string) => {
    dispatch({ type: "open", appId, props, title, vw: window.innerWidth, vh: window.innerHeight });
  }, []);

  const createNode = useCallback<OSContextValue["createNode"]>(
    (parentId, name, type, content, kind) => {
      const node: FSNode = {
        id: uid(),
        name: uniqueName(state.fs, parentId, name),
        type,
        parentId,
        content: type === "file" ? (content ?? "") : undefined,
        kind: type === "file" ? (kind ?? "text") : undefined,
        modified: Date.now(),
      };
      dispatch({ type: "fsCreate", node });
      return node;
    },
    [state.fs],
  );

  const openNode = useCallback(
    (node: FSNode) => {
      if (node.type === "folder") openApp("files", { folderId: node.id });
      else if (node.kind === "image") openApp("photos", { fileId: node.id });
      else openApp("notepad", { fileId: node.id }, node.name);
    },
    [openApp],
  );

  const value = useMemo<OSContextValue>(
    () => ({
      state,
      dispatch,
      openApp,
      openNode,
      createNode,
      t: (key) => translate(state.settings.language, key),
      appName: (id) => APP_NAMES[id][state.settings.language],
    }),
    [state, openApp, openNode, createNode],
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used inside OSProvider");
  return ctx;
}
