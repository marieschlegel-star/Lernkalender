"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getFachColors } from "@/lib/utils";
import type { Fach, TodoKategorie } from "@/lib/types";

const ALL_FAECHER: Fach[] = ["ZPO", "ZivR", "ZPO III", "StrafR", "StPO", "VwR", "VwGO"];
const ALL_KATEGORIEN: TodoKategorie[] = ["Lernen", "KK", "AssK", "AG"];

type CreateType = "lerneinheit" | "todo" | "termin";

interface QuickCreateModalProps {
  date: Date;
  allDay: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function QuickCreateModal({ date, allDay, onClose, onCreated }: QuickCreateModalProps) {
  const [type, setType] = useState<CreateType>("lerneinheit");
  const [title, setTitle] = useState("");
  const [fach, setFach] = useState<Fach>("ZPO");
  const [duration, setDuration] = useState(1);
  const [kategorie, setKategorie] = useState<TodoKategorie>("Lernen");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [type]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const dateLabel = allDay
    ? format(date, "eeee, d. MMMM", { locale: de })
    : format(date, "eeee, d. MMMM · HH:mm 'Uhr'", { locale: de });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (type === "lerneinheit" || type === "termin") {
        await fetch("/api/notion/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            date: date.toISOString(),
            subject: fach,
            duration: type === "termin" ? 1 : duration,
          }),
        });
      } else {
        await fetch("/api/notion/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: title.trim(),
            date: allDay ? date.toISOString().split("T")[0] : date.toISOString(),
            kategorie,
          }),
        });
      }
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[320px] border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-[11px] font-medium text-muted-foreground">{dateLabel}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Type tabs */}
        <div className="px-4 mb-3">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-0.5">
            {(["lerneinheit", "todo", "termin"] as CreateType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-all ${
                  type === t
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "lerneinheit" ? "Lerneinheit" : t === "todo" ? "To-Do" : "Termin"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3">
          {/* Title input */}
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "lerneinheit" ? "Thema / Stoff..."
              : type === "todo" ? "Aufgabe..."
              : "Titel des Termins..."
            }
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />

          {/* Fach selector */}
          {(type === "lerneinheit" || type === "termin") && (
            <div className="flex flex-wrap gap-1">
              {ALL_FAECHER.map((f) => {
                const colors = getFachColors(f);
                const active = fach === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFach(f)}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-all"
                    style={{
                      background: active ? colors.bg : "#F1F5F9",
                      color: active ? colors.text : "#94a3b8",
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          )}

          {/* Duration (Lerneinheit only) */}
          {type === "lerneinheit" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground shrink-0">Dauer:</span>
              <div className="flex gap-1">
                {[0.5, 1, 1.5, 2, 3].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg font-medium transition-all ${
                      duration === d
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
                    }`}
                  >
                    {d}h
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kategorie (To-Do only) */}
          {type === "todo" && (
            <div className="flex gap-1 flex-wrap">
              {ALL_KATEGORIEN.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKategorie(k)}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium transition-all ${
                    kategorie === k
                      ? "bg-violet-100 text-violet-700"
                      : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            {loading ? "Wird erstellt..." : "Erstellen →"}
          </button>
        </form>
      </div>
    </div>
  );
}
