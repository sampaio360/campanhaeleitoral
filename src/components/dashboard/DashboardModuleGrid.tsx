import { useNavigate } from "react-router-dom";
import { BarChart3, DollarSign, Users, FileText, Settings, MapPin, Package, Route, MessageCircle, TrendingUp, History, Building2, CalendarDays, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useModuleStats } from "./useModuleStats";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { cn } from "@/lib/utils";

// Cores coordenadas por grupo lógico
const moduleColors: Record<string, { bg: string; icon: string; hoverBg: string }> = {
  dashboard:  { bg: "bg-indigo-100", icon: "text-indigo-700", hoverBg: "hover:bg-indigo-200" },
  pessoas:    { bg: "bg-violet-100", icon: "text-violet-700", hoverBg: "hover:bg-violet-200" },
  municipios: { bg: "bg-purple-100", icon: "text-purple-700", hoverBg: "hover:bg-purple-200" },
  checkin:    { bg: "bg-fuchsia-100", icon: "text-fuchsia-700", hoverBg: "hover:bg-fuchsia-200" },
  roteiro:    { bg: "bg-violet-100", icon: "text-violet-700", hoverBg: "hover:bg-violet-200" },
  financeiro: { bg: "bg-emerald-100", icon: "text-emerald-700", hoverBg: "hover:bg-emerald-200" },
  roi:        { bg: "bg-green-100", icon: "text-green-700", hoverBg: "hover:bg-green-200" },
  agenda:     { bg: "bg-amber-100", icon: "text-amber-700", hoverBg: "hover:bg-amber-200" },
  resources:  { bg: "bg-orange-100", icon: "text-orange-700", hoverBg: "hover:bg-orange-200" },
  mensagens:  { bg: "bg-yellow-100", icon: "text-yellow-700", hoverBg: "hover:bg-yellow-200" },
  reports:    { bg: "bg-sky-100", icon: "text-sky-700", hoverBg: "hover:bg-sky-200" },
  historico:    { bg: "bg-blue-100", icon: "text-blue-700", hoverBg: "hover:bg-blue-200" },
  inteligencia: { bg: "bg-cyan-100", icon: "text-cyan-700", hoverBg: "hover:bg-cyan-200" },
  admin:        { bg: "bg-slate-200", icon: "text-slate-700", hoverBg: "hover:bg-slate-300" },
};

export function DashboardModuleGrid() {
  const { stats, loading, hasCandidate } = useModuleStats();
  const { isAdmin } = useAuth();
  const { canAccess } = useAccessControl();
  const navigate = useNavigate();

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Módulos organizados por grupo lógico do sistema
  const modules = [
    // 1. Visão Geral
    { id: "dashboard", title: "Dash", icon: BarChart3, route: "/dashboard", stat: "Visão executiva" },
    // 2. Campo & Pessoas
    { id: "pessoas", title: "Pessoas", icon: Users, route: "/supporters",
      stat: loading ? "..." : hasCandidate ? `${stats.supportersCount}` : "Configurar" },
    { id: "municipios", title: "Municípios", icon: Building2, route: "/municipios", stat: "Gestão territorial" },
    { id: "checkin", title: "Check-in", icon: MapPin, route: "/checkin", stat: "Ações de rua" },
    { id: "roteiro", title: "Roteiro", icon: Route, route: "/roteiro", stat: "Planejamento" },
    // 3. Financeiro
    { id: "financeiro", title: "Financeiro", icon: DollarSign, route: "/budget",
      stat: loading ? "..." : hasCandidate ? `${formatCurrency(stats.totalBudget)} | ${stats.expensesCount} despesas` : "Configurar" },
    // 4. Operacional
    { id: "agenda", title: "Agenda", icon: CalendarDays, route: "/agenda", stat: "Compromissos" },
    { id: "resources", title: "Recursos", icon: Package, route: "/resources", stat: "Solicitações" },
    { id: "mensagens", title: "Mensagens", icon: MessageCircle, route: "/mensagens", stat: "Orientações" },
    // 5. Relatórios & Histórico
    { id: "reports", title: "Relatórios", icon: FileText, route: "/reports", stat: `${stats.reportsCount} disponíveis` },
    { id: "historico", title: "Histórico", icon: History, route: "/historico", stat: "Atividades" },
    { id: "inteligencia", title: "Inteligência Eleitoral", icon: Brain, route: "/inteligencia", stat: "Análises externas" },
  ];

  if (isAdmin) {
    // ROI junto do Financeiro
    const finIdx = modules.findIndex(m => m.id === "financeiro");
    modules.splice(finIdx + 1, 0, {
      id: "roi", title: "ROI", icon: TrendingUp, route: "/roi", stat: "Custo por Voto",
    });
    // Admin no final
    modules.push({
      id: "admin", title: "Admin", icon: Settings, route: "/admin", stat: "Gestão",
    });
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
              "cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] hover:scale-[1.02] border-0",
              colors.bg,
              colors.hoverBg
            )}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center gap-1.5 sm:gap-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-white/80 shadow-sm">
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
