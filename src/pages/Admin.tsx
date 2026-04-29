import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Navbar } from "@/components/Navbar";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Shield, FileText, LayoutDashboard, Brain } from "lucide-react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminCampanhas } from "@/components/admin/AdminCampanhas";
import { AdminAccessControl } from "@/components/admin/AdminAccessControl";
import { AdminUserAccessControl } from "@/components/admin/AdminUserAccessControl";
import { AdminExternalForm } from "@/components/admin/AdminExternalForm";
import { AdminDashboardWidgets } from "@/components/admin/AdminDashboardWidgets";
import { AdminInteligencia } from "@/components/admin/AdminInteligencia";

const adminTabs = [
  { value: "campanhas", label: "Campanhas", icon: Building2, step: 1, hint: "Crie e gerencie campanhas", route: "/admin?tab=campanhas", masterOnly: true },
  { value: "users", label: "Usuários", icon: Users, step: 2, hint: "Cadastre, vincule campanhas, atribua funções e gerencie acessos", route: "/admin?tab=users" },
  { value: "permissions", label: "Permissões", icon: Shield, step: 3, hint: "Controle de acesso por função e por usuário", route: "/admin?tab=permissions" },
  { value: "external-form", label: "Form Externo", icon: FileText, hint: "Configure formulário público", route: "/admin?tab=external-form" },
  { value: "dashboard-widgets", label: "Dashboard", icon: LayoutDashboard, hint: "Ative ou desative widgets do Dashboard", route: "/admin?tab=dashboard-widgets" },
  { value: "inteligencia", label: "Inteligência", icon: Brain, hint: "Cadastre análises externas que aparecem no módulo Inteligência Eleitoral", route: "/admin?tab=inteligencia" },
];

const Admin = () => {
  const { isAdmin, isMaster, loading } = useAuth();
  const { canAccess } = useAccessControl();

  const visibleTabs = adminTabs.filter(tab => {
    if ((tab as any).masterOnly && !isMaster) return false;
    return canAccess(tab.route);
  });
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.value || "users");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const activeTabData = adminTabs.find(t => t.value === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-14 sm:top-16 z-40 bg-background pb-4">
            <div className="mb-4 pt-8">
              <h1 className="text-3xl font-bold">Administrador</h1>
              <p className="text-muted-foreground">Gerencie usuários, permissões e campanhas</p>
            </div>

            {/* Workflow steps indicator */}
            <div className="hidden md:flex items-center gap-1 mb-4 p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
              {adminTabs.filter(t => t.step).map((tab, i, arr) => (
                <span key={tab.value} className="flex items-center gap-1">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${activeTab === tab.value ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                    {tab.step}
                  </span>
                  <span className={activeTab === tab.value ? 'text-foreground font-medium' : ''}>{tab.label}</span>
                  {i < arr.length - 1 && <span className="mx-1 text-muted-foreground/40">→</span>}
                </span>
              ))}
            </div>

            <TabsList className="flex flex-wrap w-full lg:w-auto lg:inline-flex">
              {visibleTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                    {tab.step && (
                      <span className="hidden sm:inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted-foreground/20 text-[9px] font-bold">
                        {tab.step}
                      </span>
                    )}
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {activeTabData?.hint && (
            <p className="text-sm text-muted-foreground mb-4">{activeTabData.hint}</p>
          )}

          <TabsContent value="campanhas"><AdminCampanhas /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="permissions">
            <Tabs defaultValue="access" className="space-y-4">
              <TabsList>
                <TabsTrigger value="access" className="gap-2">Por Função</TabsTrigger>
                <TabsTrigger value="user-access" className="gap-2">Por Usuário</TabsTrigger>
              </TabsList>
              <TabsContent value="access"><AdminAccessControl /></TabsContent>
              <TabsContent value="user-access"><AdminUserAccessControl /></TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="external-form"><AdminExternalForm /></TabsContent>
          <TabsContent value="dashboard-widgets"><AdminDashboardWidgets /></TabsContent>
          <TabsContent value="inteligencia"><AdminInteligencia /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
