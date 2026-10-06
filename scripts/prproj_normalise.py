"""Normalise a .prproj that another (ElementTree-based) tool re-serialised, back to Premiere's own layout, so that
scripts/prproj_assemble.py's block splitter and text edits work. Whitespace-only changes between tags; the parsed
tree is compared before/after."""
import gzip, re, sys
import xml.etree.ElementTree as ET
src, out = sys.argv[1], sys.argv[2]
raw = open(src, "rb").read()
x = (gzip.decompress(raw) if raw[:2] == b"\x1f\x8b" else raw).decode("utf-8")
y = x.replace('" />', '"/>')
y = re.sub(r'(\t*)(<Item [^>]*/>)</Items>\n(\t*)</', lambda m: f"{m.group(1)}{m.group(2)}\n{m.group(3)}\t</Items>\n{m.group(3)}</", y)
lines, res, cur = y.split("\n"), [], None
for l in lines:
    m = re.match(r"\t<(\w+)[ >]", l)
    if cur is None:
        if m and not (re.match(r"\t<[^>]*/>\s*$", l) or re.match(r"\t<(\w+)[^>]*>.*</\1>\s*$", l)):
            cur = m.group(1)
        res.append(l)
        continue
    if l.startswith("\t</" + cur + ">"):
        cur = None
        res.append(l)
        continue
    if l.endswith("</" + cur + ">") and re.match(r"\t<[A-Za-z]", l):      # children + the block's closer on one line
        body = l[1:-len("</" + cur + ">")]
        for part in re.findall(r"<(\w[\w.]*)[^>]*?(?:/>|>.*?</\1>)", body):
            pass
        parts = [mm.group(0) for mm in re.finditer(r"<(\w[\w.]*)[^>]*?(?:/>|>[^<]*</\1>)", body)]
        assert "".join(parts) == body, body[:200]
        res += ["\t\t" + p for p in parts] + ["\t</" + cur + ">"]
        cur = None
        continue
    res.append(l)
y = "\n".join(res)
y = re.sub(r"\n\t</PremiereData>\s*$", "\n</PremiereData>\n", y)
a, b = ET.fromstring(x.encode()), ET.fromstring(y.encode())
def strip(e):
    for n in e.iter():
        if n.text and not n.text.strip(): n.text = None
        if n.tail and not n.tail.strip(): n.tail = None
    return ET.tostring(e)
assert strip(a) == strip(b), "tree changed"
gzip.open(out, "wb").write(y.encode("utf-8"))
print("normalised; tree identical apart from whitespace between tags")
