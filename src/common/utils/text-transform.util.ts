/**
 * Converts strings like "on_hold" or "on-hold" to "On Hold"
 * Handles underscores, hyphens, and mixed casing.
 */
export function formatLabel(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
