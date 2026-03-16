"use client";

import { useRef, useEffect, useState } from "react";

interface TbtA4ViewerProps {
  htmlFile: string;
  title: string;
}

export function TbtA4Viewer({ htmlFile, title }: TbtA4ViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [htmlFile]);

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden" style={{ aspectRatio: "210 / 297" }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#1B5745] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Loading toolbox talk&hellip;</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`/toolbox-talks/${htmlFile}`}
        title={title}
        className="w-full h-full border-0"
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
    </div>
  );
}
