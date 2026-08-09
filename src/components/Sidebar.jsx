"use client";

import useStore from "@/store/useStore";
import { useState, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";

const selector = (state) => ({
  needToRenderJson: state.needToRenderJson,
  setNeedToRenderJson: state.setNeedToRenderJson,
});

// Recursive Collapsible JSON Node Component for Sidebar Tree View
function CollapsibleJsonNode({ data, label, isLast = true, depth = 0, defaultExpandedDepth = 2 }) {
  const [isExpanded, setIsExpanded] = useState(depth < defaultExpandedDepth);
  const isObject = typeof data === "object" && data !== null && !Array.isArray(data);
  const isArray = Array.isArray(data);
  const isContainer = isObject || isArray;

  const getPreview = () => {
    if (isArray) return `Array(${data.length})`;
    if (isObject) return `Object{${Object.keys(data).length}}`;
    return String(data);
  };

  const renderValue = (val) => {
    if (val === null) return <span style={{ color: "#9ca3af" }}>null</span>;
    if (typeof val === "boolean") return <span style={{ color: "#f59e0b" }}>{String(val)}</span>;
    if (typeof val === "number") return <span style={{ color: "#38bdf8" }}>{val}</span>;
    if (typeof val === "string") return <span style={{ color: "#34d399" }}>"{val}"</span>;
    return <span>{String(val)}</span>;
  };

  if (!isContainer) {
    return (
      <div style={{ paddingLeft: `${depth * 14}px`, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: "12px", lineHeight: "1.6" }}>
        {label && <span style={{ color: "#c084fc", fontWeight: "600" }}>{label}: </span>}
        {renderValue(data)}
        {!isLast && <span style={{ color: "#6b7280" }}>,</span>}
      </div>
    );
  }

  const entries = isArray ? data.map((item, i) => [i, item]) : Object.entries(data);

  return (
    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: "12px", lineHeight: "1.6" }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          paddingLeft: `${depth * 14}px`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          userSelect: "none",
          paddingTop: "1px",
          paddingBottom: "1px",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
            flexShrink: 0
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {label && <span style={{ color: "#c084fc", fontWeight: "600" }}>{label}: </span>}
        <span style={{ color: isArray ? "#10b981" : "#60a5fa", fontWeight: "600" }}>
          {isArray ? "[" : "{"}
        </span>
        {!isExpanded && (
          <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>
            {" "}{getPreview()}{" "}
          </span>
        )}
        {!isExpanded && (
          <span style={{ color: isArray ? "#10b981" : "#60a5fa", fontWeight: "600" }}>
            {isArray ? "]" : "}"}
            {!isLast && ","}
          </span>
        )}
      </div>

      {isExpanded && (
        <div>
          {entries.map(([key, val], idx) => (
            <CollapsibleJsonNode
              key={key}
              label={isArray ? null : key}
              data={val}
              isLast={idx === entries.length - 1}
              depth={depth + 1}
              defaultExpandedDepth={defaultExpandedDepth}
            />
          ))}
          <div style={{ paddingLeft: `${depth * 14 + 18}px`, color: isArray ? "#10b981" : "#60a5fa", fontWeight: "600" }}>
            {isArray ? "]" : "}"}
            {!isLast && ","}
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ isOpen, onClose }) {
  const { needToRenderJson, setNeedToRenderJson } = useStore(selector, shallow);
  const [activeTab, setActiveTab] = useState("editor"); // "editor" | "tree"
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [editorValue, setEditorValue] = useState(() => JSON.stringify(needToRenderJson, null, 2));
  const [theme, setTheme] = useState("dark");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      setEditorValue(JSON.stringify(needToRenderJson, null, 2));
    } catch (e) {
      console.error(e);
    }
  }, [needToRenderJson]);

  useEffect(() => {
    const persisted = typeof window !== "undefined" && localStorage.getItem("theme");
    if (persisted) {
      setTheme(persisted);
      document.documentElement.setAttribute("data-theme", persisted);
    } else if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      console.error("Failed to persist theme:", e);
    }
  };

  const validateAndRender = (jsonStr = editorValue) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === "object" && parsed !== null) {
        setError(null);
        setNeedToRenderJson(parsed);
        if (onClose) onClose(); // Auto-close drawer on mobile when user clicks Run
        return true;
      }
      setError("Input must be a valid JSON object or array");
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(editorValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setEditorValue(formatted);
      setError(null);
    } catch (err) {
      setError("Cannot format invalid JSON: " + err.message);
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(editorValue);
      const minified = JSON.stringify(parsed);
      setEditorValue(minified);
      setError(null);
    } catch (err) {
      setError("Cannot minify invalid JSON: " + err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFetchUrl = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setNeedToRenderJson(data);
      setEditorValue(JSON.stringify(data, null, 2));
      setShowUrlInput(false);
      if (onClose) onClose();
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Error fetching URL: ${err.message}. Ensure CORS is enabled.`);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? "is-open" : ""}`}>
      {/* Sleek Header */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <span className="sidebar__brand-dot" />
          <h1 className="sidebar__title">JSON Visualizer</h1>
        </div>
        <div className="sidebar__header-actions">
          <button
            className="sidebar__theme-btn"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            className="sidebar__btn sidebar__btn--primary"
            onClick={() => validateAndRender()}
            title="Visualize JSON on canvas"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run
          </button>
          {onClose && (
            <button
              type="button"
              className="sidebar__close-btn"
              onClick={onClose}
              title="Close Panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="sidebar__url-toggle-wrap">
        <button
          type="button"
          className="sidebar__url-toggle-btn"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Import via URL
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showUrlInput ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease"
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showUrlInput && (
          <div className="sidebar__url-cont">
            <input
              className="sidebar__url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste API or raw JSON URL..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFetchUrl();
              }}
            />
            <button
              className="sidebar__btn sidebar__btn--primary"
              onClick={handleFetchUrl}
              disabled={isFetching}
            >
              {isFetching ? "..." : "Fetch"}
            </button>
          </div>
        )}
      </div>

      {/* Segmented Mode Switcher */}
      <div className="sidebar__tabs-wrap">
        <div className="sidebar__tabs">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`sidebar__tab ${activeTab === "editor" ? "is-active" : ""}`}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tree")}
            className={`sidebar__tab ${activeTab === "tree" ? "is-active" : ""}`}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="6" height="6" rx="1" />
              <rect x="15" y="3" width="6" height="6" rx="1" />
              <rect x="15" y="15" width="6" height="6" rx="1" />
              <path d="M6 9v7a2 2 0 0 0 2 2h7" />
            </svg>
            Tree View
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="sidebar__content">
        {activeTab === "editor" ? (
          <div className="sidebar__editor-wrapper">
            {/* Editor Action Toolbar */}
            <div className="sidebar__editor-toolbar">
              <span className="sidebar__editor-title">INPUT JSON</span>
              <div className="sidebar__editor-actions">
                <button
                  type="button"
                  onClick={handlePrettify}
                  title="Format JSON with 2-space indentation"
                  className="sidebar__tool-btn"
                >
                  Format
                </button>
                <button
                  type="button"
                  onClick={handleMinify}
                  title="Minify JSON"
                  className="sidebar__tool-btn"
                >
                  Minify
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy JSON text"
                  className="sidebar__tool-btn"
                  style={{ color: copied ? "#34d399" : "inherit" }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              className="sidebar__textarea"
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              spellCheck="false"
              placeholder="Paste or type JSON here..."
            />
          </div>
        ) : (
          <div className="sidebar__tree-wrapper">
            <CollapsibleJsonNode data={needToRenderJson} />
          </div>
        )}
      </div>

      {/* Error Message Footer */}
      {error && (
        <div className="sidebar__error-banner">
          <span style={{ fontWeight: "700" }}>⚠️ Error:</span> {error}
        </div>
      )}
    </div>
  );
}

export default Sidebar;



