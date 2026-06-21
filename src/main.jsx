import { StrictMode } from 'react'
import "flyonui/variants.css";
import 'flyonui/flyonui.js';
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from "react-router";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './firebase hooks/AuthContext.jsx';
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Toaster 
      toastOptions={{ className: 'select-none' }} 
      containerStyle={{ zIndex: 999999 }} 
    />
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
  ,
)
