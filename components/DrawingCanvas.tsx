'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { uppercaseStrokes, lowercaseStrokes } from '@/lib/strokeData';

export interface DrawingCanvasRef {
  clearCanvas: () => void;
  getPoints: () => { x: number; y: number }[];
  getImageBase64: () => string;
  getStrokesOnlyBase64: () => string;
  /** 레퍼런스(가이드)와 사용자 획의 픽셀 MSE 반환 (0=완전일치, 1=완전불일치) */
  getShapeMSE: (letter: string, isUppercase: boolean) => number;
}

interface DrawingCanvasProps {
  letter: string;
  isUppercase: boolean;
  showGuide: boolean;
  isError?: boolean;
}

const W = 400;
const H = 400;
const LINE_POSITIONS = [0.185, 0.395, 0.605, 0.815];

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ letter, isUppercase, showGuide, isError = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const strokes = useRef<{ x: number; y: number }[][]>([]);
    const currentStroke = useRef<{ x: number; y: number }[]>([]);
    const allPoints = useRef<{ x: number; y: number }[]>([]);

    const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      LINE_POSITIONS.forEach((pct, i) => {
        const y = pct * H;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.lineWidth = 1.5;
        if (i === 2) { ctx.setLineDash([]); ctx.strokeStyle = '#EF4444'; }
        else if (i === 1) { ctx.setLineDash([10, 7]); ctx.strokeStyle = '#9CA3AF'; }
        else { ctx.setLineDash([]); ctx.strokeStyle = '#9CA3AF'; }
        ctx.stroke(); ctx.setLineDash([]);
      });
    }, []);

    const drawGhostLetter = useCallback((ctx: CanvasRenderingContext2D) => {
      ctx.save();
      const fontFamily = '"Comic Sans MS", cursive, sans-serif';
      let fontSize = isUppercase ? H * 0.58 : H * 0.45;
      let baselineY = H * 0.605;
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
      ctx.fillText(letter, W / 2, baselineY);
      ctx.restore();
    }, [letter, isUppercase]);

    const redrawAll = useCallback(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      drawBackground(ctx);
      if (showGuide) drawGhostLetter(ctx);
      const strokeColor = isError ? '#EF4444' : '#1E1B4B';
      ctx.strokeStyle = strokeColor; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const stroke of strokes.current) {
        if (stroke.length < 2) {
          ctx.beginPath(); ctx.arc(stroke[0].x, stroke[0].y, 3, 0, Math.PI * 2);
          ctx.fillStyle = strokeColor; ctx.fill(); continue;
        }
        ctx.beginPath(); ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          const prev = stroke[i - 1]; const curr = stroke[i];
          ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
        }
        ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y); ctx.stroke();
      }
    }, [drawBackground, drawGhostLetter, showGuide]);

    useEffect(() => { redrawAll(); }, [redrawAll]);

    useImperativeHandle(ref, () => ({
      clearCanvas: () => { strokes.current = []; currentStroke.current = []; allPoints.current = []; redrawAll(); },
      getPoints: () => [...allPoints.current],
      getImageBase64: () => canvasRef.current?.toDataURL('image/png').split(',')[1] ?? '',
      getStrokesOnlyBase64: () => {
        const off = document.createElement('canvas'); off.width = W; off.height = H;
        const octx = off.getContext('2d')!;
        octx.fillStyle = '#FFFFFF'; octx.fillRect(0, 0, W, H);
        octx.strokeStyle = '#1E1B4B'; octx.lineWidth = 10; octx.lineCap = 'round'; octx.lineJoin = 'round';
        for (const stroke of strokes.current) {
          if (stroke.length < 2) {
            octx.beginPath(); octx.arc(stroke[0].x, stroke[0].y, 3, 0, Math.PI * 2);
            octx.fillStyle = '#1E1B4B'; octx.fill(); continue;
          }
          octx.beginPath(); octx.moveTo(stroke[0].x, stroke[0].y);
          for (let i = 1; i < stroke.length; i++) {
            const prev = stroke[i - 1]; const curr = stroke[i];
            octx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
          }
          octx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y); octx.stroke();
        }
        return off.toDataURL('image/png').split(',')[1];
      },
      getShapeMSE: (letter: string, isUppercase: boolean): number => {
        const pts = allPoints.current; if (pts.length < 5) return 1;
        const GRID = 20;

        // ── 1. 레퍼런스(가이드) 이미지 및 바운딩 박스 생성 ──
        const refCvs = document.createElement('canvas'); refCvs.width = W; refCvs.height = H;
        const rCtx = refCvs.getContext('2d')!;
        rCtx.fillStyle = '#FFFFFF'; rCtx.fillRect(0, 0, W, H);
        const fontSize = isUppercase ? H * 0.58 : H * 0.45;
        const baselineY = H * 0.605;
        rCtx.font = `bold ${fontSize}px "Comic Sans MS", cursive, sans-serif`;
        rCtx.textAlign = 'center'; rCtx.textBaseline = 'alphabetic';
        rCtx.fillStyle = '#000000'; rCtx.fillText(letter, W / 2, baselineY);

        // 레퍼런스의 실제 픽셀 바운딩 박스 찾기
        const refData = rCtx.getImageData(0, 0, W, H).data;
        let rx0 = W, ry0 = H, rx1 = 0, ry1 = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (refData[(y * W + x) * 4] < 128) {
              rx0 = Math.min(rx0, x); ry0 = Math.min(ry0, y);
              rx1 = Math.max(rx1, x); ry1 = Math.max(ry1, y);
            }
          }
        }
        const rw = rx1 - rx0, rh = ry1 - ry0;

        // ── 2. 사용자 획 이미지 및 바운딩 박스 생성 ──
        const usrCvs = document.createElement('canvas'); usrCvs.width = W; usrCvs.height = H;
        const uCtx = usrCvs.getContext('2d')!;
        uCtx.fillStyle = '#FFFFFF'; uCtx.fillRect(0, 0, W, H);
        uCtx.strokeStyle = '#000000'; uCtx.lineWidth = 24; uCtx.lineCap = 'round'; uCtx.lineJoin = 'round';
        for (const stroke of strokes.current) {
          if (stroke.length < 2) {
            uCtx.beginPath(); uCtx.arc(stroke[0].x, stroke[0].y, 15, 0, Math.PI * 2); uCtx.fill(); continue;
          }
          uCtx.beginPath(); uCtx.moveTo(stroke[0].x, stroke[0].y);
          for (let i = 1; i < stroke.length; i++) {
            const prev = stroke[i - 1]; const curr = stroke[i];
            uCtx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
          }
          uCtx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y); uCtx.stroke();
        }

        // 사용자 획 바운딩 박스 (포인트 데이터 기반으로 더 빠르고 정확하게)
        const pad = 10;
        const ux0 = Math.max(0, Math.min(...pts.map(p => p.x)) - pad);
        const uy0 = Math.max(0, Math.min(...pts.map(p => p.y)) - pad);
        const ux1 = Math.min(W, Math.max(...pts.map(p => p.x)) + pad);
        const uy1 = Math.min(H, Math.max(...pts.map(p => p.y)) + pad);
        const uw = ux1 - ux0, uh = uy1 - uy0;

        // ── 3. 정규화 및 비교 ──
        if (rw <= 0 || rh <= 0 || uw <= 0 || uh <= 0) return 1;

        const getDownsampled = (src: HTMLCanvasElement, x: number, y: number, w: number, h: number) => {
          const sm = document.createElement('canvas'); sm.width = GRID; sm.height = GRID;
          const sctx = sm.getContext('2d')!;
          sctx.fillStyle = '#FFFFFF'; sctx.fillRect(0, 0, GRID, GRID);
          sctx.drawImage(src, x, y, w, h, 0, 0, GRID, GRID);
          return sctx.getImageData(0, 0, GRID, GRID).data;
        };

        const refPx = getDownsampled(refCvs, rx0, ry0, rw, rh);
        const usrPx = getDownsampled(usrCvs, ux0, uy0, uw, uh);

        let mse = 0;
        for (let i = 0; i < GRID * GRID; i++) {
          const r = 1 - refPx[i * 4] / 255;
          const u = 1 - usrPx[i * 4] / 255;
          mse += (r - u) ** 2;
        }
        return mse / (GRID * GRID);
      },
    }));

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault(); isDrawing.current = true;
      const pos = getPos(e); currentStroke.current = [pos]; allPoints.current.push(pos);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) { ctx.beginPath(); ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#1E1B4B'; ctx.fill(); }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return; e.preventDefault();
      const pos = getPos(e); const stroke = currentStroke.current; const last = stroke[stroke.length - 1];
      if ((pos.x - last.x) ** 2 + (pos.y - last.y) ** 2 < 4) return;
      stroke.push(pos); allPoints.current.push(pos);
      const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
      ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      if (stroke.length >= 3) {
        const p2 = stroke[stroke.length - 3]; const p1 = stroke[stroke.length - 2];
        ctx.moveTo((p2.x + p1.x) / 2, (p2.y + p1.y) / 2);
        ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + pos.x) / 2, (p1.y + pos.y) / 2);
      } else { ctx.moveTo(last.x, last.y); ctx.lineTo(pos.x, pos.y); }
      ctx.stroke();
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return; e.preventDefault(); isDrawing.current = false;
      if (currentStroke.current.length > 0) { strokes.current.push([...currentStroke.current]); currentStroke.current = []; }
    };

    return (
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className="w-full max-w-[360px] mx-auto rounded-2xl shadow-lg border border-gray-200 cursor-crosshair bg-white"
      />
    );
  },
);

DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;
