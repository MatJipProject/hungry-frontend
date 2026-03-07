"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { searchRestaurantsByName } from "@/lib/api";

// 검색 결과 타입 정의
interface SearchResult {
  id: string;
  name: string;
  category: string;
  phone: string;
  place_url: string;
  road_address: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string;
}

export default function AddRestaurantPage() {
  const router = useRouter();
  const { user, openLoginModal, openSignupModal } = useAuth();
  const [formData, setFormData] = useState({
    kakao_place_id: "",
    name: "",
    category: "",
    phone: "",
    place_url: "",
    road_address: "",
    address: "",
    latitude: 0,
    longitude: 0,
    image_url: "",
    content: "",
    review_images: [],
  });
  const [restaurantName, setRestaurantName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isReviewChecked, setIsReviewChecked] = useState(false); // 리뷰 작성 체크박스
  const [rating, setRating] = useState(5);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!restaurantName.trim()) {
      alert("검색할 맛집 이름을 입력해주세요.");
      return;
    }

    console.log("Searching:", restaurantName);

    // 1. 분리해둔 API 함수 호출! (알아서 매핑된 배열이 리턴됨)
    const results = await searchRestaurantsByName(restaurantName);

    // 2. 리턴받은 데이터를 바로 상태에 저장
    setSearchResults(results);

    // 3. (선택) 검색 결과가 0개일 때 알림창
    if (results.length === 0) {
      alert("검색 결과가 없습니다. 다른 이름으로 검색해 보세요.");
    }
  };

  const handleSelectRestaurant = (selectedItem: SearchResult) => {
    setFormData((prev) => ({
      ...prev,
      kakao_place_id: selectedItem.id,
      name: selectedItem.name,
      address: selectedItem.address,
      category: selectedItem.category || "",
      phone: selectedItem.phone || "",
      place_url: selectedItem.place_url || "",
      road_address: selectedItem.road_address || "",
      image_url: selectedItem.image_url || "",
      latitude: selectedItem.latitude || 0,
      longitude: selectedItem.longitude || 0,
    }));

    // 선택 후 검색 결과 목록 숨기기 (선택사항)
    setSearchResults([]);
    // 검색창 텍스트도 선택한 식당 이름으로 바꿔주기 (선택사항)
    setRestaurantName(selectedItem.name);
  };

  // 사용자가 직접 이미지를 선택했을 때 실행되는 함수
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 필수 값 검증 (상호명 및 카카오 고유 ID 등)
    // formData에 kakao_place_id가 저장되어 있다고 가정합니다.
    if (!formData.name) {
      alert("맛집을 검색하고 선택해주세요.");
      return;
    }

    // 2. 리뷰 옵션 체크 시 유효성 검사
    if (isReviewChecked && formData.content.length < 10) {
      alert("리뷰 내용을 10자 이상 작성해주세요.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요한 서비스입니다.");
      openLoginModal();
      return;
    }

    // 3. 백엔드 스키마(ReviewWithRestaurantCreate)에 맞춘 데이터 페이로드 구성
    const requestData = {
      restaurant: {
        kakao_place_id: formData.kakao_place_id, // 검색 결과에서 받아온 카카오 장소 ID
        name: formData.name,
        category: formData.category || null,
        phone: formData.phone || null,
        place_url: formData.place_url || null,
        road_address: formData.road_address || formData.address || null,
        address: formData.address || null,
        image_url: formData.image_url || null, // 검색된 원본 이미지 URL
        latitude: Number(formData.latitude), // float 타입 변환
        longitude: Number(formData.longitude), // float 타입 변환
      },
      // 사용자가 리뷰 작성을 체크했을 때만 리뷰 데이터를 포함, 아니면 null 처리
      rating: isReviewChecked ? rating : null,
      content: isReviewChecked ? formData.content : null,
    };

    const requestBody = new FormData();

    // JSON 데이터를 문자열로 변환하여 'request_data'라는 필드명으로 전송
    requestBody.append("request_data", JSON.stringify(requestData));

    // 사용자가 직접 올린 사진이 있을 경우에만 파일 전송
    if (imageFile) {
      requestBody.append("files", imageFile);
    }

    try {
      // 💡 변경점: URL 경로 수정 (보통 생성 엔드포인트는 ID를 붙이지 않음) 및 POST 메서드 사용
      const response = await fetch(
        `https://api.baebulook.site/api/v1/reviews/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: requestBody,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "맛집 등록에 실패했습니다.");
      }

      alert("맛집이 성공적으로 등록되었습니다!");
      router.push("/list"); // 등록 성공 시 리스트 페이지로 이동
    } catch (error: any) {
      console.error("Failed to add restaurant:", error);
      alert(error.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex flex-col items-center justify-center text-center p-4">
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg max-w-md w-full border border-gray-100">
          <svg
            className="w-16 h-16 mx-auto text-orange-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            로그인이 필요해요
          </h1>
          <p className="text-gray-600 mb-6">
            맛집을 추가하려면 먼저 로그인해주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openLoginModal}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#E8513D] to-[#F97316] text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              로그인
            </button>
            <button
              onClick={openSignupModal}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors duration-200"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-orange-50 to-rose-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-white/50">
          <div className="bg-gradient-to-r from-[#E8513D] to-[#F97316] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">맛집 추가하기</h1>
              <p className="opacity-90 font-medium">
                나만의 숨은 맛집을 공유해보세요!
              </p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* 맛집 검색 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                맛집 검색 <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="restaurantName"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#E8513D] focus:ring-0 transition-colors bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400"
                  placeholder="예: 맛있는 떡볶이집"
                  required
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-[#E8513D] to-[#F97316] text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  검색
                </button>
              </div>
              {searchResults.length > 0 && (
                <ul className="mt-2 border border-gray-200 rounded-xl bg-white shadow-lg z-20 relative">
                  {searchResults.map((result) => (
                    <li
                      key={result.id}
                      onClick={() => handleSelectRestaurant(result)}
                      className="p-4 flex items-center cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <img
                        src={result.image_url}
                        alt={result.name}
                        className="w-10 h-10 rounded-full mr-4 object-cover"
                      />
                      <div>
                        <p className="font-semibold">{result.name}</p>
                        <p className="text-sm text-gray-500">
                          {result.address}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 카테고리 (자동 입력 & 고정) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-100 text-gray-600 focus:outline-none cursor-not-allowed"
                placeholder="맛집 검색 시 자동으로 입력됩니다"
                readOnly
                required
              />
            </div>

            {/* 주소 (자동 입력 & 고정) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-100 text-gray-600 focus:outline-none cursor-not-allowed"
                placeholder="맛집 검색 시 자동으로 입력됩니다"
                readOnly
                required
              />
            </div>

            {/* --- 리뷰 작성 옵션 --- */}
            <div className="mt-8 border-t-2 border-dashed border-gray-200 pt-8">
              <div className="flex items-center gap-3 mb-6">
                <input
                  type="checkbox"
                  id="writeReview"
                  checked={isReviewChecked}
                  onChange={(e) => setIsReviewChecked(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#E8513D] focus:ring-[#E8513D] cursor-pointer"
                />
                <label
                  htmlFor="writeReview"
                  className="font-bold text-gray-800 cursor-pointer text-lg"
                >
                  이 맛집에 대한 리뷰도 함께 작성할래요! ✍️
                </label>
              </div>

              {/* 체크박스가 선택되었을 때만 보여지는 리뷰 폼 영역 */}
              {isReviewChecked && (
                <div className="bg-[#f9fafb] p-6 rounded-2xl border border-gray-100 animate-fadeIn">
                  {/* 1. 별점 선택 */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      별점 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-4xl transition-transform hover:scale-110 ${
                            star <= rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. 리뷰 내용 작성 (10자 이상) */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      리뷰 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="방문하신 맛집은 어떠셨나요? 10자 이상 남겨주세요!"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#E8513D] focus:ring-0 h-32 resize-none text-gray-800"
                    />
                    {/* 10자 이상인지 체크해서 글자색 다르게 보여주기 */}
                    <p
                      className={`text-xs mt-2 font-bold ${
                        formData.content.length < 10
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      {formData.content.length < 10
                        ? `현재 ${formData.content.length}자 (10자 이상 작성해주세요)`
                        : `현재 ${formData.content.length}자 (작성 완료!)`}
                    </p>
                  </div>

                  {/* 3. 사용자 사진 첨부 (API 이미지는 무시하고 오직 첨부한 파일만!) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      사진 첨부 (선택)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#E8513D]/10 file:text-[#E8513D] hover:file:bg-[#E8513D]/20 cursor-pointer"
                    />

                    {/* 오직 imageFile(사용자가 방금 올린 파일)이 있을 때만 미리보기 렌더링 */}
                    {imageFile && (
                      <div className="mt-4 relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="사용자 첨부 이미지 미리보기"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#E8513D] to-[#F97316] text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              맛집 등록하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
