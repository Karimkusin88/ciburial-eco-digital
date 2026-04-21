import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Generate jadwal untuk semua RT hari ini
    const today = new Date().toISOString().split("T")[0];
    
    // Check apakah sudah ada jadwal untuk hari ini
    const { data: existingJadwal, error: checkError } = await supabase
      .from("jadwal_ronda")
      .select("*", { count: "exact" })
      .eq("tanggal", today);
    
    if (checkError) throw checkError;
    
    if (existingJadwal && existingJadwal.length > 0) {
      return NextResponse.json(
        { success: false, message: `Jadwal untuk ${today} sudah ada (${existingJadwal.length} RT)` },
        { status: 400 }
      );
    }
    
    // Generate jadwal untuk 5 RT (01-05)
    const jadwalBaru = [];
    for (let rt = 1; rt <= 5; rt++) {
      jadwalBaru.push({
        tanggal: today,
        rt: `0${rt}`.slice(-2), // Ensure "01", "02", etc.
        jam_mulai: "21:00",
        jam_selesai: "04:00",
      });
    }
    
    const { data: insertedJadwal, error: insertError } = await supabase
      .from("jadwal_ronda")
      .insert(jadwalBaru)
      .select();
    
    if (insertError) throw insertError;
    
    return NextResponse.json(
      {
        success: true,
        message: `Jadwal ronda untuk ${today} berhasil di-generate`,
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

// GET untuk check status & manual trigger
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
