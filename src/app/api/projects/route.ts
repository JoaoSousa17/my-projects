import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { isAuthed } from "@/lib/auth";
import { readProjects, writeProjects, type Project } from "@/lib/projects";

export const dynamic = "force-dynamic";

// GET removido: não é usado internamente e era um vetor de Advanced Ops
// sem autenticação (qualquer bot podia chamar list() através dele).

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string") {
    return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
  }
  const projects = await readProjects();
  const project: Project = {
    id: randomUUID(),
    name: String(body.name).slice(0, 80),
    path: String(body.path || ""),
    color: String(body.color || "#22d3ee"),
    image: String(body.image || ""),
    icon: body.icon ? String(body.icon) : undefined,
    comingSoon: Boolean(body.comingSoon),
    inPlanning: Boolean(body.inPlanning),
    order: projects.length,
  };
  projects.push(project);
  await writeProjects(projects);
  revalidatePath("/");
  return NextResponse.json({ ok: true, project });
}
