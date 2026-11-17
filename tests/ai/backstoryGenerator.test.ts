import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateBackstory } from '@/lib/ai/backstoryGenerator';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';
import { POST } from '@/app/api/generate-backstory/route';

describe('Narrative Backstory Generator', () => {
  const sampleCharacter = buildBaseChassis({
    roleId: 'tank',
    powerSourceId: 'martial',
    speciesId: 'dwarf',
    characterName: 'Брунор Камнеборец',
  });

  it('generates an evocative 2-3 paragraph Russian backstory incorporating race, class, and background', async () => {
    const backstory = await generateBackstory(sampleCharacter);

    expect(typeof backstory).toBe('string');
    expect(backstory.length).toBeGreaterThanOrEqual(150);

    // Multi-paragraph structure
    const paragraphs = backstory.split(/\n+/).filter((p) => p.trim().length > 0);
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);

    // Russian language check
    expect(backstory).toMatch(/[А-Яа-яЁё]{10,}/);

    // Lore relevance: mentions species or class or background
    const lower = backstory.toLowerCase();
    const hasThematicKeywords =
      lower.includes('дворф') ||
      lower.includes('воин') ||
      lower.includes('солдат') ||
      lower.includes('брунор') ||
      lower.includes('горы') ||
      lower.includes('кузн');
    expect(hasThematicKeywords).toBe(true);
  });

  it('seamlessly weaves custom mechanic into the backstory when present', async () => {
    const customChar = {
      ...sampleCharacter,
      customMechanic: {
        id: 'mech-1',
        title: 'Кислотный плевок',
        trigger: 'Бонусное действие',
        effect: 'Плюет едкой жижей на 1d6 кислоты',
        costOrTradeoff: '1 раз за короткий отдых',
        ruleEquivalent: 'Acid Splash / Dragonborn Breath',
      },
    };

    const backstory = await generateBackstory(customChar);
    expect(backstory.toLowerCase()).toMatch(/кислот|едк|жиж|плевок/i);
  });

  it('handles characters with minimal fields without crashing', async () => {
    const minimalChar = {
      name: 'Незнакомец',
      species: 'elf',
      characterClass: 'wizard',
      background: 'sage',
    };

    const backstory = await generateBackstory(minimalChar as unknown as any);
    expect(backstory.length).toBeGreaterThanOrEqual(100);
    expect(backstory).toMatch(/[А-Яа-яЁё]/);
  });

  describe('Gemini API Integration & Fallback', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('uses AI response when Gemini API succeeds', async () => {
      const mockAiText =
        'Среди заснеженных пиков северных хребтов родился дворф по имени Брунор.\n\nПройдя через горнило суровых битв в качестве солдата клана, он обрел несокрушимую стойкость и отправился в странствие, чтобы защитить свой народ от древнего зла.';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: mockAiText,
                  },
                ],
              },
            },
          ],
        }),
      } as unknown as Response);

      const backstory = await generateBackstory(sampleCharacter, { apiKey: 'test-key' });
      expect(backstory).toBe(mockAiText);
    });

    it('gracefully falls back to atmospheric Russian template when Gemini API fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Quota exceeded'));

      const backstory = await generateBackstory(sampleCharacter, { apiKey: 'failing-key' });
      expect(typeof backstory).toBe('string');
      expect(backstory.length).toBeGreaterThanOrEqual(150);
      expect(backstory).toMatch(/[А-Яа-яЁё]/);
    });
  });

  describe('POST /api/generate-backstory Route Handler', () => {
    it('returns 200 with generated backstory for valid character payload', async () => {
      const req = new Request('http://localhost:3000/api/generate-backstory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: sampleCharacter }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.backstory).toBeDefined();
      expect(typeof json.backstory).toBe('string');
      expect(json.backstory.length).toBeGreaterThanOrEqual(100);
    });

    it('returns 400 when body or character is missing or invalid', async () => {
      const reqEmpty = new Request('http://localhost:3000/api/generate-backstory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const responseEmpty = await POST(reqEmpty);
      expect(responseEmpty.status).toBe(400);

      const reqMalformed = new Request('http://localhost:3000/api/generate-backstory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'bad-json-string',
      });

      const responseMalformed = await POST(reqMalformed);
      expect(responseMalformed.status).toBe(400);
    });
  });
});
