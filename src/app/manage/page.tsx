import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { readProjects } from "@/lib/projects";
import { ManageClient } from "./manage-client";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }
  const projects = await readProjects();
  return <ManageClient initialProjects={projects} />;
}
