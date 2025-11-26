import { Outlet } from "react-router-dom";

// Medical plus pattern SVG - abstract scattered pattern with 35% opacity
const medicalPlusPattern = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cpath fill=%22%235A9F64%22 fill-opacity=%220.35%22 d=%22M15 10h6v6h6v6h-6v6h-6v-6h-6v-6h6v-6zM65 25h4v4h4v4h-4v4h-4v-4h-4v-4h4v-4zM35 55h8v8h8v8h-8v8h-8v-8h-8v-8h8v-8zM80 70h5v5h5v5h-5v5h-5v-5h-5v-5h5v-5z%22/%3E%3C/svg%3E";

export default function PasienLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#41924C] text-white">
      {/* Medical plus pattern background */}
      <div 
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url("${medicalPlusPattern}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "100px 100px",
          backgroundPosition: "0 0",
        }}
      />
      
      {/* Content wrapper */}
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
