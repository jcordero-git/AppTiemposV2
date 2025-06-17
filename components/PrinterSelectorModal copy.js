// components/SorteoSelectorModal.js

import React, { useEffect, useState, useContext } from "react";
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
import { useAuth } from "../context/AuthContext";
import { mSorteo } from "../models/mSorteo";
import PrinterUtils from "../utils/print/printerUtils";

export default function PrinterSelectorModal({ visible, onClose, onSelect }) {
  const { userData } = useAuth();
  const [printerItems, setPrinterItems] = useState([]);

  useEffect(() => {
    if (Platform.OS !== "web" && visible) {
      loadPrinters();
    }
  }, [visible]);

  const loadPrinters = async () => {
    try {
      const devices = await PrinterUtils.getDeviceList();
      console.log("DEVICES PRINT: ", devices);
      setPrinterItems(devices);
    } catch (err) {
      console.error("Error obteniendo impresoras:", err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <Text style={styles.title}>IMPRESORAS DISPONIBLES</Text>
          <FlatList
            data={printerItems}
            keyExtractor={(item) => item.inner_mac_address}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text>{item.device_name}</Text>
                <Text style={{ fontSize: 12, color: "#777" }}>
                  {item.inner_mac_address}
                </Text>
              </TouchableOpacity>
            )}
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
  closeButton: {
    marginTop: 15,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
});
