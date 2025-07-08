// context/SnackbarContext.js
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
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
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(null);
  const { width } = useWindowDimensions();
  const isWeb = width > 710;

  const showSnackbar = (msg, type = 1, duration = 2000) => {
    setQueue((q) => [...q, { msg, type, duration }]);
  };

  // Maneja el siguiente snackbar si no hay visible y hay en cola
  useEffect(() => {
    if (!visible && !current && queue.length > 0) {
      const next = queue[0];
      setCurrent(next);
      setQueue((q) => q.slice(1));
      setVisible(true);

      timerRef.current = window.setTimeout(() => {
        setVisible(false);
        setCurrent(null);
      }, next.duration);
    }
  }, [queue, visible, current]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showConfirm = ({ message, onConfirm }) => {
    setConfirmMessage(message);
    setOnConfirm(() => onConfirm);
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
        onDismiss={() => {
          setVisible(false);
          setCurrent(null);
        }}
        duration={current?.duration || 3000}
        style={{ backgroundColor: typeColors[current?.type] || typeColors[1] }}
      >
        {current?.msg}
      </Snackbar>

      <Portal>
        <Dialog
          visible={confirmVisible}
          onDismiss={() => {}}
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
          <Dialog.Title style={{ color: "black" }}>Confirmación</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: "black" }}>{confirmMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="red"
              style={{
                backgroundColor: "white",
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
                backgroundColor: "white",
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
