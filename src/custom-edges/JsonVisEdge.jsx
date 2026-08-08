import { getBezierPath, BaseEdge } from 'reactflow';

function JsonVisEdge(props) {
  const {
    id,
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition, targetPosition,
    markerEnd, style,
  } = props;

  const gradientId = `grad-${id}`;
  const filterId    = `glow-${id}`;
  const markerId    = `arrowhead-${id}`;

  const [edgePath] = getBezierPath({
    sourceX, sourceY,
    sourcePosition, targetPosition,
    targetX, targetY,
  });

  const isHighlighted = style?.stroke === '#f87171';
  const strokeColor   = style?.stroke || '#64748b';
  const strokeWidth   = style?.strokeWidth || 1.6;
  const glowWidth     = strokeWidth * 5;
  const glowOpacity   = isHighlighted ? 0.45 : 0.22;

  return (
    <>
      {/* ── inline SVG defs injected into ReactFlow's SVG context ── */}
      <defs>
        {/* Gradient fades from transparent at source → full color at target */}
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX} y1={sourceY}
          x2={targetX} y2={targetY}
        >
          <stop offset="0%"   stopColor={strokeColor} stopOpacity="0.15" />
          <stop offset="40%"  stopColor={strokeColor} stopOpacity="0.7"  />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="1"    />
        </linearGradient>

        {/* Soft blur glow filter */}
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={isHighlighted ? 3 : 2} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Custom arrowhead marker — sharper, color-matched */}
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points="0 0, 10 4, 0 8"
            fill={strokeColor}
            opacity={isHighlighted ? 1 : 0.85}
          />
        </marker>
      </defs>

      {/* ── Glow halo under-layer ── */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={glowWidth}
        strokeLinecap="round"
        opacity={glowOpacity}
        style={{ filter: `url(#${filterId})` }}
      />

      {/* ── Main edge path with gradient ── */}
      <path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        style={isHighlighted ? {
          animation: 'edgePulse 1.4s ease-in-out infinite',
        } : undefined}
      />

      {/* ── Small dot at source ── */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={isHighlighted ? 4 : 2.5}
        fill={strokeColor}
        opacity={isHighlighted ? 0.9 : 0.5}
      />
    </>
  );
}

export default JsonVisEdge;