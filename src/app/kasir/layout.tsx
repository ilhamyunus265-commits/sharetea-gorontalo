"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, ListOrdered, History, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  // State untuk menyimpan nama asli pengguna dan shift
  const [kasirName, setKasirName] = useState("Memuat...");
  const [shiftName, setShiftName] = useState("Shift...");

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();

        if (data && data.name) {
          const shortName = data.name.split(" ")[0];
          setKasirName(shortName);
        } else {
          setKasirName("Kasir Aktif");
        }
      }
    };

    fetchUserData();

    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 14) {
      setShiftName("Shift Pagi");
    } else if (currentHour >= 14 && currentHour < 18) {
      setShiftName("Shift Sore");
    } else {
      setShiftName("Shift Malam");
    }
  }, [supabase]);

  const handleLogout = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menutup shift dan keluar dari mesin kasir?",
      )
    )
      return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (error: any) {
      alert("Gagal keluar: " + error.message);
    }
  };

  // FUNGSI BANTUAN UNTUK MENGECEK MENU AKTIF
  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-[#faf9f8] font-sans flex flex-col selection:bg-[#5c3a21]/20">
      {/* TOP NAVBAR KHUSUS KASIR (GLASSMORPHISM) */}
      <header className="h-[76px] bg-white/70 backdrop-blur-xl border-b border-white/60 flex items-center justify-between px-6 md:px-10 shrink-0 print:hidden shadow-[0_4px_30px_rgb(0,0,0,0.03)] z-50">
        {/* LOGO & BRANDING */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#5c3a21] to-[#4a2c0f] flex items-center justify-center shadow-lg shadow-[#5c3a21]/20 text-white">
            <Store className="w-6 h-6" />
          </div>
          <div className="hidden sm:block">
            <span className="text-2xl font-black text-stone-900 tracking-tight leading-none">
              Sharetea<span className="text-[#5c3a21]">POS</span>
            </span>
          </div>
        </div>

        {/* MENU NAVIGASI DINAMIS (PILL STYLE) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-stone-100/60 p-1.5 rounded-2xl border border-stone-200/50">
          <Link
            href="/kasir/pos"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all duration-300 ${
              isActive("/kasir/pos")
                ? "bg-white text-[#5c3a21] shadow-sm font-bold scale-100"
                : "text-stone-500 hover:text-stone-800 font-medium hover:bg-white/50 scale-95 hover:scale-100"
            }`}
          >
            <Store className="w-4 h-4" /> Kasir (POS)
          </Link>
          <Link
            href="/kasir/antrian"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all duration-300 ${
              isActive("/kasir/antrian")
                ? "bg-white text-[#5c3a21] shadow-sm font-bold scale-100"
                : "text-stone-500 hover:text-stone-800 font-medium hover:bg-white/50 scale-95 hover:scale-100"
            }`}
          >
            <ListOrdered className="w-4 h-4" /> Antrian Dapur
          </Link>
          <Link
            href="/kasir/riwayat"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all duration-300 ${
              isActive("/kasir/riwayat")
                ? "bg-white text-[#5c3a21] shadow-sm font-bold scale-100"
                : "text-stone-500 hover:text-stone-800 font-medium hover:bg-white/50 scale-95 hover:scale-100"
            }`}
          >
            <History className="w-4 h-4" /> Riwayat
          </Link>
        </nav>

        {/* PROFIL KASIR & LOGOUT */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/80 px-2.5 py-2 rounded-2xl border border-white shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
              {kasirName !== "Memuat..."
                ? kasirName.substring(0, 2).toUpperCase()
                : "..."}
            </div>
            <div className="text-left hidden sm:block pr-3">
              <p className="text-sm font-extrabold text-stone-800 leading-none mb-1">
                {kasirName}
              </p>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">
                {shiftName}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-11 h-11 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-lg hover:shadow-red-500/20"
            title="Tutup Shift (Keluar)"
          >
            <LogOut className="w-5 h-5 ml-1" />
          </button>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex-1 overflow-hidden flex relative z-10">
        {children}
      </main>
    </div>
  );
}
