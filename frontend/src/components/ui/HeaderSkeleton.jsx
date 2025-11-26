// src/components/ui/HeaderSkeleton.jsx

export default function HeaderSkeleton() {
  return (
    <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-lg">
      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="h-3 w-1/2 rounded-full bg-white/10" />
            <div className="h-6 w-2/3 rounded-full bg-white/10" />
          </div>
        ))}
        <div className="space-y-3 text-right">
          <div className="ml-auto h-3 w-3/4 rounded-full bg-white/10" />
          <div className="ml-auto h-3 w-2/4 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
