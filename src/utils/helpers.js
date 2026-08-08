import { useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  Panel,
  MiniMap,
} from "reactflow";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export  const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  viewport: state.viewport,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  setViewport: state.setViewport,
  needToRenderJson: state.needToRenderJson,
  treeData: state.treeData,
  setTreeData: state.setTreeData,
  searchPath: state.searchPath,
  setSearchPath: state.setSearchPath,
  highlightedNodeIds: state.highlightedNodeIds,
  setHighlightedNodeIds: state.setHighlightedNodeIds,
  searchResults: state.searchResults,
  setSearchResults: state.setSearchResults,
});

export  const getLayoutedElements = (nodes, edges, options = {}) => {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";

  const graph = {
    id: "root",
    layoutOptions: options,
    children: nodes.map((node) => ({
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      width: 150,
      height: 50,
    })),
    edges,
  };

  return elk
    .layout(graph)
    .then((layoutedGraph) => ({
      nodes: layoutedGraph.children.map((node) => ({
        ...node,
        position: { x: node.x, y: node.y },
      })),
      edges: layoutedGraph.edges,
    }))
    .catch(console.error);
};

export function InnerFlow(props) {
  const { fitView, getViewport, setViewport, getNodes } = useReactFlow();
  const {
    nodes,
    edges,
    lastSearchResult,
    setReactFlowHelpers,
  } = props;

  useEffect(() => {
    if (!lastSearchResult && nodes.length > 0) {
      window.requestAnimationFrame(() => {
        fitView({
          nodes: nodes.map((node) => ({ id: node.id })),
          minZoom: 0.02,
          maxZoom: 1,
          padding: 0.2,
          duration: 300,
        });
      });
    }
  }, [nodes, edges, fitView, lastSearchResult]);

  useEffect(() => {
    if (lastSearchResult) {
      setTimeout(() => {
        fitView({
          nodes: lastSearchResult.nodes.map((node) => ({ id: node.id })),
          duration: 800,
          minZoom: 0.02,
          maxZoom: 1.5,
          padding: 0.4,
        });
      }, 100);
    }
  }, [lastSearchResult, fitView]);

  useEffect(() => {
    setReactFlowHelpers?.({ fitView, getViewport, setViewport, getNodes });
  }, [setReactFlowHelpers, fitView, getViewport, setViewport, getNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={props.nodeTypes}
      edgeTypes={props.edgeTypes}
      defaultEdgeOptions={props.defaultEdgeOptions}
      onNodesChange={props.onNodesChange}
      onEdgesChange={props.onEdgesChange}
      minZoom={0.02}
      maxZoom={1.5}
    >
      <Background gap={30} color="#373737" variant={BackgroundVariant.Lines} />
      <MiniMap
        className="json-minimap"
        nodeColor={(node) => node.data?.color || "#3b82f6"}
        nodeStrokeColor={(node) => node.data?.isHighlighted ? "#ffffff" : "rgba(255,255,255,0.35)"}
        nodeBorderRadius={4}
        maskColor="rgba(0, 0, 0, 0.45)"
        maskStrokeColor="rgba(255, 255, 255, 0.16)"
        pannable
        zoomable
      />
      <Controls showInteractive={false} />      
      <Panel position="top-left" className="search-panel">
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          backgroundColor: 'var(--bg-sidebar-clr)'
        }}>
          <input
            type="text"
            value={props.searchPath}
            onChange={(e) => props.setSearchPath(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && props.handleSearch()}
            placeholder="$.user.address.city, items[0].name"
            style={{ 
              flex: 1,
              minWidth: '300px',
              padding: '8px 12px', 
              borderRadius: '5px',
              border: '1px solid rgba(0,0,0,0.12)',
              fontSize: '14px',
              backgroundColor: 'var(--bg-sidebar-clr)',
            }}
          />
          <button
            onClick={props.handleSearch}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#10b981', 
              color: 'white', 
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Search
          </button>
          {/* {props.searchResults.length > 0 && ( */}
            <span style={{ 
              color: '#059669', 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {props.searchResults.length} match{props.searchResults.length !== 1 ? 'es' : ''}
            </span>
          {/* )} */}
        </div>
      </Panel>

      {/* Layout Panel */}
      <Panel position="top-right" className="react-flow__panel-1">
        <button onClick={() => props.onLayout({ direction: "DOWN" })} className="panel__btn">
          Vertical layout
        </button>
        <button onClick={() => props.onLayout({ direction: "RIGHT" })}>
          Horizontal layout
        </button>
        <button onClick={() => {props.handleDownload()}}>
          Download PNG
        </button>
      </Panel>
    </ReactFlow>
  );
}
