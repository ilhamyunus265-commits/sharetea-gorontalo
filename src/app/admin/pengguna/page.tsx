"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  UserPlus,
  UserX,
  Loader2,
  Ban,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// 1. Tipe data mendukung status banned
type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "kasir" | "konsumen" | "banned";
  created_at: string;
};

export default function ManajemenPenggunaPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State Modal Tambah Karyawan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "kasir",
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [supabase]);

  // FUNGSI AKSI: TAMBAH KARYAWAN BARU via API
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setIsModalOpen(false);
        setFormData({ name: "", email: "", password: "", role: "kasir" });
        fetchUsers();
      } else {
        alert("Gagal: " + result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNGSI AKSI: PECAT KARYAWAN via API (Khusus Kasir - Hapus Permanen)
  const handleDismissEmployee = async (id: string, name: string) => {
    if (
      !confirm(
        `Peringatan Tegas!\nApakah Anda benar-benar ingin memecat dan menghapus akun "${name}" dari sistem?`,
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        fetchUsers();
      } else {
        alert("Gagal memberhentikan: " + result.message);
      }
    } catch (error) {
      alert("Gagal memproses permintaan.");
    }
  };

  // FUNGSI AKSI BARU: BLOKIR / AKTIFKAN KONSUMEN via API (Soft Ban)
  const handleToggleBan = async (
    id: string,
    name: string,
    newRole: "konsumen" | "banned",
  ) => {
    const actionText =
      newRole === "banned" ? "MEMBLOKIR" : "MENGAKTIFKAN KEMBALI";
    if (
      !confirm(
        `Apakah Anda yakin ingin ${actionText} akun pelanggan "${name}"?`,
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/toggle-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: newRole }),
      });

      const result = await res.json();
      if (result.success) {
        alert(`Akun "${name}" berhasil diperbarui.`);
        fetchUsers();
      } else {
        alert("Gagal mengubah status: " + result.message);
      }
    } catch (error) {
      alert("Gagal memproses permintaan.");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-full p-6 md:p-10 bg-[#faf9f8] relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS (GLASSMORPHISM VIBE) */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-100/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
              Daftar Pengguna
            </h1>
            <p className="text-stone-500 font-medium text-lg">
              Kelola data staf dan pantau pelanggan outlet Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
            {/* SEARCH BAR MODERN MENGAMBANG */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-stone-400 group-focus-within:text-[#5c3a21] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full sm:w-72 pl-12 pr-4 py-3 bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl text-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#5c3a21]/20 focus:bg-white transition-all font-medium text-stone-700 placeholder:text-stone-400"
              />
            </div>

            {/* TOMBOL TAMBAH STAF */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-[50px] px-6 rounded-2xl bg-[#5c3a21] hover:bg-[#4a2c0f] text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <UserPlus className="w-5 h-5 mr-2" />{" "}
              <span className="font-bold">Tambah Staf</span>
            </Button>
          </div>
        </div>

        {/* TABEL PENGGUNA (GLASSMORPHISM CARD) */}
        <Card className="rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30">
                      Nama Profil
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30">
                      Email Akun
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30">
                      Bergabung
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30 text-center">
                      Status
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30 text-right">
                      Otoritas Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#5c3a21]" />
                        <p className="text-stone-400 font-medium text-sm">
                          Memuat daftar pengguna...
                        </p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search className="w-8 h-8 text-stone-300" />
                        </div>
                        <p className="text-stone-400 font-medium text-sm">
                          Tidak ditemukan data pengguna yang cocok.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-white/40 transition-colors group"
                      >
                        {/* KOLOM NAMA & AVATAR PASTEL */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-105 shrink-0 ${
                                user.role === "admin"
                                  ? "bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700"
                                  : user.role === "kasir"
                                    ? "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700"
                                    : user.role === "banned"
                                      ? "bg-gradient-to-br from-red-100 to-red-50 text-red-700"
                                      : "bg-gradient-to-br from-stone-100 to-stone-50 text-stone-600"
                              }`}
                            >
                              {user.name
                                ? user.name.substring(0, 2).toUpperCase()
                                : "ST"}
                            </div>
                            <div>
                              <p
                                className={`font-extrabold text-sm mb-0.5 ${user.role === "banned" ? "text-red-700 line-through opacity-70" : "text-stone-800"}`}
                              >
                                {user.name}
                              </p>
                              {user.role === "admin" && (
                                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">
                                  Pemilik Utama
                                </p>
                              )}
                              {user.role === "kasir" && (
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                  Staf Internal
                                </p>
                              )}
                              {user.role === "konsumen" && (
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                  Pelanggan
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-5 text-sm font-medium text-stone-500">
                          {user.email}
                        </td>

                        <td className="px-8 py-5 text-sm font-medium text-stone-500">
                          {new Date(user.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </td>

                        {/* KOLOM BADGE STATUS SOFT */}
                        <td className="px-8 py-5 text-center">
                          {user.role === "admin" && (
                            <Badge className="bg-purple-50 text-purple-700 shadow-none border border-purple-100/50 font-bold px-3 py-1 rounded-lg">
                              Admin
                            </Badge>
                          )}
                          {user.role === "kasir" && (
                            <Badge className="bg-blue-50 text-blue-700 shadow-none border border-blue-100/50 font-bold px-3 py-1 rounded-lg">
                              Kasir
                            </Badge>
                          )}
                          {user.role === "konsumen" && (
                            <Badge className="bg-stone-100 text-stone-600 shadow-none border border-stone-200/50 font-bold px-3 py-1 rounded-lg">
                              Aktif
                            </Badge>
                          )}
                          {user.role === "banned" && (
                            <Badge className="bg-red-50 text-red-700 shadow-none border border-red-100/50 font-bold px-3 py-1 rounded-lg">
                              Diblokir
                            </Badge>
                          )}
                        </td>

                        {/* KOLOM AKSI */}
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end">
                            {user.role === "admin" ? (
                              <span className="text-xs text-stone-400 font-bold flex items-center gap-1.5 px-3 py-2 bg-stone-50 rounded-xl border border-stone-100">
                                <ShieldAlert className="w-3.5 h-3.5" /> Terkunci
                              </span>
                            ) : user.role === "kasir" ? (
                              <Button
                                onClick={() =>
                                  handleDismissEmployee(user.id, user.name)
                                }
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl transition-all h-9 px-4"
                              >
                                <UserX className="w-4 h-4 mr-1.5" /> Pecat
                                Karyawan
                              </Button>
                            ) : user.role === "konsumen" ? (
                              <Button
                                onClick={() =>
                                  handleToggleBan(user.id, user.name, "banned")
                                }
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-bold rounded-xl transition-all h-9 px-4"
                              >
                                <Ban className="w-4 h-4 mr-1.5" /> Blokir Akun
                              </Button>
                            ) : (
                              <Button
                                onClick={() =>
                                  handleToggleBan(
                                    user.id,
                                    user.name,
                                    "konsumen",
                                  )
                                }
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold rounded-xl transition-all h-9 px-4"
                              >
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Buka
                                Blokir
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODAL FORM: PENDAFTARAN STAF BARU (GLASSMORPHISM) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Registrasi Staf
                </h2>
                <p className="text-sm text-stone-500 font-medium mt-1">
                  Tambahkan akses untuk kasir baru.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="px-8 pb-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Nama Lengkap
                </Label>
                <Input
                  required
                  placeholder="Misal: Budi Santoso"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-12 rounded-xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-medium transition-colors focus:bg-white shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Email Kerja
                </Label>
                <Input
                  required
                  type="email"
                  placeholder="kasir@sharetea.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-12 rounded-xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-medium transition-colors focus:bg-white shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Kata Sandi Default
                </Label>
                <Input
                  required
                  type="password"
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-12 rounded-xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-medium transition-colors focus:bg-white shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Penempatan Posisi
                </Label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="flex h-12 w-full rounded-xl border border-stone-200/60 bg-stone-50/50 px-4 py-2 text-sm focus:ring-2 focus:ring-[#5c3a21] focus:bg-white outline-none font-medium transition-colors shadow-inner"
                >
                  <option value="kasir">Kasir Outlet (POS)</option>
                  <option value="admin">Manajer (Admin Utama)</option>
                </select>
              </div>

              <div className="pt-4 mt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-[#5c3a21] hover:bg-[#4a2c0f] text-white font-bold shadow-md transition-all hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    "Daftarkan Akun"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
