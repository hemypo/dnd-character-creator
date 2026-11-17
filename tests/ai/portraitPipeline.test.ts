import { describe, it, expect, vi } from 'vitest';
import {
  buildPortraitPrompt,
  generatePortrait,
  getPresetAvatars,
  GeneratePortraitOptions,
} from '@/lib/ai/portraitPipeline';
import { POST } from '@/app/api/generate-portrait/route';
import { Character } from '@/types/character';

describe('Portrait Generation Pipeline', () => {
  const baseDwarfFighter: Partial<Character> = {
    name: 'Брунор Камнеборец',
    species: 'dwarf',
    characterClass: 'fighter',
    background: 'soldier',
    originFeat: 'Savage Attacker',
  };

  const baseElfWizard: Partial<Character> = {
    name: 'Эладриэль Звездный',
    species: 'elf',
    characterClass: 'wizard',
    background: 'sage',
  };

  const baseTieflingRogueWithQuirk: Partial<Character> = {
    name: 'Маликор Тень',
    species: 'tiefling',
    characterClass: 'rogue',
    background: 'criminal',
    customMechanic: {
      id: 'mech-shadow',
      title: 'Теневая вуаль',
      trigger: 'Бонусное действие',
      effect: 'Окутывает фигуру клубящимся черным дымом и фиолетовыми искрами',
      costOrTradeoff: '1 раз за бой',
      ruleEquivalent: 'Minor Illusion / Darkness',
    },
  };

  // Valid small 1x1 transparent PNG base64 for testing
  const validSmallBase64Png =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  describe('buildPortraitPrompt', () => {
    it('generates prompt with species traits and class armor/gear for dwarf fighter', () => {
      const prompt = buildPortraitPrompt(baseDwarfFighter, false);

      expect(typeof prompt).toBe('string');
      const lower = prompt.toLowerCase();

      // Species traits
      expect(lower).toMatch(/dwarf|дворф/i);

      // Class armor / gear
      expect(lower).toMatch(/armor|chain mail|plate|shield|weapon|сталь|доспех/i);

      // Likeness instruction absent when hasPhoto is false
      expect(lower).not.toMatch(/facial likeness from photo|subject in the photo/i);
    });

    it('generates prompt with species traits and class robes for elf wizard', () => {
      const prompt = buildPortraitPrompt(baseElfWizard, false);
      const lower = prompt.toLowerCase();

      // Species traits
      expect(lower).toMatch(/elf|эльф/i);

      // Class gear: robes / arcane focus
      expect(lower).toMatch(/robe|robes|arcane|mantle|мантия|одеяния/i);
    });

    it('synthesizes custom mechanic visual elements when present', () => {
      const prompt = buildPortraitPrompt(baseTieflingRogueWithQuirk, false);
      const lower = prompt.toLowerCase();

      // Species and class
      expect(lower).toMatch(/tiefling|тифлинг/i);
      expect(lower).toMatch(/leather|rogue|плут|кожан/i);

      // Custom mechanic details
      expect(lower).toMatch(/теневая вуаль|дым|искр|smoke|spark|shadow/i);
    });

    it('includes facial likeness instructions when hasPhoto is true', () => {
      const promptWithPhoto = buildPortraitPrompt(baseDwarfFighter, true);
      const lower = promptWithPhoto.toLowerCase();

      // Facial likeness preservation instructions
      expect(lower).toMatch(/photo|likeness|facial|face|черты лица|портрет/i);
      expect(lower).toMatch(/dwarf|fighter/i);
    });
  });

  describe('generatePortrait in mock/offline mode', () => {
    it('returns a valid data URI SVG portrait for character without photo', async () => {
      const result = await generatePortrait({ character: baseDwarfFighter });

      expect(result).toHaveProperty('portraitUrl');
      expect(typeof result.portraitUrl).toBe('string');

      // Valid SVG Data URI
      expect(result.portraitUrl).toMatch(/^data:image\/svg\+xml;base64,/);

      // Decode and check content
      const base64Content = result.portraitUrl.replace('data:image/svg+xml;base64,', '');
      const decodedSvg = Buffer.from(base64Content, 'base64').toString('utf-8');

      expect(decodedSvg).toContain('<svg');
      expect(decodedSvg).toContain('</svg>');
      // Mentions character name or class or species
      expect(decodedSvg.toLowerCase()).toMatch(/брунор|камнеборец|dwarf|fighter/i);
    });

    it('handles base64 image input cleanly when selfie photo is provided', async () => {
      const result = await generatePortrait({
        character: baseElfWizard,
        photoBase64: validSmallBase64Png,
      });

      expect(result).toHaveProperty('portraitUrl');
      expect(typeof result.portraitUrl).toBe('string');
      expect(result.portraitUrl).toMatch(/^data:image\/svg\+xml;base64,/);

      const base64Content = result.portraitUrl.replace('data:image/svg+xml;base64,', '');
      const decodedSvg = Buffer.from(base64Content, 'base64').toString('utf-8');

      expect(decodedSvg).toContain('<svg');
      // Contains reference or overlay element indicating photo processing
      expect(decodedSvg.toLowerCase()).toMatch(/elf|wizard|эладриэль/i);
    });

    it('embeds custom mechanic visual emblem when customMechanic is present', async () => {
      const result = await generatePortrait({ character: baseTieflingRogueWithQuirk });

      const base64Content = result.portraitUrl.replace('data:image/svg+xml;base64,', '');
      const decodedSvg = Buffer.from(base64Content, 'base64').toString('utf-8');

      expect(decodedSvg).toMatch(/теневая вуаль|вуаль|дым|spark|tiefling/i);
    });

    it('rejects oversized photos (> 5MB) with a clear error', async () => {
      // Create a base64 string that decodes to > 5MB (5 * 1024 * 1024 + 100 bytes)
      const oversizedRaw = Buffer.alloc(5 * 1024 * 1024 + 1024, 'a').toString('base64');
      const oversizedPhoto = `data:image/png;base64,${oversizedRaw}`;

      await expect(
        generatePortrait({
          character: baseDwarfFighter,
          photoBase64: oversizedPhoto,
        })
      ).rejects.toThrow(/5MB|size exceeds|oversized/i);
    });

    it('rejects corrupted base64 photo input with clear error', async () => {
      const corruptedPhoto = 'data:image/png;base64,this-is-not-valid-base64!@#$%^&*()';

      await expect(
        generatePortrait({
          character: baseDwarfFighter,
          photoBase64: corruptedPhoto,
        })
      ).rejects.toThrow(/invalid|corrupt/i);
    });
  });

  describe('getPresetAvatars', () => {
    it('returns at least 3 curated avatar options matching species and class', () => {
      const presets = getPresetAvatars('dwarf', 'fighter');

      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThanOrEqual(3);

      for (const preset of presets) {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('url');
        expect(typeof preset.id).toBe('string');
        expect(typeof preset.name).toBe('string');
        expect(typeof preset.url).toBe('string');
        expect(preset.url.length).toBeGreaterThan(0);
      }
    });

    it('returns at least 3 curated avatar options for elf wizard', () => {
      const presets = getPresetAvatars('elf', 'wizard');

      expect(presets.length).toBeGreaterThanOrEqual(3);
      expect(presets[0].species.toLowerCase()).toContain('elf');
    });

    it('returns at least 3 default options when called with empty or undefined arguments', () => {
      const presets = getPresetAvatars();

      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Route handler POST /api/generate-portrait', () => {
    it('returns 200 with portraitUrl on valid request', async () => {
      const request = new Request('http://localhost:3000/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: baseDwarfFighter }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty('portraitUrl');
      expect(typeof json.portraitUrl).toBe('string');
      expect(json.portraitUrl.length).toBeGreaterThan(0);
    });

    it('returns 200 with portraitUrl when selfie photoBase64 is provided', async () => {
      const request = new Request('http://localhost:3000/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: baseElfWizard,
          photoBase64: validSmallBase64Png,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty('portraitUrl');
    });

    it('returns 400 when request body has invalid JSON', async () => {
      const request = new Request('http://localhost:3000/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-not-json',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toHaveProperty('error');
    });

    it('returns 400 when character property is missing', async () => {
      const request = new Request('http://localhost:3000/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toMatch(/character/i);
    });

    it('returns 400 when photo exceeds 5MB limit', async () => {
      const oversizedRaw = Buffer.alloc(5 * 1024 * 1024 + 1024, 'a').toString('base64');
      const oversizedPhoto = `data:image/png;base64,${oversizedRaw}`;

      const request = new Request('http://localhost:3000/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: baseDwarfFighter,
          photoBase64: oversizedPhoto,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toMatch(/5MB|size exceeds|oversized/i);
    });

    it('returns 400 when photo is corrupted base64', async () => {
      const request = new Request('http://localhost:3000/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: baseDwarfFighter,
          photoBase64: 'data:image/png;base64,corrupted#@$!',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toMatch(/invalid|corrupt/i);
    });
  });

  describe('SubNP Free Image API Integration', () => {
    it('parses SubNP SSE stream events and returns generated image URL', async () => {
      const { callSubnpImageApi } = await import('@/lib/ai/portraitPipeline');

      const mockSseStream = 'data: {"status":"processing","message":"Starting..."}\n\ndata: {"status":"complete","imageUrl":"https://subnp.com/api/image/test-123","model":"flux"}\n\n';
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(mockSseStream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        })
      );

      const url = await callSubnpImageApi('fantasy dwarf warrior', 'flux', mockFetch as unknown as typeof fetch);
      expect(url).toBe('https://subnp.com/api/image/test-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://subnp.com/api/free/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ prompt: 'fantasy dwarf warrior', model: 'flux' }),
        })
      );
    });

    it('returns null and falls back when SubNP returns an error event', async () => {
      const { callSubnpImageApi } = await import('@/lib/ai/portraitPipeline');

      const mockSseStream = 'data: {"status":"error","message":"Image generation failed"}\n\n';
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(mockSseStream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        })
      );

      const url = await callSubnpImageApi('fantasy dwarf warrior', 'flux', mockFetch as unknown as typeof fetch);
      expect(url).toBeNull();
    });

    it('generatePortrait seamlessly uses SubNP free API when available', async () => {
      const mockSseStream = 'data: {"status":"complete","imageUrl":"https://subnp.com/api/image/free-hero-999"}\n\n';
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(mockSseStream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        })
      );

      const result = await generatePortrait({
        character: baseDwarfFighter,
        useFreeApi: true,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.portraitUrl).toBe('https://subnp.com/api/image/free-hero-999');
    });
  });
});
