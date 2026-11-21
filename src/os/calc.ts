export type Op = "+" | "-" | "×" | "÷";

export interface CalcState {
  display: string;
  prev: number | null;
  op: Op | null;
  fresh: boolean;
  error: boolean;
}

export const initialCalc: CalcState = { display: "0", prev: null, op: null, fresh: true, error: false };

export function compute(a: number, b: number, op: Op): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? null : a / b;
  }
}

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const r = parseFloat(n.toPrecision(12));
  return String(r);
}

export function press(s: CalcState, key: string): CalcState {
  if (s.error && key !== "C") s = initialCalc;
  if (/^[0-9]$/.test(key)) {
    if (s.fresh) return { ...s, display: key, fresh: false };
    if (s.display.replace(/[-.]/g, "").length >= 16) return s;
    return { ...s, display: s.display === "0" ? key : s.display + key };
  }
  switch (key) {
    case ".":
      if (s.fresh) return { ...s, display: "0.", fresh: false };
      return s.display.includes(".") ? s : { ...s, display: s.display + "." };
    case "C":
      return initialCalc;
    case "CE":
      return { ...s, display: "0", fresh: true };
    case "⌫":
      if (s.fresh) return s;
      return { ...s, display: s.display.length > 1 ? s.display.slice(0, -1) : "0" };
    case "±":
      return s.display === "0" ? s : { ...s, display: s.display.startsWith("-") ? s.display.slice(1) : "-" + s.display };
    case "%":
      return { ...s, display: fmt(parseFloat(s.display) / 100), fresh: true };
    case "+":
    case "-":
    case "×":
    case "÷": {
      const cur = parseFloat(s.display);
      if (s.prev !== null && s.op && !s.fresh) {
        const r = compute(s.prev, cur, s.op);
        if (r === null) return { ...initialCalc, display: "Cannot divide by zero", error: true };
        return { display: fmt(r), prev: r, op: key, fresh: true, error: false };
      }
      return { ...s, prev: cur, op: key, fresh: true };
    }
    case "=": {
      if (s.prev === null || !s.op) return s;
      const r = compute(s.prev, parseFloat(s.display), s.op);
      if (r === null) return { ...initialCalc, display: "Cannot divide by zero", error: true };
      return { display: fmt(r), prev: null, op: null, fresh: true, error: false };
    }
  }
  return s;
}
