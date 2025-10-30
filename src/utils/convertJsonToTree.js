import { nanoid } from "nanoid";

const jsonToTree = (data, key, parentId) => {
  const node = {
    id: nanoid(),
    key: key,
    value: key, 
    position: { x: 0, y: 0 },
    parentId: parentId,
    children: [],
  };

  if (data === null) {
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
    //array
    data.forEach((item, index) => {
      const childNode = jsonToTree(item, index.toString(), node.id);
      node.children.push(childNode);
    });
  } else {
    //object
    Object.entries(data).forEach(([childKey, childValue]) => {
      const childNode = jsonToTree(childValue, childKey, node.id);
      node.children.push(childNode);
    });
  }

  return node;
};

function convertJsonToTree(json) {
  const rootNode = {
    id: nanoid(),
    key: "root",
    value: "root",
    position: { x: 0, y: 0 },
    parentId: null,
    children: [],
  };

  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    Object.entries(json).forEach(([key, value]) => {
      const childNode = jsonToTree(value, key, rootNode.id);
      rootNode.children.push(childNode);
    });
  } else {

    return jsonToTree(json, "root", null);
  }

  return rootNode;
}

export default convertJsonToTree;