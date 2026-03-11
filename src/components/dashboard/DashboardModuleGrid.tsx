import { useNavigate } from "react-router-dom";
import { BarChart3, DollarSign, Users, FileText, Settings, MapPin, Package, Route, MessageCircle, TrendingUp, History, Building2, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardData } from "./useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { cn } from "@/lib/utils";

const moduleColors: Record<string, { bg: string; icon: string }> = {
  dashboard: { bg: "bg-blue-500/15", icon: "text-blue-600" },
  financeiro: { bg: "bg-emerald-500/15", icon: "text-emerald-600" },
  pessoas: { bg: "bg-violet-500/15", icon: "text-violet-600" },
  municipios: { bg: "bg-sky-500/15", icon: "text-sky-600" },
  checkin: { bg: "bg-cyan-500/15", icon: "text-cyan-600" },
  resources: { bg: "bg-amber-500/15", icon: "text-amber-600" },
  agenda: { bg: "bg-rose-500/15", icon: "text-rose-600" },
  roteiro: { bg: "bg-teal-500/15", icon: "text-teal-600" },
  mensagens: { bg: "bg-pink-500/15", icon: "text-pink-600" },
  reports: { bg: "bg-orange-500/15", icon: "text-orange-600" },
  historico: { bg: "bg-slate-500/15", icon: "text-slate-600" },
  roi: { bg: "bg-cyan-500/15", icon: "text-cyan-600" },
  admin: { bg: "bg-slate-500/15", icon: "text-slate-600" },
};

export function DashboardModuleGrid() {
  const { stats, loading } = useDashboardData();
  const { profile, isAdmin } = useAuth();
  const { canAccess } = useAccessControl();
  const navigate = useNavigate();
  const hasCandidate = !!profile?.candidate_id;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const modules = [
    {
      id: "dashboard",
      title: "Dash",
      icon: BarChart3,
      route: "/dashboard",
      stat: "Visão executiva",
    },
    {
      id: "financeiro",
      title: "Financeiro",
      icon: DollarSign,
      route: "/budget",
      stat: loading ? "..." : hasCandidate ? `${formatCurrency(stats.totalBudget)} | ${stats.expensesCount} despesas` : "Configurar",
    },
    {
      id: "pessoas",
      title: "Pessoas",
      icon: Users,
      route: "/supporters",
      stat: loading ? "..." : hasCandidate ? `${stats.supportersCount}` : "Configurar",
    },
    {
      id: "municipios",
      title: "Municípios",
      icon: Building2,
      route: "/municipios",
      stat: "Gestão territorial",
    },
    {
      id: "checkin",
      title: "Check-in",
      icon: MapPin,
      route: "/checkin",
      stat: "Ações de rua",
    },
    {
      id: "resources",
      title: "Recursos",
      icon: Package,
      route: "/resources",
      stat: "Solicitações",
    },
    {
      id: "agenda",
      title: "Agenda",
      icon: CalendarDays,
      route: "/agenda",
      stat: "Compromissos",
    },
    {
      id: "roteiro",
      title: "Roteiro",
      icon: Route,
      route: "/roteiro",
      stat: "Planejamento",
    },
    {
      id: "mensagens",
      title: "Mensagens",
      icon: MessageCircle,
      route: "/mensagens",
      stat: "Orientações",
    },
    {
      id: "reports",
      title: "Relatórios",
      icon: FileText,
      route: "/reports",
      stat: `${stats.reportsCount} disponíveis`,
    },
    {
      id: "historico",
      title: "Histórico",
      icon: History,
      route: "/historico",
      stat: "Atividades",
    },
  ];

  if (isAdmin) {
    modules.push(
      {
        id: "roi",
        title: "ROI",
        icon: TrendingUp,
        route: "/roi",
        stat: "Custo por Voto",
      },
      {
        id: "admin",
        title: "Admin",
        icon: Settings,
        route: "/admin",
        stat: "Gestão",
      }
    );
  }

  const filteredModules = modules.filter(mod => canAccess(mod.route));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {filteredModules.map((mod) => {
        const Icon = mod.icon;
        const colors = moduleColors[mod.id];
        return (
          <Card
            key={mod.id}
            onClick={() => navigate(mod.route)}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] hover:scale-[1.02]",
              "border border-border/50 hover:border-primary/30"
            )}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center gap-1.5 sm:gap-2">
              <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center", colors.bg)}>
                <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", colors.icon)} />
              </div>
              <span className="font-semibold text-xs sm:text-sm">{mod.title}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{mod.stat}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
