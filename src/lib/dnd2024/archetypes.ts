import { ArchetypeOption } from '@/types/archetype';

export const ARCHETYPE_ROLES: ArchetypeOption[] = [
  {
    id: 'tank',
    name: 'Защитник (Танк)',
    description: 'Несокрушимый щит отряда. Защищает союзников, принимает удары на себя и удерживает строй.',
    icon: 'Shield',
    recommendedClass: 'fighter',
  },
  {
    id: 'striker',
    name: 'Штурмовик (Смертоносный урон)',
    description: 'Наносит сокрушительный урон точечным ударом. Быстр, опасен и смертоносен.',
    icon: 'Sword',
    recommendedClass: 'rogue',
  },
  {
    id: 'blaster',
    name: 'Заклинатель (Магический урон)',
    description: 'Испепеляет группы врагов мощными площадными заклинаниями и тайной магией.',
    icon: 'Flame',
    recommendedClass: 'wizard',
  },
  {
    id: 'support',
    name: 'Хранитель (Поддержка и лечение)',
    description: 'Исцеляет раны союзников, накладывает благословения и спасает от гибели.',
    icon: 'Heart',
    recommendedClass: 'cleric',
  },
];

export const ARCHETYPE_POWER_SOURCES: ArchetypeOption[] = [
  {
    id: 'martial',
    name: 'Воинское мастерство',
    description: 'Сталь, тяжелые доспехи, строгая дисциплина и филигранное владение оружием.',
    icon: 'Shield',
    recommendedClass: 'fighter',
  },
  {
    id: 'shadow',
    name: 'Тень и скрытность',
    description: 'Бесшумные шаги, скрытые клинки, хитрость, яды и неожиданные удары из темноты.',
    icon: 'EyeOff',
    recommendedClass: 'rogue',
  },
  {
    id: 'arcane',
    name: 'Тайная магия (Аркана)',
    description: 'Изучение древних свитков, управление стихиями и изменение ткани реальности.',
    icon: 'Sparkles',
    recommendedClass: 'wizard',
  },
  {
    id: 'divine',
    name: 'Божественная благодать',
    description: 'Священная вера, молитвы к богам и благословенный свет, изгоняющий тьму.',
    icon: 'Sun',
    recommendedClass: 'cleric',
  },
];

export const ARCHETYPE_SPECIES: ArchetypeOption[] = [
  {
    id: 'human',
    name: 'Человек',
    description: 'Адаптивный, изобретательный и целеустремленный. Отлично проявляет себя на любом пути.',
    icon: 'User',
  },
  {
    id: 'elf',
    name: 'Эльф',
    description: 'Грациозный народец с острым слухом, темным зрением и защитой от усыпляющих чар.',
    icon: 'Moon',
  },
  {
    id: 'dwarf',
    name: 'Дварф',
    description: 'Крепкий житель каменных залов, обладающий невероятной стойкостью и устойчивостью к ядам.',
    icon: 'Hammer',
  },
  {
    id: 'tiefling',
    name: 'Тифлинг',
    description: 'Несет в себе наследие потустороннего пламени, темное зрение и врожденное колдовство.',
    icon: 'Flame',
  },
  {
    id: 'halfling',
    name: 'Полурослик',
    description: 'Ловкий и удачливый малый народец. Не знает страха и способен перебросить критический провал.',
    icon: 'Smile',
  },
  {
    id: 'dragonborn',
    name: 'Драконорожденный',
    description: 'Гордый потомок драконов, наделенный разрушительным дыхательным оружием.',
    icon: 'Zap',
  },
];
