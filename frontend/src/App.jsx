// src/App.jsx
import { Routes, Route } from "react-router-dom";
import PasienRoutes from "./routes/PasienRoutes"; 
import AdminRoutes from "./routes/AdminRoutes";
import TampilanMonitorIGDKamala from "./pages/pagesAdmin/TampilanMonitorIGDKamala";
import TampilanMonitorIGDPadma from "./pages/pagesAdmin/TampilanMonitorIGDPadma";

export default function App() {
  return (
    <>
      {/* Public Routes - No Authentication Required */}
      <Routes>
        <Route path="/monitor/kamala" element={<TampilanMonitorIGDKamala />} />
        <Route path="/monitor/padma" element={<TampilanMonitorIGDPadma />} />
      </Routes>
      
      {/* Protected Routes */}
      <PasienRoutes />
      <AdminRoutes />
    </>
  );
}
