import { nanoid } from "nanoid";
import { getNodePath } from './jsonPathMatcher';

let nodes = [];
let edges = [];

function getNodeTypeAndColor(node, isHighlighted = false) {
  
  if (isHighlighted) {
    return { type: 'highlighted', color: '#ef4444' }; // Red for highlighted
  }
  
  if (node.children && node.children.length === 1 && !node.children[0].children?.length) {
    return { type: 'key', color: '#6366f1' };
  }
  
  if (!node.children || node.children.length === 0) {
    const value = node.value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return { type: 'primitive', color: '#f59e0b' };
    }
  }
  
  if (node.key && /^\d+$/.test(node.key)) {
    return { type: 'array-index', color: '#10b981' };
  }
  
  if (node.children && node.children.length > 0) {
    const hasNumericChildren = node.children.some(child => /^\d+$/.test(child.key));
    if (hasNumericChildren) {
      return { type: 'array', color: '#10b981' };
    }
  }
  
  return { type: 'object', color: '#8b5cf6' };
}

function addRootNode(node, highlightedIds = []) {
  const isHighlighted = highlightedIds.includes(node.id);
  const { color } = getNodeTypeAndColor(node, isHighlighted);
  
  const nodePath = getNodePath(node, nodes);
  const newNode = {
    id: node.id,
    data: { 
      label: node.value,
      path: nodePath.join('.'),
      value: node.value,
      color: isHighlighted ? color : '#3b82f6',
      isHighlighted
    },
    position: { x: 0, y: 0 },
    type: 'jsonVis',
  };

  nodes = [...nodes, newNode];
}

function addChildNode(node, parentNode, highlightedIds = []) {
  const isHighlighted = highlightedIds.includes(node.id);
  const { color } = getNodeTypeAndColor(node, isHighlighted);
  
  const nodePath = getNodePath(node, nodes);
  const newNode = {
    id: node.id,
    data: {
      label: typeof node.value === "string" || typeof node.value === "number" || typeof node.value === "boolean"
        ? node.value
        : node.value,
      path: nodePath.join('.'),
      value: node.value,
      color: color,
      isHighlighted
    },
    type: 'jsonVis',
    position: { x: 0, y: 0 },
    parent: parentNode.id,
  };
  
  const newEdge = {
    id: nanoid(),
    source: `${parentNode.id}`,
    target: `${node.id}`,
    animated: isHighlighted,
    style: isHighlighted ? { stroke: '#ef4444', strokeWidth: 2 } : {}
  };

  nodes = [...nodes, newNode];
  edges = [...edges, newEdge];
}

function traverseNodeChild(arrayOfNode, parentNode, highlightedIds = []) {
  if (arrayOfNode.length <= 0) {
    return;
  }
  arrayOfNode.forEach((node) => {
    addChildNode(node, parentNode, highlightedIds);
    if (node.children && node.children.length > 0) {
      traverseNodeChild(node.children, node, highlightedIds);
    }
  });
}

function convertTreeToNodes(nodeTree, isRoot = false, highlightedIds = []) {
  if (isRoot === true) {
    nodes = [];
    edges = [];
    addRootNode(nodeTree, highlightedIds);
    convertTreeToNodes(nodeTree, false, highlightedIds);
  } else {
    traverseNodeChild(nodeTree.children, nodeTree, highlightedIds);
  }

  return [nodes, edges];
}

export default convertTreeToNodes;