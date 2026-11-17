'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  BookOpen,
  Search,
  Sparkles,
  Sword,
  ShieldAlert,
  Zap,
  Filter,
} from 'lucide-react';
import {
  WEAPON_MASTERIES_2024,
  CONDITIONS_2024,
  COMBAT_ACTIONS_2024,
  searchSpells,
  SpellEntry,
} from '@/data/dnd2024/compendiums';

export interface CompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'spells' | 'masteries' | 'conditions' | 'actions';
  characterClass?: string;
}

export function CompendiumModal({
  isOpen,
  onClose,
  initialTab = 'spells',
  characterClass,
}: CompendiumModalProps) {
  const [activeTab, setActiveTab] = useState<'spells' | 'masteries' | 'conditions' | 'actions'>(initialTab);
  const [spellQuery, setSpellQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [filterByMyClass, setFilterByMyClass] = useState(false);
  const [masteryQuery, setMasteryQuery] = useState('');
  const [conditionQuery, setConditionQuery] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Spells search result
  const filteredSpells = useMemo(() => {
    const cls = filterByMyClass && characterClass ? characterClass : undefined;
    return searchSpells(spellQuery, selectedLevel, cls);
  }, [spellQuery, selectedLevel, filterByMyClass, characterClass]);

  // Masteries search result
  const filteredMasteries = useMemo(() => {
    const q = masteryQuery.trim().toLowerCase();
    if (!q) return WEAPON_MASTERIES_2024;
    return WEAPON_MASTERIES_2024.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.nameEn.toLowerCase().includes(q) ||
        m.weapons.some((w) => w.toLowerCase().includes(q))
    );
  }, [masteryQuery]);

  // Conditions search result
  const filteredConditions = useMemo(() => {
    const q = conditionQuery.trim().toLowerCase();
    if (!q) return CONDITIONS_2024;
    return CONDITIONS_2024.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [conditionQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compendium-title"
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="compendium-title" className="text-lg sm:text-xl font-bold font-serif text-slate-100">
                Справочник D&D 2024
              </h2>
              <p className="text-xs text-slate-400">
                Официальные правила 5.2 SRD: заклинания, мастерство оружия и боевые действия
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Закрыть справочник"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 sm:px-6 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('spells')}
            data-testid="tab-spells"
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'spells'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Заклинания (2024)</span>
          </button>

          <button
            onClick={() => setActiveTab('masteries')}
            data-testid="tab-masteries"
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'masteries'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sword className="w-4 h-4" />
            <span>Оружейные приёмы</span>
          </button>

          <button
            onClick={() => setActiveTab('conditions')}
            data-testid="tab-conditions"
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'conditions'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Состояния</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            data-testid="tab-actions"
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'actions'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Действия в бою</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: SPELLS */}
          {activeTab === 'spells' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={spellQuery}
                    onChange={(e) => setSpellQuery(e.target.value)}
                    placeholder="Поиск по названию или slug..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                  {spellQuery && (
                    <button
                      onClick={() => setSpellQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {characterClass && (
                  <button
                    onClick={() => setFilterByMyClass((prev) => !prev)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                      filterByMyClass
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Только для {characterClass}</span>
                  </button>
                )}
              </div>

              {/* Level Filter Chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-slate-500 mr-1">Круг:</span>
                <button
                  onClick={() => setSelectedLevel(undefined)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedLevel === undefined
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setSelectedLevel(0)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedLevel === 0
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Заговоры (0)
                </button>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedLevel === lvl
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Spells Count */}
              <div className="text-xs text-slate-400">
                Найдено заклинаний: <strong className="text-slate-200">{filteredSpells.length}</strong>
              </div>

              {/* Spells List */}
              <div className="space-y-2">
                {filteredSpells.slice(0, 50).map((spell) => (
                  <div
                    key={spell.id}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm">
                        {spell.name}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {spell.classes.map((cls) => (
                          <span
                            key={cls}
                            className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-md font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        {spell.level === 0 ? 'Заговор' : `${spell.level} круг`}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredSpells.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Заклинания не найдены. Попробуйте изменить параметры поиска.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WEAPON MASTERIES */}
          {activeTab === 'masteries' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={masteryQuery}
                  onChange={(e) => setMasteryQuery(e.target.value)}
                  placeholder="Поиск по свойствам или оружию (напр. Topple, Кинжал)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMasteries.map((m) => (
                  <div
                    key={m.nameEn}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-slate-100 text-base">
                        {m.name}{' '}
                        <span className="text-xs text-amber-400 font-sans font-normal">
                          ({m.nameEn})
                        </span>
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800 text-indigo-300">
                        Мастери 2024
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {m.rules}
                    </p>

                    <div className="pt-1 flex flex-wrap gap-1">
                      <span className="text-[11px] text-slate-500 mr-1">Оружие:</span>
                      {m.weapons.map((w) => (
                        <span
                          key={w}
                          className="text-[11px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CONDITIONS */}
          {activeTab === 'conditions' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={conditionQuery}
                  onChange={(e) => setConditionQuery(e.target.value)}
                  placeholder="Поиск по состояниям (напр. Ослеплённый, Prone)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-3">
                {filteredConditions.map((c) => (
                  <div
                    key={c.nameEn}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-slate-100 text-base">
                        {c.name}{' '}
                        <span className="text-xs text-amber-400 font-sans font-normal">
                          ({c.nameEn})
                        </span>
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 italic">
                      {c.description}
                    </p>

                    <ul className="text-xs text-slate-300 space-y-1 pt-1 list-disc list-inside">
                      {c.bulletPoints.map((bp, idx) => (
                        <li key={idx}>{bp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COMBAT ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMBAT_ACTIONS_2024.map((act) => (
                  <div
                    key={act.nameEn}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-100 text-sm">
                        {act.name}{' '}
                        <span className="text-xs text-slate-500 font-normal">
                          ({act.nameEn})
                        </span>
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          act.type === 'action'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : act.type === 'bonus'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : act.type === 'reaction'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {act.type === 'action'
                          ? 'Действие'
                          : act.type === 'bonus'
                          ? 'Бонусное'
                          : act.type === 'reaction'
                          ? 'Реакция'
                          : 'Свободное'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
