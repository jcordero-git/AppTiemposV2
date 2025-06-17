import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import PrinterUtils from "../utils/print/printerUtils";

export default function PrinterSelectorModal({ visible, onClose, onSelect }) {
  const [printerItems, setPrinterItems] = useState([]);
  const scanningRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "web" && visible) {
      startScan();
    } else {
      stopScan();
      setPrinterItems([]);
    }
    return () => {
      stopScan();
    };
  }, [visible]);

  const startScan = async () => {
    if (scanningRef.current) return; // evitar escaneo múltiple
    scanningRef.current = true;
    setPrinterItems([]);

    try {
      await PrinterUtils.requestPermissions();

      // Escanea y agrega dispositivos según se detecten
      PrinterUtils.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error("Error escaneando:", error);
          scanningRef.current = false;
          return;
        }
        if (device?.name) {
          setPrinterItems((prev) => {
            // Evitar duplicados
            if (prev.find((d) => d.id === device.id)) return prev;
            return [...prev, device];
          });
        }
      });

      // Detener escaneo tras 10 segundos
      window.setTimeout(() => {
        stopScan();
      }, 10000);
    } catch (err) {
      console.error("Permisos denegados o error:", err);
      scanningRef.current = false;
    }
  };

  const stopScan = () => {
    if (scanningRef.current) {
      PrinterUtils.manager.stopDeviceScan();
      scanningRef.current = false;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        stopScan();
        onClose();
      }}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => {
          stopScan();
          onClose();
        }}
      >
        <Pressable style={styles.modal} onPress={() => {}}>
          <Text style={styles.title}>IMPRESORAS DISPONIBLES</Text>
          <FlatList
            data={printerItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  stopScan();
                  onSelect(item);
                  onClose();
                }}
              >
                <Text>{item.name || "Impresora sin nombre"}</Text>
                <Text style={{ fontSize: 12, color: "#777" }}>{item.id}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                {scanningRef.current
                  ? "Escaneando..."
                  : "No se encontraron impresoras"}
              </Text>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 10,
    padding: 20,
    maxHeight: "70%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  item: {
    paddingVertical: 13,
    borderBottomWidth: 0,
    borderBottomColor: "#ccc",
  },
});
