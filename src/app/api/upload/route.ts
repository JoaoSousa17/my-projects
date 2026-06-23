import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX = 5 * 1024 * 1024; // 5MB
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(req: Request) {
  try {
    if (!(await isAuthed())) {
      return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Sem ficheiro" }, { status: 400 });
    }
    if (file.size > MAX) {
      return NextResponse.json(
        { ok: false, error: "Imagem demasiado grande (máx. 5MB)" },
        { status: 400 }
      );
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { ok: false, error: `Formato não suportado (${file.type || "desconhecido"})` },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), "public", "projects");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({ ok: true, path: `/projects/${filename}` });
  } catch (err) {
    console.error("Erro no upload:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: `Falha no servidor: ${message}` }, { status: 500 });
  }
}
