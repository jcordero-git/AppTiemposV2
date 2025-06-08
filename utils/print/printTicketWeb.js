export const printTicketWeb = (result) => {
  const { ticketNumber, drawDate, createdAt, numbers = [] } = result;

  const normalNumbers = numbers.filter((n) => parseFloat(n.monto) > 0);
  const reventados = numbers.filter((n) => parseFloat(n.montoReventado) > 0);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CR");
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const total = numbers.reduce(
    (sum, n) => sum + parseInt(n.monto || 0) + parseInt(n.montoReventado || 0),
    0,
  );

  const renderLines = (list, useReventado = false) => {
    const grouped = {};

    list.forEach((n) => {
      const monto = useReventado
        ? parseInt(n.montoReventado)
        : parseInt(n.monto);
      if (!grouped[monto]) {
        grouped[monto] = [];
      }
      grouped[monto].push(n.numero);
    });

    const lines = [];

    Object.entries(grouped).forEach(([monto, numeros]) => {
      for (let i = 0; i < numeros.length; i += 3) {
        const grupo = numeros.slice(i, i + 3);
        lines.push(`
          <div class="line">
            <div class="amount">${monto} *</div>
            <div class="numbers">${grupo.join("&nbsp;&nbsp;")}</div>
          </div>
        `);
      }
    });

    return lines.join("");
  };

  const barcodeValue = `068-050625-${ticketNumber.toString().padStart(2, "0")}`;

  const htmlContent = `
      <html>
        <head>
          <title>Ticket</title>
          <style>
            @media print {
              body {
                margin: 0;
              }
            }
            body {
              width: 58mm;
              font-family: monospace;
              font-size: 12px;
              padding: 5px;
              text-align: center;
            }
            h2, h3, h4 {
              margin: 2px 0;
            }
            .line {
                display: flex;
                justify-content: flex-start;
                font-size: 16px;
                margin: 2px 0;
                }
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .section-title {
              font-weight: bold;
              margin: 5px 0;
            }
            .barcode {
              margin-top: 8px;
              font-size: 18px;
              letter-spacing: 2px;
            }
              .amount {
            min-width: 60px;
            text-align: left;
            font-weight: bold;
            }

            .numbers {
            text-align: left;
            }
          </style>
        </head>
        <body>
          <h3>TIEMPO # ${String(ticketNumber).padStart(2, "0")}</h3>
          <h4>*NO USAR 2*</h4>
  
          <div style="text-align: left; margin-top: 6px;">
            VENDEDOR: Jose 1 - JC-01<br/>
            TEL.: 0<br/>
            SORTEO: ${formatDate(drawDate)}<br/>
            IMPRESIÓN: ${formatDate(createdAt)} ${formatTime(createdAt)}
          </div>
  
          <div class="divider"></div>
  
          ${renderLines(normalNumbers)}
  
          ${
            reventados.length > 0
              ? `
            <div class="section-title">****REVENTADOS****</div>
            ${renderLines(reventados, true)}
          `
              : ""
          }
  
          <div class="divider"></div>
          <div class="section-title">TOTAL ${total}</div>
          <div class="divider"></div>
  
          <div class="section-title">PAGAMOS A 80</div>
          <div class="section-title">REVENTADO A 200</div>
  
          <div style="margin: 6px 0;">
            Test<br/>
            Revise su boleta<br/>
            Gracias y Suerte!<br/>
            3 días para cambiar su premio<br/>
            No se aceptan reclamos<br/>
            Sinpe móvil 7223-9298
          </div>
  
          <div class="barcode">||| || |||||| | ||| | || ||||</div>
          <div style="font-size: 14px; margin-top: 4px;">${barcodeValue}</div>
  
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
