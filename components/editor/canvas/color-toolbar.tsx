"use client";

import { memo, useState } from "react";
import { NODE_COLORS, type NodeColor } from "@/types/canvas";

interface ColorSwatchProps {
  color: NodeColor;
  isActive: boolean;
  onSelect: (color: NodeColor) => void;
}

const ColorSwatch = memo(function ColorSwatch({ color, isActive, onSelect }: ColorSwatchProps) {
  const [hovered, setHovered] = useState(false);

  const boxShadow = isActive
    ? `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${color.text}`
    : hovered
      ? `0 0 5px 2px ${color.text}55`
      : undefined;

  return (
    <button
      className="w-5 h-5 rounded-full transition-transform duration-100 hover:scale-110"
      style={{ backgroundColor: color.fill, boxShadow }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(color);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
});

interface ColorToolbarProps {
  activeFill: string;
  onSelect: (color: NodeColor) => void;
}

export const ColorToolbar = memo(function ColorToolbar({ activeFill, onSelect }: ColorToolbarProps) {
  return (
    <div
      className="nodrag nopan absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
      style={{
        bottom: "calc(100% + 10px)",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-default)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
        zIndex: 50,
        whiteSpace: "nowrap",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {NODE_COLORS.map((color) => (
        <ColorSwatch
          key={color.fill}
          color={color}
          isActive={color.fill === activeFill}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
});
