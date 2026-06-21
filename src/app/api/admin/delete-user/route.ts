import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Pengguna wajib disertakan." },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 1. Hapus akun dari inti otentikasi Supabase (auth.users)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;

    // 2. Hapus data dari tabel profil publik agar sinkron
    await supabaseAdmin.from("users").delete().eq("id", id);

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil diberhentikan dari sistem!",
    });
  } catch (error: any) {
    console.error("Error Hapus Pengguna:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
