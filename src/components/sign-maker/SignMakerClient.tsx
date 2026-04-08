// src/components/sign-maker/SignMakerClient.tsx
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  CATEGORIES,
  ICONS,
  PAPER_SIZES,
  TEXT_SIZES,
  FONTS,
  iconSrc,
  categoryForCode,
  type SignIcon,
  type SignCategory,
  type CategoryMeta,
} from "@/lib/sign-maker-data";

/* ─────────────── helpers ─────────────── */
const cx = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

interface BatchItem {
  icon: SignIcon | null; // null = custom text-only
  lines: string[];
  textSize: string;
  font: string;
  paperSize: string;
  orientation: string;
  showBorder: boolean;
  customBg: string;
  customBorder: string;
  customTextColour: string;
  iconOffsetX: number;
  iconOffsetY: number;
}

/* ─────────────── component ─────────────── */
export default function SignMakerClient() {
  const { data: session } = useSession();

  // ── state ──
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedCat, setSelectedCat] = useState<SignCategory | "custom" | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<SignIcon | null>(null);
  const [search, setSearch] = useState("");
  const [showAllIcons, setShowAllIcons] = useState(false);

  // editor state
  const [lines, setLines] = useState<string[]>([""]);
  const [textSize, setTextSize] = useState("m");
  const [paperSize, setPaperSize] = useState("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [font, setFont] = useState("standard");
  const [showBorder, setShowBorder] = useState(true);
  const [customBg, setCustomBg] = useState("#FFFFFF");
  const [customBorder, setCustomBorder] = useState("#333333");
  const [customTextColour, setCustomTextColour] = useState("#333333");
  const [iconOffsetX, setIconOffsetX] = useState(0);
  const [iconOffsetY, setIconOffsetY] = useState(-8); // default 8% higher than centre

  // batch
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Google Fonts
  useEffect(() => {
    const families = FONTS.map((f) => f.gf).join("&family=");
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const check = () => {
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => setFontsLoaded(true));
      } else {
        setTimeout(() => setFontsLoaded(true), 2000);
      }
    };
    link.onload = check;
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // derived
  const isCustom = selectedCat === "custom";
  const cat: CategoryMeta | undefined = isCustom ? undefined : CATEGORIES.find((c) => c.id === selectedCat);
  const sz = PAPER_SIZES.find((s) => s.id === paperSize)!;
  const ts = TEXT_SIZES.find((t) => t.id === textSize)!;
  const fn = FONTS.find((f) => f.id === font)!;
  const isLandscape = orientation === "landscape";
  const pageW = isLandscape ? sz.h : sz.w;
  const pageH = isLandscape ? sz.w : sz.h;

  const signBg = isCustom ? customBg : cat?.bg || "#fff";
  const signBorder = isCustom ? customBorder : cat?.border || "#333";
  const textColour = isCustom
    ? customTextColour
    : selectedCat === "warning"
      ? "#333"
      : selectedCat === "prohibition"
        ? "#333"
        : "#FFF";

  // filtered icons for current category
  const catIcons = useMemo(() => {
    let icons = selectedCat && selectedCat !== "custom"
      ? ICONS.filter((i) => i.category === selectedCat)
      : [];
    const hasSearch = search.trim().length > 0;
    if (hasSearch) {
      const q = search.toLowerCase();
      icons = icons.filter(
        (i) => i.label.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
      );
    }
    // Only filter by relevance when NOT searching
    if (!showAllIcons && !hasSearch) {
      icons = icons.filter((i) => i.relevance <= 2);
    }
    return icons.sort((a, b) => a.relevance - b.relevance || a.code.localeCompare(b.code));
  }, [selectedCat, search, showAllIcons]);

  const nicheCount = useMemo(() => {
    if (!selectedCat || selectedCat === "custom") return 0;
    return ICONS.filter((i) => i.category === selectedCat && i.relevance === 3).length;
  }, [selectedCat]);

  // handlers
  const selectCat = (id: SignCategory | "custom") => {
    setSelectedCat(id);
    setSelectedIcon(null);
    setSearch("");
    setShowAllIcons(false);
    setLines([""]);
    setIconOffsetX(0);
    setIconOffsetY(-8);
    if (id === "custom") {
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const selectIcon = (icon: SignIcon) => {
    setSelectedIcon(icon);
    setIconOffsetX(0);
    setIconOffsetY(-8);
    setStep(2);
  };

  const goBack = () => {
    if (step === 2 && !isCustom) setStep(1);
    else if (step === 2 && isCustom) setStep(0);
    else if (step === 1) setStep(0);
  };

  const updateLine = (i: number, val: string) => {
    const n = [...lines];
    n[i] = val;
    setLines(n);
  };
  const addLine = () => {
    if (lines.length < 4) setLines([...lines, ""]);
  };
  const removeLine = (i: number) => {
    if (lines.length > 1) setLines(lines.filter((_, j) => j !== i));
  };

  const addToBatch = () => {
    setBatch((prev) => [
      ...prev,
      { icon: selectedIcon, lines: [...lines], textSize, font, paperSize, orientation, showBorder, customBg, customBorder, customTextColour, iconOffsetX, iconOffsetY },
    ]);
  };

  // ── PDF export ──
  const exportPDF = useCallback(async () => {
    if (!fontsLoaded) {
      alert("Fonts still loading — please wait a moment.");
      return;
    }
    if (!session) {
      signIn();
      return;
    }
    const el = previewRef.current;
    if (!el) return;

    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      await document.fonts.ready;

      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: paperSize,
      });
      pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
      pdf.save(`sign-${selectedIcon?.code || "custom"}-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("PDF export failed — please try again.");
    } finally {
      setExporting(false);
    }
  }, [fontsLoaded, session, isLandscape, paperSize, pageW, pageH, selectedIcon]);

  // ── batch PDF ──
  const exportBatchPDF = useCallback(async () => {
    if (!session) { signIn(); return; }
    if (batch.length === 0) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      await document.fonts.ready;

      // Use the first item's size/orientation for the whole batch
      const b0 = batch[0];
      const bSz = PAPER_SIZES.find((s) => s.id === b0.paperSize)!;
      const bLand = b0.orientation === "landscape";
      const bW = bLand ? bSz.h : bSz.w;
      const bH = bLand ? bSz.w : bSz.h;

      const pdf = new jsPDF({ orientation: bLand ? "landscape" : "portrait", unit: "mm", format: b0.paperSize });

      // We need to render each sign offscreen
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      for (let i = 0; i < batch.length; i++) {
        if (i > 0) pdf.addPage(b0.paperSize, bLand ? "landscape" : "portrait");
        const item = batch[i];
        const bCat = item.icon ? categoryForCode(item.icon.code) : undefined;
        const bFn = FONTS.find((f) => f.id === item.font)!;
        const bTs = TEXT_SIZES.find((t) => t.id === item.textSize)!;
        const bg = item.icon ? (bCat?.bg || "#fff") : item.customBg;
        const border = item.icon ? (bCat?.border || "#333") : item.customBorder;
        const txtCol = item.icon
          ? (item.icon.category === "warning" || item.icon.category === "prohibition" ? "#333" : "#FFF")
          : item.customTextColour;

        const div = document.createElement("div");
        const scale = 1.5;
        const w = bW * scale;
        const h = bH * scale;
        const textLines = item.lines.filter((l) => l.trim());
        const baseFontMM = item.paperSize === "a3" ? 14 : 10;
        const fontSize = baseFontMM * bTs.factor * scale;
        const hasIcon = !!item.icon;
        const iconScale = hasIcon ? Math.max(0.3, 1 - textLines.length * 0.12) : 0;

        div.style.cssText = `width:${w}px;height:${h}px;background:${bg};${item.showBorder ? `border:${w * 0.015}px solid ${border};` : ""}border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${w * 0.06}px;box-sizing:border-box;font-family:${bFn.family};`;

        if (hasIcon) {
          const iconWrap = document.createElement("div");
          iconWrap.style.cssText = `width:100%;display:flex;align-items:center;justify-content:center;flex:0 0 ${iconScale * 50}%;margin-bottom:${w * 0.03}px;transform:translate(${item.iconOffsetX * w / 100}px, ${item.iconOffsetY * h / 100}px);`;
          const img = document.createElement("img");
          img.src = iconSrc(item.icon!.code);
          img.style.cssText = `width:${iconScale * 50}%;max-height:100%;object-fit:contain;`;
          iconWrap.appendChild(img);
          div.appendChild(iconWrap);
        }

        for (const line of textLines) {
          const p = document.createElement("div");
          p.textContent = line;
          p.style.cssText = `font-size:${fontSize}px;font-weight:700;color:${txtCol};text-align:center;line-height:1.15;letter-spacing:0.02em;text-transform:uppercase;word-break:break-word;max-width:95%;`;
          div.appendChild(p);
        }

        container.appendChild(div);

        // wait for images to load
        const imgs = div.querySelectorAll("img");
        await Promise.all(
          Array.from(imgs).map(
            (img) =>
              new Promise<void>((res) => {
                if (img.complete) res();
                else {
                  img.onload = () => res();
                  img.onerror = () => res();
                }
              })
          )
        );

        const canvas = await html2canvas(div, { scale: 3, useCORS: true, backgroundColor: null });
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, bW, bH);
        container.removeChild(div);
      }

      document.body.removeChild(container);
      pdf.save(`signs-batch-${Date.now()}.pdf`);
    } catch (err) {
      console.error("Batch PDF error:", err);
      alert("Batch PDF export failed.");
    } finally {
      setExporting(false);
    }
  }, [session, batch]);

  /* ─────────── RENDER: sign preview ─────────── */
  const renderPreview = () => {
    const textLines = lines.filter((l) => l.trim());
    const baseFontMM = paperSize === "a3" ? 14 : 10;
    const fontSize = baseFontMM * ts.factor;
    const hasIcon = !!selectedIcon;
    const iconScale = hasIcon ? Math.max(0.3, 1 - textLines.length * 0.12) : 0;
    const scale = 1.5;
    const w = pageW * scale;
    const h = pageH * scale;

    return (
      <div
        ref={previewRef}
        style={{
          width: w,
          height: h,
          background: signBg,
          border: showBorder ? `${w * 0.015}px solid ${signBorder}` : "none",
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: w * 0.06,
          boxSizing: "border-box",
          fontFamily: fn.family,
          overflow: "hidden",
        }}
      >
        {/* ICON */}
        {hasIcon && (
          <div
            style={{
              flex: `0 0 ${iconScale * 50}%`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              marginBottom: w * 0.03,
              transform: `translate(${iconOffsetX * w / 100}px, ${iconOffsetY * h / 100}px)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={iconSrc(selectedIcon!.code)}
              alt={selectedIcon!.label}
              style={{ maxWidth: "80%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
        )}

        {/* TEXT */}
        <div
          style={{
            flex: hasIcon ? "0 0 auto" : "1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            gap: fontSize * 0.3 * scale,
          }}
        >
          {(textLines.length > 0 ? textLines : [hasIcon ? "" : "YOUR TEXT HERE"]).map(
            (line, i) => (
              <div
                key={i}
                style={{
                  fontSize: fontSize * scale,
                  fontWeight: 700,
                  color: textColour,
                  textAlign: "center",
                  lineHeight: 1.15,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  wordBreak: "break-word",
                  maxWidth: "95%",
                }}
              >
                {line}
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  /* ─────────── STEP 0: CATEGORY PICKER ─────────── */
  if (step === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((c) => {
            const count = ICONS.filter((i) => i.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => selectCat(c.id)}
                className="group bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div
                  className={cx(
                    "w-12 h-12 mx-auto mb-2 flex items-center justify-center",
                    c.shape === "circle" || c.shape === "circle-bar" ? "rounded-full" : "rounded-lg"
                  )}
                  style={{ background: c.shape === "triangle" ? "transparent" : c.id === "prohibition" ? "#D42C2C" : c.bg }}
                >
                  {c.shape === "triangle" ? (
                    <svg viewBox="0 0 40 36" className="w-10 h-9">
                      <polygon points="20,2 38,34 2,34" fill="#FFC72C" stroke="#333" strokeWidth="2" />
                      <text x="20" y="28" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333">!</text>
                    </svg>
                  ) : c.shape === "circle-bar" ? (
                    <svg viewBox="0 0 40 40" className="w-8 h-8">
                      <circle cx="20" cy="20" r="17" fill="white" stroke="#D42C2C" strokeWidth="3" />
                      <line x1="8" y1="32" x2="32" y2="8" stroke="#D42C2C" strokeWidth="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
                      <rect x="3" y="3" width="18" height="18" rx="2" fill="white" opacity="0.6" />
                    </svg>
                  )}
                </div>
                <div className="font-bold text-sm text-gray-900 group-hover:text-[#1B5B50]">
                  {c.label}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{c.desc}</div>
                <div className="text-[11px] font-semibold text-[#1B5B50] mt-1">{count} icons</div>
              </button>
            );
          })}

          {/* Custom / Text Only */}
          <button
            onClick={() => selectCat("custom")}
            className="group bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-lg bg-gray-100">
              <span className="text-lg font-bold text-gray-400">Aa</span>
            </div>
            <div className="font-bold text-sm text-gray-900 group-hover:text-[#1B5B50]">
              Custom / Text Only
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Custom colours & text</div>
          </button>
        </div>
      </div>
    );
  }

  /* ─────────── STEP 1: ICON PICKER ─────────── */
  if (step === 1 && cat) {
    return (
      <div className="space-y-4">
        <button
          onClick={goBack}
          className="text-sm font-semibold text-[#1B5B50] hover:underline flex items-center gap-1"
        >
          ← Back to categories
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-sm flex-shrink-0"
            style={{ background: cat.id === "prohibition" ? "#D42C2C" : cat.bg }}
          />
          <h2 className="text-xl font-bold text-gray-900">{cat.label} Signs</h2>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {catIcons.length} shown
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons…"
          className="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5B50]/20 focus:border-[#1B5B50]"
        />

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {catIcons.map((icon) => (
            <button
              key={icon.code}
              onClick={() => selectIcon(icon)}
              className={cx(
                "bg-white rounded-lg border p-2 text-center hover:shadow-md hover:-translate-y-0.5 transition-all",
                selectedIcon?.code === icon.code
                  ? "border-[#1B5B50] border-2"
                  : "border-gray-200"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconSrc(icon.code)}
                alt={icon.label}
                className="w-12 h-12 mx-auto mb-1 object-contain"
                loading="lazy"
              />
              <div className="text-[10px] font-semibold text-gray-700 leading-tight line-clamp-2">
                {icon.label}
              </div>
              <div className="text-[9px] text-gray-400 mt-0.5 uppercase">{icon.code}</div>
            </button>
          ))}
        </div>

        {/* Show all toggle */}
        {nicheCount > 0 && !showAllIcons && (
          <button
            onClick={() => setShowAllIcons(true)}
            className="text-sm font-semibold text-[#1B5B50] hover:underline"
          >
            + Show {nicheCount} more specialist icons
          </button>
        )}
        {showAllIcons && nicheCount > 0 && (
          <button
            onClick={() => setShowAllIcons(false)}
            className="text-sm font-semibold text-gray-500 hover:underline"
          >
            Hide specialist icons
          </button>
        )}
      </div>
    );
  }

  /* ─────────── STEP 2: EDITOR ─────────── */
  return (
    <div className="space-y-4">
      <button
        onClick={goBack}
        className="text-sm font-semibold text-[#1B5B50] hover:underline flex items-center gap-1"
      >
        ← {isCustom ? "Back to categories" : "Back to icons"}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* ── CONTROLS ── */}
        <div className="space-y-4">
          {/* Selected icon info */}
          {selectedIcon && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconSrc(selectedIcon.code)}
                alt={selectedIcon.label}
                className="w-10 h-10 object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold text-sm text-gray-900 truncate">{selectedIcon.label}</div>
                <div className="text-xs text-gray-500 uppercase">{selectedIcon.code} · {cat?.label}</div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="ml-auto text-xs font-semibold text-[#1B5B50] hover:underline flex-shrink-0"
              >
                Change
              </button>
            </div>
          )}

          {isCustom && (
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="font-bold text-sm text-gray-900">Custom Text-Only Sign</div>
              <div className="text-xs text-gray-500">No icon — pick your own colours</div>
            </div>
          )}

          {/* Icon position */}
          {selectedIcon && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Icon Position
              </label>
              <div className="inline-grid grid-cols-3 gap-1">
                <div />
                <button
                  onClick={() => setIconOffsetY((v) => v - 4)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors"
                  title="Move icon up"
                >
                  ↑
                </button>
                <div />
                <button
                  onClick={() => setIconOffsetX((v) => v - 4)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors"
                  title="Move icon left"
                >
                  ←
                </button>
                <button
                  onClick={() => { setIconOffsetX(0); setIconOffsetY(-8); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[#1B5B50] font-bold text-[10px] transition-colors"
                  title="Reset to default position"
                >
                  ↺
                </button>
                <button
                  onClick={() => setIconOffsetX((v) => v + 4)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors"
                  title="Move icon right"
                >
                  →
                </button>
                <div />
                <button
                  onClick={() => setIconOffsetY((v) => v + 4)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors"
                  title="Move icon down"
                >
                  ↓
                </button>
                <div />
              </div>
            </div>
          )}

          {/* Text lines */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Sign Text (up to 4 lines)
            </label>
            {lines.map((line, i) => (
              <div key={i} className="flex gap-1.5 mb-1.5">
                <input
                  value={line}
                  onChange={(e) => updateLine(i, e.target.value)}
                  placeholder={`Line ${i + 1}`}
                  maxLength={60}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5B50]/20 focus:border-[#1B5B50]"
                />
                {lines.length > 1 && (
                  <button
                    onClick={() => removeLine(i)}
                    className="px-2 text-red-500 hover:bg-red-50 rounded-lg text-lg font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {lines.length < 4 && (
              <button
                onClick={addLine}
                className="text-xs font-semibold text-[#1B5B50] hover:underline mt-1"
              >
                + Add line
              </button>
            )}
          </div>

          {/* Text size */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Text Size
            </label>
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {TEXT_SIZES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTextSize(t.id)}
                  className={cx(
                    "flex-1 py-1.5 text-xs font-bold rounded-md transition-colors",
                    textSize === t.id ? "bg-[#1B5B50] text-white" : "text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Font
            </label>
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  className={cx(
                    "flex-1 py-1.5 text-xs font-bold rounded-md transition-colors",
                    font === f.id ? "bg-[#1B5B50] text-white" : "text-gray-600 hover:bg-gray-200"
                  )}
                  style={{ fontFamily: f.family }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paper size + Orientation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Paper Size
              </label>
              <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {PAPER_SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setPaperSize(s.id)}
                    className={cx(
                      "flex-1 py-1.5 text-xs font-bold rounded-md transition-colors",
                      paperSize === s.id ? "bg-[#1B5B50] text-white" : "text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Orientation
              </label>
              <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {(["portrait", "landscape"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrientation(o)}
                    className={cx(
                      "flex-1 py-1.5 text-xs font-bold rounded-md transition-colors capitalize",
                      orientation === o ? "bg-[#1B5B50] text-white" : "text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Border toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBorder}
              onChange={(e) => setShowBorder(e.target.checked)}
              className="w-4 h-4 rounded accent-[#1B5B50]"
            />
            <span className="text-sm font-semibold text-gray-700">Show border</span>
          </label>

          {/* Custom colours */}
          {isCustom && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Background</label>
                <input
                  type="color"
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  className="w-full h-9 border-0 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Border</label>
                <input
                  type="color"
                  value={customBorder}
                  onChange={(e) => setCustomBorder(e.target.value)}
                  className="w-full h-9 border-0 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Text</label>
                <input
                  type="color"
                  value={customTextColour}
                  onChange={(e) => setCustomTextColour(e.target.value)}
                  className="w-full h-9 border-0 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="flex-1 bg-[#1B5B50] text-white rounded-lg py-3 px-4 font-bold text-sm hover:bg-[#144840] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating…
                </>
              ) : !session ? (
                "Sign in to download"
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={addToBatch}
              className="px-4 py-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              + Batch
            </button>
          </div>

          {/* Batch list */}
          {batch.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Batch ({batch.length} sign{batch.length !== 1 ? "s" : ""})
              </div>
              {batch.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate">
                    {b.icon?.label || "Custom"}: {b.lines.filter((l) => l).join(" / ") || "(no text)"}
                  </span>
                  <button
                    onClick={() => setBatch(batch.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={exportBatchPDF}
                disabled={exporting}
                className="w-full bg-[#1B5B50] text-white rounded-lg py-2 px-3 text-xs font-bold hover:bg-[#144840] transition-colors disabled:opacity-50"
              >
                {exporting ? "Generating…" : "Download Batch PDF"}
              </button>
            </div>
          )}

          {/* Font loading indicator */}
          {!fontsLoaded && (
            <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Loading fonts…
            </div>
          )}
        </div>

        {/* ── PREVIEW ── */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Live Preview
          </div>
          <div className="bg-gray-200 rounded-xl p-6 inline-flex items-center justify-center">
            {renderPreview()}
          </div>
          <div className="text-xs text-gray-400">
            {paperSize.toUpperCase()} · {orientation} · {fn.label} · {ts.label} text
          </div>
        </div>
      </div>
    </div>
  );
}
