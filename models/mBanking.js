class mBanking {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.referenceNumber = data.referenceNumber;
    this.date = new Date(data.date);
    this.amount = data.amount;
    this.description = data.description;
    this.registeredBy = data.registeredBy;
    this.isDeleted = data.isDeleted;
    this.cancelDebt = data.cancelDebt;
    this.modified = new Date(data.modified);
  }

  // Ejemplo de método adicional útil
  isValidAmount() {
    return typeof this.amount === "number" && this.amount > 0;
  }

  toFormattedString() {
    return `${this.date.toLocaleDateString()} - ${this.referenceNumber} - $${this.amount}`;
  }
}

export default mBanking;
