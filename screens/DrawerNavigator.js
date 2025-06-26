import React, { useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Platform, useWindowDimensions } from "react-native"; // Importar Alert para mostrar el mensaje

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
  const isWeb = Platform.OS === "web" && width > 768;
  const drawerWidth = Platform.OS === "web" ? "250px" : 250;

  return (
    <Drawer.Navigator
      initialRouteName="Venta"
      screenOptions={{
        headerStyle: { backgroundColor: "#4CAF50" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#000",
        drawerLabelStyle: { fontSize: 16 },
        // Cambiar el color de fondo del Drawer aquí
        drawerStyle: {
          backgroundColor: "#4CAF50", // Color de fondo del Drawer
          width: drawerWidth, // Aquí defines el ancho del Drawer (en este caso, 250px)
        },
        drawerItemStyle: {
          borderRadius: 0, // Eliminando bordes redondeados
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
