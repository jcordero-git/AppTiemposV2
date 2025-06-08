export function convertNumero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

export function validateMonto(monto) {
  return monto % 50 === 0;
}

export function toFloat(input) {
  const num = parseFloat(input);
  return isNaN(num) ? 0 : num;
}
