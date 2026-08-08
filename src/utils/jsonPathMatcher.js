
export function parseJsonPath(path) {
  if (!path) return [];
  
  let cleanPath = path.trim();
  if (cleanPath.startsWith('$.')) {
    cleanPath = cleanPath.slice(2);
  } else if (cleanPath.startsWith('.')) {
    cleanPath = cleanPath.slice(1);
  }
  
  const parts = [];
  let current = '';
  let inBracket = false;
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < cleanPath.length; i++) {
    const char = cleanPath[i];
    
    if (char === '[' && !inQuote) {
      if (current) {
        parts.push(current);
        current = '';
      }
      inBracket = true;
    } else if (char === ']' && !inQuote && inBracket) {
      if (current) {
        // Remove quotes if present
        if ((current.startsWith('"') && current.endsWith('"')) ||
            (current.startsWith("'") && current.endsWith("'"))) {
          current = current.slice(1, -1);
        }
        parts.push(current);
        current = '';
      }
      inBracket = false;
    } else if ((char === '"' || char === "'") && inBracket) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
        quoteChar = '';
      }
      current += char;
    } else if (char === '.' && !inBracket && !inQuote) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    parts.push(current);
  }
  
  return parts;
}

export function formatJsonPath(pathParts) {
  if (!pathParts || pathParts.length === 0) return '$';

  return pathParts.reduce((path, part) => {
    if (/^\d+$/.test(part)) {
      return `${path}[${part}]`;
    }

    if (/^[A-Za-z_$][\w$]*$/.test(part)) {
      return `${path}.${part}`;
    }

    return `${path}[${JSON.stringify(part)}]`;
  }, '$');
}


//  Building the full path for a node by traversing up the tree

export function getNodePath(node, allNodes) {
  const path = [];
  let currentNode = node;
  
  while (currentNode && currentNode.key !== 'root') {
    path.unshift(currentNode.key);
    
    // Find parent node
    if (currentNode.parentId) {
      currentNode = allNodes.find(n => n.id === currentNode.parentId);
    } else {
      break;
    }
  }
  console.log("Node Path:", path);
  
  return path;
}


//   Checking if a node matches the search path

export function matchesPath(nodePath, searchParts) {
  if (searchParts.length === 0) return false;
  
  if (nodePath.length < searchParts.length) return false;
  
  for (let i = 0; i < searchParts.length; i++) {
    const searchPart = searchParts[i];
    const nodePart = nodePath[nodePath.length - searchParts.length + i];
    
    if (searchPart !== nodePart) {
      return false;
    }
  }
  
  return true;
}


//  Finding all nodes that match the search path

export function findNodesByPath(searchPath, treeRoot) {
  const searchParts = parseJsonPath(searchPath);
  if (searchParts.length === 0) return [];
  
  const allNodes = [];
  const matchingNodes = [];
  

  function collectNodes(node) {
    allNodes.push(node);
    if (node.children) {
      node.children.forEach(collectNodes);
    }
  }
  
  collectNodes(treeRoot);
  
  allNodes.forEach(node => {
    const nodePath = getNodePath(node, allNodes);
    if (matchesPath(nodePath, searchParts)) {
      matchingNodes.push({ node, path: nodePath });
    }
  });
  
  return matchingNodes;
}
