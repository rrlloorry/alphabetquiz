'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgressSummary } from '@/lib/storage';

export default function PracticeModePage() {
  const router = useRouter();
  const [upperPassed, setUpperPassed] = useState(0);
  const [lowerPassed, setLowerPassed] = useState(0);

  useEffect(() => {
    const up = getProgressSummary(true);
    const lo = getProgressSummary(false);
    setUpperPassed(up.passed);
    setLowerPassed(lo.passed);
  }, []);

  return (
    <main className="flex-1 flex flex-col px-6 py-8 md:px-10 md:py-12 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-90 transition-all text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="text-3xl font-bold font-baloo text-brand-navy">연습하기</h1>
          <p className="text-gray-500 font-nunito text-sm mt-0.5">어떤 알파벳을 연습할까요?</p>
        </div>
      </div>

      {/* Mascot */}
      <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 border border-amber-100 shadow-sm">
        <div className="text-5xl animate-float select-none">🦊</div>
        <div>
          <p className="text-lg font-bold font-baloo text-brand-navy">
            대문자 또는 소문자를 선택하세요!
          </p>
          <p className="text-gray-500 font-nunito text-sm mt-0.5">
            각 글자를 직접 쓰면서 획순을 익혀요
          </p>
        </div>
      </div>

      {/* Mode Cards — side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/practice/uppercase"
          className="flex items-center justify-between bg-gradient-to-br from-amber-400 to-orange-300 hover:from-amber-500 hover:to-orange-400 active:scale-95 text-white rounded-3xl px-8 py-8 shadow-xl shadow-amber-200 transition-all"
        >
          <div>
            <p className="text-4xl font-bold font-baloo leading-none">대문자</p>
            <p className="text-amber-100 font-nunito text-base mt-2">A, B, C ... Z</p>
            <p className="text-amber-100 font-nunito text-sm mt-2 font-bold">
              {upperPassed > 0 ? `${upperPassed} / 26 완료 ✓` : '아직 시작 전이에요!'}
            </p>
          </div>
          <span className="text-7xl font-bold font-baloo opacity-80 select-none">Aa</span>
        </Link>

        <Link
          href="/practice/lowercase"
          className="flex items-center justify-between bg-gradient-to-br from-sky-400 to-blue-400 hover:from-sky-500 hover:to-blue-500 active:scale-95 text-white rounded-3xl px-8 py-8 shadow-xl shadow-sky-200 transition-all"
        >
          <div>
            <p className="text-4xl font-bold font-baloo leading-none">소문자</p>
            <p className="text-sky-100 font-nunito text-base mt-2">a, b, c ... z</p>
            <p className="text-sky-100 font-nunito text-sm mt-2 font-bold">
              {lowerPassed > 0 ? `${lowerPassed} / 26 완료 ✓` : '아직 시작 전이에요!'}
            </p>
          </div>
          <span className="text-7xl font-bold font-baloo opacity-80 select-none">aa</span>
        </Link>
      </div>

      {/* Info box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
        <p className="text-sm font-nunito text-yellow-800 leading-relaxed">
          💡 <strong>4선 노트</strong>에 글자를 써요!{' '}
          대문자는 위쪽 두 칸, 소문자는 가운데 칸에 써야 해요.
        </p>
      </div>
    </main>
  );
}
