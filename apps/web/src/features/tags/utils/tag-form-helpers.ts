import type { Tag, TagGroup } from '@/types/tags';

export const DEFAULT_GROUP_COLOR = '#3B82F6';

export interface TagGroupForm {
  color: string;
  description: string;
  name: string;
}

export interface TagForm {
  color: string;
  name: string;
}

export interface TagGroupErrors {
  description?: string;
  name?: string;
}

export interface TagErrors {
  name?: string;
}

export function createEmptyTagGroupForm(): TagGroupForm {
  return {
    color: DEFAULT_GROUP_COLOR,
    description: '',
    name: ''
  };
}

export function createTagGroupForm(group: TagGroup): TagGroupForm {
  return {
    color: group.color,
    description: group.description,
    name: group.name
  };
}

export function createTagForm(group: TagGroup, tag?: Tag | null): TagForm {
  return {
    color: group.color,
    name: tag?.name ?? ''
  };
}

export function validateTagGroupForm(form: TagGroupForm): TagGroupErrors {
  return {
    description: form.description.trim() ? undefined : 'Description is required',
    name: form.name.trim() ? undefined : 'Group name is required'
  };
}

export function validateTagForm(form: TagForm): TagErrors {
  return {
    name: form.name.trim() ? undefined : 'Tag name is required'
  };
}

export function hasFormErrors<T extends object>(errors: T): boolean {
  return Object.values(errors).some(Boolean);
}
