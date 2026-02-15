import { Request } from 'express';

/**
 * Shape of the authenticated user attached to the request by the auth layer.
 * Kept minimal so common code does not depend on auth module internals.
 */
export interface RequestUser {
  userId: string;
  sessionId?: string;
  email?: string;
  role?: string;
  schema?: string;
  name?: string;
}

export type RequestWithUser = Request & { user?: RequestUser };

/**
 * Normalize Express header value (string | string[]) to string | null.
 */
export function singleHeader(
  value: string | string[] | undefined,
): string | null {
  if (value === undefined) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string' ? first : null;
  }
  return null;
}
