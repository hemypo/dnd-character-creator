import { QuizQuestion, QuizResult } from '@/types/archetype';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Блок 1: Мировоззрение (3 вопроса)
  {
    id: 'q1_law_justice',
    category: 'alignment',
    categoryTitle: 'Мировоззрение • Закон и справедливость',
    question: 'Городская стража преследует нищего подростка, укравшего хлеб для голодной семьи. Твои действия?',
    options: [
      {
        id: 'q1_lawful',
        title: 'Задержать вора и передать страже',
        description: 'Закон суров, но без единого порядка общество рухнет в хаос и грабежи.',
        scores: { lawChaos: 'lawful' },
      },
      {
        id: 'q1_chaotic',
        title: 'Отвлечь стражу и дать беглецу скрыться',
        description: 'Законы знати слепы к человеческим страданиям. Справедливость выше указов.',
        scores: { lawChaos: 'chaotic' },
      },
      {
        id: 'q1_neutral',
        title: 'Заплатить торговцу из своего кошелька',
        description: 'Уладить спор миром без насилия и лишнего шума, не нарушая устоев.',
        scores: { lawChaos: 'neutral' },
      },
      {
        id: 'q1_pragmatic',
        title: 'Не вмешиваться и пройти мимо',
        description: 'У каждого своя судьба в трущобах. Чужие распри меня не касаются.',
        scores: { lawChaos: 'neutral', goodEvil: 'neutral' },
      },
      {
        id: 'q1_ruthless',
        title: 'Указать страже на беглеца и потребовать долю награды',
        description: 'В трущобах выживают сильные. За чужую беспечность нужно платить звонкой монетой.',
        scores: { lawChaos: 'chaotic', goodEvil: 'evil' },
      },
    ],
  },
  {
    id: 'q2_cost_of_victory',
    category: 'alignment',
    categoryTitle: 'Мировоззрение • Цена победы',
    question: 'Чтобы остановить темных культистов, угрожающих столице, необходимо взорвать древнюю дамбу, что затопит нищую деревню. Что ты решишь?',
    options: [
      {
        id: 'q2_good',
        title: 'Никаких жертв среди невинных',
        description: 'Мы найдем другой путь к победе, даже если придется рисковать жизнями всего нашего отряда.',
        scores: { goodEvil: 'good' },
      },
      {
        id: 'q2_neutral',
        title: 'Взорвать дамбу: гибель десятков оправдана спасением тысяч',
        description: 'Суровый трезвый расчет полководца. Меньшее зло ради спасения королевства.',
        scores: { goodEvil: 'neutral', lawChaos: 'neutral' },
      },
      {
        id: 'q2_evil',
        title: 'Использовать суматоху затопления для личной выгоды',
        description: 'Пока все спасаются бегством, забрать реликвии и казну культистов себе.',
        scores: { goodEvil: 'evil' },
      },
    ],
  },
  {
    id: 'q3_word_of_honor',
    category: 'alignment',
    categoryTitle: 'Мировоззрение • Слово чести',
    question: 'Ты дал нерушимую клятву заклятому врагу, но выполнение обещания поставит под угрозу твои личные планы. Как поступишь?',
    options: [
      {
        id: 'q3_lawful',
        title: 'Клятва нерушима. Мое слово тверже стали',
        description: 'Честь и данное слово — единственное, что отличает воина от дикого зверя.',
        scores: { lawChaos: 'lawful' },
      },
      {
        id: 'q3_chaotic',
        title: 'Обстоятельства изменились, а злодей не заслуживает благородства',
        description: 'Глупо связывать себе руки обещанием перед подлецом.',
        scores: { lawChaos: 'chaotic' },
      },
      {
        id: 'q3_neutral',
        title: 'Найти юридическую лазейку в формулировке',
        description: 'Формально выполнить обещание, но вывернуть результат в свою пользу.',
        scores: { lawChaos: 'neutral' },
      },
      {
        id: 'q3_betrayal',
        title: 'Ударить врага в спину, пока он ждет исполнения клятвы',
        description: 'Клятвы придуманы глупцами. Побеждает тот, кто бьет первым и без жалости.',
        scores: { lawChaos: 'chaotic', goodEvil: 'evil' },
      },
    ],
  },

  // Блок 2: Боевой стиль и Класс (3 вопроса)
  {
    id: 'q4_first_strike',
    category: 'combat',
    categoryTitle: 'Боевая роль • Тактика первого удара',
    question: 'Впереди укрепленный лагерь разбойников. Каков твой план атаки?',
    options: [
      {
        id: 'q4_tank',
        title: 'Прямой штурм щитом вперед',
        description: 'Выйти на открытое место, издать громогласный клич и принять стрелы на прочные латы.',
        scores: { role: 'tank', powerSource: 'martial' },
      },
      {
        id: 'q4_striker',
        title: 'Бесшумный удар из тени',
        description: 'Обойти часовых по скалам, зайти с тыла и точным ударом клинка устранить главаря.',
        scores: { role: 'striker', powerSource: 'shadow' },
      },
      {
        id: 'q4_blaster',
        title: 'Разрушительный магический залп с дистанции',
        description: 'Испепелить укрепления огненным шаром или градом молний, пока они не поняли, откуда удар.',
        scores: { role: 'blaster', powerSource: 'arcane' },
      },
      {
        id: 'q4_support',
        title: 'Благословение отряда и защита тылов',
        description: 'Укрепить дух союзников священной молитвой, воодушевить клинки и готовиться врачевать раны.',
        scores: { role: 'support', powerSource: 'divine' },
      },
    ],
  },
  {
    id: 'q5_power_source',
    category: 'combat',
    categoryTitle: 'Боевая роль • Источник силы',
    question: 'Что наполняет тебя мощью, когда дыхание перехватывает, а сил почти не осталось?',
    options: [
      {
        id: 'q5_martial',
        title: 'Стальная воля, дисциплина и память сотен часов тренировок',
        description: 'Никаких чар — только верный клинок, надежные доспехи и боевое братство.',
        scores: { powerSource: 'martial', role: 'tank' },
      },
      {
        id: 'q5_shadow',
        title: 'Ловкость, знание слабых точек и инстинкт выживания',
        description: 'Быстрее мысли, тише дыхания. Там, где бессилен топор, решает точный кинжал.',
        scores: { powerSource: 'shadow', role: 'striker' },
      },
      {
        id: 'q5_arcane',
        title: 'Тайные законы мироздания и формула древнего заклинания',
        description: 'Знание — абсолютная сила. Реальность податлива для того, кто знает истинные имена стихий.',
        scores: { powerSource: 'arcane', role: 'blaster' },
      },
      {
        id: 'q5_divine',
        title: 'Священный свет богов или первозданная сила природы',
        description: 'Я проводник высшей воли. Вера и заветы предков хранят меня от гибели.',
        scores: { powerSource: 'divine', role: 'support' },
      },
    ],
  },
  {
    id: 'q6_weapon_choice',
    category: 'combat',
    categoryTitle: 'Боевая роль • Верное оружие',
    question: 'Какое оружие кажется естественным продолжением твоих рук?',
    options: [
      {
        id: 'q6_sword_shield',
        title: 'Полуторный меч и большой боевой щит',
        description: 'Классическое снаряжение рыцарей и стражей рубежей.',
        scores: { role: 'tank', powerSource: 'martial' },
      },
      {
        id: 'q6_daggers_bow',
        title: 'Парные стилеты или длинный композитный лук',
        description: 'Бесшумное и смертоносное оружие охотников и лазутчиков.',
        scores: { role: 'striker', powerSource: 'shadow' },
      },
      {
        id: 'q6_staff_grimoire',
        title: 'Кристаллический посох или кожаный гримуар',
        description: 'Инструмент концентрации эфирных энергий и сотворения чар.',
        scores: { role: 'blaster', powerSource: 'arcane' },
      },
      {
        id: 'q6_mace_symbol',
        title: 'Освященный боевой молот или золотой священный амулет',
        description: 'Оружие, несущее кару грешникам и исцеление страждущим.',
        scores: { role: 'support', powerSource: 'divine' },
      },
    ],
  },

  // Блок 3: Предыстория и Навыки (2 вопроса)
  {
    id: 'q7_past_life',
    category: 'background',
    categoryTitle: 'Происхождение • Прошлая жизнь',
    question: 'Где и кем ты был до того, как зов приключений вывел тебя на большую дорогу?',
    options: [
      {
        id: 'q7_soldier',
        title: 'В гарнизонных казармах на границе империи',
        description: 'Суровый армейский уклад, строевой шаг, запах походного костра и звон железа.',
        scores: { background: 'soldier', role: 'tank' },
      },
      {
        id: 'q7_sage',
        title: 'В пыльных залах Великой библиотеки и обсерватории',
        description: 'Годы чтения древних свитков, составления звездных карт и поиска забытых истин.',
        scores: { background: 'sage', powerSource: 'arcane' },
      },
      {
        id: 'q7_criminal',
        title: 'В темных закоулках и на крышах портового города',
        description: 'Уличная школа выживания, скрытные гильдии воров и знание тайных ходов.',
        scores: { background: 'criminal', powerSource: 'shadow' },
      },
      {
        id: 'q7_acolyte',
        title: 'При монастыре или уединенном лесном святилище',
        description: 'Молитвы на рассвете, уход за ранеными паломниками и обеты служения свету.',
        scores: { background: 'acolyte', powerSource: 'divine' },
      },
      {
        id: 'q7_guide',
        title: 'На неизведанных охотничьих тропах диких земель',
        description: 'Жизнь под открытым небом, чтение следов дичи и умение выживать в буран.',
        scores: { background: 'guide' },
      },
    ],
  },
  {
    id: 'q8_relic_habit',
    category: 'background',
    categoryTitle: 'Происхождение • Памятная вещь',
    question: 'Какую памятную вещь ты бережно хранишь на дне своего заплечного мешка?',
    options: [
      {
        id: 'q8_whetstone',
        title: 'Стальной армейский жетон и точильный брусок',
        description: 'Память о погибшем боевом наставнике и долге перед товарищами.',
        scores: { background: 'soldier' },
      },
      {
        id: 'q8_puzzle_book',
        title: 'Запечатанный фолиант с нераскрытой тайной',
        description: 'Рукопись на забытом мертвом наречии, оставленная исчезнувшим учителем.',
        scores: { background: 'sage' },
      },
      {
        id: 'q8_thieves_tools',
        title: 'Искусный набор тончайших отмычек и фальшивая печать',
        description: 'Инструменты, которые не раз выручали из самых безнадежных темниц.',
        scores: { background: 'criminal' },
      },
      {
        id: 'q8_holy_symbol',
        title: 'Серебряный символ божества и ладанница',
        description: 'Освященная реликвия, дарующая покой даже в самую темную ночь.',
        scores: { background: 'acolyte' },
      },
    ],
  },

  // Блок 4: Раса и Наследие (1 вопрос)
  {
    id: 'q9_heritage_blood',
    category: 'species',
    categoryTitle: 'Наследие • Голос предков',
    question: 'Чей зов предков сильнее всего откликается в твоем сердце?',
    options: [
      {
        id: 'q9_human',
        title: 'Человек — неукротимая воля к жизни и стремление к невозможному',
        description: 'Адаптивность, дерзость и способность преуспеть в любом начинании.',
        scores: { species: 'human' },
      },
      {
        id: 'q9_elf',
        title: 'Эльф — вековая грация, мудрость вечных лесов и звездный свет',
        description: 'Острый слух, врожденная магия и способность видеть сквозь ночной мрак.',
        scores: { species: 'elf' },
      },
      {
        id: 'q9_dwarf',
        title: 'Дварф — стойкость гранита, жар кузнечного горна и верность клану',
        description: 'Несокрушимое здоровье, устойчивость к ядам и врожденное чутье к камню.',
        scores: { species: 'dwarf' },
      },
      {
        id: 'q9_tiefling',
        title: 'Тифлинг — опасное пламя потустороннего наследия и гордый бунт',
        description: 'Огненное сопротивление, темное зрение и врожденные колдовские искры.',
        scores: { species: 'tiefling' },
      },
      {
        id: 'q9_halfling',
        title: 'Полурослик — бесстрашное сердце, проворство и невероятное везение',
        description: 'Умение увернуться от беды в самый критический миг и повернуть судьбу вспять.',
        scores: { species: 'halfling' },
      },
      {
        id: 'q9_dragonborn',
        title: 'Драконорожденный — величие драконьего рода и стихийное дыхание',
        description: 'Грозная поступь предков, разрушительный конус стихии и несокрушимая гордость.',
        scores: { species: 'dragonborn' },
      },
    ],
  },
  {
    id: 'q10_elemental_calling',
    category: 'species',
    categoryTitle: 'Наследие • Родная стихия и дом',
    question: 'В каком пейзаже твой дух обретает абсолютную силу, спокойствие и гармонию?',
    options: [
      {
        id: 'q10_human',
        title: 'Шумный перекресток торговых трактов и бурлящие города',
        description: 'Энергия сотен ремесел, амбиции, звон монет и стремление переписать историю.',
        scores: { species: 'human' },
      },
      {
        id: 'q10_elf',
        title: 'Вековой зачарованный лес под сиянием лунных созвездий',
        description: 'Шелест листьев, древняя гармония с природой и неторопливое течение веков.',
        scores: { species: 'elf' },
      },
      {
        id: 'q10_dwarf',
        title: 'Глубинные каменные чертоги и гул кузнечных молотов',
        description: 'Монолит горных глубин, жар плавилен и тяжесть драгоценной руды.',
        scores: { species: 'dwarf' },
      },
      {
        id: 'q10_tiefling',
        title: 'Багровый сумрак на стыке стихийных и теневых планов',
        description: 'Эфирные бури, запретное пламя бездны и бунтующая искра магии.',
        scores: { species: 'tiefling' },
      },
      {
        id: 'q10_halfling',
        title: 'Зеленые залитые солнцем холмы, сады и уютные трактиры',
        description: 'Радость простых удовольствий, песни у очага и безопасное гостеприимство.',
        scores: { species: 'halfling' },
      },
      {
        id: 'q10_dragonborn',
        title: 'Неприступные скалистые пики, открытые свирепым бурям',
        description: 'Рев штормового ветра, молнии в вышине и первозданная мощь предков-драконов.',
        scores: { species: 'dragonborn' },
      },
    ],
  },
];

const SUGGESTED_NAMES_BY_SPECIES: Record<string, string[]> = {
  human: ['Бран', 'Роланд', 'Лира', 'Алексис', 'Варис', 'Морвен'],
  elf: ['Эладриэль', 'Каэлин', 'Сильвана', 'Аластор', 'Ириэль', 'Леголас'],
  dwarf: ['Брунор', 'Торин', 'Хельга', 'Гримли', 'Двальгор', 'Балин'],
  tiefling: ['Мортис', 'Азраил', 'Каллиста', 'Малаки', 'Веспер', 'Никта'],
  halfling: ['Финдо', 'Меррик', 'Белла', 'Роско', 'Таппи', 'Пиппин'],
  dragonborn: ['Дракомир', 'Балазар', 'Каладор', 'Нарракс', 'Тиамат', 'Рейгар'],
};

/**
 * Evaluates all user answers and computes optimal D&D 2024 traits.
 */
export function evaluateQuiz(answers: Record<string, string>): QuizResult {
  let lawScore = 0;
  let goodScore = 0;

  const roleCounts: Record<string, number> = { tank: 0, striker: 0, blaster: 0, support: 0 };
  const powerCounts: Record<string, number> = { martial: 0, shadow: 0, arcane: 0, divine: 0 };
  const backgroundCounts: Record<string, number> = {};
  const speciesCounts: Record<string, number> = {};

  for (const question of QUIZ_QUESTIONS) {
    const selectedOptionId = answers[question.id];
    if (!selectedOptionId) continue;

    const option = question.options.find((o) => o.id === selectedOptionId);
    if (!option) continue;

    const { scores } = option;

    if (scores.lawChaos === 'lawful') lawScore += 1;
    if (scores.lawChaos === 'chaotic') lawScore -= 1;

    if (scores.goodEvil === 'good') goodScore += 1;
    if (scores.goodEvil === 'evil') goodScore -= 1;

    if (scores.role) roleCounts[scores.role] = (roleCounts[scores.role] || 0) + 1;
    if (scores.powerSource) powerCounts[scores.powerSource] = (powerCounts[scores.powerSource] || 0) + 1;
    if (scores.background) backgroundCounts[scores.background] = (backgroundCounts[scores.background] || 0) + 1;
    if (scores.species) speciesCounts[scores.species] = (speciesCounts[scores.species] || 0) + 1;
  }

  // Calculate Alignment
  let lawChaosPart = 'Нейтрально';
  if (lawScore > 0) lawChaosPart = 'Законно';
  if (lawScore < 0) lawChaosPart = 'Хаотично';

  let goodEvilPart = 'нейтральный';
  if (goodScore > 0) goodEvilPart = 'добрый';
  if (goodScore < 0) goodEvilPart = 'злой';

  let alignment = `${lawChaosPart}-${goodEvilPart}`;
  if (lawChaosPart === 'Нейтрально' && goodEvilPart === 'нейтральный') {
    alignment = 'Истинно-нейтральный';
  }

  // Dominant Role
  const roleId = (Object.keys(roleCounts).reduce((a, b) => (roleCounts[a] >= roleCounts[b] ? a : b), 'tank')) as
    | 'tank'
    | 'striker'
    | 'blaster'
    | 'support';

  // Dominant Power Source
  const powerSourceId = (Object.keys(powerCounts).reduce((a, b) => (powerCounts[a] >= powerCounts[b] ? a : b), 'martial')) as
    | 'martial'
    | 'shadow'
    | 'arcane'
    | 'divine';

  // Dominant Species
  const speciesId = Object.keys(speciesCounts).reduce((a, b) => (speciesCounts[a] >= speciesCounts[b] ? a : b), 'human');

  // Dominant Background
  const backgroundId = Object.keys(backgroundCounts).reduce((a, b) => (backgroundCounts[a] >= backgroundCounts[b] ? a : b), 'soldier');

  // Random suggested name from dominant species
  const namePool = SUGGESTED_NAMES_BY_SPECIES[speciesId] || SUGGESTED_NAMES_BY_SPECIES.human;
  const characterName = namePool[Math.floor(Math.random() * namePool.length)];

  // Summary title
  const summaryTitle = `${alignment} герой пути ${speciesId}`;
  const summaryDescription = `По результатам испытаний ваш дух тяготеет к мировоззрению «${alignment}». Ваша роль — ${roleId}, а источником сил служит ${powerSourceId}.`;

  return {
    alignment,
    roleId,
    powerSourceId,
    speciesId,
    backgroundId,
    characterName,
    summaryTitle,
    summaryDescription,
  };
}
