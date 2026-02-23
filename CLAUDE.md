# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Serve production build
```

If `npm run build` fails with `EBUSY: resource busy or locked`, run `rm -rf .next && npm run build`.

No test runner is configured.

## Architecture

**Stack:** Next.js 16 (App Router), React 18, TypeScript (strict), Tailwind CSS 3.3, Edge API route via OpenRouter.

### Two-Stage Grading

The core of the app is a two-stage letter grading pipeline:

1. **Stage 1 — client-side geometry** (`lib/grading.ts`): Checks bounding box and point distribution relative to the actual 4-line notebook positions (L1=18.5%, L2=39.5%, L3=60.5%, L4=81.5% of canvas height). Grading rules differ by letter type:
   - **Uppercase**: minY < L2+6%, maxY > L2, less than 18% of points below L3
   - **Lowercase basic** (a,c,e,m,n,o,r,s,u,v,w,x,z): points concentrated between L2 and L3
   - **Ascenders** (b,d,f,h,k,l): minY must reach near or above L2
   - **Dot ascenders** (i,j,t): similar but more lenient
   - **Descenders** (g,p,q,y): maxY must go below L3

2. **Stage 2 — AI vision** (`app/api/grade/route.ts`): Edge function called only when Stage 1 passes. Sends a **stroke-only PNG** (no guide lines or ghost letter — from `getStrokesOnlyBase64()`) to OpenRouter (Google Gemini-2.0-Flash-Exp). The user sees a "🔍 AI가 확인하는 중..." spinner; "잘했어요!" is shown only after AI confirms. Requires `OPENROUTER_API_KEY` in `.env.local`; falls back to pass on timeout (5s) or API error.

### Notebook Coordinate System

**Canvas** (`DrawingCanvas.tsx`): 400×400 internal resolution, displayed at `max-w-[360px]`. Guide lines at `LINE_POSITIONS = [0.185, 0.395, 0.605, 0.815]`:
- Line 1 (18.5%): gray solid — top of uppercase
- Line 2 (39.5%): gray dashed — top of lowercase body
- Line 3 (60.5%): red solid — baseline (bottom of uppercase, bottom of lowercase body)
- Line 4 (81.5%): gray solid — descender line

**Ghost letter**: uppercase uses `fontSize = H * 0.583, baselineY = H * 0.605`; lowercase uses `fontSize = H * 0.40, baselineY = H * 0.605`.

**Stroke data** (`lib/strokeData.ts`): SVG paths in `viewBox="0 0 100 100"`. Uppercase spans y=8–92 and is scaled via `matrix(0.5, 0, 0, 0.5, 25, 14.5)` in `StrokeOrderModal` to map y=[8,92] → y=[18.5,60.5] (line 1 to line 3). Lowercase paths are rendered without transform.

### State Management Patterns

**Grade result** (`app/practice/[mode]/[letter]/page.tsx`): State is stored as `gradeEntry: { forLetter: string; result: GradingResult } | null`. The derived value `gradeResult = gradeEntry?.forLetter === letter ? gradeEntry.result : null` ensures stale results from a previously practiced letter are never shown — the check happens at render time, not in a `useEffect`.

**Progress**: All user progress stored in localStorage (`lib/storage.ts`). No server-side state. Each letter stores `LetterStatus: 'pass' | 'attempt' | null`.

### Key Files

| File | Role |
|---|---|
| `lib/strokeData.ts` | SVG stroke paths (A–Z, a–z) + Korean hint strings |
| `lib/grading.ts` | Position-based pass/fail logic — edit here to tune thresholds |
| `components/DrawingCanvas.tsx` | Canvas drawing, guide lines, ghost letter, `getStrokesOnlyBase64()` for AI |
| `components/StrokeOrderModal.tsx` | Animated stroke order modal |
| `app/api/grade/route.ts` | Edge AI grading — model: `google/gemini-2.0-flash-exp:free` |
| `preview.html` | Standalone HTML prototype of the full UI for quick visual testing |

### Fonts

`tailwind.config.ts` defines `font-baloo` (headings/letters, Baloo 2) and `font-nunito` (body, Nunito). Both fall back to Noto Sans KR for Korean glyphs.
