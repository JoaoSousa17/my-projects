import { readProjects } from "@/lib/projects";
import { HomeClient } from "./home-client";

// ISR: regenera no máximo uma vez por hora.
// Mutações chamam revalidatePath('/') para invalidar imediatamente.
export const revalidate = 3600;

export default async function HomePage() {
  const projects = await readProjects();
  return <HomeClient projects={projects} />;
}
