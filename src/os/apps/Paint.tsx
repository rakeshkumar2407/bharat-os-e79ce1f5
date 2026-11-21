import { Brush, Download, Eraser, ImagePlus, Trash2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useOS } from "../store";
import { ToolBtn } from "./Files";

// Drawing colours are user content (paint), not UI theme colours.
const PALETTE = ["#1f2340", "#ffffff", "#ff9933", "#138808", "#0a3a8c", "#e63946", "#f4c430", "#8e44ad", "#00a6a6", "#8b5a2b", "#ff6fa8", "#7f8c8d"];
const W = 1280;
const H = 800;

export default function PaintApp() {
  const { createNode } = useOS();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[2]);
  const [size, setSize] = useState(6);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const undo = useRef<ImageData[]>([]);
  const drawing = useRef<{ x: number; y: number } | null>(null);

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  const clear = () => {
    const c = ctx();
    if (!c) return;
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
  };

  useEffect(clear, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const snapshot = () => {
    const c = ctx();
    if (!c) return;
    undo.current.push(c.getImageData(0, 0, W, H));
    if (undo.current.length > 25) undo.current.shift();
  };

  const down = (e: React.PointerEvent) => {
    snapshot();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawing.current = pos(e);
    move(e);
  };
  const move = (e: React.PointerEvent) => {
    const c = ctx();
    if (!c || !drawing.current) return;
    const p = pos(e);
    c.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    c.lineWidth = tool === "eraser" ? size * 3 : size;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(drawing.current.x, drawing.current.y);
    c.lineTo(p.x + 0.01, p.y);
    c.stroke();
    drawing.current = p;
  };
  const up = () => (drawing.current = null);

  const doUndo = () => {
    const last = undo.current.pop();
    if (last) ctx()?.putImageData(last, 0, 0);
  };

  const saveToPictures = () => {
    const url = canvasRef.current!.toDataURL("image/jpeg", 0.85);
    const n = createNode("pictures", `Drawing ${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.jpg`, "file", url, "image");
    toast.success(`Saved to Pictures/${n.name}`);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current!.toDataURL("image/png");
    a.download = "bharat-os-drawing.png";
    a.click();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <ToolBtn label="Brush" onClick={() => setTool("brush")}>
          <Brush className={cn("h-4 w-4", tool === "brush" && "text-primary")} />
        </ToolBtn>
        <ToolBtn label="Eraser" onClick={() => setTool("eraser")}>
          <Eraser className={cn("h-4 w-4", tool === "eraser" && "text-primary")} />
        </ToolBtn>
        <ToolBtn label="Undo" onClick={doUndo}>
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Clear" onClick={() => { snapshot(); clear(); }}>
          <Trash2 className="h-4 w-4" />
        </ToolBtn>
        <div className="mx-2 h-5 w-px bg-border" />
        <div className="flex flex-wrap gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              aria-label={`Colour ${c}`}
              onClick={() => { setColor(c); setTool("brush"); }}
              style={{ backgroundColor: c }}
              className={cn("h-6 w-6 rounded-full ring-1 ring-border transition-transform hover:scale-110", color === c && tool === "brush" && "ring-2 ring-primary ring-offset-2 ring-offset-card")}
            />
          ))}
        </div>
        <div className="mx-2 flex w-32 items-center gap-2">
          <Slider value={[size]} min={1} max={40} onValueChange={([v]) => setSize(v)} />
          <span className="w-6 text-xs tabular-nums text-muted-foreground">{size}</span>
        </div>
        <div className="ml-auto flex gap-1">
          <button onClick={saveToPictures} className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">
            <ImagePlus className="h-3.5 w-3.5" /> Save to Pictures
          </button>
          <ToolBtn label="Download PNG" onClick={download}>
            <Download className="h-4 w-4" />
          </ToolBtn>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/40 p-4">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="max-h-full max-w-full touch-none rounded-md bg-canvas shadow-panel"
          style={{ aspectRatio: `${W}/${H}`, cursor: "crosshair" }}
        />
      </div>
    </div>
  );
}
