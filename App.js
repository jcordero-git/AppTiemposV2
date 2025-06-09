import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";

import { AuthProvider } from "./context/AuthContext";
import { TiempoProvider } from "./models/mTiempoContext";
import { SnackbarProvider } from "./context/SnackbarContext"; // Ajusta el path

import MainNavigator from "./navigation/mainNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TiempoProvider>
        <PaperProvider>
          <SnackbarProvider>
            <AuthProvider>
              <MainNavigator />
            </AuthProvider>
          </SnackbarProvider>
        </PaperProvider>
      </TiempoProvider>
    </GestureHandlerRootView>
  );
}
