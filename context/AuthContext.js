// src/context/AuthContext.js
import React, { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  const login = (data) => {
    setUserData(data);
  };

  const logout = () => {
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto más fácilmente
export const useAuth = () => useContext(AuthContext);
