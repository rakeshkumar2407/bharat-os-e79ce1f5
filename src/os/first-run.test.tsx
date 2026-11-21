import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { FirstRunSetup, LockScreen } from "./shell/Screens";
import { createPasswordCredential, verifyPassword } from "./password";
import { OSProvider, useOS } from "./store";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });

let container: HTMLDivElement;
let root: Root;

function SetupHarness() {
  const { state, dispatch } = useOS();
  return (
    <>
      <output id="setup-state">
        {`${state.hydrated}:${state.setupComplete}:${state.phase}:${state.settings.userName}:${state.settings.language}:${state.settings.timeZone}:${state.settings.wallpaper}:${Boolean(state.credential)}`}
      </output>
      <button onClick={() => dispatch({ type: "phase", phase: "setup" })}>Open setup</button>
      <button onClick={() => dispatch({ type: "phase", phase: "lock" })}>Open lock</button>
      {state.phase === "setup" && <FirstRunSetup />}
      {state.phase === "lock" && <LockScreen />}
    </>
  );
}

function mountHarness() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <OSProvider>
        <SetupHarness />
      </OSProvider>,
    );
  });
}

function buttonMatching(text: string | RegExp) {
  const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
    typeof text === "string"
      ? candidate.textContent?.trim() === text || candidate.getAttribute("aria-label") === text
      : text.test(`${candidate.getAttribute("aria-label") ?? ""} ${candidate.textContent ?? ""}`),
  );
  if (!button) throw new Error(`Could not find button matching ${String(text)}`);
  return button;
}

function clickButton(text: string | RegExp) {
  act(() => buttonMatching(text).click());
}

function changeInput(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
  if (!input) throw new Error(`Could not find input ${selector}`);
  act(() => {
    const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(input, value);
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}

async function flushEffects() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function waitForCondition(predicate: () => boolean) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (predicate()) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
  }
  throw new Error("Timed out waiting for the UI to update");
}

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  localStorage.clear();
});

describe("first-run setup", () => {
  it("runs once for a fresh install and saves the chosen region, profile, and appearance", async () => {
    mountHarness();

    await flushEffects();
    expect(container.querySelector("#setup-state")?.textContent).toContain("true:false:boot");
    clickButton("Open setup");
    expect(container.textContent).not.toMatch(/Windows style|macOS style/);

    clickButton(/हिन्दी/);
    changeInput("#setup-time-zone", "Europe/London");
    clickButton("Continue");
    changeInput("#setup-name", "Asha");
    changeInput("#setup-password", "abc");
    changeInput("#setup-confirm-password", "abc");
    clickButton("Continue");
    expect(container.textContent).toContain("Use a password with at least 4 characters.");
    changeInput("#setup-password", "Abcd");
    changeInput("#setup-confirm-password", "Abcd");
    clickButton("Continue");
    clickButton("Use Kerala Backwaters wallpaper");
    clickButton("Emerald accent");
    clickButton("Finish setup");

    await waitForCondition(() =>
      container.querySelector("#setup-state")?.textContent?.includes(
        "true:true:desktop:Asha:hi:Europe/London:backwaters:true",
      ) ?? false,
    );
    const stored = JSON.parse(localStorage.getItem("bharat-os:v1") ?? "{}");
    expect(stored).toMatchObject({
      setupComplete: true,
      settings: {
        userName: "Asha",
        language: "hi",
        timeZone: "Europe/London",
        wallpaper: "backwaters",
        accent: "emerald",
      },
      credential: { salt: expect.any(String), hash: expect.any(String) },
    });
    expect(JSON.stringify(stored.credential)).not.toContain("Abcd");
    await expect(verifyPassword("Abcd", stored.credential)).resolves.toBe(true);
    await expect(verifyPassword("incorrect", stored.credential)).resolves.toBe(false);
  });

  it("skips first-run setup for existing installs created before setup was added", async () => {
    localStorage.setItem(
      "bharat-os:v1",
      JSON.stringify({ settings: { userName: "Existing user" }, fs: {} }),
    );

    mountHarness();

    await flushEffects();
    expect(container.querySelector("#setup-state")?.textContent).toContain(
      "true:true:boot:Existing user",
    );
    expect(JSON.parse(localStorage.getItem("bharat-os:v1") ?? "{}").setupComplete).toBe(true);
  });

  it("only opens a password-protected session after verifying the saved password", async () => {
    const credential = await createPasswordCredential("CorrectPass123");
    localStorage.setItem(
      "bharat-os:v1",
      JSON.stringify({
        settings: { userName: "Asha" },
        fs: {},
        setupComplete: true,
        credential,
      }),
    );
    mountHarness();
    await flushEffects();
    clickButton("Open lock");
    act(() => container.querySelector("#lock-screen")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    changeInput("#login-password", "WrongPass123");
    clickButton("Sign in");
    await waitForCondition(() => container.textContent?.includes("That password is not correct.") ?? false);
    expect(container.querySelector("#setup-state")?.textContent).toContain(":lock:");

    changeInput("#login-password", "CorrectPass123");
    clickButton("Sign in");
    await waitForCondition(() =>
      container.querySelector("#setup-state")?.textContent?.includes(":desktop:") ?? false,
    );
  });
});
