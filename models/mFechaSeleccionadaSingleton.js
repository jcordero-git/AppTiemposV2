// FechaSeleccionada.js

/**
 * @typedef {Object} mFechaSeleccionadaSingleton
 * @property {Date} selectedDate
 */

class FechaSeleccionada {
  /** @type {Date} */
  selectedDate = new Date();

  /** @returns {Date} */
  getFecha() {
    return this.selectedDate;
  }

  /** @param {Date} nuevaFecha */
  setFecha(nuevaFecha) {
    this.selectedDate = nuevaFecha;
  }

  /** Resetea a la fecha actual */
  resetFecha() {
    this.selectedDate = new Date();
  }
}

// Exporta una sola instancia
const fechaSeleccionadaInstance = new FechaSeleccionada();
export default fechaSeleccionadaInstance;
