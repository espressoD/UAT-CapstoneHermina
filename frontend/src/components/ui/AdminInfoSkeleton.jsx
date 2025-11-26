// src/components/ui/AdminInfoSkeleton.jsx

export default function AdminInfoSkeleton() {
  return (
    <div className="bg-[#1E6C53] rounded-xl text-white p-5 shadow-md flex flex-col justify-between animate-pulse">
      <div>
        {/* Judul */}
        <div className="h-5 bg-green-700 rounded w-3/4 mb-6"></div>
        
        <div className="space-y-5">
          {/* Blok 1 */}
          <div className="border-b border-white/10 pb-3">
            <div className="h-3 bg-green-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-green-700 rounded w-1/3"></div>
          </div>
          {/* Blok 2 */}
          <div className="border-b border-white/10 pb-3">
            <div className="h-3 bg-green-700 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-green-700 rounded w-1/4"></div>
          </div>
          {/* Blok 3 */}
          <div className="border-b border-white/10 pb-3">
            <div className="h-3 bg-green-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-green-700 rounded w-full mb-1"></div>
            <div className="h-3 bg-green-700 rounded w-full"></div>
          </div>
          {/* Blok 4 - Tombol */}
          <div className="pt-3">
            <div className="h-3 bg-green-700 rounded w-1/2 mb-2"></div>
            <div className="h-12 bg-green-700 rounded-lg w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
