/**
 * Shared permission logic for tool autoRun.
 *
 * Pattern format: `serverId:toolName` or `serverId:*`
 * Used by both frontend and backend.
 */

import type { ToolPermissions, PermissionState } from './REST_types';

// ─── Normalize ──────────────────────────────────────────────────────────────

/** Normalize permissions with defaults for all lists. */
export const normalizePermissions = (p: ToolPermissions | undefined) => ({
  allow: p?.allow ?? [],
  ask: p?.ask ?? [],
  deny: p?.deny ?? [],
});

// ─── Pattern parsing / matching ─────────────────────────────────────────────

/** Parse a `serverId:toolName` pattern. */
export function parsePattern(pattern: string): { serverId: string; toolName: string } | null {
  const colonIndex = pattern.indexOf(':');
  if (colonIndex === -1) return null;
  return {
    serverId: pattern.slice(0, colonIndex),
    toolName: pattern.slice(colonIndex + 1),
  };
}

/** Check if a rule pattern matches a target (supports `serverId:*` wildcards). */
export function patternMatches(rulePattern: string, targetPattern: string): boolean {
  const rule = parsePattern(rulePattern);
  const target = parsePattern(targetPattern);
  if (!rule || !target) return rulePattern === targetPattern;

  // Exact match
  if (rule.serverId === target.serverId && rule.toolName === target.toolName) return true;

  // Wildcard match: serverId:* matches serverId:anything
  if (rule.toolName === '*' && rule.serverId === target.serverId) return true;

  return false;
}

// ─── List queries ───────────────────────────────────────────────────────────

export function isPatternInList(list: string[] | undefined, pattern: string): boolean {
  if (!list) return false;
  return list.some(p => patternMatches(p, pattern));
}

export function isPatternAllowed(permissions: ToolPermissions | undefined, pattern: string): boolean {
  return isPatternInList(permissions?.allow, pattern);
}

export function isPatternDenied(permissions: ToolPermissions | undefined, pattern: string): boolean {
  return isPatternInList(permissions?.deny, pattern);
}

export function isPatternAsk(permissions: ToolPermissions | undefined, pattern: string): boolean {
  return isPatternInList(permissions?.ask, pattern);
}

// ─── Evaluation ─────────────────────────────────────────────────────────────

/**
 * Get the effective permission state for a pattern.
 * Evaluation order: deny → ask → allow → fallback.
 */
export function getPermissionState(
  permissions: ToolPermissions | undefined,
  pattern: string,
  getDefault?: (pattern: string) => PermissionState,
): PermissionState {
  if (isPatternDenied(permissions, pattern)) return 'deny';
  if (isPatternAsk(permissions, pattern)) return 'ask';
  if (isPatternAllowed(permissions, pattern)) return 'allow';
  return getDefault ? getDefault(pattern) : 'ask';
}

// ─── Immutable list mutations ───────────────────────────────────────────────

export function addToAllow(permissions: ToolPermissions | undefined, pattern: string): ToolPermissions {
  const { allow, ask, deny } = normalizePermissions(permissions);
  return {
    allow: allow.includes(pattern) ? allow : [...allow, pattern],
    ask: ask.filter(p => p !== pattern),
    deny: deny.filter(p => p !== pattern),
  };
}

export function addToAsk(permissions: ToolPermissions | undefined, pattern: string): ToolPermissions {
  const { allow, ask, deny } = normalizePermissions(permissions);
  return {
    allow: allow.filter(p => p !== pattern),
    ask: ask.includes(pattern) ? ask : [...ask, pattern],
    deny: deny.filter(p => p !== pattern),
  };
}

export function addToDeny(permissions: ToolPermissions | undefined, pattern: string): ToolPermissions {
  const { allow, ask, deny } = normalizePermissions(permissions);
  return {
    allow: allow.filter(p => p !== pattern),
    ask: ask.filter(p => p !== pattern),
    deny: deny.includes(pattern) ? deny : [...deny, pattern],
  };
}

/** Remove a pattern from all lists. */
export function removePattern(permissions: ToolPermissions | undefined, pattern: string): ToolPermissions {
  const { allow, ask, deny } = normalizePermissions(permissions);
  return {
    allow: allow.filter(p => p !== pattern),
    ask: ask.filter(p => p !== pattern),
    deny: deny.filter(p => p !== pattern),
  };
}

// ─── Remember helpers (now just add to allow/deny) ──────────────────────────

/**
 * Remember a permission decision for a pattern.
 * Adds to allow or deny, removes from the opposite list.
 */
export function rememberPermission(
  permissions: ToolPermissions | undefined,
  pattern: string,
  state: 'allow' | 'deny',
): ToolPermissions {
  return state === 'allow'
    ? addToAllow(permissions, pattern)
    : addToDeny(permissions, pattern);
}
