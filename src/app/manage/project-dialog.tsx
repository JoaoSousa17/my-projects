"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectTile } from "@/components/project-tile";
import type { Project } from "@/lib/projects";

export type ProjectDraft = {
  name: string;
  path: string;
  color: string;
  image: string;
  icon?: string;
};

export function ProjectDialog({
  open,
  onOpenChange,
  initial,
  title,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Project | null;
  title: string;
  onSave: (draft: ProjectDraft) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [color, setColor] = useState("#22d3ee");
  const [image, setImage] = useState("");
  const [icon, setIcon] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setPath(initial?.path ?? "");
      setColor(initial?.color ?? "#22d3ee");
      setImage(initial?.image ?? "");
      setIcon(initial?.icon ?? "");
      setError("");
    }
  }, [open, initial]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) e.target.value = ""; // permite re-selecionar após erro
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem demasiado grande (máx. 5MB).");
      return;
    }
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok && data.path) {
      setImage(data.path);
    } else {
      setError(data.error || "Falha no upload.");
    }
  }

  async function save() {
    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), path: path.trim(), color, image, icon: icon.trim() || undefined });
      onOpenChange(false);
    } catch {
      setError("Não foi possível guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto scrollbar-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nome</Label>
              <Input
                id="p-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="O meu projeto"
                className="border-white/15 bg-black/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-path">Link (path)</Label>
              <Input
                id="p-path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="https://… ou /rota"
                className="border-white/15 bg-black/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-color">Cor (neon)</Label>
              <div className="flex items-center gap-2">
                <input
                  id="p-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-white/15 bg-transparent"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="border-white/15 bg-black/40 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Imagem (em /public)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="border-white/15"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {image ? "Trocar" : "Carregar"}
                </Button>
                {image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setImage("")}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-icon">Ícone lucide (fallback, opcional)</Label>
              <Input
                id="p-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="ex.: Rocket, Gamepad2, Globe"
                className="border-white/15 bg-black/40"
              />
            </div>
          </div>

          {/* Preview ao vivo */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">Pré-visualização</span>
            <div className="w-32">
              <ProjectTile
                project={{ name: name || "Projeto", color, image, icon: icon || undefined }}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-cyan-500 text-black hover:bg-cyan-400"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
