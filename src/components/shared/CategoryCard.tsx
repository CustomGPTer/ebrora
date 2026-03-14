// src/components/shared/CategoryCard.tsx
import Link from "next/link";

interface CategoryCardProps {
  title: string;
  description: string;
  href: string;
  count?: number;
  code?: string;
  icon?: React.ReactNode;
}

export function CategoryCard({
  title,
  description,
  href,
  count,
  code,
  icon,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B5745]/30 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        {/* Icon or code badge */}
        {icon ? (
          <div className="w-10 h-10 rounded-lg bg-[#1B5745]/8 flex items-center justify-center text-[#1B5745] shrink-0 group-hover:bg-[#1B5745]/15 transition-colors">
            {icon}
          </div>
        ) : code ? (
          <div className="w-10 h-10 rounded-lg bg-[#1B5745]/8 flex items-center justify-center shrink-0 group-hover:bg-[#1B5745]/15 transition-colors">
            <span className="text-[10px] font-bold text-[#1B5745] tracking-tight">
              {code.split(".").pop()}
            </span>
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1B5745] transition-colors truncate">
              {title}
            </h3>
            {typeof count === "number" && (
              <span className="shrink-0 text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-[#1B5745] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
