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
import mSorteo from "../models/mSorteoSingleton.js";
import mSorteoRestringidos from "../models/mSorteoRestringidosSingleton";
import { useTiempo } from "../models/mTiempoContext";
import { convertNumero, validateMonto } from "../utils/numeroUtils";
import { parseMessage } from "../utils/UtilParseMessageAI";
import mSorteoSingleton from "../models/mSorteoSingleton.js";

export default function VentaScreen({ navigation, route }) {
  console.log("🎯 RENDER VentaScreen");
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
    return new Promise((resolve) => {
      setDialogNumeroRestringido(numero);
      setDialogMontoRestringidoDisponible(montoDisponible);
      setDialogRestringidoVisible(true);
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
              <MaterialIcons
                name="print"
                size={24}
                color="#fff"
                style={{ marginRight: 20 }}
                onPress={handlePrint}
              />
              <MaterialIcons
                name="image"
                size={24}
                color="#fff"
                style={{ marginRight: 15 }}
                onPress={handleImagePress}
              />
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
  ]);

  const handleNuevoTiempo = async (id) => {
    limpiarDespuesDeImprimir();
    setMostrarCampos(true);
    setcamposBloqueados(false);
    setTiempoSeleccionado(null);
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
      const isAllowed = await inicializarYProcesar();
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
  //const tiempoSeleccionadoRef = useRef(tiempo);
  const [tiempoSeleccionado, setTiempoSeleccionado] = useState(null);
  const limpiarRef = useRef(limpiar);

  const toInputDateFormat = (date) => {
    // setTiempo((prev) => ({
    //   ...prev,
    //   fecha: date,
    // }));
    return date.toISOString().split("T")[0]; // "2025-04-29"
  };

  const parseFechaLocalDesdeInput = (value) => {
    const [year, month, day] = value.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const formatDate = (fecha) => {
    if (!fecha) return "";
    // setTiempo((prev) => ({
    //   ...prev,
    //   fecha: fecha,
    // }));
    return format(new Date(fecha), "EE dd/MM/yyyy", { locale: es });
  };

  const formattedDate = formatDate(fecha);

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

  const handlePrint = async () => {
    if (!fecha || !sorteoId || !userData?.id) return;
    let result;
    try {
      if (!tiempoSeleccionado) {
        const resultado = await inicializarYProcesar();
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
      } else {
        result = tiempoSeleccionado;
      }

      if (Platform.OS === "web") {
        const printWindow = printTicketWeb(
          result,
          mSorteo,
          userData,
          ticketProfile,
        );
      }
      if (limpiarRef.current && !tiempoSeleccionado) {
        limpiarDespuesDeImprimir();
      }
    } catch (error) {
      console.error("Error al enviar el ticket:", error);
      Alert.alert("Error", "No se pudo enviar el ticket.");
      showSnackbar("Error al registrar el ticket, intente nuevamente.", 3);
    }
  };

  const cargarTiempoSeleccionado = (tiempoCargado) => {
    setIdTicketSeleccionado(tiempoCargado.id);
    setClientName(tiempoCargado.clientName || "");
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

  const limpiarDespuesDeImprimir = () => {
    const tiempoLimpio = {
      ...tiempo,
      numbers: [],
      clientName: "",
    };
    setTiempo(tiempoLimpio);
    setItems([]);
    tiempoRef.current = tiempoLimpio;
    setIdTicketSeleccionado(0);

    setMonto("");
    setNumero("");

    montoRef.current?.focus();
  };

  const [isMontoLocked, setIsMontoLocked] = useState(false);

  // Crear un JSON que contenga ambos valores
  const data = {
    sorteo: sorteoId,
    fecha: format(fecha, "EEEE dd/MM/yyyy", { locale: es }),
  };

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

  const fetchTiemposAnteriores = async (drawCategoryId, drawDate) => {
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
        return [true, montoAllowed];
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

  const inicializarYProcesar = async () => {
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
      const numbersOriginales = [...(tiempoRef.current.numbers || [])];

      // Paso 3: Limpiar tiempo y items
      const tiempoBackup = { ...tiempoRef.current };

      const tiempoBase = {
        ...tiempo,
        ticketNumber: 1,
        userId: userData.id,
        drawCategoryId: sorteoId,
        drawDate: format(fecha, "yyyy-MM-dd", { locale: es }),
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
      const nuevosMontoNumeros = currentItems.map((item) => ({
        monto: item.monto,
        numero: item.numero,
        reventado: item.reventado,
        montoReventado: item.montoReventado,
      }));

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
      const isAllowed = await inicializarYProcesar();
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

  useEffect(() => {
    submitNumero();
  }, [numero, reventar]);

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
                    editable={!camposBloqueados}
                    disabled={camposBloqueados}
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
                    onChangeText={setClientName}
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
                            // Desbloquear si ya estaba bloqueado
                            setIsMontoLocked(false);
                            montoRef.current?.focus(); // Volver a poner el enfoque en el monto
                            setMonto("");
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
                          setMonto(cleaned);
                        }}
                        keyboardType="numeric"
                        returnKeyType="done"
                        editable={!isMontoLocked}
                        onSubmitEditing={() => {
                          const montoNum = parseInt(monto, 10);
                          if (!isNaN(montoNum) && validateMonto(montoNum)) {
                            numeroRef.current?.focus();
                          } else {
                            Alert.alert(
                              "Monto inválido",
                              "Debe ser un múltiplo de 50.",
                            );
                            showSnackbar("Debe ingresar un monto válido.", 3);
                            montoRef.current?.blur();
                            window.setTimeout(() => {
                              montoRef.current?.focus();
                            }, 100);
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
                          // Eliminar cualquier carácter que no sea número y limitar a 2 dígitos
                          const cleaned = text
                            .replace(/[^0-9]/g, "")
                            .slice(0, 2);
                          setNumero(cleaned);

                          // if (cleaned.length === 2) {
                          //   if (reventar) {
                          //     reventarRef.current?.blur();
                          //     window.setTimeout(() =>{
                          //       reventarRef.current?.focus();
                          //     });
                          //   } else {
                          //     submitNumero();
                          //   }
                          // }
                        }}
                        keyboardType="numeric"
                        returnKeyType="done"
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
                          if (numero.length !== 2) {
                            numeroRef.current?.blur();
                            window.setTimeout(() => {
                              numeroRef.current?.focus();
                              showSnackbar(
                                "Debe ingresar un número de 2 dígitos.",
                                3,
                              );
                            }, 100);
                          } else {
                            if (reventar) {
                              reventarRef.current?.focus();
                            } else {
                              submitNumero();
                            }
                          }
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
                          keyboardType="numeric"
                          returnKeyType="done"
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
                              reventarRef.current?.blur();
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
                              reventarRef.current?.blur();
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
              <Text style={styles.totalText}>TOTAL: </Text>
              <Text style={styles.totalValue}>₡{total?.toFixed(2)}</Text>
            </View>
          </View>
        </>
      </View>

      <Portal>
        {/* Diálogo Restringido */}
        <Dialog
          visible={dialogRestringidoVisible}
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
              <MaterialIcons name="warning" size={35} color="#f09359" />
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
              textColor="black"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={closeDialogRestringido}
            >
              SYNC RESTRINGIDOS
            </Button>

            <Button
              textColor="green"
              style={{
                backgroundColor: "white", // Fondo blanco
                marginBottom: 10,
                borderRadius: 3,
              }}
              onPress={() => {
                setDialogRestringidoVisible(false);
                //closeDialogRestringido;
                resolverDialogRef.current?.(); // Resuelve la promesa
              }}
            >
              OK
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
                keyboardType="numeric"
              />
            )}
            {categoriaSeleccionada === "Terminan en..." && (
              <TextInput
                placeholder="Números que terminan en"
                defaultValue={categoriasTerminaEn}
                onChangeText={setCategoriasTerminaEn}
                keyboardType="numeric"
                style={[styles.input, { marginTop: 15, textAlign: "center" }]}
              />
            )}
            {categoriaSeleccionada === "Inician con..." && (
              <TextInput
                placeholder="Números que inician con"
                defaultValue={categoriasInicianCon}
                onChangeText={setCategoriasInicianCon}
                keyboardType="numeric"
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
                    onChangeText={setCategoriasDesde}
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      { marginTop: 15, textAlign: "center", width: 140 },
                    ]}
                  />
                  <TextInput
                    placeholder="Hasta"
                    defaultValue={categoriasHasta}
                    onChangeText={setCategoriasHasta}
                    keyboardType="numeric"
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
