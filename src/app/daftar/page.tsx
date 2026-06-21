"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UserPlus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DaftarPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Daftarkan akun ke sistem Autentikasi Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;

      // 2. Pastikan data profil masuk ke tabel public.users dengan role "konsumen"
      if (data.user) {
        const { error: profileError } = await supabase.from("users").upsert({
          id: data.user.id,
          email: email,
          name: name,
          role: "konsumen", // Mengunci hak akses hanya sebagai pelanggan
        });

        if (profileError) throw profileError;
      }

      alert(
        "Pendaftaran berhasil! Silakan masuk (login) menggunakan akun baru Anda.",
      );
      router.push("/login");
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] flex flex-col justify-center items-center p-6 relative font-sans overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS (GLASSMORPHISM VIBE) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-orange-100/60 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-[#5c3a21]/10 blur-[120px] pointer-events-none"></div>

      {/* TOMBOL KEMBALI MENGAMBANG */}
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-stone-500 hover:text-[#5c3a21] bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/60 transition-all hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 font-bold text-sm z-20"
      >
        <ArrowLeft className="w-4 h-4" /> Menu Utama
      </Link>

      {/* KARTU FORMULIR (GLASSMORPHISM) */}
      <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white overflow-hidden z-10 my-10 transition-all hover:shadow-[0_10px_50px_rgba(0,0,0,0.1)]">
        {/* HEADER KARTU */}
        <div className="p-8 pb-4 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-[#5c3a21] to-[#4a2c0f] flex items-center justify-center shadow-lg shadow-[#5c3a21]/30 text-white mb-5">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-1">
            Buat Akun
          </h1>
          <p className="text-stone-500 font-medium text-sm">
            Bergabunglah untuk kemudahan memesan Sharetea dari mana saja.
          </p>
        </div>

        {/* FORMULIR */}
        <form onSubmit={handleRegister} className="px-8 pb-8 pt-2 space-y-5">
          {/* PESAN ERROR */}
          {errorMsg && (
            <div className="p-4 bg-red-50/80 backdrop-blur-sm text-red-600 text-sm rounded-2xl border border-red-100 font-bold text-center animate-in fade-in zoom-in duration-300">
              {errorMsg}
            </div>
          )}

          {/* INPUT FIELDS */}
          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-widest ml-1">
              Nama Lengkap
            </Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Budi Santoso"
              className="h-14 rounded-2xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-bold text-stone-800 transition-colors focus:bg-white shadow-inner px-5 placeholder:text-stone-400 placeholder:font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-widest ml-1">
              Alamat Email
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="h-14 rounded-2xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-bold text-stone-800 transition-colors focus:bg-white shadow-inner px-5 placeholder:text-stone-400 placeholder:font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-widest ml-1">
              Kata Sandi
            </Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="h-14 rounded-2xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-bold text-stone-800 transition-colors focus:bg-white shadow-inner px-5 placeholder:text-stone-400 placeholder:font-medium"
            />
          </div>

          {/* TOMBOL DAFTAR */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#5c3a21] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#36200a] text-white font-black text-lg shadow-[0_8px_20px_rgba(92,58,33,0.25)] transition-all hover:shadow-[0_8px_25px_rgba(92,58,33,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-1" /> Daftar Sekarang
                </>
              )}
            </Button>
          </div>

          {/* LINK LOGIN */}
          <div className="mt-8 text-center text-sm font-medium text-stone-500 pt-6 border-t border-stone-100/80">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="text-[#5c3a21] font-black hover:underline transition-all hover:text-[#4a2c0f]"
            >
              Masuk di sini
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
