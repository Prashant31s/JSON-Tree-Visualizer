
import { Handle } from 'reactflow';
import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

function JsonVisNode({ data, targetPosition, sourcePosition }) {
    let str;
    if (typeof data.label !== 'object') {
        str = data.label;
    }
    
    const nodeColor = data.color || '#3b82f6';
    const isHighlighted = data.isHighlighted || false;
    
    const [tooltipData, setTooltipData] = useState(null);
    
    const handleMouseEnter = useCallback((event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const nodePath = data.path || '';
        
        const nodeValue = data.value !== data.path ? data.value : undefined;
        
        if (nodePath) {
            setTooltipData({
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY - 45,
                path: nodePath,
                value: nodeValue
            });
        }
    }, [data]);
    
    const handleMouseLeave = useCallback(() => {
        setTooltipData(null);
    }, []);
    
    return (
        <>
            <Handle type="target" position={targetPosition} />
            <div 
                className='jsonVisNode__label'
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    backgroundColor: nodeColor,
                    color: 'white',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    minWidth: '80px',
                    boxShadow: isHighlighted 
                        ? '0 0 0 3px rgba(239, 68, 68, 0.5), 0 4px 6px rgba(0,0,0,0.2)' 
                        : '0 2px 4px rgba(0,0,0,0.1)',
                    transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    border: isHighlighted ? '2px solid white' : 'none'
                }}
            >
                <ul style={{ 
                    margin: 0, 
                    padding: 0, 
                    listStyle: 'none',
                }}>
                    {
                        (typeof data.label === 'object') ?
                            Object.entries(data.label).map(([key, value], index) => (
                                <li key={index} style={{ marginBottom: '4px' }}>
                                    <span className="jsonVisNode__label__key">
                                        {key}:{' '}
                                    </span>
                                    <span>{String(value)}</span>
                                </li>
                            )) : (
                                <li style={{ 
                                    fontWeight: '500',
                                    textAlign: 'center' 
                                }}>
                                    {str}
                                </li>
                            )
                    }
                </ul>
            </div>
            <Handle type="source" position={sourcePosition} />
            
            {tooltipData && createPortal(
                <div 
                    className="node-tooltip"
                    style={{
                        left: `${tooltipData.x}px`,
                        top: `${tooltipData.y}px`,
                    }}
                >
                    <div className="node-tooltip__path">
                        {tooltipData.path}
                    </div>
                    {tooltipData.value && (
                        <div className="node-tooltip__value">
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