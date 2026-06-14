import { readProjects } from "@/lib/projects";
import { HomeClient } from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await readProjects();
  return <HomeClient projects={projects} />;
}
