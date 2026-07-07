export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[3/4] rounded-xl" />
          <div className="skeleton h-3 w-16 rounded mt-3" />
          <div className="skeleton h-4 w-28 rounded mt-2" />
          <div className="skeleton h-3 w-20 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}
