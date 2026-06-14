"use client";

import Image from "next/image";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects";

type IconName = keyof typeof Icons;

export function ProjectTile({
  project,
  className,
  asButton = false,
  children,
}: {
  project: Pick<Project, "name" | "color" | "image" | "icon">;
  className?: string;
  asButton?: boolean;
  children?: React.ReactNode; // overlay controls (manage)
}) {
  const color = project.color || "#22d3ee";
  const LucideIcon =
    project.icon && Icons[project.icon as IconName]
      ? (Icons[project.icon as IconName] as React.ComponentType<{
          className?: string;
          color?: string;
        }>)
      : null;

  return (
    <div
      className={cn(
        "group relative aspect-square w-full select-none overflow-hidden rounded-2xl border bg-zinc-950/70 backdrop-blur-sm",
        "neon-breathe transition-transform duration-300",
        asButton && "hover:scale-[1.03] active:scale-95",
        className
      )}
      style={
        {
          "--neon": color,
          borderColor: color,
        } as React.CSSProperties
      }
    >
      {/* tint overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 transition-opacity group-hover:opacity-35"
        style={{
          background: `radial-gradient(120% 120% at 50% 0%, ${color}55, transparent 70%)`,
        }}
      />

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 p-4">
        <div
          className="flex h-[4.6rem] w-[4.6rem] items-center justify-center rounded-xl border sm:h-[5.75rem] sm:w-[5.75rem]"
          style={{ borderColor: `${color}88`, boxShadow: `0 0 18px -6px ${color}` }}
        >
          {project.image ? (
            <Image
              src={project.image}
              alt={project.name}
              width={80}
              height={80}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : LucideIcon ? (
            <LucideIcon className="h-[2.3rem] w-[2.3rem] sm:h-[2.875rem] sm:w-[2.875rem]" color={color} />
          ) : (
            <Icons.Boxes className="h-[2.3rem] w-[2.3rem] sm:h-[2.875rem] sm:w-[2.875rem]" color={color} />
          )}
        </div>
        <span
          className="line-clamp-2 text-center text-sm font-semibold sm:text-base"
          style={{ color, textShadow: `0 0 10px ${color}99` }}
        >
          {project.name}
        </span>
      </div>

      {children}
    </div>
  );
}
