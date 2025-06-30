// useOrientationLock.js
import { useEffect } from "react";
import { useWindowDimensions, Platform } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import DeviceInfo from "react-native-device-info";

export const useOrientationLock = () => {
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const lockOrientation = async () => {
      if (Platform.OS === "web") return; // Evita errores en web

      const isTablet = DeviceInfo.isTablet();

      if (isTablet) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE,
        );
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      }
    };

    lockOrientation();
  }, [width, height]);
};
