import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Navbar } from "@/components/Navbar";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Link2, Shield, FileText, LayoutDashboard } from "lucide-react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminPermissions } from "@/components/admin/AdminPermissions";
import { AdminCampanhas } from "@/components/admin/AdminCampanhas";
import { AdminUserCampanhas } from "@/components/admin/AdminUserCampanhas";
import { AdminHierarchy } from "@/components/admin/AdminHierarchy";
import { AdminUserSupporters } from "@/components/admin/AdminUserSupporters";
import { AdminExternalForm } from "@/components/admin/AdminExternalForm";
import { AdminDashboardWidgets } from "@/components/admin/AdminDashboardWidgets";

const adminTabs = [
  { value: "campanhas", label: "Campanhas", icon: Building2, step: 1, hint: "Crie e gerencie campanhas", route: "/admin?tab=campanhas" },
  { value: "users", label: "Usuários", icon: Users, step: 2, hint: "Cadastre, vincule e organize seus usuários", route: "/admin?tab=users" },
  { value: "access", label: "Acesso", icon: Link2, step: 3, hint: "Vincule usuários às campanhas", route: "/admin?tab=access" },
  { value: "permissions", label: "Permissões", icon: Shield, step: 4, hint: "Defina funções e controle de acesso", route: "/admin?tab=permissions" },
  { value: "external-form", label: "Form Externo", icon: FileText, hint: "Configure formulário público", route: "/admin?tab=external-form" },
  { value: "dashboard-widgets", label: "Dashboard", icon: LayoutDashboard, hint: "Ative ou desative widgets do Dashboard", route: "/admin?tab=dashboard-widgets" },
];

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const { canAccess } = useAccessControl();

  const visibleTabs = adminTabs.filter(tab => canAccess(tab.route));
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.value || "campanhas");

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Administrador</h1>
          <p className="text-muted-foreground">Gerencie usuários, permissões e campanhas</p>
        </div>

        {/* Workflow steps indicator */}
        <div className="hidden md:flex items-center gap-1 mb-6 p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap w-full lg:w-auto lg:inline-flex mb-2">
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

          {activeTabData?.hint && (
            <p className="text-sm text-muted-foreground mb-4">{activeTabData.hint}</p>
          )}

          <TabsContent value="campanhas"><AdminCampanhas /></TabsContent>
          <TabsContent value="users">
            <div className="space-y-8">
              <AdminUsers />
              <AdminUserSupporters />
              <AdminHierarchy />
            </div>
          </TabsContent>
          <TabsContent value="access"><AdminUserCampanhas /></TabsContent>
          <TabsContent value="permissions"><AdminPermissions /></TabsContent>
          <TabsContent value="external-form"><AdminExternalForm /></TabsContent>
          <TabsContent value="dashboard-widgets"><AdminDashboardWidgets /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
