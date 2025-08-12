import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  Alert,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { Divider, Provider } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
//import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerWeb from "../components/DatePickerWeb";
import { useAuth } from "../context/AuthContext";
import SorteoSelectorModal from "../components/SorteoSelectorModal";
import mSorteo from "../models/mSorteoSingleton.js";
import { useTiempo } from "../models/mTiempoContext";
import { getInternetDate, formatDate } from "../utils/datetimeUtils"; // ajusta el path si es necesario
import mFechaSeleccionada from "../models/mFechaSeleccionadaSingleton.js";

export default function VentaGeneralScreen({ navigation, route }) {
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
  const token = userData.token;
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";
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
                fontFamily: "RobotoMono",
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
                fontFamily: "RobotoMono",
                textAlign: "right",
                minWidth: 40,
                flexShrink: 1,
                display: "block",
              }}
            >
              {"\u20A1"}
              {item.monto}
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
                  fontFamily: "RobotoMono",
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
                  fontFamily: "RobotoMono",
                  textAlign: "right",
                  minWidth: 40,
                  flexShrink: 1,
                  display: "block",
                }}
              >
                {"\u20A1"}
                {item.montoReventado}
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
        showSnackbar("⚠️ El usuario no tiene permisos.", 3);
        logout();
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }

      if (response.status !== 200) {
        console.warn(`⚠️ Error al obtener tiempos: Status ${response.status}`);
        showSnackbar("⚠️ Error al obtener tiempos vendidos", 3);
        logout();
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }

      const data = await response.json();

      // 🔸 Filtrar solo los tickets con status 201
      const ticketsFiltrados = data.filter((item) => item.status === 201);

      setTiemposAnteriores(ticketsFiltrados);

      const ticketNumbers = ticketsFiltrados
        .map((item) => item.id)
        .filter((n) => typeof n === "number" && n > 0);

      const lastTicketNumber =
        ticketNumbers.length > 0 ? Math.max(...ticketNumbers) : 0;

      return {
        tiemposVendidos: ticketsFiltrados,
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
          console.log("entro a actualizar desde useFocusEffect");
          actualizaDesdeHeader(fechaActual, drawId, userData);
        }
      };

      load();

      return () => {
        isActive = false;
      };
    }, [userData?.id, sorteoId, mSorteo.id]),
  );

  useEffect(() => {
    // if (skipNextEffect.current) {
    //   skipNextEffect.current = false;
    //   return;
    // }

    if (!fecha || !sorteoId || !userData?.id) return;

    const load = async () => {
      mFechaSeleccionada.setFecha(fecha);
      console.log("entro a actualizar desde useEfect");
      actualizaDesdeHeader(fecha, sorteoId, userData);
    };

    load();
  }, [fecha, sorteoId, userData?.id]);

  // useFocusEffect(
  //   useCallback(() => {
  //     const fechaActual = mFechaSeleccionada.getFecha();
  //     setFecha(fechaActual);
  //     setTiempo((prev) => ({
  //       ...prev,
  //       drawCategoryId: mSorteo.id,
  //       drawDate: formatDate(fechaActual, "yyyy-MM-dd"),
  //     }));
  //   }, []),
  // );

  // useFocusEffect(
  //   useCallback(() => {
  //     (async () => {
  //       if (mSorteo.id !== 0) {
  //         await cargaSorteoSeleccionado();
  //       }
  //       actualizaDesdeHeader();
  //       return () => {
  //         // cleanup si hace falta
  //       };
  //     })();
  //   }, [fecha, sorteoId, userData]),
  // );

  // useEffect(() => {
  //   if (fecha || sorteoId || userData?.id) {
  //     mFechaSeleccionada.setFecha(fecha);
  //     actualizaDesdeHeader();
  //   }
  // }, [sorteoId, fecha]);

  const actualizaDesdeHeader = useCallback(
    async (fechaParam, sorteoParam, user) => {
      if (!fechaParam || !sorteoParam || !user?.id) return;
      try {
        setLoading(true);
        const updated = await actualizaGrid(fechaParam, sorteoParam, user);
        if (updated) {
          //showSnackbar("Lista Actualizada Correctamente.", 1);
        } else {
          showSnackbar("Error al intentar actualizar la lista.", 3);
        }
      } catch (err) {
        showSnackbar("Error al intentar actualizar la lista.", 3);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // const actualizaDesdeHeader = useCallback(() => {
  //   async function execute() {
  //     if (!fecha || !sorteoId || !userData?.id) return;
  //     const updated = await actualizaGrid(fecha, sorteoId, userData);
  //     if (updated) {
  //       showSnackbar("Lista Actualizada Correctamente.", 1);
  //     } else {
  //       console.warn("Error al intentar actualizar la lista.");
  //       showSnackbar("Error al intentar actualizar la lista.", 3);
  //     }
  //   }
  //   (async () => {
  //     try {
  //       setLoading(true);
  //       await execute();
  //     } catch (err) {
  //       console.warn("Error al intentar actualizar la lista.");
  //       showSnackbar("Error al intentar actualizar la lista.", 3);
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, [fecha, sorteoId, userData]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "VENTA GENERAL",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <>
          <Pressable
            onPress={() => {
              actualizaDesdeHeader(fecha, sorteoId, userData);
            }}
            style={{ marginRight: 20 }}
          >
            <MaterialIcons name="refresh" size={24} color="#fff" />
          </Pressable>
        </>
      ),
    });
  }, [navigation, actualizaDesdeHeader, fecha, sorteoId, userData]);

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
                    leftPosition={true}
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
              <Text style={styles.totalValue}>₡{montoTotal?.toFixed(0)}</Text>
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
    minWidth: 80,
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
