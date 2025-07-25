import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { useOrientationLock } from "./components/useOrientationLock";

import { AuthProvider } from "./context/AuthContext";
import { TiempoProvider } from "./models/mTiempoContext";
import { SnackbarProvider } from "./context/SnackbarContext"; // Ajusta el path

import MainNavigator from "./navigation/mainNavigator";
// import { syncInternetTime } from "./utils/datetimeUtils";

export default function App() {
  // useEffect(() => {
  //   syncInternetTime("America/Costa_Rica"); // también puedes usar "America/Santiago", etc.
  // }, []);
  useOrientationLock();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <TiempoProvider>
          <PaperProvider>
            <SnackbarProvider>
              <MainNavigator />
            </SnackbarProvider>
          </PaperProvider>
        </TiempoProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
