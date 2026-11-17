# D&D 2024 Character Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, mobile-friendly web application for beginners to generate unique, balanced D&D 2024 Level 1 characters via visual archetype cards, custom mechanics bounded by "Balance Cards", AI portrait generation from selfies, and dual delivery (interactive live sheet + official PDF).

**Architecture:** Next.js full-stack application with TypeScript and Tailwind CSS. Next.js App Router powers the responsive UI and backend API routes (`/api/generate-mechanic`, `/api/generate-portrait`, `/api/characters`, `/api/export-pdf`). Character data is validated via strict TypeScript domain schemas and stored by key/short code for sharing and offline play.

**Tech Stack:** Next.js 14+ (App Router), React 18+, TypeScript, Tailwind CSS, Lucide-React, `pdf-lib`, `@pdf-lib/fontkit`, Vitest / Testing Library.

**Spec:** `C:\Users\Андрей\.gemini\antigravity\scratch\dnd-character-creator\docs\specs\2026-11-17-dnd-character-generator-design.md`

## Global Constraints

- **Ruleset Floor:** Strictly D&D 2024 (Revised 5e / SRD 5.2): Backgrounds assign +2/+1 Ability Score Increases and one Origin Feat; species grant traits without ASIs; standard level 1 HP and weapon masteries.
- **Zero-Crash Free Mode:** The application must run 100% end-to-end in offline/mock mode without requiring paid API keys, falling back cleanly to rule-based balance cards and curated fantasy portraits.
- **Language & Encoding:** UI and generated descriptions are in natural Russian. PDF export must support Cyrillic characters via embedded TTF font (`@pdf-lib/fontkit`).
- **No Heavy Auth:** No external database or OAuth login in v1; character persistence uses unique short access keys (`HERO-XXXX`) and browser `localStorage`.
- **Target Working Directory:** `C:\Users\Андрей\.gemini\antigravity\scratch\dnd-character-creator`

## Review Focus

1. **Adversarial / Game-Breaking Custom Mechanic Prompt:** Free-text like *"I want to kill everything in one hit with 9999 damage"* must still resolve into a balanced Level 1 mechanic (e.g. Origin Feat or Cantrip equivalent with 1/Rest or standard damage die).
2. **Corrupted or Oversized Photo Upload:** Non-image files or payloads > 5MB must be safely caught with a friendly Russian validation message without crashing the server.
3. **Cyrillic Character Encoding in PDF:** Names, backgrounds, and custom mechanics with Cyrillic characters must render crisply without triggering `WinAnsiEncoding` errors or unreadable glyphs.
4. **Non-Existent Character Key Lookup:** Accessing an invalid key (e.g. `HERO-0000`) must return a polite 404 message in the UI instead of throwing an unhandled exception.
5. **Missing API Keys in Production:** Absence of `GEMINI_API_KEY` or image provider credentials must trigger mock mode automatically with an informational banner, never a 500 error.

---

### Task 1: Project Scaffolding, Domain Types & Test Harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/types/character.ts`
- Create: `src/types/archetype.ts`
- Create: `src/types/balance.ts`
- Test: `tests/domain/types.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `Character`: `{ id: string; key: string; name: string; species: Species2024; characterClass: Class2024; background: Background2024; abilityScores: AbilityScores; hp: number; maxHp: number; ac: number; speed: number; originFeat: string; customMechanic?: BalanceCard; backstory?: string; portraitUrl?: string; createdAt: string; }`
  - `ArchetypeSelection`: `{ roleId: string; powerSourceId: string; speciesId: string; characterName?: string; }`
  - `BalanceCard`: `{ id: string; title: string; trigger: string; effect: string; costOrTradeoff: string; ruleEquivalent: string; }`

- [ ] **Step 1: Write the failing domain validation test**

```typescript
// tests/domain/types.test.ts
import { describe, it, expect } from 'vitest';
import { validateCharacter, createInitialCharacter } from '@/types/character';

describe('Character Domain Types', () => {
  it('validates a complete D&D 2024 character structure', () => {
    const character = createInitialCharacter({
      key: 'HERO-1001',
      name: 'Торин',
      species: 'dwarf',
      characterClass: 'fighter',
      background: 'soldier'
    });
    expect(validateCharacter(character)).toBe(true);
    expect(character.hp).toBeGreaterThan(0);
    expect(character.key).toBe('HERO-1001');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/domain/types.test.ts`
Expected: FAIL with missing module `@/types/character`.

- [ ] **Step 3: Implement domain types and validator in `src/types/character.ts`, `src/types/archetype.ts`, and `src/types/balance.ts`**

Define TypeScript interfaces and helper `validateCharacter(char: any): boolean` and `createInitialCharacter(...)`. Configure Vitest and TypeScript paths.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/domain/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/types tests/domain
git commit -m "feat: scaffold project and define core D&D 2024 domain models"
```

---

### Task 2: D&D 2024 Rules Engine & Starter Chassis Builder

**Files:**
- Create: `src/lib/dnd2024/archetypes.ts`
- Create: `src/lib/dnd2024/rulesEngine.ts`
- Test: `tests/dnd2024/rulesEngine.test.ts`

**Interfaces:**
- Consumes: `ArchetypeSelection`, `Character` from `src/types`
- Produces:
  - `buildBaseChassis(selection: ArchetypeSelection): Character`
  - `ARCHETYPE_ROLES`, `ARCHETYPE_POWER_SOURCES`, `ARCHETYPE_SPECIES` dictionaries with user-friendly Russian descriptions.

- [ ] **Step 1: Write failing rules engine tests**

```typescript
// tests/dnd2024/rulesEngine.test.ts
import { describe, it, expect } from 'vitest';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';

describe('D&D 2024 Rules Engine', () => {
  it('builds a valid Level 1 Fighter with 2024 Soldier background and Origin Feat Savage Attacker', () => {
    const char = buildBaseChassis({
      roleId: 'tank',
      powerSourceId: 'martial',
      speciesId: 'human',
      characterName: 'Бран'
    });
    expect(char.characterClass).toBe('fighter');
    expect(char.hp).toBe(12); // 10 + Con modifier (+2)
    expect(char.ac).toBe(16); // Chain mail
    expect(char.originFeat).toBe('Savage Attacker');
    expect(char.abilityScores.strength).toBeGreaterThanOrEqual(15);
  });

  it('builds a valid Level 1 Wizard with 2024 Sage background and Magic Initiate Origin Feat', () => {
    const char = buildBaseChassis({
      roleId: 'blaster',
      powerSourceId: 'arcane',
      speciesId: 'elf',
      characterName: 'Элоир'
    });
    expect(char.characterClass).toBe('wizard');
    expect(char.abilityScores.intelligence).toBeGreaterThanOrEqual(16);
    expect(char.originFeat).toBe('Magic Initiate');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dnd2024/rulesEngine.test.ts`
Expected: FAIL with `buildBaseChassis is not defined`.

- [ ] **Step 3: Implement `buildBaseChassis` in `src/lib/dnd2024/rulesEngine.ts`**

Implement mapping logic for D&D 2024:
- Assign standard array (15, 14, 13, 12, 10, 8) according to primary/secondary class stats.
- Apply Background +2 / +1 modifiers.
- Calculate HP (max hit die + Con mod), AC (standard starter gear), Speed (species speed), and default Origin Feat.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/dnd2024/rulesEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dnd2024 tests/dnd2024
git commit -m "feat: implement D&D 2024 starter chassis calculator"
```

---

### Task 3: AI Balance Card & Narrative Backstory Generator

**Files:**
- Create: `src/lib/ai/balanceArbiter.ts`
- Create: `src/lib/ai/backstoryGenerator.ts`
- Create: `src/app/api/generate-mechanic/route.ts`
- Create: `src/app/api/generate-backstory/route.ts`
- Test: `tests/ai/balanceArbiter.test.ts`
- Test: `tests/ai/backstoryGenerator.test.ts`

**Interfaces:**
- Consumes: `Character`, `BalanceCard` from `src/types`
- Produces:
  - `generateBalanceCards(flavorText: string, chassis: Character, apiKey?: string): Promise<BalanceCard[]>`
  - `generateBackstory(character: Character, apiKey?: string): Promise<string>`
  - POST `/api/generate-mechanic` returning `{ cards: BalanceCard[] }`
  - POST `/api/generate-backstory` returning `{ backstory: string }`

- [ ] **Step 1: Write failing balance arbiter test**

```typescript
// tests/ai/balanceArbiter.test.ts
import { describe, it, expect } from 'vitest';
import { generateBalanceCards } from '@/lib/ai/balanceArbiter';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';

describe('Balance Card Arbiter', () => {
  it('generates 2-3 balanced cards in mock mode matching 2024 origin feat budgets', async () => {
    const char = buildBaseChassis({ roleId: 'tank', powerSourceId: 'martial', speciesId: 'dwarf' });
    const cards = await generateBalanceCards('Хочу плевать кислотой когда получаю урон', char);

    expect(cards.length).toBeGreaterThanOrEqual(2);
    cards.forEach(card => {
      expect(card.title).toBeTruthy();
      expect(card.trigger).toBeTruthy();
      expect(card.effect).toBeTruthy();
      expect(card.costOrTradeoff).toBeTruthy();
    });
  });

  it('bounds an overpowered adversarial prompt into a standard rest-cooldown mechanic', async () => {
    const char = buildBaseChassis({ roleId: 'striker', powerSourceId: 'shadow', speciesId: 'tiefling' });
    const cards = await generateBalanceCards('Убивать всех с одного удара 9999 урона', char);
    
    expect(cards[0].costOrTradeoff).toMatch(/1 раз|долгий отдых|вместо черты/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ai/balanceArbiter.test.ts`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement `generateBalanceCards` and mock rule-bound generator**

Create prompt template enforcing D&D 2024 boundaries (max 1d6/1d8 damage, action/reaction economy, 1/Rest limits). In mock/offline mode, provide intelligent keyword-based balanced templates. Create API route `/api/generate-mechanic/route.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ai/balanceArbiter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/balanceArbiter.ts src/app/api/generate-mechanic tests/ai
git commit -m "feat: implement AI balance cards generator with 2024 rules budget"
```

---

### Task 4: Key-Based Character Store & Persistence

**Files:**
- Create: `src/lib/storage/characterStore.ts`
- Create: `src/app/api/characters/route.ts`
- Create: `src/app/api/characters/[key]/route.ts`
- Test: `tests/storage/characterStore.test.ts`

**Interfaces:**
- Consumes: `Character` from `src/types`
- Produces:
  - `saveCharacterRecord(character: Character): Promise<{ key: string }>`
  - `getCharacterRecord(key: string): Promise<Character | null>`
  - GET `/api/characters/[key]` and POST `/api/characters`

- [ ] **Step 1: Write failing character store test**

```typescript
// tests/storage/characterStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveCharacterRecord, getCharacterRecord, generateCharacterKey } from '@/lib/storage/characterStore';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';

describe('Character Key Store', () => {
  it('generates a clean human-readable key format (HERO-XXXX)', () => {
    const key = generateCharacterKey();
    expect(key).toMatch(/^HERO-[A-Z0-9]{4}$/);
  });

  it('saves and retrieves a character record by key', async () => {
    const char = buildBaseChassis({ roleId: 'tank', powerSourceId: 'martial', speciesId: 'human', characterName: 'Арагорн' });
    const { key } = await saveCharacterRecord(char);
    const loaded = await getCharacterRecord(key);

    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('Арагорн');
  });

  it('returns null when an unknown key is queried', async () => {
    const result = await getCharacterRecord('HERO-999999');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/storage/characterStore.test.ts`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement `characterStore.ts` and API routes**

Store characters in a server-side JSON file (`data/characters.json`) with in-memory caching and file write locks. Wire up `/api/characters` and `/api/characters/[key]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/storage/characterStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage src/app/api/characters tests/storage
git commit -m "feat: implement key-based character persistence"
```

---

### Task 5: Portrait Generation Pipeline (Selfie to Fantasy Art)

**Files:**
- Create: `src/lib/ai/portraitPipeline.ts`
- Create: `src/app/api/generate-portrait/route.ts`
- Test: `tests/ai/portraitPipeline.test.ts`

**Interfaces:**
- Consumes: `Character` from `src/types`
- Produces:
  - `generatePortrait(input: { photoBase64?: string; character: Character; apiKey?: string }): Promise<string>`
  - POST `/api/generate-portrait` accepting `{ photoBase64?: string; character: Character }` and returning `{ portraitUrl: string }`

- [ ] **Step 1: Write failing portrait pipeline test**

```typescript
// tests/ai/portraitPipeline.test.ts
import { describe, it, expect } from 'vitest';
import { buildPortraitPrompt, generatePortrait } from '@/lib/ai/portraitPipeline';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';

describe('Portrait Generation Pipeline', () => {
  it('constructs a rich fantasy prompt incorporating species, armor, and custom flavor', () => {
    const char = buildBaseChassis({ roleId: 'tank', powerSourceId: 'martial', speciesId: 'dwarf' });
    char.customMechanic = {
      id: 'c1',
      title: 'Огненный топор',
      trigger: 'Атака',
      effect: 'Топор пылает синим пламенем',
      costOrTradeoff: 'Замена черты',
      ruleEquivalent: 'Origin Feat'
    };

    const prompt = buildPortraitPrompt(char);
    expect(prompt).toContain('dwarf');
    expect(prompt).toContain('chain mail');
    expect(prompt).toContain('Огненный топор');
  });

  it('returns a valid fallback portrait data URI when running in mock mode', async () => {
    const char = buildBaseChassis({ roleId: 'blaster', powerSourceId: 'arcane', speciesId: 'elf' });
    const result = await generatePortrait({ character: char });
    expect(result).toMatch(/^data:image\/|https?:\/\//);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ai/portraitPipeline.test.ts`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement prompt synthesizer and portrait pipeline in `src/lib/ai/portraitPipeline.ts`**

Generate structured prompt combining species appearance, class armor/weapons, and custom mechanic visuals. Include clean SVG/preset generator for mock mode. Wire up `/api/generate-portrait/route.ts` with size limit validation (<5MB).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ai/portraitPipeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/portraitPipeline.ts src/app/api/generate-portrait tests/ai
git commit -m "feat: implement selfie-to-fantasy portrait generation pipeline"
```

---

### Task 6: Official D&D 2024 PDF Exporter with Cyrillic & Portrait

**Files:**
- Create: `src/lib/pdf/pdfExporter.ts`
- Create: `src/app/api/export-pdf/route.ts`
- Create: `src/assets/fonts/Roboto-Regular.ttf` (or similar open Cyrillic font)
- Test: `tests/pdf/pdfExporter.test.ts`

**Interfaces:**
- Consumes: `Character` from `src/types`
- Produces:
  - `generateCharacterPdf(character: Character): Promise<Uint8Array>`
  - POST `/api/export-pdf` returning PDF stream/blob.

- [ ] **Step 1: Write failing PDF generation test**

```typescript
// tests/pdf/pdfExporter.test.ts
import { describe, it, expect } from 'vitest';
import { generateCharacterPdf } from '@/lib/pdf/pdfExporter';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';

describe('D&D 2024 PDF Exporter', () => {
  it('generates a valid non-empty PDF byte array with Cyrillic strings', async () => {
    const char = buildBaseChassis({ roleId: 'tank', powerSourceId: 'martial', speciesId: 'human', characterName: 'Воин Света' });
    char.customMechanic = {
      id: 'c1',
      title: 'Щит верности',
      trigger: 'Реакция',
      effect: 'Дает +2 к защите союзника',
      costOrTradeoff: 'Замена черты',
      ruleEquivalent: 'Origin Feat'
    };

    const pdfBytes = await generateCharacterPdf(char);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);
    // Verify PDF header magic bytes %PDF-
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pdf/pdfExporter.test.ts`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement `generateCharacterPdf` with `pdf-lib` and `@pdf-lib/fontkit`**

Embed Unicode Cyrillic font, map character fields (Stats, Modifiers, AC, HP, Speed, Attacks, Origin Feat, Backstory text, & Custom Mechanic description), embed portrait image box, and generate output bytes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/pdf/pdfExporter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf src/app/api/export-pdf tests/pdf
git commit -m "feat: implement D&D 2024 PDF exporter with Cyrillic font and portrait"
```

---

### Task 7: Interactive Onboarding Wizard UI (Archetype Cards, Balance Cards, Selfie Upload)

**Files:**
- Create: `src/components/wizard/ArchetypeSelector.tsx`
- Create: `src/components/wizard/CustomMechanicInput.tsx`
- Create: `src/components/wizard/PhotoUploader.tsx`
- Create: `src/components/wizard/WizardContainer.tsx`
- Create: `src/app/create/page.tsx`
- Test: `tests/components/WizardContainer.test.tsx`

**Interfaces:**
- Consumes: `buildBaseChassis`, `generateBalanceCards`, `generatePortrait`
- Produces: Full interactive creation wizard with progress bar, card animations, and completion callback.

- [ ] **Step 1: Write component test for Wizard step navigation**

```typescript
// tests/components/WizardContainer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardContainer } from '@/components/wizard/WizardContainer';

describe('WizardContainer Component', () => {
  it('renders step 1 archetype role cards and advances to power source', async () => {
    render(<WizardContainer onComplete={() => {}} />);
    expect(screen.getByText(/Какова ваша роль/i)).toBeDefined();
    
    const roleCard = screen.getByText(/Стальной щит/i);
    fireEvent.click(roleCard);
    
    expect(screen.getByText(/Источник вашей силы/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/WizardContainer.test.tsx`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement Wizard components with Tailwind styling and mobile responsiveness**

Build `ArchetypeSelector`, `CustomMechanicInput` with live Balance Card generator and selection, and `PhotoUploader` with webcam/file drop + skip button. Connect them in `WizardContainer`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/WizardContainer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wizard src/app/create tests/components
git commit -m "feat: implement interactive archetype wizard and custom mechanics UI"
```

---

### Task 8: Mobile Game-Table Character Sheet & Share Modal

**Files:**
- Create: `src/components/sheet/InteractiveSheet.tsx`
- Create: `src/components/sheet/ActionCards.tsx`
- Create: `src/components/sheet/ShareKeyModal.tsx`
- Create: `src/app/sheet/[key]/page.tsx`
- Create: `src/app/page.tsx` (Homepage with Create / Load by Key)
- Test: `tests/components/InteractiveSheet.test.tsx`

**Interfaces:**
- Consumes: `Character` from `src/types`, `/api/characters/[key]`, `/api/export-pdf`
- Produces: Live game-table sheet view, HP tracker, PDF download trigger, key sharing modal.

- [ ] **Step 1: Write test for interactive character sheet**

```typescript
// tests/components/InteractiveSheet.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InteractiveSheet } from '@/components/sheet/InteractiveSheet';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';

describe('InteractiveSheet Component', () => {
  it('displays character stats, custom mechanic card, and export PDF button', () => {
    const char = buildBaseChassis({ roleId: 'tank', powerSourceId: 'martial', speciesId: 'dwarf', characterName: 'Гимли' });
    char.customMechanic = {
      id: 'c1',
      title: 'Бородатая стойкость',
      trigger: 'Когда сбит с ног',
      effect: 'Поднимается без траты скорости',
      costOrTradeoff: 'Замена черты',
      ruleEquivalent: 'Origin Feat'
    };

    render(<InteractiveSheet character={char} />);
    expect(screen.getByText('Гимли')).toBeDefined();
    expect(screen.getByText(/Бородатая стойкость/i)).toBeDefined();
    expect(screen.getByText(/Скачать официальный PDF/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/InteractiveSheet.test.tsx`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement `InteractiveSheet`, `ActionCards`, `ShareKeyModal`, and main pages**

Build mobile-optimized character sheet with tap-to-roll actions, live HP counter, portrait hero header, access key badge with 1-click copy, and PDF download button. Wire up home page `src/app/page.tsx` with "Новый персонаж" and "Открыть по коду".

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/InteractiveSheet.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/sheet src/app/sheet src/app/page.tsx tests/components
git commit -m "feat: implement mobile-friendly interactive sheet and key-sharing UI"
```

---

### Task 9: End-to-End Integration Verification & Smoke Test

**Files:**
- Create: `tests/e2e/flow.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write full E2E flow test**

Test the entire pipeline: Selection $\rightarrow$ Chassis build $\rightarrow$ Balance Card generation $\rightarrow$ Portrait prompt synthesis $\rightarrow$ Key persistence $\rightarrow$ Retrieval $\rightarrow$ PDF generation.

- [ ] **Step 2: Run all tests across the project**

Run: `npx vitest run`
Expected: All test suites PASS (types, rules engine, balance arbiter, storage, portrait, PDF, components, E2E).

- [ ] **Step 3: Commit and update documentation**

```bash
git add README.md tests/e2e
git commit -m "chore: complete end-to-end integration and documentation"
```
