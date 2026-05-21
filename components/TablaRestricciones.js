import React, { useState, useEffect } from "react";
import {
  ScrollView,
  TextInput,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TablaRestricciones({ data, useReventado }) {
  // Componente interno para manejar el hover de cada icono individualmente
  const ScopeIconWithTooltip = ({ scope }) => {
    const [hovered, setHovered] = useState(false);

    let iconName = "";
    let tooltipText = "";

    switch (scope) {
      case "global":
        iconName = "public";
        tooltipText = "Global";
        break;
      case "group":
      case "grupal":
        iconName = "group";
        tooltipText = "Grupal";
        break;
      case "user":
      case "usuario":
      case "individual":
      case "individuo":
        iconName = "person";
        tooltipText = "Individual";
        break;
    }

    if (!iconName) return null;

    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Pressable
          onHoverIn={() => Platform.OS === "web" && setHovered(true)}
          onHoverOut={() => Platform.OS === "web" && setHovered(false)}
          onPressIn={() => Platform.OS !== "web" && setHovered(true)}
          onPressOut={() => Platform.OS !== "web" && setHovered(false)}
        >
          <MaterialIcons name={iconName} size={20} color="#555" />
        </Pressable>
        {hovered && (
          <View style={styles.tooltip} pointerEvents="none">
            <Text style={styles.tooltipText}>{tooltipText}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.table}>
          {/* Encabezado */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.headerCell]}>#</Text>
            <Text style={[styles.cell, styles.headerCell]}>Normal</Text>
            {useReventado && (
              <Text style={[styles.cell, styles.headerCell]}>Reventado</Text>
            )}
            <Text style={[styles.cell, styles.headerCell]}>Alcance</Text>
          </View>

          {/* Filas */}
          {data.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.cell}>{item.numero}</Text>
              <Text style={styles.cell}>
                ₡{Number(item.monto || 0).toFixed(0)}
              </Text>
              {useReventado && (
                <Text style={styles.cell}>
                  {item.rev_monto
                    ? `₡${Number(item.rev_monto).toFixed(0)}`
                    : "-"}
                </Text>
              )}
              <View style={[styles.cell, { alignItems: "center" }]}>
                <ScopeIconWithTooltip scope={item.scope} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  header: {
    backgroundColor: "rgba(76, 175, 80, 0.80)",
  },
  cell: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    textAlign: "left",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#333",
  },
  tooltip: {
    position: "absolute",
    top: -24,
    backgroundColor: "#4CAF50",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 10,
    minWidth: 80,
    alignItems: "center",
  },
  tooltipText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});


