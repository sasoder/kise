"""Split the four track items of a one-clip-per-track sequence into KEEP segments (same media, so handles stay).
usage: cut_prproj.py in.xml out.xml '[[f0,f1],...]'   frames at 23.976 in sequence time."""
import re, sys, json, uuid
TPF = 10594584000  # ticks per 23.976 frame
src = open(sys.argv[1], encoding='utf-8').read()
keeps = json.loads(sys.argv[3])

def block(oid):
    m = re.search(r'\t<(\w+) ObjectID="%d" .*?\n\t</\1>\n' % oid, src, re.S)
    assert m, oid
    return m.group(0)
def ref(txt, tag):
    return int(re.search(r'<%s ObjectRef="(\d+)"/>' % tag, txt).group(1))

next_id = [max(int(x) for x in re.findall(r'ObjectID="(\d+)"', src)) + 1]
def nid():
    next_id[0] += 1; return next_id[0] - 1
def reid(txt, new):
    return re.sub(r'ObjectID="\d+"', 'ObjectID="%d"' % new, txt, count=1)

links = [(int(a), int(b)) for a, b in re.findall(
    r'<Link ObjectID="\d+".*?<TrackItem Index="0" ObjectRef="(\d+)"/>\s*<TrackItem Index="1" ObjectRef="(\d+)"/>', src, re.S)]
link_ids = [int(x) for x in re.findall(r'<Link Index="\d+" ObjectRef="(\d+)"/>', src)]
link_tpl = block(link_ids[0])
assert len(links) == 2 and len(link_ids) == 2

new_objs, remove, track_lists, new_links = [], [], {}, []
for pair in links:
    made = {}
    for item in pair:
        ti = block(item); chain_id = ref(ti, 'Components'); sub_id = ref(ti, 'SubClip')
        chain = block(chain_id); sub = block(sub_id); clip_id = ref(sub, 'Clip'); clip = block(clip_id)
        assert 'ObjectRef' not in chain, 'component chain is not default'
        sec_ids = [int(x) for x in re.findall(r'<SecondaryContentItem Index="\d+" ObjectRef="(\d+)"/>', clip)]
        base_in = int(re.search(r'<InPoint>(\d+)</InPoint>', clip).group(1))
        remove += [ti, chain, sub, clip] + [block(s) for s in sec_ids]
        ids = []
        for f0, f1 in keeps:
            t_id, c_id, s_id, k_id = nid(), nid(), nid(), nid()
            k = reid(clip, k_id)
            k = re.sub(r'<ClipID>[^<]*</ClipID>', '<ClipID>%s</ClipID>' % uuid.uuid4(), k)
            k = re.sub(r'<InPoint>\d+</InPoint>', '<InPoint>%d</InPoint>' % (base_in + f0 * TPF), k)
            k = re.sub(r'<OutPoint>\d+</OutPoint>', '<OutPoint>%d</OutPoint>' % (base_in + f1 * TPF), k)
            for s in sec_ids:
                n = nid(); new_objs.append(reid(block(s), n))
                k = k.replace('ObjectRef="%d"/>' % s, 'ObjectRef="%d"/>' % n)
            s_ = reid(sub, s_id).replace('<Clip ObjectRef="%d"/>' % clip_id, '<Clip ObjectRef="%d"/>' % k_id)
            t = reid(ti, t_id).replace('<Components ObjectRef="%d"/>' % chain_id, '<Components ObjectRef="%d"/>' % c_id)
            t = t.replace('<SubClip ObjectRef="%d"/>' % sub_id, '<SubClip ObjectRef="%d"/>' % s_id)
            ids.append(t_id)
            new_objs += [t, reid(chain, c_id), s_, k]
        # timeline positions, back to back
        pos = 0
        for (f0, f1), t_id in zip(keeps, ids):
            i = next(n for n, o in enumerate(new_objs) if 'ObjectID="%d"' % t_id in o.split('\n', 1)[0])
            start = ('<Start>%d</Start>\n\t\t\t\t' % (pos * TPF)) if pos else ''
            new_objs[i] = re.sub(r'<End>\d+</End>', '%s<End>%d</End>' % (start, (pos + f1 - f0) * TPF), new_objs[i])
            if '<ID>' in new_objs[i]:
                new_objs[i] = re.sub(r'<ID>[^<]*</ID>', '<ID>%s</ID>' % uuid.uuid4(), new_objs[i])
            pos += f1 - f0
        made[item] = ids
        track_lists[item] = ids
    for v, a in zip(made[pair[0]], made[pair[1]]):
        l = nid()
        t = reid(link_tpl, l)
        t = re.sub(r'<TrackItem Index="0" ObjectRef="\d+"/>', '<TrackItem Index="0" ObjectRef="%d"/>' % v, t)
        t = re.sub(r'<TrackItem Index="1" ObjectRef="\d+"/>', '<TrackItem Index="1" ObjectRef="%d"/>' % a, t)
        new_objs.append(t); new_links.append(l)
total = sum(b - a for a, b in keeps) * TPF
out = src
old_dur = re.search(r'<MZ.OutPoint>(\d+)</MZ.OutPoint>', src).group(1)
for l in link_ids: remove.append(block(l))
for r in remove:
    assert out.count(r) == 1; out = out.replace(r, '')
# sequence link list
m = re.search(r'(<Links Version="1">\n)(.*?)(\t*</Links>)', out, re.S)
ind = re.match(r'\s*', m.group(2)).group(0)
out = out[:m.start(2)] + ''.join('%s<Link Index="%d" ObjectRef="%d"/>\n' % (ind, i, l) for i, l in enumerate(new_links)) + out[m.end(2):]
# track item lists
for item, ids in track_lists.items():
    pat = re.compile(r'([ \t]*)<TrackItem Index="0" ObjectRef="%d"/>\n' % item)
    assert len(pat.findall(out)) == 1
    out = pat.sub(lambda m: ''.join('%s<TrackItem Index="%d" ObjectRef="%d"/>\n' % (m.group(1), i, t) for i, t in enumerate(ids)), out)
out = out.replace(old_dur, str(total))
out = re.sub(r'<MZ.EditLine>\d+</MZ.EditLine>', '<MZ.EditLine>0</MZ.EditLine>', out)
i = out.rindex('</PremiereData>')
out = out[:i] + ''.join(new_objs) + out[i:]
open(sys.argv[2], 'w', encoding='utf-8').write(out)
print('segments', len(keeps), 'new duration s', total / 254016000000, 'frames', total // TPF)
