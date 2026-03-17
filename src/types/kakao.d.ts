// ── 카카오맵 및 공통 UI 타입 정의 ──

/** 개별 리뷰 (mappers.ts → UI 컴포넌트용) */
export interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  images: string[];
}

/** 지도에 표시되는 맛집 데이터 (API 응답을 mappers.ts로 변환한 결과) */
export interface PlaceData {
  id: string;
  apiId?: number;
  name: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  review?: string;          // 대표 리뷰 한 줄
  reviews?: Review[];
  link?: string;
  images?: string[];        // image URL 문자열 배열
  tags?: string[];
  priceRange?: string;
  openHours?: string;
  isHot?: boolean;
  area?: string;

  // 🌟 (추천) API 응답에 있는 유용한 데이터 추가
  distance?: number;        // 내 위치와의 거리 (미터 단위)
  isBookmarked?: boolean;   // 내가 찜한 맛집인지 여부
}

declare global {
  interface Window {
    kakao: any;
  }
}

export {};