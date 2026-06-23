import { put, list } from "@vercel/blob";

export type Project = {
  id: string;
  name: string;
  path: string; // link do projeto
  color: string; // hex, e.g. #22d3ee
  image: string; // URL do Vercel Blob
  icon?: string; // nome de um ícone lucide (fallback se não houver imagem)
  comingSoon?: boolean; // projeto "no futuro" — ainda em construção
  order: number;
};

const PROJECTS_PATHNAME = "data/projects.json";

async function findProjectsBlobUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: PROJECTS_PATHNAME });
  const match = blobs.find((b) => b.pathname === PROJECTS_PATHNAME);
  return match?.url ?? null;
}

export async function readProjects(): Promise<Project[]> {
  const url = await findProjectsBlobUrl();
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  try {
    const parsed = (await res.json()) as Project[];
    return [...parsed].sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function writeProjects(projects: Project[]): Promise<void> {
  const normalized = projects.map((p, i) => ({ ...p, order: i }));
  await put(PROJECTS_PATHNAME, JSON.stringify(normalized, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
