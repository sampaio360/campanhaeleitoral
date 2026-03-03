import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Lock, UserCog } from "lucide-react";
import { AdminRoleAssignment } from "./AdminRoleAssignment";
import { AdminAccessControl } from "./AdminAccessControl";
import { AdminUserAccessControl } from "./AdminUserAccessControl";

export function AdminPermissions() {
  return (
    <Tabs defaultValue="roles" className="space-y-4">
      <TabsList>
        <TabsTrigger value="roles" className="gap-2">
          <ShieldCheck className="w-4 h-4" />
          Atribuir Função
        </TabsTrigger>
        <TabsTrigger value="access" className="gap-2">
          <Lock className="w-4 h-4" />
          Por Função
        </TabsTrigger>
        <TabsTrigger value="user-access" className="gap-2">
          <UserCog className="w-4 h-4" />
          Por Usuário
        </TabsTrigger>
      </TabsList>

      <TabsContent value="roles">
        <AdminRoleAssignment />
      </TabsContent>

      <TabsContent value="access">
        <AdminAccessControl />
      </TabsContent>

      <TabsContent value="user-access">
        <AdminUserAccessControl />
      </TabsContent>
    </Tabs>
  );
}
