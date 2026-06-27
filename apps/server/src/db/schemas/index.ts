import { relations } from 'drizzle-orm';

import { feedItemsTable } from './feed-items.js';
import { feedSubscriptionsTable } from './feed-subscriptions.js';
import { highlightsTable } from './highlights.js';
import { importSessionsTable } from './import-sessions.js';
import { linksTable, linkTagsTable } from './links.js';
import { tagGroupsTable, tagsTable } from './tags.js';
import { usersTable } from './users.js';

export * from './feed-items.js';
export * from './feed-subscriptions.js';
export * from './highlights.js';
export * from './import-sessions.js';
export * from './links.js';
export * from './tags.js';
export * from './user-settings.js';
export * from './users.js';

export const userRelations = relations(usersTable, ({ many }) => ({
  feedItems: many(feedItemsTable),
  feedSubscriptions: many(feedSubscriptionsTable),
  highlights: many(highlightsTable),
  links: many(linksTable),
  linkTags: many(linkTagsTable),
  tagGroups: many(tagGroupsTable),
  tags: many(tagsTable)
}));

export const highlightRelations = relations(highlightsTable, ({ one }) => ({
  link: one(linksTable, {
    fields: [highlightsTable.linkId],
    references: [linksTable.id]
  }),
  user: one(usersTable, {
    fields: [highlightsTable.userId],
    references: [usersTable.id]
  })
}));

export const linksRelations = relations(linksTable, ({ many, one }) => ({
  user: one(usersTable, {
    fields: [linksTable.userId],
    references: [usersTable.id]
  }),
  importSession: one(importSessionsTable, {
    fields: [linksTable.importSessionId],
    references: [importSessionsTable.id]
  }),
  feedItems: many(feedItemsTable),
  highlights: many(highlightsTable),
  linkTags: many(linkTagsTable)
}));

export const feedSubscriptionsRelations = relations(feedSubscriptionsTable, ({ many, one }) => ({
  feedItems: many(feedItemsTable),
  user: one(usersTable, {
    fields: [feedSubscriptionsTable.userId],
    references: [usersTable.id]
  })
}));

export const feedItemsRelations = relations(feedItemsTable, ({ one }) => ({
  link: one(linksTable, {
    fields: [feedItemsTable.linkId],
    references: [linksTable.id]
  }),
  subscription: one(feedSubscriptionsTable, {
    fields: [feedItemsTable.subscriptionId],
    references: [feedSubscriptionsTable.id]
  }),
  user: one(usersTable, {
    fields: [feedItemsTable.userId],
    references: [usersTable.id]
  })
}));

export const linkTagRelations = relations(linkTagsTable, ({ one }) => ({
  link: one(linksTable, {
    fields: [linkTagsTable.linkId],
    references: [linksTable.id]
  }),
  tag: one(tagsTable, {
    fields: [linkTagsTable.tagId],
    references: [tagsTable.id]
  }),
  user: one(usersTable, {
    fields: [linkTagsTable.userId],
    references: [usersTable.id]
  })
}));

export const tagRelations = relations(tagsTable, ({ one }) => ({
  linkTags: one(linkTagsTable, {
    fields: [tagsTable.id],
    references: [linkTagsTable.tagId]
  }),
  user: one(usersTable, {
    fields: [tagsTable.userId],
    references: [usersTable.id]
  })
}));

export const tagGroupsRelations = relations(tagGroupsTable, ({ many, one }) => ({
  tags: many(tagsTable),
  user: one(usersTable, {
    fields: [tagGroupsTable.userId],
    references: [usersTable.id]
  })
}));

export const importSessionsRelations = relations(importSessionsTable, ({ many, one }) => ({
  user: one(usersTable, {
    fields: [importSessionsTable.userId],
    references: [usersTable.id]
  }),
  links: many(linksTable)
}));
