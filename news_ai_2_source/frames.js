const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const [out,fps,from,to]=process.argv.slice(2);
 const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.goto('http://localhost:8766/index.html'); await p.waitForFunction(()=>window.READY,null,{timeout:120000});
 const N=Math.ceil(await p.evaluate(()=>DURATION)*fps);
 for(let i=+from;i<Math.min(N,+to);i++){ const f=`${out}/f_${String(i).padStart(5,'0')}.jpg`; if(fs.existsSync(f))continue;
   await p.evaluate(t=>render(t),i/fps); await p.screenshot({path:f,type:'jpeg',quality:93}); if(i%100==0)console.log('frame',i,'/',N); }
 await b.close(); console.log('done',from,to);
})();
