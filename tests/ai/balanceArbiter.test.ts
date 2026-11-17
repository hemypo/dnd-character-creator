import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateBalanceCards } from '@/lib/ai/balanceArbiter';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';
import { POST } from '@/app/api/generate-mechanic/route';
import { BalanceCard } from '@/types/balance';

describe('Balance Card Arbiter (Safe Custom Mechanics)', () => {
  const sampleCharacter = buildBaseChassis({
    roleId: 'tank',
    powerSourceId: 'martial',
    speciesId: 'dwarf',
    characterName: 'Торин Камнеборец',
  });

  it('generates 2-3 balanced cards in mock mode matching 2024 origin feat budgets', async () => {
    const cards = await generateBalanceCards('Хочу плевать кислотой когда получаю урон', sampleCharacter);

    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.length).toBeLessThanOrEqual(3);

    for (const card of cards) {
      expect(card.id).toBeTruthy();
      expect(card.title).toBeTruthy();
      expect(card.trigger).toBeTruthy();
      expect(card.effect).toBeTruthy();
      expect(card.costOrTradeoff).toBeTruthy();
      expect(card.ruleEquivalent).toBeTruthy();

      // D&D 2024 boundaries: must have standard action economy or rest cooldown
      expect(card.trigger).toMatch(/действие|бонусное|реакция|атака|урон|попадание|action|bonus|reaction/i);
      expect(card.costOrTradeoff).toMatch(/1 раз|отдых|заговор|черт|бонусное действие|ячейк|rest|origin feat|cantrip/i);
    }
  });

  it('bounds an overpowered adversarial prompt into a legal D&D 2024 mechanic', async () => {
    const shadowRogue = buildBaseChassis({
      roleId: 'striker',
      powerSourceId: 'shadow',
      speciesId: 'tiefling',
    });

    const adversarialPrompt = 'Убивать всех врагов с 1 удара 9999 урона и бессмертие';
    const cards = await generateBalanceCards(adversarialPrompt, shadowRogue);

    expect(cards.length).toBeGreaterThanOrEqual(2);

    for (const card of cards) {
      // Must NOT allow 9999 damage or flat godmode
      expect(card.effect).not.toContain('9999');
      expect(card.effect).not.toMatch(/бессмерт/i);

      // Must be bound by rest cooldown, saving throws, or dice limit
      expect(card.costOrTradeoff).toMatch(/1 раз|долгий отдых|короткий отдых|вместо черты|черта происхождения/i);
      expect(card.effect).toMatch(/1d|2d|кост|критическ|преимуществ|урон|спасбросок/i);
    }
  });

  it('handles empty or blank prompt gracefully with default thematic options', async () => {
    const wizard = buildBaseChassis({
      roleId: 'blaster',
      powerSourceId: 'arcane',
      speciesId: 'elf',
    });

    const cardsBlank = await generateBalanceCards('', wizard);
    expect(cardsBlank.length).toBeGreaterThanOrEqual(2);
    expect(cardsBlank[0].title).toBeTruthy();

    const cardsWhitespace = await generateBalanceCards('    ', wizard);
    expect(cardsWhitespace.length).toBeGreaterThanOrEqual(2);
    expect(cardsWhitespace[0].title).toBeTruthy();
  });

  it('matches thematic keywords like fire, frost, shield, shadow', async () => {
    const fireCards = await generateBalanceCards('Огненное дыхание и пламя', sampleCharacter);
    expect(fireCards.some((c) => /плам|огон|жар|fire/i.test(c.title + c.effect))).toBe(true);

    const shieldCards = await generateBalanceCards('Магический щит и несокрушимая защита', sampleCharacter);
    expect(shieldCards.some((c) => /щит|защит|брон|укрыт|shield/i.test(c.title + c.effect))).toBe(true);
  });

  describe('Gemini API Integration & Fallback', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('parses valid structured JSON from Gemini API when apiKey is provided', async () => {
      const mockApiCards: BalanceCard[] = [
        {
          id: 'card-ai-1',
          title: 'Огненный контрудар',
          trigger: 'Реакция при получении урона в ближнем бою',
          effect: 'Атакующий получает 1d6 урона огнем',
          costOrTradeoff: '1 раз за короткий или долгий отдых, заменяет черту происхождения',
          ruleEquivalent: 'Hellish Rebuke (1/Rest)',
        },
        {
          id: 'card-ai-2',
          title: 'Пепельный след',
          trigger: 'Бонусное действие при перемещении',
          effect: 'Создает полосу дыма (слабое затемнение) до конца хода',
          costOrTradeoff: 'Заменяет один заговор происхождения',
          ruleEquivalent: 'Minor Illusion / Fog Cloud',
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify(mockApiCards),
                  },
                ],
              },
            },
          ],
        }),
      } as unknown as Response);

      const cards = await generateBalanceCards('Хочу огненный контрудар', sampleCharacter, {
        apiKey: 'test-api-key',
      });

      expect(cards.length).toBe(2);
      expect(cards[0].title).toBe('Огненный контрудар');
      expect(cards[0].ruleEquivalent).toBe('Hellish Rebuke (1/Rest)');
    });

    it('falls back seamlessly to local mock generator if API call throws an error or returns invalid JSON', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const cards = await generateBalanceCards('Хочу плевать кислотой', sampleCharacter, {
        apiKey: 'bad-key',
      });

      expect(cards.length).toBeGreaterThanOrEqual(2);
      expect(cards[0].title).toBeTruthy();
      expect(cards[0].effect).toBeTruthy();
    });
  });

  describe('POST /api/generate-mechanic Route Handler', () => {
    it('returns 200 with generated cards for valid request payload', async () => {
      const req = new Request('http://localhost:3000/api/generate-mechanic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flavorText: 'Метание ядовитых шипов',
          character: sampleCharacter,
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.cards).toBeDefined();
      expect(Array.isArray(json.cards)).toBe(true);
      expect(json.cards.length).toBeGreaterThanOrEqual(2);
    });

    it('returns 400 when body is invalid or missing required flavorText', async () => {
      const reqEmpty = new Request('http://localhost:3000/api/generate-mechanic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const responseEmpty = await POST(reqEmpty);
      expect(responseEmpty.status).toBe(400);

      const reqInvalid = new Request('http://localhost:3000/api/generate-mechanic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      });

      const responseInvalid = await POST(reqInvalid);
      expect(responseInvalid.status).toBe(400);
    });
  });
});
