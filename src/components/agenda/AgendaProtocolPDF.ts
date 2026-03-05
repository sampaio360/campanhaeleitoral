import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProtocolEvent {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  cidade: string | null;
  bairro: string | null;
  status: string;
  prioridade: string;
  notas: string | null;
}

interface ProtocolOptions {
  event: ProtocolEvent;
  campanhaNome?: string;
  campanhaPartido?: string;
  responsavelNome?: string;
  tipoLabel?: string;
  statusLabel?: string;
  prioridadeLabel?: string;
}

const TIPO_EMOJI: Record<string, string> = {
  comicio: "📢", reuniao: "👥", debate: "🎤", carreata: "🚗",
  corpo_a_corpo: "🤝", visita_institucional: "🏛️", evento_partidario: "🎉",
  panfletagem: "📄", inauguracao: "🏁", entrevista: "📺",
  cafe_com_liderancas: "☕", outro: "📌",
};

export function generateAgendaProtocol(opts: ProtocolOptions) {
  const { event, campanhaNome, campanhaPartido, responsavelNome, tipoLabel, statusLabel, prioridadeLabel } = opts;
  const start = parseISO(event.data_inicio);
  const protocolNumber = `AGD-${format(start, "yyyyMMdd")}-${event.id.substring(0, 6).toUpperCase()}`;
  const emoji = TIPO_EMOJI[event.tipo] || "📌";
  const location = [event.local, event.bairro, event.cidade].filter(Boolean).join(", ");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Protocolo ${protocolNumber}</title>
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
      padding: 0;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
      position: relative;
    }

    .header {
      background: linear-gradient(135deg, #0d7377 0%, #14919b 50%, #0d7377 100%);
      color: white;
      padding: 40px 48px 32px;
      position: relative;
      overflow: hidden;
    }

    .header::after {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 400px;
      height: 400px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .header-logo h1 {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .header-logo p {
      font-size: 13px;
      opacity: 0.85;
      margin-top: 2px;
    }

    .protocol-badge {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 8px;
      padding: 10px 16px;
      text-align: right;
    }

    .protocol-badge .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      opacity: 0.8;
    }

    .protocol-badge .number {
      font-size: 16px;
      font-weight: 700;
      margin-top: 2px;
      font-family: monospace;
    }

    .title-section {
      position: relative;
      z-index: 1;
    }

    .title-section .emoji {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .title-section h2 {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.5px;
    }

    .title-section .tipo-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }

    .content {
      padding: 40px 48px;
    }

    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #0d7377;
      font-weight: 700;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 36px;
    }

    .info-item {
      background: #f8fafc;
      border-radius: 10px;
      padding: 16px 20px;
      border: 1px solid #e2e8f0;
    }

    .info-item.full {
      grid-column: 1 / -1;
    }

    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }

    .info-value.highlight {
      color: #0d7377;
      font-size: 17px;
    }

    .description-box {
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 36px;
    }

    .description-box p {
      font-size: 14px;
      line-height: 1.7;
      color: #334155;
    }

    .notes-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 36px;
    }

    .notes-box .notes-title {
      font-size: 12px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 8px;
    }

    .notes-box p {
      font-size: 13px;
      line-height: 1.6;
      color: #78350f;
      font-style: italic;
    }

    .status-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 36px;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-confirmado { background: #dcfce7; color: #166534; }
    .status-pendente { background: #fef9c3; color: #854d0e; }
    .status-cancelado { background: #fee2e2; color: #991b1b; }
    .status-realizado { background: #dbeafe; color: #1e40af; }

    .prioridade-alta { background: #fee2e2; color: #991b1b; }
    .prioridade-normal { background: #f1f5f9; color: #475569; }
    .prioridade-baixa { background: #f0fdfa; color: #0d7377; }

    .signature-section {
      margin-top: 60px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
    }

    .signature-line {
      text-align: center;
    }

    .signature-line .line {
      border-top: 1px solid #cbd5e1;
      margin-bottom: 8px;
      margin-top: 48px;
    }

    .signature-line .name {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }

    .signature-line .role {
      font-size: 11px;
      color: #64748b;
    }

    .footer {
      margin-top: 48px;
      padding: 24px 48px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }

    .footer p {
      font-size: 10px;
      color: #94a3b8;
      letter-spacing: 0.5px;
    }

    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <div class="header-logo">
          <h1>${campanhaNome || "Campanha Eleitoral"}</h1>
          <p>${campanhaPartido ? campanhaPartido + " — " : ""}Protocolo de Compromisso</p>
        </div>
        <div class="protocol-badge">
          <div class="label">Nº Protocolo</div>
          <div class="number">${protocolNumber}</div>
        </div>
      </div>
      <div class="title-section">
        <div class="emoji">${emoji}</div>
        <h2>${event.titulo}</h2>
        <span class="tipo-badge">${tipoLabel || event.tipo}</span>
      </div>
    </div>

    <div class="content">
      <div class="status-bar">
        <span class="status-chip status-${event.status}">● ${statusLabel || event.status}</span>
        <span class="status-chip prioridade-${event.prioridade}">Prioridade: ${prioridadeLabel || event.prioridade}</span>
      </div>

      <div class="section-title">Dados do Compromisso</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">📅 Data e Horário</div>
          <div class="info-value highlight">${format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
          <div class="info-value" style="font-size:13px; margin-top:4px; color:#64748b">${format(start, "HH:mm", { locale: ptBR })}h</div>
        </div>
        <div class="info-item">
          <div class="info-label">👤 Responsável</div>
          <div class="info-value">${responsavelNome || "Não definido"}</div>
        </div>
        ${location ? `
        <div class="info-item full">
          <div class="info-label">📍 Local</div>
          <div class="info-value">${location}</div>
        </div>` : ""}
      </div>

      ${event.descricao ? `
      <div class="section-title">Descrição</div>
      <div class="description-box">
        <p>${event.descricao.replace(/\n/g, "<br/>")}</p>
      </div>` : ""}

      ${event.notas ? `
      <div class="section-title">Observações</div>
      <div class="notes-box">
        <div class="notes-title">📝 Notas</div>
        <p>${event.notas.replace(/\n/g, "<br/>")}</p>
      </div>` : ""}

      <div class="section-title">Assinaturas</div>
      <div class="signature-section">
        <div class="signature-line">
          <div class="line"></div>
          <div class="name">${responsavelNome || "Responsável"}</div>
          <div class="role">Responsável pelo compromisso</div>
        </div>
        <div class="signature-line">
          <div class="line"></div>
          <div class="name">Coordenação</div>
          <div class="role">Coordenação de Campanha</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Documento gerado automaticamente em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • ${campanhaNome || "CampanhaGov"} • Protocolo ${protocolNumber}</p>
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
