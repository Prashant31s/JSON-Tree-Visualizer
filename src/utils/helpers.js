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

export const selector = (state) => ({
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
  focusedNode: state.focusedNode,
  setFocusedNode: state.setFocusedNode,
  maxDepth: state.maxDepth,
  setMaxDepth: state.setMaxDepth,
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
  const { fitView, getViewport, setViewport, getNodes, zoomIn, zoomOut } = useReactFlow();
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
      <Panel position="bottom-center" className="zoom-panel">
        <button
          type="button"
          onClick={() => zoomOut({ duration: 300 })}
          title="Zoom Out (-)"
          className="zoom-panel__btn zoom-panel__btn--icon"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <span className="zoom-panel__value">{Math.round(zoomLevel * 100)}%</span>

        <button
          type="button"
          onClick={() => zoomIn({ duration: 300 })}
          title="Zoom In (+)"
          className="zoom-panel__btn zoom-panel__btn--icon"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <div className="zoom-panel__divider zoom-panel__presets" />

        <button
          type="button"
          onClick={() => setZoomPreset(0.5)}
          className={`zoom-panel__btn zoom-panel__presets ${Math.round(zoomLevel * 100) === 50 ? 'is-active' : ''}`}
        >
          50%
        </button>
        <button
          type="button"
          onClick={() => setZoomPreset(1)}
          className={`zoom-panel__btn zoom-panel__presets ${Math.round(zoomLevel * 100) === 100 ? 'is-active' : ''}`}
        >
          100%
        </button>
        <button
          type="button"
          onClick={() => setZoomPreset(1.5)}
          className={`zoom-panel__btn zoom-panel__presets ${Math.round(zoomLevel * 100) === 150 ? 'is-active' : ''}`}
        >
          150%
        </button>

        <div className="zoom-panel__divider" />

        <button
          type="button"
          onClick={fitAllNodes}
          title="Fit view to show all nodes"
          className="zoom-panel__btn zoom-panel__btn--fit"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          <span className="zoom-panel__fit-text">Fit View</span>
        </button>
      </Panel>
      {/* Unified Top Canvas Toolbar Panel */}
      <Panel position="top-center" className="top-canvas-panel">
        {/* Focus Mode Banner Overlay when Subtree Focus is Active */}
        {props.focusedNode && (
          <div className="focus-mode-banner">
            <span className="focus-mode-banner__icon">🎯</span>
            <span className="focus-mode-banner__text">
              Subtree Focus: <strong>{props.focusedNode.key || 'Node'}</strong>
            </span>
            <button
              type="button"
              className="focus-mode-banner__exit-btn"
              onClick={props.onExitFocus}
              title="Exit Subtree Focus Mode"
            >
              Exit Focus ✕
            </button>
          </div>
        )}

        <div className="top-canvas-toolbar">
          {/* Search Box Section */}
          <div className="search-panel__box">
            <div className="search-input-wrap">
              <svg
                className="search-input-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-panel__input"
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
                placeholder="Search JSON path e.g. $.user.name"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="search-suggestions"
                aria-expanded={showSuggestions && pathSuggestions.length > 0}
                aria-activedescendant={
                  pathSuggestions[activeSuggestionIndex]
                    ? `search-suggestion-${activeSuggestionIndex}`
                    : undefined
                }
              />
              {props.searchPath && (
                <button
                  type="button"
                  className="search-input-clear-btn"
                  onClick={() => selectSuggestion("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
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
              onClick={() => props.handleSearch()}
              className="search-panel__btn"
            >
              Search
            </button>
            {props.searchPath.trim() !== '' && (
              <span className="search-panel__matches">
                {props.searchResults.length} match{props.searchResults.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {/* Layout & Depth Controls Section */}
          <div className="layout-segmented-control">
            {/* Depth Level Filter Pills */}
            <div className="depth-controls" title="Limit Rendered Tree Depth">
              <span className="depth-controls__label">Depth:</span>
              <button
                type="button"
                onClick={() => props.onSetMaxDepth(Infinity)}
                className={`depth-btn ${props.maxDepth === Infinity ? 'is-active' : ''}`}
                title="Show All Depths"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => props.onSetMaxDepth(1)}
                className={`depth-btn ${props.maxDepth === 1 ? 'is-active' : ''}`}
                title="Limit to Depth Level 1"
              >
                L1
              </button>
              <button
                type="button"
                onClick={() => props.onSetMaxDepth(2)}
                className={`depth-btn ${props.maxDepth === 2 ? 'is-active' : ''}`}
                title="Limit to Depth Level 2"
              >
                L2
              </button>
              <button
                type="button"
                onClick={() => props.onSetMaxDepth(3)}
                className={`depth-btn ${props.maxDepth === 3 ? 'is-active' : ''}`}
                title="Limit to Depth Level 3"
              >
                L3
              </button>
            </div>

            <div className="layout-controls-divider" />

            <div className="layout-buttons-group">
              <button
                type="button"
                onClick={() => props.onLayout({ direction: "DOWN" })}
                className={`panel__btn ${props.layoutDirection === 'DOWN' || !props.layoutDirection ? 'is-active' : ''}`}
                title="Vertical Layout"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
                <span>Vertical</span>
              </button>
              <button
                type="button"
                onClick={() => props.onLayout({ direction: "RIGHT" })}
                className={`panel__btn ${props.layoutDirection === 'RIGHT' ? 'is-active' : ''}`}
                title="Horizontal Layout"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
                <span>Horizontal</span>
              </button>
              {props.onOpenExport && (
                <button
                  type="button"
                  className="panel__btn panel__btn--export"
                  onClick={props.onOpenExport}
                  title="Export JSON Data & Diagrams"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </ReactFlow>
  );
}
