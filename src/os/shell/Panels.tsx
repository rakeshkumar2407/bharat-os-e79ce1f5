import { Bluetooth, Moon, Plane, Settings as SettingsIcon, Sun, Volume2, Wifi, BellOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { useOS } from "../store";
import { useClock } from "./Taskbar";

export function QuickPanel() {
  const { state, dispatch, openApp, t } = useOS();
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => dispatch({ type: "settings", patch });
  const airplane = !s.wifi && !s.bluetooth;
  const toggles = [
    { icon: Wifi, label: "Wi-Fi", on: s.wifi, act: () => set({ wifi: !s.wifi }) },
    { icon: Bluetooth, label: "Bluetooth", on: s.bluetooth, act: () => set({ bluetooth: !s.bluetooth }) },
    { icon: Plane, label: "Airplane", on: airplane, act: () => set(airplane ? { wifi: true } : { wifi: false, bluetooth: false }) },
    { icon: Moon, label: "Night light", on: s.nightLight, act: () => set({ nightLight: !s.nightLight }) },
    { icon: BellOff, label: "Focus", on: s.focus, act: () => set({ focus: !s.focus }) },
  ];
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-20 right-2 z-[9500] w-[min(360px,calc(100vw-1rem))] rounded-3xl glass-strong p-5 shadow-panel animate-panel-in"
    >
      <div className="grid grid-cols-3 gap-2">
        {toggles.map(({ icon: Icon, label, on, act }) => (
          <button
            key={label}
            onClick={act}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs transition-all",
              on ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary hover:bg-accent",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
        <button
          onClick={() => openApp("settings")}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary px-2 py-3 text-xs transition-colors hover:bg-accent"
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </button>
      </div>
      <div className="mt-5 space-y-5">
        <label className="flex items-center gap-3">
          <Sun className="h-4 w-4 text-muted-foreground" aria-label={t("brightness")} />
          <Slider value={[s.brightness]} min={20} max={100} step={1} onValueChange={([v]) => set({ brightness: v })} />
          <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{s.brightness}</span>
        </label>
        <label className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" aria-label={t("volume")} />
          <Slider value={[s.volume]} min={0} max={100} step={1} onValueChange={([v]) => set({ volume: v })} />
          <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{s.volume}</span>
        </label>
      </div>
    </div>
  );
}

export function CalendarPanel() {
  const { state } = useOS();
  const now = useClock();
  const [day, setDay] = useState<Date | undefined>(new Date());
  const hi = state.settings.language === "hi";
  const locale = hi ? "hi-IN" : "en-IN";
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-20 right-2 z-[9500] w-[min(340px,calc(100vw-1rem))] rounded-3xl glass-strong p-5 shadow-panel animate-panel-in"
    >
      <p className="font-display text-4xl font-semibold tabular-nums">
        {now.toLocaleTimeString(locale, { timeZone: state.settings.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="mt-1 text-sm text-primary">
        {now.toLocaleDateString(locale, { timeZone: state.settings.timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>
      <p className="text-xs text-muted-foreground">
        {now.toLocaleDateString("hi-IN-u-ca-indian", { timeZone: state.settings.timeZone, day: "numeric", month: "long", year: "numeric" })} · शक संवत
      </p>
      <div className="mt-3 flex justify-center rounded-2xl bg-background/40">
        <Calendar mode="single" selected={day} onSelect={setDay} className="bg-transparent" />
      </div>
    </div>
  );
}
