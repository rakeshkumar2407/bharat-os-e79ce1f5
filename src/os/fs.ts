import type { FS, FSNode } from "./types";

export const ROOT = "root";

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export function createInitialFS(now = Date.now()): FS {
  const folder = (id: string, name: string, parentId: string | null): FSNode => ({
    id,
    name,
    type: "folder",
    parentId,
    modified: now,
  });
  const file = (id: string, name: string, parentId: string, content: string): FSNode => ({
    id,
    name,
    type: "file",
    kind: "text",
    parentId,
    content,
    modified: now,
  });
  const nodes: FSNode[] = [
    folder(ROOT, "Home", null),
    folder("desktop", "Desktop", ROOT),
    folder("documents", "Documents", ROOT),
    folder("pictures", "Pictures", ROOT),
    folder("downloads", "Downloads", ROOT),
    folder("videos", "Videos", ROOT),
    folder("music", "Music", ROOT),
    file(
      "welcome",
      "Welcome.txt",
      "desktop",
      "Namaste! Welcome to Bharat OS.\n\n• Click the Chakra button to open the Start menu.\n• Drag windows by their title bar, double-click to maximise.\n• Drag a window to the top of the screen to snap it full screen.\n• Right-click the desktop to create files and folders.\n• Open Terminal and type 'help' to see commands.\n\nEverything you create is saved on this device.",
    ),
    file(
      "ideas",
      "Ideas.txt",
      "documents",
      "My ideas\n--------\n1. Learn something new every day\n2. Plan a trip to the Himalayas\n3. Build my own app",
    ),
    file("todo", "To-do.txt", "documents", "[ ] Buy groceries\n[ ] Call family\n[x] Try Bharat OS"),
  ];
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

export function children(fs: FS, parentId: string): FSNode[] {
  return Object.values(fs)
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
}

export function ancestors(fs: FS, id: string): FSNode[] {
  const out: FSNode[] = [];
  let cur: FSNode | undefined = fs[id];
  while (cur) {
    out.unshift(cur);
    cur = cur.parentId ? fs[cur.parentId] : undefined;
  }
  return out;
}

/** Unix-like path; the Home folder is "/". */
export function pathOf(fs: FS, id: string): string {
  const chain = ancestors(fs, id).slice(1);
  return "/" + chain.map((n) => n.name).join("/");
}

/** Resolve a path relative to cwd. Supports /, ~, ., .. and case-insensitive names. */
export function resolvePath(fs: FS, cwdId: string, path: string): string | null {
  if (!path) return cwdId;
  let cur = path.startsWith("/") || path.startsWith("~") ? ROOT : cwdId;
  const parts = path.replace(/^~/, "").split("/").filter(Boolean);
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      cur = fs[cur]?.parentId ?? ROOT;
      continue;
    }
    const kids = children(fs, cur);
    const hit =
      kids.find((k) => k.name === part) ??
      kids.find((k) => k.name.toLowerCase() === part.toLowerCase());
    if (!hit) return null;
    cur = hit.id;
  }
  return cur;
}

export function isNameTaken(fs: FS, parentId: string, name: string, exceptId?: string) {
  return Object.values(fs).some(
    (n) =>
      n.parentId === parentId && n.id !== exceptId && n.name.toLowerCase() === name.toLowerCase(),
  );
}

export function uniqueName(fs: FS, parentId: string, base: string): string {
  if (!isNameTaken(fs, parentId, base)) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  let i = 2;
  while (isNameTaken(fs, parentId, `${stem} (${i})${ext}`)) i++;
  return `${stem} (${i})${ext}`;
}

export function descendants(fs: FS, id: string): string[] {
  const out = [id];
  for (const n of Object.values(fs)) {
    if (n.parentId === id) out.push(...descendants(fs, n.id));
  }
  return out;
}

export const PROTECTED = new Set([ROOT, "desktop", "documents", "pictures", "downloads", "videos", "music"]);

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
