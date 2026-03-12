import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SerializeOptions } from "cookie";

type CookieToSet = {
  name: string;
  value: string;
  options: Partial<SerializeOptions>;
};

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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set({ name, value, ...options });
          }
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set({ name, value, ...options });
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/editor");
  const isAuthRoute = pathname.startsWith("/auth");
  const isHomeRoute = pathname === "/";

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  if (user && (isAuthRoute || isHomeRoute)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};