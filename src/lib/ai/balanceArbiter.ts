import { BalanceCard } from '@/types/balance';
import { Character } from '@/types/character';

export interface GenerateBalanceCardsOptions {
  apiKey?: string;
  model?: string;
  fetchFn?: typeof fetch;
}

/**
 * Bounds adversarial and freeform player mechanic requests into balanced D&D 2024 Origin Feat / Cantrip budgets.
 */
export async function generateBalanceCards(
  flavorText: string,
  character?: Partial<Character>,
  options: GenerateBalanceCardsOptions = {}
): Promise<BalanceCard[]> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const text = (flavorText || '').trim();

  if (apiKey) {
    try {
      const aiCards = await callGeminiBalanceCards(text, character, apiKey, options);
      if (aiCards && aiCards.length >= 2) {
        return aiCards.slice(0, 3);
      }
    } catch {
      // Fall through to deterministic mock generator
    }
  }

  return generateMockBalanceCards(text, character);
}

/**
 * Calls Google Gemini REST API with strict JSON schema instructions.
 */
async function callGeminiBalanceCards(
  flavorText: string,
  character: Partial<Character> | undefined,
  apiKey: string,
  options: GenerateBalanceCardsOptions
): Promise<BalanceCard[] | null> {
  const fetchImpl = options.fetchFn || globalThis.fetch;
  const model = options.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are a strict, veteran D&D 2024 Dungeon Master and rules balance referee.
The player wants a custom character feature described as: "${flavorText}".
Character context: Species: ${character?.species || 'Any'}, Class: ${character?.characterClass || 'Any'}, Background: ${character?.background || 'Any'}.

Transform this request into 2 or 3 distinct, strictly balanced Level 1 D&D 2024 options.
CRITICAL 2024 BALANCE RULES:
1. The power budget MUST strictly equal an Origin Feat (e.g. Alert, Tough, Magic Initiate, Savage Attacker) or a Starter Cantrip.
2. Cooldowns: Limited to once per Short Rest or once per Long Rest, OR costing standard Action Economy (Bonus Action, Reaction).
3. Damage / healing: Maximum 1d6 or 1d8 (or 2d6 if 1/Long Rest). NEVER allow unlimited damage, instant kills, or godmode/invulnerability.
4. Output in Russian language for a Russian-speaking player.
5. Return ONLY a valid JSON array of objects conforming to:
[
  {
    "id": "card-1",
    "title": "Short evocative title in Russian",
    "trigger": "Action / Bonus Action / Reaction trigger in Russian",
    "effect": "Clear mechanical effect with exact dice and distances in Russian",
    "costOrTradeoff": "Cost, cooldown, or tradeoff (e.g. 1 раз за долгий отдых, заменяет черту происхождения)",
    "ruleEquivalent": "Official D&D 2024 rule or spell equivalent (e.g. Hellish Rebuke / Savage Attacker)"
  }
]`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.6,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  // Clean markdown fences if any
  const cleanJson = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson) as unknown;

  if (Array.isArray(parsed) && parsed.length >= 2) {
    const validCards: BalanceCard[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (
        item &&
        typeof item === 'object' &&
        typeof item.title === 'string' &&
        typeof item.trigger === 'string' &&
        typeof item.effect === 'string' &&
        typeof item.costOrTradeoff === 'string'
      ) {
        validCards.push({
          id: item.id || `card-${i + 1}`,
          title: item.title,
          trigger: item.trigger,
          effect: item.effect,
          costOrTradeoff: item.costOrTradeoff,
          ruleEquivalent: item.ruleEquivalent || 'Origin Feat equivalent',
        });
      }
    }
    if (validCards.length >= 2) {
      return validCards;
    }
  }

  return null;
}

/**
 * High-quality, deterministic offline mock generator bounded by D&D 2024 mechanics.
 */
function generateMockBalanceCards(flavorText: string, character?: Partial<Character>): BalanceCard[] {
  const lower = flavorText.toLowerCase();

  // Adversarial checks (godmode, insta-kill, 9999, etc.)
  const isAdversarial =
    lower.includes('9999') ||
    lower.includes('убивать всех') ||
    lower.includes('убить всех') ||
    lower.includes('с 1 удара') ||
    lower.includes('с одного удара') ||
    lower.includes('бессмерт') ||
    lower.includes('ваншот') ||
    lower.includes('бесконечн') ||
    lower.includes('god') ||
    lower.includes('instakill');

  if (isAdversarial) {
    return [
      {
        id: 'card-adv-1',
        title: 'Фокусированный сокрушитель',
        trigger: 'Действие при атаке оружием',
        effect: 'При успешном попадании наносит максимальный урон оружия плюс дополнительно 1d8 силового урона.',
        costOrTradeoff: '1 раз за долгий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Savage Attacker (Enhanced 1/Long Rest)',
      },
      {
        id: 'card-adv-2',
        title: 'Касание рока',
        trigger: 'Бонусное действие перед атакой',
        effect: 'Цель проходит спасбросок Телосложения (СЛ 8 + бонус мастерства + мод. Силы или Ловкости); при провале получает 2d6 урона некротической энергией.',
        costOrTradeoff: '1 раз за долгий отдых, вместо черты происхождения',
        ruleEquivalent: 'Inflict Wounds (1/Long Rest budget)',
      },
      {
        id: 'card-adv-3',
        title: 'Стойкость на грани гибели',
        trigger: 'Реакция при снижении ОЗ до 0',
        effect: 'Ваши ОЗ опускаются до 1 вместо падения без сознания, и вы получаете временное преимущество на следующую атаку.',
        costOrTradeoff: '1 раз за долгий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Relentless Endurance (Origin Feat balance)',
      },
    ];
  }

  // Acid / Кислота
  if (lower.includes('кислот') || lower.includes('acid') || lower.includes('едк') || lower.includes('жиж')) {
    return [
      {
        id: 'card-acid-1',
        title: 'Едкий плевок',
        trigger: 'Бонусное действие на дистанции до 30 футов',
        effect: 'Цель проходит спасбросок Ловкости (СЛ 8 + бонус мастерства + мод. Телосложения), при провале получает 1d6 урона кислотой и помеху на следующую проверку характеристик.',
        costOrTradeoff: '1 раз за короткий или долгий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Acid Splash / Dragonborn Breath',
      },
      {
        id: 'card-acid-2',
        title: 'Кислотная контратака',
        trigger: 'Реакция при получении рубящего или колющего урона в ближнем бою',
        effect: 'Брызги едкой жидкости наносят 1d6 урона кислотой атаковавшему существу.',
        costOrTradeoff: '1 раз за короткий отдых, заменяет один заговор',
        ruleEquivalent: 'Hellish Rebuke (Acid variant)',
      },
    ];
  }

  // Fire / Огонь / Пламя
  if (lower.includes('огон') || lower.includes('плам') || lower.includes('жар') || lower.includes('пепел') || lower.includes('fire') || lower.includes('flame')) {
    return [
      {
        id: 'card-fire-1',
        title: 'Пламенный контрудар',
        trigger: 'Реакция при получении урона в ближнем бою',
        effect: 'Атакующее существо получает 1d6 урона огнем, если не пройдет спасбросок Ловкости.',
        costOrTradeoff: '1 раз за короткий или долгий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Hellish Rebuke (1/Rest budget)',
      },
      {
        id: 'card-fire-2',
        title: 'Огненная вспышка клинка',
        trigger: 'Бонусное действие при успешном ударе оружием',
        effect: 'Добавляет 1d4 урона огнем к вашей атаке и поджигает легкие горючие предметы.',
        costOrTradeoff: 'Заменяет один заговор или черту происхождения',
        ruleEquivalent: 'Green-Flame Blade / Searing Smite',
      },
      {
        id: 'card-fire-3',
        title: 'Пепельный след',
        trigger: 'Бонусное действие при перемещении',
        effect: 'Создает полосу густого дыма (слабое затемнение) до начала вашего следующего хода.',
        costOrTradeoff: '1 раз за короткий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Fog Cloud (Pocket)',
      },
    ];
  }

  // Shield / Щит / Защита / Броня
  if (lower.includes('щит') || lower.includes('защит') || lower.includes('брон') || lower.includes('shield') || lower.includes('бастион') || lower.includes('парир')) {
    return [
      {
        id: 'card-shield-1',
        title: 'Несокрушимый бастион',
        trigger: 'Реакция при успешном попадании по вам вражеской атаки',
        effect: 'Дарует +2 к Классу Доспеха против этой атаки, потенциально заставляя ее промахнуться.',
        costOrTradeoff: '1 раз за короткий или долгий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Defensive Duelist / Shield (L1 mini)',
      },
      {
        id: 'card-shield-2',
        title: 'Эгида укрытия',
        trigger: 'Бонусное действие в свой ход',
        effect: 'Вы получаете эффект половинного укрытия (+2 к КД и спасброскам Ловкости) до начала следующего хода, если не перемещаетесь.',
        costOrTradeoff: '1 раз за отдых, заменяет черту происхождения',
        ruleEquivalent: 'Blade Ward (D&D 2024)',
      },
    ];
  }

  // Shadow / Тень / Скрытность / Мрак
  if (lower.includes('тен') || lower.includes('мрак') || lower.includes('скрыт') || lower.includes('shadow') || lower.includes('stealth')) {
    return [
      {
        id: 'card-shadow-1',
        title: 'Теневой покров',
        trigger: 'Бонусное действие в области тусклого света или темноты',
        effect: 'Дарует преимущество на следующую проверку Скрытности и скрывает ваши следы до конца хода.',
        costOrTradeoff: 'Заменяет черту происхождения или один заговор',
        ruleEquivalent: 'Skulker / Minor Illusion',
      },
      {
        id: 'card-shadow-2',
        title: 'Удар из сумрака',
        trigger: 'Действие при атаке по существу, не видящему вас',
        effect: 'Наносит дополнительно 1d6 некротического урона и снижает скорость цели на 10 футов.',
        costOrTradeoff: '1 раз за короткий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Sneak Attack / Ray of Sickness',
      },
    ];
  }

  // Default / Class-Themed fallback for empty or general flavor
  const cls = character?.characterClass || 'fighter';
  if (cls === 'wizard' || cls === 'sorcerer' || cls === 'warlock') {
    return [
      {
        id: 'card-arcane-1',
        title: 'Магический резонанс',
        trigger: 'Бонусное действие перед сотворением заговора',
        effect: 'Добавляет ваш модификатор интеллекта/харизмы к урону следующего заговора.',
        costOrTradeoff: '1 раз за короткий или долгий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Potent Cantrip (1/Rest)',
      },
      {
        id: 'card-arcane-2',
        title: 'Эфирный импульс',
        trigger: 'Реакция при приближении врага на дистанцию 5 футов',
        effect: 'Отталкивает существо на 5 футов при провале спасброска Силы.',
        costOrTradeoff: 'Заменяет один заговор происхождения',
        ruleEquivalent: 'Thunderclap / Gust',
      },
    ];
  }

  if (cls === 'rogue' || cls === 'ranger') {
    return [
      {
        id: 'card-rogue-1',
        title: 'Проворный маневр',
        trigger: 'Бонусное действие при перемещении',
        effect: 'Вы совершаете рывок без провоцирования атак от одного выбранного врага.',
        costOrTradeoff: '1 раз за короткий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Mobile / Cunning Action lite',
      },
      {
        id: 'card-rogue-2',
        title: 'Тактический прицел',
        trigger: 'Бонусное действие перед дистанционной атакой',
        effect: 'Игнорирует половинное укрытие цели на эту атаку.',
        costOrTradeoff: '1 раз за короткий или долгий отдых, заменяет черту происхождения',
        ruleEquivalent: 'Sharpshooter (Range Ignore)',
      },
    ];
  }

  // Default Martial / General
  return [
    {
      id: 'card-gen-1',
      title: 'Боевой натиск',
      trigger: 'Бонусное действие после перемещения как минимум на 15 футов к врагу',
      effect: 'Ваша следующая рукопашная атака наносит дополнительно 1d4 урона или толкает цель на 5 футов.',
      costOrTradeoff: '1 раз за короткий отдых, заменяет черту происхождения',
      ruleEquivalent: 'Charger (D&D 2024)',
    },
    {
      id: 'card-gen-2',
      title: 'Второе дыхание стойкости',
      trigger: 'Бонусное действие при снижении ОЗ ниже половины',
      effect: 'Восстанавливает 1d4 + бонус мастерства временных ОЗ на 1 минуту.',
      costOrTradeoff: '1 раз за долгий отдых, заменяет черту происхождения',
      ruleEquivalent: 'Tough / Heroic Inspiration',
    },
    {
      id: 'card-gen-3',
      title: 'Тактическое парирование',
      trigger: 'Реакция при получении урона от атаки ближнего боя',
      effect: 'Снижает получаемый урон на 1d6 + модификатор Телосложения.',
      costOrTradeoff: '1 раз за короткий или долгий отдых, заменяет черту происхождения',
      ruleEquivalent: 'Heavy Armor Master / Interception',
    },
  ];
}
