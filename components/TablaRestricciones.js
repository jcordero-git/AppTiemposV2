import React, { useState, useEffect } from "react";
import { ScrollView, TextInput, View, Text, StyleSheet } from "react-native";

export default function TablaRestricciones({ data, useReventado }) {
  //   const [searchText, setSearchText] = useState("");
  //   const [filteredData, setFilteredData] = useState(data);

  //   useEffect(() => {
  //     if (!searchText) {
  //       setFilteredData(data);
  //     } else {
  //       const lower = searchText.toLowerCase();
  //       setFilteredData(
  //         data.filter((item) => item.numero.toString().includes(lower)),
  //       );
  //     }
  //   }, [searchText, data]);

  console.log("USA REVENTADO: ", useReventado);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.table}>
          {/* Encabezado */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.headerCell]}>#</Text>
            <Text style={[styles.cell, styles.headerCell]}>Normal</Text>
            {useReventado && (
              <Text style={[styles.cell, styles.headerCell]}>Reventado</Text>
            )}
          </View>

          {/* Filas */}
          {data.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.cell}>{item.numero}</Text>
              <Text style={styles.cell}>₡{item.monto.toFixed(0)}</Text>
              {useReventado && (
                <Text style={styles.cell}>₡{item.rev_monto.toFixed(0)}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  header: {
    backgroundColor: "rgba(76, 175, 80, 0.80)",
  },
  cell: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    textAlign: "left",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#333",
  },
});
