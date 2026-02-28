export type AttachmentStatus = 'NEW' | 'UPDATED' | 'DELETED' | 'NONE';

/**
 * Base attachment metadata type - reference only, no content.
 * URI is always required and is the source of truth reference.
 * Format: "todoforai://attachment/{id}"
 */
export interface AttachmentFrame {
  id: string;
  /** Resource URI - always required. Format: "todoforai://attachment/{id}" */
  uri: string;
  originalName: string;
  mimeType: string;
  /** In bytes */
  fileSize: number;
  createdAt?: number;
  isPublic?: boolean;
  status?: AttachmentStatus;
  /** Last modified time (mtime), milliseconds epoch */
  modifiedAt?: number;
  /** Unix permission bits (e.g. 0o644 = 420 decimal) */
  permissions?: number;
  /** Block ID that produced this attachment (for mapping tool results back to tool_calls) */
  blockId?: string;
}

/** Attachment with binary content - for runtime processing */
export interface AttachmentData extends AttachmentFrame {
  data: Uint8Array;
}

/**
 * For creating new attachments via binary WebSocket frames (agent -> backend).
 * Raw bytes travel in a separate binary frame; metadata in JSON.
 * If id is provided, backend reuses it (agent knows URI upfront as todoforai://attachment/{id}).
 */
export interface AttachmentDataCreate {
  /** Optional pre-generated ID. When provided, backend uses this instead of generating a new UUID. */
  id?: string;
  originalName: string;
  mimeType: string;
  /** In bytes */
  fileSize: number;
  /** Raw binary content (sent via binary WebSocket frame, not JSON) */
  data: Uint8Array;
  status?: AttachmentStatus;
}
