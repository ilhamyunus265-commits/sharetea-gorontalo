"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import {
  Store,
  LogOut,
  Loader2,
  ShieldCheck,
  Save,
  Image as ImageIcon,
  UploadCloud,
  MonitorPlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PengaturanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State Mock Pengaturan Toko
  const [tokoData, setTokoData] = useState({
    namaToko: "Sharetea Gorontalo",
    alamat: "Jl. Prof. Dr. Aloei Saboe, Kota Gorontalo",
    ppn: 11,
    kontak: "081234567890",
  });

  // State File Upload Background Visual (Hanya untuk Home Banner)
  const [homeFile, setHomeFile] = useState<File | null>(null);
  const [homePreview, setHomePreview] = useState<string | null>(null);

  // TARIK DATA BANNER UTAMA SAAT HALAMAN DI-LOAD
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("home_banner_url")
        .eq("id", 1)
        .single();
      if (data && data.home_banner_url) {
        setHomePreview(data.home_banner_url);
      }
    };
    fetchCurrentSettings();
  }, [supabase]);

  // Handler Upload Foto Home
  const handleHomeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHomeFile(file);
      setHomePreview(URL.createObjectURL(file));
    }
  };

  // FUNGSI SIMPAN & UPLOAD KE DATABASE Supabase
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalHomeUrl = null;

      // HANYA MEMPROSES UPLOAD UNTUK BANNER UTAMA (HOME)
      if (homeFile) {
        const fileExt = homeFile.name.split(".").pop();
        const fileName = `home-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(`banners/${fileName}`, homeFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("products")
          .getPublicUrl(`banners/${fileName}`);
        finalHomeUrl = urlData.publicUrl;
      }

      // SIMPAN URL KE TABEL SETTINGS
      const updates: any = {};
      if (finalHomeUrl) updates.home_banner_url = finalHomeUrl;

      if (Object.keys(updates).length > 0) {
        const { error: dbError } = await supabase
          .from("settings")
          .update(updates)
          .eq("id", 1);
        if (dbError) throw dbError;
      }

      alert("Pengaturan operasional dan tampilan visual berhasil disimpan!");
      setHomeFile(null);
    } catch (error: any) {
      alert("Terjadi kesalahan saat mengunggah gambar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // FUNGSI UTAMA LOGOUT
  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari sistem?")) return;
    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (error: any) {
      alert("Gagal keluar: " + error.message);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-full p-6 md:p-10 bg-[#faf9f8] relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/40 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-red-100/40 blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-4xl font-black text-stone-900 mb-2 tracking-tight">
            Pengaturan Sistem
          </h1>
          <p className="text-stone-500 font-medium text-lg">
            Konfigurasi operasional outlet dan sesuaikan banner beranda utama.
          </p>
        </div>

        {/* BUNGKUSAN FORM UTAMA */}
        <form onSubmit={handleSaveSettings} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ========================================================= */}
            {/* KARTU OPERASIONAL (GLASSMORPHISM) */}
            {/* ========================================================= */}
            <Card className="md:col-span-2 rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <CardHeader className="px-8 pt-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl font-bold text-stone-900 tracking-tight">
                    Detail Outlet
                  </CardTitle>
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl shadow-inner">
                    <Store className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <CardDescription className="text-sm font-medium text-stone-500">
                  Sesuaikan informasi nota cetak dan aturan pajak kasir.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Nama Outlet
                  </Label>
                  <Input
                    value={tokoData.namaToko}
                    onChange={(e) =>
                      setTokoData({ ...tokoData, namaToko: e.target.value })
                    }
                    className="h-12 rounded-xl bg-white/80 border-stone-200/60 focus-visible:ring-[#5c3a21] font-medium text-stone-800 shadow-sm transition-all focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Alamat Fisik
                  </Label>
                  <Input
                    value={tokoData.alamat}
                    onChange={(e) =>
                      setTokoData({ ...tokoData, alamat: e.target.value })
                    }
                    className="h-12 rounded-xl bg-white/80 border-stone-200/60 focus-visible:ring-[#5c3a21] font-medium text-stone-800 shadow-sm transition-all focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Nominal PPN (%)
                    </Label>
                    <Input
                      type="number"
                      value={tokoData.ppn}
                      onChange={(e) =>
                        setTokoData({
                          ...tokoData,
                          ppn: Number(e.target.value),
                        })
                      }
                      className="h-12 rounded-xl bg-white/80 border-stone-200/60 focus-visible:ring-[#5c3a21] font-medium text-stone-800 shadow-sm transition-all focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Nomor Kontak POS
                    </Label>
                    <Input
                      value={tokoData.kontak}
                      onChange={(e) =>
                        setTokoData({ ...tokoData, kontak: e.target.value })
                      }
                      className="h-12 rounded-xl bg-white/80 border-stone-200/60 focus-visible:ring-[#5c3a21] font-medium text-stone-800 shadow-sm transition-all focus:bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ========================================================= */}
            {/* KARTU KEAMANAN & LOGOUT (GLASSMORPHISM MERAH) */}
            {/* ========================================================= */}
            <Card className="rounded-[2rem] border-red-100/60 bg-red-50/50 backdrop-blur-xl shadow-[0_8px_30px_rgb(220,38,38,0.04)] h-fit transition-all hover:shadow-[0_8px_30px_rgb(220,38,38,0.08)]">
              <CardHeader className="px-8 pt-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl font-bold text-stone-900 tracking-tight">
                    Sesi Keamanan
                  </CardTitle>
                  <div className="p-3 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <CardDescription className="text-sm font-medium text-red-900/60">
                  Putus sambungan perangkat Anda dari sistem internal.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-sm text-stone-600 mb-8 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-red-100/50">
                  Keluar dari akun akan menghapus{" "}
                  <span className="font-bold text-stone-800">
                    cookie enkripsi sesi aktif
                  </span>{" "}
                  Anda demi menjaga keamanan data transaksi dari akses yang
                  tidak sah.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 font-bold shadow-md transition-all hover:shadow-lg hover:shadow-red-600/20"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" /> Keluar Sesi (Logout)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ========================================================= */}
          {/* KARTU TAMPILAN VISUAL BERANDA (HANYA BANNER HOME) */}
          {/* ========================================================= */}
          <Card className="rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <CardHeader className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl font-bold text-stone-900 tracking-tight">
                  Tampilan Visual (Website)
                </CardTitle>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl shadow-inner">
                  <MonitorPlay className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <CardDescription className="text-sm font-medium text-stone-500">
                Ubah gambar latar belakang utama untuk menyesuaikan suasana
                beranda depan konsumen.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="max-w-md space-y-3">
                <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Banner Utama (Home)
                </Label>
                <div className="flex flex-col gap-4 bg-stone-50/80 p-5 rounded-2xl border border-stone-200/60 shadow-inner">
                  <div className="w-full h-40 rounded-xl bg-white border-2 border-dashed border-stone-300 flex flex-col items-center justify-center relative overflow-hidden shadow-sm group">
                    {homePreview ? (
                      <Image
                        src={homePreview}
                        alt="Preview Home"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-center flex flex-col items-center">
                        <ImageIcon className="w-8 h-8 text-stone-300 mb-2" />
                        <span className="text-xs font-medium text-stone-400">
                          Belum ada gambar
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <UploadCloud className="w-8 h-8 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(homeFileChange) =>
                        handleHomeFileChange(homeFileChange)
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Klik untuk ubah gambar"
                    />
                  </div>
                  <p className="text-[11px] font-medium text-stone-400 leading-tight">
                    Rekomendasi rasio 16:9 (Landscape). Format: JPG, PNG, WEBP.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TOMBOL SIMPAN GLOBAL */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto h-14 px-10 rounded-2xl bg-gradient-to-r from-[#5c3a21] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#36200a] text-white font-black text-lg shadow-[0_8px_20px_rgba(92,58,33,0.25)] transition-all hover:shadow-[0_8px_25px_rgba(92,58,33,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-1" /> Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
