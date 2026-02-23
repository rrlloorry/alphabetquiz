'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import StrokeOrderModal from '@/components/StrokeOrderModal';
import GradeResult from '@/components/GradeResult';
import { gradeUppercase, gradeLowercase, GradingResult } from '@/lib/grading';
import { updateLetterStatus } from '@/lib/storage';
import { letterHints, UPPERCASE_LETTERS, LOWERCASE_LETTERS, letterPronunciations } from '@/lib/strokeData';

interface PageProps {
  params: Promise<{ mode: string; letter: string }>;
}

export default function PracticePage({ params }: PageProps) {
  const { mode, letter } = use(params);
  const router = useRouter();

  const isUppercase = mode === 'uppercase';
  const letters = isUppercase ? UPPERCASE_LETTERS : LOWERCASE_LETTERS;
  const currentIdx = letters.indexOf(letter);
  const totalLetters = letters.length;

  const [showGuide, setShowGuide] = useState(true);
  const [showStrokeModal, setShowStrokeModal] = useState(false);

  // 어느 글자에 대한 결과인지 함께 저장 → 글자가 바뀌면 렌더 즉시 null로 취급
  const [gradeEntry, setGradeEntry] = useState<{ forLetter: string; result: GradingResult } | null>(null);
  const gradeResult = gradeEntry?.forLetter === letter ? gradeEntry.result : null;

  const canvasRef = useRef<DrawingCanvasRef>(null);

  // 글자가 바뀌면 캔버스·모달 초기화
  useEffect(() => {
    setShowStrokeModal(false);
    canvasRef.current?.clearCanvas();
  }, [letter]);

  const hint = letterHints[letter] ?? `${letter}를 써보세요!`;

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setGradeEntry(null);
  };

  const handleSubmit = useCallback(() => {
    const points = canvasRef.current?.getPoints() ?? [];

    // 1단계: 위치 채점 (기하학적)
    const result = isUppercase
      ? gradeUppercase(points, 400, 400)
      : gradeLowercase(letter, points, 400, 400);

    if (!result.pass) {
      updateLetterStatus(letter, isUppercase, 'attempt');
      setGradeEntry({ forLetter: letter, result });
      return;
    }

    // 2. 단계: 형태 채점 (MSE 픽셀 비교)
    const mse = canvasRef.current?.getShapeMSE(letter, isUppercase) ?? 1;
    console.log(`[shape] "${letter}" MSE = ${mse.toFixed(4)}`);

    const MSE_THRESHOLD = 0.32;
    if (mse > MSE_THRESHOLD) {
      updateLetterStatus(letter, isUppercase, 'attempt');
      setGradeEntry({
        forLetter: letter,
        result: {
          pass: false,
          reason: `${letter}의 모양이 조금 달라요! 가이드를 보면서 다시 써볼까요? 💪`,
        },
      });
      return;
    }

    updateLetterStatus(letter, isUppercase, 'pass');
    setGradeEntry({ forLetter: letter, result });
  }, [letter, isUppercase]);

  const handleNext = () => {
    if (currentIdx < totalLetters - 1) {
      router.replace(`/practice/${mode}/${letters[currentIdx + 1]}`);
    } else {
      router.replace(`/practice/${mode}`);
    }
  };

  const handleRetry = () => handleClear();
  const hasNext = currentIdx < totalLetters - 1;

  return (
    <main className="flex-1 flex flex-col px-6 py-6 md:px-10 md:py-8 gap-6">
      {/* Top header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-90 transition-all text-xl"
        >
          ←
        </button>

        <div className="text-center">
          <span className="font-bold font-baloo text-brand-navy text-2xl">
            {isUppercase ? '대문자' : '소문자'}{' '}
            <span className="text-amber-500 text-3xl">{letter}</span>
            <span className="text-gray-400 text-xl font-nunito ml-1.5 font-bold">
              ({letterPronunciations[letter.toUpperCase()]})
            </span>
          </span>
          <p className="text-xs text-gray-400 font-nunito mt-0.5">
            {currentIdx + 1} / {totalLetters}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 items-center">
          {letters.slice(Math.max(0, currentIdx - 3), currentIdx + 4).map((l) => (
            <div
              key={l}
              className={`rounded-full transition-all ${
                l === letter
                  ? 'w-3 h-3 bg-amber-400 scale-110'
                  : 'w-2 h-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Two-column content area */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[3fr_2fr] gap-6">
        {/* LEFT: Canvas */}
        <div className="flex flex-col gap-3">
          <DrawingCanvas
            ref={canvasRef}
            letter={letter}
            isUppercase={isUppercase}
            showGuide={showGuide}
          />
          {!gradeResult && (
            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 font-bold py-3.5 rounded-xl transition-all font-nunito text-base"
            >
              🗑️ 지우기
            </button>
          )}
        </div>

        {/* RIGHT: Controls */}
        <div className="flex flex-col gap-4">
          {/* Hint box */}
          <div className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
            <span className="text-3xl flex-shrink-0 animate-float select-none">🦊</span>
            <p className="text-sm font-nunito text-gray-700 leading-relaxed pt-1">{hint}</p>
          </div>

          {/* Toolbar */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowStrokeModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-100 hover:bg-purple-200 active:scale-95 text-purple-700 font-bold py-3 rounded-xl transition-all font-nunito text-sm"
            >
              ▶ 획 순서 보기
            </button>
            <button
              onClick={() => setShowGuide((v) => !v)}
              className={`flex-1 flex items-center justify-center gap-2 ${
                showGuide
                  ? 'bg-sky-100 hover:bg-sky-200 text-sky-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              } font-bold py-3 rounded-xl transition-all font-nunito text-sm active:scale-95`}
            >
              {showGuide ? '👁 가이드 ON' : '🙈 가이드 OFF'}
            </button>
          </div>

          {/* 결과 / 확인하기 버튼 */}
          {gradeResult ? (
            <GradeResult
              pass={gradeResult.pass}
              reason={gradeResult.reason}
              letter={letter}
              onNext={handleNext}
              onRetry={handleRetry}
              hasNext={hasNext}
            />
          ) : (
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 active:scale-95 text-white font-bold py-5 rounded-2xl transition-all font-baloo text-xl shadow-lg shadow-green-200"
            >
              ✅ 확인하기
            </button>
          )}

          {/* Letter navigation */}
          <div className="flex gap-2.5 mt-auto pt-2">
            <button
              onClick={() => currentIdx > 0 && router.replace(`/practice/${mode}/${letters[currentIdx - 1]}`)}
              disabled={currentIdx === 0}
              className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-30 text-gray-600 font-bold py-3 rounded-xl border border-gray-200 transition-all font-nunito text-sm active:scale-95"
            >
              ← 이전
            </button>
            <button
              onClick={() => router.replace(`/practice/${mode}/${letters[Math.min(currentIdx + 1, totalLetters - 1)]}`)}
              disabled={currentIdx === totalLetters - 1}
              className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-30 text-gray-600 font-bold py-3 rounded-xl border border-gray-200 transition-all font-nunito text-sm active:scale-95"
            >
              다음 →
            </button>
          </div>
        </div>
      </div>

      {showStrokeModal && (
        <StrokeOrderModal
          letter={letter}
          isUppercase={isUppercase}
          onClose={() => setShowStrokeModal(false)}
        />
      )}
    </main>
  );
}
