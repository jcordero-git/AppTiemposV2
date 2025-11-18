import React, { useCallback, useRef, useState, useEffect } from "react";
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
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Provider, Portal, Dialog, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
//import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { convertNumero, validateMonto } from "../utils/numeroUtils";
//mport { subMonths, addDays, format } from "date-fns";
import {
  subMonths,
  subWeeks,
  addDays,
  format,
  isAfter,
  isBefore,
} from "date-fns";
import DatePickerWeb from "../components/DatePickerWeb";
import Constants from "expo-constants";

import { es } from "date-fns/locale"; // idioma español
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../context/AuthContext";
import mDraws from "../models/mDraws";
import mBanking from "../models/mBanking";
import { toFloat } from "../utils/numeroUtils";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path
import {
  getInternetDate,
  toUTC,
  subWeeksLocal,
  toLocalMidnight,
  formatDate,
  formatDateLocal,
} from "../utils/datetimeUtils"; // ajusta el path si es necesario
let crashlytics;
if (Platform.OS !== "web") {
  crashlytics = require("@react-native-firebase/crashlytics").default;
}

export default function HistorialScreen({ navigation, route }) {
  //crashlytics().setAttributes({ screen: "historial" }); // atributos adicionales
  const { showSnackbar, showConfirm } = useSnackbar();
  const { userData, logout } = useAuth();
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";
  const [showPickerDesde, setShowPickerDesde] = useState(false);
  const [showPickerHasta, setShowPickerHasta] = useState(false);

  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;

  // 🔹 Estados para API (2 meses)
  const [apiDesde] = useState(subMonths(getInternetDate(), 2));
  const [apiHasta] = useState(getInternetDate());

  // Resta 2 semanas desde hoy
  const [fechaDesde, setfechaDesde] = useState(
    subWeeksLocal(getInternetDate(), 2),
  );
  const [fechaHasta, setfechaHasta] = useState(
    subWeeksLocal(getInternetDate(), 0),
  );
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPremiados, setLoadingPremiados] = useState(false);

  const [dialogTicketsPremiadosVisible, setDialogTicketsPremiadosVisible] =
    useState(false);
  const [tiemposPremiados, setTiemposPremiados] = useState([]);
  const [tiempoSeleccionado, setTiempoSeleccionado] = useState(null);

  useEffect(() => {
    if (Platform.OS !== "web" && crashlytics) {
      crashlytics().setAttributes({
        screen: "historial",
      });
      crashlytics().log("📌 Entrando a pantalla historial");
    }
  }, [userData, backend_url]);

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

  const [searchTicketId, setSearchTicketId] = React.useState("");
  // const tiemposFiltrados = tiemposPremiados.filter((item) =>
  //   item.ticketId?.toString().includes(searchTicketId),
  // );
  const tiemposFiltrados = tiemposPremiados
    .filter((item) => item.ticketId?.toString().includes(searchTicketId))
    .sort((a, b) => {
      // 1️⃣ Pendientes primero
      if (a.isPaid !== b.isPaid) {
        return a.isPaid ? 1 : -1; // Si a está pagado, va después
      }
      // 2️⃣ Luego orden por ticketId descendente
      return b.ticketId - a.ticketId;
    });

  // 🔹 Items completos desde API
  const [allItems, setAllItems] = useState([]);
  // 🔹 Items filtrados por los DatePickers
  const [items, setItems] = useState([]);

  const [total, setTotal] = useState(0);

  const toInputDateFormat = (date) => {
    return date.toISOString().split("T")[0]; // "2025-04-29"
  };
  const handleFechaDesdeChange = (event, selectedDate) => {
    setShowPickerDesde(false);
    console.log("event.type", event.type);
    if (event.type === "dismissed") return; // 🚫 ignorar cancel
    if (selectedDate) {
      setfechaDesde(selectedDate);
    }
  };
  const handleFechaHastaChange = (event, selectedDate) => {
    setShowPickerHasta(false);
    if (event.type === "dismissed") return; // 🚫 ignorar cancel
    if (selectedDate) {
      setfechaHasta(selectedDate);
    }
  };

  useEffect(() => {
    let ventaTotal = 0;
    let premiosTotal = 0;
    let comisionTotal = 0;

    for (const history of items) {
      if (!history.cancelDebt) {
        const amount = Number(history.amount) || 0;
        const revAmount = Number(history.revAmount) || 0;
        const price = Number(history.price) || 0;
        const revPrice = Number(history.revPrice) || 0;
        const sellerPercent = Number(history.sellerPercent) || 0;
        const revSellerPercent = Number(history.revSellerPercent) || 0;

        if (history.isDraw) {
          const comision =
            amount * (sellerPercent / 100) +
            revAmount * (revSellerPercent / 100);

          ventaTotal += amount + revAmount;
          premiosTotal += price + revPrice;
          comisionTotal += comision;
        }
      }
    }

    setVentaTotalFloat(ventaTotal);
    setpremiosTotalFloat(premiosTotal);
    setcomisionTotalFloat(comisionTotal);
  }, [items]);

  const renderItem = ({ item }) => {
    const itemBackgroundColor = item.cancelDebt ? "#ffe5e5" : "white"; // Rojo pálido si hay deuda cancelada
    return (
      <View style={styles.rowContainer}>
        {/* Columna izquierda */}
        <View style={styles.leftColumn}>
          <Text style={styles.titleText}>{item.description}</Text>
          <Text style={styles.dateText}>
            {format(new Date(item.date), "E dd/MM/yyyy", { locale: es })}
          </Text>
        </View>

        {/* Columna derecha */}
        <View style={styles.rightColumn}>
          <View style={styles.line}>
            <Text style={styles.label}>Monto:</Text>
            <Text style={styles.value}>
              ₡{Number(item.amount + item.revAmount).toFixed(0)}
            </Text>
          </View>

          {item.isDraw && (
            <View style={styles.line}>
              <Text style={styles.label}>Comisión:</Text>
              <Text style={styles.value}>₡{item.comision || 0}</Text>
            </View>
          )}

          {item.isDraw && (
            <View style={styles.line}>
              <Text style={styles.label}>Premios:</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.circleContainer}>
                  <View
                    style={[
                      styles.circle,
                      {
                        backgroundColor: item.isPrizeRev ? "#e53935" : "white",
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.circleText,
                        { lineHeight: 22, textAlignVertical: "center" }, // 👈 fuerza al texto a estar centrado
                      ]}
                    >
                      #{convertNumero(parseInt(`${item.priceNumber}`))}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => openDialogTicketsPremiados(item.id)}
                  style={{ marginLeft: 10, justifyContent: "center" }} // 👈 centra el icono respecto al círculo
                >
                  <MaterialIcons
                    name="remove-red-eye"
                    size={22}
                    color="green"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.value}>
                ₡{Number(item.price + item.revPrice).toFixed(0)}
              </Text>
            </View>
          )}

          <View style={styles.line}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text
              style={[
                styles.value,
                {
                  color: Number(item.subTotal) < 0 ? "red" : "green",
                },
              ]}
            >
              ₡{Number(item.subTotal).toFixed(0)}
            </Text>
          </View>

          <View style={styles.line}>
            <Text style={styles.label}>Acumulado:</Text>
            <Text
              style={[
                styles.value,
                {
                  color: Number(item.acumulado) < 0 ? "red" : "green",
                },
              ]}
            >
              ₡
              {isNaN(Number(item.acumulado))
                ? 0
                : Number(item.acumulado).toFixed(0)}
            </Text>
          </View>

          {/* {item.cancelDebt && (
            <Text
              style={[
                styles.value,
                { color: "red", fontWeight: "bold", marginTop: 4 },
              ]}
            >
              DEUDA CANCELADA
            </Text>
          )} */}
        </View>
      </View>
    );
  };

  // 🔹 MÉTODOS DEL DIÁLOGO
  const openDialog = () => {
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
  };

  const closeDialogTicketsPremiados = () => {
    setDialogTicketsPremiadosVisible(false);
  };

  const openDialogTicketsPremiados = (drawCategoryId) => {
    Keyboard.dismiss(); // Oculta el teclado
    const actualizaTiemposVendidos = async () => {
      const { tiemposVendidos, lastTicketNumber } =
        await fetchTiemposPremiados(drawCategoryId);
    };
    actualizaTiemposVendidos();
    setDialogTicketsPremiadosVisible(true);
  };

  const fetchTiemposPremiados = async (drawCategoryId) => {
    try {
      setLoading(true); // ⬅️ activar loading
      if (drawCategoryId === 0) {
        setTiemposPremiados([]);
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }
      const apkVersion =
        Constants.manifest?.version || Constants.expoConfig?.version;
      const response = await fetch(
        `${backend_url}/api/ticketPrize/draw/${drawCategoryId}?token=${userData.token}`,
        {
          method: "GET",
          headers: {
            //"x-access-token": `${token}`,
            "Content-Type": "application/json",
            "jj-apk-version": apkVersion,
          },
        },
      );
      if (response.status === 403) {
        showSnackbar("⚠️ El usuario no tiene permisos.", 3);
        logout();
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }

      if (response.status !== 200) {
        console.warn(`⚠️ Error al obtener tiempos: Status ${response.status}`);
        showSnackbar(
          "⚠️ Error al obtener tiempos vendidos, recargue la pantalla",
          3,
        );
        setTiemposPremiados([]);
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }

      const data = await response.json();
      const sortedData = data.data.sort((a, b) => b.ticketId - a.ticketId);
      console.log("sorted", sortedData);
      setTiemposPremiados(sortedData);
      const ticketNumbers = sortedData
        .map((item) => item.ticketId)
        .filter((n) => typeof n === "number" && n > 0);

      const lastTicketNumber =
        ticketNumbers.length > 0 ? Math.max(...ticketNumbers) : 0;

      return {
        tiemposVendidos: sortedData,
        lastTicketNumber,
      };
    } catch (error) {
      console.error("Error al cargar tiempos anteriores:", error);
      setTiemposPremiados([]);
      return [[], 0]; // ✅ fallback seguro
    } finally {
      setLoading(false); // ⬅️ desactivar loading siempre
    }
  };

  const markTicketAsPaid = async (ticket) => {
    try {
      // Clonamos el objeto y cambiamos isPaid a true
      const updatedTicket = {
        ...ticket,
        isPaid: true,
        paymentMethod: "Efectivo",
      };

      console.log("Ticket a pagar: ", updatedTicket);

      const response = await fetch(
        `${backend_url}/api/ticketPrize/${ticket.id}?token=${userData.token}`,
        {
          method: "PUT", // o POST según tu API
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTicket),
        },
      );

      if (response.status !== 200) {
        showSnackbar("⚠️ Error al marcar como pagado", 3);
        console.warn("Error al pagar ticket:", response.status);
        return;
      }

      showSnackbar("✅ Ticket marcado como pagado", 1);

      // Refrescamos la lista
      await fetchTiemposPremiados(ticket.drawId);
    } catch (error) {
      console.error("Error al actualizar ticket:", error);
      showSnackbar("⚠️ Error de conexión al marcar como pagado", 3);
    }
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
  // Filtrar en memoria cada vez que cambian los pickers o los datos
  useEffect(() => {
    if (allItems.length > 0) {
      // console.log("All Items", allItems);
      const fechaDesdeLocal = toLocalMidnight(fechaDesde);
      const fechaHastaLocal = toLocalMidnight(fechaHasta);

      const filtered = allItems.filter((item) => {
        const itemDate = toLocalMidnight(new Date(item.date));
        return itemDate >= fechaDesdeLocal && itemDate <= fechaHastaLocal;
      });
      setItems(filtered);
    }
    // console.log("fechaDesdeLocal", toLocalMidnight(fechaDesde));
    // console.log("fechaHastaLocal", toLocalMidnight(fechaHasta));
  }, [allItems, fechaDesde, fechaHasta]);

  const actualizaDesdeHeader = useCallback(() => {
    async function execute() {
      if (!fechaDesde || !fechaHasta || !userData?.id) return;
      const updated = await fetchDraws();
      if (updated) {
        //showSnackbar("Historial Actualizado Correctamente.", 1);
      } else {
        showSnackbar("Error al intentar actualizar el historial.", 3);
      }
    }
    (async () => {
      try {
        setLoading(true);
        await execute();
      } catch (err) {
        console.error("Error al intentar actualizar el historial.");
        showSnackbar("Error al intentar actualizar el historial.", 3);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchDraws_old = async () => {
    const desde = formatDateForAPI(fechaDesde);
    const hasta = formatDateHastaForAPI(fechaHasta);

    try {
      const drawsResponse = await fetch(
        `${backend_url}/api/draw/consolidated/${desde}/${hasta}?userId=${userData.id}`,
      );
      const dataDraws = await drawsResponse.json();

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

      // setVentaTotalFloat(0);
      // setcomisionTotalFloat(0);
      // setpremiosTotalFloat(0);
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

            // setVentaTotalFloat(
            //   (prev) => prev + history.amount + history.revAmount,
            // );
            // setpremiosTotalFloat(
            //   (prev) => prev + history.price + history.revPrice,
            // );
            // setcomisionTotalFloat((prev) => prev + history.comision);

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

  const fetchDraws = async () => {
    // const desde = formatDateForAPI(fechaDesde);
    // const hasta = formatDateHastaForAPI(fechaHasta);
    const hoy = new Date();
    const desde = formatDate(apiDesde, "yyyy-MM-dd");
    const hasta = formatDate(addDays(hoy, 1), "yyyy-MM-dd");

    try {
      const drawsResponse = await fetch(
        `${backend_url}/api/draw/consolidated/${desde}/${hasta}?userId=${userData.id}`,
      );
      const dataDraws = await drawsResponse.json();

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

      let banking_history = [];

      if (Array.isArray(dataBanking)) {
        banking_history = dataBanking.map(
          (banckingData) => new mBanking(banckingData),
        );
      } else {
        console.warn("⚠️ 'data banking' no es un array válido:", dataBanking);
      }

      const history_history = [];

      for (const draw of draws_history) {
        if (draw.consolidated && draw.priceNumber != null) {
          history_history.push({
            id: draw.id,
            isDraw: true,
            description: draw.name,
            date: draw.consolidatedDate,
            amount: toFloat(draw.getTotalDraw()) || 0,
            price: toFloat(draw.price) || 0,
            priceNumber: draw.priceNumber,
            subTotal: 0,
            cancelDebt: false,
            sellerPercent: toFloat(draw.sellerPercent) || 0,
            revAmount: toFloat(draw.getTotalRevDraw()) || 0,
            revPrice: toFloat(draw.revPrice) || 0,
            revSellerPercent: toFloat(draw.revSellerPercent) || 0,
            isPrizeRev: draw.isPrizeRev,
          });
        }
      }

      for (const banking of banking_history) {
        history_history.push({
          id: banking.id,
          isDraw: false,
          description: banking.description,
          date: banking.date,
          amount: toFloat(banking.amount) || 0,
          price: 0,
          priceNumber: 0,
          subTotal: 0,
          cancelDebt: banking.cancelDebt,
          sellerPercent: 0,
          revAmount: 0,
          revPrice: 0,
          revSellerPercent: 0,
          isPrizeRev: false,
        });
      }

      history_history.sort((a, b) => new Date(a.date) - new Date(b.date));

      let ventaTotal = 0;
      let premiosTotal = 0;
      let comisionTotal = 0;
      let total = 0;
      let acumulado = 0;

      for (const history of history_history) {
        if (!history.cancelDebt) {
          const amount = Number(history.amount) || 0;
          const revAmount = Number(history.revAmount) || 0;
          const price = Number(history.price) || 0;
          const revPrice = Number(history.revPrice) || 0;
          const sellerPercent = Number(history.sellerPercent) || 0;
          const revSellerPercent = Number(history.revSellerPercent) || 0;

          if (history.isDraw) {
            const comision =
              amount * (sellerPercent / 100) +
              revAmount * (revSellerPercent / 100);

            const subtotal = amount + revAmount - comision - price - revPrice;

            history.comision = comision;
            history.subTotal = subtotal;

            ventaTotal += amount + revAmount;
            premiosTotal += price + revPrice;
            comisionTotal += comision;
            total += subtotal;
          } else {
            const subtotal = amount + revAmount;
            history.subTotal = subtotal;
            total += subtotal;
          }

          acumulado += history.subTotal;
          history.acumulado = acumulado;
        } else {
          history.subTotal = 0;
          acumulado = 0;
          total = 0;
        }
      }

      setVentaTotalFloat(ventaTotal);
      setpremiosTotalFloat(premiosTotal);
      setcomisionTotalFloat(comisionTotal);
      setTotal(Number(total) || 0);
      //setItems([...history_history].reverse());
      setAllItems([...history_history].reverse());

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
                  <View style={styles.datePickerWrapper}>
                    <DatePickerWeb
                      value={fechaDesde}
                      style={{ flex: 1, maxWidth: "1000px", minWidth: 0 }} // 🔹 rompe el max-width interno
                      onChange={(date) => {
                        //handleFechaDesdeChange(null, date);
                        setfechaDesde(date);
                      }}
                    />
                  </View>
                </>
              ) : (
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
                  <View style={styles.datePickerWrapper}>
                    <DatePickerWeb
                      value={fechaHasta}
                      onChange={(date) => {
                        //handleFechaHastaChange(null, date);
                        setfechaHasta(date);
                      }}
                    />
                  </View>
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
              keyExtractor={(item) => item.id.toString()}
              style={{ marginTop: 0 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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

        {/* Diálogo Tiempos Premiados */}
        <Dialog
          visible={dialogTicketsPremiadosVisible}
          onDismiss={closeDialogTicketsPremiados}
          style={[
            {
              backgroundColor: "white",
              borderRadius: 10,
              marginHorizontal: 20,
            },
            isWeb && {
              position: "absolute",
              right: 0,
              top: 10,
              width: 400,
              maxHeight: "90%",
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
          ]}
        >
          <Dialog.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <MaterialIcons
                name="format-list-numbered"
                size={35}
                color="#000"
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontWeight: "bold",
                  color: "#000",
                  fontSize: 18,
                }}
              >
                TIEMPOS PREMIADOS
              </Text>
            </View>

            {loading ? (
              // ⬅️ Spinner mientras carga
              <View
                style={{
                  height: 200,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="green" />
                <Text style={{ marginTop: 10 }}>
                  Cargando tiempos Premiados...
                </Text>
              </View>
            ) : (
              // ⬅️ tu lista normal

              <View style={{ maxHeight: height * 0.6 }}>
                <TextInput
                  placeholder="Buscar por código..."
                  value={searchTicketId}
                  onChangeText={setSearchTicketId}
                  style={{
                    marginHorizontal: 10,
                    marginBottom: 8,
                    padding: 8,
                    borderBottomWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 3,
                    fontSize: 14,
                    backgroundColor: "#fff",
                  }}
                />

                <ScrollView
                  contentContainerStyle={{
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                  }}
                >
                  {tiemposFiltrados.map((item, index) => {
                    const esSeleccionado =
                      tiempoSeleccionado?.ticketId === item.ticketId;

                    return (
                      <View
                        key={item.ticketId || index}
                        style={{
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: "#eee",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          position: "relative", // Necesario para que el sello se posicione sobre este contenedor
                          overflow: "hidden",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ fontWeight: "bold" }}>
                              Código: # {item.ticketId || ""}
                            </Text>
                            <Text style={{ fontWeight: "bold" }}>
                              Premiado: #{" "}
                              {convertNumero(
                                parseInt(`${item.winningNumber}`),
                              ) || ""}
                            </Text>
                          </View>

                          <Text style={{ fontWeight: "bold" }}>
                            Cliente: {item.ticket.clientName || "Sin nombre"}
                          </Text>
                          <Text style={{ color: "#555" }}>
                            Fecha:{" "}
                            {formatDateLocal(
                              item.updatedAt,
                              "dd/MM/yyy hh:mm:ss a",
                            )}
                          </Text>

                          <Text>Premio: {item.normalPrize}</Text>
                          {item.isReventado && (
                            <Text>Premio Reventado: {item.reventadoPrize}</Text>
                          )}
                          <Text style={{ fontWeight: "bold" }}>
                            Premio Total a pagar: {item.totalPrize}
                          </Text>

                          {/* Estado solo si está pendiente */}
                          {/* {!item.isPaid && (
                          <Text
                            style={{
                              marginTop: 5,
                              fontWeight: "bold",
                              color: "red",
                              alignSelf: "flex-end",
                            }}
                          >
                            Pendiente de pago
                          </Text>
                        )} */}

                          {/* Botón pagar si está pendiente */}
                          {!item.isPaid && (
                            <Button
                              mode="contained"
                              textColor="green"
                              style={{
                                marginTop: 5,
                                borderRadius: 3,
                                backgroundColor: "white",
                                alignSelf: "flex-end",
                              }}
                              onPress={() => {
                                showConfirm({
                                  message: `¿Pagar el ticket # ${item.ticketId} ?`,
                                  onConfirm: () => markTicketAsPaid(item),
                                });
                              }}
                            >
                              PAGAR
                            </Button>
                          )}
                        </View>

                        {/* {esSeleccionado && (
                        <MaterialIcons
                          name="check-circle"
                          size={24}
                          color="green"
                        />
                      )} */}

                        {/* Sello ANULADO diagonal */}
                        {item.isPaid === true && (
                          <View
                            style={{
                              position: "absolute",
                              top: "60%",
                              right: "-15%",
                              transform: [{ rotate: "-30deg" }],
                              backgroundColor: "rgba(76, 175, 80, 0.2)",
                              paddingHorizontal: 85,
                              paddingVertical: 5,
                              zIndex: -10,
                            }}
                          >
                            <Text
                              style={{
                                color: "green",
                                fontWeight: "bold",
                                fontSize: 18,
                                letterSpacing: 2,
                                textTransform: "uppercase",
                              }}
                            >
                              PAGADO
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Contadores en columna con fuente monoespaciada */}
            <View style={{ flexDirection: "column" }}>
              <Text
                style={{
                  fontWeight: "bold",
                  color: "green",
                  fontFamily: "monospace",
                }}
              >
                Pagados : {tiemposPremiados.filter((t) => t.isPaid).length}
              </Text>
              <Text
                style={{
                  fontWeight: "bold",
                  color: "red",
                  fontFamily: "monospace",
                }}
              >
                Pendientes: {tiemposPremiados.filter((t) => !t.isPaid).length}
              </Text>
            </View>

            {/* Botón cerrar */}
            <Button
              textColor="red"
              style={{
                backgroundColor: "white",
                borderRadius: 3,
              }}
              onPress={closeDialogTicketsPremiados}
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
    minWidth: 410,
  },
  listContainer: {
    flex: 1,
    maxHeight: 900, // puedes ajustar esto según el diseño deseado
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "center", // 🔹 centra todo el bloque
    alignItems: "center",
    gap: 16, // espacio entre ellos
    marginBottom: 10,
  },
  datePickerWrapper: {
    flex: 1, // 🔹 ambos ocupan el mismo ancho
    maxWidth: 250, // opcional para que no se estiren demasiado en web
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
  // label: {
  //   padding: 8,
  //   marginBottom: 10,
  //   fontWeight: "bold",
  //   minWidth: 140,
  //   marginTop: 0,
  //   textAlign: "center",
  //   width: 140,
  // },
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
  itemSubtitle: { color: "#666", fontWeight: "normal" },
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

  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },

  leftColumn: {
    flex: 1,
    paddingRight: 10,
  },

  rightColumn: {
    flex: 1.5,
  },

  titleText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#000",
    marginBottom: 2,
  },

  dateText: {
    fontSize: 13,
    color: "#333",
  },

  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    alignItems: "center",
    minHeight: 20,
  },

  label: {
    fontSize: 13,
    color: "#333",
    flex: 1,
    fontWeight: "bold",
  },

  value: {
    fontSize: 13,
    color: "#000",
    textAlign: "right",
    flex: 1,
  },
});
