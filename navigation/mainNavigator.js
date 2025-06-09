// src/navigation/MainNavigator.js
import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";

import { AuthContext } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import DrawerNavigator from "../screens/DrawerNavigator";
import SorteoDetalleScreen from "../screens/SorteoDetalleScreen";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  const context = useContext(AuthContext);
  console.log("📦 CONTEXTO:", context); // ¿Te da `undefined`?

  const { userData, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={userData ? "Home" : "Login"}
        screenOptions={{
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
        }}
      >
        {!userData ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
