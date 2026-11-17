import { describe, it, expect } from 'vitest';
import { exportToLongStoryShort, formatLssJson } from '@/lib/lss/lssExporter';
import { Character } from '@/types/character';

const sampleCharacter: Character = {
  id: 'char-test-1',
  key: 'HERO-9911',
  name: 'Лира Лунный Свет',
  species: 'elf',
  characterClass: 'cleric',
  background: 'acolyte',
  abilityScores: {
    strength: 10,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 16,
    charisma: 12,
  },
  hp: 10,
  maxHp: 10,
  currentHp: 8,
  tempHp: 3,
  ac: 16,
  speed: 30,
  originFeat: 'Magic Initiate (Cleric)',
  alignment: 'Хаотично-добрый',
  gender: 'Женский',
  appearance: {
    age: '120 лет',
    build: 'Гибкое, изящное',
    hairAndEyes: 'Серебристые волосы, фиалковые глаза',
    distinguishingFeatures: 'Татуировка полумесяца на запястье',
  },
  customMechanic: {
    id: 'mech-lira',
    title: 'Благословение Селунэ',
    trigger: 'Когда союзник в пределах 30 футов получает урон',
    effect: 'Вы восстанавливаете ему 1d4+3 хитов сияющим светом',
    costOrTradeoff: '1 раз за долгий отдых',
    ruleEquivalent: 'Эквивалентно черте целителя',
  },
  backstory: 'Лира служила в храме Лунной Девы с юных лет...',
  portraitUrl: 'https://storage.googleapis.com/test-portrait.png',
  coins: { gp: 25, sp: 10, cp: 5 },
  notes: 'Священный символ из серебра.',
  createdAt: '2026-11-17T00:00:00.000Z',
};

describe('Long Story Short Exporter (longstoryshort.app format)', () => {
  it('generates a valid Long Story Short document envelope', () => {
    const doc = exportToLongStoryShort(sampleCharacter);

    expect(doc.jsonType).toBe('character');
    expect(doc.version).toBe('2');
    expect(doc.edition).toBe('2024');
    expect(doc.sheetEdition).toBe('2024');
    expect(doc.spells).toBeDefined();
    expect(doc.spells.mode).toBe('cards');
    expect(Array.isArray(doc.spells.prepared)).toBe(true);
    expect(doc.disabledBlocks).toBeDefined();
    expect(typeof doc.data).toBe('string');
  });

  it('serializes inner data complying with Long Story Short 2024 schema', () => {
    const doc = exportToLongStoryShort(sampleCharacter);
    const data = JSON.parse(doc.data);

    // Hero identity
    expect(data.name.value).toBe('Лира Лунный Свет');
    expect(data.race.value).toBe('Эльф');
    expect(data.class.value).toBe('Жрец');
    expect(data.background.value).toBe('Прислужник');
    expect(data.alignment.value).toBe('Хаотично-добрый');
    expect(data.level.value).toBe(1);

    // Vitality
    expect(data.vitality.hp.max).toBe(10);
    expect(data.vitality.hp.current).toBe(8);
    expect(data.vitality.hp.temp).toBe(3);
    expect(data.vitality.ac.value).toBe(16);
    expect(data.vitality.speed.value).toBe(30);
    expect(data.vitality.hitDie.total).toBe(1);
    expect(data.vitality.hitDie.type).toBe('d8'); // Cleric d8
    expect(data.vitality.initiative.value).toBe(2); // DEX 14 = +2

    // Ability scores
    expect(data.stats.str.score).toBe(10);
    expect(data.stats.dex.score).toBe(14);
    expect(data.stats.con.score).toBe(14);
    expect(data.stats.int.score).toBe(10);
    expect(data.stats.wis.score).toBe(16);
    expect(data.stats.cha.score).toBe(12);

    // Saving throws (Cleric: WIS, CHA)
    expect(data.saves.wis.proficient).toBe(true);
    expect(data.saves.cha.proficient).toBe(true);
    expect(data.saves.str.proficient).toBe(false);

    // Coins
    expect(data.coins.gp).toBe(25);
    expect(data.coins.sp).toBe(10);
    expect(data.coins.cp).toBe(5);

    // Bio with gender and appearance customization
    expect(data.bio.gender.value).toBe('Женский');
    expect(data.bio.age.value).toBe('120 лет');
    expect(data.bio.appearance.value).toContain('Пол: Женский');
    expect(data.bio.appearance.value).toContain('Возраст: 120 лет');
    expect(data.bio.appearance.value).toContain('Телосложение: Гибкое, изящное');
    expect(data.bio.appearance.value).toContain('Волосы и глаза: Серебристые волосы, фиалковые глаза');
    expect(data.bio.appearance.value).toContain('Особые приметы: Татуировка полумесяца на запястье');
    expect(data.bio.backstory.value).toBe(sampleCharacter.backstory);

    // Features
    expect(data.features.length).toBeGreaterThanOrEqual(2);
    expect(data.features.some((f: any) => f.name.includes('Magic Initiate'))).toBe(true);
    expect(data.features.some((f: any) => f.name.includes('Благословение Селунэ'))).toBe(true);

    // Notes
    expect(data.notes.some((n: any) => n.content.includes('HERO-9911'))).toBe(true);
    expect(data.notes.some((n: any) => n.content.includes('Священный символ из серебра.'))).toBe(true);

    // Avatar
    expect(data.avatar).toBe('https://storage.googleapis.com/test-portrait.png');
  });

  it('formatLssJson returns clean, indented JSON string', () => {
    const formatted = formatLssJson(sampleCharacter);
    expect(typeof formatted).toBe('string');
    const parsed = JSON.parse(formatted);
    expect(parsed.jsonType).toBe('character');
    expect(parsed.edition).toBe('2024');
  });
});
