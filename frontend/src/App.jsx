// src/App.jsx
import PasienRoutes from "./routes/PasienRoutes"; 
import AdminRoutes from "./routes/AdminRoutes";

export default function App() {
  return (
    <>
      <PasienRoutes />
      <AdminRoutes />
    </>
  );
}
