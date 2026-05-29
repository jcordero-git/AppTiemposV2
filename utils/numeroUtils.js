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

/**
 * Expande las reglas que tienen "ALL" en el campo de número hacia reglas individuales (00-99).
 * @param {Array} rules Lista de reglas.
 * @param {string} numberField Nombre del campo que contiene el número (por defecto 'number').
 * @returns {Array} Lista de reglas expandida.
 */
export function expandRestrictedRules(rules, numberField = "number") {
  if (!rules || !Array.isArray(rules)) return [];
  const expandedRules = [];
  rules.forEach((rule) => {
    if (rule[numberField] === "ALL") {
      for (let i = 0; i <= 99; i++) {
        expandedRules.push({
          ...rule,
          [numberField]: convertNumero(i),
        });
      }
    } else {
      expandedRules.push(rule);
    }
  });
  return expandedRules;
}
