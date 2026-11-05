# Stage 2: export plates for Remotion at PS=0.7 of the 4K base coords, and the road reveal steps.
# rev1: the plate is the ROAD-FREE plate (highways_thin.py); the thin web is its own layer drawn on along the roads from
# Manhattan (thin_XX.png), and the thick highways thicken out of their thin lines (roads_XX.png: a widening wedge behind
# the front, so the thin line visibly turns thick).
import numpy as np, cv2, sys, json, os
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra
S=sys.argv[1]; OUT=sys.argv[2]
os.makedirs(OUT,exist_ok=True)
PS=0.7; X0=300; PADTOP=700; FEATHER_UP=320; FEATHER_DOWN=230; SMEAR_X=200; CUT=1900  # source rows from CUT down are replaced by the synthesised shore   # plate covers 4K x 560..3840, y -700..2860; pad above y 0 is flat dark ground
clean=cv2.imread(f'{S}/noroad_full.png',0)
nj=np.load(f'{S}/nj.npy'); alpha=np.load(f'{S}/alpha.npy'); core=np.load(f'{S}/core.npy')
thin_a=np.load(f'{S}/thin_a.npy'); thin_rgb=np.load(f'{S}/thin_rgb.npy')
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
# the plate's top fade, as a weight per plate row, so roads fade into the dark ground with the land under them
def topw():
    n=FEATHER_UP+FEATHER_DOWN; rows=np.zeros(PADTOP+H+PADBOT,np.float32)
    r=np.arange(n,dtype=np.float32)/n; rows[PADTOP-FEATHER_UP:PADTOP+FEATHER_DOWN]=r*r*(3-2*r); rows[PADTOP+FEATHER_DOWN:]=1
    return cv2.resize(rows[:,None],(1,int(round((PADTOP+H+PADBOT)*PS))),interpolation=cv2.INTER_AREA)
# geodesic distance along a road mask from upper Manhattan, at quarter res, in 4K px
def geodesic(mask4k,offcost):
    q=0.25
    road=cv2.resize(mask4k.astype(np.float32),None,fx=q,fy=q,interpolation=cv2.INTER_AREA)>0.2
    h,w=road.shape
    cost=np.where(road,1.0,offcost).ravel()
    idx=np.arange(h*w).reshape(h,w)
    rows=[];cols=[];vals=[]
    for dy,dx in [(0,1),(1,0),(1,1),(1,-1)]:
        ys0=slice(0,h-dy); xs0=slice(max(0,-dx),w-max(0,dx)); ys1=slice(dy,h); xs1=slice(max(0,dx), w+min(0,dx))
        a=idx[ys0,xs0].ravel(); b=idx[ys1,xs1].ravel()
        v=np.hypot(dx,dy)*(cost[a]+cost[b])/2
        rows+=[a,b]; cols+=[b,a]; vals+=[v,v]
    G=coo_matrix((np.concatenate(vals),(np.concatenate(rows),np.concatenate(cols))),shape=(h*w,h*w)).tocsr()
    seed=(int(1851*q),int(450*q))
    ys,xs=np.nonzero(road); i=((xs-seed[0])**2+(ys-seed[1])**2).argmin(); seedi=ys[i]*w+xs[i]
    dist=dijkstra(G,indices=seedi).reshape(h,w)/q
    del G
    print('dist max on roads',dist[road].max())
    return cv2.resize(dist.astype(np.float32),(W,H),interpolation=cv2.INTER_LINEAR)
TW=topw()
def bbox(a):
    ys,xs=np.nonzero(a>0.02); return xs.min()-4,xs.max()+5,ys.min()-4,ys.max()+5
el=lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*r+1,2*r+1))
# ---- THIN web: drawn on by a soft front along the roads (all of them), f2..f52 in the comp
dthin=geodesic((thin_a>0.35)|(core>0),6.0)
tapl=toplate(thin_a,border=cv2.BORDER_CONSTANT)*TW; tapl[:int(PADTOP*PS)]=0
trgb=toplate(cv2.GaussianBlur(thin_rgb,(0,0),1.3),border=cv2.BORDER_CONSTANT)
tdpl=toplate(dthin,interp=cv2.INTER_LINEAR,border=cv2.BORDER_REPLICATE)
tx0,tx1,ty0,ty1=bbox(tapl)
tapl=tapl[ty0:ty1,tx0:tx1]; trgb=trgb[ty0:ty1,tx0:tx1]; tdpl=tdpl[ty0:ty1,tx0:tx1]
TD=float(tdpl[tapl>0.3].max()); NT=40; TSOFT=60.0
for k in range(NT+1):
    front=(TD+TSOFT)*k/NT
    a=tapl*np.clip((front-tdpl)/TSOFT+0.5,0,1) if k<NT else tapl
    a8=np.clip(a*255+0.5,0,255).astype(np.uint8)
    im=np.zeros(a.shape+(4,),np.uint8); im[...,0]=im[...,1]=im[...,2]=np.where(a8>0,trgb,0); im[...,3]=a8
    cv2.imwrite(f'{OUT}/thin_{k:02d}.png',im,[cv2.IMWRITE_PNG_COMPRESSION,9])
print('thin',TD,tapl.shape)
# ---- THICK: the same front logic along the thick network; behind the front each road widens from its centre line
# to full width over TAPER px, so the thin line already on the map visibly turns thick
dist=geodesic(alpha>0.35,9.0)
din=cv2.distanceTransform(core.astype(np.uint8),cv2.DIST_L2,5)
dout=cv2.distanceTransform((1-core).astype(np.uint8),cv2.DIST_L2,5)
Hw=cv2.dilate(din,el(14))                    # local half width
rad=np.where(core>0,Hw-din,Hw+dout)          # distance from the centre line
del din,dout
dpl=toplate(dist,interp=cv2.INTER_LINEAR,border=cv2.BORDER_REPLICATE)
apl=toplate(alpha,border=cv2.BORDER_CONSTANT)*TW
rpl=toplate(rad,interp=cv2.INTER_LINEAR,border=cv2.BORDER_REPLICATE)*PS
hpl=toplate(Hw,interp=cv2.INTER_LINEAR,border=cv2.BORDER_REPLICATE)*PS
apl[:int(PADTOP*PS)]=0
bx0,bx1,by0,by1=bbox(apl)
apl=apl[by0:by1,bx0:bx1]; dpl=dpl[by0:by1,bx0:bx1]; rpl=rpl[by0:by1,bx0:bx1]; hpl=hpl[by0:by1,bx0:bx1]
D=float(dpl[apl>0.3].max())
N=48; TAPER=520.0   # 4K px behind the front over which a road reaches full width
tot=float(apl.sum()); frac=[]
for k in range(N+1):
    front=(D+TAPER)*k/N
    g=np.clip((front-dpl)/TAPER,0,1); g=g*g*(3-2*g)
    wdt=g*(hpl+3.0*PS)
    a=apl*np.clip((wdt-rpl)/(1.2)+0.5,0,1)*np.clip(g*6,0,1) if k<N else apl
    frac.append(round(float(a.sum())/tot,5))
    im=np.zeros(a.shape+(4,),np.uint8); im[...,3]=np.clip(a*255+0.5,0,255).astype(np.uint8)
    cv2.imwrite(f'{OUT}/roads_{k:02d}.png',im,[cv2.IMWRITE_PNG_COMPRESSION,9])
meta=dict(PS=PS,X0=X0,PADTOP=PADTOP,PADBOT=PADBOT,plateW=int(plate.shape[1]),plateH=int(plate.shape[0]),
          roadsX=int(bx0),roadsY=int(by0),roadsW=int(bx1-bx0),roadsH=int(by1-by0),steps=N,frac=frac,distMax=D,
          thinX=int(tx0),thinY=int(ty0),thinW=int(tx1-tx0),thinH=int(ty1-ty0),thinSteps=NT)
json.dump(meta,open(f'{S}/meta.json','w'))
print(json.dumps({k:v for k,v in meta.items() if k!='frac'})); print(frac)
