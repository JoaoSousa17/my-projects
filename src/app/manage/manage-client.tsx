"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Pencil, Trash2, GripVertical, LogOut, Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProjectTile } from "@/components/project-tile";
import { ProjectDialog, type ProjectDraft } from "./project-dialog";
import type { Project } from "@/lib/projects";
import Link from "next/link";

function SortableTile({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative touch-none">
      <ProjectTile project={project}>
        {/* controlos no canto superior direito */}
        <div className="absolute right-2 top-2 flex gap-1.5">
          <button
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/70 text-cyan-300 backdrop-blur transition-colors hover:bg-black/90"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/70 text-red-400 backdrop-blur transition-colors hover:bg-black/90"
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* pega para arrastar - canto superior esquerdo */}
        <button
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-full border border-white/20 bg-black/70 text-zinc-300 backdrop-blur active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </ProjectTile>
    </div>
  );
}

export function ManageClient({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [reorderError, setReorderError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function persistOrder(next: Project[], previous: Project[]) {
    const res = await fetch("/api/projects/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setReorderError(data.error || "Não foi possível guardar a nova ordem.");
      setProjects(previous);
      return;
    }
    setReorderError("");
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const previous = projects;
    setProjects((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const next = arrayMove(items, oldIndex, newIndex);
      persistOrder(next, previous);
      return next;
    });
  }

  async function createProject(draft: ProjectDraft) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) throw new Error();
    setProjects((p) => [...p, data.project]);
  }

  async function updateProject(draft: ProjectDraft) {
    if (!editing) return;
    const res = await fetch(`/api/projects/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) throw new Error();
    setProjects((p) => p.map((x) => (x.id === editing.id ? data.project : x)));
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setProjects((p) => p.filter((x) => x.id !== deleting.id));
      setDeleting(null);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span style={{ "--neon": "#a855f7" } as React.CSSProperties} className="neon-text">
              Gestão
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrasta pela pega para reordenar. Edita e elimina nos cantos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="border-white/15">
              <ArrowLeft className="h-4 w-4" /> Ver site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      {/* Secção: Adicionar (topo) */}
      <section className="mb-6">
        <Button
          onClick={() => setAddOpen(true)}
          className="w-full border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Adicionar projeto
        </Button>
        {reorderError && (
          <p className="mt-2 text-sm text-red-400">{reorderError}</p>
        )}
      </section>

      {/* Secção: Editar / Eliminar / Reordenar — preview interativo */}
      <section>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/60 px-8 py-14 text-center text-muted-foreground">
            Sem projetos. Clica em “Adicionar projeto”.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={projects.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
                {projects.map((p) => (
                  <SortableTile
                    key={p.id}
                    project={p}
                    onEdit={() => setEditing(p)}
                    onDelete={() => setDeleting(p)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* Dialogs */}
      <ProjectDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Adicionar projeto"
        onSave={createProject}
      />
      <ProjectDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        initial={editing}
        title="Editar projeto"
        onSave={updateProject}
      />

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar projeto</DialogTitle>
            <DialogDescription>
              Tens a certeza que queres eliminar “{deleting?.name}”? Esta ação é
              permanente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={busy}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
