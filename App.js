import React, { useEffect, useContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { useOrientationLock } from "./components/useOrientationLock";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TiempoProvider } from "./models/mTiempoContext";
import { SnackbarProvider } from "./context/SnackbarContext"; // Ajusta el path

import MainNavigator from "./navigation/mainNavigator";

export default function App() {
  useOrientationLock();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <TiempoProvider>
            <PaperProvider>
              <SnackbarProvider>
                <MainNavigator />
              </SnackbarProvider>
            </PaperProvider>
          </TiempoProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
