import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
          🐝 Beehive Tracking App
        </h1>
        <p className="text-lg text-zinc-600 mb-8">
          Manage your apiaries, hives, and inspection records in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/apiaries"
            className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-6 py-3 text-base font-medium text-white hover:bg-amber-700 transition-colors shadow-sm"
          >
            View Apiaries
          </Link>
          <Link
            href="/hives"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            View Hives
          </Link>
          <Link
            href="/analytics"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
