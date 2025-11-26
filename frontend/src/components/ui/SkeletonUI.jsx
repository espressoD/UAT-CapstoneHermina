export default function SkeletonUI() {
  return (
    <div className="w-full animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-white/10" />
            <div className="h-3 w-40 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-white/10" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-24 rounded-full bg-white/10" />
        <div className="h-3 w-24 rounded-full bg-white/10" />
      </div>
      <div className="mt-6 h-10 w-full rounded-full bg-white/10" />
    </div>
  );
}
