/* ---------- v24: painted attack VFX (window.CT_FX sprites) + one tiny canvas particle system ----------
   GC.FX.attack(tok, at{x,y} | element, o{host, dir, scale, shakeEl, inIntro}) → element|null
   toks: 2 不不奥特曼 beam · 3 哎呀公主 ice · 4 温柔喷火龙 fire · 5 猪肉战神 slam.  Phases: 蓄力 → 爆发 → 余韵.
   pointer-events:none, rAF only while playing, ≤120 particles, reduced motion → null (callers fall back). */
GC.FX=(function(){
 var IMG={},ready={},live=[],log=[],MAXP=120;
 function img(k){if(IMG[k])return IMG[k];var F=window.CT_FX;if(!F||!F[k])return null;var im=new Image();im.decoding='async';im.onload=function(){ready[k]=true};im.src=F[k];IMG[k]=im;return im}
 function ok(k){var i=img(k);return !!(i&&ready[k]&&i.naturalWidth)}
 try{setTimeout(function(){['fire','ice','beam','pigRing','coin','sausage','ham','ham2'].forEach(img)},2200)}catch(e){}
 var NEED={2:['beam'],3:['ice'],4:['fire'],5:['pigRing','coin']};
 /* v25: 画质 caps — eco: no canvas FX at all · std: ½ particles, ≤60, 1 at a time · hi: v24 full */
 function Q(){var m=(GC.Gfx&&GC.Gfx.mode)?GC.Gfx.mode():'hi';return m==='eco'?{off:true,maxp:40,live:1,half:true,fps:30,dpr:1}:m==='std'?{maxp:60,live:1,half:true,dpr:1.5}:{maxp:MAXP,live:2,dpr:1.5}}
 function has(t){var n=NEED[t];if(!n||Q().off)return false;n.forEach(img);return n.every(ok)}
 function reduce(){try{return (GC.UI&&GC.UI.reduce)?GC.UI.reduce():matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){return false}}
 function spd(){return (GC.Intro&&GC.Intro.speed)?GC.Intro.speed():1}
 var R=Math.random,PI=Math.PI;
 function E(a,b,t){t=t<0?0:t>1?1:t;return a+(b-a)*t}
 function seg(t,a,b){return t<=a?0:t>=b?1:(t-a)/(b-a)}
 function eo(t){return 1-Math.pow(1-t,3)}function eio(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
 function shake(el,amp,ms){if(!el||!el.animate||reduce())return;var k=[];for(var i=0;i<7;i++){var a=amp*(1-i/7);k.push({transform:'translate('+((R()-.5)*2*a).toFixed(1)+'px,'+((R()-.5)*2*a).toFixed(1)+'px)'})}k.push({transform:'none'});try{el.animate(k,{duration:ms,easing:'ease-out'})}catch(e){}}
 /* ---- particle helpers ---- */
 function heart(c,s){c.beginPath();c.moveTo(0,s*.35);c.bezierCurveTo(-s*1.1,-s*.3,-s*.45,-s*1.05,0,-s*.45);c.bezierCurveTo(s*.45,-s*1.05,s*1.1,-s*.3,0,s*.35);c.fill()}
 function flake(c,s){c.beginPath();for(var i=0;i<3;i++){var a=i*PI/3;c.moveTo(Math.cos(a)*s,Math.sin(a)*s);c.lineTo(-Math.cos(a)*s,-Math.sin(a)*s)}c.stroke()}
 function star(c,s){c.beginPath();c.moveTo(0,-s);c.quadraticCurveTo(s*.15,-s*.15,s,0);c.quadraticCurveTo(s*.15,s*.15,0,s);c.quadraticCurveTo(-s*.15,s*.15,-s,0);c.quadraticCurveTo(-s*.15,-s*.15,0,-s);c.fill()}
 function shard(c,s){c.beginPath();c.moveTo(0,-s);c.lineTo(s*.32,0);c.lineTo(0,s);c.lineTo(-s*.32,0);c.closePath();c.fill();c.stroke()}
 /* ---- one effect instance ---- */
 function attack(tok,at,o){
  o=o||{};if(reduce()||!has(tok))return null;
  var q0=Q();while(live.length>=q0.live){var old=live.shift();old.stop()}
  /* v26: in-game angry = 大招/SUPER (full-screen takeover). Select intro keeps showcase size via o.inIntro. */
  var SUPER=!!o.super;
  var host=o.host||document.body,full=host===document.body,cv=document.createElement('canvas');
  cv.className='fxa mood'+(o.inIntro?' fxi':'')+(SUPER?' fxsuper':'');cv.style.cssText='position:'+(full?'fixed':'absolute')+';left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:'+(full?(SUPER?80:60):'auto');
  if(o.before&&o.before.parentNode===host)host.insertBefore(cv,o.before);else host.appendChild(cv);
  var hr=full?{left:0,top:0,width:innerWidth,height:innerHeight}:host.getBoundingClientRect(),W=hr.width,H=hr.height;
  var dpr=Math.min(window.devicePixelRatio||1,SUPER?Math.min(2,q0.dpr+0.25):q0.dpr);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  var c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  var p0=at&&at.getBoundingClientRect?(function(r){return{x:r.left+r.width/2,y:r.top+r.height/2,s:Math.max(r.width,r.height)}})(at.getBoundingClientRect()):{x:at.x,y:at.y,s:at.s||48};
  var X=p0.x-hr.left,Y=p0.y-hr.top,dir=o.dir||(X>W*.5?-1:1),SC=o.scale||Math.min(W,H)/820;
  if(SUPER){/* stage the blast across the screen, not on the tiny token */X=o.x!=null?o.x:(dir<0?W*.78:W*.22);Y=o.y!=null?o.y:H*.52;SC=Math.min(W,H)/520;dir=X>W*.5?-1:1;
   if(!o.len)o.len=tok===2?W*1.05:tok===4?W*.95:o.len;if(!o.size)o.size=tok===3?Math.min(W,H)*.92:tok===5?Math.min(W*.95,H*1.35):o.size;
   if(q0.half){q0={maxp:Math.min(100,q0.maxp*2),live:q0.live,half:false,dpr:q0.dpr,fps:q0.fps}}}
  var D={2:1900,3:2000,4:2000,5:2100}[tok]*spd()*(o.k||1)*(SUPER?1.45:1),t0=performance.now(),P=[],raf=0,frames=0,maxP=0,dead=false,last=t0,slow=0;
  var rec={tok:tok,t0:Date.now(),D:Math.round(D),q:(GC.Gfx&&GC.Gfx.mode)?GC.Gfx.mode():'hi',dpr:0,super:SUPER};log.push(rec);if(log.length>40)log.shift();
  cv.setAttribute('data-life',Math.round(D));rec.dpr=dpr;
  var nadd=0;function add(p){if(P.length>=q0.maxp)return;if(q0.half&&!p.img&&(++nadd&1))return;P.push(p)}
  var st={};
  function frame(now){
   if(dead)return;if(q0.fps&&now-last<30){raf=requestAnimationFrame(frame);return}var t=(now-t0)/D,dt=Math.min(.05,(now-last)/1000);if(now-last>24)slow++;last=now;frames++;
   c.clearRect(0,0,W,H);
   if(t>=1){stop();return}
   FX[tok](t,dt);
   /* particles */
   for(var i=P.length-1;i>=0;i--){var q=P[i];q.l-=dt;if(q.l<=0){P.splice(i,1);continue}
    q.vx*=q.dr||1;q.vy=q.vy*(q.dr||1)+(q.g||0)*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.r+=(q.vr||0)*dt;
    if(q.ground!=null&&q.y>q.ground){q.y=q.ground;q.vy*=-.42;q.vx*=.7;q.vr*=.6}
    var a=Math.min(1,q.l/(q.fade||.35))*(q.a||1);if(a<=.01)continue;
    c.save();c.globalAlpha=a;c.translate(q.x,q.y);c.rotate(q.r||0);if(q.add)c.globalCompositeOperation='lighter';
    if(q.img){var im=IMG[q.img],w=q.s,h=w*im.naturalHeight/im.naturalWidth;c.drawImage(im,-w/2,-h/2,w,h)}
    else{c.fillStyle=q.c;c.strokeStyle=q.c;c.lineWidth=Math.max(1,q.s/5);
     if(q.k==='heart')heart(c,q.s);else if(q.k==='flake')flake(c,q.s);else if(q.k==='star')star(c,q.s);else if(q.k==='shard'){c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;shard(c,q.s)}
     else{c.beginPath();c.arc(0,0,q.s,0,2*PI);c.fill()}}
    c.restore()}
   maxP=Math.max(maxP,P.length);raf=requestAnimationFrame(frame)}
  function stop(){if(dead)return;dead=true;cancelAnimationFrame(raf);rec.t1=Date.now();rec.frames=frames;rec.maxP=maxP;rec.slow=slow;rec.fps=Math.round(frames/((rec.t1-rec.t0)/1000));cv.remove();var i=live.indexOf(inst);if(i>=0)live.splice(i,1)}
  function glow(x,y,r,col,a){var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,'+a+')');g.addColorStop(.25,col.replace('A',a*.9));g.addColorStop(1,col.replace('A',0));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,2*PI);c.fill()}
  var FX={
   /* 温柔喷火龙: mouth glow → flame reveals along X (2 jittering layers + strip shimmer) → embers drift up */
   4:function(t,dt){var im=IMG.fire,L=(o.len||Math.min(W*.62,620*SC*1.6)),h=L*im.naturalHeight/im.naturalWidth,ch=seg(t,0,.22),b=seg(t,.2,.72),ln=seg(t,.68,1);
    if(t<.3)glow(X,Y,(14+30*eo(ch))*SC*1.4,'rgba(255,140,40,A)',.9*E(1,.4,seg(t,.22,.3)));
    if(t<.22&&R()<.6)add({x:X+(R()-.5)*90*SC,y:Y+(R()-.5)*90*SC,vx:0,vy:0,l:.25,s:2.5*SC+1,c:'#ffd27a',add:1,dr:.8,a:.9,fade:.2,_to:1});
    P.forEach(function(q){if(q._to){q.vx=(X-q.x)*9;q.vy=(Y-q.y)*9}});
    if(b>0){var rv=eo(seg(t,.2,.42)),fa=1-eio(ln);
     if(!st.f){st.f=1;if(!SUPER){shake(o.shakeEl,6*SC+2,320);if(!o.inIntro)tint('rgba(255,120,40,.16)')}else shake(o.shakeEl,16*SC+4,520)}
     c.save();c.translate(X,Y);if(dir<0)c.scale(-1,1);
     for(var layer=0;layer<2;layer++){var j=Math.sin(t*90+layer*2)*.03,sx=(1+j)*(1+.04*layer),sk=Math.sin(t*55+layer)*.04;
      c.save();c.globalAlpha=fa*(layer?.55:1);c.transform(1,sk,0,1+j*1.5,0,0);c.translate(-L*.02,(layer?-6:0)*SC);
      var sw=im.naturalWidth*rv,n=6;for(var s=0;s<n;s++){var sy=im.naturalHeight*s/n,sh=im.naturalHeight/n,off=Math.sin(t*40+s*1.7)*3*SC*b;   /* heat shimmer: strips wobble */
       c.drawImage(im,0,sy,sw,sh,off,-h/2+h*s/n,L*rv*sx,h/n+.5)}
      c.restore()}
     c.restore();
     if(b<1&&R()<.7)add({x:X+dir*L*rv*(.3+R()*.7),y:Y+(R()-.5)*h*.6,vx:dir*(40+R()*60)*SC,vy:-(20+R()*60)*SC,l:.9+R()*.8,s:(5+R()*6)*SC+2,k:R()<.55?'heart':'dot',c:R()<.5?'#ff5a8a':'#ffb03a',r:(R()-.5),vr:(R()-.5)*2,a:.95})}
    if(ln>0&&R()<.5)add({x:X+dir*R()*L*.8,y:Y+(R()-.5)*h*.4,vx:(R()-.5)*20,vy:-(30+R()*50)*SC,l:1+R()*.6,s:(2+R()*3)*SC+1,c:'#ffcf6b',add:1,a:.9})},
   /* 哎呀公主: wand-tip twinkle → ice burst spins/scales in → frost vignette + drifting flakes → crystal shards shatter out */
   3:function(t,dt){var im=IMG.ice,S0=(o.size||Math.min(W,H)*.6),ch=seg(t,0,.25),b=seg(t,.22,.66),ln=seg(t,.62,1);
    if(t<.32){var tw=(.5+.5*Math.sin(t*70))*eo(ch);glow(X,Y,(10+28*eo(ch))*SC*1.3,'rgba(150,215,255,A)',.95);c.save();c.translate(X,Y);c.rotate(t*6);c.fillStyle='rgba(255,255,255,'+(.6+.4*tw)+')';star(c,(10+16*tw)*SC+3);c.restore();
     if(R()<.5){var a=R()*2*PI,r=(40+R()*30)*SC;add({x:X+Math.cos(a)*r,y:Y+Math.sin(a)*r,vx:-Math.cos(a)*r*2.6,vy:-Math.sin(a)*r*2.6,l:.38,s:(3+R()*3)*SC+1,k:'star',c:'#dff6ff',add:1})}}
    var vg=Math.min(seg(t,.22,.5),1-seg(t,.75,1));if(vg>0)vign('rgba(170,225,255,A)',.42*vg);
    if(b>0){var sc=E(.15,1,eo(seg(t,.22,.5)))*(1+.08*ln),rot=E(-.6,.25,eo(seg(t,.22,.6)))+ln*.15,a=1-eio(ln);
     c.save();c.translate(X,Y);c.rotate(rot);c.globalAlpha=a;var s=S0*sc;c.drawImage(im,-s/2,-s/2,s,s);c.globalCompositeOperation='lighter';c.globalAlpha=a*.35*(1-seg(t,.3,.5));c.drawImage(im,-s/2,-s/2,s,s);c.restore();
     if(!st.b){st.b=1;shake(o.shakeEl,3*SC+1,260)}
     if(b<1&&R()<.75){var a2=R()*2*PI,v=(60+R()*120)*SC;add({x:X,y:Y,vx:Math.cos(a2)*v,vy:Math.sin(a2)*v-10,g:22*SC,dr:.985,l:1.2+R()*.8,s:(5+R()*7)*SC+2,k:'flake',c:R()<.6?'#ffffff':'#9fdcff',r:R()*3,vr:(R()-.5)*1.5,a:.95})}}
    if(ln>0&&!st.sh){st.sh=1;for(var i=0;i<22;i++){var a3=i/22*2*PI+R()*.2,v3=(160+R()*160)*SC;add({x:X+Math.cos(a3)*S0*.22,y:Y+Math.sin(a3)*S0*.22,vx:Math.cos(a3)*v3,vy:Math.sin(a3)*v3,g:120*SC,dr:.97,l:.7+R()*.5,s:(7+R()*9)*SC+2,k:'shard',c:'rgba(200,240,255,.85)',r:a3+PI/2,vr:(R()-.5)*6})}}},
   /* 不不奥特曼: energy converges into the hand → beam fires across (reveal) + core flash + ring pulses + white frame + shake → stars linger */
   2:function(t,dt){var im=IMG.beam,L=(o.len||Math.min(W*.9,1000*SC*1.4)),h=L*im.naturalHeight/im.naturalWidth,ch=seg(t,0,.3),b=seg(t,.3,.68),ln=seg(t,.64,1);
    if(t<.34){glow(X,Y,(8+34*eio(ch))*SC*1.3,'rgba(255,220,90,A)',.95);
     if(R()<.9){var a=R()*2*PI,r=(70+R()*60)*SC;add({x:X+Math.cos(a)*r,y:Y+Math.sin(a)*r,vx:0,vy:0,l:.32,s:(2+R()*2.5)*SC+1,c:R()<.5?'#fff3a0':'#8fd6ff',add:1,_to:1})}
     P.forEach(function(q){if(q._to){q.vx=(X-q.x)*7;q.vy=(Y-q.y)*7}})}
    if(b>0){var rv=eo(seg(t,.3,.38)),fa=1-eio(ln),py=1+.12*Math.sin(t*80)*(1-ln);
     if(!st.f){st.f=1;shake(o.shakeEl,7*SC+2,300);flash(.55)}
     c.save();c.translate(X,Y);if(dir<0)c.scale(-1,1);c.globalAlpha=fa;
     c.drawImage(im,0,0,im.naturalWidth*rv,im.naturalHeight,-L*.05,-h*py/2*(1-ln*.6),L*rv,h*py*(1-ln*.6));
     c.globalCompositeOperation='lighter';var g=c.createLinearGradient(0,-8,0,8);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,'+(.9*fa)+')');g.addColorStop(1,'rgba(255,255,255,0)');
     c.fillStyle=g;c.fillRect(0,-6*SC*py-2,L*rv*.95,12*SC*py+4);c.restore();
     for(var k=0;k<3;k++){var rp=seg(t,.3+k*.08,.62+k*.08);if(rp>0&&rp<1){c.save();c.globalAlpha=(1-rp)*.9;c.strokeStyle=k%2?'#8fd6ff':'#fff3a0';c.lineWidth=(6*(1-rp)+1)*SC+1;c.beginPath();c.ellipse(X,Y,(20+110*rp)*SC,(20+110*rp)*SC*.8,0,0,2*PI);c.stroke();c.restore()}}
     if(R()<.8)add({x:X+dir*R()*L*rv,y:Y+(R()-.5)*h*.5,vx:dir*(80+R()*80)*SC,vy:(R()-.5)*40,l:.8+R()*.9,s:(4+R()*6)*SC+2,k:'star',c:R()<.6?'#fff3a0':'#bfe8ff',add:1,r:R()*PI})}},
   /* 猪肉战神: hop anticipation → slam: ring sprite expands + shock ellipses + coins/sausages/hams arc out with gravity & bounce + dust */
   5:function(t,dt){var im=IMG.pigRing,Wd=(o.size||Math.min(W*.8,H*1.3,760*SC*1.5)),hd=Wd*im.naturalHeight/im.naturalWidth,gy=Y+(o.ground!=null?o.ground:22*SC),ch=seg(t,0,.24),b=seg(t,.24,.6),ln=seg(t,.56,1);
    if(t<.26){var hop=Math.sin(ch*PI);c.save();c.globalAlpha=.35;c.fillStyle='#000';c.beginPath();c.ellipse(X,gy,(26-12*hop)*SC+6,(7-3*hop)*SC+2,0,0,2*PI);c.fill();c.restore();
     if(!st.h&&o.target&&o.target.animate){st.h=1;try{o.target.animate([{transform:'translateY(0) scale(1)'},{transform:'translateY(-'+Math.round(18*SC+6)+'px) scale(1.06,.94)',offset:.55},{transform:'translateY(2px) scale(1.12,.86)',offset:.92},{transform:'none'}],{duration:D*.27,easing:'ease-in'})}catch(e){}}}
    if(b>0||ln>0){var sc=E(.25,1.05,eo(seg(t,.24,.5))),a=1-eio(seg(t,.5,1));
     if(!st.s){st.s=1;if(!SUPER){shake(o.shakeEl,10*SC+3,420);if(!o.inIntro)tint('rgba(255,170,60,.14)')}else shake(o.shakeEl,18*SC+5,560);
      var K=['coin','coin','coin','coin','coin','coin','coin','coin','coin','coin','sausage','sausage','sausage','ham','ham2'];
      K.forEach(function(k,i){var a2=-PI/2+(R()-.5)*2.2,v=(260+R()*260)*SC;add({img:ok(k)?k:'coin',x:X+(R()-.5)*30*SC,y:gy-6,vx:Math.cos(a2)*v,vy:Math.sin(a2)*v,g:900*SC,ground:gy+(R()-.5)*10*SC,l:1.15+R()*.5,fade:.3,s:((k==='coin'?26:k.indexOf('ham')===0?52:42)*SC+6)*(o.inIntro?1.9:SUPER?2.4:1.5),r:R()*6,vr:(R()-.5)*9})});
      for(var d=0;d<14;d++){var a4=PI+R()*PI*0,ang=(d/14)*PI+PI,v4=(80+R()*120)*SC;add({x:X+(R()-.5)*40*SC,y:gy,vx:Math.cos(ang)*v4*(R()<.5?-1:1),vy:-(10+R()*40)*SC,dr:.95,l:.7+R()*.4,s:(8+R()*10)*SC+3,c:'rgba(150,120,90,.55)',a:.8})}}
     c.save();c.globalAlpha=a;c.translate(X,gy-hd*.62*sc);c.drawImage(im,-Wd*sc/2,0,Wd*sc,hd*sc);c.restore();
     for(var k=0;k<2;k++){var rp=seg(t,.24+k*.07,.62+k*.07);if(rp>0&&rp<1){c.save();c.globalAlpha=(1-rp)*.8;c.strokeStyle=k?'#ffd36b':'#fff';c.lineWidth=(8*(1-rp)+1)*SC+1;c.beginPath();c.ellipse(X,gy,(30+Wd*.55*rp),(10+Wd*.15*rp),0,0,2*PI);c.stroke();c.restore()}}}}
  };
  function vign(col,a){var g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);g.addColorStop(0,col.replace('A',0));g.addColorStop(1,col.replace('A',a));c.fillStyle=g;c.fillRect(0,0,W,H)}
  function flash(a){var f=document.createElement('div');f.className='fxflash';f.style.cssText='position:'+(full?'fixed':'absolute')+';inset:0;background:#fff;pointer-events:none;z-index:'+(full?(SUPER?81:61):'auto');host.appendChild(f);try{f.animate([{opacity:a*(SUPER?1.15:1)},{opacity:0}],{duration:SUPER?380:240,easing:'ease-out'}).onfinish=function(){f.remove()}}catch(e){f.remove()}}
  function tint(col){var f=document.createElement('div');f.style.cssText='position:fixed;inset:0;background:'+col+';pointer-events:none;z-index:'+(SUPER?79:59);document.body.appendChild(f);try{f.animate([{opacity:0},{opacity:1,offset:.18},{opacity:0}],{duration:Math.min(SUPER?1400:900,D*(SUPER?.55:.45)),easing:'ease-out'}).onfinish=function(){f.remove()}}catch(e){f.remove()}}
  function dimBoard(){var f=document.createElement('div');f.className='fxdim';f.style.cssText='position:fixed;inset:0;background:rgba(8,4,20,.55);pointer-events:none;z-index:78';document.body.appendChild(f);try{f.animate([{opacity:0},{opacity:1,offset:.12},{opacity:1,offset:.72},{opacity:0}],{duration:D,easing:'ease-in-out'}).onfinish=function(){f.remove()}}catch(e){setTimeout(function(){f.remove()},D)}
   try{var NM=['小狗','小狮子','不不奥特曼','哎呀公主','温柔喷火龙','猪肉战神'];var plate=document.createElement('div');plate.className='fxplate';plate.textContent=o.caption||((NM[tok]||'')+' · 大招!');
    plate.style.cssText='position:fixed;left:4%;bottom:8%;z-index:82;pointer-events:none;font:900 clamp(18px,3.6vh,36px)/1.1 system-ui,sans-serif;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.45),0 0 18px rgba(255,180,60,.7);letter-spacing:2px';
    document.body.appendChild(plate);
    try{plate.animate([{opacity:0,transform:'translateY(18px) scale(.9)'},{opacity:1,transform:'none',offset:.15},{opacity:1,offset:.75},{opacity:0,transform:'translateY(-8px)'}],{duration:D,easing:'ease-out'}).onfinish=function(){plate.remove()}}catch(e){setTimeout(function(){plate.remove()},D)}
    /* v27: angry portrait swap (温柔喷火龙 fire form) beside the blast */
    var AN=window.CT_ART_ANGRY;if(AN&&AN[tok]){var port=document.createElement('img');port.className='fxport';port.src=AN[tok];port.alt='';
     port.style.cssText='position:fixed;left:2%;bottom:18%;height:min(58vh,420px);width:auto;z-index:81;pointer-events:none;filter:drop-shadow(0 10px 0 rgba(0,0,0,.35));object-fit:contain';
     document.body.appendChild(port);try{port.animate([{opacity:0,transform:'translateX(-24px) scale(1.08)'},{opacity:1,transform:'none',offset:.18},{opacity:1,offset:.7},{opacity:0,transform:'translateX(-10px)'}],{duration:D,easing:'ease-out'}).onfinish=function(){port.remove()}}catch(e){setTimeout(function(){port.remove()},D)}}}catch(e){}}
  if(SUPER){dimBoard();shake(o.shakeEl||document.querySelector('.ctb')||document.body,14*SC+4,Math.min(700,D*.35));flash(.7);tint({2:'rgba(255,230,80,.22)',3:'rgba(150,215,255,.22)',4:'rgba(255,90,30,.24)',5:'rgba(255,170,60,.22)'}[tok]||'rgba(255,200,80,.2)')}
  var _stop0=stop;stop=function(){_stop0();document.querySelectorAll('.fxdim,.fxplate,.fxport').forEach(function(n){try{n.remove()}catch(e){}})};
  var inst={el:cv,stop:stop,super:SUPER};live.push(inst);raf=requestAnimationFrame(frame);
  return cv;
 }
 return{attack:attack,has:has,_log:log,live:function(){return live.length},kill:function(){live.slice().forEach(function(i){i.stop()})},preload:function(){['fire','ice','beam','pigRing','coin','sausage','ham','ham2'].forEach(img)}};
})();
