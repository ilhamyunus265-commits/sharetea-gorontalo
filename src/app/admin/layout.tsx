"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Store,
  TicketPercent, // <-- Ikon baru ditambahkan di sini
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Katalog Produk", href: "/admin/produk", icon: Package },
    { name: "Promo & Diskon", href: "/admin/promo", icon: TicketPercent }, // <-- Menu baru ditambahkan di sini
    { name: "Pesanan", href: "/admin/pesanan", icon: ShoppingCart },
    { name: "Pengguna", href: "/admin/pengguna", icon: Users },
    { name: "Pengaturan", href: "/admin/pengaturan", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#faf9f8] font-sans selection:bg-[#5c3a21]/20">
      {/* SIDEBAR ADMIN (GLASSMORPHISM) */}
      <aside className="w-[280px] bg-white/60 backdrop-blur-xl border-r border-white hidden md:flex flex-col sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 shrink-0">
        {/* BRANDING / LOGO AREA */}
        <div className="h-28 flex items-center px-8 border-b border-stone-100/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#5c3a21] to-[#4a2c0f] flex items-center justify-center shadow-lg shadow-[#5c3a21]/20 text-white">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 tracking-tight leading-none mb-1">
                Sharetea
              </h1>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGASI MENU */}
        <nav className="flex-1 py-8 px-5 space-y-2 overflow-y-auto hide-scrollbar">
          <p className="px-3 text-xs font-bold text-stone-400 uppercase tracking-wider mb-5">
            Menu Utama
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-[1rem] transition-all duration-300 group ${
                  isActive
                    ? "bg-white text-[#5c3a21] shadow-[0_8px_30px_rgb(0,0,0,0.06)] font-bold border border-white"
                    : "text-stone-500 hover:bg-white/40 hover:text-stone-800 font-medium"
                }`}
              >
                <div
                  className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-[#5c3a21]" : "text-stone-400 group-hover:text-stone-600"}`}
                  />
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER SIDEBAR (PROFIL ADMIN) */}
        <div className="p-6 border-t border-stone-100/50 shrink-0">
          <div className="flex items-center gap-3 bg-white/50 p-3.5 rounded-2xl border border-white shadow-sm transition-all hover:bg-white/80 cursor-default">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs shrink-0">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-extrabold text-stone-800 truncate leading-tight">
                Admin Utama
              </p>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5 truncate">
                Super Akses
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
