import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface Props {
  campanhaId: string;
}

interface ParsedMunicipio {
  nome: string;
  estado: string;
  populacao: number | null;
  meta_votos: number | null;
  prioridade: string;
  status: string;
  error?: string;
}

const VALID_ESTADOS = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
]);

const VALID_PRIORIDADES = new Set(["critica", "alta", "media", "baixa"]);

function parseRows(data: any[]): ParsedMunicipio[] {
  return data.map((raw: any) => {
    const nome = (raw.nome || raw.municipio || raw.cidade || "").toString().trim();
    const estado = (raw.estado || raw.uf || "").toString().trim().toUpperCase();
    const populacao = raw.populacao ? parseInt(raw.populacao) : null;
    const meta_votos = raw.meta_votos ? parseInt(raw.meta_votos) : null;
    const prioridade = VALID_PRIORIDADES.has((raw.prioridade || "").toString().toLowerCase())
      ? (raw.prioridade || "").toString().toLowerCase() : "media";
    const status = (raw.status || "").toString().toLowerCase() === "inativo" ? "inativo" : "ativo";

    let error: string | undefined;
    if (!nome) error = "Nome obrigatório";
    else if (!estado) error = "Estado obrigatório";
    else if (!VALID_ESTADOS.has(estado)) error = `UF inválida: ${estado}`;
    else if (populacao !== null && isNaN(populacao)) error = "População inválida";

    return { nome, estado, populacao, meta_votos, prioridade, status, error };
  });
}

export function MunicipiosImport({ campanhaId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedMunicipio[]>([]);
  const [fileName, setFileName] = useState("");

  const validRows = rows.filter(r => !r.error);
  const errorRows = rows.filter(r => !!r.error);

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
        setRows(parseRows(data));
        setOpen(true);
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setRows(parseRows(result.data));
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
        nome: r.nome,
        estado: r.estado,
        populacao: r.populacao,
        meta_votos: r.meta_votos,
        prioridade: r.prioridade,
        status: r.status,
      }));
      const { error } = await supabase.from("municipios").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipios"] });
      toast({ title: `${validRows.length} município(s) importado(s)!` });
      setOpen(false);
      setRows([]);
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("duplicate")
        ? "Alguns municípios já existem nesta campanha."
        : err?.message || "Erro ao importar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  return (
    <>
      <input type="file" ref={fileRef} accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFile} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/modelo_municipios.xlsx" download>
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
              <FileSpreadsheet className="w-5 h-5" /> Importar Municípios
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
              {validRows.length} município(s) prontos para importação.
            </div>
          )}

          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>População</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r, i) => (
                  <TableRow key={i} className={r.error ? "bg-destructive/5" : ""}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.nome || "—"}</TableCell>
                    <TableCell>{r.estado || "—"}</TableCell>
                    <TableCell>{r.populacao?.toLocaleString("pt-BR") || "—"}</TableCell>
                    <TableCell>{r.meta_votos?.toLocaleString("pt-BR") || "—"}</TableCell>
                    <TableCell>
                      {r.error
                        ? <Badge variant="destructive" className="text-xs">{r.error}</Badge>
                        : <Badge variant="secondary">{r.status}</Badge>}
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
              Colunas: nome, estado/uf, populacao, meta_votos, prioridade, status
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
