'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadData, LetterStatus } from '@/lib/storage';
import { UPPERCASE_LETTERS, LOWERCASE_LETTERS } from '@/lib/strokeData';

function ProgressBar({ passed, total, label }: { passed: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-500 font-nunito mb-1.5">
        <span>{label}</span>
        <span className="font-bold text-amber-600">{passed}/{total} 완료</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LetterDots({
  letters,
  statuses,
}: {
  letters: string[];
  statuses: Record<string, LetterStatus>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {letters.map((l) => {
        const status = statuses[l] ?? null;
        let bg = 'bg-gray-200';
        let text = 'text-gray-500';
        if (status === 'pass') {
          bg = 'bg-green-400';
          text = 'text-white';
        } else if (status === 'attempt') {
          bg = 'bg-amber-300';
          text = 'text-white';
        }
        return (
          <div
            key={l}
            className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center ${bg} ${text} text-sm font-bold font-baloo transition-all relative`}
            title={`${l}: ${status ?? '미도전'}`}
          >
            <span className="leading-none">{l}</span>
            {status === 'pass' && (
              <span className="text-[7px] leading-none absolute -top-0.5 -right-0.5 bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-green-600 border border-green-200">
                ✓
              </span>
            )}
            {status === 'attempt' && (
              <span className="text-[8px] leading-none absolute -top-0.5 -right-0.5 bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-amber-500 border border-amber-200">
                ·
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const [upperStatuses, setUpperStatuses] = useState<Record<string, LetterStatus>>({});
  const [lowerStatuses, setLowerStatuses] = useState<Record<string, LetterStatus>>({});

  useEffect(() => {
    const data = loadData();
    setUpperStatuses(data.progress.uppercase);
    setLowerStatuses(data.progress.lowercase);
  }, []);

  const passedUpper = UPPERCASE_LETTERS.filter((l) => upperStatuses[l] === 'pass').length;
  const passedLower = LOWERCASE_LETTERS.filter((l) => lowerStatuses[l] === 'pass').length;
  const totalPassed = passedUpper + passedLower;

  return (
    <main className="flex-1 flex flex-col px-6 py-10 md:px-12 md:py-16 gap-10 max-w-6xl mx-auto w-full">
      {/* Top hero */}
      <div className="flex items-center gap-6 animate-slide-up">
        <div className="text-7xl animate-float select-none filter drop-shadow-xl">🦊</div>
        <div>
          <h1 className="text-4xl md:text-6xl font-bold font-baloo text-brand-navy leading-tight tracking-tight">
            알파벳 쓰기 연습
          </h1>
          <p className="text-gray-500 font-nunito text-lg md:text-xl mt-2 font-medium">
            영어 4칸 노트로 즐겁게 배워요! ✨
          </p>
        </div>
      </div>

      {/* Two-column main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 items-start">
        {/* Left: Action buttons */}
        <div className="flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Link
            href="/practice"
            className="group flex items-center justify-between bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 active:scale-95 text-white rounded-[32px] px-8 py-8 shadow-2xl shadow-amber-200/60 transition-all duration-300 border-b-8 border-amber-500/30"
          >
            <div>
              <p className="text-4xl font-extrabold font-baloo leading-none group-hover:scale-105 transition-transform origin-left">연습하기</p>
              <p className="text-amber-100 font-nunito text-base mt-2 font-bold">알파벳 쓰기 연습</p>
            </div>
            <span className="text-6xl select-none group-hover:rotate-12 transition-transform duration-300">✏️</span>
          </Link>

          <Link
            href="/quiz"
            className="group flex items-center justify-between bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-500 hover:to-blue-500 active:scale-95 text-white rounded-[32px] px-8 py-8 shadow-2xl shadow-sky-200/60 transition-all duration-300 border-b-8 border-sky-500/30"
          >
            <div>
              <p className="text-4xl font-extrabold font-baloo leading-none group-hover:scale-105 transition-transform origin-left">퀴즈 풀기</p>
              <p className="text-sky-100 font-nunito text-base mt-2 font-bold">실력 확인 퀴즈</p>
            </div>
            <span className="text-6xl select-none group-hover:scale-110 transition-transform duration-300">🎯</span>
          </Link>

          <div className="bg-yellow-50/80 backdrop-blur-sm border-2 border-yellow-200/50 rounded-3xl p-6 shadow-sm">
            <p className="text-base font-nunito text-yellow-800 leading-relaxed font-medium">
              💡 <strong>4칸 노트</strong>에 글자를 써요!<br />
              대문자는 위쪽 두 칸, 소문자는 가운데 칸에 써야 해요.
            </p>
          </div>

          <p className="text-sm text-gray-400 font-nunito text-center pt-2 font-bold animate-pulse">
            열심히 연습해서 알파벳 마스터가 되자! 🌟
          </p>
        </div>

        {/* Right: Progress */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] p-8 shadow-2xl shadow-brand-navy/5 border border-amber-100/50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-extrabold font-baloo text-brand-navy text-2xl mb-8 flex items-center gap-3">
            <span className="text-3xl">📊</span> 내 진행 현황
          </h2>

          <ProgressBar passed={totalPassed} total={52} label="전체 진행 현황" />

          {/* Uppercase */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-nunito font-extrabold text-gray-400 uppercase tracking-widest">대문자 A – Z</p>
              <p className="text-base font-nunito text-amber-600 font-black bg-amber-50 px-3 py-1 rounded-full">{passedUpper}/26</p>
            </div>
            <LetterDots letters={UPPERCASE_LETTERS} statuses={upperStatuses} />
          </div>

          {/* Lowercase */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-nunito font-extrabold text-gray-400 uppercase tracking-widest">소문자 a – z</p>
              <p className="text-base font-nunito text-amber-600 font-black bg-amber-50 px-3 py-1 rounded-full">{passedLower}/26</p>
            </div>
            <LetterDots letters={LOWERCASE_LETTERS} statuses={lowerStatuses} />
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-10 pt-6 border-t border-gray-100 text-sm font-nunito text-gray-500 font-bold">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-green-400 shadow-sm" />
              완료
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-amber-300 shadow-sm" />
              도전 중
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-gray-200 shadow-sm" />
              미도전
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
