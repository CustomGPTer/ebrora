// src/components/printable-paper/PrintablePaperClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PAPER_CATEGORIES, PAGE_DIMS, MARGINS, GRID_COLOR_PRESETS,
  PAPER_TINT_COLORS, PAPER_TINT_LABELS, PAGE_COUNT_OPTIONS,
  FAQ_ITEMS, defaultConfig, getTypeById, totalVariationCount,
} from "@/data/printable-paper";
import type {
  PaperCategoryId, PaperConfig, PageSize, Orientation,
  MarginSize, PaperTint, TitleBlockStyle, ScaleRulerPosition,
} from "@/data/printable-paper";

// ─── SVG Drawing Functions ───────────────────────────────────────
// These draw the paper pattern into an SVG at a given scale
// All coordinates are in mm; the SVG viewBox maps mm to screen pixels

interface DrawArea {
  x: number; y: number; w: number; h: number;
}

function svgSquareGrid(area: DrawArea, spacing: number, color: string, boldEvery?: number): string {
  let lines = "";
  const { x, y, w, h } = area;
  for (let gx = 0; gx <= w; gx += spacing) {
    const isBold = boldEvery && boldEvery > 0 && gx % boldEvery === 0;
    lines += `<line x1="${x + gx}" y1="${y}" x2="${x + gx}" y2="${y + h}" stroke="${color}" stroke-width="${isBold ? 0.4 : 0.15}" opacity="${isBold ? 0.7 : 0.4}"/>`;
  }
  for (let gy = 0; gy <= h; gy += spacing) {
    const isBold = boldEvery && boldEvery > 0 && gy % boldEvery === 0;
    lines += `<line x1="${x}" y1="${y + gy}" x2="${x + w}" y2="${y + gy}" stroke="${color}" stroke-width="${isBold ? 0.4 : 0.15}" opacity="${isBold ? 0.7 : 0.4}"/>`;
  }
  return lines;
}

function svgSectionGrid(area: DrawArea, fineSpacing: number, color: string, boldSpacing: number, heavyBoldSpacing?: number): string {
  let lines = "";
  const { x, y, w, h } = area;
  for (let gx = 0; gx <= w; gx += fineSpacing) {
    const isHeavy = heavyBoldSpacing && heavyBoldSpacing > 0 && gx % heavyBoldSpacing === 0;
    const isBold = !isHeavy && gx % boldSpacing === 0;
    lines += `<line x1="${x + gx}" y1="${y}" x2="${x + gx}" y2="${y + h}" stroke="${color}" stroke-width="${isHeavy ? 0.6 : isBold ? 0.35 : 0.1}" opacity="${isHeavy ? 0.8 : isBold ? 0.55 : 0.3}"/>`;
  }
  for (let gy = 0; gy <= h; gy += fineSpacing) {
    const isHeavy = heavyBoldSpacing && heavyBoldSpacing > 0 && gy % heavyBoldSpacing === 0;
    const isBold = !isHeavy && gy % boldSpacing === 0;
    lines += `<line x1="${x}" y1="${y + gy}" x2="${x + w}" y2="${y + gy}" stroke="${color}" stroke-width="${isHeavy ? 0.6 : isBold ? 0.35 : 0.1}" opacity="${isHeavy ? 0.8 : isBold ? 0.55 : 0.3}"/>`;
  }
  return lines;
}

function svgDotGrid(area: DrawArea, spacing: number, color: string): string {
  let dots = "";
  const { x, y, w, h } = area;
  for (let gx = 0; gx <= w; gx += spacing) {
    for (let gy = 0; gy <= h; gy += spacing) {
      dots += `<circle cx="${x + gx}" cy="${y + gy}" r="0.3" fill="${color}" opacity="0.5"/>`;
    }
  }
  return dots;
}

function svgIsometricGrid(area: DrawArea, spacing: number, color: string): string {
  let lines = "";
  const { x, y, w, h } = area;
  const rowH = spacing * Math.sin(Math.PI / 3);
  // Horizontal lines
  for (let gy = 0; gy <= h; gy += rowH) {
    lines += `<line x1="${x}" y1="${y + gy}" x2="${x + w}" y2="${y + gy}" stroke="${color}" stroke-width="0.15" opacity="0.35"/>`;
  }
  // Diagonal lines (/)
  for (let start = -h; start <= w + h; start += spacing) {
    const x1 = x + start, y1 = y + h;
    const x2 = x + start + h / Math.tan(Math.PI / 3), y2 = y;
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.15" opacity="0.35"/>`;
  }
  // Diagonal lines (\)
  for (let start = -h; start <= w + h; start += spacing) {
    const x1 = x + start, y1 = y;
    const x2 = x + start - h / Math.tan(Math.PI / 3), y2 = y + h;
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.15" opacity="0.35"/>`;
  }
  return lines;
}

function svgIsometricDot(area: DrawArea, spacing: number, color: string): string {
  let dots = "";
  const { x, y, w, h } = area;
  const rowH = spacing * Math.sin(Math.PI / 3);
  let row = 0;
  for (let gy = 0; gy <= h; gy += rowH) {
    const offset = row % 2 === 1 ? spacing / 2 : 0;
    for (let gx = offset; gx <= w; gx += spacing) {
      dots += `<circle cx="${x + gx}" cy="${y + gy}" r="0.3" fill="${color}" opacity="0.5"/>`;
    }
    row++;
  }
  return dots;
}

function svgHexGrid(area: DrawArea, size: number, color: string): string {
  let lines = "";
  const { x, y, w, h } = area;
  const hexW = size * 2;
  const hexH = size * Math.sqrt(3);
  const colW = size * 1.5;
  for (let col = 0; col * colW <= w + size; col++) {
    for (let row = 0; row * hexH <= h + hexH; row++) {
      const cx2 = x + col * colW;
      const cy2 = y + row * hexH + (col % 2 === 1 ? hexH / 2 : 0);
      // Draw hexagon
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(`${cx2 + size * Math.cos(angle)},${cy2 + size * Math.sin(angle)}`);
      }
      lines += `<polygon points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="0.15" opacity="0.4"/>`;
    }
  }
  return lines;
}

function svgLined(area: DrawArea, spacing: number, color: string): string {
  let lines = "";
  const { x, y, w, h } = area;
  for (let gy = spacing; gy <= h; gy += spacing) {
    lines += `<line x1="${x}" y1="${y + gy}" x2="${x + w}" y2="${y + gy}" stroke="${color}" stroke-width="0.15" opacity="0.4"/>`;
  }
  return lines;
}

function svgCornell(area: DrawArea, spacing: number, color: string): string {
  let lines = "";
  const { x, y, w, h } = area;
  const cueW = w * 0.3; // 30% for cue column
  const summaryH = h * 0.15; // 15% for summary
  // Horizontal ruled lines in notes area
  for (let gy = spacing; gy <= h - summaryH; gy += spacing) {
    lines += `<line x1="${x}" y1="${y + gy}" x2="${x + w}" y2="${y + gy}" stroke="${color}" stroke-width="0.12" opacity="0.3"/>`;
  }
  // Cue column divider
  lines += `<line x1="${x + cueW}" y1="${y}" x2="${x + cueW}" y2="${y + h - summaryH}" stroke="${color}" stroke-width="0.35" opacity="0.6"/>`;
  // Summary divider
  lines += `<line x1="${x}" y1="${y + h - summaryH}" x2="${x + w}" y2="${y + h - summaryH}" stroke="${color}" stroke-width="0.35" opacity="0.6"/>`;
  // Labels
  lines += `<text x="${x + cueW / 2}" y="${y + 3}" text-anchor="middle" font-size="2" fill="${color}" opacity="0.3" font-family="Helvetica">CUE COLUMN</text>`;
  lines += `<text x="${x + cueW + (w - cueW) / 2}" y="${y + 3}" text-anchor="middle" font-size="2" fill="${color}" opacity="0.3" font-family="Helvetica">NOTES</text>`;
  lines += `<text x="${x + w / 2}" y="${y + h - summaryH + 3}" text-anchor="middle" font-size="2" fill="${color}" opacity="0.3" font-family="Helvetica">SUMMARY</text>`;
  return lines;
}

function svgGregg(area: DrawArea, spacing: number, color: string): string {
  let lines = svgLined(area, spacing, color);
  // Centre vertical line
  lines += `<line x1="${area.x + area.w / 2}" y1="${area.y}" x2="${area.x + area.w / 2}" y2="${area.y + area.h}" stroke="${color}" stroke-width="0.3" opacity="0.5"/>`;
  return lines;
}

function svgPolarGrid(area: DrawArea, degSpacing: number, color: string): string {
  let lines = "";
  const { x, y, w, h } = area;
  const cx2 = x + w / 2, cy2 = y + h / 2;
  const maxR = Math.min(w, h) / 2 - 2;
  const ringCount = 8;
  // Concentric circles
  for (let i = 1; i <= ringCount; i++) {
    const r = (maxR / ringCount) * i;
    lines += `<circle cx="${cx2}" cy="${cy2}" r="${r}" fill="none" stroke="${color}" stroke-width="${i === ringCount ? 0.3 : 0.15}" opacity="0.4"/>`;
  }
  // Radial lines
  for (let deg = 0; deg < 360; deg += degSpacing) {
    const rad = (deg * Math.PI) / 180;
    const ex = cx2 + maxR * Math.cos(rad);
    const ey = cy2 + maxR * Math.sin(rad);
    lines += `<line x1="${cx2}" y1="${cy2}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="0.15" opacity="0.35"/>`;
  }
  // Centre dot
  lines += `<circle cx="${cx2}" cy="${cy2}" r="0.4" fill="${color}" opacity="0.5"/>`;
  return lines;
}

function svgSemiLog(area: DrawArea, decades: number, color: string): string {
  let lines = "";
  const { x, y, w, h } = area;
  const decadeH = h / decades;
  // Linear X axis (vertical lines every 5mm)
  for (let gx = 0; gx <= w; gx += 5) {
    lines += `<line x1="${x + gx}" y1="${y}" x2="${x + gx}" y2="${y + h}" stroke="${color}" stroke-width="0.15" opacity="0.3"/>`;
  }
  // Log Y axis
  for (let d = 0; d < decades; d++) {
    const dy = y + d * decadeH;
    for (let n = 1; n <= 10; n++) {
      const logPos = Math.log10(n) * decadeH;
      const ly = dy + decadeH - logPos;
      const isMajor = n === 1 || n === 10;
      lines += `<line x1="${x}" y1="${ly}" x2="${x + w}" y2="${ly}" stroke="${color}" stroke-width="${isMajor ? 0.35 : 0.12}" opacity="${isMajor ? 0.6 : 0.3}"/>`;
    }
  }
  return lines;
}

function svgLogLog(area: DrawArea, decades: number, color: string): string {
  let lines = "";
  const { x, y, w, h } = area;
  const decadeW = w / decades;
  const decadeH = h / decades;
  // Log X
  for (let d = 0; d < decades; d++) {
    const dx = x + d * decadeW;
    for (let n = 1; n <= 10; n++) {
      const logPos = Math.log10(n) * decadeW;
      const lx = dx + logPos;
      const isMajor = n === 1 || n === 10;
      lines += `<line x1="${lx}" y1="${y}" x2="${lx}" y2="${y + h}" stroke="${color}" stroke-width="${isMajor ? 0.35 : 0.12}" opacity="${isMajor ? 0.6 : 0.3}"/>`;
    }
  }
  // Log Y
  for (let d = 0; d < decades; d++) {
    const dy = y + d * decadeH;
    for (let n = 1; n <= 10; n++) {
      const logPos = Math.log10(n) * decadeH;
      const ly = dy + decadeH - logPos;
      const isMajor = n === 1 || n === 10;
      lines += `<line x1="${x}" y1="${ly}" x2="${x + w}" y2="${ly}" stroke="${color}" stroke-width="${isMajor ? 0.35 : 0.12}" opacity="${isMajor ? 0.6 : 0.3}"/>`;
    }
  }
  return lines;
}

function svgSurveyTable(area: DrawArea, headers: string[], color: string, rowH: number): string {
  let lines = "";
  const { x, y, w, h } = area;
  const colW = w / headers.length;
  // Header row
  lines += `<rect x="${x}" y="${y}" width="${w}" height="${rowH}" fill="${color}" opacity="0.08"/>`;
  headers.forEach((hdr, i) => {
    lines += `<line x1="${x + i * colW}" y1="${y}" x2="${x + i * colW}" y2="${y + h}" stroke="${color}" stroke-width="0.2" opacity="0.4"/>`;
    lines += `<text x="${x + i * colW + colW / 2}" y="${y + rowH * 0.7}" text-anchor="middle" font-size="1.8" fill="${color}" opacity="0.5" font-family="Helvetica">${hdr}</text>`;
  });
  // Right border
  lines += `<line x1="${x + w}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="${color}" stroke-width="0.2" opacity="0.4"/>`;
  // Horizontal rows
  for (let gy = 0; gy <= h; gy += rowH) {
    lines += `<line x1="${x}" y1="${y + gy}" x2="${x + w}" y2="${y + gy}" stroke="${color}" stroke-width="${gy === 0 || gy === rowH ? 0.3 : 0.12}" opacity="0.4"/>`;
  }
  return lines;
}

// ─── Master SVG renderer ─────────────────────────────────────────
function renderPreviewSVG(config: PaperConfig): string {
  const dims = PAGE_DIMS[config.pageSize][config.orientation];
  const margin = MARGINS[config.marginSize];
  const area: DrawArea = { x: margin, y: margin, w: dims.w - margin * 2, h: dims.h - margin * 2 };
  const tintBg = PAPER_TINT_COLORS[config.paperTint];
  const c = config.gridColor;

  let content = "";
  const info = getTypeById(config.typeId);
  const drawFn = info?.type.drawFn || "squareGrid";
  const sp = config.spacing;

  switch (drawFn) {
    case "squareGrid": content = svgSquareGrid(area, sp, c); break;
    case "dotGrid": content = svgDotGrid(area, sp, c); break;
    case "isometricGrid": content = svgIsometricGrid(area, sp, c); break;
    case "isometricDot": content = svgIsometricDot(area, sp, c); break;
    case "hexGrid": content = svgHexGrid(area, sp, c); break;
    case "lined": content = svgLined(area, sp, c); break;
    case "cornell": content = svgCornell(area, sp, c); break;
    case "gregg": content = svgGregg(area, sp, c); break;
    case "musicStaves": {
      const staffH = sp * 4;
      const staffGap = sp * 3;
      let my = area.y;
      while (my + staffH <= area.y + area.h) {
        for (let i = 0; i < 5; i++) {
          content += `<line x1="${area.x}" y1="${my + i * sp}" x2="${area.x + area.w}" y2="${my + i * sp}" stroke="${c}" stroke-width="0.15" opacity="0.4"/>`;
        }
        my += staffH + staffGap;
      }
      break;
    }
    case "sectionGrid": {
      const boldSp = config.typeId === "eng-2-10" ? 10 : config.typeId === "eng-5-10" ? 10 : 5;
      content = svgSectionGrid(area, sp, c, boldSp);
      break;
    }
    case "sectionGridTriple": content = svgSectionGrid(area, 1, c, 5, 10); break;
    case "sectionGridCustomBold": content = svgSectionGrid(area, 5, c, 25); break;
    case "computationPad": {
      // Header area
      content += `<line x1="${area.x}" y1="${area.y + 15}" x2="${area.x + area.w}" y2="${area.y + 15}" stroke="${c}" stroke-width="0.4" opacity="0.5"/>`;
      const gridArea = { ...area, y: area.y + 15, h: area.h - 15 };
      content += svgSectionGrid(gridArea, 5, c, 10);
      break;
    }
    case "crossSection": content = svgSectionGrid(area, 5, c, 10); break;
    case "semiLog": content = svgSemiLog(area, sp, c); break;
    case "logLog": content = svgLogLog(area, sp, c); break;
    case "normalProbability":
    case "weibullProbability":
    case "gumbelProbability":
      content = svgSquareGrid(area, 5, c); // Simplified preview
      content += `<text x="${area.x + area.w / 2}" y="${area.y + area.h / 2}" text-anchor="middle" font-size="3" fill="${c}" opacity="0.4" font-family="Helvetica">${drawFn.replace("Probability", " Probability").toUpperCase()}</text>`;
      break;
    case "smithChart": {
      const cx2 = area.x + area.w / 2, cy2 = area.y + area.h / 2;
      const r = Math.min(area.w, area.h) / 2 - 2;
      content += `<circle cx="${cx2}" cy="${cy2}" r="${r}" fill="none" stroke="${c}" stroke-width="0.3" opacity="0.5"/>`;
      content += `<line x1="${cx2 - r}" y1="${cy2}" x2="${cx2 + r}" y2="${cy2}" stroke="${c}" stroke-width="0.2" opacity="0.4"/>`;
      [0.2, 0.5, 1, 2, 5].forEach(rv => {
        const cr = r / (1 + rv);
        content += `<circle cx="${cx2 + r - cr}" cy="${cy2}" r="${cr}" fill="none" stroke="${c}" stroke-width="0.12" opacity="0.3"/>`;
      });
      break;
    }
    case "triangular": {
      const triSize = Math.min(area.w, area.h * 1.15) - 4;
      const triH = triSize * Math.sin(Math.PI / 3);
      const cx2 = area.x + area.w / 2;
      const by = area.y + area.h / 2 + triH / 3;
      const ax = cx2 - triSize / 2, bx = cx2 + triSize / 2;
      const ty = by - triH;
      content += `<polygon points="${ax},${by} ${bx},${by} ${cx2},${ty}" fill="none" stroke="${c}" stroke-width="0.3" opacity="0.5"/>`;
      const divs = 10;
      for (let i = 1; i < divs; i++) {
        const f = i / divs;
        content += `<line x1="${ax + f * (cx2 - ax)}" y1="${by + f * (ty - by)}" x2="${ax + f * (bx - ax)}" y2="${by}" stroke="${c}" stroke-width="0.1" opacity="0.25"/>`;
        content += `<line x1="${ax + f * (bx - ax)}" y1="${by}" x2="${bx + f * (cx2 - bx)}" y2="${by + f * (ty - by)}" stroke="${c}" stroke-width="0.1" opacity="0.25"/>`;
        content += `<line x1="${cx2 + f * (ax - cx2)}" y1="${ty + f * (by - ty)}" x2="${cx2 + f * (bx - cx2)}" y2="${ty + f * (by - ty)}" stroke="${c}" stroke-width="0.1" opacity="0.25"/>`;
      }
      break;
    }
    case "perspective1pt": {
      const vpx = area.x + area.w / 2, vpy = area.y + area.h * 0.4;
      content += `<circle cx="${vpx}" cy="${vpy}" r="0.5" fill="${c}" opacity="0.5"/>`;
      for (let i = 0; i <= 20; i++) {
        const ex = area.x + (area.w / 20) * i;
        content += `<line x1="${vpx}" y1="${vpy}" x2="${ex}" y2="${area.y + area.h}" stroke="${c}" stroke-width="0.12" opacity="0.25"/>`;
      }
      for (let i = 1; i < 10; i++) {
        const ly = vpy + ((area.y + area.h - vpy) / 10) * i;
        content += `<line x1="${area.x}" y1="${ly}" x2="${area.x + area.w}" y2="${ly}" stroke="${c}" stroke-width="0.12" opacity="0.25"/>`;
      }
      break;
    }
    case "perspective2pt": {
      const vpy2 = area.y + area.h * 0.45;
      const vp1x = area.x - area.w * 0.1, vp2x = area.x + area.w * 1.1;
      for (let i = 0; i <= 12; i++) {
        const ey = area.y + (area.h / 12) * i;
        content += `<line x1="${vp1x}" y1="${vpy2}" x2="${area.x + area.w}" y2="${ey}" stroke="${c}" stroke-width="0.1" opacity="0.2"/>`;
        content += `<line x1="${vp2x}" y1="${vpy2}" x2="${area.x}" y2="${ey}" stroke="${c}" stroke-width="0.1" opacity="0.2"/>`;
      }
      break;
    }
    case "polarGrid": content = svgPolarGrid(area, sp, c); break;
    case "compassRose": {
      let cr = svgPolarGrid(area, 15, c);
      const cx2 = area.x + area.w / 2, cy2 = area.y + area.h / 2;
      const r = Math.min(area.w, area.h) / 2 - 4;
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      dirs.forEach((d, i) => {
        const a = (i * 45 - 90) * Math.PI / 180;
        const tx = cx2 + (r + 3) * Math.cos(a), ty = cy2 + (r + 3) * Math.sin(a);
        cr += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="2.5" fill="${c}" opacity="0.5" font-weight="bold" font-family="Helvetica">${d}</text>`;
      });
      content = cr;
      break;
    }
    case "levelBook":
      content = svgSurveyTable(area, ["Stn", "BS", "IS", "FS", "HPC", "RL", "Dist", "Remarks"], c, 8);
      break;
    case "levelBookRiseFall":
      content = svgSurveyTable(area, ["Stn", "BS", "IS", "FS", "Rise", "Fall", "RL", "Dist", "Remarks"], c, 8);
      break;
    case "chainbook":
      content = svgSurveyTable(area, ["Ch.", "Offset L", "CL", "Offset R", "Remarks"], c, 5);
      break;
    case "traverseSheet":
      content = svgSurveyTable(area, ["Stn", "Angle", "Bearing", "Dist", "dE", "dN", "Easting", "Northing", "Remarks"], c, 8);
      break;
    case "settingOutRecord":
      content = svgSurveyTable(area, ["Pt", "Easting", "Northing", "Level", "Set By", "Checked", "Date", "Remarks"], c, 8);
      break;
    case "crossSectionSurvey":
      content = svgSectionGrid(area, 5, c, 10);
      break;
    default:
      content = svgSquareGrid(area, sp, c);
  }

  // Title block
  if (config.titleBlock === "corner") {
    const tbW = 60, tbH = 40;
    const tbx = area.x + area.w - tbW, tby = area.y + area.h - tbH;
    content += `<rect x="${tbx}" y="${tby}" width="${tbW}" height="${tbH}" fill="white" stroke="${c}" stroke-width="0.3" opacity="0.7"/>`;
    content += `<text x="${tbx + 2}" y="${tby + 4}" font-size="1.5" fill="${c}" opacity="0.4" font-family="Helvetica">TITLE BLOCK</text>`;
  } else if (config.titleBlock === "strip") {
    const stH = 12;
    const sty = area.y + area.h - stH;
    content += `<rect x="${area.x}" y="${sty}" width="${area.w}" height="${stH}" fill="white" stroke="${c}" stroke-width="0.3" opacity="0.7"/>`;
    content += `<text x="${area.x + 2}" y="${sty + 4}" font-size="1.5" fill="${c}" opacity="0.4" font-family="Helvetica">TITLE STRIP</text>`;
  }

  // Scale rulers
  if (config.scaleRuler === "left" || config.scaleRuler === "l-shape") {
    for (let i = 0; i <= area.h; i += 10) {
      content += `<line x1="${area.x - 2}" y1="${area.y + i}" x2="${area.x}" y2="${area.y + i}" stroke="#999" stroke-width="0.15"/>`;
      if (i % 50 === 0) content += `<text x="${area.x - 3}" y="${area.y + i + 0.5}" text-anchor="end" font-size="1.2" fill="#999" font-family="Helvetica">${i}</text>`;
    }
  }
  if (config.scaleRuler === "bottom" || config.scaleRuler === "l-shape") {
    for (let i = 0; i <= area.w; i += 10) {
      content += `<line x1="${area.x + i}" y1="${area.y + area.h}" x2="${area.x + i}" y2="${area.y + area.h + 2}" stroke="#999" stroke-width="0.15"/>`;
      if (i % 50 === 0) content += `<text x="${area.x + i}" y="${area.y + area.h + 4}" text-anchor="middle" font-size="1.2" fill="#999" font-family="Helvetica">${i}</text>`;
    }
  }

  // Ebrora watermark
  content += `<text x="${dims.w - 2}" y="${dims.h - 1}" text-anchor="end" font-size="1.5" fill="#D0D0D0" font-family="Helvetica">ebrora.com</text>`;

  // Border
  content += `<rect x="${area.x}" y="${area.y}" width="${area.w}" height="${area.h}" fill="none" stroke="#C0C0C0" stroke-width="0.2"/>`;

  return `<svg viewBox="0 0 ${dims.w} ${dims.h}" xmlns="http://www.w3.org/2000/svg" style="background:${tintBg};width:100%;height:auto;max-height:70vh;border:1px solid #E5E7EB;border-radius:8px;">${content}</svg>`;
}

// ─── PDF Generation ──────────────────────────────────────────────
async function generatePDF(config: PaperConfig) {
  const { default: jsPDF } = await import("jspdf");
  const dims = PAGE_DIMS[config.pageSize][config.orientation];
  const orient = config.orientation === "landscape" ? "l" : "p";
  const format = config.pageSize === "a4" ? "a4" : "a3";
  const doc = new jsPDF(orient, "mm", format);
  const margin = MARGINS[config.marginSize];
  const ax = margin, ay = margin, aw = dims.w - margin * 2, ah = dims.h - margin * 2;
  const c = config.gridColor;
  // Parse hex color
  const cr = parseInt(c.slice(1, 3), 16), cg = parseInt(c.slice(3, 5), 16), cb = parseInt(c.slice(5, 7), 16);
  const tintBg = PAPER_TINT_COLORS[config.paperTint];
  const tr = parseInt(tintBg.slice(1, 3), 16), tg = parseInt(tintBg.slice(3, 5), 16), tb = parseInt(tintBg.slice(5, 7), 16);

  const info = getTypeById(config.typeId);
  const drawFn = info?.type.drawFn || "squareGrid";
  const sp = config.spacing;

  function drawPage() {
    // Paper tint
    if (config.paperTint !== "white") {
      doc.setFillColor(tr, tg, tb);
      doc.rect(0, 0, dims.w, dims.h, "F");
    }

    // Draw grid based on type
    doc.setDrawColor(cr, cg, cb);

    switch (drawFn) {
      case "squareGrid": {
        doc.setLineWidth(0.15);
        for (let gx = ax; gx <= ax + aw; gx += sp) { doc.line(gx, ay, gx, ay + ah); }
        for (let gy = ay; gy <= ay + ah; gy += sp) { doc.line(ax, gy, ax + aw, gy); }
        break;
      }
      case "dotGrid": {
        doc.setFillColor(cr, cg, cb);
        for (let gx = ax; gx <= ax + aw; gx += sp) {
          for (let gy = ay; gy <= ay + ah; gy += sp) {
            doc.circle(gx, gy, 0.3, "F");
          }
        }
        break;
      }
      case "isometricGrid": {
        doc.setLineWidth(0.15);
        const rowH = sp * Math.sin(Math.PI / 3);
        for (let gy = ay; gy <= ay + ah; gy += rowH) { doc.line(ax, gy, ax + aw, gy); }
        for (let start = -ah; start <= aw + ah; start += sp) {
          doc.line(ax + start, ay + ah, ax + start + ah / Math.tan(Math.PI / 3), ay);
          doc.line(ax + start, ay, ax + start - ah / Math.tan(Math.PI / 3), ay + ah);
        }
        break;
      }
      case "isometricDot": {
        doc.setFillColor(cr, cg, cb);
        const rowH2 = sp * Math.sin(Math.PI / 3);
        let row2 = 0;
        for (let gy = ay; gy <= ay + ah; gy += rowH2) {
          const off = row2 % 2 === 1 ? sp / 2 : 0;
          for (let gx = ax + off; gx <= ax + aw; gx += sp) { doc.circle(gx, gy, 0.3, "F"); }
          row2++;
        }
        break;
      }
      case "hexGrid": {
        doc.setLineWidth(0.15);
        const colW = sp * 1.5;
        const hexH2 = sp * Math.sqrt(3);
        for (let col = 0; col * colW <= aw + sp; col++) {
          for (let row = 0; row * hexH2 <= ah + hexH2; row++) {
            const hcx = ax + col * colW;
            const hcy = ay + row * hexH2 + (col % 2 === 1 ? hexH2 / 2 : 0);
            const pts: [number, number][] = [];
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i - Math.PI / 6;
              pts.push([hcx + sp * Math.cos(angle), hcy + sp * Math.sin(angle)]);
            }
            for (let i = 0; i < 6; i++) {
              doc.line(pts[i][0], pts[i][1], pts[(i + 1) % 6][0], pts[(i + 1) % 6][1]);
            }
          }
        }
        break;
      }
      case "lined": {
        doc.setLineWidth(0.15);
        for (let gy = ay + sp; gy <= ay + ah; gy += sp) { doc.line(ax, gy, ax + aw, gy); }
        break;
      }
      case "cornell": {
        doc.setLineWidth(0.12);
        const cueW = aw * 0.3;
        const summH = ah * 0.15;
        for (let gy = ay + sp; gy <= ay + ah - summH; gy += sp) { doc.line(ax, gy, ax + aw, gy); }
        doc.setLineWidth(0.4);
        doc.line(ax + cueW, ay, ax + cueW, ay + ah - summH);
        doc.line(ax, ay + ah - summH, ax + aw, ay + ah - summH);
        break;
      }
      case "gregg": {
        doc.setLineWidth(0.15);
        for (let gy = ay + sp; gy <= ay + ah; gy += sp) { doc.line(ax, gy, ax + aw, gy); }
        doc.setLineWidth(0.35);
        doc.line(ax + aw / 2, ay, ax + aw / 2, ay + ah);
        break;
      }
      case "sectionGrid": {
        const boldSp2 = config.typeId === "eng-2-10" || config.typeId === "eng-5-10" ? 10 : 5;
        for (let gx = ax; gx <= ax + aw; gx += sp) {
          const bold = gx % boldSp2 === 0 || (gx - ax) % boldSp2 === 0;
          doc.setLineWidth(bold ? 0.35 : 0.1);
          doc.line(gx, ay, gx, ay + ah);
        }
        for (let gy = ay; gy <= ay + ah; gy += sp) {
          const bold = gy % boldSp2 === 0 || (gy - ay) % boldSp2 === 0;
          doc.setLineWidth(bold ? 0.35 : 0.1);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      case "sectionGridTriple": {
        for (let gx = ax; gx <= ax + aw; gx += 1) {
          const rel = Math.round((gx - ax) * 100) / 100;
          const heavy = Math.abs(rel % 10) < 0.01;
          const bold = !heavy && Math.abs(rel % 5) < 0.01;
          doc.setLineWidth(heavy ? 0.5 : bold ? 0.3 : 0.08);
          doc.line(gx, ay, gx, ay + ah);
        }
        for (let gy = ay; gy <= ay + ah; gy += 1) {
          const rel = Math.round((gy - ay) * 100) / 100;
          const heavy = Math.abs(rel % 10) < 0.01;
          const bold = !heavy && Math.abs(rel % 5) < 0.01;
          doc.setLineWidth(heavy ? 0.5 : bold ? 0.3 : 0.08);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      case "sectionGridCustomBold": {
        for (let gx = ax; gx <= ax + aw; gx += 5) {
          const bold = (gx - ax) % 25 === 0;
          doc.setLineWidth(bold ? 0.4 : 0.12);
          doc.line(gx, ay, gx, ay + ah);
        }
        for (let gy = ay; gy <= ay + ah; gy += 5) {
          const bold = (gy - ay) % 25 === 0;
          doc.setLineWidth(bold ? 0.4 : 0.12);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      case "polarGrid": {
        const pcx = ax + aw / 2, pcy = ay + ah / 2;
        const maxR = Math.min(aw, ah) / 2 - 2;
        const rings = 8;
        for (let i = 1; i <= rings; i++) {
          doc.setLineWidth(i === rings ? 0.3 : 0.15);
          doc.circle(pcx, pcy, (maxR / rings) * i);
        }
        doc.setLineWidth(0.15);
        for (let deg = 0; deg < 360; deg += sp) {
          const rad = (deg * Math.PI) / 180;
          doc.line(pcx, pcy, pcx + maxR * Math.cos(rad), pcy + maxR * Math.sin(rad));
        }
        break;
      }
      case "semiLog": {
        doc.setLineWidth(0.15);
        for (let gx = ax; gx <= ax + aw; gx += 5) { doc.line(gx, ay, gx, ay + ah); }
        const decH = ah / sp;
        for (let d = 0; d < sp; d++) {
          const dy = ay + d * decH;
          for (let n = 1; n <= 10; n++) {
            const lp = Math.log10(n) * decH;
            const ly = dy + decH - lp;
            doc.setLineWidth(n === 1 || n === 10 ? 0.35 : 0.1);
            doc.line(ax, ly, ax + aw, ly);
          }
        }
        break;
      }
      case "logLog": {
        const decW = aw / sp, decH = ah / sp;
        for (let d = 0; d < sp; d++) {
          const ddx = ax + d * decW;
          for (let n = 1; n <= 10; n++) {
            const lx = ddx + Math.log10(n) * decW;
            doc.setLineWidth(n === 1 || n === 10 ? 0.35 : 0.1);
            doc.line(lx, ay, lx, ay + ah);
          }
        }
        for (let d = 0; d < sp; d++) {
          const ddy = ay + d * decH;
          for (let n = 1; n <= 10; n++) {
            const ly = ddy + decH - Math.log10(n) * decH;
            doc.setLineWidth(n === 1 || n === 10 ? 0.35 : 0.1);
            doc.line(ax, ly, ax + aw, ly);
          }
        }
        break;
      }
      case "musicStaves": {
        doc.setLineWidth(0.15);
        const staffH2 = sp * 4;
        const staffGap2 = sp * 3;
        let my2 = ay;
        while (my2 + staffH2 <= ay + ah) {
          for (let i = 0; i < 5; i++) { doc.line(ax, my2 + i * sp, ax + aw, my2 + i * sp); }
          my2 += staffH2 + staffGap2;
        }
        break;
      }
      case "computationPad": {
        doc.setLineWidth(0.4); doc.line(ax, ay + 15, ax + aw, ay + 15);
        const cpAy = ay + 15;
        const cpAh = ah - 15;
        for (let gx = ax; gx <= ax + aw; gx += 5) {
          const bold3 = (gx - ax) % 10 === 0;
          doc.setLineWidth(bold3 ? 0.35 : 0.1);
          doc.line(gx, cpAy, gx, cpAy + cpAh);
        }
        for (let gy = cpAy; gy <= cpAy + cpAh; gy += 5) {
          const bold3 = (gy - cpAy) % 10 === 0;
          doc.setLineWidth(bold3 ? 0.35 : 0.1);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      case "crossSection":
      case "crossSectionSurvey": {
        for (let gx = ax; gx <= ax + aw; gx += 5) {
          const bold4 = (gx - ax) % 10 === 0;
          doc.setLineWidth(bold4 ? 0.35 : 0.1);
          doc.line(gx, ay, gx, ay + ah);
        }
        for (let gy = ay; gy <= ay + ah; gy += 5) {
          const bold4 = (gy - ay) % 10 === 0;
          doc.setLineWidth(bold4 ? 0.35 : 0.1);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      case "normalProbability":
      case "weibullProbability":
      case "gumbelProbability": {
        doc.setLineWidth(0.15);
        for (let gx = ax; gx <= ax + aw; gx += 5) { doc.line(gx, ay, gx, ay + ah); }
        for (let gy = ay; gy <= ay + ah; gy += 5) { doc.line(ax, gy, ax + aw, gy); }
        doc.setFontSize(6); doc.setTextColor(cr, cg, cb);
        doc.text(drawFn.replace("Probability", " Probability").toUpperCase(), ax + aw / 2, ay + ah / 2, { align: "center" });
        doc.setTextColor(0, 0, 0);
        break;
      }
      case "smithChart": {
        const scx = ax + aw / 2, scy = ay + ah / 2;
        const sr = Math.min(aw, ah) / 2 - 2;
        doc.setLineWidth(0.3); doc.circle(scx, scy, sr);
        doc.setLineWidth(0.2); doc.line(scx - sr, scy, scx + sr, scy);
        doc.setLineWidth(0.12);
        [0.2, 0.5, 1, 2, 5].forEach(rv => {
          const scr = sr / (1 + rv);
          doc.circle(scx + sr - scr, scy, scr);
        });
        break;
      }
      case "triangular": {
        const triSz = Math.min(aw, ah * 1.15) - 4;
        const triHt = triSz * Math.sin(Math.PI / 3);
        const tcx = ax + aw / 2;
        const tby = ay + ah / 2 + triHt / 3;
        const tax = tcx - triSz / 2, tbx = tcx + triSz / 2;
        const tty = tby - triHt;
        doc.setLineWidth(0.3);
        doc.line(tax, tby, tbx, tby); doc.line(tbx, tby, tcx, tty); doc.line(tcx, tty, tax, tby);
        doc.setLineWidth(0.1);
        const dv = 10;
        for (let i = 1; i < dv; i++) {
          const f = i / dv;
          doc.line(tax + f * (tcx - tax), tby + f * (tty - tby), tax + f * (tbx - tax), tby);
          doc.line(tax + f * (tbx - tax), tby, tbx + f * (tcx - tbx), tby + f * (tty - tby));
          doc.line(tcx + f * (tax - tcx), tty + f * (tby - tty), tcx + f * (tbx - tcx), tty + f * (tby - tty));
        }
        break;
      }
      case "perspective1pt": {
        const vpx = ax + aw / 2, vpy = ay + ah * 0.4;
        doc.setFillColor(cr, cg, cb); doc.circle(vpx, vpy, 0.5, "F");
        doc.setLineWidth(0.12);
        for (let i = 0; i <= 20; i++) { doc.line(vpx, vpy, ax + (aw / 20) * i, ay + ah); }
        for (let i = 1; i < 10; i++) { doc.line(ax, vpy + ((ay + ah - vpy) / 10) * i, ax + aw, vpy + ((ay + ah - vpy) / 10) * i); }
        break;
      }
      case "perspective2pt": {
        const vpy3 = ay + ah * 0.45;
        const vp1x2 = ax - aw * 0.1, vp2x2 = ax + aw * 1.1;
        doc.setLineWidth(0.1);
        for (let i = 0; i <= 12; i++) {
          const ey = ay + (ah / 12) * i;
          doc.line(vp1x2, vpy3, ax + aw, ey);
          doc.line(vp2x2, vpy3, ax, ey);
        }
        break;
      }
      case "compassRose": {
        const ccx = ax + aw / 2, ccy = ay + ah / 2;
        const cmr = Math.min(aw, ah) / 2 - 4;
        const rings2 = 8;
        for (let i = 1; i <= rings2; i++) {
          doc.setLineWidth(i === rings2 ? 0.3 : 0.15);
          doc.circle(ccx, ccy, (cmr / rings2) * i);
        }
        doc.setLineWidth(0.15);
        for (let deg = 0; deg < 360; deg += 15) {
          const rad2 = (deg * Math.PI) / 180;
          doc.line(ccx, ccy, ccx + cmr * Math.cos(rad2), ccy + cmr * Math.sin(rad2));
        }
        doc.setFontSize(4); doc.setTextColor(cr, cg, cb);
        const dirs2 = [["N",-90],["E",0],["S",90],["W",180]] as const;
        dirs2.forEach(([d, a]) => {
          const rad2 = (a * Math.PI) / 180;
          doc.text(d, ccx + (cmr + 4) * Math.cos(rad2), ccy + (cmr + 4) * Math.sin(rad2) + 1, { align: "center" });
        });
        doc.setTextColor(0, 0, 0);
        break;
      }
      case "levelBook": {
        const lbHeaders = ["Stn", "BS", "IS", "FS", "HPC", "RL", "Dist", "Remarks"];
        const lbColW = aw / lbHeaders.length;
        const lbRowH = 8;
        doc.setLineWidth(0.2);
        // Header
        doc.setFillColor(cr, cg, cb); doc.setDrawColor(cr, cg, cb);
        doc.rect(ax, ay, aw, lbRowH, "FD");
        doc.setTextColor(255, 255, 255); doc.setFontSize(5); doc.setFont("helvetica", "bold");
        lbHeaders.forEach((h, i) => { doc.text(h, ax + i * lbColW + lbColW / 2, ay + lbRowH * 0.7, { align: "center" }); });
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
        // Vertical lines
        doc.setDrawColor(cr, cg, cb); doc.setLineWidth(0.15);
        lbHeaders.forEach((_, i) => { doc.line(ax + i * lbColW, ay, ax + i * lbColW, ay + ah); });
        doc.line(ax + aw, ay, ax + aw, ay + ah);
        // Horizontal rows
        for (let gy = ay; gy <= ay + ah; gy += lbRowH) {
          doc.setLineWidth(gy === ay || gy === ay + lbRowH ? 0.25 : 0.1);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      case "levelBookRiseFall": {
        const lbrHeaders = ["Stn", "BS", "IS", "FS", "Rise", "Fall", "RL", "Dist", "Remarks"];
        const lbrColW = aw / lbrHeaders.length;
        const lbrRowH = 8;
        doc.setLineWidth(0.2);
        doc.setFillColor(cr, cg, cb); doc.setDrawColor(cr, cg, cb);
        doc.rect(ax, ay, aw, lbrRowH, "FD");
        doc.setTextColor(255, 255, 255); doc.setFontSize(5); doc.setFont("helvetica", "bold");
        lbrHeaders.forEach((h, i) => { doc.text(h, ax + i * lbrColW + lbrColW / 2, ay + lbrRowH * 0.7, { align: "center" }); });
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
        doc.setDrawColor(cr, cg, cb); doc.setLineWidth(0.15);
        lbrHeaders.forEach((_, i) => { doc.line(ax + i * lbrColW, ay, ax + i * lbrColW, ay + ah); });
        doc.line(ax + aw, ay, ax + aw, ay + ah);
        for (let gy = ay; gy <= ay + ah; gy += lbrRowH) {
          doc.setLineWidth(gy === ay || gy === ay + lbrRowH ? 0.25 : 0.1);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      case "chainbook": {
        const cbHeaders = ["Ch.", "Offset L", "CL", "Offset R", "Remarks"];
        const cbColW2 = aw / cbHeaders.length;
        const cbRowH = 5;
        doc.setLineWidth(0.2);
        doc.setFillColor(cr, cg, cb); doc.setDrawColor(cr, cg, cb);
        doc.rect(ax, ay, aw, cbRowH + 2, "FD");
        doc.setTextColor(255, 255, 255); doc.setFontSize(5); doc.setFont("helvetica", "bold");
        cbHeaders.forEach((h, i) => { doc.text(h, ax + i * cbColW2 + cbColW2 / 2, ay + (cbRowH + 2) * 0.7, { align: "center" }); });
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
        doc.setDrawColor(cr, cg, cb); doc.setLineWidth(0.15);
        cbHeaders.forEach((_, i) => { doc.line(ax + i * cbColW2, ay, ax + i * cbColW2, ay + ah); });
        doc.line(ax + aw, ay, ax + aw, ay + ah);
        for (let gy = ay; gy <= ay + ah; gy += cbRowH) { doc.setLineWidth(0.1); doc.line(ax, gy, ax + aw, gy); }
        break;
      }
      case "traverseSheet": {
        const trHeaders = ["Stn", "Angle", "Bearing", "Dist", "dE", "dN", "Easting", "Northing", "Remarks"];
        const trColW = aw / trHeaders.length;
        const trRowH = 8;
        doc.setLineWidth(0.2);
        doc.setFillColor(cr, cg, cb); doc.setDrawColor(cr, cg, cb);
        doc.rect(ax, ay, aw, trRowH, "FD");
        doc.setTextColor(255, 255, 255); doc.setFontSize(4.5); doc.setFont("helvetica", "bold");
        trHeaders.forEach((h, i) => { doc.text(h, ax + i * trColW + trColW / 2, ay + trRowH * 0.7, { align: "center" }); });
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
        doc.setDrawColor(cr, cg, cb); doc.setLineWidth(0.15);
        trHeaders.forEach((_, i) => { doc.line(ax + i * trColW, ay, ax + i * trColW, ay + ah); });
        doc.line(ax + aw, ay, ax + aw, ay + ah);
        for (let gy = ay; gy <= ay + ah; gy += trRowH) {
          doc.setLineWidth(gy === ay || gy === ay + trRowH ? 0.25 : 0.1);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      case "settingOutRecord": {
        const soHeaders = ["Pt", "Easting", "Northing", "Level", "Set By", "Checked", "Date", "Remarks"];
        const soColW = aw / soHeaders.length;
        const soRowH2 = 8;
        doc.setLineWidth(0.2);
        doc.setFillColor(cr, cg, cb); doc.setDrawColor(cr, cg, cb);
        doc.rect(ax, ay, aw, soRowH2, "FD");
        doc.setTextColor(255, 255, 255); doc.setFontSize(4.5); doc.setFont("helvetica", "bold");
        soHeaders.forEach((h, i) => { doc.text(h, ax + i * soColW + soColW / 2, ay + soRowH2 * 0.7, { align: "center" }); });
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
        doc.setDrawColor(cr, cg, cb); doc.setLineWidth(0.15);
        soHeaders.forEach((_, i) => { doc.line(ax + i * soColW, ay, ax + i * soColW, ay + ah); });
        doc.line(ax + aw, ay, ax + aw, ay + ah);
        for (let gy = ay; gy <= ay + ah; gy += soRowH2) {
          doc.setLineWidth(gy === ay || gy === ay + soRowH2 ? 0.25 : 0.1);
          doc.line(ax, gy, ax + aw, gy);
        }
        break;
      }
      default: {
        // Fallback: square grid
        doc.setLineWidth(0.15);
        for (let gx = ax; gx <= ax + aw; gx += sp) { doc.line(gx, ay, gx, ay + ah); }
        for (let gy = ay; gy <= ay + ah; gy += sp) { doc.line(ax, gy, ax + aw, gy); }
      }
    }

    // Title block
    doc.setDrawColor(cr, cg, cb); doc.setLineWidth(0.3);
    if (config.titleBlock === "corner") {
      const tbW2 = 60, tbH2 = 40;
      const tbx2 = ax + aw - tbW2, tby2 = ay + ah - tbH2;
      doc.setFillColor(255, 255, 255);
      doc.rect(tbx2, tby2, tbW2, tbH2, "FD");
      // Inner field lines
      doc.setLineWidth(0.15); doc.setFontSize(4.5); doc.setTextColor(cr, cg, cb);
      const tbFields = ["Project:", "Drawing Title:", "Drawn By:", "Checked By:", "Date:", "Scale:", "Revision:", "Sheet No:"];
      const fieldH = tbH2 / tbFields.length;
      tbFields.forEach((f, i) => {
        const fy = tby2 + i * fieldH;
        doc.line(tbx2, fy, tbx2 + tbW2, fy);
        doc.setFont("helvetica", "bold"); doc.text(f, tbx2 + 1.5, fy + fieldH * 0.65);
      });
      doc.setTextColor(0, 0, 0);
    } else if (config.titleBlock === "strip") {
      const stH2 = 12;
      const sty2 = ay + ah - stH2;
      doc.setFillColor(255, 255, 255);
      doc.rect(ax, sty2, aw, stH2, "FD");
      doc.setLineWidth(0.15); doc.setFontSize(4.5); doc.setTextColor(cr, cg, cb);
      const stripFields = ["Project:", "Title:", "Drawn:", "Checked:", "Date:", "Scale:", "Rev:", "Sheet:"];
      const sfW = aw / stripFields.length;
      stripFields.forEach((f, i) => {
        doc.line(ax + i * sfW, sty2, ax + i * sfW, sty2 + stH2);
        doc.setFont("helvetica", "bold"); doc.text(f, ax + i * sfW + 1, sty2 + 4);
      });
      doc.setTextColor(0, 0, 0);
    }

    // Scale rulers
    doc.setDrawColor(150, 150, 150); doc.setLineWidth(0.1);
    doc.setFontSize(3); doc.setTextColor(150, 150, 150);
    if (config.scaleRuler === "left" || config.scaleRuler === "l-shape") {
      for (let i = 0; i <= ah; i += 10) {
        const isMajor = i % 50 === 0;
        doc.setLineWidth(isMajor ? 0.15 : 0.08);
        doc.line(ax - (isMajor ? 2.5 : 1.5), ay + i, ax, ay + i);
        if (isMajor) doc.text(String(i), ax - 3, ay + i + 0.8, { align: "right" });
      }
    }
    if (config.scaleRuler === "bottom" || config.scaleRuler === "l-shape") {
      for (let i = 0; i <= aw; i += 10) {
        const isMajor = i % 50 === 0;
        doc.setLineWidth(isMajor ? 0.15 : 0.08);
        doc.line(ax + i, ay + ah, ax + i, ay + ah + (isMajor ? 2.5 : 1.5));
        if (isMajor) doc.text(String(i), ax + i, ay + ah + 4, { align: "center" });
      }
    }
    doc.setTextColor(0, 0, 0);

    // Border
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.2);
    doc.rect(ax, ay, aw, ah);

    // Ebrora watermark
    doc.setFontSize(4); doc.setTextColor(210, 210, 210);
    doc.text("ebrora.com", dims.w - margin - 1, dims.h - 1, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  // Generate pages
  for (let p = 0; p < config.pageCount; p++) {
    if (p > 0) doc.addPage(format, orient);
    drawPage();
  }

  const typeName = info?.type.name.replace(/\s+/g, "-").toLowerCase() || "paper";
  doc.save(`ebrora-${typeName}-${config.pageSize}-${config.orientation}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────
export default function PrintablePaperClient() {
  const [config, setConfig] = useState<PaperConfig>(defaultConfig());
  const [activeCategory, setActiveCategory] = useState<PaperCategoryId>("square-grid");
  const [generating, setGenerating] = useState(false);

  const activeCat = useMemo(() => PAPER_CATEGORIES.find(c => c.id === activeCategory)!, [activeCategory]);
  const activeType = useMemo(() => getTypeById(config.typeId), [config.typeId]);

  const previewSVG = useMemo(() => renderPreviewSVG(config), [config]);

  const updateConfig = useCallback((partial: Partial<PaperConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const handleCategoryChange = useCallback((catId: PaperCategoryId) => {
    setActiveCategory(catId);
    const cat = PAPER_CATEGORIES.find(c => c.id === catId)!;
    const firstType = cat.types[0];
    setConfig(prev => ({
      ...prev,
      categoryId: catId,
      typeId: firstType.id,
      spacing: firstType.defaultSpacing,
    }));
  }, []);

  const handleTypeChange = useCallback((typeId: string) => {
    const info2 = getTypeById(typeId);
    if (!info2) return;
    setConfig(prev => ({
      ...prev,
      typeId,
      spacing: info2.type.defaultSpacing,
    }));
  }, []);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try { await generatePDF(config); }
    finally { setGenerating(false); }
  }, [config]);

  return (
    <div className="space-y-8">
      {/* ── Category Tabs ─────────────────────────────────── */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1.5 min-w-max">
          {PAPER_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? "bg-ebrora text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Options (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Paper type selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">{activeCat.label}</h3>
            <p className="text-[11px] text-gray-400 mb-3">{activeCat.description}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {activeCat.types.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className={`text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    config.typeId === t.id
                      ? "bg-ebrora-light border-ebrora/30 border text-ebrora font-medium"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom spacing */}
          {activeType?.type.allowCustomSpacing && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Custom Spacing (mm)</label>
              <input
                type="number" value={config.spacing} min={activeType.type.minSpacing} max={activeType.type.maxSpacing} step={0.5}
                onChange={e => updateConfig({ spacing: Math.max(activeType.type.minSpacing, Math.min(activeType.type.maxSpacing, parseFloat(e.target.value) || 5)) })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none"
              />
            </div>
          )}

          {/* Page options */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Page Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Size</label>
                <select value={config.pageSize} onChange={e => updateConfig({ pageSize: e.target.value as PageSize })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  <option value="a4">A4 (210 x 297mm)</option>
                  <option value="a3">A3 (297 x 420mm)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Orientation</label>
                <select value={config.orientation} onChange={e => updateConfig({ orientation: e.target.value as Orientation })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Margins</label>
                <select value={config.marginSize} onChange={e => updateConfig({ marginSize: e.target.value as MarginSize })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  <option value="none">None (3mm)</option>
                  <option value="narrow">Narrow (5mm)</option>
                  <option value="standard">Standard (10mm)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pages</label>
                <select value={config.pageCount} onChange={e => updateConfig({ pageCount: parseInt(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  {PAGE_COUNT_OPTIONS.map(n => <option key={n} value={n}>{n} {n === 1 ? "page" : "pages"}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Colour options */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Colours</h3>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Grid Colour</label>
              <div className="flex flex-wrap gap-1.5">
                {GRID_COLOR_PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => updateConfig({ gridColor: p.value })}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${config.gridColor === p.value ? "border-gray-800 scale-110" : "border-gray-200"}`}
                    style={{ backgroundColor: p.value }}
                    title={p.label}
                  />
                ))}
                <input
                  type="color" value={config.gridColor}
                  onChange={e => updateConfig({ gridColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer"
                  title="Custom colour"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Paper Tint</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(PAPER_TINT_COLORS) as PaperTint[]).map(t => (
                  <button
                    key={t}
                    onClick={() => updateConfig({ paperTint: t })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                      config.paperTint === t ? "border-gray-800 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <span className="inline-block w-3 h-3 rounded mr-1 border border-gray-200" style={{ backgroundColor: PAPER_TINT_COLORS[t] }} />
                    {PAPER_TINT_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Extras */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Extras</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Title Block</label>
                <select value={config.titleBlock} onChange={e => updateConfig({ titleBlock: e.target.value as TitleBlockStyle })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  <option value="none">None</option>
                  <option value="corner">Corner (BS 5457)</option>
                  <option value="strip">Full-Width Strip</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Scale Rulers</label>
                <select value={config.scaleRuler} onChange={e => updateConfig({ scaleRuler: e.target.value as ScaleRulerPosition })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none">
                  <option value="none">None</option>
                  <option value="left">Left Edge</option>
                  <option value="bottom">Bottom Edge</option>
                  <option value="l-shape">L-Shape (Left + Bottom)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={generating}
            className="w-full py-3 rounded-xl bg-ebrora text-white font-bold text-sm hover:bg-ebrora-dark transition-colors disabled:opacity-50"
          >
            {generating ? "Generating PDF..." : `Download PDF (${config.pageCount} ${config.pageCount === 1 ? "page" : "pages"})`}
          </button>

          {/* Print guide */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-bold text-amber-800 mb-1">How to Print at Correct Scale</div>
            <div className="text-[11px] text-amber-700 leading-relaxed space-y-1">
              <div>1. Open the downloaded PDF</div>
              <div>2. In print settings, set Scale to <strong>100%</strong> or <strong>Actual Size</strong></div>
              <div>3. Set margins to <strong>None</strong> or <strong>Minimum</strong></div>
              <div>4. Ensure <strong>Fit to Page</strong> is NOT selected</div>
              <div>5. Print on {config.pageSize.toUpperCase()} paper</div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview (3 cols) */}
        <div className="lg:col-span-3">
          <div className="sticky top-20">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-700">Live Preview</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{activeType?.type.name} | {config.pageSize.toUpperCase()} {config.orientation} | {MARGINS[config.marginSize]}mm margins</p>
                </div>
                <span className="text-[10px] text-gray-400">{totalVariationCount().toLocaleString()}+ variations</span>
              </div>
              <div className="p-4" dangerouslySetInnerHTML={{ __html: previewSVG }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQ_ITEMS.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">{faq.q}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── COSHH Upsell ─────────────────────────────────── */}
      <div className="mt-12 bg-[#faf9f7] border border-[#e0ddd7] rounded-2xl p-8 sm:p-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1B5745] rounded-full text-[11px] font-bold text-white uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5de8b5] animate-pulse" />
            Now live
          </span>
          <h3 className="font-extrabold text-gray-900 leading-tight" style={{ fontSize: "24px" }}>Create a professional COSHH assessment for any product in 2 minutes</h3>
          <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
            Generate fully compliant COSHH assessments with hazard identification, exposure controls, PPE requirements, emergency procedures, and health surveillance recommendations. Instant Word document download.
          </p>
          <a
            href="/coshh-builder"
            className="inline-flex items-center gap-2 px-7 py-3 bg-[#1B5745] text-white text-sm font-bold rounded-xl hover:bg-[#164a3b] transition-colors"
          >
            Try COSHH Builder
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Free printable paper for construction professionals, engineers, surveyors, and project managers.
          All papers print at exact scale when printed at 100% with no margins. No sign-up required.
        </p>
        <a href="/tools" className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
