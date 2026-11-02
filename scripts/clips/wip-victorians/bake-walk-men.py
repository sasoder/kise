# orchestrates: matte then bake-photo, crops given in sheet-cell units (300 x 420)
import subprocess, sys
from PIL import Image
A,S=sys.argv[1],sys.argv[2]
MEN={"gladstone":("Gladstone_1892_cropped",12,22,287,372),"salisbury":("Salisbury_ElliottFry",8,30,275,370),"balfour":("Balfour_LOC2014682753",27,15,263,315),"rosebery":("Rosebery_ElliottFry",2,15,277,365),"derby":("Derby_cropped",57,0,293,300)}
for n,(f,x0,y0,x1,y1) in MEN.items():
    src=f"{A}/men/{f}.jpg"; w,h=Image.open(src).size
    box=f"{int(x0/300*w)},{int(y0/420*h)},{int(x1/300*w)},{int(y1/420*h)}"
    subprocess.run(["swift","scripts/clips/neal-stephenson-trailer/neal-matte.swift",src,f"{S}/mask_{n}.png","person"],check=True)
    subprocess.run(["python","scripts/clips/wip-anthropic/bake-photo.py",src,f"public/wip-victorians/tw_{n}.png","--matte",f"{S}/mask_{n}.png","--crop",box,"--max","720","--mid","0.5"],check=True)
