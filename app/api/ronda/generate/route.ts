import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const days = body.days || 1; // Default 1 hari
    
    // Generate jadwal untuk range days
    const today = new Date();
    const jadwalBaru = [];
    let skipped = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const tanggal = date.toISOString().split("T")[0];
      
      // Check apakah sudah ada jadwal untuk hari ini
      const { data: existing } = await supabase
        .from("jadwal_ronda")
        .select("id", { count: "exact" })
        .eq("tanggal", tanggal)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        jadwalBaru.push({
          tanggal,
          rt: "RW",
          jam_mulai: "21:00",
          jam_selesai: "04:00",
        });
      } else {
        skipped++;
      }
    }
    
    if (jadwalBaru.length === 0) {
      return NextResponse.json(
        { success: false, message: `Semua jadwal ${days} hari sudah ada (${skipped} hari)` },
        { status: 400 }
      );
    }
    
    const { data: insertedJadwal, error: insertError } = await supabase
      .from("jadwal_ronda")
      .insert(jadwalBaru)
      .select();
    
    if (insertError) throw insertError;
    
    const message = `Jadwal ronda ${days} hari berhasil di-generate${skipped > 0 ? ` (${skipped} hari skip)` : ""}`;
    
    return NextResponse.json(
      {
        success: true,
        message,
        jadwal: insertedJadwal,
        count: insertedJadwal?.length || 0,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error generating ronda schedule:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET untuk check status
export async function GET(req: NextRequest) {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    const { data: jadwal, error } = await supabase
      .from("jadwal_ronda")
      .select("*")
      .eq("tanggal", today)
      .order("rt");
    
    if (error) throw error;
    
    if (jadwal && jadwal.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Jadwal untuk ${today} sudah ada`,
        jadwal,
        count: jadwal.length,
      });
    }
    
    return NextResponse.json({
      success: false,
      message: `Belum ada jadwal untuk ${today}`,
      date: today,
    });
  } catch (error: any) {
    console.error("Error checking ronda schedule:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
