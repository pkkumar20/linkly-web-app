import React, { createContext } from 'react';
import {  auth } from "./firebase/firebse.config" // Your hook file

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const Auth = auth();

    return (
        <AuthContext.Provider value={Auth}>
            {children}
        </AuthContext.Provider>
    );
}
