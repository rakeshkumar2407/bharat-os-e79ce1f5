import { Cpu, HardDrive, MemoryStick, Timer, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatSize } from "../fs";
import { AppIcon } from "../registry";
import { useOS } from "../store";

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export default function TaskManagerApp() {
  const { state, dispatch, appName } = useOS();
  const [tick, setTick] = useState(0);
  const [cpuHist, setCpuHist] = useState<number[]>(Array(40).fill(4));

  const cpuFor = (id: string, minimized: boolean) => {
    const base = (hash(id + tick) % 70) / 10;
    return minimized ? base / 4 : base + 0.4;
  };
  const total = state.windows.reduce((a, w) => a + cpuFor(w.id, w.minimized), 2 + (tick % 3));

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => setCpuHist((h) => [...h.slice(1), Math.min(100, total)]), [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const perf = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const up = state.sessionStart ? Math.floor((Date.now() - state.sessionStart) / 1000) : 0;
  const uptime = `${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m ${up % 60}s`;
  const points = cpuHist.map((v, i) => `${(i / (cpuHist.length - 1)) * 100},${40 - (v / 100) * 40 * 3}`).join(" ");

  const cards = [
    { icon: Cpu, label: "CPU", value: `${total.toFixed(1)}%`, sub: `${nav.hardwareConcurrency ?? "?"} cores` },
    { icon: MemoryStick, label: "Memory", value: perf ? formatSize(perf.usedJSHeapSize) : `${state.windows.length * 42 + 180} MB`, sub: nav.deviceMemory ? `of ${nav.deviceMemory} GB` : "in use" },
    { icon: HardDrive, label: "Disk", value: formatSize(JSON.stringify(state.fs).length), sub: "of 5 MB" },
    { icon: Timer, label: "Up time", value: uptime, sub: "since sign in" },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-secondary/70 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <c.icon className="h-3.5 w-3.5 text-primary" /> {c.label}
            </div>
            <p className="mt-1.5 font-display text-lg font-semibold tabular-nums">{c.value}</p>
            <p className="text-[11px] text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-secondary/70 p-4">
        <p className="mb-2 text-xs text-muted-foreground">CPU usage — last minute</p>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-20 w-full text-primary">
          <polyline points={`0,40 ${points} 100,40`} fill="currentColor" fillOpacity="0.15" stroke="none" />
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-semibold">Processes ({state.windows.length + 3})</h3>
      <div className="overflow-hidden rounded-xl ring-1 ring-border">
        <div className="grid grid-cols-[1fr_90px_70px_80px_44px] bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          <span>Name</span>
          <span>Status</span>
          <span className="text-right">CPU</span>
          <span className="text-right">Memory</span>
          <span />
        </div>
        {state.windows.map((w) => (
          <div key={w.id} className="grid grid-cols-[1fr_90px_70px_80px_44px] items-center border-t border-border px-3 py-2 text-sm hover:bg-accent/50">
            <span className="flex min-w-0 items-center gap-2">
              <AppIcon appId={w.appId} size="xs" />
              <span className="truncate">{w.title ?? appName(w.appId)}</span>
            </span>
            <span className="text-xs text-muted-foreground">{w.minimized ? "Suspended" : "Running"}</span>
            <span className="text-right tabular-nums">{cpuFor(w.id, w.minimized).toFixed(1)}%</span>
            <span className="text-right tabular-nums">{(hash(w.id) % 80) + 24} MB</span>
            <button
              aria-label="End task"
              title="End task"
              onClick={() => dispatch({ type: "close", id: w.id })}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {["Desktop shell", "Window manager", "File system service"].map((p, i) => (
          <div key={p} className="grid grid-cols-[1fr_90px_70px_80px_44px] items-center border-t border-border px-3 py-2 text-sm text-muted-foreground">
            <span>{p}</span>
            <span className="text-xs">System</span>
            <span className="text-right tabular-nums">{((tick + i) % 4) * 0.3}%</span>
            <span className="text-right tabular-nums">{[38, 22, 12][i]} MB</span>
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}
