"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  Clock,
  Loader2,
  LogOut,
  Home,
  Store,
  Edit2,
  Save,
  X,
  History,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Order = {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  order_items: {
    quantity: number;
    products: { name: string } | null;
  }[];
};

export default function ProfilPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const loadProfileData = async () => {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", user.id)
        .single();

      // SATPAM PROFIL: Cek daftar hitam
      if (profile?.role === "banned") {
        await supabase.auth.signOut();
        alert("Akses ditolak! Akun ini telah diblokir.");
        router.push("/");
        router.refresh();
        return;
      }

      setUser(user);
      if (profile) {
        setProfileName(profile.name || "Pelanggan Sharetea");
        setNewName(profile.name || "");
      }

      const { data: orderData, error } = await supabase
        .from("orders")
        .select(
          `
          id, total_price, status, created_at,
          order_items ( quantity, products ( name ) )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && orderData) {
        setOrders(orderData as unknown as Order[]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProfileData();
  }, [supabase]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return alert("Nama tidak boleh kosong!");
    setIsSavingName(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({ name: newName })
        .eq("id", user.id);

      if (error) throw error;

      setProfileName(newName);
      setIsEditing(false);
    } catch (error: any) {
      alert("Gagal memperbarui profil: " + error.message);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari akun Anda?")) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (error: any) {
      alert("Gagal keluar: " + error.message);
    }
  };

  // Helper Status Badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge className="bg-red-50 text-red-700 shadow-none border border-red-100/50 font-bold px-3 py-1 rounded-xl">
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Menunggu
          </Badge>
        );
      case "diproses":
        return (
          <Badge className="bg-orange-50 text-orange-700 shadow-none border border-orange-100/50 font-bold px-3 py-1 rounded-xl">
            <ChefHat className="w-3.5 h-3.5 mr-1.5" /> Disiapkan
          </Badge>
        );
      case "selesai":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 shadow-none border border-emerald-100/50 font-bold px-3 py-1 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Selesai
          </Badge>
        );
      default:
        return (
          <Badge className="rounded-xl px-3 py-1 capitalize">{status}</Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f8]">
        <div className="w-16 h-16 relative flex items-center justify-center bg-white rounded-2xl shadow-xl mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-[#5c3a21]" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">Memuat Profil...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f8] p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-orange-100/60 blur-[100px] pointer-events-none"></div>
        <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white p-8 text-center relative z-10">
          <div className="w-20 h-20 bg-stone-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 mb-2 tracking-tight">
            Akses Terkunci
          </h2>
          <p className="text-stone-500 font-medium mb-8">
            Silakan masuk ke akun Anda terlebih dahulu untuk melihat riwayat dan
            profil.
          </p>
          <Link
            href="/login"
            className="flex items-center justify-center w-full bg-gradient-to-r from-[#5c3a21] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#36200a] text-white font-black py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(92,58,33,0.25)] hover:shadow-[0_8px_25px_rgba(92,58,33,0.35)] hover:-translate-y-0.5"
          >
            Masuk Sekarang
          </Link>
          <Link
            href="/"
            className="inline-block mt-6 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f8] font-sans flex flex-col relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-orange-100/40 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-yellow-100/30 blur-[100px] pointer-events-none"></div>

      {/* HEADER / NAVBAR (GLASSMORPHISM) */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/60 sticky top-0 z-40 shadow-[0_4px_30px_rgb(0,0,0,0.03)]">
        <div className="container mx-auto px-6 h-[72px] flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5c3a21] to-[#4a2c0f] flex items-center justify-center shadow-md shadow-[#5c3a21]/20 text-white transition-transform group-hover:scale-105">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-stone-900">
              Sharetea
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-stone-600 bg-white/80 border border-stone-200/60 shadow-sm px-5 py-2.5 rounded-xl hover:bg-stone-50 hover:text-stone-900 transition-all"
          >
            <Home className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">Pesan Lagi</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-6xl flex-1 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* ============================================== */}
          {/* KOLOM KIRI: KARTU PROFIL PENGGUNA */}
          {/* ============================================== */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Header Kartu Profil */}
              <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 p-8 text-center border-b border-stone-100/50 relative">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-[#5c3a21] text-white border-none shadow-sm font-bold uppercase tracking-widest text-[10px] px-2.5 py-1">
                    Member
                  </Badge>
                </div>
                <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-[#5c3a21] to-orange-700 text-white flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-xl shadow-[#5c3a21]/20">
                  {profileName.substring(0, 2).toUpperCase()}
                </div>
                {!isEditing ? (
                  <div className="flex items-center justify-center gap-2 group">
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight leading-tight">
                      {profileName}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-stone-400 hover:text-[#5c3a21] hover:bg-orange-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Ubah Nama"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSaveName}
                    className="flex flex-col gap-2 mt-2 animate-in fade-in zoom-in duration-200"
                  >
                    <Input
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-11 rounded-xl bg-white border-stone-200 focus-visible:ring-[#5c3a21] font-bold text-center shadow-sm"
                      placeholder="Ketik nama baru"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setNewName(profileName);
                        }}
                        className="flex-1 h-10 rounded-xl text-stone-500 font-bold border-stone-200"
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSavingName}
                        className="flex-1 h-10 rounded-xl bg-[#5c3a21] hover:bg-[#4a2c0f] text-white font-bold shadow-md"
                      >
                        {isSavingName ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          "Simpan"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
                <p className="text-sm font-medium text-stone-500 mt-1">
                  {user.email}
                </p>
              </div>

              {/* Aksi Bawah */}
              <div className="p-6 bg-white">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full h-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-all shadow-none font-bold flex items-center justify-center gap-2 group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
                  Keluar Akun
                </Button>
              </div>
            </div>
          </div>

          {/* ============================================== */}
          {/* KOLOM KANAN: DAFTAR RIWAYAT TRANSAKSI */}
          {/* ============================================== */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Riwayat Pesanan
                </h2>
                <p className="text-sm font-medium text-stone-500">
                  Pantau status hidangan yang Anda pesan.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-stone-100 p-16 text-center shadow-sm flex flex-col items-center">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-stone-300" />
                  </div>
                  <h3 className="text-lg font-black text-stone-800 mb-1">
                    Belum Ada Pesanan
                  </h3>
                  <p className="text-stone-500 font-medium text-sm mb-6">
                    Sepertinya Anda belum pernah memesan Sharetea. Yuk, coba
                    sekarang!
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center bg-[#5c3a21] hover:bg-[#4a2c0f] text-white font-bold h-12 px-8 rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Pesan Sharetea &rarr;
                  </Link>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group"
                  >
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between gap-6">
                      {/* Bagian Info (Kiri) */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center flex-wrap gap-3">
                          <span className="font-mono font-black text-stone-800 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200/60 text-sm">
                            #{order.id.split("-")[0].toUpperCase()}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>

                        <div className="text-sm font-medium text-stone-500 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-stone-400" />
                          {new Date(order.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}{" "}
                          •{" "}
                          {new Date(order.created_at).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>

                        {/* List Item Pesanan (Pills) */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {order.order_items.map((i, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-xs font-bold bg-stone-50 border border-stone-200/60 px-2.5 py-1.5 rounded-lg text-stone-700"
                            >
                              <span className="text-[#5c3a21] mr-1.5 bg-orange-100 px-1.5 py-0.5 rounded-md">
                                {i.quantity}x
                              </span>{" "}
                              {i.products?.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bagian Total Harga (Kanan) */}
                      <div className="sm:text-right flex flex-col justify-center shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-stone-100 border-dashed">
                        <p className="text-[10px] text-stone-400 font-extrabold uppercase tracking-widest mb-1">
                          Total Pembayaran
                        </p>
                        <p className="font-black text-2xl text-[#5c3a21] tracking-tight">
                          Rp {order.total_price.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
