"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  FileSpreadsheet,
  Clock,
  ChefHat,
  CheckCircle2,
  Loader2,
  InboxIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type OrderItem = {
  quantity: number;
  price: number;
  products: { name: string } | null;
};

type Order = {
  id: string;
  status: "pending" | "diproses" | "selesai";
  total_price: number;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
};

export default function ManajemenPesananPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_price,
        payment_method,
        created_at,
        order_items (
          quantity,
          price,
          products ( name )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as Order[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [supabase]);

  // FUNGSI UPDATE STATUS PESANAN
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      fetchOrders(); // Refresh data
    } catch (error: any) {
      alert("Gagal merubah status: " + error.message);
    }
  };

  // FUNGSI EKSPOR KE CSV (EXCEL)
  const exportToCSV = () => {
    if (orders.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "Order ID",
      "Tanggal",
      "Jam",
      "Status",
      "Metode Pembayaran",
      "Total Harga (Rp)",
      "Detail Item",
    ];

    const rows = orders.map((order) => {
      const date = new Date(order.created_at);
      const tanggal = date.toLocaleDateString("id-ID");
      const jam = date.toLocaleTimeString("id-ID");
      const itemsString = order.order_items
        .map((item) => `${item.quantity}x ${item.products?.name}`)
        .join(" + ");

      return [
        order.id.split("-")[0].toUpperCase(),
        tanggal,
        jam,
        order.status,
        order.payment_method,
        order.total_price,
        `"${itemsString}"`,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Laporan_Penjualan_Sharetea_${new Date().toLocaleDateString("id-ID")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "Semua" ? true : o.status === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Helper Warna Badge Status (Modern Soft Look)
  const getStatusBadge = (status: string) => {
    switch (status) {
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
        return <Badge className="rounded-xl px-3 py-1">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-full p-6 md:p-10 bg-[#faf9f8] relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS */}
      <div className="absolute top-[5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-100/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-yellow-100/40 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER PAGE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
              Riwayat Pesanan
            </h1>
            <p className="text-stone-500 font-medium text-lg">
              Pantau arus transaksi dan ekspor laporan penjualan.
            </p>
          </div>

          <Button
            onClick={exportToCSV}
            className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />{" "}
            <span className="font-bold">Unduh Laporan (CSV)</span>
          </Button>
        </div>

        {/* TABEL CARD (GLASSMORPHISM) */}
        <Card className="rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* FILTER & PENCARIAN CONTROLS */}
          <div className="p-6 border-b border-stone-100/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/30">
            {/* SEARCH BAR MODERN */}
            <div className="relative group w-full lg:w-80 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-stone-400 group-focus-within:text-[#5c3a21] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari berdasarkan Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl text-sm shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#5c3a21]/20 focus:bg-white transition-all font-medium text-stone-700 placeholder:text-stone-400"
              />
            </div>

            {/* FILTER SEGMENTED CONTROL */}
            <div className="flex gap-1.5 bg-stone-200/40 p-1.5 rounded-2xl overflow-x-auto w-full lg:w-auto">
              {["Semua", "Pending", "Diproses", "Selesai"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-700 hover:bg-white/40"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* TABEL DATA */}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30">
                      Waktu
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30">
                      Order ID
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30">
                      Item Menu
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30 text-center">
                      Tipe Bayar
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30 text-center">
                      Status
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30 text-right">
                      Total
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100/50 bg-white/30 text-center">
                      Aksi Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#5c3a21]" />
                        <p className="text-stone-400 font-medium text-sm">
                          Menarik data transaksi...
                        </p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-24 text-center">
                        <div className="w-16 h-16 bg-stone-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <InboxIcon className="w-8 h-8 text-stone-300" />
                        </div>
                        <p className="text-stone-500 font-bold">
                          Tidak ada transaksi ditemukan
                        </p>
                        <p className="text-stone-400 font-medium text-sm mt-1">
                          Coba sesuaikan filter atau kata kunci pencarian Anda.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-white/40 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="font-bold text-stone-800 mb-0.5">
                            {new Date(order.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                month: "short",
                                day: "numeric",
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

                        <td className="px-8 py-5">
                          <span className="font-mono font-bold text-sm bg-stone-100/80 px-2.5 py-1 rounded-lg text-stone-600 border border-stone-200/50">
                            #{order.id.split("-")[0].toUpperCase()}
                          </span>
                        </td>

                        <td className="px-8 py-5 max-w-xs">
                          <div className="text-sm font-medium space-y-1.5">
                            {order.order_items.map((item, idx) => (
                              <div key={idx} className="flex gap-2 items-start">
                                <span className="font-black text-[#5c3a21] bg-[#5c3a21]/10 px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">
                                  {item.quantity}x
                                </span>
                                <span className="text-stone-700 leading-tight">
                                  {item.products?.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="px-8 py-5 text-center">
                          <Badge className="bg-white text-stone-600 shadow-sm border-stone-200/60 font-bold px-3 py-1 rounded-xl">
                            {order.payment_method}
                          </Badge>
                        </td>

                        <td className="px-8 py-5 text-center">
                          {getStatusBadge(order.status)}
                        </td>

                        <td className="px-8 py-5 text-right">
                          <span className="font-black text-lg text-[#5c3a21]">
                            Rp {(order.total_price / 1000).toFixed(0)}k
                          </span>
                        </td>

                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                updateStatus(order.id, e.target.value)
                              }
                              className="text-xs font-bold text-stone-700 bg-white/60 border border-stone-200/60 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#5c3a21]/20 cursor-pointer shadow-sm hover:bg-white transition-all appearance-none pr-8 relative"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundPosition: `right 8px center`,
                                backgroundRepeat: `no-repeat`,
                              }}
                            >
                              <option value="pending">Set: Pending</option>
                              <option value="diproses">Set: Diproses</option>
                              <option value="selesai">Set: Selesai</option>
                            </select>
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
    </div>
  );
}
