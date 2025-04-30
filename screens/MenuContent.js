import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function MenuContent({ navigation }) {
  return (
    <View style={styles.menu}>
      <Text style={styles.menuHeader}>Menú</Text>
      {[
        { label: "VENTA", screen: "Venta" },
        { label: "PREMIOS", screen: "Premios" },
        { label: "VENTA GENERAL", screen: "VentaGeneral" },
        { label: "HISTORIAL", screen: "Historial" },
        { label: "SORTEOS", screen: "Sorteos" },
        { label: "CONFIGURACIÓN", screen: "Configuracion" },
      ].map((item) => (
        <Pressable
          key={item.screen}
          onPress={() => {
            navigation.navigate(item.screen); // Navegar a la pantalla seleccionada
          }}
          style={styles.menuItem}
        >
          <Text>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingTop: 20,
    paddingLeft: 20,
  },
  menuHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});
