// src/components/sunrise-sunset-times/SunriseSunsetTimesClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  UK_CITIES, calculateSolarTimes, calculateWeek, calculateMonth,
  fmtTime, fmtDuration, fmtDateShort, fmtDateFull, fmtMonthYear,
  REGULATORY_REFS, WHY_IT_MATTERS, getUKOffset,
  DAY_LABELS,
} from "@/data/sunrise-sunset-times";
import type { CityData, SolarTimes, ViewMode } from "@/data/sunrise-sunset-times";

// ─── Helpers ─────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

// ─── Sky Arc Visualisation (SVG) ─────────────────────────────
function SkyArcGraphic({ solar, city }: { solar: SolarTimes; city: CityData }) {
  const W = 600, H = 260;
  const cx = W / 2, horizon = 195, arcRadius = 145;

  // Minutes helper
  const toMin = (d: Date | null) => d ? d.getHours() * 60 + d.getMinutes() : null;
  const sunriseMin = toMin(solar.sunrise);
  const sunsetMin = toMin(solar.sunset);
  const civilStartMin = toMin(solar.civilTwilightStart);
  const civilEndMin = toMin(solar.civilTwilightEnd);
  const noonMin = toMin(solar.solarNoon);

  // Map a time in minutes to angle on the arc (sunrise=left, sunset=right)
  const timeToAngle = (min: number): number => {
    if (sunriseMin === null || sunsetMin === null) return Math.PI;
    const ratio = (min - sunriseMin) / (sunsetMin - sunriseMin);
    return Math.PI - ratio * Math.PI; // PI (left) to 0 (right)
  };

  const timeToXY = (min: number): { x: number; y: number } => {
    const a = timeToAngle(min);
    return { x: cx + arcRadius * Math.cos(a), y: horizon - arcRadius * Math.sin(a) };
  };

  // Current time sun position (for today) — use noon as representative
  const nowMin = noonMin || 720;
  const sunPos = (sunriseMin !== null && sunsetMin !== null && nowMin >= sunriseMin && nowMin <= sunsetMin)
    ? timeToXY(nowMin) : null;

  // Daylight arc path
  const arcPath = sunriseMin !== null && sunsetMin !== null
    ? `M ${cx - arcRadius} ${horizon} A ${arcRadius} ${arcRadius} 0 0 1 ${cx + arcRadius} ${horizon}`
    : "";

  // Sky gradient stops based on season
  const daylightRatio = solar.daylightMinutes / 1440;
  const isWinter = daylightRatio < 0.4;
  const isSummer = daylightRatio > 0.55;

  // Twilight zone widths
  const twilightStartX = civilStartMin !== null && sunriseMin !== null ? timeToXY((civilStartMin + sunriseMin) / 2).x : cx - arcRadius - 20;
  const twilightEndX = civilEndMin !== null && sunsetMin !== null ? timeToXY((sunsetMin + civilEndMin) / 2).x : cx + arcRadius + 20;

  const tzLabel = getUKOffset(solar.date) === 60 ? "BST" : "GMT";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }}>
      <defs>
        {/* Sky gradient */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isSummer ? "#0A1628" : isWinter ? "#0F172A" : "#0C1E3A"} />
          <stop offset="30%" stopColor={isSummer ? "#1E3A5F" : isWinter ? "#1E293B" : "#1E3A5F"} />
          <stop offset="60%" stopColor={isSummer ? "#3B82F6" : isWinter ? "#475569" : "#2563EB"} />
          <stop offset="85%" stopColor={isSummer ? "#7DD3FC" : isWinter ? "#94A3B8" : "#60A5FA"} />
          <stop offset="100%" stopColor={isSummer ? "#FDE68A" : isWinter ? "#CBD5E1" : "#FCD34D"} />
        </linearGradient>
        {/* Sun glow */}
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
          <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        {/* Horizon gradient */}
        <linearGradient id="horizonGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.5" />
          <stop offset="30%" stopColor="#FB923C" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#FB923C" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id="skyClip">
          <rect x="0" y="0" width={W} height={horizon + 5} />
        </clipPath>
      </defs>

      {/* Background sky */}
      <rect x="0" y="0" width={W} height={H} rx="12" fill="url(#skyGrad)" />

      {/* Stars (winter/night) */}
      {isWinter && [
        [80, 30], [150, 55], [450, 25], [520, 50], [300, 18], [370, 45], [200, 70], [490, 70], [100, 85],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={1} fill="white" opacity={0.4 + (i % 3) * 0.2} />
      ))}

      {/* Horizon glow band */}
      <rect x="0" y={horizon - 20} width={W} height="40" fill="url(#horizonGrad)" opacity="0.6" />

      {/* Daylight arc (dashed path showing sun trajectory) */}
      {arcPath && (
        <path d={arcPath} fill="none" stroke="rgba(251,191,36,0.35)" strokeWidth="2" strokeDasharray="6,4" clipPath="url(#skyClip)" />
      )}

      {/* Civil twilight zones */}
      {civilStartMin !== null && sunriseMin !== null && (
        <rect x={Math.max(0, twilightStartX - 25)} y={horizon - 50} width="50" height="50" fill="#6366F1" opacity="0.12" rx="4" />
      )}
      {civilEndMin !== null && sunsetMin !== null && (
        <rect x={Math.min(W - 50, twilightEndX - 25)} y={horizon - 50} width="50" height="50" fill="#6366F1" opacity="0.12" rx="4" />
      )}

      {/* Sunrise marker */}
      {sunriseMin !== null && (
        <g>
          <circle cx={cx - arcRadius} cy={horizon} r="10" fill="#FBBF24" opacity="0.5" />
          <circle cx={cx - arcRadius} cy={horizon} r="5" fill="#F59E0B" />
          <text x={cx - arcRadius} y={horizon + 22} textAnchor="middle" fontSize="10" fontWeight="700" fill="#FDE68A">
            {fmtTime(solar.sunrise)}
          </text>
          <text x={cx - arcRadius} y={horizon + 34} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.6)">
            Sunrise
          </text>
        </g>
      )}

      {/* Solar noon marker (sun at apex) */}
      {sunPos && (
        <g>
          <circle cx={cx} cy={horizon - arcRadius} r="22" fill="url(#sunGlow)" />
          <circle cx={cx} cy={horizon - arcRadius} r="12" fill="#FBBF24" />
          <circle cx={cx} cy={horizon - arcRadius} r="8" fill="#FDE68A" />
          <text x={cx} y={horizon - arcRadius - 20} textAnchor="middle" fontSize="9" fontWeight="700" fill="#FDE68A">
            {fmtTime(solar.solarNoon)}
          </text>
          <text x={cx} y={horizon - arcRadius + 28} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.6)">
            Solar Noon ({solar.sunAltitudeNoon.toFixed(1)}°)
          </text>
        </g>
      )}

      {/* Sunset marker */}
      {sunsetMin !== null && (
        <g>
          <circle cx={cx + arcRadius} cy={horizon} r="10" fill="#F97316" opacity="0.5" />
          <circle cx={cx + arcRadius} cy={horizon} r="5" fill="#EA580C" />
          <text x={cx + arcRadius} y={horizon + 22} textAnchor="middle" fontSize="10" fontWeight="700" fill="#FDBA74">
            {fmtTime(solar.sunset)}
          </text>
          <text x={cx + arcRadius} y={horizon + 34} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.6)">
            Sunset
          </text>
        </g>
      )}

      {/* Horizon line */}
      <line x1="20" y1={horizon} x2={W - 20} y2={horizon} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

      {/* Ground area */}
      <rect x="0" y={horizon} width={W} height={H - horizon} fill="#1B5745" opacity="0.35" rx="0" />
      {/* Grass texture lines */}
      {[40, 100, 180, 260, 340, 420, 500, 560].map((gx, i) => (
        <line key={i} x1={gx} y1={horizon + 2} x2={gx + (i % 2 ? 5 : -5)} y2={horizon - 5} stroke="#22C55E" strokeWidth="1" opacity="0.3" />
      ))}

      {/* City & Date label */}
      <text x="20" y="22" fontSize="13" fontWeight="700" fill="white">{city.name}</text>
      <text x="20" y="38" fontSize="10" fill="rgba(255,255,255,0.7)">{fmtDateFull(solar.date)}</text>
      <text x={W - 20} y="22" textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.5)">{tzLabel}</text>

      {/* Daylight duration badge */}
      <rect x={W / 2 - 55} y={H - 36} width="110" height="26" rx="13" fill="rgba(27,87,69,0.75)" />
      <text x={W / 2} y={H - 19} textAnchor="middle" fontSize="11" fontWeight="700" fill="#E8F0EC">
        {fmtDuration(solar.daylightMinutes)} daylight
      </text>

      {/* Civil twilight labels */}
      {solar.civilTwilightStart && (
        <text x={cx - arcRadius - 30} y={horizon - 40} textAnchor="middle" fontSize="7" fill="#A5B4FC">
          Civil twilight {fmtTime(solar.civilTwilightStart)}
        </text>
      )}
      {solar.civilTwilightEnd && (
        <text x={cx + arcRadius + 30} y={horizon - 40} textAnchor="middle" fontSize="7" fill="#A5B4FC">
          Civil twilight {fmtTime(solar.civilTwilightEnd)}
        </text>
      )}
    </svg>
  );
}

// ─── Week View Table ─────────────────────────────────────────
function WeekTable({ data }: { data: SolarTimes[] }) {
  const maxDaylight = Math.max(...data.map(d => d.daylightMinutes));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Day</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">Civil Twilight</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-amber-600">Sunrise</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">Solar Noon</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-orange-600">Sunset</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">Civil Twilight</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">Daylight</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-ebrora">Work Hours</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((s, i) => {
            const barWidth = maxDaylight > 0 ? (s.daylightMinutes / maxDaylight) * 100 : 0;
            const isWeekend = [5, 6].includes(i); // Sat, Sun (Mon=0)
            return (
              <tr key={i} className={isWeekend ? "bg-gray-50/50" : ""}>
                <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{fmtDateShort(s.date)}</td>
                <td className="px-3 py-2 text-center text-indigo-500 font-mono text-xs">{fmtTime(s.civilTwilightStart)}</td>
                <td className="px-3 py-2 text-center text-amber-600 font-mono text-xs font-semibold">{fmtTime(s.sunrise)}</td>
                <td className="px-3 py-2 text-center text-gray-500 font-mono text-xs">{fmtTime(s.solarNoon)}</td>
                <td className="px-3 py-2 text-center text-orange-600 font-mono text-xs font-semibold">{fmtTime(s.sunset)}</td>
                <td className="px-3 py-2 text-center text-indigo-500 font-mono text-xs">{fmtTime(s.civilTwilightEnd)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300" style={{ width: `${barWidth}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-12 text-right">{fmtDuration(s.daylightMinutes)}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center text-xs font-bold text-ebrora">{s.recommendedStart} – {s.recommendedEnd}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Month View Calendar ─────────────────────────────────────
function MonthCalendar({ data, year, month }: { data: SolarTimes[]; year: number; month: number }) {
  // Get the day-of-week of the 1st (0=Sun, adjust to Mon=0)
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0

  const maxDaylight = Math.max(...data.map(d => d.daylightMinutes));
  const minDaylight = Math.min(...data.map(d => d.daylightMinutes));

  const daylightColor = (mins: number): string => {
    const ratio = maxDaylight > minDaylight ? (mins - minDaylight) / (maxDaylight - minDaylight) : 0.5;
    if (ratio > 0.7) return "bg-amber-50 border-amber-200";
    if (ratio > 0.4) return "bg-yellow-50 border-yellow-100";
    return "bg-slate-50 border-slate-200";
  };

  const cells: (SolarTimes | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  data.forEach(d => cells.push(d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-1 min-w-[640px]">
        {/* Header */}
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 py-1">{d}</div>
        ))}
        {/* Cells */}
        {cells.map((s, i) => (
          <div key={i} className={`rounded-lg p-1.5 min-h-[72px] text-[10px] border ${s ? daylightColor(s.daylightMinutes) : "bg-transparent border-transparent"}`}>
            {s && (
              <>
                <div className="font-bold text-gray-700 text-xs mb-0.5">{s.date.getDate()}</div>
                <div className="text-amber-600 font-semibold">↑ {fmtTime(s.sunrise)}</div>
                <div className="text-orange-600 font-semibold">↓ {fmtTime(s.sunset)}</div>
                <div className="text-gray-500 mt-0.5 whitespace-nowrap">{fmtDuration(s.daylightMinutes)}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; assessedBy: string; date: string },
  city: CityData,
  viewMode: ViewMode,
  daySolar: SolarTimes,
  weekData: SolarTimes[],
  monthData: SolarTimes[],
  selectedYear: number,
  selectedMonth: number,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;

  const docRef = `SRS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const tzLabel = getUKOffset(daySolar.date) === 60 ? "BST" : "GMT";

  // ── Header bar (FREE = green)
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("SUNRISE & SUNSET TIMES", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`${city.name}, ${city.region} — CDM 2015 Reg 34 / BS EN 12464-2 — ebrora.com/tools/sunrise-sunset-times`, M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 15, 1, 1, "FD");
  doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + halfW, y, 40);
  y += 5;
  drawFld("Assessed By:", header.assessedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + halfW, y, 30);
  y += 10;

  function checkPage(need: number) {
    if (y + need > 280) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("SUNRISE & SUNSET TIMES (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`${docRef} | ${city.name}`, W - M - 55, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Sky Arc Graphic (simplified for PDF)
  const drawSkyArc = (s: SolarTimes, arcY: number) => {
    const arcW = CW, arcH = 50;
    const arcCx = M + arcW / 2, arcHorizon = arcY + arcH - 8, arcR = arcH - 12;

    // Sky background
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(M, arcY, arcW, arcH, 3, 3, "F");
    // Horizon glow
    doc.setFillColor(249, 115, 22);
    doc.rect(M, arcHorizon - 3, arcW, 6, "F");
    doc.setFillColor(253, 230, 138);
    doc.rect(M, arcHorizon - 1, arcW, 2, "F");
    // Ground
    doc.setFillColor(27, 87, 69);
    doc.rect(M, arcHorizon, arcW, arcY + arcH - arcHorizon, "F");

    // Sun arc (draw segments)
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.5);
    for (let a = 0; a < Math.PI; a += 0.1) {
      const x1 = arcCx + arcR * Math.cos(a);
      const y1 = arcHorizon - arcR * Math.sin(a);
      const x2 = arcCx + arcR * Math.cos(a + 0.1);
      const y2v = arcHorizon - arcR * Math.sin(a + 0.1);
      if (y1 <= arcHorizon && y2v <= arcHorizon) {
        doc.line(x1, y1, x2, y2v);
      }
    }

    // Sun at noon
    doc.setFillColor(251, 191, 36);
    doc.circle(arcCx, arcHorizon - arcR, 4, "F");
    doc.setFillColor(253, 230, 138);
    doc.circle(arcCx, arcHorizon - arcR, 2.5, "F");

    // Sunrise dot
    doc.setFillColor(245, 158, 11);
    doc.circle(arcCx - arcR, arcHorizon, 2, "F");
    // Sunset dot
    doc.setFillColor(234, 88, 12);
    doc.circle(arcCx + arcR, arcHorizon, 2, "F");

    // Labels
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text(fmtTime(s.sunrise), arcCx - arcR, arcHorizon + 6, { align: "center" });
    doc.text(fmtTime(s.sunset), arcCx + arcR, arcHorizon + 6, { align: "center" });
    doc.text(fmtTime(s.solarNoon), arcCx, arcHorizon - arcR - 6, { align: "center" });

    doc.setFontSize(5.5); doc.setFont("helvetica", "normal");
    doc.text("Sunrise", arcCx - arcR, arcHorizon + 10, { align: "center" });
    doc.text("Sunset", arcCx + arcR, arcHorizon + 10, { align: "center" });
    doc.text(`Solar Noon (${s.sunAltitudeNoon.toFixed(1)}°)`, arcCx, arcHorizon - arcR + 7, { align: "center" });

    // City/date
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(city.name, M + 4, arcY + 8);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(fmtDateFull(s.date), M + 4, arcY + 13);
    doc.text(tzLabel, M + arcW - 4, arcY + 8, { align: "right" });

    // Daylight badge
    doc.setFillColor(27, 87, 69);
    doc.roundedRect(arcCx - 16, arcY + arcH - 10, 32, 7, 3, 3, "F");
    doc.setTextColor(232, 240, 236); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    doc.text(`${fmtDuration(s.daylightMinutes)} daylight`, arcCx, arcY + arcH - 5, { align: "center" });

    doc.setTextColor(0, 0, 0); doc.setLineWidth(0.2); doc.setDrawColor(220, 220, 220);
  };

  // Draw sky arc for the primary day
  checkPage(60);
  drawSkyArc(daySolar, y);
  y += 56;

  // ── Summary panel
  checkPage(40);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y, CW, 32, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Solar Summary", M + 4, y + 5); y += 8;

  const summaryItems = [
    ["City", `${city.name}, ${city.region} (${city.lat.toFixed(4)}°N, ${Math.abs(city.lng).toFixed(4)}°W)`],
    ["Civil Twilight Start", fmtTime(daySolar.civilTwilightStart)],
    ["Sunrise", fmtTime(daySolar.sunrise)],
    ["Solar Noon", `${fmtTime(daySolar.solarNoon)} (altitude ${daySolar.sunAltitudeNoon.toFixed(1)}°)`],
    ["Sunset", fmtTime(daySolar.sunset)],
    ["Civil Twilight End", fmtTime(daySolar.civilTwilightEnd)],
    ["Daylight Hours", fmtDuration(daySolar.daylightMinutes)],
    ["Usable Work Hours (twilight–twilight)", fmtDuration(daySolar.usableWorkMinutes)],
    ["Recommended Working Hours", `${daySolar.recommendedStart} – ${daySolar.recommendedEnd}`],
    ["Timezone", tzLabel],
  ];
  summaryItems.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
    doc.text(value, M + 62, y);
    y += 3.2;
  });
  y += 5;

  // ── Data table based on view mode
  const tableData = viewMode === "day" ? [daySolar] : viewMode === "week" ? weekData : monthData;
  const tableTitle = viewMode === "day" ? `Daily Detail — ${fmtDateFull(daySolar.date)}`
    : viewMode === "week" ? `Weekly Overview — w/c ${fmtDateShort(weekData[0]?.date || daySolar.date)}`
    : `Monthly Overview — ${fmtMonthYear(selectedYear, selectedMonth)}`;

  checkPage(20);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text(tableTitle, M, y); y += 5;

  // Table header
  const cols = ["Date", "Civ. Twi.", "Sunrise", "Noon", "Sunset", "Civ. Twi.", "Daylight", "Work Hrs"];
  const colWidths = [26, 18, 18, 18, 18, 18, 22, 26]; // sum ~164 ~= CW minus some
  const colX: number[] = [];
  let cxPos = M;
  colWidths.forEach(w => { colX.push(cxPos); cxPos += w; });

  // Header row
  doc.setFillColor(27, 87, 69);
  doc.rect(M, y, CW, 6, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(5.5); doc.setFont("helvetica", "bold");
  cols.forEach((c, ci) => doc.text(c, colX[ci] + 2, y + 4));
  y += 6;
  doc.setTextColor(0, 0, 0);

  // Data rows
  tableData.forEach((s, ri) => {
    checkPage(6);
    const isEven = ri % 2 === 0;
    if (isEven) { doc.setFillColor(248, 250, 252); doc.rect(M, y, CW, 5, "F"); }

    doc.setFontSize(5.5); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);
    doc.setDrawColor(220, 220, 220);

    const rowData = [
      fmtDateShort(s.date),
      fmtTime(s.civilTwilightStart),
      fmtTime(s.sunrise),
      fmtTime(s.solarNoon),
      fmtTime(s.sunset),
      fmtTime(s.civilTwilightEnd),
      fmtDuration(s.daylightMinutes),
      `${s.recommendedStart} – ${s.recommendedEnd}`,
    ];
    rowData.forEach((val, ci) => {
      // Colour-code sunrise/sunset columns
      if (ci === 2) doc.setTextColor(180, 120, 0);
      else if (ci === 4) doc.setTextColor(200, 80, 0);
      else if (ci === 7) doc.setTextColor(27, 87, 69);
      else doc.setTextColor(30, 30, 30);
      doc.text(val, colX[ci] + 2, y + 3.5);
    });

    // Daylight bar in daylight column
    const maxDL = Math.max(...tableData.map(d => d.daylightMinutes));
    const barW = maxDL > 0 ? (s.daylightMinutes / maxDL) * (colWidths[6] - 14) : 0;
    doc.setFillColor(253, 224, 71);
    doc.roundedRect(colX[6] + 2, y + 0.5, barW, 3.5, 1, 1, "F");

    doc.setDrawColor(220, 220, 220);
    doc.line(M, y + 5, M + CW, y + 5);
    y += 5;
  });
  y += 4;

  // ── Regulatory references
  checkPage(40);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text("Regulatory Context", M, y); y += 5;

  doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(60, 60, 60);
  const whyLines = doc.splitTextToSize(
    "Knowing exact sunrise, sunset, and civil twilight times is critical for construction site planning. CDM 2015 Regulation 34 requires workplaces to have suitable lighting. Civil twilight provides enough ambient light for outdoor work without artificial lighting. Planning shift patterns around daylight hours improves safety, reduces energy costs, and ensures compliance.",
    CW
  );
  doc.text(whyLines, M, y);
  y += whyLines.length * 2.8 + 3;

  REGULATORY_REFS.forEach(ref => {
    checkPage(12);
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text(`${ref.code} — ${ref.title}`, M, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60); doc.setFontSize(6);
    const refLines = doc.splitTextToSize(ref.description, CW - 4);
    doc.text(refLines, M + 2, y + 3.5);
    y += 3.5 + refLines.length * 2.5 + 2;
  });

  // ── Sign-off
  checkPage(50);
  y += 4;
  doc.setDrawColor(27, 87, 69); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
  doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5.5);
  doc.text("Site Manager", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // ── Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "Solar times calculated using the NOAA Solar Position Algorithm. Civil twilight = sun 6\u00B0 below horizon. This is a planning tool \u2014 actual conditions may vary due to terrain, cloud cover, and obstructions.",
      M, 290
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 290);
  }

  const filename = viewMode === "month"
    ? `sunrise-sunset-${city.name.toLowerCase()}-${fmtMonthYear(selectedYear, selectedMonth).replace(/ /g, "-").toLowerCase()}.pdf`
    : `sunrise-sunset-${city.name.toLowerCase()}-${header.date}.pdf`;
  doc.save(filename);
}

// ─── Main Component ──────────────────────────────────────────
export default function SunriseSunsetTimesClient() {
  const today = new Date();
  const [cityIdx, setCityIdx] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const city = UK_CITIES[cityIdx];
  const parsedDate = parseLocalDate(selectedDate);

  const daySolar = useMemo(() => calculateSolarTimes(city, parsedDate), [city, parsedDate]);
  const weekData = useMemo(() => calculateWeek(city, parsedDate), [city, parsedDate]);
  const monthData = useMemo(() => calculateMonth(city, selectedYear, selectedMonth), [city, selectedYear, selectedMonth]);

  // For month view, show the first day's solar for the arc
  const arcSolar = viewMode === "month" ? (monthData[0] || daySolar) : daySolar;

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportPDF(
        { site, manager, assessedBy, date: selectedDate },
        city, viewMode, daySolar, weekData, monthData, selectedYear, selectedMonth,
      );
    } finally { setExporting(false); }
  }, [site, manager, assessedBy, selectedDate, city, viewMode, daySolar, weekData, monthData, selectedYear, selectedMonth]);

  const clearAll = useCallback(() => {
    setCityIdx(0); setViewMode("month"); setSelectedDate(todayISO());
    setSelectedYear(today.getFullYear()); setSelectedMonth(today.getMonth());
    setSite(""); setManager(""); setAssessedBy("");
  }, [today]);

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const tzLabel = getUKOffset(parsedDate) === 60 ? "BST" : "GMT";

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Sunrise", value: fmtTime(daySolar.sunrise), sub: `Civil twilight ${fmtTime(daySolar.civilTwilightStart)}`, bgClass: "bg-amber-50", textClass: "text-amber-800", borderClass: "border-amber-200", dotClass: "bg-amber-500" },
          { label: "Sunset", value: fmtTime(daySolar.sunset), sub: `Civil twilight ${fmtTime(daySolar.civilTwilightEnd)}`, bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
          { label: "Daylight Hours", value: fmtDuration(daySolar.daylightMinutes), sub: `Usable: ${fmtDuration(daySolar.usableWorkMinutes)}`, bgClass: "bg-yellow-50", textClass: "text-yellow-800", borderClass: "border-yellow-200", dotClass: "bg-yellow-500" },
          { label: "Work Hours", value: `${daySolar.recommendedStart} – ${daySolar.recommendedEnd}`, sub: `${city.name} · ${tzLabel}`, bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500" },
        ].map(c => (
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

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Name</label>
            <input type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="Site name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Manager</label>
            <input type="text" value={manager} onChange={e => setManager(e.target.value)} placeholder="Manager name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Assessed By</label>
            <input type="text" value={assessedBy} onChange={e => setAssessedBy(e.target.value)} placeholder="Your name"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* ── Controls: City + View Mode ────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Location & View</h3>

        {/* City selector */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">City</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {UK_CITIES.map((c, i) => (
              <button key={c.name} onClick={() => setCityIdx(i)}
                className={`px-2 py-2 text-xs font-medium rounded-lg border transition-all ${i === cityIdx
                  ? "bg-ebrora text-white border-ebrora shadow-sm"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>
                {c.name}
                <span className={`block text-[9px] mt-0.5 ${i === cityIdx ? "text-white/70" : "text-gray-400"}`}>{c.region}</span>
              </button>
            ))}
          </div>
        </div>

        {/* View mode */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">View</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 w-fit">
            {(["day", "week", "month"] as ViewMode[]).map(vm => (
              <button key={vm} onClick={() => setViewMode(vm)}
                className={`px-4 py-1.5 text-xs font-bold capitalize ${viewMode === vm
                  ? "bg-ebrora text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                {vm}
              </button>
            ))}
          </div>
        </div>

        {/* Date / month selectors */}
        {viewMode === "day" && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-48 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
          </div>
        )}
        {viewMode === "week" && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Week containing</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-48 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/40 focus:bg-white focus:border-ebrora outline-none" />
          </div>
        )}
        {viewMode === "month" && (
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-bold text-gray-800 min-w-[140px] text-center">{fmtMonthYear(selectedYear, selectedMonth)}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Sky Arc Graphic ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Sun Path</h3>
        <p className="text-[11px] text-gray-400">Visual representation of the sun&apos;s arc across the sky. Sunrise (left), solar noon (top), sunset (right). Arc size changes with season and latitude.</p>
        <SkyArcGraphic solar={viewMode === "day" ? daySolar : viewMode === "week" ? weekData[0] : monthData[Math.floor(monthData.length / 2)] || daySolar} city={city} />
      </div>

      {/* ── Data View ──────────────────────────────────────── */}
      {viewMode === "day" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Daily Detail — {fmtDateFull(daySolar.date)}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { label: "Civil Twilight Start", value: fmtTime(daySolar.civilTwilightStart), color: "text-indigo-600", icon: "🌒" },
              { label: "Sunrise", value: fmtTime(daySolar.sunrise), color: "text-amber-600", icon: "🌅" },
              { label: "Solar Noon", value: `${fmtTime(daySolar.solarNoon)} (altitude ${daySolar.sunAltitudeNoon.toFixed(1)}°)`, color: "text-yellow-600", icon: "☀️" },
              { label: "Sunset", value: fmtTime(daySolar.sunset), color: "text-orange-600", icon: "🌇" },
              { label: "Civil Twilight End", value: fmtTime(daySolar.civilTwilightEnd), color: "text-indigo-600", icon: "🌑" },
              { label: "Daylight Duration", value: fmtDuration(daySolar.daylightMinutes), color: "text-yellow-700", icon: "⏱️" },
              { label: "Usable Work Hours (twilight–twilight)", value: fmtDuration(daySolar.usableWorkMinutes), color: "text-emerald-700", icon: "🏗️" },
              { label: "Recommended Working Hours", value: `${daySolar.recommendedStart} – ${daySolar.recommendedEnd}`, color: "text-ebrora", icon: "📋" },
              { label: "Timezone", value: tzLabel, color: "text-gray-600", icon: "🕐" },
            ].map(item => (
              <div key={item.label} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "week" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Weekly Overview — w/c {fmtDateShort(weekData[0]?.date || parsedDate)}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Monday to Sunday. Colour bars show relative daylight hours.</p>
          </div>
          <WeekTable data={weekData} />
        </div>
      )}

      {viewMode === "month" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Monthly Calendar — {fmtMonthYear(selectedYear, selectedMonth)}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Each cell shows sunrise (↑) and sunset (↓). Warmer colours = more daylight.</p>
          </div>
          <div className="p-3">
            <MonthCalendar data={monthData} year={selectedYear} month={selectedMonth} />
          </div>
        </div>
      )}

      {/* ── Month detail table (always show below calendar in month mode) */}
      {viewMode === "month" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Detailed Table — {fmtMonthYear(selectedYear, selectedMonth)}</h3>
          </div>
          <WeekTable data={monthData} />
        </div>
      )}

      {/* ── Regulatory References ──────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Why Daylight Hours Matter on Construction Sites</h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">{WHY_IT_MATTERS}</p>
          <div className="space-y-2 mt-3">
            {REGULATORY_REFS.map(ref => (
              <div key={ref.code} className="flex gap-2 items-start">
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-ebrora-light text-ebrora rounded-md whitespace-nowrap mt-0.5">{ref.code}</span>
                <div>
                  <span className="text-xs font-semibold text-gray-700">{ref.title}</span>
                  <span className="text-xs text-gray-500 ml-1">{ref.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Solar times calculated using the NOAA Solar Position Algorithm (gml.noaa.gov/grad/solcalc).
          Civil twilight = sun 6° below horizon (enough ambient light for outdoor work).
          UK BST/GMT transitions handled automatically. This is a planning tool — actual conditions may vary due to terrain, cloud cover, and obstructions.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
