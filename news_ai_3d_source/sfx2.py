import math, wave, struct, random, sys
random.seed(7)
SR=44100; D=50.1; N=int(SR*D); buf=[0.0]*N
def add(t0,fn,dur,g=1.0):
    s=int(t0*SR)
    for i in range(int(dur*SR)):
        if 0<=s+i<N: buf[s+i]+=g*fn(i/SR)
noise=lambda:random.random()*2-1
sin=lambda f,x:math.sin(2*math.pi*f*x)
# --- sound palette ---
tick=lambda x:(0.5*sin(2400,x)+0.3*noise())*math.exp(-x*220)
pop=lambda x:0.5*sin(600+1000*math.exp(-x*35),x)*math.exp(-x*25)
def whoosh(d):
    st=[0.0]
    def f(x):
        st[0]=st[0]*0.92+noise()*0.08
        env=math.sin(math.pi*min(1,x/d))**2
        return st[0]*env*4
    return f
thud=lambda x:(0.9*sin(90-40*x,x)+0.25*noise()*math.exp(-x*40))*math.exp(-x*9)
boing=lambda x:0.45*sin(220+180*math.sin(x*28)*math.exp(-x*6),x)*math.exp(-x*5)
ding=lambda x:sum(a*sin(f,x) for f,a in ((1046,.3),(1568,.18),(2093,.1)))*math.exp(-x*4)
sparkle=lambda x:sum(.12*sin(f,x)*math.exp(-((x-k*.06)*30)**2) for k,f in enumerate((1568,1976,2349,2637,3136)))
click=lambda x:(0.6*sin(3200,x)+0.2*noise())*math.exp(-x*400)
beep=lambda x:0.3*sin(1760,x)*(1 if x<.09 else 0)
def wah(x): # sad trombone-ish slide
    f=233-60*min(1,x/1.1); v=1+0.03*sin(5,x)
    s=sum(sin(f*v*h,x)/h for h in range(1,6))
    return 0.16*s*min(1,x/.05)*math.exp(-max(0,x-0.9)*6)
def sting(x): # dramatic low chord
    s=sum(sin(f,x)+0.4*sin(f*2,x) for f in (65.4,77.8,98))
    return 0.13*s*math.exp(-x*1.6)*min(1,x/.01)
step=lambda x:(0.4*noise()*math.exp(-x*60)+0.3*sin(140,x)*math.exp(-x*30))
rain=lambda x:0.0
stamp_cha=lambda x:0.25*noise()*math.exp(-x*25)
# --- clock ticks (stop at 45.36) ---
stop=43.76+1.6; t=0.0
while t<stop:
    add(t,tick,0.03, 0.25 if t<2.3 else (0.1 if t<43.76 else 0.3)); t+=1.0
add(stop,lambda x:0.5*sin(180,x)*math.exp(-x*18)+0.2*noise()*math.exp(-x*40),0.4,0.8)  # clunk stop
# --- scene cuts whoosh ---
for c in [11.72,21.04,27.78,32.43,37.71,43.76]: add(c-.25,whoosh(.45),.45,0.7)
add(0.0,whoosh(1.2),1.2,0.5); add(0.15,pop,.18,.5); add(2.1,whoosh(.4),.4,.4)
# S1: OMR pop + rapid bubble fills + red alarm
add(2.1,pop,.18,.5)
t=2.6
while t<4.44: add(t,click,.02,.35); t+=0.045
add(4.5,lambda x:0.35*sin(880 if (x*8)%2<1 else 660,x)*math.exp(-x*2),0.7,0.6)  # wrong-answer buzz
add(4.54,pop,.18,.5)
add(2.6,sparkle,.5,1.0)  # crown
# S2: AI orb shimmer + chat bubbles + stamp
add(7.1,lambda x:0.12*sin(523+400*x,x)*math.sin(math.pi*min(1,x/.8)),.8,1)
for k in range(3): add(7.52+k*.45,pop,.18,.45)
add(8.43,whoosh(.5),.5,.7)
add(9.18,thud,.6,1.0); add(9.18,stamp_cha,.2,1); add(9.18,sting,2.2,1.0)
add(10.03,pop,.18,.5); add(10.03,whoosh(.3),.3,.4)
# S3: phone pop, sad trombone, rain, ticket sparkle, ? boing, 미확인 stamp
add(11.72,pop,.18,.5)
add(13.0,wah,1.3,1.0)
def rainf(x): return noise()*0.06*(0.6+0.4*math.sin(x*3))
add(13.0,lambda x:rainf(x)*min(1,x/.5)*min(1,(8.0-x)/.5),8.0,1.0)
for k in range(14): add(13.2+k*.55+random.random()*.2,lambda x:0.2*sin(1200-600*x*10,x)*math.exp(-x*40),.05,.6)
add(14.82,sparkle,.5,1.0); add(14.82,pop,.18,.5)
add(16.0,boing,.6,.7)
add(19.08,thud,.4,.6); add(19.08,stamp_cha,.2,.8)
# S4: sign drop bounces, survey whoosh, checks
add(21.1,whoosh(.4),.4,.6)
for k,t0 in enumerate([21.55,21.78,21.9]): add(t0,thud,.4,.9/(k+1))
add(23.3,whoosh(1.8),1.8,.6); add(23.63,pop,.18,.5)
for i in range(8):
    ct=23.63+1.2+(i/7)*(27.78-.2-23.63-1.2)+.3; add(ct,ding,.3,.45)
# S5: cube hops, gate beeps (no alarm), ? boing, land on 합격
def io(t): return 4*t*t*t if t<.5 else 1-(-2*t+2)**3/2
def xat(t): p=max(0,min(1,(t-27.98)/(30.87-27.98))); return -13+23*io(p)
passed=set(); t=27.78
while t<31.0:
    x=xat(t)
    for gi,gz in enumerate((-5,3)):
        if gi not in passed and x>=gz: passed.add(gi); add(t,beep,.1,1); add(t+.12,beep,.1,1)
    t+=0.01
t=27.98
while t<30.87: add(t,lambda x:0.2*sin(300+500*x*6,x)*math.exp(-x*20),.08,.8); t+=math.pi/7
add(29.97,boing,.6,.8); add(30.9,ding,.4,.6); add(30.9,sparkle,.5,.8)
# S6: bars grow pops, cutline zap, lens whoosh, wobble
for i in range(8): add(32.43+i*.08,pop,.18,.35)
add(33.25,lambda x:0.2*sin(140+800*x,x)*math.exp(-x*6),.4,.8)
add(34.25,whoosh(.6),.6,.6)
for k in range(5): add(34.6+k*.6,lambda x:0.12*sin(330+40*math.sin(x*60),x)*math.exp(-x*8),.3,.8)
# S7: footsteps, door slam, ticket sparkle, ? boing
t=37.81
while t<40.4: add(t,step,.08,.6); t+=math.pi/12
add(40.45,thud,.5,1.0); add(40.45,lambda x:0.2*noise()*math.exp(-x*20),.2,1)
add(40.9,sparkle,.5,1.0); add(41.8,boing,.6,.8)
# S8: calendar flip, shield clang
add(43.86,lambda x:0.3*noise()*math.exp(-x*30)+0.2*sin(500,x)*math.exp(-x*20),.2,.8)
add(46.05,lambda x:sum(sin(f,x) for f in (660,990,1320))*0.12*math.exp(-x*5),.6,1)
# S9: hands-up whoosh, comment pops, final ding
add(47.5,whoosh(.4),.4,.6)
for i in range(5): add(47.48+.4+i*.18,pop,.18,.5)
add(49.2,ding,.8,.7)
# soft pad bed (quieter during silence after clock stops)
for i in range(N):
    x=i/SR; env=min(1,x/2)*min(1,(D-x)/1.5)*(0.5 if stop<x<47.48 else 1)
    buf[i]+=env*0.02*(sin(110,x)+0.7*math.sin(2*math.pi*164.8*x+1)+0.5*math.sin(2*math.pi*220.5*x+2))*(1+0.25*math.sin(x*.8))
with wave.open(sys.argv[1],'w') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*30000)) for v in buf))
