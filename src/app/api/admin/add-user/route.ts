import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, message: "Semua data wajib diisi." },
        { status: 400 },
      );
    }

    // Gunakan Service Role Key agar memiliki akses penuh bypass registrasi biasa
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 1. Daftarkan user ke sistem auth Supabase secara permanen & otomatis terkonfirmasi
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (authError) throw authError;

    // 2. Perbarui profil di tabel public.users untuk menimpa nama dan role pilihan admin
    const { error: profileError } = await supabaseAdmin.from("users").upsert({
      id: authData.user.id, // WAJIB disertakan untuk kunci utama (Primary Key)
      email: email, // Masukkan email secara eksplisit
      name: name, // Masukkan nama dari form
      role: role, // Masukkan role pilihan admin (kasir/admin)
    });

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      message: "Karyawan baru berhasil didaftarkan!",
    });
  } catch (error: any) {
    console.error("Error Tambah Pengguna:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
