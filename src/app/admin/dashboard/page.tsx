"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Loader2,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// 1. TIPE DATA EKSPLISIT UNTUK MENGHILANGKAN ERROR TYPESCRIPT
type ChartData = {
  name: string;
  total: number;
  dateString: string;
};

type TopProduct = {
  name: string;
  sold: number;
  revenue: number;
};

export default function AdminDashboard() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    trendPercentage: 0,
    pendingOrders: 0,
    activeProducts: 0,
    totalUsers: 0,
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const { count: activeProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_available", true);

        const { count: totalUsers } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "konsumen");

        const { count: pendingOrders } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "diproses"]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const { data: recentOrders } = await supabase
          .from("orders")
          .select("total_price, created_at")
          .gte("created_at", sevenDaysAgo.toISOString())
          .eq("status", "selesai");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        let todayRev = 0;
        let yesterdayRev = 0;

        // Inisialisasi Tipe Data dengan benar
        const tempChartData: ChartData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayName = new Intl.DateTimeFormat("id-ID", {
            weekday: "short",
          }).format(d);
          tempChartData.push({
            name: dayName,
            total: 0,
            dateString: d.toDateString(),
          });
        }

        recentOrders?.forEach((o) => {
          const orderDate = new Date(o.created_at);
          const index = tempChartData.findIndex(
            (c) => c.dateString === orderDate.toDateString(),
          );
          if (index !== -1) tempChartData[index].total += o.total_price;

          if (orderDate >= today) {
            todayRev += o.total_price;
          } else if (orderDate >= yesterday && orderDate < today) {
            yesterdayRev += o.total_price;
          }
        });

        let trend = 0;
        if (yesterdayRev > 0) {
          trend = ((todayRev - yesterdayRev) / yesterdayRev) * 100;
        } else if (todayRev > 0) {
          trend = 100;
        }

        const { data: completedOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("status", "selesai");
        const completedOrderIds = completedOrders?.map((o) => o.id) || [];

        let topProds: TopProduct[] = [];
        if (completedOrderIds.length > 0) {
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("quantity, price, products(name)")
            .in("order_id", completedOrderIds);

          const productMap: Record<string, TopProduct> = {};
          orderItems?.forEach((item: any) => {
            const name = item.products?.name || "Produk Dihapus";
            if (!productMap[name])
              productMap[name] = { name, sold: 0, revenue: 0 };
            productMap[name].sold += item.quantity;
            productMap[name].revenue += item.quantity * item.price;
          });

          topProds = Object.values(productMap)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5);
        }

        setMetrics({
          todayRevenue: todayRev,
          trendPercentage: trend,
          pendingOrders: pendingOrders || 0,
          activeProducts: activeProducts || 0,
          totalUsers: totalUsers || 0,
        });
        setChartData(tempChartData);
        setTopProducts(topProds);
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[80vh] bg-stone-50">
        <div className="w-16 h-16 relative flex items-center justify-center bg-white rounded-2xl shadow-xl mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-[#5c3a21]" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">Menyusun Data...</h2>
        <p className="text-stone-500 font-medium mt-1">
          Mengambil metrik performa toko terkini
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 md:p-10 bg-[#faf9f8] relative overflow-hidden">
      {/* ORNAMEN LATAR BELAKANG HALUS (VIBE DRIBBBLE) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10">
        <h1 className="text-4xl font-black text-stone-900 mb-2 tracking-tight">
          Sorotan Performa
        </h1>
        <p className="text-stone-500 font-medium mb-10 text-lg">
          Pantau pertumbuhan Sharetea hari ini.
        </p>

        {/* 4 KARTU RINGKASAN (GLASSMORPHISM & PASTEL COLORS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Pendapatan */}
          <Card className="rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-7">
              <CardTitle className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                Pendapatan
              </CardTitle>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl shadow-inner">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-3xl font-black text-stone-900 tracking-tight mb-2">
                Rp {metrics.todayRevenue.toLocaleString("id-ID")}
              </div>
              {metrics.trendPercentage >= 0 ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/50">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">
                    +{metrics.trendPercentage.toFixed(1)}% Hari ini
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-100/50">
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs font-bold text-red-700">
                    {metrics.trendPercentage.toFixed(1)}% Hari ini
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Pesanan */}
          <Card className="rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-7">
              <CardTitle className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                Antrian Baru
              </CardTitle>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl shadow-inner">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-3xl font-black text-stone-900 tracking-tight mb-2">
                {metrics.pendingOrders}{" "}
                <span className="text-lg text-stone-400 font-bold">Resi</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200/50">
                <span className="text-xs font-bold text-stone-600">
                  Perlu segera diproses
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Produk Aktif */}
          <Card className="rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-7">
              <CardTitle className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                Menu Aktif
              </CardTitle>
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl shadow-inner">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-3xl font-black text-stone-900 tracking-tight mb-2">
                {metrics.activeProducts}{" "}
                <span className="text-lg text-stone-400 font-bold">Item</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200/50">
                <span className="text-xs font-bold text-stone-600">
                  Tersedia di etalase
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Pengguna */}
          <Card className="rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-7">
              <CardTitle className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                Konsumen
              </CardTitle>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl shadow-inner">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-3xl font-black text-stone-900 tracking-tight mb-2">
                {metrics.totalUsers}{" "}
                <span className="text-lg text-stone-400 font-bold">Akun</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200/50">
                <span className="text-xs font-bold text-stone-600">
                  Total member terdaftar
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AREA GRAFIK & PRODUK TERLARIS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GRAFIK BAR (SMOOTH MODERN) */}
          <Card className="lg:col-span-2 rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="text-xl font-bold text-stone-900 tracking-tight">
                Tren Pendapatan Mingguan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-8 pb-8">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a8a29e", fontSize: 13, fontWeight: 600 }}
                      dy={15}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a8a29e", fontSize: 13, fontWeight: 600 }}
                      tickFormatter={(value) => `Rp${value / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.02)" }}
                      contentStyle={{
                        borderRadius: "1rem",
                        border: "none",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                        padding: "12px 16px",
                        fontWeight: "bold",
                        color: "#292524",
                      }}
                      formatter={(value: any) => [
                        `Rp ${Number(value).toLocaleString("id-ID")}`,
                        "Total",
                      ]}
                      labelStyle={{ color: "#78716c", marginBottom: "4px" }}
                    />
                    <Bar dataKey="total" radius={[8, 8, 8, 8]} maxBarSize={45}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === chartData.length - 1
                              ? "#5c3a21"
                              : "#d6d3d1"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* LIST PRODUK TERLARIS (LEADERBOARD MODERN) */}
          <Card className="rounded-[2rem] border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-stone-100/50">
              <CardTitle className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top 5 Terlaris
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {topProducts.length === 0 ? (
                  <div className="text-center text-stone-400 py-16 text-sm font-medium">
                    Belum ada data penjualan tercatat.
                  </div>
                ) : (
                  topProducts.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-8 py-4 border-b border-stone-100/50 hover:bg-white/40 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover:scale-110 ${
                            i === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : i === 1
                                ? "bg-slate-200 text-slate-700"
                                : i === 2
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-stone-800 line-clamp-1 mb-0.5">
                            {item.name}
                          </p>
                          <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-bold text-stone-500">
                            {item.sold} Pcs Terjual
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-black text-[#5c3a21] shrink-0 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-stone-100">
                        Rp {(item.revenue / 1000).toFixed(0)}k
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
