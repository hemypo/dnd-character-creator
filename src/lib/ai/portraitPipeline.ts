import { Character } from '@/types/character';

export interface GeneratePortraitOptions {
  character?: Partial<Character>;
  photoBase64?: string;
  presetId?: string;
  apiKey?: string;
  model?: string;
  useFreeApi?: boolean;
  fetchFn?: typeof fetch;
}

export interface GeneratePortraitResult {
  portraitUrl: string;
  prompt?: string;
}

export interface PresetAvatar {
  id: string;
  name: string;
  url: string;
  species: string;
  characterClass: string;
  description?: string;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

const SPECIES_VISUALS: Record<string, { traits: string; features: string }> = {
  human: {
    traits: 'human with determined expression and versatile features',
    features: 'rugged or noble facial structure, piercing gaze, adaptable presence',
  },
  elf: {
    traits: 'elf with slender graceful features, pointed elegant ears, luminous eyes',
    features: 'high ethereal cheekbones, timeless ageless complexion, subtle magical aura',
  },
  dwarf: {
    traits: 'dwarf with broad-shouldered stout build, intricately braided hair and beard',
    features: 'weathered stone-hewn features, deep proud eyes, traditional dwarven grooming',
  },
  halfling: {
    traits: 'halfling of small stature, nimble posture, cheerful and spirited expression',
    features: 'expressive kind eyes, curly hair, slight pointed ear tips, warm countenance',
  },
  gnome: {
    traits: 'gnome with petite clever frame, eccentric styling, and bright inquisitive eyes',
    features: 'spark of curiosity, finely detailed expression, playful inventive demeanor',
  },
  dragonborn: {
    traits: 'dragonborn with draconic scales, sweeping cranial horns, reptile eyes',
    features: 'formidable draconic snout, iridescent scale pattern, fiery reptilian presence',
  },
  tiefling: {
    traits: 'tiefling with curving polished horns, sharp canines, solid hue eyes',
    features: 'fiendish heritage, exotic skin tone (crimson, obsidian, or ash), pointed ears',
  },
  orc: {
    traits: 'orc with muscular formidable frame, prominent lower tusks, strong jawline',
    features: 'battle-tested features, intense focused stare, primal warrior nobility',
  },
  goliath: {
    traits: 'goliath with towering stone-like physique, pale skin marked with lithic tattoos',
    features: 'chiseled granite features, mountain climber endurance, resolute expression',
  },
};

const CLASS_GEAR: Record<string, { armor: string; weapons: string; aesthetic: string }> = {
  fighter: {
    armor: 'polished steel plate armor and heavy chain mail hauberk',
    weapons: 'longsword, engraved steel shield, strapped arming daggers',
    aesthetic: 'disciplined battlefield veteran with martial heraldry',
  },
  barbarian: {
    armor: 'rugged animal pelts, leather harness, tribal war-paint, unarmored resilience',
    weapons: 'massive double-bitted greataxe, hunting knife',
    aesthetic: 'fierce primal warrior radiating untamed fury and strength',
  },
  rogue: {
    armor: 'supple dark leather armor, darkened rivets, hooded silk cloak',
    weapons: 'twin concealed daggers, rapier, lockpicks on belt',
    aesthetic: 'shadow-draped stealth operative blending into obscurity',
  },
  wizard: {
    armor: 'flowing arcane robes embroidered with silver mystic runes and astrological motifs',
    weapons: 'carved focus staff crowned with crystal, ancient leather-bound spellbook',
    aesthetic: 'scholarly archmage with swirling ambient magical motes',
  },
  cleric: {
    armor: 'gleaming breastplate over chain mail, sacred tabard emblazoned with holy symbol',
    weapons: 'blessed heavy mace, radiant round shield',
    aesthetic: 'divine champion surrounded by gentle holy golden glow',
  },
  druid: {
    armor: 'organic cured hide armor, woven ironwood bracers, foliage mantle',
    weapons: 'carved gnarled wooden quarterstaff, mistletoe sprig, sickle',
    aesthetic: 'wild nature guardian in harmony with primal spirits',
  },
  paladin: {
    armor: 'gilded full plate armor, pristine ceremonial mantle, gleaming gorget',
    weapons: 'radiant greatsword, holy relic reliquary',
    aesthetic: 'beacon of righteousness radiating warm celestial dawn light',
  },
  ranger: {
    armor: 'practical forest-green leather jerkin, traveler cloak, reinforced vambraces',
    weapons: 'finely crafted recurve longbow, quiver of fletched arrows, survival blades',
    aesthetic: 'vigilant wilderness tracker attuned to the wild trails',
  },
  monk: {
    armor: 'simple flowing martial artist wraps, cloth sash, wrapped hand wraps',
    weapons: 'unarmed combat stance, wooden bo staff',
    aesthetic: 'serene master of ki energy, tranquil yet explosive grace',
  },
  bard: {
    armor: 'dashing tailored leather doublet, colorful velvet sash, feathered cap',
    weapons: 'masterwork rapier, inlaid golden lute',
    aesthetic: 'charismatic storyteller with an infectious theatrical flair',
  },
  sorcerer: {
    armor: 'fine ethereal silk vestments, dragonhide bracers, arcane mantle',
    weapons: 'glowing crystal wand, crackling elemental spark at fingertips',
    aesthetic: 'living conduit of raw magical power with glowing veins',
  },
  warlock: {
    armor: 'dark eldritch robes, occult talismans, obsidian accessories',
    weapons: 'pact dagger with runic engravings, floating eldritch orb',
    aesthetic: 'otherworldly emissary shrouded in violet otherworldly shadows',
  },
};

/**
 * Validates a base64 photo string, checking format and 5MB limit.
 */
export function validatePhotoBase64(photoBase64: string): void {
  if (typeof photoBase64 !== 'string' || photoBase64.trim() === '') {
    throw new Error('Invalid or corrupted photo base64 payload: empty or not a string');
  }

  // Remove data URI prefix if present
  const cleaned = photoBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();

  // Basic base64 character set and padding verification
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
    throw new Error('Invalid or corrupted photo base64 payload: malformed base64 encoding');
  }

  const byteSize = Buffer.byteLength(cleaned, 'base64');
  if (byteSize > MAX_PHOTO_BYTES) {
    throw new Error(`Photo size exceeds maximum allowed limit of 5MB (received ${(byteSize / (1024 * 1024)).toFixed(2)} MB)`);
  }
}

/**
 * Builds a prompt for fantasy character portrait synthesis.
 */
export function buildPortraitPrompt(character?: Partial<Character>, hasPhoto: boolean = false): string {
  const speciesKey = (character?.species || 'human').toLowerCase();
  const classKey = (character?.characterClass || 'fighter').toLowerCase();
  const name = character?.name || 'Adventurer';

  const speciesInfo = SPECIES_VISUALS[speciesKey] || {
    traits: `${speciesKey} heritage with unique fantasy characteristics`,
    features: 'distinctive adventurous features and expressive presence',
  };

  const classInfo = CLASS_GEAR[classKey] || {
    armor: 'sturdy adventurer leather and metal protective gear',
    weapons: 'versatile sidearms and traveling equipment',
    aesthetic: 'capable seasoned adventurer ready for peril',
  };

  const parts: string[] = [];

  const gender = character?.gender || character?.appearance?.gender;
  const genderStr = gender
    ? gender.toLowerCase().includes('жен') || gender.toLowerCase() === 'female'
      ? 'female'
      : gender.toLowerCase().includes('муж') || gender.toLowerCase() === 'male'
      ? 'male'
      : 'androgynous'
    : '';

  const heroDescriptor = genderStr ? `${genderStr} ${speciesKey} ${classKey}` : `${speciesKey} ${classKey}`;

  parts.push(
    `Masterpiece fantasy digital painting of ${name}, a ${heroDescriptor} in D&D 2024 high fantasy art style.`
  );
  parts.push(`Species Anatomy: ${speciesInfo.traits}. ${speciesInfo.features}.`);

  // Physical appearance details
  const appearanceTraits: string[] = [];
  if (character?.appearance?.age) appearanceTraits.push(`age: ${character.appearance.age}`);
  if (character?.appearance?.build) appearanceTraits.push(`build: ${character.appearance.build}`);
  if (character?.appearance?.hairAndEyes) appearanceTraits.push(`hair & eyes: ${character.appearance.hairAndEyes}`);
  if (character?.appearance?.distinguishingFeatures) {
    appearanceTraits.push(`distinctive features: ${character.appearance.distinguishingFeatures}`);
  }
  if (appearanceTraits.length > 0) {
    parts.push(`Appearance Details: ${appearanceTraits.join(', ')}.`);
  }

  parts.push(`Attire & Armor: ${classInfo.armor}.`);
  parts.push(`Armament: ${classInfo.weapons}.`);
  parts.push(`Atmosphere: ${classInfo.aesthetic}, dramatic volumetric lighting, cinematic portrait framing, sharp focus.`);

  // Custom quirk/mechanic visual element
  if (character?.customMechanic) {
    const quirk = character.customMechanic;
    parts.push(
      `Special Visual Manifestation: Incorporate the distinct visual signature of "${quirk.title}" (${quirk.effect}). Distinctive energy, aura, or equipment modification visible in the portrait.`
    );
  }

  // Facial likeness from selfie photo
  if (hasPhoto) {
    parts.push(
      `Photo Likeness Transformation: Preserve the subject in the photo's facial likeness, distinct facial structure, jawline, eye shape, and expression, faithfully transforming their recognizable face into this fantasy ${speciesKey} ${classKey}.`
    );
  } else {
    parts.push(
      `Original fantasy character face capturing the hero's nobility, determination, and storied background.`
    );
  }

  return parts.join(' ');
}

/**
 * Generates an SVG avatar in mock mode.
 */
export function generateMockSvgPortrait(
  character?: Partial<Character>,
  photoBase64?: string
): string {
  const name = character?.name || 'Безымянный герой';
  const species = (character?.species || 'human').toLowerCase();
  const characterClass = (character?.characterClass || 'fighter').toLowerCase();
  const quirkTitle = character?.customMechanic?.title;

  // Palette selection based on class
  const classThemes: Record<string, { bg1: string; bg2: string; accent: string; border: string }> = {
    fighter: { bg1: '#1e293b', bg2: '#0f172a', accent: '#94a3b8', border: '#cbd5e1' },
    barbarian: { bg1: '#450a0a', bg2: '#1c0505', accent: '#ef4444', border: '#f87171' },
    rogue: { bg1: '#18181b', bg2: '#09090b', accent: '#a1a1aa', border: '#71717a' },
    wizard: { bg1: '#1e1b4b', bg2: '#0f0e26', accent: '#818cf8', border: '#c7d2fe' },
    cleric: { bg1: '#422006', bg2: '#1a0d02', accent: '#eab308', border: '#fef08a' },
    druid: { bg1: '#064e3b', bg2: '#022c22', accent: '#10b981', border: '#6ee7b7' },
    paladin: { bg1: '#312e81', bg2: '#172554', accent: '#f59e0b', border: '#fde047' },
    ranger: { bg1: '#14532d', bg2: '#052e16', accent: '#84cc16', border: '#bef264' },
    monk: { bg1: '#3b0764', bg2: '#1e053a', accent: '#c084fc', border: '#e9d5ff' },
    bard: { bg1: '#701a75', bg2: '#3b0764', accent: '#f43f5e', border: '#fda4af' },
    sorcerer: { bg1: '#4c0519', bg2: '#1f020a', accent: '#fb7185', border: '#fecdd3' },
    warlock: { bg1: '#2e1065', bg2: '#13042c', accent: '#a855f7', border: '#d8b4fe' },
  };

  const theme = classThemes[characterClass] || {
    bg1: '#1e293b',
    bg2: '#0f172a',
    accent: '#38bdf8',
    border: '#7dd3fc',
  };

  // Class symbol path / icon
  const getSymbol = (c: string) => {
    switch (c) {
      case 'fighter':
      case 'paladin':
        return `<path d="M220 180 L292 252 M292 180 L220 252 M256 160 L256 270 M230 190 L282 190" stroke="${theme.border}" stroke-width="6" stroke-linecap="round"/>`;
      case 'wizard':
      case 'sorcerer':
      case 'warlock':
        return `<circle cx="256" cy="220" r="32" fill="none" stroke="${theme.border}" stroke-width="4"/><polygon points="256,170 266,210 306,220 266,230 256,270 246,230 206,220 246,210" fill="${theme.accent}" opacity="0.8"/>`;
      case 'rogue':
        return `<path d="M236 170 L256 260 L276 170 Z M256 260 L256 280 M246 270 L266 270" stroke="${theme.border}" stroke-width="4" fill="${theme.accent}"/>`;
      case 'cleric':
        return `<path d="M256 160 L256 270 M220 200 L292 200" stroke="${theme.border}" stroke-width="8" stroke-linecap="round"/><circle cx="256" cy="215" r="48" fill="none" stroke="${theme.accent}" stroke-width="3" stroke-dasharray="6 4"/>`;
      case 'druid':
      case 'ranger':
        return `<path d="M256 160 C230 200 230 250 256 270 C282 250 282 200 256 160 Z" fill="${theme.accent}" stroke="${theme.border}" stroke-width="4"/><line x1="256" y1="180" x2="256" y2="260" stroke="${theme.border}" stroke-width="3"/>`;
      case 'barbarian':
        return `<path d="M210 180 Q256 160 302 180 L290 260 L256 280 L222 260 Z" fill="${theme.accent}" stroke="${theme.border}" stroke-width="5"/>`;
      default:
        return `<polygon points="256,170 280,215 330,220 290,255 305,305 256,275 207,305 222,255 182,220 232,215" fill="${theme.accent}" stroke="${theme.border}" stroke-width="3"/>`;
    }
  };

  const photoOverlay = photoBase64
    ? `<clipPath id="circle-clip">
         <circle cx="256" cy="225" r="120" />
       </clipPath>
       <image href="${photoBase64}" x="136" y="105" width="240" height="240" preserveAspectRatio="xMidYMid slice" clip-path="url(#circle-clip)" opacity="0.88" />
       <circle cx="256" cy="225" r="120" fill="url(#photo-tint)" mix-blend-mode="color" />
       <circle cx="256" cy="225" r="120" fill="none" stroke="${theme.border}" stroke-width="4"/>`
    : `<g filter="url(#glow)">
         <circle cx="256" cy="225" r="90" fill="${theme.bg2}" stroke="${theme.border}" stroke-width="3"/>
         ${getSymbol(characterClass)}
       </g>`;

  const quirkBadge = quirkTitle
    ? `<g transform="translate(256, 385)">
         <rect x="-140" y="-14" width="280" height="28" rx="14" fill="${theme.bg2}" stroke="${theme.accent}" stroke-width="2"/>
         <text x="0" y="5" font-family="Cinzel, Georgia, serif" font-size="12" font-weight="bold" fill="${theme.border}" text-anchor="middle">✦ ${escapeXml(quirkTitle)} ✦</text>
       </g>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg1}"/>
      <stop offset="100%" stop-color="${theme.bg2}"/>
    </linearGradient>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.border}"/>
      <stop offset="50%" stop-color="${theme.accent}"/>
      <stop offset="100%" stop-color="${theme.border}"/>
    </linearGradient>
    <linearGradient id="photo-tint" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${theme.bg1}" stop-opacity="0.6"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="32" fill="url(#bg-grad)"/>

  <!-- Ornate Outer Border -->
  <rect x="16" y="16" width="480" height="480" rx="24" fill="none" stroke="url(#gold-grad)" stroke-width="3" opacity="0.8"/>
  <rect x="24" y="24" width="464" height="464" rx="20" fill="none" stroke="${theme.accent}" stroke-width="1" opacity="0.4"/>

  <!-- Corner Filigree Ornaments -->
  <circle cx="32" cy="32" r="6" fill="${theme.accent}"/>
  <circle cx="480" cy="32" r="6" fill="${theme.accent}"/>
  <circle cx="32" cy="480" r="6" fill="${theme.accent}"/>
  <circle cx="480" cy="480" r="6" fill="${theme.accent}"/>

  <!-- Central Portrait / Emblem -->
  ${photoOverlay}

  <!-- Ribbon Banner for Title -->
  <path d="M 80 415 L 432 415 L 412 455 L 100 455 Z" fill="${theme.bg2}" stroke="${theme.border}" stroke-width="2"/>

  <!-- Character Name -->
  <text x="256" y="440" font-family="Cinzel, Georgia, serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">
    ${escapeXml(name)}
  </text>

  <!-- Species & Class Badge -->
  <text x="256" y="480" font-family="Georgia, serif" font-size="14" font-style="italic" fill="${theme.accent}" text-anchor="middle" letter-spacing="2">
    ${escapeXml(species.toUpperCase())} • ${escapeXml(characterClass.toUpperCase())}
  </text>

  <!-- Custom Quirk Badge if available -->
  ${quirkBadge}
</svg>`;

  const base64Svg = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64Svg}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Curated preset avatar gallery for fast instant avatar selection.
 */
const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'dwarf-fighter-1',
    name: 'Брунор Камнеборец',
    species: 'dwarf',
    characterClass: 'fighter',
    description: 'Горный щитоносец в тяжелых латах с боевым молотом',
    url: generateMockSvgPortrait({ name: 'Брунор Камнеборец', species: 'dwarf', characterClass: 'fighter' }),
  },
  {
    id: 'dwarf-fighter-2',
    name: 'Хельга Молотобоец',
    species: 'dwarf',
    characterClass: 'fighter',
    description: 'Дворфийская воительница клана с гранитным щитом',
    url: generateMockSvgPortrait({ name: 'Хельга Молотобоец', species: 'dwarf', characterClass: 'fighter' }),
  },
  {
    id: 'dwarf-fighter-3',
    name: 'Торин Железная Наковальня',
    species: 'dwarf',
    characterClass: 'fighter',
    description: 'Седой ветеран подземных стражей с секирой',
    url: generateMockSvgPortrait({ name: 'Торин Железная Наковальня', species: 'dwarf', characterClass: 'fighter' }),
  },
  {
    id: 'elf-wizard-1',
    name: 'Эладриэль Звездный',
    species: 'elf',
    characterClass: 'wizard',
    description: 'Высший эльф в звездной лазурной мантии с гримуаром',
    url: generateMockSvgPortrait({ name: 'Эладриэль Звездный', species: 'elf', characterClass: 'wizard' }),
  },
  {
    id: 'elf-wizard-2',
    name: 'Ильриэн Лунный Шёпот',
    species: 'elf',
    characterClass: 'wizard',
    description: 'Эльфийская чародейка с кристальным посохом',
    url: generateMockSvgPortrait({ name: 'Ильриэн Лунный Шёпот', species: 'elf', characterClass: 'wizard' }),
  },
  {
    id: 'elf-wizard-3',
    name: 'Фаэлин Хранитель Тайн',
    species: 'elf',
    characterClass: 'wizard',
    description: 'Архивариус древней библиотеки в серебряных одеяниях',
    url: generateMockSvgPortrait({ name: 'Фаэлин Хранитель Тайн', species: 'elf', characterClass: 'wizard' }),
  },
  {
    id: 'tiefling-rogue-1',
    name: 'Маликор Тень',
    species: 'tiefling',
    characterClass: 'rogue',
    description: 'Тифлинг-плут в темном кожаном доспехе с кинжалами',
    url: generateMockSvgPortrait({ name: 'Маликор Тень', species: 'tiefling', characterClass: 'rogue' }),
  },
  {
    id: 'tiefling-rogue-2',
    name: 'Каллиста Ночной Ветер',
    species: 'tiefling',
    characterClass: 'rogue',
    description: 'Ловкая взломщица с изогнутыми рогами и маской',
    url: generateMockSvgPortrait({ name: 'Каллиста Ночной Ветер', species: 'tiefling', characterClass: 'rogue' }),
  },
  {
    id: 'tiefling-rogue-3',
    name: 'Бальтазар Тенеплёт',
    species: 'tiefling',
    characterClass: 'rogue',
    description: 'Мастер скрытных клинков с дымчатой аурой',
    url: generateMockSvgPortrait({ name: 'Бальтазар Тенеплёт', species: 'tiefling', characterClass: 'rogue' }),
  },
  {
    id: 'human-paladin-1',
    name: 'Сэр Гавейн Светоносный',
    species: 'human',
    characterClass: 'paladin',
    description: 'Рыцарь клятвы справедливости в золотых доспехах',
    url: generateMockSvgPortrait({ name: 'Сэр Гавейн Светоносный', species: 'human', characterClass: 'paladin' }),
  },
  {
    id: 'human-paladin-2',
    name: 'Леди Валерия Защитница',
    species: 'human',
    characterClass: 'paladin',
    description: 'Паладин рассвета с сияющим мечом и щитом',
    url: generateMockSvgPortrait({ name: 'Леди Валерия Защитница', species: 'human', characterClass: 'paladin' }),
  },
  {
    id: 'human-paladin-3',
    name: 'Роланд Непоколебимый',
    species: 'human',
    characterClass: 'paladin',
    description: 'Крестоносец света с благословенным штандартом',
    url: generateMockSvgPortrait({ name: 'Роланд Непоколебимый', species: 'human', characterClass: 'paladin' }),
  },
];

/**
 * Returns at least 3 curated avatar options, filtered by species/class when available.
 */
export function getPresetAvatars(species?: string, characterClass?: string): PresetAvatar[] {
  const sNorm = species ? species.toLowerCase().trim() : '';
  const cNorm = characterClass ? characterClass.toLowerCase().trim() : '';

  let matches = PRESET_AVATARS.filter((avatar) => {
    const sMatch = !sNorm || avatar.species.toLowerCase() === sNorm;
    const cMatch = !cNorm || avatar.characterClass.toLowerCase() === cNorm;
    return sMatch && cMatch;
  });

  // If strict match gave fewer than 3, try species only or class only
  if (matches.length < 3 && (sNorm || cNorm)) {
    const partialMatches = PRESET_AVATARS.filter((avatar) => {
      const sMatch = sNorm && avatar.species.toLowerCase() === sNorm;
      const cMatch = cNorm && avatar.characterClass.toLowerCase() === cNorm;
      return (sMatch || cMatch) && !matches.some((m) => m.id === avatar.id);
    });
    matches = matches.concat(partialMatches);
  }

  // If still fewer than 3, generate on-the-fly presets for this species and class
  if (matches.length < 3) {
    const fallbackSpecies = sNorm || 'human';
    const fallbackClass = cNorm || 'fighter';

    const dynamicPresets: PresetAvatar[] = [
      {
        id: `${fallbackSpecies}-${fallbackClass}-preset-1`,
        name: `Герой ${fallbackSpecies.toUpperCase()}`,
        species: fallbackSpecies,
        characterClass: fallbackClass,
        description: `Доблестный ${fallbackClass} рода ${fallbackSpecies}`,
        url: generateMockSvgPortrait({
          name: `Герой ${fallbackSpecies}`,
          species: fallbackSpecies,
          characterClass: fallbackClass,
        }),
      },
      {
        id: `${fallbackSpecies}-${fallbackClass}-preset-2`,
        name: `Ветеран ${fallbackSpecies.toUpperCase()}`,
        species: fallbackSpecies,
        characterClass: fallbackClass,
        description: `Опытный представитель ${fallbackSpecies} на тропе войны`,
        url: generateMockSvgPortrait({
          name: `Ветеран ${fallbackSpecies}`,
          species: fallbackSpecies,
          characterClass: fallbackClass,
        }),
      },
      {
        id: `${fallbackSpecies}-${fallbackClass}-preset-3`,
        name: `Защитник ${fallbackSpecies.toUpperCase()}`,
        species: fallbackSpecies,
        characterClass: fallbackClass,
        description: `Легендарный хранитель чести и традиций`,
        url: generateMockSvgPortrait({
          name: `Защитник ${fallbackSpecies}`,
          species: fallbackSpecies,
          characterClass: fallbackClass,
        }),
      },
    ];

    for (const dp of dynamicPresets) {
      if (matches.length >= 3) break;
      if (!matches.some((m) => m.id === dp.id)) {
        matches.push(dp);
      }
    }
  }

  // Safety guarantee: pad from PRESET_AVATARS if needed
  if (matches.length < 3) {
    for (const p of PRESET_AVATARS) {
      if (matches.length >= 3) break;
      if (!matches.some((m) => m.id === p.id)) {
        matches.push(p);
      }
    }
  }

  return matches;
}

/**
 * Main portrait generation function.
 * Generates an SVG portrait in mock mode or calls external image API if credentials are provided.
 */
export async function generatePortrait(
  options: GeneratePortraitOptions
): Promise<GeneratePortraitResult> {
  const { character, photoBase64, presetId, apiKey, fetchFn } = options;

  // Validate photo if provided
  if (photoBase64 !== undefined) {
    validatePhotoBase64(photoBase64);
  }

  // If a preset was selected directly
  if (presetId) {
    const found = PRESET_AVATARS.find((p) => p.id === presetId);
    if (found) {
      return { portraitUrl: found.url };
    }
  }

  const prompt = buildPortraitPrompt(character, Boolean(photoBase64));

  // If external API key is provided, attempt external generation with fallback
  if (apiKey) {
    try {
      const externalUrl = await callExternalImageApi(prompt, apiKey, fetchFn);
      if (externalUrl) {
        return { portraitUrl: externalUrl, prompt };
      }
    } catch {
      // Graceful fallback to next tier
    }
  }

  // Attempt SubNP Free Image Generation API (https://subnp.com/ru/free-api)
  // In unit test runner (Vitest), only run if explicitly enabled via useFreeApi: true
  const isTestEnv = typeof process !== 'undefined' && (process.env.VITEST || process.env.NODE_ENV === 'test');
  const shouldTryFreeApi = options.useFreeApi === true || (options.useFreeApi !== false && !isTestEnv);

  if (shouldTryFreeApi) {
    try {
      const freeModel = options.model || 'flux';
      const freeImageUrl = await callSubnpImageApi(prompt, freeModel, fetchFn);
      if (freeImageUrl) {
        return { portraitUrl: freeImageUrl, prompt };
      }
    } catch {
      // Graceful fallback to mock SVG
    }
  }

  // Mock / offline mode: dynamic SVG portrait
  const portraitUrl = generateMockSvgPortrait(character, photoBase64);
  return { portraitUrl, prompt };
}

/**
 * Free AI Image Generation via SubNP Free API (https://subnp.com/ru/free-api)
 * Models: 'flux' (recommended & working), 'turbo', 'magic'
 */
export async function callSubnpImageApi(
  prompt: string,
  model: string = 'flux',
  fetchFn?: typeof fetch
): Promise<string | null> {
  const fetchImpl = fetchFn || globalThis.fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetchImpl('https://subnp.com/api/free/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DND-Character-Creator/1.0',
      },
      body: JSON.stringify({ prompt, model }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      return null;
    }

    const bodyObj = response.body as { getReader?: () => ReadableStreamDefaultReader<Uint8Array> };
    if (typeof bodyObj.getReader === 'function') {
      const reader = bodyObj.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event = JSON.parse(trimmed.slice(6)) as { status?: string; imageUrl?: string };
              if (event.status === 'complete' && event.imageUrl) {
                return event.imageUrl;
              }
              if (event.status === 'error') {
                return null;
              }
            } catch {
              // Ignore single malformed chunk
            }
          }
        }
      }
    } else if (typeof response.text === 'function') {
      const text = await response.text();
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const event = JSON.parse(trimmed.slice(6)) as { status?: string; imageUrl?: string };
            if (event.status === 'complete' && event.imageUrl) {
              return event.imageUrl;
            }
          } catch {}
        }
      }
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Connector for external image generation API (e.g. Gemini Imagen or OpenAI).
 */
async function callExternalImageApi(
  prompt: string,
  apiKey: string,
  fetchFn?: typeof fetch
): Promise<string | null> {
  const fetchImpl = fetchFn || globalThis.fetch;

  // Example external POST endpoint structure
  const response = await fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '1:1' },
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };

  const prediction = data?.predictions?.[0];
  if (prediction?.bytesBase64Encoded) {
    const mime = prediction.mimeType || 'image/jpeg';
    return `data:${mime};base64,${prediction.bytesBase64Encoded}`;
  }

  return null;
}
