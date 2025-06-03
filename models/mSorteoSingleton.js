// mSorteoSingleton.js

/** @type {mSorteo} */
const mSorteoSingleton = {
  id: 0,
  name: "",
  limitTime: "",
  sellerPercent: 0,
  revPrizeTimes: null,
  idDrawCategory: 0,
  useReventado: false,
  restringidos: [], // <--- Aquí se carga la data de restringidos
};

export default mSorteoSingleton;
