import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, BarChart3, DollarSign, Users, FileText, MapPin, Package, CalendarDays, Route, MessageCircle, TrendingUp, History, Building2, Settings, LayoutGrid, Brain } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutGrid, label: "Módulos", path: "/modulos" },
  { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
  { icon: DollarSign, label: "Financeiro", path: "/budget" },
  { icon: Users, label: "Pessoas", path: "/supporters" },
  { icon: Building2, label: "Municípios", path: "/municipios" },
  { icon: MapPin, label: "Check-in", path: "/checkin" },
  { icon: Package, label: "Recursos", path: "/resources" },
  { icon: CalendarDays, label: "Agenda", path: "/agenda" },
  { icon: Route, label: "Roteiro", path: "/roteiro" },
  { icon: MessageCircle, label: "Mensagens", path: "/mensagens" },
  { icon: FileText, label: "Relatórios", path: "/reports" },
  { icon: History, label: "Histórico", path: "/historico" },
  { icon: Brain, label: "Inteligência Eleitoral", path: "/inteligencia" },
];

const adminItems = [
  { icon: TrendingUp, label: "ROI", path: "/roi" },
  { icon: Settings, label: "Admin", path: "/admin" },
];

export function NavMobileMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { canAccess } = useAccessControl();

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;
  const filteredItems = allItems.filter(item => canAccess(item.path));

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            CampanhaGov
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-6">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("justify-start gap-3", isActive && "font-semibold")}
                onClick={() => handleNavigate(item.path)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
