// components/SorteoSelectorModal.js

import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  Menu,
  Divider,
  Provider,
  Portal,
  Dialog,
  Button,
  Snackbar,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import mSorteo from "../models/mSorteoSingleton.js";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import SorteoSelectorModal from "../components/SorteoSelectorModal";

export default function PreCargarModal({ visible, onClose, onSelect }) {
  //const { userData } = useAuth();
  //const [sorteoItems, setSorteoItems] = useState([]);
  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;
  const [modalVisible, setModalVisible] = useState(false);
  const [sorteoNombre, setSorteoNombre] = useState("");
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [sorteoId, setSorteoId] = useState(null);

  useEffect(() => {
    if (visible) {
      setSorteoNombre("");
      setSorteoId(0);
      setCodigo("");
      Object.assign(mSorteo, {});
    }
  }, [visible]);

  const cargaSorteoSeleccionado = async () => {
    Object.assign(mSorteo, mSorteo); // ✅ Copia las propiedades sin reemplazar el objeto
    setSorteoNombre(mSorteo.name);
    setSorteoId(mSorteo.id);
  };

  useEffect(() => {
    (async () => {
      if (mSorteo.id !== 0) {
        setSorteoSeleccionado(mSorteo);
        await cargaSorteoSeleccionado();
      }
    })();
  }, [sorteoId]); // <--- agregá las dependencias acá

  const formatCodigo = (text) => {
    // Eliminar todo lo que no sea letra o número
    const cleaned = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    // Aplicar el formato: XXX-XXXXXX-XXX
    const part1 = cleaned.slice(0, 3);
    const part2 = cleaned.slice(3, 9);
    const part3 = cleaned.slice(9, 12);

    let formatted = part1;
    if (part2) formatted += "-" + part2;
    if (part3) formatted += "-" + part3;

    return formatted;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[
          {
            backgroundColor: "white", // Fondo blanco
            borderRadius: 10, // Bordes redondeados
            marginHorizontal: 20, // Margen lateral
          },
          isWeb && {
            position: "absolute",
            right: 0,
            top: 74,
            width: 400,
            maxHeight: "90%",
            elevation: 4, // sombra en Android
            shadowColor: "#000", // sombra en iOS
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          },
        ]}
      >
        <Dialog.Content>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between", // <-- importante
              marginBottom: 10,
            }}
          >
            <MaterialIcons name="qr-code" size={35} color="#000" />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: "bold",
                color: "#000",
                fontSize: 18,
              }}
            >
              PRE CARGAR
            </Text>

            <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
              <MaterialIcons name={"camera-alt"} size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TextInput
              placeholder="CÓDIGO"
              value={codigo}
              //onChangeText={setCategoriasTerminaEn}
              onChangeText={(text) => {
                const formatted = formatCodigo(text);
                setCodigo(formatted);
              }}
              keyboardType="default"
              maxLength={14} // ← esto limita a 1 carácter
              style={[
                styles.input,
                {
                  flex: 1,
                  marginTop: 15,
                  textAlign: "center",
                  fontSize: 20,
                  letterSpacing: 1,
                  fontWeight: "bold",
                  fontFamily: "monospace",
                },
              ]}
            />

            {/* <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
              <MaterialIcons name={"qr-code"} size={20} color="black" />
            </TouchableOpacity> */}
          </View>

          <Pressable
            style={styles.inputSmall}
            onPress={() => setModalVisible(true)}
          >
            <Text
              style={{
                color: sorteoNombre ? "#000" : "#aaa",
                textAlign: "center",
              }}
            >
              {sorteoNombre || "Sorteo"}
            </Text>
          </Pressable>
          <SorteoSelectorModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSelect={(sorteo) => {
              //setSorteoId(sorteo.id);
              setSorteoNombre(sorteo.name);
              setSorteoSeleccionado(sorteo);
              //Object.assign(mSorteo, sorteo); // ✅ Copia las propiedades sin reemplazar el objeto

              // setSorteoId(mSorteo.id);
            }}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            textColor="red"
            style={{
              backgroundColor: "white", // Fondo blanco
              marginBottom: 10,
              borderRadius: 3,
            }}
            onPress={onClose}
          >
            CANCELAR
          </Button>
          <Button
            textColor="#4CAF50"
            style={{
              backgroundColor: "white", // Fondo blanco
              marginBottom: 10,
              borderRadius: 3,
            }}
            onPress={() => {
              setModalVisible(false);
              onSelect({ codigo, sorteo: sorteoSeleccionado });
            }}
          >
            OK
          </Button>
        </Dialog.Actions>
      </Dialog>
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

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  inputSmall: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    minHeight: 40, // importante para móviles
  },
  inputSmallSorteo: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    minHeight: 40, // importante para móviles
    minWidth: 120,
  },
  iconButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "white",
  },
});
