import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  Image,
  Pressable,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

export default function ResetPasswordScreen({ navigation, route }) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false); // ✅ nueva bandera
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (route?.params?.token) {
      setToken(route.params.token);
    }
  }, [route]);

  const isFormValid =
    token.trim() !== "" &&
    password.trim() !== "" &&
    password === confirmPassword;

  const handleResetPassword = async () => {
    try {
      const response = await fetch(
        `https://auth.tiempos.website/token/changePassword/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        },
      );
      if (response.status == 400) {
        showSnackbar("Token invalido, consulte al administrador.", 3);
      }

      if (response.ok) {
        if (Platform.OS === "web") {
          showSnackbar("Contraseña cambiada correctamente.", 1, 5000);
          window.setTimeout(() => {
            window.location.href = "https://app.tiempos.website/";
          }, 5000);
        } else {
          showSnackbar(
            "Contraseña cambiada correctamente. Cierre y abra la app.",
            1,
            8000,
          );
        }

        setSuccess(true); // bloquea inputs y botón
      } else {
        const errorData = await response.json();
        showSnackbar(
          errorData.message || "No se pudo cambiar la contraseña.",
          3,
        );
      }
    } catch (error) {
      showSnackbar("Hubo un problema con la conexión al servidor.", 3);
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
          placeholder="Token"
          style={styles.input}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          editable={!success} // ✅ bloqueado si éxito
        />
        <TextInput
          placeholder="Nueva contraseña"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          editable={!success} // ✅ bloqueado si éxito
        />
        <TextInput
          placeholder="Confirmar contraseña"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!success} // ✅ bloqueado si éxito
        />

        {confirmPassword !== "" && password !== confirmPassword && (
          <Text style={{ color: "red", marginBottom: 8 }}>
            Las contraseñas no coinciden
          </Text>
        )}

        <Pressable
          onPress={handleResetPassword}
          disabled={!isFormValid || success} // ✅ deshabilitado si éxito
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            !isFormValid && { opacity: 0.5 },
          ]}
        >
          <Text style={styles.buttonText}>OK</Text>
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
    alignItems: "center",
    padding: 20,
  },
  containerLogo: {
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  form: {
    width: "100%",
    maxWidth: 600,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  input: {
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    width: "100%",
    maxWidth: 400,
    fontSize: 16,
  },
  title: {
    fontSize: 34,
    textAlign: "center",
    color: "#4CAF50",
    fontFamily: "sans-serif-light",
  },
  image: {
    justifyContent: "center",
    marginTop: 0,
    width: 190,
    height: 95,
    resizeMode: "contain",
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
    textAlign: "center",
  },
});
