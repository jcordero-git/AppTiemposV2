// context/SnackbarContext.js
import React, { createContext, useContext, useState } from "react";
import { Snackbar } from "react-native-paper";

const SnackbarContext = createContext();

export const useSnackbar = () => useContext(SnackbarContext);

const typeColors = {
  1: "#4CAF50", // Success - verde
  2: "#FFC107", // Warning - amarillo
  3: "#F44336", // Error - rojo
};

export const SnackbarProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState(3000);
  const [type, setType] = useState(1); // Por defecto success

  const showSnackbar = (msg, typeValue = 1, time = 3000) => {
    setMessage(msg);
    setType(typeValue);
    setDuration(time);
    setVisible(true);
  };

  const hideSnackbar = () => setVisible(false);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideSnackbar}
        duration={duration}
        style={{ backgroundColor: typeColors[type] || typeColors[1] }}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
