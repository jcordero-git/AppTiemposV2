// TiempoContext.js
import React, { createContext, useContext, useState } from "react";

const mTiempoContext = createContext();

export const TiempoProvider = ({ children }) => {
  const [tiempo, setTiempo] = useState({
    sorteoId: null,
    fecha: null,
    nombreCliente: "",
    montoNumeros: [],
  });

  const setNombreCliente = (nombre) => {
    setTiempo((prev) => ({ ...prev, nombreCliente: nombre }));
  };

  const resetTiempo = () => {
    setTiempo({
      sorteoId: null,
      fecha: null,
      nombreCliente: "",
      montoNumeros: [],
    });
  };

  return (
    <mTiempoContext.Provider
      value={{ tiempo, setTiempo, resetTiempo, setNombreCliente }}
    >
      {children}
    </mTiempoContext.Provider>
  );
};

// Hook para acceder fácilmente
export const useTiempo = () => useContext(mTiempoContext);
