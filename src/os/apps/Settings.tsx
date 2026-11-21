import { Check, Globe, Info, KeyRound, Monitor, Palette, User } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ChakraLogo } from "../ChakraLogo";
import { formatSize } from "../fs";
import { TIME_ZONES } from "../i18n";
import { createPasswordCredential, verifyPassword } from "../password";
import { AppIcon, type AppProps } from "../registry";
import { useOS } from "../store";
import type { Accent, IconStyle } from "../types";
import { WALLPAPERS } from "../wallpapers";

const SECTIONS = [
  { id: "display", label: "Display", icon: Monitor },
  { id: "personalise", label: "Personalisation", icon: Palette },
  { id: "language", label: "Language & region", icon: Globe },
  { id: "account", label: "Account", icon: User },
  { id: "about", label: "About", icon: Info },
] as const;

const ACCENTS: { id: Accent; name: string; tile: string }[] = [
  { id: "saffron", name: "Kesari", tile: "tile-kesari" },
  { id: "emerald", name: "Harit", tile: "tile-harit" },
  { id: "chakra", name: "Chakra", tile: "tile-chakra" },
  { id: "lotus", name: "Kamal", tile: "tile-lotus" },
];

const ICON_STYLES: { id: IconStyle; name: string; description: string }[] = [
  { id: "windows", name: "Windows 11", description: "Clean, softly rounded app tiles" },
  { id: "macos", name: "macOS", description: "Glossy dock-style app icons" },
];

export default function SettingsApp({ win }: AppProps) {
  const { state, dispatch } = useOS();
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => dispatch({ type: "settings", patch });
  const [section, setSection] = useState<string>((win.props?.section as string) ?? "display");
  useEffect(() => {
    if (win.props?.section) setSection(win.props.section as string);
  }, [win.props]);
  const pictures = Object.values(state.fs).filter((n) => n.kind === "image" && n.content);
  const nav = (navigator ?? {}) as Navigator & { deviceMemory?: number };

  return (
    <div className="flex h-full">
      <aside className="w-14 shrink-0 border-r border-border bg-sidebar/60 p-2 sm:w-56">
        <div className="mb-3 hidden items-center gap-3 rounded-xl px-2 py-3 sm:flex">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tiranga-soft font-display font-bold text-primary-foreground">
            {s.userName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{s.userName}</p>
            <p className="text-xs text-muted-foreground">Local account</p>
          </div>
        </div>
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setSection(sec.id)}
            title={sec.label}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
              section === sec.id && "bg-accent",
            )}
          >
            {section === sec.id && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-primary" />}
            <sec.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="hidden sm:inline">{sec.label}</span>
          </button>
        ))}
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <h2 className="mb-5 text-2xl font-semibold">{SECTIONS.find((x) => x.id === section)?.label}</h2>

        {section === "display" && (
          <div className="space-y-3">
            <Row title="Brightness" desc="Dim the whole screen">
              <div className="w-48">
                <Slider value={[s.brightness]} min={20} max={100} onValueChange={([v]) => set({ brightness: v })} />
              </div>
            </Row>
            <Row title="Night light" desc="Warmer colours to help you sleep">
              <Switch checked={s.nightLight} onCheckedChange={(v) => set({ nightLight: v })} />
            </Row>
            <Row title="Focus mode" desc="Mute notification pop-ups">
              <Switch checked={s.focus} onCheckedChange={(v) => set({ focus: v })} />
            </Row>
            <Row title="Volume" desc="System sounds">
              <div className="w-48">
                <Slider value={[s.volume]} min={0} max={100} onValueChange={([v]) => set({ volume: v })} />
              </div>
            </Row>
          </div>
        )}

        {section === "personalise" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Wallpaper</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {[...WALLPAPERS.map((w) => ({ key: w.id, name: w.name, url: w.url })), ...pictures.map((p) => ({ key: `fs:${p.id}`, name: p.name, url: p.content! }))].map((w) => (
                  <button
                    key={w.key}
                    onClick={() => set({ wallpaper: w.key })}
                    className={cn(
                      "group relative overflow-hidden rounded-xl ring-2 ring-transparent transition-all hover:ring-border",
                      s.wallpaper === w.key && "ring-primary",
                    )}
                  >
                    <img src={w.url} alt={w.name} loading="lazy" className="aspect-video w-full object-cover transition-transform group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 bg-dim/60 px-2 py-1 text-left text-xs text-shwet">{w.name}</span>
                    {s.wallpaper === w.key && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Tip: drawings you save in Chitra Paint appear here too.</p>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Accent colour</h3>
              <div className="flex flex-wrap gap-3">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => set({ accent: a.id })}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl bg-secondary px-3 py-2 text-sm ring-2 ring-transparent transition-all hover:bg-accent",
                      s.accent === a.id && "ring-primary",
                    )}
                  >
                    <span className={cn("h-6 w-6 rounded-full", a.tile)} />
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">App icon style</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {ICON_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    aria-pressed={s.iconStyle === style.id}
                    onClick={() => set({ iconStyle: style.id })}
                    className={cn(
                      "flex items-center gap-3 rounded-xl bg-secondary/70 p-4 text-left ring-1 ring-transparent transition-colors hover:bg-accent",
                      s.iconStyle === style.id && "ring-primary",
                    )}
                  >
                    <AppIcon appId="files" size="md" iconStyle={style.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{style.name}</span>
                      <span className="block text-xs text-muted-foreground">{style.description}</span>
                    </span>
                    {s.iconStyle === style.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "language" && (
          <div className="space-y-3">
            {[
              { id: "en" as const, name: "English (India)", native: "English" },
              { id: "hi" as const, name: "Hindi (India)", native: "हिन्दी" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => set({ language: l.id })}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl bg-secondary/70 px-4 py-4 text-left ring-1 ring-transparent transition-colors hover:bg-accent",
                  s.language === l.id && "ring-primary",
                )}
              >
                <span>
                  <span className="block text-sm font-medium">{l.native}</span>
                  <span className="text-xs text-muted-foreground">{l.name}</span>
                </span>
                {s.language === l.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
            <Row
              title="Time zone"
              desc={TIME_ZONES.find((zone) => zone.id === s.timeZone)?.label ?? "Choose a time zone"}
            >
              <select
                aria-label="Time zone"
                value={s.timeZone}
                onChange={(event) => {
                  const zone = TIME_ZONES.find((item) => item.id === event.currentTarget.value);
                  if (zone) set({ timeZone: zone.id });
                }}
                className="h-10 max-w-52 rounded-lg bg-background/70 px-3 text-sm outline-none ring-1 ring-border focus:ring-primary"
              >
                {TIME_ZONES.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.label}</option>
                ))}
              </select>
            </Row>
          </div>
        )}

        {section === "account" && (
          <div className="space-y-8">
            <form
              className="max-w-md space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const v = String(new FormData(e.currentTarget).get("name") ?? "").trim();
                if (!v) return;
                set({ userName: v.slice(0, 32) });
                toast.success("Name updated");
              }}
            >
              <label className="block">
                <span className="text-sm text-muted-foreground">Your name</span>
                <input
                  name="name"
                  defaultValue={s.userName}
                  maxLength={32}
                  className="mt-1.5 h-10 w-full rounded-lg bg-background/60 px-3 text-sm outline-none ring-1 ring-border focus:ring-primary"
                />
              </label>
              <button className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">Save</button>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Erase all files and settings and restart Bharat OS?")) {
                      localStorage.removeItem("bharat-os:v1");
                      location.reload();
                    }
                  }}
                  className="h-10 rounded-lg px-4 text-sm text-destructive ring-1 ring-destructive/50 hover:bg-destructive/10"
                >
                  Reset this PC
                </button>
              </div>
            </form>
            <PasswordSettings />
          </div>
        )}

        {section === "about" && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-2xl bg-hero p-5 ring-1 ring-border">
              <ChakraLogo className="h-14 w-14" />
              <div>
                <p className="font-display text-xl font-semibold">Bharat OS 1.0 “Ganga”</p>
                <p className="text-sm text-muted-foreground">आपका अपना ऑपरेटिंग सिस्टम</p>
              </div>
            </div>
            <Row title="Processor" desc="Logical cores"><span className="text-sm">{nav.hardwareConcurrency ?? "—"}</span></Row>
            <Row title="Memory" desc="Device RAM (approx.)"><span className="text-sm">{nav.deviceMemory ? `${nav.deviceMemory} GB` : "—"}</span></Row>
            <Row title="Storage used" desc="Files saved on this device"><span className="text-sm">{formatSize(JSON.stringify(state.fs).length)}</span></Row>
            <Row title="Screen" desc="Current resolution"><span className="text-sm">{typeof window !== "undefined" ? `${window.innerWidth} × ${window.innerHeight}` : "—"}</span></Row>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordSettings() {
  const { state, dispatch } = useOS();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (next.length < 4) {
      setError("Use a password with at least 4 characters.");
      return;
    }
    if (next !== confirm) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (state.credential && !(await verifyPassword(current, state.credential))) {
        setError("The current password is not correct.");
        return;
      }
      const credential = await createPasswordCredential(next);
      dispatch({ type: "credential", credential });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Sign-in password updated");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={updatePassword} className="max-w-md space-y-4 rounded-2xl bg-secondary/50 p-5">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <KeyRound className="h-4 w-4 text-primary" /> Sign-in password
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {state.credential ? "Change the password used to unlock Bharat OS." : "Add a password for the next time Bharat OS locks."}
        </p>
      </div>
      {state.credential && (
        <label className="block text-sm">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg bg-background/70 px-3 text-sm outline-none ring-1 ring-border focus:ring-primary"
          />
        </label>
      )}
      <label className="block text-sm">
        New password
        <input
          type="password"
          autoComplete="new-password"
          minLength={4}
          maxLength={128}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg bg-background/70 px-3 text-sm outline-none ring-1 ring-border focus:ring-primary"
        />
      </label>
      <label className="block text-sm">
        Confirm new password
        <input
          type="password"
          autoComplete="new-password"
          maxLength={128}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg bg-background/70 px-3 text-sm outline-none ring-1 ring-border focus:ring-primary"
        />
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        This browser-only sign-in lock does not encrypt files or secure your browser profile.
      </p>
      <button
        type="submit"
        disabled={saving}
        className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Updating…" : state.credential ? "Change password" : "Set password"}
      </button>
    </form>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/70 px-4 py-3.5">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
