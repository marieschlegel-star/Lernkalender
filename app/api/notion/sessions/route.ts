import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import type { LernSession, Fach, LernStatus, Priority } from "@/lib/types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
  try {
    const dbId = process.env.NOTION_LERNPLAN_DB_ID;
    if (!dbId) return NextResponse.json({ error: "DB ID missing" }, { status: 500 });

    const response = await notion.databases.query({
      database_id: dbId,
      page_size: 100,
    });

    const sessions: LernSession[] = response.results.map((page: any) => {
      const p = page.properties;
      return {
        id: page.id,
        title: p.Session?.title?.[0]?.plain_text ?? "Ohne Titel",
        subject: (p.Subject?.select?.name as Fach) ?? "ZPO",
        date: p.Date?.date?.start ?? null,
        duration: p.Duration?.number ?? 0,
        status: (p.Status?.multi_select?.map((s: any) => s.name) as LernStatus[]) ?? [],
        priority: (p.Priority?.select?.name as Priority) ?? "Medium",
        examensrelevanz: p.Examensrelevanz?.multi_select?.map((s: any) => parseInt(s.name)) ?? [],
        completed: p.Completed?.checkbox ?? false,
        wiederholungen: p.Wiederholungen?.number ?? 0,
        klausurenIds: p.Klausuren?.relation?.map((r: any) => r.id) ?? [],
        pomodoroIds: p["Pomodoro Sessions"]?.relation?.map((r: any) => r.id) ?? [],
        todoIds: p["TO-Do"]?.relation?.map((r: any) => r.id) ?? [],
        parentId: p["Parent item"]?.relation?.[0]?.id ?? null,
        subIds: p["Sub-item"]?.relation?.map((r: any) => r.id) ?? [],
        unterlagen: p.Unterlagen?.files?.map((f: any) => f.name) ?? [],
        lernTodos: p["Aktuelle Lern-To-Dos / Wichtiges"]?.rich_text?.[0]?.plain_text ?? "",
      };
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, date } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await notion.pages.update({
      page_id: id,
      properties: {
        Date: date ? { date: { start: date } } : { date: null },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
