import { BaseEdge, getBezierPath } from 'reactflow';

function JsonVisEdge(props) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style } = props;
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{ strokeWidth: 2, stroke: '#94a3b8', ...style }}
      {...props}
    />
  );
}

export default JsonVisEdge;