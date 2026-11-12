import { DEFAULT_PROGRAM } from '../combat/DecisionProgram';

const STORAGE_KEY = 'codemap-m2-progress';

interface StoredProgress {
  questCompleted: boolean;
  lastProgram: string;
}

const fallbackProgress: StoredProgress = { questCompleted: false, lastProgram: DEFAULT_PROGRAM };

export function loadProgress(): StoredProgress {
  if (typeof window === 'undefined') return fallbackProgress;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return fallbackProgress;
    const parsed = JSON.parse(value) as Partial<StoredProgress>;
    return {
      questCompleted: parsed.questCompleted === true,
      lastProgram: typeof parsed.lastProgram === 'string' ? parsed.lastProgram : DEFAULT_PROGRAM,
    };
  } catch {
    return fallbackProgress;
  }
}

export function saveProgress(update: Partial<StoredProgress>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadProgress(), ...update }));
}
