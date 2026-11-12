import { DEFAULT_PROGRAM } from '../combat/DecisionProgram';

const STORAGE_KEY = 'codemap-m2-progress';

interface StoredProgress {
  programVersion: 3;
  questCompleted: boolean;
  lastProgram: string;
  editorMode: 'blocks' | 'text';
}

const fallbackProgress: StoredProgress = { programVersion: 3, questCompleted: false, lastProgram: DEFAULT_PROGRAM, editorMode: 'blocks' };

export function loadProgress(): StoredProgress {
  if (typeof window === 'undefined') return fallbackProgress;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return fallbackProgress;
    const parsed = JSON.parse(value) as Partial<StoredProgress>;
    if (parsed.programVersion !== 3) return fallbackProgress;
    return {
      programVersion: 3,
      questCompleted: parsed.questCompleted === true,
      lastProgram: typeof parsed.lastProgram === 'string' ? parsed.lastProgram : DEFAULT_PROGRAM,
      editorMode: parsed.editorMode === 'text' ? 'text' : 'blocks',
    };
  } catch {
    return fallbackProgress;
  }
}

export function saveProgress(update: Partial<StoredProgress>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadProgress(), ...update, programVersion: 3 }));
}
