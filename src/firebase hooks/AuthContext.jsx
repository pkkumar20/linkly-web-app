// src/context/AuthContext.js
import React, { createContext } from "react";
import useFirebaseAuth from "./useFirebaseAuth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useFirebaseAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
