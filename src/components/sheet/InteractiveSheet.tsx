'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Shield,
  Zap,
  Footprints,
  Award,
  Download,
  Share2,
  Sparkles,
  BookOpen,
  Plus,
  Minus,
  Scroll,
  Key,
  User,
  Loader2,
  Coins,
  RotateCcw,
} from 'lucide-react';
import { Character, AbilityScores } from '@/types/character';
import { calculateModifier } from '@/lib/dnd2024/rulesEngine';
import { ActionCards } from './ActionCards';
import { ShareKeyModal } from './ShareKeyModal';
import { CompendiumModal } from './CompendiumModal';

export interface InteractiveSheetProps {
  character: Character;
}

const SPECIES_RU: Record<string, string> = {
  human: 'Человек',
  elf: 'Эльф',
  dwarf: 'Дварф',
  halfling: 'Полурослик',
  gnome: 'Гном',
  dragonborn: 'Драконорождённый',
  tiefling: 'Тифлинг',
  orc: 'Орк',
  goliath: 'Голиаф',
};

const CLASS_RU: Record<string, string> = {
  fighter: 'Воин (Fighter)',
  wizard: 'Волшебник (Wizard)',
  rogue: 'Плут (Rogue)',
  cleric: 'Жрец (Cleric)',
  barbarian: 'Варвар (Barbarian)',
  bard: 'Бард (Bard)',
  druid: 'Друид (Druid)',
  monk: 'Монах (Monk)',
  paladin: 'Паладин (Paladin)',
  ranger: 'Следопыт (Ranger)',
  sorcerer: 'Чародей (Sorcerer)',
  warlock: 'Колдун (Warlock)',
};

const BACKGROUND_RU: Record<string, string> = {
  soldier: 'Солдат (Soldier)',
  sage: 'Мудрец (Sage)',
  criminal: 'Преступник (Criminal)',
  acolyte: 'Прислужник (Acolyte)',
  artisan: 'Ремесленник',
  charlatan: 'Шарлатан',
  entertainer: 'Артист',
  farmer: 'Фермер',
  guard: 'Стражник',
  guide: 'Проводник',
  hermit: 'Отшельник',
  merchant: 'Купец',
  noble: 'Дворянин',
  sailor: 'Моряк',
  scribe: 'Писец',
  wayfarer: 'Странник',
};

export function InteractiveSheet({ character }: InteractiveSheetProps) {
  const maxHp = Math.max(1, character.maxHp || character.hp || 1);
  const [currentHp, setCurrentHp] = useState<number>(() =>
    Math.min(maxHp, Math.max(0, character.currentHp ?? character.hp ?? maxHp))
  );
  const [tempHp, setTempHp] = useState<number>(() => character.tempHp ?? 0);
  const [coins, setCoins] = useState(() => character.coins ?? { gp: 10, sp: 0, cp: 0 });

  const isCaster = [
    'wizard',
    'cleric',
    'druid',
    'bard',
    'sorcerer',
    'warlock',
    'paladin',
    'ranger',
  ].includes(character.characterClass.toLowerCase());

  const defaultMaxSlots = character.characterClass.toLowerCase() === 'warlock' ? 1 : 2;
  const [spellSlots, setSpellSlots] = useState(() => ({
    level1Max: character.spellSlots?.level1Max ?? defaultMaxSlots,
    level1Used: character.spellSlots?.level1Used ?? 0,
  }));

  const [notes, setNotes] = useState<string>(() => character.notes ?? '');
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const dexMod = calculateModifier(character.abilityScores?.dexterity ?? 10);
  const formatBonus = (val: number) => (val >= 0 ? `+${val}` : `${val}`);

  // Auto-persistence: save to localStorage and debounced PATCH to server
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const payload = {
      hp: currentHp,
      currentHp,
      tempHp,
      coins,
      spellSlots: isCaster ? spellSlots : undefined,
      notes,
    };

    // Save to localStorage immediately
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `dnd_char_${character.key}`;
        const stored = window.localStorage.getItem(key);
        const prev = stored ? JSON.parse(stored) : { ...character };
        window.localStorage.setItem(key, JSON.stringify({ ...prev, ...payload }));
      }
    } catch {
      // localStorage error fallback
    }

    // Debounced PATCH /api/characters/[key]
    setSyncStatus('saving');
    const timer = setTimeout(async () => {
      try {
        if (typeof window !== 'undefined' && typeof fetch === 'function') {
          await fetch(`/api/characters/${character.key}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to sync live character stats:', err);
        setSyncStatus('idle');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [currentHp, tempHp, coins, spellSlots, notes, character.key, isCaster]);

  const handleDecreaseHp = () => {
    setCurrentHp((prev) => Math.max(0, prev - 1));
  };

  const handleIncreaseHp = () => {
    setCurrentHp((prev) => Math.min(maxHp, prev + 1));
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setDownloadError(null);

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character: { ...character, hp: currentHp, tempHp, coins, notes } }),
      });

      if (!response.ok) {
        throw new Error('Не удалось сформировать PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${character.name || 'character'}_2024.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      setDownloadError('Ошибка при создании PDF. Попробуйте еще раз.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const abilities: Array<{
    key: keyof AbilityScores;
    label: string;
    short: string;
  }> = [
    { key: 'strength', label: 'Сила', short: 'СИЛ' },
    { key: 'dexterity', label: 'Ловкость', short: 'ЛОВ' },
    { key: 'constitution', label: 'Телосложение', short: 'ТЕЛ' },
    { key: 'intelligence', label: 'Интеллект', short: 'ИНТ' },
    { key: 'wisdom', label: 'Мудрость', short: 'МДР' },
    { key: 'charisma', label: 'Харизма', short: 'ХАР' },
  ];

  const speciesName =
    SPECIES_RU[character.species.toLowerCase()] || character.species;
  const className =
    CLASS_RU[character.characterClass.toLowerCase()] || character.characterClass;
  const backgroundName =
    BACKGROUND_RU[character.background.toLowerCase()] || character.background;

  const hpPercentage = Math.round((currentHp / maxHp) * 100);
  const hpColor =
    hpPercentage > 50
      ? 'bg-emerald-500'
      : hpPercentage > 25
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Action Bar (Mobile Game Table) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShareOpen(true)}
            data-testid="share-key-trigger"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors font-mono font-bold text-xs sm:text-sm"
            title="Нажмите, чтобы открыть меню шеринга"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{character.key}</span>
            <Share2 className="w-3.5 h-3.5 ml-1 opacity-70" />
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">
            1-й уровень D&D 2024
          </span>
          {syncStatus === 'saving' && (
            <span className="text-xs text-amber-400/80 animate-pulse hidden md:inline">
              Синхронизация...
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="text-xs text-emerald-400 hidden md:inline">
              ✓ Сохранено
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompendiumOpen(true)}
            data-testid="compendium-trigger"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
            title="Открыть справочник правил D&D 2024"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Справочник D&D 2024</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Генерация PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Скачать официальный PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
          {downloadError}
        </div>
      )}

      {/* Hero Header Card */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
          {/* Portrait */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-500/40 shadow-lg flex-shrink-0 flex items-center justify-center">
            {character.portraitUrl ? (
              <img
                src={character.portraitUrl}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-slate-600" />
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-amber-500/20 rounded-2xl pointer-events-none" />
          </div>

          {/* Hero Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Уровень 1
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {speciesName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {className}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {backgroundName}
              </span>
              {character.alignment && (
                <span
                  data-testid="character-alignment-badge"
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950/60 border border-indigo-500/30 text-indigo-300"
                >
                  ⚖️ {character.alignment}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-100 tracking-tight">
              {character.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400">
              Черта происхождения: <strong className="text-slate-200">{character.originFeat}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Combat Vitals & Live HP Bar (Optimized for Smartphone at the Table) */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Armor Class */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>КД / AC</span>
          </div>
          <div className="text-3xl font-serif font-black text-slate-100">
            {character.ac}
          </div>
          <div className="text-[11px] text-slate-400">Класс доспеха</div>
        </div>

        {/* Speed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Footprints className="w-4 h-4 text-amber-400" />
            <span>Скорость</span>
          </div>
          <div className="text-3xl font-serif font-black text-slate-100">
            {character.speed}
          </div>
          <div className="text-[11px] text-slate-400">футов / ход</div>
        </div>

        {/* Initiative */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Инициатива</span>
          </div>
          <div className="text-3xl font-serif font-black text-slate-100 font-mono">
            {formatBonus(dexMod)}
          </div>
          <div className="text-[11px] text-slate-400">Бонус к реакции</div>
        </div>

        {/* Proficiency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Мастерство</span>
          </div>
          <div className="text-3xl font-serif font-black text-slate-100 font-mono">
            +2
          </div>
          <div className="text-[11px] text-slate-400">Бонус мастерства</div>
        </div>

        {/* Interactive HP Counter (Takes 2 cols on mobile, 1 on larger screens) */}
        <div className="col-span-2 sm:col-span-1 bg-slate-900/90 border border-rose-900/40 rounded-2xl p-3 sm:p-4 text-center space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-medium uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-rose-500/20 text-rose-400" />
            <span>Хиты (HP)</span>
          </div>

          <div
            data-testid="current-hp-display"
            className="text-2xl sm:text-3xl font-serif font-black text-slate-100 flex items-center justify-center gap-1"
          >
            <span>{currentHp}</span>
            <span className="text-slate-500 text-lg">/ {maxHp}</span>
          </div>

          {/* Interactive - / + buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleDecreaseHp}
              data-testid="hp-decrease-btn"
              className="w-12 h-12 min-w-[48px] min-h-[48px] text-xl font-bold flex items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-200 border border-slate-700 hover:border-rose-700 transition-colors active:scale-95 shadow-sm"
              aria-label="Уменьшить текущие хиты"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={handleIncreaseHp}
              data-testid="hp-increase-btn"
              className="w-12 h-12 min-w-[48px] min-h-[48px] text-xl font-bold flex items-center justify-center rounded-xl bg-slate-800 hover:bg-emerald-900/40 text-slate-200 border border-slate-700 hover:border-emerald-700 transition-colors active:scale-95 shadow-sm"
              aria-label="Увеличить текущие хиты"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Temp HP Controls */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-amber-400 font-medium">Временные:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTempHp((prev) => Math.max(0, prev - 1))}
                data-testid="temp-hp-decrease-btn"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm active:scale-95 border border-slate-700"
                aria-label="Уменьшить временные хиты"
              >
                -
              </button>
              <span data-testid="temp-hp-display" className="font-mono font-bold text-amber-300 w-6 text-center text-sm">
                {tempHp}
              </span>
              <button
                onClick={() => setTempHp((prev) => prev + 1)}
                data-testid="temp-hp-increase-btn"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm active:scale-95 border border-slate-700"
                aria-label="Увеличить временные хиты"
              >
                +
              </button>
            </div>
          </div>

          {/* Progress mini bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${hpColor} transition-all duration-300`}
              style={{ width: `${Math.min(100, Math.max(0, hpPercentage))}%` }}
            />
          </div>
        </div>
      </section>

      {/* Ability Scores Grid */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-serif">
          Характеристики и Модификаторы
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {abilities.map((ability) => {
            const score = character.abilityScores?.[ability.key] ?? 10;
            const mod = calculateModifier(score);
            return (
              <div
                key={ability.key}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-center space-y-1 hover:border-slate-700 transition-colors"
              >
                <span className="text-[11px] font-bold tracking-wider text-slate-400 block uppercase">
                  {ability.short}
                </span>
                <div className="text-xl sm:text-2xl font-mono font-bold text-amber-300">
                  {formatBonus(mod)}
                </div>
                <div className="text-[11px] text-slate-400">{score}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom Balance Card Mechanic (Gold / Amber Accent) */}
      {character.customMechanic && (
        <section className="bg-gradient-to-br from-amber-950/30 to-slate-900/90 border-2 border-amber-500/50 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-base font-bold uppercase tracking-wide font-serif">
              Особая способность героя (Custom Balance Card)
            </h3>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-100">
              {character.customMechanic.title}
            </h4>

            {character.customMechanic.trigger && (
              <div className="inline-block bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-2.5 py-1 rounded-md font-medium">
                Триггер: {character.customMechanic.trigger}
              </div>
            )}

            <p className="text-sm text-slate-200 leading-relaxed">
              {character.customMechanic.effect}
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              {character.customMechanic.costOrTradeoff && (
                <span className="bg-slate-950/80 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-md">
                  Ограничение: <strong className="text-amber-400">{character.customMechanic.costOrTradeoff}</strong>
                </span>
              )}
              {character.customMechanic.ruleEquivalent && (
                <span className="bg-slate-950/80 border border-slate-700/80 text-slate-400 px-2.5 py-1 rounded-md">
                  Баланс: {character.customMechanic.ruleEquivalent}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Spell Slots Tracker (for Spellcaster classes in D&D 2024) */}
      {isCaster && (
        <section className="bg-slate-900/80 border border-indigo-900/40 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 font-serif">
                Ячейки заклинаний 1-го уровня ({spellSlots.level1Max - spellSlots.level1Used}/{spellSlots.level1Max})
              </h3>
            </div>
            <button
              onClick={() => setSpellSlots((prev) => ({ ...prev, level1Used: 0 }))}
              data-testid="reset-spell-slots-btn"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60"
              title="Восстановить ячейки после долгого отдыха"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Долгий отдых (сброс)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {Array.from({ length: spellSlots.level1Max }).map((_, index) => {
              const isUsed = index < spellSlots.level1Used;
              return (
                <button
                  key={index}
                  type="button"
                  data-testid={`spell-slot-checkbox-${index}`}
                  onClick={() => {
                    setSpellSlots((prev) => {
                      const newUsed = isUsed ? index : Math.min(prev.level1Max, index + 1);
                      return { ...prev, level1Used: newUsed };
                    });
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    isUsed
                      ? 'bg-slate-950 border-slate-800 text-slate-500 line-through'
                      : 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200 shadow-sm shadow-indigo-500/10 hover:border-indigo-400'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isUsed
                        ? 'border-slate-700 bg-transparent'
                        : 'border-indigo-400 bg-indigo-500 shadow-sm shadow-indigo-400/50'
                    }`}
                  />
                  <span>
                    Слот #{index + 1} {isUsed ? '(израсходован)' : '(доступен)'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Coins Wallet (ЗМ, СМ, ММ) */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-serif">
              Кошелёк и монеты
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Быстрое изменение хитов и баланса</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* GP */}
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3 text-center space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase block">
              Золото (ЗМ)
            </span>
            <div data-testid="coin-gp-display" className="text-xl sm:text-2xl font-mono font-bold text-amber-300">
              {coins.gp}
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <button
                onClick={() => setCoins((prev) => ({ ...prev, gp: Math.max(0, prev.gp - 1) }))}
                data-testid="coin-gp-dec"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer border border-slate-700 active:scale-95"
                aria-label="Уменьшить золото"
              >
                -
              </button>
              <button
                onClick={() => setCoins((prev) => ({ ...prev, gp: prev.gp + 1 }))}
                data-testid="coin-gp-inc"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer border border-slate-700 active:scale-95"
                aria-label="Увеличить золото"
              >
                +
              </button>
            </div>
          </div>

          {/* SP */}
          <div className="bg-slate-950/70 border border-slate-700 rounded-xl p-3 text-center space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase block">
              Серебро (СМ)
            </span>
            <div data-testid="coin-sp-display" className="text-xl sm:text-2xl font-mono font-bold text-slate-200">
              {coins.sp}
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <button
                onClick={() => setCoins((prev) => ({ ...prev, sp: Math.max(0, prev.sp - 1) }))}
                data-testid="coin-sp-dec"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer border border-slate-700 active:scale-95"
                aria-label="Уменьшить серебро"
              >
                -
              </button>
              <button
                onClick={() => setCoins((prev) => ({ ...prev, sp: prev.sp + 1 }))}
                data-testid="coin-sp-inc"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer border border-slate-700 active:scale-95"
                aria-label="Увеличить серебро"
              >
                +
              </button>
            </div>
          </div>

          {/* CP */}
          <div className="bg-slate-950/70 border border-amber-900/40 rounded-xl p-3 text-center space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-amber-600 uppercase block">
              Медь (ММ)
            </span>
            <div data-testid="coin-cp-display" className="text-xl sm:text-2xl font-mono font-bold text-amber-500">
              {coins.cp}
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <button
                onClick={() => setCoins((prev) => ({ ...prev, cp: Math.max(0, prev.cp - 1) }))}
                data-testid="coin-cp-dec"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer border border-slate-700 active:scale-95"
                aria-label="Уменьшить медь"
              >
                -
              </button>
              <button
                onClick={() => setCoins((prev) => ({ ...prev, cp: prev.cp + 1 }))}
                data-testid="coin-cp-inc"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer border border-slate-700 active:scale-95"
                aria-label="Увеличить медь"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Notes & Adventure Loot Textarea */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scroll className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-serif">
              Заметки приключения и добыча
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Автосохранение</span>
        </div>
        <textarea
          data-testid="character-notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Записывайте найденные артефакты, подсказки Мастера, долги, имена NPC..."
          rows={4}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-y"
        />
      </section>

      {/* Combat Actions & Inventory Cards */}
      <ActionCards
        characterClass={character.characterClass}
        abilityScores={character.abilityScores}
      />

      {/* Narrative Backstory Card */}
      {character.backstory && (
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Scroll className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold tracking-wide uppercase font-serif">
              Предыстория и мотивы
            </h3>
          </div>
          <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed italic bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
            {character.backstory}
          </div>
        </section>
      )}

      {/* Share Key Modal */}
      <ShareKeyModal
        isOpen={isShareOpen}
        characterKey={character.key}
        characterName={character.name}
        onClose={() => setIsShareOpen(false)}
      />

      {/* D&D 2024 Compendium & Table Cheat Sheet Modal */}
      <CompendiumModal
        isOpen={isCompendiumOpen}
        onClose={() => setIsCompendiumOpen(false)}
        characterClass={character.characterClass}
      />
    </div>
  );
}
