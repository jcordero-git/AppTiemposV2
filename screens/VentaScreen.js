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
  Linking,
  Keyboard,
  InteractionManager,
  StatusBar,
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
import { WebView } from "react-native-webview";

import { printTicketWeb } from "../utils/print/printTicketWeb"; // ajusta la ruta si es necesario
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { generateHTML } from "../utils/share/generateHTML"; // Ajusta según tu estructura
import PrinterUtils from "../utils/print/printerUtils";

import RenderHTML from "react-native-render-html";
import { captureRef } from "react-native-view-shot";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

import { format } from "date-fns";
import { da, es } from "date-fns/locale"; // idioma español
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerWeb from "../components/DatePickerWeb";
import { useAuth } from "../context/AuthContext";
import SorteoSelectorModal from "../components/SorteoSelectorModal";
import RestringidosModal from "../components/RestringidosModal";
import mSorteo from "../models/mSorteoSingleton.js";
import mSorteoRestringidos from "../models/mSorteoRestringidosSingleton";
import { useTiempo } from "../models/mTiempoContext";
import { convertNumero, validateMonto } from "../utils/numeroUtils";
import { parseMessage } from "../utils/UtilParseMessageAI";
import mSorteoSingleton from "../models/mSorteoSingleton.js";
import {
  getInternetDate,
  getUpdatedInternetDate,
  formatDate,
  formatHour,
  timeStrToMilliseconds,
} from "../utils/datetimeUtils"; // ajusta el path si es necesario

export default function VentaScreen({ navigation, route }) {
  console.log("🎯 RENDER VentaScreen");
  const ticketRef = useRef(null);
  const { widthRender } = useWindowDimensions();
  const [html, setHtml] = React.useState(null);
  const [loaded, setLoaded] = useState(false);
  const [webviewHeight, setWebviewHeight] = useState(100); // altura inicial mínima
  const [iframeHeight, setIframeHeight] = useState(100);
  const iframeRef = useRef(null);
  const [generateImage, setGenerateImage] = useState(false);

  const { showSnackbar } = useSnackbar();
  const [menuVisibleHeader, setMenuVisibleHeader] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [categoriaDialogVisible, setCategoriaDialogVisible] = useState(false); // Diálogo selector de categoría
  const [dialogTicketsVisible, setDialogTicketsVisible] = useState(false);
  const [dialogRestringidoVisible, setDialogRestringidoVisible] =
    useState(false);
  const [dialogPrintVisible, setDialogPrintVisible] = useState(false);
  const [dialogPrecargarVisible, setDialogPrecargarVisible] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [idTicketSeleccionado, setIdTicketSeleccionado] = useState(0);
  const [posisionSorteoModalAlaIzquierda, setposisionSorteoModalAlaIzquierda] =
    useState(false);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [categoriasMonto, setCategoriasMonto] = useState("");
  const [categoriasTerminaEn, setCategoriasTerminaEn] = useState("");
  const [categoriasInicianCon, setCategoriasInicianCon] = useState("");
  const [categoriasDesde, setCategoriasDesde] = useState("");
  const [categoriasHasta, setCategoriasHasta] = useState("");
  const [categoriasExtraerTexto, setCategoriasExtraerTexto] = useState("");
  const [loading, setLoading] = useState(false);
  let tiempoNumerosBackup = null;
  const ejecutadoPorRestringidoDialogRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const [categoriasMontoTemporal, setCategoriasMontoTemporal] =
    useState(categoriasMonto);

  const menuAnchorRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBackgroundColor("#4CAF50");
      StatusBar.setBarStyle("dark-content");
    }, []),
  );

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
    return new Promise((resolve) => {
      setDialogNumeroRestringido(numero);
      setDialogMontoRestringidoDisponible(montoDisponible);
      setDialogRestringidoVisible(true);
      resolverDialogRef.current = resolve;
    });
  }

  // 🔹 MÉTODOS DEL DIÁLOGO

  const openDialoPrint = () => {
    setDialogPrintVisible(true);
  };

  const closeDialogPrint = () => {
    setDialogPrintVisible(false);
  };

  const openDialogRestringido = () => {
    setDialogRestringidoVisible(true);
  };

  const closeDialogRestringido = async () => {
    setNumero("");
    //numeroRef.current?.focus();
    setDialogRestringidoVisible(false);
  };

  const closeDialogPreCarga = async () => {
    setDialogPrecargarVisible(false);
    setCodigo("");
  };

  const actualizaRestringidos = async () => {
    // Paso 1: Obtener restricciones
    const response = await fetch(
      `https://3jbe.tiempos.website/api/restrictedNumbers/byUser/${userData.id}/${mSorteo.id}`,
    );
    const data = await response.json();

    const diaDelMes = new Date().getDate().toString().padStart(2, "0");
    const reglasProcesadas = data.map((item) => {
      if (item.restricted === "{DATE}") {
        return { ...item, restricted: diaDelMes };
      }
      return item;
    });
    mSorteo.restringidos = reglasProcesadas;
  };

  const openDialogTickets = () => {
    const actualizaTiemposVendidos = async () => {
      const { tiemposVendidos, lastTicketNumber } =
        await fetchTiemposAnteriores(
          tiempoRef.current?.drawCategoryId,
          tiempoRef.current?.drawDate,
        );
    };
    actualizaTiemposVendidos();
    setDialogTicketsVisible(true);
  };

  const closeDialogTickets = () => {
    setDialogTicketsVisible(false);
  };
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
      }
    }
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
          const result = await parseMessage(text, day, extraPrompt);
          return result;
        };

        const result = await runGeminiExample();
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
  const { userData, logout, ticketProfile } = useAuth();

  // El botón que actuará como anchor para el menú
  const MenuAnchor = (
    <TouchableOpacity onPress={openMenuHeader} style={{ marginRight: 10 }}>
      <MaterialIcons name="more-vert" size={24} color="#fff" />
    </TouchableOpacity>
  );
  const [refreshHeader, setRefreshHeader] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const isSharingRef = useRef(false);
  //const [modalVisiblePreCargar, setModalVisiblePreCargar] = useState(false);
  const [restringidosModalVisible, setRestringidosModalVisible] =
    useState(false);

  React.useLayoutEffect(() => {
    if (idTicketSeleccionado > 0) {
      navigation.setOptions({
        title: `CÓDIGO #${idTicketSeleccionado}`,
      });
    } else {
      navigation.setOptions({
        title: "VENTA",
      });
    }

    navigation.setOptions({
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <>
          {/* <Pressable style={{ marginRight: 20 }} onPress={openDialogTickets}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              {idTicketSeleccionado}
            </Text>
          </Pressable> */}

          <MaterialIcons
            name="list"
            size={24}
            color="#fff"
            style={{ marginRight: 20 }}
            onPress={openDialogTickets}
          />

          {((tiempoRef.current &&
            tiempoRef.current.drawCategoryId > 0 &&
            !!tiempoRef.current.drawDate &&
            Array.isArray(tiempoRef.current.numbers) &&
            tiempoRef.current.numbers.length > 0) ||
            (tiempoSeleccionado && tiempoSeleccionado.id > 0)) && (
            <>
              <TouchableOpacity
                disabled={isSharingRef.current}
                onPress={handleShare}
                style={{ opacity: isSharingRef.current ? 0.4 : 1 }}
              >
                <MaterialIcons
                  name={tiempoSeleccionado?.id > 0 ? "share" : "save"}
                  size={24}
                  color="#fff"
                  style={{ marginRight: 15 }}
                />
              </TouchableOpacity>
            </>
          )}
          {/* Menú anclado al botón visible */}
          <Menu
            visible={menuVisibleHeader}
            onDismiss={closeMenuHeader}
            anchor={MenuAnchor}
            contentStyle={{ backgroundColor: "white", marginRight: 15 }} // Fondo blanco
          >
            {tiempoSeleccionado && tiempoSeleccionado.id > 0 && (
              <Menu.Item
                onPress={() => {
                  closeMenuHeader();
                  handleNuevoTiempo();
                }}
                title="Nuevo Tiempo"
                titleStyle={{ color: "green" }}
              />
            )}
            <Menu.Item
              onPress={() => {
                closeMenuHeader();
                setDialogPrecargarVisible(true);
                handleNuevoTiempo();
                if (tiempoSeleccionado !== null) {
                  setCodigo(tiempoSeleccionado.id);
                }
              }}
              title="Pre Cargar"
              titleStyle={{ color: "#000" }} // Texto negro opcional
            />

            {tiempoSeleccionado == null && (
              <Menu.Item
                onPress={openDialogCategorias}
                title="Categorías Predeterminadas"
                titleStyle={{ color: "#000" }}
              />
            )}
            {tiempoSeleccionado && tiempoSeleccionado.id > 0 && (
              <Menu.Item
                onPress={() => {
                  closeMenuHeader();
                  handleBorrarTiempo(tiempoSeleccionado.id);
                }}
                title="Borrar Tiempo"
                titleStyle={{ color: "red" }}
              />
            )}
          </Menu>
        </>
      ),
    });
  }, [
    navigation,
    menuVisibleHeader,
    idTicketSeleccionado,
    refreshHeader,
    ticketProfile,
    isSharing,
  ]);

  const handleNuevoTiempo = async (id) => {
    limpiarDespuesDeImprimir(true);
    setMostrarCampos(true);
    setcamposBloqueados(false);
    setTiempoSeleccionado(null);
  };

  // function convertirFecha(fechaPreCarga) {
  //   const dia = parseInt(fechaPreCarga.slice(0, 2), 10);
  //   const mes = parseInt(fechaPreCarga.slice(2, 4), 10) - 1; // mes en JS es 0-based
  //   const anioCorto = parseInt(fechaPreCarga.slice(4, 6), 10);
  //   const anioCompleto = anioCorto < 50 ? 2000 + anioCorto : 1900 + anioCorto;

  //   const fecha = new Date(Date(anioCompleto, mes, dia));
  //   //fecha.setUTCDate(fecha.getUTCDate() + 1); // Compensar el desfase
  //   return formatDate(fecha, "yyyy-MM-dd");
  // }

  const fetchRestringidosBySorteoID = async () => {
    // Paso 1: Obtener restricciones
    const response = await fetch(
      `https://3jbe.tiempos.website/api/restrictedNumbers/byUser/${userData.id}/${mSorteo.id}`,
    );
    const data = await response.json();

    const diaDelMes = new Date().getDate().toString().padStart(2, "0");
    const reglasProcesadas = data.map((item) => {
      if (item.restricted === "{DATE}") {
        return { ...item, restricted: diaDelMes };
      }
      return item;
    });

    mSorteo.restringidos = reglasProcesadas;
  };

  const [restringidosDisponibles, setRestrigosDisponibles] = useState([]);
  const handleMuestraRestringidosDisponibles = async (resultado) => {
    const tiemposVendidos = tiemposAnteriores; // fallback al estado
    const setting = userData.settings.find(
      (s) => s.porcentaje_reventado_restringido !== undefined,
    );
    const porcentaje_reventado_restringido = setting
      ? parseFloat(setting.porcentaje_reventado_restringido)
      : 100; // valor por defecto si no se encuentra

    const nuevoArray = [];
    const numerosAgregados = new Set();

    console.log("RESTRINGIDOS SIN ACTUALIZAR: ", mSorteo.restringidos);
    await fetchRestringidosBySorteoID();
    console.log("RESTRINGIDOS ACTUALIZADOS: ", mSorteo.restringidos);

    for (const restriccion of mSorteo.restringidos) {
      const numeros = restriccion.restricted.split(",");

      for (const numero of numeros) {
        const numeroLimpio = numero.trim();

        if (numerosAgregados.has(numeroLimpio)) {
          continue;
        }

        const [allowRestringido, montoDisponible] = allowRestringidoFunction(
          numeroLimpio,
          0,
          items,
          tiemposVendidos,
        );

        let [allowRestringidoReventado, montoDisponibleReventado] =
          allowRestringidoReventadoFunction(
            numeroLimpio,
            0,
            porcentaje_reventado_restringido,
            items,
            tiemposVendidos,
          );

        nuevoArray.push({
          numero: numeroLimpio,
          permitido: allowRestringido,
          monto: Math.max(0, montoDisponible),
          rev_permitido: allowRestringidoReventado,
          rev_monto: montoDisponibleReventado,
        });
        numerosAgregados.add(numeroLimpio);
      }
    }
    setRestrigosDisponibles(nuevoArray); // ✅ guardar en el estado
    setRestringidosModalVisible(true);
  };

  const handlePreCargaTiempo = async (codigo) => {
    const codigoPreCargaInt = parseInt(codigo, 10);
    const tiempoSeleccionado = await fetchTiempoByID(codigoPreCargaInt);
    tiempoRef.current = {
      ...tiempoRef.current,
      numbers: [...tiempoSeleccionado.numbers],
      clientName: tiempoSeleccionado.clientName,
    };
    tiempoNumerosBackup = tiempoSeleccionado;
    const resultado = await inicializarYProcesar(tiempoRef.current);
    if (!resultado) {
      return; // ⛔ No continúa si hay errores
    }
    setDialogPrecargarVisible(false);
  };

  const fetchTiempoByID = async (code) => {
    const token = userData.token;
    try {
      if (code === 0) {
        return null;
      }
      const response = await fetch(
        `https://3jbe.tiempos.website/api/ticket/${code}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("RESPONSE DEL FETCH TIEMPO: ", response.status);

      if (response.status !== 200) {
        console.warn(`⚠️ Error al obtener tiempos: Status ${response.status}`);
        showSnackbar("⚠️ Error al obtener tiempos: Status: ", response.status);
        logout();
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al cargar el tiempos:", error);
      showSnackbar("⚠️ Tiempo no encontrado.", 2);
      return null; // ✅ fallback seguro
    }
  };

  const handleBorrarTiempo = async (id) => {
    const url = `https://3jbe.tiempos.website/api/ticket/${id}`;
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        // body: JSON.stringify(tiempoParaImprimir),
      });
      if (!response.ok) {
        showSnackbar("Error al eliminar el ticket.", 3);
        throw new Error(`Error en el envío: ${response.status}`);
      }
      const result = await response.json();
      if (result.message === "Success") {
        showSnackbar("Ticket eliminado correctamente.", 1);
      }
      //setTiempo(null);
      setItems([]);
      //setUltimoTicket(0);
      //tiempoSeleccionadoRef.current = null; // limpiar ref
      setTiempoSeleccionado(null);
      setIdTicketSeleccionado(0);
      setcamposBloqueados(false);
      setTiempo([]);
      setClientName("");
      ejecutadoPorRestringidoDialogRef.current = false;

      tiempoNumerosBackup = tiempoRef.current;
      const isAllowed = await inicializarYProcesar(tiempoNumerosBackup);
      setMostrarCampos(true);
    } catch (error) {
      console.error("Error al enviar el ticket:", error);
      Alert.alert("Error", "No se pudo eliminar el ticket.");
      showSnackbar("Error al eliminar el ticket.", 3);
    }
  };

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
  const [mostrarCampos, setMostrarCampos] = useState(true);
  const [camposBloqueados, setcamposBloqueados] = useState(false);

  const numeroRef = useRef(null);
  const montoRef = useRef(null);

  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;

  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const [items, setItems] = useState([]);

  //const [menuVisibleHeader, setMenuVisibleHeader] = useState(false);
  //const openMenu = () => setMenuVisibleHeader(true);
  //const closeMenu = () => setMenuVisibleHeader(false);

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

  const tiempoRef = useRef(tiempo);
  const tiempoAImprimirRef = useRef(tiempo);
  //const tiempoSeleccionadoRef = useRef(tiempo);
  const [tiempoSeleccionado, setTiempoSeleccionado] = useState(null);
  const limpiarRef = useRef(limpiar);

  const parseFechaLocalDesdeInput = (value) => {
    const [year, month, day] = value.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const formattedDate = formatDate(fecha, "EE dd/MM/yyyy");

  const handleImagePress = () => {
    const mensaje = JSON.stringify(tiempoRef.current, null, 2);
    if (Platform.OS === "web") {
      window.alert(`Contenido de "tiempo":\n${mensaje}`);
    } else {
      Alert.alert("Contenido de 'tiempo'", mensaje);
    }
  };

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

  const handleReventarChange = (event) => {
    setReventar(!reventar);
    if (reventar === false) {
      setMontoReventado("");
    }
  };

  const handleSubmitReventar = (event) => {
    const submitReventar = async () => {
      //let montoReventado = parseInt(montoReventado, 10);
      const [currentItems, resultIsAllowedFromMethod] =
        await verificaRestringidosYAgregaNumero(
          monto,
          numero,
          reventar,
          montoReventado,
          items,
          tiemposAnteriores,
        );

      // Paso 6: Actualizar estado final
      setItems(currentItems);
      const nuevosMontoNumeros = currentItems.map((item) => ({
        monto: item.monto,
        numero: item.numero,
        reventado: item.reventado,
        montoReventado: item.montoReventado,
      }));
      actualizarMontoNumerosEnTiempo(nuevosMontoNumeros);
    };
    submitReventar();
  };

  const fetchSorteos = async (sorteoSeleccionado) => {
    try {
      const res = await fetch(
        `https://3jbe.tiempos.website/api/drawCategory/user/${userData.id}`,
      );
      const data = await res.json();

      const sorteosOrdenados = data.sort((a, b) => {
        const horaA = new Date(`1970-01-01T${a.limitTime}Z`);
        const horaB = new Date(`1970-01-01T${b.limitTime}Z`);
        return horaA - horaB;
      });

      const sorteoActualizado = sorteosOrdenados.find(
        (s) => s.id === sorteoSeleccionado.id,
      );

      if (sorteoActualizado) {
        return sorteoActualizado;
      } else {
        console.warn("⚠️ Sorteo no encontrado tras actualización.");
        return sorteoSeleccionado; // fallback
      }
    } catch (error) {
      console.error("Error al obtener sorteos:", error);
      return sorteoSeleccionado; // fallback en error
    }
  };

  const handlePrintBt = async () => {
    try {
      let tiempoAImprimir =
        tiempoSeleccionado !== null
          ? tiempoSeleccionado
          : tiempoAImprimirRef.current;
      if (Platform.OS === "android") {
        const mac = ticketProfile.lastPrinterMacAddress;
        try {
          await PrinterUtils.connectToDevice(mac);
        } catch (error) {
          console.warn("No se pudo conectar al MAC guardado. Escaneando...");
          const dispositivos = [];
          await new Promise((resolve, reject) => {
            PrinterUtils.scanDevices((device) => {
              dispositivos.push(device);
              if (device.id === mac) {
                resolve();
              }
            });
            window.setTimeout(() => {
              reject(new Error("Tiempo de escaneo agotado"));
            }, 10000);
          });
          const found = dispositivos.find((d) => d.id === mac);
          if (!found) {
            showSnackbar(
              "Impresora no encontrada. Por favor empareje desde ajustes.",
              3,
            );
            return;
          }
          await PrinterUtils.connectToDevice(found.id);
        }
        await PrinterUtils.printTicket({
          tiempo: tiempoAImprimir,
          sorteoSeleccionado: mSorteo,
          vendedorData: userData,
          ticketProfile: ticketProfile,
          re_impresion: tiempoSeleccionado !== null ? true : false,
        });

        if (limpiarRef.current && !tiempoSeleccionado) {
          limpiarDespuesDeImprimir();
        }
        await PrinterUtils.disconnect();
      } else if (Platform.OS === "web") {
        const iframeWindow = iframeRef.current.contentWindow;
        iframeWindow.focus();
        iframeWindow.print();
      }
    } catch (e) {
      console.error("Error al imprimir:", e);
      showSnackbar(
        "Hubo un error al imprimir. Revisa la conexión con la impresora.",
        3,
      );
    }
  };

  const handleShare = async () => {
    if (isSharingRef.current) return; // Bloquea inmediatamente
    isSharingRef.current = true;
    setIsSharing(true); // Estado visual

    setIframeHeight(100);
    setWebviewHeight(100);
    let result;

    // 💡 Esperar que React Native aplique el cambio visualmente
    // await new Promise((resolve) =>
    //   requestAnimationFrame(() => {
    //     InteractionManager.runAfterInteractions(resolve);
    //   }),
    // );

    try {
      if (!fecha || !sorteoId || !userData?.id) return;

      if (tiempoSeleccionado !== null) {
        result = tiempoSeleccionado;
      } else {
        // if (
        //   formatDate(fecha, "yyyy-MM-dd") !==
        //     formatDate(getInternetDate(), "yyyy-MM-dd") &&
        //   !tiempoSeleccionado
        // ) {
        //   showSnackbar("SORTEO CERRARO.", 3);
        //   return;
        // } else {
        //   const updatedSorteo = await fetchSorteos(mSorteo);
        //   Object.assign(mSorteo, sorteo);
        //   const internetTimeStr = format(
        //     await getUpdatedInternetDate(),
        //     "HH:mm:ss",
        //   );
        //   const serverLimit = updatedSorteo.limitTime;
        //   if (
        //     timeStrToMilliseconds(serverLimit) <=
        //     timeStrToMilliseconds(internetTimeStr)
        //   ) {
        //     showSnackbar("SORTEO CERRARO.", 3);
        //     return;
        //   }
        // }
        ejecutadoPorRestringidoDialogRef.current = false;
        tiempoNumerosBackup = tiempoRef.current;
        const resultado = await inicializarYProcesar(tiempoNumerosBackup);
        if (!resultado) {
          return; // ⛔ No continúa si hay errores
        }
        const tiempoParaImprimir = resultado;
        const url = `https://3jbe.tiempos.website/api/ticket/`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tiempoParaImprimir),
        });

        if (!response.ok) {
          showSnackbar("Error al registrar el ticket, intente nuevamente.", 3);
          throw new Error(`Error en el envío: ${response.status}`);
        }
        result = await response.json();
        const { tiemposVendidos, lastTicketNumber } =
          await fetchTiemposAnteriores(
            tiempoParaImprimir.drawCategoryId,
            tiempoParaImprimir.drawDate,
          );
        showSnackbar("El ticket fue registrado correctamente.", 1);
        tiempoRef.current = tiempoParaImprimir;
        tiempoAImprimirRef.current = result;
      }

      const htmlGenerado = await generateHTML(
        result,
        mSorteo,
        userData,
        ticketProfile,
        tiempoSeleccionado !== null ? true : false,
      );
      setHtml(htmlGenerado);
      setLoaded(false);
      setDialogPrintVisible(true);
      Keyboard.dismiss(); // Oculta el teclado

      if (Platform.OS === "web") {
        window.location.href = "whatsapp://";
      }

      if (limpiarRef.current && !tiempoSeleccionado) {
        //limpiarDespuesDeImprimir();//TODO: revisar esta linea, hay que limmpiar el tiemmpo.ref
      }
      isSharingRef.current = false;
      setIsSharing(false); // Estado visual
    } catch (error) {
      console.error("Error al enviar el ticket:", error);
      Alert.alert("Error", "No se pudo enviar el ticket.");
      showSnackbar("Error al registrar el ticket, intente nuevamente.", 3);
      setLoaded(false);
    } finally {
      isSharingRef.current = false;
      setIsSharing(false); // Estado visual
    }
  };

  const [imageToShare, setImageToShare] = useState(null);

  useEffect(() => {
    if (!imageToShare) return;

    const share = async () => {
      const path = FileSystem.documentDirectory + `ticket_${Date.now()}.png`;

      await FileSystem.writeAsStringAsync(
        path,
        imageToShare.replace("data:image/png;base64,", ""),
        { encoding: FileSystem.EncodingType.Base64 },
      );
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: "image/png",
          dialogTitle: "Compartir ticket",
        });
        //window.setTimeout(() => setGenerateImage(false), 500); // esperar medio segundo antes de ocultar
      }

      setGenerateImage(false);
      setImageToShare(null); // limpiar
    };

    // Pequeño retraso para asegurar el contexto correcto del intent
    window.setTimeout(share, 100);
  }, [imageToShare]);

  useEffect(() => {
    if (!html || !loaded) return;

    const compartir = async () => {
      if (Platform.OS === "web") {
        const html2canvas = (await import("html2canvas")).default;
        const container = window.document.createElement("div");

        container.innerHTML = html;
        container.style.width = "58mm";
        container.style.padding = "10px";
        container.style.margin = "10";
        container.style.boxSizing = "border-box";
        container.style.backgroundColor = "white";

        window.document.body.appendChild(container);
        await new Promise((r) => window.setTimeout(r, 100));

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const imgDataUrl = canvas.toDataURL("image/png");
        const link = window.document.createElement("a");
        link.href = imgDataUrl;
        link.download = `ticket_${Date.now()}.png`;
        link.click();

        window.document.body.removeChild(container);
      } else {
        // try {
        //   const uri = await captureRef(ticketRef.current, {
        //     format: "png",
        //     quality: 1,
        //     result: "tmpfile", // o base64 si prefieres compartir directamente
        //   });

        //   const canShare = await Sharing.isAvailableAsync();

        //   if (canShare) {
        //     await Sharing.shareAsync(uri, {
        //       mimeType: "image/png",
        //       dialogTitle: "Compartir ticket",
        //     });
        //   } else {
        //     const url = `whatsapp://send?text=${encodeURIComponent("Revisa el ticket generado.")}`;
        //     Linking.openURL(url);
        //   }
        // } catch (e) {
        //   console.error("Error compartiendo el ticket:", e);
        // }
        setGenerateImage(true); // activa WebView oculto para capturar
      }
    };

    compartir();
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleMessage = (event) => {
      if (
        event.data &&
        typeof event.data === "object" &&
        event.data.type === "htmlHeight"
      ) {
        const newHeight = parseInt(event.data.height, 10);
        setIframeHeight((prev) => (newHeight > prev ? newHeight : prev));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const cargarTiempoSeleccionado = (tiempoCargado) => {
    setIdTicketSeleccionado(tiempoCargado.id);
    setClientName(tiempoCargado.clientName || "Sin Nombre");
    const numbersConKey = (tiempoCargado.numbers || []).map((item) => ({
      ...item,
      key: generateKey(), // Asignas un key único aquí
    }));
    setItems(numbersConKey || []);
    //setTiempo(tiempoCargado);
    //tiempoRef.current = tiempoCargado;

    setTiempoSeleccionado(tiempoCargado);
    setMostrarCampos(false);
    setLimpiar(true);
    setReventar(false);
    setIsMontoLocked(false);
    setcamposBloqueados(true);
  };

  const limpiarDespuesDeImprimir = (desdeNuevoTiempo = false) => {
    if ((limpiarRef.current && !tiempoSeleccionado) || desdeNuevoTiempo) {
      const tiempoLimpio = {
        ...tiempo,
        numbers: [],
        clientName: "",
      };
      setTiempo(tiempoLimpio);
      setItems([]);
      tiempoRef.current = tiempoLimpio;
      setIdTicketSeleccionado(0);
      setDialogPrintVisible(false);

      setIsMontoLocked(false);
      setMonto("");
      setNumero("");
    }

    //montoRef.current?.focus();
  };

  const [isMontoLocked, setIsMontoLocked] = useState(false);
  const [shouldFocusMonto, setShouldFocusMonto] = useState(false);

  useEffect(() => {
    if (!isMontoLocked && shouldFocusMonto) {
      window.setTimeout(() => {
        montoRef.current?.focus();
      }, 100); // o prueba con 300
      setShouldFocusMonto(false); // Reset
    }
  }, [isMontoLocked, shouldFocusMonto]);

  function getMontoPorNumero(items, numero) {
    return items?.reduce((sum, item) => {
      const mismoNumero = item.numero === numero;
      const monto = parseFloat(item.monto);
      const montoValido = mismoNumero && !isNaN(monto) ? monto : 0;
      return sum + montoValido;
    }, 0);
  }

  function getMontoPorNumeroEnTiemposVendidos(tiemposAnteriores, numero) {
    return tiemposAnteriores
      .filter((ticket) => ticket.status !== true) // solo los no confirmados
      .reduce((total, ticket) => {
        const sumaMontosTicket = ticket.numbers.reduce((sum, num) => {
          const esNumeroBuscado = num.numero === numero;
          const monto = parseFloat(num.monto);
          return sum + (esNumeroBuscado && !isNaN(monto) ? monto : 0);
        }, 0);
        return total + sumaMontosTicket;
      }, 0);
  }

  function getMontoReventadoPorNumero(items, numero) {
    return items?.reduce((sum, item) => {
      const mismoNumero = item.numero === numero;
      const monto = parseFloat(item.montoReventado);
      const montoValido = mismoNumero && !isNaN(monto) ? monto : 0;
      return sum + montoValido;
    }, 0);
  }

  function getMontoPorNumeroReventadoEnTiemposVendidos(
    tiemposAnteriores,
    numero,
  ) {
    return tiemposAnteriores
      .filter((ticket) => ticket.status !== true) // solo los no confirmados
      .reduce((total, ticket) => {
        const sumaMontosTicket = ticket.numbers.reduce((sum, num) => {
          const esNumeroBuscado = num.numero === numero;
          const monto = parseFloat(num.montoReventado);
          return sum + (esNumeroBuscado && !isNaN(monto) ? monto : 0);
        }, 0);
        return total + sumaMontosTicket;
      }, 0);
  }

  // Calcular total
  const total = items?.reduce((sum, item) => {
    const monto = parseFloat(item.monto);
    const montoReventado = parseFloat(item.montoReventado);

    const montoValido = !isNaN(monto) ? monto : 0;
    const montoReventadoValido = !isNaN(montoReventado) ? montoReventado : 0;

    return sum + montoValido + montoReventadoValido;
  }, 0);

  // Calcular total sin reventados
  function totalSinReventados(tiemposActualNumbers = []) {
    return tiemposActualNumbers.reduce((sum, item) => {
      const monto = parseFloat(item.monto);
      const montoValido = !isNaN(monto) ? monto : 0;
      return sum + montoValido;
    }, 0);
  }

  // Calcular total solo reventados
  function totalNormalYReventados(tiemposActualNumbers = []) {
    return tiemposActualNumbers.reduce((sum, item) => {
      const monto = parseFloat(item.monto) + parseFloat(item.montoReventado);
      const montoValido = !isNaN(monto) ? monto : 0;
      return sum + montoValido;
    }, 0);
  }

  function sumaTotalSinReventadosVendidos(tiemposVendidos = []) {
    return tiemposVendidos
      .filter((ticket) => ticket.status !== true)
      .reduce((total, ticket) => {
        const sumaMontosTicket = ticket.numbers.reduce((sum, num) => {
          const monto = parseFloat(num.monto);
          return sum + (!isNaN(monto) ? monto : 0);
        }, 0);
        return total + sumaMontosTicket;
      }, 0);
  }

  function sumaTotalNormalYReventadosVendidos(tiemposVendidos = []) {
    return tiemposVendidos
      .filter((ticket) => ticket.status !== true) // filtrar los que no tengan status true
      .reduce((total, ticket) => {
        const sumaMontosTicket = ticket.numbers.reduce((sum, num) => {
          const monto = parseFloat(num.monto) + parseFloat(num.montoReventado);
          return sum + (!isNaN(monto) ? monto : 0);
        }, 0);
        return total + sumaMontosTicket;
      }, 0);
  }

  // const asignarItemsAMontoNumeros = () => {
  //   setTiempo((prev) => {
  //     const nuevoTiempo = {
  //       ...prev,
  //       montoNumeros: items.map((item) => ({
  //         monto: item.monto,
  //         numero: item.numero,
  //         ...(item.montoReventado ? { rev: item.montoReventado } : {}),
  //       })),
  //     };

  //     return nuevoTiempo;
  //   });
  // };

  const reventarRef = useRef(null);

  const txtNumeroDone = (
    currentItems,
    monto,
    numero,
    reventar,
    montoReventado,
  ) => {
    setNumero(""); // Limpiar número
    if (!isMontoLocked) {
      setMonto(""); // Limpiar monto
      montoRef.current?.focus(); // Volver a poner el enfoque en el monto
    } else {
      numeroRef.current?.focus();
    }
    setMontoReventado("");

    return addNumeroToListAdapter(
      currentItems,
      monto,
      numero,
      reventar,
      montoReventado,
    );
  };

  const txtNumeroDonev2 = (currentItems, monto, numero) => {
    //const restricciones = mSorteo.restringidos || [];

    //if (validarMontoContraRestricciones(numero, monto, restricciones)) {
    //return currentItems; // Se detiene si hay una restricción
    //}
    //addNumeroToListAdapter(monto, numero, reventar, monto_reventar);
    const updatedItems = addNumeroToListAdapter(
      currentItems,
      monto,
      numero,
      reventar,
      montoReventado,
    );

    setNumero(""); // Limpiar número
    if (!isMontoLocked) {
      setMonto(""); // Limpiar monto
      montoRef.current?.focus(); // Volver a poner el enfoque en el monto
    } else {
      numeroRef.current?.focus();
    }
    setMontoReventado("");
    return updatedItems;
  };

  const actualizarMontoNumerosEnTiempo = (montoNumeros) => {
    setTiempo((prev) => ({
      ...prev,
      numbers: montoNumeros,
    }));
    setRefreshHeader((prev) => prev + 1);
  };

  const addNumeroToListAdapter = (
    currentItems,
    monto,
    numero,
    reventado,
    montoReventado,
  ) => {
    const existingItemIndex = currentItems.findIndex(
      (item) => item.numero === numero,
    );
    let updatedItems = [...currentItems];

    if (existingItemIndex !== -1) {
      updatedItems[existingItemIndex].monto = (
        parseInt(updatedItems[existingItemIndex].monto) + parseInt(monto)
      ).toString();

      if (reventado) {
        updatedItems[existingItemIndex].montoReventado = (
          parseInt(updatedItems[existingItemIndex].montoReventado) +
          parseInt(montoReventado)
        ).toString();
        updatedItems[existingItemIndex].reventado = reventado;
      }

      // Mover al principio
      const itemToMove = updatedItems.splice(existingItemIndex, 1)[0];
      updatedItems.unshift(itemToMove);
    } else {
      const newItem = {
        key: generateKey(),
        monto: parseInt(monto, 10),
        numero: numero.toString(),
        reventado: reventado,
        montoReventado: reventado ? parseInt(montoReventado, 10) : 0,
      };
      updatedItems = [newItem, ...updatedItems];
    }

    return updatedItems;
  };

  function generateKey() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  const validarMontoContraRestricciones = (numero, monto, restricciones) => {
    const montoNumerico = parseFloat(monto);

    const restriccionViolada = restricciones.find((regla) => {
      // Si es una regla de tipo fecha
      if (regla.restricted === "{DATE}") {
        const hoy = new Date();
        const dia = hoy.toLocaleDateString("es-ES", {
          day: "2-digit",
          timeZone: "America/Costa_Rica", // Asegúrate de usar el timezone correcto si es necesario
        });
        const aplicaAlNumero = numero === dia;
        return (
          aplicaAlNumero && montoNumerico > parseFloat(regla.restrictedAmount)
        );
      }

      const valoresRestringidos = regla.restricted
        ?.split(",")
        .map((val) => val.trim());

      const aplicaAlNumero = valoresRestringidos?.includes(numero);
      return (
        aplicaAlNumero && montoNumerico > parseFloat(regla.restrictedAmount)
      );
    });

    if (restriccionViolada) {
      Alert.alert(
        "Restricción activa",
        `El monto para el número ${numero} debe ser mínimo ₡${restriccionViolada.restrictedAmount}.`,
      );
      return true; // Hubo una violación
    }
    return false; // Todo bien
  };

  const fetchTiemposAnteriores_insecure = async (drawCategoryId, drawDate) => {
    const token = userData.token;
    try {
      if (drawCategoryId === 0 || !drawDate) {
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }
      const response = await fetch(
        `https://3jbe.tiempos.website/api/ticket/${drawCategoryId}/${drawDate}`,
      );
      const data = await response.json();
      const sortedData = data.sort((a, b) => b.id - a.id);
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

  const fetchTiemposAnteriores = async (drawCategoryId, drawDate) => {
    const token = userData.token;
    try {
      if (drawCategoryId === 0 || !drawDate) {
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }
      const response = await fetch(
        `https://3jbe.tiempos.website/api/ticket/${drawCategoryId}/${drawDate}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== 200) {
        console.warn(`⚠️ Error al obtener tiempos: Status ${response.status}`);
        showSnackbar("⚠️ Error al obtener tiempos: Status: ", response.status);
        logout();
        return {
          tiemposVendidos: [],
          lastTicketNumber: 0,
        };
      }

      const data = await response.json();
      const sortedData = data.sort((a, b) => b.id - a.id);
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

  function allowRestringidoFunction(
    numero,
    monto,
    items,
    tiemposVendidosExternos,
  ) {
    const montoInt = Number(monto || 0);
    let montoDisponible = 0;

    const sumMonto_restrictedNum = sumaTotalSinReventadosVendidos(
      tiemposVendidosExternos,
    );

    const montoAlreadyInserted = totalSinReventados(items);

    const motoVentaTotal = montoAlreadyInserted + sumMonto_restrictedNum;
    const totalPorNumero_AlreadyInserted = getMontoPorNumero(items, numero);
    const totalPorNumero_TiemposVendidos = Number(
      getMontoPorNumeroEnTiemposVendidos(tiemposVendidosExternos, numero) || 0,
    );

    let montoAllowed = 0;
    if (getMontoRestringido(numero, motoVentaTotal) !== null) {
      montoAllowed = Number(getMontoRestringido(numero, motoVentaTotal) || 0);
    } else {
      return [true, montoAllowed];
    }

    if (montoAllowed === null) {
      return [true, montoAllowed];
    } else {
      if (
        totalPorNumero_TiemposVendidos +
          montoInt +
          totalPorNumero_AlreadyInserted >
        montoAllowed
      ) {
        montoDisponible =
          montoAllowed -
          (totalPorNumero_TiemposVendidos + totalPorNumero_AlreadyInserted);
        return [false, montoDisponible];
      } else {
        montoDisponible =
          montoAllowed -
          (totalPorNumero_TiemposVendidos + totalPorNumero_AlreadyInserted);
        return [true, montoDisponible];
      }
    }
  }

  function allowRestringidoReventadoFunction(
    numero,
    monto,
    porcentajeReventado,
    items,
    tiemposVendidosExternos,
  ) {
    const montoInt = Number(monto || 0);
    let montoDisponible = 0;

    const sumMonto_restrictedNum = sumaTotalNormalYReventadosVendidos(
      tiemposVendidosExternos,
    );

    const montoAlreadyInserted = totalNormalYReventados(items);
    const motoVentaTotal = montoAlreadyInserted + sumMonto_restrictedNum;
    const totalPorNumero_AlreadyInserted = getMontoReventadoPorNumero(
      items,
      numero,
    );
    const totalPorNumero_TiemposVendidos = Number(
      getMontoPorNumeroReventadoEnTiemposVendidos(
        tiemposVendidosExternos,
        numero,
      ) || 0,
    );

    let montoAllowed = 0;
    if (getMontoRestringido(numero, motoVentaTotal) !== null) {
      montoAllowed = Number(
        getMontoRestringido(numero, motoVentaTotal) *
          (porcentajeReventado / 100) || 0,
      );
    } else {
      return [true, montoAllowed];
    }

    if (montoAllowed === null) {
      return [true, montoAllowed];
    } else {
      if (
        totalPorNumero_TiemposVendidos +
          montoInt +
          totalPorNumero_AlreadyInserted >
        montoAllowed
      ) {
        montoDisponible =
          montoAllowed -
          totalPorNumero_TiemposVendidos +
          totalPorNumero_AlreadyInserted;
        return [false, montoDisponible];
      } else {
        return [true, montoAllowed];
      }
    }
  }

  function getMontoRestringido(numero, totalVenta) {
    const montosPermitidos = [];

    const restricciones = mSorteo.restringidos || [];

    restricciones.forEach((regla) => {
      const valoresRestringidos = regla.restricted.split(",");

      if (valoresRestringidos.includes(numero.toString())) {
        if (regla.isRestrictedByPercent) {
          const porcentaje = regla.sellerRestrictedPercent / 100;
          let montoPermitido = totalVenta * porcentaje;

          if (montoPermitido < regla.restrictedAmount) {
            montosPermitidos.push(regla.restrictedAmount);
          } else {
            montosPermitidos.push(montoPermitido);
          }
        } else {
          montosPermitidos.push(regla.restrictedAmount);
        }
      }
    });

    if (montosPermitidos.length > 0) {
      return Math.min(...montosPermitidos);
    } else {
      return null;
    }
  }

  const inicializarYProcesar = async (tiempoNumerosBackup) => {
    try {
      setLoading(true); // Mostrar loader

      let isAllowed = true;
      let resultIsAllowedFromMethod = true;

      // Paso 1: Obtener restricciones
      const response = await fetch(
        `https://3jbe.tiempos.website/api/restrictedNumbers/byUser/${userData.id}/${mSorteo.id}`,
      );
      const data = await response.json();

      const diaDelMes = new Date().getDate().toString().padStart(2, "0");
      const reglasProcesadas = data.map((item) => {
        if (item.restricted === "{DATE}") {
          return { ...item, restricted: diaDelMes };
        }
        return item;
      });

      mSorteo.restringidos = reglasProcesadas;

      // Paso 2: Guardar copia de números anteriores
      const numbersOriginales = [...(tiempoNumerosBackup.numbers || [])];

      // Paso 3: Limpiar tiempo y items
      const tiempoBackup = { ...tiempoNumerosBackup };

      const tiempoBase = {
        ...tiempo,
        ticketNumber: 1,
        userId: userData.id,
        drawCategoryId: sorteoId,
        //drawDate: format(fecha, "yyyy-MM-dd", { locale: es }),
        drawDate: formatDate(fecha, "yyyy-MM-dd"),
        numbers: [],
      };
      //setTiempo(tiempoBase);
      setItems([]);

      // Paso 4: Fetch de tiempos anteriores
      const { tiemposVendidos, lastTicketNumber } =
        await fetchTiemposAnteriores(sorteoId, tiempoBase.drawDate);

      // const tiempoBaseActualizaTicketNummber = {
      //   ...tiempoBase,
      //   ticketNumber: lastTicketNumber + 1,
      // };
      // setTiempo(tiempoBaseActualizaTicketNummber);

      // Paso 5: Reinsertar números uno por uno
      let currentItems = [];

      for (const item of numbersOriginales) {
        const monto = parseInt(item.monto, 10);
        const numero = item.numero;
        const reventar = item.reventado;
        const montoReventado = parseInt(item.montoReventado, 10);

        [currentItems, resultIsAllowedFromMethod] =
          await verificaRestringidosYAgregaNumero(
            monto,
            numero,
            reventar,
            montoReventado,
            currentItems,
            tiemposVendidos,
          );
        // Si la validación falló y no lo agregó
        if (resultIsAllowedFromMethod === false) {
          isAllowed = false;
        }
      }

      // Paso 6: Actualizar estado final
      setItems(currentItems);
      const nuevosMontoNumeros = currentItems
        .map((item) => ({
          monto: item.monto,
          numero: item.numero,
          reventado: item.reventado,
          montoReventado: item.montoReventado,
        }))
        .sort((a, b) => b.monto - a.monto); // Orden descendente por monto

      actualizarMontoNumerosEnTiempo(nuevosMontoNumeros);

      const tiempoFinal = {
        ...tiempoBackup, // <-- esto asegura que se mantenga clientName y demás
        drawDate: tiempoBase.drawDate,
        userId: tiempoBase.userId,
        drawCategoryId: tiempoBase.drawCategoryId,
        ticketNumber: lastTicketNumber + 1,
        numbers: nuevosMontoNumeros,
      };
      //setUltimoTicket(lastTicketNumber + 1);
      //setUltimoTicket("Tiempos Vendidos");
      setTiempo(tiempoFinal);

      tiempoRef.current = tiempoFinal;
      tiempoAImprimirRef.current = tiempoFinal;
      setLoading(false); // Ocultar loader
      return isAllowed ? tiempoFinal : false;
      //return isAllowed; // ✅ validaciones pasaron
    } catch (error) {
      console.error("Error en inicialización de sorteo/fecha:", error);
      return false;
    } finally {
      setLoading(false); // Ocultar loader
    }
  };

  useEffect(() => {
    if (!fecha || !sorteoId || !userData?.id) return;
    async function execute() {
      ejecutadoPorRestringidoDialogRef.current = false;
      tiempoNumerosBackup = tiempoRef.current;
      const isAllowed = await inicializarYProcesar(tiempoNumerosBackup);
    }
    execute();
  }, [sorteoId, fecha]);

  useEffect(() => {
    tiempoRef.current = tiempo;
  }, [tiempo]);
  useEffect(() => {
    limpiarRef.current = limpiar;
  }, [limpiar]);

  async function verificaRestringidosYAgregaNumero(
    monto,
    numero,
    reventar,
    montoReventado,
    currentItems,
    tiemposVendidosExternos,
  ) {
    const tiemposVendidos = tiemposVendidosExternos ?? tiemposAnteriores; // fallback al estado
    const setting = userData.settings.find(
      (s) => s.porcentaje_reventado_restringido !== undefined,
    );
    const porcentaje_reventado_restringido = setting
      ? parseFloat(setting.porcentaje_reventado_restringido)
      : 100; // valor por defecto si no se encuentra

    let [allowRestringido, montoDisponible] = allowRestringidoFunction(
      numero,
      monto,
      currentItems,
      tiemposVendidos,
    );

    if (montoDisponible < 0) montoDisponible = 0;

    let updatedItems = currentItems ? [...currentItems] : [...items];
    if (allowRestringido) {
      if (reventar) {
        if (mSorteo.useReventado === true) {
          let [allowRestringidoReventado, montoDisponibleReventado] =
            allowRestringidoReventadoFunction(
              numero,
              montoReventado,
              porcentaje_reventado_restringido,
              currentItems,
              tiemposVendidos,
            );

          if (montoDisponibleReventado < 0) montoDisponibleReventado = 0;
          if (allowRestringidoReventado) {
            updatedItems = txtNumeroDone(
              updatedItems,
              monto,
              numero,
              reventar,
              montoReventado,
            );
          } else {
            setAbiertoPorReventado(true);
            await esperarConfirmacionDialog(numero, montoDisponibleReventado);
            return [currentItems ?? items, false];
          }
        } else {
          showSnackbar("El sorteo no admite reventados.", 3);
        }
      } else {
        updatedItems = txtNumeroDone(
          updatedItems,
          monto,
          numero,
          reventar,
          montoReventado,
        );
      }
    } else {
      setAbiertoPorReventado(false);
      await esperarConfirmacionDialog(numero, montoDisponible);
      return [currentItems ?? items, false];
    }
    return [updatedItems ?? items, true];
  }

  const submitNumero = async () => {
    if (!reventar) {
      if (numero.length === 2) {
        if (monto.trim() === "" || numero.trim() === "") {
          Alert.alert("Error", "Debe ingresar monto y número válidos.");
          return;
        }
        tiempoNumerosBackup = tiempoRef.current;
        const nuevoNumero = {
          monto: monto,
          numero: numero,
          reventado: false,
          montoReventado: 0,
        };
        tiempoNumerosBackup.numbers.push(nuevoNumero);
        ejecutadoPorRestringidoDialogRef.current = false;

        const [currentItems] = await verificaRestringidosYAgregaNumero(
          monto,
          numero,
          false,
          0,
          items,
          tiemposAnteriores,
        );

        setItems(currentItems);
        const nuevosMontoNumeros = currentItems.map((item) => ({
          monto: item.monto,
          numero: item.numero,
          reventado: item.reventado,
          montoReventado: item.montoReventado,
        }));
        actualizarMontoNumerosEnTiempo(nuevosMontoNumeros);
      } else if (numero.length > 2) {
        // Si el número tiene más de 2 dígitos, limpiamos el campo
        setNumero(""); // Limpiar número si tiene más de 2 dígitos
        Alert.alert("Error", "El número debe tener exactamente 2 dígitos.");
      }
    } else {
      if (numero.length === 2 && useReventado) {
        reventarRef.current?.focus();
      }
    }
  };

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
        }
      })();
    }, [fecha, sorteoId]), // <--- agregá las dependencias acá
  );

  useEffect(() => {
    if (monto !== "") submitNumero();
  }, [numero, reventar]);

  const extractBodyFromHTML = (htmlString) => {
    const bodyContentMatch = htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyContentMatch ? bodyContentMatch[1] : htmlString;
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
                {/* <ScrollView style={{ flex: 1 }}> */}
                <View style={styles.formRow}>
                  <Pressable
                    style={styles.inputSmallSorteo}
                    onPress={() => {
                      setposisionSorteoModalAlaIzquierda(true);
                      setModalVisible(true);
                    }}
                    editable={!camposBloqueados}
                    disabled={camposBloqueados}
                  >
                    <Text style={{ color: sorteoNombre ? "#000" : "#aaa" }}>
                      {sorteoNombre || "Sorteo"}
                    </Text>
                  </Pressable>
                  {/* <SorteoSelectorModal
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
                  /> */}

                  {Platform.OS === "web" ? (
                    <View pointerEvents={camposBloqueados ? "none" : "auto"}>
                      <DatePickerWeb
                        value={fecha}
                        editable={!camposBloqueados}
                        disabled={camposBloqueados}
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
                        editable={!camposBloqueados}
                        disabled={camposBloqueados}
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

                <View pointerEvents={camposBloqueados ? "none" : "auto"}>
                  <TextInput
                    placeholder="Nombre Cliente"
                    style={styles.input}
                    value={tiempo.clientName}
                    onChangeText={(text) => setClientName(text.toUpperCase())}
                    editable={!camposBloqueados}
                  />
                </View>

                {mostrarCampos && (
                  <>
                    {/* Switches */}
                    <View style={styles.switchRowContainer}>
                      <Pressable
                        style={styles.switchRow}
                        onPress={() => setLimpiar(!limpiar)}
                      >
                        <Text>Limpiar al imprimir</Text>
                        <Switch value={limpiar} onValueChange={setLimpiar} />
                      </Pressable>

                      {/* <Text>Limpiar al imprimir</Text>
        <Switch value={limpiar} onValueChange={setLimpiar} /> */}

                      {useReventado && (
                        <>
                          <Pressable
                            style={styles.switchRow}
                            onPress={() => handleReventarChange(!reventar)}
                          >
                            <Text>Reventar</Text>
                            <Switch
                              value={reventar}
                              onValueChange={handleReventarChange}
                            />
                          </Pressable>

                          {/* <Text>Reventar</Text>
                <Switch
                  value={reventar}
                  onValueChange={handleReventarChange}
                /> */}
                        </>
                      )}
                    </View>

                    {/* Botón, Monto y Número en una fila */}
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          if (isMontoLocked) {
                            setIsMontoLocked(false);
                            setShouldFocusMonto(true);
                            setMonto("");

                            // montoRef.current?.focus();
                            //  window.setTimeout(() => {
                            //   montoRef.current?.focus();
                            // }, 100);
                            // setMonto("e");
                            // setIsMontoLocked(false);
                          } else {
                            const montoNum = parseInt(monto, 10);
                            if (!isNaN(montoNum) && validateMonto(montoNum)) {
                              setIsMontoLocked(true); // Bloquear el campo
                              numeroRef.current?.focus(); // Volver a poner el enfoque en el numero
                            } else {
                              Alert.alert(
                                "Monto inválido",
                                "Debe ser un múltiplo de 50.",
                              );
                              showSnackbar("Debe ingresar un monto válido.", 3);
                            }
                          }
                        }}
                      >
                        <MaterialIcons
                          name={isMontoLocked ? "lock" : "lock-open"}
                          size={20}
                          color="gray"
                        />
                      </TouchableOpacity>

                      <TextInput
                        ref={montoRef}
                        placeholder="Monto"
                        style={[
                          styles.inputSmall,
                          { marginLeft: 8, minWidth: 70 },
                        ]}
                        value={monto}
                        onChangeText={(text) => {
                          // Permitir solo un "-" al inicio y dígitos
                          const sanitized = text.replace(/[^0-9-]/g, "");
                          const cleaned = sanitized.startsWith("-")
                            ? "-" + sanitized.slice(1).replace(/-/g, "")
                            : sanitized.replace(/-/g, "");

                          if (cleaned !== monto) {
                            setMonto(cleaned);
                          }
                        }}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        editable={!isMontoLocked}
                        blurOnSubmit={false}
                        onSubmitEditing={() => {
                          const montoNum = parseInt(monto, 10);
                          if (!isNaN(montoNum) && validateMonto(montoNum)) {
                            numeroRef.current?.focus();
                            // window.setTimeout(() => {
                            //   numeroRef.current?.focus();
                            // }, 100);
                          } else {
                            // Alert.alert(
                            //   "Monto inválido",
                            //   "Debe ser un múltiplo de 50.",
                            // );
                            showSnackbar("Debe ingresar un monto válido.", 3);
                            //montoRef.current?.blur();
                            // window.setTimeout(() => {
                            //   montoRef.current?.focus();
                            // }, 100);
                          }
                        }}
                      />

                      <TextInput
                        ref={numeroRef}
                        placeholder="Número"
                        style={[
                          styles.inputSmall,
                          { marginLeft: 8, minWidth: 70 },
                        ]}
                        value={numero}
                        onChangeText={(text) => {
                          const cleaned = text
                            .replace(/[^0-9]/g, "")
                            .slice(0, 2);
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
                        onFocus={() => {
                          const montoNum = parseInt(monto, 10);
                          if (
                            !monto ||
                            monto.trim() === "" ||
                            isNaN(montoNum) ||
                            !validateMonto(montoNum)
                          ) {
                            montoRef.current?.focus();
                            showSnackbar("Debe ingresar un monto válido.", 3);
                          }
                        }}
                        onSubmitEditing={() => {
                          if (numero.length === 2) {
                            if (reventar) {
                              reventarRef.current?.focus();
                            } else {
                              submitNumero();
                            }
                          } else {
                            showSnackbar(
                              "Debe ingresar un número de 2 dígitos.",
                              3,
                            );
                          }

                          // if (numero.length !== 2) {
                          //   window.setTimeout(() => {
                          //     numeroRef.current?.focus();
                          //     showSnackbar(
                          //       "Debe ingresar un número de 2 dígitos.",
                          //       3,
                          //     );
                          //   }, 100);
                          // } else {
                          //   if (reventar) {
                          //     reventarRef.current?.focus();
                          //   } else {
                          //     submitNumero();
                          //   }
                          // }
                        }}
                      />
                    </View>
                    {useReventado && reventar && (
                      <View style={styles.row}>
                        <View style={styles.iconButtonInvisible} />

                        <TextInput
                          ref={reventarRef}
                          placeholder="Reventar"
                          style={[styles.inputSmall, { marginLeft: 8 }]}
                          value={montoReventado}
                          onChangeText={(text) => {
                            // Permitir solo un "-" al inicio y dígitos
                            const sanitized = text.replace(/[^0-9-]/g, "");
                            const cleaned = sanitized.startsWith("-")
                              ? "-" + sanitized.slice(1).replace(/-/g, "")
                              : sanitized.replace(/-/g, "");
                            setMontoReventado(cleaned);
                          }}
                          keyboardType="number-pad"
                          returnKeyType="done"
                          blurOnSubmit={false}
                          onSubmitEditing={() => {
                            const montoNum = parseInt(monto, 10);
                            const montoReventadoNum = parseInt(
                              montoReventado,
                              10,
                            );

                            if (
                              isNaN(montoReventadoNum) ||
                              !validateMonto(montoReventadoNum)
                            ) {
                              Alert.alert(
                                "Monto inválido",
                                "Debe ser un múltiplo de 50.",
                              );
                              showSnackbar("Debe ingresar un monto válido.", 3);
                              window.setTimeout(() => {
                                reventarRef.current?.focus();
                              }, 100);
                              return;
                            }

                            if (montoReventadoNum > montoNum) {
                              showSnackbar(
                                "El monto reventado no puede ser mayor al monto original.",
                                3,
                              );
                              window.setTimeout(() => {
                                reventarRef.current?.focus();
                              }, 100);
                              return;
                            }

                            handleSubmitReventar();
                          }}
                          onFocus={() => {
                            const montoNum = parseInt(monto, 10);
                            if (
                              !monto ||
                              monto.trim() === "" ||
                              isNaN(montoNum) ||
                              !validateMonto(montoNum)
                            ) {
                              montoRef.current?.focus();
                              showSnackbar("Debe ingresar un monto válido.", 3);
                              return;
                            }

                            if (!numero || numero.length < 2) {
                              numeroRef.current?.focus();
                              showSnackbar(
                                "Debe ingresar un número de 2 dígitos.",
                                3,
                              );
                              return;
                            }
                          }}
                        />
                        <View
                          style={[
                            styles.inputSmallInvisible,
                            { marginLeft: 8 },
                          ]}
                        />
                      </View>
                    )}
                  </>
                )}
                {/* </ScrollView> */}
              </View>
              <Divider style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />

              {/* Lista */}
              <View style={[styles.listContainer, !isWeb && { marginTop: 0 }]}>
                <FlatList
                  data={items}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.key}
                  style={{ marginTop: 0 }}
                />
              </View>
            </View>
            {/* Total */}
            <View style={styles.totalBar}>
              <Pressable
                onPress={() => {
                  handleMuestraRestringidosDisponibles();
                }}
                onHoverIn={() => Platform.OS === "web" && setHovered(true)}
                onHoverOut={() => Platform.OS === "web" && setHovered(false)}
                style={styles.iconButtonRestringidos}
              >
                <MaterialIcons name="warning" size={20} color="red" />
              </Pressable>
              <RestringidosModal
                visible={restringidosModalVisible}
                onClose={() => setRestringidosModalVisible(false)}
                onSelect={(sorteo) => {}}
                data={restringidosDisponibles}
                useReventado={mSorteo.useReventado}
              />
              {hovered && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>
                    Ver números restingidos
                  </Text>
                </View>
              )}

              <View style={styles.totalTextGroup}>
                <Text style={styles.totalText}>TOTAL: </Text>
                <Text style={styles.totalValue}>₡{total?.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </>
      </View>
      {/* {html && (
        <View>
          <View
            ref={ticketRef}
            collapsable={false}
            style={{
              position: "absolute",
              top: -1000,
              width: 250, // 58mm aprox.
              height: webviewHeight,
              backgroundColor: "white",
              opacity: 0, // siempre oculto
              pointerEvents: "none",
              overflow: "hidden", // evita barras de scroll
            }}
          >
            <WebView
              originWhitelist={["*"]}
              source={{ html }}
              onLoadEnd={() => setLoaded(true)}
              scalesPageToFit={false}
              onMessage={(event) => {
                const height = parseInt(event.nativeEvent.data, 10);
                setWebviewHeight(height);
                setLoaded(true);
              }}
              injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', 'width=250, initial-scale=1, maximum-scale=1, user-scalable=no');
          document.head.appendChild(meta);
          document.body.style.margin = '0';
          document.body.style.padding = '15px';
          document.documentElement.style.overflow = 'hidden';

          setTimeout(() => {
            const height = document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(height.toString());
          }, 50);
          true;
        `}
              style={{
                width: 250,
                height: webviewHeight,
                backgroundColor: "white",
              }}
            />
          </View>
        </View>
      )} */}

      <Portal>
        {/* Diálogo print */}
        <Dialog
          visible={dialogPrintVisible}
          onDismiss={() => {}} // Evita cerrar al tocar fuera
          style={[
            {
              backgroundColor: "white",
              borderRadius: 10,
              marginHorizontal: 20,
              maxHeight: "95%",
            },
            isWeb && {
              position: "absolute",
              right: 0,
              top: 10,
              width: 400,
              maxHeight: "100%",
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
          ]}
        >
          {/* Diálogo Restringido */}
          <Dialog.Content>
            {html && (
              <View
                style={{
                  alignItems: "center",
                  maxHeight: isWeb ? "75vh" : "90%", // limita el diálogo si es muy alto
                  overflow: "auto",
                  //maxHeight: 800,
                }}
              >
                <View
                  ref={ticketRef}
                  collapsable={false}
                  style={{
                    width: 245,
                    backgroundColor: "white",
                    borderWidth: 1,
                    borderColor: "#ccc",
                    overflow: "hidden",
                    ...(Platform.OS === "web"
                      ? {
                          //height: (iframeHeight || 300) + 20,
                          height: "100%",
                          overflow: "auto",
                        }
                      : {
                          //height: webviewHeight || 300 + 20,
                          height: "110%",
                          overflow: "scroll",
                        }),
                  }}
                >
                  {Platform.OS === "web" ? (
                    <iframe
                      ref={iframeRef}
                      srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport", initial-scale=1.0">
                          <style>
                            body { margin-left: 0px; padding: 0px; box-sizing: border-box; }
                            .wrapper {
                              // margin-left: 5px;
                              //justify-content: "center"
                              //width: 58mm;
                              }
                          </style>
                          <script>
                            function sendHeight() {
                              const height = document.documentElement.scrollHeight;
                              window.parent.postMessage({ type: "htmlHeight", height }, "*");
                            }
                    
                            window.addEventListener("load", () => {
                              sendHeight();
                              // Retry a couple of times in case fonts/layouts shift content
                              setTimeout(sendHeight, 100);
                              setTimeout(sendHeight, 300);                              

                            });
                    
                            // Optional: observe height changes dynamically
                             window.addEventListener("DOMContentLoaded", () => {
                              const body = document.body;
                              if (body) {
                                const observer = new ResizeObserver(sendHeight);
                                observer.observe(body);
                              }
                            });


                          </script>
                        </head>
                        <body>
                          <div class="wrapper">
                            ${html}
                          </div>
                         </body>
                      </html>
                    `}
                      style={{
                        width: "100%",
                        height: iframeHeight,
                        border: "none",
                        display: "block",
                      }}
                      sandbox="allow-scripts allow-same-origin allow-modals"
                    />
                  ) : (
                    <>
                      <WebView
                        originWhitelist={["*"]}
                        source={{ html }}
                        scalesPageToFit={false}
                        onMessage={(event) => {
                          const height = parseInt(event.nativeEvent.data, 10);
                          setWebviewHeight(height);
                        }}
                        injectedJavaScript={`
                     const meta = document.createElement('meta');
                     meta.setAttribute('name', 'viewport');
                     meta.setAttribute('content', 'width=245, initial-scale=1, maximum-scale=1, user-scalable=no');
                     document.head.appendChild(meta);
                     document.body.style.margin = '0';
                     document.body.style.overflowY = 'scroll'; // ✅ Permite scroll vertical
                     document.body.style.overflow = 'auto';
                     document.documentElement.style.overflow = 'auto';
 
                     setTimeout(() => {
                       const height = document.body.scrollHeight;
                       window.ReactNativeWebView.postMessage(height.toString());
                     }, 100);
                     true;
                   `}
                        style={{
                          width: "100%",
                          height: webviewHeight || 300,
                          backgroundColor: "white",
                          //marginLeft: 8,
                        }}
                      />

                      {/* WebView oculto para generar imagen */}
                      {generateImage && (
                        <WebView
                          originWhitelist={["*"]}
                          renderToHardwareTextureAndroid={true}
                          source={{
                            html: `
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <meta name="viewport" content="width=60mm, initial-scale=1.0">
                                <style>
                                  body { margin: 0; padding: 0px; opacity: 0; background: transparent; box-sizing: border-box; }
                                 .wrapper {
                                    //margin-left: 30px;
                                    //width: 56mm;
                                    }
                                  </style>
                                <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
                              </head>
                              <body>
                                <div class="wrapper">
                                <div id="ticket">${html}</div>
                                 </div>
                                <script>
                                  window.onload = () => {
                                    console.log("ONLOAD fired");

                                    setTimeout(() => {
                                        const el = document.getElementById("ticket");
                                        if (!el) {
                                          console.log("No ticket element found");
                                          return;
                                        }

                                      html2canvas(el, {
                                        scale: 2,
                                        backgroundColor: "#ffffff"
                                      }).then(canvas => {
                                        console.log("Canvas generated");
                                        const base64 = canvas.toDataURL("image/png");
                                        window.ReactNativeWebView.postMessage(base64);
                                      });
                                    }, 500);
                                  };
                                </script>
                              </body>
                            </html>
                          `,
                          }}
                          javaScriptEnabled
                          onMessage={async (event) => {
                            //setImageToShare(event.nativeEvent.data);

                            const base64Image = event.nativeEvent.data;
                            const path =
                              FileSystem.documentDirectory +
                              `ticket_${Date.now()}.png`;

                            await FileSystem.writeAsStringAsync(
                              path,
                              base64Image.replace("data:image/png;base64,", ""),
                              { encoding: FileSystem.EncodingType.Base64 },
                            );

                            const canShare = await Sharing.isAvailableAsync();
                            if (canShare) {
                              await Sharing.shareAsync(path, {
                                mimeType: "image/png",
                                dialogTitle: "Compartir ticket",
                              });
                              setRefreshHeader(true);
                            }

                            setGenerateImage(false);
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            opacity: 1,
                            top: -9999,
                            left: -9999,
                            backgroundColor: "transparent",
                            position: "absolute",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="red"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={() => {
                setDialogPrintVisible(false);
                setWebviewHeight(100);
                setIframeHeight(100);
                montoRef.current?.focus();
                limpiarDespuesDeImprimir();
              }}
            >
              CERRAR
            </Button>
            <Button
              textColor="green"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={() => {
                setLoaded(true);
                setGenerateImage(true);
                // setWebviewHeight(100);
                // setIframeHeight(100);
                // montoRef.current?.focus();
                // limpiarDespuesDeImprimir();
                // setDialogPrintVisible(false);
              }}
            >
              COMPARTIR
            </Button>
            <Button
              textColor="green"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={() => {
                // if (Platform.OS === "web" && iframeRef.current) {
                //   const iframeWindow = iframeRef.current.contentWindow;
                //   iframeWindow.focus();
                //   iframeWindow.print();
                // }
                // if (Platform.OS === "android") {
                //   handlePrintBt();
                // }
                handlePrintBt();
                //montoRef.current?.focus();
                //setWebviewHeight(100);
                //setIframeHeight(100);
              }}
            >
              IMPRIMIR
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Diálogo Restringido */}
        <Dialog
          visible={
            dialogRestringidoVisible &&
            !ejecutadoPorRestringidoDialogRef.current
          }
          onDismiss={closeDialogRestringido}
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
          {/* Diálogo Restringido */}
          <Dialog.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <MaterialIcons name="warning" size={35} color="red" />
              <Text
                style={{
                  marginLeft: 8,
                  fontWeight: "bold",
                  color: "#000",
                  fontSize: 18,
                }}
              >
                RESTRINGIDO
              </Text>
            </View>
            <View style={{ maxHeight: height * 0.6 }}>
              <Text>
                El número {abiertoPorReventado && <Text>reventado </Text>}
                <Text style={{ fontWeight: "bold" }}>
                  ({dialogNumeroRestringido}){" "}
                </Text>
                es restringido y con la venta actual sobrepasaría el límite.
                {"\n"}
                El monto disponible es de:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {dialogMontoRestringidoDisponible}
                </Text>
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="red"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={() => {
                //setDialogRestringidoVisible(false);
                closeDialogRestringido();
                resolverDialogRef.current?.(); // Resuelve la promesa
              }}
            >
              CERRAR
            </Button>
          </Dialog.Actions>
        </Dialog>

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
                    onPress={() => {
                      cargarTiempoSeleccionado(item);
                      closeDialogTickets(); // cerrar el diálogo
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
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="red"
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

        {/* Diálogo principal */}
        <Dialog
          visible={dialogVisible}
          onDismiss={closeDialogCategorias}
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
                CATEGORÍAS PREDETERMINADAS
              </Text>
            </View>
            <Pressable
              style={styles.inputSmall}
              onPress={openCategoriaSelector}
            >
              <Text style={{ color: categoriaSeleccionada ? "#000" : "#aaa" }}>
                {categoriaSeleccionada || "Selecciona categoría"}
              </Text>
            </Pressable>
            {categoriaSeleccionada !== "Extraer de Texto" && (
              <TextInput
                placeholder="Monto"
                style={styles.input}
                defaultValue={categoriasMonto}
                onChangeText={setCategoriasMonto}
                keyboardType="number-pad"
              />
            )}
            {categoriaSeleccionada === "Terminan en..." && (
              <TextInput
                placeholder="Números que terminan en"
                defaultValue={categoriasTerminaEn}
                //onChangeText={setCategoriasTerminaEn}
                onChangeText={(text) => {
                  setCategoriasTerminaEn(text);
                }}
                keyboardType="number-pad"
                maxLength={1} // ← esto limita a 1 carácter
                style={[styles.input, { marginTop: 15, textAlign: "center" }]}
              />
            )}
            {categoriaSeleccionada === "Inician con..." && (
              <TextInput
                placeholder="Números que inician con"
                defaultValue={categoriasInicianCon}
                //onChangeText={setCategoriasInicianCon}
                onChangeText={(text) => {
                  setCategoriasInicianCon(text);
                }}
                keyboardType="number-pad"
                maxLength={1} // ← esto limita a 1 carácter
                style={[styles.input, { marginTop: 15, textAlign: "center" }]}
              />
            )}
            {categoriaSeleccionada === "Desde / Hasta" && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <TextInput
                    placeholder="Desde"
                    defaultValue={categoriasDesde}
                    //onChangeText={setCategoriasDesde}
                    onChangeText={(text) => {
                      setCategoriasDesde(text);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={[
                      styles.input,
                      { marginTop: 15, textAlign: "center", width: 140 },
                    ]}
                  />
                  <TextInput
                    placeholder="Hasta"
                    defaultValue={categoriasHasta}
                    //onChangeText={setCategoriasHasta}
                    onChangeText={(text) => {
                      setCategoriasHasta(text);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={[
                      styles.input,
                      { marginTop: 15, textAlign: "center", width: 140 },
                    ]}
                  />
                </View>
              </>
            )}
            {categoriaSeleccionada === "Extraer de Texto" && (
              <TextInput
                placeholder="Pega aqui el mensage"
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
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="red"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={closeDialogCategorias}
            >
              CANCELAR
            </Button>
            <Button
              textColor="#4CAF50"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={OKDialogCategorias}
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Diálogo para elegir categoría */}
        <Dialog
          visible={categoriaDialogVisible}
          onDismiss={closeCategoriaSelector}
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
          <Dialog.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <MaterialIcons name="category" size={35} color="#000" />
              <Text
                style={{
                  marginLeft: 8,
                  fontWeight: "bold",
                  color: "#000",
                  fontSize: 18,
                }}
              >
                CATEGORÍAS
              </Text>
            </View>
            <Button
              onPress={() => seleccionarCategoria("Parejitas")}
              textColor="#000"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                width: "100%",
                borderRadius: 3,
              }}
              contentStyle={{ justifyContent: "flex-start" }} // Texto a la izquierda
            >
              Parejitas
            </Button>
            <Button
              onPress={() => seleccionarCategoria("Terminan en...")}
              textColor="#000"
              style={{ marginBottom: 10, width: "100%", borderRadius: 3 }}
              contentStyle={{ justifyContent: "flex-start" }} // Texto a la izquierda
            >
              Terminan en...
            </Button>
            <Button
              onPress={() => seleccionarCategoria("Inician con...")}
              textColor="#000"
              style={{ marginBottom: 10, width: "100%", borderRadius: 3 }}
              contentStyle={{ justifyContent: "flex-start" }} // Texto a la izquierda
            >
              Inician con...
            </Button>
            <Button
              onPress={() => seleccionarCategoria("Desde / Hasta")}
              textColor="#000"
              style={{ marginBottom: 10, width: "100%", borderRadius: 3 }}
              contentStyle={{ justifyContent: "flex-start" }} // Texto a la izquierda
            >
              Desde / Hasta
            </Button>
            <Button
              onPress={() => seleccionarCategoria("Extraer de Texto")}
              textColor="#000"
              style={{ marginBottom: 10, width: "100%", borderRadius: 3 }}
              contentStyle={{ justifyContent: "flex-start" }} // Texto a la izquierda
            >
              Extraer de Texto
            </Button>
          </Dialog.Content>
        </Dialog>
        {/* Diálogo para precargar tiempo */}
        <Dialog
          visible={dialogPrecargarVisible}
          onDismiss={closeDialogPreCarga}
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
          <Dialog.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between", // 🔥 clave para separar lados
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
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
                  PRE CARGAR
                </Text>
              </View>
              {!isWeb && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center", // <-- importante
                    marginBottom: 10,
                  }}
                >
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {}}
                  >
                    <MaterialIcons
                      name={"camera-alt"}
                      size={24}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.row}>
              <TextInput
                placeholder="CODIGO"
                value={codigo}
                onChangeText={(text) => {
                  setCodigo(text);
                }}
                keyboardType="numeric-pad"
                style={[
                  styles.input,
                  {
                    flex: 1,
                    marginTop: 15,
                    textAlign: "center",
                    fontSize: 18,
                    letterSpacing: 1,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  },
                ]}
              />
            </View>

            <Pressable
              style={styles.inputSmall}
              onPress={() => {
                setposisionSorteoModalAlaIzquierda(false);
                setModalVisible(true);
              }}
            >
              <Text
                style={{
                  color: sorteoNombre ? "#000" : "#aaa",
                  textAlign: "center",
                }}
              >
                {sorteoNombre || "Sorteo"}
              </Text>
            </Pressable>
            {/* <SorteoSelectorModal
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              onSelect={(sorteo) => {
                console.log("Sorteo Seleccionado: ", sorteo);
                setSorteoId(sorteo.id);
                setSorteoNombre(sorteo.name);
                Object.assign(mSorteo, sorteo); // ✅ Copia las propiedades sin reemplazar el objeto
              }}
              leftPosition={false}
            /> */}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor="red"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={closeDialogPreCarga}
            >
              CANCELAR
            </Button>
            <Button
              textColor="#4CAF50"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={() => {
                handlePreCargaTiempo(codigo);
              }}
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* <PreCargarModal
        visible={modalVisiblePreCargar}
        onClose={() => {
          setModalVisiblePreCargar(false);
          closeMenuHeader();
        }}
        onSelect={(resultado) => {
          handlePreCargaTiempo(resultado);
          setModalVisiblePreCargar(false);
        }}
      /> */}

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
        leftPosition={posisionSorteoModalAlaIzquierda}
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
    justifyContent: "space-between",
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
