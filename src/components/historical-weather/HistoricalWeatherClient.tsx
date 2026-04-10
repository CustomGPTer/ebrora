// src/components/historical-weather/HistoricalWeatherClient.tsx
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { PaidDownloadButton } from "@/components/shared/PaidToolGate";
import {
  UK_TOWNS, WMO_CODES, getWMO, fetchWeather, extractDayData, fetchBaseline,
  getDateRange, computeSummary, kmhToMph, fmtWind, fmtWindVal,
} from "@/data/historical-weather";
import type { UKTown, ViewMode, WindUnit, DayWeather, WeatherResult } from "@/data/historical-weather";
import jsPDF from "jspdf";

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ─── Weather Icons (Professional SVG) ────────────────────────
function WeatherIcon({ code, size = 40 }: { code: number | null; size?: number }) {
  const wmo = getWMO(code);
  const s = size;
  const hs = s / 2;

  const Sun = () => (
    <g>
      <circle cx={hs} cy={hs} r={s * 0.22} fill="#FBBF24" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45) * Math.PI / 180;
        const x1 = hs + Math.cos(a) * s * 0.3, y1 = hs + Math.sin(a) * s * 0.3;
        const x2 = hs + Math.cos(a) * s * 0.42, y2 = hs + Math.sin(a) * s * 0.42;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FBBF24" strokeWidth={s * 0.04} strokeLinecap="round" />;
      })}
    </g>
  );

  const Cloud = ({ x = 0, y = 0, sc = 1, fill = "#94A3B8" }: { x?: number; y?: number; sc?: number; fill?: string }) => (
    <g transform={`translate(${x},${y}) scale(${sc})`}>
      <ellipse cx={s * 0.35} cy={s * 0.42} rx={s * 0.2} ry={s * 0.14} fill={fill} />
      <ellipse cx={s * 0.55} cy={s * 0.38} rx={s * 0.22} ry={s * 0.18} fill={fill} />
      <ellipse cx={s * 0.45} cy={s * 0.48} rx={s * 0.28} ry={s * 0.12} fill={fill} />
    </g>
  );

  const RainDrops = ({ count = 3, heavy = false }: { count?: number; heavy?: boolean }) => (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = s * 0.25 + i * s * 0.18;
        const y = s * 0.62 + (i % 2) * s * 0.06;
        return <line key={i} x1={x} y1={y} x2={x - s * 0.04} y2={y + s * 0.12} stroke={heavy ? "#2563EB" : "#60A5FA"} strokeWidth={s * 0.035} strokeLinecap="round" />;
      })}
    </g>
  );

  const SnowFlakes = ({ count = 3 }: { count?: number }) => (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = s * 0.25 + i * s * 0.2;
        const y = s * 0.65 + (i % 2) * s * 0.08;
        return <circle key={i} cx={x} cy={y} r={s * 0.035} fill="#93C5FD" />;
      })}
    </g>
  );

  const Lightning = () => (
    <polygon points={`${s*0.45},${s*0.5} ${s*0.52},${s*0.62} ${s*0.48},${s*0.62} ${s*0.55},${s*0.78}`} fill="#EAB308" stroke="#D97706" strokeWidth={s * 0.01} />
  );

  const FogLines = () => (
    <g>
      {[0.5, 0.58, 0.66].map((yf, i) => (
        <line key={i} x1={s * 0.15} y1={s * yf} x2={s * 0.85} y2={s * yf} stroke="#CBD5E1" strokeWidth={s * 0.04} strokeLinecap="round" opacity={0.7 - i * 0.15} />
      ))}
    </g>
  );

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {wmo.icon === "clear" && <Sun />}
      {wmo.icon === "partly-cloudy" && <><g transform={`translate(${-s*0.08},${-s*0.1})`}><Sun /></g><Cloud x={s * 0.08} y={s * 0.08} /></>}
      {wmo.icon === "cloudy" && <><Cloud x={-s*0.05} y={-s*0.04} fill="#CBD5E1" /><Cloud x={s*0.05} y={s*0.04} /></>}
      {wmo.icon === "overcast" && <><Cloud x={-s*0.05} y={-s*0.04} fill="#94A3B8" /><Cloud x={s*0.05} y={s*0.04} fill="#64748B" /></>}
      {wmo.icon === "fog" && <><Cloud x={0} y={-s*0.08} fill="#CBD5E1" /><FogLines /></>}
      {wmo.icon === "drizzle" && <><Cloud x={0} y={-s*0.06} /><RainDrops count={2} /></>}
      {wmo.icon === "rain-light" && <><Cloud x={0} y={-s*0.06} /><RainDrops count={3} /></>}
      {wmo.icon === "rain" && <><Cloud x={0} y={-s*0.06} fill="#64748B" /><RainDrops count={4} heavy /></>}
      {wmo.icon === "rain-heavy" && <><Cloud x={0} y={-s*0.06} fill="#475569" /><RainDrops count={5} heavy /></>}
      {wmo.icon === "freezing-rain" && <><Cloud x={0} y={-s*0.06} fill="#64748B" /><RainDrops count={3} /><SnowFlakes count={2} /></>}
      {wmo.icon === "snow-light" && <><Cloud x={0} y={-s*0.06} /><SnowFlakes count={3} /></>}
      {wmo.icon === "snow" && <><Cloud x={0} y={-s*0.06} fill="#64748B" /><SnowFlakes count={4} /></>}
      {wmo.icon === "snow-heavy" && <><Cloud x={0} y={-s*0.06} fill="#475569" /><SnowFlakes count={5} /></>}
      {wmo.icon === "sleet" && <><Cloud x={0} y={-s*0.06} fill="#64748B" /><RainDrops count={2} /><SnowFlakes count={2} /></>}
      {wmo.icon === "thunder" && <><Cloud x={0} y={-s*0.06} fill="#475569" /><Lightning /></>}
      {wmo.icon === "thunder-rain" && <><Cloud x={0} y={-s*0.06} fill="#475569" /><Lightning /><RainDrops count={3} heavy /></>}
    </svg>
  );
}

// ─── Location Search ─────────────────────────────────────────
function LocationSearch({ value, onChange }: { value: UKTown | null; onChange: (t: UKTown) => void }) {
  const [query, setQuery] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return UK_TOWNS.filter(t => t.name.toLowerCase().includes(q) || t.region.toLowerCase().includes(q)).slice(0, 12);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text" value={query} placeholder="Search UK town or city..."
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-ebrora outline-none"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.map(t => (
            <button key={`${t.name}-${t.region}`} onClick={() => { onChange(t); setQuery(t.name); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-ebrora-light/40 flex justify-between items-center">
              <span className="font-medium text-gray-900">{t.name}</span>
              <span className="text-[10px] text-gray-400">{t.region}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Combined Chart (SVG) ────────────────────────────────────
function CombinedChart({ days, windUnit }: { days: DayWeather[]; windUnit: WindUnit }) {
  if (days.length === 0) return null;
  const W = 700, H = 280, PAD = { l: 45, r: 50, t: 20, b: 40 };
  const cw = W - PAD.l - PAD.r, ch = H - PAD.t - PAD.b;

  const temps = days.map(d => d.tempC ?? 0);
  const avgs = days.map(d => d.avgTempC ?? null);
  const rains = days.map(d => d.precipMm ?? 0);
  const winds = days.map(d => fmtWindVal(d.windKmh, windUnit));

  const tMin = Math.floor(Math.min(...temps, ...(avgs.filter(a => a !== null) as number[])) - 2);
  const tMax = Math.ceil(Math.max(...temps, ...(avgs.filter(a => a !== null) as number[])) + 2);
  const rMax = Math.max(Math.max(...rains) * 1.3, 2);
  const wMax = Math.max(Math.max(...winds) * 1.2, 10);

  const n = days.length;
  const barW = Math.min(cw / n * 0.5, 20);
  const xPos = (i: number) => PAD.l + (i + 0.5) * (cw / n);
  const yTemp = (v: number) => PAD.t + ch - ((v - tMin) / (tMax - tMin)) * ch;
  const yRain = (v: number) => PAD.t + ch - (v / rMax) * ch * 0.4; // bottom 40% of chart
  const yWind = (v: number) => PAD.t + ch - (v / wMax) * ch;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }}>
      {/* Grid lines */}
      {Array.from({ length: 6 }).map((_, i) => {
        const v = tMin + (i / 5) * (tMax - tMin);
        const y = yTemp(v);
        return <g key={i}><line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#F1F5F9" strokeWidth={1} /><text x={PAD.l - 5} y={y + 3} textAnchor="end" fontSize={8} fill="#94A3B8">{v.toFixed(0)}°</text></g>;
      })}

      {/* Rainfall bars */}
      {rains.map((r, i) => r > 0 && (
        <rect key={`r${i}`} x={xPos(i) - barW / 2} y={yRain(r)} width={barW} height={PAD.t + ch - yRain(r)} fill="#93C5FD" opacity={0.6} rx={2} />
      ))}

      {/* Baseline temp line (dashed) */}
      {avgs.some(a => a !== null) && (
        <polyline fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4,3"
          points={avgs.map((a, i) => a !== null ? `${xPos(i)},${yTemp(a)}` : "").filter(Boolean).join(" ")} />
      )}

      {/* Temperature line */}
      <polyline fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinejoin="round"
        points={temps.map((t, i) => `${xPos(i)},${yTemp(t)}`).join(" ")} />
      {temps.map((t, i) => (
        <circle key={`t${i}`} cx={xPos(i)} cy={yTemp(t)} r={3} fill="#EF4444" stroke="#fff" strokeWidth={1.5} />
      ))}

      {/* Wind line (right axis) */}
      <polyline fill="none" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="2,2" strokeLinejoin="round"
        points={winds.map((w, i) => `${xPos(i)},${yWind(w)}`).join(" ")} />

      {/* X-axis labels */}
      {days.map((d, i) => {
        const showLabel = n <= 7 || i % Math.ceil(n / 12) === 0;
        return showLabel && (
          <text key={`xl${i}`} x={xPos(i)} y={H - PAD.b + 15} textAnchor="middle" fontSize={8} fill="#64748B">
            {d.date.slice(8, 10)}/{d.date.slice(5, 7)}
          </text>
        );
      })}

      {/* Right axis labels (wind) */}
      {Array.from({ length: 4 }).map((_, i) => {
        const v = (i / 3) * wMax;
        const y = yWind(v);
        return <text key={`wa${i}`} x={W - PAD.r + 5} y={y + 3} fontSize={8} fill="#8B5CF6">{v.toFixed(0)}</text>;
      })}

      {/* Legend */}
      <circle cx={PAD.l + 5} cy={H - 8} r={4} fill="#EF4444" /><text x={PAD.l + 14} y={H - 5} fontSize={9} fill="#374151">Temp (°C)</text>
      <rect x={PAD.l + 85} y={H - 12} width={10} height={8} fill="#93C5FD" rx={1} opacity={0.6} /><text x={PAD.l + 100} y={H - 5} fontSize={9} fill="#374151">Rain (mm)</text>
      <line x1={PAD.l + 175} y1={H - 8} x2={PAD.l + 190} y2={H - 8} stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="2,2" /><text x={PAD.l + 195} y={H - 5} fontSize={9} fill="#374151">Wind ({windUnit})</text>
      <line x1={PAD.l + 280} y1={H - 8} x2={PAD.l + 295} y2={H - 8} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4,3" /><text x={PAD.l + 300} y={H - 5} fontSize={9} fill="#374151">Avg baseline</text>
    </svg>
  );
}

// ─── PDF Export ──────────────────────────────────────────────
function exportPDF(
  results: WeatherResult[],
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  windUnit: WindUnit,
  rainThreshold: number,
) {
  if (results.length === 0) return;
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - 2 * M;
  let y = 0;
  const docRef = `HWR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("HISTORICAL WEATHER REPORT (continued)", M, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };

  // Header bar (PAID - dark)
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("Historical Weather Report", M, 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${docRef} | Rev 0 | ${header.date || todayISO()}`, M, 15);
  doc.setFontSize(6);
  doc.text("Open-Meteo Archive API | Helmert 7-parameter datum", M, 20);
  doc.setTextColor(0, 0, 0); y = 32;

  // Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 17, 1, 1, "FD");
  doc.setFontSize(7);
  drawFld("Company:", header.company, M + 3, y + 2, 40);
  drawFld("Site:", header.site, M + CW / 2, y + 2, 40);
  drawFld("Site Manager:", header.manager, M + 3, y + 8, 30);
  drawFld("Assessed By:", header.assessedBy, M + CW / 2, y + 8, 30);
  drawFld("Date:", header.date || todayISO(), M + 3, y + 14, 30);
  y += 22;

  for (const res of results) {
    checkPage(60);
    // Location header
    doc.setFillColor(30, 30, 30); doc.roundedRect(M, y, CW, 12, 2, 2, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`${res.location.name}, ${res.location.region}`, M + 4, y + 5);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`${res.startDate} to ${res.endDate} | ${res.view} view | Baseline: ${res.avgPeriod[0]}-${res.avgPeriod[1]}`, M + 4, y + 10);
    doc.setTextColor(0, 0, 0); y += 16;

    // Summary panel
    const s = res.summary;
    const items: [string, string][] = [
      ["Average Temperature", `${s.avgTemp.toFixed(1)} C (baseline: ${s.baselineAvgTemp.toFixed(1)} C, delta: ${s.tempDelta >= 0 ? "+" : ""}${s.tempDelta.toFixed(1)} C)`],
      ["Max / Min Temperature", `${s.maxTemp.toFixed(1)} C / ${s.minTemp.toFixed(1)} C`],
      ["Total Rainfall", `${s.totalRainMm.toFixed(1)} mm (baseline: ${s.baselineAvgRain.toFixed(1)} mm)`],
      ["Rain Days (>=${rainThreshold}mm)", `${s.rainDays} days`],
      ["Average Wind Speed", fmtWind(s.avgWind, windUnit)],
      ["Max Wind Speed", fmtWind(s.maxWind, windUnit)],
      ["Average Humidity", `${s.avgHumidity.toFixed(0)}%`],
      ["Average Cloud Cover", `${s.avgCloud.toFixed(0)}%`],
      ["Dominant Conditions", getWMO(s.dominantCode).description],
    ];
    const panelH = 4 + items.length * 3.8 + 2;
    doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
    doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Weather Summary", M + 4, y + 2); y += 6;
    items.forEach(([label, value]) => {
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
      doc.text(label + ":", M + 4, y);
      doc.setTextColor(17, 24, 39); doc.setFont("helvetica", "normal");
      doc.text(value, M + 60, y);
      doc.setTextColor(0, 0, 0); y += 3.8;
    });
    y += 6;

    // Data table
    checkPage(15);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Daily Weather Data (high, low, and 24hr totals)", M, y); y += 5;

    const cols = [22, 20, 20, 22, 22, 22, 22, 22, 10];
    let cx = M;
    ["Date", "High C", "Low C", "Wind", "Rain mm", "Humid %", "Cloud %", "Conditions", ""].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
      doc.text(h, cx + 1.5, y + 4);
      cx += cols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    res.days.forEach((day, ri) => {
      checkPage(5.5);
      cx = M;
      const wmo = getWMO(day.weatherCode);
      const cells = [
        day.date.slice(5),
        day.tempC !== null ? day.tempC.toFixed(1) : "--",
        day.tempMinC !== null ? day.tempMinC.toFixed(1) : "--",
        day.windKmh !== null ? fmtWind(day.windKmh, windUnit).replace(/ (mph|km\/h)/, "") : "--",
        day.precipMm !== null ? day.precipMm.toFixed(1) : "--",
        day.humidity !== null ? String(Math.round(day.humidity)) : "--",
        day.cloudCover !== null ? String(Math.round(day.cloudCover)) : "--",
        wmo.description.slice(0, 14),
        "",
      ];
      cells.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
        else { doc.rect(cx, y, cols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5);
        doc.text(t, cx + 1.5, y + 3.8);
        cx += cols[i];
      });
      y += 5.5;
    });
    y += 8;
  }

  // Sign-off
  checkPage(50);
  y += 4;
  doc.setDrawColor(30, 30, 30); doc.line(M, y, W - M, y); y += 6;
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

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text("Historical weather data from Open-Meteo Archive API. Daily highs, lows, and 24hr precipitation totals. Europe/London timezone. This is a weather evidence tool -- verify against Met Office records for contractual purposes.", M, 290);
    doc.text(`Ref: ${docRef} | Page ${p} of ${pageCount}`, W - M - 50, 290);
  }

  doc.save(`weather-report-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function HistoricalWeatherClient() {
  // Settings (PAID: 5 columns)
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);

  // Input state
  const [locations, setLocations] = useState<(UKTown | null)[]>([null]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [view, setView] = useState<ViewMode>("day");
  const [windUnit, setWindUnit] = useState<WindUnit>("mph");
  const [avgStart, setAvgStart] = useState(2005);
  const [avgEnd, setAvgEnd] = useState(2025);
  const [rainThreshold, setRainThreshold] = useState(1);

  // Results
  const [results, setResults] = useState<WeatherResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addLocation = () => { if (locations.length < 3) setLocations([...locations, null]); };
  const removeLocation = (i: number) => { if (locations.length > 1) setLocations(locations.filter((_, j) => j !== i)); };
  const updateLocation = (i: number, t: UKTown) => { const next = [...locations]; next[i] = t; setLocations(next); };

  const handleFetch = useCallback(async () => {
    const validLocs = locations.filter((l): l is UKTown => l !== null);
    if (validLocs.length === 0) { setError("Please select at least one location"); return; }

    setLoading(true); setError(""); setResults([]);

    try {
      const [startDate, endDate] = getDateRange(selectedDate, view);
      const allResults: WeatherResult[] = [];

      for (const loc of validLocs) {
        // Fetch actual weather
        const data = await fetchWeather(loc.lat, loc.lon, startDate, endDate);
        const dayMap = extractDayData(data);

        // Build day list
        const days: DayWeather[] = [];
        const d = new Date(startDate + "T12:00:00");
        const end = new Date(endDate + "T12:00:00");
        const targetDates: string[] = [];
        while (d <= end) {
          targetDates.push(d.toISOString().slice(0, 10));
          d.setDate(d.getDate() + 1);
        }

        // Fetch baseline (average across selected years)
        let baselineMap = new Map<string, { avgTempC: number; avgPrecipMm: number; avgWindKmh: number }>();
        try {
          baselineMap = await fetchBaseline(loc.lat, loc.lon, targetDates, Math.max(avgStart, avgEnd - 20), avgEnd);
        } catch { /* baseline unavailable */ }

        for (const dateStr of targetDates) {
          const entry = dayMap.get(dateStr);
          const baseline = baselineMap.get(dateStr);
          days.push({
            date: dateStr,
            tempC: entry?.tempHighC ?? null,
            tempMinC: entry?.tempLowC ?? null,
            windKmh: (entry?.values?.windKmh as number) ?? null,
            windDir: null,
            humidity: (entry?.values?.humidity as number) ?? null,
            precipMm: entry?.totalPrecipMm ?? null,
            cloudCover: (entry?.values?.cloudCover as number) ?? null,
            weatherCode: (entry?.values?.weatherCode as number) ?? null,
            avgTempC: baseline?.avgTempC ?? null,
            avgPrecipMm: baseline?.avgPrecipMm ?? null,
            avgWindKmh: baseline?.avgWindKmh ?? null,
          });
        }

        allResults.push({
          location: loc,
          view,
          startDate,
          endDate,
          days,
          avgPeriod: [avgStart, avgEnd],
          summary: computeSummary(days),
        });
      }

      setResults(allResults);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  }, [locations, selectedDate, view, avgStart, avgEnd]);

  const clearAll = () => {
    setLocations([null]); setSelectedDate(todayISO()); setView("day");
    setResults([]); setError("");
  };

  const handleExport = () => {
    exportPDF(results, { company, site, manager, assessedBy, date: assessDate }, windUnit, rainThreshold);
  };

  // Summary cards from first result
  const firstRes = results[0];
  const cards = useMemo(() => {
    if (!firstRes) return [
      { label: "Temperature", value: "--", sub: "Daily high", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" },
      { label: "Rainfall", value: "--", sub: "Total precipitation", bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
      { label: "Wind Speed", value: "--", sub: windUnit === "mph" ? "miles per hour" : "km per hour", bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
      { label: "Conditions", value: "--", sub: "Dominant weather", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
    ];
    const s = firstRes.summary;
    const delta = s.tempDelta >= 0 ? `+${s.tempDelta.toFixed(1)}` : s.tempDelta.toFixed(1);
    return [
      { label: "Temperature", value: `${s.avgTemp.toFixed(1)}°C`, sub: `${delta}°C vs baseline`, bgClass: s.tempDelta > 2 ? "bg-orange-50" : s.tempDelta < -2 ? "bg-cyan-50" : "bg-red-50", textClass: s.tempDelta > 2 ? "text-orange-800" : s.tempDelta < -2 ? "text-cyan-800" : "text-red-800", borderClass: s.tempDelta > 2 ? "border-orange-200" : s.tempDelta < -2 ? "border-cyan-200" : "border-red-200", dotClass: s.tempDelta > 2 ? "bg-orange-500" : s.tempDelta < -2 ? "bg-cyan-500" : "bg-red-500" },
      { label: "Rainfall", value: `${s.totalRainMm.toFixed(1)} mm`, sub: `${s.rainDays} rain day${s.rainDays !== 1 ? "s" : ""} (>=${rainThreshold}mm)`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
      { label: "Wind Speed", value: fmtWind(s.avgWind, windUnit), sub: `Max: ${fmtWind(s.maxWind, windUnit)}`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
      { label: "Conditions", value: getWMO(s.dominantCode).description, sub: `Cloud: ${s.avgCloud.toFixed(0)}% | Humidity: ${s.avgHumidity.toFixed(0)}%`, bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
    ];
  }, [firstRes, windUnit, rainThreshold]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <div className="flex gap-1">
          {(["mph", "kmh"] as const).map(u => (
            <button key={u} onClick={() => setWindUnit(u)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${windUnit === u ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>
              {u === "mph" ? "MPH" : "KM/H"}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <PaidDownloadButton hasData={results.length > 0}>
          <button onClick={handleExport} disabled={results.length === 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF
          </button>
        </PaidDownloadButton>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear All
        </button>
      </div>

      {/* Settings Panel (PAID: 5 columns) */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { l: "Company", v: company, s: setCompany },
            { l: "Site", v: site, s: setSite },
            { l: "Site Manager", v: manager, s: setManager },
            { l: "Assessed By", v: assessedBy, s: setAssessedBy },
          ].map(f => (
            <div key={f.l}>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        {/* Location(s) */}
        {locations.map((loc, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Location {locations.length > 1 ? i + 1 : ""}
              </label>
              <LocationSearch value={loc} onChange={(t) => updateLocation(i, t)} />
            </div>
            {locations.length > 1 && (
              <button onClick={() => removeLocation(i)} className="px-2 py-2.5 text-xs text-red-500 hover:text-red-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        ))}
        {locations.length < 3 && (
          <button onClick={addLocation} className="text-xs text-ebrora hover:text-ebrora-dark font-medium">+ Add comparison location</button>
        )}

        {/* Date + View + Baseline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">View</label>
            <div className="flex gap-1">
              {(["day", "week", "month"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors capitalize ${view === v ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora" : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Baseline Average Period</label>
            <div className="flex gap-2 items-center">
              <input type="number" value={avgStart} onChange={e => { const v = parseInt(e.target.value) || 2005; setAvgStart(v); if (avgEnd - v > 20) setAvgEnd(v + 20); }} min={1940} max={2025}
                className="w-20 border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:border-ebrora outline-none text-center" />
              <span className="text-xs text-gray-400">to</span>
              <input type="number" value={avgEnd} onChange={e => { const v = parseInt(e.target.value) || 2025; setAvgEnd(v); if (v - avgStart > 20) setAvgStart(v - 20); }} min={1940} max={2025}
                className="w-20 border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:border-ebrora outline-none text-center" />
              <span className="text-[10px] text-gray-400">(max 20 yrs)</span>
            </div>
          </div>
        </div>

        {view === "month" && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Rain Day Threshold (mm)</label>
            <input type="number" value={rainThreshold} onChange={e => setRainThreshold(parseFloat(e.target.value) || 1)} min={0.1} step={0.5}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>
        )}

        <button onClick={handleFetch} disabled={loading}
          className="w-full py-2.5 text-sm font-semibold text-white bg-ebrora rounded-lg hover:bg-ebrora-dark transition-colors disabled:opacity-50">
          {loading ? "Fetching weather data..." : "Get Weather Data"}
        </button>

        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-lg font-bold text-red-600">!</span>
            <div><div className="text-sm font-bold text-red-900">Error</div><div className="text-xs text-red-800 mt-1">{error}</div></div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (() => {
        const r = results[0];
        const locNames = results.map(r2 => r2.location.name).join(" vs ");
        const startD = new Date(r.startDate + "T12:00:00");
        const endD = new Date(r.endDate + "T12:00:00");
        const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        const fmtMonth = (d: Date) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        let period = "";
        if (view === "day") period = `Historical Weather, ${startD.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
        else if (view === "week") period = `7-Day Weather Summary, ${fmtDate(startD)} – ${fmtDate(endD)}`;
        else period = `Monthly Weather Summary, ${fmtMonth(startD)}`;
        return (
          <div className="border-b border-gray-200 pb-3">
            <h2 className="text-base font-bold text-gray-900">{locNames}, UK</h2>
            <p className="text-sm text-gray-500 mt-0.5">{period}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Compared against {r.avgPeriod[0]}–{r.avgPeriod[1]} historical average · Source: Open-Meteo ERA5</p>
          </div>
        );
      })()}
      {results.map((res, ri) => (
        <div key={ri} className="space-y-4">
          {/* Location header */}
          {results.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ["#EF4444", "#3B82F6", "#10B981"][ri] }} />
              <span className="text-sm font-bold text-gray-900">{res.location.name}, {res.location.region}</span>
            </div>
          )}

          {/* Day view — single card */}
          {view === "day" && res.days[0] && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-bold text-gray-900">{res.location.name}</div>
                  <div className="text-xs text-gray-500">{new Date(res.days[0].date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
                <WeatherIcon code={res.days[0].weatherCode} size={64} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {res.days[0].tempC !== null ? `${res.days[0].tempC.toFixed(1)}°C` : "--"}
                {res.days[0].avgTempC !== null && (
                  <span className={`ml-2 text-sm font-medium ${(res.days[0].tempC ?? 0) > res.days[0].avgTempC ? "text-orange-600" : "text-cyan-600"}`}>
                    ({((res.days[0].tempC ?? 0) - res.days[0].avgTempC) >= 0 ? "+" : ""}{((res.days[0].tempC ?? 0) - res.days[0].avgTempC).toFixed(1)}° vs avg)
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-4">{getWMO(res.days[0].weatherCode).description}</div>

              {res.days[0].tempMinC !== null && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg mb-4 ${res.days[0].tempMinC <= 0 ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                  Daily low: {res.days[0].tempMinC.toFixed(1)}°C
                  {res.days[0].tempMinC <= 0 && <span className="text-cyan-600 font-bold ml-1">Frost</span>}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: "💨", label: "Wind", value: fmtWind(res.days[0].windKmh, windUnit) },
                  { icon: "🌧", label: "Rain", value: res.days[0].precipMm !== null ? `${res.days[0].precipMm.toFixed(1)} mm` : "--" },
                  { icon: "💧", label: "Humidity", value: res.days[0].humidity !== null ? `${Math.round(res.days[0].humidity)}%` : "--" },
                  { icon: "☁", label: "Cloud", value: res.days[0].cloudCover !== null ? `${Math.round(res.days[0].cloudCover)}%` : "--" },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg">{item.icon}</div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase">{item.label}</div>
                    <div className="text-sm font-bold text-gray-900">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Week / Month view — chart + table */}
          {(view === "week" || view === "month") && res.days.length > 0 && (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                  {view === "week" ? "7-Day" : "Monthly"} Overview — {res.location.name}
                </div>
                <CombinedChart days={res.days} windUnit={windUnit} />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="px-2 py-1.5 text-left font-semibold rounded-tl-lg">Date</th>
                      <th className="px-2 py-1.5 text-center font-semibold"></th>
                      <th className="px-2 py-1.5 text-left font-semibold">Conditions</th>
                      <th className="px-2 py-1.5 text-right font-semibold">High</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Low</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Wind</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Rain</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Humid</th>
                      <th className="px-2 py-1.5 text-right font-semibold rounded-tr-lg">Cloud</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.days.map((day, di) => {
                      const wmo = getWMO(day.weatherCode);
                      const frost = day.tempMinC !== null && day.tempMinC <= 0;
                      return (
                        <tr key={di} className={`${di % 2 === 0 ? "bg-gray-50" : "bg-white"} ${frost ? "border-l-2 border-l-cyan-400" : ""}`}>
                          <td className="px-2 py-1.5 font-semibold text-gray-700">
                            {new Date(day.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                          </td>
                          <td className="px-1 py-1"><WeatherIcon code={day.weatherCode} size={22} /></td>
                          <td className="px-2 py-1.5 text-gray-600">{wmo.description}</td>
                          <td className="px-2 py-1.5 text-right font-mono font-semibold">
                            {day.tempC !== null ? `${day.tempC.toFixed(1)}°` : "--"}
                            {day.avgTempC !== null && (
                              <span className={`ml-1 text-[10px] ${(day.tempC ?? 0) > day.avgTempC ? "text-orange-500" : "text-cyan-500"}`}>
                                ({((day.tempC ?? 0) - day.avgTempC) >= 0 ? "+" : ""}{((day.tempC ?? 0) - day.avgTempC).toFixed(1)})
                              </span>
                            )}
                          </td>
                          <td className={`px-2 py-1.5 text-right font-mono ${frost ? "text-cyan-600 font-bold" : ""}`}>
                            {day.tempMinC !== null ? `${day.tempMinC.toFixed(1)}°` : "--"}
                            {frost && <span className="ml-0.5 text-[9px]">*</span>}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono">{day.windKmh !== null ? fmtWind(day.windKmh, windUnit).replace(/ (mph|km\/h)/, "") : "--"}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{day.precipMm !== null ? `${day.precipMm.toFixed(1)}` : "--"}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{day.humidity !== null ? `${Math.round(day.humidity)}%` : "--"}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{day.cloudCover !== null ? `${Math.round(day.cloudCover)}%` : "--"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {view === "month" && (
                  <div className="mt-2 text-[10px] text-gray-400">
                    * = frost (daily low at or below 0{"°"}C) | Rain days ({">="}{rainThreshold}mm): {firstRes?.summary.rainDays ?? 0}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Data Source</div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Weather data from the <strong>Open-Meteo Archive API</strong> (ERA5 reanalysis, 1940-present). Temperature shows daily high (max) and daily low (min) across all 24 hours. Rainfall is the 24-hour total. Wind, humidity, cloud cover, and conditions are <strong>12:00 PM snapshots</strong>.</p>
          <p>The baseline comparison averages the same calendar date(s) across your selected averaging period (default 2000-2025). This shows whether conditions were warmer/cooler or wetter/drier than the long-term average.</p>
        </div>
      </div>
    </div>
  );
}
