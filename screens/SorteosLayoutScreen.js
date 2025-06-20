import React, { useState, useRef } from "react";
import { View, Text, useWindowDimensions, StyleSheet } from "react-native";
import SorteosScreen from "./SorteosScreen";
import SorteoDetalleScreen from "./SorteoDetalleScreen";
import { useAuth } from "../context/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function SorteosLayoutScreen() {
  const { width } = useWindowDimensions();
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState(null);
  const { userData } = useAuth();
  const sorteosScreenRef = useRef();

  return (
    <View style={styles.container}>
      {/* Panel izquierdo: lista */}
      <View style={styles.leftPanel}>
        <View
          style={{
            backgroundColor: "white",
            padding: 0,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <MaterialIcons
            name="sync"
            size={24}
            color="black"
            style={{ marginTop: 10, marginRight: 10 }}
            onPress={() => {
              // Lógica para recargar sorteos en web
              if (sorteosScreenRef.current?.reloadSorteos) {
                sorteosScreenRef.current.reloadSorteos(); // lo explicamos más abajo
              }
            }}
          />
        </View>

        <SorteosScreen
          ref={sorteosScreenRef}
          navigation={{
            navigate: (_, params) => setSorteoSeleccionado(params?.sorteo),
            setOptions: () => {},
          }}
        />
      </View>

      {/* Panel derecho: detalle */}
      <View style={styles.rightPanel}>
        {sorteoSeleccionado ? (
          <SorteoDetalleScreen
            route={{ params: { sorteo: sorteoSeleccionado, userData } }}
            navigation={{ setOptions: () => {} }}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Selecciona un sorteo</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flex: 1,
  },
  leftPanel: {
    width: 300,
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  rightPanel: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
  },
});
