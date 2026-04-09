// src/components/coordinate-converter/CoordinateConverterClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  convertFromGrid, convertFromLatLon, parseGridRef, parseLatLon,
  formatGridRef, decToDMS, UK_COAST_POINTS, UK_BOUNDS,
} from "@/data/coordinate-converter";
import type { InputMode, Precision, ConversionResult, BatchRow } from "@/data/coordinate-converter";
import jsPDF from "jspdf";

// ─── Helpers ─────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── UK Mini Map (SVG) ──────────────────────────────────────
function UKMiniMap({ lat, lon }: { lat: number; lon: number }) {
  const W = 200, H = 300;
  const { minLat, maxLat, minLon, maxLon } = UK_BOUNDS;
  const lonRange = maxLon - minLon;
  const latRange = maxLat - minLat;

  const project = (lt: number, ln: number): [number, number] => [
    ((ln - minLon) / lonRange) * W,
    H - ((lt - minLat) / latRange) * H,
  ];

  const coastPath = UK_COAST_POINTS.map((p, i) => {
    const [x, y] = project(p[0], p[1]);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";

  const [px, py] = project(lat, lon);
  const inBounds = lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 260 }}>
      <rect width={W} height={H} fill="#EFF6FF" rx={6} />
      <path d={coastPath} fill="#D1FAE5" stroke="#6B7280" strokeWidth={1} fillRule="evenodd" />
      {inBounds && (
        <>
          <circle cx={px} cy={py} r={6} fill="#DC2626" opacity={0.25} />
          <circle cx={px} cy={py} r={3} fill="#DC2626" />
          <line x1={px - 8} y1={py} x2={px + 8} y2={py} stroke="#DC2626" strokeWidth={0.8} />
          <line x1={px} y1={py - 8} x2={px} y2={py + 8} stroke="#DC2626" strokeWidth={0.8} />
        </>
      )}
    </svg>
  );
}

// ─── Copy Button ─────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 rounded hover:bg-gray-200 transition-colors" title="Copy">
      {copied ? (
        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── PDF Export ──────────────────────────────────────────────
function exportPDF(
  result: ConversionResult | null,
  batchResults: BatchRow[],
  header: { site: string; manager: string; preparedBy: string; date: string },
) {
  if (!result && batchResults.length === 0) return;
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - 2 * M;
  let y = 0;
  const docRef = `CCV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("COORDINATE CONVERSION REPORT (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text("ebrora.com", W - M - 18, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };

  // ── Header bar
  doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("Coordinate Conversion Report", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | ${header.date || todayISO()}`, M, 15);
  doc.text("ebrora.com", W - M - 18, 15);
  doc.setTextColor(0, 0, 0); y = 28;

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 14, 1, 1, "FD");
  doc.setFontSize(7);
  drawFld("Site:", header.site, M + 3, y + 2, 40);
  drawFld("Site Manager:", header.manager, M + 3, y + 8, 30);
  drawFld("Prepared By:", header.preparedBy, M + CW / 2, y + 2, 30);
  drawFld("Date:", header.date || todayISO(), M + CW / 2, y + 8, 30);
  y += 16;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `OS Grid (OSGB36) to WGS84 coordinate conversion using Helmert 7-parameter datum transformation. Accuracy approximately 5 metres, sufficient for most construction purposes.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── Single result
  if (result && result.valid) {
    checkPage(40);
    doc.setFillColor(27, 87, 69); doc.roundedRect(M, y, CW, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("CONVERSION RESULT", M + 5, y + 6);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`${result.gridRef}  |  ${result.latDec.toFixed(6)}, ${result.lonDec.toFixed(6)}`, M + 5, y + 11);
    doc.setTextColor(0, 0, 0); y += 20;

    // Summary panel
    const items: [string, string][] = [
      ["OS Grid Reference", result.gridRef],
      ["Easting", String(Math.round(result.easting))],
      ["Northing", String(Math.round(result.northing))],
      ["Latitude (decimal)", result.latDec.toFixed(8)],
      ["Longitude (decimal)", result.lonDec.toFixed(8)],
      ["Latitude (DMS)", result.latDMS],
      ["Longitude (DMS)", result.lonDMS],
      ["100km Grid Square", result.gridLetters],
      ["Method", result.method],
    ];
    const panelH = 4 + items.length * 3.8 + 2;
    doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
    doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Conversion Summary", M + 4, y + 2); y += 6;
    items.forEach(([label, value]) => {
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
      doc.text(label + ":", M + 4, y);
      doc.setTextColor(17, 24, 39); doc.setFont("helvetica", "normal");
      doc.text(value, M + 60, y);
      doc.setTextColor(0, 0, 0); y += 3.8;
    });
    y += 6;
  }

  // ── Batch results table
  if (batchResults.length > 0) {
    checkPage(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Batch Conversion Results", M, y); y += 5;

    const cols = [35, 35, 35, 32, 32, 13];
    let cx = M;
    ["Grid Ref", "Easting", "Northing", "Latitude", "Longitude", "Sq"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
      doc.text(h, cx + 2, y + 4);
      cx += cols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    batchResults.forEach((row, ri) => {
      checkPage(6);
      cx = M;
      const r = row.result;
      const cells = r && r.valid
        ? [r.gridRef.slice(0, 14), String(Math.round(r.easting)), String(Math.round(r.northing)), r.latDec.toFixed(6), r.lonDec.toFixed(6), r.gridLetters]
        : [row.input.slice(0, 14), row.error || "Error", "", "", "", ""];
      cells.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
        else { doc.rect(cx, y, cols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
        const lines = doc.splitTextToSize(t, cols[i] - 3);
        doc.text(lines[0] || "", cx + 1.5, y + 3.8);
        cx += cols[i];
      });
      y += 5.5;
    });
    y += 6;
  }

  // ── Sign-off
  checkPage(50);
  y += 4;
  doc.setDrawColor(27, 87, 69); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // ── Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "Coordinate conversion using the Helmert 7-parameter datum transformation (OSGB36 to WGS84). Accuracy ~5m. This is a conversion tool -- always verify coordinates on site.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 290);
  }

  doc.save(`coordinate-conversion-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function CoordinateConverterClient() {
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [prepDate, setPrepDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);

  const [mode, setMode] = useState<InputMode>("osgrid");
  const [precision, setPrecision] = useState<Precision>("1m");
  const [gridInput, setGridInput] = useState("");
  const [latLonInput, setLatLonInput] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);

  // Batch mode
  const [showBatch, setShowBatch] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const [batchResults, setBatchResults] = useState<BatchRow[]>([]);

  const handleConvert = useCallback(() => {
    if (mode === "osgrid") {
      const parsed = parseGridRef(gridInput);
      if (!parsed) { setResult({ gridRef: "", easting: 0, northing: 0, latDec: 0, lonDec: 0, latDMS: "", lonDMS: "", gridLetters: "", valid: false, error: "Invalid grid reference format", method: "" }); return; }
      setResult(convertFromGrid(parsed.easting, parsed.northing, precision));
    } else {
      const parsed = parseLatLon(latLonInput);
      if (!parsed) { setResult({ gridRef: "", easting: 0, northing: 0, latDec: 0, lonDec: 0, latDMS: "", lonDMS: "", gridLetters: "", valid: false, error: "Invalid lat/lon format", method: "" }); return; }
      setResult(convertFromLatLon(parsed.lat, parsed.lon, precision));
    }
  }, [mode, gridInput, latLonInput, precision]);

  const handleBatch = useCallback(() => {
    const lines = batchInput.split("\n").map(l => l.trim()).filter(Boolean);
    const rows: BatchRow[] = lines.map(line => {
      // Try grid first, then lat/lon
      const gp = parseGridRef(line);
      if (gp) {
        const r = convertFromGrid(gp.easting, gp.northing, precision);
        return { input: line, result: r, error: r.valid ? undefined : r.error };
      }
      const ll = parseLatLon(line);
      if (ll) {
        const r = convertFromLatLon(ll.lat, ll.lon, precision);
        return { input: line, result: r, error: r.valid ? undefined : r.error };
      }
      return { input: line, result: null, error: "Could not parse input" };
    });
    setBatchResults(rows);
  }, [batchInput, precision]);

  const clearAll = () => {
    setGridInput(""); setLatLonInput(""); setResult(null);
    setBatchInput(""); setBatchResults([]); setShowBatch(false);
  };

  const handleExport = () => {
    exportPDF(result, batchResults, { site, manager, preparedBy, date: prepDate });
  };

  // Summary card values
  const cards = useMemo(() => {
    if (!result || !result.valid) {
      return [
        { label: "Grid Reference", value: "--", sub: "OS National Grid", bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
        { label: "Easting", value: "--", sub: "metres", bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
        { label: "Latitude", value: "--", sub: "WGS84 decimal degrees", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
        { label: "Method", value: "Helmert", sub: "~5m accuracy", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
      ];
    }
    return [
      { label: "Grid Reference", value: result.gridLetters || "--", sub: result.gridRef, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
      { label: "Easting / Northing", value: `${Math.round(result.easting)}`, sub: `N: ${Math.round(result.northing)}`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
      { label: "Latitude", value: result.latDec.toFixed(6), sub: result.latDMS, bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
      { label: "Longitude", value: result.lonDec.toFixed(6), sub: result.lonDMS, bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
    ];
  }, [result]);

  return (
    <div className="space-y-4">
      {/* ── Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} />
              <span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span>
            </div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <button onClick={() => setShowBatch(!showBatch)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          {showBatch ? "Single Mode" : "Batch Mode"}
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={!result && batchResults.length === 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-ebrora rounded-lg hover:bg-ebrora-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Download PDF
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear All
        </button>
      </div>

      {/* ── Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { l: "Site", v: site, s: setSite },
            { l: "Site Manager", v: manager, s: setManager },
            { l: "Prepared By", v: preparedBy, s: setPreparedBy },
            { l: "Date", v: prepDate, s: setPrepDate },
          ].map(f => (
            <div key={f.l}>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type={f.l === "Date" ? "date" : "text"} value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            </div>
          ))}
        </div>
      )}

      {/* ── Input Section */}
      {!showBatch ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Input Format</span>
            <div className="flex gap-1">
              {(["osgrid", "latlong"] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setResult(null); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${mode === m ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>
                  {m === "osgrid" ? "OS Grid" : "Lat/Long"}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Precision</span>
            <div className="flex gap-1">
              {(["10m", "1m", "0.1m"] as const).map(p => (
                <button key={p} onClick={() => setPrecision(p)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${precision === p ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {mode === "osgrid" ? (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">OS Grid Reference or Eastings/Northings</label>
              <input
                type="text" value={gridInput} onChange={e => setGridInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleConvert(); }}
                placeholder="e.g. SJ 35123 36789 or E: 335123, N: 336789"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-ebrora outline-none font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">Accepts: SJ 1234 5678, SJ12345678, SJ 12345 67890, or E: 351234, N: 367890</p>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Latitude &amp; Longitude (WGS84)</label>
              <input
                type="text" value={latLonInput} onChange={e => setLatLonInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleConvert(); }}
                placeholder={'e.g. 53.4808, -2.2426 or 53\u00B028\'51"N, 2\u00B014\'33"W'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-ebrora outline-none font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">Accepts: decimal degrees (53.4808, -2.2426) or DMS (53°28&apos;51&quot;N, 2°14&apos;33&quot;W)</p>
            </div>
          )}

          <button onClick={handleConvert} className="w-full py-2.5 text-sm font-semibold text-white bg-ebrora rounded-lg hover:bg-ebrora-dark transition-colors">
            Convert
          </button>

          {result && !result.valid && (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
              <span className="text-lg font-bold text-red-600">!</span>
              <div>
                <div className="text-sm font-bold text-red-900">Conversion Error</div>
                <div className="text-xs text-red-800 mt-1">{result.error}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Batch Mode */
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Batch Conversion</span>
            <div className="flex gap-1">
              {(["10m", "1m", "0.1m"] as const).map(p => (
                <button key={p} onClick={() => setPrecision(p)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${precision === p ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Paste coordinates (one per line, any format)</label>
            <textarea
              value={batchInput} onChange={e => setBatchInput(e.target.value)}
              rows={6}
              placeholder={"SJ 35123 36789\n53.4808, -2.2426\nSD 45678 12345\n51.5074, -0.1278"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-ebrora outline-none font-mono resize-y"
            />
          </div>
          <button onClick={handleBatch} className="w-full py-2.5 text-sm font-semibold text-white bg-ebrora rounded-lg hover:bg-ebrora-dark transition-colors">
            Convert All
          </button>
        </div>
      )}

      {/* ── Results Display */}
      {result && result.valid && !showBatch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Coordinate Details */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Conversion Results</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* OS Grid side */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wide text-blue-700">OS National Grid (OSGB36)</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-blue-600/70">Grid Reference</div>
                    <div className="text-sm font-bold text-blue-900 font-mono">{result.gridRef}</div>
                  </div>
                  <CopyBtn text={result.gridRef} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-blue-600/70">Easting</div>
                    <div className="text-sm font-bold text-blue-900 font-mono">{Math.round(result.easting)}</div>
                  </div>
                  <CopyBtn text={String(Math.round(result.easting))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-blue-600/70">Northing</div>
                    <div className="text-sm font-bold text-blue-900 font-mono">{Math.round(result.northing)}</div>
                  </div>
                  <CopyBtn text={String(Math.round(result.northing))} />
                </div>
              </div>

              {/* WGS84 side */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">WGS84 (GPS / Google Maps)</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-600/70">Decimal Degrees</div>
                    <div className="text-sm font-bold text-emerald-900 font-mono">{result.latDec.toFixed(6)}, {result.lonDec.toFixed(6)}</div>
                  </div>
                  <CopyBtn text={`${result.latDec.toFixed(6)}, ${result.lonDec.toFixed(6)}`} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-600/70">DMS</div>
                    <div className="text-sm font-bold text-emerald-900 font-mono">{result.latDMS}, {result.lonDMS}</div>
                  </div>
                  <CopyBtn text={`${result.latDMS}, ${result.lonDMS}`} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-600/70">Grid Square</div>
                    <div className="text-sm font-bold text-emerald-900 font-mono">{result.gridLetters}</div>
                  </div>
                  <CopyBtn text={result.gridLetters} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {result.method}
            </div>
          </div>

          {/* Right: Mini Map */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Location Check</div>
            <UKMiniMap lat={result.latDec} lon={result.lonDec} />
            <div className="text-[10px] text-gray-400 mt-2 text-center">Approximate position on UK outline (visual sanity check only)</div>
          </div>
        </div>
      )}

      {/* ── Batch Results Table */}
      {batchResults.length > 0 && showBatch && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Batch Results ({batchResults.length} conversions)</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-2 py-1.5 text-left font-semibold rounded-tl-lg">Input</th>
                <th className="px-2 py-1.5 text-left font-semibold">Grid Ref</th>
                <th className="px-2 py-1.5 text-left font-semibold">Easting</th>
                <th className="px-2 py-1.5 text-left font-semibold">Northing</th>
                <th className="px-2 py-1.5 text-left font-semibold">Latitude</th>
                <th className="px-2 py-1.5 text-left font-semibold">Longitude</th>
                <th className="px-2 py-1.5 text-left font-semibold rounded-tr-lg">DMS</th>
              </tr>
            </thead>
            <tbody>
              {batchResults.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  {row.result && row.result.valid ? (
                    <>
                      <td className="px-2 py-1.5 font-mono text-gray-500">{row.input}</td>
                      <td className="px-2 py-1.5 font-mono font-semibold">{row.result.gridRef}</td>
                      <td className="px-2 py-1.5 font-mono">{Math.round(row.result.easting)}</td>
                      <td className="px-2 py-1.5 font-mono">{Math.round(row.result.northing)}</td>
                      <td className="px-2 py-1.5 font-mono">{row.result.latDec.toFixed(6)}</td>
                      <td className="px-2 py-1.5 font-mono">{row.result.lonDec.toFixed(6)}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px]">{row.result.latDMS}, {row.result.lonDMS}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-1.5 font-mono text-gray-500">{row.input}</td>
                      <td colSpan={6} className="px-2 py-1.5 text-red-600">{row.error}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Reference Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">How It Works</div>
        <div className="text-xs text-gray-600 space-y-1.5">
          <p>This tool converts between <strong>OS National Grid</strong> (OSGB36, used by Ordnance Survey maps) and <strong>WGS84</strong> (used by GPS devices and Google Maps) using the Helmert 7-parameter datum transformation published by Ordnance Survey.</p>
          <p>The conversion applies the Transverse Mercator projection with Airy 1830 ellipsoid parameters, then a 3D Cartesian Helmert transformation (3 translations, 3 rotations, 1 scale factor) between the OSGB36 and WGS84 datums. Accuracy is approximately 5 metres, which is sufficient for most construction and setting-out purposes.</p>
          <p>For sub-metre accuracy (e.g. precise setting-out from GPS), the full OSTN15/OSGM15 transformation should be used via Ordnance Survey&apos;s official tools.</p>
        </div>
      </div>
    </div>
  );
}
