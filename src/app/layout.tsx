import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sharetea Gorontalo | Pesan Online Tanpa Antri",
  description:
    "Nikmati kesegaran minuman teh dan kudapan terbaik di Gorontalo. Pesan langsung dari perangkat Anda secara online, cepat, dan mudah!",
  keywords: ["Sharetea", "Gorontalo", "Boba", "Milk Tea", "Pesan Online"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#faf9f8] text-stone-900 font-sans antialiased selection:bg-[#5c3a21]/20 selection:text-[#5c3a21]">
        {children}
      </body>
    </html>
  );
}
