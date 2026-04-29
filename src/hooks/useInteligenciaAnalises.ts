import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { useAuth } from "@/hooks/useAuth";

export interface InteligenciaAnalise {
  id: string;
  campanha_id: string;
  nome: string;
  descricao: string | null;
  url: string;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useInteligenciaAnalises(opts: { onlyActive?: boolean } = {}) {
  const campanhaId = useActiveCampanhaId();
  return useQuery({
    queryKey: ["inteligencia-analises", campanhaId, opts.onlyActive ?? false],
    queryFn: async () => {
      if (!campanhaId) return [];
      let q = supabase
        .from("inteligencia_analises")
        .select("*")
        .eq("campanha_id", campanhaId)
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
}

export function useUpsertInteligenciaAnalise() {
  const qc = useQueryClient();
  const campanhaId = useActiveCampanhaId();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: AnaliseInput) => {
      if (!campanhaId) throw new Error("Nenhuma campanha selecionada");
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("inteligencia_analises")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inteligencia_analises").insert({
          ...rest,
          campanha_id: campanhaId,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inteligencia-analises"] });
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
