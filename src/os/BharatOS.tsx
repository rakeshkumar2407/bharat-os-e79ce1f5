import { Toaster } from "@/components/ui/sonner";
import { Desktop } from "./shell/Desktop";
import { BootScreen, FirstRunSetup, LockScreen, ShutdownScreen } from "./shell/Screens";
import { OSProvider, useOS } from "./store";

function Shell() {
  const { state } = useOS();
  if (!state.hydrated) return <div className="h-full w-full bg-background" />;
  return (
    <div className="dark h-full w-full select-none" data-accent={state.settings.accent}>
      {state.phase === "boot" && <BootScreen />}
      {state.phase === "setup" && <FirstRunSetup />}
      {state.phase === "lock" && <LockScreen />}
      {state.phase === "desktop" && <Desktop />}
      {state.phase === "shutdown" && <ShutdownScreen />}
      {!state.settings.focus && <Toaster position="top-right" />}
    </div>
  );
}

export function BharatOS() {
  return (
    <OSProvider>
      <div className="h-dvh w-screen overflow-hidden">
        <Shell />
      </div>
    </OSProvider>
  );
}
