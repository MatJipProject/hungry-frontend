"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getNearbyRestaurants, getReviews } from "@/utils/api";
import { mapNearbyToPlaceData, mapReviewResponse } from "@/utils/mappers";
import type { PlaceData, Review } from "@/types/kakao";
import ReviewModal from "@/components/ReviewModal";
import { useAuth } from "@/context/AuthContext";

// ─── 별점 ─────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= Math.round(rating ?? 0) ? "#f59e0b" : "#e5e7eb"}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span style={{ fontSize: size - 1, color: "#6b7280", marginLeft: 3 }}>
        {(rating ?? 0).toFixed(1)}
      </span>
    </span>
  );
}

// ─── 이미지 스와이퍼 (CSS Scroll Snap 적용) ───────────────────────────────────

function ImageSwiper({ images }: { images?: string[] }) {
  if (!images?.length) {
    return (
      <div
        style={{
          height: 180,
          background: "#f3f4f6",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontSize: 13,
        }}
      >
        이미지 없음
      </div>
    );
  }

  return (
    <div
      className="hide-scrollbar" // 💡 스크롤바 숨기기 (이전 단계에서 style 태그에 추가했던 클래스)
      style={{
        display: "flex",
        overflowX: "auto", // 가로 스크롤 허용
        scrollSnapType: "x mandatory", // 스크롤 시 부드럽게 딱딱 걸리도록 설정
        gap: 12, // 이미지 사이 간격
        WebkitOverflowScrolling: "touch", // iOS에서 부드러운 스크롤 지원
      }}
    >
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`이미지 ${idx + 1}`}
          style={{
            flexShrink: 0,
            // 🌟 핵심: 이미지가 여러 장일 경우 85%만 차지하게 해서 다음 이미지가 살짝 보이게 만듭니다! (스와이프 유도)
            width: images.length > 1 ? "85%" : "100%",
            height: 200,
            objectFit: "cover",
            borderRadius: 12,
            scrollSnapAlign: "center", // 스크롤 멈출 때 화면 중앙에 자석처럼 붙게 함
          }}
        />
      ))}
    </div>
  );
}

function arrowBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.4)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 30,
    height: 30,
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  };
}

// ─── 리뷰 카드 ─────────────────────────────────────────────────────────────────

// 💡 맵퍼(mappers.ts)를 거쳤을 수도 있고, API 원본 그대로 올 수도 있으므로
// 두 경우를 모두 유연하게 처리할 수 있도록 any(또는 넉넉한 타입)로 받습니다.
function ReviewCard({ review }: { review: any }) {
  // 1. 날짜 포맷팅 (YYYY. MM. DD. 형식)
  const dateString = new Date(
    review.created_at || review.date,
  ).toLocaleDateString();

  // 2. 닉네임 추출 (API 원본은 user.nickname, 맵퍼 거쳤다면 author)
  const authorName = review.user?.nickname || review.author || "사용자";

  // 3. 이미지 배열 (없을 경우 빈 배열로 처리)
  const images: string[] = review.images || [];

  return (
    <div style={{ background: "#fafafa", borderRadius: 12, padding: 14 }}>
      {/* 🌟 1. 작성자 정보, 별점, 날짜 영역 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
            {authorName}
          </span>
          <Stars rating={review.rating} size={12} />
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{dateString}</span>
      </div>

      {/* 🌟 2. 리뷰 본문 영역 */}
      <p
        style={{
          fontSize: 13,
          color: "#374151",
          margin: images.length > 0 ? "0 0 12px" : "0", // 이미지가 있으면 아래쪽 여백 추가
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        {review.content}
      </p>

      {/* 🌟 3. 첨부 이미지 영역 (사진이 있을 때만 렌더링) */}
      {images.length > 0 && (
        <div
          className="hide-scrollbar"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {images.map((imgUrl, idx) => (
            <img
              key={idx}
              src={imgUrl}
              alt={`${authorName}님의 리뷰 사진 ${idx + 1}`}
              style={{
                width: 80, // 썸네일 크기 (정사각형)
                height: 80,
                objectFit: "cover", // 찌그러지지 않고 꽉 차게
                borderRadius: 8,
                flexShrink: 0, // 공간이 좁아도 이미지 크기 축소 방지
                border: "1px solid #f3f4f6",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 상세 패널 ─────────────────────────────────────────────────────────────────

function DetailPanel({
  place,
  onClose,
}: {
  place: PlaceData;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [skip, setSkip] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { user, openLoginModal } = useAuth();

  // 🌟 핵심 1: 바텀시트가 위로 끝까지 올라갔는지(확장되었는지) 체크하는 상태
  const [isExpanded, setIsExpanded] = useState(false);
  const [startY, setStartY] = useState(0);

  // 🌟 핵심 1: 리뷰 목록을 펼쳤는지 여부를 관리하는 새로운 상태
  const [isReviewListVisible, setIsReviewListVisible] = useState(false);

  useEffect(() => {
    if (!place.apiId) return;
    setReviews([]);
    setSkip(0);
    setHasMore(true);
    setIsExpanded(false);
    setIsReviewListVisible(false); // 식당이 바뀌면 리뷰 목록도 다시 닫아둡니다.
  }, [place.apiId]);

  // 🌟 핵심 3: [전체 리뷰 보기] 버튼을 눌렀을 때 최초 1회 API를 호출하는 함수
  const handleShowReviews = async () => {
    if (!place.apiId) return;
    setIsReviewListVisible(true); // 영역 펼치기
    setLoadingReviews(true);

    try {
      const res = await getReviews(place.apiId, 0, 3); // 처음 3개 불러오기
      setReviews(res.map(mapReviewResponse));
      setSkip(0);
      setHasMore(res.length === 3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadMoreReviews = async () => {
    // ... (기존 loadMoreReviews 로직 동일) ...
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
          return [
            ...prev,
            ...res.map(mapReviewResponse).filter((r) => !ids.has(r.id)),
          ];
        });
        setSkip(nextSkip);
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  // 🌟 핵심 2: 터치 드래그(스와이프) 방향을 감지해서 시트 올리고 내리기
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) {
      setIsExpanded(true); // 위로 50px 이상 쓸어올리면 확장!
    } else if (endY - startY > 50) {
      setIsExpanded(false); // 아래로 50px 이상 쓸어내리면 축소!
    }
  };

  const categoryTags =
    place.category
      ?.split(/[>,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3) ?? [];

  return (
    <>
      <style>{`
        /* 모바일 기본 (반만 올라온 상태) */
        .detail-panel {
          position: absolute;
          bottom: 0; left: 0; right: 0; width: 100%;
          height: 48vh; /* 🌟 초기 높이를 48% 정도로 설정 */
          background: #fff;
          border-top-left-radius: 24px; border-top-right-radius: 24px;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
          z-index: 10;
          display: flex; flex-direction: column;
          transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1); /* 🌟 높이 변할 때 부드럽게 애니메이션 */
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* 🌟 모바일 확장 상태 (위로 끌어올렸을 때) */
        .detail-panel.expanded {
          height: 90vh; 
        }

        /* 🌟 모바일 리뷰 영역 숨김 처리 */
        .review-section { display: none; }
        .detail-panel.expanded .review-section { display: block; animation: fadeIn 0.4s ease; }

        /* 데스크탑(PC) 스타일 덮어쓰기 */
        @media (min-width: 768px) {
          .detail-panel, .detail-panel.expanded {
            top: 16px; right: 16px; bottom: 16px; left: auto;
            width: 360px; height: auto !important; max-height: calc(100vh - 32px);
            border-radius: 24px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08);
            animation: slideInFloating 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .drag-handle { display: none !important; }
          .review-section { display: block !important; } /* PC는 공간이 많으니 항상 리뷰 표시 */
        }

        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideInFloating { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 🌟 isExpanded 상태에 따라 클래스 추가 */}
      <div className={`detail-panel ${isExpanded ? "expanded" : ""}`}>
        {/* 🌟 상단 헤더 영역 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between", // 🌟 핵심: 왼쪽(카테고리)과 오른쪽(버튼)을 양끝으로 밀어줍니다.
            alignItems: "center",
            padding: "12px 16px 8px",
            flexShrink: 0,
          }}
        >
          {/* 🌟 1. 왼쪽: 음식 카테고리 태그 */}
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", zIndex: 11 }}
          >
            {categoryTags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: "#fef2f2",
                  color: "#ef4444",
                  border: "1px solid #fecaca",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 2. 중앙: 모바일용 드래그 손잡이 (화면 정중앙 고정) */}
          <div
            className="drag-handle"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 20px",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: "#e5e7eb",
                borderRadius: 99,
              }}
            />
          </div>

          {/* 3. 오른쪽: 즐겨찾기 & 닫기 버튼 묶음 */}
          <div style={{ display: "flex", gap: 8, zIndex: 11 }}>
            <button
              onClick={() => setLiked((l) => !l)}
              style={{
                background: "#f3f4f6",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              {liked ? "❤️" : "🤍"}
            </button>

            <button
              onClick={onClose}
              style={{
                background: "#f3f4f6",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4b5563",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 스크롤 영역 */}
        <div
          className="hide-scrollbar"
          style={{ overflowY: "auto", flex: 1, width: "100%" }}
        >
          <div style={{ padding: "4px 20px 32px" }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 4px",
              }}
            >
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

            {/* 🌟 4. nearby API에서 가져온 대표 한 줄 평 (미리보기) */}
            {place.review && (
              <div
                style={{
                  background: "#f9fafb",
                  borderLeft: "3px solid #E8513D",
                  padding: "12px 16px",
                  borderRadius: "0 8px 8px 0",
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#4b5563",
                    fontWeight: 500,
                    fontStyle: "italic",
                    lineHeight: 1.5,
                  }}
                >
                  "{place.review}"
                </span>
              </div>
            )}

            {/* 🌟 2. 이미지 스와이퍼를 위로 끌어올림 (네이버지도 스타일) */}
            <ImageSwiper images={place.images} />

            {place.link && (
              <a
                href={place.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 16,
                  padding: "10px",
                  background: "#fef9c3",
                  color: "#92400e",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                카카오맵에서 보기 →
              </a>
            )}

            {/* 🌟 3. 리뷰 영역 (모바일에서는 확장 전까지 숨겨짐) */}
            <div className="review-section">
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #f3f4f6",
                  margin: "24px 0 18px",
                }}
              />

              {/* 🌟 리뷰 타이틀 & 리뷰 쓰기 버튼 (항상 보임) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  방문자 리뷰
                </h3>

                <button
                  onClick={() => {
                    // 🌟 2. 로그인 여부 체크
                    if (!user) {
                      // 로그인 안 했으면 로그인 모달 띄우기
                      openLoginModal();
                    } else {
                      // 로그인 했으면 리뷰 작성 모달 띄우기
                      setIsReviewModalOpen(true);
                    }
                  }}
                  style={{
                    background: "#E8513D",
                    color: "#ffffff", // 🌟 오타 수정! 완벽한 흰색 적용
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  리뷰 쓰기
                </button>
              </div>

              {/* 🌟 5. [전체 리뷰 보기] 버튼 vs 실제 리뷰 목록 렌더링 */}
              {place.reviewCount === 0 ? (
                // 리뷰가 아예 없는 식당일 때
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    background: "#f9fafb",
                    borderRadius: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    아직 작성된 리뷰가 없어요.
                    <br />
                    <strong style={{ color: "#374151" }}>첫 번째 리뷰</strong>를
                    남겨보세요!
                  </p>
                </div>
              ) : !isReviewListVisible ? (
                // 리뷰가 있지만 아직 "보기" 버튼을 안 눌렀을 때 (미호출 상태)
                <button
                  onClick={handleShowReviews}
                  style={{
                    width: "100%",
                    padding: "14px 0",
                    background: "#f3f4f6",
                    color: "#4b5563",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  리뷰 {place.reviewCount}개 전체보기 ↓
                </button>
              ) : (
                // "보기" 버튼을 눌러서 리뷰 데이터를 받아온 상태
                <div>
                  {loadingReviews && reviews.length === 0 ? (
                    <p
                      style={{
                        textAlign: "center",
                        padding: "20px 0",
                        fontSize: 13,
                        color: "#9ca3af",
                      }}
                    >
                      리뷰를 불러오는 중...
                    </p>
                  ) : (
                    <>
                      {reviews.map((r) => (
                        <div key={r.id} style={{ marginBottom: 12 }}>
                          <ReviewCard review={r} />
                        </div>
                      ))}
                      {hasMore && (
                        <button
                          onClick={loadMoreReviews}
                          disabled={loadingReviews}
                          style={{
                            display: "block",
                            width: "100%",
                            marginTop: 8,
                            background: "none",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "8px 0",
                            fontSize: 12,
                            color: "#6b7280",
                            cursor: "pointer",
                          }}
                        >
                          {loadingReviews ? "로딩 중..." : "더 불러오기"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 🌟 리뷰 작성 모달 렌더링 */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        placeId={place.id.replace("api-", "")} // API ID만 전송 (placeData 구조에 따라 조정하세요)
        placeName={place.name}
        onSuccess={() => {
          // 등록 성공 시 리뷰 목록을 처음부터 다시 불러와서 최신 상태로 갱신!
          setSkip(0);
          setReviews([]);
          setHasMore(true);
          getReviews(place.apiId!, 0, 3)
            .then((res) => setReviews(res.map(mapReviewResponse)))
            .catch(console.error);
        }}
      />
    </>
  );
}
// ─── 카카오맵 컴포넌트 ─────────────────────────────────────────────────────────

interface MapProps {
  places: PlaceData[];
  currentLocation: { lat: number; lng: number } | null;
  onPlaceClick: (place: PlaceData) => void;
  onBoundsChange: (lat: number, lng: number, radius: number) => void;
  onMapClick: () => void;
}

function KakaoMap({
  places,
  currentLocation,
  onPlaceClick,
  onBoundsChange,
  onMapClick,
}: MapProps) {
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
    const radius = Math.round(
      Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000,
    );
    onBoundsChange(center.getLat(), center.getLng(), Math.min(radius, 5000));
  }, [onBoundsChange]);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    try {
      const center = currentLocation
        ? new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng)
        : new window.kakao.maps.LatLng(37.4842, 126.8959);
      const map = new window.kakao.maps.Map(mapRef.current, {
        center,
        level: 4,
      });
      mapInstanceRef.current = map;
      window.kakao.maps.event.addListener(map, "idle", notifyBoundsChange);
      setMapReady(true);
    } catch (e) {
      setError("지도를 생성할 수 없습니다.");
    }
  }, [currentLocation, notifyBoundsChange]);

  useEffect(() => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
      return;
    }

    const existing = document.querySelector(
      'script[src*="dapi.kakao.com"]',
    ) as HTMLScriptElement | null;
    if (existing) {
      let t = 0;
      const iv = setInterval(() => {
        t += 100;
        if (window.kakao?.maps) {
          clearInterval(iv);
          window.kakao.maps.load(initMap);
        } else if (t >= 10000) {
          clearInterval(iv);
          setError("카카오맵 로드 시간 초과");
        }
      }, 100);
      return () => clearInterval(iv);
    }

    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) {
      setError("NEXT_PUBLIC_KAKAO_MAP_KEY 가 없습니다.");
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(initMap);
    script.onerror = () =>
      setError(
        "카카오맵을 불러올 수 없습니다. API 키와 도메인 설정을 확인하세요.",
      );
    document.head.appendChild(script);
  }, [initMap]);

  // 🌟 현재 위치 마커 (커스텀 디자인 적용)
  useEffect(() => {
    if (!mapReady || !currentLocation) return;

    // 기존 마커가 있다면 지도에서 지움
    if (currentMarkerRef.current) currentMarkerRef.current.setMap(null);

    const pos = new window.kakao.maps.LatLng(
      currentLocation.lat,
      currentLocation.lng,
    );

    // 💡 마법의 커스텀 마커: SVG 코드를 Base64(URI)로 굽어 넣어서 파란색 둥근 점을 만듭니다.
    // 외부 이미지 링크 없이 깔끔하게 렌더링됩니다!
    const svgIcon = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='%233B82F6' stroke='%23FFFFFF' stroke-width='3'/%3E%3C/svg%3E`;
    const imageSize = new window.kakao.maps.Size(24, 24);

    // 마커 이미지 객체 생성
    const markerImage = new window.kakao.maps.MarkerImage(svgIcon, imageSize);

    // 내 위치 마커 생성 (커스텀 이미지 적용 및 zIndex 올려서 식당 마커 위에 뜨게)
    currentMarkerRef.current = new window.kakao.maps.Marker({
      position: pos,
      map: mapInstanceRef.current,
      image: markerImage,
      zIndex: 3,
    });

    // 위치가 업데이트될 때 중심으로 부드럽게 이동 (GPS 허용 시 홍대 -> 내 위치로 슝 이동!)
    mapInstanceRef.current.panTo(pos);
  }, [currentLocation, mapReady]);

  // 식당 마커
  useEffect(() => {
    if (!mapReady || !places.length) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    places.forEach((place) => {
      const pos = new window.kakao.maps.LatLng(place.lat, place.lng);
      const marker = new window.kakao.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        onPlaceClick(place);
        mapInstanceRef.current.panTo(pos);
      });
      markersRef.current.push(marker);
    });
  }, [places, mapReady, onPlaceClick]);

  // 🌟 2. 지도 클릭 및 드래그(스와이프) 감지 로직 추가
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleInteract = () => {
      // 빈 지도를 드래그하거나 클릭하면 부모에게 닫으라는 신호를 보냅니다.
      onMapClick();
    };

    // 지도 클릭 시
    window.kakao.maps.event.addListener(map, "click", handleInteract);
    // 지도 드래그(모바일 스와이프) 시작 시
    window.kakao.maps.event.addListener(map, "dragstart", handleInteract);

    // 컴포넌트 언마운트 시 이벤트 리스너 깔끔하게 정리
    return () => {
      window.kakao.maps.event.removeListener(map, "click", handleInteract);
      window.kakao.maps.event.removeListener(map, "dragstart", handleInteract);
    };
  }, [mapReady, onMapClick]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {!mapReady && !error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "3px solid #e5e7eb",
              borderTopColor: "#E8513D",
              animation: "spin 0.8s linear infinite",
              marginBottom: 12,
            }}
          />
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            지도를 불러오는 중...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fef2f2",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "#ef4444",
              textAlign: "center",
              padding: "0 24px",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {mapReady && currentLocation && (
        <button
          onClick={() => {
            mapInstanceRef.current?.setCenter(
              new window.kakao.maps.LatLng(
                currentLocation.lat,
                currentLocation.lng,
              ),
            );
            mapInstanceRef.current?.setLevel(4);
          }}
          style={{
            position: "absolute",
            bottom: 16,
            right: 12,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.92)",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="현재 위치로 이동"
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="#0EA5E9"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
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
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
  const isFetchingRef = useRef(false);
  const HONGDAE_COORD = { lat: 37.5568, lng: 126.9242 };

  useEffect(() => {
    // 브라우저가 GPS를 지원하지 않으면 그대로 홍대 유지
    if (!navigator.geolocation) return;

    // 🌟 2. 사용자가 GPS를 허용하면 그때 위치를 덮어씌웁니다.
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentLocation({ lat: coords.latitude, lng: coords.longitude });
      },
      (error) => {
        // 사용자가 거부(블락)하면 에러 로그만 남기고 기본 위치(홍대)를 유지합니다.
        console.log(
          "GPS 접근이 거부되었거나 실패했습니다. 홍대 위치를 유지합니다.",
          error,
        );
      },
    );
  }, []);

  useEffect(() => {
    if (!currentLocation) return;
    getNearbyRestaurants(currentLocation.lat, currentLocation.lng, 1000)
      .then((res) => setPlaces(res.map(mapNearbyToPlaceData)))
      .catch(console.error);
  }, [currentLocation]);

  const handleBoundsChange = useCallback(
    (lat: number, lng: number, radius: number) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      getNearbyRestaurants(lat, lng, radius)
        .then((res) => setPlaces(res.map(mapNearbyToPlaceData)))
        .catch(console.error)
        .finally(() => {
          isFetchingRef.current = false;
        });
    },
    [],
  );

  const handlePlaceClick = useCallback((place: PlaceData) => {
    setSelectedPlace(place);
  }, []);

  // 🌟 3-1. 지도 빈 곳 조작 시 패널을 닫는 함수 생성
  const handleMapClick = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        // 🌟 부모(RootLayout)의 제한을 부수고 나가는 마법의 2줄!
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        height: "calc(100vh - 60px)",
        overflow: "hidden",
      }}
    >
      <KakaoMap
        places={places}
        currentLocation={currentLocation}
        onPlaceClick={handlePlaceClick}
        onBoundsChange={handleBoundsChange}
        onMapClick={handleMapClick} // 🌟 3-2. 프롭 연결!
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
