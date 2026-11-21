import { createFileRoute } from "@tanstack/react-router";
import { BharatOS } from "@/os/BharatOS";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bharat OS — India's own desktop, in your browser" },
      {
        name: "description",
        content: "Bharat OS: a full desktop with windows, taskbar, Start menu, files, terminal, notepad, paint, browser and settings — in English and Hindi.",
      },
      { property: "og:title", content: "Bharat OS — India's own desktop" },
      { property: "og:description", content: "A familiar Windows-style desktop with a unique Indian design, running in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <BharatOS />;
}
