export type UserId = string;

export type User = {
  id: UserId;
  token: string;
};

export type Version = {
  branch: string;
  commit: string;
  commitUrl: string;
  date: string;
  name: string;
};
