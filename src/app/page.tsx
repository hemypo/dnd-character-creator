'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Search,
  Key,
  Shield,
  Heart,
  FileText,
  Smartphone,
  Flame,
  ArrowRight,
  User,
  Clock,
} from 'lucide-react';

interface CharacterSummary {
  id: string;
  key: string;
  name: string;
  species: string;
  characterClass: string;
  background: string;
  hp: number;
  ac: number;
  portraitUrl?: string;
  createdAt: string;
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
  fighter: 'Воин',
  wizard: 'Волшебник',
  rogue: 'Плут',
  cleric: 'Жрец',
  barbarian: 'Варвар',
  bard: 'Бард',
  druid: 'Друид',
  monk: 'Монах',
  paladin: 'Паладин',
  ranger: 'Следопыт',
  sorcerer: 'Чародей',
  warlock: 'Колдун',
};

export default function HomePage() {
  const router = useRouter();
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recentHeroes, setRecentHeroes] = useState<CharacterSummary[]>([]);
  const [loadingHeroes, setLoadingHeroes] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Load recent characters from API
    fetch('/api/characters')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.characters)) {
          setRecentHeroes(data.characters);
        }
      })
      .catch(() => {
        // Fallback to local storage if API is unreachable
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const heroes: CharacterSummary[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith('hero_HERO-')) {
                const item = localStorage.getItem(k);
                if (item) {
                  const parsed = JSON.parse(item);
                  if (parsed && parsed.key) {
                    heroes.push(parsed);
                  }
                }
              }
            }
            if (isMounted && heroes.length > 0) {
              setRecentHeroes(heroes);
            }
          } catch {
            // ignore
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingHeroes(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenByKey = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputKey.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Введите код персонажа');
      return;
    }
    const normalizedKey = clean.startsWith('HERO-') ? clean : `HERO-${clean}`;
    router.push(`/character/${normalizedKey}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24 w-full">
        {/* Hero Section */}
        <section className="text-center space-y-6 sm:space-y-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>D&D 2024 • Правила 5.2 SRD</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-slate-100 max-w-3xl mx-auto leading-[1.1]">
            Сотворите своего героя за{' '}
            <span className="text-amber-400 underline decoration-amber-500/40 decoration-wavy decoration-2">
              считанные минуты
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Без толстых книг правил и запутанных формул. Опишите желаемую роль, добавьте уникальную механику своими словами, сгенерируйте портрет и сразу приступайте к игре.
          </p>

          {/* Primary CTA and Key Search */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-xl mx-auto">
            <Link
              href="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-3.5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-all shadow-xl shadow-amber-500/20 active:scale-95 group"
            >
              <Flame className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span>Создать героя</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            {/* Quick Open by Key Form */}
            <form
              onSubmit={handleOpenByKey}
              className="w-full sm:w-auto flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1.5 focus-within:border-amber-500/60 transition-colors shadow-inner"
            >
              <div className="pl-3 pr-2 text-slate-500">
                <Key className="w-4 h-4 text-amber-400/80" />
              </div>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="HERO-XXXX"
                className="bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none w-32 sm:w-36 font-mono uppercase"
              />
              <button
                type="submit"
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Открыть</span>
              </button>
            </form>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          )}
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-slate-100">
              Кастомные механики
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Напишите любую идею на русском языке. Арбитр баланса бережно встроит её в рамки официальных черт происхождения D&D 2024.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-slate-100">
              Лист для игры за столом
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Удобный интерактивный интерфейс со смартфона: счётчик хитов, боевые атаки, магия и мастерство оружия всегда под рукой.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-slate-100">
              Официальный PDF
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Скачивайте готовый официальный бланк персонажа D&D 2024 в 1 клик с полной кириллицей и встроенным портретом героя.
            </p>
          </div>
        </section>

        {/* Recent Heroes Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
                Недавние искатели приключений
              </h2>
            </div>
            <Link
              href="/create"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>Создать ещё</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentHeroes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentHeroes.map((hero) => {
                const sName = SPECIES_RU[hero.species.toLowerCase()] || hero.species;
                const cName = CLASS_RU[hero.characterClass.toLowerCase()] || hero.characterClass;
                return (
                  <Link
                    key={hero.key}
                    href={`/character/${hero.key}`}
                    className="group bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all hover:bg-slate-900 flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-amber-500/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {hero.portraitUrl ? (
                        <img
                          src={hero.portraitUrl}
                          alt={hero.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {hero.key}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <Shield className="w-3 h-3 text-slate-500" />
                            {hero.ac}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3 text-rose-500/70" />
                            {hero.hp}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-serif font-bold text-slate-100 text-sm truncate group-hover:text-amber-300 transition-colors">
                        {hero.name}
                      </h4>

                      <p className="text-xs text-slate-400 truncate">
                        {sName} • {cName}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8 text-center space-y-3">
              <p className="text-sm text-slate-400">
                В архивах пока пусто. Станьте первым героем новой кампании!
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Создать первого героя</span>
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p>D&D 2024 Character Weave • Для частных сессий и настольных приключений</p>
      </footer>
    </main>
  );
}
