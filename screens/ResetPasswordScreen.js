import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  Image,
  Pressable,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

export default function ResetPasswordScreen({ navigation, route }) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        Alert.alert("Éxito", "Contraseña cambiada correctamente");
        navigation.goBack();
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.message || "No se pudo cambiar la contraseña",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Hubo un problema con la conexión al servidor");
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
        />
        <TextInput
          placeholder="Nueva contraseña"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          placeholder="Confirmar contraseña"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {confirmPassword !== "" && password !== confirmPassword && (
          <Text style={{ color: "red", marginBottom: 8 }}>
            Las contraseñas no coinciden
          </Text>
        )}

        <Pressable
          onPress={handleResetPassword}
          disabled={!isFormValid}
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
