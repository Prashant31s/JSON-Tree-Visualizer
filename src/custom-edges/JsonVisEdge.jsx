import { BaseEdge, getBezierPath } from 'reactflow';

function JsonVisEdge(props) {
  const {
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition, targetPosition,
    markerEnd, style,
  } = props;

  const [edgePath] = getBezierPath({
    sourceX, sourceY,
    sourcePosition, targetPosition,
    targetX, targetY,
  });

  // Merge incoming style (highlighted, etc.) with base defaults
  const edgeStyle = {
    stroke: '#4b5563',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    ...style,
  };

  return (
    <>
      {/* Glow under-layer for a soft depth effect */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: edgeStyle.stroke,
          strokeWidth: edgeStyle.strokeWidth + 4,
          opacity: 0.12,
          strokeLinecap: 'round',
        }}
      />
      {/* Main edge line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
    </>
  );
}

export default JsonVisEdge;