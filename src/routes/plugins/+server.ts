import { base } from '$app/paths';
import { text } from '@sveltejs/kit';
import { existsSync } from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  let resourcesPath = '';
  resourcesPath = path.join(base, 'static/resources', 'time-plugin.js');
  const pluginExists = await existsSync(resourcesPath);
  const resourceServedPath = path.join(base, '/resources', 'time-plugin.js');
  return text(pluginExists ? resourceServedPath : '');
};
