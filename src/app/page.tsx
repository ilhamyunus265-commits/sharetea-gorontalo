"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Store,
  User,
  Loader2,
  Image as ImageIcon,
  Coffee,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
  description: string;
};

type Promo = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function BerandaPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activePromos, setActivePromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [activeTab, setActiveTab] = useState("HOME");

  // STATE BARU: Untuk menyimpan URL Banner Home dari Tabel Settings
  const [homeBanner, setHomeBanner] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // 1. CEK USER & SATPAM
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role === "banned") {
          await supabase.auth.signOut();
          setUser(null);
          alert("Sesi Anda ditutup karena akun ini telah diblokir oleh Admin.");
        } else {
          setUser(user);
        }
      }

      // 2. TARIK DATA PRODUK
      const { data: produkData } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });
      if (produkData) setProducts(produkData);

      // 3. TARIK DATA PROMO AKTIF
      const { data: promoData } = await supabase
        .from("promos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (promoData) setActivePromos(promoData);

      // 4. TARIK BACKGROUND HERO
      const { data: settingsData } = await supabase
        .from("settings")
        .select("home_banner_url")
        .eq("id", 1)
        .single();
      if (settingsData && settingsData.home_banner_url) {
        setHomeBanner(settingsData.home_banner_url);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [supabase]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === id) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== id));
  };

  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!user) {
      alert("Silakan Masuk (Login) terlebih dahulu untuk membuat pesanan.");
      router.push("/login");
      return;
    }

    setIsCheckingOut(true);

    try {
      const { data: cekProfil } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (cekProfil?.role === "banned") {
        await supabase.auth.signOut();
        setUser(null);
        setIsCartOpen(false);
        alert("Transaksi ditolak secara paksa! Akun Anda telah diblokir.");
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,
            total_price: totalCartPrice,
            status: "pending",
            payment_method: "Bayar di Gerai",
          },
        ])
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) throw itemsError;

      setCart([]);
      setIsCartOpen(false);
      alert(
        "Pesanan berhasil dikirim ke dapur! Silakan cek status pesanan di halaman Profil Anda.",
      );
      router.push("/profil");
    } catch (error: any) {
      alert("Gagal membuat pesanan: " + error.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const scrollToSection = (id: string, tabName: string) => {
    setActiveTab(tabName);
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] font-sans relative overflow-hidden flex flex-col">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-orange-200/30 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-yellow-200/20 blur-[100px] pointer-events-none z-0"></div>

      {/* HEADER NAVIGASI (GLASSMORPHISM) */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/60 sticky top-0 z-40 shadow-[0_4px_30px_rgb(0,0,0,0.03)] transition-all">
        <div className="container mx-auto px-6 h-[76px] flex items-center justify-between max-w-7xl">
          <Link
            href="/"
            onClick={() => scrollToSection("top", "HOME")}
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#5c3a21] to-[#4a2c0f] flex items-center justify-center shadow-lg shadow-[#5c3a21]/20 text-white transition-transform group-hover:scale-105">
              <Store className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-stone-900 leading-none">
              Sharetea
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-stone-100/60 p-1.5 rounded-2xl border border-stone-200/50">
            <button
              onClick={() => scrollToSection("top", "HOME")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === "HOME" ? "bg-white text-[#5c3a21] shadow-sm scale-100" : "text-stone-500 hover:text-stone-800"}`}
            >
              HOME
            </button>
            <button
              onClick={() => scrollToSection("promo-section", "PROMO")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === "PROMO" ? "bg-white text-[#5c3a21] shadow-sm scale-100" : "text-stone-500 hover:text-stone-800"}`}
            >
              PROMO
            </button>
            <button
              onClick={() => scrollToSection("menu-section", "MENU")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === "MENU" ? "bg-white text-[#5c3a21] shadow-sm scale-100" : "text-stone-500 hover:text-stone-800"}`}
            >
              MENU
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Link
                href="/profil"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-stone-600 hover:text-stone-900 hover:bg-white/60 transition-all border border-transparent hover:border-white shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden sm:inline">Profil Saya</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-bold text-[#5c3a21] bg-[#5c3a21]/10 px-5 py-2.5 rounded-xl hover:bg-[#5c3a21]/20 transition-colors shadow-sm"
              >
                Masuk / Daftar
              </Link>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-white border border-stone-100 rounded-xl text-stone-600 hover:text-[#5c3a21] hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[11px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION DINAMIS */}
      <section
        className="relative pt-24 pb-28 px-6 z-10 text-center flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundImage: homeBanner ? `url(${homeBanner})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {homeBanner && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[4px] z-0"></div>
        )}

        <div className="relative z-10 flex flex-col items-center">
          <Badge className="bg-orange-100 text-orange-700 shadow-none border-none font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest text-[10px]">
            Pemesanan Online Hadir!
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-stone-900 tracking-tight leading-[1.1] mb-6 max-w-3xl">
            Temukan Rasa <br />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5c3a21] to-orange-600">
              Favoritmu Disini.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-stone-600 font-medium max-w-2xl mb-10">
            Pesan minuman dan kudapan lezat secara online. Ambil pesananmu di
            gerai Sharetea tanpa perlu antri panjang.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => scrollToSection("menu-section", "MENU")}
              className="h-14 px-8 rounded-2xl bg-[#5c3a21] hover:bg-[#4a2c0f] text-white font-black text-base shadow-[0_8px_20px_rgba(92,58,33,0.25)] hover:shadow-[0_8px_25px_rgba(92,58,33,0.35)] transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              Lihat Menu <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION PROMO DINAMIS (KINI KOTAK-KOTAK SEPERTI MENU) */}
      {activePromos.length > 0 && (
        <section
          id="promo-section"
          className="container mx-auto px-6 mb-12 max-w-7xl relative z-10 scroll-mt-24 mt-12"
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-stone-200/60">
            <div className="p-2.5 bg-yellow-100 text-yellow-600 rounded-xl">
              <TicketPercent className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">
              Promo Spesial
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activePromos.map((promo) => (
              <div
                key={promo.id}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 group flex flex-col"
              >
                {/* GAMBAR PROMO */}
                <div className="relative h-56 w-full bg-stone-100 overflow-hidden shrink-0">
                  {promo.image_url ? (
                    <Image
                      src={promo.image_url}
                      alt={promo.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-300" />
                  )}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-white/90 backdrop-blur-md text-stone-800 hover:bg-white border-none shadow-sm font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />{" "}
                      Spesial
                    </Badge>
                  </div>
                </div>

                {/* DETAIL & TOMBOL */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-stone-900 line-clamp-2 leading-tight mb-2">
                    {promo.title}
                  </h3>
                  <p className="text-sm font-medium text-stone-500 line-clamp-3 mb-6 flex-1">
                    {promo.description}
                  </p>

                  <div className="mt-auto">
                    <Button
                      onClick={() => scrollToSection("menu-section", "MENU")}
                      className="w-full h-11 rounded-xl bg-stone-100 hover:bg-[#5c3a21] text-[#5c3a21] hover:text-white transition-all shadow-sm font-bold group-hover:bg-[#5c3a21] group-hover:text-white group-hover:shadow-[0_4px_15px_rgba(92,58,33,0.3)]"
                    >
                      Gunakan Promo
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KATALOG MENU */}
      <main
        id="menu-section"
        className="container mx-auto px-6 pb-24 max-w-7xl relative z-10 scroll-mt-24 mt-8"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200/60">
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">
            Pilihan Menu
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white">
            <Loader2 className="w-12 h-12 animate-spin text-[#5c3a21] mb-4" />
            <p className="text-stone-500 font-bold text-lg">
              Memuat menu spesial kami...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center">
            <div className="w-20 h-20 bg-stone-100 rounded-[1.5rem] flex items-center justify-center mb-5">
              <Coffee className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-2xl font-black text-stone-800 mb-2">
              Menu Kosong
            </h3>
            <p className="text-stone-500 font-medium">
              Mohon maaf, belum ada menu yang tersedia untuk saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 group flex flex-col"
              >
                <div className="relative h-56 w-full bg-stone-100 overflow-hidden shrink-0">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-300" />
                  )}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-white/90 backdrop-blur-md text-stone-800 hover:bg-white border-none shadow-sm font-bold px-3 py-1 rounded-xl">
                      {product.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-stone-900 line-clamp-2 leading-tight mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm font-medium text-stone-500 line-clamp-2 mb-6 flex-1">
                    {product.description ||
                      "Racikan spesial yang wajib Anda coba."}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-black text-2xl text-[#5c3a21] tracking-tight">
                      <span className="text-sm font-bold text-stone-400 mr-1">
                        Rp
                      </span>
                      {product.price.toLocaleString("id-ID")}
                    </span>
                    <Button
                      onClick={() => addToCart(product)}
                      className="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-[#5c3a21] text-[#5c3a21] hover:text-white transition-all shadow-sm group-hover:bg-[#5c3a21] group-hover:text-white group-hover:shadow-[0_4px_15px_rgba(92,58,33,0.3)]"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DRAWER KERANJANG BELANJA */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-md bg-[#faf9f8] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 sm:rounded-l-[2rem] border-l border-white/60 overflow-hidden relative">
            <div className="p-6 pb-4 border-b border-stone-200/60 flex items-center justify-between bg-white/70 backdrop-blur-md shrink-0 sticky top-0 z-10">
              <h2 className="text-2xl font-black text-stone-900 flex items-center gap-3 tracking-tight">
                Keranjang
                <Badge className="bg-[#5c3a21] text-white px-2.5 py-1 rounded-lg shadow-sm border-none font-bold text-sm">
                  {cart.length}
                </Badge>
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-white rounded-full transition-colors shadow-sm border border-transparent hover:border-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar relative z-0">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-80">
                  <ShoppingBag className="w-20 h-20 mb-4 text-stone-300" />
                  <p className="font-bold text-xl text-stone-800 mb-1">
                    Keranjang Kosong
                  </p>
                  <p className="text-sm font-medium">
                    Silakan tambahkan menu terlebih dahulu.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsCartOpen(false)}
                    className="mt-6 rounded-xl border-[#5c3a21] text-[#5c3a21] hover:bg-[#5c3a21] hover:text-white font-bold h-11 px-6"
                  >
                    Lihat Menu
                  </Button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-4 bg-white border border-stone-100 rounded-2xl shadow-sm relative group"
                  >
                    <div className="w-20 h-20 rounded-[1rem] bg-stone-100 relative overflow-hidden shrink-0">
                      {item.product.image_url ? (
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-300" />
                      )}
                    </div>

                    <div className="flex-1 pr-6">
                      <h4 className="font-extrabold text-sm text-stone-800 leading-tight mb-1.5 line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-[#5c3a21] font-black text-sm mb-3">
                        Rp {item.product.price.toLocaleString("id-ID")}
                      </p>

                      <div className="flex items-center gap-1 bg-stone-100 w-fit rounded-xl p-1 shadow-inner border border-stone-200/50">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-stone-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black w-6 text-center text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white shadow-sm rounded-lg transition-all text-stone-900 font-bold hover:text-[#5c3a21]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="absolute top-4 right-4 text-stone-300 hover:text-red-500 bg-white hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white/90 backdrop-blur-xl border-t border-stone-200/60 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] shrink-0 sticky bottom-0 z-10">
                <div className="flex justify-between items-end mb-5">
                  <span className="text-stone-500 font-bold text-sm uppercase tracking-wider">
                    Total Belanja
                  </span>
                  <span className="text-3xl font-black text-stone-900 tracking-tight">
                    <span className="text-lg font-bold text-stone-400 mr-1">
                      Rp
                    </span>
                    {totalCartPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#5c3a21] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#36200a] text-white font-black text-lg shadow-[0_8px_20px_rgba(92,58,33,0.25)] transition-all hover:shadow-[0_8px_25px_rgba(92,58,33,0.35)] hover:-translate-y-0.5"
                >
                  {isCheckingOut ? (
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  ) : (
                    "Buat Pesanan"
                  )}
                </Button>
                {!user && (
                  <p className="text-[11px] font-bold text-center text-red-500 mt-3 bg-red-50 py-1.5 rounded-lg">
                    Silakan masuk (login) terlebih dahulu untuk memesan.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
