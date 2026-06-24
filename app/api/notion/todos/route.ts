import { NextResponse } from "next/server";
import { notionQuery, notionUpdatePage, notionCreatePage } from "@/lib/notion-fetch";
import type { Todo, TodoKategorie } from "@/lib/types";

export async function GET() {
  try {
    const dbId = process.env.NOTION_TODO_DB_ID;
    if (!dbId) return NextResponse.json({ error: "DB ID missing" }, { status: 500 });

    const pages = await notionQuery(dbId);

    const todos: Todo[] = pages.map((page: any) => {
      const p = page.properties;
      return {
        id: page.id,
        name: p.Name?.title?.[0]?.plain_text ?? "Ohne Titel",
        date: p.Dat?.date?.start ?? null,
        completed: p.Kontrollkästchen?.checkbox ?? false,
        kategorie: (p.Auswählen?.select?.name as TodoKategorie) ?? null,
        kat: p.kat?.select?.name ?? null,
        lernplanIds: p.Lernplan?.relation?.map((r: any) => r.id) ?? [],
      };
    });

    return NextResponse.json(todos);
  } catch (error: any) {
    console.error("[todos]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, date, kategorie } = await req.json();
    const dbId = process.env.NOTION_TODO_DB_ID;
    if (!dbId) return NextResponse.json({ error: "DB ID missing" }, { status: 500 });

    const page = await notionCreatePage(dbId, {
      Name: { title: [{ text: { content: name || "Neues To-Do" } }] },
      ...(date ? { Dat: { date: { start: date } } } : {}),
      ...(kategorie ? { Auswählen: { select: { name: kategorie } } } : {}),
    });

    return NextResponse.json({ id: page.id });
  } catch (error: any) {
    console.error("[todos POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, completed } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await notionUpdatePage(id, {
      Kontrollkästchen: { checkbox: completed },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[todos PATCH]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
