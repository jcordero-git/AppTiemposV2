// utils/getHtml2Canvas.js

import { Platform } from "react-native";

// Opción segura: no usa import dinámico directo
export default function getHtml2Canvas() {
  if (Platform.OS !== "web") return null;

  try {
    const html2canvas = require("html2canvas");
    return html2canvas;
  } catch (e) {
    console.error("html2canvas no está disponible:", e);
    return null;
  }
}

