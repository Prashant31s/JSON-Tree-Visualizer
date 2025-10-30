import { useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  Panel,
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

  useEffect(() => {
    if (!props.lastSearchResult) {
      fitView({ nodes: [props.nodes[0], props.nodes[0]?.id], minZoom: 0.1, padding: 8 });
    }
  }, [props.nodes, props.edges, fitView, props.lastSearchResult]);

  useEffect(() => {
    if (props.lastSearchResult) {
      setTimeout(() => {
        fitView({
          nodes: props.lastSearchResult.nodes,
          duration: 800,
          padding: 50
        });
      }, 100);
    }
  }, [props.lastSearchResult, fitView]);

  useEffect(() => {
    props.setReactFlowHelpers?.({ fitView, getViewport, setViewport, getNodes });
  }, [fitView, getViewport, setViewport, getNodes]);

  return (
    <ReactFlow
      nodes={props.nodes}
      edges={props.edges}
      nodeTypes={props.nodeTypes}
      edgeTypes={props.edgeTypes}
      defaultEdgeOptions={props.defaultEdgeOptions}
      onNodesChange={props.onNodesChange}
      onEdgesChange={props.onEdgesChange}
    >
      <Background gap={30} color="#373737" variant={BackgroundVariant.Lines} />
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