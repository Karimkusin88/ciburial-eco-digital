const fs = require('fs');

function replaceEmojis(file) {
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');

  if (file.includes('CuacaSholatWidget')) {
    text = text.replace(/iconMap: Record<number, string> = \{[^}]+\};/, `iconMap: Record<number, ReactNode> = {
        0: <Sun />, 1: <CloudSun />, 2: <CloudSun />, 3: <Cloud />,
        45: <CloudFog />, 48: <CloudFog />, 51: <CloudRain />, 53: <CloudRain />, 55: <CloudRain />,
        61: <CloudRain />, 63: <CloudRain />, 65: <CloudRain />, 71: <CloudSnow />, 80: <CloudRain />,
        95: <CloudLightning />, 96: <CloudLightning />, 99: <CloudLightning />,
      };`);
    text = text.replace(/icon: "🌤️"/g, 'icon: <CloudSun />');
    text = text.replace(/📍/g, '<MapPin size={12} style={{display:"inline", marginRight:4, verticalAlign:"text-bottom"}} />');
    text = text.replace(/💧/g, '<Droplets size={12} style={{display:"inline", marginRight:4}} />');
    text = text.replace(/💨/g, '<Wind size={12} style={{display:"inline", marginRight:4}} />');
    text = text.replace(/🕌 Jadwal Sholat/g, '<Landmark size={14} style={{display:"inline", marginRight:6}} /> Jadwal Sholat');
    text = text.replace(/icon: "🌙"/g, 'icon: <Moon size={14} />');
    text = text.replace(/icon: "☀️"/g, 'icon: <Sun size={14} />');
    text = text.replace(/icon: "🌤️"/g, 'icon: <CloudSun size={14} />');
    text = text.replace(/icon: "🌆"/g, 'icon: <Sunset size={14} />');
    text = text.replace(/icon: "⭐"/g, 'icon: <Star size={14} />');
    text = text.replace(/<span className="text-xl group-hover:scale-125 transition-transform">🕌<\/span>/g, '<span className="text-xl group-hover:scale-125 transition-transform"><Landmark size={20} strokeWidth={1.5} /></span>');
    text = text.replace(/interface Cuaca \{ suhu: number; deskripsi: string; icon: string; kota: string; kelembaban: number; angin: number; \}/g, 'interface Cuaca { suhu: number; deskripsi: string; icon: ReactNode; kota: string; kelembaban: number; angin: number; }');
  }

  if (file.includes('KegiatanTab')) {
    text = text.replace(/📌/g, '');
  }

  if (file.includes('TentangTab')) {
    text = text.replace(/✦/g, '');
    text = text.replace(/⚠️/g, '');
    text = text.replace(/🌱/g, '');
    text = text.replace(/🎋/g, '');
    text = text.replace(/♻️/g, '');
    text = text.replace(/📚/g, '');
  }

  fs.writeFileSync(file, text, 'utf8');
}

replaceEmojis('components/CuacaSholatWidget.tsx');
replaceEmojis('components/home/KegiatanTab.tsx');
replaceEmojis('components/home/TentangTab.tsx');
