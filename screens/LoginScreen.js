import {
  View,
  TextInput,
  Text,
  Button,
  StyleSheet,
  Alert,
  Image,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import * as Device from "expo-device";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const result = await loginUser({
      email: username,
      password,
      emei: "123456789012345", // Puedes obtenerlo con expo-device si es real
      apkVersion: "1.0.0",
    });

    if (result) {
      console.log("Respuesta del login data:", result); // 🔍 Imprime el resultado en la consola
      navigation.replace("Home", { userData: result });
    } else {
      Alert.alert("Error", "Usuario o contraseña incorrectos");
    }
  };

  return (
    <View style={styles.container}>
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
      </View>
    </View>
  );
}

const loginUser = async ({ email, password, emei, apkVersion }) => {
  try {
    const response = await fetch(
      "http://147.182.248.177:3001/api/user/loginV2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, emei, apkVersion }),
      },
    );

    const data = await response.json();

    // Verifica si hay datos válidos
    if (response.ok && data && Object.keys(data).length > 0) {
      console.log("Login exitoso:", data);
      return data;
    } else {
      console.log("Credenciales incorrectas o sin respuesta");
      return null;
    }
  } catch (error) {
    console.error("Error al hacer login:", error);
    return null;
  }
};

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
    backgroundColor: "white",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "100%", // 🧠 hace que el input se adapte al contenedor
    maxWidth: 400, // 💻 previene que sea muy ancho en pantallas grandes
    fontSize: 16,
    outlineStyle: "none", // ✅ importante para Web (quita el borde azul feo)
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
    borderRadius: 8,
  },
  buttonPressed: {
    backgroundColor: "#005BBB",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center", // ← centra el texto dentro del botón
  },
});
