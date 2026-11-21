import {
  Calculator,
  Compass,
  FolderOpen,
  Image,
  Info,
  Activity,
  NotebookPen,
  Palette,
  Settings as SettingsIcon,
  SquareTerminal,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { useOS } from "./store";
import type { AppId, IconStyle, WinState } from "./types";
import FilesApp from "./apps/Files";
import NotepadApp from "./apps/Notepad";
import CalculatorApp from "./apps/Calculator";
import TerminalApp from "./apps/Terminal";
import SettingsApp from "./apps/Settings";
import PaintApp from "./apps/Paint";
import BrowserApp from "./apps/Browser";
import TaskManagerApp from "./apps/TaskManager";
import PhotosApp from "./apps/Photos";
import AboutApp from "./apps/About";
import KernelApp from "./apps/Kernel";

export type AppProps = { win: WinState };

export const APPS: Record<AppId, { icon: LucideIcon; tile: string; component: ComponentType<AppProps> }> = {
  files: { icon: FolderOpen, tile: "tile-haldi", component: FilesApp },
  notepad: { icon: NotebookPen, tile: "tile-samudra", component: NotepadApp },
  calculator: { icon: Calculator, tile: "tile-neel", component: CalculatorApp },
  terminal: { icon: SquareTerminal, tile: "tile-neel", component: TerminalApp },
  settings: { icon: SettingsIcon, tile: "tile-chakra", component: SettingsApp },
  paint: { icon: Palette, tile: "tile-lotus", component: PaintApp },
  browser: { icon: Compass, tile: "tile-kesari", component: BrowserApp },
  taskmanager: { icon: Activity, tile: "tile-harit", component: TaskManagerApp },
  photos: { icon: Image, tile: "tile-mitti", component: PhotosApp },
  about: { icon: Info, tile: "tile-chakra", component: AboutApp },
  kernel: { icon: Cpu, tile: "tile-neel", component: KernelApp },
};

export function AppIcon({
  appId,
  size = "md",
  className,
  iconStyle,
}: {
  appId: AppId;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconStyle?: IconStyle;
}) {
  const { state } = useOS();
  const { icon: Icon, tile } = APPS[appId];
  const style = iconStyle ?? state.settings.iconStyle;
  const box = {
    xs: "h-4 w-4",
    sm: "h-7 w-7",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }[size];
  const ico = { xs: "h-2.5 w-2.5", sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden text-shwet",
        tile,
        box,
        style === "macos"
          ? "rounded-[28%] border border-white/40 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.5)]"
          : "rounded-[18%] border border-white/10 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      {style === "macos" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/45 via-white/10 to-transparent"
        />
      )}
      <Icon
        className={cn("relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]", ico)}
        strokeWidth={style === "macos" ? 2 : 2.2}
      />
    </span>
  );
}
