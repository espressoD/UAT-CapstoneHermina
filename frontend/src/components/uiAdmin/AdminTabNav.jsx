import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminTabNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: "Pasien Aktif", path: "/admin/dashboard/aktif" },
    { label: "Pasien Selesai Hari Ini", path: "/admin/dashboard/selesai" },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex space-x-1 px-6">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative py-3 px-5 text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "text-green-700 bg-green-50 border-b-2 border-green-700"
                    : "text-gray-700 hover:text-green-700 hover:bg-green-50"
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTabNav;
