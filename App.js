// App.js
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/LoginScreen";
import DrawerNavigator from "./screens/DrawerNavigator"; // Home con Drawer
import SorteoDetalleScreen from "./screens/SorteoDetalleScreen";

import { AuthProvider } from "./context/AuthContext";
import { Provider as PaperProvider } from "react-native-paper";
import { TiempoProvider } from "./models/mTiempoContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <TiempoProvider>
      <PaperProvider>
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                  headerStyle: { backgroundColor: "#4CAF50" },
                  headerTintColor: "#fff",
                }}
              >
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Home"
                  component={DrawerNavigator}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="SorteoDetalle"
                  component={SorteoDetalleScreen}
                  options={{ title: "Detalle del Sorteo" }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </GestureHandlerRootView>
        </AuthProvider>
      </PaperProvider>
    </TiempoProvider>
  );
}
