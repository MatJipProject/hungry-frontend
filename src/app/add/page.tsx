"use client";

import { useState } from "react";
import { searchRestaurants, registerRestaurant } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AddPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await searchRestaurants(query);
      setSearchResults(results);
    } catch (error) {
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (res: any) => {
    if (!confirm(`${res.name}을(를) 맛집 목록에 추가할까요?`)) return;
    setRegistering(true);
    try {
      await registerRestaurant({
        name: res.name,
        address: res.address,
        phone: res.phone,
        category: "기타", // 기본값
      });
      alert("성공적으로 등록되었습니다!");
      router.push("/list");
    } catch (error) {
      alert("등록에 실패했습니다.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white shadow-xl p-5">
      <h1 className="text-2xl font-black text-[#E8513D] mb-6">맛집 추가</h1>
      
      <form onSubmit={handleSearch} className="relative mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="등록하고 싶은 맛집 이름을 검색하세요"
          className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#E8513D]/20 transition-all"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#E8513D]"
        >
          {loading ? "..." : "🔍"}
        </button>
      </form>

      <div className="space-y-4">
        {searchResults.length === 0 && !loading && query && (
          <p className="text-center text-gray-400 py-10 text-sm">검색 결과가 없습니다.</p>
        )}
        
        {searchResults.map((res, idx) => (
          <div key={idx} className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900">{res.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{res.address}</p>
                {res.phone && <p className="text-[10px] text-gray-400 mt-0.5">{res.phone}</p>}
              </div>
              <button
                onClick={() => handleRegister(res)}
                disabled={registering}
                className="px-4 py-2 bg-[#E8513D] text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
              >
                추가
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
