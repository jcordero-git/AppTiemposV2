import { format, parse } from "date-fns";
import { es } from "date-fns/locale"; // idioma español
export function formatHour(timeStr) {
  try {
    const date = parse(timeStr, "HH:mm:ss", new Date());
    return format(date, "hh:mm a", { locale: es }).toUpperCase(); // 10:58 PM
  } catch (e) {
    return timeStr;
  }
}
