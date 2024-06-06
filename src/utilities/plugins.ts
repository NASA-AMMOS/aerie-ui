import type { PluginCode } from '../types/plugin';

export async function loadPluginCode(path: string) {
  const code = (await import(/* @vite-ignore */ path)) as PluginCode;
  return await code.getPlugin();
}
