'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import Celebration from '@/components/Celebration';
import { gradeUppercase, gradeLowercase } from '@/lib/grading';
import { loadData, saveData, updateLetterStatus } from '@/lib/storage';
import { UPPERCASE_LETTERS, LOWERCASE_LETTERS } from '@/lib/strokeData';

type Phase = 'intro' | 'question' | 'result';
type Mode = 'uppercase' | 'lowercase' | 'mixed';

interface QuizQuestion {
  letter: string;
  isUppercase: boolean;
}

interface QuizAnswer {
  letter: string;
  isUppercase: boolean;
  pass: boolean;
}

const QUIZ_COUNT = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(m: Mode): QuizQuestion[] {
  const pool: QuizQuestion[] = [];
  if (m === 'uppercase' || m === 'mixed') {
    pool.push(...UPPERCASE_LETTERS.map((l) => ({ letter: l, isUppercase: true })));
  }
  if (m === 'lowercase' || m === 'mixed') {
    pool.push(...LOWERCASE_LETTERS.map((l) => ({ letter: l, isUppercase: false })));
  }
  return shuffle(pool).slice(0, QUIZ_COUNT);
}

export default function QuizPage() {
  const router = useRouter();
  const canvasRef = useRef<DrawingCanvasRef>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [mode, setMode] = useState<Mode>('uppercase');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gradeResult, setGradeResult] = useState<import('@/lib/grading').GradingResult | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const [upperTotalPassed, setUpperTotalPassed] = useState(0);
  const [lowerTotalPassed, setLowerTotalPassed] = useState(0);

  useEffect(() => {
    const data = loadData();
    setUpperTotalPassed(UPPERCASE_LETTERS.filter((l) => data.progress.uppercase[l] === 'pass').length);
    setLowerTotalPassed(LOWERCASE_LETTERS.filter((l) => data.progress.lowercase[l] === 'pass').length);
  }, []);

  const MIN_REQUIRED = 10;
  const canStartUpper = upperTotalPassed >= MIN_REQUIRED;
  const canStartLower = lowerTotalPassed >= MIN_REQUIRED;
  const canStartMixed = (upperTotalPassed + lowerTotalPassed) >= MIN_REQUIRED;

  const canStart = 
    mode === 'uppercase' ? canStartUpper :
    mode === 'lowercase' ? canStartLower :
    canStartMixed;

  function startQuiz(m: Mode) {
    const qs = buildQuestions(m);
    setMode(m);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers([]);
    setGradeResult(null);
    setIsAdvancing(false);
    setPhase('question');
  }

  function finishQuiz(newAnswers: QuizAnswer[], qs: QuizQuestion[]) {
    const score = newAnswers.filter((a) => a.pass).length;
    const data = loadData();
    data.quizHistory.push({
      date: new Date().toISOString(),
      score,
      total: qs.length,
      wrong: newAnswers.filter((a) => !a.pass).map((a) => a.letter),
    });
    saveData(data);
    setPhase('result');
  }

  function advanceOrFinish(newAnswers: QuizAnswer[], passed: boolean, idx: number, qs: QuizQuestion[]) {
    if (!passed) return; // 오답이면 자동으로 넘어가지 않음

    setIsAdvancing(true);
    setTimeout(() => {
      setGradeResult(null);
      setIsAdvancing(false);
      if (idx + 1 >= qs.length) {
        finishQuiz(newAnswers, qs);
      } else {
        setCurrentIdx(idx + 1);
      }
    }, 1500);
  }

  function handleManualNext() {
    if (currentIdx + 1 >= questions.length) {
      finishQuiz(answers, questions);
    } else {
      setGradeResult(null);
      setIsAdvancing(false);
      setCurrentIdx(currentIdx + 1);
    }
  }

  function handleGrade() {
    if (!canvasRef.current || isAdvancing || gradeResult) return;
    const points = canvasRef.current.getPoints();
    const q = questions[currentIdx];
    let result = q.isUppercase ? gradeUppercase(points, 400, 400) : gradeLowercase(q.letter, points, 400, 400);
    if (result.pass) {
      const mse = canvasRef.current.getShapeMSE(q.letter, q.isUppercase);
      if (mse > 0.28) {
        result = { 
          pass: false, 
          reason: '모양이 조금 달라요! 가이드를 보면서 정성껏 다시 써볼까요? 💪',
          failZone: 'wrongArea' // 모양이 틀린 것도 넓은 의미의 영역/형태 오류로 분류
        };
      }
    }
    setGradeResult(result);
    if (result.pass) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    const newAnswers = [...answers, { letter: q.letter, isUppercase: q.isUppercase, pass: result.pass }];
    setAnswers(newAnswers);
    advanceOrFinish(newAnswers, result.pass, currentIdx, questions);
  }

  function handleSkip() {
    if (isAdvancing || gradeResult) return;
    const q = questions[currentIdx];
    const newAnswers = [...answers, { letter: q.letter, isUppercase: q.isUppercase, pass: false }];
    setAnswers(newAnswers);
    if (currentIdx + 1 >= questions.length) {
      finishQuiz(newAnswers, questions);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  }

  if (phase === 'intro') {
    return (
      <main className="flex-1 flex flex-col px-6 py-8 md:px-10 md:py-12 gap-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-90 transition-all text-xl">←</button>
          <div>
            <h1 className="text-3xl font-bold font-baloo text-brand-navy">퀴즈 풀기</h1>
            <p className="text-gray-500 font-nunito text-sm mt-0.5">실력을 확인해보는 10문제 퀴즈!</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 items-start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 border border-sky-100 shadow-sm">
              <div className="text-5xl animate-float select-none">🎯</div>
              <div>
                <p className="text-lg font-bold font-baloo text-brand-navy">퀴즈로 실력을 확인해요!</p>
                <p className="text-gray-500 font-nunito text-sm mt-0.5">모드를 선택하고 시작하세요</p>
              </div>
            </div>
            <p className="font-bold font-baloo text-brand-navy text-lg">모드 선택</p>
            <button onClick={() => setMode('uppercase')} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${mode === 'uppercase' ? 'border-amber-400 bg-amber-50 shadow-md shadow-amber-100' : 'border-gray-200 bg-white hover:border-amber-200'}`}>
              <div className="text-left">
                <p className="font-bold font-baloo text-brand-navy text-lg">대문자</p>
                <p className="text-sm font-nunito text-gray-500 mt-0.5">{upperTotalPassed}개 연습함</p>
              </div>
              <span className="text-4xl font-bold font-baloo text-gray-300">Aa</span>
            </button>
            <button onClick={() => setMode('lowercase')} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${mode === 'lowercase' ? 'border-sky-400 bg-sky-50 shadow-md shadow-sky-100' : 'border-gray-200 bg-white hover:border-sky-200'}`}>
              <div className="text-left">
                <p className="font-bold font-baloo text-brand-navy text-lg">소문자</p>
                <p className="text-sm font-nunito text-gray-500 mt-0.5">{lowerTotalPassed}개 연습함</p>
              </div>
              <span className="text-4xl font-bold font-baloo text-gray-300">aa</span>
            </button>
            <button onClick={() => setMode('mixed')} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${mode === 'mixed' ? 'border-purple-400 bg-purple-50 shadow-md shadow-purple-100' : 'border-gray-200 bg-white hover:border-purple-200'}`}>
              <div className="text-left">
                <p className="font-bold font-baloo text-brand-navy text-lg">혼합</p>
                <p className="text-sm font-nunito text-gray-500 mt-0.5">대문자 + 소문자</p>
              </div>
              <span className="text-3xl font-bold font-baloo text-gray-300">Aa+aa</span>
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-md text-center">
              <div className="text-7xl mb-4 select-none">{mode === 'uppercase' ? '🅰️' : mode === 'lowercase' ? '🔤' : '🔠'}</div>
              <p className="font-bold font-baloo text-brand-navy text-2xl mb-1">{mode === 'uppercase' ? '대문자 퀴즈' : mode === 'lowercase' ? '소문자 퀴즈' : '혼합 퀴즈'}</p>
              <div className="mt-2 mb-6">
                <p className={`text-sm font-nunito font-bold ${canStart ? 'text-green-500' : 'text-amber-500'}`}>완료 현황: {mode === 'uppercase' ? upperTotalPassed : mode === 'lowercase' ? lowerTotalPassed : upperTotalPassed + lowerTotalPassed} / {mode === 'mixed' ? 52 : 26}</p>
              </div>
              {!canStart ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <p className="text-amber-700 font-nunito text-sm leading-relaxed">💡 <strong>10개 이상의 알파벳</strong>을 '완료'해야<br />퀴즈에 도전할 수 있어요! ✏️</p>
                </div>
              ) : (
                <button onClick={() => startQuiz(mode)} className="w-full bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-500 hover:to-blue-500 active:scale-95 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-sky-200 font-baloo text-2xl pulse-glow">🎯 퀴즈 시작!</button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'question' && questions.length > 0) {
    const q = questions[currentIdx];
    return (
      <>
        <Celebration active={showCelebration} />
        <main className="flex-1 flex flex-col px-6 py-6 md:px-10 md:py-8 gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setPhase('intro')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-90 transition-all text-xl flex-shrink-0">←</button>
            <div className="flex-1">
              <div className="flex justify-between text-sm font-nunito text-gray-500 mb-1.5">
                <span>문제 <strong>{currentIdx + 1}</strong> / {questions.length}</span>
                <span className="font-bold text-amber-600">{answers.filter((a) => a.pass).length}개 정답</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-300" style={{ width: `${(currentIdx / questions.length) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col md:grid md:grid-cols-[3fr_2fr] gap-6">
            <div className="relative">
              <DrawingCanvas
                key={currentIdx}
                ref={canvasRef}
                letter={q.letter}
                isUppercase={q.isUppercase}
                showGuide={!!gradeResult && !gradeResult.pass}
                isError={!!gradeResult && !gradeResult.pass}
              />
              {gradeResult && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl ${
                  gradeResult.pass ? 'bg-green-500/80' : 'bg-transparent pointer-events-none'
                }`}>
                  {gradeResult.pass ? (
                    <>
                      <div className="text-7xl mb-3 select-none">⭐</div>
                      <p className="text-white font-bold font-baloo text-3xl">정답!</p>
                      <p className="text-white/90 font-nunito text-base mt-2 px-6 text-center">{gradeResult.reason}</p>
                    </>
                  ) : (
                    <div className="mt-auto mb-6 bg-amber-500 text-white px-8 py-6 rounded-[32px] shadow-2xl flex items-center gap-5 animate-slide-up pointer-events-auto border-4 border-white/20">
                      <span className="text-5xl drop-shadow-md">
                        {gradeResult.failZone === 'tooSmall' ? '🔍' : 
                         gradeResult.failZone === 'tooLow' ? '⬆️' : 
                         gradeResult.failZone === 'wrongArea' ? '📍' : '💪'}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold font-baloo text-2xl leading-tight text-white/90 mb-1">조금 더 힘내요!</p>
                        <p className="text-base font-medium opacity-95 mb-4 leading-snug">{gradeResult.reason}</p>
                        <button
                          onClick={handleManualNext}
                          className="w-full bg-white text-amber-600 font-bold py-3 rounded-xl shadow-md hover:bg-amber-50 active:scale-95 transition-all flex items-center justify-center gap-2 pointer-events-auto"
                        >
                          확인! 다음 문제로 →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between gap-4">
              <div className="text-center bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <p className="text-sm font-nunito text-gray-500 mb-2">이 글자를 써보세요!</p>
                <div className="text-9xl font-bold font-baloo text-brand-navy animate-pop-in select-none">{q.letter}</div>
                <p className="text-xs font-nunito text-gray-400 mt-2">{q.isUppercase ? '대문자' : '소문자'}</p>
              </div>
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleGrade}
                  disabled={isAdvancing || !!gradeResult}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 disabled:opacity-40 text-white font-bold py-5 rounded-2xl transition-all font-baloo text-2xl shadow-lg shadow-orange-200"
                >
                  채점하기 ✓
                </button>
                <button
                  onClick={() => canvasRef.current?.clearCanvas()}
                  disabled={isAdvancing || !!gradeResult}
                  className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-40 text-gray-500 font-bold py-4 rounded-2xl transition-all font-nunito text-lg flex items-center justify-center gap-2"
                >
                  🗑️ 다시 그리기
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (phase === 'result') {
    const finalScore = answers.filter((a) => a.pass).length;
    const finalTotal = answers.length;
    const pct = finalTotal > 0 ? finalScore / finalTotal : 0;
    const finalStars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : finalScore > 0 ? 1 : 0;
    const message = finalStars === 3 ? '완벽해요! 🎉' : finalStars === 2 ? '잘했어요! 👏' : finalStars === 1 ? '조금 더 연습해요! 💪' : '연습이 필요해요! ✏️';
    return (
      <main className="flex-1 flex flex-col px-6 py-8 md:px-10 md:py-12 gap-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-90 transition-all text-xl">←</button>
          <h1 className="text-3xl font-bold font-baloo text-brand-navy">퀴즈 결과</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-8 items-start">
          <div className="bg-gradient-to-br from-sky-50 to-blue-100 rounded-3xl p-8 border-2 border-sky-200 text-center">
            <div className="flex justify-center gap-3 mb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-5xl ${i < finalStars ? 'animate-pop-in' : 'opacity-20'}`} style={{ animationDelay: `${i * 0.15}s` }}>⭐</span>
              ))}
            </div>
            <div className="text-8xl font-bold font-baloo text-sky-600 my-3">{finalScore}<span className="text-4xl text-sky-400">/{finalTotal}</span></div>
            <p className="text-sky-600 font-nunito text-lg font-bold">{message}</p>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => startQuiz(mode)} className="w-full bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-500 hover:to-blue-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all font-baloo text-xl shadow-lg shadow-sky-200">🔄 다시 도전!</button>
              <button onClick={() => router.push('/')} className="w-full bg-white hover:bg-gray-50 active:scale-95 text-gray-600 font-bold py-4 rounded-2xl border border-gray-200 transition-all font-nunito">🏠 홈으로</button>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
            <p className="font-bold font-baloo text-brand-navy text-xl mb-4">문제별 결과</p>
            <div className="flex flex-wrap gap-2.5">
              {answers.map((a, i) => (
                <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold font-baloo text-base relative ${a.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>{a.letter}<span className="absolute -top-1 -right-1 text-[11px] leading-none">{a.pass ? '✓' : '✗'}</span></div>
              ))}
            </div>
            {answers.filter((a) => !a.pass).length > 0 && (
              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-nunito text-amber-700 font-bold mb-2">💪 틀린 글자를 다시 연습해 보세요!</p>
                <div className="flex flex-wrap gap-2">
                  {answers.filter((a) => !a.pass).map((a, i) => (
                    <span key={i} className="bg-amber-200 text-amber-800 font-baloo font-bold px-3 py-1 rounded-lg text-base">{a.letter}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }
  return null;
}
