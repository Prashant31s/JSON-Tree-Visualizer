'use client'; 

import { applyEdgeChanges, applyNodeChanges } from 'reactflow';
import { create } from 'zustand';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 0 },
  needToRenderJson: {
    websiteName: 'Shopify',
    categories: [
      {
        id: 1,
        name: 'Electronics',
        products: [
          {
            id: 101,
            name: 'Smartphone',
            brand: 'Apple',
            price: 999.99,
            reviews: [
              { id: 1001, rating: 4.5, comment: 'Great phone!' },
              { id: 1002, rating: 5, comment: 'Best smartphone ever!' },
            ],
          },
          {
            id: 102,
            name: 'Laptop',
            brand: 'Dell',
            price: 1299.99,
            reviews: [
              { id: 1003, rating: 4, comment: 'Good performance, but heavy.' },
              { id: 1004, rating: 5, comment: 'Excellent laptop for work.' },
            ],
          },
        ],
      },
      {
        id: 2,
        name: 'Clothing',
        products: [
          { id: 201, name: 'T-Shirt', brand: 'Nike', price: 29.99, reviews: [] },
          {
            id: 202,
            name: "Jeans",
            brand: "Levi's",
            price: 59.99,
            reviews: [{ id: 1005, rating: 4.5, comment: 'Comfortable and stylish.' }],
          },
        ],
      },
    ],
  },
  
  // Search and view controls state
  treeData: null,
  searchPath: '',
  highlightedNodeIds: [],
  searchResults: [],
  focusedNode: null, // null or { id: string, path: string, treeNode: object }
  maxDepth: Infinity, // Infinity | 1 | 2 | 3

  // Handlers
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  setNodes: (nodes) => set({ nodes: [...nodes] }),
  setEdges: (edges) => set({ edges: [...edges] }),
  setNeedToRenderJson: (json) => {
    console.log(json);
    set({ 
      nodes: [], 
      edges: [], 
      needToRenderJson: { ...json },
      searchPath: '',
      highlightedNodeIds: [],
      searchResults: [],
      treeData: null,
      focusedNode: null,
      maxDepth: Infinity,
    });
  },
  
  setTreeData: (tree) => set({ treeData: tree }),
  setSearchPath: (path) => set({ searchPath: path }),
  setHighlightedNodeIds: (ids) => set({ highlightedNodeIds: ids }),
  setSearchResults: (results) => set({ searchResults: results }),
  setFocusedNode: (focusedNode) => set({ focusedNode }),
  setMaxDepth: (maxDepth) => set({ maxDepth }),
}));

export default useStore;