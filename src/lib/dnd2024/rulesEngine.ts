import {
  Character,
  AbilityScores,
  Species2024,
  Class2024,
  Background2024,
  generateHeroKey,
  createInitialCharacter,
} from '@/types/character';
import { ArchetypeSelection } from '@/types/archetype';

export interface CharacterChassis extends Character {
  weaponMasteries?: string[];
  startingEquipment?: string[];
}

export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

interface ClassArchetypeProfile {
  characterClass: Class2024;
  background: Background2024;
  originFeat: string;
  defaultName: string;
  baseHitDie: number;
  calculateAbilityScores: () => AbilityScores;
  calculateAc: (scores: AbilityScores) => number;
}

const CLASS_PROFILES: Record<string, ClassArchetypeProfile> = {
  fighter: {
    characterClass: 'fighter',
    background: 'soldier',
    originFeat: 'Savage Attacker',
    defaultName: 'Храбрый воитель',
    baseHitDie: 10,
    calculateAbilityScores: () => ({
      strength: 17, // 15 + 2 (Soldier ASI)
      dexterity: 13,
      constitution: 15, // 14 + 1 (Soldier ASI)
      intelligence: 8,
      wisdom: 12,
      charisma: 10,
    }),
    calculateAc: () => 16, // Chain Mail (heavy armor, flat 16)
  },
  wizard: {
    characterClass: 'wizard',
    background: 'sage',
    originFeat: 'Magic Initiate',
    defaultName: 'Искатель тайн',
    baseHitDie: 6,
    calculateAbilityScores: () => ({
      strength: 8,
      dexterity: 14,
      constitution: 14, // 13 + 1 (Sage ASI)
      intelligence: 17, // 15 + 2 (Sage ASI)
      wisdom: 12,
      charisma: 10,
    }),
    calculateAc: (scores) => 10 + calculateModifier(scores.dexterity), // 10 + 2 = 12
  },
  rogue: {
    characterClass: 'rogue',
    background: 'criminal',
    originFeat: 'Alert',
    defaultName: 'Ночной следопыт',
    baseHitDie: 8,
    calculateAbilityScores: () => ({
      strength: 8,
      dexterity: 17, // 15 + 2 (Criminal ASI)
      constitution: 15, // 14 + 1 (Criminal ASI)
      intelligence: 13,
      wisdom: 12,
      charisma: 10,
    }),
    calculateAc: (scores) => 11 + calculateModifier(scores.dexterity), // Leather Armor 11 + 3 = 14
  },
  cleric: {
    characterClass: 'cleric',
    background: 'acolyte',
    originFeat: 'Healer',
    defaultName: 'Светлый хранитель',
    baseHitDie: 8,
    calculateAbilityScores: () => ({
      strength: 12,
      dexterity: 14,
      constitution: 14, // 13 + 1 (Acolyte ASI)
      intelligence: 8,
      wisdom: 17, // 15 + 2 (Acolyte ASI)
      charisma: 10,
    }),
    calculateAc: (scores) => 14 + Math.min(2, calculateModifier(scores.dexterity)) + 2, // Scale Mail (14 + 2) + Shield (+2) = 18
  },
};

const ARCHETYPE_CLASS_MAP: Record<string, string> = {
  'tank:martial': 'fighter',
  'tank:divine': 'fighter',
  'tank:arcane': 'fighter',
  'tank:shadow': 'fighter',

  'blaster:arcane': 'wizard',
  'blaster:divine': 'cleric',
  'blaster:shadow': 'wizard',
  'blaster:martial': 'fighter',

  'striker:shadow': 'rogue',
  'striker:martial': 'fighter',
  'striker:arcane': 'wizard',
  'striker:divine': 'cleric',

  'support:divine': 'cleric',
  'support:arcane': 'wizard',
  'support:martial': 'fighter',
  'support:shadow': 'rogue',
};

const WEAPON_MASTERIES_MAP: Record<string, string[]> = {
  fighter: ['Topple (Опрокидывание)', 'Push (Толчок)', 'Vex (Досада)'],
  rogue: ['Nick (Порез)', 'Vex (Досада)'],
  barbarian: ['Topple (Опрокидывание)', 'Cleave (Рассечение)'],
  paladin: ['Push (Толчок)', 'Slow (Замедление)'],
  ranger: ['Vex (Досада)', 'Slow (Замедление)'],
  wizard: [],
  cleric: [],
  sorcerer: [],
  warlock: [],
  bard: [],
  druid: [],
  monk: [],
};

const STARTING_EQUIPMENT_MAP: Record<string, string[]> = {
  fighter: [
    'Кольчуга (Chain Mail, AC 16)',
    'Двуручный меч (Greatsword 2d6, Topple)',
    'Легкий арбалет с 20 болтами',
    'Набор исследователя подземелий',
    '15 золотых монет',
  ],
  rogue: [
    'Кожаный доспех (Leather Armor, AC 11)',
    'Короткий меч (Shortsword 1d6, Vex)',
    '2 кинжала (Dagger 1d4, Nick)',
    'Воровские инструменты',
    'Набор грабителя',
    '15 золотых монет',
  ],
  wizard: [
    'Книга заклинаний (Spellbook)',
    'Магический фокус / Боевой посох (Quarterstaff)',
    '2 кинжала',
    'Набор ученого',
    'Сумка для компонентов',
    '10 золотых монет',
  ],
  cleric: [
    'Чешуйчатый доспех (Scale Mail, AC 14)',
    'Щит (+2 AC)',
    'Боевой молот (Warhammer 1d8/1d10, Push)',
    'Священный символ',
    'Набор священника',
    '15 золотых монет',
  ],
};

export function getWeaponMasteries(characterClass: string): string[] {
  return WEAPON_MASTERIES_MAP[characterClass.toLowerCase()] ?? [];
}

export function getStartingEquipment(characterClass: string): string[] {
  return STARTING_EQUIPMENT_MAP[characterClass.toLowerCase()] ?? [
    'Простая одежда',
    'Кинжал (1d4)',
    'Поясной кошель с 10 зм',
  ];
}

export function buildBaseChassis(selection: ArchetypeSelection): CharacterChassis {
  const mapKey = `${selection.roleId.toLowerCase()}:${selection.powerSourceId.toLowerCase()}`;
  const classKey = ARCHETYPE_CLASS_MAP[mapKey] || 'fighter';
  const profile = CLASS_PROFILES[classKey] || CLASS_PROFILES.fighter;

  const validSpecies: Species2024 = selection.speciesId
    ? (selection.speciesId.toLowerCase() as Species2024)
    : 'human';

  const abilityScores = profile.calculateAbilityScores();
  const conMod = calculateModifier(abilityScores.constitution);
  const hp = profile.baseHitDie + conMod;
  const ac = profile.calculateAc(abilityScores);
  const speed = 30; // D&D 2024 standardized base speed

  const characterName =
    selection.characterName && selection.characterName.trim() !== ''
      ? selection.characterName.trim()
      : profile.defaultName;

  const character = createInitialCharacter({
    id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    key: generateHeroKey(),
    name: characterName,
    species: validSpecies,
    characterClass: profile.characterClass,
    background: profile.background,
    abilityScores,
    hp,
    maxHp: hp,
    ac,
    speed,
    originFeat: profile.originFeat,
    alignment: selection.alignment,
    gender: selection.gender,
    appearance: selection.appearance,
    createdAt: new Date().toISOString(),
  });

  const chassis: CharacterChassis = {
    ...character,
    weaponMasteries: getWeaponMasteries(profile.characterClass),
    startingEquipment: getStartingEquipment(profile.characterClass),
  };

  return chassis;
}
