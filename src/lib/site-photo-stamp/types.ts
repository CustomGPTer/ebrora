// src/lib/site-photo-stamp/types.ts
//
// Core types for the Site Photo Stamp resource.
// All processing is on-device: no server uploads, no server persistence.

/** Every template the user can choose. */
export type TemplateId =
  | "construction-record"
  | "close-call"
  | "near-miss"
  | "good-practice"
  | "safety-observation"
  | "defect-snag"
  | "quality-record"
  | "progress-photo"
  | "delivery-record"
  | "plant-inspection"
  | "permit-photo"
  | "environmental-record"
  | "concrete-pour"
  | "services"
  | "commissioning"
  | "dilapidation"
  | "excavation"
  | "before-after";

/** Variant style within a template (user can pick, e.g. solid vs outline). */
export type VariantId = "solid" | "outline" | "icon";

/** Iconography for the 'icon' variant. */
export type StampIcon = "check" | "cross" | "warning" | "eye" | "clipboard";

export interface TemplateVariant {
  id: VariantId;
  label: string;
  /** Background colour of the stamp card. */
  accentColor: string;
  /** Text colour on top of accentColor. */
  textColor: string;
  /** Optional border colour (used by 'outline' variant). */
  borderColor?: string;
  /** Optional badge icon (used by 'icon' variant). */
  icon?: StampIcon;
}

export interface Template {
  id: TemplateId;
  title: string;
  description: string;
  /** Primary brand colour used in previews and nav highlights. */
  baseColor: string;
  /** 2–3 variants per template. */
  variants: TemplateVariant[];
  /** Forces side-by-side capture. Only set for before-after. */
  forceTwoUp?: boolean;
}

/**
 * A single saved record in the on-device gallery (IndexedDB, Batch 4).
 * Declared here so templates + capture can reference it from Batch 1.
 */
export interface StampedRecord {
  id: string;
  templateId: TemplateId;
  variantId: VariantId;
  /** PNG blob of the final stamped image. */
  imageBlob: Blob;
  /** Tiny JPEG thumbnail for the gallery grid. */
  thumbnailBlob: Blob;
  /** Metadata shown on the stamp. */
  meta: StampMeta;
  /** Stamp creation time (device clock). */
  createdAt: number;
}

export interface StampMeta {
  templateTitle: string;
  /** ISO 8601 string — EXIF date if present, else device clock. */
  timestamp: string;
  /** Source of timestamp — for disclosure in bulk exports. */
  timestampSource: "exif" | "device";
  /** Geolocation (captured at photo time). */
  lat?: number;
  lon?: number;
  /** Reverse-geocoded address (optional, settings-controlled). */
  address?: string;
  /** Short unique ID shown on stamp (e.g. NWCYH33XNH4UDB). */
  uniqueId: string;
  /** Optional context fields (all settings-toggleable). */
  projectName?: string;
  siteName?: string;
  contractor?: string;
  operative?: string;
  /** Optional free-text note rendered below the template title on the stamp.
   *  Wraps to a maximum of 3 lines at the card width. */
  note?: string;
}

/** User settings, persisted to localStorage (Batch 6). */
export interface Settings {
  defaultTemplate: TemplateId;
  defaultVariant: VariantId;
  showAddress: boolean;
  showCoords: boolean;
  coordFormat: "decimal" | "dms";
  timestampFormat: "24h" | "12h";
  projectName: string;
  siteName: string;
  contractor: string;
  operative: string;
  companyName: string;
  /** Data URL of user's custom logo. Paid-tier only; enforced at render. */
  companyLogoDataUrl: string;
}

/** Default settings applied on first load. */
export const DEFAULT_SETTINGS: Settings = {
  defaultTemplate: "construction-record",
  defaultVariant: "solid",
  showAddress: true,
  showCoords: true,
  coordFormat: "decimal",
  timestampFormat: "24h",
  projectName: "",
  siteName: "",
  contractor: "",
  operative: "",
  companyName: "",
  companyLogoDataUrl: "",
};

/** Subscription tier — mirrors session.user.subscriptionTier. */
export type Tier = "FREE" | "STARTER" | "STANDARD" | "PROFESSIONAL" | "UNLIMITED";
