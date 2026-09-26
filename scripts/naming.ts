/**
 * CAF Naming Utilities
 *
 * Single source of truth for all name transformation functions used
 * across the CAF generation pipeline.
 */

export function toPascalCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '');
}
