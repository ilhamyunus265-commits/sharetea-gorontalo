"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  TicketPercent,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Promo = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
};

export default function ManajemenPromoPage() {
  const supabase = createClient();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State File Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  const fetchPromos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("promos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPromos(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPromos();
  }, [supabase]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setUploadFile(null);
    setPreviewUrl(null);
    setFormData({ title: "", description: "", image_url: "", is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: Promo) => {
    setEditingId(promo.id);
    setUploadFile(null);
    setPreviewUrl(promo.image_url || null);
    setFormData({
      title: promo.title,
      description: promo.description || "",
      image_url: promo.image_url || "",
      is_active: promo.is_active,
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.image_url;

      if (uploadFile) {
        const fileExt = uploadFile.name.split(".").pop();
        const fileName = `promo-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        // Menggunakan bucket 'products' yang sudah ada agar RLS aman
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, uploadFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const dataToSave = { ...formData, image_url: finalImageUrl };

      if (editingId) {
        const { error } = await supabase
          .from("promos")
          .update(dataToSave)
          .eq("id", editingId);
        if (error) throw error;
        alert("Promo berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("promos").insert([dataToSave]);
        if (error) throw error;
        alert("Promo baru berhasil diterbitkan!");
      }

      setIsModalOpen(false);
      fetchPromos();
    } catch (error: any) {
      alert("Gagal menyimpan promo: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus promo "${title}" secara permanen?`,
      )
    )
      return;
    try {
      const { error } = await supabase.from("promos").delete().eq("id", id);
      if (error) throw error;
      fetchPromos();
    } catch (error: any) {
      alert("Gagal menghapus promo: " + error.message);
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      setPromos(
        promos.map((p) =>
          p.id === id ? { ...p, is_active: !currentStatus } : p,
        ),
      );
      const { error } = await supabase
        .from("promos")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
    } catch (error: any) {
      alert("Gagal merubah status promo.");
      fetchPromos();
    }
  };

  return (
    <div className="min-h-full p-6 md:p-10 bg-[#faf9f8] relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[0%] left-[50%] w-[60%] h-[60%] rounded-full bg-yellow-100/40 blur-[120px] pointer-events-none -translate-x-1/2"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
              Promo & Diskon
            </h1>
            <p className="text-stone-500 font-medium text-lg">
              Buat penawaran menarik untuk meningkatkan penjualan outlet Anda.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="h-12 px-6 rounded-2xl bg-[#5c3a21] hover:bg-[#4a2c0f] text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />{" "}
            <span className="font-bold">Buat Promo Baru</span>
          </Button>
        </div>

        {/* KONTEN UTAMA: GRID PROMO */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/60">
            <Loader2 className="w-10 h-10 animate-spin text-[#5c3a21] mb-4" />
            <p className="text-stone-500 font-bold">Memuat daftar promo...</p>
          </div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="w-20 h-20 bg-stone-100 rounded-[2rem] flex items-center justify-center mb-4">
              <TicketPercent className="w-10 h-10 text-stone-300" />
            </div>
            <p className="text-xl text-stone-800 font-black mb-1">
              Belum Ada Promo
            </p>
            <p className="text-stone-500 font-medium text-sm">
              Tarik perhatian pelanggan dengan membuat promo pertamamu!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className={`flex flex-col bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/60 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 group ${!promo.is_active ? "opacity-75 grayscale-[20%]" : ""}`}
              >
                {/* AREA GAMBAR */}
                <div className="relative h-48 w-full bg-gradient-to-r from-stone-100 to-stone-200 overflow-hidden shrink-0">
                  {promo.image_url ? (
                    <Image
                      src={promo.image_url}
                      alt={promo.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-stone-300" />
                    </div>
                  )}
                  {/* BADGE PROMO */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 backdrop-blur-md border border-white/10 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Spesial
                    </span>
                  </div>
                </div>

                {/* DETAIL TEKS */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-stone-900 leading-tight mb-2 line-clamp-2">
                    {promo.title}
                  </h3>
                  <p className="text-sm font-medium text-stone-500 line-clamp-3 flex-1 mb-4">
                    {promo.description || "Tidak ada syarat dan ketentuan."}
                  </p>
                </div>

                {/* AREA KONTROL (TOGGLE & DELETE) */}
                <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-stone-100/50 mt-auto">
                  {/* TOMBOL TOGGLE MODERN */}
                  <button
                    onClick={() =>
                      toggleAvailability(promo.id, promo.is_active)
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      promo.is_active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${promo.is_active ? "bg-emerald-500" : "bg-stone-400"}`}
                    ></div>
                    {promo.is_active ? "Promo Aktif" : "Selesai"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(promo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Edit Promo"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id, promo.title)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus Promo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL FORM: TAMBAH / EDIT PROMO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col border border-white hide-scrollbar">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-stone-100/50">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  {editingId ? "Edit Promo" : "Buat Promo Baru"}
                </h2>
                <p className="text-sm text-stone-500 font-medium mt-1">
                  Lengkapi banner dan syarat ketentuan.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-8 py-6 space-y-6">
              {/* UPLOAD GAMBAR BANNER */}
              <div className="flex flex-col sm:flex-row gap-6 items-center bg-stone-50/80 p-5 rounded-2xl border border-stone-200/60 shadow-inner">
                <div className="w-32 h-24 rounded-xl bg-white border-2 border-dashed border-stone-300 flex flex-col items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-stone-300" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Foto Banner Promo *
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    required={!editingId && !formData.image_url} // Wajib jika baru buat
                    onChange={handleFileChange}
                    className="h-11 border-stone-200/60 bg-white shadow-sm file:bg-[#5c3a21] file:text-white file:border-0 file:mr-4 file:px-4 file:py-1 file:rounded-md cursor-pointer hover:file:bg-[#4a2c0f] transition-all font-medium text-stone-600"
                  />
                  <p className="text-[11px] font-medium text-stone-400">
                    Rekomendasi format landscape (16:9). JPG, PNG, WEBP.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Judul / Slogan Promo *
                  </Label>
                  <Input
                    required
                    placeholder="Misal: Beli 2 Gratis 1 Milk Tea!"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="h-12 rounded-xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-bold text-stone-800 transition-colors focus:bg-white shadow-inner"
                  />
                </div>

                <div className="space-y-2 flex flex-col justify-end pb-2">
                  <div className="flex items-center gap-3 bg-stone-50/80 p-3 rounded-xl border border-stone-200/60 h-12 shadow-sm">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-[#5c3a21] border-stone-300 rounded focus:ring-[#5c3a21] cursor-pointer"
                    />
                    <Label
                      htmlFor="is_active"
                      className="cursor-pointer font-bold text-stone-700 text-sm"
                    >
                      Langsung Aktifkan Promo Ini
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Deskripsi & Syarat Ketentuan
                  </Label>
                  <textarea
                    rows={4}
                    placeholder="Jelaskan detail promo, cara klaim, atau tanggal berlaku..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="flex w-full rounded-xl border border-stone-200/60 bg-stone-50/50 px-4 py-3 text-sm focus:ring-2 focus:ring-[#5c3a21] focus:bg-white outline-none font-medium text-stone-800 transition-colors shadow-inner resize-none min-h-[100px]"
                  />
                </div>
              </div>

              <div className="pt-6 mt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-12 px-6 rounded-xl border-stone-200 text-stone-600 font-bold w-full sm:w-auto hover:bg-stone-50"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-8 rounded-xl bg-[#5c3a21] hover:bg-[#4a2c0f] text-white font-bold shadow-md transition-all hover:shadow-lg w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5 mr-2" />
                  )}
                  {isSubmitting ? "Menyimpan..." : "Terbitkan Promo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
