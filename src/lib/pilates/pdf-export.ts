// PDF Export helper — gera HTML para impressão/PDF
// Usa window.open + window.print() para compatibilidade máxima
// jsPDF (v4) disponível mas window.print é mais confiável para dados de saúde/formulários longos

export const PRINT_CSS = `
  @media print {
    body { background: white !important; color: black !important; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    a { text-decoration: none; color: black; }
    @page { margin: 20mm; }
  }
  .print-only { display: none; }
`

export interface PrintSection {
  title: string
  rows: { label: string; value: string | null | undefined }[]
}

/**
 * Abre uma janela de impressão com o conteúdo formatado.
 * Inclui cabeçalho Daimach.Movement e logo.
 */
export function printDocument(options: {
  title: string
  subtitle?: string
  sections: PrintSection[]
  footer?: string
}) {
  const { title, subtitle, sections, footer } = options

  const sectionsHtml = sections
    .map(
      (s) => `
    <div style="margin-bottom: 24px; break-inside: avoid;">
      <h3 style="font-size: 13px; font-weight: bold; color: #1a7a4a; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">
        ${s.title}
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${s.rows
          .filter((r) => r.value !== null && r.value !== undefined && r.value !== '')
          .map(
            (r) => `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 5px 8px 5px 0; font-size: 11px; color: #6b7280; width: 40%; font-weight: 500; vertical-align: top;">
              ${r.label}
            </td>
            <td style="padding: 5px 0; font-size: 12px; color: #111827; vertical-align: top;">
              ${r.value || '—'}
            </td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
  `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} — Daimach.Movement</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111827; background: white; padding: 0; }
        @page { margin: 20mm; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <!-- Cabeçalho -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1a7a4a; padding-bottom: 12px; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 18px; font-weight: bold; color: #1a7a4a;">Daimach.Movement</h1>
          <p style="font-size: 10px; color: #6b7280;">Studio de Pilates & Fisioterapia</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 15px; font-weight: bold; color: #111827;">${title}</h2>
          ${subtitle ? `<p style="font-size: 11px; color: #6b7280;">${subtitle}</p>` : ''}
          <p style="font-size: 10px; color: #9ca3af; margin-top: 2px;">
            Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <!-- Conteúdo -->
      ${sectionsHtml}

      <!-- Rodapé -->
      ${
        footer
          ? `<div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center;">
          ${footer}
        </div>`
          : ''
      }

      <script>
        window.onload = function() {
          window.print();
          // Fechar após imprimir (opcional)
          window.onfocus = function() { window.close(); };
        }
      </script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=800,height=900')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
