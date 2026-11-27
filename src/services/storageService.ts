import { createNewSaveState, SAVE_VERSION } from '../engine/rules';
import { SaveState } from '../types/game';

const STORAGE_KEY = 'lexicon_isle_save_v1';

export interface StorageProvider {
  hasSave(): boolean;
  load(): SaveState | null;
  save(state: SaveState): boolean;
  reset(): void;
}

function isValidSave(raw: unknown): raw is SaveState {
  if (!raw || typeof raw !== 'object') return false;
  const candidate = raw as Partial<SaveState>;
  return (
    typeof candidate.day === 'number' &&
    typeof candidate.weather === 'string' &&
    Boolean(candidate.player) &&
    typeof candidate.player?.x === 'number' &&
    typeof candidate.player?.y === 'number' &&
    Array.isArray(candidate.farmPlots) &&
    typeof candidate.inventory === 'object' &&
    typeof candidate.vocabProgress === 'object'
  );
}

class LocalStorageService implements StorageProvider {
  hasSave(): boolean {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      return isValidSave(JSON.parse(raw));
    } catch {
      return false;
    }
  }

  load(): SaveState | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isValidSave(parsed)) return null;
      const base = createNewSaveState();
      return {
        ...base,
        ...parsed,
        version: SAVE_VERSION,
        player: {
          ...base.player,
          ...parsed.player,
        },
        upgrades: {
          ...base.upgrades,
          ...(parsed.upgrades || {}),
        },
        solvedChallenges: Array.isArray(parsed.solvedChallenges)
          ? parsed.solvedChallenges
          : [],
        vocabProgress: {
          ...base.vocabProgress,
          ...parsed.vocabProgress,
        },
      };
    } catch {
      return null;
    }
  }

  save(state: SaveState): boolean {
    try {
      const payload: SaveState = {
        ...state,
        version: SAVE_VERSION,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  reset(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors in restricted contexts
    }
  }
}

// Abstracted singleton so localStorage can later be swapped to Supabase without touching UI or engine
export const storageService: StorageProvider = new LocalStorageService();
