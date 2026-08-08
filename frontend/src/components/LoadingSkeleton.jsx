export const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse rounded-lg bg-slate-700/50 ${className}`}
    {...props}
  />
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-2xl bg-slate-800/40 p-5 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-20 h-4" />
        </div>
        <Skeleton className="w-24 h-4 mb-2" />
        <Skeleton className="w-16 h-8" />
      </div>
    ))}
  </div>
);

export const HeatMapSkeleton = () => (
  <div className="lg:col-span-2 space-y-4">
    <Skeleton className="w-48 h-6" />
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
        {[...Array(24)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export const UnitListSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="w-40 h-6" />
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="p-2 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 rounded-xl">
            <div className="flex justify-between mb-2">
              <Skeleton className="w-28 h-4" />
              <Skeleton className="w-12 h-4" />
            </div>
            <Skeleton className="w-40 h-3 mt-2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-2">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 p-3">
        <Skeleton className="w-1/4 h-5" />
        <Skeleton className="w-1/6 h-5" />
        <Skeleton className="w-1/6 h-5" />
        <Skeleton className="w-1/4 h-5" />
        <Skeleton className="w-1/6 h-5" />
      </div>
    ))}
  </div>
);
