"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link"; // Next.js의 Link 컴포넌트를 불러옵니다!
import { fetchPlaces, fetchTrendingPlaces, Place } from "@/lib/api"; // 경로에 맞게 임포트 해주세요!

// Swiper 스타일
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function HomePage() {
  // 선택된 도시를 저장하는 state (초기값은 '신사동'으로 설정)
  const [selectedCity, setSelectedCity] = useState("신사동");
  const [latestPlaces, setLatestPlaces] = useState<Place[]>([]);
  // 1. 핫한 맛집 상태 및 슬라이드 인덱스 관리
  const [trendingPlaces, setTrendingPlaces] = useState<Place[]>([]);
  const [currentTrendIndex, setCurrentTrendIndex] = useState(0);
  const cities = [
    "강남구",
    "신사동",
    "부산",
    "용산",
    "이태원",
    "여의도",
    "삼성",
    "성수",
  ];

  // 2. 컴포넌트 마운트 시 API 호출
  useEffect(() => {
    // 핫한 맛집 데이터 불러오기
    const loadTrending = async () => {
      try {
        const data = await fetchTrendingPlaces();
        // 슬라이더에 보여줄 개수만큼 자르기 (예: 5개)
        setTrendingPlaces(data.slice(0, 5));
      } catch (error) {
        console.error(error);
      }
    };
    loadTrending();

    const loadLatestPlaces = async () => {
      const data = await fetchPlaces();
      setLatestPlaces(data.slice(0, 3)); // 앞에서부터 딱 3개만 잘라서 저장!
    };
    loadLatestPlaces();
  }, []);

  // 2. 슬라이드 좌우 이동 함수
  const nextTrend = () => {
    setCurrentTrendIndex((prev) =>
      prev === trendingPlaces.length - 1 ? 0 : prev + 1,
    );
  };

  const prevTrend = () => {
    setCurrentTrendIndex((prev) =>
      prev === 0 ? trendingPlaces.length - 1 : prev - 1,
    );
  };

  return (
    <main className="w-full pb-20">
      {/* --- 1. 상단 와이드 라운드 배너 (동영상 슬라이더) --- */}
      {/* --- 1. 상단 와이드 라운드 배너 (단일 동영상) --- */}
      <section className="container mx-auto px-4 mt-6">
        {/* Swiper 대신 둥근 모서리를 가진 일반 div를 사용합니다 */}
        <div className="relative w-full h-[300px] md:h-[450px] rounded-[40px] overflow-hidden bg-[#1A1A1A]">
          {/* --- 🎬 동영상 배경 --- */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            {/* public 폴더에 있는 동영상 파일명을 적어주세요 (예: banner.mp4) */}
            <source src="/banner.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* --- 2. 지금 가장 핫한 맛집 --- */}
      {/* 배경 장식(SVG)이 absolute이므로, 부모인 이 section에 relative를 꼭 유지해 주세요! */}
      <section className="relative container mx-auto px-4 py-16 flex flex-col md:flex-row items-start justify-between gap-10">
        {/* --- 🍴 배경 장식 요소 (왼쪽 포크) --- */}
        <div className="absolute left-[-10%] md:left-[0%] bottom-[-5%] md:bottom-[-20%] w-[350px] h-[350px] md:w-[450px] md:h-[450px] z-0 pointer-events-none opacity-30 transform -rotate-12">
          <Image
            src="/fork.svg"
            alt=""
            aria-hidden="true"
            fill
            className="object-contain"
          />
        </div>

        {/* --- 🥄 배경 장식 요소 (오른쪽 수저) --- */}
        <div className="absolute right-[-10%] md:right-[-5%] bottom-[-10%] md:bottom-[-30%] w-[250px] h-[250px] md:w-[350px] md:h-[350px] z-0 pointer-events-none opacity-30 transform rotate-12">
          <Image
            src="/spoon.svg"
            alt=""
            aria-hidden="true"
            fill
            className="object-contain"
          />
        </div>

        {/* 왼쪽 텍스트 영역 */}
        <div className="relative z-10 flex-1 pt-6 md:pt-12">
          <span className="bg-black text-white text-[14px] px-3 py-1 rounded-full font-bold tracking-wider">
            Trending Now
          </span>
          <h2 className="text-[42px] md:text-[50px] font-black text-[#FF5C35] mt-4 leading-tight">
            지금 가장 핫한 맛집
          </h2>
          <p className="text-gray-600 mt-2 font-medium text-lg">
            커뮤니티 유저들이 뽑은 진짜 맛집
          </p>
        </div>

        {/* 오른쪽 슬라이더 영역 */}
        <div className="relative z-10 flex flex-col items-center gap-8 w-full md:w-auto shrink-0 mt-8 md:mt-0">
          <div className="flex items-center gap-3 sm:gap-6 w-full justify-center">
            {/* 좌측 화살표 */}
            <button
              onClick={prevTrend}
              className="w-10 h-10 rounded-full bg-[#D9D9D9] flex items-center justify-center text-white hover:bg-gray-400 transition-colors shrink-0 shadow-sm z-20"
            >
              <ChevronLeft size={32} strokeWidth={3} />
            </button>

            {/* 카드 영역 */}
            <div className="relative w-[280px] sm:w-[340px] md:w-[400px] aspect-[4/5] rounded-[40px] md:rounded-[50px] overflow-hidden shadow-2xl shrink-0 group cursor-pointer">
              {trendingPlaces.length > 0 ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

                  {/* 텍스트 정보 */}
                  <div className="absolute bottom-10 left-8 text-white z-20 pr-6">
                    <h3 className="text-2xl font-bold mb-2 truncate">
                      {trendingPlaces[currentTrendIndex].name}
                    </h3>
                    <p className="text-sm opacity-90 truncate">
                      {trendingPlaces[currentTrendIndex].region} |{" "}
                      {trendingPlaces[currentTrendIndex].category}
                    </p>
                  </div>

                  {/* 실제 이미지 */}
                  {trendingPlaces[currentTrendIndex].thumbnail ? (
                    <Image
                      src={trendingPlaces[currentTrendIndex].thumbnail}
                      alt={trendingPlaces[currentTrendIndex].name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center text-5xl">
                      {trendingPlaces[currentTrendIndex].emoji || "🍴"}
                    </div>
                  )}

                  {/* 클릭 시 해당 상세 페이지로 이동하게 하려면 Link로 감싸거나 onClick 활용 */}
                </>
              ) : (
                // 로딩 중 스켈레톤
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              )}
            </div>

            {/* 우측 화살표 */}
            <button
              onClick={nextTrend}
              className="w-10 h-10 rounded-full bg-[#D9D9D9] flex items-center justify-center text-white hover:bg-gray-400 transition-colors shrink-0 shadow-sm z-20"
            >
              <ChevronRight size={32} strokeWidth={3} />
            </button>
          </div>

          {/* 하단 인디케이터 */}
          <div className="flex items-center gap-2">
            {trendingPlaces.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentTrendIndex(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer shadow-sm ${
                  idx === currentTrendIndex
                    ? "w-6 bg-[#FF5C35]"
                    : "w-2.5 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- 3. 지역 카테고리 --- */}
      <section className="container mx-auto px-4 py-8 overflow-hidden">
        <p className="text-sm font-bold mb-4">어디로 먹으러 가볼까요</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
          {cities.map((city) => (
            <button
              key={city}
              // 1. 클릭 시 선택된 도시 state 업데이트
              onClick={() => setSelectedCity(city)}
              className={`px-6 py-2 rounded-full border text-sm whitespace-nowrap transition-all ${
                // 2. 현재 렌더링 중인 city와 selectedCity가 같으면 주황색, 아니면 회색
                selectedCity === city
                  ? "bg-[#FF5C35] border-[#FF5C35] text-white shadow-md"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      {/* --- 4. 메뉴 카테고리 (오렌지 섹션) --- */}
      <section className="bg-[#FF5C35] py-20 mt-10">
        <div className="container mx-auto px-4 text-center text-white">
          <span className="bg-white text-[#FF5C35] text-[14px] px-3 py-1 rounded-full font-bold tracking-wider">
            FOOD CATEGORY
          </span>
          <h2 className="text-3xl font-black mt-4 mb-4">지금 끌리는 메뉴는?</h2>
          <p className="text-white text-md font-medium mb-12">
            한식부터 양식, 분식, 디저트까지 <br />
            메뉴 카테고리를 선택하고 취향에 딱 맞는 맛을 찾아보세요.
          </p>

          <div className="grid grid-cols-4 gap-y-12 md:gap-y-20 gap-x-4 md:gap-x-8 max-w-6xl mx-auto">
            {[
              { name: "한식", src: "/icons/japanese.svg" },
              { name: "양식", src: "/icons/western.svg" },
              { name: "일식", src: "/icons/japanese.svg" },
              { name: "중식", src: "/icons/chinese.svg" },
              { name: "술집", src: "/icons/japanese.svg" },
              { name: "패스트푸드", src: "/icons/fastfood.svg" },
              { name: "카페", src: "/icons/cafe.svg" },
              { name: "분식", src: "/icons/bunsik.svg" },
            ].map((menu) => (
              <Link
                href={`/list?category=${menu.name}`}
                key={menu.name}
                className="flex flex-col items-center gap-4 cursor-pointer group"
              >
                <div className="relative w-28 h-28 sm:w-40 sm:h-40 md:w-56 md:h-56 group-hover:-translate-y-3 transition-transform duration-300">
                  <Image
                    src={menu.src}
                    alt={`${menu.name} 아이콘`}
                    fill
                    className="object-contain drop-shadow-lg"
                  />
                </div>
                <span className="text-sm md:text-lg font-bold mt-2">
                  {menu.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- 5. 방금 저장된 맛집 --- */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <span className="text-[#FF5C35] text-[10px] font-bold">
            NEW ARRIVAL
          </span>
          <h2 className="text-3xl font-black mt-2">방금 저장된 맛집</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {latestPlaces.length > 0
            ? latestPlaces.map((place) => (
                <div
                  key={place.id}
                  className="bg-[#1A1A1A] rounded-[40px] overflow-hidden text-white p-2 flex flex-col group cursor-pointer hover:-translate-y-2 transition-transform duration-300 shadow-xl"
                >
                  {/* --- 썸네일 이미지 영역 --- */}
                  <div className="relative h-[250px] bg-gray-800 rounded-[35px] mb-6 overflow-hidden">
                    {place.thumbnail ? (
                      <Image
                        src={place.thumbnail}
                        alt={place.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized // Supabase 등 외부 URL 이미지를 사용할 때 에러 방지용 (필요시 제거 가능)
                      />
                    ) : (
                      // 이미지가 없을 때의 대체(Fallback) UI
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        <span className="text-5xl">{place.emoji || "🍴"}</span>
                      </div>
                    )}

                    {/* 평점 뱃지 (왼쪽 상단에 예쁘게 띄우기) */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-yellow-400 border border-white/10 flex items-center gap-1">
                      <span>★</span> {place.rating.toFixed(1)}
                    </div>
                  </div>

                  {/* --- 텍스트 정보 영역 --- */}
                  <div className="px-6 pb-8 flex-1 flex flex-col justify-between">
                    {/* 최근 리뷰 내용이 없으므로, 카테고리와 식당 이름을 조합한 안내 문구 */}
                    <p className="text-sm leading-relaxed mb-6 opacity-90 line-clamp-2 font-medium">
                      "새로 등록된 핫플레이스! <br />
                      {place.region}에서 즐기는 완벽한 {place.category}{" "}
                      어떠세요?"
                    </p>

                    <div className="flex justify-between items-end">
                      <div className="text-[11px] opacity-70">
                        <span className="font-bold text-white opacity-100">
                          {place.region}
                        </span>{" "}
                        | {place.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : // --- 로딩 스켈레톤 UI ---
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#1A1A1A] rounded-[40px] p-2 animate-pulse"
                >
                  <div className="h-[250px] bg-gray-800 rounded-[35px] mb-6" />
                  <div className="px-6 pb-8">
                    <div className="h-4 bg-gray-700 rounded mb-2 w-full" />
                    <div className="h-4 bg-gray-700 rounded mb-6 w-2/3" />
                    <div className="h-3 bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
        </div>

        <div className="flex justify-center mt-16">
          <Link
            href="/list"
            className="bg-black text-white px-10 py-4 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors shadow-lg"
          >
            View More
          </Link>
        </div>
      </section>
      {/* --- 6. 푸터 (Footer) --- */}
      <footer className="w-full bg-[#FF5C35] py-12 mt-20">
        <div className="container mx-auto px-4 text-center flex flex-col items-center">
          {/* 브랜드명 또는 로고 */}
          <h2 className="text-white text-xl font-black mb-2 tracking-wide">
            배부룩
          </h2>

          {/* 짧은 브랜드 설명 */}
          <p className="text-white/80 text-sm font-medium mb-8">
            동네방네 소문난 진짜 맛집 찾기
          </p>

          {/* 카피라이트 문구 */}
          <p className="text-white/60 text-xs font-medium">
            © 2026 배부룩. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
