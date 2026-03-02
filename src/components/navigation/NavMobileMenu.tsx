import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, BarChart3, DollarSign, Receipt, Users, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const navItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: DollarSign, label: "Orçamento", path: "/budget" },
  { icon: Receipt, label: "Despesas", path: "/expenses" },
  { icon: Users, label: "Pessoas", path: "/supporters" },
  { icon: FileText, label: "Relatórios", path: "/reports" },
];

export function NavMobileMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        <nav className="flex flex-col gap-2 mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className="justify-start gap-3"
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