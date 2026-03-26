"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

interface SearchItem {
  title: string;
  slug: string;
  href: string;
  categorySlug: string;
  categoryName: string;
  subcategoryName: string;
  fileType: string;
  fileTypeLabel: string;
}

interface FreeTemplateSearchProps {
  items: SearchItem[];
}

const FILE_TYPE_OPTIONS = [
  { value: "", label: "All formats" },
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "xlsm", label: "Excel Macros (.xlsm)" },
  { value: "docx", label: "Word (.docx)" },
  { value: "pptx", label: "PowerPoint (.pptx)" },
  { value: "pdf", label: "PDF (.pdf)" },
];

const FILE_TYPE_BADGE_COLORS: Record<string, string> = {
  xlsx: "bg-emerald-50 text-emerald-700",
  xlsm: "bg-emerald-50 text-emerald-700",
  docx: "bg-blue-50 text-blue-700",
  pptx: "bg-orange-50 text-orange-700",
  pdf: "bg-red-50 text-red-700",
};

export function FreeTemplateSearch({ items }: FreeTemplateSearchProps) {
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Derive unique categories from the data for display
  const categoryOptions = useMemo(() => {
    const cats = new Map<string, string>();
    for (const item of items) {
      if (!cats.has(item.categorySlug)) {
        cats.set(item.categorySlug, item.categoryName);
      }
    }
    return [
      { value: "", label: "All categories" },
      ...Array.from(cats.entries()).map(([slug, name]) => ({
        value: slug,
        label: name,
      })),
    ];
  }, [items]);

  const [category, setCategory] = useState("");

  const search = useCallback(
    (q: string, ft: string, cat: string) => {
      // Filter by file type and category first
      let pool = items;
      if (ft) pool = pool.filter((item) => item.fileType === ft);
      if (cat) pool = pool.filter((item) => item.categorySlug === cat);

      if (q.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      const lower = q.toLowerCase();
      const scored = pool
        .map((item) => {
          const title = item.title.toLowerCase();
          let score = 0;
          if (title === lower) score = 100;
          else if (title.startsWith(lower)) score = 80;
          else if (title.includes(lower)) score = 60;
          else {
            const words = lower.split(/\s+/);
            const matches = words.filter((w) => title.includes(w)).length;
            score = (matches / words.length) * 40;
          }
          return { item, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((s) => s.item);

      setResults(scored);
      setIsOpen(scored.length > 0);
      setActiveIdx(-1);
    },
    [items]
  );

  useEffect(() => {
    search(query, fileType, category);
  }, [query, fileType, category, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(item: SearchItem) {
    setIsOpen(false);
    setQuery("");
    router.push(item.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      navigate(results[activeIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto mb-10">
      {/* Filter row */}
      <div className="flex gap-2 mb-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B5745]/30 focus:border-[#1B5745] transition-all text-gray-600"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          className="w-48 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B5745]/30 focus:border-[#1B5745] transition-all text-gray-600"
        >
          {FILE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search input — identical to TbtSearch */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            query.length >= 2 && results.length > 0 && setIsOpen(true)
          }
          placeholder="Search free templates..."
          className="w-full pl-12 pr-4 py-3.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B5745]/30 focus:border-[#1B5745] transition-all placeholder:text-gray-400"
        />
        {query.length > 0 && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown — identical styling to TbtSearch with halved bottom padding */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {results.map((item, idx) => (
            <button
              key={`${item.categorySlug}-${item.subcategoryName}-${item.slug}`}
              onClick={() => navigate(item)}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`w-full text-left px-4 pt-3 pb-1.5 flex items-start gap-3 transition-colors ${
                idx === activeIdx ? "bg-[#1B5745]/5" : "hover:bg-gray-50"
              } ${idx > 0 ? "border-t border-gray-100" : ""}`}
            >
              <span className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-[#1B5745]/8 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-[#1B5745]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.categoryName} &rsaquo; {item.subcategoryName}
                </p>
              </div>
              <span
                className={`shrink-0 ml-auto mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  FILE_TYPE_BADGE_COLORS[item.fileType] ||
                  "bg-gray-50 text-gray-500"
                }`}
              >
                {item.fileTypeLabel}
              </span>
            </button>
          ))}
          {results.length === 0 && query.length >= 2 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No templates found for &ldquo;{query}&rdquo;
              {fileType && ` in ${FILE_TYPE_OPTIONS.find((o) => o.value === fileType)?.label || fileType}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
