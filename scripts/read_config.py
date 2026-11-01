"""Reads config.yaml with no dependencies: only the part of YAML that the file uses.

The same rules as .github/scripts/config.js: "key: value", "key: [a, b]", and a list of maps
("- name: value" then "  other: value"). Comments start with #.
"""
import json, re
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / "config.yaml"


def _strip_comment(line):
    quote = None
    for i, c in enumerate(line):
        if quote:
            if c == quote and line[i - 1] != "\\":
                quote = None
        elif c in "\"'":
            quote = c
        elif c == "#" and (i == 0 or line[i - 1].isspace()):
            return line[:i]
    return line


def _split_list(text):
    parts, quote, cur = [], None, ""
    for c in text:
        if quote:
            if c == quote:
                quote = None
        elif c in "\"'":
            quote = c
        elif c == ",":
            parts.append(cur)
            cur = ""
            continue
        cur += c
    if cur.strip():
        parts.append(cur)
    return parts


def _scalar(text):
    s = text.strip()
    if s.startswith('"'):
        return json.loads(s)
    if s.startswith("'"):
        return s[1:-1].replace("''", "'")
    if s.startswith("["):
        return [_scalar(p) for p in _split_list(s[1:-1])]
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if s in ("true", "false"):
        return s == "true"
    if s in ("", "null", "~"):
        return None
    return s


def parse(text):
    out, lst, item = {}, None, None
    for n, raw in enumerate(text.splitlines(), 1):
        line = _strip_comment(raw).rstrip()
        if not line.strip():
            continue
        m = re.fullmatch(r"([A-Za-z_][\w-]*):(?:\s+(.*))?", line)
        if m:
            if m.group(2) is None:
                lst = out[m.group(1)] = []
                item = None
            else:
                out[m.group(1)] = _scalar(m.group(2))
                lst = item = None
            continue
        m = lst is not None and re.fullmatch(r"\s+-\s+([A-Za-z_][\w-]*):(?:\s+(.*))?", line)
        if m:
            item = {m.group(1): _scalar(m.group(2) or "")}
            lst.append(item)
            continue
        m = item is not None and re.fullmatch(r"\s+([A-Za-z_][\w-]*):(?:\s+(.*))?", line)
        if m:
            item[m.group(1)] = _scalar(m.group(2) or "")
            continue
        raise ValueError(f'config.yaml, line {n}: cannot read "{raw.strip()}"')
    return out


def load(path=FILE):
    return parse(Path(path).read_text(encoding="utf-8"))


if __name__ == "__main__":
    print(json.dumps(load(), indent=2, ensure_ascii=False))
