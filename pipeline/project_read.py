"""Read what is really on the video tracks of a .prproj (gzip XML) or an FCP7 XML. Stdlib only, read-only.

Adapted from the Edit Board thread's probe (/mnt/project-files/edit-board/proposals/extract_timeline.py).
Both readers return [{'name', 'fps', 'size', 'video': [[{'path', 'start', 'end', 'src_in', 'muted'}, ...], ...]}]
with times in seconds.
"""
import gzip, os, re, urllib.parse
import xml.etree.ElementTree as ET

TICKS = 254016000000  # Premiere ticks per second
GFX_EXT, IMG_EXT = {'.mov', '.mxf'}, {'.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp', '.psd'}


def kind_of(path, main_src):
    b = os.path.basename(path or '')
    ext = os.path.splitext(b)[1].lower()
    if main_src and b == os.path.basename(main_src):
        return 'source'
    if '/graphics/' in (path or '') or (ext in GFX_EXT and re.match(r'^\d+_[A-Za-z]', b)):
        return 'graphic'
    if ext in IMG_EXT:
        return 'image'
    return 'broll'  # cutaways like dwarkeshcam_si.mov, end cards like WatchHere.mp4


# ---------- .prproj ----------
def parse_prproj(path):
    root = ET.fromstring(gzip.open(path).read())
    by_id, by_uid = {}, {}
    for el in root:
        if 'ObjectID' in el.attrib: by_id[el.get('ObjectID')] = el
        if 'ObjectUID' in el.attrib: by_uid[el.get('ObjectUID')] = el
    def ref(e):
        if e is None: return None
        r = by_id.get(e.get('ObjectRef'))
        return r if r is not None else by_uid.get(e.get('ObjectURef'))

    def media_of(subclip):
        clip = ref(subclip.find('Clip'))
        src = ref(clip.find('Clip/Source'))
        media = ref(src.find('MediaSource/Media'))
        p = media.findtext('ActualMediaFilePath') or media.findtext('FilePath') or media.findtext('RelativePath')
        return p, int(clip.findtext('Clip/InPoint') or 0), int(clip.findtext('Clip/OutPoint') or 0)

    seqs = [e for e in root if e.tag == 'Sequence' and 'ObjectUID' in e.attrib]
    out = []
    for seq in seqs:
        s = {'name': seq.findtext('Name'), 'video': [], 'audio_tracks': 0, 'captions': 0}
        for tg in seq.findall('TrackGroups/TrackGroup'):
            g = ref(tg.find('Second'))
            if g.tag == 'VideoTrackGroup':
                fr = int(g.findtext('TrackGroup/FrameRate'))
                s['fps'] = round(TICKS / fr, 3)
                s['size'] = [int(x) for x in g.findtext('FrameRect').split(',')[2:]]
                for t in g.findall('TrackGroup/Tracks/Track'):
                    tr = by_uid[t.get('ObjectURef')]
                    items = []
                    for ti in tr.findall('ClipTrack/ClipItems/TrackItems/TrackItem'):
                        it = by_id[ti.get('ObjectRef')]
                        cti = it.find('ClipTrackItem')
                        st = int(cti.findtext('TrackItem/Start') or 0); en = int(cti.findtext('TrackItem/End'))
                        p, cin, cout = media_of(ref(cti.find('SubClip')))
                        items.append({'path': p, 'start': st / TICKS, 'end': en / TICKS,
                                      'src_in': cin / TICKS, 'muted': cti.findtext('IsMuted') == 'true'})
                    s['video'].append(items)
            elif g.tag == 'AudioTrackGroup':
                s['audio_tracks'] = len(g.findall('TrackGroup/Tracks/Track'))
            else:
                s['captions'] += sum(1 for t in g.iter('TrackItem') if t.get('ObjectRef'))
        out.append(s)
    return out


# ---------- FCP7 XML ----------
def parse_fcp7(path):
    seq = ET.parse(path).getroot().find('sequence')
    tb = int(seq.findtext('rate/timebase')); ntsc = seq.findtext('rate/ntsc') == 'TRUE'
    fps = tb * 1000 / 1001 if ntsc else tb
    f = lambda x: int(x) / fps
    s = {'name': seq.findtext('name'), 'fps': round(fps, 3), 'duration': round(f(seq.findtext('duration')), 3),
         'size': [int(seq.findtext('.//samplecharacteristics/width')), int(seq.findtext('.//samplecharacteristics/height'))],
         'video': []}
    for t in seq.find('media/video').findall('track'):
        items = []
        for c in t.findall('clipitem'):
            pu = c.findtext('file/pathurl')
            if pu is None:  # repeated file refs carry only id
                fid = c.find('file').get('id'); pu = seq.find(f".//file[@id='{fid}']/pathurl").text
            items.append({'path': urllib.parse.unquote(pu.replace('file://localhost', '')),
                          'start': f(c.findtext('start')), 'end': f(c.findtext('end')),
                          'src_in': f(c.findtext('in')), 'muted': c.findtext('enabled') == 'FALSE'})
        s['video'].append(items)
    return [s]
