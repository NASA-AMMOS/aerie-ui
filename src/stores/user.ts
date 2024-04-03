import type { UserId } from '../types/app';
import gql from '../utilities/gql';
import { gqlSubscribable } from './subscribable';

/* Subscriptions. */

export const users = gqlSubscribable<UserId[] | null>(gql.SUB_USERS, {}, null, null, users =>
  users.map((user: { default_role: string; username: UserId }) => user.username),
);
