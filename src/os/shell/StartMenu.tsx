import { FileText, Image as ImageIcon, Lock, Power, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ALL_APPS } from "../appMeta";
import { APP_NAMES } from "../i18n";
import { AppIcon } from "../registry";
import { useOS } from "../store";
import { pathOf } from "../fs";

export function StartMenu() {
  const { state, dispatch, openApp, openNode, t, appName } = useOS();
  const [q, setQ] = useState("");
  const [power, setPower] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const files = useMemo(() => Object.values(state.fs).filter((n) => n.type === "file"), [state.fs]);
  const recent = useMemo(() => [...files].sort((a, b) => b.modified - a.modified).slice(0, 4), [files]);
  const query = q.trim().toLowerCase();
  const appHits = ALL_APPS.filter(
    (a) => APP_NAMES[a].en.toLowerCase().includes(query) || APP_NAMES[a].hi.includes(query),
  );
  const fileHits = query ? files.filter((f) => f.name.toLowerCase().includes(query)).slice(0, 6) : [];

  const hour = new Date().getHours();
  const name = state.settings.userName;

  return (
    <div
      className="absolute bottom-20 left-1/2 z-[9500] flex max-h-[calc(100%-6rem)] w-[min(640px,calc(100vw-1rem))] -translate-x-1/2 flex-col overflow-hidden rounded-3xl glass-strong shadow-panel animate-panel-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-hero px-7 pb-4 pt-6">
        <p className="text-sm text-muted-foreground">
          {hour < 12 ? "Suprabhat 🌅" : hour < 17 ? "Shubh dopahar ☀️" : "Shubh sandhya 🪔"}
        </p>
        <h2 className="mt-0.5 text-2xl font-semibold">
          {t("greeting")}, <span className="text-tiranga">{name}</span>
        </h2>
        <label className="mt-4 flex h-11 items-center gap-3 rounded-xl bg-background/60 px-4 ring-1 ring-border focus-within:ring-primary">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (appHits[0]) openApp(appHits[0]);
                else if (fileHits[0]) openNode(fileHits[0]);
              }
              if (e.key === "Escape") dispatch({ type: "panel", panel: null });
            }}
            placeholder={t("search")}
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {query ? "Apps" : t("pinned")}
        </h3>
        {appHits.length ? (
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
            {appHits.map((a) => (
              <button
                key={a}
                onClick={() => openApp(a)}
                className="flex flex-col items-center gap-2 rounded-xl px-1 py-3 text-center transition-colors hover:bg-accent"
              >
                <AppIcon appId={a} size="lg" />
                <span className="line-clamp-2 text-xs leading-tight">{appName(a)}</span>
              </button>
            ))}
          </div>
        ) : (
          !fileHits.length && <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>
        )}

        {(query ? fileHits : recent).length > 0 && (
          <>
            <h3 className="mb-2 mt-5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {query ? "Files" : t("recent")}
            </h3>
            <div className="grid gap-1 sm:grid-cols-2">
              {(query ? fileHits : recent).map((f) => (
                <button
                  key={f.id}
                  onClick={() => openNode(f)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    {f.kind === "image" ? <ImageIcon className="h-4 w-4 text-chakra" /> : <FileText className="h-4 w-4 text-primary" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{f.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{pathOf(state.fs, f.parentId ?? "root")}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative flex items-center justify-between border-t border-border bg-background/40 px-6 py-3">
        <button
          onClick={() => openApp("settings", { section: "account" })}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tiranga-soft font-display text-sm font-bold text-primary-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium">{name}</span>
        </button>
        <button
          aria-label="Power"
          onClick={() => setPower((p) => !p)}
          className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-accent", power && "bg-accent")}
        >
          <Power className="h-4 w-4" />
        </button>
        {power && (
          <div className="absolute bottom-14 right-4 w-44 rounded-xl glass-strong p-1.5 shadow-panel animate-panel-in">
            {[
              { icon: Lock, label: t("lock"), phase: "lock" as const },
              { icon: RotateCcw, label: t("restart"), phase: "boot" as const },
              { icon: Power, label: t("shutdown"), phase: "shutdown" as const },
            ].map(({ icon: Icon, label, phase }) => (
              <button
                key={phase}
                onClick={() => dispatch({ type: "phase", phase })}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
