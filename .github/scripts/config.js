// Reads and changes config.yaml, with no dependencies: only the part of YAML that the file uses.
//   key: value             a string, a number, true/false, or "quoted" / 'quoted'
//   key: [a, b]            a list of values on one line
//   key:                   a list of maps, one "- name: value" line per map,
//     - name: value        then one "  other: value" line per field
//       other: value
// Comments start with # (at the start of a line, or after a space). scripts/read_config.py
// reads the file the same way for the Python scripts.
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../../config.yaml");

// The text without a comment at the end (a # inside quotes stays)
function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote && line[i - 1] !== "\\") quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}

// "a, 'b, c', d" -> ["a", "'b, c'", "d"]
function splitList(text) {
  const parts = [];
  let quote = null, cur = "";
  for (const c of text) {
    if (quote) { if (c === quote) quote = null; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === ",") { parts.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function scalar(text) {
  const s = text.trim();
  if (s.startsWith('"')) return JSON.parse(s);
  if (s.startsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
  if (s.startsWith("[")) return splitList(s.slice(1, -1)).map(scalar);
  if (/^-?\d+$/.test(s)) return Number(s);
  if (s === "true" || s === "false") return s === "true";
  if (s === "" || s === "null" || s === "~") return null;
  return s;
}

function parse(text) {
  const out = {};
  let list = null, item = null, m;
  text.split(/\r?\n/).forEach((raw, n) => {
    const line = stripComment(raw).replace(/\s+$/, "");
    if (!line.trim()) return;
    if ((m = line.match(/^([A-Za-z_][\w-]*):(?:\s+(.*))?$/))) {
      if (m[2] === undefined) { list = out[m[1]] = []; item = null; }
      else { out[m[1]] = scalar(m[2]); list = item = null; }
    } else if (list && (m = line.match(/^\s+-\s+([A-Za-z_][\w-]*):(?:\s+(.*))?$/))) {
      list.push(item = { [m[1]]: scalar(m[2] || "") });
    } else if (item && (m = line.match(/^\s+([A-Za-z_][\w-]*):(?:\s+(.*))?$/))) {
      item[m[1]] = scalar(m[2] || "");
    } else {
      throw new Error(`config.yaml, line ${n + 1}: cannot read "${raw.trim()}"`);
    }
  });
  return out;
}

const load = (file = FILE) => parse(fs.readFileSync(file, "utf8"));

// A value as YAML: quoted when it would read as something else (a number, a time, true, ...)
function yamlValue(v) {
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  const s = String(v);
  return /^[A-Za-z][\w ./()-]*$/.test(s) && !/^(true|false|null|yes|no|on|off)$/i.test(s) && !/ $/.test(s)
    ? s : JSON.stringify(s);
}

// Changes the "key: value" lines at the top level; the comments and the rest stay
function setValues(text, values) {
  for (const [key, value] of Object.entries(values)) {
    const re = new RegExp(`^${key}:.*$`, "m");
    if (!re.test(text)) throw new Error(`config.yaml has no "${key}:" line`);
    text = text.replace(re, () => `${key}: ${yamlValue(value)}`);
  }
  return text;
}

// The top-level settings of a newer config.yaml that a text does not have yet, added at the end
// with their comments: { text, added: ["newKey", ...] }. The values that the text has stay.
function addMissing(text, newer) {
  const have = parse(text);
  const added = [];
  const blocks = [];
  let comments = [], block = null;
  for (const line of newer.split("\n")) {
    const key = line.match(/^([A-Za-z_][\w-]*):/);
    if (key) {
      block = { key: key[1], lines: [...comments, line] };
      blocks.push(block);
      comments = [];
    } else if (block && /^(\s+\S|-)/.test(line)) block.lines.push(line);
    else {
      block = null;
      comments = /^#/.test(line) ? [...comments, line] : [];
    }
  }
  for (const b of blocks.filter(b => !(b.key in have))) {
    text = text.replace(/\n*$/, "\n\n") + b.lines.join("\n") + "\n";
    added.push(b.key);
  }
  return { text, added };
}

module.exports = { FILE, parse, load, setValues, yamlValue, addMissing };
