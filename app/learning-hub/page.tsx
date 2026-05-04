"use client";
import Link from "next/link";

export default function LearningHubPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-[var(--accent)] selection:text-white">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 w-full z-50 transition-all duration-500 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 transition-all duration-300 group-hover:scale-105 overflow-hidden">
                <span className="text-xl">🌿</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold fnt leading-tight bg-gradient-to-r from-[var(--fo)] to-[var(--accent)] bg-clip-text text-transparent">Ciburial Hub</span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase leading-none hidden sm:block">Portal Pembelajaran Digital</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <Link href="#" className="text-sm font-medium px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
                Beranda
              </Link>
              <Link href="#" className="text-sm font-medium px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
                Program
              </Link>
              <Link href="#" className="text-sm font-medium px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
                Galeri
              </Link>
              <button className="ml-2 bg-[var(--fo)] text-white hover:bg-[var(--accent-dark)] h-9 px-5 text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300">
                Login / Tap NFC
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none"></div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--gb)] text-[var(--gt)] font-semibold text-xs mb-8 border border-[rgba(28,107,58,0.1)]">
              <span className="w-2 h-2 rounded-full bg-[var(--gt)] animate-pulse"></span>
              Fasilitas Baru Ciburial
            </div>

            <h1 className="fnt text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
              Digital Learning Hub <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[var(--accent-dark)] to-[var(--accent-light)] bg-clip-text text-transparent">
                Empower Your Competency
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed">
              Platform pembelajaran digital untuk pemuda desa. Akses E-Perpus, Lab Komputer, video pelatihan UMKM, dan materi pertanian modern.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--fo)] text-white font-semibold shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-1 transition-all duration-300">
                Jelajahi Fasilitas
              </button>
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-gray-700 border border-gray-200 font-semibold shadow-sm hover:bg-gray-50 hover:-translate-y-1 transition-all duration-300">
                Tentang Program
              </button>
            </div>
          </div>
        </section>

        {/* MAIN GRID CARDS */}
        <section className="py-20 bg-gray-50/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="fnt text-3xl md:text-4xl font-bold text-gray-900 mb-4">Layanan & Materi Pembelajaran</h2>
              <div className="h-1 w-20 bg-[var(--fo)] mx-auto rounded-full opacity-20"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: E-Perpus (Blue) */}
              <div className="flex h-full">
                <div className="gap-6 rounded-2xl py-6 group cursor-pointer bg-blue-50/50 border-blue-100 border shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full w-full flex flex-col relative bg-white">
                  <div className="p-7 flex-1 flex flex-col relative z-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:rotate-3">
                      <span className="text-2xl">📚</span>
                    </div>
                    <h3 className="text-xl font-semibold fnt mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">E-Perpustakaan</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Akses ribuan koleksi buku fisik dan e-book. Pinjam menggunakan NFC e-KTP.
                    </p>
                    <div className="mt-auto pt-5 flex items-center text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                      Lihat Katalog <span className="ml-1.5">→</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Lab PC (Teal) */}
              <div className="flex h-full">
                <div className="gap-6 rounded-2xl py-6 group cursor-pointer bg-teal-50/50 border-teal-100 border shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full w-full flex flex-col relative bg-white">
                  <div className="p-7 flex-1 flex flex-col relative z-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:rotate-3">
                      <span className="text-2xl">💻</span>
                    </div>
                    <h3 className="text-xl font-semibold fnt mb-2 text-gray-900 group-hover:text-teal-600 transition-colors">Lab Komputer</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Cek ketersediaan dan status penggunaan komputer di Balai Warga secara real-time.
                    </p>
                    <div className="mt-auto pt-5 flex items-center text-sm font-semibold text-teal-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                      Cek Status Monitor <span className="ml-1.5">→</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Video Pembelajaran (Violet) */}
              <div className="flex h-full">
                <div className="gap-6 rounded-2xl py-6 group cursor-pointer bg-violet-50/50 border-violet-100 border shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full w-full flex flex-col relative bg-white">
                  <div className="p-7 flex-1 flex flex-col relative z-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:rotate-3">
                      <span className="text-2xl">▶️</span>
                    </div>
                    <h3 className="text-xl font-semibold fnt mb-2 text-gray-900 group-hover:text-violet-600 transition-colors">Video Pembelajaran</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Video tutorial digital marketing UMKM, koding dasar, dan inovasi tani.
                    </p>
                    <div className="mt-auto pt-5 flex items-center text-sm font-semibold text-violet-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                      Tonton Sekarang <span className="ml-1.5">→</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Dokumen & PDF (Rose) */}
              <div className="flex h-full">
                <div className="gap-6 rounded-2xl py-6 group cursor-pointer bg-rose-50/50 border-rose-100 border shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full w-full flex flex-col relative bg-white">
                  <div className="p-7 flex-1 flex flex-col relative z-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:rotate-3">
                      <span className="text-2xl">📄</span>
                    </div>
                    <h3 className="text-xl font-semibold fnt mb-2 text-gray-900 group-hover:text-rose-600 transition-colors">Dokumen & PDF</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Dokumen regulasi desa, proposal kegiatan, dan panduan teknis operasional.
                    </p>
                    <div className="mt-auto pt-5 flex items-center text-sm font-semibold text-rose-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                      Unduh Berkas <span className="ml-1.5">→</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: AI Asisten (Green) */}
              <div className="flex h-full">
                <div className="gap-6 rounded-2xl py-6 group cursor-pointer bg-green-50/50 border-green-100 border shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full w-full flex flex-col relative bg-white">
                  <div className="p-7 flex-1 flex flex-col relative z-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:rotate-3">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="text-xl font-semibold fnt mb-2 text-gray-900 group-hover:text-green-600 transition-colors">AI Chat</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Asisten cerdas berbasis AI untuk mempermudah mencari info administrasi desa.
                    </p>
                    <div className="mt-auto pt-5 flex items-center text-sm font-semibold text-green-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                      Mulai Chat <span className="ml-1.5">→</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 6: Galeri (Fuchsia) */}
              <div className="flex h-full">
                <div className="gap-6 rounded-2xl py-6 group cursor-pointer bg-fuchsia-50/50 border-fuchsia-100 border shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full w-full flex flex-col relative bg-white">
                  <div className="p-7 flex-1 flex flex-col relative z-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:rotate-3">
                      <span className="text-2xl">🖼️</span>
                    </div>
                    <h3 className="text-xl font-semibold fnt mb-2 text-gray-900 group-hover:text-fuchsia-600 transition-colors">Galeri</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Dokumentasi foto kegiatan pelatihan dan suasana Learning Hub.
                    </p>
                    <div className="mt-auto pt-5 flex items-center text-sm font-semibold text-fuchsia-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                      Lihat Foto <span className="ml-1.5">→</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section className="py-20 relative overflow-hidden mt-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--fo)] via-[var(--fm)] to-[var(--accent-dark)]"></div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white, transparent 50%), radial-gradient(circle at 80% 50%, white, transparent 50%)' }}></div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="text-xl">⚡</span> Mulai Sekarang
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold fnt mb-5 text-white">Siap untuk Meningkatkan Kompetensi?</h2>
            
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Akses berbagai fasilitas Ciburial Learning Hub kapan saja untuk mendukung masa depan digital Ciburial yang lebih cerah.
            </p>
            
            <button className="bg-white text-[var(--fo)] hover:bg-gray-50 rounded-full px-10 py-4 text-base shadow-2xl hover:shadow-white/20 hover:scale-[1.03] transition-all duration-300 font-bold flex items-center gap-2 mx-auto">
              Jelajahi Program <span>→</span>
            </button>
          </div>
        </section>
      </main>

    </div>
  );
}
