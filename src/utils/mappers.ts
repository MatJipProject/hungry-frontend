import type { PlaceData, Review } from "@/types/kakao";
import type {
  RestaurantNearbyResponse,
  RestaurantDetailResponse,
  ReviewResponse,
  SearchRestaurantResponse,
} from "@/types/api";

export function mapNearbyToPlaceData(res: RestaurantNearbyResponse): PlaceData {
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
    author: res.nickname || `사용자${res.user_id}`,
    rating: res.rating,
    content: res.content,
    date: res.created_at.slice(0, 10),
  };
}