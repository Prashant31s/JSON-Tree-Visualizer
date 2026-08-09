"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import {  ReactFlowProvider } from "reactflow";

import JsonVisNode from "../custom-nodes/JsonVisNode";
import JsonVisEdge from "../custom-edges/JsonVisEdge";

import { shallow } from "zustand/shallow";

import Sidebar from "../components/Sidebar";
import ExportModal from "../components/ExportModal";
import useStore from "../store/useStore";
import convertJsonToTree from "../utils/convertJsonToTree";
import convertTreeToNodes from "../utils/convertTreeToNodes";
import { findNodesByPath } from "../utils/jsonPathMatcher";

import "reactflow/dist/style.css";
import "./globals.css";
import { getLayoutedElements, InnerFlow, selector } from "@/utils/helpers";

const nodeTypes = { jsonVis: JsonVisNode };
const edgeTypes = { jsonVis: JsonVisEdge };
const defaultEdgeOpt = { type: "jsonVis" };

const elkOptions = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "200",
  "elk.spacing.nodeNode": "150",
  "elk.edgeRouting": "SPLINES",
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
  const [lastSearchResult, setLastSearchResult] = useState(null);
  const [reactFlowHelpers, setReactFlowHelpers] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState("DOWN");

  const onLayout = useCallback(
    ({ direction }, initialNodes = null, highlightIds = []) => {
      setLayoutDirection(direction);
      const opts = { "elk.direction": direction, ...elkOptions };
      let ns, es;
      if (initialNodes === null) {
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

  const handleSearch = useCallback((selectedPath = searchPath) => {
    // Guard: if a SyntheticEvent or non-string was accidentally passed, fall back to searchPath
    const path = typeof selectedPath === 'string' ? selectedPath : searchPath;
    if (!treeData || !path.trim()) {
      // Reset highlighting
      setHighlightedNodeIds([]);
      setSearchResults([]);
      onLayout({ direction: "DOWN" });
      setLastSearchResult(null);
      return;
    }

    const results = findNodesByPath(path, treeData);
    setSearchResults(results);

    if (results.length > 0) {
      const highlightIds = results.map(r => r.node.id);
      setHighlightedNodeIds(highlightIds);
      
      const [ns, es] = convertTreeToNodes(treeData, true, highlightIds);
      onLayout({ direction: "DOWN" }, [ns, es], highlightIds);
      
      setLastSearchResult({
        nodes: ns.filter(n => highlightIds.includes(n.id))
      });
    } else {
      setHighlightedNodeIds([]);
      setLastSearchResult(null);
    }
  }, [treeData, searchPath, setHighlightedNodeIds, setSearchResults, onLayout]);

  const handleDownload = (customFilename = "json-tree") => {
    const reactFlowElement = document.querySelector(".react-flow");
    if (!reactFlowElement || !reactFlowHelpers) return;

    const { getViewport, setViewport, getNodes } = reactFlowHelpers;
    const originalViewport = getViewport();
    
    const allNodes = getNodes();
    if (!allNodes || allNodes.length === 0) return;

    // Calculating bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    allNodes.forEach(node => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 50;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    const padding = 100;
    const fullWidth = maxX - minX + padding * 2;
    const fullHeight = maxY - minY + padding * 2;

    // Setting viewport to show everything at 100% 
    setViewport(
      {
        x: -(minX - padding),
        y: -(minY - padding),
        zoom: 1 // Always capture at 100% scale for maximum quality
      },
      { duration: 0 }
    );
    
    setTimeout(() => {
      import("html-to-image").then(({ toPng }) => {
        toPng(reactFlowElement, {
          backgroundColor: '#1a1a1a',
          pixelRatio: 2,
          width: fullWidth,
          height: fullHeight,
          cacheBust: true,
          skipFonts: false,
          filter: (node) => {
            return !node.classList?.contains('react-flow__controls') &&
                  !node.classList?.contains('react-flow__panel') &&
                  !node.classList?.contains('react-flow__attribution') &&
                  !node.classList?.contains('react-flow__background') &&
                  !node.classList?.contains('json-minimap') &&
                  !node.classList?.contains('search-suggestions');
          }
        })
          .then((dataUrl) => {
            const cleanName = (typeof customFilename === 'string' && customFilename.trim()) ? customFilename.trim() : "json-tree";
            const downloadName = cleanName.endsWith('.png') ? cleanName : `${cleanName}.png`;
            const link = document.createElement("a");
            link.download = downloadName;
            link.href = dataUrl;
            link.click();
            
            setTimeout(() => {
              setViewport(originalViewport, { duration: 300 });
            }, 100);
          })
          .catch((err) => {
            console.error("Failed to download:", err);
            setViewport(originalViewport, { duration: 0 });
          });
      });
    }, 1000);
  };

  const handleDownloadSvg = (customFilename = "json-tree") => {
    const reactFlowElement = document.querySelector(".react-flow");
    if (!reactFlowElement || !reactFlowHelpers) return;

    const { getViewport, setViewport, getNodes } = reactFlowHelpers;
    const originalViewport = getViewport();
    
    const allNodes = getNodes();
    if (!allNodes || allNodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    allNodes.forEach(node => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 50;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    const padding = 100;
    const fullWidth = maxX - minX + padding * 2;
    const fullHeight = maxY - minY + padding * 2;

    setViewport(
      {
        x: -(minX - padding),
        y: -(minY - padding),
        zoom: 1
      },
      { duration: 0 }
    );
    
    setTimeout(() => {
      import("html-to-image").then(({ toSvg }) => {
        toSvg(reactFlowElement, {
          backgroundColor: '#1a1a1a',
          width: fullWidth,
          height: fullHeight,
          cacheBust: true,
          skipFonts: false,
          filter: (node) => {
            return !node.classList?.contains('react-flow__controls') &&
                  !node.classList?.contains('react-flow__panel') &&
                  !node.classList?.contains('react-flow__attribution') &&
                  !node.classList?.contains('react-flow__background') &&
                  !node.classList?.contains('json-minimap') &&
                  !node.classList?.contains('search-suggestions');
          }
        })
          .then((dataUrl) => {
            const cleanName = (typeof customFilename === 'string' && customFilename.trim()) ? customFilename.trim() : "json-tree";
            const downloadName = cleanName.endsWith('.svg') ? cleanName : `${cleanName}.svg`;
            const link = document.createElement("a");
            link.download = downloadName;
            link.href = dataUrl;
            link.click();
            
            setTimeout(() => {
              setViewport(originalViewport, { duration: 300 });
            }, 100);
          })
          .catch((err) => {
            console.error("Failed to download SVG:", err);
            setViewport(originalViewport, { duration: 0 });
          });
      });
    }, 1000);
  };

  useLayoutEffect(() => {
    if (needToRenderJson) {
      onLayout({ direction: "DOWN" });
    }
  }, [needToRenderJson, onLayout]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <ReactFlowProvider>
      <div className="app-cont">
        {/* Mobile Header Bar */}
        <header className="mobile-header">
          <div className="mobile-header__brand">
            <span className="sidebar__brand-dot" />
            <h1 className="mobile-header__title">JSON Visualizer</h1>
          </div>
          <button
            type="button"
            className="mobile-header__toggle-btn"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle JSON sidebar menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>JSON Editor</span>
          </button>
        </header>

        {/* Backdrop for Mobile Drawer */}
        {isMobileSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="react-flow-cont">
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
            setReactFlowHelpers={setReactFlowHelpers}
            handleDownload={handleDownload}
            layoutDirection={layoutDirection}
            onOpenExport={() => setIsExportModalOpen(true)}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        </div>

        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          jsonData={needToRenderJson}
          searchResults={searchResults}
          searchPath={searchPath}
          onDownloadPng={handleDownload}
          onDownloadSvg={handleDownloadSvg}
        />
      </div>
    </ReactFlowProvider>
  );
}
