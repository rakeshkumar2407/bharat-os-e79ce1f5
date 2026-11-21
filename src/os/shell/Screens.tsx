import { ArrowLeft, ArrowRight, Check, Globe, KeyRound, Palette, Power } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChakraLogo } from "../ChakraLogo";
import { TIME_ZONES } from "../i18n";
import { createPasswordCredential, verifyPassword } from "../password";
import { useOS } from "../store";
import type { Accent, Lang } from "../types";
import { wallpaperUrl, WALLPAPERS } from "../wallpapers";
import { useClock } from "./Taskbar";

export function BootScreen() {
  const { dispatch, state } = useOS();
  const [step, setStep] = useState(0);
  const steps = ["Loading Kernel", "Mounting file system", "Starting services", "Preparing your desktop"];
  useEffect(() => {
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 650);
    const done = setTimeout(
      () => dispatch({ type: "phase", phase: state.setupComplete ? "lock" : "setup" }),
      2800,
    );
    return () => {
      clearInterval(iv);
      clearTimeout(done);
    };
  }, [dispatch, state.setupComplete, steps.length]);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background" data-accent={state.settings.accent}>
      <ChakraLogo className="h-24 w-24 animate-chakra" />
      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight">
        Bharat <span className="text-tiranga">OS</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">भारत का अपना ऑपरेटिंग सिस्टम</p>
      <div className="relative mt-10 h-1 w-48 overflow-hidden rounded-full bg-secondary">
        <div className="absolute inset-y-0 w-1/3 rounded-full bg-tiranga-soft animate-boot-bar" />
      </div>
      <p className="mt-4 h-4 font-mono text-xs text-muted-foreground">{steps[step]}…</p>
    </div>
  );
}

const ACCENTS: { id: Accent; name: string; color: string }[] = [
  { id: "saffron", name: "Saffron", color: "bg-kesari" },
  { id: "emerald", name: "Emerald", color: "bg-harit" },
  { id: "chakra", name: "Chakra blue", color: "bg-chakra" },
  { id: "lotus", name: "Lotus", color: "bg-[var(--lotus)]" },
];

const SETUP_STEPS = ["Language & region", "Your account", "Your desktop"];

export function FirstRunSetup() {
  const { state, dispatch } = useOS();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.settings.userName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [finishing, setFinishing] = useState(false);

  const validateAccount = () => {
    if (!name.trim()) {
      setAccountError("Enter a name to continue.");
      return false;
    }
    if (password.length < 4) {
      setAccountError("Use a password with at least 4 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setAccountError("The passwords do not match.");
      return false;
    }
    setAccountError("");
    return true;
  };

  const finish = async () => {
    const userName = name.trim();
    if (!validateAccount()) {
      setStep(1);
      return;
    }

    setFinishing(true);
    try {
      const credential = await createPasswordCredential(password);
      dispatch({
        type: "completeSetup",
        settings: { userName: userName.slice(0, 32) },
        credential,
      });
      toast.success(`Welcome to Bharat OS, ${userName}!`);
    } catch (error) {
      setStep(1);
      setAccountError(error instanceof Error ? error.message : "Could not create your password.");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <main className="relative flex h-full w-full items-center justify-center overflow-y-auto bg-background px-4 py-8">
      <img
        src={wallpaperUrl(state.settings.wallpaper, state.fs)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-primary/10" />

      <section
        aria-labelledby="setup-title"
        className="relative z-10 flex max-h-full min-h-[min(640px,calc(100dvh-4rem))] w-full max-w-4xl flex-col overflow-y-auto rounded-[28px] glass-strong shadow-panel"
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-9">
          <div className="flex items-center gap-3">
            <ChakraLogo className="h-8 w-8" />
            <span className="font-display text-sm font-semibold">Bharat OS</span>
          </div>
          <span className="text-xs text-muted-foreground">A desktop that feels like yours</span>
        </header>

        <div className="flex flex-1 flex-col px-6 py-7 sm:px-12 sm:py-9">
          <nav aria-label="Setup progress" className="mb-8 flex items-center gap-2">
            {SETUP_STEPS.map((label, index) => (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    index <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className={cn("hidden truncate text-xs sm:block", index === step ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {index < SETUP_STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </nav>

          {step === 0 && (
            <div className="animate-fade">
              <p className="text-sm font-medium text-primary">Let’s get started</p>
              <h1 id="setup-title" className="mt-2 text-3xl font-semibold sm:text-4xl">
                Language and region
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Choose the language for your desktop and the time zone for your clock and date display.
              </p>
              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4 text-primary" /> Choose a language
                  </p>
                  <div className="grid gap-3">
                    {[
                      { id: "en" as Lang, label: "English", detail: "India" },
                      { id: "hi" as Lang, label: "हिन्दी", detail: "भारत" },
                    ].map((language) => (
                      <button
                        key={language.id}
                        type="button"
                        aria-pressed={state.settings.language === language.id}
                        onClick={() => dispatch({ type: "settings", patch: { language: language.id } })}
                        className={cn(
                          "rounded-xl bg-background/50 px-4 py-3 text-left ring-1 ring-border transition hover:bg-accent",
                          state.settings.language === language.id && "ring-2 ring-primary",
                        )}
                      >
                        <span className="block text-sm font-medium">{language.label}</span>
                        <span className="text-xs text-muted-foreground">{language.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="setup-time-zone" className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4 text-primary" /> Time zone
                  </label>
                  <select
                    id="setup-time-zone"
                    value={state.settings.timeZone}
                    onChange={(event) => {
                      const zone = TIME_ZONES.find((item) => item.id === event.currentTarget.value);
                      if (zone) dispatch({ type: "settings", patch: { timeZone: zone.id } });
                    }}
                    className="h-12 w-full rounded-xl bg-background/70 px-4 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                  >
                    {TIME_ZONES.map((zone) => (
                      <option key={zone.id} value={zone.id}>{zone.label}</option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your taskbar clock and date display will use this time zone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mx-auto w-full max-w-xl animate-fade">
              <p className="text-sm font-medium text-primary">A warm welcome</p>
              <h1 id="setup-title" className="mt-2 text-3xl font-semibold sm:text-4xl">
                What should we call you?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your name appears on your welcome screen and account menu.
              </p>
              <label className="mt-7 block text-sm font-medium" htmlFor="setup-name">
                Your name
              </label>
              <input
                autoFocus
                id="setup-name"
                value={name}
                maxLength={32}
                onChange={(event) => {
                  setName(event.target.value);
                  setAccountError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (name.trim()) setStep(2);
                    else setAccountError("Enter a name to continue.");
                  }
                }}
                placeholder="Enter your name"
                className="mt-2 h-12 w-full rounded-xl bg-background/70 px-4 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
              />
              <label className="mt-5 block text-sm font-medium" htmlFor="setup-password">
                Create a password
              </label>
              <input
                id="setup-password"
                type="password"
                autoComplete="new-password"
                minLength={4}
                maxLength={128}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setAccountError("");
                }}
                placeholder="At least 4 characters"
                className="mt-2 h-12 w-full rounded-xl bg-background/70 px-4 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
              />
              <label className="mt-4 block text-sm font-medium" htmlFor="setup-confirm-password">
                Confirm password
              </label>
              <input
                id="setup-confirm-password"
                type="password"
                autoComplete="new-password"
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setAccountError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (validateAccount()) setStep(2);
                  }
                }}
                placeholder="Enter the password again"
                className="mt-2 h-12 w-full rounded-xl bg-background/70 px-4 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
              />
              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                This password unlocks the Bharat OS demo in this browser. It does not encrypt saved files or protect browser data.
              </p>
              {accountError && <p role="alert" className="mt-2 text-sm text-destructive">{accountError}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade">
              <p className="text-sm font-medium text-primary">Make it feel like home</p>
              <h1 id="setup-title" className="mt-2 text-3xl font-semibold sm:text-4xl">
                Pick a wallpaper and colour
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You can change these any time in Settings.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {WALLPAPERS.map((wallpaper) => (
                  <button
                    key={wallpaper.id}
                    type="button"
                    aria-label={`Use ${wallpaper.name} wallpaper`}
                    aria-pressed={state.settings.wallpaper === wallpaper.id}
                    onClick={() => dispatch({ type: "settings", patch: { wallpaper: wallpaper.id } })}
                    className={cn(
                      "group relative overflow-hidden rounded-xl ring-2 ring-transparent transition hover:scale-[1.02]",
                      state.settings.wallpaper === wallpaper.id && "ring-primary",
                    )}
                  >
                    <img src={wallpaper.url} alt="" className="aspect-video w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-dim/70 px-2 py-1 text-left text-[11px] text-shwet">
                      {wallpaper.name}
                    </span>
                    {state.settings.wallpaper === wallpaper.id && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Palette className="h-4 w-4 text-primary" /> Accent colour
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((accent) => (
                    <button
                      key={accent.id}
                      type="button"
                      aria-label={`${accent.name} accent`}
                      aria-pressed={state.settings.accent === accent.id}
                      onClick={() => dispatch({ type: "settings", patch: { accent: accent.id } })}
                      className={cn(
                        "flex items-center gap-2 rounded-full bg-background/60 px-3 py-2 text-xs ring-1 ring-border transition hover:bg-accent",
                        state.settings.accent === accent.id && "ring-2 ring-primary",
                      )}
                    >
                      <span className={cn("h-3.5 w-3.5 rounded-full", accent.color)} />
                      {accent.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-border px-6 py-4 sm:px-9">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex gap-1.5" aria-hidden="true">
            {SETUP_STEPS.map((label, index) => (
              <span key={label} className={cn("h-1.5 rounded-full transition-all", index === step ? "w-6 bg-primary" : "w-1.5 bg-border")} />
            ))}
          </div>
          {step < SETUP_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !validateAccount()) {
                  return;
                }
                setAccountError("");
                setStep((current) => Math.min(SETUP_STEPS.length - 1, current + 1));
              }}
              disabled={finishing}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={finishing}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              {finishing ? "Creating account…" : <>Finish setup <Check className="h-4 w-4" /></>}
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}

export function LockScreen() {
  const { state, dispatch, t } = useOS();
  const now = useClock();
  const [login, setLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);
  const hi = state.settings.language === "hi";
  const locale = hi ? "hi-IN" : "en-IN";

  const signIn = () => {
    dispatch({ type: "phase", phase: "desktop" });
    toast.success(`${t("greeting")}, ${state.settings.userName}!`, {
      description: hi ? "भारत OS में आपका स्वागत है।" : "Welcome to Bharat OS. Your files are right where you left them.",
    });
  };

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!state.credential) {
      signIn();
      return;
    }
    if (!password) {
      setLoginError("Enter your password to sign in.");
      return;
    }
    setCheckingPassword(true);
    setLoginError("");
    try {
      if (await verifyPassword(password, state.credential)) {
        signIn();
      } else {
        setLoginError("That password is not correct. Try again.");
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Could not verify your password.");
    } finally {
      setCheckingPassword(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!login) setLogin(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [login]);

  return (
    <div id="lock-screen" className="relative h-full w-full overflow-hidden" onClick={() => setLogin(true)}>
      <img
        src={wallpaperUrl(state.settings.wallpaper, state.fs)}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${login ? "scale-110 blur-2xl" : ""}`}
      />
      <div className="absolute inset-0 bg-dim/30" />
      {!login ? (
        <div className="relative flex h-full flex-col items-center pt-[14vh] text-shwet animate-fade">
          <p className="font-display text-[clamp(4rem,12vw,8rem)] font-light leading-none tabular-nums">
            {now.toLocaleTimeString(locale, { timeZone: state.settings.timeZone, hour: "2-digit", minute: "2-digit", hour12: false })}
          </p>
          <p className="mt-3 text-xl">
            {now.toLocaleDateString(locale, { timeZone: state.settings.timeZone, weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="absolute bottom-10 text-sm opacity-80">{t("clickToUnlock")}</p>
        </div>
      ) : (
        <div className="relative flex h-full flex-col items-center justify-center animate-fade">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-tiranga-soft p-1 shadow-glow">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
              <ChakraLogo className="h-14 w-14" />
            </div>
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-shwet">{state.settings.userName}</h2>
          {state.credential ? (
            <form
              onSubmit={submitLogin}
              onClick={(event) => event.stopPropagation()}
              className="mt-6 flex w-[min(320px,calc(100vw-2rem))] flex-col gap-3"
            >
              <label htmlFor="login-password" className="text-sm text-shwet">Password</label>
              <input
                autoFocus
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setLoginError("");
                }}
                className="h-11 rounded-xl bg-background/80 px-4 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
              />
              {loginError && <p role="alert" className="text-sm text-red-200">{loginError}</p>}
              <button
                type="submit"
                disabled={checkingPassword}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105 disabled:opacity-60"
              >
                {checkingPassword ? "Checking…" : <>{t("signIn")} <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="text-center text-xs text-shwet/75">
                Password unlocks this browser session; it does not encrypt saved files.
              </p>
            </form>
          ) : (
            <button
              autoFocus
              onClick={(e) => {
                e.stopPropagation();
                signIn();
              }}
              className="mt-6 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
            >
              {t("signIn")} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ShutdownScreen() {
  const { dispatch } = useOS();
  const [off, setOff] = useState(false);
  useEffect(() => {
    const tm = setTimeout(() => setOff(true), 1600);
    return () => clearTimeout(tm);
  }, []);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-dim">
      {!off ? (
        <>
          <ChakraLogo className="h-12 w-12 animate-chakra" />
          <p className="mt-6 text-sm text-muted-foreground">Shutting down…</p>
        </>
      ) : (
        <button
          onClick={() => dispatch({ type: "phase", phase: "boot" })}
          className="group flex flex-col items-center gap-4 text-muted-foreground animate-fade"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full ring-1 ring-border transition-all group-hover:text-primary group-hover:ring-primary group-hover:shadow-glow">
            <Power className="h-7 w-7" />
          </span>
          <span className="text-sm">Press to start Bharat OS</span>
        </button>
      )}
    </div>
  );
}
