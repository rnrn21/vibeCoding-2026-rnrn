/* Version 3: original PNG sequence + stable left-eye geometry. No CDN or build required. */
(() => {
  'use strict';
  const scriptURL = document.currentScript.src;
  const assetURL = name => new URL('assets/' + name, scriptURL).href;
  class HanmiWalker {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.meta = window.HANMI_WALK_DATA;
      this.frames = [];
      this.index = 0; this.elapsed = 0; this.last = 0; this.raf = 0;
      this.ready = false; this.visible = true; this.paused = false;
      this.trackMedia = window.top.matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)');
      this.tracking = this.trackMedia.matches; this.pointer = null; this.gaze = { x: 0, y: 0 };
      this.onTrackMediaChange = event => {
        this.tracking = event.matches;
        this.pointer = null;
        this.gaze = { x: 0, y: 0 };
        this.update();
      };
      this.trackMedia.addEventListener('change', this.onTrackMediaChange);
      this.reduce = matchMedia('(prefers-reduced-motion: reduce)');
      this.paused = this.reduce.matches;
      this.tick = this.tick.bind(this);
      this.onVisibility = () => { this.last = 0; this.update(); };
      document.addEventListener('visibilitychange', this.onVisibility);
      this.canvas.addEventListener('pointermove', e => {
        if (!this.tracking || e.pointerType === 'touch') return;
        const r = this.canvas.getBoundingClientRect();
        this.pointer = {x:(e.clientX-r.left)*1920/r.width,y:(e.clientY-r.top)*1080/r.height};
        this.update();
      });
      this.canvas.addEventListener('pointerleave', () => { this.pointer = null; this.update(); });
      this.canvas.addEventListener('pointercancel', () => { this.pointer = null; this.update(); });
      this.observer = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting; this.last = 0; this.update();
      }, {rootMargin:'80px'});
      this.observer.observe(root);
      this.onReduce = e => {this.paused=e.matches;this.syncButton();this.update();};
      this.reduce.addEventListener('change', this.onReduce);
      this.pauseButton = root.querySelector('[data-pause]');
      this.pauseButton?.addEventListener('click', () => {
        this.paused=!this.paused;this.syncButton();this.update();
      });
      root.querySelector('[data-track]')?.addEventListener('change', e => {
        this.tracking=e.target.checked; this.update();
      });
      this.syncButton(); this.load();
    }
    syncButton() {
      if(!this.pauseButton)return;
      this.pauseButton.textContent=this.paused?'재생':'일시정지';
      this.pauseButton.setAttribute('aria-pressed',String(this.paused));
    }
    async load() {
      const status=this.root.querySelector('[data-status]');
      let loaded=0, next=0;
      const worker=async()=>{
        while(next<this.meta.count){
          const i=next++;
          const img=new Image();
          await new Promise((resolve,reject)=>{
            img.onload=resolve;img.onerror=()=>reject(new Error(this.meta.src.replace('{n}',String(i+1))));
            img.src=assetURL(this.meta.src.replace('{n}',String(i+1)));
          });
          if(img.decode)await img.decode();
          this.frames[i]=img;loaded++;
          if(i===0)this.draw();
          if(status)status.textContent=`이미지 준비 중 ${loaded}/${this.meta.count}`;
        }
      };
      try{
        await Promise.all(Array.from({length:4},worker));
        this.ready=true;
        if(status)status.hidden=true;
        this.update();
      }catch(error){
        if(status)status.textContent=`이미지를 불러오지 못했습니다. assets 폴더를 확인하세요. (${error.message})`;
      }
    }
    target() {
      if(!this.tracking||!this.pointer)return {x:0,y:0};
      const eyes=this.meta.eyes[this.index],off=this.meta.offset[this.index];
      const x=off[0]+(eyes[0].x+eyes[1].x)/2;
      const y=off[1]+(eyes[0].y+eyes[1].y)/2;
      const dx=this.pointer.x-x,dy=this.pointer.y-y;
      const length=Math.hypot(dx,dy);
      const amount=Math.min(1,length/210);
      return length?{x:dx/length*amount,y:dy/length*amount}:{x:0,y:0};
    }
    update() {
      if(!this.ready||!this.visible||document.hidden){
        if(this.raf)cancelAnimationFrame(this.raf);
        this.raf=0;this.last=0;return;
      }
      if(this.reduce.matches){this.gaze=this.target();this.draw();}
      if(!this.raf)this.raf=requestAnimationFrame(this.tick);
    }
    tick(now) {
      this.raf=0;
      if(!this.ready||!this.visible||document.hidden){this.last=0;return;}
      const dt=this.last?Math.min((now-this.last)/1000,.1):0;
      this.last=now;
      if(!this.paused){
        this.elapsed+=dt;
        this.index=Math.floor(this.elapsed*this.meta.fps)%this.meta.count;
      }
      const target=this.target(),blend=1-Math.exp(-16*dt);
      this.gaze.x+=(target.x-this.gaze.x)*blend;
      this.gaze.y+=(target.y-this.gaze.y)*blend;
      this.draw();
      const movingEyes=Math.abs(target.x-this.gaze.x)+Math.abs(target.y-this.gaze.y)>.002;
      if(!this.paused||movingEyes)this.raf=requestAnimationFrame(this.tick);
      else this.last=0;
    }
    draw() {
      const img=this.frames[this.index];if(!img)return;
      const ctx=this.ctx,off=this.meta.offset[this.index];
      ctx.clearRect(0,0,1920,1080);
      ctx.drawImage(img,off[0],off[1]);
      // 매 프레임 원본 눈을 덮고 새 흰자와 눈동자를 합성합니다.
      // 이미지 파일은 수정하지 않으며, tracking을 끄면 원본 눈이 표시됩니다.
      if(!this.tracking)return;
      for(const eye of this.meta.eyes[this.index]){
        const x=off[0]+eye.x,y=off[1]+eye.y;
        const rx=eye.rx,ry=eye.ry;
        ctx.save();ctx.beginPath();
        ctx.ellipse(x,y,rx,ry,eye.rotation,0,Math.PI*2);ctx.clip();
        const white=ctx.createRadialGradient(x-rx*.3,y-ry*.4,2,x,y,ry*1.3);
        white.addColorStop(0,'#ffffff');white.addColorStop(.65,'#fcfcfd');white.addColorStop(1,'#dce8ed');
        ctx.fillStyle=white;ctx.fillRect(x-rx*2,y-ry*2,rx*4,ry*4);
        const px=x+this.gaze.x*rx*.29,py=y+this.gaze.y*ry*.23;
        const pupil=ctx.createRadialGradient(px-rx*.12,py-ry*.12,1,px,py,ry*.59);
        pupil.addColorStop(0,'#34434a');pupil.addColorStop(1,'#101b21');
        ctx.fillStyle=pupil;ctx.beginPath();ctx.ellipse(px,py,rx*.55,ry*.59,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.93)';ctx.beginPath();ctx.ellipse(px-rx*.16,py-ry*.25,rx*.12,ry*.13,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.arc(px+rx*.16,py+ry*.18,rx*.06,0,Math.PI*2);ctx.fill();ctx.restore();
      }
      // 돋보기 테두리는 눈보다 앞에 있으므로 원본에서 다시 합성합니다.
      ctx.save();ctx.beginPath();
      for(const [x,y,w] of this.meta.occluders[this.index])ctx.rect(off[0]+x-.5,off[1]+y-.5,w+1,2);
      ctx.clip();ctx.drawImage(img,off[0],off[1]);ctx.restore();
    }
    destroy() {
      cancelAnimationFrame(this.raf);this.observer.disconnect();
      document.removeEventListener('visibilitychange',this.onVisibility);
      this.trackMedia.removeEventListener('change',this.onTrackMediaChange);
      this.reduce.removeEventListener('change',this.onReduce);
      this.ready=false;this.frames=[];
    }
  }
  window.HanmiWalker=HanmiWalker;
  document.querySelectorAll('[data-hanmi-walker]').forEach(root=>{root.hanmiWalker=new HanmiWalker(root);});
})();
