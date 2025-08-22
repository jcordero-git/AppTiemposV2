// PrinterUtils.js adaptado a react-native-ble-plx con formatos ESC/POS y código de barras

import {
  BleManager,
  BleErrorCode,
  LogLevel,
  BluetoothState,
} from "react-native-ble-plx";
import { Platform, PermissionsAndroid, Alert, Linking } from "react-native";
import { Buffer } from "buffer";
import { getUpdatedInternetDate, formatDate } from "../datetimeUtils";
import { useSnackbar } from "../../context/SnackbarContext"; // Ajusta el path
import * as Location from "expo-location";
import { Snackbar } from "react-native-paper";

class PrinterUtils {
  constructor() {
    if (Platform.OS === "web") {
      console.warn("getDeviceList no es compatible con web");
      return null;
    }
    this.manager = new BleManager();
    this.device = null;
    this.serviceUUID = null;
    this.characteristicUUID = null;
    this.deviceId = null;
  }

  createNewManager() {
    this.manager = new BleManager();
    this.manager.setLogLevel(LogLevel.Verbose);
  }

  getDevice() {
    return this.device;
  }

  async initializeBLE() {
    return new Promise((resolve) => {
      const subscription = this.manager.onStateChange((state) => {
        console.log("estado bluetooth", state);
        if (state === "PoweredOn") {
          resolve();
          subscription.remove();
        } else if (state === "PoweredOff") {
          this.onBluetoothPowerOff();
          this.manager.enable().catch((error) => {
            if (error.errorCode === BleErrorCode.BluetoothUnauthorized) {
              this.requestBluetoothPermissions();
            }
          });
        } else if (state === BleErrorCode.BluetoothUnauthorized) {
          this.requestBluetoothPermissions();
        } else {
          console.warn("Unsupported state:", state);
        }
      }, true);
    });
  }

  onBluetoothPowerOff() {
    this.showErrorToast("Bluetooth is turned off");
  }

  // async requestPermissions() {
  //   if (Platform.OS !== "android") return true;

  //   const granted = await PermissionsAndroid.requestMultiple([
  //     PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  //     PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  //     PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //   ]);
  //   return Object.values(granted).every((res) => res === "granted");
  // }

  requestBluetoothPermissions = async () => {
    if (Platform.OS !== "android") return true;

    if (Platform.Version >= 31) {
      // Android 12+
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(granted).every(
        (res) => res === PermissionsAndroid.RESULTS.GRANTED,
      );
    } else {
      // Android 11 o menor
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  };

  ensureLocationEnabled = async () => {
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      Alert.alert(
        "Ubicación desactivada",
        "Para detectar impresoras, activa la ubicación en los ajustes del dispositivo.",
        [
          { text: "OK", style: "cancel" },
          // { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  };

  async scanDevices(callback) {
    if (Platform.OS === "web") {
      console.warn("getDeviceList no es compatible con web");
      return [];
    }
    await this.requestBluetoothPermissions();

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Error escaneando:", error);
        return;
      }
      if (device?.name) {
        console.log("Encontrado:", device.name);
        callback(device);
      }
    });

    window.setTimeout(() => this.manager.stopDeviceScan(), 10000);
  }

  async connectToDevice(deviceId) {
    try {
      this.device = await this.manager.connectToDevice(deviceId, {
        autoConnect: false,
      });
      this.deviceId = deviceId;

      await this.device.discoverAllServicesAndCharacteristics();
      const services = await this.manager.servicesForDevice(this.device.id);

      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const c of characteristics) {
          if (c.isWritableWithResponse) {
            this.serviceUUID = service.uuid;
            this.characteristicUUID = c.uuid;
            console.log("Servicio:", this.serviceUUID);
            console.log("Característica:", this.characteristicUUID);
            await new Promise((resolve) => window.setTimeout(resolve, 1000)); // Esperar 1 segundo
            return true;
          }
        }
      }

      // const matchedService = services.find(
      //   (s) => s.uuid.toUpperCase() === "49535343-FE7D-4AE5-8FA9-9FAFD205E455",
      // );
      // if (!matchedService) {
      //   throw new Error("❌ Servicio no encontrado en reconexión");
      // }
      // const characteristics = await this.manager.characteristicsForDevice(
      //   this.device.id,
      //   matchedService.uuid,
      // );
      // const matchedChar = characteristics.find(
      //   (c) => c.uuid.toUpperCase() === "49535343-8841-43F4-A8D4-ECBE34729BB3",
      // );
      // if (!matchedChar) {
      //   throw new Error("❌ Característica no encontrada o no escribible");
      // }

      // this.serviceUUID = matchedService.uuid;
      // this.characteristicUUID = matchedChar.uuid;

      console.log("✅ Servicio y característica confirmados.");
      await new Promise((resolve) => window.setTimeout(resolve, 1000)); // Esperar 1 segundo
      return true;
    } catch (err) {
      console.error("🚫 Error en connectToDevice:", err);
      return false;
    }
  }

  async sendInChunks_old(dataBuffer, chunkSize = 100) {
    try {
      const base64Data = dataBuffer.toString("base64");
      console.log("base64Data", base64Data);
      const totalLength = base64Data.length;
      for (let i = 0; i < totalLength; i += chunkSize) {
        const chunk = base64Data.slice(i, i + chunkSize);
        await this.device.writeCharacteristicWithResponseForService(
          this.serviceUUID,
          this.characteristicUUID,
          chunk,
        );
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      console.log("✅ Impresión completada.");
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      //this.disconnect();
    } catch (error) {
      console.error("❌ Error al imprimir en fragmentos:", error);
      throw new Error("Error al imprimir en fragmentos:");
    }
  }

  async sendInChunks(dataBuffer, defaultChunkSize = 100) {
    try {
      const { Platform } = require("react-native");
      const Device = require("expo-device");
      // Detección de Android 7.1 o inferior
      let isOldAndroid = false;

      if (Platform.OS === "android" && Device.osVersion) {
        const [major, minor] = Device.osVersion.split(".").map(Number);
        if (major < 8 || (major === 7 && minor <= 1)) {
          isOldAndroid = true;
          console.warn(
            "⚠️ Dispositivo con Android 7.1 o menor detectado. Enviando todo el contenido sin fragmentar.",
          );
        }
      }

      const base64Data = dataBuffer.toString("base64");

      if (isOldAndroid) {
        // ENVÍO COMPLETO SIN FRAGMENTAR
        this.device.writeCharacteristicWithoutResponseForService(
          this.serviceUUID,
          this.characteristicUUID,
          base64Data,
        );
        console.log("✅ Impresión completa sin fragmentación.");
      } else {
        // ENVÍO EN FRAGMENTOS
        const chunkSize = defaultChunkSize;
        const delay = 200;
        const totalLength = base64Data.length;

        for (let i = 0; i < totalLength; i += chunkSize) {
          const chunk = base64Data.slice(i, i + chunkSize);

          await this.device.writeCharacteristicWithResponseForService(
            this.serviceUUID,
            this.characteristicUUID,
            chunk,
          );

          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }

        console.log("✅ Impresión completada en fragmentos.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    } catch (error) {
      if (error.message?.includes("timed out")) {
        console.warn(
          "⚠️ BLE timeout después de enviar datos. Probablemente la impresora respondió lento.",
        );
      } else {
        console.error("❌ Error al imprimir:", error);
        throw new Error("Error al imprimir:");
      }
    }
  }

  async printBuffer(dataBuffer) {
    if (!this.device || !this.serviceUUID || !this.characteristicUUID) {
      throw new Error("No hay dispositivo conectado correctamente");
    }

    console.log("entro al print Buffer");
    const base64Data = dataBuffer.toString("base64");
    console.log("base64Data", base64Data);
    try {
      await this.device.writeCharacteristicWithoutResponseForService(
        this.serviceUUID,
        this.characteristicUUID,
        base64Data,
      );
    } catch (err) {
      console.error("Error al imprimir:", err);
    }
  }

  /**
   * Genera el buffer ESC/POS para imprimir un código de barras CODE128
   * @param {string} value - El valor que se imprimirá en el código de barras
   * @returns {Buffer}
   */
  generarCodigoBarrasBuffer(value) {
    const GS = 0x1d;
    const cmds = [];

    cmds.push(GS, 0x40); // ESC @: reset

    cmds.push(GS, 0x68, 80); // Altura del código de barras
    cmds.push(GS, 0x77, 2.1); // Ancho del código de barras
    cmds.push(GS, 0x48, 2); // Mostrar texto debajo

    cmds.push(GS, 0x6b, 0x49); // Imprimir CODE128
    const valueBytes = Buffer.from(`{B${value}`, "ascii");
    cmds.push(...valueBytes);
    cmds.push(0x00); // Terminador NUL obligatorio

    return Buffer.from(cmds);
  }

  async printTicket({
    tiempo,
    sorteoSeleccionado,
    vendedorData,
    ticketProfile,
    re_impresion,
  }) {
    const { id: codigo, clientName, drawDate, numbers = [] } = tiempo;
    const { phoneNumber, printBarCode, sellerName, ticketFooter, ticketTitle } =
      ticketProfile;

    const normalNumbers = numbers.filter((n) => parseFloat(n.monto) > 0);
    const reventados = numbers.filter((n) => parseFloat(n.montoReventado) > 0);

    const normalLines = renderLinesText(normalNumbers);
    const reventadoLines = renderLinesText(reventados, true);

    const formatBarcodeDate = (dateStr) => {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear()).slice(-2); // Solo los últimos 2 dígitos
      return `${day}${month}${year}`;
    };
    const total = numbers.reduce(
      (sum, n) =>
        sum + parseInt(n.monto || 0) + parseInt(n.montoReventado || 0),
      0,
    );

    const vendedorNombre =
      sellerName?.trim() !== "" ? sellerName : vendedorData.name || "";
    const vendedorCodigo = vendedorData.userCode || "";
    const telefono =
      phoneNumber?.trim() !== "" ? phoneNumber : vendedorData.phone || "N/A";
    const prizeTimes =
      sorteoSeleccionado.userValues?.prizeTimes ??
      vendedorData.prizeTimes ??
      "";
    const revPrizeTimes =
      sorteoSeleccionado.userValues?.revPrizeTimes ??
      vendedorData.revPrizeTimes ??
      "";

    //const barcodeValue = `${String(sorteoSeleccionado.id).padStart(3, "0")}-${formatBarcodeDate(drawDate)}-${codigo.toString().padStart(3, "0")}`;
    const barcodeValue = `${codigo.toString().padStart(3, "0")}`;

    // Alineación de texto
    const ALIGN_LEFT = Buffer.from([0x1b, 0x61, 0x00]); // Alinear a la izquierda
    const ALIGN_CENTER = Buffer.from([0x1b, 0x61, 0x01]); // Centrar texto
    const ALIGN_RIGHT = Buffer.from([0x1b, 0x61, 0x02]); // Alinear a la derecha

    // Formato de texto
    const BOLD_ON = Buffer.from([0x1b, 0x45, 0x01]); // Activar negrita
    const BOLD_OFF = Buffer.from([0x1b, 0x45, 0x00]); // Desactivar negrita

    const UNDERLINE_ON = Buffer.from([0x1b, 0x2d, 0x01]); // Subrayado activado
    const UNDERLINE_OFF = Buffer.from([0x1b, 0x2d, 0x00]); // Subrayado desactivado

    // Tamaño del texto
    const TEXT_NORMAL = Buffer.from([0x1b, 0x21, 0x00]); // Tamaño normal
    const TEXT_DOUBLE_HEIGHT = Buffer.from([0x1b, 0x21, 0x10]); // Doble altura
    const TEXT_DOUBLE_WIDTH = Buffer.from([0x1b, 0x21, 0x20]); // Doble ancho
    const TEXT_DOUBLE_SIZE = Buffer.from([0x1b, 0x21, 0x30]); // Doble ancho y alto

    // Inicializar impresora
    const INIT_PRINTER = Buffer.from([0x1b, 0x40]); // Reset/Inicializar impresora

    // Corte de papel
    const CUT_PAPER_FULL = Buffer.from([0x1d, 0x56, 0x00]); // Corte completo
    const CUT_PAPER_PARTIAL = Buffer.from([0x1d, 0x56, 0x01]); // Corte parcial

    // Saltos de línea / feed
    const FEED_LINE = Buffer.from([0x0a]); // Salto de línea simple
    const FEED_N_LINES = (n) => Buffer.from([0x1b, 0x64, n]); // Avanzar n líneas

    // Código de barras (configuración básica)
    const BARCODE_HEIGHT_50 = Buffer.from([0x1d, 0x68, 50]); // Altura código de barras
    const BARCODE_WIDTH_2 = Buffer.from([0x1d, 0x77, 2]); // Ancho código de barras
    const BARCODE_NO_TEXT = Buffer.from([0x1d, 0x48, 0x00]); // No mostrar texto
    const BARCODE_TYPE_CODE128 = Buffer.from([0x1d, 0x6b, 0x49]); // Tipo CODE128

    // Texto inverso (modo negativo)
    const INVERSE_ON = Buffer.from([0x1d, 0x42, 0x01]); // Texto invertido ON
    const INVERSE_OFF = Buffer.from([0x1d, 0x42, 0x00]); // Texto invertido OFF

    // Modo fuente
    const FONT_A = Buffer.from([0x1b, 0x4d, 0x00]); // Fuente A (normal)
    const FONT_B = Buffer.from([0x1b, 0x4d, 0x01]); // Fuente B (más pequeña)

    const DIVIDER = Buffer.from("--------------------------------\n", "ascii");

    const parts = [];
    //parts.push(INIT_PRINTER);
    // parts.push(ALIGN_CENTER);
    // parts.push(BOLD_ON);
    // parts.push(TEXT_DOUBLE_WIDTH);

    // parts.push(
    //   Buffer.from(`CODIGO # ${String(codigo).padStart(2, "0")}\n`, "ascii"),
    // );
    parts.push(Buffer.from([0x1b, 0x40])); // reset
    parts.push(Buffer.from([0x1b, 0x61, 0x01])); // center
    parts.push(Buffer.from([0x1b, 0x21, 0x20])); // Doble ancho
    parts.push(Buffer.from([0x1b, 0x45, 0x01])); // Activar negrita
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(
      Buffer.from(`CODIGO # ${String(codigo).padStart(2, "0")}\n`, "ascii"),
    );
    parts.push(Buffer.from(`${sorteoSeleccionado.name}\n\n`, "ascii"));
    parts.push(Buffer.from([0x1b, 0x61, 0x00])); // Alinear a la izquierda
    parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
    parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal
    parts.push(
      Buffer.from(
        `Vendedor:  ${vendedorNombre} - ${vendedorCodigo}\n`,
        "ascii",
      ),
    );
    parts.push(Buffer.from(`TEL.:      ${telefono}\n`, "ascii"));
    parts.push(
      Buffer.from(`CLIENTE:   ${clientName || "Sin Nombre"}\n`, "ascii"),
    );
    parts.push(
      Buffer.from(
        `SORTEO:    ${formatDate(drawDate, "dd/MM/yyyy")}\n`,
        "ascii",
      ),
    );
    parts.push(
      Buffer.from(
        `IMPRESION: ${formatDate(new Date(), "dd/MM/yyyy hh:mm:a")}\n`,
        "ascii",
      ),
    );
    parts.push(Buffer.from("--------------------------------\n", "ascii"));
    parts.push(Buffer.from([0x1b, 0x21, 0x20])); // Doble ancho
    normalLines.forEach((line) => {
      parts.push(Buffer.from(`${line}\n`, "ascii"));
    });

    if (reventados.length > 0) {
      parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal
      parts.push(Buffer.from([0x1b, 0x61, 0x01])); // center
      parts.push(Buffer.from([0x1b, 0x45, 0x01])); // Activar negrita
      parts.push(Buffer.from(`***********REVENTADOS***********`, "ascii"));
      parts.push(Buffer.from([0x1b, 0x21, 0x20])); // Doble ancho
      parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
      parts.push(Buffer.from([0x1b, 0x61, 0x00])); // Alinear a la izquierda
      parts.push(Buffer.from([0x0a])); // Salto de Linea
      reventadoLines.forEach((line) => {
        parts.push(Buffer.from(`${line}\n`, "ascii"));
      });
    }
    parts.push(Buffer.from([0x1b, 0x61, 0x00])); // Alinear a la izquierda
    parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
    parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal
    parts.push(Buffer.from("--------------------------------\n", "ascii"));
    parts.push(Buffer.from([0x1b, 0x21, 0x20])); // Doble ancho
    parts.push(Buffer.from([0x1b, 0x45, 0x01])); // Activar negrita
    parts.push(
      Buffer.from(alignLeftRight("TOTAL:", total.toString()), "ascii"),
    );
    parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal
    parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
    parts.push(Buffer.from("--------------------------------", "ascii"));
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x1b, 0x21, 0x20])); // Doble ancho
    parts.push(
      Buffer.from(alignLeftRight("PAGAMOS", prizeTimes.toString()), "ascii"),
    );
    if (sorteoSeleccionado.useReventado === true) {
      parts.push(
        Buffer.from(
          alignLeftRight("REVENTADOS", revPrizeTimes.toString()),
          "ascii",
        ),
      );
    }
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x1b, 0x61, 0x01])); // center
    parts.push(Buffer.from([0x1b, 0x45, 0x01])); // Activar negrita
    parts.push(Buffer.from(`${ticketTitle}`, "ascii"));
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x0a])); // Salto de Linea

    if (re_impresion) {
      parts.push(Buffer.from([0x1b, 0x21, 0x30])); // Doble ancho y alto
      parts.push(Buffer.from(`RE-IMPRESION`, "ascii"));
      parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal
      parts.push(Buffer.from([0x0a])); // Salto de Linea
    }

    parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal
    parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
    parts.push(Buffer.from(`${ticketFooter}`, "ascii"));
    parts.push(Buffer.from([0x0a])); // Salto de Linea

    if (printBarCode) {
      //parts.push(generarCodigoBarrasBuffer(barcodeValue));
      let buffer = null;

      try {
        buffer = generarCodigoBarrasBuffer(barcodeValue, "CODE128");
      } catch (e) {
        console.warn("Fallo con CODE128, intentando CODE39", e);
        buffer = generarCodigoBarrasBuffer(barcodeValue, "CODE39");
      }
      parts.push(buffer);
    }
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x1b, 0x61, 0x00])); // Alinear a la izquierda
    parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
    parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal

    const bufferFinal = Buffer.concat(parts);
    await this.safePrint(bufferFinal);
    //await this.sendInChunks("SG9sYQo=");
  }

  async printPremios({
    items,
    total,
    sorteoSeleccionado,
    vendedorData,
    ticketProfile,
    numeroPremiado,
    reventado,
  }) {
    //const { id: codigo, clientName, drawDate, numbers = [] } = items;
    const { phoneNumber, printBarCode, sellerName, ticketFooter, ticketTitle } =
      ticketProfile;

    console.log("ITEMS: ", items);

    // const total = items.reduce(
    //   (sum, n) => sum + parseInt(n.premio || 0) + parseInt(n.revPremio || 0),
    //   0,
    // );

    const vendedorNombre =
      sellerName?.trim() !== "" ? sellerName : vendedorData.name || "";
    const vendedorCodigo = vendedorData.userCode || "";
    const telefono =
      phoneNumber?.trim() !== "" ? phoneNumber : vendedorData.phone || "N/A";
    const prizeTimes =
      sorteoSeleccionado.userValues?.prizeTimes ??
      vendedorData.prizeTimes ??
      "";
    const revPrizeTimes =
      sorteoSeleccionado.userValues?.revPrizeTimes ??
      vendedorData.revPrizeTimes ??
      "";

    const parts = [];
    parts.push(Buffer.from([0x1b, 0x40])); // reset
    parts.push(Buffer.from([0x1b, 0x61, 0x01])); // center
    parts.push(Buffer.from([0x1b, 0x21, 0x20])); // Doble ancho
    parts.push(Buffer.from([0x1b, 0x45, 0x01])); // Activar negrita
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from(`PREMIOS\n`, "ascii"));
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from(`${sorteoSeleccionado.name}`, "ascii"));
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(
      Buffer.from(alignLeftRight("PREMIADO: ", `#${numeroPremiado}`), "ascii"),
    );

    parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal
    parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
    parts.push(Buffer.from([0x1b, 0x61, 0x00])); // Alinear a la izquierda

    parts.push(Buffer.from("--------------------------------\n", "ascii"));
    items.forEach((item) => {
      parts.push(Buffer.from(`Codigo:    #${item.id}\n`, "ascii"));
      parts.push(
        Buffer.from(
          `Fecha:     ${formatDate(item.createdAt, "dd/MM/yyyy hh:mm:a")}\n`,
          "ascii",
        ),
      );
      parts.push(
        Buffer.from(`Cliente:   ${item.clientName || "Sin Nombre"}\n`, "ascii"),
      );
      parts.push(
        Buffer.from(
          alignLeftRight(
            `Premio:    ${item.monto} x ${item.prizeTimes} =`,
            `${item.premio}\n`,
            33,
          ),
          "ascii",
        ),
      );
      if (item.montoReventado > 0) {
        parts.push(
          Buffer.from(
            alignLeftRight(
              `Reventado: ${item.montoReventado} x ${item.revPrizeTimes} =`,
              `${item.revPremio}\n`,
              33,
            ),
            "ascii",
          ),
        );
      }
      parts.push(Buffer.from([0x1b, 0x45, 0x01])); // Activar negrita
      parts.push(
        Buffer.from(
          alignLeftRight(`TOTAL:`, `${item.premio + item.revPremio}\n`, 33),
          "ascii",
        ),
      );
      parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
      parts.push(Buffer.from("--------------------------------\n", "ascii"));
    });

    parts.push(Buffer.from([0x1b, 0x61, 0x00])); // Alinear a la izquierda
    parts.push(Buffer.from([0x1b, 0x21, 0x20])); // Doble ancho
    parts.push(Buffer.from([0x1b, 0x45, 0x01])); // Activar negrita
    parts.push(
      Buffer.from(alignLeftRight("TOTAL:", total.toString()), "ascii"),
    );
    parts.push(Buffer.from([0x1b, 0x21, 0x00])); // Tamaño normal
    parts.push(Buffer.from([0x1b, 0x45, 0x00])); // Desactivar negrita
    parts.push(Buffer.from("--------------------------------\n", "ascii"));
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x0a])); // Salto de Linea
    parts.push(Buffer.from([0x0a])); // Salto de Linea

    const bufferFinal = Buffer.concat(parts);
    await this.safePrint(bufferFinal);
    //await this.sendInChunks("SG9sYQo=");
  }

  async disconnect() {
    if (this.device) {
      try {
        await this.manager.cancelDeviceConnection(this.device.id);
        await this.device.cancelConnection();
        this.device = null;
        this.deviceId = null;
      } catch (err) {
        console.log("device disconected - disconect");
      }
    }
  }

  async isConnected(deviceId) {
    try {
      const device = await this.manager.devices([deviceId]);
      if (device.length > 0) {
        return await device[0].isConnected();
      }
    } catch (e) {
      console.warn("Error al verificar conexión:", e);
    }
    return false;
  }

  async safePrint(dataBuffer) {
    try {
      if (!this.device || !(await this.device.isConnected())) {
        console.log("❗ Dispositivo no conectado, reconectando...");
        if (this.deviceId) {
          await this.connectToDevice(this.deviceId);
        } else {
          throw new Error("No se conoce el deviceId para reconectar.");
        }
      }

      await this.sendInChunks(dataBuffer);

      //this.disconnect();
    } catch (err) {
      console.error("❌ Error al imprimir:", err);
      throw new Error("Error al imprimir");
    }
  }
}

function generarCodigoBarrasBuffer(barcodeValue, preferido = "CODE128") {
  const comandos = [];

  // Centrar texto
  comandos.push(Buffer.from([0x1b, 0x61, 0x01]));

  // Altura y ancho
  comandos.push(Buffer.from([0x1d, 0x68, 50])); // altura
  comandos.push(Buffer.from([0x1d, 0x77, 4])); // ancho

  // No mostrar texto debajo
  comandos.push(Buffer.from([0x1d, 0x48, 0x00]));

  const valueAscii = Buffer.from(barcodeValue, "ascii");

  if (preferido === "CODE128") {
    // CODE128 (0x49)
    // [GS k m n d1..dn]
    // m=73 (0x49), n=longitud, dn=data
    comandos.push(Buffer.from([0x1d, 0x6b, 0x49, barcodeValue.length]));
    comandos.push(barcodeValue);
  } else if (preferido === "CODE39") {
    // CODE39 requiere terminación NULL (\0)
    // [GS k m d1..dn NUL]
    comandos.push(Buffer.from([0x1d, 0x6b, 0x04])); // m=4 => CODE39
    comandos.push(Buffer.from(barcodeValue + "\0", "ascii"));
  }

  // Salto de línea y reset de alineación
  comandos.push(Buffer.from("\n", "ascii"));
  comandos.push(Buffer.from([0x1b, 0x61, 0x00]));

  return Buffer.concat(comandos);
}

function alignLeftRight(left, right, width = 16) {
  const spaceCount = width - left.length - right.length;
  const spaces = " ".repeat(spaceCount > 0 ? spaceCount : 1);
  return `${left}${spaces}${right}`;
}

function renderLinesText(list, useReventado = false) {
  const grouped = {};

  list.forEach((n) => {
    const monto = useReventado ? parseInt(n.montoReventado) : parseInt(n.monto);
    if (!grouped[monto]) grouped[monto] = [];
    grouped[monto].push(n.numero);
  });

  const lines = [];
  const montoColumnWidth = 6; // Espacio reservado para el monto

  Object.entries(grouped)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0])) // mayor a menor por monto
    .forEach(([monto, numeros]) => {
      for (let i = 0; i < numeros.length; i += 3) {
        const grupo = numeros.slice(i, i + 3);
        const numerosLinea = grupo.map((num) => num.padStart(2, "0")).join(",");
        const montoStr = String(monto);
        const espacios = " ".repeat(montoColumnWidth - montoStr.length);
        const linea = `${montoStr}${espacios}* ${numerosLinea}`;
        lines.push(linea);
      }
    });

  return lines;
}

export default new PrinterUtils();
