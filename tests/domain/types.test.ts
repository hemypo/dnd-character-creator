import { describe, it, expect } from 'vitest';
import { validateCharacter, createInitialCharacter } from '@/types/character';

describe('Character Domain Types', () => {
  it('validates a complete D&D 2024 character structure', () => {
    const character = createInitialCharacter({
      key: 'HERO-1001',
      name: 'Торин',
      species: 'dwarf',
      characterClass: 'fighter',
      background: 'soldier',
    });
    expect(validateCharacter(character)).toBe(true);
    expect(character.hp).toBeGreaterThan(0);
    expect(character.key).toBe('HERO-1001');
  });

  it('rejects invalid or incomplete character objects', () => {
    expect(validateCharacter(null)).toBe(false);
    expect(validateCharacter(undefined)).toBe(false);
    expect(validateCharacter({})).toBe(false);
    expect(
      validateCharacter({
        name: 'Неполный',
        species: 'elf',
        // missing key, characterClass, abilityScores, hp, etc.
      })
    ).toBe(false);
    expect(
      validateCharacter({
        id: 'char-1',
        key: 'HERO-9999',
        name: 'Мертвец',
        species: 'human',
        characterClass: 'wizard',
        background: 'sage',
        abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hp: 0, // Invalid: hp must be > 0 for Level 1
        maxHp: 0,
        ac: 10,
        speed: 30,
        originFeat: 'Magic Initiate',
        createdAt: new Date().toISOString(),
      })
    ).toBe(false);
  });

  it('validates a character with optional fields', () => {
    const character = createInitialCharacter({
      key: 'HERO-2002',
      name: 'Аларик',
      species: 'elf',
      characterClass: 'wizard',
      background: 'sage',
    });

    character.backstory = 'Родился в древнем лесу...';
    character.portraitUrl = 'https://example.com/portrait.png';
    character.customMechanic = {
      id: 'custom-1',
      title: 'Огненный шепот',
      trigger: 'Бонусное действие',
      effect: 'Наносит 1d4 урона огнем',
      costOrTradeoff: 'Заменяет один заговор',
      ruleEquivalent: 'Fire Bolt / Minor Illusion',
    };

    expect(validateCharacter(character)).toBe(true);
    expect(character.customMechanic.title).toBe('Огненный шепот');
  });
});
