'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewApiaryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/apiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, notes: notes || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create apiary');
      }

      router.push('/apiaries');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/apiaries" className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 inline-block">
        ← Back to Apiaries
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Apiary</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
            Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="e.g. Garden Apiary"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Optional notes…"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating…' : 'Create Apiary'}
          </button>
          <Link href="/apiaries" className="text-sm text-zinc-500 hover:text-zinc-700 py-2">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
