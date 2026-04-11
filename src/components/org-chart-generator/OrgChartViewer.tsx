// src/components/org-chart-generator/OrgChartViewer.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  renderOrgChartSvg,
  DEFAULT_SETTINGS,
  type Person,
  type ChartSettings,
} from "./orgChartRenderer";

export default function OrgChartViewer({ shareId }: { shareId: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [settings, setSettings] = useState<ChartSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/org-chart/public?id=${shareId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Chart not found");
          setLoading(false);
          return;
        }
        const { chartData } = await res.json();
        if (chartData?.people) setPeople(chartData.people);
        if (chartData?.settings) {
          const saved = chartData.settings;
          setSettings({
            ...DEFAULT_SETTINGS,
            ...saved,
            visibleFields: { ...DEFAULT_SETTINGS.visibleFields, ...(saved.visibleFields || {}) },
          });
        }
      } catch {
        setError("Failed to load chart");
      }
      setLoading(false);
    })();
  }, [shareId]);

  const { svgContent, svgWidth, svgHeight } = useMemo(
    () => renderOrgChartSvg(people, settings, null),
    [people, settings]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Non-passive wheel listener for zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0.2, Math.min(3, z - e.deltaY * 0.001)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setPan((p) => ({
      x: p.x + e.clientX - lastMouse.current.x,
      y: p.y + e.clientY - lastMouse.current.y,
    }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-xl h-[600px]" />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-sm text-red-400 mt-1">
          This chart may have expired or been deleted.
        </p>
        <a
          href="/tools/org-chart-generator"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Create Your Own
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 text-sm">
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="px-2 py-1 bg-white border rounded">+</button>
        <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))} className="px-2 py-1 bg-white border rounded">−</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-2 py-1 text-xs bg-white border rounded">Reset</button>
      </div>

      <div
        ref={containerRef}
        className="bg-white border border-gray-200 rounded-xl overflow-hidden relative"
        style={{ minHeight: 500, cursor: isPanning.current ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {people.length === 0 ? (
          <div className="flex items-center justify-center h-[500px] text-gray-400 text-sm">
            <p>This chart has no data.</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width={svgWidth}
            height={svgHeight}
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}

        <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
          Scroll to zoom · Drag to pan
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Built with{" "}
        <a href="/tools/org-chart-generator" className="text-blue-600 hover:underline">
          Ebrora Org Chart Generator
        </a>
      </p>
    </div>
  );
}
