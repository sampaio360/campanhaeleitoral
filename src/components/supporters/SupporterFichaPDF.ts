import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FichaSupporter {
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

interface FichaOptions {
  supporter: FichaSupporter;
  campanhaNome?: string;
  campanhaPartido?: string;
}

function row(label: string, value: string | null | undefined): string {
  return `
    <tr>
      <td class="label">${label}</td>
      <td class="value">${value || "—"}</td>
    </tr>`;
}

export function generateSupporterFicha(opts: FichaOptions) {
  const { supporter, campanhaNome, campanhaPartido } = opts;
  const now = new Date();
  const fichaId = `FIC-${format(now, "yyyyMMdd-HHmmss")}`;
  const cadastro = supporter.created_at
    ? format(new Date(supporter.created_at), "dd/MM/yyyy", { locale: ptBR })
    : "—";
  const cityState = [supporter.cidade, supporter.estado].filter(Boolean).join("/");
  const fullAddress = [supporter.endereco, supporter.bairro].filter(Boolean).join(", ");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Ficha – ${supporter.nome}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      background: #f1f5f9;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .page {
      max-width: 720px;
      margin: 24px auto;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      overflow: hidden;
    }

    /* ── Header ── */
    .header {
      padding: 28px 40px 20px;
      border-bottom: 3px solid #0d7377;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header h1 { font-size: 18px; font-weight: 700; }
    .header .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
    .ficha-badge {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .ficha-badge .number {
      font-size: 13px;
      font-weight: 700;
      color: #0d7377;
    }

    /* ── Person section ── */
    .person-header {
      padding: 28px 40px 0;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .avatar {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: #0d7377;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .person-name { font-size: 20px; font-weight: 700; }
    .person-badges { display: flex; gap: 8px; margin-top: 4px; }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #475569;
    }
    .badge.lideranca {
      background: #fef3c7;
      color: #92400e;
    }

    /* ── Data table ── */
    .content { padding: 24px 40px 32px; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .6px;
      color: #0d7377;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .data-table td { padding: 8px 0; font-size: 13px; vertical-align: top; }
    .data-table .label {
      width: 140px;
      color: #64748b;
      font-weight: 500;
    }
    .data-table .value { font-weight: 500; }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 32px;
    }
    .two-col .data-table { margin-bottom: 0; }

    .obs-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 18px;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      min-height: 60px;
    }

    /* ── Footer ── */
    .footer {
      padding: 20px 40px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .footer p { font-size: 10px; color: #94a3b8; }

    /* ── Signature ── */
    .signature-area {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-top: 48px;
      padding-top: 8px;
    }
    .sig-block {
      flex: 1;
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      font-size: 11px;
      color: #64748b;
    }

    @media print {
      body { background: white; }
      .page { box-shadow: none; border-radius: 0; margin: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <div>
          <h1>${campanhaNome || "Campanha Eleitoral"}</h1>
          <p class="subtitle">${campanhaPartido ? campanhaPartido + " — " : ""}Ficha Cadastral</p>
        </div>
        <div class="ficha-badge">
          <div>Nº Ficha</div>
          <div class="number">${fichaId}</div>
        </div>
      </div>
    </div>

    <div class="person-header">
      <div class="avatar">${supporter.nome.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</div>
      <div>
        <div class="person-name">${supporter.nome}</div>
        <div class="person-badges">
          ${supporter.funcao_politica ? `<span class="badge">${supporter.funcao_politica}</span>` : ""}
          ${supporter.lideranca_politica ? `<span class="badge lideranca">Liderança</span>` : ""}
        </div>
      </div>
    </div>

    <div class="content">
      <div class="section-title">Dados Pessoais</div>
      <div class="two-col">
        <table class="data-table">
          ${row("Telefone", supporter.telefone)}
          ${row("E-mail", supporter.email)}
          ${row("CPF", supporter.cpf)}
          ${row("Função Política", supporter.funcao_politica)}
        </table>
        <table class="data-table">
          ${row("Endereço", fullAddress || null)}
          ${row("Cidade / UF", cityState || null)}
          ${row("CEP", supporter.cep)}
          ${row("Cadastro em", cadastro)}
        </table>
      </div>

      ${supporter.observacao ? `
        <div class="section-title" style="margin-top:8px">Observações</div>
        <div class="obs-box">${supporter.observacao}</div>
      ` : ""}

      <div class="signature-area">
        <div class="sig-block"><div class="sig-line">Responsável</div></div>
        <div class="sig-block"><div class="sig-line">Cadastrado</div></div>
      </div>
    </div>

    <div class="footer">
      <p>Documento gerado em ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • ${campanhaNome || "CampanhaGov"} • ${fichaId}</p>
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
