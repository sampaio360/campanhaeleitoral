import { useState } from "react";
import {
  BudgetModuleTabs,
  BudgetOverview,
  BudgetLoadingSkeleton,
  useBudgetData,
} from "@/components/budget";
import { BudgetPlanned } from "@/components/budget/BudgetPlanned";
import { BudgetExecuted } from "@/components/budget/BudgetExecuted";
import { Navbar } from "@/components/Navbar";

const Budget = () => {
  const [activeModule, setActiveModule] = useState<string>("overview");
  const { budgets, loading, creating, activeBudget, createBudget, updateBudget, deleteBudget } = useBudgetData();


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
      <div className="container mx-auto px-4">
        <div className="sticky top-14 sm:top-16 z-40 bg-background pb-4">
          <div className="mb-4 pt-8">
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Gerencie o orçamento e as finanças da campanha</p>
          </div>
          <BudgetModuleTabs activeModule={activeModule} onModuleChange={setActiveModule} />
        </div>

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
