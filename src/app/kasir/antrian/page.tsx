"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, CheckCircle2, InboxIcon, Coffee } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

// Tipe data berdasarkan struktur query Join Supabase
type OrderItem = {
  quantity: number;
  products: {
    name: string;
  } | null;
};

type Order = {
  id: string;
  status: "pending" | "diproses" | "selesai";
  total_price: number;
  created_at: string;
  payment_method: string;
  order_items: OrderItem[];
};

export default function AntrianPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk menarik data dari database
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_price,
        created_at,
        payment_method,
        order_items (
          quantity,
          products ( name )
        )
      `,
      )
      .neq("status", "selesai") // Sembunyikan yang sudah selesai dari antrian
      .order("created_at", { ascending: true }); // Antrian terlama di atas

    if (!error && data) {
      setOrders(data as unknown as Order[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // 1. Tarik data awal saat halaman dimuat
    fetchOrders();

    // 2. BERLANGGANAN REALTIME KE TABEL ORDERS
    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Ada perubahan di tabel order!", payload);
          // Tarik ulang data terbaru secara otomatis
          fetchOrders();
        },
      )
      .subscribe();

    // Bersihkan langganan saat komponen ditutup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Fungsi mengubah status pesanan
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Gagal mengupdate status!");
      console.error(error);
    }
  };

  // Pisahkan order berdasarkan status
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const processingOrders = orders.filter((o) => o.status === "diproses");

  // Helper format jam (contoh: 14:30)
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#faf9f8]">
        <div className="w-16 h-16 relative flex items-center justify-center bg-white rounded-2xl shadow-xl mb-6">
          <Coffee className="w-8 h-8 animate-pulse text-[#5c3a21]" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">
          Menyiapkan Dapur...
        </h2>
        <p className="text-stone-500 font-medium mt-1">
          Sinkronisasi antrian real-time
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full h-[calc(100vh-64px)] flex flex-col bg-[#faf9f8] relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-red-100/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-orange-100/40 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full">
        {/* HEADER PAGE */}
        <div className="mb-8 shrink-0">
          <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
            Antrian Dapur
          </h1>
          <p className="text-stone-500 font-medium text-lg">
            Pantau dan proses pesanan yang masuk secara real-time.
          </p>
        </div>

        {/* KANBAN BOARD */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
          {/* ============================================================ */}
          {/* KOLOM 1: PENDING (BARU MASUK) */}
          {/* ============================================================ */}
          <div className="flex flex-col bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-full">
            {/* Header Kolom */}
            <div className="bg-gradient-to-r from-red-50 to-red-50/10 border-b border-red-100/50 p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-red-100">
                  <Clock className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-black text-red-900 tracking-tight">
                  Pesanan Baru
                </h2>
              </div>
              <div className="px-3 py-1 bg-red-500 text-white font-bold rounded-xl shadow-sm text-sm">
                {pendingOrders.length}
              </div>
            </div>

            {/* List Pesanan */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
              <AnimatePresence>
                {pendingOrders.map((order) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.2 },
                    }}
                    key={order.id}
                  >
                    <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden transition-all hover:shadow-md group">
                      {/* Tiket Header */}
                      <div className="p-5 pb-3 border-b border-stone-100 border-dashed flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Order ID
                          </p>
                          <p className="text-sm font-mono font-black text-stone-800 bg-stone-100/80 px-2 py-0.5 rounded-md inline-block border border-stone-200/50">
                            #{order.id.split("-")[0].toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Waktu
                          </p>
                          <span className="font-black text-xl text-red-600 tracking-tight">
                            {formatTime(order.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Isi Pesanan */}
                      <div className="p-5 pt-4">
                        <ul className="space-y-3 mb-5">
                          {order.order_items.map((item, idx) => (
                            <li key={idx} className="flex gap-3 items-start">
                              <span className="font-black text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg text-xs mt-0.5 shrink-0">
                                {item.quantity}x
                              </span>
                              <span className="font-bold text-stone-700 leading-tight">
                                {item.products?.name}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Tombol Aksi */}
                        <Button
                          onClick={() => updateStatus(order.id, "diproses")}
                          className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                        >
                          <ChefHat className="w-5 h-5" /> Mulai Siapkan
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Tampilan Kosong */}
              {pendingOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 opacity-60">
                  <InboxIcon className="w-10 h-10 text-red-300 mb-2" />
                  <p className="font-bold text-red-900/50 text-sm">
                    Tidak ada pesanan baru.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* KOLOM 2: DIPROSES (SEDANG DISIAPKAN) */}
          {/* ============================================================ */}
          <div className="flex flex-col bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-full">
            {/* Header Kolom */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-50/10 border-b border-orange-100/50 p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-orange-100">
                  <ChefHat className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-black text-orange-900 tracking-tight">
                  Sedang Disiapkan
                </h2>
              </div>
              <div className="px-3 py-1 bg-orange-500 text-white font-bold rounded-xl shadow-sm text-sm">
                {processingOrders.length}
              </div>
            </div>

            {/* List Pesanan */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
              <AnimatePresence>
                {processingOrders.map((order) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.2 },
                    }}
                    key={order.id}
                  >
                    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden transition-all hover:shadow-md group">
                      {/* Tiket Header */}
                      <div className="p-5 pb-3 border-b border-stone-100 border-dashed flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Order ID
                          </p>
                          <p className="text-sm font-mono font-black text-stone-800 bg-stone-100/80 px-2 py-0.5 rounded-md inline-block border border-stone-200/50">
                            #{order.id.split("-")[0].toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Diterima
                          </p>
                          <span className="font-black text-xl text-orange-600 tracking-tight">
                            {formatTime(order.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Isi Pesanan */}
                      <div className="p-5 pt-4 opacity-90">
                        <ul className="space-y-3 mb-5">
                          {order.order_items.map((item, idx) => (
                            <li key={idx} className="flex gap-3 items-start">
                              <span className="font-black text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg text-xs mt-0.5 shrink-0">
                                {item.quantity}x
                              </span>
                              <span className="font-bold text-stone-700 leading-tight">
                                {item.products?.name}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Tombol Aksi */}
                        <Button
                          onClick={() => updateStatus(order.id, "selesai")}
                          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Tandai Selesai
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Tampilan Kosong */}
              {processingOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 opacity-60">
                  <Coffee className="w-10 h-10 text-orange-300 mb-2" />
                  <p className="font-bold text-orange-900/50 text-sm">
                    Tidak ada pesanan yang diproses.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
