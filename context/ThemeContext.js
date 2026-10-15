// context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ASYNC_KEY = "appTheme";

export const THEMES = {
  menta: {
    key: "menta",
    name: "Menta",
    primary: "#1B8755",   // header / selectores: verde
    secondary: "#E6F4EA", // background: verde menta suave
    isDarkSecondary: false,
  },
  azulclaro: {
    key: "azulclaro",
    name: "Azul Claro",
    primary: "#2563EB",   // header / selectores: azul
    secondary: "#E7F0FD", // background: azul pastel suave
    isDarkSecondary: false,
  },
  naranja: {
    key: "naranja",
    name: "Naranja",
    primary: "#D96B27",   // header / selectores: naranja cálido
    secondary: "#FDF1E6", // background: melocotón pastel
    isDarkSecondary: false,
  },
  rosa: {
    key: "rosa",
    name: "Rosa",
    primary: "#D9256E",   // header / selectores: rosa vivo
    secondary: "#FCEBF3", // background: rosa pastel suave
    isDarkSecondary: false,
  },
  negro: {
    key: "negro",
    name: "Negro",
    primary: "#121212",   // header / selectores: negro
    secondary: "#2A2A2E", // background: gris oscuro
    isDarkSecondary: true,
  },
  azul: {
    key: "azul",
    name: "Azul",
    primary: "#1D4ED8",   // header / selectores: azul vibrante
    secondary: "#0F172A", // background: azul marino oscuro
    isDarkSecondary: true,
  },
  teal: {
    key: "teal",
    name: "Teal",
    primary: "#0D9488",   // header / selectores: teal
    secondary: "#0A2B24", // background: verde azulado oscuro
    isDarkSecondary: true,
  },
  morado: {
    key: "morado",
    name: "Morado",
    primary: "#7C3AED",   // header / selectores: violeta vibrante
    secondary: "#1E1238", // background: morado oscuro
    isDarkSecondary: true,
  },
  vino: {
    key: "vino",
    name: "Vino",
    primary: "#DB2777",   // header / selectores: vino / frambuesa
    secondary: "#280C1E", // background: vino oscuro
    isDarkSecondary: true,
  },
};

const THEME_ALIASES = {
  oscuro: "negro",
  verdeazul: "teal",
};

const DEFAULT_THEME = THEMES.menta;

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(DEFAULT_THEME);

  // Cargar tema guardado al iniciar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedKey = await AsyncStorage.getItem(ASYNC_KEY);
        const resolvedKey = THEME_ALIASES[savedKey] || savedKey;
        if (resolvedKey && THEMES[resolvedKey]) {
          setThemeState(THEMES[resolvedKey]);
        }
      } catch (err) {
        console.error("Error cargando tema:", err);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (themeKey) => {
    if (!THEMES[themeKey]) return;
    setThemeState(THEMES[themeKey]);
    try {
      await AsyncStorage.setItem(ASYNC_KEY, themeKey);
    } catch (err) {
      console.error("Error guardando tema:", err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
