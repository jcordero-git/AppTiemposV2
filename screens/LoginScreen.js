import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path
import Constants from "expo-constants";

export default function LoginScreen({ navigation }) {
  const { login, saveTicketProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const getStoredUUID = async () => {
    return "uuid";
  };

  const loginUser = async ({ username, password, imei, apkVersion }) => {
    try {
      const response = await fetch("https://auth.tiempos.website/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password, imei, apkVersion }),
      });

      const data = await response.json();
      if (data.success === false) {
        console.warn("Usuario no encontrado.", data.message);
        return null;
      }

      // Verifica si hay datos válidos
      if (response.ok && data && Object.keys(data).length > 0) {
        return data;
      } else {
        console.warn("Credenciales incorrectas o sin respuesta");
        return null;
      }
    } catch (error) {
      console.error("Error al hacer login:", error);
      return null;
    }
  };

  const handleLogin = async () => {
    setLoading(true); // Mostrar loader

    const apkVersion =
      Constants.manifest?.version || Constants.expoConfig?.version;
    const imei = await getStoredUUID();

    const result = await loginUser({
      username: username,
      password,
      imei: imei, // Puedes obtenerlo con expo-device si es real
      apkVersion: apkVersion,
    });

    if (result) {
      await login(result, username, password); // guarda los datos globalmente

      // ✅ Obtener ticketProfile usando el ID del usuario
      const userId = result.id || result.userId; // depende del nombre exacto en la respuesta
      try {
        const settingBackendURL = result.settings.find(
          (s) => s.backend_url !== undefined,
        );
        const backend_url = settingBackendURL
          ? settingBackendURL.backend_url
          : "";
        const profileResponse = await fetch(
          `${backend_url}/api/ticketProfile/${userId}`,
        );
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();

          if (Object.keys(profileData).length === 0) {
            // ✅ Si no hay ticketProfile, crear uno por defecto
            const defaultProfile = {
              userId,
              ticketTitle: "",
              sellerName: result.name || "", // usa nombre del login
              phoneNumber: result.phone || "", // usa teléfono del login
              ticketFooter: "",
              printerSize: "58",
              lastPrinterMacAddress: "",
              printBarCode: true,
            };

            await saveTicketProfile(defaultProfile);
          } else {
            console.warn("Ticket Profile encontrado:", profileData);
            await saveTicketProfile(profileData);
          }
        } else {
          // ⚠️ Error del servidor o no encontrado → crear por defecto también
          const defaultProfile = {
            userId,
            ticketTitle: "",
            sellerName: result.name || "",
            phoneNumber: result.phone || "",
            ticketFooter: "",
            printerSize: "58",
            lastPrinterMacAddress: "",
            printBarCode: true,
          };

          console.warn("No se encontró ticketProfile, se usará default");
          await saveTicketProfile(defaultProfile);
        }
      } catch (err) {
        console.error("Error al obtener ticketProfile:", err);
      }

      setLoading(false); // Mostrar loader
      //navigation.replace("Home", { userData: result });
    } else {
      setLoading(false);
      //Alert.alert("Error", "Usuario o contraseña incorrectos");
      showSnackbar("Usuario o contraseña incorrectos", 3);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <TouchableWithoutFeedback onPress={() => {}}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999, // asegurarse de que esté encima de todo
            }}
          >
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </TouchableWithoutFeedback>
      )}

      <View style={styles.containerLogo}>
        <Text style={styles.title}>TIEMPOS</Text>
        <Image
          source={require("./../assets/ic_launcherv2_foreground.png")}
          style={styles.image}
        />
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Usuario"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          placeholder="Contraseña"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed, // cambia estilo cuando se presiona
          ]}
        >
          <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("ResetPassword")}>
          <Text
            style={{ marginTop: 15, color: "#4CAF50", textAlign: "center" }}
          >
            Restablecer Contraseña
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center", // Centra el contenido horizontalmente
    padding: 20,
  },
  containerLogo: {
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    height: "170",
  },
  form: {
    width: "100%",
    maxWidth: 600, // 👈 clave para web
    paddingHorizontal: 20, // Espaciado interno
    alignItems: "center", // Asegura que los elementos estén centrados en el formulario
  },
  input: {
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    //borderRadius: 8,
    //borderWidth: 1,
    borderBottomWidth: 1,
    width: "100%", // 🧠 hace que el input se adapte al contenedor
    maxWidth: 400, // 💻 previene que sea muy ancho en pantallas grandes
    fontSize: 16,
    //outlineStyle: "none", // ✅ importante para Web (quita el borde azul feo)
  },
  title: {
    fontSize: 34,
    textAlign: "center",
    color: "#4CAF50",
    fontFamily: "sans-serif-light",
  },
  image: {
    justifyContent: "center",
    marginTop: 0, // Da un pequeño margen entre el texto y la imagen
    width: 190, // Ancho de la imagen
    height: 95, // Alto de la imagen
    resizeMode: "contain", // Ajusta la imagen para que se vea bien dentro del contenedor
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 3,
    width: "100%",
    maxWidth: 400,
  },
  buttonPressed: {
    backgroundColor: "#2e8532",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center", // ← centra el texto dentro del botón
  },
});
