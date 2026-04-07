"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

import { TabType, Kegiatan, Produk, Transaksi, Testimoni, Iklan, DEF_KEG, DEF_PROD, DEF_TX, DEF_TESTIMONI, DEF_IKLAN, ALOKASI } from "@/components/home/types";
import Navbar from "@/components/home/Navbar";
import TentangTab from "@/components/home/TentangTab";
import KegiatanTab from "@/components/home/KegiatanTab";
import ProposalTab from "@/components/home/ProposalTab";
import TransparansiTab from "@/components/home/TransparansiTab";
import MarketplaceTab from "@/components/home/MarketplaceTab";
import Footer from "@/components/home/Footer";

export default function Home() {
  const [tab, setTab] = useState<TabType>("tentang");
  const [checkout, setCheckout] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>(DEF_KEG);
  const [produk, setProduk] = useState<Produk[]>(DEF_PROD);
  const [transaksi, setTransaksi] = useState<Transaksi[]>(DEF_TX);
  const [testimoni, setTestimoni] = useState<Testimoni[]>(DEF_TESTIMONI);
  const [iklan, setIklan] = useState<Iklan[]>(DEF_IKLAN);
  const [dataLoad, setDataLoad] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    (async () => {
      setDataLoad(true);
      const [k, p, t] = await Promise.all([
        supabase.from("kegiatan").select("*").order("tanggal", { ascending: false }),
        supabase.from("produk").select("*").order("created_at", { ascending: false }),
        supabase.from("transaksi").select("*").order("tanggal", { ascending: false }),
      ]);
      if (k.data?.length) setKegiatan(k.data as Kegiatan[]);
      if (p.data?.length) setProduk(p.data as Produk[]);
      if (t.data?.length) setTransaksi(t.data as Transaksi[]);
      
      // Fetch testimoni (catch error if table doesn't exist yet)
      let tm: any = { data: null };
      let ikl: any = { data: null };
      try {
        tm = await supabase.from("testimoni").select("*").order("created_at", { ascending: false });
        ikl = await supabase.from("iklan").select("*").order("created_at", { ascending: false });
      } catch (e) {}
      
      if (tm && tm.data && tm.data.length > 0) setTestimoni(tm.data as Testimoni[]);
      if (ikl && ikl.data && ikl.data.length > 0) setIklan(ikl.data as Iklan[]);

      setDataLoad(false);
    })();
  }, []);

  const go = (t: TabType) => { 
    setTab(t); 
    setCheckout(false); 
  };

  // keuangan
  const totMasuk = transaksi.filter(t => t.tipe === "masuk").reduce((s, t) => s + t.jumlah, 0);
  const totKeluar = transaksi.filter(t => t.tipe === "keluar").reduce((s, t) => s + t.jumlah, 0);
  const saldo = totMasuk - totKeluar;
  const totTarget = ALOKASI.reduce((s, a) => s + a.target, 0); // 250.000.000

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cr)" }}>
      <Navbar tab={tab} checkout={checkout} scrolled={scrolled} onNavigate={go} />

      {tab === "tentang" && !checkout && (
        <TentangTab onNavigate={go} testimoni={testimoni} />
      )}

      {tab === "kegiatan" && (
        <KegiatanTab kegiatan={kegiatan} dataLoad={dataLoad} />
      )}

      {tab === "proposal" && (
        <ProposalTab transaksi={transaksi} />
      )}

      {tab === "transparansi" && (
        <TransparansiTab 
          transaksi={transaksi} 
          totMasuk={totMasuk} 
          totKeluar={totKeluar} 
          saldo={saldo} 
          totTarget={totTarget} 
        />
      )}

      {tab === "marketplace" && (
        <MarketplaceTab 
          produk={produk} 
          iklan={iklan}
          dataLoad={dataLoad} 
          checkout={checkout} 
          setCheckout={setCheckout} 
        />
      )}

      <Footer onNavigate={go} />
    </main>
  );
}