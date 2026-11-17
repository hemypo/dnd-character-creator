import { CharacterAppearance } from './character';

export interface ArchetypeSelection {
  roleId: string;
  powerSourceId: string;
  speciesId: string;
  characterName?: string;
  alignment?: string;
  gender?: string;
  appearance?: CharacterAppearance;
  backgroundId?: string;
}

export interface ArchetypeOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
  recommendedClass?: string;
}

export interface QuizOptionScores {
  lawChaos?: 'lawful' | 'neutral' | 'chaotic';
  goodEvil?: 'good' | 'neutral' | 'evil';
  role?: 'tank' | 'striker' | 'blaster' | 'support';
  powerSource?: 'martial' | 'shadow' | 'arcane' | 'divine';
  species?: string;
  background?: string;
}

export interface QuizOption {
  id: string;
  title: string;
  description?: string;
  scores: QuizOptionScores;
}

export interface QuizQuestion {
  id: string;
  category: 'alignment' | 'combat' | 'background' | 'species';
  categoryTitle: string;
  question: string;
  options: QuizOption[];
}

export interface QuizResult {
  alignment: string;
  roleId: string;
  powerSourceId: string;
  speciesId: string;
  backgroundId: string;
  characterName: string;
  gender?: string;
  appearance?: CharacterAppearance;
  summaryTitle: string;
  summaryDescription: string;
}
