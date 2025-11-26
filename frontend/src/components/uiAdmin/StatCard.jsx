// src/components/uiAdmin/StatCard.jsx
export default function StatCard({ title, count, icon, color }) {
  return (
    <div className={`${color} text-white p-4 rounded-lg shadow-md flex items-center justify-between h-full`}>
      <div className="flex items-center space-x-3">
          {icon}
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="text-4xl font-bold">
        {count}
      </div>
    </div>
  );
}
