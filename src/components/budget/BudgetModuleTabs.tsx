import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ClipboardList, Receipt } from "lucide-react";

interface BudgetModuleTabsProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const modules = [
  { id: "overview", label: "Visão Geral", icon: BarChart3 },
  { id: "planned", label: "Orçamento Planejado", icon: ClipboardList },
  { id: "executed", label: "Orçamento Executado", icon: Receipt },
];

export function BudgetModuleTabs({ activeModule, onModuleChange }: BudgetModuleTabsProps) {
  return (
    <Tabs value={activeModule} onValueChange={onModuleChange}>
      <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <TabsTrigger
              key={module.id}
              value={module.id}
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{module.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
