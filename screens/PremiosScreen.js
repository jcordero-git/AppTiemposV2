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
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerWeb from "../components/DatePickerWeb";
import mSorteo from "../models/mSorteoSingleton.js";
import SorteoSelectorModal from "../components/SorteoSelectorModal";
import { formatDate } from "../utils/datetimeUtils"; // ajusta el path si es necesario
import { useAuth } from "../context/AuthContext";
import mFechaSeleccionada from "../models/mFechaSeleccionadaSingleton.js";

export default function PremiosScreen({ navigation, route }) {
  console.log("🎯 RENDER Premios Screen");
  const [loading, setLoading] = useState(false);
  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;
  const { showSnackbar, showConfirm } = useSnackbar();
  const [modalVisible, setModalVisible] = useState(false);

  const { userData, logout, ticketProfile, login, saveTicketProfile } =
    useAuth();
  const token = userData.token;
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";

  const [sorteoNombre, setSorteoNombre] = useState("");
  const [sorteoId, setSorteoId] = useState(null);
  const [fecha, setFecha] = useState(new Date()); // Siempre inicializa con un Date válido
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = formatDate(fecha, "EE dd/MM/yyyy");
  const [numero, setNumero] = useState("");
  const numeroRef = useRef(null);

  const [tiemposAnteriores, setTiemposAnteriores] = useState([]);
  const [items, setItems] = useState([]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "PREMIOS",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <>
          {/* <MaterialIcons
            name="save"
            size={24}
            color="#fff" // Blanco para contraste con fondo verde
            style={{ marginRight: 20 }}
          /> */}
        </>
      ),
    });
  }, [navigation]);

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setFecha(selectedDate);
    }
  };

  const fetchTiemposAnteriores = async (drawCategoryId, drawDate) => {
    try {
      if (drawCategoryId === 0 || !drawDate) {
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }
      console.log("TOKEN********* TIEMPOS VENDIDOS", token);

      const response = await fetch(
        `${backend_url}/api/ticket/${drawCategoryId}/${drawDate}?token=${token}`,
        {
          method: "GET",
          headers: {
            //"x-access-token": `${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.status === 403) {
        showSnackbar("⚠️ El usuario no tiene permisos.");
        logout();
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }

      if (response.status !== 200) {
        console.warn(`⚠️ Error al obtener tiempos: Status ${response.status}`);
        showSnackbar("⚠️ Error al obtener tiempos vendidos");
        logout();
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }

      const data = await response.json();
      const sortedData = data.sort((a, b) => b.id - a.id);
      console.log("TIEMPOS VENDIDOS: ", sortedData);
      setTiemposAnteriores(sortedData);
      const ticketNumbers = sortedData
        .map((item) => item.id)
        .filter((n) => typeof n === "number" && n > 0);

      const lastTicketNumber =
        ticketNumbers.length > 0 ? Math.max(...ticketNumbers) : 0;

      return {
        tiemposVendidos: sortedData,
        lastTicketNumber,
      };
    } catch (error) {
      console.error("Error al cargar tiempos anteriores:", error);
      return [[], 0]; // ✅ fallback seguro
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fechaActual = mFechaSeleccionada.getFecha();
      setFecha(fechaActual);
    }, []),
  );

  const cargaSorteoSeleccionado = async () => {
    Object.assign(mSorteo, mSorteo); // ✅ Copia las propiedades sin reemplazar el objeto
    setSorteoNombre(mSorteo.name);
    setSorteoId(mSorteo.id);
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (mSorteo.id !== 0) {
          await cargaSorteoSeleccionado();

          mFechaSeleccionada.setFecha(fecha);
          const isAllowed = await fetchTiemposAnteriores(
            sorteoId,
            formatDate(fecha, "yyyy-MM-dd"),
          );
        }
      })();
    }, [fecha, sorteoId]), // <--- agregá las dependencias acá
  );

  useEffect(() => {
    if (!fecha || !sorteoId || !userData?.id) return;
    async function execute() {
      console.log("GETTING TIEMPOS VENDIDOS");
      mFechaSeleccionada.setFecha(fecha);
      const isAllowed = await fetchTiemposAnteriores(
        sorteoId,
        formatDate(fecha, "yyyy-MM-dd"),
      );
    }
    execute();
  }, [sorteoId, fecha]);

  const [colorIndex, setColorIndex] = useState(0);

  //const colors = ["white", "gray", "red"];
  const colors = ["white", "red"];

  const toggleColor = () => {
    setColorIndex((prev) => (prev + 1) % colors.length);
  };

  const currentColor = colors[colorIndex];

  const tiemposFiltrados =
    numero.trim().length === 2
      ? tiemposAnteriores
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

  // Calcular total
  const total = tiemposFiltrados?.reduce((sum, item) => {
    //const premio = parseFloat(item.premio);
    const premio = parseFloat(item.premio) || 0;
    const revPremio = parseFloat(item.revPremio) || 0;
    //return sum + (!isNaN(premio) ? premio : 0);
    return sum + (currentColor === "red" ? premio + revPremio : premio);
  }, 0);

  return (
    <Provider>
      <View style={{ flex: 1 }}>
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

        {/* Tu contenido de pantalla */}
        <>
          <View style={styles.container}>
            {/* Formulario y Lista */}

            <View
              style={[styles.formAndListContainer, isWeb && styles.webLayout]}
            >
              {/* Formulario */}

              <View
                style={[styles.formContainer, isWeb && styles.webFormContainer]}
              >
                {/* <ScrollView style={{ flex: 1 }}> */}
                <View style={styles.formRow}>
                  <Pressable
                    style={styles.inputSmallSorteo}
                    onPress={() => {
                      setModalVisible(true);
                    }}
                  >
                    <Text style={{ color: sorteoNombre ? "#000" : "#aaa" }}>
                      {sorteoNombre || "Sorteo"}
                    </Text>
                  </Pressable>
                  {Platform.OS === "web" ? (
                    <View>
                      <DatePickerWeb
                        value={fecha}
                        onChange={(date) => {
                          setFecha(date);
                        }}
                      />
                    </View>
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
                          display={
                            Platform.OS === "android" ? "calendar" : "default"
                          }
                          onChange={handleDateChange}
                        />
                      )}
                    </>
                  )}
                </View>
                <>
                  {/* Botón, Monto y Número en una fila */}
                  <View style={styles.row}>
                    <TextInput
                      ref={numeroRef}
                      placeholder="Número"
                      style={[
                        styles.inputSmall,
                        { marginRight: 8, minWidth: 70 },
                      ]}
                      value={numero}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, "").slice(0, 2);
                        setNumero(cleaned);

                        // if (cleaned.length === 2) {
                        //   if (reventar) {
                        //     window.setTimeout(() => {
                        //       reventarRef.current?.focus();
                        //     });
                        //   } else {
                        //     submitNumero();
                        //   }
                        // }
                      }}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      blurOnSubmit={false}
                    />
                    {mSorteo.useReventado && (
                      <>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => {
                            toggleColor();
                          }}
                        >
                          <MaterialIcons
                            name="circle"
                            size={20}
                            color={colors[colorIndex]}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </>
                {/* </ScrollView> */}
              </View>
              <Divider style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />

              {/* Lista */}
              <View style={[styles.listContainer, !isWeb && { marginTop: 0 }]}>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 10 }}>
                  {tiemposFiltrados.map((item, index) => (
                    <Pressable
                      key={item.id || index}
                      onPress={() => {
                        //cargarTiempoSeleccionado(item);
                      }}
                      style={{
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                      }}
                    >
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
                        Premio: ₡{item.monto} x {item.prizeTimes} = ₡
                        {item.premio}
                      </Text>
                      {/* <Text style={{ fontWeight: "bold" }}>
                        Multiplicador: {item.prizeTimes} Veces
                      </Text>
                      <Text style={{ color: "#090" }}>
                        Premio a pagar: ₡{item.premio}
                      </Text> */}

                      {currentColor === "red" && item.montoReventado > 0 && (
                        <>
                          <Text style={{ fontWeight: "bold" }}>
                            Premio Reventado: ₡{item.montoReventado} x{" "}
                            {item.revPrizeTimes} = ₡{item.revPremio}
                          </Text>
                          {/* <Text style={{ fontWeight: "bold" }}>
                            Multiplicador Rev: {item.revPrizeTimes} Veces
                          </Text>
                          <Text style={{ color: "#090" }}>
                            Premio Rev a pagar: ₡{item.revPremio}
                          </Text> */}
                        </>
                      )}
                      <Text style={{ color: "#090" }}>
                        Premio Total a pagar: ₡{item.premio + item.revPremio}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            {/* Total */}
            <View style={styles.totalBar}>
              <View style={styles.totalTextGroup}>
                <Text style={styles.totalText}>TOTAL: </Text>
                <Text style={styles.totalValue}>₡{total?.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </>
      </View>

      <SorteoSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={(sorteo) => {
          Object.assign(mSorteo, sorteo); // ✅ Copia las propiedades sin reemplazar el objeto

          setSorteoId(mSorteo.id);
          setSorteoNombre(mSorteo.name);
        }}
        leftPosition={true}
      />
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
    flexDirection: "row", //TODO se debe eliminar esta linea para que no se muestren los tiquetes premiados en la derecha
  },
  formContainer: {
    marginBottom: 20,
    //maxWidth: 410,
  },
  webFormContainer: {
    marginRight: 20,
    minWidth: 410,
    maxWidth: 410,
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
  itemRowGeneral: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,

    borderColor: "#eee",
  },
  itemRowRev: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
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
    minHeight: 40, // importante para móviles
  },
  inputSmallSorteo: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    minHeight: 40, // importante para móviles
    minWidth: 120,
  },
  inputSmallInvisible: {
    flex: 1,
    padding: 8,
  },
  iconButtonInvisible: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
  },
  switchRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: Platform.OS === "web" ? 10 : 0, // solo en web,
    paddingHorizontal: 15,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // ✅ fuerza alineación vertical
    marginBottom: 10,
    gap: 5,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    backgroundColor: "#e6e1e1",
    borderRadius: 8,
    cursor: "pointer",
  },
  iconButtonRestringidos: {
    width: 27,
    height: 27,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    //backgroundColor: "#e6e1e1",
    borderRadius: 8,
    cursor: "pointer",
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
  totalTextGroup: {
    flexDirection: "row",
    alignItems: "center",
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
  dialogWebContainer: {
    position: "fixed", // fijo en pantalla
    top: 0,
    right: 0,
    height: "100vh", // toda la altura visible
    width: 400, // ancho fijo para el diálogo
    backgroundColor: "white",
    padding: 20,
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
    zIndex: 1000, // asegurarse que quede encima de todo
    overflowY: "auto",
  },
  tooltip: {
    position: "absolute",
    top: -24,
    left: 0,
    backgroundColor: "#4CAF50",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: {
    color: "white",
    fontSize: 12,
  },
});
