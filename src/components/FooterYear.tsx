'use client';

import { useEffect, useState } from 'react';

export function FooterYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // Return null during SSR to avoid hydration mismatch
  if (year === null) {
    return <span>2026</span>;
  }

  return <span>{year}</span>;
}
