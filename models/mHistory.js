class mHistory {
  constructor(data) {
    this.id = data.id;
    this.isDraw = data.isDraw;
    this.description = data.description;
    this.date = new Date(data.date);
    this.amount = data.amount;
    this.comision = data.comision;
    this.price = data.price;
    this.priceNumber = data.priceNumber;
    this.subTotal = data.subTotal;
    this.acumulado = data.acumulado;
    this.cancelDebt = data.cancelDebt;
    this.sellerPercent = data.sellerPercent;
    this.isPrizeRev = data.isPrizeRev;
    this.revPrice = data.revPrice;
    this.revSellerPercent = data.revSellerPercent;
    this.revAmount = data.revAmount;
  }

  // Ejemplo de método útil: obtener un resumen en texto
  getSummary() {
    return `${this.date.toLocaleDateString()} | ${this.description} | $${this.amount}`;
  }

  // Ejemplo: ¿es premio reventado?
  isReventado() {
    return this.isPrizeRev === true;
  }

  // Ejemplo: total con comisión
  getTotal() {
    return this.amount + this.comision;
  }
}

export default mHistory;
