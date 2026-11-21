import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { initialCalc, press, fmt } from "../calc";

const KEYS = [
  ["%", "CE", "C", "⌫"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "-"],
  ["±", "0", ".", "+"],
];

export default function CalculatorApp() {
  const [s, setS] = useState(initialCalc);
  const [history, setHistory] = useState<string[]>([]);

  const hit = (k: string) => {
    setS((prev) => {
      const next = press(prev, k);
      if (k === "=" && prev.op && prev.prev !== null && !next.error) {
        setHistory((h) => [`${fmt(prev.prev!)} ${prev.op} ${prev.display} = ${next.display}`, ...h].slice(0, 20));
      }
      return next;
    });
  };

  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => boxRef.current?.focus(), []);

  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, string> = { "*": "×", "/": "÷", Enter: "=", "=": "=", Backspace: "⌫", Escape: "C", Delete: "CE" };
    const k = map[e.key] ?? e.key;
    if (/^[0-9.+\-%]$/.test(k) || ["×", "÷", "=", "⌫", "C", "CE"].includes(k)) {
      e.preventDefault();
      hit(k);
    }
  };

  return (
    <div tabIndex={0} onKeyDown={onKey} className="flex h-full flex-col p-3 outline-none" ref={boxRef}>
      <div className="flex min-h-0 flex-1 flex-col justify-end px-2 pb-3 text-right">
        <p className="h-5 truncate text-sm text-muted-foreground">{s.op && s.prev !== null ? `${fmt(s.prev)} ${s.op}` : history[0] ?? ""}</p>
        <p
          className={cn(
            "truncate font-display font-semibold tabular-nums",
            s.display.length > 12 ? "text-2xl" : "text-5xl",
          )}
        >
          {s.display}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.flat().map((k) => (
          <button
            key={k}
            onClick={() => hit(k)}
            className={cn(
              "h-14 rounded-xl text-lg font-medium transition-all active:scale-95",
              /[0-9.±]/.test(k) ? "bg-secondary hover:bg-accent" : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground",
              s.op === k && s.fresh && "ring-1 ring-primary text-primary",
            )}
          >
            {k}
          </button>
        ))}
        <button
          onClick={() => hit("=")}
          className="col-span-4 h-14 rounded-xl bg-primary text-xl font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
        >
          =
        </button>
      </div>
    </div>
  );
}
