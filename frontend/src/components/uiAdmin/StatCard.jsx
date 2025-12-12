// src/components/uiAdmin/StatCard.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function StatCard({ title, count, icon, color, hideToggle = false }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className={`${color} text-white p-4 rounded-lg shadow-md h-full`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {icon}
          <p className="text-sm font-medium">{title}</p>
        </div>
        {!hideToggle && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
            aria-label={isCollapsed ? "Buka" : "Tutup"}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        )}
      </div>
      {(hideToggle || !isCollapsed) && (
        <div className="text-4xl font-bold mt-2">
          {count}
        </div>
      )}
    </div>
  );
}
