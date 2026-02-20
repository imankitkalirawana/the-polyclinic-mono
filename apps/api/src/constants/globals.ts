/**
 * Defines global constants used across the API (e.g. CLS keys).
 * Must be imported once at bootstrap (main.ts) so they are available without imports.
 */
const SCHEMA_KEY_VALUE = 'SCHEMA';

if (typeof globalThis !== 'undefined') {
  globalThis.SCHEMA_KEY = SCHEMA_KEY_VALUE;
}
