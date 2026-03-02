import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Building2, Link2, GitBranch, UserCheck, FileText } from "lucide-react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminPermissions } from "@/components/admin/AdminPermissions";
import { AdminCampanhas } from "@/components/admin/AdminCampanhas";
import { AdminUserCampanhas } from "@/components/admin/AdminUserCampanhas";
import { AdminHierarchy } from "@/components/admin/AdminHierarchy";
import { AdminUserSupporters } from "@/components/admin/AdminUserSupporters";
import { AdminExternalForm } from "@/components/admin/AdminExternalForm";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const { isAdmin, loading } = useAuth();

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Administrador</h1>
        <p className="text-muted-foreground">Gerencie usuários, permissões e campanhas</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex mb-6">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Permissões</span>
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Acesso</span>
          </TabsTrigger>
          <TabsTrigger value="vinculos" className="gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Vínculos</span>
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2">
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">Hierarquia</span>
          </TabsTrigger>
          <TabsTrigger value="external-form" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Form Externo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="permissions">
          <AdminPermissions />
        </TabsContent>

        <TabsContent value="campanhas">
          <AdminCampanhas />
        </TabsContent>

        <TabsContent value="access">
          <AdminUserCampanhas />
        </TabsContent>

        <TabsContent value="vinculos">
          <AdminUserSupporters />
        </TabsContent>

        <TabsContent value="hierarchy">
          <AdminHierarchy />
        </TabsContent>

        <TabsContent value="external-form">
          <AdminExternalForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
