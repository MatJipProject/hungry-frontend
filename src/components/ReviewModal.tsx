"use client";

import { useState, useRef, useEffect } from "react";
import { postReview } from "@/lib/api"; // API 경로에 맞게 수정해주세요!

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
  onSuccess: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  placeId,
  placeName,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 🌟 핵심 1: 성공 상태를 관리하는 State 추가
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setContent("");
      setFiles([]);
      setPreviews([]);
      setErrorMsg("");
      setIsSuccess(false); // 성공 상태도 다시 초기화!
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newFiles = [...files, ...selectedFiles].slice(0, 3);
      setFiles(newFiles);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (content.trim().length < 5) {
      setErrorMsg("리뷰 내용을 5자 이상 작성해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      await postReview(
        placeId,
        { rating, content },
        files.length > 0 ? files : undefined,
      );

      // 🌟 핵심 2: alert 대신 성공 상태를 true로 변경하고 1.5초 뒤에 닫기!
      setIsSuccess(true);
      onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      setErrorMsg(e.message || "리뷰 등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 400,
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        <style>{`
          @keyframes modalFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes checkBounce { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        `}</style>

        {/* 🌟 핵심 3: isSuccess 상태에 따라 내용물을 다르게 렌더링 */}
        {isSuccess ? (
          // 🟢 성공 시 보여줄 체크 화면
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "40px 0",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#d1fae5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                animation:
                  "checkBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)", // 통통 튀는 애니메이션!
              }}
            >
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#10b981"
                strokeWidth={3}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 8px",
              }}
            >
              리뷰 등록 완료!
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
              소중한 리뷰가 등록되었습니다.
            </p>
          </div>
        ) : (
          // 🔴 기존 폼 화면 (성공하기 전)
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  margin: 0,
                  color: "#111827",
                }}
              >
                <span style={{ color: "#E8513D" }}>{placeName}</span> 리뷰 쓰기
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setRating(v)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 40,
                    cursor: "pointer",
                    color: v <= rating ? "#f59e0b" : "#e5e7eb",
                    transition: "transform 0.1s",
                  }}
                  onPointerDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.8)")
                  }
                  onPointerUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이곳에서의 경험은 어떠셨나요? (5자 이상)"
              style={{
                width: "100%",
                height: 120,
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                resize: "none",
                backgroundColor: "#f9fafb",
                boxSizing: "border-box",
                marginBottom: 16,
                fontFamily: "inherit",
              }}
            />

            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 8,
                }}
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flexShrink: 0,
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    border: "2px dashed #d1d5db",
                    background: "#f9fafb",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#6b7280",
                    fontSize: 12,
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 20 }}>📷</span>
                  {files.length}/3
                </button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    style={{ position: "relative", flexShrink: 0 }}
                  >
                    <img
                      src={src}
                      alt="미리보기"
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 12,
                      }}
                    />
                    <button
                      onClick={() => handleRemovePhoto(idx)}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        fontSize: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  background: "#fef2f2",
                  borderRadius: 8,
                  color: "#ef4444",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>🚨</span> {errorMsg}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading || content.trim().length < 5}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 12,
                border: "none",
                background:
                  isLoading || content.trim().length < 5
                    ? "#fca5a5"
                    : "#E8513D",
                color: "white",
                fontSize: 16,
                fontWeight: 700,
                cursor:
                  isLoading || content.trim().length < 5
                    ? "not-allowed"
                    : "pointer",
                transition: "background 0.2s",
              }}
            >
              {isLoading ? "등록하는 중..." : "리뷰 등록하기"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
