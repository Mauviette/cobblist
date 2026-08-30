export function ProgressBar({ percent, accent }: { percent: number; accent?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="bevel-inset h-4 w-full overflow-hidden border-stone-500 bg-stone-900">
      <div
        className="h-full transition-[width] duration-300"
        style={{ width: `${clamped}%`, backgroundColor: accent ?? 'var(--color-emerald)' }}
      />
    </div>
  );
}
