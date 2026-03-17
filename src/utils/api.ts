import type {
    RestaurantNearbyResponse,
    RestaurantDetailResponse,
    SearchRestaurantResponse,
    TokenResponse,
    UserResponse,
    ReviewResponse,
    UserCreate,
  } from "@/types/api";
  
  const BASE_URL = "https://api.baebulook.site";
  
  // ── 토큰 관리 ──
  
  export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }
  
  export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token");
  }
  
  export function setTokens(access: string, refresh: string) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }
  
  export function clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
  
  // ── fetch wrapper ──
  
  async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
  
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  
    // JSON body가 아닌 경우 Content-Type 자동 설정 안 함 (FormData 등)
    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${text}`);
    }
  
    return res.json();
  }
  
  // ── 레스토랑 API ──
  
  export async function searchRestaurants(
    query: string,
  ): Promise<SearchRestaurantResponse[]> {
    return apiFetch<SearchRestaurantResponse[]>(
      `/api/v1/restaurants/search?query=${encodeURIComponent(query)}`,
    );
  }
  
  export async function getNearbyRestaurants(
    lat: number,
    lng: number,
    radius = 1000,
  ): Promise<RestaurantNearbyResponse[]> {
    return apiFetch<RestaurantNearbyResponse[]>(
      `/api/v1/restaurants/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
    );
  }
  
  export async function getRestaurantDetail(
    restaurantId: number,
  ): Promise<RestaurantDetailResponse> {
    return apiFetch<RestaurantDetailResponse>(
      `/api/v1/restaurants/${restaurantId}`,
    );
  }
  
  // ── 인증 API ──
  
  export async function signup(data: UserCreate): Promise<UserResponse> {
    return apiFetch<UserResponse>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  
  export async function signin(
    username: string,
    password: string,
  ): Promise<TokenResponse> {
    const body = new URLSearchParams({ username, password });
    return apiFetch<TokenResponse>("/api/v1/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }
  
  export async function getMe(): Promise<UserResponse> {
    return apiFetch<UserResponse>("/api/v1/auth/me");
  }
  
  // ── 리뷰 API ──
  
  export async function getReviews(
    restaurantId: number,
    skip = 0,
    limit = 20,
  ): Promise<ReviewResponse[]> {
    return apiFetch<ReviewResponse[]>(
      `/api/v1/reviews?restaurant_id=${restaurantId}&skip=${skip}&limit=${limit}`,
    );
  }
  
  export async function createReview(
    data: { restaurant_id: number; rating: number; content: string },
    files?: File[],
  ): Promise<ReviewResponse> {
    const formData = new FormData();
    formData.append("restaurant_id", String(data.restaurant_id));
    formData.append("rating", String(data.rating));
    formData.append("content", data.content);
  
    if (files) {
      files.forEach((file) => formData.append("files", file));
    }
  
    return apiFetch<ReviewResponse>("/api/v1/reviews/register", {
      method: "POST",
      body: formData,
    });
  }