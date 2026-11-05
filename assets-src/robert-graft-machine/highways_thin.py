# Stage 1b (rev1): split the thin grey road web off the base plate.
# In: clean_full.png, core.npy, alpha.npy (bake1). Out (scratch): noroad_full.png (land/water plate with NO road strokes,
# inpainted to the local ground with borrowed grain), thin_rgb.npy + thin_a.npy (the thin web as its own layer: the
# web redrawn as one clear grey stroke, plus a thin stroke along every thick highway the web does not already carry).
import numpy as np, cv2, sys
from skimage.morphology import skeletonize
S=sys.argv[1]
c=cv2.imread(f'{S}/clean_full.png',0); H,W=c.shape
cf=c.astype(np.float32)
core=np.load(f'{S}/core.npy')
el=lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*r+1,2*r+1))
ns=cv2.morphologyEx(c,cv2.MORPH_CLOSE,el(8)).astype(np.float32)
op=cv2.morphologyEx(c,cv2.MORPH_OPEN,el(8)).astype(np.float32)
b=cv2.GaussianBlur(cf,(0,0),2.2); nb=cv2.GaussianBlur(ns,(0,0),3); ob=cv2.GaussianBlur(op,(0,0),3)
water=(cv2.GaussianBlur(cf,(0,0),4)<90).astype(np.uint8)
nearw=cv2.dilate(water,el(7))>0
# dark lines on the white NYC land (crisp, high contrast): closing-based
dl=nb-b
land_white=nb>222
# same blur on both sides, so a coastline (a step the closing keeps) does not read as a line; only dips do
dl2=cv2.GaussianBlur(ns,(0,0),2.2)-b
cw=(dl2>18)&(ns>215)&(b>100)
# dark lines on the grainy grey mainland: a broad blur beats the grain
b4=cv2.GaussianBlur(cf,(0,0),4); bg=cv2.GaussianBlur(cf,(0,0),18)
cg=((bg-b4)>9)&(bg>150)&(bg<218)&~land_white&~(cv2.dilate(water,el(6))>0)
# light lines on water (bridges): brighter than the opened water
dw=b-ob
cb=((b-cv2.GaussianBlur(op,(0,0),2.2))>22)&(cv2.GaussianBlur(op,(0,0),2.2)<160)
def comps(m,minext,minarea):
    m=cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_OPEN,el(1))
    n,lab,st,_=cv2.connectedComponentsWithStats(m,connectivity=8)
    ext=np.maximum(st[:,2],st[:,3])
    keep=np.zeros(n,bool); keep[1:]=(ext[1:]>=minext)&(st[1:,4]>=minarea)
    print('comps',keep.sum(),'of',n-1)
    return keep[lab]
cand=(comps(cw|cb,40,120)|comps(cg,120,400)).astype(np.uint8)
# one width for the whole web: skeleton, redrawn at the plate's stroke width
skw=skeletonize(cand>0).astype(np.uint8)
web=cv2.dilate(skw,el(4))
cv2.imwrite(f'{S}/web_mask.png',web*255)
# --- road-free plate: inside a dilated road mask, the ground class (water / grey / white) comes from a 41 px median
# of the plate (thin lines of either polarity vanish, coastlines keep their shape), and the value from the unmasked
# pixels of that class around it (normalised blur); grain is borrowed from a shifted copy of the same class
m=cv2.dilate(np.maximum(web,cv2.dilate(core,el(3))),el(4)).astype(np.float32)
mu=(m>0).astype(np.uint8)
med=cv2.GaussianBlur(cv2.medianBlur(c,41).astype(np.float32),(0,0),2)
gb=cv2.GaussianBlur(cf,(0,0),2.5)
cls0=np.where(gb<90,0,np.where(gb>222,2,1)).astype(np.uint8)
clsm=np.where(med<110,0,np.where(med>215,2,1)).astype(np.uint8)
cls=np.where(mu>0,clsm,cls0).astype(np.uint8)
ground=np.zeros_like(cf)
for k in range(3):
    w=((cls0==k)&(mu==0)).astype(np.float32)
    num=cv2.GaussianBlur(cf*w,(0,0),6); den=cv2.GaussianBlur(w,(0,0),6)
    num2=cv2.GaussianBlur(cf*w,(0,0),24); den2=cv2.GaussianBlur(w,(0,0),24)
    gk=np.where(den>0.03,num/np.maximum(den,1e-4),num2/np.maximum(den2,1e-4))
    ground[cls==k]=gk[cls==k]
del num,den,num2,den2,gk
# along a coast the median itself is the better ground (it keeps the soft coastal glow); class means elsewhere
edge=(cv2.morphologyEx(clsm,cv2.MORPH_GRADIENT,el(1))>0).astype(np.uint8)
coastal=cv2.GaussianBlur(cv2.dilate(edge,el(9)).astype(np.float32),(0,0),3)
ground=ground*(1-coastal)+med*coastal
sh=np.roll(cf,(17,23),axis=(0,1)); shm=np.roll(m,(17,23),axis=(0,1)); shc=np.roll(cls0,(17,23),axis=(0,1))
uni=np.zeros_like(cls0)
for k in range(3): uni|=cv2.erode((cls0==k).astype(np.uint8),el(6))
shu=np.roll(uni,(17,23),axis=(0,1))
uc=np.zeros_like(cls)
for k in range(3): uc|=cv2.erode((cls==k).astype(np.uint8),el(3))
gr=np.clip(sh-cv2.GaussianBlur(sh,(0,0),4),-25,25)*(1-shm)*(shc==cls)*shu*uc
fill=ground+gr
fm=cv2.GaussianBlur(m,(0,0),1.2)
noroad=np.clip(cf*(1-fm)+fill*fm,0,255).astype(np.uint8)
cv2.imwrite(f'{S}/noroad_full.png',noroad)
# --- thin layer (review 1): the original's faint grey roads do not read at phone size, so the web is redrawn as one
# clear stroke, INK grey, ~8 source px wide (~4 px on screen at the comp's scale; his thick roads are ~22): the web's
# own centre lines plus a thin version of every thick path the web does not already carry
INK=118.0
sk=skeletonize(core>0).astype(np.uint8)
covered=cv2.dilate(web,el(9))>0
add=sk*(~covered)
n2,lab2,st2,_=cv2.connectedComponentsWithStats(add,connectivity=8)
k2=np.zeros(n2,bool); k2[1:]=st2[1:,4]>=12
add=k2[lab2].astype(np.uint8)
print('added skeleton px',int(add.sum()),'of',int(sk.sum()))
skall=np.maximum(skw,add)
aa=np.clip(cv2.GaussianBlur(cv2.dilate(skall,el(3)).astype(np.float32),(0,0),1.0)*1.15,0,1)
rgb=np.full_like(cf,INK)
np.save(f'{S}/thin_rgb.npy',rgb.astype(np.uint8)); np.save(f'{S}/thin_a.npy',aa.astype(np.float32))
# previews
comp=noroad.astype(np.float32)*(1-aa)+rgb*aa
cv2.imwrite(f'{S}/v_noroad.png',cv2.resize(noroad,(1920,1080),interpolation=cv2.INTER_AREA))
cv2.imwrite(f'{S}/v_noroad_c1.png',noroad[200:1100,1500:2500])
cv2.imwrite(f'{S}/v_orig_c1.png',c[200:1100,1500:2500])
cv2.imwrite(f'{S}/v_thincomp.png',cv2.resize(comp.astype(np.uint8),(1920,1080),interpolation=cv2.INTER_AREA))
dbg=np.dstack([noroad]*3).copy(); dbg[web>0]=(0,0,255); dbg[cv2.dilate(add,el(3))>0]=(0,200,0)
cv2.imwrite(f'{S}/v_web.png',cv2.resize(dbg,(1920,1080),interpolation=cv2.INTER_AREA))

# residual check (debug): what still reads as a dark line on the road-free plate
nr=noroad.astype(np.float32)
rd=cv2.GaussianBlur(cv2.morphologyEx(noroad,cv2.MORPH_CLOSE,el(8)).astype(np.float32),(0,0),3)-cv2.GaussianBlur(nr,(0,0),2.2)
res=(rd>15)&(nb>222)
print('residual white-land line px',int(res.sum()))
dbg=np.dstack([noroad]*3).copy(); dbg[cv2.dilate(res.astype(np.uint8),el(3))>0]=(0,0,255)
cv2.imwrite(f'{S}/v_resid.png',cv2.resize(dbg[100:1900,700:2700],(1000,900),interpolation=cv2.INTER_AREA))
