import dawn from "@/assets/wallpaper-dawn.jpg";
import rangoli from "@/assets/wallpaper-rangoli.jpg";
import backwaters from "@/assets/wallpaper-backwaters.jpg";
import type { FS } from "./types";

export const WALLPAPERS = [
  { id: "dawn", name: "Himalayan Dawn", url: dawn },
  { id: "rangoli", name: "Rangoli Night", url: rangoli },
  { id: "backwaters", name: "Kerala Backwaters", url: backwaters },
];

export function wallpaperUrl(key: string, fs: FS): string {
  if (key.startsWith("fs:")) {
    const node = fs[key.slice(3)];
    if (node?.content) return node.content;
  }
  return (WALLPAPERS.find((w) => w.id === key) ?? WALLPAPERS[0]).url;
}
