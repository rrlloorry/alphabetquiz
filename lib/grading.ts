export interface StrokePoint {
  x: number;
  y: number;
}

export type Zone = 1 | 2 | 3 | 4;

export interface GradingResult {
  pass: boolean;
  reason: string;
  failZone?: 'tooLow' | 'tooSmall' | 'empty' | 'wrongArea';
}

// 4선 노트 실제 선 위치 — DrawingCanvas.tsx의 LINE_POSITIONS와 동일
const L1 = 0.185; // 1번선 (회색) — 대문자 상단
const L2 = 0.395; // 2번선 (회색 파선) — 소문자 상단
const L3 = 0.605; // 3번선 (빨간선) — 베이스라인
const L4 = 0.815; // 4번선 (회색) — 하강선

function ratio(y: number, H: number) {
  return y / H;
}

export function gradeUppercase(
  points: StrokePoint[],
  canvasWidth: number,
  canvasHeight: number,
): GradingResult {
  const H = canvasHeight;
  const W = canvasWidth;

  if (points.length < 15) {
    return { pass: false, reason: '아직 아무것도 안 썼어요! 글자를 써보세요 ✏️', failZone: 'empty' };
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = maxY - minY;

  // 크기 체크
  if (width / W < 0.15 || height / H < 0.18) {
    return { pass: false, reason: '글자가 너무 작아요! 더 크게 써보세요 📏', failZone: 'tooSmall' };
  }

  // 대문자는 L1~L3 구간에 써야 함 (18.5%~60.5%)
  // 시작점이 너무 낮음: minY가 L2+여유 보다 아래
  if (ratio(minY, H) > L2 + 0.06) {
    return {
      pass: false,
      reason: '대문자는 위쪽 선에서 시작해야 해요! 더 위에 써보세요 ⬆️',
      failZone: 'wrongArea',
    };
  }

  // 끝점이 너무 위: maxY가 L2보다 위에 있음 (글자가 너무 높게만 쓰여짐)
  if (ratio(maxY, H) < L2 - 0.02) {
    return {
      pass: false,
      reason: '글자가 너무 위에 있어요! 빨간 선 근처까지 내려보세요 ⬇️',
      failZone: 'wrongArea',
    };
  }

  // L3(빨간선) 아래로 내려간 점이 너무 많음
  const belowL3 = ys.filter((y) => ratio(y, H) > L3 + 0.05).length / points.length;
  if (belowL3 > 0.18) {
    return {
      pass: false,
      reason: '글자가 너무 아래에 있어요! 빨간 선 위쪽에 써보세요 ⬆️',
      failZone: 'tooLow',
    };
  }

  // L1~L3 구간에 점이 충분히 있어야 함 (75% 이상)
  const inUpperZone = ys.filter(
    (y) => ratio(y, H) >= L1 - 0.08 && ratio(y, H) <= L3 + 0.08,
  ).length / points.length;
  if (inUpperZone < 0.75) {
    return {
      pass: false,
      reason: '대문자는 위쪽 두 칸에 써야 해요! ⬆️',
      failZone: 'wrongArea',
    };
  }

  return { pass: true, reason: '정말 잘 썼어요! 대문자를 바르게 썼어요 🎉' };
}

export function gradeLowercase(
  letter: string,
  points: StrokePoint[],
  canvasWidth: number,
  canvasHeight: number,
): GradingResult {
  const H = canvasHeight;
  const W = canvasWidth;

  if (points.length < 15) {
    return { pass: false, reason: '아직 아무것도 안 썼어요! 글자를 써보세요 ✏️', failZone: 'empty' };
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = maxY - minY;

  // 글자별 최소 높이 기준 설정
  let minHeightRatio = 0.05; // 기본값
  if (['i', 'j', 't', 'l'].includes(letter)) {
    minHeightRatio = 0.03; // 세로로 얇거나 작은 글자들은 더 완화
  }

  if (width / W < 0.05 || height / H < minHeightRatio) {
    return { pass: false, reason: '글자가 너무 작아요! 더 크게 써보세요 📏', failZone: 'tooSmall' };
  }

  // 상승자 (ascender): b d f h k l — 몸통은 L2~L3, 위쪽 획은 L1까지
  const ascenders = ['b', 'd', 'f', 'h', 'k', 'l'];
  // 점 포함 상승자: i j t — 살짝 위로만 올라감
  const dotAscenders = ['i', 'j', 't'];
  // 하강자 (descender): g p q y — 몸통은 L2~L3, 아래쪽 획은 L4까지
  const descenders = ['g', 'p', 'q', 'y'];

  if (ascenders.includes(letter)) {
    // 위로 올라가야 함: minY가 L2보다 위(또는 가까이)여야 함
    if (ratio(minY, H) > L2 + 0.04) {
      return {
        pass: false,
        reason: '이 글자는 위로 길게 써야 해요! 첫 번째 선까지 올려보세요 ⬆️',
        failZone: 'wrongArea',
      };
    }
    // 너무 아래까지 내려가면 안 됨
    if (ratio(maxY, H) > L4 + 0.04) {
      return { pass: false, reason: '글자가 너무 아래까지 내려왔어요! ⬆️', failZone: 'tooLow' };
    }
    // 몸통이 L3(빨간선)까지 내려와야 함
    if (ratio(maxY, H) < L2 + 0.04) {
      return {
        pass: false,
        reason: '글자가 너무 위에만 있어요! 빨간 선까지 내려보세요 ⬇️',
        failZone: 'wrongArea',
      };
    }
  } else if (dotAscenders.includes(letter)) {
    // i, j, t: 몸통은 L2~L3, 약간 위로
    if (ratio(minY, H) > L2 + 0.08) {
      return {
        pass: false,
        reason: '이 글자는 가운데 칸에 써야 해요! ⬆️',
        failZone: 'wrongArea',
      };
    }
    if (ratio(maxY, H) > L4 + 0.04) {
      return { pass: false, reason: '글자가 너무 아래까지 내려왔어요! ⬆️', failZone: 'tooLow' };
    }
  } else if (descenders.includes(letter)) {
    // 아래로 내려가야 함: maxY가 L3보다 아래여야 함
    if (ratio(maxY, H) < L3 + 0.04) {
      return {
        pass: false,
        reason: '이 글자의 꼬리는 아래 칸에 써야 해요! ⬇️',
        failZone: 'wrongArea',
      };
    }
    // 몸통 시작이 너무 낮으면 안 됨
    if (ratio(minY, H) > L3 - 0.04) {
      return {
        pass: false,
        reason: '글자 몸통이 너무 아래에 있어요! 조금 위에 써보세요 ⬆️',
        failZone: 'wrongArea',
      };
    }
    // 너무 위에서 시작하면 안 됨 (대문자처럼 쓴 경우)
    if (ratio(minY, H) < L1 + 0.02) {
      return {
        pass: false,
        reason: '소문자는 가운데 칸에서 시작해요! ⬇️',
        failZone: 'wrongArea',
      };
    }
  } else {
    // 기본 소문자: a c e m n o r s u v w x z
    // L2~L3 구간(39.5%~60.5%)에 주로 있어야 함

    // 너무 위에 있음: 대부분의 점이 L2 위에 있음
    if (ratio(maxY, H) < L2 + 0.04) {
      return {
        pass: false,
        reason: '소문자는 가운데 칸에 써야 해요! 조금 아래로 내려보세요 ⬇️',
        failZone: 'wrongArea',
      };
    }
    // 너무 아래에 있음: 시작점이 L3 근처 또는 아래
    if (ratio(minY, H) > L3 - 0.04) {
      return {
        pass: false,
        reason: '소문자는 가운데 칸에 써야 해요! 조금 위로 올려보세요 ⬆️',
        failZone: 'wrongArea',
      };
    }
    // L2~L3 구간 밖의 점이 너무 많음 (위로 삐져나감)
    const aboveL2 = ys.filter((y) => ratio(y, H) < L2 - 0.02).length / points.length;
    if (aboveL2 > 0.25) {
      return {
        pass: false,
        reason: '소문자는 가운데 칸에 써요! 조금 아래로 내려보세요 ⬇️',
        failZone: 'wrongArea',
      };
    }
    // L3(빨간선) 아래로 많이 내려감
    const belowL3 = ys.filter((y) => ratio(y, H) > L3 + 0.04).length / points.length;
    if (belowL3 > 0.25) {
      return {
        pass: false,
        reason: '소문자는 가운데 칸에 써야 해요! 📍',
        failZone: 'wrongArea',
      };
    }
    // 글자가 너무 작음 (높이가 L2~L3 간격의 30% 미만)
    const expectedHeight = (L3 - L2) * H; // 약 84px
    if (height < expectedHeight * 0.30) {
      return {
        pass: false,
        reason: '글자가 너무 작아요! 더 크게 써보세요 📏',
        failZone: 'tooSmall',
      };
    }
  }

  return { pass: true, reason: '정말 잘 썼어요! 소문자를 바르게 썼어요 🎉' };
}
