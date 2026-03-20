import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface Props {
  campanhaId: string;
}

interface ParsedVoto {
  municipio_nome: string;
  municipio_id: string | null;
  eleicao_ano: number;
  cargo: string;
  votacao: number;
  error?: string;
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function HistoricoImport({ campanhaId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedVoto[]>([]);
  const [fileName, setFileName] = useState("");

  const { data: municipios } = useQuery({
    queryKey: ["municipios-names", campanhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("municipios").select("id, nome, estado")
        .eq("campanha_id", campanhaId).order("nome");
      if (error) throw error;
      return data;
    },
  });

  const validRows = rows.filter(r => !r.error);
  const errorRows = rows.filter(r => !!r.error);

  function parseData(data: any[]): ParsedVoto[] {
    const munis = municipios || [];
    return data.map((raw: any) => {
      const municipio_nome = (raw.municipio || raw.cidade || raw.nome || "").toString().trim();
      const eleicao_ano = parseInt(raw.ano || raw.eleicao_ano || "0");
      const cargo = (raw.cargo || "").toString().trim();
      const votacao = parseInt(raw.votacao || raw.votos || "0");

      const match = munis.find(m => normalize(m.nome) === normalize(municipio_nome));

      let error: string | undefined;
      if (!municipio_nome) error = "Município obrigatório";
      else if (!match) error = `Município não encontrado: ${municipio_nome}`;
      else if (!eleicao_ano || eleicao_ano < 1900) error = "Ano inválido";
      else if (!cargo) error = "Cargo obrigatório";
      else if (!votacao || isNaN(votacao)) error = "Votação inválida";

      return { municipio_nome, municipio_id: match?.id || null, eleicao_ano, cargo, votacao, error };
    });
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setRows(parseData(data));
        setOpen(true);
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setRows(parseData(result.data));
          setOpen(true);
        },
        error: () => toast({ title: "Erro ao ler arquivo", variant: "destructive" }),
      });
    }
    e.target.value = "";
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const payload = validRows.map(r => ({
        campanha_id: campanhaId,
        municipio_id: r.municipio_id!,
        eleicao_ano: r.eleicao_ano,
        cargo: r.cargo,
        votacao: r.votacao,
      }));
      const { error } = await supabase.from("municipio_historico_votacao").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico-votacao", campanhaId] });
      toast({ title: `${validRows.length} registro(s) de votação importado(s)!` });
      setOpen(false);
      setRows([]);
    },
    onError: (err: any) => toast({ title: "Erro", description: err?.message, variant: "destructive" }),
  });

  return (
    <>
      <input type="file" ref={fileRef} accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFile} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/modelo_historico.xlsx" download>
            <Download className="w-4 h-4 mr-2" /> Modelo
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" /> Importar
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" /> Importar Histórico de Votação
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Arquivo: <strong>{fileName}</strong> · {rows.length} linha(s) encontrada(s)
          </p>

          {errorRows.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorRows.length} linha(s) com erro serão ignoradas.
            </div>
          )}

          {validRows.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {validRows.length} registro(s) prontos para importação.
            </div>
          )}

          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Votação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r, i) => (
                  <TableRow key={i} className={r.error ? "bg-destructive/5" : ""}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.municipio_nome || "—"}</TableCell>
                    <TableCell>{r.eleicao_ano || "—"}</TableCell>
                    <TableCell>{r.cargo || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {r.votacao ? r.votacao.toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      {r.error
                        ? <Badge variant="destructive" className="text-xs">{r.error}</Badge>
                        : <Badge variant="secondary">OK</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 50 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Exibindo 50 de {rows.length} linhas.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Colunas: municipio/cidade, ano/eleicao_ano, cargo, votacao/votos
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button disabled={importMutation.isPending || validRows.length === 0}
                onClick={() => importMutation.mutate()}>
                {importMutation.isPending ? "Importando..." : `Importar ${validRows.length}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
