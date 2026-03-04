export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  road_address: string;
  address: string;
  phone: string;
  place_url: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  created_at: string;
  thumbnail: string;
  // UI 호환성 필드
  grad?: string;
  emoji?: string;
  tags?: string[];
  region?: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  userId: string;
  nickname?: string;
  rating: number;
  content: string;
  createdAt: string;
  imageUrls?: string[];
}

const API_BASE_URL = "https://api.baebulook.site";

// 맛집 최신 목록 조회
export async function fetchPlaces(): Promise<Place[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/restaurants/latest`);
    if (!res.ok) throw new Error('맛집 목록을 불러오는데 실패했습니다.');
    const list: any[] = await res.json();

    return list.map(p => ({
      ...p,
      id: p.id.toString(),
      road_address: p.road_address || p.address,
      review_count: p.review_count || 0,
      rating: p.rating || 0,
      region: (p.road_address || p.address || "").split(' ')[1] || "전체",
      tags: ["#최신등록", `#${p.category || '맛집'}`],
      grad: p.thumbnail ? `url(${p.thumbnail})` : "linear-gradient(135deg,#74b9ff,#a29bfe)",
      emoji: "🍴"
    }));
  } catch (error) {
    console.error("fetchPlaces Error:", error);
    return [];
  }
}

// 맛집 트렌딩 목록 조회
export async function fetchTrendingPlaces(): Promise<Place[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/restaurants/trending`);
    if (!res.ok) throw new Error('맛집 목록을 불러오는데 실패했습니다.');
    const list: any[] = await res.json();

    return list.map(p => ({
      ...p,
      id: p.id.toString(),
      road_address: p.road_address || p.address,
      review_count: p.review_count || 0,
      rating: p.rating || 0,
      region: (p.road_address || p.address || "").split(' ')[1] || "전체",
      tags: ["#최신등록", `#${p.category || '맛집'}`],
      thumbnail: p.image_url || null,
      grad: p.image_url ? `url(${p.image_url})` : "linear-gradient(135deg,#74b9ff,#a29bfe)",
      emoji: "🍴"
    }));
  } catch (error) {
    console.error("fetchPlaces Error:", error);
    return [];
  }
}

// 맛집 검색 (등록 전 검색용)
export async function searchRestaurants(query: string): Promise<any[]> {
  if (!query) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/restaurants/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('검색에 실패했습니다.');
    const data = await res.json();
    return data.content || [];
  } catch (error) {
    console.error("searchRestaurants Error:", error);
    return [];
  }
}

// 맛집 등록
export async function registerRestaurant(restaurantData: {
  name: string;
  address: string;
  phone?: string;
  category?: string;
  thumbnail?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/restaurants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(restaurantData),
  });
  if (!res.ok) throw new Error('맛집 등록에 실패했습니다.');
  return res.json();
}

// 리뷰 목록 조회
export async function fetchReviews(restaurantId: string): Promise<Review[]> {
  try {
    // 식당별 리뷰 조회 API 시도 (새로운 통합 엔드포인트)
    let res = await fetch(`${API_BASE_URL}/api/v1/reviews?restaurant_id=${restaurantId}`);
    
    if (!res.ok) {
        // 기존 엔드포인트 시도
        res = await fetch(`${API_BASE_URL}/api/v1/restaurants/${restaurantId}/reviews`);
    }

    if (!res.ok) throw new Error('리뷰 목록을 불러오는데 실패했습니다.');
    
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.content || data.reviews || []);
    
    return list.map((r: any) => ({
        id: r.id?.toString() || "",
        restaurantId: (r.restaurant_id || r.restaurantId || restaurantId).toString(),
        userId: (r.user_id || r.userId || "").toString(),
        nickname: r.nickname || r.username || r.author || "사용자",
        rating: r.rating || 0,
        content: r.content || r.comment || "",
        createdAt: r.created_at || r.createdAt || new Date().toISOString(),
        imageUrls: r.image_urls || r.imageUrls || []
    }));
  } catch (error) {
    console.error("fetchReviews Error:", error);
    return [];
  }
}

// 리뷰 등록
export async function postReview(restaurantId: string, review: {
  rating: number;
  content: string;
}, files?: File[]): Promise<any> {
  const formData = new FormData();
  formData.append('restaurant_id', restaurantId);
  formData.append('rating', review.rating.toString());
  formData.append('content', review.content);
  
  if (files) {
    files.forEach(file => formData.append('files', file));
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/reviews`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("postReview Error:", errorData);
    throw new Error(errorData.detail || '리뷰 등록에 실패했습니다.');
  }
  return res.json();
}

// 로그인 (임시 Mock)
export async function login(): Promise<User> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: "1", name: "Test User", email: "test@example.com" });
    }, 500);
  });
}

// 로그아웃 (임시 Mock)
export async function logout(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 500));
}
