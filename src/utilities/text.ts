export function pluralize(count: number): string {
  return count === 1 ? '' : 's';
}

// TODO use lodash one?
export function capitalize(string: string): string {
  if (!string) {
    return '';
  }
  return `${string[0].toUpperCase()}${string.slice(1)}`;
}
