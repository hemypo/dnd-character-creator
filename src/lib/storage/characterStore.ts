import fs from 'fs';
import path from 'path';
import { Character } from '@/types/character';

export interface CharacterSummary {
  id: string;
  key: string;
  name: string;
  species: string;
  characterClass: string;
  background: string;
  hp: number;
  ac: number;
  portraitUrl?: string;
  createdAt: string;
}

const STORAGE_DIR = path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'characters.json');

const KEY_CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// In-memory cache for fast lookups and atomic synchronization
let memoryCache: Record<string, Character> | null = null;

/**
 * Generates a clean human-readable character key matching HERO-[A-Z0-9]{4}
 */
export function generateCharacterKey(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * KEY_CHARACTERS.length);
    code += KEY_CHARACTERS.charAt(randomIndex);
  }
  return `HERO-${code}`;
}

/**
 * Ensures the data directory and characters.json file exist, then initializes the cache.
 */
function ensureStorageLoaded(): Record<string, Character> {
  if (memoryCache !== null) {
    return memoryCache;
  }

  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    if (fs.existsSync(STORAGE_FILE)) {
      const fileData = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        memoryCache = parsed as Record<string, Character>;
      } else if (Array.isArray(parsed)) {
        // Handle array migration if applicable
        memoryCache = {};
        for (const item of parsed) {
          if (item?.key) {
            memoryCache[String(item.key).toUpperCase()] = item;
          }
        }
      } else {
        memoryCache = {};
      }
    } else {
      memoryCache = {};
      fs.writeFileSync(STORAGE_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Failed to read characters storage, initializing empty store:', error);
    memoryCache = {};
  }

  return memoryCache;
}

/**
 * Generates a unique character key that does not collide with existing records in the store.
 */
export function generateUniqueCharacterKey(): string {
  const store = ensureStorageLoaded();
  let key: string;
  do {
    key = generateCharacterKey();
  } while (store[key]);
  return key;
}

/**
 * Persists the in-memory cache to the filesystem synchronously and atomically.
 * Prevents Windows EPERM issues and guarantees no orphan .tmp files leak.
 */
function persistStorage(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const dataToSave = memoryCache || {};
  const tempFile = `${STORAGE_FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;

  try {
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    try {
      fs.renameSync(tempFile, STORAGE_FILE);
    } catch {
      // On Windows or locked file scenarios, renameSync can throw EPERM/EBUSY; fallback to copyFileSync
      fs.copyFileSync(tempFile, STORAGE_FILE);
    }
  } catch (error) {
    console.error('Failed to persist character storage atomically:', error);
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (innerError) {
      console.error('Critical: unable to write character storage file:', innerError);
    }
  } finally {
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Ignore temp file cleanup failure
      }
    }
  }
}

/**
 * Saves a character record into storage and returns the generated or assigned key.
 */
export async function saveCharacterRecord(character: Character): Promise<{ key: string }> {
  const store = ensureStorageLoaded();

  let assignedKey = character.key ? character.key.trim().toUpperCase() : '';

  // If no key or invalid key format, generate a new unique key
  if (!assignedKey || !/^HERO-[A-Z0-9_-]+$/i.test(assignedKey)) {
    assignedKey = generateUniqueCharacterKey();
  }

  const completeCharacter: Character = {
    ...character,
    id: character.id || `char-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    key: assignedKey,
    createdAt: character.createdAt || new Date().toISOString(),
  };

  store[assignedKey] = completeCharacter;
  persistStorage();

  return { key: assignedKey };
}

/**
 * Retrieves a character record by its key (case-insensitive lookup).
 */
export async function getCharacterRecord(key: string): Promise<Character | null> {
  if (!key || typeof key !== 'string') {
    return null;
  }

  const store = ensureStorageLoaded();
  const normalizedKey = key.trim().toUpperCase();

  const found = store[normalizedKey];
  if (!found) {
    return null;
  }

  // Return a fresh clone to prevent external mutations
  return JSON.parse(JSON.stringify(found)) as Character;
}

/**
 * Lists the most recently created characters as summaries.
 */
export async function listRecentCharacters(limit: number = 20): Promise<CharacterSummary[]> {
  const store = ensureStorageLoaded();

  const characters = Object.values(store);

  characters.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const selected = characters.slice(0, limit);

  return selected.map((char) => ({
    id: char.id,
    key: char.key,
    name: char.name,
    species: char.species,
    characterClass: char.characterClass,
    background: char.background,
    hp: char.hp,
    ac: char.ac,
    portraitUrl: char.portraitUrl,
    createdAt: char.createdAt,
  }));
}

/**
 * Resets the in-memory cache and storage file (useful for test isolation).
 */
export async function resetCharacterStore(): Promise<void> {
  memoryCache = {};
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({}, null, 2), 'utf-8');

    // Clean up any stray tmp files in data directory
    const files = fs.readdirSync(STORAGE_DIR);
    for (const file of files) {
      if (file.includes('.tmp')) {
        try {
          fs.unlinkSync(path.join(STORAGE_DIR, file));
        } catch {
          // ignore cleanup failure
        }
      }
    }
  } catch (error) {
    console.error('Failed to reset character store file:', error);
  }
}
