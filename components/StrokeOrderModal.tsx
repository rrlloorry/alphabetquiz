'use client';

import { useEffect, useRef, useState } from 'react';
import { uppercaseStrokes, lowercaseStrokes } from '@/lib/strokeData';

interface StrokeOrderModalProps {
  letter: string;
  isUppercase: boolean;
  onClose: () => void;
}

const COLORS = [
  '#F87171', // Red
  '#FB923C', // Orange
  '#4ADE80', // Green
  '#60A5FA', // Blue
  '#A78BFA', // Purple
];

function getStartPoint(pathStr: string): { x: number; y: number } | null {
  const m = pathStr.match(/M\s*([\d.]+)[,\s]([\d.]+)/);
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

function runAnimation(svg: SVGSVGElement, timeoutIds: ReturnType<typeof setTimeout>[]) {
  const paths = svg.querySelectorAll<SVGPathElement>('[data-stroke-idx]');
  const indicators = svg.querySelectorAll<SVGGElement>('[data-indicator-idx]');
  paths.forEach(p => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    p.style.opacity = '0';
  });
  indicators.forEach(i => { i.style.opacity = '0'; });
  paths.forEach((path, idx) => {
    const delay = idx * 1100;
    timeoutIds.push(setTimeout(() => { if (indicators[idx]) indicators[idx].style.opacity = '1'; }, delay));
    timeoutIds.push(setTimeout(() => {
      path.style.opacity = '1';
      path.style.transition = `stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)`;
      path.style.strokeDashoffset = '0';
    }, delay));
  });
}

export default function StrokeOrderModal({ letter, isUppercase, onClose }: StrokeOrderModalProps) {
  const [key, setKey] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const strokes = isUppercase ? (uppercaseStrokes[letter] ?? []) : (lowercaseStrokes[letter] ?? []);

  useEffect(() => {
    if (!svgRef.current || strokes.length === 0) return;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    runAnimation(svgRef.current, timeoutIds);
    return () => timeoutIds.forEach(clearTimeout);
  }, [letter, strokes, key]);

  const currentTransform = isUppercase 
    ? "matrix(0.6, 0, 0, 0.6, 20, 9.5)" 
    : "matrix(0.7, 0, 0, 0.7, 15, 8.0)";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-center text-brand-navy mb-1 font-baloo">✏️ 획 순서 보기</h3>
        <p className="text-center text-gray-500 text-sm mb-4 font-nunito">선이 그려지는 순서를 확인해보세요!</p>
        <div className="relative w-full aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="18.5" x2="100" y2="18.5" stroke="#F3F4F6" strokeWidth="0.8" />
            <line x1="0" y1="39.5" x2="100" y2="39.5" stroke="#F3F4F6" strokeWidth="0.6" strokeDasharray="4,3" />
            <line x1="0" y1="60.5" x2="100" y2="60.5" stroke="#FEE2E2" strokeWidth="0.8" />
            <line x1="0" y1="81.5" x2="100" y2="81.5" stroke="#F3F4F6" strokeWidth="0.6" />
          </svg>
          <svg key={key} ref={svgRef} viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            <g transform={currentTransform}>
              {strokes.map((pathStr, idx) => {
                const pt = getStartPoint(pathStr);
                return (
                  <g key={idx}>
                    <path data-stroke-idx={idx} d={pathStr} fill="none" stroke={COLORS[idx % COLORS.length]} strokeWidth={isUppercase ? "8" : "6"} strokeLinecap="round" strokeLinejoin="round" />
                    {pt && (
                      <g data-indicator-idx={idx} style={{ opacity: 0, transition: 'opacity 0.3s' }}>
                        <circle cx={pt.x} cy={pt.y} r="8" fill={COLORS[idx % COLORS.length]} />
                        <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="bold" fill="white" fontFamily="sans-serif">{idx + 1}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setKey(k => k + 1)} className="flex-1 bg-amber-400 hover:bg-amber-500 text-white font-bold py-3 rounded-2xl transition-all font-nunito text-sm">🔁 다시 보기</button>
          <button onClick={onClose} className="flex-1 bg-sky-400 hover:bg-sky-500 text-white font-bold py-3 rounded-2xl transition-all font-nunito text-sm">닫기</button>
        </div>
      </div>
    </div>
  );
}
