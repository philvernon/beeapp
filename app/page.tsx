import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          🐝 Beehive Tracking App
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Manage your apiaries, hives, and inspection records in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="default" className="px-8">
            <Link href="/apiaries">View Apiaries</Link>
          </Button>
          <Button size="lg" variant="outline" className="px-8">
            <Link href="/hives">View Hives</Link>
          </Button>
          <Button size="lg" variant="outline" className="px-8">
            <Link href="/analytics">Analytics</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
