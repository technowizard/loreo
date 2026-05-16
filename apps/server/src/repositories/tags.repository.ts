import { and, asc, count, eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '@/db/schemas/index.js';
import { linkTagsTable, tagGroupsTable, tagsTable } from '@/db/schemas/index.js';

import { logger } from '@/lib/logger.js';

import type { LinkTags, Tag, TagGroup } from '@/types/tags.js';

type DrizzleClient = NodePgDatabase<typeof schema>;

const tagColumns = {
  groupId: tagsTable.groupId,
  createdAt: tagsTable.createdAt,
  id: tagsTable.id,
  name: tagsTable.name,
  userId: tagsTable.userId
};

const groupColumns = {
  color: tagGroupsTable.color,
  createdAt: tagGroupsTable.createdAt,
  description: tagGroupsTable.description,
  id: tagGroupsTable.id,
  name: tagGroupsTable.name,
  userId: tagGroupsTable.userId
};

export type GroupWithTags = Omit<TagGroup, 'userId'> & {
  tags: Omit<Tag, 'userId'>[];
};

export interface TagsRepository {
  addTagsToLink(linkId: string, tagIds: string[], userId: string): Promise<LinkTags[]>;
  bulkDeleteTagRelations(tagIds: string[], userId: string): Promise<number>;
  bulkDeleteTags(tagIds: string[], userId: string): Promise<number>;
  bulkUpdateTagGroup(tagIds: string[], userId: string, newGroupId: string): Promise<number>;
  countLinksByTagIds(tagIds: string[], userId: string): Promise<number>;
  createGroup(groupData: Omit<TagGroup, 'id' | 'createdAt'>): Promise<Omit<TagGroup, 'userId'>>;
  createTag(tagData: Omit<Tag, 'id' | 'createdAt'>): Promise<Omit<Tag, 'userId'>>;
  deleteTag(id: string, userId: string): Promise<boolean>;
  deleteTagGroup(id: string, userId: string): Promise<boolean>;
  findGroups(userId: string): Promise<TagGroup[]>;
  findGroupsWithTags(userId: string): Promise<GroupWithTags[]>;
  findGroupById(id: string, userId: string): Promise<TagGroup | null>;
  findGroupByName(name: string, userId: string): Promise<TagGroup | null>;
  findTagById(id: string, userId: string): Promise<Tag | null>;
  findTagsByGroup(groupId: string, userId: string): Promise<Tag[]>;
  findTagsByUserId(userId: string): Promise<Tag[]>;
  getTagUsageCount(tagId: string, userId: string): Promise<number>;
  replaceTagsForLink(linkId: string, tagIds: string[], userId: string): Promise<LinkTags[]>;
  updateGroup(id: string, userId: string, updates: Partial<TagGroup>): Promise<TagGroup | null>;
  updateTag(id: string, userId: string, updates: Partial<Tag>): Promise<Omit<Tag, 'userId'> | null>;
}

export function createDrizzleTagsAdapter(db: DrizzleClient): TagsRepository {
  return {
    async addTagsToLink(linkId, tagIds, userId) {
      if (tagIds.length === 0) return [];

      return db
        .insert(linkTagsTable)
        .values(tagIds.map((tagId) => ({ linkId, tagId, userId })))
        .onConflictDoNothing()
        .returning({
          id: linkTagsTable.id,
          linkId: linkTagsTable.linkId,
          tagId: linkTagsTable.tagId,
          createdAt: linkTagsTable.createdAt
        });
    },

    async bulkDeleteTagRelations(tagIds, userId) {
      const deletedRelations = await db
        .delete(linkTagsTable)
        .where(and(eq(linkTagsTable.userId, userId), inArray(linkTagsTable.tagId, tagIds)))
        .returning({ id: linkTagsTable.id });

      return deletedRelations.length;
    },

    async bulkDeleteTags(tagIds, userId) {
      const deletedTags = await db
        .delete(tagsTable)
        .where(and(eq(tagsTable.userId, userId), inArray(tagsTable.id, tagIds)))
        .returning({ id: tagsTable.id });

      return deletedTags.length;
    },

    async bulkUpdateTagGroup(tagIds, userId, newGroupId) {
      try {
        const updatedGroups = await db
          .update(tagsTable)
          .set({ groupId: newGroupId })
          .where(and(eq(tagsTable.userId, userId), inArray(tagsTable.id, tagIds)))
          .returning({ id: tagsTable.id });

        return updatedGroups.length;
      } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === '23505') throw new Error('Duplicate tag name in target group');
        if (code === '23503') throw new Error(`Group '${newGroupId}' does not exist`);

        logger.error(`Error bulk updating tag group: ${error}`);
        throw error;
      }
    },

    async countLinksByTagIds(tagIds, userId) {
      if (tagIds.length === 0) return 0;

      const [result] = await db
        .select({ count: count() })
        .from(linkTagsTable)
        .where(and(eq(linkTagsTable.userId, userId), inArray(linkTagsTable.tagId, tagIds)));

      return result?.count ?? 0;
    },

    async createGroup(groupData) {
      try {
        const [createdGroup] = await db
          .insert(tagGroupsTable)
          .values({
            color: groupData.color,
            description: groupData.description || null,
            name: groupData.name,
            userId: groupData.userId
          })
          .returning({
            color: tagGroupsTable.color,
            createdAt: tagGroupsTable.createdAt,
            description: tagGroupsTable.description,
            id: tagGroupsTable.id,
            name: tagGroupsTable.name
          });

        if (!createdGroup) throw new Error('Failed to create tag group');

        return createdGroup;
      } catch (error: unknown) {
        if ((error as { code?: string })?.code === '23505') {
          throw new Error(`Group with name '${groupData.name}' already exists`);
        }
        throw error;
      }
    },

    async createTag(tagData) {
      try {
        const [createdTag] = await db
          .insert(tagsTable)
          .values({
            groupId: tagData.groupId,
            name: tagData.name.trim(),
            userId: tagData.userId
          })
          .returning({
            groupId: tagsTable.groupId,
            createdAt: tagsTable.createdAt,
            id: tagsTable.id,
            name: tagsTable.name
          });

        if (!createdTag) throw new Error('Failed to create tag');

        return createdTag;
      } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === '23505')
          throw new Error(`Tag '${tagData.name}' already exists in group '${tagData.groupId}'`);
        if (code === '23503') throw new Error(`Group '${tagData.groupId}' does not exist`);
        throw error;
      }
    },

    async deleteTag(id, userId) {
      const [deleted] = await db
        .delete(tagsTable)
        .where(and(eq(tagsTable.id, id), eq(tagsTable.userId, userId)))
        .returning({ id: tagsTable.id });

      if (!deleted) {
        throw new Error('Tag not found or could not be deleted');
      }

      return deleted.id === id;
    },

    async deleteTagGroup(id, userId) {
      const [deleted] = await db
        .delete(tagGroupsTable)
        .where(and(eq(tagGroupsTable.id, id), eq(tagGroupsTable.userId, userId)))
        .returning({ id: tagGroupsTable.id });

      return deleted?.id === id;
    },

    async findGroups(userId) {
      return db
        .select(groupColumns)
        .from(tagGroupsTable)
        .where(eq(tagGroupsTable.userId, userId))
        .orderBy(asc(tagGroupsTable.name));
    },

    async findGroupById(id, userId) {
      const [group] = await db
        .select(groupColumns)
        .from(tagGroupsTable)
        .where(and(eq(tagGroupsTable.id, id), eq(tagGroupsTable.userId, userId)))
        .limit(1);

      return group ?? null;
    },

    async findGroupByName(name, userId) {
      const [group] = await db
        .select(groupColumns)
        .from(tagGroupsTable)
        .where(and(eq(tagGroupsTable.name, name), eq(tagGroupsTable.userId, userId)))
        .limit(1);

      return group ?? null;
    },

    async findTagById(id, userId) {
      const [tag] = await db
        .select(tagColumns)
        .from(tagsTable)
        .where(and(eq(tagsTable.id, id), eq(tagsTable.userId, userId)))
        .limit(1);

      if (!tag) {
        logger.warn(`Tag not found: ${id}`);
        return null;
      }

      return tag;
    },

    async findTagsByGroup(groupId, userId) {
      return db
        .select(tagColumns)
        .from(tagsTable)
        .where(and(eq(tagsTable.groupId, groupId), eq(tagsTable.userId, userId)))
        .orderBy(asc(tagsTable.name));
    },

    async findTagsByUserId(userId) {
      return db
        .select(tagColumns)
        .from(tagsTable)
        .where(eq(tagsTable.userId, userId))
        .orderBy(asc(tagsTable.name));
    },

    async getTagUsageCount(tagId, userId) {
      const [result] = await db
        .select({ count: count() })
        .from(linkTagsTable)
        .where(and(eq(linkTagsTable.tagId, tagId), eq(linkTagsTable.userId, userId)));

      if (!result) {
        logger.warn(`Tag ${tagId} has no usage count`);
        return 0;
      }

      return result.count;
    },

    async replaceTagsForLink(linkId, tagIds, userId) {
      const replacedTags = await db.transaction(async (tx) => {
        await tx
          .delete(linkTagsTable)
          .where(and(eq(linkTagsTable.linkId, linkId), eq(linkTagsTable.userId, userId)));

        if (tagIds.length === 0) return [] as LinkTags[];

        return tx
          .insert(linkTagsTable)
          .values(tagIds.map((tagId) => ({ linkId, tagId, userId })))
          .onConflictDoNothing()
          .returning({
            createdAt: linkTagsTable.createdAt,
            id: linkTagsTable.id,
            linkId: linkTagsTable.linkId,
            tagId: linkTagsTable.tagId
          });
      });

      if (!replacedTags) {
        throw new Error('Failed to replace tags for link');
      }

      return replacedTags;
    },

    async updateGroup(id, userId, updates) {
      const [updatedGroup] = await db
        .update(tagGroupsTable)
        .set(updates)
        .where(and(eq(tagGroupsTable.id, id), eq(tagGroupsTable.userId, userId)))
        .returning(groupColumns);

      return updatedGroup ?? null;
    },

    async updateTag(id, userId, updates) {
      try {
        const [updatedTag] = await db
          .update(tagsTable)
          .set(updates)
          .where(and(eq(tagsTable.id, id), eq(tagsTable.userId, userId)))
          .returning({
            groupId: tagsTable.groupId,
            createdAt: tagsTable.createdAt,
            id: tagsTable.id,
            name: tagsTable.name
          });

        if (!updatedTag) {
          logger.warn(`Tag not found for id: ${id}, userId: ${userId}`);
          return null;
        }

        return updatedTag;
      } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === '23505') throw new Error(`Tag name already exists in target group`);
        if (code === '23503') throw new Error(`Group does not exist`);
        throw error;
      }
    },

    async findGroupsWithTags(userId) {
      const rows = await db
        .select({
          group: {
            color: tagGroupsTable.color,
            createdAt: tagGroupsTable.createdAt,
            description: tagGroupsTable.description,
            id: tagGroupsTable.id,
            name: tagGroupsTable.name
          },
          tag: {
            groupId: tagsTable.groupId,
            createdAt: tagsTable.createdAt,
            id: tagsTable.id,
            name: tagsTable.name
          }
        })
        .from(tagGroupsTable)
        .leftJoin(tagsTable, eq(tagsTable.groupId, tagGroupsTable.id))
        .where(eq(tagGroupsTable.userId, userId))
        .orderBy(asc(tagGroupsTable.name), asc(tagsTable.name));

      const groupsMap = new Map<string, GroupWithTags>();

      for (const row of rows) {
        const groupId = row.group.id;
        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, { ...row.group, tags: [] });
        }
        if (row.tag !== null && row.tag.id !== null) {
          groupsMap.get(groupId)!.tags.push(row.tag as Omit<Tag, 'userId'>);
        }
      }

      return [...groupsMap.values()];
    }
  };
}
