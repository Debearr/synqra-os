export type SessionUser = {
  id: string;
  email?: string | null;
};

export type SessionResult = {
  user: SessionUser | null;
  token?: string;
};
