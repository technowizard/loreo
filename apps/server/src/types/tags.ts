export interface Tag {
  id: string;
  groupId: string;
  createdAt: string;
  name: string;
  userId: string;
}

export interface TagGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  userId: string;
  createdAt: string;
}

export interface LinkTags {
  id: string;
  linkId: string;
  tagId: string;
  createdAt: string;
}
