import { describe, it, expect } from 'vitest';
import { validateCharacter } from '@/types/character';
import {
  ARCHETYPE_ROLES,
  ARCHETYPE_POWER_SOURCES,
  ARCHETYPE_SPECIES,
} from '@/lib/dnd2024/archetypes';
import {
  buildBaseChassis,
  calculateModifier,
  getWeaponMasteries,
  getStartingEquipment,
} from '@/lib/dnd2024/rulesEngine';

describe('D&D 2024 Rules Engine & Archetypes', () => {
  describe('Archetype Metadata', () => {
    it('provides Russian beginner-friendly labels and descriptions for roles', () => {
      expect(ARCHETYPE_ROLES.length).toBeGreaterThanOrEqual(4);
      const roleIds = ARCHETYPE_ROLES.map((r) => r.id);
      expect(roleIds).toContain('tank');
      expect(roleIds).toContain('striker');
      expect(roleIds).toContain('blaster');
      expect(roleIds).toContain('support');

      for (const role of ARCHETYPE_ROLES) {
        expect(role.name).toMatch(/[А-Яа-яЁё]/);
        expect(role.description).toMatch(/[А-Яа-яЁё]/);
        expect(role.icon).toBeDefined();
      }
    });

    it('provides Russian beginner-friendly labels and descriptions for power sources', () => {
      expect(ARCHETYPE_POWER_SOURCES.length).toBeGreaterThanOrEqual(4);
      const sourceIds = ARCHETYPE_POWER_SOURCES.map((s) => s.id);
      expect(sourceIds).toContain('martial');
      expect(sourceIds).toContain('arcane');
      expect(sourceIds).toContain('divine');
      expect(sourceIds).toContain('shadow');

      for (const source of ARCHETYPE_POWER_SOURCES) {
        expect(source.name).toMatch(/[А-Яа-яЁё]/);
        expect(source.description).toMatch(/[А-Яа-яЁё]/);
      }
    });

    it('provides Russian beginner-friendly labels and descriptions for species', () => {
      expect(ARCHETYPE_SPECIES.length).toBeGreaterThanOrEqual(6);
      const speciesIds = ARCHETYPE_SPECIES.map((s) => s.id);
      expect(speciesIds).toContain('human');
      expect(speciesIds).toContain('elf');
      expect(speciesIds).toContain('dwarf');
      expect(speciesIds).toContain('tiefling');
      expect(speciesIds).toContain('halfling');
      expect(speciesIds).toContain('dragonborn');

      for (const sp of ARCHETYPE_SPECIES) {
        expect(sp.name).toMatch(/[А-Яа-яЁё]/);
        expect(sp.description).toMatch(/[А-Яа-яЁё]/);
      }
    });
  });

  describe('buildBaseChassis', () => {
    it('creates a Level 1 Fighter for Tank + Martial + Human (Soldier, Savage Attacker, HP 12, AC >= 16)', () => {
      const chassis = buildBaseChassis({
        roleId: 'tank',
        powerSourceId: 'martial',
        speciesId: 'human',
        characterName: 'Брунор Железный',
      });

      expect(validateCharacter(chassis)).toBe(true);
      expect(chassis.name).toBe('Брунор Железный');
      expect(chassis.characterClass).toBe('fighter');
      expect(chassis.species).toBe('human');
      expect(chassis.background).toBe('soldier');
      expect(chassis.originFeat).toBe('Savage Attacker');
      expect(chassis.abilityScores.strength).toBeGreaterThanOrEqual(16);
      expect(chassis.abilityScores.constitution).toBeGreaterThanOrEqual(14);
      expect(chassis.hp).toBe(12); // 10 hit die + 2 Con mod
      expect(chassis.ac).toBeGreaterThanOrEqual(16);
      expect(chassis.speed).toBe(30);
      expect(chassis.key).toMatch(/^HERO-\d+$/);

      // Weapon masteries
      const masteries = getWeaponMasteries(chassis.characterClass);
      expect(masteries.length).toBe(3);
    });

    it('creates a Level 1 Wizard for Blaster + Arcane + Elf (Sage, Magic Initiate, Int >= 16)', () => {
      const chassis = buildBaseChassis({
        roleId: 'blaster',
        powerSourceId: 'arcane',
        speciesId: 'elf',
      });

      expect(validateCharacter(chassis)).toBe(true);
      expect(chassis.characterClass).toBe('wizard');
      expect(chassis.species).toBe('elf');
      expect(chassis.background).toBe('sage');
      expect(chassis.originFeat).toBe('Magic Initiate');
      expect(chassis.abilityScores.intelligence).toBeGreaterThanOrEqual(16);
      expect(chassis.hp).toBe(8); // 6 hit die + 2 Con mod
      expect(chassis.ac).toBe(12); // 10 + 2 Dex mod
      expect(chassis.speed).toBe(30);
    });

    it('creates a Level 1 Rogue for Striker + Shadow + Tiefling (Criminal, Alert, Dex >= 16)', () => {
      const chassis = buildBaseChassis({
        roleId: 'striker',
        powerSourceId: 'shadow',
        speciesId: 'tiefling',
      });

      expect(validateCharacter(chassis)).toBe(true);
      expect(chassis.characterClass).toBe('rogue');
      expect(chassis.species).toBe('tiefling');
      expect(chassis.background).toBe('criminal');
      expect(chassis.originFeat).toBe('Alert');
      expect(chassis.abilityScores.dexterity).toBeGreaterThanOrEqual(16);
      expect(chassis.hp).toBe(10); // 8 hit die + 2 Con mod
      expect(chassis.ac).toBe(14); // Leather 11 + 3 Dex mod
      expect(chassis.speed).toBe(30);

      const masteries = getWeaponMasteries(chassis.characterClass);
      expect(masteries.length).toBe(2);
    });

    it('creates a Level 1 Cleric for Support + Divine + Dwarf (Acolyte, Wis >= 16, AC 18)', () => {
      const chassis = buildBaseChassis({
        roleId: 'support',
        powerSourceId: 'divine',
        speciesId: 'dwarf',
      });

      expect(validateCharacter(chassis)).toBe(true);
      expect(chassis.characterClass).toBe('cleric');
      expect(chassis.species).toBe('dwarf');
      expect(chassis.background).toBe('acolyte');
      expect(chassis.originFeat).toBe('Healer');
      expect(chassis.abilityScores.wisdom).toBeGreaterThanOrEqual(16);
      expect(chassis.hp).toBe(10); // 8 hit die + 2 Con mod
      expect(chassis.ac).toBe(18); // Scale Mail 14 + 2 Dex + 2 Shield
      expect(chassis.speed).toBe(30);
    });

    it('handles fallback gracefully when unrecognized archetype is provided', () => {
      const chassis = buildBaseChassis({
        roleId: 'custom-role',
        powerSourceId: 'custom-power',
        speciesId: 'custom-species',
      });

      expect(validateCharacter(chassis)).toBe(true);
      expect(chassis.characterClass).toBeDefined();
      expect(chassis.hp).toBeGreaterThan(0);
      expect(chassis.ac).toBeGreaterThan(0);
    });
  });

  describe('D&D 2024 Helpers', () => {
    it('calculates ability score modifiers accurately', () => {
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(12)).toBe(1);
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(15)).toBe(2);
      expect(calculateModifier(16)).toBe(3);
      expect(calculateModifier(17)).toBe(3);
      expect(calculateModifier(18)).toBe(4);
    });

    it('provides class starting equipment', () => {
      const fighterGear = getStartingEquipment('fighter');
      expect(fighterGear.length).toBeGreaterThan(0);
      expect(fighterGear.some((g) => g.includes('Кольчуга') || g.includes('Chain Mail'))).toBe(true);

      const wizardGear = getStartingEquipment('wizard');
      expect(wizardGear.some((g) => g.includes('Книга заклинаний') || g.includes('Spellbook'))).toBe(true);
    });
  });
});
