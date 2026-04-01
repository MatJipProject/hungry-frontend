import Image from "next/image";
import MenuRoulette from "@/components/MenuRoulette";

export default function RoulettePage() {
  return (
    <div className="relative min-h-[calc(100vh-60px)] bg-gray-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* 배경 장식 SVG */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-8 pointer-events-none select-none">
        <Image
          src="/left.svg"
          alt=""
          width={150}
          height={344}
          className="opacity-60"
          aria-hidden
        />
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-8 pointer-events-none select-none">
        <Image
          src="/right.svg"
          alt=""
          width={170}
          height={307}
          className="opacity-60"
          aria-hidden
        />
      </div>

      <MenuRoulette />
    </div>
  );
}
