import { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

export interface RouteEntry {
  id: string;
  label: string;
  route: string;
  children?: RouteEntry[];
}

export const ROUTE_REGISTRY: RouteEntry[] = [
  { id: "dashboard", label: "Dashboard", route: "/dashboard" },
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
  { id: "roteiro", label: "Roteiro", route: "/roteiro" },
  { id: "mensagens", label: "Mensagens", route: "/mensagens" },
  { id: "reports", label: "Relatórios", route: "/reports" },
  { id: "historico", label: "Histórico", route: "/historico" },
  { id: "roi", label: "ROI", route: "/roi" },
  {
    id: "admin", label: "Administrador", route: "/admin",
    children: [
      { id: "admin-users", label: "Usuários", route: "/admin?tab=users" },
      { id: "admin-permissions", label: "Permissões", route: "/admin?tab=permissions" },
      { id: "admin-campanhas", label: "Campanhas", route: "/admin?tab=campanhas" },
      { id: "admin-access", label: "Acesso", route: "/admin?tab=access" },
      { id: "admin-vinculos", label: "Vínculos", route: "/admin?tab=vinculos" },
      { id: "admin-hierarchy", label: "Hierarquia", route: "/admin?tab=hierarchy" },
      { id: "admin-external", label: "Form Externo", route: "/admin?tab=external-form" },
    ],
  },
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
