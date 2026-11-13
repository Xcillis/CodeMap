import { DEFAULT_PROGRAM } from '../combat/DecisionProgram';
import { normalizeCampaign, type CampaignState } from './Campaign';

const STORAGE_KEY = 'codemap-m2-progress';

interface StoredProgress {
  programVersion: 3;
  questCompleted: boolean;
  lastProgram: string;
  programs: Record<string, string>;
  blockWorkspaces: Record<string, string>;
  editorMode: 'blocks' | 'text';
  campaign: CampaignState;
}

const fallbackProgress = (): StoredProgress => ({ programVersion: 3, questCompleted: false, lastProgram: DEFAULT_PROGRAM, programs: {}, blockWorkspaces: {}, editorMode: 'blocks', campaign: normalizeCampaign(undefined) });
let volatileProgress: StoredProgress | undefined;

export function loadProgress(): StoredProgress {
  if (typeof window === 'undefined') return fallbackProgress();
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return fallbackProgress();
    const parsed = JSON.parse(value) as Partial<StoredProgress>;
    if (!parsed || parsed.programVersion !== 3) return fallbackProgress();
    return {
      programVersion: 3,
      questCompleted: parsed.questCompleted === true,
      lastProgram: typeof parsed.lastProgram === 'string' ? parsed.lastProgram : DEFAULT_PROGRAM,
      programs: Object.fromEntries(Object.entries(parsed.programs && typeof parsed.programs === 'object' ? parsed.programs : (typeof parsed.lastProgram === 'string' ? { '1:moosling': parsed.lastProgram } : {})).filter((entry) => typeof entry[1] === 'string')),
      blockWorkspaces: Object.fromEntries(Object.entries(parsed.blockWorkspaces && typeof parsed.blockWorkspaces === 'object' ? parsed.blockWorkspaces : {}).filter((entry) => typeof entry[1] === 'string')),
      editorMode: parsed.editorMode === 'text' ? 'text' : 'blocks',
      campaign: normalizeCampaign(parsed.campaign, parsed.questCompleted === true),
    };
  } catch {
    return volatileProgress ? structuredClone(volatileProgress) : fallbackProgress();
  }
}

export function saveProgress(update: Partial<StoredProgress>): void {
  if (typeof window === 'undefined') return;
  volatileProgress = { ...loadProgress(), ...update, programVersion: 3 };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(volatileProgress));
  } catch { /* Storage may be disabled; in-memory editing still works. */ }
}

export function saveProgramDraft(mission: number, actor: string, source: string): void {
  saveProgress({ programs: { ...loadProgress().programs, [`${mission}:${actor}`]: source } });
}
