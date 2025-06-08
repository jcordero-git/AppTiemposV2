export function getTotalDraw(values, getPriceNumber, getPrizeTimes, setPrice) {
  let toReturn = 0;
  const amounts = values.split(",");

  for (let i = 0; i < amounts.length; i++) {
    const parsed = parseInt(amounts[i]);

    if (getPriceNumber() === i) {
      setPrice(parsed * getPrizeTimes());
    }

    toReturn += parsed;
  }

  return toReturn;
}
