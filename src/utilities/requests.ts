import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { get } from 'svelte/store';
import { user as userStore } from '../stores/app';
import type { User } from '../types/app';
import type { QueryVariables } from '../types/subscribable';

/**
 * Function to make HTTP requests to the Aerie Gateway.
 */
export async function reqGateway<T = any>(
  url: string,
  method: string,
  body: any | null,
  token: string | null,
  excludeContentType: boolean,
): Promise<T> {
  const GATEWAY_URL = browser ? env.PUBLIC_GATEWAY_CLIENT_URL : env.PUBLIC_GATEWAY_SERVER_URL;
  const user = get<User | null>(userStore);

  const options: RequestInit = {
    headers: {
      Authorization: `Bearer ${user?.token ?? ''}`,
      'Content-Type': 'application/json',
    },
    method,
  };

  if (body !== null) {
    options.body = body;
  }

  if (token !== null) {
    // This overrides the auth header (e.g. if the user is not set yet during SSR).

    // @ts-expect-error Any key should be allowable in Headers
    options.headers['Authorization'] = `Bearer ${token ?? ''}`;
  }

  if (excludeContentType === true) {
    // @ts-expect-error Any key should be allowable in Headers
    delete options.headers['Content-Type'];
  }

  const response = await fetch(`${GATEWAY_URL}${url}`, options);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const data = await response.json();

  return data;
}

/**
 * Function to make HTTP POST requests to the Hasura GraphQL API.
 */
export async function reqHasura<T = any>(
  query: string,
  variables: QueryVariables = {},
  signal?: AbortSignal,
  token?: string,
): Promise<Record<string, T>> {
  const HASURA_URL = browser ? env.PUBLIC_HASURA_CLIENT_URL : env.PUBLIC_HASURA_SERVER_URL;
  const user = get<User | null>(userStore);

  const options: RequestInit = {
    body: JSON.stringify({ query, variables }),
    headers: {
      Authorization: `Bearer ${user?.token ?? ''}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  };

  if (token !== undefined) {
    // This overrides the auth header (e.g. if the user is not set yet during SSR).

    // @ts-expect-error Any key should be allowable in Headers
    options.headers['Authorization'] = `Bearer ${token ?? ''}`;
  }

  const response: Response = await fetch(HASURA_URL, options);
  const json = await response.json();

  if (!response.ok) {
    console.log(response);
    console.log(json);
    throw new Error(response.statusText);
  }

  if (json?.errors && json.errors.length) {
    console.log(response);
    console.log(json);

    const defaultError = 'An unexpected error occurred';
    const [error] = json.errors;
    const code = error?.extensions?.code;

    if (code === 'unexpected') {
      // This is often thrown when a Postgres exception is raised for a Hasura query.
      // @see https://github.com/hasura/graphql-engine/issues/3658
      throw new Error(error?.extensions?.internal?.error?.message ?? error?.message ?? defaultError);
    } else {
      throw new Error(error?.message ?? defaultError);
    }
  }

  const { data } = json;
  return data;
}
