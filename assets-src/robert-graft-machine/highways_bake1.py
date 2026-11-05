# Stage 1: clean base plate, NJ mask, highway alpha, all in base (map_src4.5) 4K coordinates. Saves .npy to scratch.
import numpy as np, cv2, sys
R=sys.argv[1]; S=sys.argv[2]
base=cv2.imread(f'{R}/map_src4.5.png',cv2.IMREAD_GRAYSCALE)
fin=cv2.imread(f'{R}/map_src10.25.png',cv2.IMREAD_GRAYSCALE)
warp=np.load(f'{S}/warp.npy')
H,W=base.shape
# --- labels mask
boxes={'BRONX':(1860,170,2290,270),'MANHATTAN':(1610,430,1890,850),'QUEENS':(2120,930,2420,1010),'BROOKLYN':(1660,1140,2050,1225),'STATEN':(920,1475,1470,1565)}
lm=np.zeros_like(base)
for n,(x0,y0,x1,y1) in boxes.items():
    sub=base[y0:y1,x0:x1]
    nl,lab,st,cen=cv2.connectedComponentsWithStats((sub<130).astype(np.uint8))
    for i in range(1,nl):
        if not(40<st[i,4]<8000): continue
        if st[i,0]==0 or st[i,1]==0 or st[i,0]+st[i,2]>=x1-x0 or st[i,1]+st[i,3]>=y1-y0: continue
        if n=='MANHATTAN':
            cx,cy=cen[i]; # line x = 247 - 0.534*(y)
            if abs(cx-(252-0.534*cy))>30: continue
        lm[y0:y1,x0:x1][lab==i]=255
lm=cv2.dilate(lm,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25)))
dist,lbl=cv2.distanceTransformWithLabels((lm>0).astype(np.uint8),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
zy,zx=np.nonzero(lm==0)
lut=np.zeros(lbl.max()+1,np.int64); lut[lbl[zy,zx]]=zy*W+zx
clean=base.copy().ravel()
mi=np.flatnonzero(lm.ravel()>0)
ns=cv2.morphologyEx(base,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))
clean[mi]=ns.ravel()[lut[lbl.ravel()[mi]]]
clean=clean.reshape(H,W)
# STATEN ISLAND is dropped in the 9:16, so its label area must be clean: smooth inpaint on the road-suppressed plate
x0,y0,x1,y1=boxes['STATEN']
lsi=np.zeros_like(lm); lsi[y0-30:y1+30,x0-30:x1+30]=lm[y0-30:y1+30,x0-30:x1+30]
lsi=cv2.dilate(lsi,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(21,21)))
# hand-traced classes under the old label (coastlines read off the 4K frame either side of the label band):
# right end = SI east shore on a diagonal; left end = NJ shore, Arthur Kill channel, SI west shore
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
cls=np.full((H,W),2,np.uint8)
east=(xx>1300)&(xx>1410-(yy-1490)*0.786); cls[east]=0
dy=np.maximum(yy-1490,0)   # channel runs straight down to the label line, then turns south-west and widens
L2=xx-(1035-dy*1.69); L1=xx-(1000-dy*3.0)
west=(xx<1100)&(L2<0); cls[west&(L1>0)]=0; cls[west&(L1<=0)]=1
del dy
del yy,xx,L1,L2,east,west
# each class takes the value of its nearest same-class pixel outside the mask (keeps the coastal glow), in a crop
cy0,cy1,cx0,cx1=1300,1750,800,1650
ncls=np.where(base<34,0,np.where((ns>175)&(ns<205),1,np.where(ns>225,2,9)))[cy0:cy1,cx0:cx1]
srcb=cv2.GaussianBlur(base,(0,0),2)[cy0:cy1,cx0:cx1]; srcn=cv2.GaussianBlur(ns,(0,0),2)[cy0:cy1,cx0:cx1]
m=lsi[cy0:cy1,cx0:cx1]>0
fill=np.zeros(m.shape,np.float32)
cc=cls[cy0:cy1,cx0:cx1]
far=cv2.dilate(m.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(61,61)))>0  # seeds clear of the old halo glow
for c in range(3):
    seedmask=((~far)&(ncls==c))
    v=float(np.median((srcn if c==2 else srcb)[seedmask])) if seedmask.any() else [24,193,238][c]
    fill[cc==c]=v
    print('class',c,'value',v)
fill=cv2.GaussianBlur(fill,(0,0),2.0)
feather=cv2.GaussianBlur(cv2.dilate(m.astype(np.uint8),np.ones((15,15),np.uint8)).astype(np.float32),(0,0),3)
reg=clean[cy0:cy1,cx0:cx1].astype(np.float32)
clean[cy0:cy1,cx0:cx1]=np.clip(reg*(1-feather)+fill*feather,0,255).astype(np.uint8)
del dist,lbl,lut
# number: ocean fill
clean[1560:1960,2520:3160]=24
clean[1840:2110,1575:1750]=24  # Sandy Hook tip: clears the ocean under the readout
cv2.imwrite(f'{S}/clean_full.png',clean)
# --- NJ mask: grey land connected to left edge
g=cv2.GaussianBlur(clean,(0,0),3)
land=((g>100)&(g<218)).astype(np.uint8)
nl,lab,st,cen=cv2.connectedComponentsWithStats(land)
nj=(lab==lab[800,200]).astype(np.uint8)*255
nj=cv2.dilate(nj,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
nj=cv2.GaussianBlur(nj,(0,0),3)
np.save(f'{S}/nj.npy',nj)
# --- highways: base minus warped final
fw=cv2.warpAffine(fin,warp,(W,H),flags=cv2.INTER_LINEAR|cv2.WARP_INVERSE_MAP,borderValue=0)
valid=cv2.warpAffine(np.full_like(fin,255),warp,(W,H),flags=cv2.INTER_NEAREST|cv2.WARP_INVERSE_MAP,borderValue=0)
valid=cv2.erode(valid,np.ones((25,25),np.uint8))
b=cv2.GaussianBlur(ns,(0,0),1.5).astype(np.float32); f=cv2.GaussianBlur(fw,(0,0),1.5).astype(np.float32)
d=b-f
core=((d>110)&(b>130)&(valid>0)).astype(np.uint8)
core[1560:1960,2500:3200]=0
core=cv2.morphologyEx(core,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13)))
core[:700,:1000]=0
nl,lab,st,cen=cv2.connectedComponentsWithStats(core)
keep=np.zeros(nl,bool); keep[1:]=st[1:,4]>600
core=keep[lab].astype(np.uint8)
print('road comps kept',keep.sum(),'of',nl-1)
zone=cv2.dilate(core,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
alpha=np.clip((b-f)/np.maximum(b-2,1),0,1)*zone
np.save(f'{S}/alpha.npy',alpha.astype(np.float32))
np.save(f'{S}/core.npy',core)
cv2.imwrite(f'{S}/alpha.png',(alpha*255).astype(np.uint8))
# preview composite at 1/2.4
comp=clean.astype(np.float32)*(1-0.373*nj/255.0)
comp=comp*(1-alpha)+3*alpha
cv2.imwrite(f'{S}/comp.png',cv2.resize(comp.clip(0,255).astype(np.uint8),(1600,900),interpolation=cv2.INTER_AREA))
