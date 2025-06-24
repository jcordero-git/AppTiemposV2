// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

//const AuthContext = createContext();
export const AuthContext = createContext(); // ✅ ahora sí lo exportás

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [ticketProfile, setTicketProfile] = useState(null); // 🆕
  const [loading, setLoading] = useState(true); // mientras cargás desde AsyncStorage

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        const storedTicketProfile = await AsyncStorage.getItem("ticketProfile"); // 🆕

        if (storedUser) setUserData(JSON.parse(storedUser));
        if (storedTicketProfile)
          setTicketProfile(JSON.parse(storedTicketProfile)); // 🆕
      } catch (err) {
        console.error("Error cargando usuario:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (data, username, password) => {
    const fullData = {
      ...data,
      username,
      password,
    };
    setUserData(fullData);
    await AsyncStorage.setItem("userData", JSON.stringify(fullData));
  };

  const saveTicketProfile = async (profile) => {
    setTicketProfile(profile);
    await AsyncStorage.setItem("ticketProfile", JSON.stringify(profile));
  };

  const logout = async () => {
    setUserData(null);
    setTicketProfile(null);
    await AsyncStorage.multiRemove(["userData", "ticketProfile"]);
  };

  return (
    <AuthContext.Provider
      value={{
        userData,
        ticketProfile,
        login,
        saveTicketProfile,
        setTicketProfile,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
