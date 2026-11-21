import { cn } from "@/lib/utils";

/** The Bharat OS mark: a 24-spoke chakra inside a lotus ring. */
export function ChakraLogo({ className, spokes = 24 }: { className?: string; spokes?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("text-primary", className)} aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
      {Array.from({ length: spokes }).map((_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * 10}
            y1={50 + Math.sin(a) * 10}
            x2={50 + Math.cos(a) * 40}
            y2={50 + Math.sin(a) * 40}
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
