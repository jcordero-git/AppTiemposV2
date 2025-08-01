import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  Switch,
  useWindowDimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { Menu, Provider } from "react-native-paper";
//import { Ionicons } from "@expo/vector-icons";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSnackbar } from "../context/SnackbarContext"; // Ajusta el path

import { useAuth } from "../context/AuthContext";
import PrinterSizeSelectorModal from "../components/PrinterSizeSelectorModal";
import PrinterSelectorModal from "../components/PrinterSelectorModal";
import { useTiempo } from "../models/mTiempoContext";
import { generateHTML } from "../utils/share/generateHTML"; // Ajusta según tu estructura
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import useCheckAppVersion from "../utils/versionChecker";
import { ht } from "date-fns/locale";
import mSorteo from "../models/mSorteoSingleton.js";
import mFechaSeleccionada from "../models/mFechaSeleccionadaSingleton";

export default function ConfiguracionScreen({ navigation, route }) {
  const { showSnackbar } = useSnackbar();
  const [menuVisibleHeader, setMenuVisibleHeader] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [categoriaDialogVisible, setCategoriaDialogVisible] = useState(false); // Diálogo selector de categoría
  const [dialogTicketsVisible, setDialogTicketsVisible] = useState(false);
  const [dialogRestringidoVisible, setDialogRestringidoVisible] =
    useState(false);
  const [ultimoTicket, setUltimoTicket] = useState(null);
  const [modalPrinterVisible, setModalPrinterVisible] = useState(false);

  const [html, setHtml] = React.useState(null);
  const [iframeHeight, setIframeHeight] = useState(100);
  const [webviewHeight, setWebviewHeight] = useState(100); // altura inicial mínima

  const iframeRef = useRef(null);

  const { checking, checkVersion } = useCheckAppVersion(false);

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
  const apkVersion =
    Constants.manifest?.version || Constants.expoConfig?.version;

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
      setDialogRestringidoVisible(true); // mostrar el Dialog
      // Guardamos el resolver para llamarlo después

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
  const {
    userData,
    ticketProfile,
    setTicketProfile,
    saveTicketProfile,
    logout,
  } = useAuth();

  const settingBackendURL = userData.settings.find(
    (s) => s.backend_url !== undefined,
  );
  const backend_url = settingBackendURL ? settingBackendURL.backend_url : "";

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
          {Platform.OS === "android" && (
            <MaterialIcons
              name="system-update"
              size={24}
              color="#fff" // Blanco para contraste con fondo verde
              style={{ marginRight: 20 }}
              onPress={checkVersion}
            />
          )}
          {/* <MaterialIcons
            name="download"
            size={24}
            color="#fff" // Blanco para contraste con fondo verde
            style={{ marginRight: 15 }}
          /> */}
          {/* Menú anclado al botón visible */}
          <Menu
            visible={menuVisibleHeader}
            onDismiss={closeMenuHeader}
            anchor={MenuAnchor}
            contentStyle={{ backgroundColor: "white", marginRight: 15 }} // Fondo blanco
          >
            {/* <Menu.Item
              onPress={() => {
                closeMenuHeader();
              }}
              title="Exportar Datos"
              titleStyle={{ color: "#000" }} // Texto negro opcional
            /> */}
            {/* <Menu.Item
              onPress={() => {
                closeMenuHeader();
              }}
              title="Borrar Datos"
              titleStyle={{ color: "#000" }} // Texto negro opcional
            /> */}
            {/* <Menu.Item
              onPress={() => {
                closeMenuHeader();
              }}
              title="Acerca..."
              titleStyle={{ color: "#000" }} // Texto negro opcional
            /> */}
            {/* <Menu.Item
              onPress={() => {
                handleCambiarContrasena();
              }}
              title="Cambiar contraseña"
              titleStyle={{ color: "#000" }} // Texto negro opcional
            /> */}
            <Menu.Item
              onPress={() => {
                closeMenuHeader();
                mSorteo.id = 0;
                mFechaSeleccionada.resetFecha();
                logout();
              }}
              title="Cerrar Sesión"
              titleStyle={{ color: "red" }} // Texto negro opcional
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
  const isLandscape = width > height;
  const handleCambiarContrasena = async () => {
    closeMenuHeader();
    const tokenCambiarContrasena = await fetchTokenCambiarContrasena();
    navigation.navigate("ResetPassword", {
      token: tokenCambiarContrasena,
    });
  };

  const fetchTokenCambiarContrasena = async () => {
    setLoading(true);
    const getTokenBody = { generatedBy: 0 };
    if (userData) {
      let result;
      try {
        const url = `https://auth.tiempos.website/token/${userData.email}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(getTokenBody),
        });

        if (!response.ok) {
          showSnackbar("Error al generar token.", 3);
          throw new Error(`Error al generar toen: ${response.status}`);
        }
        result = await response.json();
        showSnackbar("Token generado correctamente.", 1);
        setLoading(false);
        return result;
      } catch (error) {
        console.error("Error al generar token.", error);
        showSnackbar("Error al generar token.", 3);
        setLoading(false);
        return null;
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    if (ticketProfile) {
      let result;
      try {
        const url = `${backend_url}/api/ticketProfile/${ticketProfile?.userId}`;
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
        showSnackbar("La configuración fue guardada correctamente.", 1);
        await saveTicketProfile(ticketProfile);
        setLoading(false);
      } catch (error) {
        console.error("Error al guardar la configuración.", error);
        showSnackbar("Error al guardar la configuración.", 3);
        setLoading(false);
      }
    }
  };

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

  useEffect(() => {
    const tiempoLimpio = {
      id: 0,
      numbers: [
        { monto: "200000", numero: "34" },
        { monto: "50800", numero: "38" },
        { monto: "8400", numero: "32" },
        { monto: 1100, numero: "74", reventado: true, montoReventado: 600 },
        { monto: "200", numero: "99" },
        { monto: "200", numero: "55" },
        { monto: "200", numero: "44" },
      ],
      clientName: "Nombre Cliente",
      drawDate: new Date(),
    };
    const mSorteo = {
      id: 0,
      name: "TICA 7:00 PM",
    };

    let result = tiempoLimpio;
    const compartir = async () => {
      const htmlGenerado = await generateHTML(
        result,
        mSorteo,
        userData,
        ticketProfile,
      );
      setHtml(htmlGenerado);
    };
    compartir();
  }, [ticketProfile]);

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

            <ScrollView style={{ flex: 1 }}>
              <View
                style={[styles.formAndListContainer, isWeb && styles.webLayout]}
              >
                {/* Formulario */}
                <View
                  style={[
                    styles.formContainer,
                    isWeb && styles.webFormContainer,
                  ]}
                >
                  <TextInput
                    placeholder="Nombre Tiempos"
                    style={styles.input}
                    value={ticketProfile?.ticketTitle}
                    onChangeText={(text) =>
                      setTicketProfile((prev) => ({
                        ...prev,
                        ticketTitle: text,
                      }))
                    }
                  />
                  <TextInput
                    placeholder="Nombre Vendedor"
                    style={styles.input}
                    value={ticketProfile?.sellerName}
                    onChangeText={(text) =>
                      setTicketProfile((prev) => ({
                        ...prev,
                        sellerName: text,
                      }))
                    }
                  />

                  <TextInput
                    placeholder="Teléfono"
                    style={styles.input}
                    value={ticketProfile?.phoneNumber}
                    onChangeText={(text) =>
                      setTicketProfile((prev) => ({
                        ...prev,
                        phoneNumber: text,
                      }))
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
                        maxHeight: 350, // altura máxima que puede crecer
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

                  <Pressable
                    style={styles.inputSmall}
                    onPress={() => setModalPrinterVisible(true)}
                    editable={false}
                  >
                    <Text style={{ color: sorteoNombre ? "#000" : "#aaa" }}>
                      {ticketProfile?.lastPrinterMacAddress
                        ? ticketProfile.lastPrinterMacAddress
                        : "Seleccione una impresora"}
                    </Text>
                  </Pressable>
                  <PrinterSelectorModal
                    visible={modalPrinterVisible}
                    onClose={() => setModalPrinterVisible(false)}
                    onSelect={(printer) => {
                      setTicketProfile((prev) => ({
                        ...prev,
                        lastPrinterMacAddress: printer.id,
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

                {/* Lista */}
                {html && isLandscape && (
                  <View
                    style={[styles.listContainer, !isWeb && { marginTop: 0 }]}
                  >
                    <View
                      style={{
                        maxHeight: height * 0.8, // Límite del 80% altura real
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ScrollView
                        style={{
                          width: "100%",
                          backgroundColor: "white",
                          //borderWidth: 1,
                          //borderColor: "#ccc",
                        }}
                        contentContainerStyle={{
                          alignItems: "center",
                          paddingVertical: 8,
                        }}
                      >
                        <View
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
                                  height: webviewHeight || 300,
                                  backgroundColor: "white",
                                  //marginLeft: 8,
                                }}
                              />
                            </>
                          )}
                        </View>
                      </ScrollView>
                    </View>

                    {/* {isWeb && Platform.OS === "web" ? (
                      <View
                        collapsable={false}
                        style={{
                          width: "100%",
                          backgroundColor: "white",
                          // borderWidth: 1,
                          // borderColor: "#ccc",
                          overflow: "hidden",
                          alignItems: "center",
                          justifyContent: "center", // Centra verticalmente si tiene altura fija
                          display: "flex",
                          ...(isWeb && Platform.OS === "web"
                            ? {
                                height: (iframeHeight || 300) + 20,
                                overflow: "auto",
                              }
                            : {
                                //height: webviewHeight || 300 + 20,
                                height: "110%",
                                overflow: "scroll",
                              }),
                        }}
                      >
                        <iframe
                          ref={iframeRef}
                          srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=62mm, initial-scale=1.0">
                          <style>
                            body { margin-left: 0px; padding: 0px; box-sizing: border-box; }
                            .wrapper {
                              margin-left: 10px;
                              width: 58mm;
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
                            width: 245,
                            height: iframeHeight,
                            borderWidth: 1,
                            justifyContent: "center", // Centra verticalmente si tiene altura fija
                            display: "block",
                            margin: "0 auto", // centrar en web puro (extra seguridad)
                          }}
                          sandbox="allow-scripts allow-same-origin allow-modals"
                        />
                      </View>
                    ) : (
                      <>
                        <View
                          style={{
                            alignItems: "center",
                            maxHeight: isWeb ? "75vh" : "80%", // limita el diálogo si es muy alto
                            overflow: "auto",
                            //maxHeight: 800,
                          }}
                        >
                          <View
                            //ref={ticketRef}
                            collapsable={false}
                            style={{
                              width: 230,
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
                                    height: "85%",
                                    overflow: "scroll",
                                  }),
                            }}
                          >
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
                                         }, 100);
                                         true;
                                       `}
                              style={{
                                width: "240px",
                                height: webviewHeight || 300,
                                backgroundColor: "white",
                                //marginLeft: 8,
                              }}
                            />
                          </View>
                        </View>
                      </>
                    )} */}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* app version */}
            <View style={styles.totalBar}>
              <Text style={styles.totalText}>APP VERSION: </Text>
              <Text style={styles.totalValue}>{apkVersion}</Text>
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
    marginTop: 10,
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
