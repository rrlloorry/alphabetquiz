export type LetterStatus = 'pass' | 'attempt' | null;

export interface ProgressData {
  uppercase: Record<string, LetterStatus>;
  lowercase: Record<string, LetterStatus>;
}

export interface QuizHistoryEntry {
  date: string;
  score: number;
  total: number;
  wrong: string[];
}

export interface AppData {
  progress: ProgressData;
  quizHistory: QuizHistoryEntry[];
}

const STORAGE_KEY = 'alphabet_practice_data';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function defaultData(): AppData {
  const uppercase: Record<string, LetterStatus> = {};
  const lowercase: Record<string, LetterStatus> = {};
  for (const l of LETTERS) {
    uppercase[l] = null;
    lowercase[l.toLowerCase()] = null;
  }
  return { progress: { uppercase, lowercase }, quizHistory: [] };
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as AppData;
    // Merge with defaults to handle new letters
    const base = defaultData();
    return {
      progress: {
        uppercase: { ...base.progress.uppercase, ...parsed.progress?.uppercase },
        lowercase: { ...base.progress.lowercase, ...parsed.progress?.lowercase },
      },
      quizHistory: parsed.quizHistory ?? [],
    };
  } catch {
    return defaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function updateLetterStatus(
  letter: string,
  isUppercase: boolean,
  status: LetterStatus,
): void {
  const data = loadData();
  if (isUppercase) {
    data.progress.uppercase[letter] = status;
  } else {
    data.progress.lowercase[letter] = status;
  }
  saveData(data);
}

export function getLetterStatus(letter: string, isUppercase: boolean): LetterStatus {
  const data = loadData();
  return isUppercase
    ? (data.progress.uppercase[letter] ?? null)
    : (data.progress.lowercase[letter] ?? null);
}

export function getProgressSummary(isUppercase: boolean): {
  total: number;
  passed: number;
  attempted: number;
} {
  const data = loadData();
  const progress = isUppercase ? data.progress.uppercase : data.progress.lowercase;
  const values = Object.values(progress);
  return {
    total: values.length,
    passed: values.filter((v) => v === 'pass').length,
    attempted: values.filter((v) => v === 'attempt').length,
  };
}

export function getNextUnpracticedLetter(
  currentLetter: string,
  isUppercase: boolean,
): string | null {
  const data = loadData();
  const progress = isUppercase ? data.progress.uppercase : data.progress.lowercase;
  const letters = isUppercase ? LETTERS : LETTERS.toLowerCase();
  const currentIdx = letters.indexOf(currentLetter);
  for (let i = currentIdx + 1; i < letters.length; i++) {
    return letters[i];
  }
  return null;
}
