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
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale"; // idioma español
import DateTimePicker from "@react-native-community/datetimepicker";

export default function VentaScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [limpiar, setLimpiar] = useState(true);
  const [reventar, setReventar] = useState(false);
  const [sorteo, setSorteo] = useState("");
  const [fecha, setFecha] = useState(new Date()); // Siempre inicializa con un Date válido
  const [nombreCliente, setNombreCliente] = useState("");
  const [monto, setMonto] = useState("");
  const [numero, setNumero] = useState("");
  const [monto_reventar, setMonto_reventar] = useState("");

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const [showPicker, setShowPicker] = useState(false);

  const numeroRef = useRef(null);
  const montoRef = useRef(null);

  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const [items, setItems] = useState([]);

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemLeft}>₡{item.monto}</Text>
      <Text style={styles.itemRight}>{item.numero}</Text>
    </View>
  );

  const formattedDate = format(fecha, "EE dd/MM/yyyy", { locale: es });

  const toInputDateFormat = (date) => {
    return date.toISOString().split("T")[0]; // "2025-04-29"
  };

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setFecha(selectedDate);
    }
  };

  const [isMontoLocked, setIsMontoLocked] = useState(false);

  // Crear un JSON que contenga ambos valores
  const data = {
    sorteo: sorteo,
    fecha: format(fecha, "EEEE dd/MM/yyyy", { locale: es }),
  };

  // Calcular total
  const total = items.reduce(
    (sum, item) => sum + parseFloat(item.monto || 0),
    0,
  );

  // Al cambiar el sorteo o la fecha, actualizamos los parámetros
  useEffect(() => {
    navigation.setParams({ data: data });
  }, [sorteo, fecha]);

  // Efecto para verificar si el número tiene 2 dígitos
  useEffect(() => {
    if (numero.length === 2) {
      if (monto.trim() === "" || numero.trim() === "") {
        Alert.alert("Error", "Debe ingresar monto y número válidos.");
        return;
      }

      // Verificar si el número ya existe en la lista de items
      const existingItemIndex = items.findIndex(
        (item) => item.numero === numero,
      );

      if (existingItemIndex !== -1) {
        // Si el número ya existe, sumamos el monto al monto existente
        const updatedItems = [...items];
        updatedItems[existingItemIndex].monto = (
          parseFloat(updatedItems[existingItemIndex].monto) + parseFloat(monto)
        ).toString(); // Sumar el monto y convertirlo de nuevo a string

        // Mover el item actualizado al principio de la lista
        const itemToMove = updatedItems.splice(existingItemIndex, 1)[0]; // Sacamos el item de la lista
        updatedItems.unshift(itemToMove); // Lo agregamos al principio

        setItems(updatedItems); // Actualizar la lista con el monto sumado y el item movido al principio
      } else {
        // Si el número no existe, agregamos un nuevo item
        const newItem = {
          key: Date.now().toString(), // clave única
          monto: monto,
          numero: numero,
        };

        setItems((prevItems) => [newItem, ...prevItems]); // Lo agrega arriba en la lista
      }

      setNumero(""); // Limpiar número
      if (!isMontoLocked) {
        setMonto(""); // Limpiar monto
        montoRef.current?.focus(); // Volver a poner el enfoque en el monto
      }
    } else if (numero.length > 2) {
      // Si el número tiene más de 2 dígitos, limpiamos el campo
      setNumero(""); // Limpiar número si tiene más de 2 dígitos
      Alert.alert("Error", "El número debe tener exactamente 2 dígitos.");
    }
  }, [numero]); // Este efecto se ejecuta solo cuando el valor de 'numero' cambia

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.title}>VENTA</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => console.log("Imprimir")}>
            <Ionicons
              name="print"
              size={24}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log("Seleccionar imagen")}>
            <Ionicons
              name="image"
              size={24}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>

          <Pressable onPress={toggleMenu}>
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color="black"
              style={styles.icon}
            />
          </Pressable>
        </View>

        {menuVisible && (
          <View style={styles.dropdown}>
            <TouchableOpacity onPress={() => console.log("Opción 1")}>
              <Text style={styles.menuItem}>Opción 1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => console.log("Opción 2")}>
              <Text style={styles.menuItem}>Opción 2</Text>
            </TouchableOpacity>
          </View>
        )}
      </View> */}

      {/* Formulario y Lista */}
      <View style={[styles.formAndListContainer, isWeb && styles.webLayout]}>
        {/* Formulario */}
        <View style={[styles.formContainer, isWeb && styles.webFormContainer]}>
          <View style={styles.formRow}>
            <TextInput
              placeholder="Sorteo"
              style={styles.inputSmall}
              value={sorteo}
              onChangeText={setSorteo}
            />
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={toInputDateFormat(fecha)}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate)) setFecha(newDate);
                }}
                style={{
                  ...styles.inputSmall,
                  padding: 8,
                  fontSize: 16,
                  border: "none",
                }}
              />
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
                    display={Platform.OS === "android" ? "calendar" : "default"}
                    onChange={handleDateChange}
                  />
                )}
              </>
            )}
          </View>

          <TextInput
            placeholder="Nombre Cliente"
            style={styles.input}
            value={nombreCliente}
            onChangeText={setNombreCliente}
          />

          {/* Switches */}
          <View style={styles.switchRow}>
            <Text>Limpiar al imprimir</Text>
            <Switch value={limpiar} onValueChange={setLimpiar} />
            <Text style={{ marginLeft: 20 }}>Reventar</Text>
            <Switch value={reventar} onValueChange={setReventar} />
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
                  if (!isNaN(montoNum) && montoNum % 50 === 0) {
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
              <Ionicons
                name={isMontoLocked ? "lock-closed" : "lock-open"}
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
                if (!isNaN(montoNum) && montoNum % 50 === 0) {
                  numeroRef.current?.focus();
                } else {
                  Alert.alert("Monto inválido", "Debe ser un múltiplo de 100.");
                }
              }}
            />

            <TextInput
              ref={numeroRef}
              placeholder="Numero"
              style={[styles.inputSmall, { marginLeft: 8 }]}
              value={numero}
              onChangeText={setNumero}
              keyboardType="numeric"
              returnKeyType="done"
              // onChangeText={(text) => {
              //   setNumero(text);
              //   if (numero.length === 2) {
              //     if (monto.trim() === "" || numero.trim() === "") {
              //       Alert.alert(
              //         "Error",
              //         "Debe ingresar monto y número válidos.",
              //       );
              //       return;
              //     }

              //     // Comprobamos si el número ya existe en los items
              //     const existingItemIndex = items.findIndex(
              //       (item) => item.numero === numero,
              //     );

              //     if (existingItemIndex !== -1) {
              //       // Si el número ya existe, sumamos el monto al monto existente
              //       const updatedItems = [...items];
              //       updatedItems[existingItemIndex].monto = (
              //         parseFloat(updatedItems[existingItemIndex].monto) +
              //         parseFloat(monto)
              //       ).toString(); // Sumar el monto y convertirlo de nuevo a string

              //       // Mover el item actualizado al final de la lista
              //       const itemToMove = updatedItems.splice(
              //         existingItemIndex,
              //         1,
              //       )[0]; // Sacamos el item de la lista
              //       updatedItems.unshift(itemToMove); // Lo agregamos al final

              //       setItems(updatedItems); // Actualizar la lista con el monto sumado
              //     } else {
              //       // Si el número no existe, agregamos un nuevo item
              //       const newItem = {
              //         key: Date.now().toString(), // clave única
              //         monto: monto,
              //         numero: numero,
              //       };

              //       setItems((prevItems) => [newItem, ...prevItems]); // Lo agrega arriba en la lista
              //     }

              //     //setItems((prevItems) => [newItem, ...prevItems]); // lo agrega arriba en la lista
              //     setMonto(""); // limpia monto
              //     setNumero(""); // limpia numero
              //     montoRef.current?.focus();
              //   } else {
              //   }
              // }}
            />
          </View>
          {reventar && (
            <View style={styles.row}>
              <TextInput
                placeholder="Reventar"
                style={styles.inputSmall}
                value={monto_reventar}
                onChangeText={setMonto_reventar}
                keyboardType="numeric"
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
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
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
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
});
