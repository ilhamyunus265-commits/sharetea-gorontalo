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
  Search,
  UploadCloud,
  PackageX,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
  is_available: boolean;
};

const categories = [
  "Fresh Milk",
  "Fruit Tea",
  "Hot Series",
  "Rocksalt & Cheese",
  "Sundae Series",
  "Dessert",
  "Snack",
];

export default function ManajemenProdukPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State untuk menampung file gambar fisik
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Fresh Milk",
    price: 0,
    stock: 0,
    image_url: "",
    description: "",
    is_available: true,
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [supabase]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setUploadFile(null);
    setPreviewUrl(null);
    setFormData({
      name: "",
      category: "Fresh Milk",
      price: 0,
      stock: 0,
      image_url: "",
      description: "",
      is_available: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id);
    setUploadFile(null);
    setPreviewUrl(product.image_url || null);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || "",
      description: product.description || "",
      is_available: product.is_available,
    });
    setIsModalOpen(true);
  };

  // FUNGSI HANDLE FILE SAAT DIPILIH
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // FUNGSI SIMPAN (DENGAN UPLOAD GAMBAR)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.image_url;

      if (uploadFile) {
        const fileExt = uploadFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `katalog/${fileName}`;

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
          .from("products")
          .update(dataToSave)
          .eq("id", editingId);
        if (error) throw error;
        alert("Produk berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("products").insert([dataToSave]);
        if (error) throw error;
        alert("Produk baru berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      fetchProducts();
    } catch (error: any) {
      alert("Gagal menghapus: " + error.message);
    }
  };

  // FUNGSI TOGGLE KETERSEDIAAN CEPAT
  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      setProducts(
        products.map((p) =>
          p.id === id ? { ...p, is_available: !currentStatus } : p,
        ),
      );
      const { error } = await supabase
        .from("products")
        .update({ is_available: !currentStatus })
        .eq("id", id);
      if (error) throw error;
    } catch (error: any) {
      alert("Gagal merubah status ketersediaan.");
      fetchProducts();
    }
  };

  // FILTER DATA (Search & Category)
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      filterCategory === "Semua" ? true : p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-full p-6 md:p-10 bg-[#faf9f8] relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[0%] left-[50%] w-[60%] h-[60%] rounded-full bg-orange-100/40 blur-[120px] pointer-events-none -translate-x-1/2"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
              Katalog Menu
            </h1>
            <p className="text-stone-500 font-medium text-lg">
              Atur etalase, tambah menu baru, dan upload foto produk.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="h-12 px-6 rounded-2xl bg-[#5c3a21] hover:bg-[#4a2c0f] text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />{" "}
            <span className="font-bold">Tambah Produk Baru</span>
          </Button>
        </div>

        {/* SEARCH & KATEGORI FILTER (GLASSMORPHISM BAR) */}
        <div className="p-4 mb-8 rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* SEARCH BAR */}
          <div className="relative group w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400 group-focus-within:text-[#5c3a21] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Cari nama produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-white/50 border border-stone-200/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5c3a21]/20 focus:bg-white transition-all font-medium text-stone-700 placeholder:text-stone-400"
            />
          </div>

          {/* FILTER SEGMENTED CONTROL */}
          <div className="flex gap-1.5 bg-stone-100/50 p-1.5 rounded-2xl overflow-x-auto w-full lg:w-auto hide-scrollbar">
            {["Semua", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                  filterCategory === cat
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700 hover:bg-white/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* KONTEN UTAMA: GRID PRODUK */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/60">
            <Loader2 className="w-10 h-10 animate-spin text-[#5c3a21] mb-4" />
            <p className="text-stone-500 font-bold">Memuat rak etalase...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="w-20 h-20 bg-stone-100 rounded-[2rem] flex items-center justify-center mb-4">
              <PackageX className="w-10 h-10 text-stone-300" />
            </div>
            <p className="text-xl text-stone-800 font-black mb-1">
              Produk Tidak Ditemukan
            </p>
            <p className="text-stone-500 font-medium text-sm">
              Belum ada menu di kategori ini atau pencarian tidak cocok.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`flex flex-col bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/60 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 group ${!product.is_available ? "opacity-75 grayscale-[20%]" : ""}`}
              >
                {/* AREA GAMBAR */}
                <div className="relative h-48 w-full bg-stone-100 overflow-hidden shrink-0">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                      <ImageIcon className="w-10 h-10 text-stone-300" />
                    </div>
                  )}
                  {/* BADGE KATEGORI */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-white/90 backdrop-blur-md text-stone-800 hover:bg-white shadow-sm border-none font-bold px-3 py-1 rounded-xl">
                      {product.category}
                    </Badge>
                  </div>
                </div>

                {/* DETAIL TEKS */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <h3 className="text-lg font-black text-stone-900 leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    <Badge
                      className={`shrink-0 shadow-none border-none ${product.stock <= 5 ? "bg-red-50 text-red-600" : "bg-stone-100 text-stone-600"}`}
                    >
                      Stok: {product.stock}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-stone-500 line-clamp-2 mb-4 flex-1">
                    {product.description || "Tidak ada deskripsi."}
                  </p>
                  <div className="text-xl font-black text-[#5c3a21]">
                    Rp {product.price.toLocaleString("id-ID")}
                  </div>
                </div>

                {/* AREA KONTROL (TOGGLE & EDIT/DELETE) */}
                <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-stone-100/50 mt-auto">
                  {/* TOMBOL TOGGLE STATUS */}
                  <button
                    onClick={() =>
                      toggleAvailability(product.id, product.is_available)
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      product.is_available
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${product.is_available ? "bg-emerald-500" : "bg-stone-400"}`}
                    ></div>
                    {product.is_available ? "Aktif" : "Habis"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Edit Menu"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus Menu"
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

      {/* MODAL FORM: TAMBAH / EDIT PRODUK BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col border border-white hide-scrollbar">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-stone-100/50">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  {editingId ? "Edit Produk" : "Tambah Produk Baru"}
                </h2>
                <p className="text-sm text-stone-500 font-medium mt-1">
                  Lengkapi data produk untuk etalase.
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
              {/* UPLOAD GAMBAR SECTION MODERN */}
              <div className="flex flex-col sm:flex-row gap-6 items-center bg-stone-50/80 p-5 rounded-2xl border border-stone-200/60 shadow-inner">
                <div className="w-28 h-28 rounded-xl bg-white border-2 border-dashed border-stone-300 flex flex-col items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
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
                    Foto Produk Asli (Opsional)
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="h-11 border-stone-200/60 bg-white shadow-sm file:bg-[#5c3a21] file:text-white file:border-0 file:mr-4 file:px-4 file:py-1 file:rounded-md cursor-pointer hover:file:bg-[#4a2c0f] transition-all font-medium text-stone-600"
                  />
                  <p className="text-[11px] font-medium text-stone-400">
                    Abaikan jika tidak ingin mengubah foto. Format: JPG, PNG,
                    WEBP.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Nama Produk *
                  </Label>
                  <Input
                    required
                    placeholder="Misal: Alcapone Ring"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-12 rounded-xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-bold text-stone-800 transition-colors focus:bg-white shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Kategori *
                  </Label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="flex h-12 w-full rounded-xl border border-stone-200/60 bg-stone-50/50 px-4 py-2 text-sm focus:ring-2 focus:ring-[#5c3a21] focus:bg-white outline-none font-bold text-stone-800 transition-colors shadow-inner appearance-none relative"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundPosition: `right 12px center`,
                      backgroundRepeat: `no-repeat`,
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Harga (Rp) *
                  </Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    placeholder="25000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="h-12 rounded-xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-bold text-stone-800 transition-colors focus:bg-white shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Stok Fisik *
                  </Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: Number(e.target.value),
                      })
                    }
                    className="h-12 rounded-xl bg-stone-50/50 border-stone-200/60 focus-visible:ring-[#5c3a21] font-bold text-stone-800 transition-colors focus:bg-white shadow-inner"
                  />
                </div>

                <div className="space-y-2 flex flex-col justify-end pb-2">
                  <div className="flex items-center gap-3 bg-stone-50/80 p-3 rounded-xl border border-stone-200/60 h-12 shadow-sm">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_available: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-[#5c3a21] border-stone-300 rounded focus:ring-[#5c3a21] cursor-pointer"
                    />
                    <Label
                      htmlFor="is_available"
                      className="cursor-pointer font-bold text-stone-700 text-sm"
                    >
                      Aktif di Etalase
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Deskripsi Singkat
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="Ceritakan kelezatan menu ini..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="flex w-full rounded-xl border border-stone-200/60 bg-stone-50/50 px-4 py-3 text-sm focus:ring-2 focus:ring-[#5c3a21] focus:bg-white outline-none font-medium text-stone-800 transition-colors shadow-inner resize-none min-h-[80px]"
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
