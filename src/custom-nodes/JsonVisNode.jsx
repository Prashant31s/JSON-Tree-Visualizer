
import { Handle } from 'reactflow';
import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Map node color to a matching icon and type label
function getNodeMeta(data) {
  const color = data.color || '#3b82f6';
  const isRoot = data.path === '$';
  
  if (data.isHighlighted)  return { icon: '🔍', typeLabel: 'Match' };
  if (isRoot)              return { icon: '{}', typeLabel: 'Root' };
  
  switch (color) {
    case '#3b82f6': return { icon: '{}', typeLabel: 'Object' };
    case '#8b5cf6': return { icon: '{}', typeLabel: 'Object' };
    case '#6366f1': return { icon: '⚡', typeLabel: 'Key' };
    case '#10b981': return { icon: '[]', typeLabel: 'Array' };
    case '#f59e0b': return { icon: '✦', typeLabel: 'Value' };
    case '#ef4444': return { icon: '🔍', typeLabel: 'Match' };
    default:        return { icon: '·', typeLabel: 'Node' };
  }
}

function JsonVisNode({ data, targetPosition, sourcePosition }) {
    const nodeColor = data.color || '#3b82f6';
    const isHighlighted = data.isHighlighted || false;
    const isObjectLabel = typeof data.label === 'object';
    const { icon, typeLabel } = getNodeMeta(data);

    const [tooltipData, setTooltipData] = useState(null);
    const [copied, setCopied] = useState(false);
    const copiedTimeoutRef = useRef(null);

    const copyToClipboard = useCallback(async (text) => {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }, []);

    const handleMouseEnter = useCallback((event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const nodePath = data.path || '';
        const nodeValue = data.value !== data.path ? data.value : undefined;
        if (nodePath) {
            setTooltipData({
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY - 52,
                path: nodePath,
                value: nodeValue
            });
        }
    }, [data]);

    const handleMouseLeave = useCallback(() => {
        setTooltipData(null);
    }, []);

    useEffect(() => {
        return () => {
            if (copiedTimeoutRef.current) {
                window.clearTimeout(copiedTimeoutRef.current);
            }
        };
    }, []);

    const handleCopyPath = useCallback(async (event) => {
        event.stopPropagation();
        if (!data.path) return;
        try {
            await copyToClipboard(data.path);
            setCopied(true);
            if (copiedTimeoutRef.current) {
                window.clearTimeout(copiedTimeoutRef.current);
            }
            copiedTimeoutRef.current = window.setTimeout(() => {
                setCopied(false);
            }, 1400);
        } catch (error) {
            console.error('Failed to copy path:', error);
        }
    }, [copyToClipboard, data.path]);

    // Derive a lighter accent for the glow / border
    const glowColor = isHighlighted
        ? 'rgba(239,68,68,0.55)'
        : nodeColor + '55';

    const nodeStyle = {
        position: 'relative',
        backgroundColor: isHighlighted
            ? 'rgba(239,68,68,0.12)'
            : 'rgba(15,15,20,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#f1f5f9',
        padding: '0',
        borderRadius: '12px',
        minWidth: '120px',
        maxWidth: '240px',
        border: `1.5px solid ${isHighlighted ? '#ef4444' : nodeColor + '80'}`,
        boxShadow: isHighlighted
            ? `0 0 0 3px rgba(239,68,68,0.25), 0 8px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`
            : `0 4px 20px rgba(0,0,0,0.45), 0 0 0 0.5px ${nodeColor}30, inset 0 1px 0 rgba(255,255,255,0.06)`,
        transform: isHighlighted ? 'scale(1.06)' : 'scale(1)',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'copy',
        overflow: 'hidden',
    };

    return (
        <>
            <Handle type="target" position={targetPosition} style={{ opacity: 0, pointerEvents: 'none' }} />

            <div
                style={nodeStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleCopyPath}
                title={`Copy path: ${data.path || '$'}`}
            >
                {/* Top accent strip */}
                <div style={{
                    height: '3px',
                    background: `linear-gradient(90deg, ${nodeColor}, ${nodeColor}88)`,
                    borderRadius: '12px 12px 0 0',
                }} />

                {/* Header row: type badge + icon */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px 4px',
                    gap: '6px',
                }}>
                    <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: nodeColor,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        backgroundColor: nodeColor + '22',
                        border: `1px solid ${nodeColor}44`,
                        flexShrink: 0,
                    }}>
                        {typeLabel}
                    </span>
                    <span style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.35)',
                        fontFamily: 'monospace',
                        fontWeight: '700',
                    }}>
                        {icon}
                    </span>
                </div>

                {/* Node content */}
                <div style={{ padding: '2px 10px 9px' }}>
                    {isObjectLabel ? (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {Object.entries(data.label).map(([key, value], index) => (
                                <li key={index} style={{
                                    display: 'flex',
                                    gap: '4px',
                                    alignItems: 'baseline',
                                    marginBottom: '3px',
                                    fontSize: '12px',
                                    lineHeight: '1.5',
                                }}>
                                    <span style={{
                                        color: nodeColor,
                                        fontWeight: '600',
                                        fontFamily: 'monospace',
                                        flexShrink: 0,
                                    }}>
                                        {key}:
                                    </span>
                                    <span style={{
                                        color: '#e2e8f0',
                                        fontFamily: 'monospace',
                                        wordBreak: 'break-all',
                                    }}>
                                        {String(value)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{
                            fontWeight: '600',
                            textAlign: 'center',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            color: copied ? '#34d399' : '#f1f5f9',
                            letterSpacing: '0.01em',
                            transition: 'color 0.2s',
                            wordBreak: 'break-word',
                        }}>
                            {copied ? '✓ Copied' : String(data.label ?? '')}
                        </div>
                    )}
                </div>

                {/* Subtle inner glow overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '12px',
                    background: `radial-gradient(ellipse at 50% 0%, ${nodeColor}18 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />
            </div>

            <Handle type="source" position={sourcePosition} style={{ opacity: 0, pointerEvents: 'none' }} />

            {tooltipData && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        left: `${tooltipData.x}px`,
                        top: `${tooltipData.y}px`,
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(10,10,18,0.95)',
                        color: '#f1f5f9',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        zIndex: 10000,
                        maxWidth: '320px',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                >
                    <div style={{
                        color: '#34d399',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: '600',
                        marginBottom: tooltipData.value !== undefined ? '4px' : 0,
                    }}>
                        {tooltipData.path}
                    </div>
                    {tooltipData.value !== undefined && (
                        <div style={{
                            color: '#94a3b8',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            wordBreak: 'break-word',
                        }}>
                            {typeof tooltipData.value === 'object'
                                ? JSON.stringify(tooltipData.value, null, 2)
                                : String(tooltipData.value)
                            }
                        </div>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}

export default JsonVisNode;
