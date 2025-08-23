import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useRoute } from "@react-navigation/native";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { formatHourStr } from "../utils/datetimeUtils";
let crashlytics;
if (Platform.OS !== "web") {
  crashlytics = require("@react-native-firebase/crashlytics").default;
}

const SorteosScreen = forwardRef(function SorteosScreen({ navigation }, ref) {
  //crashlytics().setAttributes({ screen: "sorteos" }); // atributos adicionales
  const route = useRoute();
  const { userData, logout } = useAuth();
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";

  const [modalVisible, setModalVisible] = useState(false);
  const [sorteoNombre, setSorteoNombre] = useState("");
  const [sorteoId, setSorteoId] = useState(null);

  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (Platform.OS !== "web" && crashlytics) {
      crashlytics().setAttributes({
        screen: "sorteos",
      });
      crashlytics().log("📌 Entrando a pantalla sorteos");
    }
  }, [userData, backend_url]);

  React.useLayoutEffect(() => {
    if (!navigation?.setOptions) return;
    const data = route.params?.data || {
      sorteo: "No Sorteo",
      fecha: "No Fecha",
    };

    navigation.setOptions({
      title: "SORTEOS",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        <>
          <MaterialIcons
            name="sync"
            size={24}
            color="#fff" // Blanco para contraste con fondo verde
            style={{ marginRight: 15 }}
            onPress={() => {
              fetchSorteos();
            }}
          />
        </>
      ),
    });
  }, [navigation, route.params]);

  // const formatHour = (timeStr) => {
  //   try {
  //     const date = parse(timeStr, "HH:mm:ss", new Date());
  //     return format(date, "hh:mm a", { locale: es }).toUpperCase(); // 10:58 PM
  //   } catch (e) {
  //     return timeStr;
  //   }
  // };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("SorteoDetalle", { sorteo: item, userData })
      }
    >
      <View style={styles.itemRow}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <View style={styles.itemDetailsRow}>
          <Text style={styles.timeText}>{formatHourStr(item.limitTime)}</Text>
          <Text style={styles.pagaText}>PAGA</Text>
          <Text style={styles.vecesText}>{item.prizeTimes} veces</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // const SorteosScreen = forwardRef(function SorteosScreen({ navigation }, ref) {
  //   const fetchSorteos = async () => {
  //     console.log("syn desde sorteo layout screen");
  //     fetchSorteosLocal();
  //   };

  //   useImperativeHandle(ref, () => ({
  //     reloadSorteos: fetchSorteos,
  //   }));
  // });

  const fetchSorteos = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${backend_url}/api/drawCategory/user/${userData.id}`,
      );
      const data = await response.json();
      // Asegúrate de mapear los datos al formato que esperas en FlatList
      // Ordenar por limitTime (hora) - más temprano primero
      const sorteosOrdenados = data.sort((a, b) => {
        const horaA = new Date(`1970-01-01T${a.limitTime}Z`);
        const horaB = new Date(`1970-01-01T${b.limitTime}Z`);
        return horaA - horaB;
      });

      const sorteosFormateados = sorteosOrdenados.map((item, index) => ({
        key: item.id.toString(), // necesario para FlatList
        id: item.id,
        name: item.name || "Sin nombre",
        prizeTimes: item.userValues?.prizeTimes || 0,
        revPrizeTimes: item.userValues?.revPrizeTimes || 0,
        limitTime: item.limitTime || "",
        useReventado: item.useReventado,
        sellerPercent: item.userValues?.sellerPercent || 0,
        revSellerPercent: item.userValues?.revSellerPercent || 0,
      }));
      setItems(sorteosFormateados);
    } catch (error) {
      console.error("Error al obtener sorteos", error);
      Alert.alert("Error", "No se pudieron cargar los sorteos.");
    } finally {
      setLoading(false); // Ocultar el loading
    }
  };

  useImperativeHandle(ref, () => ({
    reloadSorteos: fetchSorteos,
  }));

  useEffect(() => {
    if (userData?.id) {
      fetchSorteos();
    }
  }, [userData]);

  return (
    <View style={styles.container}>
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

      {/* Formulario y Lista */}
      <View style={[styles.formAndListContainer, isWeb && styles.webLayout]}>
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
    </View>
  );
});
export default SorteosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 12,
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
    marginTop: 12,
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
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 12,
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },

  itemDetailsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  timeText: {
    fontSize: 14,
    color: "#555",
  },

  pagaText: {
    fontSize: 14,
    color: "#555",
  },

  vecesText: {
    fontSize: 14,
    color: "#555",
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
