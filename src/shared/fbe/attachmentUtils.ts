import type { AttachmentData, AttachmentFrame, AttachmentDataCreate } from './attachmentTypes';
import MIMETYPES from './mimetypes.json';

// ===== CENTRALIZED ATTACHMENT TYPE SYSTEM =====
// Everything is driven by mimetypes.json (single source of truth).

/** Default MIME for unknown/binary content */
export const DEFAULT_BINARY_MIME = 'application/octet-stream';

/** Default MIME for plain-text content */
export const DEFAULT_TEXT_MIME = 'text/plain';

/** Prefix used to encode original MIME inside MCP resource attachments */
export const MCP_RESOURCE_PREFIX = 'resource/mcp+';

/** Synthetic MIME for MCP text content (derived from mimetypes.json aliases) */
export const MCP_TEXT_MIME = Object.entries(MIMETYPES.aliases).find(([, type]) => type === 'mcp_text')![0];

/** Synthetic MIME for MCP audio content (derived from mimetypes.json aliases) */
export const MCP_AUDIO_MIME = Object.entries(MIMETYPES.aliases).find(([, type]) => type === 'mcp_audio')![0];

// Type: union of all type keys from the JSON
export type AttachmentType = keyof typeof MIMETYPES.types;

// Runtime constant derived from JSON (so AttachmentType.IMAGE === 'image' still works everywhere)
export const AttachmentType = Object.fromEntries(
  Object.keys(MIMETYPES.types).map(k => [k.toUpperCase(), k])
) as { [K in keyof typeof MIMETYPES.types as Uppercase<K>]: K };

// Build lookup maps from mimetypes.json at module load
const EXT_TO_MIME: Record<string, string> = {};
const MIME_TO_TYPE: Record<string, string> = {};
const PREFIX_RULES: [string, string][] = [];

for (const [ext, entry] of Object.entries(MIMETYPES.extensions)) {
  const { mime, type } = entry as { mime: string; type: string };
  EXT_TO_MIME[ext] = mime;
  MIME_TO_TYPE[mime] = type;
}
for (const [mime, type] of Object.entries(MIMETYPES.aliases)) {
  MIME_TO_TYPE[mime] = type;
}
for (const [type, meta] of Object.entries(MIMETYPES.types)) {
  const { prefixRule } = meta as { prefixRule?: string };
  if (prefixRule) PREFIX_RULES.push([prefixRule, type]);
}

// Build tag → Set<mime> map from extensions that declare tags
const TAG_TO_MIMES: Record<string, Set<string>> = {};
for (const [, entry] of Object.entries(MIMETYPES.extensions)) {
  const { mime, tags } = entry as { mime: string; tags?: string[] };
  if (tags) {
    for (const tag of tags) {
      (TAG_TO_MIMES[tag] ??= new Set()).add(mime);
    }
  }
}

/**
 * Get the attachment type string for any MIME type.
 * Checks exact match in JSON first, then prefix-based fallback.
 */
export function getTypeForMime(mimeType: string): AttachmentType {
  const mime = mimeType.toLowerCase();
  if (MIME_TO_TYPE[mime]) return MIME_TO_TYPE[mime] as AttachmentType;
  for (const [prefix, type] of PREFIX_RULES) {
    if (mime.startsWith(prefix)) return type as AttachmentType;
  }
  return 'unknown';
}

export function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  return EXT_TO_MIME[ext || ''] || '';
}

export function getTypeFromFilename(filename: string): string {
  const mime = getMimeTypeFromFilename(filename);
  return mime ? getTypeForMime(mime) : 'unknown';
}

/**
 * Extract original MIME type from MCP resource format (resource/mcp+original)
 */
export function extractMimeTypeFromMcpResource(mimeType?: string): string {
  if (!mimeType) return '';
  if (mimeType.startsWith(MCP_RESOURCE_PREFIX)) return mimeType.substring(MCP_RESOURCE_PREFIX.length);
  return mimeType;
}

export function isTextMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  const mime = mimeType.toLowerCase();
  if (mime.startsWith(MCP_RESOURCE_PREFIX)) return isTextMimeType(extractMimeTypeFromMcpResource(mime));
  return getTypeForMime(mime) === 'text';
}

export function isImageMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'image';
}

export function isAudioMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'audio';
}

export function isVideoMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'video';
}

export function isPdfMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'pdf';
}

export function isDocumentMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'document';
}

/**
 * Check if a MIME type carries a given tag declared in mimetypes.json extensions.
 */
export function hasMimeTag(mimeType: string, tag: string): boolean {
  return TAG_TO_MIMES[tag]?.has(mimeType.toLowerCase()) ?? false;
}

export function isDocxMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return hasMimeTag(mimeType, 'docx');
}

export function isSpreadsheetMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'spreadsheet';
}

export function isArchiveMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'archive';
}

/**
 * Check if a MIME type represents an MCP text file
 */
export function isMcpTextMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'mcp_text';
}

/**
 * Check if a MIME type represents an MCP image file
 */
export function isMcpImageMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'mcp_image';
}

/**
 * Check if a MIME type represents an MCP audio file
 */
export function isMcpAudioMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return getTypeForMime(mimeType) === 'mcp_audio';
}

/**
 * Check if a MIME type represents an MCP resource file
 */
export function isMcpResourceMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return mimeType.toLowerCase().startsWith(MCP_RESOURCE_PREFIX);
}

/**
 * Get MIME type with fallback to filename-based detection
 */
function getMimeTypeWithFallback(fileName: string, mimeType?: string): string {
  return mimeType || (fileName ? getMimeTypeFromFilename(fileName) : '');
}

/**
 * Determines the attachment type based on MIME type and filename
 */
export function getAttachmentType(attachment: AttachmentFrame): AttachmentType {
  const mimeType = attachment.mimeType?.toLowerCase();
  const fileName = attachment.originalName?.toLowerCase() || '';

  return getAttachmentTypeMCP(fileName, mimeType);
}

export function getAttachmentTypeMCP(fileName: string, mimeType?: string): AttachmentType {
  // MCP resource prefix (resource/mcp+...) must be checked before getTypeForMime
  // because it's a composite encoding, not a simple alias
  if (isMcpResourceMimeType(mimeType))         return 'mcp_resource';

  // Try direct MIME lookup first — handles MCP synthetic types, business context,
  // and all standard types via aliases in mimetypes.json
  if (mimeType) {
    const type = getTypeForMime(mimeType);
    if (type !== 'unknown') return type;
  }

  // Fallback to filename-based detection
  return getAttachmentTypeDirectly(fileName, mimeType);
}

export function getAttachmentTypeDirectly(fileName: string, mimeType?: string): AttachmentType {
  const resolvedMimeType = getMimeTypeWithFallback(fileName, mimeType);
  if (!resolvedMimeType) return 'unknown';
  return getTypeForMime(resolvedMimeType);
}

export function getAttachmentIcon(type: AttachmentType): string {
  return (MIMETYPES.types as Record<string, { icon: string }>)[type]?.icon || MIMETYPES.types.unknown.icon;
}

/**
 * Get appropriate icon for attachment based on its data
 * This is a convenience function that determines the type first, then gets the icon
 */
export function getAttachmentIconFromData(attachment: AttachmentData): string {
  const attachmentType = getAttachmentType(attachment);
  return getAttachmentIcon(attachmentType);
}

/**
 * Get appropriate icon for MCP resource attachment
 * Handles the special case where MCP resources might have specific MIME types
 * but should still show content type icons when possible
 */
export function getMCPResourceIcon(attachment: AttachmentFrame): string {
  // For MCP resources, show the content type icon if we can determine it
  const attachmentType = getAttachmentType(attachment);

  // If we got a specific content type (not MCP_RESOURCE), use it
  if (attachmentType !== 'mcp_resource') {
    return getAttachmentIcon(attachmentType);
  }

  // Try to extract content type from MCP resource prefix
  if (isMcpResourceMimeType(attachment.mimeType)) {
    const originalMimeType = extractMimeTypeFromMcpResource(attachment.mimeType);
    const virtualType = getAttachmentTypeDirectly(attachment.originalName || '', originalMimeType);
    if (virtualType !== 'unknown') {
      return getAttachmentIcon(virtualType);
    }
  }

  // Fallback to MCP resource icon
  return getAttachmentIcon('mcp_resource');
}

export type AttachmentColor = typeof MIMETYPES.types[keyof typeof MIMETYPES.types]['color'];

export function getAttachmentColor(type: AttachmentType): AttachmentColor {
  return ((MIMETYPES.types as Record<string, { color: string }>)[type]?.color || MIMETYPES.types.unknown.color) as AttachmentColor;
}

/**
 * Check if attachment type needs object URL for display (derived from mimetypes.json)
 */
const NEEDS_OBJECT_URL: Set<string> = new Set(
  Object.entries(MIMETYPES.types)
    .filter(([, meta]) => (meta as { needsObjectUrl?: boolean }).needsObjectUrl)
    .map(([type]) => type)
);

export function needsObjectUrl(type: AttachmentType): boolean {
  return NEEDS_OBJECT_URL.has(type);
}

/**
 * Get conversion config for a file that needs format conversion (e.g. HEIC → JPEG).
 * Supports both inline `needsConversion` and named `conversionProfile` references.
 * Returns null if no conversion is needed.
 */
export function getConversionConfig(fileName: string): { toMime: string; toExt: string; quality: number } | null {
  const ext = fileName.toLowerCase().split('.').pop();
  if (!ext) return null;
  const entry = (MIMETYPES.extensions as Record<string, {
    needsConversion?: { toMime: string; toExt: string; quality: number };
    conversionProfile?: string;
  }>)[ext];
  if (!entry) return null;
  if (entry.needsConversion) return entry.needsConversion;
  if (entry.conversionProfile) {
    const profiles = (MIMETYPES as Record<string, unknown>).conversionProfiles as
      Record<string, { toMime: string; toExt: string; quality: number }> | undefined;
    return profiles?.[entry.conversionProfile] ?? null;
  }
  return null;
}

/**
 * Collect all MIME types that map to a given type name.
 * Includes MIMEs from extensions, aliases, and prefix rules.
 */
export function getMimesForType(typeName: string): string[] {
  const mimes = new Set<string>();
  for (const [, entry] of Object.entries(MIMETYPES.extensions)) {
    const { mime, type } = entry as { mime: string; type: string };
    if (type === typeName) mimes.add(mime);
  }
  for (const [mime, type] of Object.entries(MIMETYPES.aliases)) {
    if (type === typeName) mimes.add(mime);
  }
  return [...mimes];
}

// Build reverse map: MIME → preferred extension (first matching ext wins)
const MIME_TO_EXT: Record<string, string> = {};
for (const [ext, entry] of Object.entries(MIMETYPES.extensions)) {
  const { mime } = entry as { mime: string };
  if (!MIME_TO_EXT[mime]) MIME_TO_EXT[mime] = ext;
}

/**
 * Get the preferred file extension for a MIME type (reverse lookup via mimetypes.json).
 * Returns the extension without a leading dot, or `fallback` if unknown.
 */
export function getExtForMime(mimeType: string, fallback = 'bin'): string {
  return MIME_TO_EXT[mimeType.toLowerCase()] || fallback;
}

/**
 * Build an HTML `accept` string for specific attachment types.
 * E.g. buildAcceptStringForTypes('image') → "image/*,.heic,.heif"
 */
export function buildAcceptStringForTypes(...typeNames: string[]): string {
  const parts: string[] = [];
  for (const typeName of typeNames) {
    const typeMeta = (MIMETYPES.types as Record<string, { prefixRule?: string }>)[typeName];
    if (typeMeta?.prefixRule) parts.push(typeMeta.prefixRule + '*');
  }
  for (const [ext, entry] of Object.entries(MIMETYPES.extensions)) {
    const { type } = entry as { type: string };
    if (!typeNames.includes(type)) continue;
    const typeMeta = (MIMETYPES.types as Record<string, { prefixRule?: string }>)[type];
    if (!typeMeta?.prefixRule) {
      parts.push('.' + ext);
    }
  }
  return parts.join(',');
}

/**
 * Build an HTML file input `accept` string from mimetypes.json.
 * Includes all known extensions and prefix-rule wildcards (e.g. "image/*").
 */
export function buildAcceptString(): string {
  const parts: string[] = [];
  // Add prefix-rule wildcards (e.g. "image/*", "audio/*", "video/*")
  for (const [, meta] of Object.entries(MIMETYPES.types)) {
    const { prefixRule } = meta as { prefixRule?: string };
    if (prefixRule) parts.push(prefixRule + '*');
  }
  // Add explicit extensions that aren't covered by prefix rules
  for (const [ext, entry] of Object.entries(MIMETYPES.extensions)) {
    const { type } = entry as { type: string };
    const typeMeta = (MIMETYPES.types as Record<string, { prefixRule?: string }>)[type];
    if (!typeMeta?.prefixRule) {
      parts.push('.' + ext);
    }
  }
  return parts.join(',');
}

/**
 * Extract display text from URI for UI purposes
 */
export function getUriDisplayText(uri: string): string {
  try {
    if (uri.startsWith('file://')) {
      // For file URIs, show just the filename or last part of path
      const path = uri.replace('file://', '');
      const filename = path.split('/').pop() || path;
      return `file: ${filename}`;
    }

    const url = new URL(uri);
    return url.hostname + (url.pathname !== '/' ? url.pathname : '');
  } catch {
    // If not a valid URL, show first 50 chars
    return uri.length > 50 ? uri.substring(0, 50) + '...' : uri;
  }
}

/**
 * Build a resource URI for an attachment ID
 */
export function buildAttachmentResourceUri(attachmentId: string): string {
  return `todoforai://attachment/${attachmentId}`;
}

/** Extract attachment ID from a resource URI */
export function extractAttachmentIdFromUri(uri: string): string | undefined { // TODO: this seems to ONLY working for specific cases. Need to improve!! Maybe we shoudl fallback to own attachmentId? or we have to think this over!
  const match = uri.match(/^todoforai:\/\/attachment\/([^/?]+)/);
  return match ? match[1] : undefined;
}

/**
 * Exhaustiveness helper to ensure all enum cases are handled in switch statements
 */
export function assertExhaustive(x: never): never {
  throw new Error('Unhandled case: ' + x);
}

// ===== BINARY WEBSOCKET FRAME UTILITIES =====

const UUID_BYTE_LENGTH = 36; // UUID string is 36 ASCII chars = 36 bytes

/**
 * Pack an attachment ID and raw data into a binary WebSocket frame.
 * Wire format: [36-byte UUID string (ASCII)][raw file bytes]
 */
export function packBinaryFrame(id: string, data: Uint8Array): Uint8Array {
  if (id.length !== UUID_BYTE_LENGTH) {
    throw new Error(`packBinaryFrame: id must be ${UUID_BYTE_LENGTH} chars, got ${id.length}`);
  }
  const frame = new Uint8Array(UUID_BYTE_LENGTH + data.length);
  // Write UUID as ASCII bytes
  for (let i = 0; i < UUID_BYTE_LENGTH; i++) {
    frame[i] = id.charCodeAt(i);
  }
  frame.set(data, UUID_BYTE_LENGTH);
  return frame;
}

/**
 * Unpack a binary WebSocket frame into attachment ID and raw data.
 * Wire format: [36-byte UUID string (ASCII)][raw file bytes]
 */
export function unpackBinaryFrame(frame: Uint8Array): { id: string; data: Uint8Array } {
  if (frame.length < UUID_BYTE_LENGTH) {
    throw new Error(`unpackBinaryFrame: frame too short (${frame.length} bytes, need at least ${UUID_BYTE_LENGTH})`);
  }
  // Read UUID from first 36 bytes (ASCII)
  let id = '';
  for (let i = 0; i < UUID_BYTE_LENGTH; i++) {
    id += String.fromCharCode(frame[i]);
  }
  const data = frame.slice(UUID_BYTE_LENGTH);
  return { id, data };
}
