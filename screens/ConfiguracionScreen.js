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
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

import { format } from "date-fns";
import { da, de, es, tr } from "date-fns/locale"; // idioma español
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerWeb from "../components/DatePickerWeb";
import { useAuth } from "../context/AuthContext";
import SorteoSelectorModal from "../components/SorteoSelectorModal";
import PrinterSizeSelectorModal from "../components/PrinterSizeSelectorModal";
import mSorteo from "../models/mSorteoSingleton.js";
import mSorteoRestringidos from "../models/mSorteoRestringidosSingleton";
import { useTiempo } from "../models/mTiempoContext";
import { convertNumero, validateMonto } from "../utils/numeroUtils";
import { parseMessage } from "../utils/UtilParseMessageAI";

export default function ConfiguracionScreen({ navigation, route }) {
  console.log("🎯 RENDER Configuracion Screen");
   const { showSnackbar } = useSnackbar();
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
  const [modalPrintPaperSizeVisible, setModalPrintPaperSizeVisible] =
    useState(false);

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

  useEffect(() => {}, [categoriaDialogVisible]);

  const { tiempo, setTiempo, resetTiempo, setClientName } = useTiempo();
  const { userData, ticketProfile, setTicketProfile, logout } = useAuth();

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
            onPress={handleSave}
          />
          <MaterialIcons
            name="download"
            size={24}
            color="#fff" // Blanco para contraste con fondo verde
            style={{ marginRight: 15 }}
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
  }, [navigation, menuVisibleHeader, ticketProfile]);



  const [tiemposAnteriores, setTiemposAnteriores] = useState([]);

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

  const handleSave = async () => {
    if (ticketProfile) {
      console.log("TICKET PROFILE A GUARDAR: ", ticketProfile);
      let result;
      try {
        const url = `https://3jbe.tiempos.website/api/ticketProfile/${ticketProfile?.userId}`;
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ticketProfile),
        });

        if (!response.ok) {
          showSnackbar("Error al guardar la configuración.", 3);
          throw new Error(`Error en el envío: ${response.status}`);
        }
        result = await response.json();
        console.log("RESULT DEL SAVE CONFIG: ", result);
        showSnackbar("La configuración fue guardada correctamente.", 1);
      } catch (error) {
        console.error("Error al guardar la configuración.", error);
        showSnackbar("Error al guardar la configuración.", 3);
      }
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
                  value={ticketProfile?.ticketTitle}
                  onChangeText={(text) =>
                    setTicketProfile((prev) => ({ ...prev, ticketTitle: text }))
                  }
                />
                <TextInput
                  placeholder="Nombre Vendedor"
                  style={styles.input}
                  value={ticketProfile?.sellerName}
                  onChangeText={(text) =>
                    setTicketProfile((prev) => ({ ...prev, sellerName: text }))
                  }
                />

                <TextInput
                  placeholder="Teléfono"
                  style={styles.input}
                  value={ticketProfile?.phoneNumber}
                  onChangeText={(text) =>
                    setTicketProfile((prev) => ({ ...prev, phoneNumber: text }))
                  }
                />

                <TextInput
                  placeholder="Pie de Tiempo"
                  defaultValue={ticketProfile?.ticketFooter}
                  multiline={true} // <-- habilita multilinea
                  numberOfLines={4}
                  onChangeText={(text) =>
                    setTicketProfile((prev) => ({
                      ...prev,
                      ticketFooter: text,
                    }))
                  }
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

                <Pressable
                  style={styles.inputSmall}
                  onPress={() => setModalPrintPaperSizeVisible(true)}
                >
                  <Text
                    style={{
                      color: ticketProfile?.printerSize ? "#000" : "#aaa",
                    }}
                  >
                    {ticketProfile?.printerSize
                      ? ticketProfile.printerSize
                      : "Tamaño impresión"}
                  </Text>
                </Pressable>
                <PrinterSizeSelectorModal
                  visible={modalPrintPaperSizeVisible}
                  onClose={() => setModalPrintPaperSizeVisible(false)}
                  onSelect={(size) => {
                    setTicketProfile((prev) => ({
                      ...prev,
                      printerSize: size,
                    }));
                  }}
                />

                <View style={styles.switchGroup}>
                  <Pressable
                    style={styles.switchRow}
                    onPress={() =>
                      setTicketProfile((prev) => ({
                        ...prev,
                        printBarCode: !prev?.printBarCode,
                      }))
                    }
                  >
                    <Text style={styles.switchLabel}>
                      Imprimir código de barras
                    </Text>
                    <Switch
                      value={ticketProfile?.printBarCode}
                      onValueChange={(val) =>
                        setTicketProfile((prev) => ({
                          ...prev,
                          printBarCode: val,
                        }))
                      }
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* app version */}
            <View style={styles.totalBar}>
              <Text style={styles.totalText}>APP VERSION: </Text>
              <Text style={styles.totalValue}>1.0</Text>
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
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    minHeight: 44, // altura mínima estándar de input
    justifyContent: "center", // centra verticalmente el texto
    marginTop: 15,
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
    marginTop: Platform.OS === "web" ? 10 : 0,
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
