import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ALL_APPS } from "../appMeta";
import { children, isNameTaken, pathOf, PROTECTED, resolvePath, ROOT } from "../fs";
import { APP_NAMES } from "../i18n";
import type { AppProps } from "../registry";
import { useOS } from "../store";
import type { Accent, AppId } from "../types";

type Line = { kind: "in" | "out" | "err" | "accent"; text: string; cwd?: string };

const LOGO = [
  "      .-''''''-.     ",
  "    .'  \\ | /  '.    ",
  "   /  -- (●) --  \\   ",
  "   \\    / | \\    /   ",
  "    '.         .'    ",
  "      '-......-'     ",
];

function tokenize(s: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(s))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

const HELP = `Kavach shell — available commands
  help                 show this help
  ls [path]            list files            cd <path>   change folder
  pwd                  current folder        tree        show folder tree
  mkdir <name>         make folder           touch <f>   create empty file
  cat <file>           print a file          rm <path>   delete file/folder
  echo <text> [> f]    print or write text   mv <a> <b>  rename
  open <app|file>      open an app or file   apps        list apps
  kernel               open system kernel    sysinfo     show kernel shell status
  date  whoami  uname  neofetch  history  clear
  theme <saffron|emerald|chakra|lotus>      lang <en|hi>
  lock  restart  shutdown`;

export default function TerminalApp({ win }: AppProps) {
  const { state, dispatch, openApp, openNode, createNode } = useOS();
  const [cwd, setCwd] = useState<string>((win.props?.cwd as string) ?? ROOT);
  const [lines, setLines] = useState<Line[]>([
    { kind: "accent", text: "Bharat OS Kavach Terminal 1.0 — type 'help' to begin." },
  ]);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = state.settings.userName.toLowerCase().replace(/\s+/g, "");
  const memGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? "unknown";

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [lines]);

  const prompt = (id: string) => `${user}@bharat:${pathOf(state.fs, id) === "/" ? "~" : "~" + pathOf(state.fs, id)}$`;

  const run = (raw: string) => {
    const out: Line[] = [{ kind: "in", text: raw, cwd }];
    const say = (text: string, kind: Line["kind"] = "out") => out.push({ kind, text });
    const fs = state.fs;
    let [cmd, ...args] = tokenize(raw);
    let redirect: string | null = null;
    const gt = args.indexOf(">");
    if (gt >= 0) {
      redirect = args[gt + 1] ?? null;
      args = args.slice(0, gt);
    }
    cmd = (cmd ?? "").toLowerCase();

    switch (cmd) {
      case "":
        break;
      case "help":
        say(HELP);
        break;
      case "clear":
      case "cls":
        setLines([]);
        return;
      case "pwd":
        say(pathOf(fs, cwd));
        break;
      case "ls":
      case "dir": {
        const target = resolvePath(fs, cwd, args[0] ?? "");
        if (!target || fs[target].type !== "folder") {
          say(`ls: cannot access '${args[0]}': No such folder`, "err");
          break;
        }
        const kids = children(fs, target);
        say(kids.length ? kids.map((k) => (k.type === "folder" ? `${k.name}/` : k.name)).join("    ") : "(empty)");
        break;
      }
      case "tree": {
        const walk = (id: string, pre: string) => {
          const kids = children(fs, id);
          kids.forEach((k, i) => {
            const last = i === kids.length - 1;
            say(`${pre}${last ? "└── " : "├── "}${k.name}${k.type === "folder" ? "/" : ""}`);
            if (k.type === "folder") walk(k.id, pre + (last ? "    " : "│   "));
          });
        };
        say(pathOf(fs, cwd));
        walk(cwd, "");
        break;
      }
      case "cd": {
        const target = resolvePath(fs, cwd, args[0] ?? "~");
        if (!target || fs[target].type !== "folder") say(`cd: ${args[0]}: No such folder`, "err");
        else setCwd(target);
        break;
      }
      case "mkdir":
      case "touch": {
        if (!args[0]) {
          say(`${cmd}: missing name`, "err");
          break;
        }
        for (const name of args) {
          if (isNameTaken(fs, cwd, name)) say(`${cmd}: '${name}' already exists`, "err");
          else createNode(cwd, name, cmd === "mkdir" ? "folder" : "file");
        }
        break;
      }
      case "cat":
      case "type": {
        const id = resolvePath(fs, cwd, args[0] ?? "");
        if (!id || !args[0]) say(`cat: ${args[0] ?? ""}: No such file`, "err");
        else if (fs[id].type === "folder") say(`cat: ${args[0]}: Is a folder`, "err");
        else if (fs[id].kind === "image") say(`cat: ${args[0]}: Is an image — use 'open'`, "err");
        else say(fs[id].content || "");
        break;
      }
      case "echo": {
        const text = args.join(" ");
        if (redirect) {
          const id = resolvePath(fs, cwd, redirect);
          if (id && fs[id].type === "file") dispatch({ type: "fsUpdate", id, patch: { content: text } });
          else if (!id) createNode(cwd, redirect, "file", text);
          else say(`echo: ${redirect}: Is a folder`, "err");
        } else say(text);
        break;
      }
      case "rm":
      case "del": {
        const id = resolvePath(fs, cwd, args.filter((a) => !a.startsWith("-"))[0] ?? "");
        if (!id || id === ROOT) say(`rm: cannot remove '${args.join(" ")}'`, "err");
        else if (PROTECTED.has(id)) say(`rm: '${fs[id].name}' is a protected system folder`, "err");
        else if (fs[id].type === "folder" && children(fs, id).length && !args.includes("-r")) say(`rm: '${fs[id].name}' is not empty (use rm -r)`, "err");
        else dispatch({ type: "fsDelete", id });
        break;
      }
      case "mv": {
        const id = resolvePath(fs, cwd, args[0] ?? "");
        if (!id || !args[1]) say("mv: usage mv <old> <newname>", "err");
        else if (PROTECTED.has(id)) say("mv: cannot rename system folder", "err");
        else dispatch({ type: "fsUpdate", id, patch: { name: args[1] } });
        break;
      }
      case "open":
      case "start": {
        const q = args.join(" ").toLowerCase();
        const app = ALL_APPS.find((a) => a === q || APP_NAMES[a].en.toLowerCase().includes(q));
        const id = resolvePath(fs, cwd, args.join(" "));
        if (q && id && id !== cwd) openNode(fs[id]);
        else if (q && app) openApp(app as AppId);
        else say(`open: '${q}' not found. Try 'apps'.`, "err");
        break;
      }
      case "kernel":
        openApp("kernel");
        say("Kernel dashboard opened");
        break;
      case "sysinfo": {
        const info = [
          `User: ${user}`,
          `Host: bharat-os`,
          `Kernel: Bharat OS web-kernel 1.0`,
          `Shell: Kavach desktop shell`,
          `Display: ${window.innerWidth}x${window.innerHeight}`,
          `CPU cores: ${navigator.hardwareConcurrency ?? "unknown"}`,
          `Memory: ${memGb} GB`,
          `Active windows: ${state.windows.length}`,
        ];
        say(info.join("\n"));
        break;
      }
      case "apps":
        say(ALL_APPS.map((a) => `  ${a.padEnd(12)} ${APP_NAMES[a].en}`).join("\n"));
        break;
      case "date":
        say(new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "long", timeZone: "Asia/Kolkata" }));
        break;
      case "whoami":
        say(user);
        break;
      case "uname":
        say("BharatOS 1.0.0 Ganga web-kernel x86_64/arm64 (browser)");
        break;
      case "history":
        say(hist.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`).join("\n") || "(empty)");
        break;
      case "theme": {
        const a = args[0] as Accent;
        if (["saffron", "emerald", "chakra", "lotus"].includes(a)) {
          dispatch({ type: "settings", patch: { accent: a } });
          say(`Accent set to ${a}`, "accent");
        } else say("theme: choose saffron, emerald, chakra or lotus", "err");
        break;
      }
      case "lang":
        if (args[0] === "en" || args[0] === "hi") {
          dispatch({ type: "settings", patch: { language: args[0] } });
          say(args[0] === "hi" ? "भाषा हिन्दी पर सेट की गई" : "Language set to English", "accent");
        } else say("lang: choose en or hi", "err");
        break;
      case "neofetch": {
        const info = [
          `${user}@bharat-os`,
          "----------------",
          "OS: Bharat OS 1.0 \"Ganga\"",
          "Kernel: web-kernel 1.0",
          "Shell: kavach 1.0",
          `Resolution: ${window.innerWidth}x${window.innerHeight}`,
          `CPU: ${navigator.hardwareConcurrency ?? "?"} cores`,
          `Memory: ${(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? "?"} GB`,
          `Windows open: ${state.windows.length}`,
          `Locale: ${state.settings.language === "hi" ? "हिन्दी (भारत)" : "English (India)"}`,
        ];
        LOGO.forEach((l, i) => out.push({ kind: "accent", text: l + "  " + (info[i] ?? "") }));
        info.slice(LOGO.length).forEach((l) => out.push({ kind: "accent", text: " ".repeat(LOGO[0].length + 2) + l }));
        break;
      }
      case "lock":
      case "restart":
      case "shutdown":
        dispatch({ type: "phase", phase: cmd === "restart" ? "boot" : cmd === "lock" ? "lock" : "shutdown" });
        return;
      case "exit":
        dispatch({ type: "close", id: win.id });
        return;
      default:
        say(`${cmd}: command not found. Type 'help'.`, "err");
    }
    setLines((l) => [...l, ...out]);
  };

  return (
    <div
      className="flex h-full flex-col overflow-y-auto bg-terminal p-3 font-mono text-[13px] leading-relaxed text-terminal-foreground select-text"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l, i) => (
        <div key={i} className={cn("whitespace-pre-wrap break-words", l.kind === "err" && "text-destructive", l.kind === "accent" && "text-primary")}>
          {l.kind === "in" ? (
            <>
              <span className="text-harit">{prompt(l.cwd ?? ROOT)}</span> <span className="text-foreground">{l.text}</span>
            </>
          ) : (
            l.text
          )}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-harit">{prompt(cwd)}</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              run(input);
              if (input.trim()) setHist((h) => [...h, input]);
              setHIdx(-1);
              setInput("");
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const i = hIdx < 0 ? hist.length - 1 : Math.max(0, hIdx - 1);
              if (hist[i] !== undefined) {
                setHIdx(i);
                setInput(hist[i]);
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              const i = hIdx + 1;
              if (hIdx >= 0 && i < hist.length) {
                setHIdx(i);
                setInput(hist[i]);
              } else {
                setHIdx(-1);
                setInput("");
              }
            } else if (e.key === "Tab") {
              e.preventDefault();
              const parts = input.split(" ");
              const last = parts[parts.length - 1].toLowerCase();
              const hit = children(state.fs, cwd).find((k) => k.name.toLowerCase().startsWith(last));
              if (hit && last) {
                parts[parts.length - 1] = hit.name.includes(" ") ? `"${hit.name}"` : hit.name;
                setInput(parts.join(" "));
              }
            } else if (e.key === "l" && e.ctrlKey) {
              e.preventDefault();
              setLines([]);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-foreground caret-primary outline-none"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}
