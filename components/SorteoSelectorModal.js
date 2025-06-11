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
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { mSorteo } from "../models/mSorteo";

export default function SorteoSelectorModal({ visible, onClose, onSelect }) {
  const { userData } = useAuth();
  const [sorteoItems, setSorteoItems] = useState([]);
  //console.log("User desde modal:", userData.id);
  /** @type {mSorteo[]} */
  let mSorteos = [];

  useEffect(() => {
    if (visible) {
      fetch(`https://3jbe.tiempos.website/api/drawCategory/user/${userData.id}`)
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
          console.log("sorteos ordenados:", mSorteos);
          setSorteoItems(mSorteos);
        })
        .catch((error) => console.error("Error al obtener sorteos", error));
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <Text style={styles.title}>SORTEOS DISPONIBLES</Text>
          <FlatList
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
