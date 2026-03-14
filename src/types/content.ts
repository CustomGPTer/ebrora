// src/types/content.ts
// TypeScript types for the Ebrora content system

export interface ToolboxCategoryData {
  code: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface ToolboxTalkData {
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
  isFree: boolean;
  order: number;
}

export interface TemplateCategoryData {
  name: string;
  slug: string;
  format: "EXCEL" | "WORD" | "POWERPOINT";
  description: string;
  order: number;
}

export interface FreeToolData {
  name: string;
  slug: string;
  description: string;
  features: string[];
  status: "COMING_SOON" | "LIVE";
  route: string;
  gumroadUrl: string;
  order: number;
}

export interface UpsellItem {
  title: string;
  description: string;
  gumroadUrl: string;
  imageUrl?: string;
  price?: string;
}

export interface UpsellConfig {
  [categorySlug: string]: UpsellItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface DownloadCardProps {
  title: string;
  description?: string;
  fileSize?: number;
  isFree: boolean;
  isLocked: boolean;
  downloadUrl?: string;
  onDownload?: () => void;
  onUnlock?: () => void;
}

export interface ContentGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export interface EmailGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  contentTitle: string;
  source: string;
}
