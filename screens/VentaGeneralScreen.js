import React, { useState, useRef, useEffect, useCallback } from "react";
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
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Menu,
  Divider,
  Provider,
  Portal,
  Dialog,
  Button,
  Snackbar,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
//import { Ionicons } from "@expo/vector-icons";

import { printTicketWeb } from "../utils/print/printTicketWeb"; // ajusta la ruta si es necesario

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

import { format } from "date-fns";
import { es } from "date-fns/locale"; // idioma español
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerWeb from "../components/DatePickerWeb";
import { useAuth } from "../context/AuthContext";
import SorteoSelectorModal from "../components/SorteoSelectorModal";
import mSorteo from "../models/mSorteoSingleton.js";
import mSorteoRestringidos from "../models/mSorteoRestringidosSingleton";
import { useTiempo } from "../models/mTiempoContext";
import { convertNumero, validateMonto } from "../utils/numeroUtils";
import { parseMessage } from "../utils/UtilParseMessageAI";
import mSorteoSingleton from "../models/mSorteoSingleton.js";
import { getInternetDate, formatDate } from "../utils/datetimeUtils"; // ajusta el path si es necesario

export default function VentaGeneralScreen({ navigation, route }) {
  console.log("🎯 RENDER VentaGeneralScreen");
  const { showSnackbar } = useSnackbar();
  const [menuVisibleHeader, setMenuVisibleHeader] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [categoriaDialogVisible, setCategoriaDialogVisible] = useState(false); // Diálogo selector de categoría
  const [dialogTicketsVisible, setDialogTicketsVisible] = useState(false);
  const [dialogRestringidoVisible, setDialogRestringidoVisible] =
    useState(false);
  const [idTicketSeleccionado, setIdTicketSeleccionado] = useState(0);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [categoriasMonto, setCategoriasMonto] = useState("");
  const [categoriasTerminaEn, setCategoriasTerminaEn] = useState("");
  const [categoriasInicianCon, setCategoriasInicianCon] = useState("");
  const [categoriasDesde, setCategoriasDesde] = useState("");
  const [categoriasHasta, setCategoriasHasta] = useState("");
  const [categoriasExtraerTexto, setCategoriasExtraerTexto] = useState("");
  const [loading, setLoading] = useState(false);

  const [refreshHeader, setRefreshHeader] = useState(0);
  const { userData, logout } = useAuth();
  const [tiemposAnteriores, setTiemposAnteriores] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [sorteoNombre, setSorteoNombre] = useState("");
  const [sorteoId, setSorteoId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [limpiar, setLimpiar] = useState(true);
  const [reventar, setReventar] = useState(false);
  const [sorteo, setSorteo] = useState("");
  const [fecha, setFecha] = useState(getInternetDate()); // Siempre inicializa con un Date válido
  const [monto, setMonto] = useState("");
  const [numero, setNumero] = useState("");
  const [montoDisponible, setMontoDisponible] = useState("");
  const [montoReventado, setMontoReventado] = useState("");
  const [useReventado, setUseReventado] = useState(false);
  const [abiertoPorReventado, setAbiertoPorReventado] = useState(false);
  const toggleMenu = () => setMenuVisible(!menuVisible);
  const [showPicker, setShowPicker] = useState(false);
  const [mostrarCampos, setMostrarCampos] = useState(true);
  const numeroRef = useRef(null);
  const montoRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;
  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const { tiempo, setTiempo, resetTiempo, setClientName } = useTiempo();

  const [items, setItems] = useState([]);
  const [itemsGrid, setItemsGrid] = useState([]);
  const [montoTotal, setMontoTotal] = useState(0);

  const renderItem = ({ item }) => (
    <View>
      <View style={styles.itemRowGeneral}>
        <View style={styles.itemRow}>
          <Text style={styles.itemLeft}>₡{item.monto}</Text>
          <Text style={styles.itemRight}>{item.numero}</Text>
        </View>
        {item.reventado && (
          <View style={styles.itemRowRev}>
            <Text style={styles.itemLeft}>₡{item.montoReventado}</Text>
            <Text style={styles.itemRight}>REVENTADO</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderGrid = ({ item: row }) => (
    <View style={{ flexDirection: "row", marginBottom: 10 }}>
      {row.map((item) => (
        <View
          key={item.key}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 6,
            marginHorizontal: 2,
            borderRadius: 6,
            minWidth: 60,
          }}
        >
          {/* Primera fila */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start", // asegura alineación izquierda en web y móvil
              minWidth: 0,
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                fontFamily: "monospace",
                textAlign: "left",
                minWidth: 15,
                flexShrink: 1,
                flex: 1,
                display: "block",
              }}
            >
              {item.numero}
            </Text>
            <Text
              style={{
                fontFamily: "monospace",
                textAlign: "right",
                minWidth: 40,
                flexShrink: 1,
                display: "block",
              }}
            >
              ₡{item.monto}
            </Text>
          </View>

          {/* Segunda fila (reventado) si aplica */}
          {item.reventado && item.montoReventado > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                minWidth: 0,
              }}
            >
              <Text
                style={{
                  color: "red",
                  fontWeight: "bold",
                  fontFamily: "monospace",
                  textAlign: "left",
                  minWidth: 20,
                  flexShrink: 1,
                  display: "block",
                }}
              >
                <FontAwesome name="bomb" size={15} color="black" />
              </Text>
              <Text
                style={{
                  color: "red",
                  fontFamily: "monospace",
                  textAlign: "right",
                  minWidth: 40,
                  flexShrink: 1,
                  display: "block",
                }}
              >
                ₡{item.montoReventado}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const tiempoRef = useRef(tiempo);

  const formattedDate = formatDate(fecha, "EE dd/MM/yyyy");

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setFecha(selectedDate);
      setTiempo((prev) => ({
        ...prev,
        drawDate: selectedDate,
      }));
    }
  };

  function generateKey() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  const fetchTiemposAnteriores = async (drawCategoryId, drawDate) => {
    try {
      console.log(
        "obteniendo tiempos vendidos: drawCategoryID: ",
        drawCategoryId,
      );
      console.log("obteniendo tiempos vendidos: drawDate: ", drawDate);
      const response = await fetch(
        `https://3jbe.tiempos.website/api/ticket/${drawCategoryId}/${drawDate}`,
      );
      const data = await response.json();
      console.log("tiempos obtenidos: ", data);

      console.log("Tiempos anteriores:", data);
      setTiemposAnteriores(data);

      const ticketNumbers = data
        .map((item) => item.id)
        .filter((n) => typeof n === "number" && n > 0);

      const lastTicketNumber =
        ticketNumbers.length > 0 ? Math.max(...ticketNumbers) : 0;

      return {
        tiemposVendidos: data,
        lastTicketNumber,
      };
    } catch (error) {
      console.error("Error al cargar tiempos anteriores:", error);
      return [[], 0];
    }
  };

  const actualizaGrid = async (fecha, sorteoId, userData) => {
    try {
      if (!fecha || !sorteoId || !userData?.id) return;
      const { tiemposVendidos, lastTicketNumber } =
        await fetchTiemposAnteriores(
          sorteoId,
          formatDate(fecha, "yyyy-MM-dd"),
          //format(fecha, "yyyy-MM-dd", { locale: es }),
        );
      console.log("TIEMPOS VENDIDOS: ", tiemposVendidos);

      const agrupados = {};

      tiemposVendidos.forEach((ticket) => {
        ticket.numbers.forEach(
          ({ numero, monto, montoReventado, reventado }) => {
            if (!agrupados[numero]) {
              agrupados[numero] = {
                numero,
                monto: 0,
                montoReventado: 0,
                reventado: false,
              };
            }

            agrupados[numero].monto += monto;
            agrupados[numero].montoReventado += montoReventado;

            // Si al menos uno es reventado, se marca como true
            if (reventado) {
              agrupados[numero].reventado = true;
            }
          },
        );
      });
      const items = Array.from({ length: 100 }, (_, i) => {
        const numero = i.toString().padStart(2, "0");
        return agrupados[numero]
          ? { ...agrupados[numero], key: generateKey() }
          : {
              numero,
              monto: 0,
              montoReventado: 0,
              reventado: false,
              key: generateKey(),
            };
      });

      // 🔴 Aquí sumás los montos normales + reventados
      const total = items.reduce(
        (acc, item) => acc + item.monto + item.montoReventado,
        0,
      );
      setMontoTotal(total); // ⬅️ Guardás en el estado

      // Ordenar verticalmente: columnas de 25
      const columnas = [[], [], [], []]; // 4 columnas
      items.forEach((item, index) => {
        const col = Math.floor(index / 25); // columna 0 a 3
        const row = index % 25; // fila 0 a 24
        columnas[col][row] = item;
      });

      const grid = [];
      for (let row = 0; row < 25; row++) {
        const fila = [];
        for (let col = 0; col < 4; col++) {
          fila.push(columnas[col][row]);
        }
        grid.push(fila);
      }

      setItemsGrid(grid); // Guardamos la cuadrícula final
      return true;
    } catch (error) {
      console.error("Error al enviar el ticket:", error);
      Alert.alert("Error", "No se pudo eliminar el ticket.");
      return false;
    }
  };

  const cargaSorteoSeleccionado = async () => {
    setSorteoNombre(mSorteo.name);
    setSorteoId(mSorteo.id);
    console.log("sorteo cargado: ", mSorteo.name);
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (mSorteo.id !== 0) {
          await cargaSorteoSeleccionado();
        }
        actualizaDesdeHeader();
        return () => {
          // cleanup si hace falta
        };
      })();
    }, [fecha, sorteoId, userData]),
  );

  useEffect(() => {
    if (fecha || sorteoId || userData?.id) {
      actualizaDesdeHeader();
    }
  }, [sorteoId, fecha]);

  const actualizaDesdeHeader = useCallback(() => {
    async function execute() {
      if (!fecha || !sorteoId || !userData?.id) return;
      const updated = await actualizaGrid(fecha, sorteoId, userData);
      console.log("Actualizada?: ", updated);
      if (updated) {
        console.log("Lista Actualizada Correctamente.");
        showSnackbar("Lista Actualizada Correctamente.", 1);
      } else {
        console.log("Error al intentar actualizar la lista.");
        showSnackbar("Error al intentar actualizar la lista.", 3);
      }
    }
    (async () => {
      try {
        setLoading(true);
        await execute();
      } catch (err) {
        console.log("Error al intentar actualizar la lista.");
        showSnackbar("Error al intentar actualizar la lista.", 3);
      } finally {
        setLoading(false);
      }
    })();
  }, [fecha, sorteoId, userData]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "VENTA GENERAL",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <>
          <Pressable
            onPress={() => {
              actualizaDesdeHeader();
            }}
            style={{ marginRight: 20 }}
          >
            <MaterialIcons name="refresh" size={24} color="#fff" />
          </Pressable>
        </>
      ),
    });
  }, [navigation, actualizaDesdeHeader]);

  useEffect(() => {
    tiempoRef.current = tiempo;
  }, [tiempo]);

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
                <View style={styles.formRow}>
                  <Pressable
                    style={styles.inputSmallSorteo}
                    onPress={() => setModalVisible(true)}
                  >
                    <Text style={{ color: sorteoNombre ? "#000" : "#aaa" }}>
                      {sorteoNombre || "Sorteo"}
                    </Text>
                  </Pressable>
                  <SorteoSelectorModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSelect={(sorteo) => {
                      Object.assign(mSorteo, sorteo); // ✅ Copia las propiedades sin reemplazar el objeto

                      setSorteoId(mSorteo.id);
                      setSorteoNombre(mSorteo.name);
                      setUseReventado(mSorteo.useReventado);
                      setReventar(false);
                      setMontoReventado("");
                      setTiempo((prev) => ({
                        ...prev,
                        sorteoId: sorteo.id,
                      }));
                    }}
                  />

                  {Platform.OS === "web" ? (
                    <>
                      <DatePickerWeb
                        value={fecha}
                        onChange={(date) => {
                          setFecha(date);
                        }}
                      />
                    </>
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
              </View>
              <Divider
                style={{
                  backgroundColor: "rgba(0,0,0,0.12)",
                  marginBottom: 10,
                }}
              />
              {/* Lista */}
              <View style={[styles.listContainer, !isWeb && { marginTop: 0 }]}>
                <FlatList
                  data={itemsGrid}
                  renderItem={renderGrid}
                  keyExtractor={(_, index) => `row-${index}`}
                  style={{ marginTop: 0 }}
                />
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalBar}>
              <Text style={styles.totalText}>TOTAL: </Text>
              <Text style={styles.totalValue}>₡{montoTotal?.toFixed(2)}</Text>
            </View>
          </View>
        </>
      </View>
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
    marginBottom: 10,
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
});
