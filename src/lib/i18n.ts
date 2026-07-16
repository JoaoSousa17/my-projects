export type Lang = "pt" | "en";

export const HOME_STRINGS: Record<Lang, {
  title: string;
  subtitle: string;
  empty: string;
  admin: string;
  comingSoon: string;
  inPlanning: string;
}> = {
  pt: {
    title: "Meus Projetos",
    subtitle: "Todos os meus projetos, organizados num só sítio.",
    empty: "Ainda não há projetos. Adiciona alguns na gestão.",
    admin: "Gestão",
    comingSoon: "Em Construção",
    inPlanning: "Em Planeamento",
  },
  en: {
    title: "My Projects",
    subtitle: "All my projects, organized in one place.",
    empty: "No projects yet. Add some in the management area.",
    admin: "Manage",
    comingSoon: "Under Construction",
    inPlanning: "In Planning",
  },
};
