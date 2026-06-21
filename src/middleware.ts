import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();

  // Jika user belum login dan mencoba akses rute terproteksi
  if (
    !user &&
    (url.pathname.startsWith("/admin") || url.pathname.startsWith("/kasir"))
  ) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Jika user sudah login, cek role-nya di tabel `users`
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role || "konsumen";

    // Auto-redirect jika membuka halaman login tapi sudah terautentikasi
    if (url.pathname === "/login") {
      if (role === "admin") url.pathname = "/admin/dashboard";
      else if (role === "kasir") url.pathname = "/kasir/pos";
      else url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Proteksi Route Admin
    if (url.pathname.startsWith("/admin") && role !== "admin") {
      url.pathname = role === "kasir" ? "/kasir/pos" : "/";
      return NextResponse.redirect(url);
    }

    // Proteksi Route Kasir
    if (
      url.pathname.startsWith("/kasir") &&
      role !== "kasir" &&
      role !== "admin"
    ) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// Tentukan rute mana saja yang akan dicek oleh middleware
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
