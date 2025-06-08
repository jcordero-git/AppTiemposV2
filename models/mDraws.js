class mDraws {
  constructor(drawData) {
    this.id = drawData.id;
    this.idUser = drawData.idUser;
    this.name = drawData.name;
    this.values = drawData.values;
    this.consolidated = drawData.consolidated;
    this.date = drawData.date;
    this.price = drawData.price;
    this.priceNumber = drawData.priceNumber;
    this.consolidatedDate = drawData.consolidatedDate;
    this.idDrawCategory = drawData.idDrawCategory;
    this.sellerPercent = drawData.sellerPercent;
    this.prizeTimes = drawData.prizeTimes;
    this.revValues = drawData.revValues;
    this.isPrizeRev = drawData.isPrizeRev;
    this.revSellerPercent = drawData.revSellerPercent;
    this.revPrizeTimes = drawData.revPrizeTimes;
    this.revPrice = drawData.revPrice ?? 0;
  }

  getTotalDraw() {
    let total = 0;
    const amounts = (this.values || "").split(",");

    for (let i = 0; i < amounts.length; i++) {
      const val = parseInt(amounts[i]);
      if (!isNaN(val)) {
        if (this.priceNumber === i) {
          this.price = val * (this.prizeTimes || 1);
        }
        total += val;
      }
    }

    return total;
  }

  getTotalRevDraw() {
    let toReturn = 0;
    if (!this.revValues) return 0;
    const revAmounts = this.revValues.split(",");
    for (let i = 0; i < revAmounts.length; i++) {
      const value = parseInt(revAmounts[i], 10);
      if (this.priceNumber === i) {
        if (this.revValues && this.isPrizeRev) {
          this.revPrice = value * this.revPrizeTimes;
        }
      }
      if (this.revValues) {
        toReturn += value;
      }
    }
    return toReturn;
  }
}

export default mDraws;
