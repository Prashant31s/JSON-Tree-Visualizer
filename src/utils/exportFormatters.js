/**
 * Utility functions for exporting JSON into various structured formats.
 */

// Helper to escape XML special characters
function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to clean key names for XML tag compliance
function sanitizeXmlTag(key) {
  if (!key) return 'item';
  let tag = String(key).replace(/[^a-zA-Z0-9_\-]/g, '_');
  if (/^[0-9]/.test(tag)) {
    tag = 'item_' + tag;
  }
  return tag || 'item';
}

/**
 * Convert data to Formatted / Minified JSON
 */
export function exportToJson(data, options = {}) {
  const { indent = 2, minified = false } = options;
  if (minified) {
    return JSON.stringify(data);
  }
  const spaces = typeof indent === 'number' ? indent : 2;
  return JSON.stringify(data, null, spaces);
}

/**
 * Convert data to YAML string
 */
export function exportToYaml(data, options = {}) {
  const indentSize = typeof options.indent === 'number' ? options.indent : 2;

  function stringifyYaml(val, depth = 0) {
    const indent = ' '.repeat(depth * indentSize);

    if (val === null || val === undefined) {
      return 'null';
    }

    if (typeof val === 'boolean' || typeof val === 'number') {
      return String(val);
    }

    if (typeof val === 'string') {
      if (val === '' || /[ \n:\-\[\]\{\}#&*!|>'"%@`]/.test(val) || val.toLowerCase() === 'true' || val.toLowerCase() === 'false' || val.toLowerCase() === 'null') {
        return JSON.stringify(val);
      }
      return val;
    }

    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      return val
        .map((item) => {
          if (item !== null && typeof item === 'object') {
            const itemYaml = stringifyYaml(item, depth + 1);
            const trimmed = itemYaml.trimStart();
            return `${indent}- ${trimmed}`;
          }
          return `${indent}- ${stringifyYaml(item, depth + 1)}`;
        })
        .join('\n');
    }

    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) return '{}';
      return keys
        .map((key) => {
          const formattedKey = /[:#\s]/.test(key) ? JSON.stringify(key) : key;
          const childVal = val[key];
          if (childVal !== null && typeof childVal === 'object') {
            if (Array.isArray(childVal) && childVal.length === 0) {
              return `${indent}${formattedKey}: []`;
            }
            if (!Array.isArray(childVal) && Object.keys(childVal).length === 0) {
              return `${indent}${formattedKey}: {}`;
            }
            return `${indent}${formattedKey}:\n${stringifyYaml(childVal, depth + 1)}`;
          }
          return `${indent}${formattedKey}: ${stringifyYaml(childVal, depth + 1)}`;
        })
        .join('\n');
    }

    return String(val);
  }

  return stringifyYaml(data, 0);
}

/**
 * Helper to flatten an object for CSV representation
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (obj[k] !== null && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else if (Array.isArray(obj[k])) {
      acc[pre + k] = JSON.stringify(obj[k]);
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

/**
 * Convert data to CSV format
 */
export function exportToCsv(data) {
  if (data === null || data === undefined) return '';

  let rows = [];

  if (Array.isArray(data)) {
    if (data.length === 0) return '';

    const isPrimitiveArray = data.every(
      (item) => item === null || typeof item !== 'object'
    );

    if (isPrimitiveArray) {
      rows.push(['Value']);
      data.forEach((item) => rows.push([item]));
    } else {
      const flattenedData = data.map((item) =>
        item && typeof item === 'object' ? flattenObject(item) : { Value: item }
      );
      
      const allHeaders = Array.from(
        new Set(flattenedData.flatMap((item) => Object.keys(item)))
      );
      
      rows.push(allHeaders);
      
      flattenedData.forEach((item) => {
        const row = allHeaders.map((header) => {
          const val = item[header];
          return val === undefined ? '' : val;
        });
        rows.push(row);
      });
    }
  } else if (typeof data === 'object') {
    const flattened = flattenObject(data);
    rows.push(['Key', 'Value']);
    Object.entries(flattened).forEach(([k, v]) => {
      rows.push([k, v === null ? 'null' : v]);
    });
  } else {
    rows.push(['Value']);
    rows.push([data]);
  }

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = cell === null || cell === undefined ? '' : String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Convert data to XML format
 */
export function exportToXml(data, options = {}) {
  const rootName = sanitizeXmlTag(options.rootName || 'root');
  const indentSize = typeof options.indent === 'number' ? options.indent : 2;

  function toXml(val, tagName, depth = 1) {
    const indent = ' '.repeat(depth * indentSize);
    const tag = sanitizeXmlTag(tagName);

    if (val === null || val === undefined) {
      return `${indent}<${tag}/>`;
    }

    if (typeof val !== 'object') {
      return `${indent}<${tag}>${escapeXml(val)}</${tag}>`;
    }

    if (Array.isArray(val)) {
      if (val.length === 0) return `${indent}<${tag}/>`;
      const itemTag = tag.endsWith('s') ? tag.slice(0, -1) : `${tag}_item`;
      const itemsXml = val.map((item) => toXml(item, itemTag, depth + 1)).join('\n');
      return `${indent}<${tag}>\n${itemsXml}\n${indent}</${tag}>`;
    }

    const keys = Object.keys(val);
    if (keys.length === 0) {
      return `${indent}<${tag}/>`;
    }

    const childrenXml = keys
      .map((key) => toXml(val[key], key, depth + 1))
      .join('\n');
    return `${indent}<${tag}>\n${childrenXml}\n${indent}</${tag}>`;
  }

  const content = toXml(data, rootName, 1);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${content.slice(
    content.indexOf('\n') + 1
  )}`;
}

/**
 * Convert data to JSON Lines / NDJSON
 */
export function exportToJsonLines(data) {
  if (Array.isArray(data)) {
    return data.map((item) => JSON.stringify(item)).join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([k, v]) => JSON.stringify({ [k]: v }))
      .join('\n');
  }

  return JSON.stringify(data);
}

/**
 * Triggers browser download for formatted string
 */
export function downloadFormattedFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies text to clipboard with fallback
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    document.body.removeChild(textArea);
    return false;
  }
}
