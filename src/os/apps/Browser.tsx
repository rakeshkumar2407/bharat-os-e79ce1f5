import { ArrowLeft, ArrowRight, ExternalLink, Home, Lock, RotateCw, Search } from "lucide-react";
import { useState } from "react";
import { ChakraLogo } from "../ChakraLogo";
import { ToolBtn } from "./Files";

const HOME = "bharat://home";

const QUICK = [
  { name: "Wikipedia", url: "https://en.m.wikipedia.org/wiki/India", tile: "tile-neel" },
  { name: "हिन्दी विकिपीडिया", url: "https://hi.m.wikipedia.org/wiki/भारत", tile: "tile-kesari" },
  { name: "India Map", url: "https://www.openstreetmap.org/export/embed.html?bbox=68.1,6.5,97.4,35.7&layer=mapnik", tile: "tile-harit" },
  { name: "Taj Mahal", url: "https://en.m.wikipedia.org/wiki/Taj_Mahal", tile: "tile-lotus" },
  { name: "ISRO", url: "https://en.m.wikipedia.org/wiki/ISRO", tile: "tile-chakra" },
  { name: "Wiktionary", url: "https://en.m.wiktionary.org/wiki/namaste", tile: "tile-samudra" },
];

export function normaliseUrl(input: string): string {
  const v = input.trim();
  if (!v) return HOME;
  if (v.startsWith("bharat://")) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v) && !v.includes(" ")) return `https://${v}`;
  return `https://en.m.wikipedia.org/w/index.php?search=${encodeURIComponent(v)}`;
}

export default function BrowserApp() {
  const [stack, setStack] = useState<string[]>([HOME]);
  const [idx, setIdx] = useState(0);
  const [bar, setBar] = useState("");
  const [nonce, setNonce] = useState(0);
  const url = stack[idx];

  const go = (raw: string) => {
    const u = normaliseUrl(raw);
    const next = [...stack.slice(0, idx + 1), u];
    setStack(next);
    setIdx(next.length - 1);
    setBar(u === HOME ? "" : u);
  };
  const step = (d: number) => {
    const i = idx + d;
    setIdx(i);
    setBar(stack[i] === HOME ? "" : stack[i]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <ToolBtn label="Back" disabled={idx === 0} onClick={() => step(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Forward" disabled={idx >= stack.length - 1} onClick={() => step(1)}>
          <ArrowRight className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Reload" onClick={() => setNonce((n) => n + 1)}>
          <RotateCw className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Home" onClick={() => go(HOME)}>
          <Home className="h-4 w-4" />
        </ToolBtn>
        <form
          className="mx-1 flex h-8 flex-1 items-center gap-2 rounded-full bg-background/60 px-3 ring-1 ring-border focus-within:ring-primary"
          onSubmit={(e) => {
            e.preventDefault();
            go(bar);
          }}
        >
          {url === HOME ? <Search className="h-3.5 w-3.5 text-muted-foreground" /> : <Lock className="h-3.5 w-3.5 text-harit" />}
          <input
            value={bar}
            onChange={(e) => setBar(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Search or type a web address"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
        <ToolBtn label="Open in new tab" disabled={url === HOME} onClick={() => window.open(url, "_blank", "noopener")}>
          <ExternalLink className="h-4 w-4" />
        </ToolBtn>
      </div>

      {url === HOME ? (
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto bg-hero px-6 pt-[8vh]">
          <ChakraLogo className="h-14 w-14 animate-chakra-slow" />
          <h1 className="mt-4 font-display text-3xl font-semibold">
            Yatra <span className="text-tiranga">Browser</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Explore the web — your journey starts here</p>
          <form
            className="mt-6 flex h-12 w-full max-w-xl items-center gap-3 rounded-full bg-background/70 px-5 ring-1 ring-border focus-within:ring-primary"
            onSubmit={(e) => {
              e.preventDefault();
              go(String(new FormData(e.currentTarget).get("q") ?? ""));
            }}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input name="q" autoFocus placeholder="Search Wikipedia or enter a website" className="h-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
          </form>
          <div className="mt-8 grid w-full max-w-xl grid-cols-3 gap-3">
            {QUICK.map((q) => (
              <button key={q.name} onClick={() => go(q.url)} className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors hover:bg-accent">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl font-display text-lg font-bold text-shwet ${q.tile}`}>
                  {q.name.charAt(0)}
                </span>
                <span className="text-xs">{q.name}</span>
              </button>
            ))}
          </div>
          <p className="mt-8 max-w-md pb-6 text-center text-xs text-muted-foreground">
            Some websites (like Google or YouTube) refuse to open inside another page. Use the “open in new tab” button for those.
          </p>
        </div>
      ) : (
        <iframe
          key={url + nonce}
          src={url}
          title="Yatra page"
          className="min-h-0 flex-1 bg-canvas"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
