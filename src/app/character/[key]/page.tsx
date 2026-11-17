'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { InteractiveSheet } from '@/components/sheet/InteractiveSheet';
import { Character } from '@/types/character';
import { ArrowLeft, PlusCircle, ShieldAlert, Loader2, Sparkles } from 'lucide-react';

export default function CharacterViewPage({
  params: propParams,
}: {
  params?: { key?: string } | Promise<{ key?: string }>;
}) {
  const routerParams = useParams();
  const [characterKey, setCharacterKey] = useState<string>('');
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let rawKey = routerParams?.key as string | undefined;
    if (!rawKey && propParams) {
      if (typeof (propParams as Promise<{ key?: string }>).then === 'function') {
        (propParams as Promise<{ key?: string }>).then((p) => {
          if (p?.key) setCharacterKey(p.key.toUpperCase());
        });
      } else if ('key' in propParams && propParams.key) {
        rawKey = propParams.key;
      }
    }
    if (rawKey) {
      setCharacterKey(rawKey.toUpperCase());
    }
  }, [routerParams, propParams]);

  useEffect(() => {
    if (!characterKey) return;

    let isMounted = true;

    // 1. Check local storage first for instant responsive load
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const localData = localStorage.getItem(`hero_${characterKey}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed && parsed.key) {
            setCharacter(parsed);
            setLoading(false);
          }
        }
      } catch {
        // ignore storage error
      }
    }

    // 2. Fetch from backend store
    fetch(`/api/characters/${encodeURIComponent(characterKey)}`)
      .then(async (res) => {
        if (!isMounted) return;
        if (!res.ok) {
          setCharacter((current) => {
            if (!current) {
              setNotFound(true);
            }
            return current;
          });
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.success && data.character) {
          setCharacter(data.character);
          setNotFound(false);

          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.setItem(`hero_${characterKey}`, JSON.stringify(data.character));
              localStorage.setItem('latest_hero_key', characterKey);
            } catch {
              // ignore
            }
          }
        } else {
          setCharacter((current) => {
            if (!current) {
              setNotFound(true);
            }
            return current;
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setCharacter((current) => {
          if (!current) {
            setNotFound(true);
          }
          return current;
        });
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [characterKey]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      {/* Navigation Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>На главную</span>
        </Link>

        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 text-xs transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Создать нового героя</span>
        </Link>
      </div>

      {/* Loading State */}
      {loading && !character && (
        <div className="max-w-md mx-auto my-24 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <h2 className="text-lg font-serif font-bold text-slate-200">
            Раскрываем свиток героя...
          </h2>
          <p className="text-xs text-slate-400">
            Поиск персонажа {characterKey} в архивах гильдии искателей приключений
          </p>
        </div>
      )}

      {/* 404 Not Found State */}
      {!loading && notFound && !character && (
        <div className="max-w-md mx-auto my-20 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-black text-slate-100">
              Герой не найден
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Персонаж с кодом <strong className="text-amber-400 font-mono">{characterKey || 'HERO-????'}</strong> не найден в летописях или ещё не был сотворён.
            </p>
          </div>

          <div className="pt-3 space-y-2.5">
            <Link
              href="/create"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Создать нового персонажа</span>
            </Link>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      )}

      {/* Interactive Sheet View */}
      {character && <InteractiveSheet character={character} />}
    </main>
  );
}
