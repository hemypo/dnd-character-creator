import { BalanceCard } from './balance';

export type Species2024 =
  | 'human'
  | 'elf'
  | 'dwarf'
  | 'halfling'
  | 'gnome'
  | 'dragonborn'
  | 'tiefling'
  | 'orc'
  | 'goliath'
  | string;

export type Class2024 =
  | 'barbarian'
  | 'bard'
  | 'cleric'
  | 'druid'
  | 'fighter'
  | 'monk'
  | 'paladin'
  | 'ranger'
  | 'rogue'
  | 'sorcerer'
  | 'warlock'
  | 'wizard'
  | string;

export type Background2024 =
  | 'acolyte'
  | 'artisan'
  | 'charlatan'
  | 'criminal'
  | 'entertainer'
  | 'farmer'
  | 'guard'
  | 'guide'
  | 'hermit'
  | 'merchant'
  | 'noble'
  | 'sage'
  | 'sailor'
  | 'scribe'
  | 'soldier'
  | 'wayfarer'
  | string;

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface CharacterCoins {
  gp: number;
  sp: number;
  cp: number;
}

export interface CharacterSpellSlots {
  level1Max: number;
  level1Used: number;
}

export interface CharacterAppearance {
  gender?: string;
  age?: string;
  build?: string;
  hairAndEyes?: string;
  distinguishingFeatures?: string;
}

export interface Character {
  id: string;
  key: string;
  name: string;
  species: Species2024;
  characterClass: Class2024;
  background: Background2024;
  abilityScores: AbilityScores;
  hp: number;
  maxHp: number;
  currentHp?: number;
  ac: number;
  speed: number;
  originFeat: string;
  alignment?: string;
  gender?: string;
  appearance?: CharacterAppearance;
  customMechanic?: BalanceCard;
  backstory?: string;
  portraitUrl?: string;
  createdAt: string;
  tempHp?: number;
  coins?: CharacterCoins;
  spellSlots?: CharacterSpellSlots;
  notes?: string;
}

export interface CreateCharacterInput {
  id?: string;
  key?: string;
  name?: string;
  species?: Species2024;
  characterClass?: Class2024;
  background?: Background2024;
  abilityScores?: Partial<AbilityScores>;
  hp?: number;
  maxHp?: number;
  currentHp?: number;
  ac?: number;
  speed?: number;
  originFeat?: string;
  alignment?: string;
  gender?: string;
  appearance?: CharacterAppearance;
  customMechanic?: BalanceCard;
  backstory?: string;
  portraitUrl?: string;
  createdAt?: string;
  tempHp?: number;
  coins?: CharacterCoins;
  spellSlots?: CharacterSpellSlots;
  notes?: string;
}

export function generateHeroKey(): string {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `HERO-${randNum}`;
}

export function createInitialCharacter(input: CreateCharacterInput = {}): Character {
  const abilityScores: AbilityScores = {
    strength: input.abilityScores?.strength ?? 10,
    dexterity: input.abilityScores?.dexterity ?? 10,
    constitution: input.abilityScores?.constitution ?? 10,
    intelligence: input.abilityScores?.intelligence ?? 10,
    wisdom: input.abilityScores?.wisdom ?? 10,
    charisma: input.abilityScores?.charisma ?? 10,
  };

  const hp = input.hp ?? 10;
  const maxHp = input.maxHp ?? hp;

  const character: Character = {
    id: input.id ?? `char-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    key: input.key ?? generateHeroKey(),
    name: input.name ?? 'Безымянный герой',
    species: input.species ?? 'human',
    characterClass: input.characterClass ?? 'fighter',
    background: input.background ?? 'soldier',
    abilityScores,
    hp,
    maxHp,
    ac: input.ac ?? 10,
    speed: input.speed ?? 30,
    originFeat: input.originFeat ?? 'Savage Attacker',
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  if (input.alignment !== undefined) {
    character.alignment = input.alignment;
  }
  if (input.gender !== undefined) {
    character.gender = input.gender;
  }
  if (input.appearance !== undefined) {
    character.appearance = input.appearance;
  }
  if (input.customMechanic !== undefined) {
    character.customMechanic = input.customMechanic;
  }
  if (input.backstory !== undefined) {
    character.backstory = input.backstory;
  }
  if (input.portraitUrl !== undefined) {
    character.portraitUrl = input.portraitUrl;
  }
  if (input.tempHp !== undefined) {
    character.tempHp = input.tempHp;
  }
  if (input.coins !== undefined) {
    character.coins = input.coins;
  }
  if (input.spellSlots !== undefined) {
    character.spellSlots = input.spellSlots;
  }
  if (input.notes !== undefined) {
    character.notes = input.notes;
  }

  return character;
}

export function validateCharacter(char: unknown): char is Character {
  if (!char || typeof char !== 'object') {
    return false;
  }

  const c = char as Record<string, unknown>;

  if (typeof c.id !== 'string' || c.id.trim() === '') return false;
  if (typeof c.key !== 'string' || !/^HERO-[A-Za-z0-9_-]+$/.test(c.key)) return false;
  if (typeof c.name !== 'string' || c.name.trim() === '') return false;
  if (typeof c.species !== 'string' || c.species.trim() === '') return false;
  if (typeof c.characterClass !== 'string' || c.characterClass.trim() === '') return false;
  if (typeof c.background !== 'string' || c.background.trim() === '') return false;

  if (typeof c.hp !== 'number' || c.hp <= 0 || !Number.isFinite(c.hp)) return false;
  if (typeof c.maxHp !== 'number' || c.maxHp < c.hp || !Number.isFinite(c.maxHp)) return false;
  if (typeof c.ac !== 'number' || c.ac <= 0 || !Number.isFinite(c.ac)) return false;
  if (typeof c.speed !== 'number' || c.speed <= 0 || !Number.isFinite(c.speed)) return false;
  if (typeof c.originFeat !== 'string' || c.originFeat.trim() === '') return false;

  // Ability scores validation
  if (!c.abilityScores || typeof c.abilityScores !== 'object') return false;
  const scores = c.abilityScores as Record<string, unknown>;
  const attributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
  for (const attr of attributes) {
    const val = scores[attr];
    if (typeof val !== 'number' || !Number.isFinite(val) || val < 1 || val > 30) {
      return false;
    }
  }

  // Optional custom mechanic
  if (c.customMechanic !== undefined && c.customMechanic !== null) {
    if (typeof c.customMechanic !== 'object') return false;
    const cm = c.customMechanic as Record<string, unknown>;
    if (typeof cm.id !== 'string' || typeof cm.title !== 'string' || typeof cm.effect !== 'string') {
      return false;
    }
  }

  // Optional backstory & portraitUrl & alignment & gender & appearance
  if (c.backstory !== undefined && typeof c.backstory !== 'string') return false;
  if (c.portraitUrl !== undefined && typeof c.portraitUrl !== 'string') return false;
  if (c.alignment !== undefined && typeof c.alignment !== 'string') return false;
  if (c.gender !== undefined && typeof c.gender !== 'string') return false;
  if (c.appearance !== undefined && c.appearance !== null && typeof c.appearance !== 'object') return false;

  // Optional in-game live fields
  if (c.tempHp !== undefined && (typeof c.tempHp !== 'number' || !Number.isFinite(c.tempHp) || c.tempHp < 0)) {
    return false;
  }
  if (c.coins !== undefined && c.coins !== null) {
    if (typeof c.coins !== 'object') return false;
    const coins = c.coins as Record<string, unknown>;
    if (
      typeof coins.gp !== 'number' || !Number.isFinite(coins.gp) || coins.gp < 0 ||
      typeof coins.sp !== 'number' || !Number.isFinite(coins.sp) || coins.sp < 0 ||
      typeof coins.cp !== 'number' || !Number.isFinite(coins.cp) || coins.cp < 0
    ) {
      return false;
    }
  }
  if (c.spellSlots !== undefined && c.spellSlots !== null) {
    if (typeof c.spellSlots !== 'object') return false;
    const ss = c.spellSlots as Record<string, unknown>;
    if (
      typeof ss.level1Max !== 'number' || !Number.isFinite(ss.level1Max) || ss.level1Max < 0 ||
      typeof ss.level1Used !== 'number' || !Number.isFinite(ss.level1Used) || ss.level1Used < 0
    ) {
      return false;
    }
  }
  if (c.notes !== undefined && typeof c.notes !== 'string') return false;

  return true;
}
