import {
  BatteryFull,
  BatteryCharging,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Monitor,
  Palette,
  Pin,
  PinOff,
  Search,
  UserRound,
  Video,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { PINNED } from "../appMeta";
import { ChakraLogo } from "../ChakraLogo";
import { AppIcon } from "../registry";
import { useOS } from "../store";
import type { AppId } from "../types";

type TaskbarShortcut = { label: string; icon: LucideIcon; run: () => void };

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

type BatteryLike = { level: number; charging: boolean; addEventListener: (e: string, f: () => void) => void };

function useBattery() {
  const [bat, setBat] = useState<{ level: number; charging: boolean } | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> };
    nav.getBattery?.().then((b) => {
      const upd = () => setBat({ level: b.level, charging: b.charging });
      upd();
      b.addEventListener("levelchange", upd);
      b.addEventListener("chargingchange", upd);
    }).catch(() => undefined);
  }, []);
  return bat;
}

export function Taskbar() {
  const { state, dispatch, openApp, openNode, createNode, t, appName } = useOS();
  const { windows, panel, settings } = state;
  const now = useClock();
  const bat = useBattery();
  const locale = settings.language === "hi" ? "hi-IN" : "en-IN";

  const topWin = windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
  const running = Array.from(new Set(windows.map((w) => w.appId)));
  const pinnedApps = settings.pinnedApps ?? PINNED;
  const apps: AppId[] = Array.from(new Set([...pinnedApps, ...running]));

  const togglePanel = (p: typeof panel) => dispatch({ type: "panel", panel: panel === p ? null : p });

  const clickApp = (appId: AppId) => {
    const wins = windows.filter((w) => w.appId === appId).sort((a, b) => b.z - a.z);
    if (!wins.length) return openApp(appId);
    const w = wins[0];
    if (topWin?.id === w.id) dispatch({ type: "minimize", id: w.id });
    else dispatch({ type: "focus", id: w.id });
    dispatch({ type: "panel", panel: null });
  };

  return (
    <div
      className="absolute inset-x-2 bottom-2 z-[9000] flex h-14 items-center gap-2 rounded-2xl glass px-2 shadow-panel"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-tiranga-soft opacity-70" />

      <button
        aria-label="Start"
        onClick={() => togglePanel("start")}
        className={cn(
          "group flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-accent",
          panel === "start" && "bg-accent shadow-glow",
        )}
      >
        <ChakraLogo className="h-7 w-7 transition-transform duration-700 group-hover:rotate-180" />
      </button>
      <button
        onClick={() => togglePanel("start")}
        className="hidden h-10 w-52 items-center gap-2 rounded-xl bg-secondary/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent md:flex"
      >
        <Search className="h-4 w-4" />
        <span className="truncate">{settings.language === "hi" ? "खोजें" : "Search"}</span>
      </button>

      <div className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
        {apps.map((appId) => {
          const isRunning = running.includes(appId);
          const isActive = topWin?.appId === appId;
          const shortcuts: TaskbarShortcut[] =
            appId === "files"
              ? [
                  { id: "desktop", label: "Desktop", icon: Monitor },
                  { id: "downloads", label: "Downloads", icon: Download },
                  { id: "documents", label: "Documents", icon: FileText },
                  { id: "pictures", label: "Pictures", icon: ImageIcon },
                  { id: "videos", label: "Videos", icon: Video },
                ]
                  .filter((folder) => Boolean(state.fs[folder.id]))
                  .map((folder) => ({
                    label: folder.label,
                    icon: folder.icon,
                    run: () => openApp("files", { folderId: folder.id }),
                  }))
              : appId === "notepad"
                  ? [
                      {
                        label: t("newTextDocument"),
                        icon: FilePlus2,
                        run: () => openNode(createNode("documents", "New text file.txt", "file")),
                      },
                    ]
                    : appId === "settings"
                      ? [
                          { label: t("displaySettings"), icon: Monitor, run: () => openApp("settings", { section: "display" }) },
                          {
                            label: t("personalisationSettings"),
                            icon: Palette,
                            run: () => openApp("settings", { section: "personalise" }),
                          },
                          { label: t("accountSettings"), icon: UserRound, run: () => openApp("settings", { section: "account" }) },
                        ]
                      : [];
          const isPinned = pinnedApps.includes(appId);

          return (
            <ContextMenu key={appId}>
              <ContextMenuTrigger asChild>
                <button
                  title={appName(appId)}
                  aria-label={appName(appId)}
                  onClick={() => clickApp(appId)}
                  className={cn(
                    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all hover:-translate-y-0.5 hover:bg-accent",
                    isActive && "bg-accent",
                  )}
                >
                  <AppIcon appId={appId} size="sm" />
                  {isRunning && (
                    <span
                      className={cn(
                        "absolute bottom-0.5 h-1 rounded-full transition-all",
                        isActive ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground",
                      )}
                    />
                  )}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="z-[9800] min-w-60 rounded-md p-1.5 shadow-panel">
                <ContextMenuLabel>{t("taskbarPinned")}</ContextMenuLabel>
                {shortcuts.map(({ label, icon: Icon, run }) => (
                  <ContextMenuItem key={label} onSelect={run} className="gap-3 px-3 py-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </ContextMenuItem>
                ))}
                {shortcuts.length > 0 && <ContextMenuSeparator />}
                <ContextMenuItem onSelect={() => openApp(appId)} className="gap-3 px-3 py-2">
                  <AppIcon appId={appId} size="xs" />
                  {appId === "files"
                    ? t("fileExplorer")
                    : appId === "browser"
                      ? t("newBrowserWindow")
                      : appId === "paint"
                        ? t("newDrawing")
                        : t("open")}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onSelect={() =>
                    dispatch({
                      type: "settings",
                      patch: {
                        pinnedApps: isPinned
                          ? pinnedApps.filter((pinnedApp) => pinnedApp !== appId)
                          : [...pinnedApps, appId],
                      },
                    })
                  }
                  className="gap-3 px-3 py-2"
                >
                  {isPinned ? <PinOff className="h-4 w-4 text-muted-foreground" /> : <Pin className="h-4 w-4 text-muted-foreground" />}
                  {t(isPinned ? "unpinFromTaskbar" : "pinToTaskbar")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      <button
        onClick={() => dispatch({ type: "settings", patch: { language: settings.language === "en" ? "hi" : "en" } })}
        className="hidden h-10 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
        title="Language"
      >
        {settings.language === "en" ? "ENG" : "हिं"}
      </button>
      <button
        aria-label="Quick settings"
        onClick={() => togglePanel("quick")}
        className={cn(
          "flex h-10 items-center gap-2.5 rounded-xl px-3 text-foreground transition-colors hover:bg-accent",
          panel === "quick" && "bg-accent",
        )}
      >
        {settings.wifi ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
        {settings.volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span className="flex items-center gap-1 text-xs">
          {bat?.charging ? <BatteryCharging className="h-4 w-4" /> : <BatteryFull className="h-4 w-4" />}
          {bat && <span className="hidden sm:inline">{Math.round(bat.level * 100)}%</span>}
        </span>
      </button>
      <button
        aria-label="Calendar"
        onClick={() => togglePanel("calendar")}
        className={cn(
          "flex h-10 flex-col items-end justify-center rounded-xl px-3 leading-tight transition-colors hover:bg-accent",
          panel === "calendar" && "bg-accent",
        )}
      >
        <span className="text-[13px] font-medium tabular-nums">
          {now.toLocaleTimeString(locale, { timeZone: settings.timeZone, hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {now.toLocaleDateString(locale, { timeZone: settings.timeZone, day: "numeric", month: "short", year: "numeric" })}
        </span>
      </button>
      <button
        title="Show desktop"
        aria-label="Show desktop"
        onClick={() => dispatch({ type: "minimizeAll" })}
        className="h-8 w-1.5 rounded-full bg-border transition-colors hover:bg-primary"
      />
    </div>
  );
}

export { useClock };
