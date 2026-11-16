import math, wave, struct, random, json
random.seed(11)
J=json.load(open('cues.json')); C=[c[0] for c in J['cues']]; D=J['dur']
SR=44100; N=int(SR*D); buf=[0.0]*N
def add(t0,fn,dur,g=1.0):
    s=int(t0*SR)
    for i in range(int(dur*SR)):
        if 0<=s+i<N: buf[s+i]+=g*fn(i/SR)
nz=lambda:random.random()*2-1
sn=lambda f,x:math.sin(2*math.pi*f*x)
pop=lambda x:0.5*sn(500+900*math.exp(-x*35),x)*math.exp(-x*24)
blip=lambda x:0.35*sn(1500,x)*math.exp(-x*30)
def whoosh(d):
    st=[0.0]
    def f(x):
        st[0]=st[0]*0.9+nz()*0.1; return st[0]*math.sin(math.pi*min(1,x/d))**2*4
    return f
zap=lambda x:0.4*sn(2200-1800*x*4,x)*math.exp(-x*9)
thud=lambda x:(0.9*sn(80-30*x,x)+0.2*nz()*math.exp(-x*40))*math.exp(-x*8)
boing=lambda x:0.4*sn(260+160*math.sin(x*26)*math.exp(-x*6),x)*math.exp(-x*5)
ding=lambda x:sum(a*sn(f,x) for f,a in ((1046,.3),(1568,.16),(2093,.08)))*math.exp(-x*4)
shimmer=lambda x:sum(.1*sn(f,x)*math.exp(-((x-k*.05)*28)**2) for k,f in enumerate((1760,2217,2637,3136,3520)))
hum=lambda d:(lambda x:0.12*(sn(110,x)+.5*sn(220,x))*(0.7+0.3*sn(6,x))*min(1,x/.1)*min(1,(d-x)/.15))
power_up=lambda x:0.25*sn(200+900*x*1.5,x)*min(1,x/.05)*math.exp(-max(0,x-.5)*8)
power_dn=lambda x:0.25*sn(900-700*x*1.6,x)*math.exp(-x*2.5)
def bubbles(d):
    def f(x):
        k=(x*9)%1; return 0.12*sn(700+300*math.sin(x*40),x)*math.exp(-k*25)
    return f
whisper=lambda x:nz()*0.08*math.sin(math.pi*min(1,x/.9))
boom=lambda x:(0.8*sn(55,x)+0.4*sn(110,x))*math.exp(-x*3)+0.15*nz()*math.exp(-x*20)
# cuts
for c in [C[2],C[5],C[9],C[12],C[17],C[21]]: add(c-.22,whoosh(.4),.4,.6)
# S1
add(.1,pop,.2,.6); add(.9,zap,.35,.8); add(C[1]+.1,pop,.2,.6); add(C[1]+.35,pop,.2,.6); add(C[1]+.5,blip,.1,.5); add(C[1]+.8,blip,.1,.5)
# S2
add(C[2],pop,.2,.6); add(C[2]+.1,whoosh(.4),.4,.35); add(C[2]+.3,pop,.2,.5); add(C[3],pop,.2,.6); add(C[3]+.25,pop,.2,.5); add(C[4],ding,.5,.5)
# S3
for k in range(3): add(C[5]+k*.25,pop,.2,.55)
add(C[6],hum(C[7]+.3-C[6]),C[7]+.3-C[6],.8); add(C[6]+.2,bubbles(C[9]-C[6]-.3),C[9]-C[6]-.3,.7)
add(C[7],power_up,.7,.9); add(C[8],whisper,1.0,1.0); add(C[8]+.1,shimmer,.4,.6)
# S4
add(C[9],pop,.2,.6); add(C[9]+1.2,boing,.6,.6); add(C[10],shimmer,.4,.8); 
for k in range(4): add(C[11]+k*.12,blip,.08,.7)
add(C[11]+.1,pop,.2,.5)
# S5
for k in range(3): add(C[12]+.15+k*.2,pop,.2,.55)
t=C[13]
while t<C[14]: add(t,blip,.1,.7); add(t+.05,lambda x:0.2*sn(880,x)*math.exp(-x*12),.2,.6); t+=1.1
k=0
while True:
    t=C[14]+k*math.pi/1.8
    if t>=C[15]: break
    for j in range(3): add(t-.1+j*.09,lambda x:0.3*sn(1320,x)*(1 if x<.05 else 0),.06,.8)
    k+=1
add(C[15],hum(C[16]-C[15]),C[16]-C[15],.6); add(C[16],shimmer,.5,1.0); add(C[16],ding,.6,.6)
# S6
add(C[17],pop,.2,.6); add(C[18]+.3,power_dn,.6,.8); add(C[18]+.45,thud,.5,.8); add(C[19],pop,.2,.6); add(C[20]+.7,thud,.5,.9); add(C[20]+1.6,thud,.5,.9)
# S7
add(C[21],boom,1.2,.8); add(C[22]+.1,pop,.2,.6); add(C[22]+.1,boing,.6,.5)
for k in range(3): add(C[23]+.2+k*.25,pop,.2,.55)
add(D-1.1,ding,.9,.6)
# dark sci-fi pad
for i in range(N):
    x=i/SR; env=min(1,x/1.5)*min(1,(D-x)/1.2)
    buf[i]+=env*0.018*(sn(55,x)+0.7*math.sin(2*math.pi*82.4*x+1)+0.4*math.sin(2*math.pi*164.8*x+2)*(0.5+0.5*sn(.2,x)))
with wave.open('sfx3.wav','w') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*30000)) for v in buf))
print('ok',D)
