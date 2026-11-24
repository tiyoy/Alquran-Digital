import { BookOpen } from 'lucide-react';

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Memuat halaman"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-950 px-6 text-white dark:from-canvas-dark dark:via-emerald-950 dark:to-teal-950"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-300/40 bg-white/15 backdrop-blur-md animate-pulse">
        <BookOpen className="h-8 w-8 text-gold-200" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-bold tracking-wide text-emerald-50">
        Memuat Al-Qur&apos;an Digital Indonesia...
      </p>
    </div>
  );
}
