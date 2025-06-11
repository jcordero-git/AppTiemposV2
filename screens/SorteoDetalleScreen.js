// screens/SorteoDetalleScreen.js

import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale"; // idioma español
import { formatHour } from "../utils/timeUtils";

export default function SorteoDetalleScreen({ navigation, route }) {
  const { sorteo, userData } = route.params;
  const [reventar, setReventar] = useState(false);
  const [fechaRestringida, setFechaRestringida] = useState(false);
  const [restricciones, setRestricciones] = useState([]);
  const [hora, setHora] = useState("");

  useEffect(() => {
    console.log("Sorteo Seleccionado:", sorteo);

    setHora(formatHour(sorteo.limitTime));

    if (typeof sorteo?.useReventado === "boolean")
      setReventar(sorteo.useReventado);

    if (!userData?.id || !sorteo?.id) return;

    const endpoint = `https://3jbe.tiempos.website/api/restrictedNumbers/byUser/${userData.id}/${sorteo.id}`;
    console.log("Fetching restricciones from:", endpoint);
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        console.log("Restricciones recibidas:", data);
        setRestricciones(data);
        const tieneFecha = data.some((regla) => regla.restricted === "{DATE}");
        setFechaRestringida(tieneFecha);
      })
      .catch((err) => console.error("Error al cargar restricciones:", err));
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: sorteo.name,
    });
  }, [navigation, sorteo]);

  const renderRestriccion = ({ item }) => {
    const isFecha = item.restricted === "{DATE}";
    const contenido = isFecha ? (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name="calendar" size={20} style={{ marginRight: 8 }} />
        <Text style={{ fontWeight: "bold" }}>[{new Date().getDate()}]</Text>
      </View>
    ) : (
      <Text style={{ fontWeight: "bold" }}>[{item.restricted}]</Text>
    );

    return (
      <View
        style={{
          padding: 10,
          borderBottomWidth: 1,
          borderColor: "#eee",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {contenido}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ marginRight: 10, color: "#666" }}>
            (₡{item.restrictedAmount})
          </Text>
          <Text style={{ fontWeight: "600", color: "#666" }}>
            %{item.sellerRestrictedPercent}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "white" }}>
      <TextInput
        value={sorteo?.name}
        editable={false}
        style={{ fontSize: 18, borderBottomWidth: 1, color: "#444" }}
      />

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
      >
        <TextInput
          editable={false}
          style={{
            flex: 1,
            fontSize: 16,
            borderBottomWidth: 1,
            color: "#444",
            marginRight: 8,
          }}
          value={hora}
        ></TextInput>
        <TextInput
          value={sorteo?.prizeTimes?.toString() || "0"}
          editable={false}
          style={{
            width: 50,
            textAlign: "right",
            fontSize: 16,
            borderBottomWidth: 1,
            marginRight: 8,
          }}
        />
        <Text style={{ marginRight: 8 }}>veces</Text>
        <View
          style={{
            width: 30,
            height: 30,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 15,
          }}
        />
      </View>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
      >
        <Text style={{ flex: 1, fontSize: 16, color: "#999" }}>
          Usa Reventado
        </Text>
        <Switch value={reventar} disabled={true} style={{ marginRight: 8 }} />
        <TextInput
          value="0"
          editable={false}
          style={{
            width: 50,
            textAlign: "right",
            fontSize: 16,
            borderBottomWidth: 1,
            marginRight: 8,
          }}
        />
        <Text style={{ marginRight: 8 }}>veces</Text>
        <View
          style={{
            width: 30,
            height: 30,
            backgroundColor: "gray",
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 15,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 20,
          justifyContent: "flex-end",
        }}
      >
        <TextInput
          value={sorteo?.revPrizeTimes?.toString() || "0"}
          editable={false}
          style={{
            width: 50,
            textAlign: "right",
            fontSize: 16,
            borderBottomWidth: 1,
            marginRight: 8,
          }}
        />
        <Text style={{ marginRight: 8 }}>veces</Text>
        <View
          style={{
            width: 30,
            height: 30,
            backgroundColor: "red",
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 15,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 10,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: "#999" }} />
        <Text style={{ marginHorizontal: 10, color: "#999" }}>
          Reglas de restringidos
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: "#999" }} />
        <TouchableOpacity
          disabled={true}
          style={{
            marginLeft: 10,
            padding: 4,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 4,
            opacity: 0.4,
          }}
        >
          <Ionicons name="add" size={24} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 0,
        }}
      >
        <Text style={{ fontSize: 16, color: "#999" }}>Restringir Fecha</Text>
        <Switch
          value={fechaRestringida}
          disabled={true}
          onValueChange={setFechaRestringida}
        />
      </View>

      <FlatList
        data={restricciones}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderRestriccion}
      />
    </View>
  );
}
