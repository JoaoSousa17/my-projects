import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isAuthed } from "@/lib/auth";
import { readProjects, writeProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const current = projects[idx];
  projects[idx] = {
    ...current,
    name: body.name !== undefined ? String(body.name).slice(0, 80) : current.name,
    path: body.path !== undefined ? String(body.path) : current.path,
    color: body.color !== undefined ? String(body.color) : current.color,
    image: body.image !== undefined ? String(body.image) : current.image,
    icon: body.icon !== undefined ? (body.icon ? String(body.icon) : undefined) : current.icon,
  };
  await writeProjects(projects);
  return NextResponse.json({ ok: true, project: projects[idx] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { id } = await params;
  const projects = await readProjects();
  const target = projects.find((p) => p.id === id);
  const next = projects.filter((p) => p.id !== id);

  // tenta apagar a imagem associada (se estiver em /public/projects)
  if (target?.image?.startsWith("/projects/")) {
    const filePath = path.join(process.cwd(), "public", target.image);
    await fs.unlink(filePath).catch(() => {});
  }

  await writeProjects(next);
  return NextResponse.json({ ok: true });
}
