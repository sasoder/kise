# Stage 2: export plates for Remotion at PS=0.7 of the 4K base coords, and the road reveal steps.
import numpy as np, cv2, sys, json, os
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra
S=sys.argv[1]; OUT=sys.argv[2]
os.makedirs(OUT,exist_ok=True)
PS=0.7; X0=560; PADTOP=700; FEATHER_UP=320; FEATHER_DOWN=230; SMEAR_X=200; CUT=1900  # source rows from CUT down are replaced by the synthesised shore   # plate covers 4K x 560..3840, y -700..2860; pad above y 0 is flat dark ground
clean=cv2.imread(f'{S}/clean_full.png',0)
nj=np.load(f'{S}/nj.npy'); alpha=np.load(f'{S}/alpha.npy'); core=np.load(f'{S}/core.npy')
H,W=clean.shape
PADBOT=700
def extbottom(a,thr):
    nrows=a.shape[0]+PADBOT-CUT
    a=a[:CUT]
    # continue the plate below the source frame: the shore of the last row recedes west on a curve, so New Jersey
    # rounds off into a cape and the black ocean opens up under the readout (no straight cut edge). Flat values;
    # the comp's live grain textures it.
    last=a[-1].astype(np.float32)
    land=last>thr
    xs=np.nonzero(land)[0]; coast=int(xs.max()) if len(xs) else 0
    lv=float(np.median(last[:max(coast-40,1)])) if coast>60 else 0.0
    wv=float(np.median(last[coast+80:])) if coast+80<len(last) else float(last[-1])
    xx=np.arange(a.shape[1],dtype=np.float32)
    rows=[]
    for j in range(1,nrows+1):
        c=coast-(0.006*j*j+1.0*j)+9*np.sin(j/23.0)+5*np.sin(j/9.0+1.3)
        t=np.clip((c-xx)/6+0.5,0,1)
        rows.append(t*lv+(1-t)*wv)
    ext=np.stack(rows); ext0=ext[:1].copy()
    if a.dtype==np.uint8 and thr==100:
        # match the plate's residual grain on land, so the seam does not read
        sd=float(a[-200:-40,100:600].astype(np.float32).std())
        print('ext grain sd',sd)
        rng=np.random.default_rng(3)
        g=cv2.GaussianBlur(rng.normal(0,1,ext.shape).astype(np.float32),(0,0),1.3)
        g*=sd/max(float(g.std()),1e-6)
        landt=np.clip((ext-wv)/max(lv-wv,1),0,1)
        ext=ext+g*landt
    # crossfade the last 24 source rows into the continuation
    n=24; w=np.linspace(0,1,n,dtype=np.float32)[:,None]
    a=a.astype(np.float32).copy()
    a[-n:]=a[-n:]*(1-w)+ext0*w
    return np.clip(np.concatenate([a,ext],axis=0),0,255 if thr in (100,127) else 1e9).astype(a.dtype if thr not in (100,127) else np.uint8)
def toplate(a,interp=cv2.INTER_AREA,border=cv2.BORDER_REFLECT,thr=None):
    a=(extbottom(a,thr) if thr is not None else cv2.copyMakeBorder(a,0,PADBOT,0,0,cv2.BORDER_REPLICATE))[:,X0:]
    a=cv2.copyMakeBorder(a,PADTOP,0,0,0,border,value=0)
    if thr is not None:
        # clean top fade (director review): no mirrored content. Above world y 0 the plate continues FEATHER_UP rows as
        # its own top row smeared flat (heavy horizontal blur, constant down the rows: soft tones only, nothing brighter
        # than the land), and the band from y -FEATHER_UP to +FEATHER_DOWN eases into the flat dark ground on a
        # smoothstep, so there is no seam and the Bronx (from y ~170) stays at full value
        fillv=24.0 if thr==100 else 0.0
        a=a.astype(np.float32).copy()
        row0=cv2.GaussianBlur(a[PADTOP:PADTOP+12].mean(0,keepdims=True),(0,0),sigmaX=80,sigmaY=0.1)
        if thr==100: row0=np.minimum(row0,186.0)   # never brighter than the grey mainland below
        a[:PADTOP]=fillv
        a[PADTOP-FEATHER_UP:PADTOP]=row0
        q=np.arange(SMEAR_X,dtype=np.float32)/SMEAR_X; q=(q*q*(3-2*q))[:,None]   # real rows ease out of the smear
        a[PADTOP:PADTOP+SMEAR_X]=a[PADTOP:PADTOP+SMEAR_X]*q+row0*(1-q)
        n=FEATHER_UP+FEATHER_DOWN
        r=np.arange(n,dtype=np.float32)/n
        w=(r*r*(3-2*r))[:,None]
        z=slice(PADTOP-FEATHER_UP,PADTOP+FEATHER_DOWN)
        a[z]=a[z]*w+fillv*(1-w)
        a=np.clip(a,0,255).astype(np.uint8)
    return cv2.resize(a,None,fx=PS,fy=PS,interpolation=interp)
# plate: soften baked grain (live grain is added in the comp)
pl=cv2.GaussianBlur(clean,(0,0),1.3)
pl[-1]=cv2.GaussianBlur(pl[-8:].astype(np.float32),(0,0),sigmaX=6,sigmaY=3)[-1].astype(np.uint8)
plate=toplate(pl,thr=100)
cv2.imwrite(f'{OUT}/plate.jpg',plate,[cv2.IMWRITE_JPEG_QUALITY,92])
njp=toplate(nj,border=cv2.BORDER_REFLECT,thr=127)
rgba=np.zeros(njp.shape+(4,),np.uint8); rgba[...,3]=njp
cv2.imwrite(f'{OUT}/nj_mask.png',rgba)
print('plate',plate.shape)
# geodesic distance at quarter res
q=0.25
aq=cv2.resize(alpha,None,fx=q,fy=q,interpolation=cv2.INTER_AREA)
road=aq>0.35
h,w=road.shape
cost=np.where(road,1.0,9.0).ravel()
idx=np.arange(h*w).reshape(h,w)
rows=[];cols=[];vals=[]
for dy,dx in [(0,1),(1,0),(1,1),(1,-1)]:
    ys0=slice(0,h-dy); xs0=slice(max(0,-dx),w-max(0,dx)); ys1=slice(dy,h); xs1=slice(max(0,dx),w-max(0,-dx) if max(0,-dx)>0 else w)
    xs1=slice(max(0,dx), w+min(0,dx))
    a=idx[ys0,xs0].ravel(); b=idx[ys1,xs1].ravel()
    L=np.hypot(dx,dy)
    v=L*(cost[a]+cost[b])/2
    rows+= [a,b]; cols+=[b,a]; vals+=[v,v]
G=coo_matrix((np.concatenate(vals),(np.concatenate(rows),np.concatenate(cols))),shape=(h*w,h*w)).tocsr()
seed=(int(1851*q),int(450*q))
ys,xs=np.nonzero(road); i=((xs-seed[0])**2+(ys-seed[1])**2).argmin(); seedi=ys[i]*w+xs[i]
dist=dijkstra(G,indices=seedi).reshape(h,w)/q   # in 4K px
del G
print('dist max on roads',dist[road].max())
dfull=cv2.resize(dist.astype(np.float32),(W,H),interpolation=cv2.INTER_LINEAR)
dpl=toplate(dfull,interp=cv2.INTER_LINEAR,border=cv2.BORDER_REPLICATE)
apl=toplate(alpha,border=cv2.BORDER_CONSTANT)
apl[:int(PADTOP*PS)]=0
# crop roads to their bbox
ys,xs=np.nonzero(apl>0.02)
bx0,bx1,by0,by1=xs.min()-4,xs.max()+5,ys.min()-4,ys.max()+5
apl=apl[by0:by1,bx0:bx1]; dpl=dpl[by0:by1,bx0:bx1]
D=float(dpl[apl>0.3].max())
N=48; SOFT=40.0
tot=float(apl.sum()); frac=[]
for k in range(N+1):
    front=D*k/N + (SOFT/2 if k==N else 0)
    a=apl*np.clip((front-dpl)/SOFT+0.5,0,1) if k<N else apl
    frac.append(round(float(a.sum())/tot,5))
    im=np.zeros(a.shape+(4,),np.uint8); im[...,3]=np.clip(a*255+0.5,0,255).astype(np.uint8)
    cv2.imwrite(f'{OUT}/roads_{k:02d}.png',im,[cv2.IMWRITE_PNG_COMPRESSION,9])
meta=dict(PS=PS,X0=X0,PADTOP=PADTOP,PADBOT=PADBOT,plateW=int(plate.shape[1]),plateH=int(plate.shape[0]),roadsX=int(bx0),roadsY=int(by0),roadsW=int(bx1-bx0),roadsH=int(by1-by0),steps=N,frac=frac,distMax=D)
json.dump(meta,open(f'{S}/meta.json','w'))
print(json.dumps({k:v for k,v in meta.items() if k!='frac'})); print(frac)
