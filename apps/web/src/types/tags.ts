export type Tag = {
  id: string;
  groupId: string;
  name: string;
};

export type TagGroup = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  tags: Tag[];
};

export type CreateTagResponse = {
  id: string;
  groupId: string;
  name: string;
  createdAt: string;
};

export type CreateTagGroupResponse = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  tags: Tag[];
};
