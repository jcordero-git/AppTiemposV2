import React, { useEffect, useState, useCallback } from "react";
import { Alert, Platform } from "react-native";
import * as Application from "expo-application";
import { useAuth } from "../context/AuthContext";
import { NativeModules } from "react-native";
const { ApkInstaller } = NativeModules;
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

export default function useCheckAppVersion(autoCheck = true) {
  //const [checking, setChecking] = useState(false);
  const { userData } = useAuth();
  const token = userData?.token;
  const { showSnackbar } = useSnackbar();

  const settingBackendURL = userData?.settings?.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";
  const APK_ENDPOINT = `${backend_url}/api/apk/last?isReact=true`;

  const checkVersion = useCallback(async () => {
    //setChecking(true);

    try {
      const response = await fetch(APK_ENDPOINT);
      const json = await response.json();

      if (json?.filePath) {
        const currentVersion = Application.nativeApplicationVersion;
        const lastVersion = extractVersionFromFilePath(json.filePath);
        const apkUrl = json.filePath;

        if (compareVersions(currentVersion, lastVersion) === -1) {
          showUpdateDialog(currentVersion, lastVersion, apkUrl, lastVersion);
        } else {
          showSnackbar("Error al generar token.", 3);
        }
      }
    } catch (e) {
      console.error("Error verificando versión", e);
    } finally {
      //setChecking(false);
    }
  }, [APK_ENDPOINT]);

  const extractVersionFromFilePath = (filePath) => {
    const match = filePath.match(/v([\d.]+)\.apk/);
    return match ? match[1] : null;
  };

  const compareVersions = (v1, v2) => {
    const a = v1.split(".").map(Number);
    const b = v2.split(".").map(Number);
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
      const v1Part = a[i] || 0;
      const v2Part = b[i] || 0;
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    return 0;
  };

  const showUpdateDialog = (current, latest, apkUrl, version) => {
    Alert.alert(
      "Nueva versión disponible",
      `Versión actual: (${current})\nVersión nueva: (${latest})\n\n¿Desea actualizar ahora?`,
      [
        { text: "CANCELAR", style: "cancel" },
        {
          text: "ACTUALIZAR",
          onPress: () => {
            ApkInstaller.downloadAndInstall(apkUrl, version);
          },
        },
      ],
      { cancelable: false },
    );
  };

  // Ejecutar automáticamente si autoCheck es true
  useEffect(() => {
    if (autoCheck) {
      checkVersion();
    }
  }, [checkVersion]);

  // ✅ Ahora también devuelves la función para usarla manualmente
  return { checkVersion };
}
