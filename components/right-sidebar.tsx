"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { cn, daysUntil, countdownLabel, formatDuration, getFachColors } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { FachChip } from "./fach-chip";
import type { Klausur, Todo, LernSession, PomodoroSession, Fach } from "@/lib/types";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";

interface RightSidebarProps {
  klausuren: Klausur[];
  todos: Todo[];
  sessions: LernSession[];
  pomodoros: PomodoroSession[];
  onTodoComplete: (id: string, completed: boolean) => void;
}

export function RightSidebar({
  klausuren,
  todos,
  sessions,
  pomodoros,
  onTodoComplete,
}: RightSidebarProps) {
  return (
    <aside className="w-[260px] flex flex-col border-l border-border bg-white overflow-y-auto">
      <div className="p-3 space-y-2">
        <KlausurenWidget klausuren={klausuren} />
        <LernfortschrittWidget sessions={sessions} pomodoros={pomodoros} />
        <TodoWidget todos={todos} onComplete={onTodoComplete} />
      </div>
    </aside>
  );
}

// ─── Klausuren Widget ───────────────────────────────────────────────
function KlausurenWidget({ klausuren }: { klausuren: Klausur[] }) {
  const [open, setOpen] = useState(true);

  const upcoming = klausuren
    .filter((k) => k.schreibDatum)
    .sort((a, b) => {
      const da = daysUntil(a.schreibDatum) ?? 999;
      const db = daysUntil(b.schreibDatum) ?? 999;
      return da - db;
    })
    .slice(0, 5);

  return (
    <WidgetCard
      title="Nächste Klausuren"
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <div className="space-y-1.5">
        {upcoming.map((k) => {
          const days = daysUntil(k.schreibDatum);
          const countdown = countdownLabel(days);
          const colors = getFachColors(k.fach);
          return (
            <div
              key={k.id}
              className="flex items-stretch gap-2 rounded-lg overflow-hidden bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div
                className="w-1 shrink-0 rounded-l"
                style={{ background: colors.text }}
              />
              <div className="flex items-center justify-between flex-1 py-2 pr-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{k.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {k.ort} · {k.schreibDatum ? format(parseISO(k.schreibDatum), "dd. MMM", { locale: de }) : "–"}
                  </p>
                </div>
                <span className={cn("text-[10px] font-semibold shrink-0 ml-2", countdown.color)}>
                  {countdown.label}
                </span>
              </div>
            </div>
          );
        })}
        {upcoming.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">Keine Klausuren geplant</p>
        )}
      </div>
    </WidgetCard>
  );
}

// ─── Lernfortschritt Widget ─────────────────────────────────────────
const FACH_LIST: Fach[] = ["ZPO", "ZivR", "StrafR", "VwR", "StPO", "VwGO", "ZPO III"];
const MAX_SLIDER_H = 40; // slider max in hours

function LernfortschrittWidget({
  sessions,
  pomodoros,
}: {
  sessions: LernSession[];
  pomodoros: PomodoroSession[];
}) {
  const [open, setOpen] = useState(true);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weekSessions = sessions.filter((s) => {
    if (!s.date) return false;
    try { return isWithinInterval(parseISO(s.date), { start: weekStart, end: weekEnd }); }
    catch { return false; }
  });

  const autoGeplant = weekSessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const weekPomodoros = pomodoros.filter((p) => {
    try { return isWithinInterval(parseISO(p.start), { start: weekStart, end: weekEnd }); }
    catch { return false; }
  });
  const autoAbsolviert = weekPomodoros.reduce((acc, p) => acc + p.dauerMin, 0) / 60;

  // Manual overrides via sliders
  const [manualGeplant, setManualGeplant] = useState<number | null>(null);
  const [manualAbsolviert, setManualAbsolviert] = useState<number | null>(null);

  const geplant = manualGeplant ?? autoGeplant;
  const absolviert = manualAbsolviert ?? autoAbsolviert;
  const pct = geplant > 0 ? Math.min(100, Math.round((absolviert / geplant) * 100)) : 0;

  const fachStunden = FACH_LIST.map((fach) => ({
    fach,
    h: weekSessions.filter((s) => s.subject === fach).reduce((acc, s) => acc + (s.duration ?? 0), 0),
  })).filter((f) => f.h > 0);

  return (
    <WidgetCard title="Lernfortschritt KW" open={open} onToggle={() => setOpen(!open)}>
      <div className="space-y-3">
        {/* Stat row */}
        <div className="flex justify-between items-baseline">
          <div>
            <p className="text-[10px] text-muted-foreground">Absolviert</p>
            <p className="text-lg font-bold text-foreground">{formatDuration(absolviert)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Lernziel</p>
            <p className="text-sm font-semibold text-foreground">{formatDuration(geplant)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Fortschritt</p>
            <p className={cn("text-sm font-bold", pct >= 100 ? "text-green-600" : pct >= 60 ? "text-primary" : "text-amber-500")}>
              {pct}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={absolviert} max={Math.max(geplant, 0.1)} className="h-2" color="bg-primary" />

        {/* Sliders */}
        <div className="space-y-2 pt-1 border-t border-border">
          <SliderRow
            label="Lernziel"
            value={geplant}
            max={MAX_SLIDER_H}
            color="#6346dc"
            onChange={(v) => setManualGeplant(v)}
            onReset={autoGeplant !== manualGeplant ? () => setManualGeplant(null) : undefined}
          />
          <SliderRow
            label="Absolviert"
            value={absolviert}
            max={MAX_SLIDER_H}
            color="#10b981"
            onChange={(v) => setManualAbsolviert(v)}
            onReset={autoAbsolviert !== manualAbsolviert ? () => setManualAbsolviert(null) : undefined}
          />
        </div>

        {/* Per-fach breakdown */}
        {fachStunden.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border">
            {fachStunden.map(({ fach, h }) => {
              const colors = getFachColors(fach);
              return (
                <div key={fach} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.text }} />
                  <span className="text-[10px] text-muted-foreground flex-1">{fach}</span>
                  <span className="text-[10px] font-medium text-foreground">{formatDuration(h)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

function SliderRow({
  label, value, max, color, onChange, onReset,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <span className="text-[10px] font-medium text-foreground w-8 text-right shrink-0">
        {value % 1 === 0 ? `${value}h` : `${value}h`}
      </span>
      {onReset && (
        <button
          onClick={onReset}
          title="Zurücksetzen"
          className="text-[9px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          ↺
        </button>
      )}
    </div>
  );
}

// ─── Todo Widget ─────────────────────────────────────────────────────
function TodoWidget({
  todos,
  onComplete,
}: {
  todos: Todo[];
  onComplete: (id: string, completed: boolean) => void;
}) {
  const [open, setOpen] = useState(true);

  const openTodos = todos
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : Infinity;
      const db = b.date ? new Date(b.date).getTime() : Infinity;
      return da - db;
    })
    .slice(0, 8);

  return (
    <WidgetCard
      title={`Offene To-Dos (${openTodos.length})`}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <div className="space-y-1">
        {openTodos.map((todo) => {
          const days = daysUntil(todo.date);
          const isToday = days === 0;
          const isOverdue = days !== null && days < 0;

          return (
            <div
              key={todo.id}
              className="flex items-start gap-2 group py-1 px-1 rounded-md hover:bg-muted/40 transition-colors"
            >
              <button
                onClick={() => onComplete(todo.id, true)}
                className="mt-0.5 w-4 h-4 rounded border border-border flex items-center justify-center shrink-0 hover:border-primary hover:bg-primary/10 transition-colors"
              >
                <Check className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 text-primary" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-tight">{todo.name}</p>
                {todo.date && (
                  <p
                    className={cn(
                      "text-[10px] mt-0.5",
                      isOverdue && "text-red-500 font-medium",
                      isToday && "text-primary font-medium",
                      !isOverdue && !isToday && "text-muted-foreground"
                    )}
                  >
                    {isOverdue
                      ? `${Math.abs(days!)}d überfällig`
                      : isToday
                      ? "Heute"
                      : format(parseISO(todo.date), "dd. MMM", { locale: de })}
                  </p>
                )}
              </div>
              {todo.kategorie && (
                <span className="text-[9px] bg-muted text-muted-foreground rounded px-1 py-0.5 shrink-0">
                  {todo.kategorie}
                </span>
              )}
            </div>
          );
        })}
        {openTodos.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">Alle To-Dos erledigt ✓</p>
        )}
      </div>
    </WidgetCard>
  );
}

// ─── Widget Card Shell ──────────────────────────────────────────────
function WidgetCard({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-widget overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-muted/40 transition-colors"
      >
        <span className="text-xs font-semibold text-foreground">{title}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}
