import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  useWindowDimensions,
  Alert,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { Provider, Portal, Dialog, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
//import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { subMonths, addDays, format } from "date-fns";
import DatePickerWeb from "../components/DatePickerWeb";

import { es } from "date-fns/locale"; // idioma español
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../context/AuthContext";
import mDraws from "../models/mDraws";
import mBanking from "../models/mBanking";
import { toFloat } from "../utils/numeroUtils";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path
import { getInternetDate, formatDate } from "../utils/datetimeUtils"; // ajusta el path si es necesario

export default function HistorialScreen({ navigation, route }) {
  const { showSnackbar } = useSnackbar();
  console.log("🎯 RENDER Historial Screen");
  const { userData } = useAuth();
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";
  const [showPickerDesde, setShowPickerDesde] = useState(false);
  const [showPickerHasta, setShowPickerHasta] = useState(false);

  const { width } = useWindowDimensions();
  const isWeb = width > 710;

  // Resta 2 meses desde hoy
  const [fechaDesde, setfechaDesde] = useState(subMonths(getInternetDate(), 2));
  const [fechaHasta, setfechaHasta] = useState(subMonths(getInternetDate(), 0));
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDateForAPI = (fecha) => {
    try {
      return formatDate(fecha, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error al formatear la fecha:", error);
      return "";
    }
  };
  const formatDateHastaForAPI = (fecha) => {
    try {
      const fechaAumentada = addDays(fecha, 1);
      return formatDate(fechaAumentada, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error al formatear la fecha hasta:", error);
      return "";
    }
  };

  const formattedFechaDesde = formatDate(fechaDesde, "EE dd/MM/yyyy");
  const formattedFechaHasta = formatDate(fechaHasta, "EE dd/MM/yyyy");
  //const formattedFechaDesdeAPI = formatDateForAPI(fechaDesde);
  //const formattedFechaHastaAPI = formatDateHastaForAPI(fechaHasta);

  //let ventaTotalFloat = 0;
  const [ventaTotalFloat, setVentaTotalFloat] = useState(0);
  const [comisionTotalFloat, setcomisionTotalFloat] = useState(0);
  const [premiosTotalFloat, setpremiosTotalFloat] = useState(0);

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
  const renderItem = ({ item }) => {
    const itemBackgroundColor = item.cancelDebt ? "#ffe5e5" : "white"; // Rojo pálido si hay deuda cancelada

    return (
      <View
        style={[
          styles.item,
          {
            backgroundColor: itemBackgroundColor,
            borderRadius: 5,
            margin: 2,
            padding: 3,
          },
        ]}
      >
        <View style={styles.itemRow}>
          <Text style={styles.itemTitle}>{item.description}</Text>
          <Text style={styles.itemSubtitle}>
            Monto: ₡{Number(item.amount + item.revAmount).toFixed(0)}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemSubtitle}>
            Fecha: {format(new Date(item.date), "dd/MM/yyyy", { locale: es })}
          </Text>
          {item.isDraw && (
            <Text style={styles.itemSubtitle}>
              Comisión: ₡{item.comision || 0}
            </Text>
          )}
        </View>
        {item.isDraw && (
          <View style={styles.itemRow}>
            <Text></Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: item.isPrizeRev ? "#e53935" : "white", // Rojo o blanco
                  },
                ]}
              >
                <Text style={styles.circleText}>#{item.priceNumber}</Text>
              </View>
              <Text style={styles.itemSubtitle}>
                Premios: ₡{Number(item.price + item.revPrice).toFixed(0)}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.itemRow}>
          <Text></Text>
          <Text style={styles.itemSubtitle}>
            Subtotal: ₡{Number(item.subTotal).toFixed(0)}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Text></Text>
          <Text style={styles.itemSubtitle}>
            Acumulado: ₡{item.acumulado || 0}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Text></Text>
          {item.cancelDebt && (
            <Text
              style={[
                styles.itemSubtitle,
                { color: "red", fontWeight: "bold" },
              ]}
            >
              DEUDA CANCELADA
            </Text>
          )}
        </View>
      </View>
    );
  };

  // 🔹 MÉTODOS DEL DIÁLOGO
  const openDialog = () => {
    console.log("Abriendo diálogo");
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "HISTORIAL",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <>
          <MaterialIcons
            name="refresh"
            size={24}
            color="#fff"
            style={{ marginRight: 20 }}
            onPress={() => {
              actualizaDesdeHeader();
            }}
          />
          <MaterialIcons
            name="monetization-on"
            size={24}
            color="#fff"
            style={{ marginRight: 20 }}
            onPress={() => {
              openDialog();
            }}
          />
        </>
      ),
    });
  }, [navigation, fechaDesde, fechaHasta]);

  useFocusEffect(
    useCallback(() => {
      actualizaDesdeHeader();
    }, [fechaDesde, fechaHasta, userData]),
  );

  useEffect(() => {
    if (userData?.id) {
      actualizaDesdeHeader();
    }
  }, [fechaDesde, fechaHasta, userData]);

  const actualizaDesdeHeader = useCallback(() => {
    async function execute() {
      if (!fechaDesde || !fechaHasta || !userData?.id) return;
      const updated = await fetchDraws();
      console.log("Actualizada?: ", updated);
      if (updated) {
        console.log("Historial Actualizado Correctamente.");
        showSnackbar("Historial Actualizado Correctamente.", 1);
      } else {
        console.log("Error al intentar actualizar el historial.");
        showSnackbar("Error al intentar actualizar el historial.", 3);
      }
    }
    (async () => {
      try {
        setLoading(true);
        console.log("muestra loading.");
        await execute();
      } catch (err) {
        console.log("Error al intentar actualizar el historial.");
        showSnackbar("Error al intentar actualizar el historial.", 3);
      } finally {
        setLoading(false);
      }
    })();
  }, [fechaDesde, fechaHasta, userData]);

  const fetchDraws = async () => {
    const desde = formatDateForAPI(fechaDesde);
    const hasta = formatDateHastaForAPI(fechaHasta);

    console.log(
      `fetchDraws for userId: ${userData.id} fecha desde ${desde} a fecha hasta ${hasta}`,
    );
    try {
      const drawsResponse = await fetch(
        `${backend_url}/api/draw/consolidated/${desde}/${hasta}?userId=${userData.id}`,
      );
      const dataDraws = await drawsResponse.json();
      console.log("dataDraws api: ", dataDraws);

      let draws_history = [];

      if (Array.isArray(dataDraws)) {
        draws_history = dataDraws.map((drawData) => new mDraws(drawData));
      } else {
        console.warn("⚠️ 'data draws' no es un array válido:", dataDraws);
      }

      const bankingResponse = await fetch(
        `${backend_url}/api/banking/byUser/${userData.id}/${desde}/${hasta}`,
      );
      const dataBanking = await bankingResponse.json();
      console.log("dataBanking api: ", dataBanking);

      let banking_history = [];

      if (Array.isArray(dataBanking)) {
        banking_history = dataBanking.map(
          (banckingData) => new mBanking(banckingData),
        );
      } else {
        console.warn("⚠️ 'data banking' no es un array válido:", dataBanking);
      }

      ///** @type {mHistory[]} */
      const history_history = [];

      if (draws_history && Array.isArray(draws_history)) {
        draws_history.forEach((draw) => {
          console.log("SORTEO: ", draw);
          console.log("MOVIMIENTO revPrice: ", draw.revPrice);
          if (draw.consolidated && draw.priceNumber != null) {
            const history = {
              id: draw.id,
              isDraw: true,
              description: draw.name,
              date: draw.consolidatedDate,
              amount: draw.getTotalDraw() || 0,
              price: toFloat(draw.price),
              priceNumber: draw.priceNumber,
              subTotal: "test",
              cancelDebt: false,
              sellerPercent: draw.sellerPercent,
              revAmount: draw.getTotalRevDraw() || 0,
              revPrice: draw.revPrice,
              revSellerPercent: draw.revSellerPercent,
              isPrizeRev: draw.isPrizeRev,
            };
            console.log("SORTEO FORMATED : ", history);
            history_history.push(history);
          }
        });
      }

      if (banking_history && Array.isArray(banking_history)) {
        banking_history.forEach((banking) => {
          console.log("MOVIMIENTO: ", banking);
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

      setVentaTotalFloat(0);
      setcomisionTotalFloat(0);
      setpremiosTotalFloat(0);
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

            console.log("MOVIMIENTO amount: ", history.amount);
            console.log("MOVIMIENTO revAmount: ", history.revAmount);
            console.log("MOVIMIENTO comision: ", history.comision);
            console.log("MOVIMIENTO price: ", history.price);
            console.log("MOVIMIENTO revPrice: ", history.revPrice);

            console.log("MOVIMIENTO SUB TOTAL: ", history.subTotal);

            // Actualizar totales
            //ventaTotalFloat += history.amount + history.revAmount;
            setVentaTotalFloat(
              (prev) => prev + history.amount + history.revAmount,
            );
            setpremiosTotalFloat(
              (prev) => prev + history.price + history.revPrice,
            );
            setcomisionTotalFloat((prev) => prev + history.comision);

            console.log("VENTA TOTAL: ", ventaTotalFloat);

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
      return true;
    } catch (error) {
      console.error("Error al obtener draws", error);
      Alert.alert("Error", "No se pudieron cargar los draws.");
      return false;
    }
  };

  return (
    <Provider>
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

        {/* Formulario y Lista */}
        <View style={[styles.formAndListContainer, isWeb && styles.webLayout]}>
          {/* Formulario */}
          <View
            style={[styles.formContainer, isWeb && styles.webFormContainer]}
          >
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
                      display={
                        Platform.OS === "android" ? "calendar" : "default"
                      }
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
                      display={
                        Platform.OS === "android" ? "calendar" : "default"
                      }
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
          <View style={{ flexDirection: "row", width: "100%" }}>
            <View style={{ flex: 1 }}>
              {total > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: "green",
                      borderRadius: 4,
                    }}
                  />
                  <Text style={{ marginLeft: 4, fontSize: 20 }}>DEBO</Text>
                </View>
              )}
              {total < 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 4,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: "red",
                      borderRadius: 4,
                    }}
                  />
                  <Text style={{ marginLeft: 4, fontSize: 20 }}>ME DEBEN</Text>
                </View>
              )}
              {total === 0 && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: "black",
                      borderRadius: 4,
                    }}
                  />
                  <Text style={{ marginLeft: 4, fontSize: 20 }}>SIN DEUDA</Text>
                </View>
              )}
            </View>
            <View style={styles.totalTextGroup}>
              <Text style={styles.totalText}>TOTAL: </Text>
              <Text
                style={[
                  styles.totalValue,
                  { color: total < 0 ? "red" : total > 0 ? "green" : "black" },
                ]}
              >
                ₡{total.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Portal>
        {/* Diálogo Comision */}
        <Dialog
          visible={dialogVisible}
          onDismiss={closeDialog}
          style={[
            {
              backgroundColor: "white", // Fondo blanco
              borderRadius: 10, // Bordes redondeados
              marginHorizontal: 20, // Margen lateral
            },
            isWeb && {
              position: "absolute",
              right: 0,
              top: 10,
              width: 400,
              maxHeight: "90%",
              elevation: 4, // sombra en Android
              shadowColor: "#000", // sombra en iOS
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
          ]}
        >
          {/* <Dialog.Title style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.row}>
              <MaterialIcons name="qr-code" size={35} color="#000" />
              <Text
                style={{ marginLeft: 8, fontWeight: "bold", color: "#000" }}
              >
                CATEGORÍAS PREDETERMINADAS
              </Text>
            </View>
          </Dialog.Title> */}
          <Dialog.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <MaterialIcons name="qr-code" size={35} color="#000" />
              <Text
                style={{
                  marginLeft: 8,
                  fontWeight: "bold",
                  color: "#000",
                  fontSize: 18,
                }}
              >
                INFORMACIÓN
              </Text>
            </View>
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center", // opcional: centra verticalmente también
                  pointerEvents: "none",
                }}
              >
                <TextInput
                  placeholder="Desde"
                  value={formattedFechaDesde}
                  keyboardType="numeric"
                  editable={false}
                  disabled={false}
                  style={[
                    styles.input,
                    {
                      textAlign: "center",
                      width: 140,
                      marginRight: 10,
                      padding: 8,
                    },
                  ]}
                />
                <TextInput
                  placeholder="Hasta"
                  value={formattedFechaHasta}
                  keyboardType="numeric"
                  editable={false}
                  disabled={false}
                  style={[
                    styles.input,
                    {
                      marginTop: 0,
                      textAlign: "center",
                      width: 140,
                      padding: 8,
                    },
                  ]}
                />
              </View>
              <View style={{ alignItems: "center", marginTop: 10 }}>
                {/* Línea: Venta */}
                <View style={{ flexDirection: "row", marginBottom: 4 }}>
                  <Text style={styles.labelLeft}>VENTA:</Text>
                  <Text style={styles.labelRight}>
                    ₡{ventaTotalFloat.toFixed(0)}
                  </Text>
                </View>

                {/* Línea: Comisión */}
                <View style={{ flexDirection: "row", marginBottom: 4 }}>
                  <Text style={styles.labelLeft}>COMISIÓN:</Text>
                  <Text style={styles.labelRight}>
                    ₡{comisionTotalFloat.toFixed(0)}
                  </Text>
                </View>

                {/* Línea: Premios */}
                <View style={{ flexDirection: "row", marginBottom: 4 }}>
                  <Text style={styles.labelLeft}>PREMIOS:</Text>
                  <Text style={styles.labelRight}>
                    ₡{premiosTotalFloat.toFixed(0)}
                  </Text>
                </View>
              </View>
            </>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="red"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={closeDialog}
            >
              CERRAR
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Provider>
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
    margin: 4,
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
  label: {
    padding: 8,
    marginBottom: 10,
    fontWeight: "bold",
    minWidth: 140,
    marginTop: 0,
    textAlign: "center",
    width: 140,
  },
  labelLeft: {
    padding: 8,
    marginBottom: 10,
    fontWeight: "bold",
    minWidth: 140,
    marginTop: 0,
    textAlign: "left",
    width: 140,
  },
  labelRight: {
    padding: 8,
    marginBottom: 10,
    fontWeight: "bold",
    minWidth: 140,
    marginTop: 0,
    textAlign: "right",
    width: 140,
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
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  totalTextGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 8, // si usas React Native >= 0.71, si no, usa marginRight
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
  circle: {
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
    // Sombra en iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,

    // Sombra en Android
    elevation: 4,
  },
  circleText: {
    color: "black",
    fontSize: 10,
    fontWeight: "bold",
  },
});
