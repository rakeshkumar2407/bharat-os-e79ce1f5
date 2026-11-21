import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Taskbar } from "./shell/Taskbar";
import { OSProvider, useOS } from "./store";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });

class TestDOMRect implements DOMRect {
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {}

  get top() { return this.y; }
  get right() { return this.x + this.width; }
  get bottom() { return this.y + this.height; }
  get left() { return this.x; }
  toJSON() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

  static fromRect(rect: DOMRectInit = {}) {
    return new TestDOMRect(rect.x ?? 0, rect.y ?? 0, rect.width ?? 0, rect.height ?? 0);
  }
}

Object.defineProperty(globalThis, "DOMRect", { configurable: true, value: TestDOMRect });

let container: HTMLDivElement;
let root: Root;

function TaskbarHarness() {
  const { state, dispatch } = useOS();
  const [desktopMenuOpened, setDesktopMenuOpened] = useState(false);
  return (
    <div onContextMenu={() => setDesktopMenuOpened(true)}>
      <output id="taskbar-state">
        {JSON.stringify({
          desktopMenuOpened,
          pinnedApps: state.settings.pinnedApps,
          windows: state.windows,
        })}
      </output>
      <button
        id="close-files"
        onClick={() =>
          state.windows
            .filter((win) => win.appId === "files")
            .forEach((win) => dispatch({ type: "close", id: win.id }))
        }
      >
        Close Files
      </button>
      <Taskbar />
    </div>
  );
}

function mountTaskbar() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <OSProvider>
        <TaskbarHarness />
      </OSProvider>,
    );
  });
}

function taskbarState() {
  return JSON.parse(container.querySelector("#taskbar-state")?.textContent ?? "{}") as {
    desktopMenuOpened: boolean;
    pinnedApps: string[];
    windows: { appId: string; props?: Record<string, unknown> }[];
  };
}

function openContextMenu(element: Element) {
  act(() => {
    element.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2, clientX: 120, clientY: 100 }),
    );
  });
}

async function waitForCondition(predicate: () => boolean) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (predicate()) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
  }
  throw new Error("Timed out waiting for the taskbar to update");
}

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  document.querySelectorAll("[data-radix-popper-content-wrapper]").forEach((element) => element.remove());
  localStorage.clear();
});

describe("taskbar app context menu", () => {
  it("opens Files locations and persists unpinning", async () => {
    mountTaskbar();
    await waitForCondition(() => Boolean(container.querySelector('button[aria-label="Files"]')));

    const filesButton = container.querySelector('button[aria-label="Files"]');
    expect(filesButton).not.toBeNull();
    openContextMenu(filesButton!);

    expect(taskbarState().desktopMenuOpened).toBe(false);
    expect(document.body.textContent).toContain("Downloads");
    expect(document.body.textContent).toContain("Pictures");
    expect(document.body.textContent).toContain("Videos");
    expect(document.body.textContent).toContain("File Explorer");

    const downloadsItem = Array.from(document.querySelectorAll('[role="menuitem"]')).find(
      (item) => item.textContent?.trim() === "Downloads",
    );
    expect(downloadsItem).toBeDefined();
    act(() => (downloadsItem as HTMLElement).click());
    await waitForCondition(() => taskbarState().windows.some((win) => win.props?.["folderId"] === "downloads"));

    const openFilesButton = container.querySelector('button[aria-label="Files"]');
    expect(openFilesButton).not.toBeNull();
    openContextMenu(openFilesButton!);
    const unpinItem = Array.from(document.querySelectorAll('[role="menuitem"]')).find(
      (item) => item.textContent?.trim() === "Unpin from taskbar",
    );
    expect(unpinItem).toBeDefined();
    act(() => (unpinItem as HTMLElement).click());

    await waitForCondition(() => !taskbarState().pinnedApps.includes("files"));
    await waitForCondition(() => {
      const saved = JSON.parse(localStorage.getItem("bharat-os:v1") ?? "{}");
      return !saved.settings?.pinnedApps?.includes("files");
    });

    act(() => (container.querySelector("#close-files") as HTMLButtonElement).click());
    await waitForCondition(() => !container.querySelector('button[aria-label="Files"]'));
  });
});
