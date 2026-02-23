'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadData, LetterStatus } from '@/lib/storage';
import { UPPERCASE_LETTERS, LOWERCASE_LETTERS } from '@/lib/strokeData';

interface PageProps {
  params: Promise<{ mode: string }>;
}

export default function LetterGridPage({ params }: PageProps) {
  const { mode } = use(params);
  const router = useRouter();
  const isUppercase = mode === 'uppercase';
  const letters = isUppercase ? UPPERCASE_LETTERS : LOWERCASE_LETTERS;
  const displayMode = isUppercase ? '대문자' : '소문자';

  const [statuses, setStatuses] = useState<Record<string, LetterStatus>>({});

  useEffect(() => {
    const data = loadData();
    const progress = isUppercase ? data.progress.uppercase : data.progress.lowercase;
    setStatuses(progress);
  }, [isUppercase]);

  const getFirstUnpracticed = () => {
    for (const l of letters) {
      if (!statuses[l]) return l;
    }
    return letters[0];
  };

  const getBadgeStyle = (status: LetterStatus) => {
    if (status === 'pass') return 'bg-green-400 text-white shadow-md shadow-green-200';
    if (status === 'attempt') return 'bg-amber-300 text-white shadow-md shadow-amber-200';
    return 'bg-white text-gray-600 border-2 border-gray-200 shadow-sm hover:border-amber-300 hover:bg-amber-50';
  };

  const passed = letters.filter((l) => statuses[l] === 'pass').length;
  const attempted = letters.filter((l) => statuses[l] === 'attempt').length;

  return (
    <main className="flex-1 flex flex-col px-6 py-8 md:px-10 md:py-10 gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-90 transition-all text-xl"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-baloo text-brand-navy">
            {displayMode} 연습
          </h1>
          <p className="text-sm text-gray-400 font-nunito mt-0.5">
            {passed}개 완료 · {attempted}개 도전 중 · {26 - passed - attempted}개 미도전
          </p>
        </div>
      </div>

      {/* Start button */}
      <Link
        href={`/practice/${mode}/${getFirstUnpracticed()}`}
        className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-500 active:scale-95 text-white font-bold py-5 rounded-2xl shadow-lg shadow-amber-200 transition-all font-baloo text-2xl pulse-glow"
      >
        🚀 처음부터 순서대로 시작하기
      </Link>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm font-nunito text-gray-500 mb-1.5">
          <span>진행률</span>
          <span className="font-bold text-green-600">{Math.round((passed / 26) * 100)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all duration-700"
            style={{ width: `${(passed / 26) * 100}%` }}
          />
        </div>
      </div>

      {/* Letter grid — more columns on wide screens */}
      <div className="grid grid-cols-7 md:grid-cols-9 lg:grid-cols-13 gap-2.5">
        {letters.map((l) => {
          const status = statuses[l] ?? null;
          return (
            <Link
              key={l}
              href={`/practice/${mode}/${l}`}
              className={`letter-badge ${getBadgeStyle(status)} relative`}
            >
              <span className="text-xl font-baloo">{l}</span>
              {status === 'pass' && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  ✓
                </span>
              )}
              {status === 'attempt' && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-amber-400 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  !
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 justify-center text-sm font-nunito text-gray-500">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-lg bg-green-400 inline-block" />
          완료
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-lg bg-amber-300 inline-block" />
          도전 중
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-lg bg-white border-2 border-gray-200 inline-block" />
          미도전
        </span>
      </div>
    </main>
  );
}
