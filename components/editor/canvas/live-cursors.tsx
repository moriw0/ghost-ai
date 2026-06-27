"use client";

import { useOthers } from "@liveblocks/react";
import { ViewportPortal } from "@xyflow/react";

export function LiveCursors() {
  const others = useOthers();

  const othersWithCursors = others.filter(
    (other) => other.presence.cursor !== null
  );

  if (othersWithCursors.length === 0) return null;

  return (
    <ViewportPortal>
      {othersWithCursors.map((other) => {
        const cursor = other.presence.cursor!;
        return (
          <div
            key={other.connectionId}
            className="pointer-events-none absolute"
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            <CursorPointer color={other.info.color} />
            <div
              className="absolute left-3 top-4 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: other.info.color }}
            >
              {other.info.name}
            </div>
          </div>
        );
      })}
    </ViewportPortal>
  );
}

function CursorPointer({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 0 L0 16 L4.5 11.5 L7 19 L9.5 18 L7 10.5 L12.5 10.5 Z"
        fill={color}
        stroke="white"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
