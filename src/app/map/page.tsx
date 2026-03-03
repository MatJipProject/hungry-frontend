"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getNearbyRestaurants, getReviews } from "@/utils/api";
import { mapNearbyToPlaceData, mapReviewResponse } from "@/utils/mappers";
import type { PlaceData, Review } from "@/types/kakao";

// ─── 별점 ─────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating ?? 0) ? "#f59e0b" : "#e5e7eb"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span style={{ fontSize: size - 1, color: "#6b7280", marginLeft: 3 }}>
        {(rating ?? 0).toFixed(1)}
      </span>
    </span>
  );
}

// ─── 이미지 스와이퍼 ───────────────────────────────────────────────────────────

function ImageSwiper({ images }: { images?: string[] }) {
  const [idx, setIdx] = useState(0);

  if (!images?.length) return (
    <div style={{
      height: 180, background: "#f3f4f6", borderRadius: 12,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#9ca3af", fontSize: 13,
    }}>이미지 없음</div>
  );

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
      <img
        src={images[idx]}
        alt={`이미지 ${idx + 1}`}
        style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
      />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx((p) => (p - 1 + images.length) % images.length)}
            style={arrowBtn("left")}>‹</button>
          <button onClick={() => setIdx((p) => (p + 1) % images.length)}
            style={arrowBtn("right")}>›</button>
          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5,
          }}>
            {images.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{
                width: 6, height: 6, borderRadius: "50%", cursor: "pointer",
                background: i === idx ? "#fff" : "rgba(255,255,255,0.5)",
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function arrowBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", [side]: 8,
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.4)", color: "#fff", border: "none",
    borderRadius: "50%", width: 30, height: 30, fontSize: 18,
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 1,
  };
}

// ─── 리뷰 카드 ─────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div style={{ background: "#fafafa", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Stars rating={review.rating} size={12} />
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{review.date}</span>
      </div>
      {review.author && (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 4px" }}>{review.author}</p>
      )}
      <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
        {review.content}
      </p>
    </div>
  );
}

// ─── 상세 패널 ─────────────────────────────────────────────────────────────────

function DetailPanel({ place, onClose }: { place: PlaceData; onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [skip, setSkip] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    if (!place.apiId) return;
    setReviews([]);
    setSkip(0);
    setShowReviews(false);
    setHasMore(true);

    // 초기 리뷰 로드
    getReviews(place.apiId, 0, 3)
      .then((res) => setReviews(res.map(mapReviewResponse)))
      .catch(console.error);
  }, [place.apiId]);

  const loadMoreReviews = async () => {
    if (!place.apiId) return;
    setLoadingReviews(true);
    try {
      const nextSkip = skip + 3;
      const res = await getReviews(place.apiId, nextSkip, 10);
      if (!res.length) {
        setHasMore(false);
      } else {
        setReviews((prev) => {
          const ids = new Set(prev.map((r) => r.id));
          return [...prev, ...res.map(mapReviewResponse).filter((r) => !ids.has(r.id))];
        });
        setSkip(nextSkip);
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  const categoryTags = place.category
    ?.split(/[>,]/).map((s) => s.trim()).filter(Boolean).slice(0, 3) ?? [];

  return (
    <div style={{
      position: "absolute", top: 0, right: 0,
      width: 360, height: "100%",
      background: "#fff",
      boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
      overflowY: "auto", zIndex: 10,
      animation: "slideIn 0.22s ease",
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0 }
          to   { transform: translateX(0);    opacity: 1 }
        }
      `}</style>

      <button onClick={onClose} style={{
        position: "absolute", top: 12, left: 12, zIndex: 11,
        background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%",
        width: 32, height: 32, fontSize: 16, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      }}>✕</button>

      <div style={{ padding: "52px 20px 32px" }}>

        {/* 카테고리 태그 + 찜 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categoryTags.map((tag) => (
              <span key={tag} style={{
                background: "#fef2f2", color: "#ef4444",
                border: "1px solid #fecaca", borderRadius: 999,
                padding: "3px 10px", fontSize: 12, fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
          <button onClick={() => setLiked((l) => !l)} style={{
            background: "none", border: "none", fontSize: 22,
            cursor: "pointer", lineHeight: 1,
          }}>
            {liked ? "❤️" : "🤍"}
          </button>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
          {place.name}
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 8px" }}>
          {place.address}
        </p>
        <div style={{ marginBottom: 20 }}>
          <Stars rating={place.rating ?? 0} />
          <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 6 }}>
            리뷰 {place.reviewCount ?? 0}개
          </span>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0 0 18px" }} />

        {/* 리뷰 섹션 */}
        {reviews.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 10px" }}>리뷰</h3>

            <ReviewCard review={reviews[0]} />

            {!showReviews ? (
              <button onClick={() => setShowReviews(true)} style={{
                display: "block", width: "100%", marginTop: 8,
                background: "none", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "8px 0",
                fontSize: 12, color: "#6b7280", cursor: "pointer",
              }}>
                리뷰 더보기 →
              </button>
            ) : (
              <>
                {reviews.slice(1).map((r) => (
                  <div key={r.id} style={{ marginTop: 8 }}>
                    <ReviewCard review={r} />
                  </div>
                ))}
                {hasMore && (
                  <button onClick={loadMoreReviews} disabled={loadingReviews} style={{
                    display: "block", width: "100%", marginTop: 8,
                    background: "none", border: "1px solid #e5e7eb",
                    borderRadius: 8, padding: "8px 0",
                    fontSize: 12, color: "#6b7280", cursor: "pointer",
                  }}>
                    {loadingReviews ? "로딩 중..." : "더 불러오기"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0 0 18px" }} />

        <ImageSwiper images={place.images} />

        {place.link && (
          <a href={place.link} target="_blank" rel="noopener noreferrer" style={{
            display: "block", textAlign: "center", marginTop: 16,
            padding: "10px", background: "#fef9c3", color: "#92400e",
            borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            카카오맵에서 보기 →
          </a>
        )}
      </div>
    </div>
  );
}

// ─── 카카오맵 컴포넌트 ─────────────────────────────────────────────────────────

interface MapProps {
  places: PlaceData[];
  currentLocation: { lat: number; lng: number } | null;
  onPlaceClick: (place: PlaceData) => void;
  onBoundsChange: (lat: number, lng: number, radius: number) => void;
}

function KakaoMap({ places, currentLocation, onPlaceClick, onBoundsChange }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentMarkerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");

  const notifyBoundsChange = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao) return;
    const center = map.getCenter();
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latDiff = Math.abs(ne.getLat() - sw.getLat()) / 2;
    const lngDiff = Math.abs(ne.getLng() - sw.getLng()) / 2;
    const radius = Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000);
    onBoundsChange(center.getLat(), center.getLng(), Math.min(radius, 5000));
  }, [onBoundsChange]);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    try {
      const center = currentLocation
        ? new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng)
        : new window.kakao.maps.LatLng(37.4842, 126.8959);
      const map = new window.kakao.maps.Map(mapRef.current, { center, level: 4 });
      mapInstanceRef.current = map;
      window.kakao.maps.event.addListener(map, "idle", notifyBoundsChange);
      setMapReady(true);
    } catch (e) {
      setError("지도를 생성할 수 없습니다.");
    }
  }, [currentLocation, notifyBoundsChange]);

  useEffect(() => {
    if (window.kakao?.maps) { window.kakao.maps.load(initMap); return; }

    const existing = document.querySelector('script[src*="dapi.kakao.com"]') as HTMLScriptElement | null;
    if (existing) {
      let t = 0;
      const iv = setInterval(() => {
        t += 100;
        if (window.kakao?.maps) { clearInterval(iv); window.kakao.maps.load(initMap); }
        else if (t >= 10000) { clearInterval(iv); setError("카카오맵 로드 시간 초과"); }
      }, 100);
      return () => clearInterval(iv);
    }

    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) { setError("NEXT_PUBLIC_KAKAO_MAP_KEY 가 없습니다."); return; }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(initMap);
    script.onerror = () => setError("카카오맵을 불러올 수 없습니다. API 키와 도메인 설정을 확인하세요.");
    document.head.appendChild(script);
  }, [initMap]);

  // 현재 위치 마커
  useEffect(() => {
    if (!mapReady || !currentLocation) return;
    if (currentMarkerRef.current) currentMarkerRef.current.setMap(null);
    const pos = new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);
    currentMarkerRef.current = new window.kakao.maps.Marker({ position: pos, map: mapInstanceRef.current });
    mapInstanceRef.current.setCenter(pos);
  }, [currentLocation, mapReady]);

  // 식당 마커
  useEffect(() => {
    if (!mapReady || !places.length) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    places.forEach((place) => {
      const pos = new window.kakao.maps.LatLng(place.lat, place.lng);
      const marker = new window.kakao.maps.Marker({ position: pos, map: mapInstanceRef.current });
      window.kakao.maps.event.addListener(marker, "click", () => {
        onPlaceClick(place);
        mapInstanceRef.current.panTo(pos);
      });
      markersRef.current.push(marker);
    });
  }, [places, mapReady, onPlaceClick]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {!mapReady && !error && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#f9fafb",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "3px solid #e5e7eb", borderTopColor: "#E8513D",
            animation: "spin 0.8s linear infinite", marginBottom: 12,
          }} />
          <p style={{ fontSize: 13, color: "#9ca3af" }}>지도를 불러오는 중...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {error && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2",
        }}>
          <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", padding: "0 24px" }}>{error}</p>
        </div>
      )}

      {mapReady && currentLocation && (
        <button
          onClick={() => {
            mapInstanceRef.current?.setCenter(
              new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng)
            );
            mapInstanceRef.current?.setLevel(4);
          }}
          style={{
            position: "absolute", bottom: 16, right: 12, zIndex: 10,
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)", border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="현재 위치로 이동"
        >
          <svg width="18" height="18" fill="none" stroke="#0EA5E9" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function MapPage() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentLocation({ lat: 37.4842, lng: 126.8959 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCurrentLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => setCurrentLocation({ lat: 37.4842, lng: 126.8959 })
    );
  }, []);

  useEffect(() => {
    if (!currentLocation) return;
    getNearbyRestaurants(currentLocation.lat, currentLocation.lng, 1000)
      .then((res) => setPlaces(res.map(mapNearbyToPlaceData)))
      .catch(console.error);
  }, [currentLocation]);

  const handleBoundsChange = useCallback((lat: number, lng: number, radius: number) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    getNearbyRestaurants(lat, lng, radius)
      .then((res) => setPlaces(res.map(mapNearbyToPlaceData)))
      .catch(console.error)
      .finally(() => { isFetchingRef.current = false; });
  }, []);

  const handlePlaceClick = useCallback((place: PlaceData) => {
    setSelectedPlace(place);
  }, []);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "calc(100vh - 60px)",
      overflow: "hidden",
    }}>
      <KakaoMap
        places={places}
        currentLocation={currentLocation}
        onPlaceClick={handlePlaceClick}
        onBoundsChange={handleBoundsChange}
      />

      {selectedPlace !== null && (
        <DetailPanel
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
}