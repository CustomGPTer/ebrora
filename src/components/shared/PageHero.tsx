// src/components/shared/PageHero.tsx

interface PageHeroProps {
  title: React.ReactNode;
  subtitle?: string;
  badge?: string;
  centered?: boolean;
}

export function PageHero({ title, subtitle, badge, centered }: PageHeroProps) {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-5 sm:pt-14 sm:pb-7 ${centered ? "text-center" : ""}`}>
        {badge && (
          <span className={`inline-block text-xs font-semibold uppercase tracking-wider text-[#1B5745] bg-[#1B5745]/8 px-3 py-1 rounded-full mb-4`}>
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className={`text-base sm:text-lg text-gray-500 mt-3 leading-relaxed ${centered ? "max-w-3xl mx-auto" : "max-w-2xl"}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
