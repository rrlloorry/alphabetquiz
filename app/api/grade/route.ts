import { NextRequest, NextResponse } from 'next/server';

interface GradeRequest {
  letter: string;
  imageBase64: string;
}

interface GradeResponse {
  isCorrectShape: boolean;
  reason: string;
}

const PROMPT = `You are looking at handwritten strokes on white paper. A child is learning to write English letters.
What single English letter is written? Look carefully at the shape.
Reply with ONLY this JSON (nothing else): {"identified":"X","confidence":"high"}
- Replace X with the letter you see (A-Z or a-z)
- Use "unknown" if strokes don't form any recognizable letter
- confidence: "high" = clearly one specific letter, "medium" = probably this letter, "low" = very unclear`;

async function askGoogleGemini(
  apiKey: string,
  imageBase64: string,
  model = 'gemini-2.0-flash',
): Promise<{ identified: string; confidence: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: 'image/png', data: imageBase64 } },
                { text: PROMPT },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 80, temperature: 0.0 },
        }),
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[grade] Google Gemini HTTP ${res.status}:`, errText.slice(0, 200));
      return null;
    }
    const data = await res.json();
    const content: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log('[grade] Google Gemini raw:', content);
    return parseAIResponse(content);
  } catch (err) {
    console.error('[grade] Google Gemini exception:', err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}


function parseAIResponse(content: string): { identified: string; confidence: string } | null {
  // Try JSON first
  const jsonMatch = content.match(/\{[^{}]+\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { identified?: string; confidence?: string };
      if (parsed.identified) {
        return {
          identified: parsed.identified.trim().toLowerCase(),
          confidence: parsed.confidence ?? 'low',
        };
      }
    } catch {
      // fall through to text parsing
    }
  }

  // Fallback: find a single letter in the response
  // Look for patterns like "The letter is A" or "identified: B" or just a lone capital letter
  const letterMatch = content.match(/\b([A-Za-z])\b/);
  if (letterMatch) {
    const confidence = content.toLowerCase().includes('clear') || content.toLowerCase().includes('definitely')
      ? 'high'
      : content.toLowerCase().includes('unknown') || content.toLowerCase().includes('unclear')
      ? 'low'
      : 'medium';
    return { identified: letterMatch[1].toLowerCase(), confidence };
  }

  return null;
}

export async function POST(req: NextRequest) {
  let body: GradeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { letter, imageBase64 } = body;
  if (!letter || !imageBase64) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const googleKey = process.env.GOOGLE_AI_KEY;

  if (!googleKey) {
    console.warn('[grade] No GOOGLE_AI_KEY — passing through');
    return NextResponse.json<GradeResponse>({ isCorrectShape: true, reason: 'API 키 없음' });
  }

  // Try Gemini 2.0 Flash first, fall back to 1.5 Flash on rate limit
  let result = await askGoogleGemini(googleKey, imageBase64, 'gemini-2.0-flash');
  if (!result) {
    result = await askGoogleGemini(googleKey, imageBase64, 'gemini-1.5-flash');
  }

  if (!result) {
    console.error('[grade] All AI attempts failed — passing through');
    return NextResponse.json<GradeResponse>({ isCorrectShape: true, reason: 'AI 판별 불가 - 통과' });
  }

  const { identified, confidence } = result;
  const expected = letter.toLowerCase();
  console.log(`[grade] identified="${identified}" expected="${expected}" confidence="${confidence}"`);

  // Unknown / low confidence → benefit of the doubt for children
  if (identified === 'unknown' || confidence === 'low') {
    return NextResponse.json<GradeResponse>({ isCorrectShape: true, reason: '판별 불확실 - 통과' });
  }

  const isCorrect = identified === expected;
  return NextResponse.json<GradeResponse>({
    isCorrectShape: isCorrect,
    reason: isCorrect
      ? `${letter}가 맞아요!`
      : `${letter}가 아니라 ${identified.toUpperCase()}처럼 보여요. 다시 써볼까요?`,
  });
}
