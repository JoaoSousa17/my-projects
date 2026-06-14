import { promises as fs } from "fs";
import path from "path";

export type Project = {
  id: string;
  name: string;
  path: string; // link do projeto
  color: string; // hex, e.g. #22d3ee
  image: string; // path em /public, e.g. /projects/abc.png
  icon?: string; // nome de um ícone lucide (fallback se não houver imagem)
  order: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "projects.json");

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readProjects(): Promise<Project[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Project[];
    return [...parsed].sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function writeProjects(projects: Project[]): Promise<void> {
  await ensureFile();
  const normalized = projects.map((p, i) => ({ ...p, order: i }));
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), "utf-8");
}
