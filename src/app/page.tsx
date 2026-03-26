"use client";
import { useState } from "react";

export default function Home() {
  const [lang, setLang] = useState<"id" | "en">("id");

  const content = {
    id: {
      navMarket: "Pasar Eco",
      navData: "Data Warga",
      title: "Membangun Akar, Merakit Masa Depan.",
      subtitle: "Purwarupa desa mandiri Ciburial yang memadukan kearifan ekologi lokal (bambu & tani) dengan transparansi teknologi Web3.",
      btnSupport: "Dukung Kami",
      btnMarket: "Lihat Karya Warga",
      status: "🟢 Fase 1: Infrastruktur PJU Pintar Aktif"
    },
    en: {
      navMarket: "Eco Market",
      navData: "Demographics",
      title: "Building Roots, Crafting the Future.",
      subtitle: "Ciburial's independent village prototype integrating local ecological wisdom (bamboo & agriculture) with Web3 transparency.",
      btnSupport: "Support Us",
      btnMarket: "Explore Local Crafts",
      status: "🟢 Phase 1: Smart Street Lighting Active"
    }
  };

  const t = content[lang];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 max-w-7xl mx-auto">
        <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
          <span className="text-ciburial-yellow">🌱 CIBURIAL</span>
          <span className="text-white hidden sm:block">MAKERS</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="text-sm font-medium hover:text-ciburial-yellow transition">{t.navMarket}</button>
          <button className="text-sm font-medium hover:text-ciburial-yellow transition">{t.navData}</button>
          
          <div className="flex bg-white/10 rounded-full p-1 backdrop-blur-md border border-white/20">
            <button 
              onClick={() => setLang("id")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition ${lang === "id" ? "bg-ciburial-green text-white" : "text-gray-400"}`}
            >
              ID
            </button>
            <button 
              onClick={() => setLang("en")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition ${lang === "en" ? "bg-ciburial-green text-white" : "text-gray-400"}`}
            >
              EN
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl w-full mt-20 p-8 sm:p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl text-center">
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-ciburial-green/30 border border-ciburial-green/50 text-ciburial-yellow text-sm font-semibold tracking-wide">
          {t.status}
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          {t.title}
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 rounded-xl bg-ciburial-yellow text-black font-bold text-lg hover:bg-yellow-400 transition shadow-[0_0_20px_rgba(250,204,21,0.3)]">
            {t.btnSupport}
          </button>
          <button className="px-8 py-4 rounded-xl bg-transparent border border-white/30 text-white font-bold text-lg hover:bg-white/10 transition">
            {t.btnMarket}
          </button>
        </div>
      </div>
    </main>
  );
}
