"""Key Tom's actual Loading Youtube.mp4 into transparent PNGs.
No shape recreation: ffmpeg crops, keys green and removes green edge spill.
Run with system python3; ffmpeg must be available.
"""
from pathlib import Path
import subprocess
SOURCE = '/Users/tom/Documents/PERMANENT ASSETS/VISUAL/Loading Youtube.mp4'
DEST = Path(__file__).resolve().parents[3] / 'public/barca-real/loading-youtube'
DEST.mkdir(parents=True, exist_ok=True)
# The source ring is centred at about955,531; retain its neutral-grey source dots.
subprocess.run(['ffmpeg','-v','error','-y','-i',SOURCE,'-an','-vf','crop=400:400:756:332,format=rgba,colorkey=0x00FF00:0.3:0.08,despill=green','-frames:v','37','-start_number','0',str(DEST/'frame-%03d.png')],check=True)
print(f'Keyed37sourceframes to {DEST}')
