export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-primary/20 bg-surface p-5">
      <p className="text-xs text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-primary mt-1">{value}</p>
      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
    </div>
  );
}
