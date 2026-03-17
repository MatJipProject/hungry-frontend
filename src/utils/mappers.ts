import type { PlaceData, Review } from "@/types/kakao";
import type {
  RestaurantNearbyResponse,
  RestaurantDetailResponse,
  ReviewResponse,
  SearchRestaurantResponse,
} from "@/types/api";

export function mapNearbyToPlaceData(res: RestaurantNearbyResponse): PlaceData {
  const combinedImages = [res.image_url, ...(res.images || [])].filter(Boolean);

  return {
    id: `api-${res.id}`,
    apiId: res.id,
    name: res.name,
    lat: res.latitude,
    lng: res.longitude,
    category: res.category || "기타",
    description: "",
    address: res.road_address || res.address,
    phone: res.phone,
    rating: res.rating,
    reviewCount: res.review_count,
    review: res.review_preview,
    link: res.place_url,
    images: combinedImages,
    distance: res.distance,
    isBookmarked: res.is_bookmarked,
  };
}

export function mapSearchToPlaceData(res: SearchRestaurantResponse): PlaceData {
  return {
    id: `api-${res.id}`,
    apiId: res.id,
    name: res.name,
    lat: res.latitude,
    lng: res.longitude,
    category: res.category || "기타",
    description: "",
    address: res.road_address || res.address,
    phone: res.phone,
    rating: res.rating,
    reviewCount: res.review_count,
    review: res.review_preview,
    link: res.place_url,
    images: res.images,
  };
}

export function mapDetailToPlaceData(res: RestaurantDetailResponse): PlaceData {
  return {
    id: `api-${res.id}`,
    apiId: res.id,
    name: res.name,
    lat: res.latitude,
    lng: res.longitude,
    category: res.category || "기타",
    description: res.description || "",
    address: res.road_address || res.address,
    phone: res.phone,
    rating: res.rating,
    reviewCount: res.review_count,
    link: res.place_url,
    images: res.images,
  };
}

export function mapReviewResponse(res: ReviewResponse): Review {
  return {
    id: String(res.id),
    
    // 💡 핵심 1: user 객체 안으로 접근해서 nickname을 꺼냅니다. (데이터가 없을 경우 "사용자"로 기본값)
    author: res.user?.nickname || "사용자", 
    
    rating: res.rating,
    content: res.content,
    
    // 💡 핵심 2: "2026-03-13T05:44..." 에서 앞의 10자리("2026-03-13")만 자릅니다.
    date: res.created_at ? res.created_at.slice(0, 10) : "",
    
    // 💡 핵심 3: 방어회 사진 같은 이미지 배열을 그대로 넘겨줍니다.
    images: res.images || [], 
  };
}