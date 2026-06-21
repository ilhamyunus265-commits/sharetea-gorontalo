"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  Receipt,
  Loader2,
  Printer,
  X,
  History,
  CheckCircle2,
  Clock,
  ChefHat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OrderItem = {
  quantity: number;
  price: number;
  products: { name: string } | null;
};

type Order = {
  id: string;
  total_price: number;
  payment_method: string;
  created_at: string;
  status: string;
  order_items: OrderItem[];
};

export default function RiwayatKasirPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk Modal Struk
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      // Mengambil data pesanan (diurutkan dari yang paling baru)
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id, total_price, payment_method, created_at, status,
          order_items ( quantity, price, products ( name ) )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100); // Batasi 100 transaksi terakhir agar kasir tidak berat

      if (!error && data) {
        setOrders(data as unknown as Order[]);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [supabase]);

  // Fungsi Cetak (Akan menyembunyikan elemen lain menggunakan CSS Print)
  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter((o) =>
    o.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Helper Warna Badge Status (Modern Soft Look)
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge className="bg-red-50 text-red-700 shadow-none border border-red-100/50 font-bold px-3 py-1 rounded-xl">
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Pending
          </Badge>
        );
      case "diproses":
        return (
          <Badge className="bg-orange-50 text-orange-700 shadow-none border border-orange-100/50 font-bold px-3 py-1 rounded-xl">
            <ChefHat className="w-3.5 h-3.5 mr-1.5" /> Diproses
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

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-[#faf9f8] overflow-hidden relative">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none print:hidden"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-purple-100/30 blur-[100px] pointer-events-none print:hidden"></div>

      {/* AREA UTAMA: DAFTAR RIWAYAT TRANSAKSI */}
      <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto print:hidden z-10">
        <div className="max-w-7xl mx-auto w-full">
          {/* HEADER PAGE */}
          <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
                Riwayat Transaksi
              </h1>
              <p className="text-stone-500 font-medium text-lg">
                Cek kembali transaksi masuk atau cetak ulang struk konsumen.
              </p>
            </div>

            {/* SEARCH BAR MODERN MENGAMBANG */}
            <div className="relative group w-full sm:w-80 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-stone-400 group-focus-within:text-[#5c3a21] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari berdasarkan Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl text-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#5c3a21]/20 focus:bg-white transition-all font-medium text-stone-700 placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* TABEL CARD (GLASSMORPHISM) */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/30 border-b border-stone-100/50 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Item Transaksi
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider text-right">
                      Total (Rp)
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[#5c3a21]" />
                        <p className="text-stone-400 font-bold">
                          Memuat riwayat transaksi...
                        </p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-24 text-center">
                        <div className="w-20 h-20 bg-stone-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="w-10 h-10 text-stone-300" />
                        </div>
                        <p className="text-stone-800 font-black text-lg mb-1">
                          Riwayat Kosong
                        </p>
                        <p className="text-stone-500 font-medium text-sm">
                          Belum ada transaksi atau pencarian tidak cocok.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-white/40 transition-colors group"
                      >
                        {/* WAKTU TRANSAKSI */}
                        <td className="px-8 py-5">
                          <div className="font-bold text-stone-800 mb-0.5">
                            {new Date(order.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div className="text-xs font-medium text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{" "}
                            {new Date(order.created_at).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </div>
                        </td>

                        {/* ORDER ID */}
                        <td className="px-8 py-5">
                          <span className="font-mono font-bold text-sm bg-stone-100/80 px-2.5 py-1 rounded-lg text-stone-600 border border-stone-200/50">
                            #{order.id.split("-")[0].toUpperCase()}
                          </span>
                        </td>

                        {/* ITEM TRANSAKSI */}
                        <td className="px-8 py-5 max-w-[250px]">
                          <div className="flex flex-wrap gap-1.5">
                            {order.order_items.map((i, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-xs font-bold bg-white border border-stone-200/60 px-2 py-1 rounded-md text-stone-600 shadow-sm"
                              >
                                <span className="text-[#5c3a21] mr-1">
                                  {i.quantity}x
                                </span>{" "}
                                {i.products?.name}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-8 py-5 text-center">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* TOTAL HARGA */}
                        <td className="px-8 py-5 text-right">
                          <span className="font-black text-lg text-[#5c3a21]">
                            {(order.total_price / 1000).toFixed(0)}k
                          </span>
                        </td>

                        {/* TOMBOL LIHAT STRUK */}
                        <td className="px-8 py-5 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="bg-white/80 border-stone-200 text-stone-600 hover:text-[#5c3a21] hover:border-[#5c3a21]/50 hover:bg-[#5c3a21]/5 font-bold rounded-xl shadow-sm transition-all h-9 px-4"
                          >
                            <Receipt className="w-4 h-4 mr-1.5" /> Struk
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL / PANEL STRUK THERMAL (Muncul jika ada transaksi yang dipilih) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 print:bg-white print:p-0 print:block animate-in fade-in duration-200">
          <div className="w-full max-w-[340px] relative flex flex-col max-h-[90vh] print:max-w-full print:h-auto print:max-h-full">
            {/* Tombol Tutup (Sembunyi saat dicetak) */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute -top-12 right-0 text-white hover:text-stone-300 print:hidden transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* AREA KERTAS STRUK (Format Thermal 80mm/58mm) */}
            <div className="bg-[#fcfcfa] rounded-t-xl rounded-b-sm shadow-2xl font-mono text-sm text-stone-800 flex-1 overflow-y-auto print:shadow-none border border-stone-200 relative">
              {/* Efek gerigi atas (opsional, visual manis) */}
              <div className="h-2 w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cG9seWdvbiBwb2ludHM9IjAsMCA4LDAgNCw4IiBmaWxsPSIjZjhmOGY2IiAvPgo8L3N2Zz4=')] absolute top-0 left-0 opacity-50 print:hidden"></div>

              <div className="p-8 pb-6">
                {/* Header Struk */}
                <div className="text-center mb-6">
                  <h2 className="font-extrabold text-2xl tracking-widest uppercase mb-1 text-black">
                    SHARETEA
                  </h2>
                  <p className="text-xs text-stone-500 font-sans">
                    Jl. Prof. Dr. Aloei Saboe
                  </p>
                  <p className="text-xs text-stone-500 font-sans">
                    Kota Gorontalo
                  </p>
                </div>

                <div className="border-b-2 border-dashed border-stone-300 pb-3 mb-3 text-xs space-y-1.5 text-stone-600">
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span className="font-bold text-stone-800">
                      {new Date(selectedOrder.created_at).toLocaleString(
                        "id-ID",
                        { dateStyle: "short", timeStyle: "short" },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-bold text-stone-800">
                      {selectedOrder.id.split("-")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span className="font-bold text-stone-800">
                      Shift Utama
                    </span>
                  </div>
                </div>

                {/* Detail Pesanan */}
                <div className="space-y-3 mb-4 border-b-2 border-dashed border-stone-300 pb-4">
                  {selectedOrder.order_items.map((item, idx) => (
                    <div key={idx}>
                      <div className="font-bold text-stone-800">
                        {item.products?.name}
                      </div>
                      <div className="flex justify-between text-xs mt-1 text-stone-600">
                        <span>
                          {item.quantity} x {item.price.toLocaleString("id-ID")}
                        </span>
                        <span className="font-bold text-stone-800">
                          {(item.quantity * item.price).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ringkasan Harga */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span>
                      Rp{" "}
                      {Math.round(
                        selectedOrder.total_price / 1.11,
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>PPN (11%)</span>
                    <span>
                      Rp{" "}
                      {Math.round(
                        selectedOrder.total_price -
                          selectedOrder.total_price / 1.11,
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-xl mt-2 pt-2 border-t-2 border-stone-800 text-black">
                    <span>TOTAL</span>
                    <span>
                      Rp {selectedOrder.total_price.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-500 text-xs mt-3 bg-stone-100 p-2 rounded">
                    <span>Metode Pembayaran</span>
                    <span className="uppercase font-bold text-stone-800">
                      {selectedOrder.payment_method}
                    </span>
                  </div>
                </div>

                {/* Footer Struk */}
                <div className="text-center mt-8 pt-4 border-t-2 border-dashed border-stone-300 text-xs text-stone-500">
                  <p className="font-bold text-stone-700 mb-1">
                    Terima kasih atas kunjungannya!
                  </p>
                  <p>Layanan Pelanggan: 081234567890</p>
                </div>
              </div>

              {/* Efek gerigi bawah (opsional) */}
              <div className="h-2 w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cG9seWdvbiBwb2ludHM9IjQsMCA4LDggMCw4IiBmaWxsPSIjZmNmY2ZhIiAvPgo8L3N2Zz4=')] absolute bottom-0 left-0 print:hidden transform rotate-180"></div>
            </div>

            {/* Tombol Aksi (Sembunyi saat dicetak) */}
            <div className="mt-4 print:hidden shrink-0">
              <Button
                onClick={handlePrint}
                className="w-full bg-[#5c3a21] hover:bg-[#4a2c0f] text-white h-14 text-lg font-bold flex items-center justify-center gap-2 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <Printer className="w-5 h-5" /> Cetak Struk
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CSS UNTUK PRINT (Disuntikkan ke dalam halaman) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
            background-color: transparent !important;
          }
          /* Hanya tampilkan area struk saat dicetak */
          .print\\:block, .print\\:block * {
            visibility: visible;
            color: black !important;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
          }
          /* Sembunyikan elemen yang tidak perlu di dalam struk */
          .print\\:hidden {
            display: none !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
