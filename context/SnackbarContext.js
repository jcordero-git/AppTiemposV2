// context/SnackbarContext.js
import React, { createContext, useContext, useState } from "react";
import { useWindowDimensions } from "react-native";
import { Snackbar, Dialog, Portal, Button, Text } from "react-native-paper";

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

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(null);
  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;

  const showSnackbar = (msg, typeValue = 1, time = 3000) => {
    setMessage(msg);
    setType(typeValue);
    setDuration(time);
    setVisible(true);
  };

  const hideSnackbar = () => setVisible(false);

  const showConfirm = ({ message, onConfirm }) => {
    setConfirmMessage(message);
    setOnConfirm(() => onConfirm); // guardar callback
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    setConfirmVisible(false);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, showConfirm }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideSnackbar}
        duration={duration}
        style={{ backgroundColor: typeColors[type] || typeColors[1] }}
      >
        {message}
      </Snackbar>

      <Portal>
        <Dialog
          visible={confirmVisible}
          onDismiss={() => {}} // Evita cerrar al tocar fuera
          style={[
            {
              backgroundColor: "white",
              borderRadius: 10,
              marginHorizontal: 20,
              maxHeight: "95%",
            },
            isWeb && {
              position: "absolute",
              right: 0,
              top: 74,
              width: 400,
              maxHeight: "100%",
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
          ]}
        >
          <Dialog.Title style={[{ color: "black" }]}>Confirmación</Dialog.Title>
          <Dialog.Content>
            <Text style={[{ color: "black" }]}>{confirmMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="red"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={handleCancel}
            >
              CANCELAR
            </Button>
            <Button
              textColor="green"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={handleConfirm}
            >
              ACEPTAR
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SnackbarContext.Provider>
  );
};
