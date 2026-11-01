// The comments of the comment commands and of a new application: templates/comments/NAME.md.
// Change a template to change the comment (see templates/comments/README.md). In a template:
//   {{name}}               a value (nothing when it is empty)
//   {{#name}}...{{/name}}  shown only when the value is not empty
//   {{^name}}...{{/name}}  shown only when the value is empty
//   <!-- ... -->           at the top: a note for you, not in the comment
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "../../templates/comments");

// The text of a template with the values (pure: text in, text out)
function fill(text, values = {}) {
  const has = k => values[k] !== undefined && values[k] !== null && String(values[k]).trim() !== "";
  return text
    .replace(/^\s*<!--[\s\S]*?-->\s*\n/, "")
    .replace(/\{\{([#^])(\w+)\}\}([\s\S]*?)\{\{\/\2\}\}/g, (_, kind, k, inner) => (kind === "#") === has(k) ? inner : "")
    // (one pass: a {{...}} in a value stays as it is)
    .replace(/\{\{(\w+)\}\}/g, (_, k) => has(k) ? String(values[k]).trim() : "")
    // (an empty section leaves blank lines)
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n")
    .trim();
}

// The comment NAME with the values
const comment = (name, values) => fill(fs.readFileSync(path.join(DIR, `${name}.md`), "utf8"), values);

// The parts of your comment after the command, as one value
const notes = (...parts) => parts.map(p => (p || "").trim()).filter(Boolean).join("\n\n");

module.exports = { DIR, fill, comment, notes };
