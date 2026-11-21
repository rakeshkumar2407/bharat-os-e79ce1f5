import { ChakraLogo } from "../ChakraLogo";
import { useOS } from "../store";

export default function AboutApp() {
  const { state } = useOS();
  return (
    <div className="flex h-full flex-col items-center overflow-y-auto bg-hero px-8 py-10 text-center">
      <ChakraLogo className="h-20 w-20 animate-chakra-slow" />
      <h1 className="mt-5 font-display text-3xl font-semibold">
        Bharat <span className="text-tiranga">OS</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Version 1.0 “Ganga” · Build 2026.11</p>
      <div className="mt-4 h-1 w-24 rounded-full bg-tiranga" />
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
        आपका अपना ऑपरेटिंग सिस्टम — a familiar, fast desktop designed in India. Windows, files, apps and settings, all
        running right inside your browser and saved on this device.
      </p>
      <dl className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2 text-left text-sm">
        {[
          ["Licensed to", state.settings.userName],
          ["Edition", "Home"],
          ["Shell", "Kavach 1.0"],
          ["Languages", "English, हिन्दी"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-secondary/70 px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">{k}</dt>
            <dd className="truncate">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-auto pt-6 text-xs text-muted-foreground">Made with ❤ in India</p>
    </div>
  );
}
