import React, { useState, useEffect } from "react";
import PasienTable from "../../components/uiAdmin/PasienTable";
import { useAuth } from "../../context/AuthContext";

const PasienAktif = () => {
  const [kunjunganData, setKunjunganData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const fetchPasienAktif = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/v2/kunjungan`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Filter hanya pasien dengan status aktif
          const pasienAktif = data.filter(
            (k) => k.status_kunjungan && k.status_kunjungan.toLowerCase() === "aktif"
          );
          setKunjunganData(pasienAktif);
        }
      } catch (error) {
        console.error('Error fetching pasien aktif:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPasienAktif();
  }, [session]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PasienTable data={kunjunganData} />
    </div>
  );
};

export default PasienAktif;
