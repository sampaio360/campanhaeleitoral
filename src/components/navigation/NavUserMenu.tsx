import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User, Crown, Shield, UserCheck, Building2, Check } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { supabase } from "@/integrations/supabase/client";

const ROLE_LABELS: Record<string, { label: string; icon: typeof Crown }> = {
  master: { label: "Desenvolvedor", icon: Crown },
  admin: { label: "Administrador", icon: Shield },
  coordinator: { label: "Coordenador", icon: UserCheck },
  supervisor: { label: "Supervisor", icon: UserCheck },
  candidate: { label: "Candidato", icon: User },
  supporter: { label: "Apoiador", icon: User },
};

interface NavUserMenuProps {
  user: SupabaseUser;
  onSignOut: () => void;
}

interface Campanha {
  id: string;
  nome: string;
  partido: string | null;
  municipio: string | null;
  uf: string | null;
}

export function NavUserMenu({ user, onSignOut }: NavUserMenuProps) {
  const navigate = useNavigate();
  const { profile, userRoles, campanhaId, isMaster, selectedCampanhaId, setSelectedCampanhaId } = useAuth();
  const { canAccess } = useAccessControl();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const userName = profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário";
  const avatarUrl = (profile as any)?.avatar_url || null;
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const primaryRole = userRoles[0];
  const roleInfo = primaryRole ? ROLE_LABELS[primaryRole] : null;

  useEffect(() => {
    if (!isMaster) return;
    // Master sees all campanhas; RLS already handles filtering for other roles
    supabase
      .from("campanhas")
      .select("id, nome, partido, municipio, uf")
      .is("deleted_at", null)
      .order("nome")
      .then(({ data }) => { if (data) setCampanhas(data); });
  }, [isMaster]);

  const activeCampanhaId = isMaster ? selectedCampanhaId : campanhaId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <span className="hidden sm:block text-sm font-medium max-w-[150px] truncate">
            {userName}
          </span>
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            {roleInfo && (
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-xs gap-1">
                  {isMaster && <Crown className="w-3 h-3" />}
                  {roleInfo.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {isMaster ? "Acesso global" : campanhaId ? "Vinculado" : "Sem campanha"}
                </span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        {isMaster && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Building2 className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {activeCampanhaId
                    ? campanhas.find(c => c.id === activeCampanhaId)?.nome || "Campanha"
                    : "Selecione uma campanha"}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64 max-h-64 overflow-y-auto">
                {campanhas.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => setSelectedCampanhaId(c.id)}>
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="truncate">
                        {c.nome} {c.partido ? `(${c.partido})` : ""} {c.municipio ? `- ${c.municipio}/${c.uf}` : ""}
                      </span>
                      {activeCampanhaId === c.id && <Check className="h-4 w-4 shrink-0 ml-2 text-primary" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          Meu Perfil
        </DropdownMenuItem>
        {canAccess("/settings") && (
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
