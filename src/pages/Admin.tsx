import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Navbar } from "@/components/Navbar";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Building2, Link2, GitBranch, UserCheck, FileText } from "lucide-react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminPermissions } from "@/components/admin/AdminPermissions";
import { AdminCampanhas } from "@/components/admin/AdminCampanhas";
import { AdminUserCampanhas } from "@/components/admin/AdminUserCampanhas";
import { AdminHierarchy } from "@/components/admin/AdminHierarchy";
import { AdminUserSupporters } from "@/components/admin/AdminUserSupporters";
import { AdminExternalForm } from "@/components/admin/AdminExternalForm";

const adminTabs = [
  { value: "users", label: "Usuários", icon: Users, route: "/admin?tab=users" },
  { value: "permissions", label: "Permissões", icon: Shield, route: "/admin?tab=permissions" },
  { value: "campanhas", label: "Campanhas", icon: Building2, route: "/admin?tab=campanhas" },
  { value: "access", label: "Acesso", icon: Link2, route: "/admin?tab=access" },
  { value: "vinculos", label: "Vínculos", icon: UserCheck, route: "/admin?tab=vinculos" },
  { value: "hierarchy", label: "Hierarquia", icon: GitBranch, route: "/admin?tab=hierarchy" },
  { value: "external-form", label: "Form Externo", icon: FileText, route: "/admin?tab=external-form" },
];

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const { canAccess } = useAccessControl();

  const visibleTabs = adminTabs.filter(tab => canAccess(tab.route));
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Administrador</h1>
        <p className="text-muted-foreground">Gerencie usuários, permissões e campanhas</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full grid-cols-${visibleTabs.length} lg:w-auto lg:inline-flex mb-6`}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="permissions"><AdminPermissions /></TabsContent>
        <TabsContent value="campanhas"><AdminCampanhas /></TabsContent>
        <TabsContent value="access"><AdminUserCampanhas /></TabsContent>
        <TabsContent value="vinculos"><AdminUserSupporters /></TabsContent>
        <TabsContent value="hierarchy"><AdminHierarchy /></TabsContent>
        <TabsContent value="external-form"><AdminExternalForm /></TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Admin;
