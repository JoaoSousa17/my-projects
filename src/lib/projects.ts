import { put, list } from "@vercel/blob";

export type Project = {
  id: string;
  name: string;
  path: string; // link do projeto
  color: string; // hex, e.g. #22d3ee
  image: string; // URL do Vercel Blob
  icon?: string; // nome de um ícone lucide (fallback se não houver imagem)
  comingSoon?: boolean;  // Em Construção
  inPlanning?: boolean;  // Em Planeamento
  order: number;
};

const PROJECTS_PATHNAME = "data/projects.json";

// Cache em memória: evita chamar list() mais do que uma vez por instância
// serverless. undefined = ainda não resolvido; null = ficheiro não existe.
let cachedUrl: string | null | undefined = undefined;

async function getProjectsUrl(): Promise<string | null> {
  if (cachedUrl !== undefined) return cachedUrl;
  try {
    const { blobs } = await list({ prefix: PROJECTS_PATHNAME });
    cachedUrl = blobs.find((b) => b.pathname === PROJECTS_PATHNAME)?.url ?? null;
  } catch {
    cachedUrl = null;
  }
  return cachedUrl;
}

export async function readProjects(): Promise<Project[]> {
  try {
    const url = await getProjectsUrl();
    if (!url) return [];
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = (await res.json()) as Project[];
    return [...parsed].sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function writeProjects(projects: Project[]): Promise<void> {
  const normalized = projects.map((p, i) => ({ ...p, order: i }));
  const result = await put(PROJECTS_PATHNAME, JSON.stringify(normalized, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  // Atualiza o cache com o URL retornado pelo put() — sem list() necessário
  cachedUrl = result.url;
}
