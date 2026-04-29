import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { useAuth } from "@/hooks/useAuth";

export interface InteligenciaAnalise {
  id: string;
  nome: string;
  descricao: string | null;
  url: string;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  campanha_ids?: string[];
}

/** Catálogo do usuário: análises vinculadas à campanha ativa */
export function useInteligenciaAnalises(opts: { onlyActive?: boolean } = {}) {
  const campanhaId = useActiveCampanhaId();
  return useQuery({
    queryKey: ["inteligencia-analises", campanhaId, opts.onlyActive ?? false],
    queryFn: async () => {
      if (!campanhaId) return [];
      // 1) Pega ids das análises vinculadas à campanha
      const { data: vinc, error: vincErr } = await supabase
        .from("inteligencia_analise_campanhas")
        .select("analise_id")
        .eq("campanha_id", campanhaId);
      if (vincErr) throw vincErr;
      const ids = (vinc || []).map((v: any) => v.analise_id);
      if (ids.length === 0) return [];
      let q = supabase
        .from("inteligencia_analises")
        .select("*")
        .in("id", ids)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (opts.onlyActive) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as InteligenciaAnalise[];
    },
    enabled: !!campanhaId,
  });
}

/** Admin (Master): lista todas as análises com seus vínculos */
export function useInteligenciaAnalisesAdmin() {
  return useQuery({
    queryKey: ["inteligencia-analises-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inteligencia_analises")
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      const analises = (data || []) as InteligenciaAnalise[];
      if (analises.length === 0) return analises;
      const { data: links, error: linksErr } = await supabase
        .from("inteligencia_analise_campanhas")
        .select("analise_id, campanha_id")
        .in(
          "analise_id",
          analises.map((a) => a.id),
        );
      if (linksErr) throw linksErr;
      const map = new Map<string, string[]>();
      (links || []).forEach((l: any) => {
        const arr = map.get(l.analise_id) || [];
        arr.push(l.campanha_id);
        map.set(l.analise_id, arr);
      });
      return analises.map((a) => ({ ...a, campanha_ids: map.get(a.id) || [] }));
    },
  });
}

export function useInteligenciaAnalise(id: string | undefined) {
  return useQuery({
    queryKey: ["inteligencia-analise", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("inteligencia_analises")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as InteligenciaAnalise | null;
    },
    enabled: !!id,
  });
}

export interface AnaliseInput {
  id?: string;
  nome: string;
  descricao?: string | null;
  url: string;
  imagem_url?: string | null;
  ordem?: number;
  ativo?: boolean;
  campanha_ids: string[];
}

export function useUpsertInteligenciaAnalise() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: AnaliseInput) => {
      const { id, campanha_ids, ...rest } = input;
      if (!campanha_ids || campanha_ids.length === 0) {
        throw new Error("Selecione ao menos uma campanha");
      }
      let analiseId = id;
      if (id) {
        const { error } = await supabase
          .from("inteligencia_analises")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("inteligencia_analises")
          .insert({ ...rest, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        analiseId = data.id;
      }
      // Re-sincroniza vínculos
      const { error: delErr } = await supabase
        .from("inteligencia_analise_campanhas")
        .delete()
        .eq("analise_id", analiseId!);
      if (delErr) throw delErr;
      const rows = campanha_ids.map((cid) => ({ analise_id: analiseId!, campanha_id: cid }));
      const { error: insErr } = await supabase
        .from("inteligencia_analise_campanhas")
        .insert(rows);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inteligencia-analises"] });
      qc.invalidateQueries({ queryKey: ["inteligencia-analises-admin"] });
    },
  });
}

export function useDeleteInteligenciaAnalise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inteligencia_analises")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inteligencia-analises"] });
      qc.invalidateQueries({ queryKey: ["inteligencia-analises-admin"] });
    },
  });
}

export async function uploadCapaInteligencia(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("inteligencia-capas")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("inteligencia-capas").getPublicUrl(path);
  return data.publicUrl;
}
