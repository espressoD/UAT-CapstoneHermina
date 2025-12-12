// src/components/uiAdmin/InfoSection.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, Users, Baby, Activity } from 'lucide-react';
import StatCard from './StatCard';
import PetugasJagaCard from './PetugasJagaCard';

export default function InfoSection({ 
  statCounts, 
  petugasJagaKey, 
  perawatData, 
  dokterGpData 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header dengan tombol collapse - seluruh header clickable */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-4 py-3 flex items-center justify-between border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          Informasi Dashboard
        </h3>
        <div className="text-gray-600">
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* StatCards */}
            <div className="grid grid-cols-1 gap-6 h-full">
              <div className="w-full">
                <StatCard 
                  title="Pasien Umum" 
                  count={statCounts["Umum"]} 
                  icon={<Users size={24} />} 
                  color="bg-orange-500"
                  hideToggle={true}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StatCard 
                  title="Pasien Anak" 
                  count={statCounts["Anak"]} 
                  icon={<Baby size={24} />} 
                  color="bg-cyan-500"
                  hideToggle={true}
                />
                <StatCard 
                  title="Pasien Kebidanan" 
                  count={statCounts["Kebidanan"]} 
                  icon={<Activity size={24} />} 
                  color="bg-green-500"
                  hideToggle={true}
                />
              </div>
            </div>

            {/* Petugas Jaga */}
            <PetugasJagaCard
              key={petugasJagaKey}
              perawatData={perawatData}
              dokterGpData={dokterGpData}
              hideToggle={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
