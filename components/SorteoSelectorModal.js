// components/SorteoSelectorModal.js

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Dialog, Button } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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
  const [loading, setLoading] = useState(false);
  const [showJugados, setShowJugados] = useState(false);
  /** @type {mSorteo[]} */
  let mSorteos = [];
  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetch(`${backend_url}/api/drawCategory/user/${userData.id}`)
        .then((res) => res.json())
        .then((data) => {
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
          setSorteoItems(Array.isArray(mSorteos) ? mSorteos : []);
        })
        .catch((error) => {
          console.error("Error al obtener sorteos", error);
          setSorteoItems([]);
        })
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const sorteosFiltrados = sorteoItems.filter((item) => {
    if (showJugados) return true;
    const now = new Date();
    const [hh, mm, ss] = (item.limitTime || "23:59:59").split(":");
    const limit = new Date();
    limit.setHours(Number(hh), Number(mm), Number(ss || 0), 0);
    return now <= limit;
  });

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
            backgroundColor: "white",
            borderRadius: 10,
            marginHorizontal: 20,
            maxHeight: height * 0.8,
          },
          isWeb && {
            position: "absolute",
            top: 74,
            width: 400,
            maxHeight: "90%",
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          },
          isWeb && leftPosition && { left: 0 },
          isWeb && !leftPosition && { right: 0 },
        ]}
      >
        <Dialog.Content>
          {/* Header: ícono + título + toggle */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="event" size={28} color="#000" />
              <Text style={styles.title}>SORTEOS</Text>
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Todos</Text>
              <Switch
                value={showJugados}
                onValueChange={setShowJugados}
                trackColor={{ false: "#ccc", true: "#4CAF50" }}
                thumbColor={showJugados ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Lista de sorteos */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="green" />
              <Text style={{ marginTop: 10 }}>Cargando sorteos...</Text>
            </View>
          ) : (
            <FlatList
              data={sorteosFiltrados}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: isWeb ? height * 0.7 : height * 0.6 }}
              renderItem={({ item }) => {
                // Formatear hora límite a HH:MM AM/PM
                const formatHora = (limitTime) => {
                  if (!limitTime) return "";
                  const [hh, mm] = limitTime.split(":");
                  const h = Number(hh);
                  const ampm = h >= 12 ? "PM" : "AM";
                  const h12 = h % 12 === 0 ? 12 : h % 12;
                  return `${h12}:${mm} ${ampm}`;
                };

                return (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <Text style={styles.itemText}>{item.name}</Text>
                    <View style={styles.itemTimeRow}>
                      <MaterialIcons name="schedule" size={14} color="#888" />
                      <Text style={styles.itemTimeText}>
                        {formatHora(item.limitTime)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No hay sorteos disponibles
                </Text>
              }
            />
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            textColor="red"
            style={styles.actionButton}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toggleLabel: {
    fontSize: 13,
    color: "#555",
  },
  loadingContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemTimeText: {
    fontSize: 13,
    color: "#888",
  },
  itemText: {
    fontSize: 15,
    color: "#222",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
  actionButton: {
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 3,
  },
});
