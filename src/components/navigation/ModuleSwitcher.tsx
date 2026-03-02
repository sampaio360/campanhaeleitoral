import { useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  FileText,
  Settings,
  MapPin,
  Package
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const modules = [
  { id: "dashboard", title: "Dashboard", icon: BarChart3, route: "/dashboard" },
  { id: "financeiro", title: "Financeiro", icon: DollarSign, route: "/budget", children: ["/budget", "/expenses"] },
  { id: "pessoas", title: "Pessoas", icon: Users, route: "/supporters" },
  { id: "checkin", title: "Check-in", icon: MapPin, route: "/checkin" },
  { id: "resources", title: "Recursos", icon: Package, route: "/resources" },
  { id: "reports", title: "Relatórios", icon: FileText, route: "/reports" },
];

const adminModule = { id: "admin", title: "Admin", icon: Settings, route: "/admin" };

export function ModuleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const allModules = isAdmin ? [...modules, adminModule] : modules;

  const isActive = (mod: typeof modules[0]) => {
    if ("children" in mod && mod.children) {
      return mod.children.some(r => location.pathname.startsWith(r));
    }
    return location.pathname.startsWith(mod.route);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allModules.map((mod) => {
        const Icon = mod.icon;
        const active = isActive(mod);
        return (
          <button
            key={mod.id}
            onClick={() => navigate(mod.route)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              "border hover:shadow-sm",
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{mod.title}</span>
          </button>
        );
      })}
    </div>
  );
}
