import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { AdminForm } from "./admin-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (await isAuthed()) {
    redirect("/manage");
  }
  return (
    <main className="flex min-h-svh items-center justify-center px-5">
      <AdminForm />
    </main>
  );
}
