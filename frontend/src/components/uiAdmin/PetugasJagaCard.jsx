// src/components/uiAdmin/PetugasJagaCard.jsx
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getSettings } from '../../config/api';

// Komponen bar (padding p-2.5)
const PetugasList = ({ title, list, bgColor, textColor, borderColor }) => {
  // Untuk perawat, jika lebih dari 7, tampilkan 2 kolom
  const isPerawat = title.toLowerCase().includes('perawat');
  const useGrid = isPerawat && list && list.length > 7;
  let left = [], right = [];
  if (useGrid) {
    left = list.slice(0, Math.ceil(list.length / 2));
    right = list.slice(Math.ceil(list.length / 2));
  }
  return (
    <div className={`p-2.5 rounded-lg shadow-sm ${bgColor} ${borderColor} border`}>
      <h4 className={`font-semibold ${textColor} text-sm`}>{title}</h4>
      {useGrid ? (
        <div className="grid grid-cols-2 gap-3">
          <ul className={`list-disc list-inside ${textColor} opacity-90 text-sm mt-1 space-y-0.5`}>
            {left.map((petugas, index) => <li key={index}>{petugas}</li>)}
          </ul>
          <ul className={`list-disc list-inside ${textColor} opacity-90 text-sm mt-1 space-y-0.5`}>
            {right.map((petugas, index) => <li key={index}>{petugas}</li>)}
          </ul>
        </div>
      ) : (
        <ul className={`list-disc list-inside ${textColor} opacity-90 text-sm mt-1 space-y-0.5`}>
          {list && list.length > 0 ? (
            list.map((petugas, index) => <li key={index}>{petugas}</li>)
          ) : (
            <li style={{ listStyle: 'none' }}>- Belum di-set -</li>
          )}
        </ul>
      )}
    </div>
  );
};

// Terima 'className' sebagai prop (masih penting untuk h-full)
export default function PetugasJagaCard({ 
  className = '',
  hideToggle = false
}) {
  const [penanggungJawab, setPenanggungJawab] = useState([]);
  const [perawat, setPerawat] = useState([]);
  const [dokterIgd, setDokterIgd] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Load data dari database via API
    const fetchPetugasJaga = async () => {
      try {
        const data = await getSettings();
          
          if (data.petugas_jaga) {
            // Format Penanggung Jawab - maksimal 2
            const pjList = (data.petugas_jaga.penanggungJawab || []).slice(0, 2).map(pj => pj.nama);
            setPenanggungJawab(pjList);
            
            // Format Perawat - maksimal 14
            const perawatList = (data.petugas_jaga.perawatJaga || []).slice(0, 14).map(p => p.nama);
            setPerawat(perawatList);
            
            // Format Dokter IGD - maksimal 3
            const dokterList = (data.petugas_jaga.dokterIgdJaga || []).slice(0, 3).map(d => d.nama);
            setDokterIgd(dokterList);
          }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error loading Petugas Jaga settings:', error);
        }
      }
    };

    fetchPetugasJaga();
  }, []);
  
  return (
    <div className={`bg-white p-3 rounded-lg shadow-sm flex flex-col ${className}`}>
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Petugas Jaga
        </h3>
        {!hideToggle && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label={isCollapsed ? "Buka" : "Tutup"}
          >
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        )}
      </div>
      
      {(hideToggle || !isCollapsed) && (
        <div className="space-y-3">
        <PetugasList 
          title="Penanggung Jawab" 
          list={penanggungJawab}
          bgColor="bg-blue-100" 
          textColor="text-blue-800"
          borderColor="border-blue-200"
        />
        <PetugasList 
          title="Perawat" 
          list={perawat}
          bgColor="bg-pink-100" 
          textColor="text-pink-800"
          borderColor="border-pink-200"
        />
        <PetugasList 
          title="Dokter IGD" 
          list={dokterIgd}
          bgColor="bg-orange-100" 
          textColor="text-orange-800"
          borderColor="border-orange-200"
        />
        </div>
      )}
    </div>
  );
}
