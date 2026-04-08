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

const cx = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

type TemplateId = "default" | "panel" | "half" | "banner";

interface TemplateMeta { id: TemplateId; label: string; desc: string; }

const TEMPLATES: TemplateMeta[] = [
  { id: "default", label: "Full Colour", desc: "Category-coloured background" },
  { id: "panel", label: "Panel", desc: "White bg, rounded text box" },
  { id: "half", label: "Half Panel", desc: "White top, coloured bottom" },
  { id: "banner", label: "Banner", desc: "White bg, thin colour strip" },
];

interface BatchItem {
  icons: SignIcon[];
  lines: string[];
  textSize: string;
  font: string;
  paperSize: string;
  orientation: string;
  showBorder: boolean;
  template: TemplateId;
  customBg: string;
  customBorder: string;
  customTextColour: string;
  iconOffsetX: number;
  iconOffsetY: number;
  panelOffsetX: number;
  panelOffsetY: number;
}

export default function SignMakerClient() {
  const { data: session } = useSession();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedCat, setSelectedCat] = useState<SignCategory | "custom" | null>(null);
  const [selectedIcons, setSelectedIcons] = useState<SignIcon[]>([]);
  const [search, setSearch] = useState("");
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [lines, setLines] = useState<string[]>([""]);
  const [textSize, setTextSize] = useState("m");
  const [paperSize, setPaperSize] = useState("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [font, setFont] = useState("standard");
  const [showBorder, setShowBorder] = useState(true);
  const [template, setTemplate] = useState<TemplateId>("default");
  const [customBg, setCustomBg] = useState("#FFFFFF");
  const [customBorder, setCustomBorder] = useState("#333333");
  const [customTextColour, setCustomTextColour] = useState("#333333");
  const [iconOffsetX, setIconOffsetX] = useState(0);
  const [iconOffsetY, setIconOffsetY] = useState(-8);
  const [panelOffsetX, setPanelOffsetX] = useState(0);
  const [panelOffsetY, setPanelOffsetY] = useState(0);
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const families = FONTS.map((f) => f.gf).join("&family=");
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const check = () => { if (document.fonts?.ready) { document.fonts.ready.then(() => setFontsLoaded(true)); } else { setTimeout(() => setFontsLoaded(true), 2000); } };
    link.onload = check;
    return () => { document.head.removeChild(link); };
  }, []);

  const isCustom = selectedCat === "custom";
  const cat: CategoryMeta | undefined = isCustom ? undefined : CATEGORIES.find((c) => c.id === selectedCat);
  const sz = PAPER_SIZES.find((s) => s.id === paperSize)!;
  const ts = TEXT_SIZES.find((t) => t.id === textSize)!;
  const fn = FONTS.find((f) => f.id === font)!;
  const isLandscape = orientation === "landscape";
  const pageW = isLandscape ? sz.h : sz.w;
  const pageH = isLandscape ? sz.w : sz.h;
  const catColour = isCustom ? customBg : cat?.bg || "#fff";
  const catBorder = isCustom ? customBorder : cat?.border || "#333";
  const textColourDefault = isCustom ? customTextColour : selectedCat === "warning" ? "#21251E" : selectedCat === "prohibition" ? "#0E1313" : "#FFF";
  const panelTextColour = isCustom ? customTextColour : selectedCat === "warning" ? "#21251E" : "#FFF";

  const catIcons = useMemo(() => {
    let icons = selectedCat && selectedCat !== "custom" ? ICONS.filter((i) => i.category === selectedCat) : [];
    const hasSearch = search.trim().length > 0;
    if (hasSearch) { const q = search.toLowerCase(); icons = icons.filter((i) => i.label.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)); }
    if (!showAllIcons && !hasSearch) { icons = icons.filter((i) => i.relevance <= 2); }
    return icons.sort((a, b) => a.relevance - b.relevance || a.code.localeCompare(b.code));
  }, [selectedCat, search, showAllIcons]);

  const nicheCount = useMemo(() => {
    if (!selectedCat || selectedCat === "custom") return 0;
    return ICONS.filter((i) => i.category === selectedCat && i.relevance === 3).length;
  }, [selectedCat]);

  const selectCat = (id: SignCategory | "custom") => { setSelectedCat(id); setSelectedIcons([]); setSearch(""); setShowAllIcons(false); setLines([""]); setTemplate("default"); setIconOffsetX(0); setIconOffsetY(-8); setPanelOffsetX(0); setPanelOffsetY(0); if (id === "custom") { setStep(2); } else { setStep(1); } };
  const toggleIcon = (icon: SignIcon) => { setSelectedIcons((prev) => { const exists = prev.find((i) => i.code === icon.code); if (exists) return prev.filter((i) => i.code !== icon.code); if (prev.length >= 4) return prev; return [...prev, icon]; }); };
  const goToEditor = () => { if (selectedIcons.length > 0) { setIconOffsetX(0); setIconOffsetY(-8); setStep(2); } };
  const goBack = () => { if (step === 2 && !isCustom) setStep(1); else if (step === 2 && isCustom) setStep(0); else if (step === 1) setStep(0); };
  const updateLine = (i: number, val: string) => { const n = [...lines]; n[i] = val; setLines(n); };
  const addLine = () => { if (lines.length < 4) setLines([...lines, ""]); };
  const removeLine = (i: number) => { if (lines.length > 1) setLines(lines.filter((_, j) => j !== i)); };
  const addToBatch = () => { setBatch((prev) => [...prev, { icons: [...selectedIcons], lines: [...lines], textSize, font, paperSize, orientation, showBorder, template, customBg, customBorder, customTextColour, iconOffsetX, iconOffsetY, panelOffsetX, panelOffsetY }]); };

  const exportPDF = useCallback(async () => {
    if (!fontsLoaded) { alert("Fonts still loading — please wait a moment."); return; }
    if (!session) { signIn(); return; }
    const el = previewRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      await document.fonts.ready;
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "mm", format: paperSize });
      pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
      pdf.save(`sign-${selectedIcons[0]?.code || "custom"}-${Date.now()}.pdf`);
    } catch (err) { console.error("PDF export error:", err); alert("PDF export failed — please try again."); } finally { setExporting(false); }
  }, [fontsLoaded, session, isLandscape, paperSize, pageW, pageH, selectedIcons]);

  const exportBatchPDF = useCallback(async () => {
    if (!session) { signIn(); return; }
    if (batch.length === 0) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      await document.fonts.ready;
      const b0 = batch[0]; const bSz = PAPER_SIZES.find((s) => s.id === b0.paperSize)!; const bLand = b0.orientation === "landscape"; const bW = bLand ? bSz.h : bSz.w; const bH = bLand ? bSz.w : bSz.h;
      const pdf = new jsPDF({ orientation: bLand ? "landscape" : "portrait", unit: "mm", format: b0.paperSize });
      const container = document.createElement("div"); container.style.cssText = "position:fixed;left:-9999px;top:0;"; document.body.appendChild(container);
      for (let i = 0; i < batch.length; i++) {
        if (i > 0) pdf.addPage(b0.paperSize, bLand ? "landscape" : "portrait");
        const item = batch[i];
        const div = buildSignElement(item, bW, bH, 1.5);
        container.appendChild(div);
        const imgs = div.querySelectorAll("img");
        await Promise.all(Array.from(imgs).map((img) => new Promise<void>((res) => { if (img.complete) res(); else { img.onload = () => res(); img.onerror = () => res(); } })));
        const canvas = await html2canvas(div, { scale: 3, useCORS: true, backgroundColor: null });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, bW, bH);
        container.removeChild(div);
      }
      document.body.removeChild(container);
      pdf.save(`signs-batch-${Date.now()}.pdf`);
    } catch (err) { console.error("Batch PDF error:", err); alert("Batch PDF export failed."); } finally { setExporting(false); }
  }, [session, batch]);

  function buildSignElement(item: BatchItem, pW: number, pH: number, scale: number): HTMLDivElement {
    const bCat = item.icons.length > 0 ? categoryForCode(item.icons[0].code) : undefined;
    const bFn = FONTS.find((f) => f.id === item.font)!;
    const bTs = TEXT_SIZES.find((t) => t.id === item.textSize)!;
    const bg = item.icons.length > 0 ? (bCat?.bg || "#fff") : item.customBg;
    const border = item.icons.length > 0 ? (bCat?.border || "#333") : item.customBorder;
    const tpl = item.template;
    const w = pW * scale; const h = pH * scale;
    const textLines = item.lines.filter((l) => l.trim());
    const baseFontMM = item.paperSize === "a3" ? 14 : 10;
    const fontSize = baseFontMM * bTs.factor * scale;
    const hasIcons = item.icons.length > 0;
    const panelTxt = item.icons.length > 0 ? (item.icons[0].category === "warning" ? "#21251E" : "#FFF") : item.customTextColour;
    const defaultTxt = item.icons.length > 0 ? (item.icons[0].category === "warning" ? "#21251E" : item.icons[0].category === "prohibition" ? "#0E1313" : "#FFF") : item.customTextColour;
    const isPanel = tpl !== "default";
    const signBg = isPanel ? "#FFFFFF" : bg;
    const div = document.createElement("div");
    div.style.cssText = `width:${w}px;height:${h}px;background:${signBg};${item.showBorder ? `border:${w * 0.015}px solid ${border};` : ""}border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:${tpl === "default" ? "center" : "flex-start"};box-sizing:border-box;font-family:${bFn.family};overflow:hidden;`;
    if (hasIcons) {
      const iconArea = document.createElement("div");
      const iconFlex = tpl === "banner" ? "55" : tpl === "half" ? "55" : tpl === "panel" ? "60" : "50";
      const iconCount = item.icons.length;
      iconArea.style.cssText = `flex:0 0 ${iconFlex}%;width:100%;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;padding:${w * 0.04}px;box-sizing:border-box;transform:translate(${item.iconOffsetX * w / 100}px,${item.iconOffsetY * h / 100}px);`;
      for (const icon of item.icons) {
        const img = document.createElement("img");
        img.src = iconSrc(icon.code);
        const size = iconCount === 1 ? 70 : iconCount === 2 ? 45 : 40;
        img.style.cssText = `width:${size}%;max-height:${iconCount <= 2 ? "90" : "45"}%;object-fit:contain;padding:${w * 0.01}px;`;
        iconArea.appendChild(img);
      }
      div.appendChild(iconArea);
    }
    if (textLines.length > 0) {
      const textArea = document.createElement("div");
      const pad = w * 0.04;
      const useTxt = tpl === "default" ? defaultTxt : panelTxt;
      if (tpl === "default") { textArea.style.cssText = `flex:1;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${pad}px;box-sizing:border-box;`; }
      else if (tpl === "panel") { textArea.style.cssText = `flex:0 0 auto;width:85%;background:${bg};border-radius:${w * 0.03}px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${pad * 1.2}px ${pad}px;margin-bottom:${pad}px;box-sizing:border-box;transform:translate(${item.panelOffsetX * w / 100}px,${item.panelOffsetY * h / 100}px);`; }
      else if (tpl === "half") { textArea.style.cssText = `flex:1;width:100%;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${pad}px;box-sizing:border-box;`; }
      else { textArea.style.cssText = `flex:0 0 auto;width:100%;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${pad * 0.8}px ${pad}px;box-sizing:border-box;transform:translate(${item.panelOffsetX * w / 100}px,${item.panelOffsetY * h / 100}px);`; }
      for (const line of textLines) {
        const p = document.createElement("div");
        p.textContent = line;
        p.style.cssText = `font-size:${fontSize}px;font-weight:700;color:${useTxt};text-align:center;line-height:1.2;letter-spacing:0.02em;text-transform:uppercase;word-break:break-word;max-width:95%;`;
        textArea.appendChild(p);
      }
      div.appendChild(textArea);
    }
    return div;
  }

  const renderPreview = () => {
    const textLines = lines.filter((l) => l.trim());
    const baseFontMM = paperSize === "a3" ? 14 : 10;
    const fontSize = baseFontMM * ts.factor;
    const hasIcons = selectedIcons.length > 0;
    const scale = 1.5;
    const w = pageW * scale; const h = pageH * scale; const pad = w * 0.04;
    const isPanel = template !== "default";
    const signBg = isPanel ? "#FFFFFF" : catColour;
    const useTxtCol = template === "default" ? textColourDefault : panelTextColour;
    const iconFlex = template === "banner" ? "55%" : template === "half" ? "55%" : template === "panel" ? "60%" : "50%";
    const iconCount = selectedIcons.length;
    const iconSize = iconCount === 1 ? "70%" : iconCount === 2 ? "45%" : "40%";
    const iconMaxH = iconCount <= 2 ? "90%" : "45%";

    const renderText = () => {
      if (textLines.length === 0 && hasIcons) return null;
      const displayLines = textLines.length > 0 ? textLines : [isCustom ? "YOUR TEXT HERE" : ""];
      const textContent = displayLines.map((line, i) => (
        <div key={i} style={{ fontSize: fontSize * scale, fontWeight: 700, color: useTxtCol, textAlign: "center", lineHeight: 1.2, letterSpacing: "0.02em", textTransform: "uppercase", wordBreak: "break-word", maxWidth: "95%" }}>{line}</div>
      ));
      if (template === "default") return <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", padding: pad, boxSizing: "border-box", gap: fontSize * 0.2 * scale }}>{textContent}</div>;
      if (template === "panel") return <div style={{ flex: "0 0 auto", width: "85%", background: catColour, borderRadius: w * 0.03, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `${pad * 1.2}px ${pad}px`, marginBottom: pad, boxSizing: "border-box", gap: fontSize * 0.2 * scale, transform: `translate(${panelOffsetX * w / 100}px, ${panelOffsetY * h / 100}px)` }}>{textContent}</div>;
      if (template === "half") return <div style={{ flex: "1", width: "100%", background: catColour, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: pad, boxSizing: "border-box", gap: fontSize * 0.2 * scale }}>{textContent}</div>;
      return <div style={{ flex: "0 0 auto", width: "100%", background: catColour, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `${pad * 0.8}px ${pad}px`, boxSizing: "border-box", gap: fontSize * 0.2 * scale, transform: `translate(${panelOffsetX * w / 100}px, ${panelOffsetY * h / 100}px)` }}>{textContent}</div>;
    };

    return (
      <div ref={previewRef} style={{ width: w, height: h, background: signBg, border: showBorder ? `${w * 0.015}px solid ${catBorder}` : "none", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: template === "default" ? "center" : "flex-start", boxSizing: "border-box", fontFamily: fn.family, overflow: "hidden" }}>
        {hasIcons && (
          <div style={{ flex: `0 0 ${iconFlex}`, width: "100%", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: pad, boxSizing: "border-box", transform: `translate(${iconOffsetX * w / 100}px, ${iconOffsetY * h / 100}px)` }}>
            {selectedIcons.map((icon) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={icon.code} src={iconSrc(icon.code)} alt={icon.label} style={{ width: iconSize, maxHeight: iconMaxH, objectFit: "contain", padding: w * 0.01 }} />
            ))}
          </div>
        )}
        {renderText()}
      </div>
    );
  };

  const renderTemplateThumbnail = (tpl: TemplateMeta) => {
    const active = template === tpl.id;
    const w = 56; const h = 72; const col = catColour; const bdr = catBorder;
    return (
      <button key={tpl.id} onClick={() => { setTemplate(tpl.id); setPanelOffsetX(0); setPanelOffsetY(0); }} className={cx("rounded-lg border-2 p-1 transition-all", active ? "border-[#1B5B50] shadow-md" : "border-gray-200 hover:border-gray-300")} title={tpl.desc}>
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
          {tpl.id === "default" ? <rect x="1" y="1" width={w-2} height={h-2} rx="3" fill={col} stroke={bdr} strokeWidth="1" /> : <rect x="1" y="1" width={w-2} height={h-2} rx="3" fill="white" stroke={bdr} strokeWidth="1" />}
          <circle cx={w/2} cy={tpl.id === "default" ? 28 : 26} r={12} fill={tpl.id === "default" ? "rgba(255,255,255,0.4)" : col} opacity={0.7} />
          {tpl.id === "default" && <><rect x="10" y="48" width={w-20} height="4" rx="1" fill="rgba(255,255,255,0.5)" /><rect x="14" y="56" width={w-28} height="3" rx="1" fill="rgba(255,255,255,0.4)" /></>}
          {tpl.id === "panel" && <rect x="6" y="46" width={w-12} height="20" rx="4" fill={col} />}
          {tpl.id === "half" && <rect x="1" y="42" width={w-2} height="29" fill={col} />}
          {tpl.id === "banner" && <rect x="1" y="56" width={w-2} height="15" fill={col} />}
          {tpl.id !== "default" && <><rect x="12" y={tpl.id === "panel" ? 52 : tpl.id === "half" ? 50 : 60} width={w-24} height="3" rx="1" fill="rgba(255,255,255,0.7)" /><rect x="16" y={tpl.id === "panel" ? 58 : tpl.id === "half" ? 56 : 65} width={w-32} height="2" rx="1" fill="rgba(255,255,255,0.5)" /></>}
        </svg>
        <div className="text-[9px] font-semibold text-center mt-0.5 text-gray-600">{tpl.label}</div>
      </button>
    );
  };

  /* ── STEP 0: CATEGORY PICKER ── */
  if (step === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((c) => {
            const count = ICONS.filter((i) => i.category === c.id).length;
            return (
              <button key={c.id} onClick={() => selectCat(c.id)} className="group bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={cx("w-12 h-12 mx-auto mb-2 flex items-center justify-center", c.shape === "circle" || c.shape === "circle-bar" ? "rounded-full" : "rounded-lg")} style={{ background: c.shape === "triangle" ? "transparent" : c.id === "prohibition" ? "#A1262D" : c.bg }}>
                  {c.shape === "triangle" ? (<svg viewBox="0 0 40 36" className="w-10 h-9"><polygon points="20,2 38,34 2,34" fill="#F5CA2B" stroke="#21251E" strokeWidth="2" /><text x="20" y="28" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#21251E">!</text></svg>)
                  : c.shape === "circle-bar" ? (<svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="17" fill="white" stroke="#A1262D" strokeWidth="3" /><line x1="8" y1="32" x2="32" y2="8" stroke="#A1262D" strokeWidth="3" /></svg>)
                  : (<svg viewBox="0 0 24 24" className="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" fill="white" opacity="0.6" /></svg>)}
                </div>
                <div className="font-bold text-sm text-gray-900 group-hover:text-[#1B5B50]">{c.label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{c.desc}</div>
                <div className="text-[11px] font-semibold text-[#1B5B50] mt-1">{count} icons</div>
              </button>
            );
          })}
          <button onClick={() => selectCat("custom")} className="group bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-lg bg-gray-100"><span className="text-lg font-bold text-gray-400">Aa</span></div>
            <div className="font-bold text-sm text-gray-900 group-hover:text-[#1B5B50]">Custom / Text Only</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Custom colours & text</div>
          </button>
        </div>
      </div>
    );
  }

  /* ── STEP 1: ICON PICKER (multi-select) ── */
  if (step === 1 && cat) {
    return (
      <div className="space-y-4">
        <button onClick={goBack} className="text-sm font-semibold text-[#1B5B50] hover:underline flex items-center gap-1">← Back to categories</button>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: cat.id === "prohibition" ? "#A1262D" : cat.bg }} />
            <h2 className="text-xl font-bold text-gray-900">{cat.label} Signs</h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{catIcons.length} shown</span>
          </div>
          {selectedIcons.length > 0 && (
            <button onClick={goToEditor} className="bg-[#1B5B50] text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-[#144840] transition-colors flex items-center gap-2">
              Continue with {selectedIcons.length} icon{selectedIcons.length !== 1 ? "s" : ""} →
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search icons…" className="flex-1 max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5B50]/20 focus:border-[#1B5B50]" />
          <span className="text-xs text-gray-500">Select up to 4 icons</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {catIcons.map((icon) => {
            const isSelected = selectedIcons.some((i) => i.code === icon.code);
            const idx = selectedIcons.findIndex((i) => i.code === icon.code);
            return (
              <button key={icon.code} onClick={() => toggleIcon(icon)} className={cx("relative bg-white rounded-lg border p-2 text-center hover:shadow-md hover:-translate-y-0.5 transition-all", isSelected ? "border-[#1B5B50] border-2 bg-emerald-50/30" : "border-gray-200")}>
                {isSelected && <div className="absolute top-1 right-1 w-5 h-5 bg-[#1B5B50] rounded-full flex items-center justify-center text-white text-[10px] font-bold">{idx + 1}</div>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc(icon.code)} alt={icon.label} className="w-12 h-12 mx-auto mb-1 object-contain" loading="lazy" />
                <div className="text-[10px] font-semibold text-gray-700 leading-tight line-clamp-2">{icon.label}</div>
                <div className="text-[9px] text-gray-400 mt-0.5 uppercase">{icon.code}</div>
              </button>
            );
          })}
        </div>
        {nicheCount > 0 && !showAllIcons && <button onClick={() => setShowAllIcons(true)} className="text-sm font-semibold text-[#1B5B50] hover:underline">+ Show {nicheCount} more specialist icons</button>}
        {showAllIcons && nicheCount > 0 && <button onClick={() => setShowAllIcons(false)} className="text-sm font-semibold text-gray-500 hover:underline">Hide specialist icons</button>}
      </div>
    );
  }

  /* ── STEP 2: EDITOR ── */
  return (
    <div className="space-y-4">
      <button onClick={goBack} className="text-sm font-semibold text-[#1B5B50] hover:underline flex items-center gap-1">← {isCustom ? "Back to categories" : "Back to icons"}</button>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        <div className="space-y-4">
          {selectedIcons.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{selectedIcons.length} Icon{selectedIcons.length !== 1 ? "s" : ""} Selected</span>
                <button onClick={() => setStep(1)} className="text-xs font-semibold text-[#1B5B50] hover:underline">Change</button>
              </div>
              <div className="flex gap-2">
                {selectedIcons.map((icon) => (
                  <div key={icon.code} className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconSrc(icon.code)} alt={icon.label} className="w-10 h-10 object-contain" />
                    <span className="text-[9px] text-gray-500 uppercase mt-0.5">{icon.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isCustom && <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="font-bold text-sm text-gray-900">Custom Text-Only Sign</div><div className="text-xs text-gray-500">No icon — pick your own colours</div></div>}
          {!isCustom && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Layout Template</label>
              <div className="flex gap-2">{TEMPLATES.map((tpl) => renderTemplateThumbnail(tpl))}</div>
            </div>
          )}
          {selectedIcons.length > 0 && (
            <div>
              <div className="inline-grid grid-cols-3 gap-1" style={{ width: "calc(3 * 2.25rem + 2 * 0.25rem)" }}>
                <div /><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-center py-1">Icon Position</label><div />
                <div /><button onClick={() => setIconOffsetY((v) => v - 4)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors" title="Move up">↑</button><div />
                <button onClick={() => setIconOffsetX((v) => v - 4)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors" title="Move left">←</button>
                <button onClick={() => { setIconOffsetX(0); setIconOffsetY(-8); }} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[#1B5B50] font-bold text-[10px] transition-colors" title="Reset">↺</button>
                <button onClick={() => setIconOffsetX((v) => v + 4)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors" title="Move right">→</button>
                <div /><button onClick={() => setIconOffsetY((v) => v + 4)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors" title="Move down">↓</button><div />
              </div>
            </div>
          )}
          {(template === "panel" || template === "banner") && (
            <div>
              <div className="inline-grid grid-cols-3 gap-1" style={{ width: "calc(3 * 2.25rem + 2 * 0.25rem)" }}>
                <div /><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-center py-1">Text Box</label><div />
                <div /><button onClick={() => setPanelOffsetY((v) => v - 4)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors" title="Move text box up">↑</button><div />
                <button onClick={() => setPanelOffsetX((v) => v - 4)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors" title="Move text box left">←</button>
                <button onClick={() => { setPanelOffsetX(0); setPanelOffsetY(0); }} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[#1B5B50] font-bold text-[10px] transition-colors" title="Reset">↺</button>
                <button onClick={() => setPanelOffsetX((v) => v + 4)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors" title="Move text box right">→</button>
                <div /><button onClick={() => setPanelOffsetY((v) => v + 4)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors" title="Move text box down">↓</button><div />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sign Text (up to 4 lines)</label>
            {lines.map((line, i) => (
              <div key={i} className="flex gap-1.5 mb-1.5">
                <input value={line} onChange={(e) => updateLine(i, e.target.value)} placeholder={`Line ${i + 1}`} maxLength={60} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5B50]/20 focus:border-[#1B5B50]" />
                {lines.length > 1 && <button onClick={() => removeLine(i)} className="px-2 text-red-500 hover:bg-red-50 rounded-lg text-lg font-bold">×</button>}
              </div>
            ))}
            {lines.length < 4 && <button onClick={addLine} className="text-xs font-semibold text-[#1B5B50] hover:underline mt-1">+ Add line</button>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Text Size</label>
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">{TEXT_SIZES.map((t) => (<button key={t.id} onClick={() => setTextSize(t.id)} className={cx("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors", textSize === t.id ? "bg-[#1B5B50] text-white" : "text-gray-600 hover:bg-gray-200")}>{t.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Font</label>
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">{FONTS.map((f) => (<button key={f.id} onClick={() => setFont(f.id)} className={cx("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors", font === f.id ? "bg-[#1B5B50] text-white" : "text-gray-600 hover:bg-gray-200")} style={{ fontFamily: f.family }}>{f.label}</button>))}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Paper Size</label>
              <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">{PAPER_SIZES.map((s) => (<button key={s.id} onClick={() => setPaperSize(s.id)} className={cx("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors", paperSize === s.id ? "bg-[#1B5B50] text-white" : "text-gray-600 hover:bg-gray-200")}>{s.label}</button>))}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Orientation</label>
              <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">{(["portrait", "landscape"] as const).map((o) => (<button key={o} onClick={() => setOrientation(o)} className={cx("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors capitalize", orientation === o ? "bg-[#1B5B50] text-white" : "text-gray-600 hover:bg-gray-200")}>{o}</button>))}</div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showBorder} onChange={(e) => setShowBorder(e.target.checked)} className="w-4 h-4 rounded accent-[#1B5B50]" /><span className="text-sm font-semibold text-gray-700">Show border</span></label>
          {isCustom && (
            <div className="grid grid-cols-3 gap-2">
              <div><label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Background</label><input type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="w-full h-9 border-0 rounded-lg cursor-pointer" /></div>
              <div><label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Border</label><input type="color" value={customBorder} onChange={(e) => setCustomBorder(e.target.value)} className="w-full h-9 border-0 rounded-lg cursor-pointer" /></div>
              <div><label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Text</label><input type="color" value={customTextColour} onChange={(e) => setCustomTextColour(e.target.value)} className="w-full h-9 border-0 rounded-lg cursor-pointer" /></div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={exportPDF} disabled={exporting} className="flex-1 bg-[#1B5B50] text-white rounded-lg py-3 px-4 font-bold text-sm hover:bg-[#144840] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {exporting ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Generating…</>) : !session ? "Sign in to download" : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Download PDF</>)}
            </button>
            <button onClick={addToBatch} className="px-4 py-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">+ Batch</button>
          </div>
          {batch.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch ({batch.length} sign{batch.length !== 1 ? "s" : ""})</div>
              {batch.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate">{b.icons.map((ic) => ic.code).join("+") || "Custom"}: {b.lines.filter((l) => l).join(" / ") || "(no text)"}</span>
                  <button onClick={() => setBatch(batch.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0">×</button>
                </div>
              ))}
              <button onClick={exportBatchPDF} disabled={exporting} className="w-full bg-[#1B5B50] text-white rounded-lg py-2 px-3 text-xs font-bold hover:bg-[#144840] transition-colors disabled:opacity-50">{exporting ? "Generating…" : "Download Batch PDF"}</button>
            </div>
          )}
          {!fontsLoaded && <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Loading fonts…</div>}
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</div>
          <div className="bg-gray-200 rounded-xl p-6 inline-flex items-center justify-center">{renderPreview()}</div>
          <div className="text-xs text-gray-400">{paperSize.toUpperCase()} · {orientation} · {fn.label} · {ts.label} text · {TEMPLATES.find((t) => t.id === template)?.label}</div>
        </div>
      </div>
    </div>
  );
}
