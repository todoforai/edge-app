// =============================================================================
// Category system — two levels: groups (coarse) and categories (fine)
// =============================================================================

/** A category group (coarse level, used by presence map) */
export interface CategoryGroup {
  id: string;
  name: string;
  color: string; // HSL hue value
}

/** A fine-grained category (used by TODOs). Links to a group via groupId. */
export interface Category {
  id: string;
  name: string;
  groupId: string | null; // null = ungrouped
}

/** The 6 default category groups (from presence map) */
export const DEFAULT_CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'social', name: 'Social', color: '220' },
  { id: 'content', name: 'Content', color: '340' },
  { id: 'seo', name: 'Search', color: '180' },
  { id: 'ads-sales', name: 'Paid & Outreach', color: '35' },
  { id: 'other', name: 'Other', color: '280' },
  { id: 'analytics', name: 'Intelligence', color: '60' },
];

/** Fine-grained categories, each linked to a group */
export const DEFAULT_CATEGORIES: Category[] = [
  // social
  { id: 'facebook', name: 'Facebook', groupId: 'social' },
  { id: 'instagram', name: 'Instagram', groupId: 'social' },
  { id: 'tiktok', name: 'TikTok', groupId: 'social' },
  { id: 'twitter', name: 'X/Twitter', groupId: 'social' },
  { id: 'linkedin', name: 'LinkedIn', groupId: 'social' },
  { id: 'youtube', name: 'YouTube', groupId: 'social' },
  { id: 'reddit', name: 'Reddit', groupId: 'social' },
  // content
  { id: 'blog', name: 'Blog', groupId: 'content' },
  { id: 'guest-posting', name: 'Guest Posting', groupId: 'content' },
  // seo
  { id: 'seo', name: 'SEO', groupId: 'seo' },
  { id: 'backlinks', name: 'Backlinks', groupId: 'seo' },
  { id: 'keywords', name: 'Keywords', groupId: 'seo' },
  { id: 'aso', name: 'ASO', groupId: 'seo' },
  { id: 'ai-search', name: 'AI Search', groupId: 'seo' },
  { id: 'directories', name: 'Directories', groupId: 'seo' },
  // ads-sales
  { id: 'google-ads', name: 'Google Ads', groupId: 'ads-sales' },
  { id: 'meta-ads', name: 'Meta Ads', groupId: 'ads-sales' },
  { id: 'outreach', name: 'Outreach', groupId: 'ads-sales' },
  { id: 'crm', name: 'CRM', groupId: 'ads-sales' },
  { id: 'email', name: 'Email', groupId: 'ads-sales' },
  // other
  { id: 'reviews', name: 'Reviews', groupId: 'other' },
  // analytics
  { id: 'analytics', name: 'Analytics', groupId: 'analytics' },
  { id: 'finance', name: 'Finance', groupId: 'analytics' },
  { id: 'legal', name: 'Legal', groupId: 'analytics' },
  // ungrouped
  { id: 'development', name: 'Development', groupId: null },
];

/** Look up a category by id */
export function getCategoryById(id: string): Category | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.id === id);
}

/** Get the group for a category id (or undefined if ungrouped) */
export function getCategoryGroup(categoryId: string): CategoryGroup | undefined {
  const cat = getCategoryById(categoryId);
  if (!cat?.groupId) return undefined;
  return DEFAULT_CATEGORY_GROUPS.find((g) => g.id === cat.groupId);
}

/** Get all categories belonging to a group */
export function getCategoriesForGroup(groupId: string): Category[] {
  return DEFAULT_CATEGORIES.filter((c) => c.groupId === groupId);
}

/** Get the HSL hue color string for a fine category (via its group), fallback '0' */
export function getColorForCategory(categoryId: string): string {
  const group = getCategoryGroup(categoryId);
  return group?.color ?? '0';
}

// Category constants - used for both UI grouping AND requirement matching
export const MCP_CATEGORY = {
  // Core
  BUILT_IN: 'Built-in',
  FILESYSTEM: 'Filesystem',

  // Web & Browser
  BROWSER: 'Browser',

  // Context
  BUSINESS_CONTEXT: 'Business Context',

  // Communication
  EMAIL: 'Email',
  MESSAGING: 'Messaging',
  CALENDAR: 'Calendar',

  // Audio/Voice
  TTS: 'Text-to-Speech',
  TRANSCRIPTION: 'Transcription',
  MUSIC: 'Music',

  // Video
  VIDEO: 'Video',

  // Location
  MAPS: 'Maps',
  WEATHER: 'Weather',

  // Technical
  DATABASE: 'Database',
  STORAGE: 'Storage',
  HOSTING: 'Hosting',
  DEVELOPMENT: 'Development',
  ERROR_TRACKING: 'Error Tracking',

  // Business
  PAYMENTS: 'Payments',
  PROJECT_MANAGEMENT: 'Project Management',
  AUTOMATION: 'Automation',
  DESIGN: 'Design',
  SOCIAL: 'Social',
  SALES: 'Sales',

  // AI
  AI: 'AI',
} as const;

export type MCPCategoryType = (typeof MCP_CATEGORY)[keyof typeof MCP_CATEGORY];
