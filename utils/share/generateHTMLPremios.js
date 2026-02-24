import {
  getInternetDate,
  formatDate,
  formatHour,
  formatHour_custom,
} from "../datetimeUtils"; // ajusta el path si es necesario

export const generateHTMLPremios = async (
  items,
  total,
  sorteoSeleccionado,
  vendedorData,
  ticketProfile,
  numeroPremiado,
  reventado,
  fecha,
) => {
  const vendedorNombre =
    ticketProfile.sellerName?.trim() !== ""
      ? ticketProfile.sellerName
      : vendedorData.name || "";

  const telefono =
    ticketProfile.phoneNumber?.trim() !== ""
      ? ticketProfile.phoneNumber
      : vendedorData.phone || "N/A";

  const prizeTimes =
    sorteoSeleccionado.userValues?.prizeTimes ?? vendedorData.prizeTimes ?? 0;

  const revPrizeTimes =
    sorteoSeleccionado.userValues?.revPrizeTimes ??
    vendedorData.revPrizeTimes ??
    0;

  const padRight = (text, length) => text.toString().padEnd(length, " ");

  const padLeft = (text, length) => text.toString().padStart(length, " ");

  const alignLeftRight = (left, right, width = 32) => {
    const space = width - left.length - right.length;
    return left + " ".repeat(Math.max(space, 1)) + right;
  };

  const renderItems = () =>
    items
      .map(
        (item) => `
        <div class="item">
  
          <div class="row">
            <div class="label">Codigo</div>
            <div class="center">: #${item.id}</div>
            <div class="right"></div>
          </div>
  
          <div class="row">
            <div class="label">Hora</div>
            <div class="center">
              : ${formatHour_custom(new Date(item.createdAt), "hh:mm:ss a")}
            </div>
            <div class="right"></div>
          </div>
  
          <div class="row">
            <div class="label">Cliente</div>
            <div class="center">
              : ${item.clientName || "Sin Nombre"}
            </div>
            <div class="right"></div>
          </div>
  
          <div class="row">
            <div class="label">Premio</div>
            <div class="center">
              : ${item.monto} x ${item.prizeTimes}
            </div>
            <div class="right">
              ${item.premio}
            </div>
          </div>
  
          ${
            item.montoReventado > 0
              ? `
              <div class="row">
                <div class="label">Rev</div>
                <div class="center">
                  : ${item.montoReventado} x ${item.revPrizeTimes}
                </div>
                <div class="right">
                  ${item.revPremio}
                </div>
              </div>
            `
              : ""
          }
  
          <div class="row bold">
            <div class="label">TOTAL</div>
            <div class="center">:</div>
            <div class="right">
              ${item.premio + item.revPremio}
            </div>
          </div>
  
          <div class="divider"></div>
        </div>
      `,
      )
      .join("");

  return `
  <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
       
      <style>
         @media print {
            @page {
                  size: 58mm auto;
                  margin: 0;
                }
          }
          html, body {
            width: 58mm;
            margin: 0;
            padding: 0;
            text-align: center;
          }

          h2, h3, h4 {
            margin: 2px 0;
          }

      .ticket {
  font-family: monospace;
  line-height: 1;
}

.item {
  margin-bottom: 6px;
  line-height: 1;  
}

.bold{
    font-weight: bold;
}

.row {
  display: grid;
  grid-template-columns: 25% 3% 72%;
  column-gap: 0px;
  white-space: nowrap;
  margin: 0px 4px;
}

.label {
  text-align: left;
}

.center {
  text-align: left; /* el truco: NO centrar real, solo visual */
}

.right {
  text-align: right;
}

.divider {
  border-top: 2px dashed #000;
  margin: 6px 0;
}
.dividerInvisible {
            border-top: 1px dashed rgba(19, 18, 18, 0.50);
            margin: 6px 0;
          }


      </style>
    </head>
    <body style="line-height: 0.8;">

    <div class="ticket">

<div class="dividerInvisible" style="height: 2px;  margin-bottom: 2px;"></div>
<h3 style="width: 100%; font-family:  monospace; font-size:22px; margin-top: 4px; text-align: center;" >PREMIOS</h3>
<h3 style="width: 100%; font-family:  monospace; font-size:22px; margin-top: 4px; text-align: center;" >${sorteoSeleccionado.name}</h3>
<table style="width: 100%; line-height: 0.8; font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 4px;">
          <tr>
            <td style="text-align: left;">FECHA:</td>
            <td style="text-align: right;">${formatHour_custom(fecha, "E dd/MM/yyy")}</td>
          </tr>
  </table>

 <table style="width: 100%; line-height: 0.8; font-family: monospace; font-size: 20px; font-weight: bold; margin-top: 4px;">
          <tr>
            <td style="text-align: left;">PREMIADO:</td>
            <td style="text-align: right;">#${numeroPremiado}</td>
          </tr>
  </table>

 <div class="divider"></div>
${renderItems()}

  <table style="width: 100%; line-height: 0.5; font-family: monospace; font-size: 20px; font-weight: bold; margin-top: 10px;">
          <tr>
            <td style="text-align: left;">TOTAL</td>
            <td style="text-align: right;">${total}</td>
          </tr>
  </table>

   <div class="divider"></div>

   <div class="dividerInvisible" style="height: 2px;  margin-top: 40px;"></div>

   </div>

    </body>
  </html>
  `;
};
