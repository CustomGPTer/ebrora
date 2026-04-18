// =============================================================================
// Visualise — Lucide Icon Wrapper
// Re-exports a curated set of Lucide icons used across presets, plus shared
// icon prop defaults to keep visual style consistent.
//
// Presets should import from here rather than directly from 'lucide-react' to
// make it easy to swap icon libraries later if needed.
// =============================================================================

export {
  // Navigation / direction
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  // Status
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  // Structure
  Circle,
  Square,
  Triangle,
  // Common concepts
  User,
  Users,
  Settings,
  FileText,
  Clock,
  Calendar,
  MapPin,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  GitBranch,
  Network,
  Layers,
  Hammer,
  HardHat,
  Wrench,
  Shield,
  ShieldCheck,
  ClipboardList,
  ClipboardCheck,
} from 'lucide-react';

/** Default props applied to Lucide icons used inside preset SVGs. */
export const LUCIDE_DEFAULT_PROPS = {
  size: 20,
  strokeWidth: 2,
  absoluteStrokeWidth: false,
} as const;

/** Common Lucide icon component type for preset use. */
export type LucideIconProps = {
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
};
