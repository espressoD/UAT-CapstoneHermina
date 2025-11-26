import { Routes, Route } from "react-router-dom";
import PasienLayout from "../components/layout/PasienLayout";
import HomePage from "../pages/pagesPasien/HomePage";
import CekAntrian from "../pages/pagesPasien/CekAntrian";
import StatusPasien from "../pages/pagesPasien/StatusPasien";
import KondisiSalah from "../pages/pagesPasien/KondisiSalah"; 

export default function PasienRoutes() {
  return (
    <Routes>
      <Route element={<PasienLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cek-antrian" element={<CekAntrian />} />
        <Route path="/status/:idAntrian" element={<StatusPasien />} />
        <Route path="/salah" element={<KondisiSalah />} />
      </Route>
    </Routes>
  );
}
