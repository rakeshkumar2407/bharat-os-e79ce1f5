import { Copy, Minus, Square, X } from "lucide-react";
import { useRef, type PointerEvent as RPointerEvent } from "react";
import { cn } from "@/lib/utils";
import { APP_META } from "../appMeta";
import { APPS, AppIcon } from "../registry";
import { useOS } from "../store";
import type { WinState } from "../types";

const TASKBAR = 72;
const DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
const handleClass: Record<(typeof DIRS)[number], string> = {
  n: "top-0 left-2 right-2 h-1.5 cursor-ns-resize",
  s: "bottom-0 left-2 right-2 h-1.5 cursor-ns-resize",
  e: "right-0 top-2 bottom-2 w-1.5 cursor-ew-resize",
  w: "left-0 top-2 bottom-2 w-1.5 cursor-ew-resize",
  ne: "right-0 top-0 h-3 w-3 cursor-nesw-resize",
  nw: "left-0 top-0 h-3 w-3 cursor-nwse-resize",
  se: "right-0 bottom-0 h-3 w-3 cursor-nwse-resize",
  sw: "left-0 bottom-0 h-3 w-3 cursor-nesw-resize",
};

export function Window({ win, active }: { win: WinState; active: boolean }) {
  const { dispatch, appName } = useOS();
  const ref = useRef<HTMLDivElement>(null);
  const App = APPS[win.appId].component;
  const meta = APP_META[win.appId];
  const minW = meta.minW ?? 320;
  const minH = meta.minH ?? 220;

  const focus = () => {
    if (!active) dispatch({ type: "focus", id: win.id });
  };

  const startDrag = (e: RPointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const el = ref.current;
    if (!el) return;
    focus();
    let ox = win.x;
    let oy = win.y;
    const sx = e.clientX;
    const sy = e.clientY;
    let restored = !win.maximized;
    let nx = ox;
    let ny = oy;
    let moved = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      moved = true;
      if (!restored) {
        restored = true;
        dispatch({ type: "toggleMax", id: win.id, value: false });
        ox = ev.clientX - win.w / 2;
        oy = 0;
      }
      nx = Math.min(Math.max(ox + dx, -win.w + 120), window.innerWidth - 120);
      ny = Math.min(Math.max(oy + dy, 0), window.innerHeight - TASKBAR - 40);
      el.style.left = `${nx}px`;
      el.style.top = `${ny}px`;
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!moved) return;
      dispatch({ type: "bounds", id: win.id, x: nx, y: ny });
      if (ev.clientY <= 2) dispatch({ type: "toggleMax", id: win.id, value: true });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (dir: string) => (e: RPointerEvent) => {
    e.stopPropagation();
    const el = ref.current;
    if (!el || win.maximized) return;
    focus();
    const sx = e.clientX;
    const sy = e.clientY;
    let { x, y, w, h } = win;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      x = win.x;
      y = win.y;
      w = win.w;
      h = win.h;
      if (dir.includes("e")) w = Math.max(minW, win.w + dx);
      if (dir.includes("s")) h = Math.max(minH, win.h + dy);
      if (dir.includes("w")) {
        w = Math.max(minW, win.w - dx);
        x = win.x + (win.w - w);
      }
      if (dir.includes("n")) {
        h = Math.max(minH, win.h - dy);
        y = Math.max(0, win.y + (win.h - h));
      }
      Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dispatch({ type: "bounds", id: win.id, x, y, w, h });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const style = win.maximized
    ? { left: 0, top: 0, width: "100%", height: `calc(100% - ${TASKBAR}px)`, zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  const title = win.title ?? appName(win.appId);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      onPointerDownCapture={focus}
      style={style}
      className={cn(
        "absolute flex flex-col overflow-hidden glass-strong shadow-window animate-window-in transition-[opacity,transform] duration-200",
        win.maximized ? "rounded-none border-x-0 border-t-0" : "rounded-xl",
        win.minimized && "pointer-events-none translate-y-10 scale-95 opacity-0",
        active ? "border-primary/30" : "opacity-[0.97]",
      )}
    >
      <div
        onPointerDown={startDrag}
        onDoubleClick={() => dispatch({ type: "toggleMax", id: win.id })}
        className={cn(
          "flex h-10 shrink-0 select-none items-center gap-2.5 pl-3",
          active ? "bg-secondary/60" : "bg-secondary/30",
        )}
      >
        <AppIcon appId={win.appId} size="xs" />
        <span className={cn("truncate text-[13px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>
          {title}
        </span>
        <div className="ml-auto flex h-full">
          <button
            aria-label="Minimise"
            onClick={() => dispatch({ type: "minimize", id: win.id })}
            className="flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            aria-label={win.maximized ? "Restore" : "Maximise"}
            onClick={() => dispatch({ type: "toggleMax", id: win.id })}
            className="flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {win.maximized ? <Copy className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          </button>
          <button
            aria-label="Close"
            onClick={() => dispatch({ type: "close", id: win.id })}
            className="flex w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 bg-card/70">
        <App win={win} />
      </div>
      {!win.maximized &&
        DIRS.map((d) => (
          <div key={d} onPointerDown={startResize(d)} className={cn("absolute z-10", handleClass[d])} />
        ))}
    </div>
  );
}
