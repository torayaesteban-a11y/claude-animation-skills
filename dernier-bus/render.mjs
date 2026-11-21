import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFile, mkdir } from 'node:fs/promises';

const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
  for(let i=0;i<50;i++){
    try { await fetch('http://127.0.0.1:8765/'); break; }
    catch { await new Promise(r=>setTimeout(r,100)); }
  }
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader','--num-raster-threads=2']});
  const page=await browser.newPage({viewport:{width:720,height:1280}});
  page.on('pageerror',err=>console.error(err));
  await page.goto('http://127.0.0.1:8765/');
  await page.waitForFunction(()=>typeof window.renderAt==='function');
  async function frame(t) {
    return Buffer.from(await page.evaluate(time=>window.renderAt(time),t),'base64');
  }
  if(process.argv[2]==='preview'){
    await mkdir('stills',{recursive:true});
    for(const [i,t] of [.8,6.5,10,14.4,18,21.5,25,31.7,34.5,39.9,43.5].entries())
      await writeFile('stills/'+String(i).padStart(2,'0')+'.jpg',await frame(t));
  } else {
    const out=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','24','-vcodec','mjpeg','-i','-','-c:v','libx264','-threads','2','-preset','ultrafast','-crf','17','-pix_fmt','yuv420p','silent.mp4'],{stdio:['pipe','inherit','inherit']});
    const finished=once(out,'close');
    for(let i=0;i<1080;i++) {
      if(!out.stdin.write(await frame(i/24)))await once(out.stdin,'drain');
      if(i%120===0)console.log('Image',i,'/ 1080');
    }
    out.stdin.end();
    const [status]=await finished;
    if(status!==0)throw new Error('ffmpeg: '+status);
  }
} finally {
  if(browser)await browser.close();
  server.kill();
}
