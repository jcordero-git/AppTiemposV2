export function convertNumero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

export function validateMonto(monto) {
  return monto % 50 === 0;
}
