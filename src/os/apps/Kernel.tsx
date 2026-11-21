import { Activity, Cpu, HardDrive, ShieldCheck, TimerReset, Wrench } from "lucide-react";
import { formatSize } from "../fs";
import { useOS } from "../store";

const SERVICE_ITEMS = [
  "Desktop shell",
  "Window manager",
  "Filesystem service",
  "Input handler",
  "Power manager",
  "Accessibility layer",
] as const;

export default function KernelApp() {
  const { state, dispatch } = useOS();
  const now = Date.now();
  const uptimeMs = Math.max(0, now - (state.sessionStart || now));
  const uptime = new Date(uptimeMs).toISOString().slice(11, 19);
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memGb = nav.deviceMemory ?? 8;
  const usedMem = Math.max(140, Math.round((state.windows.length + 3) * 42 + memGb * 140));

  return (
    <div className="flex h-full flex-col bg-card/80 p-5 text-sm text-foreground">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Kernel</p>
          <h2 className="mt-1 text-2xl font-semibold">Bharat OS Web Kernel</h2>
        </div>
        <div className="rounded-xl bg-tiranga-soft px-3 py-2 text-right text-xs text-primary-foreground">
          <div className="font-semibold">Status</div>
          <div>Online</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><TimerReset className="h-4 w-4" /> Uptime</div>
          <div className="text-2xl font-semibold">{uptime}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Cpu className="h-4 w-4" /> CPU</div>
          <div className="text-2xl font-semibold">{Math.min(96, 36 + state.windows.length * 7)}%</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><HardDrive className="h-4 w-4" /> Memory</div>
          <div className="text-2xl font-semibold">{formatSize(usedMem * 1024 * 1024)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Activity className="h-4 w-4" /> Processes</div>
          <div className="text-2xl font-semibold">{state.windows.length + 5}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-3 flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="h-4 w-4" /> System services</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICE_ITEMS.map((service) => (
              <div key={service} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2">
                <span>{service}</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">Running</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="mb-3 flex items-center gap-2 font-medium text-foreground"><Wrench className="h-4 w-4" /> Shell</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>Shell: Bharat desktop environment</li>
            <li>Theme: {state.settings.accent}</li>
            <li>Brightness: {state.settings.brightness}%</li>
            <li>Language: {state.settings.language === "hi" ? "हिंदी" : "English"}</li>
            <li>Display: {window.innerWidth} × {window.innerHeight}</li>
            <li>User: {state.settings.userName}</li>
          </ul>
          <button
            type="button"
            onClick={() => dispatch({ type: "phase", phase: "boot" })}
            className="mt-4 inline-flex rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Reboot shell
          </button>
        </div>
      </div>
    </div>
  );
}
