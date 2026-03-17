const API_BASE_URL = "https://api.baebulook.site";

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

// 맛집 이름으로 검색하는 API 함수
export async function searchRestaurantsByName(keyword: string) {
  try {
    // ⚠️ 주의: 404 에러가 났던 주소 대신 가장 일반적인 검색 쿼리 방식을 적용했습니다.
    // 실제 백엔드 API 명세에 따라 '/search?query=' 또는 '?name=' 등으로 수정이 필요할 수 있습니다.
    const res = await fetch(`${API_BASE_URL}/api/v1/restaurants/search?query=${encodeURIComponent(keyword)}`);
    
    if (!res.ok) {
      throw new Error(`검색 실패: 상태 코드 ${res.status}`);
    }

    const data = await res.json();

    // 데이터를 받아서 곧바로 컴포넌트가 쓰기 편한 형태로 가공(Mapping)합니다.
    return (data.items || []).map((item: any) => ({
      id: item.kakao_place_id,                 // 고유 식별자
      name: item.name,                         // 상호명
      address: item.road_address || item.address, // 도로명 우선
      image_url: item.image_url || "https://via.placeholder.com/200?text=No+Image", // 대체 이미지
      category: item.category,
      phone: item.phone,
      place_url: item.place_url,
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  } catch (error) {
    console.error("searchRestaurantsByName Error:", error);
    return []; // 에러 발생 시 컴포넌트가 터지지 않도록 빈 배열 반환
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
        nickname: r.user.nickname || "사용자",
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
    
    // 🌟 백엔드에서 보낸 detail 메시지(24시간 제한 등)를 최우선으로 잡아서 던집니다.
    const errorMessage = typeof errorData.detail === 'string' 
      ? errorData.detail 
      : errorData.message || '리뷰 등록에 실패했습니다.';
      
    throw new Error(errorMessage);
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


/**
 * 1. 내 즐겨찾기(북마크) 목록 조회 (GET)
 */
export async function getMyBookmarks(skip = 0, limit = 100) {
  // Next.js 서버사이드 렌더링 에러 방지를 위해 브라우저 환경인지 체크합니다.
  if (typeof window === "undefined") return [];
  
  const token = localStorage.getItem("token");
  if (!token) throw new Error("로그인이 필요한 서비스입니다.");

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/bookmark/me?skip=${skip}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("즐겨찾기 목록을 불러오는데 실패했습니다.");
    return await res.json();
  } catch (error) {
    console.error("getMyBookmarks Error:", error);
    throw error;
  }
}

/**
 * 2. 즐겨찾기 추가 (POST)
 */
export async function addBookmark(restaurantId: number | string) {
  if (typeof window === "undefined") return null;
  
  const token = localStorage.getItem("token");
  if (!token) throw new Error("로그인이 필요한 서비스입니다.");

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/bookmark/?restaurant_id=${restaurantId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("즐겨찾기 추가에 실패했습니다.");
    return await res.json(); // 성공 시 응답 데이터 반환
  } catch (error) {
    console.error("addBookmark Error:", error);
    throw error;
  }
}

/**
 * 3. 즐겨찾기 취소/삭제 (DELETE)
 */
export async function removeBookmark(restaurantId: number | string) {
  if (typeof window === "undefined") return null;
  
  const token = localStorage.getItem("token");
  if (!token) throw new Error("로그인이 필요한 서비스입니다.");

  try {
    // API 명세에 따라 마지막에 restaurantId가 들어갑니다.
    const res = await fetch(`${API_BASE_URL}/api/v1/bookmark/${restaurantId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("즐겨찾기 취소에 실패했습니다.");
    // DELETE는 응답 본문이 없을 수도 있으므로 텍스트로 먼저 받아서 처리하는 것이 안전합니다.
    const text = await res.text();
    return text ? JSON.parse(text) : { success: true }; 
  } catch (error) {
    console.error("removeBookmark Error:", error);
    throw error;
  }
}

