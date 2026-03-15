import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { UserPlus, X, Search, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string | null;
}

interface UserSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function UserSelector({ selectedIds, onChange }: UserSelectorProps) {
  const activeCampanhaId = useActiveCampanhaId();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!activeCampanhaId || !open) return;
    setLoading(true);

    const fetchProfiles = async () => {
      // Get users from same campaign
      const { data: campaignUsers } = await supabase
        .from("user_campanhas")
        .select("user_id")
        .eq("campanha_id", activeCampanhaId);

      const { data: profileUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("campanha_id", activeCampanhaId);

      const userIds = new Set<string>();
      campaignUsers?.forEach(u => userIds.add(u.user_id));
      profileUsers?.forEach(u => userIds.add(u.id));

      if (userIds.size === 0) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", Array.from(userIds));

      if (data) setProfiles(data);
      setLoading(false);
    };

    fetchProfiles();
  }, [activeCampanhaId, open]);

  const filtered = useMemo(() => {
    if (!search) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  }, [profiles, search]);

  const selectedProfiles = useMemo(() =>
    profiles.filter(p => selectedIds.includes(p.id)),
    [profiles, selectedIds]
  );

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <div className="space-y-2">
      <Label>Destinatários específicos</Label>
      <p className="text-xs text-muted-foreground">Selecione pessoas para enviar diretamente</p>

      {selectedProfiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedProfiles.map(p => (
            <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
              {p.name}
              <button onClick={() => toggle(p.id)} className="ml-0.5 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Selecionar pessoas ({selectedIds.length})
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <ScrollArea className="h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="p-1">
                {filtered.map(p => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.includes(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      {p.email && (
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
