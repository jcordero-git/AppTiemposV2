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
} from "react-native-paper";
//import { Ionicons } from "@expo/vector-icons";

import { printTicketWeb } from "../utils/print/printTicketWeb"; // ajusta la ruta si es necesario

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { format } from "date-fns";
import { da, de, es, tr } from "date-fns/locale"; // idioma español
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerWeb from "../components/DatePickerWeb";
import { useAuth } from "../context/AuthContext";
import SorteoSelectorModal from "../components/SorteoSelectorModal";
import mSorteo from "../models/mSorteoSingleton.js";
import mSorteoRestringidos from "../models/mSorteoRestringidosSingleton";
import { useTiempo } from "../models/mTiempoContext";
import { convertNumero, validateMonto } from "../utils/numeroUtils";
import { parseMessage } from "../utils/UtilParseMessageAI";

export default function ConfiguracionScreen({ navigation, route }) {
  console.log("🎯 RENDER Configuracion Screen");
  const [menuVisibleHeader, setMenuVisibleHeader] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [categoriaDialogVisible, setCategoriaDialogVisible] = useState(false); // Diálogo selector de categoría
  const [dialogTicketsVisible, setDialogTicketsVisible] = useState(false);
  const [dialogRestringidoVisible, setDialogRestringidoVisible] =
    useState(false);
  const [ultimoTicket, setUltimoTicket] = useState(null);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [categoriasMonto, setCategoriasMonto] = useState("");
  const [categoriasTerminaEn, setCategoriasTerminaEn] = useState("");
  const [categoriasInicianCon, setCategoriasInicianCon] = useState("");
  const [categoriasDesde, setCategoriasDesde] = useState("");
  const [categoriasHasta, setCategoriasHasta] = useState("");
  const [categoriasExtraerTexto, setCategoriasExtraerTexto] = useState("");
  const [loading, setLoading] = useState(false);

  const [categoriasMontoTemporal, setCategoriasMontoTemporal] =
    useState(categoriasMonto);

  const menuAnchorRef = useRef(null);

  useEffect(() => {
    if (dialogVisible) setCategoriasMontoTemporal(categoriasMonto);
  }, [dialogVisible]);

  const openMenuHeader = () => setMenuVisibleHeader(true);
  const closeMenuHeader = () => setMenuVisibleHeader(false);

  //PROMESAS
  const resolverDialogRef = useRef(null);
  const [dialogNumeroRestringido, setDialogNumeroRestringido] = useState("");
  const [
    dialogMontoRestringidoDisponible,
    setDialogMontoRestringidoDisponible,
  ] = useState("");
  function esperarConfirmacionDialog(numero, montoDisponible) {
    console.log("entra a esperar confirmacion 1");
    return new Promise((resolve) => {
      setDialogNumeroRestringido(numero);
      setDialogMontoRestringidoDisponible(montoDisponible);
      setDialogRestringidoVisible(true); // mostrar el Dialog
      // Guardamos el resolver para llamarlo después
      console.log("entra a esperar confirmacion 2");

      resolverDialogRef.current = resolve;
    });
  }

  // 🔹 MÉTODOS DEL DIÁLOGO
  const openDialogRestringido = () => {
    setDialogRestringidoVisible(true);
  };

  const closeDialogRestringido = () => {
    setNumero("");
    numeroRef.current?.focus();

    setDialogRestringidoVisible(false);
  };
  const openDialogTickets = () => {
    setDialogTicketsVisible(true);
  };

  const closeDialogTickets = () => {
    setDialogTicketsVisible(false);
  };
  // const openDialogCategorias = () => {
  //   closeMenuHeader();
  //   setDialogVisible(true);
  // };
  const openDialogCategorias = useCallback(() => {
    closeMenuHeader();
    setDialogVisible(true);
  }, []);

  const closeDialogCategorias = () => {
    setDialogVisible(false);
    setCategoriaSeleccionada(null);
    setCategoriasMonto("");
    setCategoriasTerminaEn("");
    setCategoriasInicianCon("");
    setCategoriasDesde("");
    setCategoriasHasta("");
    setCategoriasExtraerTexto("");
  };

  const SelectTicket = () => {
    console.log("select ticket");
    closeDialogTickets();
  };

  const OKDialogCategorias = async () => {
    let montoTemp;
    if (categoriaSeleccionada !== "Extraer de Texto") {
      montoTemp = parseInt(categoriasMonto);
      if (!validateMonto(montoTemp)) {
        Alert.alert("Monto inválido", "Debe ser un múltiplo de 50.");
        return;
      }
    }
    setDialogVisible(false);
    let currentItems = [...items]; // arranco con la lista actual

    if (categoriaSeleccionada === "Parejitas") {
      for (let i = 0; i <= 9; i++) {
        const number = parseInt(`${i}${i}`);
        const numero = convertNumero(number);
        [currentItems] = await verificaRestringidosYAgregaNumero(
          montoTemp,
          numero,
          false,
          0,
          currentItems,
          tiemposAnteriores,
        );
        console.log("CURRENT ITEM DESDE PAREJITAS: ", currentItems);
      }
    }
    if (categoriaSeleccionada === "Terminan en...") {
      for (let i = 0; i <= 9; i++) {
        const number = parseInt(`${i}${categoriasTerminaEn}`);
        const numero = convertNumero(number);
        [currentItems] = await verificaRestringidosYAgregaNumero(
          montoTemp,
          numero,
          false,
          0,
          currentItems,
          tiemposAnteriores,
        );
        console.log("CURRENT ITEM DESDE TERMINAN EN: ", currentItems);
      }
    }
    if (categoriaSeleccionada === "Inician con...") {
      for (let i = 0; i <= 9; i++) {
        const number = parseInt(`${categoriasInicianCon}${i}`);
        const numero = convertNumero(number);
        [currentItems] = await verificaRestringidosYAgregaNumero(
          montoTemp,
          numero,
          false,
          0,
          currentItems,
          tiemposAnteriores,
        );
        console.log("CURRENT ITEM DESDE INICIAN CON: ", currentItems);
      }
    }
    if (categoriaSeleccionada === "Desde / Hasta") {
      const desde = parseInt(categoriasDesde);
      const hasta = parseInt(categoriasHasta);

      for (let i = desde; i <= hasta; i++) {
        const number = parseInt(`${i}`);
        const numero = convertNumero(number);
        [currentItems] = await verificaRestringidosYAgregaNumero(
          montoTemp,
          numero,
          false,
          0,
          currentItems,
          tiemposAnteriores,
        );
        console.log("CURRENT ITEM DESDE / HASTA: ", currentItems);
      }
    }
    console.log("categoriaSeleccionada", categoriaSeleccionada);
    if (categoriaSeleccionada === "Extraer de Texto") {
      setLoading(true); // Mostrar loader

      try {
        const runGeminiExample = async () => {
          const setting = userData.settings.find(
            (s) => s.promt_extrae !== undefined,
          );
          const prompt = setting ? setting.promt_extrae : "";
          const day = new Date().getDate();
          const extraPrompt = prompt;
          const text = categoriasExtraerTexto;
          console.log("EXTRAER DE TEXTO - ", extraPrompt + " " + text);
          const result = await parseMessage(text, day, extraPrompt);
          console.log("Resultado parseado:", result);
          return result;
        };

        const result = await runGeminiExample();
        console.log("Resultado parseado despues de llamado:", result);

        for (const item of result) {
          const numero = convertNumero(parseInt(`${item.numero}`));
          const monto = parseInt(`${item.monto}`);

          [currentItems] = await verificaRestringidosYAgregaNumero(
            monto,
            numero,
            false,
            0,
            currentItems,
            tiemposAnteriores,
          );

          console.log("CURRENT ITEM DESDE / HASTA: ", currentItems);
        }
      } finally {
        setLoading(false);
      }
    }

    setItems(currentItems);

    const nuevosMontoNumeros = currentItems?.map((item) => ({
      monto: item.monto,
      numero: item.numero,
      reventado: item.reventado,
      montoReventado: item.montoReventado,
      //...(item.montoReventado ? { rev: item.montoReventado } : {}),
    }));
    actualizarMontoNumerosEnTiempo(nuevosMontoNumeros);
    setCategoriaSeleccionada(null);
    setCategoriasMonto("");
    setCategoriasTerminaEn("");
    setCategoriasInicianCon("");
    setCategoriasDesde("");
    setCategoriasHasta("");
    setCategoriasExtraerTexto("");
  };

  // 🔹 MÉTODOS DEL DROPDOWN
  const openCategoriaSelector = () => {
    setCategoriaDialogVisible(true);
  };
  const closeCategoriaSelector = () => setCategoriaDialogVisible(false);

  const seleccionarCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria);
    closeCategoriaSelector();
  };

  useEffect(() => {}, [categoriaDialogVisible]);

  const { tiempo, setTiempo, resetTiempo, setClientName } = useTiempo();

  // El botón que actuará como anchor para el menú
  const MenuAnchor = (
    <TouchableOpacity onPress={openMenuHeader} style={{ marginRight: 10 }}>
      <MaterialIcons name="more-vert" size={24} color="#fff" />
    </TouchableOpacity>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "CONFIGURACIÓN",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <>
          <MaterialIcons
            name="save"
            size={24}
            color="#fff" // Blanco para contraste con fondo verde
            style={{ marginRight: 20 }}
            onPress={closeMenuHeader}
          />
          <MaterialIcons
            name="download"
            size={24}
            color="#fff" // Blanco para contraste con fondo verde
            style={{ marginRight: 15 }}
            onPress={handleImagePress}
          />
          {/* Menú anclado al botón visible */}
          <Menu
            visible={menuVisibleHeader}
            onDismiss={closeMenuHeader}
            anchor={MenuAnchor}
            contentStyle={{ backgroundColor: "white", marginRight: 15 }} // Fondo blanco
          >
            <Menu.Item
              onPress={() => {
                closeMenuHeader();
              }}
              title="Exportar Datos"
              titleStyle={{ color: "#000" }} // Texto negro opcional
            />
            <Menu.Item
              onPress={() => {
                closeMenuHeader();
              }}
              title="Borrar Datos"
              titleStyle={{ color: "#000" }} // Texto negro opcional
            />
            <Menu.Item
              onPress={() => {
                closeMenuHeader();
              }}
              title="Acerca..."
              titleStyle={{ color: "#000" }} // Texto negro opcional
            />
            <Menu.Item
              onPress={() => {
                closeMenuHeader();
                logout();
              }}
              title="Cerrar Sesión"
              titleStyle={{ color: "#000" }} // Texto negro opcional
            />
          </Menu>
        </>
      ),
    });
  }, [navigation, menuVisibleHeader, ultimoTicket]);

  const { userData, logout } = useAuth();

  const [tiemposAnteriores, setTiemposAnteriores] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [sorteoNombre, setSorteoNombre] = useState("");
  const [sorteoId, setSorteoId] = useState(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [limpiar, setLimpiar] = useState(true);
  const [reventar, setReventar] = useState(false);
  const [sorteo, setSorteo] = useState("");
  const [fecha, setFecha] = useState(new Date()); // Siempre inicializa con un Date válido
  const [monto, setMonto] = useState("");
  const [numero, setNumero] = useState("");
  const [montoDisponible, setMontoDisponible] = useState("");
  const [montoReventado, setMontoReventado] = useState("");
  const [useReventado, setUseReventado] = useState(false);
  const [abiertoPorReventado, setAbiertoPorReventado] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const [showPicker, setShowPicker] = useState(false);

  const numeroRef = useRef(null);
  const montoRef = useRef(null);

  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;

  const handleImagePress = () => {
    //const mensaje = JSON.stringify(tiempoRef.current, null, 2);
    const mensaje = JSON.stringify("aqui metodo para guardar", null, 2);
    if (Platform.OS === "web") {
      window.alert(`Contenido de "tiempo":\n${mensaje}`);
    } else {
      Alert.alert("Contenido de 'tiempo'", mensaje);
    }
  };

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
                <TextInput
                  placeholder="Nombre Tiempos"
                  style={styles.input}
                  value={tiempo.clientName}
                  onChangeText={setClientName}
                />
                <TextInput
                  placeholder="Nombre Vendedor"
                  style={styles.input}
                  value={tiempo.clientName}
                  onChangeText={setClientName}
                />

                <TextInput
                  placeholder="Teléfono"
                  style={styles.input}
                  value={tiempo.clientName}
                  onChangeText={setClientName}
                />

                <TextInput
                  placeholder="Pie de Tiempo"
                  defaultValue={categoriasExtraerTexto}
                  onChangeText={setCategoriasExtraerTexto}
                  multiline={true} // <-- habilita multilinea
                  numberOfLines={4}
                  style={[
                    styles.input,
                    {
                      marginTop: 15,
                      textAlign: "center",
                      height: 100, // altura inicial en píxeles
                      maxHeight: 150, // altura máxima que puede crecer
                      textAlignVertical: "top", // para que el texto inicie en la parte superior (Android)
                    },
                  ]}
                />

                <View style={styles.switchGroup}>
                  <Pressable
                    style={styles.switchRow}
                    onPress={() => setLimpiar(!limpiar)}
                  >
                    <Text style={styles.switchLabel}>Impresión compacta</Text>
                    <Switch value={limpiar} onValueChange={setLimpiar} />
                  </Pressable>

                  <Pressable
                    style={styles.switchRow}
                    onPress={() => setLimpiar(!limpiar)}
                  >
                    <Text style={styles.switchLabel}>
                      Imprimir código de barras
                    </Text>
                    <Switch value={limpiar} onValueChange={setLimpiar} />
                  </Pressable>

                  <Pressable
                    style={styles.switchRow}
                    onPress={() => setLimpiar(!limpiar)}
                  >
                    <Text style={styles.switchLabel}>
                      Ver tiempo antes de enviar
                    </Text>
                    <Switch value={limpiar} onValueChange={setLimpiar} />
                  </Pressable>

                  <Pressable
                    style={styles.switchRow}
                    onPress={() => setLimpiar(!limpiar)}
                  >
                    <Text style={styles.switchLabel}>Requiere internet</Text>
                    <Switch value={limpiar} onValueChange={setLimpiar} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalBar}>
              <Text style={styles.totalText}>APP VERSION: </Text>
              <Text style={styles.totalValue}>1.0</Text>
            </View>
          </View>
        </>
      </View>

      <Portal>
        {/* Diálogo Tiempos Vendidos */}
        <Dialog
          visible={dialogTicketsVisible}
          onDismiss={closeDialogTickets}
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
                TIEMPOS VENDIDOS
              </Text>
            </View>
            <View style={{ maxHeight: height * 0.6 }}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 10 }}>
                {tiemposAnteriores.map((item, index) => (
                  <Pressable
                    key={item.id || index}
                    onPress={() => console.log("Seleccionado", item)}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee",
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>
                      Tiquete: # {item.ticketNumber || ""}
                    </Text>
                    <Text style={{ fontWeight: "bold" }}>
                      Cliente: {item.clientName || "Sin nombre"}
                    </Text>
                    <Text style={{ color: "#555" }}>
                      Fecha: {new Date(item.updatedAt).toLocaleString()}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="black"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={closeDialogTickets}
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
    paddingVertical: 10,
    borderTopWidth: 1,
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
    minWidth: 406,
  },
  inputSmall: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    minHeight: 40, // importante para móviles
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
  switchGroup: {
    flexDirection: "column",
    gap: Platform.OS === "web" ? 10 : 0, // solo en web,, // espacio entre líneas si usás expo SDK 50+, si no usás marginBottom en el hijo
 
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Platform.OS === "web" ? 10 : 0,
  },
  switchLabel: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
  
});
