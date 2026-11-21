import { FilePlus, Minus, Plus, Save, WrapText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AppProps } from "../registry";
import { useOS } from "../store";
import { ToolBtn } from "./Files";

export default function NotepadApp({ win }: AppProps) {
  const { state, dispatch, createNode } = useOS();
  const [fileId, setFileId] = useState<string | undefined>(win.props?.fileId as string | undefined);
  const node = fileId ? state.fs[fileId] : undefined;
  const [text, setText] = useState(node?.content ?? "");
  const [saved, setSaved] = useState(node?.content ?? "");
  const [saveAs, setSaveAs] = useState<string | null>(null);
  const [size, setSize] = useState(15);
  const [wrap, setWrap] = useState(true);
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  const dirty = text !== saved;

  const save = () => {
    if (node) {
      dispatch({ type: "fsUpdate", id: node.id, patch: { content: text } });
      setSaved(text);
      toast.success(`Saved ${node.name}`);
    } else setSaveAs("Untitled.txt");
  };

  const confirmSaveAs = (name: string) => {
    const v = name.trim();
    setSaveAs(null);
    if (!v) return;
    const n = createNode("documents", v.includes(".") ? v : `${v}.txt`, "file", text);
    setFileId(n.id);
    setSaved(text);
    dispatch({ type: "title", id: win.id, title: n.name });
    toast.success(`Saved to Documents/${n.name}`);
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <ToolBtn label="New" onClick={() => { setFileId(undefined); setText(""); setSaved(""); dispatch({ type: "title", id: win.id, title: "Untitled" }); }}>
          <FilePlus className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Save (Ctrl+S)" onClick={save}>
          <Save className="h-4 w-4" />
        </ToolBtn>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolBtn label="Smaller text" onClick={() => setSize((s) => Math.max(10, s - 1))}>
          <Minus className="h-4 w-4" />
        </ToolBtn>
        <span className="w-8 text-center text-xs tabular-nums text-muted-foreground">{size}</span>
        <ToolBtn label="Bigger text" onClick={() => setSize((s) => Math.min(36, s + 1))}>
          <Plus className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Word wrap" onClick={() => setWrap((w) => !w)}>
          <WrapText className={cn("h-4 w-4", wrap && "text-primary")} />
        </ToolBtn>
        {saveAs !== null ? (
          <form
            className="ml-auto flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              confirmSaveAs(new FormData(e.currentTarget).get("name") as string);
            }}
          >
            <span className="text-xs text-muted-foreground">Save in Documents as</span>
            <input name="name" autoFocus defaultValue={saveAs} className="h-7 w-40 rounded-md bg-background px-2 text-sm outline-none ring-1 ring-primary" />
            <button className="h-7 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">Save</button>
            <button type="button" onClick={() => setSaveAs(null)} className="h-7 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent">
              Cancel
            </button>
          </form>
        ) : (
          <span className="ml-auto pr-2 text-xs text-muted-foreground">
            {node ? node.name : "Untitled"} {dirty && <span className="text-primary">● unsaved</span>}
          </span>
        )}
      </div>
      <textarea
        autoFocus
        value={text}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onSelect={(e) => {
          const el = e.currentTarget;
          const before = el.value.slice(0, el.selectionStart);
          const lines = before.split("\n");
          setCursor({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            save();
          }
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const s = el.selectionStart;
            setText(text.slice(0, s) + "  " + text.slice(el.selectionEnd));
            requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
          }
        }}
        style={{ fontSize: size }}
        className={cn(
          "min-h-0 flex-1 resize-none bg-transparent p-4 leading-relaxed outline-none select-text",
          wrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto",
        )}
        placeholder="Start typing… (Hindi, English, any language)"
      />
      <div className="flex h-7 items-center gap-4 border-t border-border px-3 text-[11px] text-muted-foreground">
        <span>Ln {cursor.ln}, Col {cursor.col}</span>
        <span>{words} words</span>
        <span>{text.length} characters</span>
        <span className="ml-auto">UTF-8</span>
      </div>
    </div>
  );
}
