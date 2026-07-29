export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  avatar: string | null;
  role: string;
  settings: Record<string, unknown>;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUser = {
  email: string;
  passwordHash: string;
  name?: string | null;
  avatar?: string | null;
  role?: 'admin' | 'user';
  settings?: Record<string, unknown>;
};

export type PublicUser = Omit<
  User,
  'passwordHash' | 'role' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;
export type PublicUserWithSettings = PublicUser & { settings: Record<string, unknown> };
export type PublicUserWithRole = PublicUser & { role: string };

export type UserWithoutPassword = Omit<User, 'passwordHash'>;
export type UserIdentity = Pick<User, 'id'>;
