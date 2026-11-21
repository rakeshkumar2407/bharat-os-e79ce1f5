import { FilePlus, FileText, FolderPlus, Image as ImageIcon, Folder, Info, Palette, RefreshCw, SquareTerminal } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { children } from "../fs";
import { AppIcon } from "../registry";
import { useOS } from "../store";
import type { AppId, FSNode } from "../types";
import { wallpaperUrl } from "../wallpapers";
import { CalendarPanel, QuickPanel } from "./Panels";
import { StartMenu } from "./StartMenu";
import { Taskbar } from "./Taskbar";
import { Window } from "./Window";

const DESKTOP_APPS: AppId[] = ["files", "browser", "terminal", "notepad", "paint", "settings", "kernel"];

export function Desktop() {
  const { state, dispatch, openApp, openNode, createNode, t, appName } = useOS();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "panel", panel: null });
        setMenu(null);
      }
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        dispatch({ type: "panel", panel: state.panel === "start" ? null : "start" });
      }
      if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        openApp("terminal");
      }
      if (e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        openApp("files");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, openApp, state.panel]);

  const deskFiles = children(state.fs, "desktop");
  const visible = state.windows.filter((w) => !w.minimized);
  const topZ = visible.length ? Math.max(...visible.map((w) => w.z)) : -1;

  const items: { key: string; label: string; icon: React.ReactNode; open: () => void; node?: FSNode }[] = [
    ...DESKTOP_APPS.map((a) => ({
      key: a,
      label: appName(a),
      icon: <AppIcon appId={a} size="lg" />,
      open: () => openApp(a),
    })),
    ...deskFiles.map((n) => ({
      key: n.id,
      label: n.name,
      node: n,
      icon: (
        <span className="flex h-12 w-12 items-center justify-center">
          {n.type === "folder" ? (
            <Folder className="h-11 w-11 fill-kesari/80 text-kesari" strokeWidth={1.2} />
          ) : n.kind === "image" ? (
            <ImageIcon className="h-10 w-10 text-chakra" strokeWidth={1.4} />
          ) : (
            <FileText className="h-10 w-10 text-shwet" strokeWidth={1.4} />
          )}
        </span>
      ),
      open: () => openNode(n),
    })),
  ];

  const nightOpacity = state.settings.nightLight ? 0.18 : 0;
  const dimOpacity = ((100 - state.settings.brightness) / 100) * 0.75;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onClick={() => {
        setMenu(null);
        setSelected(null);
        if (state.panel) dispatch({ type: "panel", panel: null });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: Math.min(e.clientX, window.innerWidth - 230), y: Math.min(e.clientY, window.innerHeight - 300) });
      }}
    >
      <img
        src={wallpaperUrl(state.settings.wallpaper, state.fs)}
        alt=""
        className="absolute inset-0 h-full w-full select-none object-cover animate-fade"
        draggable={false}
      />

      {/* Desktop icons */}
      <div className="absolute inset-y-0 left-0 bottom-20 flex flex-col flex-wrap content-start gap-1 p-3">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(it.key);
              if (coarse) it.open();
            }}
            onDoubleClick={it.open}
            onContextMenu={(e) => {
              if (!it.node) return;
              e.stopPropagation();
              e.preventDefault();
              setSelected(it.key);
              setRenaming(it.key);
            }}
            className={cn(
              "flex w-24 flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition-colors hover:bg-background/30",
              selected === it.key && "bg-background/40 ring-1 ring-primary/50",
            )}
          >
            {it.icon}
            {renaming === it.key && it.node ? (
              <input
                autoFocus
                defaultValue={it.node.name}
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && it.node) dispatch({ type: "fsUpdate", id: it.node.id, patch: { name: v } });
                  setRenaming(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setRenaming(null);
                }}
                className="w-full rounded bg-background px-1 text-center text-xs outline-none ring-1 ring-primary"
              />
            ) : (
              <span className="line-clamp-2 text-xs font-medium text-shwet drop-shadow-[0_1px_2px_var(--dim)]">
                {it.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Windows */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()} style={{ pointerEvents: "none" }}>
        {state.windows.map((w) => (
          <div key={w.id} style={{ pointerEvents: "auto" }}>
            <Window win={w} active={w.z === topZ} />
          </div>
        ))}
      </div>

      <Taskbar />
      {state.panel === "start" && <StartMenu />}
      {state.panel === "quick" && <QuickPanel />}
      {state.panel === "calendar" && <CalendarPanel />}

      {menu && (
        <div
          className="absolute z-[9800] w-56 rounded-xl glass-strong p-1.5 text-sm shadow-panel animate-panel-in"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { icon: FolderPlus, label: t("newFolder"), act: () => setRenaming(createNode("desktop", "New folder", "folder").id) },
            { icon: FilePlus, label: t("newFile"), act: () => setRenaming(createNode("desktop", "New text file.txt", "file").id) },
            { sep: true },
            { icon: RefreshCw, label: t("refresh"), act: () => undefined },
            { icon: SquareTerminal, label: t("openTerminal"), act: () => openApp("terminal") },
            { icon: Palette, label: t("personalise"), act: () => openApp("settings", { section: "personalise" }) },
            { sep: true },
            { icon: Info, label: t("about"), act: () => openApp("about") },
          ].map((m, i) =>
            "sep" in m ? (
              <div key={i} className="my-1 h-px bg-border" />
            ) : (
              <button
                key={i}
                onClick={() => {
                  m.act();
                  setMenu(null);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
              >
                <m.icon className="h-4 w-4 text-muted-foreground" />
                {m.label}
              </button>
            ),
          )}
        </div>
      )}

      {/* Display filters */}
      <div className="pointer-events-none absolute inset-0 z-[9999] bg-night mix-blend-multiply transition-opacity" style={{ opacity: nightOpacity }} />
      <div className="pointer-events-none absolute inset-0 z-[9999] bg-dim transition-opacity" style={{ opacity: dimOpacity }} />
    </div>
  );
}
