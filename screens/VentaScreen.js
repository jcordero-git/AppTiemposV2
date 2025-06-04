import React, { useState, useRef, useEffect } from "react";
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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

export default function VentaScreen({ navigation, route }) {
  console.log("🎯 RENDER VentaScreen");
  const [menuVisibleHeader, setMenuVisibleHeader] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [categoriaDialogVisible, setCategoriaDialogVisible] = useState(false); // Diálogo selector de categoría

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [categoriasMonto, setCategoriasMonto] = useState("");
  const [categoriasTerminaEn, setCategoriasTerminaEn] = useState("");

  const menuAnchorRef = useRef(null);

  const openMenuHeader = () => setMenuVisibleHeader(true);
  const closeMenuHeader = () => setMenuVisibleHeader(false);

  // 🔹 MÉTODOS DEL DIÁLOGO
  const openDialogCategorias = () => {
    console.log("Abriendo diálogo");
    closeMenuHeader();
    setDialogVisible(true);
  };

  const closeDialogCategorias = () => {
    setDialogVisible(false);
    setCategoriaSeleccionada(null);
    setCategoriasMonto("");
    setCategoriasTerminaEn("");
  };
  const OKDialogCategorias = () => {
    const montoTemp = parseInt(categoriasMonto); // si textFieldPreSellCategoryMonto es un string del estado
    const v = validateMonto(montoTemp);
    console.log("Monto válido", v);
    if (validateMonto(montoTemp)) {
      if (categoriaSeleccionada === "Parejitas") {
        for (let i = 0; i <= 9; i++) {
          const number = parseInt(`${i}${i}`);

          const numero = convertNumero(number);
          txtNumeroDone(montoTemp, numero);
        }
      }
      setDialogVisible(false);
      setCategoriaSeleccionada(null);
      setCategoriasMonto("");
      setCategoriasTerminaEn("");
    } else {
      Alert.alert("Monto inválido", "Debe ser un múltiplo de 50.");
    }
  };

  // 🔹 MÉTODOS DEL DROPDOWN
  const openCategoriaSelector = () => {
    console.log("Abriendo selector de categorías");
    setCategoriaDialogVisible(true);
  };
  const closeCategoriaSelector = () => setCategoriaDialogVisible(false);

  const seleccionarCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria);
    closeCategoriaSelector();
  };

  useEffect(() => {
    console.log("categoriaDialogVisible cambió a:", categoriaDialogVisible);
  }, [categoriaDialogVisible]);

  const { tiempo, setTiempo, resetTiempo, setNombreCliente } = useTiempo();

  // El botón que actuará como anchor para el menú
  const MenuAnchor = (
    <TouchableOpacity onPress={openMenuHeader} style={{ marginRight: 10 }}>
      <MaterialIcons name="more-vert" size={24} color="#fff" />
    </TouchableOpacity>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "VENTA",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <>
          <MaterialIcons
            name="print"
            size={24}
            color="#fff" // Blanco para contraste con fondo verde
            style={{ marginRight: 20 }}
            onPress={() => {
              Alert.alert(
                "Datos del sorteo",
                `Sorteo: ${data.sorteo}\nFecha: ${data.fecha}`,
              );
            }}
          />
          <MaterialIcons
            name="image"
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
                console.log("Pre Cargar");
              }}
              title="Pre Cargar"
              titleStyle={{ color: "#000" }} // Texto negro opcional
            />

            <Menu.Item
              onPress={openDialogCategorias}
              title="Categorías Predeterminadas"
              titleStyle={{ color: "#000" }}
            />
          </Menu>
        </>
      ),
    });
  }, [navigation, menuVisibleHeader]);

  const { userData, logout } = useAuth();

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
  const [monto_reventar, setMonto_reventar] = useState("");
  const [useReventado, setUseReventado] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const [showPicker, setShowPicker] = useState(false);

  const numeroRef = useRef(null);
  const montoRef = useRef(null);

  const { width } = useWindowDimensions();
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
      <View style={styles.itemRow}>
        <Text style={styles.itemLeft}>₡{item.monto}</Text>
        <Text style={styles.itemRight}>{item.numero}</Text>
      </View>
      {item.rev && (
        <View style={styles.itemRowRev}>
          <Text style={styles.itemLeft}>₡{item.rev}</Text>
          <Text style={styles.itemRight}>REVENTADO</Text>
        </View>
      )}
    </View>
  );

  const tiempoRef = useRef(tiempo);

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
    console.log("tiempo al hacer click en imagen: ", tiempoRef.current);
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
      // setTiempo((prev) => ({
      //   ...prev,
      //   fecha: selectedDate,
      // }));
      setTiempo((prev) => ({
        ...prev,
        fecha: selectedDate,
      }));
    }
  };

  const handleReventarChange = (event) => {
    setReventar(!reventar);
    if (reventar === false) {
      setMonto_reventar("");
    }
  };

  const handleSubmitReventar = () => {
    txtNumeroDone(monto, numero);
    // const montoInt = parseInt(monto, 10);
    // const reventarInt = parseInt(monto_reventar, 10);

    // if (
    //   !isNaN(montoInt) &&
    //   !isNaN(reventarInt) &&
    //   reventarInt <= montoInt &&
    //   numero.length === 2
    // ) {
    //   const nuevoItem = {
    //     key: Date.now().toString(), // clave única
    //     numero,
    //     monto: montoInt.toString(),
    //     rev: reventarInt.toString(),
    //   };

    //   setItems((prevItems) => [nuevoItem, ...prevItems]);

    //   setNumero("");
    //   setMonto_reventar("");
    //   numeroRef.current?.focus(); // vuelve al campo número
    // } else {
    //   Alert.alert("Error", "Revisar monto, reventar o número.");
    // }
  };

  const [isMontoLocked, setIsMontoLocked] = useState(false);

  // Crear un JSON que contenga ambos valores
  const data = {
    sorteo: sorteoId,
    fecha: format(fecha, "EEEE dd/MM/yyyy", { locale: es }),
  };

  // Calcular total
  const total = items.reduce(
    (sum, item) =>
      sum + parseFloat(item.monto || 0) + parseFloat(item.rev || 0),
    0,
  );

  // const asignarItemsAMontoNumeros = () => {
  //   setTiempo((prev) => {
  //     const nuevoTiempo = {
  //       ...prev,
  //       montoNumeros: items.map((item) => ({
  //         monto: item.monto,
  //         numero: item.numero,
  //         ...(item.rev ? { rev: item.rev } : {}),
  //       })),
  //     };

  //     return nuevoTiempo;
  //   });
  // };

  const reventarRef = useRef(null);

  const txtNumeroDone = (monto, numero) => {
    // console.log("use Reventado Log:", reventar);
    // if (!reventar) {
    //   if (numero.length === 2) {
    //     if (monto.trim() === "" || numero.trim() === "") {
    //       Alert.alert("Error", "Debe ingresar monto y número válidos.");
    //       return;
    //     }

    const restricciones = mSorteo.restringidos || [];
    console.log("reglas", restricciones);

    if (validarMontoContraRestricciones(numero, monto, restricciones)) {
      return; // Se detiene si hay una restricción
    }
    addNumeroToListAdapter(monto, numero, reventar, monto_reventar);

    // // Verificar si el número ya existe en la lista de items
    // const existingItemIndex = items.findIndex(
    //   (item) => item.numero === numero,
    // );
    // let updatedItems;

    // if (existingItemIndex !== -1) {
    //   // Si el número ya existe, sumamos el monto al monto existente
    //   updatedItems = [...items];
    //   updatedItems[existingItemIndex].monto = (
    //     parseFloat(updatedItems[existingItemIndex].monto) +
    //     parseFloat(monto)
    //   ).toString(); // Sumar el monto y convertirlo de nuevo a string

    //   // Mover el item actualizado al principio de la lista
    //   const itemToMove = updatedItems.splice(existingItemIndex, 1)[0]; // Sacamos el item de la lista
    //   updatedItems.unshift(itemToMove); // Lo agregamos al principio

    //   setItems(updatedItems); // Actualizar la lista con el monto sumado y el item movido al principio
    //   // 🔄 Actualiza tiempo.montoNumeros con los nuevos items
    //   const nuevosMontoNumeros = updatedItems.map((item) => ({
    //     monto: item.monto,
    //     numero: item.numero,
    //     ...(item.rev ? { rev: item.rev } : {}),
    //   }));

    //   setTiempo((prev) => ({
    //     ...prev,
    //     montoNumeros: nuevosMontoNumeros,
    //   }));
    // } else {
    //   // Si el número no existe, agregamos un nuevo item
    //   const newItem = {
    //     key: Date.now().toString(), // clave única
    //     monto: monto,
    //     numero: numero,
    //   };

    //   setItems((prevItems) => [newItem, ...prevItems]); // Lo agrega arriba en la lista

    //   updatedItems = [newItem, ...items];

    //   // 🔄 Actualiza tiempo.montoNumeros con los nuevos items
    //   const nuevosMontoNumeros = updatedItems.map((item) => ({
    //     monto: item.monto,
    //     numero: item.numero,
    //     ...(item.rev ? { rev: item.rev } : {}),
    //   }));

    //   setTiempo((prev) => ({
    //     ...prev,
    //     montoNumeros: nuevosMontoNumeros,
    //   }));
    // }

    setNumero(""); // Limpiar número
    if (!isMontoLocked) {
      setMonto(""); // Limpiar monto
      montoRef.current?.focus(); // Volver a poner el enfoque en el monto
    } else {
      numeroRef.current?.focus();
    }
    setMonto_reventar("");
    //   } else if (numero.length > 2) {
    //     // Si el número tiene más de 2 dígitos, limpiamos el campo
    //     setNumero(""); // Limpiar número si tiene más de 2 dígitos
    //     Alert.alert("Error", "El número debe tener exactamente 2 dígitos.");
    //   }
    // } else {
    //   //setNumero(text);
    //   if (numero.length === 2 && useReventado) {
    //     reventarRef.current?.focus();
    //   }
    //}
  };

  const actualizarMontoNumerosEnTiempo = (montoNumeros) => {
    setTiempo((prev) => {
      const nuevo = {
        ...prev,
        montoNumeros: montoNumeros,
      };

      if (
        JSON.stringify(prev.montoNumeros) === JSON.stringify(nuevo.montoNumeros)
      ) {
        return prev; // Evita el re-render
      }

      return nuevo;
    });
  };

  const addNumeroToListAdapter = (monto, numero, reventado, montoRevetado) => {
    // Verificar si el número ya existe en la lista de items
    const existingItemIndex = items.findIndex((item) => item.numero === numero);
    let updatedItems;

    if (existingItemIndex !== -1) {
      // Si el número ya existe, sumamos el monto al monto existente
      updatedItems = [...items];
      updatedItems[existingItemIndex].monto = (
        parseFloat(updatedItems[existingItemIndex].monto) + parseFloat(monto)
      ).toString(); // Sumar el monto y convertirlo de nuevo a string
      if (reventado) {
        if (updatedItems[existingItemIndex]?.rev) {
          updatedItems[existingItemIndex].rev = (
            parseFloat(updatedItems[existingItemIndex].rev) +
            parseFloat(montoRevetado)
          ).toString(); // Sumar el monto reventado y convertirlo de nuevo a string
        } else {
          updatedItems[existingItemIndex].rev =
            parseFloat(montoRevetado).toString(); // Sumar el monto reventado y convertirlo de nuevo a string
        }
      }

      // Mover el item actualizado al principio de la lista
      const itemToMove = updatedItems.splice(existingItemIndex, 1)[0]; // Sacamos el item de la lista
      updatedItems.unshift(itemToMove); // Lo agregamos al principio

      setItems(updatedItems); // Actualizar la lista con el monto sumado y el item movido al principio
      // 🔄 Actualiza tiempo.montoNumeros con los nuevos items
      const nuevosMontoNumeros = updatedItems.map((item) => ({
        monto: item.monto,
        numero: item.numero,
        ...(item.rev ? { rev: item.rev } : {}),
      }));

      actualizarMontoNumerosEnTiempo(nuevosMontoNumeros);

      // setTiempo((prev) => ({
      //   ...prev,
      //   montoNumeros: nuevosMontoNumeros,
      // }));
    } else {
      // Si el número no existe, agregamos un nuevo item
      let newItem = {
        key: generateKey(),
        monto: monto,
        numero: numero,
      };
      if (reventado) {
        newItem = {
          key: generateKey(), // clave única
          monto: monto,
          numero: numero,
          rev: monto_reventar,
        };
      }

      setItems((prevItems) => [newItem, ...prevItems]); // Lo agrega arriba en la lista

      updatedItems = [newItem, ...items];

      // 🔄 Actualiza tiempo.montoNumeros con los nuevos items
      const nuevosMontoNumeros = updatedItems.map((item) => ({
        monto: item.monto,
        numero: item.numero,
        ...(item.rev ? { rev: item.rev } : {}),
      }));

      actualizarMontoNumerosEnTiempo(nuevosMontoNumeros);

      // setTiempo((prev) => ({
      //   ...prev,
      //   montoNumeros: nuevosMontoNumeros,
      // }));
    }
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

  // Al cambiar el sorteo o la fecha, actualizamos los parámetros
  useEffect(() => {
    if (fecha) {
      setTiempo((prev) => ({
        ...prev,
        fecha: format(fecha, "yyyy-MM-dd", { locale: es }),
      }));
    }
  }, [sorteoId, fecha]);

  useEffect(() => {
    console.log("sorteo seleccionado:", mSorteo.name);
    if (!sorteoId || !userData?.id) return;

    const fetchRestringidos = async () => {
      try {
        const response = await fetch(
          `http://147.182.248.177:3001/api/restrictedNumbers/byUser/${userData.id}/${mSorteo.id}`,
        );
        const data = await response.json();
        mSorteo.restringidos = data;
        console.log("Restricciones cargadas:", mSorteo.restringidos);
      } catch (error) {
        console.error("Error cargando restricciones:", error);
      }
    };

    fetchRestringidos();
  }, [sorteoId]);

  useEffect(() => {
    tiempoRef.current = tiempo;
  }, [tiempo]);

  useEffect(() => {
    console.log("use Reventado Log:", reventar);
    if (!reventar) {
      if (numero.length === 2) {
        if (monto.trim() === "" || numero.trim() === "") {
          Alert.alert("Error", "Debe ingresar monto y número válidos.");
          return;
        }

        txtNumeroDone(monto, numero);
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
  }, [numero, monto_reventar]); // Este efecto se ejecuta solo cuando el valor de 'numero' cambia

  return (
    <Provider>
      <View style={{ flex: 1 }}>
        {/* Botón invisible que será el anchor del menú
        <TouchableOpacity
          ref={menuAnchorRef}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 1,
            height: 1,
          }}
        />

        <Menu
          visible={menuVisibleHeader}
          onDismiss={closeMenu}
          anchor={
            // Importante: el anchor debe ser un elemento visible,
            // pero aquí usamos el botón invisible para que el menú aparezca en el header
            <View />
          }
          // Alternativa: usar anchor={anchorRef.current} si quieres anclar al botón invisible
        >
          <Menu.Item
            onPress={() => {
              closeMenu();
              console.log("Pre Cargar");
            }}
            title="Pre Cargar"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              closeMenu();
              console.log("Categorías Predeterminadas");
            }}
            title="Categorías Predeterminadas"
          />
        </Menu> */}

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
                    style={styles.inputSmall}
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
                      setMonto_reventar("");
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

                <TextInput
                  placeholder="Nombre Cliente"
                  style={styles.input}
                  value={tiempo.nombreCliente}
                  onChangeText={setNombreCliente}
                />
                {/* Switches */}
                <View style={styles.switchRow}>
                  <Text>Limpiar al imprimir</Text>
                  <Switch value={limpiar} onValueChange={setLimpiar} />

                  {useReventado && (
                    <>
                      <Text>Reventar</Text>
                      <Switch
                        value={reventar}
                        onValueChange={handleReventarChange}
                      />
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
                        if (!isNaN(montoNum) && validateMonto(montoNum) === 0) {
                          setIsMontoLocked(true); // Bloquear el campo
                          numeroRef.current?.focus(); // Volver a poner el enfoque en el numero
                        } else {
                          Alert.alert(
                            "Monto inválido",
                            "Debe ser un múltiplo de 50.",
                          );
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
                    style={[styles.inputSmall, { marginLeft: 8 }]}
                    value={monto}
                    onChangeText={setMonto}
                    keyboardType="numeric"
                    returnKeyType="done"
                    editable={!isMontoLocked}
                    onSubmitEditing={() => {
                      const montoNum = parseInt(monto, 10);
                      if (!isNaN(montoNum) && validateMonto(montoNum) === 0) {
                        numeroRef.current?.focus();
                      } else {
                        Alert.alert(
                          "Monto inválido",
                          "Debe ser un múltiplo de 50.",
                        );
                      }
                    }}
                  />

                  <TextInput
                    ref={numeroRef}
                    placeholder="Número"
                    style={[styles.inputSmall, { marginLeft: 8 }]}
                    value={numero}
                    onChangeText={setNumero}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>
                {useReventado && reventar && (
                  <View style={styles.row}>
                    <View style={styles.iconButtonInvisible} />

                    <TextInput
                      ref={reventarRef}
                      placeholder="Reventar"
                      style={[styles.inputSmall, { marginLeft: 8 }]}
                      value={monto_reventar}
                      onChangeText={setMonto_reventar}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        const montoNumReventar = parseInt(monto_reventar, 10);
                        if (
                          !isNaN(montoNumReventar) &&
                          validateMonto(montoNumReventar) === 0
                        ) {
                          handleSubmitReventar();
                        } else {
                          Alert.alert(
                            "Monto inválido",
                            "Debe ser un múltiplo de 50.",
                          );
                        }
                      }}
                    />
                    <View
                      style={[styles.inputSmallInvisible, { marginLeft: 8 }]}
                    />
                  </View>
                )}
              </View>

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
              <Text style={styles.totalValue}>₡{total.toFixed(2)}</Text>
            </View>
          </View>
        </>
      </View>

      <Portal>
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
                CATEGORÍAS PREDETERMINADAS
              </Text>
            </View>

            {/* Campo categoría (abre otro diálogo) */}
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
                value={categoriasMonto}
                onChangeText={setCategoriasMonto}
                keyboardType="numeric"
              />
            )}
            {categoriaSeleccionada === "Terminan en..." && (
              <TextInput
                placeholder="Números que terminan en"
                value={categoriasTerminaEn}
                onChangeText={setCategoriasTerminaEn}
                keyboardType="numeric"
                style={[styles.input, { marginTop: 15, textAlign: "center" }]}
              />
            )}
            {categoriaSeleccionada === "Inician con..." && (
              <TextInput
                placeholder="Números que inician con"
                value={categoriasTerminaEn}
                onChangeText={setCategoriasTerminaEn}
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
                    value={categoriasTerminaEn}
                    onChangeText={setCategoriasTerminaEn}
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      { marginTop: 15, textAlign: "center", width: 140 },
                    ]}
                  />
                  <TextInput
                    placeholder="Hasta"
                    value={categoriasTerminaEn}
                    onChangeText={setCategoriasTerminaEn}
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
                value={categoriasTerminaEn}
                onChangeText={setCategoriasTerminaEn}
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
          {/* <Dialog.Title>
            <Text style={{ marginLeft: 8, fontWeight: "bold", color: "#000" }}>
              CATEGORÍAS
            </Text>
          </Dialog.Title> */}
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
