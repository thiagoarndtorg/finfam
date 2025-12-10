import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
// Rotas que não precisam de autenticação
const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-email",
  "/accept-invitation",
  "/_next",
  "/favicon.ico",
  "/api/auth",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se a rota atual é pública
  const isPublicRoute = publicPaths.some((path) => pathname.startsWith(path));

  // Verificar se o usuário está autenticado
  const authToken = request.cookies.get("auth_token")?.value;

  let isAuthenticated = false;
  if (authToken) {
    try {
      // Encode the secret for jose
      const secret = new TextEncoder().encode(process.env.SECRET_KEY);
      // Verify the JWT token
      await jwtVerify(authToken, secret);
      isAuthenticated = true;
    } catch (error) {
      console.error("Token verification failed:", error);
      // Clear the invalid token
      const response = NextResponse.redirect(new URL("/auth/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  console.log(`Path: ${pathname}, Public: ${isPublicRoute}, Authenticated: ${isAuthenticated}`);

  // Se for uma rota de autenticação e o usuário já estiver autenticado,
  // redirecionar para a raiz (dashboard)
  if (
    isAuthenticated &&
    (pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/register") ||
      pathname.startsWith("/auth/forgot-password"))
  ) {
    console.log("Authenticated user trying to access auth route, redirecting to home");
    return NextResponse.redirect(new URL("/", request.url)); // 👈 Mudar de "/dashboard" para "/"
  }

  // Se não for uma rota pública e o usuário não estiver autenticado,
  // redirecionar para login
  if (!isPublicRoute && !isAuthenticated) {
    console.log("Unauthenticated user trying to access protected route, redirecting to login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

// Configurar quais rotas devem passar pelo middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|finfam.ico|logo_finfam_white.png|logo_finfam_white.ico|logo_finfam_dark.png).*)",
  ],
};
