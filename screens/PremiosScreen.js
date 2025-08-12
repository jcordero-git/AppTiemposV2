import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { Divider, Provider } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSnackbar } from "../context/SnackbarContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerWeb from "../components/DatePickerWeb";
import mSorteo from "../models/mSorteoSingleton.js";
import SorteoSelectorModal from "../components/SorteoSelectorModal";
import { formatDate } from "../utils/datetimeUtils";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import mFechaSeleccionada from "../models/mFechaSeleccionadaSingleton.js";
import PrinterUtils from "../utils/print/printerUtils";

export default function PremiosScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWeb = width > 710;
  const { showSnackbar } = useSnackbar();
  const [modalVisible, setModalVisible] = useState(false);

  const { userData, logout, ticketProfile } = useAuth();
  const token = userData.token;
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";

  const [sorteoNombre, setSorteoNombre] = useState("");
  const [sorteoId, setSorteoId] = useState(null);
  const [fecha, setFecha] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = formatDate(fecha, "EE dd/MM/yyyy");
  const [numero, setNumero] = useState("");
  const numeroRef = useRef(null);

  // 🔹 Ahora es un useRef
  const tiemposAnterioresRef = useRef([]);

  const [colorIndex, setColorIndex] = useState(0);
  const colors = ["white", "red"];
  const currentColor = colors[colorIndex];
  const toggleColor = () => setColorIndex((prev) => (prev + 1) % colors.length);

  const tiemposFiltrados =
    numero.trim().length === 2
      ? tiemposAnterioresRef.current
          .filter((item) =>
            item.numbers?.some((n) => n.numero === numero.trim()),
          )
          .map((item) => {
            const numeroCoincidente = item.numbers.find(
              (n) => n.numero === numero.trim(),
            );
            const monto = numeroCoincidente?.monto || 0;
            const prizeTimes = mSorteo?.userValues.prizeTimes || 0;
            const premio = monto * prizeTimes;
            const isReventado = currentColor === "red";
            const montoReventado = isReventado
              ? numeroCoincidente?.montoReventado || 0
              : 0;
            const revPrizeTimes = isReventado
              ? mSorteo?.userValues.revPrizeTimes || 0
              : 0;
            const revPremio = montoReventado * revPrizeTimes;

            return {
              ...item,
              monto,
              prizeTimes,
              premio,
              montoReventado,
              revPrizeTimes,
              revPremio,
            };
          })
      : [];

  const total = tiemposFiltrados?.reduce((sum, item) => {
    const premio = parseFloat(item.premio) || 0;
    const revPremio = parseFloat(item.revPremio) || 0;
    return sum + (currentColor === "red" ? premio + revPremio : premio);
  }, 0);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "PREMIOS",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <TouchableOpacity onPress={handlePrintBt} style={{ marginRight: 16 }}>
          <MaterialIcons name="print" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, tiemposFiltrados, total, numero, currentColor]);

  const handlePrintBt = async () => {
    try {
      if (Platform.OS === "android") {
        const mac = ticketProfile.lastPrinterMacAddress;
        try {
          await PrinterUtils.connectToDevice(mac);
        } catch {
          showSnackbar(
            "Impresora no encontrada. Por favor empareje desde ajustes.",
            3,
          );
          return;
        }
        await PrinterUtils.printPremios({
          items: tiemposFiltrados,
          total,
          sorteoSeleccionado: mSorteo,
          vendedorData: userData,
          ticketProfile,
          numeroPremiado: numero,
          reventado: currentColor === "red",
        });
        await PrinterUtils.disconnect();
      }
    } catch (e) {
      console.error("Error al imprimir:", e);
      showSnackbar(
        "Hubo un error al imprimir. Revisa la conexión con la impresora.",
        3,
      );
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const fetchTiemposAnteriores = async (drawCategoryId, drawDate) => {
    try {
      if (drawCategoryId === 0 || !drawDate) {
        tiemposAnterioresRef.current = [];
        return;
      }
      // const response = await fetch(
      //   `${backend_url}/api/ticket/${drawCategoryId}/${drawDate}/${userData.id}?token=${token}`,
      //   { method: "GET", headers: { "Content-Type": "application/json" } },
      // );
      const apkVersion =
        Constants.manifest?.version || Constants.expoConfig?.version;
      const response = await fetch(
        `${backend_url}/api/ticket/${drawCategoryId}/${drawDate}/${userData.id}?token=${userData.token}`,
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
        showSnackbar("⚠️ El usuario no tiene permisos.");
        logout();
        tiemposAnterioresRef.current = [];
        return;
      }
      if (response.status !== 200) {
        showSnackbar("⚠️ Error al obtener tiempos vendidos");
        tiemposAnterioresRef.current = [];
        return;
      }
      const data = await response.json();
      const sortedData = data
        .filter((item) => item.status === 201)
        .sort((a, b) => b.id - a.id);

      tiemposAnterioresRef.current = sortedData;
    } catch (error) {
      console.error("Error al cargar tiempos anteriores:", error);
      tiemposAnterioresRef.current = [];
    }
  };

  const cargaSorteoSeleccionado = async () => {
    Object.assign(mSorteo, mSorteo);
    setSorteoNombre(mSorteo.name);
    setSorteoId(mSorteo.id);
    setNumero("");
  };

  const skipNextEffect = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        // 1. Obtener y setear fecha
        const fechaActual = mFechaSeleccionada.getFecha();

        skipNextEffect.current = true;
        setFecha(fechaActual);

        // 2. Cargar sorteo
        if (mSorteo.id !== 0) {
          await cargaSorteoSeleccionado();
        }

        // 3. Esperar datos para fetch
        const drawId = mSorteo.id || sorteoId;
        if (fechaActual && drawId && userData?.id) {
          mFechaSeleccionada.setFecha(fechaActual);
          await fetchTiemposAnteriores(
            drawId,
            formatDate(fechaActual, "yyyy-MM-dd"),
          );
        }
      };

      load();
      setNumero("");

      return () => {
        isActive = false;
      };
    }, [userData?.id, sorteoId]),
  );

  useEffect(() => {
    // if (skipNextEffect.current) {
    //   skipNextEffect.current = false;
    //   return;
    // }

    if (!fecha || !sorteoId || !userData?.id) return;

    const load = async () => {
      mFechaSeleccionada.setFecha(fecha);
      setNumero("");
      console.log("entro a actualizar desde useEfect");
      await fetchTiemposAnteriores(sorteoId, formatDate(fecha, "yyyy-MM-dd"));
    };

    load();
  }, [fecha, sorteoId, userData?.id]);

  // useFocusEffect(
  //   useCallback(() => {
  //     const fechaActual = mFechaSeleccionada.getFecha();
  //     setFecha(fechaActual);
  //   }, []),
  // );

  // useFocusEffect(
  //   useCallback(() => {
  //     (async () => {
  //       if (mSorteo.id !== 0) {
  //         await cargaSorteoSeleccionado();

  //         mFechaSeleccionada.setFecha(fecha);
  //         const isAllowed = await fetchTiemposAnteriores(
  //           sorteoId,
  //           formatDate(fecha, "yyyy-MM-dd"),
  //         );
  //       }
  //     })();
  //   }, [fecha, sorteoId]), // <--- agregá las dependencias acá
  // );

  // useEffect(() => {
  //   console.log("mSorteo.id", mSorteo.id);
  //   console.log("sorteoId", sorteoId);

  //   if (!fecha || !sorteoId || !userData?.id) return;
  //   async function execute() {
  //     mFechaSeleccionada.setFecha(fecha);
  //     const isAllowed = await fetchTiemposAnteriores(
  //       sorteoId,
  //       formatDate(fecha, "yyyy-MM-dd"),
  //     );
  //   }
  //   execute();
  // }, [sorteoId, fecha]);

  // 🔹 Un solo hook para toda la carga
  // useFocusEffect(
  //   useCallback(() => {
  //     const load = async () => {
  //       const fechaActual = mFechaSeleccionada.getFecha();
  //       setFecha(fechaActual);

  //       if (mSorteo.id !== 0) {
  //         await cargaSorteoSeleccionado();
  //       }

  //       if (fechaActual && mSorteo.id && userData?.id) {
  //         mFechaSeleccionada.setFecha(fechaActual);
  //         await fetchTiemposAnteriores(
  //           mSorteo.id,
  //           formatDate(fechaActual, "yyyy-MM-dd"),
  //         );
  //       }
  //     };
  //     load();
  //   }, [userData?.id, sorteoId, fecha]),
  // );

  return (
    <Provider>
      <View style={{ flex: 1 }}>
        {loading && (
          <TouchableWithoutFeedback>
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </TouchableWithoutFeedback>
        )}
        <View style={styles.container}>
          <View
            style={[styles.formAndListContainer, isWeb && styles.webLayout]}
          >
            <View
              style={[styles.formContainer, isWeb && styles.webFormContainer]}
            >
              <View style={styles.formRow}>
                <Pressable
                  style={styles.inputSmallSorteo}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={{ color: sorteoNombre ? "#000" : "#aaa" }}>
                    {sorteoNombre || "Sorteo"}
                  </Text>
                </Pressable>
                {Platform.OS === "web" ? (
                  <DatePickerWeb value={fecha} onChange={setFecha} />
                ) : (
                  <>
                    <Pressable
                      onPress={() => setShowPicker(true)}
                      style={styles.inputSmall}
                    >
                      <Text>{formattedDate || "Selecciona fecha"}</Text>
                    </Pressable>
                    {showPicker && (
                      <DateTimePicker
                        value={fecha}
                        mode="date"
                        display="calendar"
                        onChange={handleDateChange}
                      />
                    )}
                  </>
                )}
              </View>
              <View style={styles.row}>
                <TextInput
                  ref={numeroRef}
                  placeholder="Número"
                  style={[styles.inputSmall, { marginRight: 8, minWidth: 70 }]}
                  value={numero}
                  onChangeText={(text) =>
                    setNumero(text.replace(/[^0-9]/g, "").slice(0, 2))
                  }
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit={false}
                />
                {mSorteo.useReventado && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={toggleColor}
                  >
                    <MaterialIcons
                      name="circle"
                      size={20}
                      color={colors[colorIndex]}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Divider />
            <View style={[styles.listContainer, !isWeb && { marginTop: 0 }]}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 10 }}>
                {tiemposFiltrados.map((item, index) => (
                  <Pressable key={item.id || index} style={styles.item}>
                    <Text style={{ fontWeight: "bold" }}>
                      Código: # {item.id || ""}
                    </Text>
                    <Text style={{ fontWeight: "bold" }}>
                      Cliente: {item.clientName || "Sin nombre"}
                    </Text>
                    <Text style={{ color: "#555" }}>
                      Fecha: {new Date(item.updatedAt).toLocaleString()}
                    </Text>
                    <Text style={{ fontWeight: "bold" }}>
                      Premio: ₡{item.monto} x {item.prizeTimes} = ₡{item.premio}
                    </Text>
                    {currentColor === "red" && item.montoReventado > 0 && (
                      <Text style={{ fontWeight: "bold" }}>
                        Premio Reventado: ₡{item.montoReventado} x{" "}
                        {item.revPrizeTimes} = ₡{item.revPremio}
                      </Text>
                    )}
                    <Text style={{ color: "#090" }}>
                      Premio Total a pagar: ₡{item.premio + item.revPremio}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={styles.totalBar}>
            <View style={styles.totalTextGroup}>
              <Text style={styles.totalText}>TOTAL: </Text>
              <Text style={styles.totalValue}>₡{total?.toFixed(0)}</Text>
            </View>
          </View>
        </View>
        <SorteoSelectorModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={(sorteo) => {
            Object.assign(mSorteo, sorteo);
            setSorteoId(mSorteo.id);
            setSorteoNombre(mSorteo.name);
          }}
          leftPosition
        />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 16,
  },
  formAndListContainer: { flexDirection: "column", marginTop: 20, flex: 1 },
  webLayout: { flexDirection: "row" },
  formContainer: { marginBottom: 20 },
  webFormContainer: { marginRight: 20, minWidth: 410, maxWidth: 410 },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  listContainer: { flex: 1, maxHeight: 900 },
  inputSmall: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    minHeight: 40,
  },
  inputSmallSorteo: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    minHeight: 40,
    minWidth: 80,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6e1e1",
    borderRadius: 8,
  },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderColor: "#eee" },
  totalBar: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  totalTextGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  totalText: { fontWeight: "bold", fontSize: 20 },
  totalValue: { fontSize: 20, marginLeft: 4, fontWeight: "bold" },
});
