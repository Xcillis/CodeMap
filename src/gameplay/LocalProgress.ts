import { DEFAULT_PROGRAM } from '../combat/DecisionProgram';
import { normalizeCampaign, type CampaignState } from './Campaign';

const STORAGE_KEY = 'codemap-m2-progress';
const BACKUP_KEY = `${STORAGE_KEY}-backup`;

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

function decodeProgress(value: string | null): StoredProgress | undefined {
  if (!value) return;
  const parsed = JSON.parse(value) as Partial<StoredProgress>;
  if (!parsed || parsed.programVersion !== 3) return;
  return {
    programVersion: 3,
    questCompleted: parsed.questCompleted === true,
    lastProgram: typeof parsed.lastProgram === 'string' ? parsed.lastProgram : DEFAULT_PROGRAM,
    programs: Object.fromEntries(Object.entries(parsed.programs && typeof parsed.programs === 'object' ? parsed.programs : (typeof parsed.lastProgram === 'string' ? { '1:moosling': parsed.lastProgram } : {})).filter((entry) => typeof entry[1] === 'string')),
    blockWorkspaces: Object.fromEntries(Object.entries(parsed.blockWorkspaces && typeof parsed.blockWorkspaces === 'object' ? parsed.blockWorkspaces : {}).filter((entry) => typeof entry[1] === 'string')),
    editorMode: parsed.editorMode === 'text' ? 'text' : 'blocks',
    campaign: normalizeCampaign(parsed.campaign, parsed.questCompleted === true),
  };
}
export function loadProgress(): StoredProgress {
  if (typeof window === 'undefined') return fallbackProgress();
  try {
    return decodeProgress(window.localStorage.getItem(STORAGE_KEY)) ?? fallbackProgress();
  } catch {
    return volatileProgress ? structuredClone(volatileProgress) : fallbackProgress();
  }
}

export type AdventureChange = { ok: true } | { ok: false; message: string };
export function adventureBackup(): { arkana: number; quests: number } | undefined {
  try {
    const backup = decodeProgress(window.localStorage.getItem(BACKUP_KEY));
    if (backup) return { arkana: backup.campaign.owned.length, quests: backup.campaign.completed.length };
  } catch { /* A missing or unreadable backup must never enable restoration. */ }
}
function replaceAdventure(next: StoredProgress, backupCurrent: boolean): AdventureChange {
  try {
    const previousBackup = window.localStorage.getItem(BACKUP_KEY);
    const current = loadProgress();
    if (backupCurrent) window.localStorage.setItem(BACKUP_KEY, JSON.stringify(current));
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch (error) {
      if (backupCurrent) {
        if (previousBackup === null) window.localStorage.removeItem(BACKUP_KEY);
        else window.localStorage.setItem(BACKUP_KEY, previousBackup);
      }
      throw error;
    }
    volatileProgress = next; return { ok: true };
  } catch { return { ok: false, message: 'Der Spielstand konnte nicht sicher gewechselt werden. Dein aktuelles Abenteuer bleibt geöffnet. Prüfe, ob der Browser lokale Spielstände speichern kann.' }; }
}
export function startNewAdventure(): AdventureChange {
  const current = loadProgress();
  const hasProgress = current.campaign.introduced || current.campaign.owned.length > 0 || current.campaign.completed.length > 0
    || current.campaign.discovered.length > 0 || current.campaign.introductions.length > 0 || current.questCompleted
    || current.campaign.legacyProgress.completed.length > 0 || current.campaign.legacyProgress.discovered.length > 0
    || Object.keys(current.programs).length > 0 || Object.keys(current.blockWorkspaces).length > 0;
  return replaceAdventure(fallbackProgress(), hasProgress);
}
export function restoreAdventure(): AdventureChange {
  try {
    const backup = decodeProgress(window.localStorage.getItem(BACKUP_KEY));
    if (backup) return replaceAdventure(backup, true);
  } catch { /* Invalid backups never replace a live save. */ }
  return { ok: false, message: 'Es ist kein lesbarer gesicherter Spielstand vorhanden.' };
}

export function saveProgress(update: Partial<StoredProgress>): void {
  if (typeof window === 'undefined') return;
  volatileProgress = { ...loadProgress(), ...update, programVersion: 3 };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(volatileProgress));
  } catch { /* Storage may be disabled; in-memory editing still works. */ }
}

export function saveProgramDraft(mission: number | string, actor: string, source: string): void {
  saveProgress({ programs: { ...loadProgress().programs, [`${mission}:${actor}`]: source } });
}
