export default function Loading() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 animate-pulse">
      {/* Title skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-8 w-48 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-4 w-full max-w-lg rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800 mt-2" />
      </div>

      {/* Drop zone skeleton */}
      <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 px-6 py-16 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-36 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Options skeleton */}
      <div className="mt-8 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>

      {/* Button skeleton */}
      <div className="mt-6 h-12 w-40 rounded-xl bg-red-100 dark:bg-red-900/20" />
    </main>
  );
}
