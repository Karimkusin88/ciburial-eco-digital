"use client";

// Utility untuk generate suara menggunakan Web Audio API
// Keuntungan: Tidak perlu load file MP3, instan, ringan, dan jalan di semua browser modern.

const createAudioContext = () => {
  if (typeof window !== "undefined") {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return null;
};

let audioCtx: AudioContext | null = null;

export const playSound = (type: "tap" | "success" | "error" | "pop") => {
  if (typeof window === "undefined") return; // Hindari error di SSR
  
  if (!audioCtx) {
    audioCtx = createAudioContext();
  }

  if (!audioCtx) return;

  // Lanjutkan konteks jika ter-suspend (aturan browser)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case "tap":
      // Suara klik ringan ala UI Apple/Modern
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
      break;

    case "pop":
      // Suara pop up ringan (misal nambah item ke keranjang)
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      break;

    case "success":
      // Suara ting (sukses bayar / check out)
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.setValueAtTime(900, now + 0.1);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      oscillator.start(now);
      oscillator.stop(now + 0.4);
      break;

    case "error":
      // Suara gagal / error
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(200, now);
      oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      break;
  }
};
