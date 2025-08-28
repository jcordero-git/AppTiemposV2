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
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { mSorteo } from "../models/mSorteo";

export default function SorteoSelectorModal({
  visible,
  onClose,
  onSelect,
  leftPosition,
}) {
  const { userData } = useAuth();
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";
  const [sorteoItems, setSorteoItems] = useState([]);
  const [loading, setLoading] = useState(false); // ⬅️ nuevo estado
  //console.log("User desde modal:", userData.id);
  /** @type {mSorteo[]} */
  let mSorteos = [];
  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;
  //const leftPosition = false;

  useEffect(() => {
    if (visible) {
      setLoading(true); // ⬅️ activa loading antes del fetch
      fetch(`${backend_url}/api/drawCategory/user/${userData.id}`)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          // Ordenar los sorteos por limitTime (más temprano primero)
          const sorteosOrdenados = data.sort((a, b) => {
            const horaA = new Date(`1970-01-01T${a.limitTime}Z`);
            const horaB = new Date(`1970-01-01T${b.limitTime}Z`);
            return horaA - horaB;
          });

          if (Array.isArray(sorteosOrdenados)) {
            mSorteos = sorteosOrdenados;
          } else {
            console.warn(
              "⚠️ 'data sorteos' no es un array válido:",
              sorteosOrdenados,
            );
          }
          setSorteoItems(mSorteos);
          setSorteoItems(Array.isArray(mSorteos) ? mSorteos : []);
        })
        .catch((error) => {
          console.error("Error al obtener sorteos", error);
          setSorteoItems([]);
        })
        .finally(() => setLoading(false)); // ⬅️ siempre desactiva loading
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      style={{ maxHeight: height * 0.6 }}
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { justifyContent: "center" }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modal,
            { marginHorizontal: 20, maxHeight: height * 0.8 },
            isWeb && { position: "absolute", top: 74, width: 400 },
            isWeb && leftPosition && { left: 0 },
            isWeb && !leftPosition && { right: 0 },
          ]}
          onPress={() => {}}
        >
          <Text style={styles.title}>SORTEOS DISPONIBLES</Text>

          {loading ? (
            <View
              style={{
                height: 150,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="green" />
              <Text style={{ marginTop: 10 }}>Cargando sorteos...</Text>
            </View>
          ) : (
            <FlatList
              data={sorteoItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", marginTop: 20 }}>
                  No hay sorteos disponibles
                </Text>
              }
            />
          )}

          {/* <FlatList
            data={sorteoItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          /> */}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    //justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    //top: 74,
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
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
