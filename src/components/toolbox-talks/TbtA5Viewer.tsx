"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// A4 dimensions at 96 DPI (the native size the HTML templates are designed for)
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

interface TbtA5ViewerProps {
  htmlFile: string;
  title: string;
}

export function TbtA5Viewer({ htmlFile, title }: TbtA5ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.35);
  const [loaded, setLoaded] = useState(false);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    setScale(containerWidth / A4_WIDTH);
  }, []);

  useEffect(() => {
    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateScale]);

  const scaledHeight = A4_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className="relative bg-white rounded-lg shadow-md overflow-hidden"
      style={{ height: `${scaledHeight}px` }}
    >
      {/* Loading spinner - hidden once iframe loads */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#1B5745] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Loading toolbox talk…</p>
          </div>
        </div>
      )}

      {/* Iframe rendered at full A4 size, then CSS-scaled down to fit */}
      <iframe
        ref={iframeRef}
        src={`/toolbox-talks/${htmlFile}`}
        title={title}
        loading="lazy"
        scrolling="no"
        onLoad={() => setLoaded(true)}
        className="border-0 origin-top-left"
        style={{
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
