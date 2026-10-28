/* ======================= 飞行棋 Phase-1b 棋盘 UI · 经典玩法+趣味动画 ======================= */
var FLY=(function(){
'use strict';
var E=window.FLYE,Store=GC.Store,Sound=GC.Sound,UI=GC.UI,Dice=GC.Dice,Select=GC.Select;
var TKN=E.TKN,TKC=['#2f80ed','#f2b705','#e53935','#ff4fa3','#1fae5b','#8e44ec'];
var root,S,busy=false,selv=null,timers=[],ro=null,lastDie=6,cancel=null,fxLayer=null,plateURL=null,bubs={},faceMood={};
var pokeN={},pokeAt={},pokeLock=0,pokeBurst=0,pokeBurstT=0,duckUntil=0,lastToastTurn=null,lastToastAt=0,flyRoundN=1,walkShow=null;
function $q(s){return root.querySelector(s)}
function later(f,ms){var t=setTimeout(f,ms);timers.push(t);return t}
function esc(s){return UI.esc(s)}
function avSrc(tok,mood){var M=window.CT_AV_MOOD,A=window.CT_AV,k=mood==='proud'?'happy':mood;if(k&&M&&M[k]&&M[k][tok])return M[k][tok];if(A&&A[tok])return A[tok];return null}
function persistMood(p){if(!p)return null;if(S&&S.winner===p.id)return 'proud';var m=faceMood[p.id];if(m&&Date.now()<m.until)return m.kind;return null}
function tkAv(tok,sz,cls,mood){var src=avSrc(tok,mood),inn=src?'<img class="tkimg" src="'+src+'" alt="" draggable="false" decoding="async">':'<svg viewBox="-24 -24 48 48"><use href="#tk'+tok+'"/></svg>';return '<span class="tkm '+(cls||'')+'"'+(mood?' data-mood="'+mood+'"':'')+' style="width:'+sz+'px;height:'+sz+'px">'+inn+'</span>'}
function eco(){try{return GC.Gfx&&GC.Gfx.mode()==='eco'}catch(e){return false}}
function save(){if(S)S.sv=Date.now();Store.set('fly',S)}
function load(){
 var s=Store.get('fly',null);
 if(s&&s.players&&s.players.length){
  S=s;if(!S.phase)S.phase='play';
  S.players.forEach(function(p){(p.planes||[]).forEach(function(pl){if(pl.padLock==null)pl.padLock=false})});
 }else{S=E.newState()}
}
function isl(){return !!(root&&root.classList.contains('fl-island')&&window.FLY3D)}
function seatOf(p){return E.seatOf?E.seatOf(p):(p&&p.seat!=null?p.seat:((p&&p.id)||0))}
function planeImg(p){
 var seat=typeof p==='object'?seatOf(p):(p%4),tok=typeof p==='object'&&p.tok!=null?p.tok:0;
 if(window.FLY3D&&window.FLY3D.tokenSVG)return window.FLY3D.tokenSVG(seat,tok);
 var keys=['red','yellow','blue','green'];var k=keys[seat%4];var src=(window.FL_PLANES&&window.FL_PLANES[k])||'';
 if(src)return '<img class="fl-plane-img" src="'+src+'" alt="" draggable="false" decoding="async">';
 return planeSVG(E.COLORS[seat%4]);
}
function planeSVG(color){var gid='pg'+Math.random().toString(36).slice(2,8);return '<svg class="fl-plane" viewBox="-20 -20 40 40" aria-hidden="true"><defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity=".7"/><stop offset="42%" stop-color="'+color+'"/><stop offset="100%" stop-color="#000" stop-opacity=".28"/></linearGradient><filter id="'+gid+'s"><feDropShadow dx="0" dy="1" stdDeviation="0.7" flood-opacity=".3"/></filter></defs><ellipse cx="0" cy="12" rx="9" ry="2.8" fill="#00000028"/><g transform="translate(0,-1.2) rotate(18)" filter="url(#'+gid+'s)"><path d="M0-14C2.6-14 3.8-10 3.8-5.4L14 3.4V6.6L3.8 2.4V9.6L8.2 13.2V15.4L0 13.6-8.2 15.4V13.2L-3.8 9.6V2.4L-14 6.6V3.4L-3.8-5.4C-3.8-10-2.6-14 0-14Z" fill="url(#'+gid+')" stroke="#fff" stroke-width="1.9" stroke-linejoin="round"/><path d="M0-14C1.7-14 2.6-10.4 2.6-6.6V2.2" stroke="#fff" stroke-width="1.3" opacity=".5" fill="none"/><circle cy="-6.6" r="2.35" fill="#b8ecff" stroke="#fff" stroke-width="0.9"/><ellipse cx="0" cy="4" rx="2.2" ry="1.1" fill="#000" opacity=".12"/></g></svg>'}

function ringPos(i){return isl()?window.FLY3D.ringPos(i):E.ringPos(i)}
function homePos(pid,idx){return isl()?window.FLY3D.homePos(pid,idx):E.homePos(pid,idx)}
function basePos(pid,k){return isl()?window.FLY3D.basePos(pid,k):E.basePos(pid,k)}
function cellXY(where,idx,pid){
 if(where==='track'||where==='pad')return ringPos(idx);
 if(where==='home')return homePos(pid,idx);
 if(where==='done')return isl()?basePos(pid,0):E.donePos(pid);
 return basePos(pid,idx);
}
function gPct(c,r){return E.gridPct(c,r)}
function cellSizePct(){if(isl())return 5.4;return (100/15)*(root&&root.classList.contains('fl-print')?0.98:1.00)}
function homeSizePct(){if(isl())return 5.6;return (100/15)*(root&&root.classList.contains('fl-print')?0.98:0.92)}

/* ---- DOM sparkles (skipped in eco) ---- */
function ensureFx(){
 if(!fxLayer){fxLayer=document.createElement('div');fxLayer.className='flfx';fxLayer.setAttribute('aria-hidden','true');var b=$q('#flb');if(b)b.appendChild(fxLayer)}
 return fxLayer;
}
function sparkAt(xPct,yPct,cls,n){
 if(eco())return;
 var layer=ensureFx();if(!layer)return;
 n=n||8;
 for(var i=0;i<n;i++){
  var s=document.createElement('i');
  s.className='flsp '+(cls||'');
  var ang=Math.random()*Math.PI*2,dist=8+Math.random()*28;
  s.style.left=xPct+'%';s.style.top=yPct+'%';
  s.style.setProperty('--dx',(Math.cos(ang)*dist)+'px');
  s.style.setProperty('--dy',(Math.sin(ang)*dist)+'px');
  s.style.setProperty('--h',(Math.random()*360)|0);
  layer.appendChild(s);
  (function(el){later(function(){try{el.remove()}catch(e){}},900)})(s);
 }
}
function trailAlong(pts,color){
 if(eco()||!pts||!pts.length)return;
 pts.forEach(function(p,i){
  later(function(){sparkAt(p.x,p.y,'trail',3)},i*40);
 });
}

/* ---- 大富翁角色反应: 台词 + 表情贴图 + 立绘/特效（复用 GC.Mood / Voice / CTE_LINES） ---- */
function P(id){return S&&S.players?S.players[id]:null}
function fxOn(){return !eco()&&!(UI.reduce&&UI.reduce())}
function moodTarget(pid){
 var c=root&&root.querySelector('.flpc[data-pid="'+pid+'"] .av');
 if(c&&c.getBoundingClientRect().width)return c;
 var t=root&&root.querySelector('.fltok.go[data-p="'+pid+'"],.fltok[data-p="'+pid+'"]');
 return t&&t.getBoundingClientRect().width?t:null;
}
function flashMoodFace(pid,kind){
 var p=P(pid);if(!p)return;var src=avSrc(p.tok,kind);if(!src)return;
 faceMood[pid]={kind:kind==='proud'?'happy':kind,until:Date.now()+2200};
 var img=root&&root.querySelector('.flpc[data-pid="'+pid+'"] img.tkimg');
 if(img){img.setAttribute('src',src);img.setAttribute('data-flash-mood',kind);
  later(function(){if(img.getAttribute('data-flash-mood')!==kind)return;var back=avSrc(p.tok,persistMood(p));if(back)img.setAttribute('src',back);img.removeAttribute('data-flash-mood')},2200)}
}
var FLY_PLATE={happy:'起飞啦!',proud:'冲向终点!',angry:'叠吃!',sad:'回基地了…',worried:'小心!',sleep:'休息一下…'};
function mood(pid,kind,o){
 if(!GC.Mood)return;var p=P(pid);if(!p||!kind)return;
 try{flashMoodFace(pid,kind)}catch(e){}
 var t=moodTarget(pid);
 try{GC.Mood.play(p.tok,kind,t||document.body,Object.assign({key:'fl'+kind+pid,theme:'fly',plate:FLY_PLATE[kind]||''},o||{}))}catch(x){}
}
function showBubble(p,txt,type){
 if(!p||!txt||!root)return;
 bubs[p.id]={txt:txt,type:type,until:Date.now()+3200};
 var pc=root.querySelector('.flpc[data-pid="'+p.id+'"]');
 if(!pc)return;
 var ob=pc.querySelector('.pbub');if(ob)ob.remove();
 var b=document.createElement('div');b.className='pbub t-'+type;b.textContent=txt;pc.appendChild(b);
 pc.classList.remove('shake');void pc.offsetWidth;pc.classList.add('shake');
 later(function(){if(!bubs[p.id]||bubs[p.id].txt!==txt)return;b.classList.add('out');later(function(){try{b.remove()}catch(e){}},200);delete bubs[p.id]},2800);
}
function restoreBubs(){
 Object.keys(bubs).forEach(function(id){
  var b=bubs[id];if(!b||Date.now()>b.until){delete bubs[id];return}
  var pc=root&&root.querySelector('.flpc[data-pid="'+id+'"]');if(!pc||pc.querySelector('.pbub'))return;
  var d=document.createElement('div');d.className='pbub t-'+b.type;d.textContent=b.txt;pc.appendChild(d);
 });
}
function sayReact(pid,type,o){
 o=o||{};var p=P(pid);if(!p||!type)return '';
 var txt='',LN=window.CTE_LINES;
 try{txt=(LN&&LN.pickFly)?LN.pickFly(p.tok,type,function(n){return Dice.int(n)}):''}catch(e){}
 if(txt){showBubble(p,txt,type);try{GC.Voice.say(txt,p.tok,{queue:1,prot:1})}catch(x){}}
 if(o.mood)mood(pid,o.mood,{tiny:!!o.tiny,noFs:o.noFs!=null?!!o.noFs:!!o.tiny,key:o.key||('fl'+type+pid),plate:o.plate||txt||FLY_PLATE[o.mood]||''});
 return txt;
}
function playerAtSeat(seat){
 if(!S||!S.players)return null;
 var i,p=null;for(i=0;i<S.players.length;i++)if(seatOf(S.players[i])===seat)p=S.players[i];
 return p;
}
function bannerOn(){try{return GC.Intro.mode()!=='off'&&!(GC.Gfx&&GC.Gfx.mode()==='eco')}catch(e){return false}}
function takeoffWaitId(p){
 if(!S||!S.pending||!S.pending.mov||!p||S.turn!==p.id)return -1;
 var mov=S.pending.mov,best=-1,i,pl;
 for(i=0;i<p.planes.length;i++){
  pl=p.planes[i];
  if(pl.where==='base'&&mov.indexOf(pl.id)>=0&&(best<0||pl.id<best))best=pl.id;
 }
 return best;
}
function announceTurn(pid,o){
 o=o||{};
 if(!S||S.phase!=='play')return;
 var p=P(pid);if(!p)return;
 if(!o.force&&lastToastTurn===pid&&Date.now()-lastToastAt<1400)return;
 lastToastTurn=pid;lastToastAt=Date.now();
 var bn=false;
 try{if(bannerOn())bn=GC.Intro.banner(p.tok,p.name,'轮到你啦!',{sub:'下一位 · 第 '+flyRoundN+' 回合'})}catch(e){}
 if(!bn){try{Sound.pop()}catch(e){}}
 sayReact(pid,'turnStart',{mood:'happy',tiny:1,key:'flturn'+pid,plate:'轮到你啦!'});
 var pc=root&&root.querySelector('.flpc[data-pid="'+pid+'"]');
 if(pc){pc.classList.remove('turn-pop');void pc.offsetWidth;pc.classList.add('turn-pop')}
}
function noteTurnAdvance(prev){
 if(!S||S.phase!=='play'||S.again||S.turn===prev)return;
 if(S.turn<prev)flyRoundN++;
 announceTurn(S.turn);
}
function renderHangars(){
 if(!root)return;
 var curSeat=S&&S.players&&S.players[S.turn]?seatOf(S.players[S.turn]):-1;
 Array.prototype.forEach.call(root.querySelectorAll('.flbase'),function(el){
  var seat=+el.getAttribute('data-p'),p=playerAtSeat(seat);
  el.style.setProperty('--bc',E.COLORS[seat]);
  el.classList.toggle('turn',!!(S&&S.phase==='play'&&curSeat===seat));
  if(!p){el.innerHTML='<span class="flcname">'+E.CNAMES[seat]+'</span>';return}
  el.innerHTML='<div class="flhplate"><span class="flhav">'+tkAv(p.tok,64,'hav',persistMood(p))+'</span><b class="flhnm">'+esc(p.name)+'</b></div>';
 });
}
function showTokBubble(el,txt){
 if(!el||!txt)return;
 var old=el.querySelector('.fltbub');if(old)old.remove();
 var b=document.createElement('div');b.className='fltbub';b.textContent=txt;el.appendChild(b);
 later(function(){try{b.remove()}catch(e){}},1800);
}
function pokePlane(pid,plId){
 if(busy||!S||S.phase!=='play')return;
 var now=Date.now();
 if(now-pokeLock<420)return;
 pokeLock=now;
 if(now-pokeBurstT>2800){pokeBurst=0;pokeBurstT=now}
 pokeBurst++;
 if(pokeBurst>4)return;
 var key=pid+'|'+plId;
 if(!pokeAt[key]||now-pokeAt[key]>7000)pokeN[key]=0;
 pokeAt[key]=now;
 pokeN[key]=(pokeN[key]||0)+1;
 var n=pokeN[key],p=P(pid);if(!p)return;
 var type=n>=3?'pokeAngry':(n===2?'poke2':'poke');
 var mk=n>=3?'angry':(n===2?'worried':'happy');
 var heavy=n===3&&fxOn();
 var tokEl=root&&root.querySelector('.fltok[data-p="'+pid+'"][data-pl="'+plId+'"]');
 if(tokEl){
  tokEl.classList.remove('poked','poked-mad');void tokEl.offsetWidth;
  tokEl.classList.add(n>=3?'poked-mad':'poked');
  later(function(){try{tokEl.classList.remove('poked','poked-mad')}catch(e){}},520);
 }
 Sound.tap();
 var txt=sayReact(pid,type,{mood:mk,tiny:!heavy,noFs:!heavy,key:heavy?('flpokeA'+pid):('flpoke'+pid+n)});
 showTokBubble(tokEl,txt||(n>=3?'哼!':'嘿!'));
}
function reactMove(r,before){
 if(!r||!r.ok)return;
 var h=S.hist&&S.hist[S.hist.length-1],pid=h?h.pid:(S.turn||0);
 var ev=r.ev||[],cap=null,k={};
 ev.forEach(function(e){k[e.k]=e;if(e.k==='capture')cap=e});
 ev.forEach(function(e){if(e.k==='capture'&&e.victim!=null)sayReact(e.victim,'eaten',{mood:'sad',tiny:1,key:'fleaten'+e.victim})});
 if(k.win){sayReact(pid,'win',{mood:'proud'});return}
 if(cap||(r.sent&&r.sent.length)){sayReact(pid,'eat',{mood:'angry'});return}
 if(k.finish){sayReact(pid,'finishPlane',{mood:'proud'});return}
 if(k.fly){sayReact(pid,'fly12',{mood:'proud',tiny:1});return}
 if(k.jump){sayReact(pid,'jump',{mood:'happy',tiny:1});return}
 if(k.launch){sayReact(pid,'takeoff',{mood:'happy',tiny:1});return}
 if(k.takeoff){sayReact(pid,'takeoff',{mood:'happy',tiny:1});return}
 if(k.triple6){sayReact(pid,'bounce',{mood:'sad'});return}
 var entered=r.path&&r.path.some(function(s){return s.where==='home'})&&before&&before.where!=='home'&&before.where!=='done';
 if(entered)sayReact(pid,'enterHome',{mood:'happy',tiny:1});
}



/* RING 在四家进家口跳格（|Δc|+|Δr|!==1）；导轨/环线只画相邻格，禁止整环 Z 穿家 */
function ringArmPolylines(){
 var arms=[], cur=[], i, a, b, man, p0, x, y;
 for(i=0;i<E.TRACK;i++){
  p0=ringPos(i);
  x=(p0.x/100)*1500; y=(p0.y/100)*1500;
  cur.push([x,y]);
  a=E.RING[i]; b=E.RING[(i+1)%E.TRACK];
  man=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
  if(man!==1){ arms.push(cur); cur=[]; }
 }
 if(cur.length) arms.push(cur);
 return arms;
}
function polyPath(pts){
 if(!pts||!pts.length)return '';
 var d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
 for(var j=1;j<pts.length;j++)d+=' L'+pts[j][0].toFixed(1)+' '+pts[j][1].toFixed(1);
 return d;
}
function buildLaneRails(){
 var h='',i,arms,d;
 h+='<svg class="flrail-layer" viewBox="0 0 1500 1500" preserveAspectRatio="none" aria-hidden="true">';
 /* 四段臂各自画轨；跳格处断开，不穿回家道 */
 arms=ringArmPolylines();
 for(i=0;i<arms.length;i++){
  d=polyPath(arms[i]);
  if(!d)continue;
  h+='<path d="'+d+'" fill="none" stroke="#d4b896" stroke-opacity="0.55" stroke-width="58" stroke-linejoin="round" stroke-linecap="round"/>';
  h+='<path d="'+d+'" fill="none" stroke="#efe0c4" stroke-opacity="0.85" stroke-width="48" stroke-linejoin="round" stroke-linecap="round"/>';
 }
 /* home rails — 只连相邻回家格，不画到中心（避免穿三角的 X） */
 for(i=0;i<4;i++){
  var cells=E.HOME_CELLS[i]||[];
  if(cells.length<2)continue;
  var pts=[];
  cells.forEach(function(c,hi){ var pp=homePos(i,hi); pts.push([(pp.x/100)*1500,(pp.y/100)*1500]); });
  h+='<path d="'+polyPath(pts)+'" fill="none" stroke="'+E.COLORS[i]+'" stroke-opacity="0.22" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>';
 }
 h+='</svg>';
 return h;
}

function buildPathGuides(){
 /* SVG 1500：参考经典棋 — 格上流向图标 / 实心起飞垫+粗箭头 / 进家飞机斜线标 */
 var dim=eco()?0.38:0.92;
 var h='',i,p0,p1;
 h+='<svg class="flguide-layer" viewBox="0 0 1500 1500" preserveAspectRatio="none" aria-hidden="true">';
 h+='<defs>';
 for(i=0;i<4;i++){
  var mw=(root&&root.classList.contains('fl-print'))?14:9;
  h+='<marker id="flgArr'+i+'" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="'+mw+'" markerHeight="'+mw+'" orient="auto"><path d="M1 1 L13 7 L1 13 Z" fill="'+E.COLORS[i]+'"/></marker>';
 }
 /* 格上小飞机（朝 +x，外层 rotate） */
 h+='<g id="flgPlaneCell"><path d="M0-9C1.5-9 2.2-6.5 2.2-3.6L7.5 2.6V4.4L2.2 1.8V5.8L4.8 8.2V9.5L0 8.2-4.8 9.5V8.2L-2.2 5.8V1.8L-7.5 4.4V2.6L-2.2-3.6C-2.2-6.5-1.5-9 0-9Z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/><circle cy="-4.2" r="1.4" fill="#c8f0ff" stroke="#fff" stroke-width="0.6"/></g>';
 /* 进家「飞机+斜线」禁入/拐弯标 */
 h+='<g id="flgNoEntry"><circle r="26" fill="#fffef8" stroke="#c44" stroke-width="3.5"/><circle r="22" fill="#fff" fill-opacity=".55"/><g transform="scale(1.45)"><use href="#flgPlaneCell" fill="#555"/></g><path d="M-16 16 L16 -16" stroke="#e0485e" stroke-width="5.5" stroke-linecap="round"/><path d="M-16 16 L16 -16" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".65"/></g>';
 h+='</defs>';

 /* 辅助：极淡外偏环线 — 按臂分段，禁止跨跳格 / 禁止 Z 闭合穿家 */
 var raw=[];
 for(i=0;i<E.TRACK;i++){
  p0=ringPos(i);
  raw.push([(p0.x/100)*1500,(p0.y/100)*1500]);
 }
 var arms=ringArmPolylines();
 for(var ai=0;ai<arms.length;ai++){
  var arm=arms[ai], pts=[];
  for(i=0;i<arm.length;i++){
   var cur=arm[i];
   var prev=arm[i>0?i-1:i], nxt=arm[i<arm.length-1?i+1:i];
   var tx=nxt[0]-prev[0], ty=nxt[1]-prev[1];
   var tl=Math.sqrt(tx*tx+ty*ty)||1;
   var nx=-ty/tl, ny=tx/tl;
   if((cur[0]-750)*nx+(cur[1]-750)*ny<0){nx=-nx;ny=-ny;}
   pts.push([cur[0]+nx*28, cur[1]+ny*28]);
  }
  var d=polyPath(pts);
  if(!d)continue;
  h+='<path class="flguide-ring" d="'+d+'" fill="none" stroke="#8b6230" stroke-opacity="'+(dim*0.12)+'" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>';
  h+='<path class="flguide-ring-dash" d="'+d+'" fill="none" stroke="#a67c45" stroke-opacity="'+(dim*0.22)+'" stroke-width="2.2" stroke-dasharray="10 18" stroke-linejoin="round" stroke-linecap="round"/>';
 }

 /* 1) 主环流向：plastic 印格心小飞机；print 一比一省略（参考格心仅白圆） */
 var skip={};
 E.ENTRY.forEach(function(x){skip[x]=1});
 E.HOME_GATE.forEach(function(x){skip[x]=1});
 E.FLY_FROM.forEach(function(x){skip[x]=1});
 if(!(root&&root.classList.contains('fl-print')))
 for(i=0;i<E.TRACK;i++){
  if(skip[i])continue;
  if(i%2!==0)continue;
  var a=E.RING[i], b=E.RING[(i+1)%E.TRACK];
  if(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])!==1)continue; /* 跳格不画穿家流向 */
  p0=raw[i]; p1=raw[(i+1)%E.TRACK];
  var dx=p1[0]-p0[0], dy=p1[1]-p0[1];
  var ang=Math.atan2(dy,dx)*180/Math.PI;
  var col=E.COLORS[E.cellColor(i)];
  h+='<g class="flguide-flow" transform="translate('+p0[0].toFixed(1)+','+p0[1].toFixed(1)+') rotate('+ang.toFixed(1)+')" opacity="'+Math.min(1,dim+0.08)+'">';
  h+='<circle r="15" fill="#fffef8" fill-opacity="0.96" stroke="'+col+'" stroke-width="1.8" stroke-opacity="0.55"/>';
  h+='<g transform="scale(1.2)"><use href="#flgPlaneCell" fill="'+col+'"/></g>';
  h+='</g>';
 }

 /* 2) 起飞：E.takeoffPos 几何 — 基地旁实心大圆 + 粗箭头进 ENTRY */
 for(i=0;i<4;i++){
  var tp=E.takeoffPos(i), ep=ringPos(E.ENTRY[i]);
  var px=(tp.x/100)*1500, py=(tp.y/100)*1500;
  var ex=(ep.x/100)*1500, ey=(ep.y/100)*1500;
  var col=E.COLORS[i];
  var print=root&&root.classList.contains('fl-print');
  /* v13：缺口≈2.1，print 垫 r≈48 贴参考；plastic 略小 */
  var rPad=print?48:32;
  h+='<g class="flguide-takeoff" data-p="'+i+'">';
  h+='<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="'+rPad+'" fill="'+col+'" fill-opacity="'+(eco()?0.8:1)+'" stroke="'+(print?'#2a1a0a':'#fff')+'" stroke-width="'+(print?3.5:5)+'"/>';
  if(!print) h+='<circle cx="'+px.toFixed(1)+'" cy="'+(py-6).toFixed(1)+'" r="12" fill="#fff" fill-opacity="0.22"/>';
  /* 箭头朝 ENTRY（进跑道）；print：圆内白色箭头+短外指，贴参考 */
  var dx=ex-px, dy=ey-py, len=Math.sqrt(dx*dx+dy*dy)||1;
  var ux=dx/len, uy=dy/len;
  if(print){
   var ang=Math.atan2(uy,ux)*180/Math.PI;
   var as=rPad*0.42;
   h+='<g transform="translate('+px.toFixed(1)+','+py.toFixed(1)+') rotate('+ang.toFixed(1)+')">';
   h+='<path d="M'+(-as*0.55).toFixed(1)+' '+(-as*0.55).toFixed(1)+' L'+(as*0.75).toFixed(1)+' 0 L'+(-as*0.55).toFixed(1)+' '+(as*0.55).toFixed(1)+' Z" fill="#fffef8" stroke="#2a1a0a" stroke-width="2"/>';
   h+='</g>';
   var x1=px+ux*(rPad*0.85), y1=py+uy*(rPad*0.85);
   var x2=px+ux*(rPad*1.55), y2=py+uy*(rPad*1.55);
   h+='<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1)+'" fill="none" stroke="#2a1a0a" stroke-opacity="0.55" stroke-width="10" stroke-linecap="round"/>';
   h+='<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1)+'" fill="none" stroke="'+col+'" stroke-opacity="'+dim+'" stroke-width="7" stroke-linecap="round" marker-end="url(#flgArr'+i+')"/>';
  }else{
   var x1=px+ux*(rPad*0.55), y1=py+uy*(rPad*0.55);
   var x2=ex-ux*28, y2=ey-uy*28;
   h+='<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1)+'" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="13" stroke-linecap="round"/>';
   h+='<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1)+'" fill="none" stroke="'+col+'" stroke-opacity="'+dim+'" stroke-width="10" stroke-linecap="round" marker-end="url(#flgArr'+i+')"/>';
  }
  h+='</g>';
 }

 /* 3) 进家口：print=参考式本色箭头/斜线标；plastic=飞机斜线圆标 */
 var printG=root&&root.classList.contains('fl-print');
 for(i=0;i<4;i++){
  var gp=ringPos(E.HOME_GATE[i]);
  var hp0=homePos(i,0);
  var hx=(hp0.x/100)*1500, hy=(hp0.y/100)*1500;
  var gx=(gp.x/100)*1500, gy=(gp.y/100)*1500;
  var col=E.COLORS[i];
  h+='<g class="flguide-homegate" data-p="'+i+'">';
  if(printG){
   /* 参考：口部本色箭头指向中心 */
   var dx=hx-gx, dy=hy-gy, len=Math.sqrt(dx*dx+dy*dy)||1;
   var ang=Math.atan2(dy,dx)*180/Math.PI;
   h+='<g transform="translate('+gx.toFixed(1)+','+gy.toFixed(1)+') rotate('+ang.toFixed(1)+')" opacity="'+Math.min(1,dim+0.05)+'">';
   h+='<circle r="22" fill="#fffef8" stroke="'+col+'" stroke-width="3.5"/>';
   h+='<path d="M-8 -9 L12 0 L-8 9 Z" fill="'+col+'" stroke="#2a1a0a" stroke-width="1.5"/>';
   h+='</g>';
  }else{
   h+='<g transform="translate('+gx.toFixed(1)+','+gy.toFixed(1)+')" opacity="'+Math.min(1,dim+0.08)+'">';
   h+='<circle r="28" fill="none" stroke="'+col+'" stroke-width="4" opacity="0.95"/>';
   h+='<use href="#flgNoEntry"/>';
   h+='</g>';
   var tA=0.22, tB=0.88;
   var ax=gx+(hx-gx)*tA, ay=gy+(hy-gy)*tA;
   var bx2=gx+(hx-gx)*tB, by2=gy+(hy-gy)*tB;
   h+='<path d="M'+ax.toFixed(1)+' '+ay.toFixed(1)+' L'+bx2.toFixed(1)+' '+by2.toFixed(1)+'" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="11" stroke-linecap="round"/>';
   h+='<path d="M'+ax.toFixed(1)+' '+ay.toFixed(1)+' L'+bx2.toFixed(1)+' '+by2.toFixed(1)+'" fill="none" stroke="'+col+'" stroke-opacity="'+dim+'" stroke-width="7.5" stroke-linecap="round" marker-end="url(#flgArr'+i+')"/>';
  }
  h+='</g>';
 }
 h+='</svg>';
 return h;
}

function buildIslandBoard(){
 var b=$q('#flb'),F=window.FLY3D,h='',i,cs=cellSizePct(),hs=homeSizePct();
 var svg=F.boardSVG({eco:eco()});
 h+=F.tokenDefs();
 /* 静态盘面作为图片栅格化一次：棋子移动不再重绘大面积 SVG 滤镜（iPad 省电） */
 if(plateURL){try{URL.revokeObjectURL(plateURL)}catch(e){}plateURL=null}
 try{plateURL=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}))}catch(e){plateURL=null}
 h+=plateURL?'<img class="flplate fl3d-plate" src="'+plateURL+'" alt="" draggable="false">':svg;
 for(i=0;i<E.TRACK;i++){
  var p=ringPos(i),ent=E.ENTRY.indexOf(i),flyFor=E.FLY_FROM.indexOf(i),gateFor=E.HOME_GATE.indexOf(i);
  var cls='flc c'+E.cellColor(i)+(E.isSafe(i)&&ent<0?' safe':'')+(ent>=0?' entry e'+ent:'')+(flyFor>=0?' flypad f'+flyFor:'')+(gateFor>=0?' homegate g'+gateFor:'');
  var title=flyFor>=0?' title="落到本色飞机格 → 沿虚线横飞 +12"':(gateFor>=0?' title="拐进本色回家道"':'');
  h+='<div class="'+cls+'" data-i="'+i+'"'+title+' style="left:'+p.x+'%;top:'+p.y+'%;width:'+cs+'%;height:'+cs+'%"></div>';
 }
 for(var hp=0;hp<4;hp++){
  for(var hi=0;hi<(E.HOME_CELLS[hp]||[]).length;hi++){
   var pp=homePos(hp,hi);
   h+='<div class="flhome c'+hp+'" data-p="'+hp+'" data-h="'+hi+'" style="left:'+pp.x+'%;top:'+pp.y+'%;width:'+hs+'%;height:'+hs+'%"></div>';
  }
 }
 h+=F.flyOverlay();
 for(var pid=0;pid<4;pid++){
  var r=F.hangarPct(pid);
  h+='<div class="flbase" data-p="'+pid+'" style="left:'+r.x+'%;top:'+r.y+'%;width:'+r.w+'%;height:'+r.h+'%;--bc:'+E.COLORS[pid]+'"><span>'+E.CNAMES[pid]+'</span></div>';
 }
 h+='<div id="fltok"></div><div class="fldock fldock-c" id="fldock"></div><div class="flfx" aria-hidden="true"></div>';
 b.innerHTML=h;fxLayer=$q('.flfx');
}
function buildBoard(){
 if(isl())return buildIslandBoard();
 var b=$q('#flb'),h='',i,cs=cellSizePct();
 h+='<div class="flsky" aria-hidden="true"></div>';
 /* SVG plate: wood rim, clay hangars with recessed pits, center triangles */
 h+='<svg class="flplate" viewBox="0 0 1500 1500" preserveAspectRatio="none" aria-hidden="true">';
 h+='<defs>';
 /* soft clay pastels for hangars (classic RYBG identity) */
 var HG=['#e85a70','#f0c820','#5a9ae8','#55b855'];
 var HG2=['#c43850','#d0a010','#3a78c8','#389838'];
 for(i=0;i<4;i++){
  h+='<linearGradient id="hg'+i+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity=".55"/><stop offset="38%" stop-color="'+HG[i]+'"/><stop offset="100%" stop-color="'+HG2[i]+'"/></linearGradient>';
  h+='<radialGradient id="pit'+i+'" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#fff" stop-opacity=".35"/><stop offset="55%" stop-color="'+HG2[i]+'" stop-opacity=".55"/><stop offset="100%" stop-color="#000" stop-opacity=".35"/></radialGradient>';
 }
 for(i=0;i<4;i++){
  h+='<linearGradient id="tri'+i+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity=".5"/><stop offset="45%" stop-color="'+HG[i]+'"/><stop offset="100%" stop-color="'+HG2[i]+'"/></linearGradient>';
 }
 h+='<linearGradient id="woodrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8c888"/><stop offset="50%" stop-color="#c49a5c"/><stop offset="100%" stop-color="#8b6230"/></linearGradient>';
 h+='<linearGradient id="clayfill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff6e4"/><stop offset="50%" stop-color="#f0d9b0"/><stop offset="100%" stop-color="#e4c48a"/></linearGradient>';
 h+='<filter id="flsoft"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-opacity=".28"/></filter>';
 h+='<filter id="flsoft2"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity=".22"/></filter>';
 h+='<filter id="pitin"><feGaussianBlur stdDeviation="1.2"/></filter>';
 h+='</defs>';
 if(root&&root.classList.contains('fl-print')){
  h+='<rect x="0" y="0" width="1500" height="1500" rx="18" fill="#e8d9b8"/>';
  h+='<path d="M600 0H900V600H1500V900H900V1500H600V900H0V600H600Z" fill="#efe6d0" fill-opacity=".55" stroke="#c9a06a" stroke-width="2" stroke-opacity=".35"/>';
 }else{
  h+='<rect x="0" y="0" width="1500" height="1500" rx="36" fill="url(#clayfill)"/>';
  h+='<path d="M600 0H900V600H1500V900H900V1500H600V900H0V600H600Z" fill="#efe0c4" fill-opacity=".28" stroke="#c9a06a" stroke-width="4" stroke-opacity=".28"/>';
 }
 /* hangars — PhaseA print: 扁平实心方块+四圆机库；PhaseB: 塑料机库 */
 var printH=root&&root.classList.contains('fl-print');
 E.BASE_RECT.forEach(function(br,pid){
  var x=br[0]*100,y=br[1]*100,w=br[2]*100,hh=br[3]*100;
  if(printH){
   /* 参考：实心色块 + 2×2 白边圆坑 + 本色平面飞机剪影 */
   h+='<rect class="flhng" x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="4" fill="'+E.COLORS[pid]+'" stroke="#2a1a0a" stroke-width="3.5"/>';
   var pitR=Math.min(w,hh)*0.145;
   E.BASE_SLOTS[pid].forEach(function(s){
    var cx=s[0]*100+50,cy=s[1]*100+50;
    h+='<circle cx="'+cx+'" cy="'+cy+'" r="'+pitR+'" fill="#fffef8" stroke="#2a1a0a" stroke-width="2.8"/>';
    h+='<g transform="translate('+cx+','+cy+') scale('+(pitR/26).toFixed(3)+')"><path d="M0-10C1.6-10 2.4-7.2 2.4-4L8 3V5L2.4 2.2V6.5L5.2 9.2V10.6L0 9.2-5.2 10.6V9.2L-2.4 6.5V2.2L-8 5V3L-2.4-4C-2.4-7.2-1.6-10 0-10Z" fill="'+E.COLORS[pid]+'" stroke="#2a1a0a" stroke-width="1.1"/></g>';
   });
  }else{
   h+='<rect x="'+(x+2)+'" y="'+(y+3)+'" width="'+(w-4)+'" height="'+(hh-4)+'" rx="22" fill="#8b6230" opacity=".14"/>';
   h+='<rect class="flhng" x="'+(x+4)+'" y="'+(y+4)+'" width="'+(w-8)+'" height="'+(hh-8)+'" rx="20" fill="url(#hg'+pid+')" stroke="#fff" stroke-width="4" filter="url(#flsoft)"/>';
   h+='<rect x="'+(x+12)+'" y="'+(y+12)+'" width="'+(w-24)+'" height="'+(hh-24)+'" rx="14" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="2"/>';
   h+='<rect x="'+(x+18)+'" y="'+(y+18)+'" width="'+(w-36)+'" height="'+(hh-36)+'" rx="10" fill="none" stroke="#fff" stroke-opacity=".36" stroke-width="1.8" stroke-dasharray="6 5"/>';
   var pitR=Math.max(24, Math.min(w,hh)*0.095), pitRi=pitR*0.88, pitCore=pitR*0.52;
   E.BASE_SLOTS[pid].forEach(function(s){
    var cx=s[0]*100+50,cy=s[1]*100+50;
    h+='<ellipse cx="'+cx+'" cy="'+(cy+pitR*0.12)+'" rx="'+(pitR*1.05)+'" ry="'+pitR+'" fill="#000" opacity=".16"/>';
    h+='<circle cx="'+cx+'" cy="'+cy+'" r="'+pitR+'" fill="'+HG2[pid]+'" opacity=".55"/>';
    h+='<circle cx="'+cx+'" cy="'+cy+'" r="'+pitRi+'" fill="url(#pit'+pid+')" stroke="#fff" stroke-opacity=".55" stroke-width="2.2"/>';
    h+='<circle cx="'+cx+'" cy="'+cy+'" r="'+pitCore+'" fill="#120c0a" fill-opacity=".28"/>';
    h+='<circle cx="'+(cx-pitR*0.18)+'" cy="'+(cy-pitR*0.22)+'" r="'+(pitR*0.25)+'" fill="#fff" fill-opacity=".22"/>';
    h+='<path d="M'+(cx-pitR*0.28)+' '+(cy-pitR*0.28)+' L'+(cx+pitR*0.28)+' '+(cy+pitR*0.28)+' M'+(cx+pitR*0.28)+' '+(cy-pitR*0.28)+' L'+(cx-pitR*0.28)+' '+(cy+pitR*0.28)+'" stroke="#fff" stroke-opacity=".42" stroke-width="2.2" stroke-linecap="round"/>';
   });
  }
 });
 /* home-lane floors + center — print: 参考式本色箭杆；plastic: 浅底 */
 var print=root&&root.classList.contains('fl-print');
 var triR=print?210:240; /* v13：三角半幅≈2.1格，贴参考；白圆在三角内 */
 if(print){
  /* 回家道由 .flhome 彩色方格承担，不再画连续箭杆（避免叠色） */
  h+='<g transform="translate(750,750)">';
  h+='<polygon points="0,0 -'+triR+',-'+triR+' '+triR+',-'+triR+'" fill="'+E.COLORS[2]+'" stroke="#2a1a0a" stroke-width="3"/>';
  h+='<polygon points="0,0 '+triR+',-'+triR+' '+triR+','+triR+'" fill="'+E.COLORS[3]+'" stroke="#2a1a0a" stroke-width="3"/>';
  h+='<polygon points="0,0 '+triR+','+triR+' -'+triR+','+triR+'" fill="'+E.COLORS[0]+'" stroke="#2a1a0a" stroke-width="3"/>';
  h+='<polygon points="0,0 -'+triR+','+triR+' -'+triR+',-'+triR+'" fill="'+E.COLORS[1]+'" stroke="#2a1a0a" stroke-width="3"/>';
  /* 每三角一白圆（参考构图） */
  var cr=triR*0.22;
  h+='<circle cx="0" cy="'+(-triR*0.42).toFixed(1)+'" r="'+cr.toFixed(1)+'" fill="#fffef8" stroke="#2a1a0a" stroke-width="2"/>';
  h+='<circle cx="'+(triR*0.42).toFixed(1)+'" cy="0" r="'+cr.toFixed(1)+'" fill="#fffef8" stroke="#2a1a0a" stroke-width="2"/>';
  h+='<circle cx="0" cy="'+(triR*0.42).toFixed(1)+'" r="'+cr.toFixed(1)+'" fill="#fffef8" stroke="#2a1a0a" stroke-width="2"/>';
  h+='<circle cx="'+(-triR*0.42).toFixed(1)+'" cy="0" r="'+cr.toFixed(1)+'" fill="#fffef8" stroke="#2a1a0a" stroke-width="2"/>';
  h+='</g>';
 }else{
  h+='<rect x="710" y="720" width="80" height="700" rx="24" fill="url(#tri0)" opacity=".30" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>';
  h+='<rect x="50" y="710" width="700" height="80" rx="24" fill="url(#tri1)" opacity=".30" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>';
  h+='<rect x="710" y="50" width="80" height="700" rx="24" fill="url(#tri2)" opacity=".30" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>';
  h+='<rect x="740" y="710" width="710" height="80" rx="24" fill="url(#tri3)" opacity=".30" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>';
  h+='<g transform="translate(750,750)" filter="url(#flsoft2)">';
  h+='<polygon points="0,0 -'+triR+',-'+triR+' '+triR+',-'+triR+'" fill="url(#tri2)" stroke="#fff" stroke-width="6"/>';
  h+='<polygon points="0,0 '+triR+',-'+triR+' '+triR+','+triR+'" fill="url(#tri3)" stroke="#fff" stroke-width="6"/>';
  h+='<polygon points="0,0 '+triR+','+triR+' -'+triR+','+triR+'" fill="url(#tri0)" stroke="#fff" stroke-width="6"/>';
  h+='<polygon points="0,0 -'+triR+','+triR+' -'+triR+',-'+triR+'" fill="url(#tri1)" stroke="#fff" stroke-width="6"/>';
  h+='</g>';
 }
 h+='</svg>';

 if(!(root&&root.classList.contains('fl-print'))) h+=buildLaneRails();
 /* track cells — 同道连续满格；道间靠 ringNudge 拉开 */
 for(i=0;i<E.TRACK;i++){
  var p=ringPos(i),ent=E.ENTRY.indexOf(i),cc=E.cellColor(i),safe=E.isSafe(i)&&ent<0;
  var flyFor=E.FLY_FROM.indexOf(i);
  var gateFor=E.HOME_GATE.indexOf(i);
  var cls='flc c'+cc+(safe?' safe':'')+(ent>=0?' entry e'+ent:'')+(flyFor>=0?' flypad f'+flyFor:'')+(gateFor>=0?' homegate g'+gateFor:'');
  var label='',title='';
  if(ent>=0)label='<span class="flmark entry-mark" style="background:'+E.COLORS[ent]+'"></span>';
  else if(gateFor>=0){
   label='<span class="flmark gate-mark" aria-label="进家口"></span>';
   title=' title="拐进本色回家道"';
  }else if(flyFor>=0){
   /* idle：只留细虚线横飞指示（CSS）+ 小飞机，无粗 outline 选中态 */
   label='<span class="flmark fly-mark" aria-label="横飞垫">✈</span>';
   title=' title="落到本色虚线垫 → 横飞 +12"';
  }else label='<span class="flmark"></span>';
  h+='<div class="'+cls+'" data-i="'+i+'"'+title+' style="left:'+p.x+'%;top:'+p.y+'%;width:'+cs+'%;height:'+cs+'%">'+label+'</div>';
 }
 /* home stretch — 连续条，略窄于外圈以露出道间米色 */
 var hs=homeSizePct();
 for(var hp=0;hp<4;hp++){
  (E.HOME_CELLS[hp]||[]).forEach(function(cell,hi){
   var pp=homePos(hp,hi);
   h+='<div class="flhome c'+hp+'" data-p="'+hp+'" data-h="'+hi+'" style="left:'+pp.x+'%;top:'+pp.y+'%;width:'+hs+'%;height:'+hs+'%;--bc:'+E.COLORS[hp]+'"><span class="flmark"></span></div>';
  });
 }
 /* dashed fly shortcuts — 参考式细虚线 + 小飞机；无大胶囊挡视线；+12 见侧栏 */
 h+='<svg class="fldash-layer" viewBox="0 0 1500 1500" preserveAspectRatio="none" aria-hidden="true">';
 h+='<defs>';
 h+='<g id="miniPlane"><path d="M0-11C1.8-11 2.6-8 2.6-4.5L9 3.2V5.4L2.6 2.2V7.2L5.8 10V11.6L0 10.2-5.8 11.6V10L-2.6 7.2V2.2L-9 5.4V3.2L-2.6-4.5C-2.6-8-1.8-11 0-11Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><circle cy="-5.2" r="1.7" fill="#c8f0ff" stroke="#fff" stroke-width="0.7"/></g>';
 h+='</defs>';
 /* 细虚线按 FLY_FROM→FLY_TO 实坐标连接（参考：对色飞垫之间） */
 for(var fi=0;fi<4;fi++){
  var fp=ringPos(E.FLY_FROM[fi]), tp=ringPos(E.FLY_TO[fi]);
  var fx=(fp.x/100)*1500, fy=(fp.y/100)*1500, tx=(tp.x/100)*1500, ty=(tp.y/100)*1500;
  /* 缩短两端，不盖住飞垫圆心 */
  var tA=0.16, tB=0.84;
  var x1=fx+(tx-fx)*tA, y1=fy+(ty-fy)*tA, x2=fx+(tx-fx)*tB, y2=fy+(ty-fy)*tB;
  var rot=Math.atan2(ty-fy, tx-fx)*180/Math.PI;
  var col=E.COLORS[fi];
  h+='<g class="fldash-path" id="fldash'+fi+'" data-fly="'+fi+'">';
  h+='<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L '+x2.toFixed(1)+' '+y2.toFixed(1)+'" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity="0.45"/>';
  h+='<path class="fldash-stroke" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L '+x2.toFixed(1)+' '+y2.toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="3.5" stroke-dasharray="12 10" stroke-linecap="round" opacity="0.88"/>';
  var mx=(x1+x2)/2, my=(y1+y2)/2;
  h+='<g transform="translate('+mx.toFixed(1)+','+my.toFixed(1)+') rotate('+rot.toFixed(1)+')">';
  h+='<circle r="14" fill="#fffef8" stroke="'+col+'" stroke-width="2.5"/>';
  h+='<g transform="scale(1.15)"><use href="#miniPlane" fill="'+col+'"/></g>';
  h+='</g>';
  h+='</g>';
 }
 h+='</svg>';
 /* ---- 路径指引（玩具感、克制）：主环流向 / 起飞口 / 进家箭头 ---- */
 h+=buildPathGuides();
 /* hangar hit/label overlays */
 E.BASE_RECT.forEach(function(br,pid){
  var left=br[0]/15*100, top=br[1]/15*100, w=br[2]/15*100, hh=br[3]/15*100;
  h+='<div class="flbase" data-p="'+pid+'" style="left:'+left+'%;top:'+top+'%;width:'+w+'%;height:'+hh+'%;--bc:'+E.COLORS[pid]+'"><span>'+E.CNAMES[pid]+'</span></div>';
 });
 h+='<div class="flfin" aria-label="终点">'+(root&&root.classList.contains('fl-print')?'':'<b>终</b>')+'</div>';
 h+='<div id="fltok"></div>';
 h+='<div class="fldock fldock-c" id="fldock"></div>';
 h+='<div class="flfx" aria-hidden="true"></div>';
 b.innerHTML=h;fxLayer=$q('.flfx');
}
function stackOffset(listIdx,total){
 if(total<=1)return{dx:0,dy:0};
 var ang=(listIdx/total)*Math.PI*2;
 return{dx:Math.cos(ang)*1.6,dy:Math.sin(ang)*1.8};
}
function renderTokens(){
 var el=$q('#fltok');if(!el||!S.players)return;
 /* group by cell for stack offsets; base+done each keep hangar slot */
 var waitByPid={};
 S.players.forEach(function(p){waitByPid[p.id]=takeoffWaitId(p)});
 var groups={};
 S.players.forEach(function(p){
  p.planes.forEach(function(pl){
   var key;
   if(pl.where==='base')key='base|'+p.id+'|'+pl.id;
   else if(pl.where==='done')key='done|'+p.id+'|'+pl.id; /* finished → back to hangar pose */
   else if(pl.where==='pad')key='pad|'+p.id+'|'+pl.idx;
   else key=pl.where+'|'+pl.idx+'|'+p.id;
   (groups[key]=groups[key]||[]).push({p:p,pl:pl});
  });
 });
 var h='';
 Object.keys(groups).forEach(function(key){
  var g=groups[key];
  g.forEach(function(item,ii){
   var p=item.p,pl=item.pl,pos,off;
   var showWhere=pl.where,showIdx=pl.idx;
   if(walkShow&&walkShow.pid===p.id&&walkShow.pl===pl.id){
    showWhere=walkShow.where;showIdx=walkShow.idx;
   }
   if(showWhere==='base'||showWhere==='done'){
    pos=basePos(seatOf(p),pl.id);off={dx:0,dy:0};
   }else{
    pos=cellXY(showWhere,showIdx,seatOf(p));
    off=stackOffset(ii,g.length);
   }
   var can=S.pending&&S.pending.mov&&S.turn===p.id&&S.pending.mov.indexOf(pl.id)>=0;
   var walking=walkShow&&walkShow.pid===p.id&&walkShow.pl===pl.id;
   var onPad=showWhere==='track'||showWhere==='home'||showWhere==='pad';
   var go=can&&onPad&&!walkShow;
   var lit=showWhere==='base'&&pl.id===waitByPid[p.id]&&!walkShow;
   var pose=showWhere==='done'?' done-pose':(showWhere==='base'&&!walking?' at-base':(onPad||walking?' in-flight':''))+(showWhere==='pad'?' at-pad':'');
   var cls='fltok'+pose+(go?' go':'')+(lit?' takeoff-lit':'')+(can&&pl.where==='base'?' can-pick':'')+(walking?' walking':'');
   var badge=pl.where==='done'?'<span class="fl-done-badge" aria-hidden="true">🏁</span>':'';
   var halo=(go||lit)?'<i class="flglow" aria-hidden="true"></i>':'';
   var alabel=esc(p.cname)+'飞机'+(pl.id+1)+(pl.where==='done'?'已到达终点':'');
   h+='<button type="button" class="'+cls+'" data-p="'+p.id+'" data-pl="'+pl.id+'" data-tok="'+p.tok+'" data-seat="'+seatOf(p)+'" data-where="'+pl.where+'" style="left:'+(pos.x+off.dx)+'%;top:'+(pos.y+off.dy)+'%;--pc:'+p.color+'" aria-label="'+alabel+'">'+halo+planeImg(p)+badge+'</button>';
  });
 });
 el.innerHTML=h;
 Array.prototype.forEach.call(el.querySelectorAll('.fltok'),function(b){
  b.onclick=function(){
   var pid=+b.getAttribute('data-p'),plId=+b.getAttribute('data-pl');
   var can=S.pending&&S.pending.mov&&S.turn===pid&&S.pending.mov.indexOf(plId)>=0;
   if(can)pickPlane(plId);else pokePlane(pid,plId);
  };
 });
 /* 起飞口按座位色点一下；机库本身不再整块闪 */
 var curSeat=S.players&&S.players[S.turn]?seatOf(S.players[S.turn]):-1;
 var waitPid=S.players&&S.players[S.turn]?waitByPid[S.players[S.turn].id]:-1;
 Array.prototype.forEach.call(root.querySelectorAll('.flbase'),function(el){
  el.classList.remove('lit');
 });
 Array.prototype.forEach.call(root.querySelectorAll('.flc.entry'),function(el){
  var ent=E.ENTRY.indexOf(+el.getAttribute('data-i'));
  el.classList.toggle('lit',!!(waitPid>=0&&curSeat===ent));
 });
}
function renderPanel(){
 var el=$q('#flp');if(!el)return;
 var h='';
 (S.players||[]).forEach(function(p){
  var cur=S.phase==='play'&&p.id===S.turn,done=p.planes.filter(function(x){return x.where==='done'}).length;
  var fly=p.planes.filter(function(x){return x.where==='track'||x.where==='home'||x.where==='pad'}).length;
  h+='<div class="pc av1 flpc'+(cur?' cur':'')+(S.winner===p.id?' win':'')+'" data-pid="'+p.id+'" style="--pc:'+TKC[p.tok]+'">'+
   '<div class="pcm">'+tkAv(p.tok,72,'av',persistMood(p))+'<div class="pci"><div class="pn">'+esc(p.name)+(cur?'<em>▶</em>':'')+'</div>'+
   '<div class="pcb"><span class="np" title="飞机">✈️'+fly+'/4</span><span class="nw">🏁'+done+'</span>'+
   '<span class="bd" style="background:'+p.color+'" title="'+p.cname+'色">'+p.cname+'</span></div></div></div></div>';
 });
 el.innerHTML=h;
 restoreBubs();
}
function activeSeat(){
 if(!S||!S.players||!S.players.length)return 1;
 var p=(S.phase==='over'&&S.winner!=null)?S.players[S.winner]:E.cur(S);
 return p?seatOf(p):1;
}
function dockAnchor(seat){
 /* inner flank of each hangar — beside pits, not on avatar / not on the star */
 var m={1:{l:28,t:20,k:'tl'},2:{l:72,t:20,k:'tr'},0:{l:28,t:80,k:'bl'},3:{l:72,t:80,k:'br'}};
 return m[seat]||m[1];
}
function duckDock(ms){
 duckUntil=Date.now()+(ms||1100);
 var el=$q('#fldock');if(el)el.classList.add('duck');
 later(function(){if(Date.now()>=duckUntil-40)try{renderDock()}catch(e){}},(ms||1100)+40);
}
function renderDock(){
 var el=$q('#fldock');if(!el)return;
 var ready=S.phase==='play'&&S.roll==null&&!busy;
 var duck=Date.now()<duckUntil;
 var seat=activeSeat(),anc=dockAnchor(seat);
 var noSlide=eco()||(UI.reduce&&UI.reduce());
 var hint='';
 if(S.phase==='over'){var w=S.players[S.winner];hint='🏆 '+esc(w.name)+' 获胜!';}
 else if(ready&&S.again){hint='再掷一次!'}
 else if(ready){hint='轮到 <b style="color:'+TKC[E.cur(S).tok]+'">'+esc(E.cur(S).name)+'</b>'}
 el.style.left=anc.l+'%';el.style.top=anc.t+'%';
 el.className='fldock fldock-c s-'+anc.k+(ready?' want':' idle')+(duck?' duck':'')+(S.phase==='over'?' over':'')+(noSlide?' no-slide':'');
 el.setAttribute('data-seat',seat);
 el.innerHTML='<div class="fldie-wrap'+(ready?' want':'')+'" id="flDieHit"'+(ready?' role="button" tabindex="0" aria-label="掷骰子"':'')+'><div class="fldie'+(ready?' pulse':'')+'" id="flDie" role="button" aria-label="掷骰子">'+Dice.svg(S.roll||lastDie)+'</div></div>'+
  (ready?'<button class="btn big flroll" id="flRoll">🎲 掷骰子</button>':'')+
  (S.phase==='over'?'<button class="btn pri" id="flAgain">再来一局</button>':'')+
  (hint?'<div class="flhint" id="flHint">'+hint+'</div>':'');
 function tapRoll(ev){
  if(ev){ev.preventDefault();ev.stopPropagation()}
  if(S.phase==='play'&&S.roll==null&&!busy)doRoll();
 }
 var hit=$q('#flDieHit'),d=$q('#flDie'),r=$q('#flRoll'),a=$q('#flAgain');
 if(hit){
  hit.onclick=tapRoll;
  hit.onkeydown=function(ev){if(ev&&(ev.key==='Enter'||ev.key===' '))tapRoll(ev)};
 }
 if(d)d.onclick=tapRoll;
 if(r)r.onclick=tapRoll;
 if(a)a.onclick=function(){startNew()};
}
function render(){
 if(!root||!S)return;
 root.classList.toggle('over',S.phase==='over');
 renderTokens();renderHangars();renderPanel();renderDock();
}
function playMoveFx(r){
 if(!r||!r.ev)return;
 r.ev.forEach(function(e){
  if(e.k==='jump'){
   var a=ringPos(e.from),b=ringPos(e.to);
   trailAlong([a,{x:(a.x+b.x)/2,y:(a.y+b.y)/2},b],(S.players[e.pid]&&S.players[e.pid].color)||E.COLORS[e.pid]);
   UI.toast('同色跳跃!',900,'star');
  }else if(e.k==='fly'){
   var a2=ringPos(e.from),b2=ringPos(e.to);
   var dashSeat=e.seat!=null?e.seat:(S.players[e.pid]?seatOf(S.players[e.pid]):e.pid);
   if(isl()){var ft=window.FLY3D.flyTrail(dashSeat,8);trailAlong(ft,'#ffd23f');sparkAt(ft[4].x,ft[4].y,'flyburst',14)}
   else{trailAlong([a2,{x:50,y:50},b2],'#ffd23f');sparkAt(50,50,'flyburst',14)}
   var dash=root&&root.querySelector('#fldash'+dashSeat);
   if(dash){dash.classList.add('lit');later(function(){try{dash.classList.remove('lit')}catch(err){}},1400)}
   UI.toast('✈️ 虚线横飞 +12!',1400,'star');
  }else if(e.k==='capture'){
   var pos=ringPos(e.at!=null?e.at:0);
   sparkAt(pos.x,pos.y,'boom',12);
  }else if(e.k==='takeoff'){
   var takeSeat=e.seat!=null?e.seat:(S.players[e.pid]?seatOf(S.players[e.pid]):e.pid);
   var tp=ringPos(e.idx!=null?e.idx:E.ENTRY[takeSeat]);
   sparkAt(tp.x,tp.y,'take',8);
   duckDock(900);
  }else if(e.k==='launch'){
   var launchSeat=e.seat!=null?e.seat:(S.players[e.pid]?seatOf(S.players[e.pid]):e.pid);
   var lp=ringPos(e.idx!=null?e.idx:E.ENTRY[launchSeat]);
   sparkAt(lp.x,lp.y,'take',6);
  }else if(e.k==='triple6'){
   UI.toast('三连6!一架飞机回基地',1600,'warn');
  }
 });
 if(r.sent&&r.sent.length&&!r.ev.some(function(e){return e.k==='capture'})){
  sparkAt(50,50,'boom',10);
 }
}
function doRoll(forced){
 if(busy||S.phase!=='play'||S.roll!=null)return;
 busy=true;
 var prevTurn=S.turn;
 var v=forced!=null?forced:Dice.d6();lastDie=v;
 var die=$q('#flDie');
 if(die){
  var light=eco()||(UI.reduce&&UI.reduce());
  die.classList.add('rolling');
  var wrap=die.closest('.fldie-wrap');if(wrap)wrap.classList.add('rolling');
  var dock=$q('#fldock');if(dock)dock.classList.add('rolling');
  cancel=Dice.roll(wrapDie(die),[v],function(){
   var r=E.roll(S,v);
   busy=false;save();
   if(!r.ok){UI.toast(r.err||'不能掷',1400,'warn');render();return}
   if(r.v===6){Sound.seq([[523,.08],[659,.08],[784,.15]])}
   else Sound.beep(300,.1);
   if(r.triple6){UI.toast('三连6!一架飞机回基地',1600,'warn');render();sayReact((S.turn-1+S.players.length)%S.players.length,'bounce',{mood:'sad'});later(function(){noteTurnAdvance(prevTurn)},280);return}
   if(r.passed){UI.toast(r.v===6?'没飞机可飞,再掷':'没飞机可飞,换下一位',1400,'info');render();later(function(){noteTurnAdvance(prevTurn)},200);return}
   S.pending={mov:r.mov};render();
   /* 只有一架可走时马上自动走，把台词留给起飞/跳/飞/吃，避免连说两句 */
   if(r.mov && r.mov.length!==1){
    if(r.v===6)sayReact(S.turn,'roll6',{mood:'happy',tiny:1});
    else if(r.v===1)sayReact(S.turn,'lowRoll',{mood:'worried',tiny:1});
   }
   if(r.mov.length===1){later(function(){pickPlane(r.mov[0])},280)}
  },light?{ms:420,stagger:80,tail:220,tick:90}:null);
 }else{
  var r=E.roll(S,v);busy=false;save();render();
  if(r.ok&&r.passed)later(function(){noteTurnAdvance(prevTurn)},80);
  if(r.ok&&!r.passed&&r.mov.length===1)later(function(){pickPlane(r.mov[0])},200);
 }
}
function wrapDie(die){var w=document.createElement('div');w.className='ctdw';die.innerHTML='';die.appendChild(w);var d=document.createElement('div');d.className='die';w.appendChild(d);return w}
function walkMs(){return eco()||(UI.reduce&&UI.reduce())?40:300}
function visSteps(r){
 var steps=[],i,s,e,last;
 if(r.path)for(i=0;i<r.path.length;i++){
  s=r.path[i];
  steps.push({where:s.where,idx:s.idx,kind:s.kind||'step'});
 }
 if(r.ev)for(i=0;i<r.ev.length;i++){
  e=r.ev[i];
  if(e.k!=='jump'&&e.k!=='fly')continue;
  last=steps.length?steps[steps.length-1]:null;
  if(!last||last.where!=='track'||last.idx!==e.to)steps.push({where:'track',idx:e.to,kind:e.k});
 }
 return steps;
}
function clearWalkHit(){
 if(!root)return;
 Array.prototype.forEach.call(root.querySelectorAll('.walkhit'),function(el){el.classList.remove('walkhit')});
}
function hitCell(where,idx,seat){
 clearWalkHit();
 if(!root)return;
 if(where==='track'||where==='pad'){
  var c=root.querySelector('.flc[data-i="'+idx+'"]');
  if(c)c.classList.add('walkhit');
 }else if(where==='home'){
  var h=root.querySelector('.flhome[data-p="'+seat+'"][data-h="'+idx+'"]');
  if(h)h.classList.add('walkhit');
 }
}
function placeWalkTok(){
 if(!walkShow||!root)return;
 var b=root.querySelector('.fltok[data-p="'+walkShow.pid+'"][data-pl="'+walkShow.pl+'"]');
 if(!b)return;
 var p=S.players[walkShow.pid],pos=cellXY(walkShow.where,walkShow.idx,seatOf(p));
 b.classList.add('walking','in-flight');
 b.classList.remove('at-base','go','takeoff-lit');
 b.style.left=pos.x+'%';
 b.style.top=pos.y+'%';
 hitCell(walkShow.where,walkShow.idx,seatOf(p));
}
function walkMove(pid,plId,before,r,done){
 var steps=visSteps(r);
 if(!steps.length){walkShow=null;done();return}
 walkShow={pid:pid,pl:plId,where:before.where,idx:before.idx};
 render();
 var i=0,ms=walkMs(),p=S.players[pid];
 function nx(){
  if(i>=steps.length){walkShow=null;clearWalkHit();done();return}
  var st=steps[i++];
  walkShow.where=st.where;walkShow.idx=st.idx;
  placeWalkTok();
  try{Sound.step()}catch(e){}
  if(!eco()){
   var xy=cellXY(st.where,st.idx,seatOf(p));
   sparkAt(xy.x,xy.y,'trail',2);
  }
  later(nx,st.kind==='fly'?ms*2:(st.kind==='jump'||st.kind==='takeoff'?ms+60:ms));
 }
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){later(nx,eco()?16:48)});
 else later(nx,eco()?16:48);
}
function pickPlane(plId){
 if(busy||S.roll==null)return;
 busy=true;
 var before=null,prevTurn=S.turn,pid=S.turn;
 try{before=S.players[S.turn].planes[plId];before={where:before.where,idx:before.idx}}catch(e){before={where:'track',idx:0}}
 var r=E.applyMove(S,plId);
 if(!r.ok){busy=false;UI.toast(r.err||'不能走',1400,'warn');return}
 save();
 if(before&&before.where==='base')duckDock(1100);
 function finish(){
  walkShow=null;clearWalkHit();
  playMoveFx(r);
  var tookOff=r.ev&&r.ev.some(function(e){return e.k==='takeoff'});
  var launched=r.ev&&r.ev.some(function(e){return e.k==='launch'});
  if(r.sent&&r.sent.length){Sound.seq([[880,.06],[440,.1]]);UI.toast('叠吃!送回基地',1200,'star')}
  else if(tookOff){Sound.seq([[523,.08],[784,.12]]);UI.toast(S.again?'先到停机坪,再掷一次!':'先到停机坪!',1400,'star')}
  else if(launched){Sound.seq([[523,.08],[784,.12]]);if(!r.ev.some(function(e){return e.k==='jump'||e.k==='fly'}))UI.toast('正式起飞!',1100,'star')}
  else if(r.ev&&r.ev.some(function(e){return e.k==='finish'})){Sound.hi();UI.toast('到达终点!',1400,'star')}
  else if(!(r.ev&&r.ev.some(function(e){return e.k==='jump'||e.k==='fly'})))Sound.pop();
  if(S.phase==='over'){var w=S.players[S.winner];try{GC.Intro.banner(w.tok,w.name,'飞到终点啦!')}catch(e){}UI.toast('🏆 '+w.name+' 飞到终点!',2500,'star')}
  else if(S.again&&!tookOff)UI.toast('再掷一次!',1000,'info');
  render();
  reactMove(r,before);
  busy=false;
  later(function(){noteTurnAdvance(prevTurn)}, eco()||(UI.reduce&&UI.reduce())?80:280);
 }
 walkMove(pid,plId,before,r,finish);
}
function rulesModal(){
 UI.modal('<h2>飞行棋规则</h2><p style="text-align:left;line-height:1.5">'+
  '<b style="color:#5a3ea0">✈ 虚线横飞（最重要）</b><br>'+
  '• 走到自己颜色的 <b>✈ 飞机格</b>（连着虚线航线）→ 沿虚线 <b>横飞 +12</b> 格<br>'+
  '• 横飞路上能 <b>撞掉</b> 别人的飞机；起飞落到格上 <b>不</b> 触发横飞<br><br>'+
  '<b>其他规则</b><br>'+
  '• 掷到 <b>6</b>：机库飞机先到本色起飞格（<b>停机坪</b>），本回合停在那儿；<b>下一回合</b>才沿跑道<b>顺时针</b>正式起飞<br>'+
  '• 掷到 6 还可再掷一次（刚上停机坪的那架本回合不能再走）<br>'+
  '• 落到自己颜色格子（彩色格，或中间小圆点是自己颜色）→ <b>同色跳跃</b>到下一同色格<br>'+
  '• 己方飞机可<b>叠机</b>；敌机落到叠机上 → 整叠回基地<br>'+
  '• <b>★ 星星格</b>是安全区，不能被吃<br>'+
  '• 精确步数沿本色终点道进中心<br>'+
  '• 连掷三次 6 → 自家一架飞机回基地并换人</p>'+
  '<div class="row"><button class="btn pri" id="flRk">知道了</button></div>');
 document.getElementById('flRk').onclick=UI.close;
}
function startSelect(){
 if(selv){try{selv.remove()}catch(e){}selv=null}
 selv=Select.screen(root,{kind:'tk',min:2,max:4,title:'飞行棋 · 选角色',sub:'2–4 人 · 点角色，再点飞机颜色（黄·蓝·红·绿）· 颜色不能重复 · 先点的人先走',ok:'开始起飞',catchSet:'fly',theme:'fly',bindSeat:true,
  onDone:function(list){
   selv=null;S=E.newState();E.startGame(S,list.map(function(x){return{tok:x.tok,name:x.name||TKN[x.tok],seat:x.seat}}));save();
   lastToastTurn=S.turn;flyRoundN=1;
   buildBoard();render();fit();
   var go=function(){try{GC.Intro.banner(S.players[0].tok,S.players[0].name,'先掷骰子!')}catch(e){}UI.toast(S.players[0].name+' 先掷!',1600,'star')};
   var did=false;try{did=GC.Intro.vs(S.players.map(function(p){return{tok:p.tok,name:p.name}}),go)}catch(e){}if(!did)go();
  }});
}
function startNew(){UI.confirm({title:'开始新的一局?',text:'当前进度会清空,再选一次角色。',yes:'新局',danger:true,icon:'refresh'}).then(function(ok){if(!ok)return;S=E.newState();save();startSelect()})}
function fit(){
 if(!root)return;
 var land=root.clientWidth>root.clientHeight;
 root.classList.toggle('land',land);
 document.documentElement.classList.toggle('fl-land',land);
}
var api={
 state:function(){return S},engine:E,render:function(){render()},roll:function(v){return doRoll(v)},
 poke:function(pid,pl){pokePlane(pid,pl)},
 setPrintMode:function(on){
  if(!root)return;
  root.classList.toggle('fl-print',!!on);
  if(on)root.classList.remove('fl-island');
  if(S&&S.players&&S.players.length){buildBoard();render()}
 },
 setBoardStyle:function(st){
  if(!root)return;
  root.classList.toggle('fl-island',st==='island');
  root.classList.toggle('fl-print',st==='print');
  if(S&&S.players&&S.players.length){buildBoard();render()}
 }
};
return{
 mount:function(r,ctx){
  root=r;busy=false;selv=null;timers=[];fxLayer=null;lastToastTurn=null;flyRoundN=1;load();
  if(S&&S.players&&S.players.length)flyRoundN=1+Math.floor(((S.hist&&S.hist.length)||0)/S.players.length);
  /* v14：默认 3D 卡通海岛棋盘；setBoardStyle('print'|'plastic') 可切回旧外观 */
  r.classList.add('gm-fly',window.FLY3D?'fl-island':'fl-print');
  r.innerHTML='<div class="fllay"><div class="flbw"><div id="flb" class="flb"></div></div><div class="flside"><div class="flp" id="flp"></div><div class="flruletip" title="飞行棋规则"><b>本色✈飞机格</b><br>= 沿虚线横飞+12<br>★星星格安全 · 同色格跳跃<br><span>掷6先到停机坪 · 下回合顺时针起飞</span></div></div></div>';
  var nr=ctx.nav('list','规则',{id:'flRules'}),nn=ctx.nav('refresh','新局',{id:'flNew'}),ne=ctx.nav('star','省电',{id:'flEco'});
  ctx.slot.appendChild(nr);ctx.slot.appendChild(nn);ctx.slot.appendChild(ne);
  nr.onclick=function(){Sound.tap();rulesModal()};
  nn.onclick=function(){Sound.tap();startNew()};
  function syncEco(){var m=(GC.Gfx&&GC.Gfx.mode())||'std';ne.classList.toggle('on',m==='eco');ne.querySelector('span').textContent=m==='eco'?'省电':'画质'}
  syncEco();
  ne.onclick=function(){Sound.tap();var o=['eco','std','hi'],m=o[(o.indexOf(GC.Gfx.mode())+1)%3];GC.Sound.cfg.gfx=m;GC.Sound.save();GC.Gfx.apply();syncEco();UI.toast(GC.Gfx.NAMES[m],1600,'info')};
  if(S.phase==='setup'||!S.players||!S.players.length){startSelect()}
  else{buildBoard();render();fit()}
  if(window.ResizeObserver){ro=new ResizeObserver(function(){fit()});ro.observe(root)}else window.addEventListener('resize',fit);
  fit();
 },
  unmount:function(){timers.forEach(clearTimeout);timers=[];bubs={};faceMood={};pokeN={};pokeAt={};duckUntil=0;lastToastTurn=null;walkShow=null;if(cancel)cancel();if(ro)ro.disconnect();ro=null;if(S)save();if(selv){try{selv.remove()}catch(e){}}selv=null;document.documentElement.classList.remove('fl-land');fxLayer=null;if(plateURL){try{URL.revokeObjectURL(plateURL)}catch(e){}plateURL=null}root=null},
 api:api
};
})();
