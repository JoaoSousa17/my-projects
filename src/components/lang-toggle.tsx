"use client";

import type { Lang } from "@/lib/i18n";

function FlagEN({ className }: { className?: string }) {
  // União: representa "mudar para inglês" — mostra a bandeira inglesa (St George / Union-ish simplificada: UK)
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <clipPath id="uk-r">
        <rect width="60" height="40" rx="5" />
      </clipPath>
      <g clipPath="url(#uk-r)">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0,0 60,40 M60,0 0,40" stroke="#fff" strokeWidth="8" />
        <path d="M0,0 60,40 M60,0 0,40" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="13" />
        <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
      </g>
    </svg>
  );
}

function FlagPT({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <clipPath id="pt-r">
        <rect width="60" height="40" rx="5" />
      </clipPath>
      <g clipPath="url(#pt-r)">
        <rect width="60" height="40" fill="#FF0000" />
        <rect width="24" height="40" fill="#006600" />
        <circle cx="24" cy="20" r="7" fill="none" stroke="#FFCC00" strokeWidth="2" />
        <circle cx="24" cy="20" r="4" fill="#fff" stroke="#003399" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function LangToggle({
  lang,
  onToggle,
}: {
  lang: Lang;
  onToggle: () => void;
}) {
  // Mostra a bandeira do idioma para o qual se vai mudar.
  const next = lang === "pt" ? "en" : "pt";
  return (
    <button
      onClick={onToggle}
      aria-label={next === "en" ? "Switch to English" : "Mudar para Português"}
      className="group flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-zinc-950/70 backdrop-blur transition-all hover:scale-105 hover:border-cyan-400/60"
      style={{ boxShadow: "0 0 14px -6px rgba(34,211,238,0.8)" }}
    >
      {next === "en" ? (
        <FlagEN className="h-5 w-auto rounded-[3px]" />
      ) : (
        <FlagPT className="h-5 w-auto rounded-[3px]" />
      )}
    </button>
  );
}
