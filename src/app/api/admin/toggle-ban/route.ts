import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { id, role } = await req.json();

    if (!id || !role) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap." },
        { status: 400 },
      );
    }

    // Gunakan akses level dewa (Admin Key)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Ubah role pengguna di tabel public.users
    const { error } = await supabaseAdmin
      .from("users")
      .update({ role })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Status akun berhasil diperbarui!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
