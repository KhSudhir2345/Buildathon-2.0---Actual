// Loading placeholder for cards
export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 space-y-3 animate-pulse">
          <div className="h-6 bg-charcoal-700 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-charcoal-700 rounded w-full" />
            <div className="h-4 bg-charcoal-700 rounded w-5/6" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 bg-charcoal-700 rounded-full w-16" />
            <div className="h-6 bg-charcoal-700 rounded-full w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}