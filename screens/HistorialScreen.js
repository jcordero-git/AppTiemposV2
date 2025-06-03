import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  Switch,
  FlatList,
  useWindowDimensions,
  Alert,
  Platform,
} from "react-native";
//import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { subMonths, addDays, format } from "date-fns";
import DatePickerWeb from "../components/DatePickerWeb";

import { es } from "date-fns/locale"; // idioma español
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../context/AuthContext";
import { mDraws } from "../models/mDraws";
import { mBanking } from "../models/mBanking";
import { mHistory } from "../models/mHistory";

export default function HistorialScreen({ navigation, route }) {
  const { userData } = useAuth();
  const [showPickerDesde, setShowPickerDesde] = useState(false);
  const [showPickerHasta, setShowPickerHasta] = useState(false);

  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [fecha, setFecha] = useState(new Date());
  // Resta 2 meses desde hoy
  const [fechaDesde, setfechaDesde] = useState(subMonths(new Date(), 2));
  const [fechaHasta, setfechaHasta] = useState(subMonths(new Date(), 0));

  const formatDate = (fecha) => {
    try {
      return format(fecha, "EE dd/MM/yyyy", { locale: es });
    } catch (error) {
      console.error("Error al formatear la fecha:", error);
      return "";
    }
  };

  const formatDateForAPI = (fecha) => {
    try {
      return format(fecha, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error al formatear la fecha:", error);
      return "";
    }
  };
  const formatDateHastaForAPI = (fecha) => {
    try {
      const fechaAumentada = addDays(fecha, 1);
      return format(fechaAumentada, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error al formatear la fecha hasta:", error);
      return "";
    }
  };

  const formattedFechaDesde = formatDate(fechaDesde);
  const formattedFechaHasta = formatDate(fechaHasta);
  const formattedFechaDesdeAPI = formatDateForAPI(fechaDesde);
  const formattedFechaHastaAPI = formatDateHastaForAPI(fechaHasta);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const toInputDateFormat = (date) => {
    return date.toISOString().split("T")[0]; // "2025-04-29"
  };
  const handleFechaDesdeChange = (event, selectedDate) => {
    console.log("day", selectedDate);
    setShowPickerDesde(false);
    if (selectedDate) {
      setfechaDesde(selectedDate);
    }
  };
  const handleFechaHastaChange = (event, selectedDate) => {
    setShowPickerHasta(false);
    if (selectedDate) {
      setfechaHasta(selectedDate);
    }
  };
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemRow}>
        <Text style={styles.itemTitle}>{item.description}</Text>
        <Text style={styles.itemSubtitle}>Monto: ₡{item.amount}</Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={styles.itemSubtitle}>
          Fecha: {format(new Date(item.date), "dd/MM/yyyy", { locale: es })}
        </Text>
        <Text style={styles.itemSubtitle}>Comisión: ₡{item.comision || 0}</Text>
      </View>
      <View style={styles.itemRow}>
        <Text></Text>
        <Text style={styles.itemSubtitle}>
          Premios: ₡{item.price + item.revPrice}
        </Text>
      </View>
      <View style={styles.itemRow}>
        <Text></Text>
        <Text style={styles.itemSubtitle}>Subtotal: ₡{item.subTotal}</Text>
      </View>
      <View style={styles.itemRow}>
        <Text></Text>
        <Text style={styles.itemSubtitle}>
          Acumulado: ₡{item.acumulado || 0}
        </Text>
      </View>
      {item.cancelDebt && (
        <Text style={[styles.itemSubtitle, { color: "red" }]}>
          DEUDA CANCELADA
        </Text>
      )}
    </View>
  );

  useEffect(() => {
    const fetchDraws = async () => {
      console.log(
        `fetchDraws for userId: ${userData.id} fecha desde ${formattedFechaDesdeAPI} a fecha hasta ${formattedFechaHastaAPI}`,
      );
      try {
        const drawsResponse = await fetch(
          `http://147.182.248.177:3001/api/draw/consolidated/${formattedFechaDesdeAPI}/${formattedFechaHastaAPI}?userId=${userData.id}`,
        );
        const dataDraws = await drawsResponse.json();

        /** @type {mDraws[]} */
        let draws_history = [];

        if (Array.isArray(dataDraws)) {
          draws_history = dataDraws;
        } else {
          console.warn("⚠️ 'data draws' no es un array válido:", dataDraws);
        }

        const bankingResponse = await fetch(
          `http://147.182.248.177:3001/api/banking/byUser/${userData.id}/${formattedFechaDesdeAPI}/${formattedFechaHastaAPI}`,
        );
        const dataBanking = await bankingResponse.json();

        /** @type {mBanking[]} */
        let banking_history = [];

        if (Array.isArray(dataBanking)) {
          banking_history = dataBanking;
        } else {
          console.warn("⚠️ 'data banking' no es un array válido:", dataBanking);
        }

        /** @type {mHistory[]} */
        const history_history = [];

        if (draws_history && Array.isArray(draws_history)) {
          draws_history.forEach((draw) => {
            if (draw.consolidated && draw.priceNumber != null) {
              const history = {
                id: draw.id,
                isDraw: true,
                description: draw.name,
                date: draw.consolidatedDate,
                amount: draw.totalDraw || 0,
                price: draw.price,
                priceNumber: draw.priceNumber,
                subTotal: 0,
                cancelDebt: false,
                sellerPercent: draw.sellerPercent,
                revAmount: draw.totalRevDraw || 0,
                revPrice: draw.revPrice,
                revSellerPercent: draw.revSellerPercent,
                isPrizeRev: draw.isPrizeRev,
              };
              history_history.push(history);
            }
          });
        }

        if (banking_history && Array.isArray(banking_history)) {
          banking_history.forEach((banking) => {
            const history = {
              id: banking.id,
              isDraw: false,
              description: banking.description,
              date: banking.date,
              amount: banking.amount,
              price: 0,
              priceNumber: 0,
              subTotal: 0,
              cancelDebt: banking.cancelDebt,
              sellerPercent: 0,
              revAmount: 0,
              revPrice: 0,
              revSellerPercent: 0,
              isPrizeRev: false,
            };
            history_history.push(history);
          });
        }

        history_history.sort((a, b) => {
          return new Date(a.date) - new Date(b.date);
        });

        let ventaTotalFloat = 0;
        let comisionFloat = 0;
        let premiosFloat = 0;
        let total = 0;
        let acumulado = 0;
        let frezeTotalAmount = false;

        for (const history of history_history) {
          if (history.cancelDebt === false) {
            if (history.isDraw === true) {
              // Calcular comisión
              history.comision =
                history.amount * (history.sellerPercent / 100) +
                history.revAmount * (history.revSellerPercent / 100);

              // Calcular subtotal
              const subtotal =
                history.amount +
                history.revAmount -
                history.comision -
                history.price -
                history.revPrice;
              history.subTotal = subtotal;

              // Actualizar totales
              ventaTotalFloat += history.amount + history.revAmount;
              comisionFloat += history.comision;
              premiosFloat += history.price + history.revPrice;

              total += subtotal;
            } else {
              // Si no es Draw
              const subtotal = history.amount + history.revAmount;
              history.subTotal = subtotal;

              total += parseFloat(subtotal);
            }

            acumulado += parseFloat(history.subTotal);
            history.acumulado = acumulado;
          } else {
            // Cuando cancelDebt es true, reiniciamos valores
            history.subTotal = history.amount + history.revAmount;
            history.subTotal = 0;
            acumulado = 0;
            total = 0;
            frezeTotalAmount = true;
          }
        }

        console.log("History Ordenado con calculos:", history_history);
        console.log("History Total:", total);

        setTotal(total);

        history_history.reverse();

        setItems(history_history);
      } catch (error) {
        console.error("Error al obtener draws", error);
        Alert.alert("Error", "No se pudieron cargar los draws.");
      }
    };

    if (userData?.id) {
      fetchDraws();
    }
  }, [formattedFechaDesde, formattedFechaHasta, userData]);

  return (
    <View style={styles.container}>
      {/* Formulario y Lista */}
      <View style={[styles.formAndListContainer, isWeb && styles.webLayout]}>
        {/* Formulario */}
        <View style={[styles.formContainer, isWeb && styles.webFormContainer]}>
          <View style={styles.formRow}>
            {Platform.OS === "web" ? (
              <>
                <DatePickerWeb
                  value={fechaDesde}
                  onChange={(date) => handleFechaDesdeChange(null, date)}
                />
              </>
            ) : (
              // <input
              //   type="date"
              //   value={toInputDateFormat(fechaDesde)}
              //   onChange={(e) => {
              //     const newDate = new Date(e.target.value);
              //     if (!isNaN(newDate)) {
              //       handleFechaDesdeChange(null, newDate);
              //     }
              //   }}
              //   style={{
              //     ...styles.inputSmall,
              //     padding: 8,
              //     fontSize: 16,
              //     border: "none",
              //   }}
              // />
              <>
                <Pressable
                  onPress={() => setShowPickerDesde(true)}
                  style={styles.inputSmall}
                >
                  <Text>{formattedFechaDesde || "Fecha desde"}</Text>
                </Pressable>

                {showPickerDesde && (
                  <DateTimePicker
                    value={fechaDesde}
                    mode="date"
                    display={Platform.OS === "android" ? "calendar" : "default"}
                    onChange={handleFechaDesdeChange}
                  />
                )}
              </>
            )}

            {Platform.OS === "web" ? (
              <>
                <DatePickerWeb
                  value={fechaHasta}
                  onChange={(date) => handleFechaHastaChange(null, date)}
                />
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => setShowPickerHasta(true)}
                  style={styles.inputSmall}
                >
                  <Text>{formattedFechaHasta || "Fecha hasta"}</Text>
                </Pressable>

                {showPickerHasta && (
                  <DateTimePicker
                    value={fechaHasta}
                    mode="date"
                    display={Platform.OS === "android" ? "calendar" : "default"}
                    onChange={handleFechaHastaChange}
                  />
                )}
              </>
            )}
          </View>
        </View>

        {/* Lista */}
        <View style={[styles.listContainer, !isWeb && { marginTop: 0 }]}>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={{ marginTop: 0 }}
          />
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalBar}>
        <Text style={styles.totalText}>TOTAL: </Text>
        <Text
          style={[
            styles.totalValue,
            { color: total < 0 ? "red" : total > 0 ? "green" : "black" },
          ]}
        >
          ₡{total.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    justifyContent: "flex-start",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    paddingHorizontal: 4,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  dropdown: {
    position: "absolute",
    right: 16,
    top: 50,
    backgroundColor: "#fff",
    elevation: 5,
    borderRadius: 4,
  },
  menuItem: {
    padding: 12,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  formAndListContainer: {
    flexDirection: "column",
    marginTop: 20,
    flex: 1,
  },
  webLayout: {
    flexDirection: "row",
  },
  formContainer: {
    marginBottom: 20,
  },
  webFormContainer: {
    marginRight: 20,
  },
  listContainer: {
    flex: 1,
    maxHeight: 900, // puedes ajustar esto según el diseño deseado
  },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 0,
    borderTopWidth: 0,
    borderColor: "#eee",
  },
  itemRowRev: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemLeft: {
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 70,
  },
  itemRight: {
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 70,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 10,
  },
  inputSmall: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    backgroundColor: "#ccc",
    borderRadius: 8,
  },
  montoContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    height: 80,
    flex: 1,
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemTitle: { fontWeight: "bold" },
  itemSubtitle: { color: "#666" },
  totalBar: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  totalText: {
    fontWeight: "bold",
    fontSize: 20,
  },
  totalValue: {
    fontSize: 20,
    marginLeft: 4,
    fontWeight: "bold",
  },
});
