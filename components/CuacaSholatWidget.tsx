"use client";
import { useState, useEffect, ReactNode, useRef } from "react";
import { MapPin, Droplets, Wind, Moon, Sun, CloudSun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning, Sunset, Star, Landmark } from "lucide-react";

interface Cuaca { suhu: number; deskripsi: string; icon: ReactNode; kota: string; kelembaban: number; angin: number; }
interface Sholat { subuh: string; dzuhur: string; ashar: string; maghrib: string; isya: string; }

// Lokasi default Ciburial, Garut
const LAT = -7.2167;
const LON = 107.9167;
const KOTA = "Ciburial, Garut";

function formatWaktu(date: Date) {
 return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// Hitung jadwal sholat sederhana (kalkulasi astronomi)
function hitungSholat(lat: number, lon: number, date: Date): Sholat {
 const d = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
 const timezone = 7; // WIB
 const B = (360 / 365) * (d - 81) * (Math.PI / 180);
 const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
 const noon = 12 - (lon - timezone * 15) / 15 - EoT / 60;
 const decl = 23.45 * Math.sin(B) * (Math.PI / 180);
 const latRad = lat * (Math.PI / 180);
 function ha(angle: number) { return (180 / Math.PI) * Math.acos((Math.sin(angle * Math.PI / 180) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl))); }
 const toTime = (decimal: number) => { const h = Math.floor(decimal); const m = Math.round((decimal - h) * 60); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
 return {
 subuh: toTime(noon - ha(-18) / 15),
 dzuhur: toTime(noon + 0.07),
 ashar: toTime(noon + ha(Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decl)))) * 180 / Math.PI) / 15),
 maghrib: toTime(noon + ha(-0.833) / 15),
 isya: toTime(noon + ha(-17) / 15),
 };
}

export default function CuacaSholatWidget() {
 const [cuaca, setCuaca] = useState<Cuaca | null>(null);
 const [sholat, setSholat] = useState<Sholat | null>(null);
 const [now, setNow] = useState(new Date());
 const [loading, setLoading] = useState(true);
 const [isOpen, setIsOpen] = useState(false);
 
 // Draggable state
 const [position, setPosition] = useState({ x: 24, y: 100 }); // bottom-right, just above BottomNav
 const [isDragging, setIsDragging] = useState(false);
 const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

 useEffect(() => {
 const timer = setInterval(() => setNow(new Date()), 60000);
 return () => clearInterval(timer);
 }, []);

 useEffect(() => {
 setSholat(hitungSholat(LAT, LON, now));
 fetchCuaca();
 }, []);

 // Drag handlers
 const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
   e.preventDefault();
   const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
   const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
   
   dragRef.current = {
     startX: clientX,
     startY: clientY,
     startPosX: position.x,
     startPosY: position.y,
   };
   setIsDragging(true);
 };

 useEffect(() => {
   const handleDragMove = (e: MouseEvent | TouchEvent) => {
     if (!isDragging || !dragRef.current) return;
     
     const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
     const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
     
     const deltaX = dragRef.current.startX - clientX;
     const deltaY = dragRef.current.startY - clientY;
     
     const newX = Math.max(10, Math.min(window.innerWidth - 70, dragRef.current.startPosX + deltaX));
     const newY = Math.max(10, Math.min(window.innerHeight - 150, dragRef.current.startPosY + deltaY));
     
     setPosition({ x: newX, y: newY });
   };

   const handleDragEnd = () => {
     setIsDragging(false);
     dragRef.current = null;
   };

   if (isDragging) {
     window.addEventListener('mousemove', handleDragMove);
     window.addEventListener('mouseup', handleDragEnd);
     window.addEventListener('touchmove', handleDragMove);
     window.addEventListener('touchend', handleDragEnd);
   }

   return () => {
     window.removeEventListener('mousemove', handleDragMove);
     window.removeEventListener('mouseup', handleDragEnd);
     window.removeEventListener('touchmove', handleDragMove);
     window.removeEventListener('touchend', handleDragEnd);
   };
 }, [isDragging, position]);

 async function fetchCuaca() {
 try {
 // Open-Meteo API — free, no key needed
 const res = await fetch(
 `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=Asia%2FJakarta`
 );
 const data = await res.json();
 const wc = data.current_weather;
 const iconMap: Record<number, ReactNode> = {
 0: <Sun />, 1: <CloudSun />, 2: <CloudSun />, 3: <Cloud />,
 45: <CloudFog />, 48: <CloudFog />, 51: <CloudRain />, 53: <CloudRain />, 55: <CloudRain />,
 61: <CloudRain />, 63: <CloudRain />, 65: <CloudRain />, 71: <CloudSnow />, 80: <CloudRain />,
 95: <CloudLightning />, 96: <CloudLightning />, 99: <CloudLightning />,
 };
 const descMap: Record<number, string> = {
 0: "Cerah", 1: "Cerah Berawan", 2: "Berawan", 3: "Mendung",
 45: "Berkabut", 48: "Berkabut Tebal", 51: "Gerimis", 53: "Gerimis", 55: "Gerimis Lebat",
 61: "Hujan Ringan", 63: "Hujan", 65: "Hujan Lebat", 71: "Bersalju", 80: "Hujan Lokal",
 95: "Badai", 96: "Badai Petir", 99: "Badai Besar",
 };
 setCuaca({
 suhu: Math.round(wc.temperature),
 deskripsi: descMap[wc.weathercode] || "Cerah",
 icon: iconMap[wc.weathercode] || "️",
 kota: KOTA,
 kelembaban: data.hourly?.relativehumidity_2m?.[new Date().getHours()] || 75,
 angin: Math.round(wc.windspeed),
 });
 } catch {
 setCuaca({ suhu: 24, deskripsi: "Cerah Berawan", icon: <CloudSun />, kota: KOTA, kelembaban: 75, angin: 8 });
 } finally {
 setLoading(false);
 }
 }

 const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
 const BULAN_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

 // Tentukan sholat berikutnya
 function sholatBerikutnya() {
 if (!sholat) return null;
 const nowStr = formatWaktu(now);
 const waktuList = [
 { nama: "Subuh", waktu: sholat.subuh },
 { nama: "Dzuhur", waktu: sholat.dzuhur },
 { nama: "Ashar", waktu: sholat.ashar },
 { nama: "Maghrib", waktu: sholat.maghrib },
 { nama: "Isya", waktu: sholat.isya },
 ];
 return waktuList.find(w => w.waktu > nowStr) || waktuList[0];
 }
 const next = sholatBerikutnya();

 return (
 <div 
   className="fixed z-[100] flex flex-col items-end gap-4" 
   style={{ 
     fontFamily: "'Segoe UI',system-ui,sans-serif",
     right: position.x,
     bottom: position.y,
     transition: isDragging ? 'none' : 'right 0.1s, bottom 0.1s',
   }}
 >
 {/* Widget Content Container */}
 {isOpen && (
 <div className="animate-masuk bg-white rounded-3xl p-5 shadow-[0_20px_60px_rgba(28,58,43,0.25)] border border-[rgba(45,90,64,0.12)] w-[min(90vw,650px)] relative">
 <button 
 onClick={() => setIsOpen(false)}
 className="absolute top-4 right-4 text-[var(--ts)] hover:text-[var(--fo)] transition-colors"
 >
 X
 </button>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Cuaca */}
 <div style={{ background: "linear-gradient(135deg, #2d5a40 0%, #4a8c5c 100%)", borderRadius: 20, padding: 20, color: "white" }}>
 <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
 <MapPin size={12} style={{display:"inline", marginRight:4, verticalAlign:"text-bottom"}} /> {KOTA}
 </div>
 {loading ? (
 <div style={{ opacity: 0.5, fontSize: 14 }}>Memuat cuaca...</div>
 ) : cuaca && (
 <>
 <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
 <div style={{ fontSize: 42 }}>{cuaca.icon}</div>
 <div>
 <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{cuaca.suhu}°C</div>
 <div style={{ fontSize: 13, opacity: 0.85 }}>{cuaca.deskripsi}</div>
 </div>
 </div>
 <div style={{ display: "flex", gap: 16, fontSize: 11, opacity: 0.75 }}>
 <span><Droplets size={12} style={{display:"inline", marginRight:4}} /> {cuaca.kelembaban}%</span>
 <span><Wind size={12} style={{display:"inline", marginRight:4}} /> {cuaca.angin} km/j</span>
 </div>
 <div style={{ marginTop: 10, fontSize: 11, opacity: 0.6 }}>
 {HARI_ID[now.getDay()]}, {now.getDate()} {BULAN_ID[now.getMonth()]} {now.getFullYear()}
 </div>
 </>
 )}
 </div>

 {/* Jadwal Sholat */}
 <div style={{ background: "#f8faf9", borderRadius: 20, padding: 20, border: "1px solid rgba(45,90,64,0.08)" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2e1f" }}><Landmark size={14} style={{display:"inline", marginRight:6}} /> Jadwal Sholat</div>
 {next && (
 <div style={{ background: "rgba(45,90,64,0.1)", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "#2d5a40", fontWeight: 700 }}>
 {next.nama} {next.waktu}
 </div>
 )}
 </div>
 {sholat && (
 <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
 {[
 { nama: "Subuh", waktu: sholat.subuh, icon: <Moon size={14} /> },
 { nama: "Dzuhur", waktu: sholat.dzuhur, icon: <Sun size={14} /> },
 { nama: "Ashar", waktu: sholat.ashar, icon: <CloudSun /> },
 { nama: "Maghrib", waktu: sholat.maghrib, icon: <Sunset size={14} /> },
 { nama: "Isya", waktu: sholat.isya, icon: <Star size={14} /> },
 ].map(s => {
 const isNext = next?.nama === s.nama;
 return (
 <div key={s.nama} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 8, background: isNext ? "rgba(45,90,64,0.08)" : "transparent", border: isNext ? "1px solid rgba(45,90,64,0.1)" : "1px solid transparent" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
 <span style={{ fontSize: 13 }}>{s.icon}</span>
 <span style={{ fontSize: 12, fontWeight: isNext ? 700 : 500, color: isNext ? "#2d5a40" : "#1a2e1f" }}>{s.nama}</span>
 </div>
 <span style={{ fontSize: 12, fontWeight: 700, color: isNext ? "#2d5a40" : "#6b7c6d" }}>{s.waktu}</span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Toggle FAB - Draggable */}
 <button 
 onMouseDown={handleDragStart}
 onTouchStart={handleDragStart}
 onClick={(e) => {
   // Only toggle if not dragging (prevent click after drag)
   if (!isDragging) setIsOpen(!isOpen);
 }}
 className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 group relative ${isOpen ? 'bg-white text-[var(--fo)]' : 'bg-gradient-to-br from-[var(--fo)] to-[var(--accent)] text-white glow'}`}
 style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
 >
 {isOpen ? (
 <span className="text-xl font-bold">X</span>
 ) : (
 <div className="flex flex-col items-center">
 <span className="text-xl group-hover:scale-125 transition-transform"><Landmark size={20} strokeWidth={1.5} /></span>
 <span className="text-[8px] font-black uppercase tracking-tighter mt-[-2px] opacity-80">Info</span>
 </div>
 )}
 
 {/* Tooltip on hover */}
 {!isOpen && (
 <div className="absolute right-full mr-4 bg-[var(--fo)] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 uppercase tracking-widest">
 Cuaca & Sholat
 </div>
 )}
 </button>
 </div>
 );
}
