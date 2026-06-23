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
    try {
      return isWithinInterval(parseISO(s.date), { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  });

  const geplantTotal = weekSessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);

  const weekPomodoros = pomodoros.filter((p) => {
    try {
      return isWithinInterval(parseISO(p.start), { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  });
  const absolviertTotal = weekPomodoros.reduce((acc, p) => acc + p.dauerMin, 0) / 60;

  // Per-fach breakdown
  const fachStunden = FACH_LIST.map((fach) => {
    const h = weekSessions
      .filter((s) => s.subject === fach)
      .reduce((acc, s) => acc + (s.duration ?? 0), 0);
    return { fach, h };
  }).filter((f) => f.h > 0);

  return (
    <WidgetCard
      title="Lernfortschritt KW"
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <div>
            <p className="text-xs text-muted-foreground">Absolviert</p>
            <p className="text-lg font-bold text-foreground">{formatDuration(absolviertTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Geplant</p>
            <p className="text-sm font-semibold text-foreground">{formatDuration(geplantTotal)}</p>
          </div>
        </div>

        <div className="space-y-1">
          <Progress
            value={absolviertTotal}
            max={Math.max(geplantTotal, 0.1)}
            className="h-2"
            color="bg-primary"
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {geplantTotal > 0
              ? `${Math.round((absolviertTotal / geplantTotal) * 100)}%`
              : "0%"}
          </p>
        </div>

        {fachStunden.length > 0 && (
          <div className="space-y-1">
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
