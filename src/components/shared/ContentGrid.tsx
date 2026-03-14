// src/components/shared/ContentGrid.tsx

interface ContentGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

const gridClasses: Record<number, string> = {
  2: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5",
  3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5",
  4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5",
};

export function ContentGrid({ children, columns = 3 }: ContentGridProps) {
  return <div className={gridClasses[columns]}>{children}</div>;
}
