import { describe, expect, it } from 'vitest';

import type { Tag, TagGroup } from '@/types/tags';

import {
  createEmptyTagGroupForm,
  createTagForm,
  createTagGroupForm,
  hasFormErrors,
  validateTagForm,
  validateTagGroupForm
} from './tag-form-helpers';

describe('createEmptyTagGroupForm', () => {
  it('should create form with default values', () => {
    const form = createEmptyTagGroupForm();
    expect(form).toEqual({
      color: '#3B82F6',
      description: '',
      name: ''
    });
  });
});

describe('createTagGroupForm', () => {
  it('should map group fields to form', () => {
    const group: TagGroup = {
      id: '1',
      name: 'Projects',
      description: 'Work projects',
      color: '#FF0000',
      createdAt: '2025-01-01T00:00:00Z',
      tags: []
    };
    expect(createTagGroupForm(group)).toEqual({
      color: '#FF0000',
      description: 'Work projects',
      name: 'Projects'
    });
  });
});

describe('createTagForm', () => {
  it('should create form with group color and empty name when no tag', () => {
    const group: TagGroup = {
      id: '1',
      name: 'Projects',
      description: '',
      color: '#FF0000',
      createdAt: '2025-01-01T00:00:00Z',
      tags: []
    };
    expect(createTagForm(group)).toEqual({
      color: '#FF0000',
      name: ''
    });
  });

  it('should use tag name when provided', () => {
    const group: TagGroup = {
      id: '1',
      name: 'Projects',
      description: '',
      color: '#FF0000',
      createdAt: '2025-01-01T00:00:00Z',
      tags: []
    };
    const tag: Tag = {
      id: '2',
      groupId: '1',
      name: 'Urgent'
    };
    expect(createTagForm(group, tag)).toEqual({
      color: '#FF0000',
      name: 'Urgent'
    });
  });
});

describe('validateTagGroupForm', () => {
  it('should return no errors for valid form', () => {
    const form = { name: 'Projects', description: 'Work stuff', color: '#000' };
    expect(validateTagGroupForm(form)).toEqual({});
  });

  it('should flag empty name', () => {
    const form = { name: '', description: 'Work stuff', color: '#000' };
    expect(validateTagGroupForm(form)).toEqual({
      name: 'Group name is required'
    });
  });

  it('should flag whitespace-only name', () => {
    const form = { name: '   ', description: 'Work stuff', color: '#000' };
    expect(validateTagGroupForm(form)).toEqual({
      name: 'Group name is required'
    });
  });

  it('should flag empty description', () => {
    const form = { name: 'Projects', description: '', color: '#000' };
    expect(validateTagGroupForm(form)).toEqual({
      description: 'Description is required'
    });
  });
});

describe('validateTagForm', () => {
  it('should return no errors for valid form', () => {
    const form = { name: 'Urgent', color: '#000' };
    expect(validateTagForm(form)).toEqual({});
  });

  it('should flag empty name', () => {
    const form = { name: '', color: '#000' };
    expect(validateTagForm(form)).toEqual({
      name: 'Tag name is required'
    });
  });
});

describe('hasFormErrors', () => {
  it('should return false when no errors', () => {
    expect(hasFormErrors({})).toBe(false);
    expect(hasFormErrors({ name: undefined })).toBe(false);
  });

  it('should return true when any error exists', () => {
    expect(hasFormErrors({ name: 'Required' })).toBe(true);
    expect(hasFormErrors({ name: undefined, description: 'Required' })).toBe(true);
  });
});
