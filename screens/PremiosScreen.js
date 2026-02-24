import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Divider, Provider, Portal, Dialog, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSnackbar } from "../context/SnackbarContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerWeb from "../components/DatePickerWeb";
import mSorteo from "../models/mSorteoSingleton.js";
import SorteoSelectorModal from "../components/SorteoSelectorModal";
import { formatDate, formatHour_custom } from "../utils/datetimeUtils";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import mFechaSeleccionada from "../models/mFechaSeleccionadaSingleton.js";
import PrinterUtils from "../utils/print/printerUtils";
import { generateHTMLPremios } from "../utils/share/generateHTMLPremios";
import { WebView } from "react-native-webview";

import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import getHtml2Canvas from "../utils/getHtml2Canvas";

export default function PremiosScreen({ navigation }) {
  const ticketRef = useRef(null);
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(100);

  const [webviewHeight, setWebviewHeight] = useState(100); // altura inicial mínima
  const [generateImage, setGenerateImage] = useState(false);

  const [loaded, setLoaded] = useState(false);

  const [html, setHtml] = React.useState(null);
  const [dialogPrintVisible, setDialogPrintVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { width, height } = useWindowDimensions();
  const isWeb = width > 710;
  const { showSnackbar } = useSnackbar();
  const [modalVisible, setModalVisible] = useState(false);

  const { userData, logout, ticketProfile } = useAuth();
  const token = userData.token;
  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";

  const [sorteoNombre, setSorteoNombre] = useState("");
  const [sorteoId, setSorteoId] = useState(null);
  const [fecha, setFecha] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = formatDate(fecha, "EE dd/MM/yyyy");
  const [numero, setNumero] = useState("");
  const numeroRef = useRef(null);

  // 🔹 Ahora es un useRef
  const tiemposAnterioresRef = useRef([]);

  const [colorIndex, setColorIndex] = useState(0);
  const colors = ["white", "red"];
  const currentColor = colors[colorIndex];
  const toggleColor = () => setColorIndex((prev) => (prev + 1) % colors.length);

  const tiemposFiltrados =
    numero.trim().length === 2
      ? tiemposAnterioresRef.current
          .filter((item) =>
            item.numbers?.some((n) => n.numero === numero.trim()),
          )
          .map((item) => {
            const numeroCoincidente = item.numbers.find(
              (n) => n.numero === numero.trim(),
            );
            const monto = numeroCoincidente?.monto || 0;
            const prizeTimes = mSorteo?.userValues.prizeTimes || 0;
            const premio = monto * prizeTimes;
            const isReventado = currentColor === "red";
            const montoReventado = isReventado
              ? numeroCoincidente?.montoReventado || 0
              : 0;
            const revPrizeTimes = isReventado
              ? mSorteo?.userValues.revPrizeTimes || 0
              : 0;
            const revPremio = montoReventado * revPrizeTimes;

            return {
              ...item,
              monto,
              prizeTimes,
              premio,
              montoReventado,
              revPrizeTimes,
              revPremio,
            };
          })
      : [];

  const total = tiemposFiltrados?.reduce((sum, item) => {
    const premio = parseFloat(item.premio) || 0;
    const revPremio = parseFloat(item.revPremio) || 0;
    return sum + (currentColor === "red" ? premio + revPremio : premio);
  }, 0);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "PREMIOS",
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerRight: () => (
        // <TouchableOpacity onPress={handlePrintBt} style={{ marginRight: 16 }}>
        <TouchableOpacity onPress={handlePrint} style={{ marginRight: 16 }}>
          <MaterialIcons name="print" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, tiemposFiltrados, total, numero, currentColor]);

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

  const handlePrint = async () => {
    setIframeHeight(100);
    setWebviewHeight(100);

    const htmlGenerado = await generateHTMLPremios(
      tiemposFiltrados,
      total,
      mSorteo,
      userData,
      ticketProfile,
      numero,
      currentColor === "red",
      mFechaSeleccionada.getFecha(),
    );
    setHtml(htmlGenerado);
    setLoaded(false);
    setDialogPrintVisible(true);
    Keyboard.dismiss(); // Oculta el teclado
  };

  const isWebMobile = () => {
    if (typeof navigator === "undefined") return false;
    return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent,
    );
  };

  const handlePrintBt = async () => {
    try {
      if (Platform.OS === "android") {
        const mac = ticketProfile.lastPrinterMacAddress;
        try {
          await PrinterUtils.connectToDevice(mac);
        } catch {
          showSnackbar(
            "Impresora no encontrada. Por favor empareje desde ajustes.",
            3,
          );
          return;
        }
        await PrinterUtils.printPremios({
          items: tiemposFiltrados,
          total,
          sorteoSeleccionado: mSorteo,
          vendedorData: userData,
          ticketProfile,
          numeroPremiado: numero,
          reventado: currentColor === "red",
          fecha: mFechaSeleccionada.getFecha(),
        });
        await PrinterUtils.disconnect();
      } else if (Platform.OS === "web") {
        const iframeWindow = iframeRef?.current?.contentWindow;
        if (iframeWindow) {
          iframeWindow.focus();
          iframeWindow.print();
        }

        if (!isWebMobile()) {
          window.setTimeout(() => {
            setDialogPrintVisible(false);
          }, 100);
        }
      }
    } catch (e) {
      console.error("Error al imprimir:", e);
      showSnackbar(
        "Hubo un error al imprimir. Revisa la conexión con la impresora.",
        3,
      );
    }
  };

  useEffect(() => {
    if (!html || !loaded) return;

    const compartir = async () => {
      if (Platform.OS === "web") {
        const html2canvas = getHtml2Canvas();
        if (!html2canvas) {
          showSnackbar("html2canvas no disponible en esta plataforma.", 3);
          return;
        }

        const container = window.document.createElement("div");

        container.innerHTML = html;
        container.style.width = "60mm";
        container.style.padding = "10px";
        container.style.margin = "10";
        container.style.boxSizing = "border-box";
        container.style.backgroundColor = "white";

        window.document.body.appendChild(container);
        await new Promise((r) => window.setTimeout(r, 100));

        // const svg = container.querySelector("#barcode");
        // if (svg) {
        //   JsBarcode(
        //     svg,
        //     tiempoSeleccionado !== null
        //       ? tiempoSeleccionado.id
        //       : tiempoAImprimirRef.current.id,
        //     {
        //       format: "CODE128",
        //       lineColor: "#000",
        //       width: 3,
        //       height: 30,
        //       displayValue: false,
        //       fontSize: 14,
        //       margin: 0,
        //     },
        //   );
        // }

        // Esperar un poco más para asegurar render
        await new Promise((r) => window.setTimeout(r, 100));

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        // const imgDataUrl = canvas.toDataURL("image/png");
        // const link = window.document.createElement("a");
        // link.href = imgDataUrl;
        // link.download = `ticket_${Date.now()}.png`;
        // link.click();

        const blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png"),
        );

        if (blob) {
          const ClipboardItem = window.ClipboardItem || window.clipboardItem;
          const clipboardItem = new ClipboardItem({ "image/png": blob });
          try {
            await navigator.clipboard.write([clipboardItem]);
            showSnackbar(
              "✅ Imagen copiada. Ahora podés pegarla en WhatsApp Web (Ctrl+V).",
              1,
            );
            // if (Platform.OS === "web") {
            window.location.href = "whatsapp://";
            // }
            setDialogPrintVisible(false);
          } catch (error) {
            console.error("❌ Error copiando al portapapeles:", error);
            showSnackbar(
              "Tu navegador no permite copiar imágenes al portapapeles.",
              3,
            );
          }
        }

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

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === "dismissed") return; // 🚫 ignorar cancel
    if (selectedDate) setFecha(selectedDate);
  };

  const fetchTiemposAnteriores = async (drawCategoryId, drawDate) => {
    try {
      if (drawCategoryId === 0 || !drawDate) {
        tiemposAnterioresRef.current = [];
        return;
      }
      // const response = await fetch(
      //   `${backend_url}/api/ticket/${drawCategoryId}/${drawDate}/${userData.id}?token=${token}`,
      //   { method: "GET", headers: { "Content-Type": "application/json" } },
      // );
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
        showSnackbar("⚠️ El usuario no tiene permisos.");
        logout();
        tiemposAnterioresRef.current = [];
        return;
      }
      if (response.status !== 200) {
        showSnackbar("⚠️ Error al obtener tiempos vendidos");
        tiemposAnterioresRef.current = [];
        return;
      }
      const data = await response.json();
      const sortedData = data
        .filter((item) => item.status === 201)
        .sort((a, b) => b.id - a.id);

      tiemposAnterioresRef.current = sortedData;
    } catch (error) {
      console.error("Error al cargar tiempos anteriores:", error);
      tiemposAnterioresRef.current = [];
    }
  };

  const cargaSorteoSeleccionado = async () => {
    Object.assign(mSorteo, mSorteo);
    setSorteoNombre(mSorteo.name);
    setSorteoId(mSorteo.id);
    setNumero("");
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
          await fetchTiemposAnteriores(
            drawId,
            formatDate(fechaActual, "yyyy-MM-dd"),
          );
        }
      };

      load();
      setNumero("");

      return () => {
        isActive = false;
      };
    }, [userData?.id, sorteoId]),
  );

  useEffect(() => {
    // if (skipNextEffect.current) {
    //   skipNextEffect.current = false;
    //   return;
    // }

    if (!fecha || !sorteoId || !userData?.id) return;

    const load = async () => {
      mFechaSeleccionada.setFecha(fecha);
      setNumero("");
      console.log("entro a actualizar desde useEfect");
      await fetchTiemposAnteriores(sorteoId, formatDate(fecha, "yyyy-MM-dd"));
    };

    load();
  }, [fecha, sorteoId, userData?.id]);

  // useFocusEffect(
  //   useCallback(() => {
  //     const fechaActual = mFechaSeleccionada.getFecha();
  //     setFecha(fechaActual);
  //   }, []),
  // );

  // useFocusEffect(
  //   useCallback(() => {
  //     (async () => {
  //       if (mSorteo.id !== 0) {
  //         await cargaSorteoSeleccionado();

  //         mFechaSeleccionada.setFecha(fecha);
  //         const isAllowed = await fetchTiemposAnteriores(
  //           sorteoId,
  //           formatDate(fecha, "yyyy-MM-dd"),
  //         );
  //       }
  //     })();
  //   }, [fecha, sorteoId]), // <--- agregá las dependencias acá
  // );

  // useEffect(() => {
  //   console.log("mSorteo.id", mSorteo.id);
  //   console.log("sorteoId", sorteoId);

  //   if (!fecha || !sorteoId || !userData?.id) return;
  //   async function execute() {
  //     mFechaSeleccionada.setFecha(fecha);
  //     const isAllowed = await fetchTiemposAnteriores(
  //       sorteoId,
  //       formatDate(fecha, "yyyy-MM-dd"),
  //     );
  //   }
  //   execute();
  // }, [sorteoId, fecha]);

  // 🔹 Un solo hook para toda la carga
  // useFocusEffect(
  //   useCallback(() => {
  //     const load = async () => {
  //       const fechaActual = mFechaSeleccionada.getFecha();
  //       setFecha(fechaActual);

  //       if (mSorteo.id !== 0) {
  //         await cargaSorteoSeleccionado();
  //       }

  //       if (fechaActual && mSorteo.id && userData?.id) {
  //         mFechaSeleccionada.setFecha(fechaActual);
  //         await fetchTiemposAnteriores(
  //           mSorteo.id,
  //           formatDate(fechaActual, "yyyy-MM-dd"),
  //         );
  //       }
  //     };
  //     load();
  //   }, [userData?.id, sorteoId, fecha]),
  // );

  return (
    <Provider>
      <View style={{ flex: 1 }}>
        {loading && (
          <TouchableWithoutFeedback>
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </TouchableWithoutFeedback>
        )}
        <View style={styles.container}>
          <View
            style={[styles.formAndListContainer, isWeb && styles.webLayout]}
          >
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
                {Platform.OS === "web" ? (
                  <DatePickerWeb value={fecha} onChange={setFecha} />
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
                        display="calendar"
                        onChange={handleDateChange}
                      />
                    )}
                  </>
                )}
              </View>
              <View style={styles.row}>
                <TextInput
                  ref={numeroRef}
                  placeholder="Número"
                  style={[styles.inputSmall, { marginRight: 8, minWidth: 70 }]}
                  value={numero}
                  onChangeText={(text) =>
                    setNumero(text.replace(/[^0-9]/g, "").slice(0, 2))
                  }
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit={false}
                  maxLength={2}
                />
                {mSorteo.useReventado && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={toggleColor}
                  >
                    <MaterialIcons
                      name="circle"
                      size={20}
                      color={colors[colorIndex]}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Divider />
            <View style={[styles.listContainer, !isWeb && { marginTop: 0 }]}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 10 }}>
                {tiemposFiltrados.map((item, index) => (
                  <Pressable key={item.id || index} style={styles.item}>
                    <Text style={{ fontWeight: "bold" }}>
                      Código: # {item.id || ""}
                    </Text>
                    <Text style={{ color: "#555" }}>
                      Hora:{" "}
                      {formatHour_custom(
                        new Date(item.createdAt),
                        "hh:mm:ss a",
                      )}
                    </Text>

                    <Text style={{ fontWeight: "bold" }}>
                      Cliente: {item.clientName || "Sin nombre"}
                    </Text>

                    <Text style={{ fontWeight: "bold" }}>
                      Premio: ₡{item.monto} x {item.prizeTimes} = ₡{item.premio}
                    </Text>
                    {currentColor === "red" && item.montoReventado > 0 && (
                      <Text style={{ fontWeight: "bold" }}>
                        Premio Reventado: ₡{item.montoReventado} x{" "}
                        {item.revPrizeTimes} = ₡{item.revPremio}
                      </Text>
                    )}
                    <Text style={{ color: "#090" }}>
                      Premio Total a pagar: ₡{item.premio + item.revPremio}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={styles.totalBar}>
            <View style={styles.totalTextGroup}>
              {/* <Text style={styles.totalText}>TOTAL: </Text> */}
              <Text style={styles.totalValue}>TOTAL: ₡{total?.toFixed(0)}</Text>
            </View>
          </View>
        </View>
        <SorteoSelectorModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={(sorteo) => {
            Object.assign(mSorteo, sorteo);
            setSorteoId(mSorteo.id);
            setSorteoNombre(mSorteo.name);
          }}
          leftPosition
        />
      </View>

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
          {/* Diálogo Print */}
          <Dialog.Content>
            {dialogPrintVisible && html && (
              <>
                <View
                  style={{
                    maxHeight: height * 0.6, // Límite del 80% altura real
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ScrollView
                    style={{
                      width: "100%",
                      backgroundColor: "white",
                      // borderWidth: 1,
                      // borderColor: "#ccc",
                    }}
                    contentContainerStyle={{
                      alignItems: "center",
                      paddingVertical: 8,
                    }}
                  >
                    <View
                      ref={ticketRef}
                      collapsable={false}
                      style={{
                        width: 225,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        overflow: "hidden", // 👈 evitar scroll innecesario
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
                          html { margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; width: 100%; height: auto; }
                            body { width:59mm; margin-left: 0px; padding: 0px; box-sizing: border-box; }
                            .wrapper {
                              // margin-left: 5px;
                              //justify-content: "center"
                              //width: 60mm;
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
                            //width: 240,
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
                              const height = parseInt(
                                event.nativeEvent.data,
                                10,
                              );
                              setWebviewHeight(height);
                            }}
                            injectedJavaScript={`
                     const meta = document.createElement('meta');
                     meta.setAttribute('name', 'viewport');
                     meta.setAttribute('content', 'width=245, initial-scale=1, maximum-scale=1, user-scalable=no');
                     document.head.appendChild(meta);
                     document.body.style.margin = '0';
                     document.body.style.overflow = 'auto';
                     document.documentElement.style.overflow = 'auto';
 
                     setTimeout(() => {
                       const height = document.body.scrollHeight;
                       window.ReactNativeWebView.postMessage(height.toString());
                     }, 200);
                     true;
                   `}
                            style={{
                              width: "100%",
                              height: webviewHeight || 100,
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
                                  base64Image.replace(
                                    "data:image/png;base64,",
                                    "",
                                  ),
                                  { encoding: FileSystem.EncodingType.Base64 },
                                );

                                const canShare =
                                  await Sharing.isAvailableAsync();
                                if (canShare) {
                                  await Sharing.shareAsync(path, {
                                    mimeType: "image/png",
                                    dialogTitle: "Compartir ticket",
                                  });
                                  //setRefreshHeader(true);
                                }

                                setGenerateImage(false);
                                setDialogPrintVisible(false);
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
                  </ScrollView>
                </View>
              </>
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
      </Portal>
    </Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 16,
  },
  formAndListContainer: { flexDirection: "column", marginTop: 20, flex: 1 },
  webLayout: { flexDirection: "row" },
  formContainer: { marginBottom: 20 },
  webFormContainer: { marginRight: 20, minWidth: 410, maxWidth: 410 },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  listContainer: { flex: 1, maxHeight: 900 },
  inputSmall: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    minHeight: 40,
  },
  inputSmallSorteo: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    minHeight: 40,
    minWidth: 80,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6e1e1",
    borderRadius: 8,
  },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderColor: "#eee" },
  totalBar: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  totalTextGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexShrink: 1,
    gap: 8,
  },
  totalText: { fontWeight: "bold", fontSize: 20 },
  totalValue: {
    fontSize: 20,
    marginLeft: 4,
    fontWeight: "bold",
    minWidth: 250,
    textAlign: "right",
  },
});
