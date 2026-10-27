/* ---------- v21: arcade-style full-screen character intros (original art, CSS transforms/opacity + SVG) ----------
   GC.Intro.select(tok,txt)  · GC.Intro.vs(list[{tok,name}],cb) · GC.Intro.banner(tok,name,txt)
   setting Sound.cfg.intro: 'full' (default) | 'short' | 'off'. Tap anywhere skips. Turn banner never blocks input. */
GC.Intro=(function(){
 var COL=['#2f80ed','#f2b705','#e53935','#ff4fa3','#1fae5b','#8e44ec'],DK=['#123a7a','#7a4e00','#6e0d0d','#7a1048','#0b5a2c','#3e1470'];
 var NM=['小狗','小狮子','不不奥特曼','哎呀公主','温柔喷火龙','猪肉战神'];
 var TAG=['汪汪队长 · 摇尾冲刺','草原小霸王 · 狮吼','能量英雄 · 不不不光线','冰雪魔法 · 闪闪皇冠','温柔火苗 · 爱心喷火','厨神战力 · 百味出击'];
 var O='#3a2418';
 function L(d,c,w){return'<path d="'+d+'" fill="none" stroke="'+O+'" stroke-width="'+(w+6)+'" stroke-linecap="round" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>'}
 function C(x,y,r,c){return'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'" stroke="'+O+'" stroke-width="3"/>'}
 function P(d,c,sw){return'<path d="'+d+'" fill="'+c+'" stroke="'+O+'" stroke-width="'+(sw==null?3:sw)+'" stroke-linejoin="round"/>'}
 function H(s){return'<g transform="translate(0,-44) scale(3)" stroke-width=".9">'+s+'</g>'}
 var EY='<circle cx="-5.5" cy="3" r="2.3" fill="#222"/><circle cx="5.5" cy="3" r="2.3" fill="#222"/><circle cx="-4.8" cy="2.2" r=".8" fill="#fff"/><circle cx="6.2" cy="2.2" r=".8" fill="#fff"/>';
 var BL='<circle cx="-8.5" cy="8" r="2.4" fill="#ff8aa0" opacity=".75"/><circle cx="8.5" cy="8" r="2.4" fill="#ff8aa0" opacity=".75"/>';
 var ART=[
  /* 0 小狗: paw-pump + wagging tail */
  L('M34 70Q74 54 66 14','#b07a4a',13)+P('M-40 124C-46 50-30 2 0 2C30 2 46 50 40 124Z','#c98a52')+P('M-20 124C-24 70-14 40 0 40C14 40 24 70 20 124Z','#fff3e6',2)+
  L('M26 22Q56 6 60-30','#c98a52',18)+C(62,-36,13,'#fff')+L('M-26 26Q-48 54-46 86','#c98a52',18)+C(-46,92,12,'#fff')+
  P('M-26 6Q0 18 26 6L24 16Q0 28-24 16Z','#e53935',2.5)+C(0,26,6,'#ffd23f')+
  H('<ellipse cx="-12" cy="-6" rx="6.5" ry="12" fill="#8a5a33" stroke="'+O+'" transform="rotate(20 -12 -6)"/><ellipse cx="12" cy="-6" rx="6.5" ry="12" fill="#8a5a33" stroke="'+O+'" transform="rotate(-25 12 -6)"/><ellipse cx="0" cy="2" rx="13" ry="13.5" fill="#fff" stroke="'+O+'"/><circle cx="-6" cy="-4.5" r="5" fill="#b07a4a"/>'+EY.replace(/cy="3"/g,'cy="-.5"').replace(/cy="2.2"/g,'cy="-1.3"')+'<ellipse cx="0" cy="7.2" rx="7.5" ry="4.8" fill="#f3e6d2"/><ellipse cx="0" cy="4.8" rx="3.2" ry="2.2" fill="#222"/><path d="M-4.5 9Q0 14 4.5 9" stroke="#222" stroke-width="1.4" fill="#c0392b"/><ellipse cx="0" cy="12.6" rx="2.6" ry="2.1" fill="#f58a9a"/>'),
  /* 1 小狮子: roaring, claws up */
  L('M30 80Q70 90 72 50','#e0a030',10)+C(74,44,9,'#d9731a')+P('M-42 124C-48 50-30 4 0 4C30 4 48 50 42 124Z','#ffc845')+P('M-20 124C-22 76-12 46 0 46C12 46 22 76 20 124Z','#fff3cf',2)+
  L('M-26 26Q-60 10-62-30','#ffc845',18)+L('M26 26Q60 10 62-30','#ffc845',18)+C(-63,-36,12,'#ffd25a')+C(63,-36,12,'#ffd25a')+
  '<path d="M-70-46l-3-9M-63-49v-10M-56-46l3-9M70-46l3-9M63-49v-10M56-46l-3-9" stroke="'+O+'" stroke-width="3" stroke-linecap="round"/>'+
  H('<path d="M0-24L6-17 14-20 15-12 23-9 19-2 25 5 18 9 20 17 12 17 9 25 2 20-5 25-8 17-17 18-16 10-24 5-19-2-23-9-15-12-14-20-6-17Z" fill="#d9731a" stroke="'+O+'"/><circle r="13.5" fill="#ffd25a" stroke="'+O+'"/><circle cx="-9" cy="-11" r="3.6" fill="#ffd25a" stroke="'+O+'"/><circle cx="9" cy="-11" r="3.6" fill="#ffd25a" stroke="'+O+'"/><path d="M-8-4l5 2M8-4l-5 2" stroke="#222" stroke-width="1.3"/><circle cx="-5.5" cy="-.5" r="2" fill="#222"/><circle cx="5.5" cy="-.5" r="2" fill="#222"/><ellipse cx="0" cy="5" rx="6.5" ry="5" fill="#fff3cf"/><path d="M-2.5 2.6H2.5L0 5Z" fill="#7a3a12"/><ellipse cx="0" cy="8.5" rx="4" ry="3.6" fill="#8a1a1a"/><ellipse cx="0" cy="10" rx="2.4" ry="1.5" fill="#f58a9a"/>'),
  /* 2 不不奥特曼: original kid hero — star emblem, cape, punch */
  P('M-30 10Q-70 70-58 128L58 128Q40 60 24 10Z','#8a1010')+P('M-38 124C-44 50-28 2 0 2C28 2 44 50 38 124Z','#e53935')+P('M-26 20Q0 34 26 20L22 56Q0 66-22 56Z','#dfe6ee',2.5)+
  P('M0 26L5 37 17 38 8 46 11 58 0 51-11 58-8 46-17 38-5 37Z','#ffd23f',2)+P('M-34 84H34V96H-34Z','#ffd23f',2.5)+
  L('M-26 26Q-50 34-70 22','#e53935',19)+C(-76,20,13,'#ffd9b3')+L('M26 28Q46 50 26 74','#e53935',17)+C(26,76,10,'#ffd9b3')+
  H('<circle cx="0" cy="2" r="13" fill="#ffd9b3" stroke="'+O+'"/><path d="M-14 1C-16-17 16-17 14 1C10-6 6-4 4-8C1-4-3-5-5-9C-7-5-11-6-14 1Z" fill="#2b1d1a" stroke="'+O+'"/><path d="M-9-1l6 2M9-1l-6 2" stroke="#222" stroke-width="1.4"/>'+EY+BL+'<path d="M-4.5 9.5Q0 14 4.5 9.5Z" fill="#8a2a1a"/>'),
  /* 3 哎呀公主: tiara, wand raised */
  P('M-18 6L-48 124H48L18 6Z','#ff7fb6')+P('M-50 112Q-38 126-25 112Q-12 126 0 112Q12 126 25 112Q38 126 50 112L52 126H-52Z','#fff',2.5)+P('M-18 6Q0 16 18 6L16 30Q0 38-16 30Z','#ff4fa3',2.5)+
  C(-24,16,11,'#ffb3d4')+C(24,16,11,'#ffb3d4')+L('M28 20Q54 2 58-36','#ffd9b3',11)+L('M58-36L66-74','#c58bff',5)+
  P('M67-92L72-82 83-81 75-74 77-63 67-68 57-63 59-74 51-81 62-82Z','#ffd23f',2.5)+L('M-28 22Q-44 56-32 80','#ffd9b3',11)+
  H('<circle cx="-16" cy="-2" r="6.5" fill="#d9531e" stroke="'+O+'"/><circle cx="16" cy="-2" r="6.5" fill="#d9531e" stroke="'+O+'"/><circle cx="0" cy="2" r="13" fill="#ffe0c2" stroke="'+O+'"/><path d="M-14 1C-15-15 15-15 14 1C9-5 3-7 0-6C-4-7-9-5-14 1Z" fill="#d9531e" stroke="'+O+'"/><path d="M-13-8L-19-13M13-8L19-13" stroke="#ff4d8d" stroke-width="3" stroke-linecap="round"/><path d="M-9-11L-6-19-2-13 0-21 2-13 6-19 9-11Z" fill="#ffd23f" stroke="'+O+'"/><circle cx="0" cy="-15" r="1.6" fill="#ff4fa3"/>'+EY+BL+'<path d="M-4 10Q0 14 4 10" stroke="#8a2a1a" stroke-width="1.6" fill="none"/>'),
  /* 4 温柔喷火龙: dragon-hoodie kid, wings, heart flame in palm */
  P('M-30 20L-78-20-66 18-84 30-40 50Z','#8e1d14')+P('M30 20L78-20 66 18 84 30 40 50Z','#8e1d14')+L('M30 96Q80 110 76 60','#d63a2e',14)+P('M70 52l12-6-2 12Z','#ffd23f',2)+
  P('M-40 124C-46 50-30 2 0 2C30 2 46 50 40 124Z','#d63a2e')+P('M-20 124C-22 70-12 36 0 36C12 36 22 70 20 124Z','#ffe7a8',2)+'<path d="M-15 60H15M-17 76H17M-18 92H18" stroke="#d9a440" stroke-width="2.5"/>'+
  L('M-26 26Q-52 30-60 4','#d63a2e',17)+C(-61,-2,11,'#ffe0c2')+L('M26 28Q44 54 30 78','#d63a2e',16)+C(30,80,10,'#ffe0c2')+
  '<g class="ifl"><path d="M-61-14C-74-30-62-44-61-56C-54-44-46-30-61-14Z" fill="#ff9f1a" stroke="'+O+'" stroke-width="2.5"/><path d="M-61-20C-66-28-63-34-61-40C-58-34-56-28-61-20Z" fill="#ffe14d"/></g>'+
  H('<path d="M-17 15C-21-12 21-12 17 15C12 8 10 0 0-9C-10 0-12 8-17 15Z" fill="#c4281c" stroke="'+O+'"/><path d="M-6-3L-3-10 0-4 3-10 6-3Z" fill="#ffd23f" stroke="'+O+'" stroke-width=".8"/><path d="M-11 0L-17-6-8-3ZM11 0L17-6 8-3Z" fill="#fff3cf" stroke="'+O+'" stroke-width=".8"/><circle cx="0" cy="3" r="12" fill="#ffe0c2" stroke="'+O+'"/><path d="M-12 0C-8-10 8-10 12 0C6-3-2-8-12 0Z" fill="#c4281c"/>'+EY.replace(/cy="3"/g,'cy="4"').replace(/cy="2.2"/g,'cy="3.2"')+BL+'<path d="M-4 11Q0 15 4 11" stroke="#8a2a1a" stroke-width="1.6" fill="none"/>'),
  /* 5 猪肉战神: human pork-cuisine war-god chef, golden helm, apron, meat props (not a pig person) */
  P('M-40 124C-46 50-30 2 0 2C30 2 46 50 40 124Z','#8e44ec')+P('M-30 70H30V82H-30Z','#ffd23f',2.5)+'<ellipse cx="0" cy="40" rx="11" ry="8" fill="#ff9ec4" stroke="'+O+'" stroke-width="2.5"/><circle cx="-4" cy="40" r="2" fill="'+O+'"/><circle cx="4" cy="40" r="2" fill="'+O+'"/>'+
  L('M-26 26Q-52 40-56 74','#8e44ec',18)+C(-56,80,11,'#ffd9b3')+L('M26 24Q50 4 46-24','#8e44ec',18)+
  L('M44-26L66-70','#fff7e6',8)+C(64,-76,6,'#fff7e6')+C(72,-70,6,'#fff7e6')+P('M40-30C24-46 30-74 52-78C70-80 76-56 62-42C56-34 48-28 40-30Z','#c0642c')+'<path d="M38-56Q46-66 56-64" stroke="#ffd7a8" stroke-width="4" fill="none" stroke-linecap="round"/>'+C(44,-28,11,'#ffd9b3')+
  H('<circle cx="0" cy="2" r="13" fill="#ffd9b3" stroke="'+O+'"/><path d="M-13-2C-12-14 12-14 13-2C8-8-8-8-13-2Z" fill="#6b4226" stroke="'+O+'"/><path d="M-14-5Q0-9 14-5L14-1Q0-5-14-1Z" fill="#e53935" stroke="'+O+'" stroke-width=".7"/><path d="M14-4Q20-6 23-1M14-3Q19 0 20 5" stroke="#e53935" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="-10.5" y="-.5" width="8.5" height="6.5" rx="2" fill="#fff" fill-opacity=".55" stroke="#345" stroke-width="1.2"/><rect x="2" y="-.5" width="8.5" height="6.5" rx="2" fill="#fff" fill-opacity=".55" stroke="#345" stroke-width="1.2"/><path d="M-2 2H2" stroke="#345" stroke-width="1.2"/><circle cx="-6" cy="2.5" r="1.7" fill="#222"/><circle cx="6" cy="2.5" r="1.7" fill="#222"/>'+BL+'<path d="M-5 9.5Q0 15 5 9.5Z" fill="#8a2a1a"/>')
 ];
 /* v22: painted portraits (window.CT_ART, one map: art/map.json) override the SVG redraws */
 function portrait(t){var A=window.CT_ART;if(A&&A[t])return'<img class="ipt ipi" src="'+A[t]+'" alt="" draggable="false" decoding="async">';return'<svg class="ipt" viewBox="-100 -120 200 250" aria-hidden="true">'+ART[t]+'</svg>'}
 /* character particles */
 var PS=[
  '<svg viewBox="-12 -8 24 16"><path d="M-8-3a3 3 0 1 1 3-3l10 0a3 3 0 1 1 3 3v6a3 3 0 1 1-3 3h-10a3 3 0 1 1-3-3z" fill="#fff" stroke="#8a5a33" stroke-width="1.5"/></svg>|<svg viewBox="-12 -12 24 24" fill="#8a5a33"><ellipse cy="4" rx="6" ry="5"/><circle cx="-7" cy="-3" r="2.6"/><circle cx="-2.5" cy="-7" r="2.6"/><circle cx="2.5" cy="-7" r="2.6"/><circle cx="7" cy="-3" r="2.6"/></svg>',
  '<svg viewBox="-12 -12 24 24"><path d="M0-11L3-3 11-3 5 2 7 10 0 5-7 10-5 2-11-3-3-3Z" fill="#ffd23f" stroke="#a35c00" stroke-width="1.2"/></svg>|<svg viewBox="-12 -12 24 24"><path d="M-10 6L-11-6-5 0 0-9 5 0 11-6 10 6Z" fill="#ffd23f" stroke="#a35c00" stroke-width="1.3"/></svg>',
  '<svg viewBox="-12 -12 24 24"><path d="M0-11L3-3 11-3 5 2 7 10 0 5-7 10-5 2-11-3-3-3Z" fill="#ffe14d" stroke="#fff" stroke-width="1"/></svg>|<svg viewBox="-12 -12 24 24"><path d="M2-11L-6 2H0L-2 11 7-3H1Z" fill="#7fd8ff" stroke="#fff" stroke-width="1"/></svg>',
  /* 3 ice princess: snowflakes + ice sparkles + crown */
  '<svg viewBox="-12 -12 24 24"><g stroke="#e8f8ff" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M0-11V11M-9.5-5.5L9.5 5.5M-9.5 5.5L9.5-5.5"/><path d="M-3-8L0-5 3-8M-3 8L0 5 3 8M-8.5-1.5L-5.5 0-8.5 1.5M8.5-1.5L5.5 0 8.5 1.5" stroke-width="1.3"/></g><circle r="1.6" fill="#9fdcff"/></svg>|<svg viewBox="-12 -12 24 24"><path d="M0-11Q1.5-1.5 11 0Q1.5 1.5 0 11Q-1.5 1.5-11 0Q-1.5-1.5 0-11Z" fill="#dff6ff" stroke="#7cc8ff" stroke-width="1.2"/></svg>|<svg viewBox="-12 -12 24 24"><g stroke="#bfe9ff" stroke-width="2" stroke-linecap="round"><path d="M0-10V10M-8.7-5L8.7 5M-8.7 5L8.7-5"/></g></svg>|<svg viewBox="-12 -12 24 24"><path d="M-10 6L-11-6-5 0 0-9 5 0 11-6 10 6Z" fill="#e6f4ff" stroke="#6aa8e0" stroke-width="1.3"/></svg>',
  '<svg viewBox="-12 -12 24 24"><path d="M0 11C-11 2-9-10 0-4C9-10 11 2 0 11Z" fill="#ff6b8a" stroke="#fff" stroke-width="1.2"/></svg>|<svg viewBox="-12 -12 24 24"><path d="M0 11C-9 9-9-1 0-11C9-1 9 9 0 11Z" fill="#ff9f1a" stroke="#ffe14d" stroke-width="1.6"/></svg>',
  '<svg viewBox="-12 -12 24 24"><circle r="10" fill="#ffd23f" stroke="#a35c00" stroke-width="1.6"/><path d="M-4-5L0 0 4-5M0 0V6M-4 1H4M-4 4H4" stroke="#a35c00" stroke-width="1.6" fill="none"/></svg>|<svg viewBox="-14 -12 28 24"><path d="M-12 6L4-8M2-10a3 3 0 1 1 3 3" stroke="#fff7e6" stroke-width="3" stroke-linecap="round" fill="none"/><ellipse cx="6" cy="0" rx="7" ry="9" fill="#c0642c" transform="rotate(40 6 0)"/></svg>'
 ];
 /* special fx layer per character (roar rings, beam, flame ...) */
 var SFX=['<i class="is-wag"></i>','<i class="is-ring"></i><i class="is-ring r2"></i><i class="is-ring r3"></i>','<i class="is-beam"></i>','<i class="is-tiara"></i>','<i class="is-hearts"></i><i class="is-ember"></i>','<i class="is-coin"></i>'];
 function parts(t,n){var a=PS[t].split('|'),h='';for(var i=0;i<n;i++){var x=(i*37+11)%100,y=(i*53+17)%100,d=(i%7)*.09,s=.7+((i*13)%10)/12;h+='<i class="ip" style="left:'+x+'%;top:'+y+'%;--d:'+d.toFixed(2)+'s;--s:'+s.toFixed(2)+';--r:'+((i*47)%360)+'deg">'+a[i%a.length]+'</i>'}return h}
 /* v23: 动画速度 慢 = 1.3x everything (Sound.cfg.aspd) */
 function speed(){return GC.Sound&&GC.Sound.cfg&&GC.Sound.cfg.aspd==='slow'?1.3:1}
 function now(){return Date.now()}
 var tlog=[];
 function mode0(){var m=GC.Sound&&GC.Sound.cfg&&GC.Sound.cfg.intro;return m==='short'||m==='off'?m:'full'}
 /* v25: 画质 省电 caps 完整 → 简短 */
 function mode(){var m=mode0();return m==='full'&&GC.Gfx&&GC.Gfx.mode()==='eco'?'short':m}
 function rd(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
 var cur=null,log=[];
 try{var A0=window.CT_ART;if(A0)setTimeout(function(){Object.keys(A0).forEach(function(k){var im=new Image();im.src=A0[k];if(im.decode)im.decode().catch(function(){})})},1500)}catch(e){}
 function sfx(k){var S=GC.Sound;if(!S||!S.on)return;try{
  if(k==='slam'){S.beep(110,.18,0,'square',.16);S.beep(70,.28,.03,'sine',.3)}
  else if(k==='whoosh'){S.seq([[300,.05,.03],[420,.05,.03],[560,.05,.03],[760,.08,.03]])}
  else if(k==='go'){S.seq([[523,.08,.08],[659,.08,.08],[784,.08,.08],[1047,.25,.1]])}
  else if(k==='vs'){S.beep(98,.35,0,'sawtooth',.12);S.beep(147,.3,.02,'square',.08)}}catch(e){}}
 function kill(){if(cur){var c=cur;cur=null;clearTimeout(c.t);c.rec.t1=now();c.el.classList.add('iout');setTimeout(function(){c.el.remove()},400);c.cb&&c.cb()}}
 function show(cls,html,ms,o){
  o=o||{};if(cur)kill();
  var el=document.createElement('div');el.className='intro '+cls+(rd()?' ird':'');el.innerHTML=html;
  if(o.vars)for(var k in o.vars)el.style.setProperty(k,o.vars[k]);
  document.body.appendChild(el);var me={el:el,cb:o.cb,rec:{k:cls.split(' ')[0],t0:now(),ms:ms}};cur=me;log.push(cls.split(' ')[0]);tlog.push(me.rec);if(tlog.length>80)tlog.shift();
  var sp=speed();if(sp>1&&!rd()){ms=Math.round(ms*sp);try{el.getAnimations({subtree:true}).forEach(function(an){an.playbackRate=1/sp})}catch(e){}}
  if(o.block!==false){el.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(cur===me)kill()});el.addEventListener('click',function(e){e.stopPropagation()})}
  else{var off=function(){document.removeEventListener('pointerdown',off,true);if(cur===me)kill()};setTimeout(function(){document.addEventListener('pointerdown',off,true)},60);var oc=me.cb;me.cb=function(){document.removeEventListener('pointerdown',off,true);oc&&oc()}}
  /* v23 hold: a select intro stays in its pose until the catchphrase clip has finished (cap +4 s) */
  var t0=now();function end(){if(cur!==me)return;if(o.hold&&GC.Voice&&GC.Voice.busy&&GC.Voice.busy()&&now()-t0<ms+4000){me.t=setTimeout(end,120);return}kill()}
  me.t=setTimeout(end,rd()?Math.min(ms,1200):ms);
  return me;
 }
 function nameHTML(t,n){return'<b class="inm" data-t="'+esc(n)+'">'+esc(n)+'</b>'}
 function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 /* v23: VS names must fit their (skewed) panel and stay on screen — shrink, then wrap to 2 lines, then nudge inward */
 function fitVS(root,nudge){var W=window.innerWidth,port=W<window.innerHeight,T=Math.tan(10*Math.PI/180),ps=root.querySelectorAll('.ivp'),ox=root.getBoundingClientRect().left; /* root may be mid-shake */
  Array.prototype.forEach.call(ps,function(p){var n=p.querySelector('.ivn');if(!n)return;
   n.style.translate='';var pr=p.getBoundingClientRect(),nr=n.getBoundingClientRect(),L,Rr;
   /* landscape panels are skewX(-10deg): the visible slice at the name's height is the panel width, shifted by tan10·dy; also clip to the screen */
   if(!port){var c=pr.left+pr.width/2-T*((nr.top+nr.height/2)-(pr.top+pr.height/2));L=c-p.offsetWidth/2;Rr=c+p.offsetWidth/2}else{L=-1e4;Rr=1e4} /* portrait: full-width rows sliding in sideways → clamp to the screen only */
   L=Math.max(L,8+ox);Rr=Math.min(Rr,W-8+ox);var lim=Math.max(40,(Rr-L)*(port?.45:.9));
   {n.style.maxWidth='none';n.style.overflow='visible';n.style.textOverflow='clip';
    var fs=parseFloat(getComputedStyle(n).fontSize);
    while(n.getBoundingClientRect().width>lim&&fs>11){fs-=1;n.style.fontSize=fs+'px'}
    if(n.getBoundingClientRect().width>lim){n.style.whiteSpace='normal';n.style.width=Math.floor(lim)+'px';n.style.textAlign='center';n.style.lineHeight='1.15'}
    n.setAttribute('data-fit',fs)}
   nr=n.getBoundingClientRect();var dx=0;
   if(!port)dx=(L+Rr)/2-(nr.left+nr.width/2);/* portrait: the name is pinned inside the row by CSS (right:7%), no nudge needed */
   if(Math.abs(dx)>=1)n.style.translate=Math.round(dx)+'px 0'})}
 /* v24: painted attack VFX in the select intro (dragon fire / ice burst / beam / pig slam) from the portrait's mouth/wand/hand/feet */
 var ANCH={2:[.11,.17],3:[.10,.12],4:[.63,.28],5:[.5,.95]};
 function selFx(t,me){try{/* v27: 温柔喷火龙 select = soft CSS flourish only; fire 大招 only on angry */if(t===4||!GC.FX||!ANCH[t]||!GC.FX.has(t)||rd())return;me.el.classList.add('hasfx');
  setTimeout(function(){if(cur!==me)return;var im=me.el.querySelector('.ime img.ipi');if(!im||!im.naturalWidth)return;
   var r=im.getBoundingClientRect(),hr=me.el.getBoundingClientRect(),s=Math.min(r.width/im.naturalWidth,r.height/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s,dx=r.left+(r.width-dw)/2,dy=r.top+r.height-dh,a=ANCH[t];
   var sc=Math.min(hr.width,hr.height)/820;
   GC.FX.attack(t,{x:dx+dw*a[0],y:dy+dh*a[1],s:dh},{host:me.el,before:me.el.querySelector('.itx'),inIntro:true,shakeEl:me.el.querySelector('.ifig'),scale:sc,dir:1,ground:0,len:t===4?hr.width*.7:t===2?hr.width*.95:null,size:t===3?Math.min(hr.width,hr.height)*.9:t===5?Math.min(hr.width*.75,hr.height*1.25):null})},560)}catch(e){}}
 var api={
  mode:mode,mode0:mode0,speed:speed,_log:log,_tl:tlog,D:{select:3400,selShort:2000,vs:3800,vsShort:2300,banner:2000,bannerShort:1250},ART:ART,portrait:portrait,skip:kill,active:function(){return!!cur},
  /* select-screen intro ~2s (short mode → banner) */
  select:function(t,txt,name){var m=mode();if(m==='off')return false;if(m==='short')return api.banner(t,name||NM[t],txt,{sel:true});
   var h='<div class="ibg"><i class="ib1"></i><i class="ib2"></i><i class="iray"></i><i class="ispd"></i></div><div class="ifx">'+SFX[t]+parts(t,14)+'</div>'+
    '<div class="ifig"><div class="igh">'+portrait(t)+'</div><div class="igh g2">'+portrait(t)+'</div><div class="ime">'+portrait(t)+'</div></div>'+
    '<div class="itx"><small class="itag">'+TAG[t]+'</small>'+nameHTML(t,name||NM[t])+(txt?'<p class="isub">「'+esc(txt)+'」</p>':'')+'</div><i class="iflash"></i><span class="iskip">点一下跳过</span>';
   var me=show('isel it'+t,h,api.D.select,{hold:true,vars:{'--c':COL[t],'--dk':DK[t]}});selFx(t,me);sfx('whoosh');setTimeout(function(){sfx('slam');GC.Sound&&GC.Sound.vib&&GC.Sound.vib(30)},420);return true},
  /* game start: VS lineup then 开始! (~2.5s full, ~1.4s short) */
  vs:function(list,cb){var m=mode();if(m==='off'||!list||!list.length){cb&&cb();return false}
   var n=list.length,h='<div class="ivsrow n'+n+'">';
   list.forEach(function(p,i){h+='<div class="ivp it'+p.tok+'" style="--c:'+COL[p.tok]+';--dk:'+DK[p.tok]+';--i:'+i+'"><div class="ivin"><i class="ispd"></i>'+portrait(p.tok)+'<b class="ivn">'+esc(p.name||NM[p.tok])+'</b></div></div>'});
   h+='</div><b class="ivs"><b class="inm big" data-t="VS" style="--dk:#b3001b">VS</b></b><b class="igo"><b class="inm big" data-t="开始!" style="--dk:#c2005f">开始!</b></b><i class="iflash"></i><span class="iskip">点一下跳过</span>';
   var sh=m==='short',k=sh?.6:1,sp=speed(),me=show('ivsw'+(sh?' ishort':''),h,sh?api.D.vsShort:api.D.vs,{cb:cb,vars:{'--k':k}});
   sfx('whoosh');setTimeout(function(){sfx('vs')},1150*k*sp);setTimeout(function(){sfx('go')},2400*k*sp);try{fitVS(me.el)}catch(e){}
   /* panels slide in — nudge edge names only once they have landed */
   var land=Math.round(((n-1)*.12+.5)*k*sp*1000);/* images decode late on a busy device and change the layout: refit on load too */
   Array.prototype.forEach.call(me.el.querySelectorAll('img'),function(im){if(!im.complete)im.addEventListener('load',function(){try{if(me.el.isConnected)fitVS(me.el,true)}catch(e){}})});
   [land+150,land+700,land+1500].forEach(function(d){setTimeout(function(){try{if(me.el.isConnected)fitVS(me.el,true)}catch(e){}},d)});return true},
  /* turn / big-moment banner ~1s, never blocks input */
  banner:function(t,name,txt,o){o=o||{};var m=mode();if(m==='off')return false;
   var h='<div class="ibd"><i class="ispd"></i><div class="ibh">'+portrait(t)+'</div><div class="ibt">'+(o.sub?'<small class="ibsub">'+esc(o.sub)+'</small>':'')+'<b class="inm sm" data-t="'+esc(name||NM[t])+'">'+esc(name||NM[t])+'</b>'+(txt?'<span>'+esc(txt)+'</span>':'')+'</div><div class="ibp">'+parts(t,5)+'</div></div>';
   var bd=o.sel?api.D.selShort:(m==='short'?api.D.bannerShort:api.D.banner);show('ibn it'+t+(o.sel?' ibsel':''),h,bd,{block:false,hold:!!o.sel,vars:{'--c':COL[t],'--dk':DK[t],'--bd':bd+'ms'}});sfx('whoosh');return true}
 };
 return api;
})();
