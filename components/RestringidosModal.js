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
  ScrollView,
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
import SorteoSelectorModal from "./SorteoSelectorModal";
import TablaRestricciones from "./TablaRestricciones";

export default function RestringidosModal({
  visible,
  onClose,
  onSelect,
  data = [],
  useReventado = false,
}) {
  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      return parseInt(a.numero) - parseInt(b.numero);
    });

    if (!searchText) {
      setFilteredData(sorted);
    } else {
      const lower = searchText.toLowerCase();
      setFilteredData(
        sorted.filter((item) => item.numero.toString().includes(lower)),
      );
    }
  }, [searchText, data]);

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
            //right: 0,
            //top: 74,
            bottom: 55,
            left: 0,
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
              marginBottom: 10,
            }}
          >
            <MaterialIcons name="warning" size={35} color="#4CAF50" />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: "bold",
                color: "#000",
                fontSize: 18,
              }}
            >
              RESTINGIDOS DISPONIBLES
            </Text>
          </View>
          <View style={{ maxHeight: height * 0.6 }}>
            <TextInput
              placeholder="Buscar número..."
              value={searchText}
              onChangeText={setSearchText}
              style={{
                marginHorizontal: 10,
                marginBottom: 8,
                padding: 8,
                borderBottomWidth: 1,
                borderColor: "#ccc",
                borderRadius: 3,
                fontSize: 14,
                backgroundColor: "#fff",
              }}
            />

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 10, flexGrow: 1 }}
            >
              {filteredData && filteredData.length > 0 ? (
                <TablaRestricciones
                  data={filteredData}
                  useReventado={useReventado}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#888" }}>
                    Sin restricciones...
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
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
            CERRAR
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
