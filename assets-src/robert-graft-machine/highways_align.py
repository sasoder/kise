import numpy as np, cv2, sys
R=sys.argv[1]; S=sys.argv[2]
base=cv2.imread(f'{R}/map_src4.5.png',cv2.IMREAD_GRAYSCALE)
fin=cv2.imread(f'{R}/map_src10.25.png',cv2.IMREAD_GRAYSCALE)
def wm(a,sc):
    a=cv2.resize(a,None,fx=sc,fy=sc,interpolation=cv2.INTER_AREA)
    m=(a<70).astype(np.uint8)
    k=max(3,int(40*sc)|1)
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((k,k),np.uint8))
    return cv2.GaussianBlur(m.astype(np.float32),(0,0),3)
warp=np.eye(2,3,dtype=np.float32)
for sc in [0.125,0.25,0.5]:
    a=wm(base,sc); b=wm(fin,sc)
    w=warp.copy(); w[:,2]*=sc
    crit=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,200,1e-6)
    cc,w=cv2.findTransformECC(a,b,w,cv2.MOTION_AFFINE,crit,None,5)
    w[:,2]/=sc; warp=w
    print(sc,cc,warp.tolist())
np.save(f'{S}/warp.npy',warp)
