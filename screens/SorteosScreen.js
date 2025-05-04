import React from "react";
import { View, Text, StyleSheet } from "react-native";

const VentaScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>SORTEOS</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
  },
});

export default VentaScreen;
