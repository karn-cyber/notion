import React from "react";

// SVG Loading Spinner React component
// Props:
//  - size: number (px) or string (e.g. "48")
//  - color: CSS color string (defaults to currentColor so text color controls it)
//  - speed: rotation speed multiplier (1 = normal, 2 = twice as fast)
//  - className: extra wrapper classes (Tailwind friendly)
//  - ariaLabel: accessible label

export default function LoadingSpinner({
  size = 40,
  color = "currentColor",
  speed = 1,
  className = "",
  ariaLabel = "Loading",
}) {
  const px = typeof size === "number" ? size : parseInt(size, 10) || 40;
  const duration = (1 / Math.max(0.1, speed)).toFixed(3) + "s"; // shorter = faster

  // We build a small CSS block so the spinner rotates smoothly.
  // Using inline <style> so this component is self-contained.
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`inline-block align-middle ${className}`}
      style={{ width: px, height: px }}
    >
      <style>{`
        @keyframes cg-spinner-rotate { 100% { transform: rotate(360deg); } }
        @keyframes cg-spinner-dash { 0% { stroke-dashoffset: 0; } 50% { stroke-dashoffset: 60; } 100% { stroke-dashoffset: 0; } }
      `}</style>

      <svg
        viewBox="0 0 50 50"
        width={px}
        height={px}
        style={{ display: "block", animation: `cg-spinner-rotate ${duration} linear infinite` }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* subtle faded circle as background */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeOpacity="0.13"
          strokeWidth="4"
        />

        {/* animated arc */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="90"
          strokeDashoffset="0"
          style={{
            transformOrigin: "50% 50%",
            animation: `cg-spinner-dash ${duration} ease-in-out infinite`,
          }}
        />
      </svg>
    </span>
  );
}

/*
Usage examples:

import Spinner from './Spinner';

// Default
<Spinner />

// Custom size / color / speed
<Spinner size={64} color="#2563EB" speed={1.6} />

// Use with Tailwind to center on a page
<div className="flex items-center justify-center h-40">
  <Spinner size={56} className="text-indigo-600" />
</div>
*/
