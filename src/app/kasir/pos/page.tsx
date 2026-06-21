"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Coffee,
  CreditCard,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { usePosStore, Product } from "@/store/usePosStore";

const categories = ["Semua", "Original", "Alcapone", "Mochi", "Minuman"];

export default function POSPage() {
  const supabase = createClient();

  // State Lokal
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [paymentMethod, setPaymentMethod] = useState<"Tunai" | "QRIS">("Tunai");

  // State Global dari Zustand
  const { cart, addToCart, updateQty, removeFromCart, clearCart } =
    usePosStore();

  // Tarik data produk dari Supabase saat halaman dimuat
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal mengambil produk:", error);
      } else {
        setProducts(data || []);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [supabase]);

  const filteredProducts =
    activeCategory === "Semua"
      ? products
      : products.filter((p) => p.category === activeCategory);

  // Kalkulasi
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * 0.11; // PPN 11%
  const total = subtotal + tax;

  // Fungsi Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Ambil session user (kasir) yang sedang login
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 2. Buat record Order baru
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          kasir_id: user?.id,
          status: "selesai", // Pembelian kasir langsung dianggap selesai
          total_price: total,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Masukkan item belanjaan ke order_items
      const orderItemsData = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.qty,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      alert("Transaksi Berhasil Disimpan ke Database!");
      clearCart();
    } catch (error) {
      console.error("Gagal checkout:", error);
      alert("Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-[#faf9f8] relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/50 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-100/40 blur-[100px] pointer-events-none"></div>

      {/* ========================================== */}
      {/* AREA KIRI: KATALOG PRODUK (65%) */}
      {/* ========================================== */}
      <div className="w-[65%] flex flex-col z-10 p-6 md:p-8">
        <div className="mb-6 shrink-0">
          <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-1">
            Point of Sale
          </h1>
          <p className="text-stone-500 font-medium">
            Pilih menu pesanan pelanggan dengan cepat.
          </p>
        </div>

        {/* FILTER KATEGORI (GLASSMORPHISM PILL) */}
        <div className="mb-6 shrink-0 flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shadow-sm border ${
                activeCategory === cat
                  ? "bg-[#5c3a21] text-white border-[#5c3a21] shadow-md shadow-[#5c3a21]/20 -translate-y-0.5"
                  : "bg-white/70 backdrop-blur-md text-stone-600 border-white hover:bg-white hover:-translate-y-0.5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRID PRODUK */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pr-2 pb-20">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#5c3a21]" />
              <p className="font-bold">Mempersiapkan etalase kasir...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 opacity-60">
              <Coffee className="w-16 h-16 mb-4 text-stone-300" />
              <p className="font-bold text-lg">Menu Kosong</p>
              <p className="text-sm">Belum ada menu di kategori ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => product.stock > 0 && addToCart(product)}
                  className={`relative flex flex-col bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all group ${
                    product.stock === 0
                      ? "opacity-60 grayscale cursor-not-allowed"
                      : "cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-[#5c3a21]/30 active:scale-95"
                  }`}
                >
                  {/* GAMBAR PRODUK */}
                  <div className="relative h-36 w-full bg-stone-100 overflow-hidden shrink-0">
                    <Image
                      src={
                        product.image_url ||
                        "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=300&auto=format&fit=crop"
                      }
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* OVERLAY HABIS */}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <span className="text-white font-black bg-red-500 px-3 py-1.5 rounded-xl text-xs uppercase tracking-widest shadow-lg">
                          Habis
                        </span>
                      </div>
                    )}

                    {/* BADGE SISA STOK */}
                    {product.stock > 0 && product.stock <= 10 && (
                      <Badge className="absolute top-3 right-3 z-10 bg-orange-500 text-white font-bold border-none shadow-sm px-2 py-0.5 rounded-lg">
                        Sisa {product.stock}
                      </Badge>
                    )}
                  </div>

                  {/* DETAIL TEKS */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="font-extrabold text-stone-800 text-sm line-clamp-2 leading-tight mb-2">
                      {product.name}
                    </p>
                    <p className="text-[#5c3a21] font-black text-base">
                      Rp {product.price.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {/* IKON TAMBAH MENGAMBANG (MUNCUL SAAT HOVER) */}
                  {product.stock > 0 && (
                    <div className="absolute bottom-4 right-4 w-8 h-8 bg-[#5c3a21] text-white rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-md">
                      <Plus className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* AREA KANAN: KERANJANG & PEMBAYARAN (35%) */}
      {/* ========================================== */}
      <div className="w-[35%] bg-white/90 backdrop-blur-3xl border-l border-white/50 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.04)] z-20">
        {/* HEADER KERANJANG */}
        <div className="p-6 border-b border-stone-100/50 shrink-0 flex items-center justify-between bg-white/50">
          <h2 className="text-xl font-black text-stone-900 flex items-center gap-3 tracking-tight">
            Keranjang
            <Badge className="bg-[#5c3a21] text-white px-2.5 py-1 rounded-lg shadow-sm border-none font-bold text-sm">
              {cart.length}
            </Badge>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Bersihkan
          </Button>
        </div>

        {/* LIST ITEM KERANJANG */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-70">
              <ShoppingBag className="w-16 h-16 mb-4 text-stone-300" />
              <p className="font-bold text-lg text-stone-500">
                Keranjang Kosong
              </p>
              <p className="text-sm text-center mt-1">
                Silakan pilih menu dari daftar
                <br />
                di sebelah kiri.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col p-4 bg-white rounded-[1.5rem] border border-stone-100 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-extrabold text-stone-800 text-sm leading-tight pr-4">
                      {item.name}
                    </span>
                    <span className="font-black text-[#5c3a21] whitespace-nowrap bg-orange-50 px-2 py-1 rounded-lg text-xs">
                      Rp {(item.price * item.qty).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* KONTROL QUANTITY */}
                    <div className="flex items-center bg-stone-100 rounded-xl p-1 shadow-inner border border-stone-200/50">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-black text-stone-800 w-10 text-center text-sm">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[#5c3a21] rounded-lg shadow-sm text-white hover:bg-[#4a2c0f] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-stone-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER: TOTAL & TOMBOL BAYAR */}
        <div className="bg-white border-t border-stone-100 p-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-30">
          <div className="space-y-2.5 mb-6 bg-stone-50/50 p-4 rounded-[1.5rem] border border-stone-100">
            <div className="flex justify-between text-stone-500 font-medium text-sm">
              <span>Subtotal</span>
              <span className="text-stone-700 font-bold">
                Rp {subtotal.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-stone-500 font-medium text-sm">
              <span>PPN (11%)</span>
              <span className="text-stone-700 font-bold">
                Rp {tax.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between font-black text-2xl text-stone-900 pt-3 border-t border-stone-200/60 mt-2 border-dashed">
              <span>Total</span>
              <span className="text-[#5c3a21]">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              variant="outline"
              className={`h-14 rounded-2xl border-2 transition-all font-bold text-sm ${paymentMethod === "Tunai" ? "border-[#5c3a21] text-[#5c3a21] bg-[#5c3a21]/5 shadow-sm" : "border-stone-200 text-stone-500 hover:bg-stone-50"}`}
              onClick={() => setPaymentMethod("Tunai")}
            >
              <Wallet className="w-5 h-5 mr-2 opacity-70" /> Tunai
            </Button>
            <Button
              variant="outline"
              className={`h-14 rounded-2xl border-2 transition-all font-bold text-sm ${paymentMethod === "QRIS" ? "border-[#5c3a21] text-[#5c3a21] bg-[#5c3a21]/5 shadow-sm" : "border-stone-200 text-stone-500 hover:bg-stone-50"}`}
              onClick={() => setPaymentMethod("QRIS")}
            >
              <CreditCard className="w-5 h-5 mr-2 opacity-70" /> QRIS
            </Button>
          </div>

          <Button
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#5c3a21] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#36200a] text-white font-black text-lg shadow-[0_8px_20px_rgba(92,58,33,0.3)] transition-all hover:shadow-[0_8px_25px_rgba(92,58,33,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Printer className="w-5 h-5 mr-1" /> Cetak & Bayar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
