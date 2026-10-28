(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
var GC=window.GC={games:[]};
/* ================= Store: namespaced localStorage ================= */
var P='gc:';
var Store=GC.Store={
 get:function(ns,d){try{var v=JSON.parse(localStorage.getItem(P+ns));return v==null?d:v}catch(e){return d}},
 set:function(ns,v){try{localStorage.setItem(P+ns,JSON.stringify(v));return true}catch(e){return false}},
 del:function(ns){try{localStorage.removeItem(P+ns)}catch(e){}},
 keys:function(){var r=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf(P)===0)r.push(k.slice(P.length))}}catch(e){}return r.sort()},
 exportAll:function(){var data={};Store.keys().forEach(function(k){data[k]=Store.get(k)});return JSON.stringify({app:'game-center',version:1,exported:new Date().toISOString(),data:data},null,1)},
 importAll:function(text){
  var o;try{o=JSON.parse(text)}catch(e){throw new Error('不是有效的进度文件')}
  if(!o||o.app!=='game-center'||!o.data||typeof o.data!=='object')throw new Error('这不是游戏中心的进度文件');
  Store.keys().forEach(Store.del);var n=0;
  for(var k in o.data){if(/^[\w.-]{1,40}$/.test(k)){Store.set(k,o.data[k]);n++}}
  return n;
 },
 migrate:function(){ // v2 (兔子棋助手) -> v3
  if(Store.get('migrated'))return;
  try{
   var oc=JSON.parse(localStorage.getItem('rabbitCards.v1'));
   if(oc&&oc.deck&&oc.disc){
    Store.set('cards',{deck:oc.deck,disc:oc.disc,cur:oc.cur||null,undo:oc.undo||null});
    var n=Math.max(1,Math.min(6,oc.players||3));
    Store.set('players.rabbit',{on:[0,1,2,3,4,5].map(function(i){return i<n}),names:['','','','','',''],turn:oc.turn||0,adv:!!oc.adv});
    if(oc.sound===false)Store.set('settings',{sound:false,vib:true});
   }
   var od=JSON.parse(localStorage.getItem('rabbitDice.v1'));if(od&&od.n)Store.set('dice',od);
  }catch(e){}
  Store.set('migrated',1);
 }
};
Store.migrate();
/* ================= Voice (v14): 离线语音 Web Speech API ================= */
GC.Voice=(function(){
 /* v15: 预生成角色语音(内嵌 mp3, window.CT_VOICE), Web Audio 播放; 缺失时回退系统 speechSynthesis */
 var ss=window.speechSynthesis,unlocked=false,vz=null,last=0,q=0;
 var ctx=null,cache={},cur=null,qu=[],ended=0,dec=null,curIt=null,ttsUntil=0,lastEnd=0,tl=[];
 /* v23: timeline of every line (t0 start, t1 end) so the game can wait for a line to finish */
 function T0(it){it.t0=Date.now();tl.push(it);if(tl.length>60)tl.shift()}
 function T1(it){if(it&&!it.t1){it.t1=Date.now();lastEnd=Math.max(lastEnd,it.t1)}}
 /* tok: 0 小狗 1 小狮子 2 不不奥特曼 3 哎呀公主 4 温柔喷火龙 5 猪肉战神 n 旁白 */
 var PR={0:[1.45,1.15],1:[1.25,1.1],2:[1.3,1.25],3:[1.85,1.05],4:[1.1,.85],5:[.55,.95],n:[1,1.1]};
 function pickVoice(){if(!ss)return null;var v=ss.getVoices()||[];vz=v.filter(function(x){return /zh[-_]CN/i.test(x.lang)})[0]||v.filter(function(x){return /^zh/i.test(x.lang)&&!/HK|TW/i.test(x.lang)})[0]||v.filter(function(x){return /^zh/i.test(x.lang)})[0]||null;return vz}
 if(ss){pickVoice();try{ss.addEventListener('voiceschanged',pickVoice)}catch(e){}}
 function on(){return GC.Sound&&GC.Sound.on&&GC.Sound.cfg.voice!==false}
 function AC(){if(!ctx){var C=window.AudioContext||window.webkitAudioContext;if(C)try{ctx=new C()}catch(e){}}return ctx}
 function unlock(){if(unlocked)return;unlocked=true;
  try{var c=AC();if(c){if(c.state==='suspended')c.resume();var b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0)}}catch(e){}
  try{if(ss){var u=new SpeechSynthesisUtterance(' ');u.volume=0;u.lang='zh-CN';ss.speak(u)}}catch(e){}}
 ['pointerdown','touchend','click'].forEach(function(t){document.addEventListener(t,unlock,{capture:true,passive:true})});
 function clipKey(txt,tok){var V=window.CT_VOICE;if(!V)return null;var k=(tok==null?'n':tok)+'|'+txt;return V[k]?k:(V['n|'+txt]?'n|'+txt:null)}
 function buf(k){if(cache[k])return cache[k];var c=AC();if(!c)return Promise.reject();var b64=window.CT_VOICE[k],bin=atob(b64),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  cache[k]=new Promise(function(res,rej){try{var r=c.decodeAudioData(u.buffer,res,rej);if(r&&r.then)r.then(res,rej)}catch(e){rej(e)}});cache[k].catch(function(){delete cache[k]});return cache[k]}
 function stopAll(){qu=[];dec=null;if(cur){try{cur.onended=null;cur.stop()}catch(e){}cur=null}T1(curIt);curIt=null;if(ttsIt){T1(ttsIt);ttsIt=null}try{ss&&ss.cancel()}catch(e){}q=0;ttsUntil=0}
 var ttsIt=null;
 function playNext(){if(cur||dec||!qu.length)return;var it=qu.shift();dec=it;
  buf(it.k).then(function(b){if(dec!==it)return;dec=null;if(!on()){playNext();return}var c=AC();if(c.state==='suspended')c.resume();GC.Gfx&&GC.Gfx.touch();var s=c.createBufferSource();s.buffer=b;s.connect(c.destination);cur=s;curIt=it;it.dur=Math.round(b.duration*1000);it.src='clip';T0(it);GC.Voice._played.push(it.k);
   /* ended can be lost on a suspended context: cap at clip length + 1.2 s */
   var done=false,fin=function(){if(done)return;done=true;clearTimeout(cap);T1(it);if(cur===s){cur=null;curIt=null}playNext()},cap=setTimeout(fin,it.dur+1200);
   s.onended=fin;s.start(0)},function(){if(dec!==it)return;dec=null;tts(it.txt,it.tok,it.prot);playNext()})}
 function tts(txt,tok){if(!ss)return;try{var t=String(txt).replace(/[¥]/g,'').replace(/[…~]+/g,',').replace(/[!！]+/g,'!'),u=new SpeechSynthesisUtterance(t),pr=PR[tok]||PR.n;
   u.lang='zh-CN';if(vz||pickVoice())u.voice=vz;u.pitch=pr[0];u.rate=pr[1];u.volume=1;q++;
   /* v23: onend can be missing on some engines: cap by text length (≤ 7 s) */
   var it={txt:txt,tok:tok,src:'tts',prot:!!arguments[2]};T0(it);ttsIt=it;ttsUntil=Math.max(ttsUntil,Date.now())+Math.min(7000,900+String(t).length*280);
   u.onend=u.onerror=function(){q=Math.max(0,q-1);T1(it);if(ttsIt===it)ttsIt=null;if(!q)ttsUntil=0};GC.Voice._tts.push(txt);ss.speak(u)}catch(e){}}
 function busy(){var now=Date.now();if(ttsIt&&now>=ttsUntil){T1(ttsIt);ttsIt=null;q=0}return !!cur||!!dec||qu.length>0||(now<ttsUntil&&(q>0||(ss&&ss.speaking)))}
 function prot(){var it=curIt||dec||ttsIt;return !!(it&&it.prot)}
 function say(txt,tok,opt){
  if(!on()||!txt)return;opt=opt||{};
  var now=Date.now();if(txt===say.lt&&now-last<2500)return;say.lt=txt;if(opt.low&&busy()&&now-last<1500)return;last=now;
  /* v23: a character line (prot) is never cut by a later announcement — that one queues behind it */
  var room=(qu.length+(cur||dec?1:0)+q)<3,queue=busy()&&((opt.queue&&room)||(prot()&&room));if(!queue&&!(busy()&&prot()))stopAll();else if(!queue)return;
  var k=opt.tts?null:clipKey(txt,tok);
  if(k){qu.push({k:k,txt:txt,tok:tok,prot:!!opt.prot});playNext()}
  else{try{if(!queue&&ss)ss.cancel()}catch(e){}tts(txt,tok,!!opt.prot)}
 }
 return{_ctx:function(){return ctx},say:say,cancel:stopAll,busy:busy,lastEnd:function(){return lastEnd},playing:function(txt){return (curIt&&curIt.txt===txt)||(dec&&dec.txt===txt)||(ttsIt&&ttsIt.txt===txt&&busy())||qu.some(function(x){return x.txt===txt})},will:function(t,k){return on()&&(!!clipKey(t,k)||!!ss)},_tl:tl,get on(){return on()},get supported(){return !!(window.CT_VOICE||ss)},unlock:unlock,_played:[],_tts:[],has:function(t,k){return !!clipKey(t,k)}};
})();
/* ================= Sound / vibration ================= */
var ac;
var Sound=GC.Sound={
 cfg:Store.get('settings',{sound:true,vib:true}),
 save:function(){Store.set('settings',Sound.cfg)},
 get on(){return Sound.cfg.sound!==false},
 beep:function(f,d,delay,type,vol){
  if(!Sound.on)return;
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();GC.Gfx&&GC.Gfx.touch();
   var o=ac.createOscillator(),g=ac.createGain();o.type=type||'triangle';o.frequency.value=f;var t=ac.currentTime+(delay||0);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.22,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);
   o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02)}catch(e){}
 },
 seq:function(a){a.forEach(function(x,i){Sound.beep(x[0],x[1]||.1,i*(x[2]||.1))})},
 pop:function(){Sound.seq([[523,.09],[784,.12]])},
 boop:function(){Sound.beep(200,.18,0,'sine')},
 hi:function(){Sound.seq([[659,.08],[880,.08],[1175,.14]])},
 coin:function(){Sound.seq([[988,.07,.0],[1319,.14,.07]])},
 flip:function(){Sound.beep(340,.06,0,'square',.1);Sound.beep(520,.1,.06,'triangle')},
 step:function(){Sound.beep(480+Dice.int(60),.05,0,'sine',.12)},
 buy:function(){Sound.seq([[523,.08],[659,.08],[784,.08],[1047,.2]])},
 bad:function(){Sound.seq([[330,.14,.14],[262,.2,.14]])},
 tap:function(){Sound.beep(700,.04,0,'sine',.1)},
 win:function(){Sound.seq([[523,.12,.12],[659,.12,.12],[784,.12,.12],[1047,.12,.12],[784,.1,.1],[1047,.3,.1]])},
 vib:function(p){if(Sound.cfg.vib===false)return;try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
};
['touchstart','mousedown'].forEach(function(ev){document.addEventListener(ev,function(){try{if(ac&&ac.state==='suspended')ac.resume()}catch(e){}},{passive:true})});
/* ================= v25: 画质 (Sound.cfg.gfx: eco 省电 | std 标准 default | hi 华丽) + idle-power baseline ================= */
var Gfx=GC.Gfx=(function(){
 var H=document.documentElement,idleT=0,tipped=false;
 function mode(){var m=Sound.cfg.gfx;return m==='eco'||m==='hi'?m:'std'}
 function apply(){var m=mode();['eco','std','hi'].forEach(function(k){H.classList.toggle('gq-'+k,m===k)});if(m==='eco'){try{GC.FX&&GC.FX.kill()}catch(e){}}}
 function ctxs(){var a=[];try{if(ac)a.push(ac)}catch(e){}try{var v=GC.Voice&&GC.Voice._ctx&&GC.Voice._ctx();if(v)a.push(v)}catch(e){}return a}
 function suspend(){ctxs().forEach(function(c){try{if(c.state==='running')c.suspend()}catch(e){}})}
 /* audio: suspend both AudioContexts after 12 s of silence (and at once when the page is hidden); any sound or tap resumes */
 function touch(){clearTimeout(idleT);idleT=setTimeout(function(){if(GC.Voice&&GC.Voice.busy&&GC.Voice.busy()){touch();return}suspend()},12000)}
 ['pointerdown','touchstart'].forEach(function(ev){document.addEventListener(ev,function(){ctxs().forEach(function(c){try{if(c.state==='suspended')c.resume()}catch(e){}});touch()},{passive:true,capture:true})});
 /* hidden page: pause every CSS/WAAPI animation, stop canvas FX, suspend audio */
 function vis(){var hd=!!document.hidden;H.classList.toggle('gpz',hd);if(hd){try{GC.FX&&GC.FX.kill()}catch(e){}clearTimeout(idleT);suspend()}}
 document.addEventListener('visibilitychange',vis);
 /* one-time gentle tip: sample ~45 frames once on the board; if the device runs < 40 fps suggest 省电 (never switches by itself) */
 function probe(){if(tipped||Sound.cfg.gfxTip||mode()==='eco'||document.hidden)return;if((GC.Intro&&GC.Intro.active&&GC.Intro.active())||(GC.FX&&GC.FX.live&&GC.FX.live())){setTimeout(probe,3000);return}tipped=true;var n=0,t0=0;
  function f(t){if(!t0)t0=t;if(++n<45){requestAnimationFrame(f);return}var fps=Math.round((n-1)*1000/(t-t0));Gfx._fps=fps;
   if(fps<40&&GC.UI&&GC.UI.toast){Sound.cfg.gfxTip=1;Sound.save();GC.UI.toast('画面有点卡?可以在「设置 › 画质」选「省电」,更流畅也更省电',4200,'info')}}
  requestAnimationFrame(f)}
 apply();
 return{mode:mode,apply:apply,touch:touch,suspend:suspend,probe:probe,_vis:vis,NAMES:{eco:'省电',std:'标准',hi:'华丽'}};
})();
/* ================= UI: toast / modal / confirm ================= */
var tt;
var reduce=function(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
var ICO={
 home:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>',
 back:'<svg viewBox="0 0 24 24"><path d="M14.5 5 7.5 12l7 7"/><path d="M8 12h12"/></svg>',
 snd:'<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>',
 mute:'<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/><path d="m16 9.5 5 5m0-5-5 5"/></svg>',
 gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/></svg>',
 users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c.5-3.4 3-5 6-5s5.5 1.6 6 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M17.5 14.2c2.2.2 3.5 1.6 3.8 4"/></svg>',
 plus:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></svg>',
 undo:'<svg viewBox="0 0 24 24"><path d="M9 6 4.5 10.5 9 15"/><path d="M5 10.5h8a6 6 0 0 1 0 12h-2" transform="translate(0 -4)"/></svg>',
 dice:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
 list:'<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/></svg>',
 pin:'<svg viewBox="0 0 24 24"><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
 refresh:'<svg viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5"/><path d="M19.5 4.5v4.5H15"/></svg>',
 cards:'<svg viewBox="0 0 24 24"><rect x="4" y="6" width="11" height="14" rx="2.5" transform="rotate(-10 9.5 13)"/><rect x="9.5" y="4" width="11" height="14" rx="2.5" transform="rotate(8 15 11)"/></svg>',
 coin:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M9.5 8.5 12 12l2.5-3.5M12 12v5M9.5 13h5M9.5 15h5"/></svg>',
 house:'<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/></svg>',
 plane:'<svg viewBox="0 0 24 24"><path d="M12 3c1 0 1.5 1.5 1.5 4l7 5.5V15l-7-2v4l2 1.7V21L12 20l-3.5 1v-1.3L10.5 17v-4l-7 2v-2.5L10.5 7c0-2.5.5-4 1.5-4z"/></svg>',
 check:'<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
 info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.4"/></svg>',
 warn:'<svg viewBox="0 0 24 24"><path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17v.3"/></svg>',
 shake:'<svg viewBox="0 0 24 24"><rect x="8" y="4" width="8" height="16" rx="2.5"/><path d="M4.5 9v6M19.5 9v6M2.5 11v2M21.5 11v2"/></svg>',
 star:'<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z"/></svg>'
};
var UI=GC.UI={
 ICO:ICO,reduce:reduce,
 toast:function(m,ms,kind){var e=$('toast');e.className='';e.innerHTML=(kind&&ICO[kind]?'<i class="ti '+kind+'">'+ICO[kind]+'</i>':'')+'<span>'+esc0(m)+'</span>';void e.offsetWidth;e.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('show')},ms||1800)},
 modal:function(html,o){var m=$('modal'),b=$('box'),was=m.classList.contains('show'),cls=(o&&o.cls)||'',soft=/\b(sticky|deedm)\b/.test(cls);b.innerHTML=html;b.className=cls+(was?'':' mpopin');m.classList.remove('closing','msoft');if(!was){m.classList.add('show');m.classList.add('mfadein');if(soft)m.classList.add('msoft');if(m._mf)clearTimeout(m._mf);m._mf=setTimeout(function(){m.classList.remove('mfadein','msoft')},240)}else{m.classList.add('show')}if(b._mp)clearTimeout(b._mp);if(!was)b._mp=setTimeout(function(){b.classList.remove('mpopin')},360);b.scrollTop=0;return b},
 close:function(){var m=$('modal');if(!m.classList.contains('show'))return;m.classList.remove('show');$('box').innerHTML=''},
 confirm:function(o){return new Promise(function(res){
  var b=UI.modal('<div class="dlgic'+(o.danger?' bad':'')+'">'+(ICO[o.icon||(o.danger?'warn':'info')])+'</div><h2>'+(o.title||'确定吗?')+'</h2><p>'+(o.text||'')+'</p><div class="row"><button class="btn" id="mNo">'+(o.no||'取消')+'</button><button class="btn '+(o.danger?'warn':'pri')+'" id="mYes">'+(o.yes||'确定')+'</button></div>',{cls:'dlg'});
  $('mNo').onclick=function(){UI.close();res(false)};$('mYes').onclick=function(){UI.close();Sound.tap();res(true)};
 })},
 esc:function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})},
 /* nav-style candy button: icon + text */
 navBtn:function(icon,label,o){o=o||{};var b=document.createElement('button');b.className='nb '+(o.cls||'');if(o.id)b.id=o.id;b.setAttribute('aria-label',o.aria||label);b.innerHTML=(ICO[icon]||icon)+'<span>'+label+'</span>';return b},
 /* slide / fade a freshly rendered sub view in */
 enter:function(el,dir){if(!el||reduce())return;el.classList.remove('sv-r','sv-l','sv-f');void el.offsetWidth;el.classList.add(dir==='l'?'sv-l':dir==='f'?'sv-f':'sv-r')},
 /* number tween */
 tween:function(el,from,to,ms,fmt){fmt=fmt||function(n){return String(n)};if(reduce()||from===to){el.textContent=fmt(to);return}
  var t0=performance.now();(function f(t){var k=Math.min(1,(t-t0)/(ms||600)),e=1-Math.pow(1-k,3);el.textContent=fmt(Math.round(from+(to-from)*e));if(k<1)requestAnimationFrame(f);else el.textContent=fmt(to)})(t0)},
 /* animated coins flying between two elements */
 coinFly:function(a,b,n,cb){
  if(reduce()||!a||!b||!a.getBoundingClientRect||!window.Element||!Element.prototype.animate){cb&&cb();return}
  var ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(),k=Math.max(2,Math.min(8,n||4)),done=0;
  for(var i=0;i<k;i++)(function(i){
   var c=document.createElement('div');c.className='coinf';c.innerHTML='<svg viewBox="-20 -14 40 28"><use href="#coin"/></svg>';document.body.appendChild(c);
   var x0=ra.left+ra.width/2-14,y0=ra.top+ra.height/2-10,x1=rb.left+rb.width/2-14,y1=rb.top+rb.height/2-10,mx=(x0+x1)/2+(i%2?1:-1)*(20+i*6),my=Math.min(y0,y1)-50-i*5;
   var an=c.animate([{transform:'translate('+x0+'px,'+y0+'px) scale(.5)',opacity:0},{transform:'translate('+mx+'px,'+my+'px) scale(1.15)',opacity:1,offset:.45},{transform:'translate('+x1+'px,'+y1+'px) scale(.7)',opacity:1}],{duration:620,delay:i*70,easing:'cubic-bezier(.4,0,.6,1)',fill:'both'});
   an.onfinish=function(){c.remove();if(i<2)Sound.coin();if(++done===k)cb&&cb()};
  })(i);
 }
};
function esc0(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
$('modal').addEventListener('click',function(e){if(e.target===this&&!$('box').classList.contains('sticky'))UI.close()});
document.addEventListener('gesturestart',function(e){e.preventDefault()});
document.addEventListener('contextmenu',function(e){e.preventDefault()});
/* ================= Dice (crypto-fair) ================= */
var PIPS={1:[[50,50]],2:[[30,30],[70,70]],3:[[30,30],[50,50],[70,70]],4:[[30,30],[70,30],[30,70],[70,70]],5:[[30,30],[70,30],[50,50],[30,70],[70,70]],6:[[30,28],[70,28],[30,50],[70,50],[30,72],[70,72]]};
var Dice=GC.Dice={
 int:function(n){ // unbiased integer in [0,n) via rejection sampling
  var buf=new Uint32Array(1),lim=Math.floor(4294967296/n)*n;
  do{crypto.getRandomValues(buf)}while(buf[0]>=lim);return buf[0]%n;
 },
 d6:function(){return Dice.int(6)+1},
 shuffle:function(a){for(var i=a.length-1;i>0;i--){var j=Dice.int(i+1),t=a[i];a[i]=a[j];a[j]=t}return a},
 svg:function(v){
  var s='<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="18" fill="#fff" stroke="#d3dae2" stroke-width="3"/><rect x="9" y="9" width="82" height="82" rx="14" fill="none" stroke="#eef2f6" stroke-width="3"/>';
  PIPS[v].forEach(function(p){s+='<circle cx="'+p[0]+'" cy="'+(p[1]+1.5)+'" r="8.5" fill="#0002"/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="8.5" fill="'+(v===1?'#e03a3a':'#233')+'"/><circle cx="'+(p[0]-2.5)+'" cy="'+(p[1]-2.5)+'" r="2.5" fill="#fff" opacity=".35"/>'});
  return s+'</svg>';
 },
 render:function(stage,vals){stage.innerHTML='';vals.forEach(function(v){var d=document.createElement('div');d.className='die';d.innerHTML=Dice.svg(v);stage.appendChild(d)});Dice.layout(stage,vals.length)},
 layout:function(st,n){
  if(!st||!st.offsetWidth)return;
  var w=st.clientWidth,h=st.clientHeight,gap=Math.max(10,Math.min(w,h)*.06),a=Math.min((w-gap*(n-1))/n,h),b=Math.min(w,(h-gap*(n-1))/n),col=b>a,best=Math.max(40,Math.min((col?b:a)-8,260));
  st.style.setProperty('--ds',best+'px');st.style.setProperty('--gap',gap+'px');st.style.flexDirection=col?'column':'row';
 },
 /* animate the dice in stage, settle on results; cb when all stopped */
 roll:function(stage,res,cb){
  var nodes=stage.children,i,iv,tm=[];
  for(i=0;i<nodes.length;i++){nodes[i].classList.remove('land');nodes[i].removeAttribute('data-done');nodes[i].classList.add('roll')}
  Sound.vib(30);var tick=0;
  iv=setInterval(function(){tick++;for(var i=0;i<nodes.length;i++){if(nodes[i].getAttribute('data-done'))continue;nodes[i].innerHTML=Dice.svg(Dice.int(6)+1)}if(tick%2===0)Sound.beep(300+Dice.int(200),.04)},75);
  function stop(i){if(!nodes[i])return;nodes[i].setAttribute('data-done',1);nodes[i].classList.remove('roll');nodes[i].innerHTML=Dice.svg(res[i]);nodes[i].classList.add('land');Sound.beep(220,.12);Sound.vib(20)}
  for(i=0;i<res.length;i++)(function(i){tm.push(setTimeout(function(){stop(i)},650+i*260))})(i);
  tm.push(setTimeout(function(){clearInterval(iv);cb&&cb()},650+(res.length-1)*260+380));
  return function(){clearInterval(iv);tm.forEach(clearTimeout)};
 },
 /* shake-to-roll (shared). handler is set by the page that is mounted */
 shakeOn:false,handler:null,last:0,
 onMotion:function(e){
  var a=e.accelerationIncludingGravity||e.acceleration;if(!a||!Dice.handler)return;
  var m=Math.sqrt((a.x||0)*(a.x||0)+(a.y||0)*(a.y||0)+(a.z||0)*(a.z||0)),now=Date.now();
  if(m>28&&now-Dice.last>1200){Dice.last=now;Dice.handler()}
 },
 setShake:function(on,btn){Dice.shakeOn=on;if(btn)btn.classList.toggle('on',on);
  if(on)window.addEventListener('devicemotion',Dice.onMotion);else window.removeEventListener('devicemotion',Dice.onMotion)},
 toggleShake:function(btn){
  if(Dice.shakeOn){Dice.setShake(false,btn);UI.toast('已关闭摇一摇');return}
  if(typeof DeviceMotionEvent==='undefined'){UI.toast('此设备不支持摇一摇,请点屏幕掷骰');return}
  if(typeof DeviceMotionEvent.requestPermission==='function'){
   DeviceMotionEvent.requestPermission().then(function(r){if(r==='granted'){Dice.setShake(true,btn);UI.toast('📳 摇一摇已开启')}else UI.toast('未授权摇一摇,请点屏幕掷骰')}).catch(function(){UI.toast('无法开启摇一摇,请点屏幕掷骰')});
  }else{Dice.setShake(true,btn);UI.toast('📳 摇一摇已开启(若无反应请点屏幕)')}
 }
};
/* ================= Players: tokens, select screen, join/leave, turn ================= */
var TOKNAMES={tk:['小狗','小狮子','不不奥特曼','哎呀公主','温柔喷火龙','猪肉战神']};
var TKCOL=['#2f80ed','#f2b705','#e53935','#ff4fa3','#1fae5b','#8e44ec']; // v19: same distinct palette as the board
function tokSVG(kind,i,color){
 if(kind==='plane')return'<svg viewBox="-24 -24 48 48" style="color:'+color+'"><use href="#planeDisc"/></svg>';
 if(kind==='tk'){var A=window.CT_AV;if(A&&A[i])return'<img class="tkimg" src="'+A[i]+'" alt="" draggable="false" decoding="async">';return'<svg viewBox="-24 -24 48 48"><use href="#tk'+i+'"/></svg>'}
 if(kind==='disc')return'<svg viewBox="-24 -24 48 48"><use href="#discTok"/><text y="7" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" stroke="#0003" stroke-width=".8" paint-order="stroke">'+(i+1)+'</text></svg>';
 return'<svg viewBox="-16 -22 32 54" style="color:'+color+'"><use href="#bunnyTok"/></svg>';
}
var NameField={
 html:function(o){ // o:{ph,val,id,attrs,tok}
  var v=o.val||'';
  return '<div class="nf'+(v?' has':'')+'"'+(o.tok?' style="--nfc:'+o.tok+'"':'')+'>'+(o.prev?'<span class="nfp">'+o.prev+'</span>':'')+'<button type="button" class="nfe" tabindex="-1" aria-label="编辑名字"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/><path d="M14 7l3 3"/></svg></button><input class="nfi" '+(o.id?'id="'+o.id+'" ':'')+(o.attrs||'')+' type="text" maxlength="12" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="'+UI.esc(o.ph)+'" aria-label="自定义名字(可不填,默认'+UI.esc(o.ph)+')" value="'+UI.esc(v)+'"><button type="button" class="nfx" tabindex="-1" aria-label="清除名字">\u00d7</button><span class="nfc">'+v.length+'/12</span></div>';
 },
 bind:function(root,onChange){
  Array.prototype.forEach.call(root.querySelectorAll('.nf'),function(w){
   var i=w.querySelector('.nfi'),c=w.querySelector('.nfc');
   function sync(){w.classList.toggle('has',!!i.value);c.textContent=i.value.length+'/12';c.classList.toggle('warn',i.value.length>=12)}
   i.addEventListener('input',function(){sync();onChange&&onChange(i,i.value)});
   i.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();i.blur()}});
   i.addEventListener('click',function(e){e.stopPropagation()});
   w.addEventListener('click',function(e){e.stopPropagation()});
   w.querySelector('.nfe').addEventListener('click',function(){i.focus()});
   var x=w.querySelector('.nfx');
   x.addEventListener('pointerdown',function(e){e.preventDefault()});
   x.addEventListener('click',function(){i.value='';sync();onChange&&onChange(i,'');Sound.tap&&Sound.tap();if(document.activeElement!==i&&false)i.focus()});
  });
 }
};
/* ---------- v20/v29: per-character mood effects (expression chips + CSS/SVG art) ----------
   GC.Mood.play(tok, kind, target, o)  tok 0..5 · kind angry|happy|worried|proud|sad|sleep · target = element or {x,y,s}
   pointer-events:none, ~1.4s, transforms/opacity only, throttled per key; reduced motion → a short static glyph */
GC.Mood=(function(){
 var last={},live=0,COL=['#2f80ed','#f2b705','#e53935','#ff4fa3','#1fae5b','#8e44ec'];
 function R(n){return Math.round(n*10)/10}
 function bits(n,f){var h='';for(var i=0;i<n;i++)h+=f(i);return h}
 var ART={
  '0angry':function(){return '<i class="m-wave w1"></i><i class="m-wave w2"></i><i class="m-wave w3"></i><b class="m-txt bark">汪!</b>'},
  '0happy':function(){return '<svg class="m-tail" viewBox="0 0 40 40"><path d="M6 34 Q8 14 30 8" fill="none" stroke="#c98a4a" stroke-width="7" stroke-linecap="round"/></svg>'+bits(6,function(i){return '<svg class="m-bone" style="--a:'+(i*60-150)+'deg;--d:'+(i*.06)+'s" viewBox="0 0 30 14"><path d="M5 4a3.5 3.5 0 1 1 3 -2.5h14a3.5 3.5 0 1 1 3 2.5 3.5 3.5 0 1 1 -3 2.5v1a3.5 3.5 0 1 1 -3 2.5H8a3.5 3.5 0 1 1 -3 -2.5 3.5 3.5 0 1 1 0 -5z" fill="#fff8e6" stroke="#c9a36b" stroke-width="1.4"/></svg>'})},
  '1angry':function(){return '<svg class="m-mane" viewBox="-50 -50 100 100"><path d="'+(function(){var d='';for(var i=0;i<24;i++){var a=i*Math.PI/12,r=i%2?30:46;d+=(i?'L':'M')+R(Math.cos(a)*r)+' '+R(Math.sin(a)*r)}return d+'Z'})()+'" fill="#ff9d1f" stroke="#d96a00" stroke-width="2"/></svg><i class="m-shock s1"></i><i class="m-shock s2"></i><b class="m-txt roar">吼!</b>'},
  '1happy':function(){return '<i class="m-glow gold"></i><svg class="m-crown" viewBox="0 0 40 28"><path d="M3 25 6 7l9 9 5-13 5 13 9-9 3 18z" fill="#ffd23f" stroke="#c48a00" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="17" r="2.6" fill="#ff4f6a"/></svg>'},
  '2angry':function(){return '<i class="m-beam"></i><b class="m-txt nono">不不不!</b><svg class="m-arms" viewBox="0 0 40 20"><path d="M4 6 36 16M4 16 36 6" stroke="#e53935" stroke-width="5" stroke-linecap="round"/></svg>'},
  '2happy':function(){return '<i class="m-rays"></i><svg class="m-fly" viewBox="0 0 40 30"><path d="M4 26 C14 22 24 14 36 4" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 5"/><path d="M30 4h7v7" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>'},
  '3angry':function(){return '<svg class="m-cloud" viewBox="0 0 60 40"><path d="M14 26a9 9 0 0 1 3-17 12 12 0 0 1 22-1 9 9 0 0 1 8 18z" fill="#7d7f96"/><path d="M30 26l-5 8h6l-4 6" fill="none" stroke="#ffd23f" stroke-width="3" stroke-linejoin="round"/></svg><i class="m-pig p1"></i><i class="m-pig p2"></i><b class="m-txt pout">哼~</b>'},
  '3happy':function(){return '<svg class="m-tiara" viewBox="0 0 40 20"><path d="M3 17 8 6l6 6 6-10 6 10 6-6 5 11z" fill="#ffe36b" stroke="#ff4fa3" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="9" r="2.4" fill="#ff4fa3"/></svg>'+bits(6,function(i){return '<i class="m-spk" style="--a:'+(i*60)+'deg;--d:'+(i*.1)+'s">✦</i>'})},
  '4angry':function(){return '<svg class="m-fire" viewBox="0 0 120 40"><defs><linearGradient id="mfg" x1="0" x2="1"><stop offset="0" stop-color="#fff36b"/><stop offset=".45" stop-color="#ff9d1f"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></linearGradient></defs><path d="M0 20 C30 2 60 0 120 6 C95 14 95 26 120 34 C60 40 30 38 0 20z" fill="url(#mfg)"/></svg>'+bits(4,function(i){return '<i class="m-ember" style="--d:'+(i*.12)+'s;--y:'+((i%2?1:-1)*(6+i*3))+'px"></i>'})},
  '4happy':function(){return bits(5,function(i){return '<svg class="m-heart" style="--x:'+((i-2)*14)+'px;--d:'+(i*.15)+'s" viewBox="0 0 24 24"><path d="M12 21C5 15 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 7-10 13z" fill="#ff7a3c"/><path d="M12 17c-3-3-5-5-5-7a2.5 2.5 0 0 1 5-.5 2.5 2.5 0 0 1 5 .5c0 2-2 4-5 7z" fill="#ffd23f"/></svg>'})},
  '5angry':function(){return '<i class="m-steam l"></i><i class="m-steam r"></i><i class="m-steam l d2"></i><i class="m-steam r d2"></i><i class="m-stomp"></i><b class="m-txt hmph">哼!</b>'},
  '5happy':function(){return '<i class="m-pat"></i><b class="m-txt pat">啪啪</b>'+bits(5,function(i){return '<i class="m-coin" style="--x:'+((i-2)*16)+'px;--d:'+(i*.08)+'s">¥</i>'})},
  worried:function(){return '<svg class="m-sweat" viewBox="0 0 20 28"><path d="M10 2C6 10 3 14 3 19a7 7 0 0 0 14 0c0-5-3-9-7-17z" fill="#7cc8ff" stroke="#2f80ed" stroke-width="1.5"/></svg><b class="m-txt worry">!?</b>'},
  proud:function(c){return '<i class="m-glow gold"></i>'+bits(8,function(i){return '<i class="m-star" style="--a:'+(i*45)+'deg;--d:'+(i*.05)+'s">★</i>'})},
  sad:function(){return '<svg class="m-rain" viewBox="0 0 60 44"><path d="M14 24a9 9 0 0 1 3-17 12 12 0 0 1 22-1 9 9 0 0 1 8 18z" fill="#aab3c8"/><g stroke="#5aa7ff" stroke-width="3" stroke-linecap="round"><path class="dr" d="M20 30v6"/><path class="dr d2" d="M30 32v6"/><path class="dr d3" d="M40 30v6"/></g></svg>'},
  sleep:function(){return '<svg class="m-moon" viewBox="0 0 28 28"><path d="M18 4a11 11 0 1 0 6 18 9 9 0 0 1-6-18z" fill="#ffe9a0" stroke="#e0b84a" stroke-width="1.5"/></svg><i class="m-zzz z1">z</i><i class="m-zzz z2">Z</i><i class="m-zzz z3">Z</i><svg class="m-cloud soft" viewBox="0 0 60 36"><path d="M12 24a8 8 0 0 1 2-15 11 11 0 0 1 20-1 8 8 0 0 1 7 16z" fill="#dce6ff" opacity=".9"/></svg>'}
 };
 var GLY={angry:'💢',happy:'✨',worried:'💦',proud:'⭐',sad:'💧',sleep:'💤'};
 var PLATE={sad:'破财了…',happy:'发财啦!',worried:'危险!',proud:'大富豪!',sleep:'睡觉中…',angry:'生气啦!'};
 var PLATE_FLY={sad:'回基地了…',happy:'起飞啦!',worried:'小心!',proud:'冲向终点!',sleep:'休息一下…',angry:'叠吃!'};
 var BITS={sad:['💧','💧','💸','🪙','😢'],happy:['✨','⭐','🪙','¥','🎉','💛'],worried:['💦','💦','⚠️','😰'],proud:['👑','⭐','✦','💛','🏆'],sleep:['💤','😴','Z','z','🌙']};
 var BITS_FLY={sad:['💧','✈','🏠','😢'],happy:['✨','⭐','✈','🎉'],worried:['💦','⚠️','😰'],proud:['⭐','✦','🏆','✈'],sleep:['💤','😴','Z','z','🌙'],angry:['💥','✈','🔥']};
 function showcase(tok,kind,o){
  o=o||{};
  var _prev=document.querySelector('.moodfs');if(_prev){_prev.remove();live=Math.max(0,live-1)} /* replace stale showcase */
  var el=document.createElement('div');el.className='moodfs m-'+kind+' t'+tok;el.setAttribute('data-mood',kind);
  /* v29: FULL-BODY mood portrait first (CT_ART_MOOD); chips stay for board. proud→happy body. tok4 angry→CT_ART_ANGRY */
  var port='',faceKind=kind==='proud'?'happy':kind;
  try{
   if(kind==='angry'){var AN=window.CT_ART_ANGRY;if(AN&&AN[tok])port='<img class="mfs-port" src="'+AN[tok]+'" alt="" draggable="false">'}
   if(!port){var BM=window.CT_ART_MOOD;if(BM&&BM[faceKind]&&BM[faceKind][tok])port='<img class="mfs-port" src="'+BM[faceKind][tok]+'" alt="" draggable="false">'}
   if(!port){var A=window.CT_ART;if(A&&A[tok])port='<img class="mfs-port" src="'+A[tok]+'" alt="" draggable="false">'}
   if(!port){var M=window.CT_AV_MOOD;if(M&&M[faceKind]&&M[faceKind][tok])port='<img class="mfs-port mfs-face" src="'+M[faceKind][tok]+'" alt="" draggable="false">'}
   if(!port){var AV=window.CT_AV;if(AV&&AV[tok])port='<img class="mfs-port mfs-face" src="'+AV[tok]+'" alt="" draggable="false">'}
  }catch(e){}
  if(!port)port='<div class="mfs-port" style="width:160px;height:160px;border-radius:50%;background:'+(COL[tok]||'#999')+';display:flex;align-items:center;justify-content:center;font-size:64px">'+(GLY[kind]||'✨')+'</div>';
  var bitSrc=(o.theme==='fly'?BITS_FLY:BITS),bitList=bitSrc[kind]||BITS[kind]||[];
  var bits='';bitList.forEach(function(ch,i){var a=(i/(bitList.length))*Math.PI*2,dx=Math.cos(a)*(90+i*18),dy=Math.sin(a)*(70+i*12)-40;bits+='<i style="left:50%;top:55%;--dx:'+Math.round(dx)+'px;--dy:'+Math.round(dy)+'px;animation-delay:'+(i*.08)+'s;font-size:'+(22+i%3*6)+'px">'+ch+'</i>'});
  var plateTxt=o.plate||(o.theme==='fly'?PLATE_FLY[kind]:PLATE[kind])||'';
  el.innerHTML='<div class="mfs-dim"></div><div class="mfs-bits">'+bits+'</div><div class="mfs-card">'+port+'<div class="mfs-plate">'+plateTxt+'</div></div>';
  document.body.appendChild(el);live++;
  var life=Math.round(3200/((GC.Intro&&GC.Intro.speed)?GC.Intro.speed():1)); /* v29: longer so big body art is readable */
  el.setAttribute('data-life',life);
  var done=false,fin=function(){if(done)return;done=true;el.classList.add('out');setTimeout(function(){el.remove();live--},320)};
  setTimeout(fin,life);
  el.style.pointerEvents='auto';el.onclick=function(){Sound.tap&&Sound.tap();fin()};
  try{var sh=document.querySelector('.ctb')||document.body;if(sh.animate&&kind!=='happy'&&kind!=='sleep'&&kind!=='proud')sh.animate([{transform:'translate(0,0)'},{transform:'translate('+(kind==='worried'?-3:2)+'px,1px)'},{transform:'none'}],{duration:kind==='worried'?500:280,iterations:kind==='worried'?3:1})}catch(e){}
  return el;
 }
 function reduce(){return GC.UI&&GC.UI.reduce?GC.UI.reduce():matchMedia('(prefers-reduced-motion:reduce)').matches}
 function play(tok,kind,target,o){
  o=o||{};if(o.off)return null;var key=(o.key!=null?o.key:tok)+'',now=Date.now();
  if(!o.force&&last[key]&&now-last[key]<2000)return null;if(live>=3)return null;last[key]=now;
  /* v24: attack/angry for 2/3/4/5 → painted VFX (canvas); the token still gets its mf- squash */
  if(kind==='angry'&&!o.noFx&&!reduce()&&GC.FX&&GC.FX.has(tok)){var fx=null;try{fx=GC.FX.attack(tok,target,{target:target&&target.animate?target:null,shakeEl:o.shakeEl||document.querySelector('.ctb')||document.body,super:true,caption:o.plate||o.caption})}catch(e){}
   if(fx){if(target&&target.classList){target.classList.add('mf-angry');setTimeout(function(){target.classList.remove('mf-angry')},1200)}try{GC.Mood._log.push(tok+kind+'+fx')}catch(e){}return fx}}
  /* v27/v28: full-screen mood showcase for happy/sad/worried/proud/sleep (eco / reduced → tiny glyph path below) */
  if(!o.noFs&&!o.tiny&&(kind==='happy'||kind==='sad'||kind==='worried'||kind==='proud'||kind==='sleep'||kind==='angry')&&!reduce()&&!(GC.Gfx&&GC.Gfx.mode()==='eco')){
   var fs=showcase(tok,kind,o);if(fs){if(target&&target.classList){var fcls='mf-'+kind;target.classList.add(fcls);setTimeout(function(){target.classList.remove(fcls)},1600)}try{GC.Mood._log.push(tok+kind+'+fs')}catch(e){}return fs}}
  var x,y,sz;if(target&&target.getBoundingClientRect){var r=target.getBoundingClientRect();if(!r.width){/* v29: still allow tiny glyph at viewport center when target not laid out */}else{x=r.left+r.width/2;y=r.top+r.height/2;sz=Math.max(28,Math.min(90,Math.min(r.width,r.height)))}}
  if(x==null){if(target&&target.x!=null){x=target.x;y=target.y;sz=target.s||48}else{x=window.innerWidth/2;y=window.innerHeight/2;sz=48}}
  var d=document.createElement('div'),rd=reduce()||(GC.Gfx&&GC.Gfx.mode()==='eco');d.className='mood m-'+kind+' t'+tok+(rd?' rd':'');d.style.left=x+'px';d.style.top=y+'px';d.style.setProperty('--s',sz+'px');d.style.setProperty('--mc',COL[tok]||'#999');
  var f=ART[tok+kind]||ART[kind]||ART[kind==='angry'?'worried':'proud'];
  d.innerHTML=rd?'<b class="m-gly">'+(GLY[kind]||'✨')+'</b>':f(COL[tok]);document.body.appendChild(d);live++;
  if(target&&target.classList&&!rd){var cls='mf-'+kind+(tok===5&&kind==='angry'?' mf-stomp':'');cls.split(' ').forEach(function(c){target.classList.add(c)});/* v23: moods were over in ~1.4 s — play every part at ~0.72x (≈1.9 s, 慢 ≈2.5 s) so kids notice them */
   var rate=.72/((GC.Intro&&GC.Intro.speed)?GC.Intro.speed():1);requestAnimationFrame(function(){try{(target.getAnimations?target.getAnimations():[]).forEach(function(an){if(/^mf/.test(an.animationName||''))an.playbackRate=rate})}catch(e){}});
   setTimeout(function(){cls.split(' ').forEach(function(c){target.classList.remove(c)})},Math.round(900/rate))}
  var life=rd?900:Math.round(1450/((.72/((GC.Intro&&GC.Intro.speed)?GC.Intro.speed():1))));
  if(!rd)try{(d.getAnimations?d.getAnimations({subtree:true}):[]).forEach(function(an){an.playbackRate=.72/((GC.Intro&&GC.Intro.speed)?GC.Intro.speed():1)})}catch(e){}
  d.setAttribute('data-life',life);setTimeout(function(){d.remove();live--},life);
  try{GC.Mood._log.push(tok+kind)}catch(e){}
  return d;
 }
 return{play:play,_log:[],_reset:function(){last={}}};
})();
/*__INTRO__*/
var Select=GC.Select={
 tokens:function(kind){
  if(kind==='tk')return TOKNAMES.tk.map(function(n,i){return{i:i,name:n,color:TKCOL[i],svg:tokSVG('tk',i)}});
  if(kind==='plane')return Players.palettes.flight.map(function(p,i){return{i:i,name:p[0]+'色飞机',color:p[1],svg:tokSVG('plane',i,p[1])}});
  return Players.palettes.rabbit.map(function(p,i){return{i:i,name:p[0]+'色兔子',color:p[1],svg:tokSVG('bunny',i,p[1])}});
 },
 /* v16: 选角色时的招牌台词 + 气泡 */
 CATCH:{"0": ["汪汪!小狗来啦,一起玩吧!", "汪!我的尾巴已经准备好摇起来啦!"], "1": ["嗷呜!本王驾到,大家准备好了吗?", "本王要当最厉害的大富翁!"], "2": ["不不不!我是最强的,出发!", "能量满满,冲冲冲!"], "3": ["哎呀~本公主来啦,好开心呀!", "哎呀呀,我要买一座粉色城堡!"], "4": ["你好呀,小龙会温柔地陪你玩。", "呼~小火苗准备好啦,我们慢慢来。"], "5": ["猪肉战神登场!", "哼!哼!猪肉战神,前来报到!", "吃饱了肉,战神天下无敌!"], "p0": ["红色飞机准备起飞,冲上云霄!"], "p1": ["黄色飞机,亮晶晶出发啦!"], "p2": ["蓝色飞机已就位,目标终点!"], "p3": ["绿色飞机呼呼呼,飞得最稳啦!"], "r0": ["粉色兔子蹦蹦跳,我来啦!"], "r1": ["紫色兔子,神秘登场!"], "r2": ["黄色兔子,胡萝卜冲呀!"], "r3": ["青色兔子跳得最高!"], "r4": ["橙色兔子,蹦跶蹦跶出发!"], "r5": ["蓝色兔子准备好啦!"]},
 cheer:function(kind,i,card,opt){
  opt=opt||{};
  var tag=kind==='tk'?String(i):(kind==='plane'?'p':'r')+i,a=null;
  if(opt.catchSet==='fly'){try{var FL=window.CTE_LINES&&window.CTE_LINES.FLY;a=FL&&FL[i]&&FL[i].select}catch(e){}}
  if(!a||!a.length)a=Select.CATCH[tag];if(!a||!a.length)return;
  var txt=a[Math.floor(Math.random()*a.length)];
  try{GC.Voice.say(txt,kind==='tk'?i:tag)}catch(e){}
  if(kind==='tk'){var shown=false;try{shown=GC.Intro.select(i,txt)}catch(e){}if(shown){if(card){card.classList.remove('talk');void card.offsetWidth;card.classList.add('talk');setTimeout(function(){card.classList.remove('talk')},1800)}return}}
  if(!card)return;Array.prototype.forEach.call(document.querySelectorAll('.selbub'),function(x){x.remove()});
  card.classList.remove('talk');void card.offsetWidth;card.classList.add('talk');
  if(kind==='tk'){var av=card.querySelector('.tkav')||card,mo={key:'sel',force:true};if(opt.theme==='fly'){mo.theme='fly';mo.plate='准备起飞!'}try{GC.Mood.play(i,'happy',av,mo)}catch(e){}}
  var b=document.createElement('div');b.className='selbub';b.textContent=txt;card.appendChild(b);
  setTimeout(function(){b.classList.add('out');setTimeout(function(){b.remove();card.classList.remove('talk')},250)},2600);
 },
 /* full "choose your character" screen. o:{kind,title,sub,min,max,pre:[{tok,name}],ok,onDone(list),extra(html)} */
 screen:function(host,o){
  var T=Select.tokens(o.kind),sel=(o.pre||[]).map(function(x){return{tok:x.tok,name:x.name||''}});
  var el=document.createElement('div');el.className='selv';host.appendChild(el);UI.enter(el,'r');
  function draw(){
   var h='<div class="selh"><h1>'+(o.title||'选择你的角色')+'</h1><p>'+(o.sub||'每位玩家点一个自己的棋子;点第一个的人先走')+'</p></div><div class="selg k'+T.length+'">';
   T.forEach(function(t){
    var k=-1;sel.forEach(function(s,j){if(s.tok===t.i)k=j});
    h+='<div class="tkc'+(k>=0?' on':'')+'" data-i="'+t.i+'" style="--tc:'+t.color+'"><button class="tkb" data-i="'+t.i+'" aria-label="'+t.name+'"><div class="tkav">'+t.svg+'</div><div class="tkn">'+t.name+'</div>'+(k>=0?'<span class="tkbadge">'+(k+1)+'</span>':'')+'</button>'+(k>=0?NameField.html({ph:t.name,val:sel[k].name,attrs:'data-i="'+t.i+'"',tok:t.color}):'')+'</div>';
   });
   h+='</div>'+(o.extra||'')+'<div class="self"><button class="btn big" id="selOk"'+(sel.length<o.min?' disabled':'')+'>'+(o.ok||'开始游戏')+' ▶ <small>'+sel.length+'/'+o.max+'</small></button></div>';
   el.innerHTML=h;o.onDraw&&o.onDraw(el);
   Array.prototype.forEach.call(el.querySelectorAll('.tkb'),function(b){b.onclick=function(){
    var i=+b.getAttribute('data-i'),k=-1;sel.forEach(function(s,j){if(s.tok===i)k=j});
    if(k>=0){sel.splice(k,1);Sound.tap()}else{if(sel.length>=o.max){UI.toast('最多 '+o.max+' 位玩家',1500,'warn');return}sel.push({tok:i,name:''});Sound.pop();Sound.vib(15)}
    draw();var nb=el.querySelector('.tkc[data-i="'+i+'"]');if(nb&&k<0){nb.classList.add('pick');Select.cheer(o.kind,i,nb,o)}}});
   NameField.bind(el,function(inp,v){var i=+inp.getAttribute('data-i');sel.forEach(function(s){if(s.tok===i)s.name=v})});
   $('selOk').onclick=function(){
    if(sel.length<o.min){UI.toast('至少 '+o.min+' 位玩家',1500,'warn');return}
    Sound.hi();el.classList.add('out');var list=sel.map(function(s){return{tok:s.tok,name:s.name.trim()}});
    setTimeout(function(){el.remove();o.onDone(list)},UI.reduce()?0:260);
   };
  }
  draw();return{el:el,remove:function(){el.remove()}};
 },
 /* mid-game join: pick a free token. o:{kind,taken:[tok],extra,onDone({tok,name})} */
 join:function(o){
  var T=Select.tokens(o.kind).filter(function(t){return o.taken.indexOf(t.i)<0});
  if(!T.length){UI.toast('角色都被选完了',1800,'warn');return}
  var pick=-1,jn='';
  function draw(){
   var pt=T.filter(function(t){return t.i===pick})[0]||{};
   var h='<h2>加入新玩家</h2><p>选一个还没人用的角色'+(o.hint?'<br>'+o.hint:'')+'</p><div class="selg small">';
   T.forEach(function(t){h+='<div class="tkc'+(pick===t.i?' on':'')+'" style="--tc:'+t.color+'"><button class="tkb" data-i="'+t.i+'"><div class="tkav">'+t.svg+'</div><div class="tkn">'+t.name+'</div></button></div>'});
   h+='</div>'+(pick>=0?NameField.html({id:'jName',ph:pt.name,val:jn,tok:pt.color,prev:'<span class="nfpv">'+pt.svg+'</span>'}):'<p class="nfhint">先点一个角色,再起名字(可不填)</p>')+'<div class="row"><button class="btn" id="jNo">取消</button><button class="btn pri" id="jOk"'+(pick<0?' disabled':'')+'>加入</button></div>';
   UI.modal(h,{cls:'sticky'});NameField.bind($('box'),function(i,v){jn=v});
   Array.prototype.forEach.call($('box').querySelectorAll('.tkb'),function(b){b.onclick=function(){var was=pick;pick=+b.getAttribute('data-i');Sound.pop();draw();if(was!==pick){var c=$('box').querySelector('.tkb[data-i="'+pick+'"]');Select.cheer(o.kind,pick,c&&c.parentNode)}}});
   $('jNo').onclick=UI.close;$('jOk').onclick=function(){var n=(jn||'').trim();UI.close();o.onDone({tok:pick,name:n})};
  }
  draw();
 }
};
var Players=GC.Players={
 palettes:{
  rabbit:[['粉','#ff5fa8'],['紫','#8e4fd0'],['黄','#f5c518'],['青','#18c4c4'],['橙','#ff8a1f'],['蓝','#3a7bff']],
  flight:[['红','#e0485e'],['黄','#f2c200'],['蓝','#4a8fe0'],['绿','#4cae4c']]
 },
 create:function(id,o){ // o:{palette,min,max,defN,suffix,kind}
  var pal=Players.palettes[o.palette],key='players.'+id;
  var s=Store.get(key,null);
  if(!s||!s.on||s.on.length!==pal.length)s={on:pal.map(function(_,i){return i<o.defN}),names:pal.map(function(){return ''}),turn:0,adv:false,started:false};
  else if(s.started===undefined)s.started=true; // saved before v6: game in progress
  var self={s:s,o:o,pal:pal,
   save:function(){Store.set(key,self.s)},
   reload:function(){var x=Store.get(key,null);if(x&&x.on&&x.on.length===pal.length)self.s=x;self.clamp()},
   clamp:function(){var l=self.list();if(l.length<o.min){for(var i=0;i<pal.length&&self.list().length<o.min;i++)self.s.on[i]=true}if(self.s.turn>=self.list().length||self.s.turn<0)self.s.turn=0},
   list:function(){var r=[];pal.forEach(function(p,i){if(self.s.on[i])r.push({i:i,cname:p[0],color:p[1],name:(self.s.names[i]||'').trim()||(p[0]+o.suffix)})});return r},
   count:function(){return self.list().length},
   cur:function(){return self.list()[self.s.turn]||self.list()[0]},
   next:function(){self.s.turn=(self.s.turn+1)%self.count();self.s.adv=false;self.save()},
   setTurn:function(k){self.s.turn=k;self.s.adv=false;self.save()},
   avatar:function(p){var K=o.kind;if(K==='disc'||K==='plane'||K==='tk')return tokSVG(K,p&&p.i!=null?p.i:0,p&&p.color);return tokSVG('bunny',0,p&&p.color)},
   cls:function(){return o.kind==='plane'?' plane':o.kind==='disc'?' disc':''},
   strip:function(el,onPick){
    el.innerHTML='';self.list().forEach(function(p,k){var d=document.createElement('div');d.className='pl'+self.cls()+(k===self.s.turn?' on':'');d.style.color=p.color;d.setAttribute('aria-label',p.name);d.innerHTML=self.avatar(p);d.onclick=function(ev){ev.stopPropagation();self.setTurn(k);onPick&&onPick(k)};el.appendChild(d)});
   },
   /* "choose your character" start screen (each new game). host=game root */
   choose:function(host,done){
    var pre=[];if(s.hadGame){self.list().forEach(function(p){pre.push({tok:p.i,name:self.s.names[p.i]||''})})}
    return Select.screen(host,{kind:o.kind==='plane'?'plane':'bunny',min:o.min,max:o.max,pre:pre,ok:'开始游戏',onDone:function(list){
     self.s.on=pal.map(function(_,i){return list.some(function(x){return x.tok===i})});self.s.names=pal.map(function(_,i){var f=list.filter(function(x){return x.tok===i})[0];return f?f.name:''});
     self.s.adv=false;self.s.started=true;self.s.hadGame=true;
     self.clamp();var fl=self.list(),k0=0;fl.forEach(function(p,j){if(p.i===list[0].tok)k0=j});self.s.turn=k0; // first picked starts
     self.save();done&&done(list);
    }});
   },
   /* mid-game join: free token -> on */
   join:function(done){
    var taken=[];self.list().forEach(function(p){taken.push(p.i)});
    if(taken.length>=o.max){UI.toast('最多 '+o.max+' 位玩家',1800,'warn');return}
    Select.join({kind:o.kind==='plane'?'plane':'bunny',taken:taken,onDone:function(r){
     var curI=self.cur().i;self.s.on[r.tok]=true;self.s.names[r.tok]=r.name;
     var k=0;self.list().forEach(function(p,j){if(p.i===curI)k=j});self.s.turn=k;self.save();
     UI.toast('🎉 '+self.list().filter(function(p){return p.i===r.tok})[0].name+' 加入了!',1800,'star');Sound.hi();done&&done(r.tok);
    }});
   },
   leave:function(i,done){
    if(self.count()<=o.min){UI.toast('至少要留下 '+o.min+' 位玩家',1800,'warn');return}
    var p=self.list().filter(function(x){return x.i===i})[0];if(!p)return;
    UI.confirm({title:'让 '+p.name+' 离开?',text:'他会从这局游戏里退出。',yes:'确认离开',danger:true,icon:'users'}).then(function(ok){
     if(!ok)return;var curI=self.cur().i;self.s.on[i]=false;
     var l=self.list(),k=0;l.forEach(function(x,j){if(x.i===curI)k=j});if(curI===i)k=Math.min(self.s.turn,l.length-1);self.s.turn=k;self.s.adv=false;self.clamp();self.save();done&&done(i);
    });
   },
   /* players sheet: who is playing, leave, join, restart. cb.onChange(kind,i) cb.onNew() */
   manage:function(cb){
    function draw(){
     var h='<h2>玩家</h2><p>'+self.count()+' 位在玩</p><div class="mplist">';
     self.list().forEach(function(p,k){h+='<div class="mprow"><div class="pl'+self.cls()+(k===self.s.turn?' on':'')+'" style="color:'+p.color+'">'+self.avatar(p)+'</div><div class="mpn" style="color:'+p.color+'">'+UI.esc(p.name)+(k===self.s.turn?'<small>轮到TA</small>':'')+'</div><button class="btn warn sm" data-l="'+p.i+'">离开</button></div>'});
     h+='</div><div class="row"><button class="btn pri" id="mpJoin">加入新玩家</button></div>'+(cb.onNew?'<div class="row"><button class="btn warn" id="mpNew">重新选角色 · 新游戏</button></div>':'')+'<div class="row"><button class="btn" id="mpOk">关闭</button></div>';
     UI.modal(h);
     Array.prototype.forEach.call($('box').querySelectorAll('[data-l]'),function(b){b.onclick=function(){var i=+b.getAttribute('data-l');UI.close();self.leave(i,function(){cb.onChange&&cb.onChange('leave',i);draw()})}});
     $('mpJoin').onclick=function(){UI.close();self.join(function(t){cb.onChange&&cb.onChange('join',t);draw()})};
     if(cb.onNew)$('mpNew').onclick=function(){UI.close();cb.onNew()};
     $('mpOk').onclick=UI.close;
    }
    draw();
   },
   /* quick toggle-style editor (used by the plain dice page) */
   setup:function(done){
    function draw(){
     var h='<h2>谁来玩?</h2><p>点头像选择参加的人('+o.min+'–'+o.max+' 位),可改名字</p>';
     pal.forEach(function(p,i){h+='<div class="prow"><div class="pl'+self.cls()+(self.s.on[i]?' on':'')+'" data-i="'+i+'" style="color:'+p[1]+'">'+self.avatar({i:i,color:p[1]})+'</div>'+NameField.html({ph:p[0]+o.suffix,val:self.s.names[i]||'',attrs:'data-n="'+i+'"',tok:p[1]})+'</div>'});
     h+='<div class="row"><button class="btn pri" id="pOk">好了</button></div>';
     UI.modal(h);
     var b=$('box');
     Array.prototype.forEach.call(b.querySelectorAll('.pl'),function(e){e.onclick=function(){
      var i=+e.getAttribute('data-i'),n=self.count();
      if(self.s.on[i]){if(n<=o.min){UI.toast('至少要 '+o.min+' 位玩家');return}self.s.on[i]=false}
      else{if(n>=o.max){UI.toast('最多 '+o.max+' 位玩家');return}self.s.on[i]=true}
      e.classList.toggle('on',self.s.on[i]);self.clamp();self.save()}});
     NameField.bind(b,function(e,v){self.s.names[+e.getAttribute('data-n')]=v;self.save()});
     $('pOk').onclick=function(){UI.close();self.clamp();self.save();done&&done()};
    }
    draw();
   }
  };
  // apply stored pick order (first picked = first to play) once, keep list() in palette order
  self.clamp();return self;
 }
};
/* ================= Router + Nav + Transitions + Home ================= */
var current=null,ctx=null,view=$('view'),prevId='',backFn=null,zoom=null;
function esc(s){return UI.esc(s)}
function buildCtx(slot){return{slot:slot,Store:Store,Sound:Sound,UI:UI,Dice:Dice,Players:Players,Select:Select,nav:UI.navBtn,home:function(){location.hash='#/'},setBack:setBack}}
function setBack(fn){backFn=fn||null;var h=$('nHome');h.innerHTML=(fn?UI.ICO.back:UI.ICO.home)+'<span>'+(fn?'返回':'首页')+'</span>';h.setAttribute('aria-label',fn?'返回':'回首页')}
function gameById(id){var g=null;GC.games.forEach(function(x){if(x.id===id)g=x});return g}
/* page transitions: tile zooms into the game; back shrinks into its tile */
function xfEl(){return $('xf')}
function xfHide(){var x=xfEl();x.style.display='none';x.innerHTML=''}
function playZoomIn(z){
 var x=xfEl();if(UI.reduce()||!x.animate||!z||!z.rect){return}
 x.innerHTML='<div class="xi">'+(z.icon||'')+'</div>';x.style.background=z.color;x.style.display='block';
 var r=z.rect,W=innerWidth,H=innerHeight;
 var a=x.animate([{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',borderRadius:'34px'},{left:'0px',top:'0px',width:W+'px',height:H+'px',borderRadius:'0px'}],{duration:380,easing:'cubic-bezier(.3,.9,.25,1)',fill:'forwards'});
 a.onfinish=function(){var b=x.animate([{opacity:1},{opacity:0}],{duration:240,fill:'forwards'});b.onfinish=xfHide};
 x._a=a;
}
function playZoomOut(color,icon,tile){
 var x=xfEl();if(UI.reduce()||!x.animate||!tile){return}
 var r=tile.getBoundingClientRect(),W=innerWidth,H=innerHeight;
 x.innerHTML='<div class="xi">'+(icon||'')+'</div>';x.style.background=color;x.style.display='block';
 tile.style.visibility='hidden';
 var a=x.animate([{left:'0px',top:'0px',width:W+'px',height:H+'px',borderRadius:'0px',opacity:1},{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',borderRadius:'34px',opacity:1,offset:.8},{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',borderRadius:'34px',opacity:0}],{duration:420,easing:'cubic-bezier(.5,0,.2,1)',fill:'forwards'});
 a.onfinish=function(){tile.style.visibility='';tile.classList.add('popped');xfHide()};
}
function route(){
 var id=(location.hash||'').replace(/^#\/?/,''),g=null;
 if(id==='bank'){location.replace('#/china');return}
 GC.games.forEach(function(x){if(x.id===id&&!x.soon)g=x});
 var from=prevId,to=g?g.id:'home',fromG=gameById(from);
 if(current){try{current.unmount&&current.unmount()}catch(e){console.error(e)}current=null}
 UI.close();Dice.handler=null;xfHide();setBack(null);
 view.innerHTML='';$('navslot').innerHTML='';
 if(!g){
  document.body.setAttribute('data-route','home');$('nTitle').innerHTML='';document.title='游戏中心';renderHome();
  prevId='home';
  if(fromG&&from!=='home'){var tile=view.querySelector('.tile[data-id="'+from+'"]');playZoomOut(fromG.color,fromG.icon,tile)}
  return;
 }
 document.body.setAttribute('data-route',g.id);$('nTitle').innerHTML='<span class="tic">'+g.icon+'</span>'+esc(g.name);document.title=g.name;
 var root=document.createElement('div');root.className='gm gm-'+g.id;view.appendChild(root);
 current=g;g.mount(root,buildCtx($('navslot')));
 prevId=g.id;
 if(zoom&&zoom.id===g.id){playZoomIn(zoom)}else if(from==='home'||from===''){if(from==='home')root.classList.add('fadein')}
 zoom=null;
}
window.addEventListener('hashchange',route);
$('nHome').onclick=function(){Sound.tap();if(backFn)backFn();else location.hash='#/'};
function syncSnd(){var b=$('nSnd');b.innerHTML=(Sound.on?UI.ICO.snd:UI.ICO.mute)+'<span>'+(Sound.on?'声音':'静音')+'</span>';b.classList.toggle('off',!Sound.on)}
$('nSnd').onclick=function(){Sound.cfg.sound=!Sound.on;Sound.save();if(!Sound.on&&GC.Voice)GC.Voice.cancel();syncSnd();if(Sound.on)Sound.pop();UI.toast(Sound.on?'声音已开启':'已静音',1200,Sound.on?'snd':'mute')};
$('nSet').innerHTML=UI.ICO.gear+'<span>设置</span>';
setBack(null);syncSnd();
function dl(name,text){try{var b=new Blob([text],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);return true}catch(e){return false}}
function settings(){
 var b=UI.modal('<div class="dlgic">'+UI.ICO.gear+'</div><h2>设置与进度</h2>'+
  '<div class="tg"><span>声音</span><button class="btn" id="sS">'+(Sound.on?'开':'关')+'</button></div>'+
  '<div class="tg"><span>角色语音</span><button class="btn" id="sVo">'+(Sound.cfg.voice!==false?'开':'关')+'</button></div>'+'<div class="tg"><span>登场动画</span><button class="btn" id="sIn">'+({full:'完整',short:'简短',off:'关闭'}[GC.Intro.mode0()])+'</button></div>'+'<div class="tg"><span>画质</span><button class="btn" id="sGq">'+Gfx.NAMES[Gfx.mode()]+'</button></div>'+'<div class="tg"><span>动画速度</span><button class="btn" id="sSp">'+(GC.Intro.speed()>1?'慢':'标准')+'</button></div>'+'<div class="tg"><span>震动</span><button class="btn" id="sV">'+(Sound.cfg.vib!==false?'开':'关')+'</button></div>'+
  '<div class="sec"><h3>备份 / 恢复全部进度</h3><div class="row"><button class="btn" id="sExp">导出文件</button><button class="btn" id="sCopy">复制</button></div>'+
  '<textarea id="sTxt" placeholder="导入:把备份内容粘贴到这里,或选择文件" spellcheck="false"></textarea>'+
  '<div class="row"><button class="btn" id="sFile">选文件</button><button class="btn warn" id="sImp">导入</button></div><input type="file" id="sPick" accept=".json,application/json,text/plain" style="display:none"></div>'+
  '<div class="row"><button class="btn pri" id="sOk">关闭</button></div>',{cls:'dlg'});
 $('sS').onclick=function(){Sound.cfg.sound=!Sound.on;Sound.save();syncSnd();this.textContent=Sound.on?'开':'关';Sound.pop()};
 $('sVo').onclick=function(){Sound.cfg.voice=Sound.cfg.voice===false;Sound.save();this.textContent=Sound.cfg.voice!==false?'开':'关';if(Sound.cfg.voice!==false)GC.Voice.say('语音已开启','n');else GC.Voice.cancel()};$('sV').onclick=function(){Sound.cfg.vib=Sound.cfg.vib===false;Sound.save();this.textContent=Sound.cfg.vib!==false?'开':'关';Sound.vib(40)};
 $('sGq').onclick=function(){var o=['eco','std','hi'],m=o[(o.indexOf(Gfx.mode())+1)%3];Sound.cfg.gfx=m;Sound.save();Gfx.apply();this.textContent=Gfx.NAMES[m];UI.toast({eco:'画质:省电(没有循环动画和粒子特效,最省电,iPad 不易发热)',std:'画质:标准(推荐:特效粒子减半,只有当前玩家标记会动)',hi:'画质:华丽(全部特效和小动画,更耗电)'}[m],2200,'info')};
 $('sSp').onclick=function(){var sl=GC.Intro.speed()>1;Sound.cfg.aspd=sl?'std':'slow';Sound.save();this.textContent=sl?'标准':'慢';UI.toast(sl?'动画速度:标准':'动画速度:慢(登场动画和表情都放慢约 1.3 倍)',1800,'info')};
 $('sIn').onclick=function(){var o=['full','short','off'],m=o[(o.indexOf(GC.Intro.mode0())+1)%3];Sound.cfg.intro=m;Sound.save();this.textContent={full:'完整',short:'简短',off:'关闭'}[m];UI.toast({full:'登场动画:完整(选角/开局大画面,轮次横幅)',short:'登场动画:简短(都用横幅)',off:'登场动画已关闭'}[m],1800,'info')};
 $('sExp').onclick=function(){var t=Store.exportAll();$('sTxt').value=t;if(dl('game-center-backup.json',t))UI.toast('已导出;若没反应请用「复制」',1800,'check')};
 $('sCopy').onclick=function(){var t=Store.exportAll(),ta=$('sTxt');ta.value=t;ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}
  if(!ok&&navigator.clipboard){navigator.clipboard.writeText(t).then(function(){UI.toast('已复制',1500,'check')},function(){UI.toast('请长按文本框手动复制')});return}
  UI.toast(ok?'已复制':'请长按文本框手动复制')};
 $('sFile').onclick=function(){$('sPick').click()};
 $('sPick').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){$('sTxt').value=r.result;UI.toast('已读取,点「导入」确认')};r.readAsText(f)};
 $('sImp').onclick=function(){
  var t=$('sTxt').value;if(!t.trim()){UI.toast('先粘贴或选择备份');return}
  try{JSON.parse(t)}catch(e){UI.toast('内容不是有效的备份');return}
  UI.confirm({title:'导入并覆盖?',text:'现有进度会被备份内容替换。',yes:'导入',danger:true}).then(function(ok){
   if(!ok){settings();return}
   try{var n=Store.importAll(t);Sound.cfg=Store.get('settings',{sound:true,vib:true});syncSnd();UI.toast('已导入 '+n+' 项',1800,'check');route()}catch(e){UI.toast('导入失败: '+e.message,2200,'warn')}
  });
 };
 $('sOk').onclick=UI.close;
}
$('nSet').onclick=function(){Sound.tap();settings()};
GC.settings=settings;
/* one-time notice: the old generic bank page was replaced */
function oldBankNotice(){
 if(Store.get('bank',null)==null)return;
 Store.del('bank');
 setTimeout(function(){UI.modal('<div class="dlgic">'+UI.ICO.info+'</div><h2>大富翁升级啦</h2><p>旧的「大富翁银行」页面已被全新的「大富翁·中国之旅」电子版取代,旧的银行进度已清除(其他游戏进度都还在)。</p><div class="row"><button class="btn pri" id="obOk">知道了</button></div>',{cls:'dlg'});$('obOk').onclick=UI.close},400);
}
/* home */
var MASCOT='<svg id="mascot" viewBox="0 0 120 150" aria-label="兔子"><ellipse cx="60" cy="144" rx="38" ry="6" fill="#0002"/>'+
 '<g class="ear"><ellipse cx="38" cy="30" rx="13" ry="32" fill="#fff" stroke="#c9b6e8" stroke-width="3"/><ellipse cx="38" cy="32" rx="6" ry="22" fill="#ffb3d1"/></g>'+
 '<g class="ear r"><ellipse cx="82" cy="30" rx="13" ry="32" fill="#fff" stroke="#c9b6e8" stroke-width="3"/><ellipse cx="82" cy="32" rx="6" ry="22" fill="#ffb3d1"/></g>'+
 '<ellipse cx="60" cy="112" rx="30" ry="30" fill="#fff" stroke="#c9b6e8" stroke-width="3"/><ellipse cx="60" cy="118" rx="16" ry="18" fill="#ffe9f4"/>'+
 '<ellipse cx="44" cy="140" rx="13" ry="6" fill="#fff" stroke="#c9b6e8" stroke-width="3"/><ellipse cx="76" cy="140" rx="13" ry="6" fill="#fff" stroke="#c9b6e8" stroke-width="3"/>'+
 '<g class="arm"><ellipse cx="96" cy="100" rx="7" ry="16" fill="#fff" stroke="#c9b6e8" stroke-width="3" transform="rotate(-25 96 100)"/></g>'+
 '<circle cx="60" cy="70" r="34" fill="#fff" stroke="#c9b6e8" stroke-width="3"/>'+
 '<circle cx="40" cy="80" r="7" fill="#ff9ec4" opacity=".7"/><circle cx="80" cy="80" r="7" fill="#ff9ec4" opacity=".7"/>'+
 '<circle cx="48" cy="66" r="6" fill="#3a2a5c"/><circle cx="72" cy="66" r="6" fill="#3a2a5c"/><circle cx="50" cy="64" r="2" fill="#fff"/><circle cx="74" cy="64" r="2" fill="#fff"/>'+
 '<ellipse class="lid" cx="48" cy="66" rx="7" ry="7" fill="#fff"/><ellipse class="lid" cx="72" cy="66" rx="7" ry="7" fill="#fff"/>'+
 '<path d="M55 78Q60 84 65 78" stroke="#3a2a5c" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="75" rx="4" ry="3" fill="#ff6fa0"/></svg>';
function renderHome(){
 var h=document.createElement('div');h.id='home';
 var bg='<div id="bg">';
 for(var i=0;i<4;i++)bg+='<div class="cloud" style="top:'+(4+i*13)+'%;animation-duration:'+(48+i*16)+'s;animation-delay:-'+(i*17)+'s;transform:scale('+(.8+i*.2)+')"><svg viewBox="0 0 150 60"><path d="M25 52a20 20 0 0 1 2-40 28 28 0 0 1 52-6 24 24 0 0 1 44 14 18 18 0 0 1 2 32z" fill="#fff"/></svg></div>';
 for(i=0;i<7;i++)bg+='<div class="star" style="left:'+(6+i*14)+'%;top:'+(8+(i*37)%60)+'%;animation-delay:'+(i*.35)+'s"><svg viewBox="-12 -12 24 24"><path d="M0-11 3-3 11-3 5 2 7 11 0 6-7 11-5 2-11-3-3-3Z" fill="#ffd23f" stroke="#ffb703" stroke-width="1.2" stroke-linejoin="round"/></svg></div>';
 var bc=['#ff6fae','#4fc3ff','#ffd23f','#7be16a'];
 for(i=0;i<4;i++)bg+='<div class="balloon" style="left:'+(10+i*24)+'%;animation-duration:'+(22+i*5)+'s;animation-delay:-'+(i*6)+'s"><svg viewBox="0 0 44 70"><ellipse cx="22" cy="22" rx="18" ry="22" fill="'+bc[i]+'"/><ellipse cx="15" cy="14" rx="4" ry="7" fill="#fff" opacity=".45"/><path d="M22 44l-4 6h8z" fill="'+bc[i]+'"/><path d="M22 50q-6 8 0 20" stroke="#8a7aaa" fill="none" stroke-width="1.5"/></svg></div>';
 bg+='</div>';
 var t='<div class="hub"><div class="hero">'+MASCOT+'<h1>'+'游戏中心'.split('').map(function(c,i){return '<span style="animation-delay:'+(i*.18)+'s;color:'+['#ff4f9a','#ff8a1f','#2bb673','#3a7bff'][i]+'">'+c+'</span>'}).join('')+'</h1><div class="bubble" id="bub">你好呀!</div></div><div class="tiles">';
 GC.games.forEach(function(g,i){
  t+='<button class="tile'+(g.soon?' soon':'')+'" data-id="'+g.id+'" style="--c:'+g.color+';--d:'+(i*.3)+'s"'+(g.soon?' aria-disabled="true"':'')+'><div class="ic">'+g.icon+'</div><div><div class="nm">'+esc(g.name)+'</div><div class="ds">'+esc(g.soon?'':g.desc)+'</div></div>'+(g.soon?'<span class="rb">即将上线</span><span class="zz">Z</span><span class="zz b">z</span>':'')+'</button>';
 });
 t+='</div></div>';
 h.innerHTML=bg+t;view.appendChild(h);
 var m=h.querySelector('#mascot'),bub=h.querySelector('#bub');
 m.onclick=function(){m.classList.remove('hop');void m.getBoundingClientRect();m.classList.add('hop');Sound.hi();bub.classList.add('show');setTimeout(function(){bub.classList.remove('show')},1500)};
 Array.prototype.forEach.call(h.querySelectorAll('.tile'),function(el){el.onclick=function(){
  var id=el.getAttribute('data-id'),g=gameById(id);
  if(g.soon){el.classList.remove('shk');void el.offsetWidth;el.classList.add('shk');Sound.boop();Sound.vib(30);UI.toast('还在睡觉,快上线啦~',1600,'info');return}
  Sound.pop();Sound.vib(25);
  zoom={id:id,rect:el.getBoundingClientRect(),color:g.color,icon:g.icon};
  location.hash='#/'+id;
 }});
 oldBankNotice();
}
GC.route=route;GC.start=function(){route()};GC.setBack=setBack;
})();
