'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  exportToJson,
  exportToYaml,
  exportToCsv,
  exportToXml,
  exportToJsonLines,
  downloadFormattedFile,
  copyToClipboard,
} from '../utils/exportFormatters';

const FORMAT_OPTIONS = [
  { id: 'json', label: 'JSON (Pretty)', ext: 'json', mime: 'application/json' },
  { id: 'json-min', label: 'JSON (Minified)', ext: 'json', mime: 'application/json' },
  { id: 'yaml', label: 'YAML', ext: 'yaml', mime: 'text/yaml' },
  { id: 'csv', label: 'CSV', ext: 'csv', mime: 'text/csv' },
  { id: 'xml', label: 'XML', ext: 'xml', mime: 'application/xml' },
  { id: 'jsonl', label: 'JSON Lines', ext: 'jsonl', mime: 'application/x-ndjson' },
  { id: 'png', label: 'PNG Image 🖼️', ext: 'png', mime: 'image/png' },
];

export default function ExportModal({
  isOpen,
  onClose,
  jsonData,
  searchResults = [],
  searchPath = '',
  onDownloadPng,
}) {
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [scope, setScope] = useState('full'); // 'full' | 'filtered'
  const [indent, setIndent] = useState(2);
  const [filename, setFilename] = useState('exported-data');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Determine active data source (Full or Filtered Subtree)
  const activeData = useMemo(() => {
    if (scope === 'filtered' && searchResults && searchResults.length > 0) {
      if (searchResults.length === 1) {
        return searchResults[0].node.value;
      }
      return searchResults.map((r) => r.node.value);
    }
    return jsonData;
  }, [scope, searchResults, jsonData]);

  // Generate output content based on selected format and settings
  const formattedContent = useMemo(() => {
    if (selectedFormat === 'png') {
      return `// High-Resolution Visual PNG Diagram\n// Format: PNG Image (.png)\n// Render Quality: 2x Ultra HD Pixel Ratio\n// Background: Theme Canvas Background (#1a1a1a)\n\n// Click "Download .png File" below to generate and export the full visual tree structure as a high-resolution PNG image.`;
    }

    if (!activeData && activeData !== 0 && activeData !== false) return '';

    try {
      switch (selectedFormat) {
        case 'json':
          return exportToJson(activeData, { indent, minified: false });
        case 'json-min':
          return exportToJson(activeData, { minified: true });
        case 'yaml':
          return exportToYaml(activeData, { indent });
        case 'csv':
          return exportToCsv(activeData);
        case 'xml':
          return exportToXml(activeData, { indent, rootName: 'root' });
        case 'jsonl':
          return exportToJsonLines(activeData);
        default:
          return exportToJson(activeData, { indent: 2 });
      }
    } catch (err) {
      console.error('Export formatting error:', err);
      return `// Error generating ${selectedFormat.toUpperCase()} output:\n${err.message}`;
    }
  }, [activeData, selectedFormat, indent]);

  const activeFormatObj = FORMAT_OPTIONS.find((f) => f.id === selectedFormat) || FORMAT_OPTIONS[0];

  const handleCopy = async () => {
    if (selectedFormat === 'png') return;
    const success = await copyToClipboard(formattedContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const cleanFilename = filename.trim() || 'exported-data';
    if (selectedFormat === 'png') {
      if (onDownloadPng) {
        onDownloadPng(cleanFilename);
        onClose();
      }
      return;
    }
    const finalFilename = `${cleanFilename}.${activeFormatObj.ext}`;
    downloadFormattedFile(formattedContent, finalFilename, activeFormatObj.mime);
  };

  if (!isOpen || !mounted) return null;

  const hasFilter = searchResults && searchResults.length > 0;

  return createPortal(
    <div className="export-modal-backdrop" onClick={onClose}>
      <div
        className="export-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Header */}
        <div className="export-modal-header">
          <div className="export-modal-header__title-wrap">
            <span className="export-modal-header__icon">📤</span>
            <h2 id="export-modal-title" className="export-modal-header__title">
              Export Structured Data & Diagram
            </h2>
          </div>
          <button
            type="button"
            className="export-modal-header__close-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="export-modal-body">
          {/* Controls Bar */}
          <div className="export-modal-controls">
            {/* Format Selector Tabs */}
            <div className="export-modal-field">
              <label className="export-modal-label">Export Format</label>
              <div className="export-modal-tabs">
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    className={`export-modal-tab ${
                      selectedFormat === fmt.id ? 'is-active' : ''
                    }`}
                    onClick={() => setSelectedFormat(fmt.id)}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope & Settings Row */}
            <div className="export-modal-settings-grid">
              {/* Data Scope Toggle */}
              {hasFilter && selectedFormat !== 'png' && (
                <div className="export-modal-field">
                  <label className="export-modal-label">Data Scope</label>
                  <div className="export-modal-segmented">
                    <button
                      type="button"
                      className={`export-modal-segment ${
                        scope === 'full' ? 'is-active' : ''
                      }`}
                      onClick={() => setScope('full')}
                    >
                      Full JSON
                    </button>
                    <button
                      type="button"
                      className={`export-modal-segment ${
                        scope === 'filtered' ? 'is-active' : ''
                      }`}
                      onClick={() => setScope('filtered')}
                    >
                      Search Matches ({searchResults.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Indentation Selector for formatted types */}
              {['json', 'yaml', 'xml'].includes(selectedFormat) && (
                <div className="export-modal-field">
                  <label className="export-modal-label">Indentation</label>
                  <select
                    className="export-modal-select"
                    value={indent}
                    onChange={(e) => setIndent(Number(e.target.value))}
                  >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                  </select>
                </div>
              )}

              {/* Filename Input */}
              <div className="export-modal-field" style={{ flexGrow: 1 }}>
                <label className="export-modal-label">Filename</label>
                <div className="export-modal-filename-wrap">
                  <input
                    type="text"
                    className="export-modal-input"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="exported-data"
                  />
                  <span className="export-modal-ext">.{activeFormatObj.ext}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Area */}
          <div className="export-modal-preview-section">
            <div className="export-modal-preview-header">
              <span className="export-modal-preview-title">
                {selectedFormat === 'png'
                  ? 'Visual Diagram Preview Info'
                  : `Preview (${formattedContent.split('\n').length} lines, ${new Blob([formattedContent]).size} bytes)`}
              </span>
            </div>
            <textarea
              className="export-modal-preview-text"
              value={formattedContent}
              readOnly
              spellCheck={false}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="export-modal-footer">
          {selectedFormat !== 'png' && (
            <button
              type="button"
              className="export-modal-btn export-modal-btn--secondary"
              onClick={handleCopy}
            >
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy to Clipboard'}
            </button>
          )}
          <button
            type="button"
            className="export-modal-btn export-modal-btn--primary"
            onClick={handleDownload}
          >
            {selectedFormat === 'png'
              ? '🖼️ Download .png Diagram'
              : `💾 Download .${activeFormatObj.ext} File`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
