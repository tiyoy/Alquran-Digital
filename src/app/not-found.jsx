import Link from 'next/link';
import { ArrowLeft, BookOpen, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="system-feedback-page">
      <section className="system-feedback-card" aria-labelledby="not-found-title">
        <div className="system-feedback-icon" aria-hidden="true">
          <SearchX size={30} strokeWidth={1.8} />
        </div>
        <p className="system-feedback-eyebrow">404 · HALAMAN TIDAK DITEMUKAN</p>
        <h1 id="not-found-title">Sepertinya kamu tersesat.</h1>
        <p className="system-feedback-description">
          Halaman yang kamu cari tidak tersedia. Kembali ke beranda untuk melanjutkan perjalanan tilawah.
        </p>
        <Link href="/" className="system-feedback-action">
          <ArrowLeft size={17} aria-hidden="true" />
          Kembali ke beranda
        </Link>
        <div className="system-feedback-brand">
          <BookOpen size={15} aria-hidden="true" />
          Nurani — Teman ibadah harian
        </div>
      </section>
    </main>
  );
}
