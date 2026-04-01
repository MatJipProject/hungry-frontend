"use client";

import { useState, useRef } from "react";
import Image from "next/image";

// 초기 SVG 상태 기준: 핀 오른쪽 칸부터 시계방향 순서
const MENUS = [
  "햄버거",
  "떡볶이",
  "제육볶음",
  "덮밥",
  "김밥",
  "파스타",
  "치킨",
  "카레",
  "짜장면",
  "삼겹살",
  "국밥",
  "김치찌개",
];

const SLICE_DEG = 360 / MENUS.length;

export default function MenuRoulette() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const baseRotation = useRef(0);

  const handleSpin = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    const winIndex = Math.floor(Math.random() * MENUS.length);
    // SVG 초기 상태: 핀이 김치찌개/햄버거 경계에 위치
    // index 0(햄버거) 중앙은 핀에서 SLICE_DEG/2 오른쪽 → 초기 오프셋 보정
    const SVG_INIT_OFFSET = SLICE_DEG / 2; // 15도
    const targetAngle = winIndex * SLICE_DEG + SVG_INIT_OFFSET;
    const spins = 360 * (5 + Math.floor(Math.random() * 3));
    const current = baseRotation.current % 360;
    const next =
      baseRotation.current +
      spins +
      ((360 - current) % 360) +
      (360 - targetAngle);
    baseRotation.current = next;
    setRotation(next);
    setTimeout(() => {
      setSpinning(false);
      setResult(MENUS[winIndex]);
    }, 3200);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col items-center gap-2">
        <div className="px-5 py-1.5 bg-white border-2 border-[#FF5631] rounded-full shadow-sm">
          <span className="text-sm font-semibold text-[#FF5631] tracking-widest uppercase">
            Menu Roulette
          </span>
        </div>
        <h1
          className="text-3xl text-[#FF5631] leading-tight"
          style={{ fontFamily: "'BagelFatOne-Regular', sans-serif" }}
        >
          오늘 뭐 먹지?
        </h1>
        <h2
          className="text-xl text-black leading-tight font-medium"
          style={{ fontFamily: "'Pretendard', sans-serif" }}
        >
          메뉴 고민? 룰렛이 대신 결정해드립니다
        </h2>
      </div>

      {/* 룰렛 영역 */}
      <div className="relative flex items-center justify-center w-[288px] h-[300px] sm:w-[420px] sm:h-[436px] md:w-[500px] md:h-[520px]">
        {/* 그림자 */}
        <Image
          src="/shadow.svg"
          alt=""
          fill={false}
          width={260}
          height={26}
          className="absolute bottom-0 z-0  w-[90%]"
          aria-hidden
        />

        {/* 핀 - 12시 고정 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <svg width="20" height="28" viewBox="0 0 24 32" fill="none">
            <path
              d="M12 32 C12 32 0 18 0 11 C0 4.9 5.4 0 12 0 C18.6 0 24 4.9 24 11 C24 18 12 32 12 32Z"
              fill="#E8513D"
            />
          </svg>
        </div>

        {/* 룰렛 - z-10 */}
        <div
          className="absolute z-10 inset-0"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 1.0)"
              : "none",
          }}
        >
          <Image
            src="/roulette.svg"
            alt="룰렛"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* START 버튼 - z-20, 룰렛 중앙 */}
        <button
          onClick={handleSpin}
          disabled={spinning}
          className={`absolute z-20 w-[22%] h-[22%] rounded-full transition-transform duration-150 ${
            spinning
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-105 active:scale-95 cursor-pointer"
          }`}
          aria-label="룰렛 돌리기"
        >
          <Image
            src="/roulette_start.svg"
            alt="시작"
            fill
            className="object-contain"
          />
        </button>
      </div>

      {/* 결과 - 항상 공간 차지해서 룰렛 위치 고정 */}
      <div className="w-full h-[80px] flex items-center justify-center">
        {result && (
          <div className="w-full text-center py-4 px-6 bg-orange-50 border border-orange-100 rounded-2xl">
            <p className="text-xs text-orange-400 font-medium mb-1">
              오늘의 추천 메뉴
            </p>
            <p className="text-xl font-extrabold text-[#E8513D]">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
