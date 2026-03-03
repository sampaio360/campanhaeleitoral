import { useNavigate } from "react-router-dom";
import { BarChart3, DollarSign, Users, FileText, Settings, MapPin, Package, Route, MessageCircle, TrendingUp, History, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardData } from "./useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { cn } from "@/lib/utils";

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
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      id: "financeiro",
      title: "Financeiro",
      icon: DollarSign,
      route: "/budget",
      stat: loading ? "..." : hasCandidate ? `${formatCurrency(stats.totalBudget)} | ${stats.expensesCount} despesas` : "Configurar",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      id: "pessoas",
      title: "Pessoas",
      icon: Users,
      route: "/supporters",
      stat: loading ? "..." : hasCandidate ? `${stats.supportersCount}` : "Configurar",
      gradient: "from-purple-500 to-violet-600",
    },
    {
      id: "municipios",
      title: "Municípios",
      icon: Building2,
      route: "/municipios",
      stat: "Gestão territorial",
      gradient: "from-sky-500 to-blue-600",
    },
    {
      id: "checkin",
      title: "Check-in",
      icon: MapPin,
      route: "/checkin",
      stat: "Ações de rua",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      id: "resources",
      title: "Recursos",
      icon: Package,
      route: "/resources",
      stat: "Solicitações",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      id: "roteiro",
      title: "Roteiro",
      icon: Route,
      route: "/roteiro",
      stat: "Planejamento",
      gradient: "from-teal-500 to-cyan-600",
    },
    {
      id: "mensagens",
      title: "Mensagens",
      icon: MessageCircle,
      route: "/mensagens",
      stat: "Orientações",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      id: "reports",
      title: "Relatórios",
      icon: FileText,
      route: "/reports",
      stat: `${stats.reportsCount} disponíveis`,
      gradient: "from-orange-500 to-red-500",
    },
    {
      id: "historico",
      title: "Histórico",
      icon: History,
      route: "/historico",
      stat: "Atividades",
      gradient: "from-slate-500 to-gray-600",
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
        gradient: "from-cyan-500 to-blue-600",
      },
      {
        id: "admin",
        title: "Admin",
        icon: Settings,
        route: "/admin",
        stat: "Gestão",
        gradient: "from-slate-500 to-slate-700",
      }
    );
  }

  const filteredModules = modules.filter(mod => canAccess(mod.route));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {filteredModules.map((mod) => {
        const Icon = mod.icon;
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary/10">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
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
