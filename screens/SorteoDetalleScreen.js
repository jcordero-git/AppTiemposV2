// screens/SorteoDetalleScreen.js

import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  FlatList,
  TextInput,
  useWindowDimensions,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { formatHourStr } from "../utils/datetimeUtils";
import { convertNumero, validateMonto } from "../utils/numeroUtils";

export default function SorteoDetalleScreen({ navigation, route }) {
  const { sorteo, userData } = route.params;
  const [reventar, setReventar] = useState(false);
  const [restricciones, setRestricciones] = useState([]);
  const [fechaConsulta, setFechaConsulta] = useState("");
  const [hora, setHora] = useState("");
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";

  const { width } = useWindowDimensions();
  const isWeb = width > 710;

  useEffect(() => {
    if (!sorteo || !userData) return;

    setHora(formatHourStr(sorteo.limitTime));
    if (typeof sorteo?.useReventado === "boolean")
      setReventar(sorteo.useReventado);
    if (!userData?.id || !sorteo?.id) return;

    const endpoint = `${backend_url}/api/v2/restrictedNumbers/status?drawCategoryId=${sorteo.id}&token=${userData.token}`;
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rules) {
          if (data.date) setFechaConsulta(data.date);
          const groupedRules = data.rules.reduce((acc, rule) => {
            const num = rule.number;
            if (!acc[num] || rule.available < acc[num].available) {
              acc[num] = rule;
            }
            return acc;
          }, {});

          const processed = Object.values(groupedRules)
            .map((rule) => ({
              restricted: rule.number,
              scope: rule.scope,
              limitType: rule.limitType,
              limit: rule.limit,
              percentage: rule.percentage,
            }))
            .sort((a, b) => parseInt(a.restricted) - parseInt(b.restricted));
          setRestricciones(processed);
        } else {
          setRestricciones([]);
        }
      })
      .catch((err) => console.error("Error al cargar restricciones:", err));
  }, [sorteo, userData, backend_url]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: sorteo.name });
  }, [navigation, sorteo]);

  const ScopeIcon = ({ scope }) => {
    let iconName = "";
    switch (scope) {
      case "global":
        iconName = "public";
        break;
      case "group":
      case "grupal":
        iconName = "group";
        break;
      case "user":
      case "usuario":
      case "individual":
      case "individuo":
        iconName = "person";
        break;
    }
    if (!iconName) return null;
    return <MaterialIcons name={iconName} size={20} color="#555" />;
  };

  const renderRestriccion = ({ item }) => {
    const isFecha = item.restricted === "{DATE}";
    const contenido = isFecha ? (
      <View style={styles.rowCenter}>
        <Ionicons name="calendar" size={20} style={{ marginRight: 8 }} />
        <Text style={[styles.bold, { minWidth: 60 }]}>
          [{convertNumero(parseInt(new Date().getDate()))}]
        </Text>
      </View>
    ) : (
      <Text style={[styles.bold, { minWidth: 60, textAlignVertical: "top" }]}>
        [{item.restricted}]
      </Text>
    );

    return (
      <View style={styles.restriccionItem}>
        <View style={styles.restriccionRow}>
          <View style={[styles.restriccionCol, { flex: 1 }]}>{contenido}</View>
          <View style={[styles.restriccionValores, { flex: 5, justifyContent: "space-between" }]}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <ScopeIcon scope={item.scope} />
            </View>
            <Text style={[styles.cellText, { flex: 2, textAlign: "center" }]} numberOfLines={1}>{item.limitType || "--"}</Text>
            <Text style={[styles.cellText, { flex: 2, textAlign: "right" }]} numberOfLines={1}>
              {item.limit != null ? `₡${item.limit}` : "--"}
            </Text>
            <Text style={[styles.cellText, { flex: 1, textAlign: "right" }]} numberOfLines={1}>
              {item.limitType === "percentage" ? `${item.percentage}%` : "--"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.scrollContainer}>
      <View style={[styles.mainContainer, isWeb && styles.webLayout]}>
        <View
          style={[
            styles.panel,
            isWeb && styles.webPanelLeft,
            isWeb && { width: "40%" },
          ]}
        >
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
            {reventar && (
              <>
                <TextInput
                  value="0"
                  editable={false}
                  style={styles.vecesInput}
                />
                <Text style={styles.label}>veces</Text>
                <View style={styles.circleGray} />
              </>
            )}
          </View>
          {reventar && (
            <>
              <View style={styles.rowReventado}>
                <TextInput
                  value={sorteo?.revPrizeTimes?.toString() || "0"}
                  editable={false}
                  style={styles.vecesInput}
                />
                <Text style={styles.label}>veces</Text>
                <View style={styles.circleRed} />
              </View>
            </>
          )}
          {/* Línea divisoria */}
          <View style={styles.restriccionesHeader}>
            <View style={styles.line} />
            <Text style={styles.restriccionesTitle}>Comisiones</Text>
            <View style={styles.line} />
          </View>

          {/* Sección Comisiones */}
          <View style={styles.comisionesContainer}>
            <Text style={styles.comisionesTitulo}>Comisiones</Text>
            <Text style={styles.comisionItem}>
              Comisión por venta sencilla:{" "}
              <Text style={styles.comisionValor}>
                {sorteo?.sellerPercent ?? 0}%
              </Text>
            </Text>
            <Text style={styles.comisionItem}>
              Comisión por venta reventados:{" "}
              <Text style={styles.comisionValor}>
                {sorteo?.revSellerPercent ?? 0}%
              </Text>
            </Text>
          </View>
        </View>

        <View style={[styles.listContainer, isWeb ? { flex: 1, alignSelf: 'flex-start' } : { marginTop: 0, width: '100%' }]}>
          <View style={styles.restriccionesHeader}>
            <View style={styles.line} />
            <Text style={styles.restriccionesTitle}>
              Reglas de restringidos
            </Text>

            {fechaConsulta ? (
              <Text style={styles.restriccionesTitle}>
                {fechaConsulta}
              </Text>
            ) : null}



            <View style={styles.line} />
          </View>



          <FlatList
            data={restricciones}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={renderRestriccion}
            style={styles.tableContainer}
            ListHeaderComponent={() => (
              <View style={styles.headerRow}>
                <Text style={[styles.headerText, { flex: 1 }]}>#</Text>
                <View style={[styles.headerRowValues, { flex: 5, flexDirection: "row" }]}>
                  <Text style={[styles.headerText, { flex: 1, textAlign: "center" }]}>Alcance</Text>
                  <Text style={[styles.headerText, { flex: 2, textAlign: "center" }]}>Tipo</Text>
                  <Text style={[styles.headerText, { flex: 2, textAlign: "right" }]}>Límite</Text>
                  <Text style={[styles.headerText, { flex: 1, textAlign: "right" }]}>%</Text>
                </View>
              </View>
            )}
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
    pointerEvents: "none",
  },
  webLayout: {
    flexDirection: "row",
  },
  panel: {
    marginBottom: 10,
  },
  listContainer: {
    maxHeight: 900,
  },
  webPanelLeft: {
    marginRight: 20,
    minWidth: 320,
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
    marginVertical: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#999",
  },
  restriccionesTitle: {
    marginHorizontal: 14,
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
  // restriccionItem: {
  //   padding: 10,
  //   borderBottomWidth: 1,
  //   borderColor: "#eee",
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  // },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "70%",
  },
  // restriccionAmount: {
  //   marginRight: 10,
  //   color: "#666",
  // },
  // restriccionPercent: {
  //   fontWeight: "600",
  //   color: "#666",
  // },
  bold: {
    fontWeight: "bold",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    marginVertical: 10,
  },

  comisionesContainer: {
    paddingHorizontal: 10,
  },

  comisionesTitulo: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },

  comisionItem: {
    fontSize: 14,
    marginBottom: 4,
  },

  comisionValor: {
    fontWeight: "bold",
    color: "#333",
  },
  restriccionItem: {
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  restriccionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // permite que el contenido crezca verticalmente
    flexWrap: "nowrap",
    gap: 12,
  },

  restriccionCol: {
    //flex: 1, // que ocupe todo el espacio disponible
    //flexShrink: 1,
    //flexWrap: "wrap",
    maxWidth: "70%",
    minWidth: 0,
    flex: 1,
  },

  restriccionValores: {
    flexDirection: "row",
    minWidth: 40,
    alignItems: "flex-end",
  },

  restriccionAmount: {
    fontSize: 14,
    color: "#333",
    marginEnd: 10,
  },

  restriccionPercent: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#c00",
  },

  fechaConsultaText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
  },

  // Taget: header
  headerRow: {
    flexDirection: "row",
    backgroundColor: "rgba(76, 175, 80, 0.80)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerRowValues: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },

  cellText: {
    fontSize: 14,
    color: "#333",
  },

  tableContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
    maxHeight: 500,
    flexGrow: 0, // Evita que crezca si el contenido es pequeño
  },
});
