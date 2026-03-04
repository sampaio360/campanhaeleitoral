import { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

export interface RouteEntry {
  id: string;
  label: string;
  route: string;
  children?: RouteEntry[];
}

export const ROUTE_REGISTRY: RouteEntry[] = [
  {
    id: "dashboard", label: "Dashboard", route: "/dashboard",
    children: [
      { id: "dashboard-alertas", label: "Alertas de Recorrência", route: "/dashboard/alertas" },
      { id: "dashboard-ranking", label: "Ranking de Efetividade", route: "/dashboard/ranking" },
      { id: "dashboard-heatmap", label: "Mapa de Calor", route: "/dashboard/heatmap" },
      { id: "dashboard-simultaneidade", label: "Simultaneidade", route: "/dashboard/simultaneidade" },
      { id: "dashboard-heatmap-apoiadores", label: "Heatmap Apoiadores", route: "/dashboard/heatmap-apoiadores" },
    ],
  },
  {
    id: "financeiro", label: "Financeiro", route: "/budget",
    children: [
      { id: "financeiro-orcamento", label: "Orçamento", route: "/budget" },
      { id: "financeiro-despesas", label: "Despesas", route: "/expenses" },
    ],
  },
  { id: "pessoas", label: "Pessoas", route: "/supporters" },
  { id: "municipios", label: "Municípios", route: "/municipios" },
  { id: "checkin", label: "Check-in", route: "/checkin" },
  { id: "resources", label: "Recursos", route: "/resources" },
  { id: "agenda", label: "Agenda", route: "/agenda" },
  { id: "roteiro", label: "Roteiro", route: "/roteiro" },
  { id: "mensagens", label: "Mensagens", route: "/mensagens" },
  { id: "reports", label: "Relatórios", route: "/reports" },
  { id: "historico", label: "Histórico", route: "/historico" },
  { id: "roi", label: "ROI", route: "/roi" },
  { id: "settings", label: "Configurações", route: "/settings" },
];

export const ALL_ROLES: AppRole[] = [
  'supporter',
  'political_leader',
  'local_coordinator',
  'supervisor',
  'coordinator',
  'candidate',
  'admin',
  'master',
];

export const ROLE_LABELS: Record<AppRole, string> = {
  supporter: 'Apoiador',
  political_leader: 'Liderança Política',
  local_coordinator: 'Coordenador Local',
  supervisor: 'Supervisor',
  coordinator: 'Coordenador Geral',
  candidate: 'Candidato',
  admin: 'Administrador',
  master: 'Master',
};

/** Collect all route strings (parent + children) from the registry */
export function getAllRoutes(): string[] {
  const routes: string[] = [];
  for (const entry of ROUTE_REGISTRY) {
    routes.push(entry.route);
    if (entry.children) {
      for (const child of entry.children) {
        routes.push(child.route);
      }
    }
  }
  return routes;
}
