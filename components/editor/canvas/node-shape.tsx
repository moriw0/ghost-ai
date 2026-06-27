interface NodeShapeProps {
  shape: string;
  width: number;
  height: number;
  fill: string;
  stroke: string;
}

export function NodeShape({ shape, width: W, height: H, fill, stroke }: NodeShapeProps) {
  if (shape === "diamond") {
    return (
      <svg className="absolute inset-0" width={W} height={H} style={{ display: "block" }}>
        <polygon
          points={`${W / 2},1 ${W - 1},${H / 2} ${W / 2},${H - 1} 1,${H / 2}`}
          fill={fill}
          stroke={stroke}
          strokeWidth="1"
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    const points = [
      `${W / 2},1`,
      `${W - 1},${H * 0.25}`,
      `${W - 1},${H * 0.75}`,
      `${W / 2},${H - 1}`,
      `1,${H * 0.75}`,
      `1,${H * 0.25}`,
    ].join(" ");
    return (
      <svg className="absolute inset-0" width={W} height={H} style={{ display: "block" }}>
        <polygon points={points} fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }

  if (shape === "cylinder") {
    const rx = (W - 2) / 2;
    const ry = Math.max(8, H * 0.15);
    return (
      <svg className="absolute inset-0" width={W} height={H} style={{ display: "block" }}>
        {/* Bottom cap — drawn first so the body rect covers its upper half */}
        <ellipse cx={W / 2} cy={H - ry} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth="1" />
        {/* Body — fill only, no stroke so it doesn't overdraw the ellipses */}
        <rect x="1" y={ry} width={W - 2} height={H - 2 * ry} fill={fill} stroke="none" />
        {/* Side borders */}
        <line x1="1" y1={ry} x2="1" y2={H - ry} stroke={stroke} strokeWidth="1" />
        <line x1={W - 1} y1={ry} x2={W - 1} y2={H - ry} stroke={stroke} strokeWidth="1" />
        {/* Top cap — drawn last so it sits on top of the body */}
        <ellipse cx={W / 2} cy={ry} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }

  const borderRadius =
    shape === "pill" ? "9999px" : shape === "circle" ? "50%" : "8px";

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: fill,
        border: `1px solid ${stroke}`,
        borderRadius,
      }}
    />
  );
}
