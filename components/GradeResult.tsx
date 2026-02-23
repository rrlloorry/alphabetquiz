'use client';

import { useEffect, useState } from 'react';
import Celebration from './Celebration';

interface GradeResultProps {
  pass: boolean;
  reason: string;
  letter: string;
  isAIChecking?: boolean;
  onNext: () => void;
  onRetry: () => void;
  hasNext: boolean;
}

export default function GradeResult({
  pass,
  reason,
  letter,
  isAIChecking = false,
  onNext,
  onRetry,
  hasNext,
}: GradeResultProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (pass) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(t);
    }
  }, [pass]);

  const stars = pass ? 3 : 0;

  return (
    <>
      <Celebration active={showCelebration} />
      <div className="animate-slide-up w-full">
        {pass ? (
          /* ===== PASS ===== */
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-6 border-4 border-green-300 text-center">
            {/* Stars */}
            <div className="flex justify-center gap-2 mb-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className="text-4xl animate-pop-in"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  ⭐
                </span>
              ))}
            </div>

            {/* Big letter */}
            <div className="text-7xl font-bold text-green-600 font-baloo my-2 animate-pop-in">
              {letter}
            </div>

            <h2 className="text-2xl font-bold text-green-700 font-baloo mb-1">
              잘했어요! 🎉
            </h2>
            <p className="text-green-600 font-nunito text-sm mb-4">{reason}</p>

            {isAIChecking && (
              <p className="text-xs text-gray-400 font-nunito mb-3 flex items-center justify-center gap-1">
                <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                AI 형태 분석 중...
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onRetry}
                className="flex-1 bg-white hover:bg-gray-50 active:scale-95 text-green-600 font-bold py-4 rounded-2xl border-2 border-green-300 transition-all font-nunito"
              >
                🔄 다시 해보기
              </button>
              <button
                onClick={onNext}
                className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all font-nunito shadow-lg"
              >
                {hasNext ? '다음 글자 →' : '목록으로 ✓'}
              </button>
            </div>
          </div>
        ) : (
          /* ===== FAIL ===== */
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-3xl p-6 border-4 border-amber-300 text-center">
            {/* Mascot sad */}
            <div className="text-5xl mb-3 animate-wiggle">🦊</div>

            <h2 className="text-2xl font-bold text-amber-700 font-baloo mb-1">
              다시 해봐요! 💪
            </h2>

            {/* Feedback message */}
            <div className="bg-white/70 rounded-2xl p-3 mb-4 border border-amber-200">
              <p className="text-amber-800 font-nunito text-base leading-relaxed">
                {reason}
              </p>
            </div>

            {/* Tips based on fail reason */}
            <div className="text-left bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200">
              <p className="text-xs text-amber-600 font-nunito font-bold mb-1">💡 힌트</p>
              <p className="text-xs text-amber-700 font-nunito">
                획 순서 보기 버튼을 눌러서 어떻게 쓰는지 확인해보세요!
              </p>
            </div>

            <button
              onClick={onRetry}
              className="w-full bg-amber-400 hover:bg-amber-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all font-nunito text-lg shadow-lg"
            >
              🖊️ 다시 도전!
            </button>
          </div>
        )}
      </div>
    </>
  );
}
