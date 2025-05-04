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

export default function SorteoSelectorModal({ visible, onClose, onSelect }) {
  const { userData } = useAuth();
  const [draws, setDraws] = useState([]);
  //console.log("User desde modal:", userData.id);

  useEffect(() => {
    if (visible) {
      fetch(`http://147.182.248.177:3001/api/drawCategory/user/${userData.id}`)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          setDraws(data);
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
            data={draws}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
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
