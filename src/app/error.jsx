'use client';

import { RefreshCw, ShieldAlert } from 'lucide-react';

export default function ErrorPage({ reset }) {
  return (
    <main className="system-feedback-page">
      <section className="system-feedback-card" aria-labelledby="app-error-title" role="alert">
        <div className="system-feedback-icon system-feedback-icon-warning" aria-hidden="true">
          <ShieldAlert size={30} strokeWidth={1.8} />
        </div>
        <p className="system-feedback-eyebrow">TERJADI GANGGUAN</p>
        <h1 id="app-error-title">Tenang, coba sekali lagi.</h1>
        <p className="system-feedback-description">
          Ada kendala saat membuka bagian ini. Bacaan dan preferensi yang sudah tersimpan di perangkat tidak sengaja dihapus oleh halaman ini.
        </p>
        <button type="button" className="system-feedback-action" onClick={() => reset()}>
          <RefreshCw size={17} aria-hidden="true" />
          Coba lagi
        </button>
        <p className="system-feedback-footnote">
          Jika gangguan tetap muncul, muat ulang aplikasi saat koneksi internet tersedia.
        </p>
      </section>
    </main>
  );
}
