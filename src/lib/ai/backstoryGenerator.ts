import { Character } from '@/types/character';

export interface GenerateBackstoryOptions {
  apiKey?: string;
  model?: string;
  fetchFn?: typeof fetch;
}

const SPECIES_LORE: Record<string, { noun: string; homeland: string; trait: string }> = {
  human: {
    noun: 'человек',
    homeland: 'шумных торговых трактах и пограничных поселениях',
    trait: 'неутомимая тяга к открытиям и несгибаемая воля',
  },
  elf: {
    noun: 'эльф',
    homeland: 'древних вековых дубравах и мерцающих лунных святилищах',
    trait: 'тонкое чутье к магии предков и вековое терпение',
  },
  dwarf: {
    noun: 'дворф',
    homeland: 'гранитных недрах северных цитаделей и подгорных чертогах',
    trait: 'железная стойкость, верность клятвам и тяжесть боевого молота',
  },
  halfling: {
    noun: 'полурослик',
    homeland: 'уютных холмистых долинах и тихих деревушках',
    trait: 'поразительная удача, храброе сердце и легкий шаг',
  },
  gnome: {
    noun: 'гном',
    homeland: 'изобретательских лабораториях и тайных норах механиков',
    trait: 'пытливый ум и тяга к необычным механизмам',
  },
  dragonborn: {
    noun: 'драконорожденный',
    homeland: 'древних клановых твердынях на неприступных скалах',
    trait: 'гордость благородной драконьей крови и пламенное сердце',
  },
  tiefling: {
    noun: 'тифлинг',
    homeland: 'лабиринтах нижних кварталов и полузабытых руинах',
    trait: 'проницательный взгляд, скрывающий наследие непостижимых потусторонних сил',
  },
  orc: {
    noun: 'орк',
    homeland: 'суровых ветреных пустошах и степных стоянках',
    trait: 'неодолимая ярость в битве и безграничная преданность побратимам',
  },
  goliath: {
    noun: 'голиаф',
    homeland: 'ледяных вершинах высочайших горных пиков',
    trait: 'величие первобытной стихии и дух вечного соперничества',
  },
};

const CLASS_LORE: Record<string, { roleTitle: string; call: string; combatStyle: string }> = {
  fighter: {
    roleTitle: 'воин',
    call: 'отточенное мастерство владения сталью и дисциплина строя',
    combatStyle: 'встречать опасность лицом к лицу, прикрывая союзников щитом и сокрушая врагов точными ударами',
  },
  barbarian: {
    roleTitle: 'варвар',
    call: 'зов первобытной дикой силы',
    combatStyle: 'впадать в священную боевую ярость, игнорируя боль и сокрушая любые преграды',
  },
  rogue: {
    roleTitle: 'плут',
    call: 'холодный расчет, бесшумная поступь и знание уязвимых мест',
    combatStyle: 'наносить стремительные удары из тени и мгновенно растворяться во мраке',
  },
  wizard: {
    roleTitle: 'волшебник',
    call: 'неутомимый поиск тайных знаний и изучение древних гримуаров',
    combatStyle: 'плести сложнейшие формулы плетения, превращая слова в сокрушительные вспышки чар',
  },
  cleric: {
    roleTitle: 'жрец',
    call: 'нерушимая вера и благословение высших покровителей',
    combatStyle: 'направлять сияющую божественную энергию для исцеления ран и кары святотатцев',
  },
  druid: {
    roleTitle: 'друид',
    call: 'гармония с первозданной природой и древними духами леса',
    combatStyle: 'призывать силу бури и принимать облик свирепых хищников',
  },
  paladin: {
    roleTitle: 'паладин',
    call: 'священная клятва справедливости и чести',
    combatStyle: 'наполнять клинок божественным возмездием и вдохновлять спутников своей стойкостью',
  },
  ranger: {
    roleTitle: 'следопыт',
    call: 'знание повадок диких тварей и троп неизведанных земель',
    combatStyle: 'разить цель издалека меткими выстрелами и устраивать безупречные засады',
  },
  monk: {
    roleTitle: 'монах',
    call: 'совершенство тела и духа, контроль внутренней энергии ци',
    combatStyle: 'двигаться со скоростью ветра, ошеломляя противников сериями молниеносных ударов',
  },
  bard: {
    roleTitle: 'бард',
    call: 'магия созидательного слова и вдохновляющая музыка',
    combatStyle: 'манипулировать эмоциями врагов и сплетать заклинания прямо в ритме боя',
  },
  sorcerer: {
    roleTitle: 'чародей',
    call: 'врожденный дар магии, бурлящий в самой крови',
    combatStyle: 'высвобождать первозданные потоки энергии по наитию и зову сердца',
  },
  warlock: {
    roleTitle: 'колдун',
    call: 'таинственный договор с могущественной сущностью из иных планов',
    combatStyle: 'разить потусторонними мистическими зарядами и применять запретные чары',
  },
};

const BACKGROUND_LORE: Record<string, string> = {
  soldier: 'Проведя годы на гарнизонной службе и пережив немало кровавых осад, герой знает цену армейскому братству и строгому уставу.',
  criminal: 'Прошлое в темных переулках и тайных гильдиях научило доверять лишь собственной интуиции и всегда оставлять путь к отступлению.',
  sage: 'Долгие ночи, проведенные в пыльных архивах и башнях мудрецов, приоткрыли завесу над забытыми тайнами ушедших эпох.',
  acolyte: 'Годы служения в древнем храме укрепили дух и научили видеть знаки провидения даже в самые темные времена.',
  artisan: 'Привычка доводить любое дело до идеала и острый глаз мастера позволяют находить изъяны в чужой броне и оружии.',
  guard: 'Опыт несения караула на городских воротах воспитал бдительность и умение распознавать дурные намерения в толпе.',
  guide: 'Путешествия по диким топям и забытым трактам закалили характер и научили читать следы природы как открытую книгу.',
  wayfarer: 'Дорожная пыль и смена бесчисленных караванов стали вторым домом, в котором нет места праздности и страху.',
  noble: 'Высокое происхождение и придворные интриги научили держать осанку, но зов настоящих подвигов оказался сильнее праздной роскоши.',
};

/**
 * Generates an atmospheric 2-3 paragraph Russian backstory connecting race, class, background, and custom quirk.
 */
export async function generateBackstory(
  character: Partial<Character>,
  options: GenerateBackstoryOptions = {}
): Promise<string> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const aiStory = await callGeminiBackstory(character, apiKey, options);
      if (aiStory && aiStory.trim().length >= 100) {
        return aiStory.trim();
      }
    } catch {
      // Fall through to deterministic template engine
    }
  }

  return generateTemplateBackstory(character);
}

/**
 * Calls Google Gemini REST API to craft an atmospheric narrative backstory.
 */
async function callGeminiBackstory(
  character: Partial<Character>,
  apiKey: string,
  options: GenerateBackstoryOptions
): Promise<string | null> {
  const fetchImpl = options.fetchFn || globalThis.fetch;
  const model = options.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `Ты — опытный писатель фэнтези и Мастер Подземелий (Dungeon Master) в D&D 2024.
Напиши живую, атмосферную и глубокую предысторию персонажа на русском языке (ровно 2-3 связных абзаца, разделенных пустой строкой).

Параметры персонажа:
- Имя: ${character.name || 'Безымянный герой'}
- Пол: ${character.gender || 'Не указан'}
- Внешность и приметы: ${
    character.appearance
      ? [
          character.appearance.age,
          character.appearance.build,
          character.appearance.hairAndEyes,
          character.appearance.distinguishingFeatures,
        ]
          .filter(Boolean)
          .join(', ')
      : 'Не указаны'
  }
- Наследие (Species): ${character.species || 'Человек'}
- Класс: ${character.characterClass || 'Воин'}
- Предыстория: ${character.background || 'Солдат'}
- Черта происхождения: ${character.originFeat || 'Savage Attacker'}
- Уникальная особенность / механика: ${
    character.customMechanic
      ? `"${character.customMechanic.title}": ${character.customMechanic.effect}`
      : 'Нет'
  }

Требования:
1. Пиши красивым литературным языком без банальных штампов и без канцеляризмов.
2. Логично свяжи расовое происхождение, прежнее ремесло (предысторию) и пробуждение способностей класса.
3. Обязательно вплети уникальную особенность / способность как часть его судьбы или пережитого события.
4. Закончи абзацем, объясняющим, почему герой покинул привычную жизнь и отправился навстречу опасностям настольного приключения.`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.8,
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

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
}

/**
 * Rich offline narrative template generator for Russian backstories.
 */
function generateTemplateBackstory(character: Partial<Character>): string {
  const name = character.name || 'Безымянный странник';
  const speciesKey = (character.species || 'human').toLowerCase();
  const classKey = (character.characterClass || 'fighter').toLowerCase();
  const bgKey = (character.background || 'soldier').toLowerCase();

  const speciesInfo = SPECIES_LORE[speciesKey] || {
    noun: 'представитель древнего рода',
    homeland: 'далеких неизведанных краях',
    trait: 'неукротимое стремление следовать собственной судьбе',
  };

  const classInfo = CLASS_LORE[classKey] || {
    roleTitle: 'искатель приключений',
    call: 'зов великих свершений',
    combatStyle: 'действовать решительно в пылу любого противостояния',
  };

  const bgStory =
    BACKGROUND_LORE[bgKey] ||
    'Трудности прежней жизни закалили характер героя и научили полагаться на верных спутников.';

  // Paragraph 1: Origins & Background
  const p1 = `${name} — ${speciesInfo.noun}, чья юность прошла среди ${speciesInfo.homeland}. ${speciesInfo.trait.charAt(0).toUpperCase() + speciesInfo.trait.slice(1)} выделяли героя среди сородичей еще до того, как судьба сделала свой первый крутой поворот. ${bgStory}`;

  // Paragraph 2: Class Calling & Path
  const p2 = `Путь, который избрал ${name}, превратил героя в истинного представителя своего дела — это ${classInfo.roleTitle}, для которого главным ориентиром стал ${classInfo.call}. На поле брани и в смертельных испытаниях его кредо — ${classInfo.combatStyle}.`;

  // Paragraph 3: Custom Quirk / Adventure Catalyst
  let p3: string;
  if (character.customMechanic) {
    const quirk = character.customMechanic;
    p3 = `Переломным моментом в жизни героя стало проявление редкого дара — «${quirk.title}». В миг предельной опасности эта способность (${quirk.effect.toLowerCase()}) спасла не одну жизнь и навсегда изменила его понимание собственных сил. Оставив прошлое позади, ${name} отправляется в путь навстречу неизвестности, готовый бросить вызов древним тайнам и великим угрозам нового мира.`;
  } else {
    p3 = `Теперь, когда старые клятвы исполнены, а на горизонте сгущаются тени новых испытаний, ${name} собирает походное снаряжение. Впереди ждут неизведанные подземелья, верные соратники и слава, о которой еще сложат легенды менестрели грядущих эпох.`;
  }

  return `${p1}\n\n${p2}\n\n${p3}`;
}
