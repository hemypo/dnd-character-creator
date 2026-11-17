import { describe, it, expect, beforeEach } from 'vitest';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';
import { generateBalanceCards } from '@/lib/ai/balanceArbiter';
import { generateBackstory } from '@/lib/ai/backstoryGenerator';
import { generatePortrait } from '@/lib/ai/portraitPipeline';
import {
  saveCharacterRecord,
  getCharacterRecord,
  resetCharacterStore,
} from '@/lib/storage/characterStore';
import { exportToLongStoryShort } from '@/lib/lss/lssExporter';
import { Character } from '@/types/character';

describe('End-to-End Hero Lifecycle & Smoke Test', () => {
  beforeEach(async () => {
    await resetCharacterStore();
  });

  it('completes the entire end-to-end character journey seamlessly', async () => {
    // 1. Rules Engine: Build base chassis
    const selection = {
      roleId: 'tank',
      powerSourceId: 'martial',
      speciesId: 'dwarf',
      characterName: 'Брунгор',
    };
    const chassis = buildBaseChassis(selection);

    expect(chassis.name).toBe('Брунгор');
    expect(chassis.species).toBe('dwarf');
    expect(chassis.characterClass).toBe('fighter');
    expect(chassis.hp).toBeGreaterThanOrEqual(10);
    expect(chassis.maxHp).toBeGreaterThanOrEqual(10);
    expect(chassis.ac).toBeGreaterThanOrEqual(10);
    expect(chassis.speed).toBe(30);
    expect(chassis.originFeat).toBeDefined();

    // 2. Balance Arbiter: Evaluate custom mechanic
    const flavorText = 'Удар щитом сбивает с ног и оглушает';
    const balanceCards = await generateBalanceCards(flavorText, chassis);

    expect(Array.isArray(balanceCards)).toBe(true);
    expect(balanceCards.length).toBeGreaterThanOrEqual(2);

    const chosenCard = balanceCards[0];
    expect(chosenCard.id).toBeDefined();
    expect(chosenCard.title).toBeDefined();
    expect(chosenCard.trigger).toBeDefined();
    expect(chosenCard.effect).toBeDefined();
    expect(chosenCard.costOrTradeoff).toBeDefined();
    expect(chosenCard.ruleEquivalent).toBeDefined();

    // 3. Narrative Backstory: Generate Russian lore
    const characterWithMechanic = {
      ...chassis,
      customMechanic: chosenCard,
    };
    const backstory = await generateBackstory(characterWithMechanic);

    expect(typeof backstory).toBe('string');
    expect(backstory.length).toBeGreaterThanOrEqual(100);
    expect(backstory).toContain('Брунгор');

    // 4. Portrait Pipeline: Generate portrait with preset/fallback
    const portraitResult = await generatePortrait({
      character: { ...characterWithMechanic, backstory },
    });

    expect(portraitResult.portraitUrl).toBeDefined();
    expect(typeof portraitResult.portraitUrl).toBe('string');
    expect(portraitResult.portraitUrl.length).toBeGreaterThan(50);

    // 5. Key Storage: Save to characterStore and verify generated key matches HERO-[A-Z0-9]{4}
    const fullCharacter: Character = {
      ...characterWithMechanic,
      key: '', // let store generate a fresh HERO-XXXX key
      backstory,
      portraitUrl: portraitResult.portraitUrl,
    };

    const saveResult = await saveCharacterRecord(fullCharacter);
    expect(saveResult.key).toMatch(/^HERO-[A-Z0-9]{4}$/);

    // 6. Store Retrieval: Load character by key and verify complete property preservation
    const loadedChar = await getCharacterRecord(saveResult.key);
    expect(loadedChar).not.toBeNull();
    expect(loadedChar!.name).toBe('Брунгор');
    expect(loadedChar!.species).toBe('dwarf');
    expect(loadedChar!.characterClass).toBe('fighter');
    expect(loadedChar!.hp).toBe(fullCharacter.hp);
    expect(loadedChar!.maxHp).toBe(fullCharacter.maxHp);
    expect(loadedChar!.ac).toBe(fullCharacter.ac);
    expect(loadedChar!.abilityScores).toEqual(fullCharacter.abilityScores);
    expect(loadedChar!.customMechanic?.title).toBe(chosenCard.title);
    expect(loadedChar!.customMechanic?.effect).toBe(chosenCard.effect);
    expect(loadedChar!.backstory).toBe(backstory);
    expect(loadedChar!.portraitUrl).toBe(portraitResult.portraitUrl);

    // 7. Long Story Short Export: Export character to JSON document
    const lssDoc = exportToLongStoryShort(loadedChar!);

    expect(lssDoc.jsonType).toBe('character');
    expect(lssDoc.edition).toBe('2024');
    expect(lssDoc.version).toBe('2');

    const parsedData = JSON.parse(lssDoc.data);
    expect(parsedData.name.value).toBe('Брунгор');
    expect(parsedData.race.value).toBe('Дварф');
    expect(parsedData.class.value).toBe('Воин');
    expect(parsedData.vitality.hp.max).toBe(fullCharacter.maxHp);
  });
});
