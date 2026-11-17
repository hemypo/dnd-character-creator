'use client';

import React from 'react';
import { Sword, Crosshair, Sparkles, Shield, Package, Zap } from 'lucide-react';
import { AbilityScores } from '@/types/character';
import {
  calculateModifier,
  getWeaponMasteries,
  getStartingEquipment,
} from '@/lib/dnd2024/rulesEngine';

export interface ActionCardsProps {
  characterClass: string;
  abilityScores?: AbilityScores;
  weaponMasteries?: string[];
  startingEquipment?: string[];
}

export interface WeaponAction {
  name: string;
  type: 'melee' | 'ranged' | 'spell';
  toHit: number;
  damage: string;
  damageType: string;
  mastery?: string;
  notes?: string;
}

export function ActionCards({
  characterClass,
  abilityScores,
  weaponMasteries: propMasteries,
  startingEquipment: propEquipment,
}: ActionCardsProps) {
  const normClass = (characterClass || 'fighter').toLowerCase();

  const scores = abilityScores || {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };

  const strMod = calculateModifier(scores.strength);
  const dexMod = calculateModifier(scores.dexterity);
  const intMod = calculateModifier(scores.intelligence);
  const wisMod = calculateModifier(scores.wisdom);
  const profBonus = 2; // Level 1 proficiency bonus

  const masteries = propMasteries ?? getWeaponMasteries(normClass);
  const equipment = propEquipment ?? getStartingEquipment(normClass);

  // Derive class weapons and actions
  const actions: WeaponAction[] = React.useMemo(() => {
    switch (normClass) {
      case 'fighter':
        return [
          {
            name: 'Двуручный меч (Greatsword)',
            type: 'melee',
            toHit: strMod + profBonus,
            damage: `2d6 ${strMod >= 0 ? `+ ${strMod}` : `- ${Math.abs(strMod)}`}`,
            damageType: 'рубящий',
            mastery: 'Topple (Опрокидывание)',
            notes: 'Двуручное, тяжелое',
          },
          {
            name: 'Легкий арбалет (Light Crossbow)',
            type: 'ranged',
            toHit: dexMod + profBonus,
            damage: `1d8 ${dexMod >= 0 ? `+ ${dexMod}` : `- ${Math.abs(dexMod)}`}`,
            damageType: 'колющий',
            mastery: 'Slow (Замедление)',
            notes: 'Дистанция 80/320 фт, перезарядка',
          },
        ];
      case 'rogue':
        return [
          {
            name: 'Короткий меч (Shortsword)',
            type: 'melee',
            toHit: dexMod + profBonus,
            damage: `1d6 ${dexMod >= 0 ? `+ ${dexMod}` : `- ${Math.abs(dexMod)}`}`,
            damageType: 'колющий',
            mastery: 'Vex (Досада)',
            notes: 'Фехтовальное, легкое',
          },
          {
            name: 'Кинжал (Dagger)',
            type: 'melee',
            toHit: dexMod + profBonus,
            damage: `1d4 ${dexMod >= 0 ? `+ ${dexMod}` : `- ${Math.abs(dexMod)}`}`,
            damageType: 'колющий',
            mastery: 'Nick (Порез)',
            notes: 'Легкое, метательное (дист. 20/60 фт)',
          },
        ];
      case 'wizard':
        return [
          {
            name: 'Огненный снаряд (Fire Bolt)',
            type: 'spell',
            toHit: intMod + profBonus,
            damage: '1d10',
            damageType: 'огонь',
            notes: 'Заговор, дистанция 120 фт',
          },
          {
            name: 'Боевой посох (Quarterstaff)',
            type: 'melee',
            toHit: strMod + profBonus,
            damage: `1d6 ${strMod >= 0 ? `+ ${strMod}` : `- ${Math.abs(strMod)}`}`,
            damageType: 'дробящий',
            notes: 'Универсальное (1d8 двуручно)',
          },
        ];
      case 'cleric':
        return [
          {
            name: 'Боевой молот (Warhammer)',
            type: 'melee',
            toHit: strMod + profBonus,
            damage: `1d8 ${strMod >= 0 ? `+ ${strMod}` : `- ${Math.abs(strMod)}`}`,
            damageType: 'дробящий',
            mastery: 'Push (Толчок)',
            notes: 'Универсальное (1d10 двуручно)',
          },
          {
            name: 'Священное пламя (Sacred Flame)',
            type: 'spell',
            toHit: wisMod + profBonus,
            damage: '1d8',
            damageType: 'лучистый',
            notes: `Спасбросок ЛОВ DC ${8 + profBonus + wisMod}, дистанция 60 фт`,
          },
        ];
      default: {
        const bestMod = Math.max(strMod, dexMod);
        return [
          {
            name: 'Основная атака оружием',
            type: 'melee',
            toHit: bestMod + profBonus,
            damage: `1d8 ${bestMod >= 0 ? `+ ${bestMod}` : `- ${Math.abs(bestMod)}`}`,
            damageType: 'рубящий / колющий',
          },
        ];
      }
    }
  }, [normClass, strMod, dexMod, intMod, wisMod, profBonus]);

  const formatBonus = (val: number) => (val >= 0 ? `+${val}` : `${val}`);

  return (
    <div className="space-y-6">
      {/* Combat Actions Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Sword className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold tracking-wide uppercase font-serif">
            Боевые действия и атаки
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-colors space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm leading-tight">
                    {action.name}
                  </h4>
                  <span className="text-xs text-slate-400 capitalize">
                    {action.type === 'melee'
                      ? 'Ближний бой'
                      : action.type === 'ranged'
                      ? 'Дальний бой'
                      : 'Заклинание'}
                  </span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap">
                  {formatBonus(action.toHit)} к броску
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Урон:</span>
                <span className="font-mono font-bold text-amber-300">
                  {action.damage} <span className="text-slate-400 font-sans font-normal">({action.damageType})</span>
                </span>
              </div>

              {action.mastery && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded-md">
                  <Zap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>
                    Мастери: <strong className="font-semibold">{action.mastery}</strong>
                  </span>
                </div>
              )}

              {action.notes && (
                <p className="text-xs text-slate-400 italic">
                  {action.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2024 Weapon Masteries Section (if applicable) */}
      {masteries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold tracking-wide uppercase font-serif">
              Мастерство владения оружием (D&D 2024)
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {masteries.map((mastery, idx) => (
              <span
                key={idx}
                className="bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                {mastery}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Starting Equipment Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Package className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold tracking-wide uppercase font-serif">
            Снаряжение и инвентарь
          </h3>
        </div>

        <ul className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 divide-y divide-slate-800/60 text-xs sm:text-sm text-slate-300 space-y-2">
          {equipment.map((item, idx) => (
            <li key={idx} className="pt-2 first:pt-0 flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
