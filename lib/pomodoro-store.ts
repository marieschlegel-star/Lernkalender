import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getISOWeek, getYear } from "date-fns";

function weekKey(date = new Date()) {
  return `${getYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

interface PomodoroStoreState {
  weekMinutes: Record<string, number>; // "2026-W26" → Minuten
  addMinutes: (minutes: number) => void;
  getCurrentWeekMinutes: () => number;
}

export const usePomodoroStore = create<PomodoroStoreState>()(
  persist(
    (set, get) => ({
      weekMinutes: {},
      addMinutes: (minutes) => {
        const key = weekKey();
        set((s) => ({
          weekMinutes: {
            ...s.weekMinutes,
            [key]: (s.weekMinutes[key] ?? 0) + minutes,
          },
        }));
      },
      getCurrentWeekMinutes: () => get().weekMinutes[weekKey()] ?? 0,
    }),
    { name: "juris-pomodoro" }
  )
);
