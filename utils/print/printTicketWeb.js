import { getInternetDate, formatDate, formatHour } from "../datetimeUtils"; // ajusta el path si es necesario

export const printTicketWeb = (
  result,
  sorteoSeleccionado,
  vendedorData,
  ticketProfile,
) => {
  const { id: codigo, clientName, drawDate, createdAt, numbers = [] } = result;
  const {
    phoneNumber,
    printBarCode,
    printerSize,
    sellerName,
    ticketFooter,
    ticketTitle,
  } = ticketProfile;

  // Filtrar números normales y reventados (montoReventado según useReventado)
  const normalNumbers = numbers.filter((n) => parseFloat(n.monto) > 0);
  const reventados = numbers.filter((n) => parseFloat(n.montoReventado) > 0);

  // const formatDate = (dateStr, addOneDay = false) => {
  //   const date = new Date(dateStr);
  //   if (addOneDay) date.setDate(date.getDate() + 1);
  //   return date.toLocaleDateString("es-ES");
  // };

  // const formatTime = (dateStr) => {
  //   const date = new Date(dateStr);
  //   return date.toLocaleTimeString("en-US", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     hour12: true,
  //   });
  // };

  const formatBarcodeDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2); // Solo los últimos 2 dígitos
    return `${day}${month}${year}`;
  };

  // Total suma montos normales y reventados
  const total = numbers.reduce(
    (sum, n) => sum + parseInt(n.monto || 0) + parseInt(n.montoReventado || 0),
    0,
  );

  // Función para agrupar números por monto y renderizar líneas
  const renderLines = (list, useReventado = false) => {
    const grouped = {};
    list.forEach((n) => {
      const monto = useReventado
        ? parseInt(n.montoReventado)
        : parseInt(n.monto);
      if (!grouped[monto]) grouped[monto] = [];
      grouped[monto].push(n.numero);
    });

    const rows = [];
    Object.entries(grouped)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0])) // orden ascendente por monto
      .forEach(([monto, numeros]) => {
        for (let i = 0; i < numeros.length; i += 3) {
          const grupo = numeros.slice(i, i + 3);
          rows.push(`
          <tr>
            <td style="width: 60px; font-weight: bold;">${monto}</td>
            <td>* ${grupo.join("&nbsp;&nbsp;")}</td>
          </tr>
        `);
        }
      });

    return `
      <table style="width: 100%; font-family: 'Courier New', Courier, monospace; font-size: 16px; text-align: left; margin-top: 4px; margin-bottom: 6px;">
        ${rows.join("")}
      </table>
    `;
  };

  // Código para el barcode
  const barcodeValue = `${String(sorteoSeleccionado.id).padStart(3, "0")}-${formatBarcodeDate(drawDate)}-${codigo.toString().padStart(3, "0")}`;

  // Vendedor nombre y código concatenados
  const vendedorNombre =
    ticketProfile.sellerName?.trim() !== ""
      ? ticketProfile.sellerName
      : vendedorData.name || "";
  const vendedorCodigo = vendedorData.userCode || "";
  const telefono =
    ticketProfile.phoneNumber?.trim() !== ""
      ? ticketProfile.phoneNumber
      : vendedorData.phone || "N/A";

  // Porcentajes y valores desde sorteo o vendedor, según preferencia
  // Preferencia a sorteoSeleccionado.userValues si existe
  const prizeTimes =
    sorteoSeleccionado.userValues?.prizeTimes ?? vendedorData.prizeTimes ?? "";
  const sellerPercent =
    sorteoSeleccionado.userValues?.sellerPercent ??
    vendedorData.percentValue ??
    "";
  const revPrizeTimes =
    sorteoSeleccionado.userValues?.revPrizeTimes ??
    vendedorData.revPrizeTimes ??
    "";
  const revSellerPercent =
    sorteoSeleccionado.userValues?.revSellerPercent ??
    vendedorData.revPercentValue ??
    "";

  const htmlContent = `
    <html>
      <head>
        <title>Ticket</title>       
        <style>
          @media print {
            body { margin: 0; }
          }
          body {
            width: 58mm;
            font-family: "Courier New", Courier, monospace;
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
        <h3>CÓDIGO # ${String(codigo).padStart(2, "0")}</h3>
        <h3>${sorteoSeleccionado.name}</h3>

        <table style="text-align: left; font-family: 'Courier New', Courier, monospace; font-size: 14px; margin-top: 6px; width: 100%;">
        <tr>
          <td>VENDEDOR:</td>
          <td>${vendedorNombre} - ${vendedorCodigo}</td>
        </tr>
        <tr>
          <td>TEL.:</td>
          <td>${telefono || "N/A"}</td>
        </tr>
         <tr>
          <td>CLIENTE:</td>
          <td>${clientName || "Sin Nombre"}</td>
        </tr>
        <tr>
          <td>SORTEO:</td>
          <td>${formatDate(drawDate, "dd/MM/yyyy")}</td>
        </tr>
        <tr>
          <td>IMPRESIÓN:</td>
          <td>${formatDate(getInternetDate(), "dd/MM/yyyy HH:mm:ss")} </td>
        </tr>
      </table>

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
        <table style="width: 100%; font-family: 'Courier New', Courier, monospace; font-size: 14px; margin-top: 6px;">
        <tr>
          <td style="font-weight: bold; text-align: left;">TOTAL</td>
          <td style="font-weight: bold; text-align: right;">${total}</td>
        </tr>
      </table>
        <div class="divider"></div>

        <table style="width: 100%; font-family: 'Courier New', Courier, monospace; font-size: 14px; margin-top: 6px;">
        <tr>
          <td style="font-weight: bold; text-align: left;">PAGAMOS</td>
          <td style="font-weight: bold; text-align: right;">${prizeTimes}</td>
        </tr>
      </table>
      <table style="width: 100%; font-family: 'Courier New', Courier, monospace; font-size: 14px; margin-top: 6px;">
        <tr>
          <td style="font-weight: bold; text-align: left;">REVENTADO</td>
          <td style="font-weight: bold; text-align: right;">${revPrizeTimes}</td>
        </tr>
      </table>

      <h3>${ticketProfile.ticketTitle}</h3>


        <div style="margin: 6px 0;">
          ${ticketProfile.ticketFooter}
        </div>

        

        <script>
          let pingInterval;

          window.onload = function () {      
          
          
          pingInterval = setInterval(() => {
              if (window.opener) {
                window.opener.postMessage("PRINT_PING", "*");
              }
            }, 500);

            setTimeout(() => {
              window.print();

              window.onafterprint = function () {
                clearInterval(pingInterval);
                if (window.opener) {
                  window.opener.postMessage("PRINT_DONE", "*");
                }
                window.close();
              };

              window.onbeforeunload = function () {
                clearInterval(pingInterval);
                if (window.opener) {
                  window.opener.postMessage("PRINT_DONE", "*");
                }
              };
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  const tryPrint = () => {
    // Esperar que el documento esté completamente cargado
    const interval = window.setInterval(() => {
      if (printWindow.document.readyState === "complete") {
        window.clearInterval(interval);

        // Esperamos un poco más para que el render termine completamente
        window.setTimeout(() => {
          try {
            printWindow.focus(); // Necesario en algunos navegadores
            printWindow.print();
            printWindow.close();
          } catch (e) {
            console.error("Error al intentar imprimir:", e);
          }
        }, 500); // puedes ajustar este delay si es necesario
      }
    }, 100);
  };

  tryPrint();
};
