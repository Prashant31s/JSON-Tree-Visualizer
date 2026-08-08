import { useEffect, useMemo, useState } from "react";
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const searchQuery = props.searchPath.trim().toLowerCase();
  const pathSuggestions = useMemo(() => {
    if (!searchQuery) return [];

    const uniqueSuggestions = new Map();

    nodes.forEach((node) => {
      const path = node.data?.path;
      const pathParts = node.data?.pathParts || [];
      const key = pathParts[pathParts.length - 1] || path;

      if (!path || path === '$' || uniqueSuggestions.has(path)) return;

      const normalizedKey = String(key).toLowerCase();
      const normalizedPath = path.toLowerCase();

      if (normalizedKey.includes(searchQuery) || normalizedPath.includes(searchQuery)) {
        uniqueSuggestions.set(path, {
          path,
          key,
          color: node.data?.color || '#3b82f6',
        });
      }
    });

    return Array.from(uniqueSuggestions.values())
      .sort((firstSuggestion, secondSuggestion) => {
        const firstDepth = firstSuggestion.path.split(/\.|\[/).length;
        const secondDepth = secondSuggestion.path.split(/\.|\[/).length;

        if (firstDepth !== secondDepth) {
          return firstDepth - secondDepth;
        }

        return firstSuggestion.path.localeCompare(secondSuggestion.path);
      })
      .slice(0, 8);
  }, [nodes, searchQuery]);

  const selectSuggestion = (path) => {
    props.setSearchPath(path);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    props.handleSearch(path);
  };

  const handleSearchKeyDown = (event) => {
    const hasSuggestions = showSuggestions && pathSuggestions.length > 0;

    if (event.key === 'ArrowDown' && pathSuggestions.length > 0) {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex < pathSuggestions.length - 1 ? currentIndex + 1 : 0
      );
      return;
    }

    if (event.key === 'ArrowUp' && hasSuggestions) {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : pathSuggestions.length - 1
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (hasSuggestions && pathSuggestions[activeSuggestionIndex]) {
        selectSuggestion(pathSuggestions[activeSuggestionIndex].path);
        return;
      }

      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      props.handleSearch();
      return;
    }

    if (event.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleMove = (_event, viewport) => {
    setZoomLevel(viewport.zoom);
  };

  const setZoomPreset = (zoom) => {
    const viewport = getViewport();
    setViewport({ ...viewport, zoom }, { duration: 300 });
    setZoomLevel(zoom);
  };

  const fitAllNodes = () => {
    if (nodes.length === 0) return;

    fitView({
      nodes: nodes.map((node) => ({ id: node.id })),
      minZoom: 0.02,
      maxZoom: 1,
      padding: 0.2,
      duration: 300,
    });
  };

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
      onMove={handleMove}
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
      <Panel position="bottom-center" className="zoom-panel">
        <span className="zoom-panel__value">{Math.round(zoomLevel * 100)}%</span>
        <button type="button" onClick={() => setZoomPreset(0.25)}>
          25%
        </button>
        <button type="button" onClick={() => setZoomPreset(0.5)}>
          50%
        </button>
        <button type="button" onClick={() => setZoomPreset(1)}>
          100%
        </button>
        <button type="button" onClick={fitAllNodes}>
          Fit
        </button>
      </Panel>
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
          <div className="search-input-wrap">
            <input
              type="text"
              value={props.searchPath}
              onChange={(e) => {
                props.setSearchPath(e.target.value);
                setShowSuggestions(true);
                setActiveSuggestionIndex(0);
              }}
              onFocus={() => {
                setShowSuggestions(true);
                setActiveSuggestionIndex(0);
              }}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
              onKeyDown={handleSearchKeyDown}
              placeholder="$.user.address.city, items[0].name"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-expanded={showSuggestions && pathSuggestions.length > 0}
              aria-activedescendant={
                pathSuggestions[activeSuggestionIndex]
                  ? `search-suggestion-${activeSuggestionIndex}`
                  : undefined
              }
              style={{ 
                width: '100%',
                padding: '8px 12px', 
                borderRadius: '5px',
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-sidebar-clr)',
              }}
            />
            {showSuggestions && pathSuggestions.length > 0 && (
              <div id="search-suggestions" className="search-suggestions" role="listbox">
                {pathSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.path}
                    id={`search-suggestion-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    className={`search-suggestion${index === activeSuggestionIndex ? ' is-active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={() => selectSuggestion(suggestion.path)}
                  >
                    <span
                      className="search-suggestion__dot"
                      style={{ backgroundColor: suggestion.color }}
                    />
                    <span className="search-suggestion__text">
                      <span className="search-suggestion__key">{suggestion.key}</span>
                      <span className="search-suggestion__path">{suggestion.path}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
