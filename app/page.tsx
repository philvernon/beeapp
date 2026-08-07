import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">
          🐝 Beehive Tracking App
        </h1>
        <p className="text-lg text-secondary mb-8">
          Manage your apiaries, hives, and inspection records in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/apiaries"
            className="inline-flex items-center justify-center bg-accent px-6 py-3 text-base font-medium text-surface hover:bg-accent/90 transition-colors"
          >
            View Apiaries
          </Link>
          <Link
            href="/hives"
            className="inline-flex items-center justify-center bg-surface px-6 py-3 text-base font-medium text-primary border border-primary/20 hover:bg-zinc-50 transition-colors"
          >
            View Hives
          </Link>
          <Link
            href="/analytics"
            className="inline-flex items-center justify-center bg-surface px-6 py-3 text-base font-medium text-primary border border-primary/20 hover:bg-zinc-50 transition-colors"
          >
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
