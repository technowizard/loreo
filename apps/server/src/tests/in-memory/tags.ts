import type { TagsRepository } from '@/repositories/tags.repository.js';

import type { UserWithoutPassword } from '@/types/auth.js';
import type { Tag, TagGroup } from '@/types/tags.js';

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'tags-test@example.com',
  name: 'Test User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export function createInMemoryTagsAdapter(tagLinkRelations = new Map<string, Tag[]>()): {
  repo: TagsRepository;
  seedGroup: (id: string, name: string, color: string, description?: string | null) => void;
  seedTag: (id: string, groupId: string, name: string) => void;
} {
  const groups = new Map<string, TagGroup>();
  const tags = new Map<string, Tag>();

  function seedGroup(id: string, name: string, color: string, description: string | null = null) {
    groups.set(id, {
      id,
      name,
      description,
      color,
      userId: TEST_USER.id,
      createdAt: new Date().toISOString()
    });
  }

  function seedTag(id: string, groupId: string, name: string) {
    tags.set(id, {
      id,
      groupId,
      name,
      userId: TEST_USER.id,
      createdAt: new Date().toISOString()
    });
  }

  const repo: TagsRepository = {
    createGroup: async (data) => {
      const dup = [...groups.values()].find(
        (c) => c.name === data.name && c.userId === data.userId
      );
      if (dup) throw new Error('Tag group already exists');
      const group: TagGroup = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      groups.set(group.id, group);
      const { userId: _u, ...rest } = group;
      return rest;
    },

    createTag: async (data) => {
      const dup = [...tags.values()].find(
        (t) => t.name === data.name && t.groupId === data.groupId && t.userId === data.userId
      );
      if (dup) throw new Error('Tag already exists');
      const tag: Tag = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      tags.set(tag.id, tag);
      const { userId: _u, ...rest } = tag;
      return rest;
    },

    deleteTag: async (id, userId) => {
      const existing = tags.get(id);
      if (!existing || existing.userId !== userId) return false;
      tags.delete(id);
      return true;
    },

    deleteTagGroup: async (id, userId) => {
      const existing = groups.get(id);
      if (!existing || existing.userId !== userId) return false;
      groups.delete(id);
      for (const [tagId, tag] of tags) {
        if (tag.groupId === id) tags.delete(tagId);
      }
      return true;
    },

    findGroups: async (userId) => [...groups.values()].filter((c) => c.userId === userId),

    findGroupsWithTags: async (userId) => {
      const userGroups = [...groups.values()].filter((c) => c.userId === userId);
      return userGroups.map((c) => {
        const { userId: _u, ...rest } = c;
        return {
          ...rest,
          tags: [...tags.values()]
            .filter((t) => t.groupId === c.id)
            .map(({ userId: _t, ...tagRest }) => tagRest)
        };
      });
    },

    findGroupById: async (id, userId) => {
      const cat = groups.get(id);
      if (!cat || cat.userId !== userId) return null;
      return cat;
    },

    findGroupByName: async (name, userId) => {
      return [...groups.values()].find((c) => c.name === name && c.userId === userId) ?? null;
    },

    findTagById: async (id, userId) => {
      const tag = tags.get(id);
      if (!tag || tag.userId !== userId) return null;
      return tag;
    },

    findTagsByGroup: async (groupId, userId) =>
      [...tags.values()].filter((t) => t.groupId === groupId && t.userId === userId),

    findTagsByUserId: async (userId) => [...tags.values()].filter((t) => t.userId === userId),

    getTagUsageCount: async () => 0,

    updateGroup: async (id, userId, updates) => {
      const existing = groups.get(id);
      if (!existing || existing.userId !== userId) return null;
      const updated = { ...existing, ...updates };
      groups.set(id, updated);
      return updated;
    },

    updateTag: async (id, userId, updates) => {
      const existing = tags.get(id);
      if (!existing || existing.userId !== userId) return null;
      const updated = { ...existing, ...updates };
      tags.set(id, updated);
      const { userId: _u, ...rest } = updated;
      return rest;
    },

    bulkDeleteTags: async (tagIds, userId) => {
      let count = 0;
      for (const id of tagIds) {
        const t = tags.get(id);
        if (t && t.userId === userId) {
          tags.delete(id);
          count++;
        }
      }
      return count;
    },

    bulkDeleteTagRelations: async (tagIds) => {
      let count = 0;
      for (const [linkId, linkTags] of tagLinkRelations) {
        const filtered = linkTags.filter((t) => !tagIds.includes(t.id));
        if (filtered.length !== linkTags.length) {
          count += linkTags.length - filtered.length;
          tagLinkRelations.set(linkId, filtered);
        }
      }
      return count;
    },

    bulkUpdateTagGroup: async (tagIds, userId, newGroupId) => {
      let count = 0;
      for (const id of tagIds) {
        const t = tags.get(id);
        if (t && t.userId === userId) {
          t.groupId = newGroupId;
          count++;
        }
      }
      return count;
    },

    countLinksByTagIds: async () => 0,

    addTagsToLink: async (linkId, tagIds, userId) => {
      const existing = tagLinkRelations.get(linkId) ?? [];
      const newTags = tagIds
        .map((id) => tags.get(id))
        .filter((t): t is Tag => t != null && t.userId === userId);
      tagLinkRelations.set(linkId, [...existing, ...newTags]);
      return newTags.map((t) => ({
        id: crypto.randomUUID(),
        linkId,
        tagId: t.id,
        createdAt: new Date().toISOString()
      }));
    },

    replaceTagsForLink: async (linkId, tagIds, _userId) => {
      const assignedTags = tagIds.map((id) => tags.get(id)).filter((t): t is Tag => t != null);
      tagLinkRelations.set(linkId, assignedTags);
      return assignedTags.map((t) => ({
        id: crypto.randomUUID(),
        linkId,
        tagId: t.id,
        createdAt: new Date().toISOString()
      }));
    }
  };

  return { repo, seedGroup, seedTag };
}
