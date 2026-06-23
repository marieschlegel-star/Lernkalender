# Juris – AI Study Planner für das Referendariat

Ein moderner Lern- und Planungskalender für das Referendariat. Vereint Notion, Google Calendar und Claude KI in einer Oberfläche.

**Design-Inspiration:** Linear, Cron Calendar, Motion, Arc Browser

---

## Features

- **3-Spalten-Layout** – Sidebar (Toggle/Filter/Chips), Kalender, Dashboard-Widgets
- **Vollständiger Kalender** – Tag, Woche, Monat (FullCalendar) mit Drag & Drop
- **Notion-Integration** – Lernplan, Klausuren, To-Dos direkt aus bestehenden DBs
- **Fach-Farbcodierung** – ZPO Blau · ZivR Grün · StrafR/StPO Lila · VwR/VwGO Grün
- **Dashboard-Widgets** – Klausuren-Countdown, KW-Lernfortschritt, offene To-Dos
- **KI-Assistent** – Thema erklären, Testen, Lernfragen, Karteikarten, Klausur simulieren, Plan optimieren
- **Kostenkontrolle** – KI ausschließlich on explicit user click, max_tokens: 1000
- **Dummy-Daten** – Sofort lauffähig ohne API-Keys

---

## Setup

### 1. Dependencies installieren

```bash
cd juris
npm install
```

### 2. Umgebungsvariablen setzen

```bash
cp .env.example .env.local
```

`.env.local` befüllen:

```env
# Notion
NOTION_API_KEY=secret_...
NOTION_LERNPLAN_DB_ID=...
NOTION_KLAUSUREN_DB_ID=...
NOTION_TODO_DB_ID=...
NOTION_TIMETRACKER_DB_ID=...

# Google Calendar
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# true = echte Notion-Daten, false = Dummy-Daten
NEXT_PUBLIC_USE_NOTION=false
```

### 3. Dev-Server starten

```bash
npm run dev
# → http://localhost:3000
```

---

## Notion-Datenbanken

| Datenbank | Env-Variable |
|-----------|-------------|
| Lernplan | `NOTION_LERNPLAN_DB_ID` |
| Klausuren | `NOTION_KLAUSUREN_DB_ID` |
| To-Do | `NOTION_TODO_DB_ID` |
| Time Tracker | `NOTION_TIMETRACKER_DB_ID` |

Die Datenbankstruktur wird **nicht** verändert.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS, shadcn/ui-inspiriert
- **Kalender:** FullCalendar 6 + @fullcalendar/interaction (Drag & Drop)
- **State:** Zustand + TanStack Query
- **APIs:** @notionhq/client v2, googleapis, @anthropic-ai/sdk
- **Utilities:** date-fns, lucide-react, clsx, tailwind-merge

---

## Projektstruktur

```
juris/
├── app/
│   ├── api/notion/sessions/route.ts   # Lernplan GET + PATCH
│   ├── api/notion/klausuren/route.ts  # Klausuren GET
│   ├── api/notion/todos/route.ts      # Todos GET + PATCH
│   ├── api/ai/chat/route.ts           # Claude API POST
│   └── page.tsx                       # Haupt-App
├── components/
│   ├── left-sidebar.tsx               # Toggle, Filter, draggable Chips
│   ├── right-sidebar.tsx              # Klausuren, Fortschritt, Todo Widgets
│   ├── calendar-view.tsx              # FullCalendar Wrapper
│   ├── topbar.tsx                     # Navigation + View-Switcher
│   ├── session-panel.tsx              # Lernblock-Detail + KI
│   └── fach-chip.tsx                  # Farbcodierter Fach-Badge
└── lib/
    ├── types.ts                       # TypeScript-Typen
    ├── utils.ts                       # Hilfsfunktionen
    ├── store.ts                       # Zustand Store
    └── dummy-data.ts                  # Jura-Testdaten (8 Sessions, 4 Klausuren, 6 Todos)
```

---

## KI-Kostenkontrolle

- Jeder API-Call erfordert **expliziten Klick** – kein Auto-Call
- `max_tokens: 1000` Standard (Klausur simulieren: 2000)
- Call-Counter im Dev-Modus sichtbar (Session-Panel, oben rechts)

---

*Gebaut mit Claude Code · claude-sonnet-4-6*
