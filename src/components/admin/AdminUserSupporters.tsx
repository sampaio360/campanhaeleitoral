import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, Unlink, Search, UserCheck } from "lucide-react";

export function AdminUserSupporters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-supporters'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, supporter_id, campanha_id')
        .order('name');
      if (error) throw error;

      // Fetch linked supporters names
      const supporterIds = profiles?.filter(p => p.supporter_id).map(p => p.supporter_id!) || [];
      let supportersMap: Record<string, string> = {};
      if (supporterIds.length > 0) {
        const { data: supporters } = await supabase
          .from('supporters')
          .select('id, nome')
          .in('id', supporterIds);
        supporters?.forEach(s => { supportersMap[s.id] = s.nome; });
      }

      return profiles?.map(p => ({
        ...p,
        supporterName: p.supporter_id ? supportersMap[p.supporter_id] || '—' : null,
      })) || [];
    }
  });

  const { data: supporters } = useQuery({
    queryKey: ['admin-supporters-search', linkingUserId],
    enabled: !!linkingUserId,
    queryFn: async () => {
      const user = users?.find(u => u.id === linkingUserId);
      let query = supabase.from('supporters').select('id, nome, telefone, bairro, cidade').order('nome');
      if (user?.campanha_id) {
        query = query.eq('campanha_id', user.campanha_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const linkMutation = useMutation({
    mutationFn: async ({ userId, supporterId }: { userId: string; supporterId: string | null }) => {
      // Cross-validate: ensure supporter belongs to same campaign as user
      if (supporterId) {
        const user = users?.find(u => u.id === userId);
        const { data: supporter } = await supabase
          .from('supporters')
          .select('campanha_id')
          .eq('id', supporterId)
          .single();
        if (user?.campanha_id && supporter?.campanha_id && user.campanha_id !== supporter.campanha_id) {
          throw new Error('A pessoa selecionada pertence a outra campanha. Selecione uma pessoa da mesma campanha do usuário.');
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ supporter_id: supporterId })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-supporters'] });
      setLinkingUserId(null);
      toast({ title: "Vínculo atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao vincular", description: error.message, variant: "destructive" });
    }
  });

  const filteredSupporters = supporters?.filter(s =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.telefone?.includes(searchTerm) ||
    s.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Vincular Usuário a Pessoa
          </CardTitle>
          <CardDescription>
            Associe cada usuário do sistema a um registro no cadastro de pessoas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pessoa Vinculada</TableHead>
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
                  <TableCell>
                    {user.supporterName ? (
                      <Badge variant="default" className="gap-1">
                        <UserCheck className="w-3 h-3" />
                        {user.supporterName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Não vinculado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => { setLinkingUserId(user.id); setSearchTerm(""); }}
                      >
                        <Link2 className="w-3 h-3" />
                        {user.supporter_id ? "Alterar" : "Vincular"}
                      </Button>
                      {user.supporter_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive"
                          onClick={() => linkMutation.mutate({ userId: user.id, supporterId: null })}
                        >
                          <Unlink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!linkingUserId} onOpenChange={(open) => { if (!open) setLinkingUserId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular a Pessoa</DialogTitle>
            <DialogDescription>
              Busque pelo nome no cadastro de pessoas para vincular ao usuário{" "}
              <strong>{users?.find(u => u.id === linkingUserId)?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Command className="border rounded-md">
            <CommandInput
              placeholder="Buscar pelo nome..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
              <CommandGroup>
                {filteredSupporters.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.nome}
                    onSelect={() => {
                      linkMutation.mutate({ userId: linkingUserId!, supporterId: s.id });
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{s.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {[s.bairro, s.cidade].filter(Boolean).join(', ') || 'Sem localização'}
                        {s.telefone ? ` • ${s.telefone}` : ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingUserId(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
