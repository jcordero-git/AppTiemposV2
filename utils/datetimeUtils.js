import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

let internetDate = null;
export async function syncInternetTime(timezone = "America/Costa_Rica") {
  try {
    const response = await fetch(
      `https://timeapi.io/api/Time/current/zone?timeZone=${timezone}`,
    );
    const data = await response.json();
    internetDate = new Date(data.dateTime);
    console.log("Hora sincronizada desde Internet:", internetDate.toString());
    return data;
  } catch (error) {
    console.error("Error al obtener hora de Internet:", error);
    internetDate = new Date(); // fallback
    return null;
  }
}

export function getInternetDate() {
  return internetDate ?? new Date();
}

export function formatHour(fecha) {
  if (!fecha) return "";
  return format(fecha, "hh:mm a", { locale: es }).toUpperCase();

  // try {
  //   const date = parse(timeStr, "HH:mm:ss", new Date());
  //   return format(date, "hh:mm a", { locale: es }).toUpperCase();
  // } catch (e) {
  //   return timeStr;
  // }
}
export function formatHourStr(timeStr) {
  try {
    const date = parse(timeStr, "HH:mm:ss", new Date());
    return format(date, "hh:mm a", { locale: es }).toUpperCase();
  } catch (e) {
    return timeStr;
  }
}

export function formatDate(fecha, formatStr) {
  if (!fecha) return "";
  return format(new Date(fecha), formatStr, { locale: es });
}

// Devuelve la fecha actual formateada (ej: "12 de junio de 2025, 10:21")
export function getFormattedInternetDate() {
  const date = getInternetDate();
  return format(date, "PPPpp", { locale: es }); // "12 de junio de 2025 a las 10:21"
}

export function timeStrToMilliseconds(timeStr) {
  try {
    const date = parse(timeStr, "HH:mm:ss", new Date());
    return (
      date.getHours() * 3600000 +
      date.getMinutes() * 60000 +
      date.getSeconds() * 1000
    );
  } catch (e) {
    return 0; // fallback
  }
}
