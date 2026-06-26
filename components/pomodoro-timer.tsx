"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw, SkipForward, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { FachChip } from "./fach-chip";
import { usePomodoroStore } from "@/lib/pomodoro-store";
import type { LernSession } from "@/lib/types";

// ─── Konfiguration ───────────────────────────────────────────────────
const DURATIONS = {
  work:       25 * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
} as const;

type Mode = keyof typeof DURATIONS;

const MODE_LABELS: Record<Mode, string> = {
  work:       "Fokus",
  shortBreak: "Kurze Pause",
  longBreak:  "Lange Pause",
};

const MODE_COLORS: Record<Mode, { bg: string; ring: string; text: string; accent: string }> = {
  work:       { bg: "bg-violet-50",  ring: "ring-violet-300", text: "text-violet-700", accent: "#7c3aed" },
  shortBreak: { bg: "bg-emerald-50", ring: "ring-emerald-300", text: "text-emerald-700", accent: "#059669" },
  longBreak:  { bg: "bg-sky-50",     ring: "ring-sky-300",     text: "text-sky-700",     accent: "#0284c7" },
};

// ─── Props ───────────────────────────────────────────────────────────
interface PomodoroTimerProps {
  session: LernSession;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ───────────────────────────────────────────────────────
export function PomodoroTimer({ session, onClose }: PomodoroTimerProps) {
  const [mode, setMode]             = useState<Mode>("work");
  const [timeLeft, setTimeLeft]     = useState(DURATIONS.work);
  const [running, setRunning]       = useState(false);
  const [pomodoros, setPomodoros]   = useState(0); // sessions finished today
  const [cycle, setCycle]           = useState(0);  // work rounds since last long break
  const intervalRef                 = useRef<NodeJS.Timeout | null>(null);
  const { addMinutes }              = usePomodoroStore();

  const total   = DURATIONS[mode];
  const elapsed = total - timeLeft;
  const pct     = elapsed / total; // 0–1

  // ── SVG ring ──────────────────────────────────────────────────────
  const R = 90;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - pct);

  const colors = MODE_COLORS[mode];

  // ── Tick ──────────────────────────────────────────────────────────
  const handleTick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        // Session ended
        setRunning(false);
        if (mode === "work") {
          addMinutes(25); // → aktualisiert "Absolviert" in der Sidebar automatisch
          setPomodoros((n) => n + 1);
          const newCycle = cycle + 1;
          setCycle(newCycle);
          const next: Mode = newCycle % 4 === 0 ? "longBreak" : "shortBreak";
          setMode(next);
          setTimeLeft(DURATIONS[next]);
          // Browser notification
          if (Notification.permission === "granted") {
            new Notification("Fokuszeit vorbei!", { body: "Pause verdient 🍅", icon: "/favicon.ico" });
          }
        } else {
          setMode("work");
          setTimeLeft(DURATIONS.work);
          if (Notification.permission === "granted") {
            new Notification("Pause vorbei!", { body: "Weiter geht's! 💪" });
          }
        }
        return 0;
      }
      return prev - 1;
    });
  }, [mode, cycle]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(handleTick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, handleTick]);

  // ── Browser tab title while running ───────────────────────────────
  useEffect(() => {
    if (running) {
      document.title = `${fmt(timeLeft)} · ${session.title}`;
    } else {
      document.title = "Juris – AI Study Planner";
    }
    return () => { document.title = "Juris – AI Study Planner"; };
  }, [running, timeLeft, session.title]);

  // ── Keyboard: Space = play/pause, R = reset, N = skip ─────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); setRunning((r) => !r); }
      if (e.code === "KeyR")  { e.preventDefault(); reset(); }
      if (e.code === "KeyN")  { e.preventDefault(); skip(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const reset = () => {
    setRunning(false);
    setTimeLeft(DURATIONS[mode]);
  };

  const skip = () => {
    setRunning(false);
    if (mode === "work") {
      const newCycle = cycle + 1;
      setCycle(newCycle);
      const next: Mode = newCycle % 4 === 0 ? "longBreak" : "shortBreak";
      setMode(next);
      setTimeLeft(DURATIONS[next]);
    } else {
      setMode("work");
      setTimeLeft(DURATIONS.work);
    }
  };

  const switchMode = (m: Mode) => {
    setRunning(false);
    setMode(m);
    setTimeLeft(DURATIONS[m]);
  };

  // Request notification permission on first start
  const handleStart = () => {
    if (!running && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setRunning((r) => !r);
  };

  // ── Tomato count (4 per row) ──────────────────────────────────────
  const tomatoRows = Math.ceil(Math.max(pomodoros, 1) / 4);

  return (
    <div className={cn("absolute inset-0 z-50 flex flex-col overflow-hidden transition-colors duration-500", colors.bg)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FachChip fach={session.subject} />
          <span className="text-sm font-semibold text-foreground truncate">{session.title}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors shrink-0"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mx-4 p-1 bg-white/60 rounded-xl shrink-0">
        {(Object.keys(DURATIONS) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              "flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all",
              mode === m
                ? "bg-white shadow-sm " + MODE_COLORS[m].text
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Ring timer – center of page */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        {/* SVG progress ring */}
        <div className="relative">
          <svg
            width="220" height="220"
            viewBox="0 0 220 220"
            className="-rotate-90"
          >
            {/* Track */}
            <circle
              cx="110" cy="110" r={R}
              fill="none"
              stroke="white"
              strokeWidth="12"
              opacity="0.6"
            />
            {/* Progress */}
            <circle
              cx="110" cy="110" r={R}
              fill="none"
              stroke={colors.accent}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              style={{ transition: running ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.3s ease" }}
            />
          </svg>

          {/* Time display inside ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-5xl font-black tabular-nums tracking-tight leading-none"
              style={{ color: colors.accent }}
            >
              {fmt(timeLeft)}
            </span>
            <span className={cn("text-[11px] font-semibold mt-1", colors.text)}>
              {MODE_LABELS[mode]}
            </span>
          </div>
        </div>

        {/* Pomodoro tomato count */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[160px]">
            {Array.from({ length: Math.max(pomodoros, 0) }).map((_, i) => (
              <span key={i} className="text-lg leading-none" title={`Pomodoro ${i + 1}`}>🍅</span>
            ))}
            {pomodoros === 0 && (
              <span className="text-[11px] text-muted-foreground">Noch keine Pomodoros heute</span>
            )}
          </div>
          {pomodoros > 0 && (
            <span className="text-[10px] text-muted-foreground">{pomodoros} Pomodoro{pomodoros !== 1 ? "s" : ""} heute</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Reset */}
          <button
            onClick={reset}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/70 hover:bg-white shadow-sm active:scale-95 transition-all"
            title="Zurücksetzen (R)"
          >
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Play / Pause – big center button */}
          <button
            onClick={handleStart}
            className="w-20 h-20 flex items-center justify-center rounded-3xl shadow-lg active:scale-95 transition-all"
            style={{ background: colors.accent }}
            title={running ? "Pause (Space)" : "Starten (Space)"}
          >
            {running
              ? <Pause className="h-9 w-9 text-white" fill="white" />
              : <Play  className="h-9 w-9 text-white ml-1" fill="white" />
            }
          </button>

          {/* Skip */}
          <button
            onClick={skip}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/70 hover:bg-white shadow-sm active:scale-95 transition-all"
            title="Überspringen (N)"
          >
            <SkipForward className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="pb-4 flex justify-center gap-4 shrink-0">
        <Hint k="Space" label="Play/Pause" />
        <Hint k="R" label="Reset" />
        <Hint k="N" label="Skip" />
      </div>
    </div>
  );
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
      <kbd className="px-1.5 py-0.5 rounded border border-muted-foreground/30 bg-white/50 font-mono text-[9px]">{k}</kbd>
      <span>{label}</span>
    </div>
  );
}
