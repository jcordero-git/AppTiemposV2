import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import "react-day-picker/src/style.css";

export default function DatePickerWeb({ value, onChange, defaultMonth }) {
  const [show, setShow] = useState(false);
  const refInput = useRef(null);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });

  // Detectar click fuera para cerrar calendario
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        refInput.current &&
        !refInput.current.contains(event.target) &&
        !document.getElementById("calendar-portal")?.contains(event.target)
      ) {
        setShow(false);
      }
    }
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show]);

  // Cuando mostramos el calendario, calculamos posición para ponerlo justo debajo del input
  useEffect(() => {
    if (show && refInput.current) {
      const rect = refInput.current.getBoundingClientRect();
      setCalendarPos({
        top: rect.bottom + window.scrollY + 8, // 8px de separación
        left: rect.left + window.scrollX,
      });
    }
  }, [show]);

  // Componente calendario renderizado en portal
  const calendarPortal = show
    ? createPortal(
        <>
          {/* Overlay bloquea interacciones detrás */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 9998,
            }}
          />
          <div
            id="calendar-portal"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 9999,
              padding: 12,
            }}
          >
            <DayPicker
              mode="single"
              navLayout="around"
              showOutsideDays
              selected={value}
              defaultMonth={defaultMonth || value}
              onSelect={(date) => {
                if (date) {
                  onChange(date);
                  setShow(false);
                }
              }}
              styles={{
                month: {
                  display: "table",
                  width: "100%",
                  borderCollapse: "collapse",
                  borderSpacing: 0,
                  padding: "0.5rem",
                },
                table: {
                  width: "100%",
                  borderCollapse: "collapse",
                },
                head_row: {
                  fontWeight: "bold",
                  fontSize: 14,
                  color: "#666",
                },
                nav: {
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 1rem",
                },
                nav_button: {
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#333",
                },
                caption: {
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 16,
                  paddingBottom: "0.5rem",
                },
                day: {
                  margin: 2,
                  padding: "8px 0",
                  width: 36,
                  textAlign: "center",
                  borderRadius: "50%",
                  cursor: "pointer",
                },
                day_selected: {
                  backgroundColor: "#005bbb",
                  color: "white",
                  boxShadow: "0 0 8px 2px rgba(32, 153, 2, 0.7)",
                  fontWeight: "bold",
                },
                day_today: {
                  fontWeight: "bold",
                  color: "#1976d2",
                },
                day_outside: {
                  color: "#ccc",
                },
              }}
            />
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <div
        ref={refInput}
        onClick={() => setShow(!show)}
        style={{
          padding: "8px 12px",
          fontSize: 16,
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          backgroundColor: "#fff",
          color: "#333",
          minWidth: 150,
          maxWidth: 150,
          display: "flex",
          alignItems: "center",
          gap: 8,
          userSelect: "none",
        }}
      >
        <span style={{ flex: 1 }}>
          {value ? format(value, "EE dd/MM/yyyy", { locale: es }) : "Fecha"}
        </span>
        <span style={{ fontSize: 18 }}>
          <MaterialIcons name="calendar-month" size={24} color="black" />
        </span>
      </div>
      {calendarPortal}
    </>
  );
}
