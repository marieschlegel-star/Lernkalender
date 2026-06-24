"use client";

import { useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import { format, getISOWeek } from "date-fns";
import { de } from "date-fns/locale";

import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { CalendarViewComponent } from "@/components/calendar-view";
import { Topbar } from "@/components/topbar";
import { SessionPanel } from "@/components/session-panel";
import { QuickCreateModal } from "@/components/quick-create-modal";
import { useAppStore } from "@/lib/store";
import {
  DUMMY_SESSIONS,
  DUMMY_KLAUSUREN,
  DUMMY_TODOS,
  DUMMY_POMODOROS,
} from "@/lib/dummy-data";
import type { LernSession, Klausur, Todo, GCalEvent } from "@/lib/types";

// Set to true to use Notion API, false for dummy data
const USE_NOTION = process.env.NEXT_PUBLIC_USE_NOTION === "true";

export default function HomePage() {
  const calRef = useRef<FullCalendar>(null);
  const qc = useQueryClient();
  const { selectedSessionId, setSelectedSessionId, calendarView } = useAppStore();
  const [calTitle, setCalTitle] = useState("KW 26 · Juni 2026");
  const [quickCreate, setQuickCreate] = useState<{ date: Date; allDay: boolean } | null>(null);

  // ─── Data ─────────────────────────────────────────────────────────
  const { data: sessions = DUMMY_SESSIONS } = useQuery<LernSession[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!USE_NOTION) return DUMMY_SESSIONS;
      const res = await fetch("/api/notion/sessions");
      return res.ok ? res.json() : DUMMY_SESSIONS;
    },
  });

  const { data: klausuren = DUMMY_KLAUSUREN } = useQuery<Klausur[]>({
    queryKey: ["klausuren"],
    queryFn: async () => {
      if (!USE_NOTION) return DUMMY_KLAUSUREN;
      const res = await fetch("/api/notion/klausuren");
      return res.ok ? res.json() : DUMMY_KLAUSUREN;
    },
  });

  const { data: todos = DUMMY_TODOS } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: async () => {
      if (!USE_NOTION) return DUMMY_TODOS;
      const res = await fetch("/api/notion/todos");
      return res.ok ? res.json() : DUMMY_TODOS;
    },
  });

  const gcalEvents: GCalEvent[] = [];

  // ─── Mutations ────────────────────────────────────────────────────
  const updateSessionDate = useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      if (!USE_NOTION) return;
      await fetch("/api/notion/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, date }),
      });
    },
    onMutate: async ({ id, date }) => {
      await qc.cancelQueries({ queryKey: ["sessions"] });
      const prev = qc.getQueryData<LernSession[]>(["sessions"]);
      qc.setQueryData<LernSession[]>(["sessions"], (old) =>
        old?.map((s) => (s.id === id ? { ...s, date } : s)) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["sessions"], ctx.prev);
    },
  });

  const completeTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (!USE_NOTION) return;
      await fetch("/api/notion/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      });
    },
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["todos"] });
      const prev = qc.getQueryData<Todo[]>(["todos"]);
      qc.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((t) => (t.id === id ? { ...t, completed } : t)) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["todos"], ctx.prev);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleSessionDrop = useCallback(
    (sessionId: string, newDate: string) => {
      updateSessionDate.mutate({ id: sessionId, date: newDate });
    },
    [updateSessionDate]
  );

  const handleDatesSet = useCallback(
    (info: any) => {
      const start: Date = info.start;
      const kw = getISOWeek(start);
      if (info.view.type === "timeGridDay") {
        setCalTitle(format(start, "EEEE, dd. MMMM yyyy", { locale: de }));
      } else if (info.view.type === "dayGridMonth") {
        setCalTitle(format(start, "MMMM yyyy", { locale: de }));
      } else {
        setCalTitle(`KW ${kw} · ${format(start, "MMMM yyyy", { locale: de })}`);
      }
    },
    []
  );

  const handleDateClick = useCallback((date: Date, allDay: boolean) => {
    setQuickCreate({ date, allDay });
  }, []);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar sessions={sessions} todos={todos} />

      {/* Main */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white border-x border-border">
        <Topbar calRef={calRef} title={calTitle} onNewLernblock={() => {}} />
        <div className="flex-1 overflow-hidden">
          <CalendarViewComponent
            calRef={calRef}
            sessions={sessions}
            klausuren={klausuren}
            todos={todos}
            gcalEvents={gcalEvents}
            view={calendarView}
            onSessionDrop={handleSessionDrop}
            onEventClick={(id) => setSelectedSessionId(id)}
            onDatesSet={handleDatesSet}
            onDateClick={handleDateClick}
          />
        </div>
      </main>

      {/* Right Sidebar */}
      <div className="relative w-[260px] shrink-0 bg-white">
        {selectedSession ? (
          <SessionPanel
            session={selectedSession}
            klausuren={klausuren}
            pomodoros={DUMMY_POMODOROS}
            onClose={() => setSelectedSessionId(null)}
          />
        ) : (
          <RightSidebar
            klausuren={klausuren}
            todos={todos}
            sessions={sessions}
            pomodoros={DUMMY_POMODOROS}
            onTodoComplete={(id) => completeTodo.mutate({ id, completed: true })}
          />
        )}
      </div>

      {/* Quick-Create Modal */}
      {quickCreate && (
        <QuickCreateModal
          date={quickCreate.date}
          allDay={quickCreate.allDay}
          onClose={() => setQuickCreate(null)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["sessions"] });
            qc.invalidateQueries({ queryKey: ["todos"] });
          }}
        />
      )}
    </div>
  );
}
