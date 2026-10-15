import React, { useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Platform, useWindowDimensions } from "react-native";
import { useTheme } from "../context/ThemeContext";

import VentaScreen from "./VentaScreen";
import PremiosScreen from "./PremiosScreen";
import VentaGeneralScreen from "./VentaGeneralScreen";
import HistorialScreen from "./HistorialScreen";
import SorteosScreen from "../screens/SorteosScreen";
import SorteosLayoutScreen from "../screens/SorteosLayoutScreen";
import ConfiguracionScreen from "./ConfiguracionScreen";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const [sorteo, setSorteo] = useState(""); // Estado para Sorteo
  const [fecha, setFecha] = useState(new Date()); // Estado para Fecha
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  // const isWeb = Platform.OS === "web" && width > 768;
  const isWeb = width > 768;
  const drawerWidth = Platform.OS === "web" ? "250px" : 250;

  return (
    <Drawer.Navigator
      initialRouteName="Venta"
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: "#fff",
        drawerActiveTintColor: theme.isDarkSecondary ? "#ffffff" : theme.primary,
        drawerInactiveTintColor: theme.isDarkSecondary ? "#cbd5e1" : "#475569",
        drawerActiveBackgroundColor: theme.isDarkSecondary
          ? "rgba(255, 255, 255, 0.12)"
          : "rgba(0, 0, 0, 0.06)",
        drawerLabelStyle: { fontSize: 16, fontWeight: "500" },
        // Color de fondo del Drawer (sidebar) usando el color secundario
        drawerStyle: {
          backgroundColor: theme.secondary,
          width: drawerWidth,
        },
        drawerItemStyle: {
          borderRadius: 6,
          marginHorizontal: 8,
          marginVertical: 2,
        },
        drawerType: "slide",
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen
        name="Venta"
        component={VentaScreen}
        options={{ drawerLabel: "VENTA" }}
      />
      <Drawer.Screen
        name="Premios"
        component={PremiosScreen}
        options={{ drawerLabel: "PREMIOS" }}
      />
      <Drawer.Screen
        name="VentaGeneral"
        component={VentaGeneralScreen}
        options={{ drawerLabel: "VENTA GENERAL" }}
      />
      <Drawer.Screen
        name="Historial"
        component={HistorialScreen}
        options={{ drawerLabel: "HISTORIAL" }}
      />
      <Drawer.Screen
        name="SORTEOS"
        component={isWeb ? SorteosLayoutScreen : SorteosScreen}
        options={{ drawerLabel: "SORTEOS" }}
      />
      <Drawer.Screen
        name="Configuracion"
        component={ConfiguracionScreen}
        options={{ drawerLabel: "CONFIGURACIÓN" }}
      />
    </Drawer.Navigator>
  );
}
