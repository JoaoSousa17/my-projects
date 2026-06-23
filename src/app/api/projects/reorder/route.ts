import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readProjects, writeProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!(await isAuthed())) {
      return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.ids)) {
      return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
    }
    const ids: string[] = body.ids;
    const projects = await readProjects();
    const map = new Map(projects.map((p) => [p.id, p]));
    const reordered = ids
      .map((id) => map.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    // acrescenta quaisquer que faltem (segurança)
    for (const p of projects) {
      if (!ids.includes(p.id)) reordered.push(p);
    }

    await writeProjects(reordered);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao reordenar:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: `Falha no servidor: ${message}` }, { status: 500 });
  }
}
