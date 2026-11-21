import {
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderPlus,
  FilePlus,
  HardDrive,
  Home,
  Image as ImageIcon,
  Monitor,
  Music,
  Pencil,
  Trash2,
  FileStack,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ancestors, children, formatSize, isNameTaken, PROTECTED, ROOT } from "../fs";
import type { AppProps } from "../registry";
import { useOS } from "../store";
import type { FSNode } from "../types";

const PLACES = [
  { id: ROOT, label: "Home", icon: Home },
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "documents", label: "Documents", icon: FileStack },
  { id: "pictures", label: "Pictures", icon: ImageIcon },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "videos", label: "Videos", icon: Video },
  { id: "music", label: "Music", icon: Music },
];

export function NodeIcon({ node, className }: { node: FSNode; className?: string }) {
  if (node.type === "folder") return <Folder className={cn("fill-kesari/80 text-kesari", className)} strokeWidth={1.2} />;
  if (node.kind === "image") return <ImageIcon className={cn("text-chakra", className)} strokeWidth={1.4} />;
  return <FileText className={cn("text-muted-foreground", className)} strokeWidth={1.4} />;
}

export default function FilesApp({ win }: AppProps) {
  const { state, dispatch, openNode, createNode, t } = useOS();
  const [cwd, setCwd] = useState<string>((win.props?.folderId as string) ?? ROOT);
  const [back, setBack] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);

  const folder = state.fs[cwd] ? cwd : ROOT;
  const items = children(state.fs, folder);
  const crumbs = ancestors(state.fs, folder);
  const used = useMemo(() => JSON.stringify(state.fs).length, [state.fs]);
  const quota = 5 * 1024 * 1024;

  const go = (id: string) => {
    setBack((b) => [...b, folder]);
    setCwd(id);
    setSelected(null);
  };

  const rename = (node: FSNode, name: string) => {
    const v = name.trim();
    setRenaming(null);
    if (!v || v === node.name) return;
    if (isNameTaken(state.fs, node.parentId ?? ROOT, v, node.id)) {
      toast.error(`"${v}" already exists here`);
      return;
    }
    dispatch({ type: "fsUpdate", id: node.id, patch: { name: v } });
  };

  const del = (id: string | null) => {
    if (!id) return;
    if (PROTECTED.has(id)) return toast.error("System folders can't be deleted");
    const n = state.fs[id];
    dispatch({ type: "fsDelete", id });
    setSelected(null);
    toast(`Deleted ${n?.name}`);
  };

  const sel = selected ? state.fs[selected] : null;

  return (
    <div
      className="flex h-full flex-col"
      tabIndex={0}
      onKeyDown={(e) => {
        if (renaming) return;
        if (e.key === "Delete") del(selected);
        if (e.key === "F2" && selected) setRenaming(selected);
        if (e.key === "Enter" && sel) sel.type === "folder" ? go(sel.id) : openNode(sel);
        if (e.key === "Backspace" && back.length) {
          setCwd(back[back.length - 1]);
          setBack((b) => b.slice(0, -1));
        }
      }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <ToolBtn label="Back" disabled={!back.length} onClick={() => { setCwd(back[back.length - 1]); setBack((b) => b.slice(0, -1)); }}>
          <ArrowLeft className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Up" disabled={!state.fs[folder]?.parentId} onClick={() => go(state.fs[folder]?.parentId ?? ROOT)}>
          <ArrowUp className="h-4 w-4" />
        </ToolBtn>
        <div className="mx-1 flex h-8 min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-lg bg-background/50 px-2 text-sm ring-1 ring-border">
          <HardDrive className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex shrink-0 items-center">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <button onClick={() => c.id !== folder && go(c.id)} className="rounded px-1.5 py-0.5 hover:bg-accent">
                {c.name}
              </button>
            </span>
          ))}
        </div>
        <ToolBtn label={t("newFolder")} onClick={() => setRenaming(createNode(folder, "New folder", "folder").id)}>
          <FolderPlus className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label={t("newFile")} onClick={() => setRenaming(createNode(folder, "New text file.txt", "file").id)}>
          <FilePlus className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Rename" disabled={!selected || PROTECTED.has(selected)} onClick={() => setRenaming(selected)}>
          <Pencil className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Delete" disabled={!selected || PROTECTED.has(selected)} onClick={() => del(selected)}>
          <Trash2 className="h-4 w-4" />
        </ToolBtn>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-48 shrink-0 flex-col border-r border-border bg-sidebar/60 p-2 sm:flex">
          {PLACES.map((p) => (
            <button
              key={p.id}
              onClick={() => go(p.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                folder === p.id && "bg-accent text-foreground",
              )}
            >
              <p.icon className={cn("h-4 w-4", folder === p.id ? "text-primary" : "text-muted-foreground")} />
              {p.label}
            </button>
          ))}
          <div className="mt-auto rounded-xl bg-background/40 p-3">
            <p className="text-xs font-medium">Local storage</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-tiranga-soft" style={{ width: `${Math.max(2, (used / quota) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {formatSize(used)} of 5 MB used
            </p>
          </div>
        </aside>

        {/* Items */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3" onClick={() => setSelected(null)}>
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Folder className="h-14 w-14 opacity-40" strokeWidth={1} />
              <p className="mt-2 text-sm">This folder is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-1">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(n.id);
                  }}
                  onDoubleClick={() => (n.type === "folder" ? go(n.id) : openNode(n))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 text-center transition-colors hover:bg-accent/70",
                    selected === n.id && "bg-accent ring-1 ring-primary/50",
                  )}
                >
                  {n.kind === "image" && n.content ? (
                    <img src={n.content} alt="" className="h-12 w-14 rounded-md bg-canvas object-cover" />
                  ) : (
                    <NodeIcon node={n} className="h-12 w-12" />
                  )}
                  {renaming === n.id ? (
                    <input
                      autoFocus
                      defaultValue={n.name}
                      onFocus={(e) => {
                        const dot = n.name.lastIndexOf(".");
                        e.target.setSelectionRange(0, dot > 0 && n.type === "file" ? dot : n.name.length);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => rename(n, e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="w-full rounded bg-background px-1 text-center text-xs outline-none ring-1 ring-primary"
                    />
                  ) : (
                    <span className="line-clamp-2 break-all text-xs">{n.name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex h-7 items-center justify-between border-t border-border px-3 text-[11px] text-muted-foreground">
        <span>
          {items.length} {t("items")}
        </span>
        {sel && (
          <span>
            {sel.name} · {sel.type === "file" ? formatSize((sel.content ?? "").length) : "Folder"} ·{" "}
            {new Date(sel.modified || Date.now()).toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ label, children, onClick, disabled }: { label: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

export { ToolBtn };
