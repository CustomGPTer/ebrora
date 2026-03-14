// src/components/shared/StatusBadge.tsx

interface StatusBadgeProps {
  status: "COMING_SOON" | "LIVE" | "FREE" | "LOCKED";
}

const badgeConfig = {
  COMING_SOON: {
    label: "Coming Soon",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  LIVE: {
    label: "Live",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  FREE: {
    label: "Free",
    classes: "bg-[#1B5745]/8 text-[#1B5745] border-[#1B5745]/15",
  },
  LOCKED: {
    label: "Sign Up Required",
    classes: "bg-gray-50 text-gray-500 border-gray-200",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = badgeConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.classes}`}
    >
      {status === "LIVE" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
