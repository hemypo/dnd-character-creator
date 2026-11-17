export interface ArchetypeSelection {
  roleId: string;
  powerSourceId: string;
  speciesId: string;
  characterName?: string;
}

export interface ArchetypeOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
  recommendedClass?: string;
}
