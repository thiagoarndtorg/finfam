// Funções auxiliares para gerenciar autenticação no cliente

// Salvar token no localStorage e cookie
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    // Salvar como cookie para que o middleware do servidor possa acessar
    // Importante: o cookie deve ser acessível pelo servidor para o middleware funcionar
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`; // 7 dias

    // Opcionalmente, também salvar no localStorage para acesso fácil no cliente
    localStorage.setItem("auth_token", token);
  }
}

// Remover token
export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    // Remover cookie
    document.cookie = "auth_token=; path=/; max-age=0";

    // Remover do localStorage
    localStorage.removeItem("auth_token");

    // Forçar redirecionamento para login
    window.location.href = "/auth/login";
  }
}

// Obter token (apenas para uso no cliente se necessário)
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    // Tentar obter do cookie primeiro
    const match = document.cookie.match(/(^| )auth_token=([^;]+)/);
    if (match) return match[2];

    // Fallback para localStorage
    return localStorage.getItem("auth_token");
  }
  return null;
}

// Extrair userId do token JWT
export function getUserIdFromToken(): number | null {
  const token = getAuthToken();
  if (!token) return null;

  try {
    // JWT tem 3 partes: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decodificar payload (base64url)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded);

    // O campo 'id' contém o userId
    return parsed.id || null;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}