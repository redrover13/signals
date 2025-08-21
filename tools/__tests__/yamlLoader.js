/**
 * YAML loader that prefers 'yaml' or 'js-yaml' if available.
 * Falls back to a robust minimal parser sufficient for cloudbuild.yaml structures.
 */
const fs = require('fs');

let parseYaml = null;
try {
  // Prefer 'yaml' package if installed
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  parseYaml = require('yaml').parse;
} catch (_) {
  try {
    // Fallback to 'js-yaml' if installed
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    parseYaml = require('js-yaml').load;
  } catch (__){
    parseYaml = null;
  }
}

/**
 * Remove matching surrounding single or double quotes from a string.
 *
 * Trims whitespace, and if the trimmed value starts and ends with the same
 * quote character (' or "), returns the inner content. If the input is falsy
 * (e.g., null, undefined, empty string) the original value is returned.
 *
 * @param {string|null|undefined} s - Input string that may be quoted.
 * @return {string|null|undefined} The trimmed, unquoted string, or the original falsy value.
 */
function unquote(s) {
  if (!s) return s;
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * Convert a trimmed YAML scalar token into a JS boolean, null, or string.
 *
 * Recognizes the literals "true" -> true, "false" -> false, and "null" or "~" -> null.
 * All other values are returned as an unquoted string (numbers remain strings to avoid coercion).
 *
 * @param {string} val - The scalar text to parse (may contain surrounding quotes or whitespace).
 * @return {boolean|null|string} The parsed JavaScript value.
 */
function parseScalar(val) {
  let v = val.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  // Keep numbers as strings to avoid accidental coercion (e.g., tags)
  return unquote(v);
}

/**
 * Parse a simple YAML flow sequence (e.g. `[a, "b,c", 'd']`) into an array of scalar values.
 *
 * Accepts a string (or value coerced to string). If the input is not a bracketed flow
 * sequence, returns an array containing the parsed scalar of the whole input. When parsing
 * a bracketed sequence, preserves quoted items (single or double quotes), supports backslash
 * escapes inside items, and splits on commas that are not inside quotes.
 *
 * @param {string|any} text - The text to parse as a flow sequence or scalar.
 * @returns {Array<null|boolean|string>} An array of parsed scalar values (null, booleans, or strings).
 */
function parseFlowSeq(text) {
  // Parse simple flow sequence: ['a', 'b', 'c']
  let s = String(text).trim();
  if (!(s.startsWith('[') && s.endsWith(']'))) return [parseScalar(s)];
  s = s.slice(1, -1);
  const items = [];
  let cur = '';
  let inSingle = false, inDouble = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) {
      cur += ch;
      esc = false;
      continue;
    }
    if (ch === '\\') {
      esc = true;
      continue;
    }
    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      cur += ch;
      continue;
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble;
      cur += ch;
      continue;
    }
    if (!inSingle && !inDouble && ch === ',') {
      if (cur.trim().length) items.push(parseScalar(cur));
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim().length) items.push(parseScalar(cur));
  return items;
}

/**
 * Parse a small subset of YAML into a JavaScript object using a lightweight, indentation-based parser.
 *
 * This fallback parser handles common cloudbuild.yaml-like structures: nested mappings, block lists (lines starting with `- `),
 * simple inline flow sequences (bracketed `[a, b]`) and scalar values (`true`, `false`, `null`, `~`, or quoted strings).
 * It is intentionally small and permissive—suitable when a full YAML library is unavailable or when only basic YAML features are needed.
 *
 * @param {string} yamlText - YAML document text to parse.
 * @return {Object} Parsed representation as plain JavaScript objects and arrays.
 */
function basicYamlParse(yamlText) {
  const lines = yamlText.split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, node: root, parent: null, key: null }];

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '    ');
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = line.match(/^ */)[0].length;

    while (stack.length && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const ctx = stack[stack.length - 1];

    if (trimmed.startsWith('- ')) {
      // Ensure current node is an array
      if (!Array.isArray(ctx.node)) {
        if (ctx.parent && ctx.key !== null) {
          // Convert placeholder object from previous "key:" into a list
          ctx.parent.node[ctx.key] = [];
          ctx.node = ctx.parent.node[ctx.key];
        } else {
          // Unexpected list item; skip safely
          continue;
        }
      }
      const content = trimmed.slice(2);
      if (content.includes(':')) {
        const colonIdx = content.indexOf(':');
        const k = content.slice(0, colonIdx).trim();
        const rest = content.slice(colonIdx + 1).trim();
        const item = {};
        if (rest.length) {
          if (rest.startsWith('[') && rest.endsWith(']')) {
            item[k] = parseFlowSeq(rest);
          } else {
            item[k] = parseScalar(rest);
          }
        } else {
          item[k] = {};
        }
        ctx.node.push(item);
        // Nested continuation for this list item
        stack.push({ indent, node: item, parent: ctx, key: null });
      } else {
        // Scalar list item
        ctx.node.push(parseScalar(content));
      }
      continue;
    }

    // Mapping entry
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const valStr = line.slice(colonIdx + 1).trim();

    if (valStr === '') {
      // Start of nested object or list (placeholder object which we may convert to list later)
      const obj = {};
      if (Array.isArray(ctx.node)) {
        const item = {};
        item[key] = obj;
        ctx.node.push(item);
        stack.push({ indent, node: obj, parent: stack[stack.length - 1], key });
      } else {
        ctx.node[key] = obj;
        stack.push({ indent, node: obj, parent: ctx, key });
      }
    } else {
      // Scalar or flow sequence on same line
      const value = (valStr.startsWith('[') && valStr.endsWith(']')) ? parseFlowSeq(valStr) : parseScalar(valStr);
      if (Array.isArray(ctx.node)) {
        const item = {};
        item[key] = value;
        ctx.node.push(item);
      } else {
        ctx.node[key] = value;
      }
    }
  }

  return root;
}

/**
 * Load and parse a YAML file from disk, preferring an installed YAML library and falling back to a minimal built-in parser.
 *
 * Attempts to parse the file contents with the external `parseYaml` implementation (if available). If that parser throws
 * an error that appears to be a YAML syntax/parse error, this function falls back to the internal `basicYamlParse`.
 * Non-syntax errors thrown by the external parser are rethrown.
 *
 * @param {string} path - Filesystem path to the YAML file.
 * @return {any} The parsed YAML structure (objects/arrays/primitives).
 * @throws {*} Rethrows any non-syntax error raised by the external parser.
 */
function loadYamlFile(path) {
  const text = fs.readFileSync(path, 'utf8');
  if (parseYaml) {
    try {
      return parseYaml(text);
    } catch (err) {
      const name = String(err && err.name || '');
      const msg = String(err && (err.message || err.reason) || '');
      const isSyntax = /YAML|Parse|Syntax/i.test(name) || /unexpected|bad indentation|mapping values|flow sequence|end of/i.test(msg);
      if (!isSyntax) {
        throw err;
      }
      // fall through to basic parser only for likely syntax errors
    }
  }
  return basicYamlParse(text);
}

module.exports = { loadYamlFile };