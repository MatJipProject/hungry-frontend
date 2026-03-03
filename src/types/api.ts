// ── API 응답 타입 정의 (https://api.baebulook.site 기준) ──

export interface ReviewResponse {
  id: number;
  user_id: number;
  restaurant_id: number;
  rating: number;
  content: string;
  created_at: string;
  images?: string[];   // image_url 문자열 배열
  nickname?: string;   // 작성자 닉네임 (있을 수도 없을 수도)
}

/** /api/v1/restaurants/nearby 응답 */
export interface RestaurantNearbyResponse {
  id: number;
  name: string;
  category?: string;
  latitude: number;
  longitude: number;
  road_address?: string;
  address?: string;
  phone?: string;
  place_url?: string;
  distance: number;
  rating: number;
  review_count: number;
  images?: string[];
  review_preview?: string;
}

/** /api/v1/restaurants/{id} 응답 */
export interface RestaurantDetailResponse {
  id: number;
  kakao_place_id?: string;
  name: string;
  category?: string;
  phone?: string;
  place_url?: string;
  road_address?: string;
  address?: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  images?: string[];
  description?: string;
}

/** /api/v1/restaurants/search 응답 */
export interface SearchRestaurantResponse {
  id: number;
  name: string;
  category?: string;
  latitude: number;
  longitude: number;
  road_address?: string;
  address?: string;
  phone?: string;
  place_url?: string;
  rating: number;
  review_count: number;
  images?: string[];
  review_preview?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserResponse {
  nickname: string;
  email: string;
  birth: string;
  phone?: string;
}

export interface UserCreate {
  username: string;
  password: string;
  birth: string;
  email: string;
  phone?: string;
}