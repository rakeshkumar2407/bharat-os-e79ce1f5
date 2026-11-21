import { ChevronLeft, ChevronRight, ImageOff, Trash2, Wallpaper } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AppProps } from "../registry";
import { useOS } from "../store";
import { WALLPAPERS } from "../wallpapers";

export default function PhotosApp({ win }: AppProps) {
  const { state, dispatch } = useOS();
  const items = useMemo(
    () => [
      ...Object.values(state.fs)
        .filter((n) => n.kind === "image" && n.content)
        .sort((a, b) => b.modified - a.modified)
        .map((n) => ({ key: `fs:${n.id}`, name: n.name, url: n.content!, fsId: n.id })),
      ...WALLPAPERS.map((w) => ({ key: w.id, name: w.name, url: w.url, fsId: undefined as string | undefined })),
    ],
    [state.fs],
  );
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const fid = win.props?.fileId as string | undefined;
    if (fid) {
      const i = items.findIndex((x) => x.fsId === fid);
      if (i >= 0) setOpen(i);
    }
  }, [win.props]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = open !== null ? items[open] : null;

  if (cur) {
    return (
      <div
        className="flex h-full flex-col bg-dim"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setOpen((o) => Math.min(items.length - 1, (o ?? 0) + 1));
          if (e.key === "ArrowLeft") setOpen((o) => Math.max(0, (o ?? 0) - 1));
          if (e.key === "Escape") setOpen(null);
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <button onClick={() => setOpen(null)} className="rounded-lg px-3 py-1.5 text-sm hover:bg-accent">
            ← All photos
          </button>
          <span className="truncate text-sm text-muted-foreground">{cur.name}</span>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => {
                dispatch({ type: "settings", patch: { wallpaper: cur.key } });
                toast.success("Wallpaper updated");
              }}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Wallpaper className="h-3.5 w-3.5" /> Set as wallpaper
            </button>
            {cur.fsId && (
              <button
                aria-label="Delete"
                onClick={() => {
                  dispatch({ type: "fsDelete", id: cur.fsId! });
                  setOpen(null);
                }}
                className="rounded-lg px-2 hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
          <img src={cur.url} alt={cur.name} className="max-h-full max-w-full rounded-lg object-contain shadow-panel" />
          {open! > 0 && (
            <button aria-label="Previous" onClick={() => setOpen(open! - 1)} className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full glass">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {open! < items.length - 1 && (
            <button aria-label="Next" onClick={() => setOpen(open! + 1)} className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full glass">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <h2 className="text-xl font-semibold">Photos</h2>
      <p className="text-sm text-muted-foreground">Your pictures and Bharat OS wallpapers</p>
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <ImageOff className="h-10 w-10" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((it, i) => (
            <button
              key={it.key}
              onClick={() => setOpen(i)}
              className={cn("group relative overflow-hidden rounded-xl ring-1 ring-border", state.settings.wallpaper === it.key && "ring-2 ring-primary")}
            >
              <img src={it.url} alt={it.name} loading="lazy" className="aspect-[4/3] w-full bg-canvas object-cover transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-dim/60 px-2 py-1 text-left text-xs text-shwet">{it.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
