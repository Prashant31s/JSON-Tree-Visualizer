import { nanoid } from "nanoid";

const jsonToTree = (data, key, parentId) => {
  const node = {
    id: nanoid(),
    key: key,
    value: key, // Show the key name in the node
    position: { x: 0, y: 0 },
    parentId: parentId,
    children: [],
  };

  if (data === null) {
    // For null values, create a child node
    const valueNode = {
      id: nanoid(),
      key: "null",
      value: "null",
      position: { x: 0, y: 0 },
      parentId: node.id,
      children: [],
    };
    node.children.push(valueNode);
  } else if (typeof data !== "object") {
    // Primitive value (string, number, boolean)
    // Create a child node to display the actual value
    const valueNode = {
      id: nanoid(),
      key: String(data),
      value: data,
      position: { x: 0, y: 0 },
      parentId: node.id,
      children: [],
    };
    node.children.push(valueNode);
  } else if (Array.isArray(data)) {
    // Array - create children for each index
    data.forEach((item, index) => {
      const childNode = jsonToTree(item, index.toString(), node.id);
      node.children.push(childNode);
    });
  } else {
    // Object - create children for each property
    Object.entries(data).forEach(([childKey, childValue]) => {
      const childNode = jsonToTree(childValue, childKey, node.id);
      node.children.push(childNode);
    });
  }

  return node;
};

function convertJsonToTree(json) {
  // For the root, we need to handle it specially
  const rootNode = {
    id: nanoid(),
    key: "root",
    value: "root",
    position: { x: 0, y: 0 },
    parentId: null,
    children: [],
  };

  // If json is an object, add its properties as children
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    Object.entries(json).forEach(([key, value]) => {
      const childNode = jsonToTree(value, key, rootNode.id);
      rootNode.children.push(childNode);
    });
  } else {
    // If root is not an object, just convert it directly
    return jsonToTree(json, "root", null);
  }

  return rootNode;
}

export default convertJsonToTree;