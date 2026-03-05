import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportSupporter {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  cep: string | null;
  cpf: string | null;
  funcao_politica: string | null;
  lideranca_politica: boolean;
  observacao: string | null;
  created_at: string | null;
}

interface ReportOptions {
  supporters: ReportSupporter[];
  campanhaNome?: string;
  campanhaPartido?: string;
  filters?: {
    search?: string;
    cidade?: string;
    bairro?: string;
    lideranca?: string;
  };
}

export function generateSupportersReport(opts: ReportOptions) {
  const { supporters, campanhaNome, campanhaPartido, filters } = opts;
  const now = new Date();
  const protocolNumber = `PES-${format(now, "yyyyMMdd-HHmmss")}`;

  const activeFilters: string[] = [];
  if (filters?.search) activeFilters.push(`Busca: "${filters.search}"`);
  if (filters?.cidade) activeFilters.push(`Cidade: ${filters.cidade}`);
  if (filters?.bairro) activeFilters.push(`Bairro: ${filters.bairro}`);
  if (filters?.lideranca === "true") activeFilters.push("Apenas Lideranças");
  if (filters?.lideranca === "false") activeFilters.push("Sem Lideranças");

  const totalLiderancas = supporters.filter((s) => s.lideranca_politica).length;

  const rows = supporters
    .map(
      (s, i) => `
    <tr>
      <td style="text-align:center;color:#64748b">${i + 1}</td>
      <td>
        <strong>${s.nome}</strong>
        ${s.lideranca_politica ? '<span class="lid-badge">Liderança</span>' : ""}
        ${s.funcao_politica ? `<br/><span style="font-size:11px;color:#64748b">${s.funcao_politica}</span>` : ""}
      </td>
      <td>${s.telefone || "—"}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis">${s.email || "—"}</td>
      <td>${[s.bairro, s.cidade].filter(Boolean).join(", ") || "—"}</td>
      <td style="font-size:11px;color:#64748b">${s.created_at ? format(new Date(s.created_at), "dd/MM/yy") : "—"}</td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Pessoas — ${protocolNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #f8fafc;
      color: #1e293b;
    }

    .page {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
    }

    .header {
      background: white;
      padding: 36px 48px 24px;
      border-bottom: 3px solid #0d7377;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .header-logo h1 {
      font-size: 18px;
      font-weight: 700;
      color: #0d7377;
      letter-spacing: -0.3px;
    }

    .header-logo p {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .protocol-badge {
      text-align: right;
    }

    .protocol-badge .label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #94a3b8;
    }

    .protocol-badge .number {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      font-family: monospace;
    }

    .title-section h2 {
      font-size: 22px;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.5px;
    }

    .content {
      padding: 32px 48px;
    }

    .stats-bar {
      display: flex;
      gap: 24px;
      margin-bottom: 28px;
    }

    .stat-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 20px;
      flex: 1;
    }

    .stat-item .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      font-weight: 600;
    }

    .stat-item .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #0d7377;
      margin-top: 2px;
    }

    .filters-info {
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 12px;
      color: #0d7377;
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #0d7377;
      font-weight: 700;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    thead th {
      background: #f8fafc;
      text-align: left;
      padding: 10px 12px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      font-weight: 700;
      border-bottom: 2px solid #e2e8f0;
    }

    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }

    tbody tr:hover { background: #fafafa; }

    .lid-badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 8px;
      border-radius: 10px;
      margin-left: 6px;
      vertical-align: middle;
    }

    .footer {
      padding: 20px 48px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }

    .footer p {
      font-size: 10px;
      color: #94a3b8;
    }

    @media print {
      body { background: white; }
      .page { box-shadow: none; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <div class="header-logo">
          <h1>${campanhaNome || "Campanha Eleitoral"}</h1>
          <p>${campanhaPartido ? campanhaPartido + " — " : ""}Relatório de Pessoas</p>
        </div>
        <div class="protocol-badge">
          <div class="label">Nº Relatório</div>
          <div class="number">${protocolNumber}</div>
        </div>
      </div>
      <div class="title-section">
        <h2>Relatório de Pessoas Cadastradas</h2>
      </div>
    </div>

    <div class="content">
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-label">Total de Pessoas</div>
          <div class="stat-value">${supporters.length}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Lideranças</div>
          <div class="stat-value">${totalLiderancas}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Data do Relatório</div>
          <div class="stat-value" style="font-size:15px">${format(now, "dd/MM/yyyy", { locale: ptBR })}</div>
        </div>
      </div>

      ${activeFilters.length > 0 ? `<div class="filters-info">🔍 Filtros aplicados: ${activeFilters.join(" • ")}</div>` : ""}

      <div class="section-title">Listagem</div>
      <table>
        <thead>
          <tr>
            <th style="width:40px">#</th>
            <th>Nome / Função</th>
            <th>Telefone</th>
            <th>E-mail</th>
            <th>Localidade</th>
            <th>Cadastro</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Documento gerado automaticamente em ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • ${campanhaNome || "CampanhaGov"} • ${protocolNumber}</p>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
