import React, { useState } from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import CuentaModal from "../components/CuentaModal";
import mSorteo from "../models/mSorteoSingleton.js";
import mFechaSeleccionada from "../models/mFechaSeleccionadaSingleton";

import VentaScreen from "./VentaScreen";
import PremiosScreen from "./PremiosScreen";
import VentaGeneralScreen from "./VentaGeneralScreen";
import HistorialScreen from "./HistorialScreen";
import SorteosScreen from "../screens/SorteosScreen";
import SorteosLayoutScreen from "../screens/SorteosLayoutScreen";
import ConfiguracionScreen from "./ConfiguracionScreen";

const Drawer = createDrawerNavigator();

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

function CustomDrawerContent(props) {
  const { theme } = useTheme();
  const { userData, ticketProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const displayName =
    userData?.name ||
    ticketProfile?.sellerName ||
    userData?.username ||
    "Vendedor";

  const userInitials = getInitials(displayName);
  const userRole =
    userData?.role ||
    userData?.rol ||
    userData?.userType ||
    userData?.roleName ||
    "Vendedor";

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 8 }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Botón de usuario en la parte inferior */}
      <View
        style={[
          styles.footerWrapper,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.userCard,
            {
              backgroundColor: theme.isDarkSecondary
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
          onPress={() => {
            props.navigation.closeDrawer();
            props.onOpenCuenta();
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.avatarBox, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text
              style={[
                styles.userName,
                { color: theme.isDarkSecondary ? "#ffffff" : "#0f172a" },
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              style={[
                styles.userRole,
                { color: theme.isDarkSecondary ? "#94a3b8" : "#64748b" },
              ]}
              numberOfLines={1}
            >
              {userRole}
            </Text>
          </View>

          <MaterialIcons
            name="more-horiz"
            size={22}
            color={theme.isDarkSecondary ? "#94a3b8" : "#64748b"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  const [cuentaModalVisible, setCuentaModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { logout } = useAuth();
  const isWeb = width > 768;
  const drawerWidth = Platform.OS === "web" ? "250px" : 250;

  const apkVersion =
    Constants.manifest?.version || Constants.expoConfig?.version;

  const handleLogout = () => {
    setCuentaModalVisible(false);
    mSorteo.id = 0;
    mFechaSeleccionada.resetFecha();
    logout();
  };

  return (
    <>
      <Drawer.Navigator
        initialRouteName="Venta"
        drawerContent={(props) => (
          <CustomDrawerContent
            {...props}
            onOpenCuenta={() => setCuentaModalVisible(true)}
          />
        )}
        screenOptions={{
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: "#fff",
          drawerActiveTintColor: theme.isDarkSecondary
            ? "#ffffff"
            : theme.primary,
          drawerInactiveTintColor: theme.isDarkSecondary
            ? "#cbd5e1"
            : "#475569",
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

      <CuentaModal
        visible={cuentaModalVisible}
        onClose={() => setCuentaModalVisible(false)}
        onLogout={handleLogout}
        apkVersion={apkVersion}
      />
    </>
  );
}

const styles = StyleSheet.create({
  footerWrapper: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    justifyContent: "space-between",
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
  },
  userRole: {
    fontSize: 11,
    marginTop: 1,
  },
});
