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
  useWindowDimensions,
  Alert,
} from "react-native";
import PrinterUtils from "../utils/print/printerUtils";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

export default function PrinterSelectorModal({ visible, onClose, onSelect }) {
  const [printerItems, setPrinterItems] = useState([]);
  const scanningRef = useRef(false);
  const { showSnackbar, showConfirm } = useSnackbar();
  const { width, height } = useWindowDimensions();

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

  // const startScan = async () => {
  //   if (scanningRef.current) return; // evitar escaneo múltiple
  //   scanningRef.current = true;
  //   setPrinterItems([]);

  //   try {
  //     await PrinterUtils.requestBluetoothPermissions();

  //     // Escanea y agrega dispositivos según se detecten
  //     PrinterUtils.manager.startDeviceScan(null, null, (error, device) => {
  //       if (error) {
  //         console.error("Error escaneando:", error);
  //         scanningRef.current = false;
  //         return;
  //       }
  //       if (device?.name) {
  //         setPrinterItems((prev) => {
  //           // Evitar duplicados
  //           if (prev.find((d) => d.id === device.id)) return prev;
  //           return [...prev, device];
  //         });
  //       }
  //     });

  //     // Detener escaneo tras 10 segundos
  //     window.setTimeout(() => {
  //       stopScan();
  //     }, 10000);
  //   } catch (err) {
  //     console.error("Permisos denegados o error:", err);
  //     scanningRef.current = false;
  //   }
  // };

  const startScan = async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setPrinterItems([]);

    try {
      const permissionsOk = await PrinterUtils.requestBluetoothPermissions();
      if (!permissionsOk) {
        // Alert.alert(
        //   "Permisos requeridos",
        //   "Debes conceder permisos de Bluetooth y ubicación.",
        // );
        showSnackbar("Debes conceder permisos de Bluetooth y ubicación.", 2);
        scanningRef.current = false;
        return;
      }

      const locationOk = await PrinterUtils.ensureLocationEnabled();
      if (!locationOk) {
        scanningRef.current = false;
        onClose();
        return;
      }

      PrinterUtils.manager.startDeviceScan(
        [], // Filtro vacío: mejor compatibilidad en Huawei
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error("Error escaneando:", error);
            showSnackbar("Verifique que el Bluetooth está encendido.", 3);
            onClose();
            scanningRef.current = false;
            return;
          }
          if (device?.name) {
            setPrinterItems((prev) => {
              if (prev.find((d) => d.id === device.id)) return prev;
              return [...prev, device];
            });
          }
        },
      );

      // Detener escaneo después de 20 segundos
      window.setTimeout(() => {
        stopScan();
      }, 20000);
    } catch (err) {
      console.error("Error en escaneo:", err);
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
      style={{ maxHeight: height * 0.6 }}
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
