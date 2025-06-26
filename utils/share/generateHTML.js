import { getInternetDate, formatDate, formatHour } from "../datetimeUtils"; // ajusta el path si es necesario

export const generateHTML = async (
  result,
  sorteoSeleccionado,
  vendedorData,
  ticketProfile,
  re_impresion,
) => {
  const {
    id: codigo,
    clientName,
    drawDate,
    createdAt,
    updatedAt,
    numbers = [],
  } = result;
  const {
    phoneNumber,
    printBarCode,
    printerSize,
    sellerName,
    ticketFooter,
    ticketTitle,
  } = ticketProfile;

  const normalNumbers = numbers.filter((n) => parseFloat(n.monto) > 0);
  const reventados = numbers.filter((n) => parseFloat(n.montoReventado) > 0);

  const formatBarcodeDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2); // Solo los últimos 2 dígitos
    return `${day}${month}${year}`;
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
            <td style="width: 58px;">${monto}</td>
            <td>* ${grupo.join(",&nbsp;")}</td>
          </tr>
        `);
        }
      });

    return `
      <table style="line-height: 0.6; width: 100%; font-family: monospace; font-size: 20px; text-align: left; margin-top: 4px; margin-bottom: 6px;">
        ${rows.join("")}
      </table>
    `;
  };

  // Código para el barcode
  //const barcodeValue = `${String(sorteoSeleccionado.id).padStart(3, "0")}-${formatBarcodeDate(drawDate)}-${codigo.toString().padStart(3, "0")}`;
  const barcodeValue = `${codigo.toString().padStart(3, "0")}`;

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
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>        
        <style>
          @media print {
            @page {
                  size: 58mm auto;
                  margin: 0;
                }
            body { margin: 0; }
          }
          body {
            // width: 60mm;
            font-family: monospace;
            font-size: 12px;
            padding: 0px;
            margin: 0px;
            text-align: center;
            height: 100%;
            line-height: 0.8;
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
            border-top: 2px dashed #000;
            margin: 6px 0;
          }
          .dividerInvisible {
            border-top: 1px dashed rgba(19, 18, 18, 0.50);
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
      <body style="line-height: 0.8;">
       
       <div class="dividerInvisible" style="height: 2px;  margin-bottom: 2px;"></div>

        <h3 style="width: 100%; font-family:  monospace; font-size:22px; margin-top: 4px;" >CODIGO # ${String(codigo).padStart(2, "0")}</h3>
        <h3 style="width: 100%; font-family:  monospace; font-size: 22px; margin-top: 1px;" >${sorteoSeleccionado.name}</h3>

        <table style="line-height: 0.8; text-align: left; font-family: monospace; font-size: 12px; margin-top: 8px; width: 100%;">
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
          <td>${formatDate(new Date(), "dd/MM/yyyy hh:mm:a")} </td>
        </tr>
      </table>

        <div class="divider"></div>

        ${renderLines(normalNumbers)}

        ${
          reventados.length > 0
            ? `
          <div style="width: 100%; font-family: monospace; font-size: 16px; font-weight: bold; class="section-title">*******REVENTADOS*******</div>
          ${renderLines(reventados, true)}
        `
            : ""
        }
        <div  style="line-height: 0.5;">
        <div class="divider"></div>
        <table style="width: 100%; line-height: 0.5; font-family: monospace; font-size: 20px; font-weight: bold; margin-top: 10px;">
          <tr>
            <td style="text-align: left;">TOTAL</td>
            <td style="text-align: right;">${total}</td>
          </tr>
          </table>
        <div class="divider"></div>

        <table style="width: 100%; font-family:  monospace; font-size: 20px; margin-top: 0px;">
        <tr>
          <td style="text-align: left;">PAGAMOS</td>
          <td style="text-align: right;">${prizeTimes}</td>
        </tr>
      </table>
       ${
         sorteoSeleccionado.useReventado === true
           ? `
      <table style="width: 100%; font-family: monospace; font-size: 20px; margin-top: 2px;">
        <tr>
          <td style="text-align: left;">REVENTADO</td>
          <td style="text-align: right;">${revPrizeTimes}</td>
        </tr>
      </table>
      `
           : ""
       }   
       </div>

      <h3 style="width: 100%; font-family:  monospace; font-size: 18px; margin-top: 8px;">${ticketProfile.ticketTitle}</h3>

       ${
         re_impresion === true
           ? `
           <h3 style="width: 100%; font-family:  monospace; font-size: 24px; margin-top: 8px;">RE-IMPRESION</h3>
        `
           : ""
       }    


        <div style="width: 100%; font-family:  monospace; font-size: 14px; margin-top: 8px;">
          ${ticketProfile.ticketFooter}
        </div>

        ${
          printBarCode === true
            ? `
           <div style="height: 40px;  margin-top: 6px; width: 100%;">
            <div style="text-align:center; margin-top: 10px; width: 100%;">
            <svg id="barcode"></svg>
          </div>
           </div>
        `
            : ""
        }      

        <div class="dividerInvisible" style="height: 2px;  margin-top: 40px;"></div>
    
        <script>
          document.addEventListener("DOMContentLoaded", function () {
            JsBarcode("#barcode", "${barcodeValue}", {
              format: "CODE128",
              lineColor: "#000",
              width: 3,
              height: 30,
              displayValue: false,
              fontSize: 14,
              margin: 0,
            });
          });
        </script>

      </body>
    </html>
  `;

  return htmlContent;
};
