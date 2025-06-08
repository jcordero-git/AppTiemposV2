// TiempoContext.js
import React, { createContext, useContext, useState } from "react";

const mTiempoContext = createContext();

export const TiempoProvider = ({ children }) => {
  const [tiempo, setTiempo] = useState({
    ticketNumber: 0,
    userId: 0,
    drawCategoryId: 0,
    drawDate: null,
    printDate: null,
    clientName: "",
    numbers: [],
    isPaid: null,
    status: null,
    queueStatus: "",
  });

  const setClientName = (clientName) => {
    setTiempo((prev) => ({ ...prev, clientName: clientName }));
  };

  const resetTiempo = () => {
    setTiempo({
      ticketNumber: 0,
      userId: 0,
      drawCategoryId: 0,
      drawDate: null,
      printDate: null,
      clientName: "",
      numbers: [],
      isPaid: null,
      status: null,
      queueStatus: "",
    });
  };

  return (
    <mTiempoContext.Provider
      value={{ tiempo, setTiempo, resetTiempo, setClientName }}
    >
      {children}
    </mTiempoContext.Provider>
  );
};

// Hook para acceder fácilmente
export const useTiempo = () => useContext(mTiempoContext);
