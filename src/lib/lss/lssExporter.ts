import { Character } from '@/types/character';
import { calculateModifier } from '@/lib/dnd2024/rulesEngine';

const SPECIES_RU: Record<string, string> = {
  human: 'Человек',
  elf: 'Эльф',
  dwarf: 'Дварф',
  tiefling: 'Тифлинг',
  halfling: 'Полурослик',
  dragonborn: 'Драконорожденный',
  gnome: 'Гном',
  orc: 'Орк',
  goliath: 'Голиаф',
};

const CLASS_RU: Record<string, string> = {
  fighter: 'Воин',
  rogue: 'Плут',
  cleric: 'Жрец',
  wizard: 'Волшебник',
  barbarian: 'Варвар',
  paladin: 'Паладин',
  ranger: 'Следопыт',
  bard: 'Бард',
  druid: 'Друид',
  monk: 'Монах',
  sorcerer: 'Чародей',
  warlock: 'Колдун',
};

const BACKGROUND_RU: Record<string, string> = {
  soldier: 'Солдат',
  criminal: 'Преступник',
  sage: 'Мудрец',
  acolyte: 'Прислужник',
  guide: 'Проводник',
  wayfarer: 'Странник',
  artisan: 'Ремесленник',
  guard: 'Стражник',
  noble: 'Дворянин',
};

const CLASS_SAVES: Record<string, [string, string]> = {
  fighter: ['str', 'con'],
  barbarian: ['str', 'con'],
  rogue: ['dex', 'int'],
  ranger: ['str', 'dex'],
  monk: ['str', 'dex'],
  wizard: ['int', 'wis'],
  cleric: ['wis', 'cha'],
  druid: ['int', 'wis'],
  paladin: ['wis', 'cha'],
  warlock: ['wis', 'cha'],
  sorcerer: ['con', 'cha'],
  bard: ['dex', 'cha'],
};

const HIT_DICE_BY_CLASS: Record<string, string> = {
  barbarian: 'd12',
  fighter: 'd10',
  paladin: 'd10',
  ranger: 'd10',
  cleric: 'd8',
  druid: 'd8',
  monk: 'd8',
  rogue: 'd8',
  bard: 'd8',
  warlock: 'd8',
  wizard: 'd6',
  sorcerer: 'd6',
};

export interface LongStoryShortDocument {
  jsonType: 'character';
  version: '2';
  edition: '2024';
  sheetEdition: '2024';
  spells: {
    mode: 'cards' | 'text';
    prepared: string[];
    book: string[];
    pending: unknown[];
    granted: unknown[];
    slotless: string[];
  };
  disabledBlocks: {
    'info-left': string[];
    'info-right': string[];
    'subinfo-left': string[];
    'subinfo-right': string[];
    'notes-left': string[];
    'notes-right': string[];
  };
  data: string;
}

/**
 * Converts internal Character model into official Long Story Short character document JSON.
 * Compatible with longstoryshort.app character import and automated sheet linking.
 */
export function exportToLongStoryShort(character: Character): LongStoryShortDocument {
  const speciesKey = (character.species || 'human').toLowerCase();
  const classKey = (character.characterClass || 'fighter').toLowerCase();
  const bgKey = (character.background || 'soldier').toLowerCase();

  const speciesRu = SPECIES_RU[speciesKey] || character.species;
  const classRu = CLASS_RU[classKey] || character.characterClass;
  const bgRu = BACKGROUND_RU[bgKey] || character.background;
  const hitDie = HIT_DICE_BY_CLASS[classKey] || 'd8';

  const [save1, save2] = CLASS_SAVES[classKey] || ['str', 'con'];

  const stats = {
    str: { name: 'str', score: character.abilityScores.strength },
    dex: { name: 'dex', score: character.abilityScores.dexterity },
    con: { name: 'con', score: character.abilityScores.constitution },
    int: { name: 'int', score: character.abilityScores.intelligence },
    wis: { name: 'wis', score: character.abilityScores.wisdom },
    cha: { name: 'cha', score: character.abilityScores.charisma },
  };

  const saves = {
    str: { proficient: save1 === 'str' || save2 === 'str' },
    dex: { proficient: save1 === 'dex' || save2 === 'dex' },
    con: { proficient: save1 === 'con' || save2 === 'con' },
    int: { proficient: save1 === 'int' || save2 === 'int' },
    wis: { proficient: save1 === 'wis' || save2 === 'wis' },
    cha: { proficient: save1 === 'cha' || save2 === 'cha' },
  };

  const skills: Record<string, { stat: string; proficient: boolean }> = {
    acrobatics: { stat: 'dex', proficient: false },
    animalHandling: { stat: 'wis', proficient: false },
    arcana: { stat: 'int', proficient: classKey === 'wizard' },
    athletics: { stat: 'str', proficient: classKey === 'fighter' || classKey === 'barbarian' },
    deception: { stat: 'cha', proficient: classKey === 'rogue' },
    history: { stat: 'int', proficient: bgKey === 'sage' },
    insight: { stat: 'wis', proficient: classKey === 'cleric' },
    intimidation: { stat: 'cha', proficient: bgKey === 'soldier' },
    investigation: { stat: 'int', proficient: classKey === 'rogue' },
    medicine: { stat: 'wis', proficient: classKey === 'cleric' },
    nature: { stat: 'int', proficient: false },
    perception: { stat: 'wis', proficient: true }, // Alert feat / standard
    performance: { stat: 'cha', proficient: false },
    persuasion: { stat: 'cha', proficient: false },
    religion: { stat: 'int', proficient: bgKey === 'acolyte' },
    sleightOfHand: { stat: 'dex', proficient: classKey === 'rogue' },
    stealth: { stat: 'dex', proficient: classKey === 'rogue' },
    survival: { stat: 'wis', proficient: bgKey === 'guide' },
  };

  // Appearance string representation
  const appearanceParts: string[] = [];
  if (character.gender) appearanceParts.push(`Пол: ${character.gender}`);
  if (character.appearance?.age) appearanceParts.push(`Возраст: ${character.appearance.age}`);
  if (character.appearance?.build) appearanceParts.push(`Телосложение: ${character.appearance.build}`);
  if (character.appearance?.hairAndEyes) appearanceParts.push(`Волосы и глаза: ${character.appearance.hairAndEyes}`);
  if (character.appearance?.distinguishingFeatures) {
    appearanceParts.push(`Особые приметы: ${character.appearance.distinguishingFeatures}`);
  }
  const appearanceString = appearanceParts.join('\n');

  // Features list
  const featuresList = [
    {
      name: `Черта происхождения: ${character.originFeat}`,
      description: 'Официальная стартовая черта D&D 2024, дарованная предысторией.',
      source: 'Background',
    },
  ];

  if (character.customMechanic) {
    featuresList.push({
      name: `Особая механика: ${character.customMechanic.title}`,
      description: `${character.customMechanic.trigger}. ${character.customMechanic.effect} (${character.customMechanic.costOrTradeoff}). Эквивалент: ${character.customMechanic.ruleEquivalent}`,
      source: 'Custom Balance Card (D&D 2024 Budget)',
    });
  }

  // Inner data structure
  const innerData = {
    name: { value: character.name },
    race: { value: speciesRu },
    class: { value: classRu },
    background: { value: bgRu },
    alignment: { value: character.alignment || 'Истинно-нейтральный' },
    level: { value: 1 },
    theme: 'default',
    vitality: {
      hp: {
        max: character.hp,
        current: character.currentHp ?? character.hp,
        temp: character.tempHp ?? 0,
      },
      ac: { value: character.ac },
      speed: { value: character.speed || 30 },
      hitDie: {
        total: 1,
        current: 1,
        type: hitDie,
      },
      initiative: {
        value: calculateModifier(character.abilityScores.dexterity),
      },
    },
    stats,
    saves,
    skills,
    coins: {
      gp: character.coins?.gp ?? 15,
      sp: character.coins?.sp ?? 0,
      cp: character.coins?.cp ?? 0,
      ep: 0,
      pp: 0,
    },
    bio: {
      gender: { value: character.gender || '' },
      age: { value: character.appearance?.age || '' },
      appearance: { value: appearanceString },
      backstory: { value: character.backstory || '' },
      personality: {
        value: character.customMechanic
          ? `Уникальная черта «${character.customMechanic.title}»`
          : '',
      },
    },
    notes: [
      {
        title: 'D&D 2024 Hero Weave & Character Key',
        content: `Ключ доступа: ${character.key}\nСотворен в D&D 2024 Character Weave.`,
      },
      ...(character.notes
        ? [
            {
              title: 'Заметки приключения и инвентарь',
              content: character.notes,
            },
          ]
        : []),
    ],
    features: featuresList,
    spells: [],
    avatar: character.portraitUrl || '',
  };

  return {
    jsonType: 'character',
    version: '2',
    edition: '2024',
    sheetEdition: '2024',
    spells: {
      mode: 'cards',
      prepared: [],
      book: [],
      pending: [],
      granted: [],
      slotless: [],
    },
    disabledBlocks: {
      'info-left': [],
      'info-right': [],
      'subinfo-left': [],
      'subinfo-right': [],
      'notes-left': [],
      'notes-right': [],
    },
    data: JSON.stringify(innerData),
  };
}

/**
 * Returns formatted JSON string ready to save as .json file or copy to clipboard.
 */
export function formatLssJson(character: Character): string {
  const doc = exportToLongStoryShort(character);
  return JSON.stringify(doc, null, 2);
}
