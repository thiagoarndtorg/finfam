export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api") {
    this.baseUrl = baseUrl;
  }

  // Configurar token de autenticação
  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  // Remover token de autenticação
  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  // Obter token de autenticação
  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  // Verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Método genérico para fazer requisições HTTP
  async request<T>(
    endpoint: string,
    method = "GET",
    data?: any,
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    // Only add Authorization header if token exists and endpoint isn't /register, /login, or /accept-invitation
    const isAuthEndpoint = endpoint.endsWith("/register") || endpoint.endsWith("/login") || endpoint.endsWith("/accept-invitation");
    if (token && !isAuthEndpoint) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      // Verificar se a resposta é um JSON válido
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      // Processar resposta
      const responseData = isJson ? await response.json() : await response.text();

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          throw new ApiError("Unauthorized", response.status, responseData);
        }

        throw new ApiError(
          responseData.message || "API request failed",
          response.status,
          responseData
        );
      }

      return responseData as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(error instanceof Error ? error.message : "Network error", 0, null);
    }
  }

  // Métodos de conveniência para diferentes verbos HTTP
  async get<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, "GET", undefined, customHeaders);
  }

  async post<T>(endpoint: string, data: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, "POST", data, customHeaders);
  }

  async put<T>(endpoint: string, data: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, "PUT", data, customHeaders);
  }

  async patch<T>(endpoint: string, data: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, "PATCH", data, customHeaders);
  }

  async delete<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, "DELETE", data, customHeaders);
  }
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const apiClient = new ApiClient();
