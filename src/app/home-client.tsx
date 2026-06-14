"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectTile } from "@/components/project-tile";
import { LangToggle } from "@/components/lang-toggle";
import { HOME_STRINGS, type Lang } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

export function HomeClient({ projects }: { projects: Project[] }) {
  const [lang, setLang] = useState<Lang>("pt");
  const s = HOME_STRINGS[lang];
  const isOdd = projects.length % 2 === 1;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col items-center px-5 py-12 sm:py-16">
      {/* toggle de idioma — canto superior direito */}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LangToggle lang={lang} onToggle={() => setLang((l) => (l === "pt" ? "en" : "pt"))} />
      </div>

      <header className="mb-10 text-center">
        <h1
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ "--neon": "#22d3ee" } as React.CSSProperties}
        >
          <span className="neon-text">{s.title}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{s.subtitle}</p>
      </header>

      {projects.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-950/60 px-8 py-12 text-center text-muted-foreground">
          {s.empty}
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-4 sm:gap-6">
          {projects.map((p, i) => {
            const lastOdd = isOdd && i === projects.length - 1;
            return (
              <Link
                key={p.id}
                href={p.path || "#"}
                target={p.path?.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={cn(
                  "block focus:outline-none",
                  // quando é o último de um total ímpar, ocupa as 2 colunas
                  // e centra-se, mantendo a largura de uma só coluna
                  lastOdd &&
                    "col-span-2 mx-auto w-[calc(50%-0.5rem)] sm:w-[calc(50%-0.75rem)]"
                )}
              >
                <ProjectTile project={p} asButton />
              </Link>
            );
          })}
        </div>
      )}

      <footer className="mt-auto pt-14">
        <Link
          href="/admin"
          className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          {s.admin}
        </Link>
      </footer>
    </main>
  );
}
