// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

//const AuthContext = createContext();
export const AuthContext = createContext(); // ✅ ahora sí lo exportás

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // mientras cargás desde AsyncStorage

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Error cargando usuario:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (data) => {
    setUserData(data);
    await AsyncStorage.setItem("userData", JSON.stringify(data));
  };

  const logout = async () => {
    setUserData(null);
    await AsyncStorage.removeItem("userData");
  };

  return (
    <AuthContext.Provider value={{ userData, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);