"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  Panel,
  ReactFlowProvider,
} from "reactflow";

import JsonVisNode from "../custom-nodes/JsonVisNode";
import JsonVisEdge from "../custom-edges/JsonVisEdge";

import { shallow } from "zustand/shallow";
import ELK from "elkjs/lib/elk.bundled.js";

import Sidebar from "../components/Sidebar";
import useStore from "../store/useStore";
import convertJsonToTree from "../utils/convertJsonToTree";
import convertTreeToNodes from "../utils/convertTreeToNodes";
import { findNodesByPath } from "../utils/jsonPathMatcher";

import "reactflow/dist/style.css";
import "./globals.css";

// Define node and edge types
const nodeTypes = { jsonVis: JsonVisNode };
const edgeTypes = { jsonVis: JsonVisEdge };
const defaultEdgeOpt = { type: "jsonVis" };

// Zustand selector
const selector = (state) => ({
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

const elk = new ELK();

// ELK layout options
const elkOptions = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "200",
  "elk.spacing.nodeNode": "150",
  "elk.edgeRouting": "SPLINES",
};

// Function to layout nodes and edges
const getLayoutedElements = (nodes, edges, options = {}) => {
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

export default function Page() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    needToRenderJson,
    onNodesChange,
    onEdgesChange,
    treeData,
    setTreeData,
    searchPath,
    setSearchPath,
    highlightedNodeIds,
    setHighlightedNodeIds,
    searchResults,
    setSearchResults,
  } = useStore(selector, shallow);

  const onLayout = useCallback(
    ({ direction }, initialNodes = null, highlightIds = []) => {
      const opts = { "elk.direction": direction, ...elkOptions };
      let ns, es;
      if (initialNodes === null) {
        // Convert the current JSON to tree and nodes/edges
        const nodeTree = convertJsonToTree(needToRenderJson);
        setTreeData(nodeTree);
        [ns, es] = convertTreeToNodes(nodeTree, true, highlightIds);
      } else {
        ns = initialNodes[0];
        es = initialNodes[1];
      }

      getLayoutedElements(ns, es, opts).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        }
      );
    },
    [needToRenderJson, setNodes, setEdges, setTreeData]
  );

  const [lastSearchResult, setLastSearchResult] = useState(null);
  
  const handleSearch = useCallback(() => {
    if (!treeData || !searchPath.trim()) {
      // Reset highlighting
      setHighlightedNodeIds([]);
      setSearchResults([]);
      onLayout({ direction: "DOWN" });
      setLastSearchResult(null);
      return;
    }

    const results = findNodesByPath(searchPath, treeData);
    setSearchResults(results);

    if (results.length > 0) {
      const highlightIds = results.map(r => r.node.id);
      setHighlightedNodeIds(highlightIds);
      
      // Regenerate nodes with highlighting
      const [ns, es] = convertTreeToNodes(treeData, true, highlightIds);
      onLayout({ direction: "DOWN" }, [ns, es], highlightIds);
      
      // Store the nodes that need to be centered
      setLastSearchResult({
        nodes: ns.filter(n => highlightIds.includes(n.id))
      });
    } else {
      // alert('No nodes found matching the path');
      setHighlightedNodeIds([]);
      setLastSearchResult(null);
    }
  }, [treeData, searchPath, setHighlightedNodeIds, setSearchResults, onLayout]);

  useLayoutEffect(() => {
    if (needToRenderJson) {
      onLayout({ direction: "DOWN" });
    }
  }, [needToRenderJson, onLayout]);

  return (
    <ReactFlowProvider>
      <div className="app-cont">
        <div className="react-flow-cont" style={{ width: "80vw", minHeight: "100vh" }}>
          <InnerFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOpt}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onLayout={onLayout}
            searchPath={searchPath}
            setSearchPath={setSearchPath}
            handleSearch={handleSearch}
            searchResults={searchResults}
            lastSearchResult={lastSearchResult}
          />
        </div>
        <Sidebar />
      </div>
    </ReactFlowProvider>
  );
}

function InnerFlow(props) {
  const { fitView } = useReactFlow();

  // Initial fit view
  useEffect(() => {
    if (!props.lastSearchResult) {
      fitView({ nodes: [props.nodes[0], props.nodes[0]?.id], minZoom: 0.1, padding: 8 });
    }
  }, [props.nodes, props.edges, fitView, props.lastSearchResult]);

  // Handle search result centering
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
      <Controls showInteractive={false} />      {/* Search Panel */}
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
      </Panel>
    </ReactFlow>
  );
}