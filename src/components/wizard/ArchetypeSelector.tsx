'use client';

import React, { useState } from 'react';
import {
  Shield,
  Sword,
  Flame,
  Heart,
  EyeOff,
  Sparkles,
  Sun,
  User,
  Moon,
  Hammer,
  Smile,
  Zap,
  Dice5,
  Check,
  LucideIcon,
} from 'lucide-react';
import { ArchetypeSelection } from '@/types/archetype';
import {
  ARCHETYPE_ROLES,
  ARCHETYPE_POWER_SOURCES,
  ARCHETYPE_SPECIES,
} from '@/lib/dnd2024/archetypes';
import { PersonalityQuiz } from './PersonalityQuiz';

export interface ArchetypeSelectorProps {
  selection: ArchetypeSelection;
  onChange: (selection: ArchetypeSelection) => void;
  subStep?: 'role' | 'power' | 'species' | 'name';
  onSubStepChange?: (subStep: 'role' | 'power' | 'species' | 'name') => void;
  onNext?: () => void;
  onBack?: () => void;
  initialMode?: 'quiz' | 'manual';
}

// Icon mapping dictionary
const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Sword,
  Flame,
  Heart,
  EyeOff,
  Sparkles,
  Sun,
  User,
  Moon,
  Hammer,
  Smile,
  Zap,
};

// Evocative Russian subtitles and badges for role archetypes
const ROLE_BADGES: Record<string, { badge: string; accentClass: string }> = {
  tank: { badge: 'Стальной щит', accentClass: 'border-blue-500/40 text-blue-400 bg-blue-950/30' },
  striker: { badge: 'Теневой клинок', accentClass: 'border-rose-500/40 text-rose-400 bg-rose-950/30' },
  blaster: { badge: 'Штормовой вихрь', accentClass: 'border-purple-500/40 text-purple-400 bg-purple-950/30' },
  support: { badge: 'Свет надежды', accentClass: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30' },
};

const SUGGESTED_NAMES = [
  'Торин',
  'Бран',
  'Элоир',
  'Варис',
  'Лира',
  'Каэлин',
  'Дракомир',
  'Сильвана',
  'Кормак',
  'Морвен',
  'Гримли',
  'Элион',
];

export const ArchetypeSelector: React.FC<ArchetypeSelectorProps> = ({
  selection,
  onChange,
  subStep = 'role',
  onSubStepChange,
  onNext,
  onBack,
  initialMode = 'quiz',
}) => {
  const [mode, setMode] = useState<'quiz' | 'manual'>(initialMode);

  const handleSelectRole = (roleId: string) => {
    onChange({ ...selection, roleId });
    if (onSubStepChange) {
      onSubStepChange('power');
    }
  };

  const handleSelectPowerSource = (powerSourceId: string) => {
    onChange({ ...selection, powerSourceId });
    if (onSubStepChange) {
      onSubStepChange('species');
    }
  };

  const handleSelectSpecies = (speciesId: string) => {
    onChange({ ...selection, speciesId });
  };

  const handleRandomizeName = () => {
    const random = SUGGESTED_NAMES[Math.floor(Math.random() * SUGGESTED_NAMES.length)];
    onChange({ ...selection, characterName: random });
  };

  return (
    <div className="w-full space-y-6">
      {/* Creation Mode Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
          <button
            type="button"
            data-testid="mode-quiz-btn"
            onClick={() => setMode('quiz')}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              mode === 'quiz'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Сюжетный тест (10 вопросов)</span>
          </button>
          <button
            type="button"
            data-testid="mode-manual-btn"
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              mode === 'manual'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Выбор вручную</span>
          </button>
        </div>
      </div>

      {mode === 'quiz' ? (
        <PersonalityQuiz
          initialSelection={selection}
          onComplete={(quizSel) => {
            onChange({ ...selection, ...quizSel });
            if (onNext) onNext();
          }}
          onSwitchToManual={() => setMode('manual')}
        />
      ) : (
        <>
          {/* SubStep 1: Role Selection */}
      {subStep === 'role' && (
        <section aria-label="Выбор роли" className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase tracking-widest text-amber-400/90 font-medium">
              Шаг 1 • Боевой стиль
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
              Какова ваша роль в отряде?
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Выберите, как вы предпочитаете действовать в пылу битвы и приключения.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {ARCHETYPE_ROLES.map((role) => {
              const isSelected = selection.roleId === role.id;
              const IconComp = (role.icon && ICON_MAP[role.icon]) || Shield;
              const badgeMeta = ROLE_BADGES[role.id] || {
                badge: role.name,
                accentClass: 'border-amber-500/40 text-amber-400 bg-amber-950/30',
              };

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role.id)}
                  className={`relative p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer min-h-[140px] flex flex-col justify-between group ${
                    isSelected
                      ? 'border-amber-400 bg-slate-900/90 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/80'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg border ${
                          isSelected
                            ? 'border-amber-400/50 bg-amber-500/10 text-amber-300'
                            : 'border-slate-800 bg-slate-950 text-slate-300 group-hover:text-amber-400'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-lg text-slate-100">
                            {role.name}
                          </span>
                        </div>
                        <span
                          className={`inline-block text-xs px-2 py-0.5 mt-1 rounded-full border font-medium ${badgeMeta.accentClass}`}
                        >
                          {badgeMeta.badge}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* SubStep 2: Power Source Selection */}
      {subStep === 'power' && (
        <section aria-label="Источник силы" className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase tracking-widest text-amber-400/90 font-medium">
              Шаг 2 • Природа мастерства
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
              Источник вашей силы
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Откуда берутся ваши невероятные умения, заклинания или боевое мастерство?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {ARCHETYPE_POWER_SOURCES.map((power) => {
              const isSelected = selection.powerSourceId === power.id;
              const IconComp = (power.icon && ICON_MAP[power.icon]) || Sparkles;

              return (
                <button
                  key={power.id}
                  type="button"
                  onClick={() => handleSelectPowerSource(power.id)}
                  className={`relative p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer min-h-[130px] flex flex-col justify-between group ${
                    isSelected
                      ? 'border-amber-400 bg-slate-900/90 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/80'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg border ${
                          isSelected
                            ? 'border-amber-400/50 bg-amber-500/10 text-amber-300'
                            : 'border-slate-800 bg-slate-950 text-slate-300 group-hover:text-amber-400'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="font-serif font-bold text-base sm:text-lg text-slate-100">
                        {power.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {power.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              Назад
            </button>
          </div>
        </section>
      )}

      {/* SubStep 3: Species & Name */}
      {(subStep === 'species' || subStep === 'name') && (
        <section aria-label="Происхождение и имя" className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase tracking-widest text-amber-400/90 font-medium">
              Шаг 3 • Наследие героя
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
              Выберите происхождение и имя
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Народ персонажа определяет физические черты и особое наследие D&D 2024.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ARCHETYPE_SPECIES.map((species) => {
              const isSelected = selection.speciesId === species.id;
              const IconComp = (species.icon && ICON_MAP[species.icon]) || User;

              return (
                <button
                  key={species.id}
                  type="button"
                  onClick={() => handleSelectSpecies(species.id)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-amber-400 bg-slate-900/90 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/80'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-lg border ${
                        isSelected
                          ? 'border-amber-400/50 bg-amber-500/10 text-amber-300'
                          : 'border-slate-800 bg-slate-950 text-slate-300 group-hover:text-amber-400'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="font-serif font-semibold text-sm sm:text-base text-slate-100 mt-2">
                    {species.name}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {species.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Name input */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2">
            <label
              htmlFor="character-name-input"
              className="block text-xs font-medium text-slate-300 tracking-wide uppercase"
            >
              Имя персонажа
            </label>
            <div className="flex gap-2">
              <input
                id="character-name-input"
                type="text"
                placeholder="Имя персонажа (например: Торин)"
                value={selection.characterName || ''}
                onChange={(e) => onChange({ ...selection, characterName: e.target.value })}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm"
              />
              <button
                type="button"
                onClick={handleRandomizeName}
                title="Случайное имя"
                className="px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
              >
                <Dice5 className="w-4 h-4" />
                <span className="hidden sm:inline">Случайно</span>
              </button>
            </div>
          </div>

          {/* Gender Selection */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2">
            <label className="block text-xs font-medium text-slate-300 tracking-wide uppercase">
              Пол персонажа
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Мужской', label: '👨 Мужской' },
                { id: 'Женский', label: '👩 Женский' },
                { id: 'Небинарный', label: '✨ Небинарный' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...selection,
                      gender: g.id,
                      appearance: { ...selection.appearance, gender: g.id },
                    })
                  }
                  className={`py-2 px-3 rounded-lg border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    (selection.gender || 'Мужской') === g.id
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Appearance Customization */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Внешность и приметы
              </label>
              <span className="text-[11px] text-slate-500">Для портрета и предыстории</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Возраст:</span>
                <input
                  type="text"
                  placeholder="25 лет"
                  value={selection.appearance?.age || ''}
                  onChange={(e) =>
                    onChange({
                      ...selection,
                      appearance: { ...selection.appearance, age: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs text-slate-200 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Телосложение:</span>
                <input
                  type="text"
                  placeholder="Атлетичное, жилистое"
                  value={selection.appearance?.build || ''}
                  onChange={(e) =>
                    onChange({
                      ...selection,
                      appearance: { ...selection.appearance, build: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs text-slate-200 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Волосы и глаза:</span>
              <input
                type="text"
                placeholder="Смоляные черные волосы, серые глаза"
                value={selection.appearance?.hairAndEyes || ''}
                onChange={(e) =>
                  onChange({
                    ...selection,
                    appearance: { ...selection.appearance, hairAndEyes: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs text-slate-200 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Особые приметы и шрамы:</span>
              <input
                type="text"
                placeholder="Боевой шрам через бровь, татуировки"
                value={selection.appearance?.distinguishingFeatures || ''}
                onChange={(e) =>
                  onChange({
                    ...selection,
                    appearance: { ...selection.appearance, distinguishingFeatures: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs text-slate-200 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Далее
            </button>
          </div>
        </section>
      )}
        </>
      )}
    </div>
  );
};
