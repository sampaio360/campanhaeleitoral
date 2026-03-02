import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BudgetModuleTabs,
  BudgetOverview,
  BudgetLoadingSkeleton,
  useBudgetData,
} from "@/components/budget";
import { BudgetPlanned } from "@/components/budget/BudgetPlanned";
import { BudgetExecuted } from "@/components/budget/BudgetExecuted";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Budget = () => {
  const [activeModule, setActiveModule] = useState<string>("overview");
  const { budgets, loading, creating, activeBudget, createBudget, updateBudget, deleteBudget } = useBudgetData();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <BudgetLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/modulos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Módulos
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Gerencie o orçamento e as finanças da campanha</p>
          </div>
        </div>

        <BudgetModuleTabs activeModule={activeModule} onModuleChange={setActiveModule} />

        {activeModule === "overview" && (
          <BudgetOverview budgets={budgets} activeBudget={activeBudget} />
        )}

        {activeModule === "planned" && (
          <BudgetPlanned
            budgets={budgets}
            activeBudget={activeBudget}
            creating={creating}
            createBudget={createBudget}
            updateBudget={updateBudget}
            deleteBudget={deleteBudget}
          />
        )}

        {activeModule === "executed" && (
          <BudgetExecuted />
        )}
      </div>
    </div>
  );
};

export default Budget;
