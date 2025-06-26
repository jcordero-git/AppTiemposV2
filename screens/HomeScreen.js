import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Para el ícono de menú

export default function HomeScreen({ navigation, route }) {
  const { userData } = route.params; // Recibiendo los datos del usuario, si es necesario

  // Función para obtener el título de la pantalla activa
  const getScreenTitle = () => {
    switch (navigation.getState().routes[navigation.getState().index].name) {
      case "Venta":
        return "VENTA";
      case "Premios":
        return "PREMIOS";
      case "VentaGeneral":
        return "VENTA GENERAL";
      case "Historial":
        return "HISTORIAL";
      case "Sorteos":
        return "SORTEOS";
      case "Configuracion":
        return "CONFIGURACIÓN";
      default:
        return `Bienvenido, ${userData.nombre}`;
    }
  };

  return (
    // <View style={styles.mainContent}>
    //   <View style={styles.header}>
    //     {/* Botón de menú */}
    //     <Pressable onPress={() => navigation.toggleDrawer()}>
    //       <Ionicons name="menu" size={30} color="#000" />
    //     </Pressable>
    //     {/* Título de la pantalla activa */}
    //     <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
    //   </View>

    //   {/* Contenido principal */}
    //   <Text style={styles.content}>Pantalla Principal</Text>
    // </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },
});
