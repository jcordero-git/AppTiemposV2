// screens/SorteoDetalleScreen.js

import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { formatHourStr } from "../utils/datetimeUtils";

export default function SorteoDetalleScreen({ navigation, route }) {
  const { sorteo, userData } = route.params;
  const [reventar, setReventar] = useState(false);
  const [fechaRestringida, setFechaRestringida] = useState(false);
  const [restricciones, setRestricciones] = useState([]);
  const [hora, setHora] = useState("");

  const { width } = useWindowDimensions();
  const isWeb = width > 710;

  useEffect(() => {
    setHora(formatHourStr(sorteo.limitTime));
    if (typeof sorteo?.useReventado === "boolean")
      setReventar(sorteo.useReventado);
    if (!userData?.id || !sorteo?.id) return;

    const endpoint = `https://3jbe.tiempos.website/api/restrictedNumbers/byUser/${userData.id}/${sorteo.id}`;
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        setRestricciones(data);
        const tieneFecha = data.some((regla) => regla.restricted === "{DATE}");
        setFechaRestringida(tieneFecha);
      })
      .catch((err) => console.error("Error al cargar restricciones:", err));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ title: sorteo.name });
  }, [navigation, sorteo]);

  const renderRestriccion = ({ item }) => {
    const isFecha = item.restricted === "{DATE}";
    const contenido = isFecha ? (
      <View style={styles.rowCenter}>
        <Ionicons name="calendar" size={20} style={{ marginRight: 8 }} />
        <Text style={styles.bold}>[{new Date().getDate()}]</Text>
      </View>
    ) : (
      <Text style={styles.bold}>[{item.restricted}]</Text>
    );

    return (
      <View style={styles.restriccionItem}>
        <View style={styles.rowCenter}>{contenido}</View>
        <View style={styles.rowCenter}>
          <Text style={styles.restriccionAmount}>
            (₡{item.restrictedAmount})
          </Text>
          <Text style={styles.restriccionPercent}>
            %{item.sellerRestrictedPercent}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.scrollContainer}>
      <View style={[styles.mainContainer, isWeb && styles.webLayout]}>
        <View style={[styles.panel, isWeb && styles.webPanelLeft]}>
          <TextInput
            value={sorteo?.name}
            editable={false}
            style={styles.titleInput}
          />

          <View style={styles.rowWithMarginTop}>
            <TextInput editable={false} style={styles.horaInput} value={hora} />
            <TextInput
              value={sorteo?.prizeTimes?.toString() || "0"}
              editable={false}
              style={styles.vecesInput}
            />
            <Text style={styles.label}>veces</Text>
            <View style={styles.circleWhite} />
          </View>

          <View style={styles.rowWithMarginTop}>
            <Text style={styles.labelWide}>Usa Reventado</Text>
            <Switch
              value={reventar}
              disabled={true}
              style={{ marginRight: 8 }}
            />
            <TextInput value="0" editable={false} style={styles.vecesInput} />
            <Text style={styles.label}>veces</Text>
            <View style={styles.circleGray} />
          </View>

          <View style={styles.rowReventado}>
            <TextInput
              value={sorteo?.revPrizeTimes?.toString() || "0"}
              editable={false}
              style={styles.vecesInput}
            />
            <Text style={styles.label}>veces</Text>
            <View style={styles.circleRed} />
          </View>
        </View>

        <View style={[styles.listContainer, !isWeb && { marginTop: 0 }]}>
          <View style={styles.restriccionesHeader}>
            <View style={styles.line} />
            <Text style={styles.restriccionesTitle}>
              Reglas de restringidos
            </Text>
            <View style={styles.line} />
            <TouchableOpacity
              disabled={true}
              style={styles.restriccionesAddButton}
            >
              <Ionicons name="add" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Restringir Fecha</Text>
            <Switch
              value={fechaRestringida}
              disabled={true}
              onValueChange={setFechaRestringida}
            />
          </View>

          <FlatList
            data={restricciones}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={renderRestriccion}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingRight: 16,
    paddingLeft: 6,
    paddingBottom: 16,
    justifyContent: "flex-start",
  },
  mainContainer: {
    flexDirection: "column",
    padding: 20,
    flex: 1,
  },
  webLayout: {
    flexDirection: "row",
  },
  panel: {
    marginBottom: 10,
  },
  listContainer: {
    flex: 1,
    maxHeight: 900, // puedes ajustar esto según el diseño deseado
  },
  webPanelLeft: {
    marginRight: 20,
    minWidth: 410,
  },
  titleInput: {
    fontSize: 18,
    borderBottomWidth: 1,
    color: "#444",
  },
  rowWithMarginTop: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  horaInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    color: "#444",
    marginRight: 8,
  },
  vecesInput: {
    width: 50,
    textAlign: "right",
    fontSize: 16,
    borderBottomWidth: 1,
    marginRight: 8,
  },
  label: {
    marginRight: 8,
    color: "#000",
  },
  labelWide: {
    flex: 1,
    fontSize: 16,
    color: "#999",
  },
  circleWhite: {
    width: 30,
    height: 30,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 15,
  },
  circleGray: {
    width: 30,
    height: 30,
    backgroundColor: "gray",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 15,
  },
  circleRed: {
    width: 30,
    height: 30,
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 15,
  },
  rowReventado: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    justifyContent: "flex-end",
  },
  restriccionesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#999",
  },
  restriccionesTitle: {
    marginHorizontal: 10,
    color: "#999",
  },
  restriccionesAddButton: {
    marginLeft: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    opacity: 0.4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  restriccionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  restriccionAmount: {
    marginRight: 10,
    color: "#666",
  },
  restriccionPercent: {
    fontWeight: "600",
    color: "#666",
  },
  bold: {
    fontWeight: "bold",
  },
});
