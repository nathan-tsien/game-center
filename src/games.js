(function(){
'use strict';
var GC=window.GC,Store=GC.Store,Sound=GC.Sound,UI=GC.UI,Dice=GC.Dice,Players=GC.Players,Select=GC.Select;
var $=function(i){return document.getElementById(i)};
function btn(cls,id,html,label){var b=document.createElement('button');b.className='btn '+cls;if(id)b.id=id;b.innerHTML=html;if(label)b.setAttribute('aria-label',label);return b}
/* ======================= GAME 1: 兔子棋·抽牌 ======================= */
var COMP={1:8,2:6,3:1,R:4}; // from photo: 8x1步, 6x2步, 1x3步, 4x旋转 = 19
__CARDSVG__
var cards=(function(){
 var st,pl,busy=false,timers=[],root,selv;
 function fullDeck(){var d=[];for(var k in COMP)for(var i=0;i<COMP[k];i++)d.push(k);return Dice.shuffle(d)}
 function fresh(){st={deck:fullDeck(),disc:[],cur:null,undo:null};save()}
 function save(){Store.set('cards',st);pl.save()}
 function load(){pl=Players.create('rabbit',{palette:'rabbit',min:1,max:6,defN:3,suffix:'色兔子',kind:'bunny'});var s=Store.get('cards',null);if(s&&s.deck&&s.disc)st=s;else fresh()}
 function $c(i){return root.querySelector('#'+i)}
 function histHTML(){var h=$c('hist');h.innerHTML='';st.disc.slice(-12).reverse().forEach(function(t){var e=document.createElement('div');e.className='h';e.innerHTML=cardSVG(t);h.appendChild(e)})}
 function render(){
  $c('left').textContent=st.deck.length;
  var multi=pl.count()>1,c=pl.cur();
  pl.strip($c('players'),render);
  $c('turn').textContent=multi?'轮到 '+c.name:'';$c('turn').style.color=c.color;
  var card=$c('card');
  if(st.cur){$c('front').innerHTML=cardSVG(st.cur);card.classList.remove('back');$c('label').textContent=label(st.cur)}
  else{card.classList.add('back');$c('label').textContent=''}
  histHTML();
  $c('bUndo').disabled=!st.undo;$c('bNext').disabled=!multi;$c('bNext').textContent=multi?'下一位 ➜':'—';
 }
 function later(f,ms){var t=setTimeout(f,ms);timers.push(t)}
 function draw(){
  if(busy)return;busy=true;
  var snap=JSON.stringify({deck:st.deck,disc:st.disc,cur:st.cur,turn:pl.s.turn,adv:pl.s.adv});
  var reshuffled=false;
  if(pl.s.adv&&pl.count()>1)pl.s.turn=(pl.s.turn+1)%pl.count();
  pl.s.adv=true;
  if(st.deck.length===0){if(st.cur){st.disc.push(st.cur);st.cur=null}st.deck=Dice.shuffle(st.disc);st.disc=[];reshuffled=true}
  var prev=st.cur;if(prev)st.disc.push(prev);
  var next=st.deck.pop(),c=$c('card');
  var show=function(){
   st.cur=next;st.undo=snap;
   $c('front').innerHTML=cardSVG(next);$c('label').textContent=label(next);$c('left').textContent=st.deck.length;
   c.classList.remove('back');
   if(next==='R'){Sound.beep(520,.12);Sound.beep(780,.12,.12);Sound.beep(1040,.2,.24);Sound.vib([60,40,60,40,120])}
   else{for(var i=0;i<+next;i++)Sound.beep(440+i*120,.1,i*.13);Sound.vib(40)}
   if(reshuffled)UI.toast('🔀 牌堆抽完了,已自动重新洗牌');
   save();render();later(function(){busy=false},500);
  };
  save();
  if(prev){c.classList.add('back');later(show,300)}else show();
  histHTML();
 }
 function undo(){if(!st.undo)return;var u=JSON.parse(st.undo);st.deck=u.deck;st.disc=u.disc;st.cur=u.cur;pl.s.turn=u.turn;pl.s.adv=u.adv;st.undo=null;save();render();UI.toast('已撤销上一张')}
 return{
  mount:function(r,ctx){
   root=r;busy=false;load();
   r.innerHTML=
    '<div class="cl"><div class="cntbox"><span id="left">0</span> 张<small>牌堆剩余</small></div><div class="pls" id="players"></div><div class="turn" id="turn"></div></div>'+
    '<div class="stage"><div id="card" class="back"><div class="face fr" id="front"></div><div class="face bk"><svg viewBox="0 0 60 80"><use href="#carrotIcon"/></svg><div class="t">点我抽牌</div><div class="s">TAP TO DRAW</div></div></div></div>'+
    '<div class="cr2"><div class="lbl" id="label"></div><div id="hist"></div></div>'+
    '<div class="row"><button class="btn" id="bUndo">↩️ 撤销</button><button class="btn" id="bNext">下一位 ➜</button></div>';
   var nw=ctx.nav('refresh','新游戏',{id:'bNew'}),np=ctx.nav('users','玩家',{id:'bSet'});
   ctx.slot.appendChild(nw);ctx.slot.appendChild(np);
   $c('card').addEventListener('click',draw);$c('bNext').onclick=function(){pl.next();render()};$c('bUndo').onclick=undo;
   function newGame(){UI.confirm({title:'开始新游戏?',text:'牌会全部收回重新洗牌,然后重新选角色。',yes:'新游戏',danger:true,icon:'refresh'}).then(function(ok){if(ok){fresh();pl.s.started=false;pl.save();render();startSel()}})}
   function startSel(){selv=pl.choose(root,function(){fresh();render();UI.toast('已洗牌,共 '+st.deck.length+' 张,开始吧!',1800,'star')})}
   nw.onclick=newGame;
   np.onclick=function(){pl.manage({onChange:function(){render()},onNew:function(){newGame()}})};
   render();
   if(!pl.s.started)startSel();
  },
  unmount:function(){timers.forEach(clearTimeout);timers=[];save()},
  api:{state:function(){return st},players:function(){return pl},draw:function(){draw()},COMP:COMP}
 };
})();
/* ======================= GAME 2: 骰子 (通用) ======================= */
var dice=(function(){
 var D,pl,root,rolling=false,rolled=false,cancel=null,timers=[],ro=null;
 function $d(i){return root.querySelector('#'+i)}
 function save(){Store.set('dice',D);pl.save()}
 function renderAll(){
  var bs=$d('dcnt').children;for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',+bs[i].getAttribute('data-n')===D.n);
  var multi=pl.count()>1,c=pl.cur();
  $d('dplayers').style.display=multi?'flex':'none';$d('dturn').style.display=multi?'':'none';$d('dNext').style.display=multi?'':'none';
  if(multi){pl.strip($d('dplayers'),renderAll);$d('dturn').textContent='轮到 '+c.name;$d('dturn').style.color=c.color}
  Dice.render($d('dstage'),D.vals);
  var sum=D.vals.reduce(function(a,b){return a+b},0);
  $d('dtotal').textContent=rolled?(D.n>1?'合计 '+sum:'点数 '+sum):'';
  var h=$d('dhist');h.innerHTML='';
  D.hist.forEach(function(r){var e=document.createElement('div');e.className='h';var t=r.reduce(function(a,b){return a+b},0);e.innerHTML=r.length>1?t+'<small>'+r.join('+')+'</small>':t;h.appendChild(e)});
 }
 function roll(){
  if(rolling)return;rolling=true;rolled=false;
  var res=[];for(var i=0;i<D.n;i++)res.push(Dice.d6());
  $d('dtotal').textContent='…';
  cancel=Dice.roll($d('dstage'),res,function(){
   D.vals=res;D.hist.unshift(res.slice());D.hist=D.hist.slice(0,10);save();rolled=true;rolling=false;renderAll();
   if(D.n>1){Sound.beep(660,.1);Sound.beep(880,.15,.1)}Sound.vib([40,30,40]);
   api.last=res.slice();
  });
 }
 var api={last:null,state:function(){return D},roll:function(){roll()}};
 return{
  mount:function(r,ctx){
   root=r;rolling=false;rolled=false;
   pl=Players.create('rabbit',{palette:'rabbit',min:1,max:6,defN:3,suffix:'色',kind:'disc'});
   D=Store.get('dice',{n:1,hist:[],vals:[1]});if(!(D.n>=1&&D.n<=3))D={n:1,hist:[],vals:[1]};D.hist=(D.hist||[]).slice(0,10);D.vals=(D.vals||[]).slice(0,D.n);while(D.vals.length<D.n)D.vals.push(1);
   r.innerHTML=
    '<div class="cl"><div class="cnt" id="dcnt"><button class="btn sq" data-n="1">1</button><button class="btn sq" data-n="2">2</button><button class="btn sq" data-n="3">3</button></div><div class="pls" id="dplayers"></div><div class="turn" id="dturn"></div></div>'+
    '<div class="stage" id="dstage"></div>'+
    '<div class="cr2"><div class="lbl" id="dtotal"></div><div class="dhist" id="dhist"></div></div>'+
    '<div class="row"><button class="btn big" id="dRoll">🎲 掷骰子</button><button class="btn" id="dNext">下一位 ➜</button></div>';
   var sh=ctx.nav('shake','摇一摇',{id:'dShake'}),np=ctx.nav('users','玩家',{id:'dSet'});
   sh.classList.toggle('on',Dice.shakeOn);ctx.slot.appendChild(sh);ctx.slot.appendChild(np);
   sh.onclick=function(){Dice.toggleShake(sh)};np.onclick=function(){pl.setup(renderAll)};
   Dice.handler=roll;
   $d('dcnt').addEventListener('click',function(e){var n=+e.target.getAttribute('data-n');if(!n||rolling)return;D.n=n;while(D.vals.length<n)D.vals.push(1);D.vals=D.vals.slice(0,n);rolled=false;save();renderAll()});
   $d('dstage').addEventListener('click',roll);$d('dRoll').onclick=roll;$d('dNext').onclick=function(){pl.next();renderAll()};
   if(window.ResizeObserver){ro=new ResizeObserver(function(){Dice.layout($d('dstage'),D.n)});ro.observe($d('dstage'))}
   renderAll();
  },
  unmount:function(){if(cancel)cancel();if(ro)ro.disconnect();ro=null;save()},
  api:api
 };
})();
/* ======================= GAME 3: 飞行棋骰子 ======================= */
var FL=(function(){
 var TAKEOFF={'6':[6],'56':[5,6],'even':[2,4,6],'any':[1,2,3,4,5,6]};
 var TLABEL={'6':'6','56':'5或6','even':'偶数','any':'任意'};
 var DEF={takeoff:'56',again6:true,three:'one'};
 /* pure: s={turn,sixes,rules}, n players, v roll -> result */
 function resolve(s,n,v){
  var r=s.rules,sixes=v===6?s.sixes+1:0,pen=null;
  if(r.again6&&r.three!=='off'&&sixes>=3)pen=r.three;
  var takeoff=TAKEOFF[r.takeoff].indexOf(v)>=0;
  var again=!pen&&v===6&&r.again6;
  var turn=again?s.turn:(s.turn+1)%n;
  if(!again)sixes=0;
  var hint,kind;
  if(pen){kind='warn';hint=pen==='all'?'⚠️ 连续三个6!所有飞机都要回基地!这次不走,换下一位':'⚠️ 连续三个6!有一架飞机要回基地!这次不走,换下一位'}
  else if(takeoff&&again){kind='again';hint='掷到'+v+',可以起飞!再掷一次!'}
  else if(takeoff){kind='good';hint='掷到'+v+',可以起飞!走完换下一位'}
  else if(again){kind='again';hint='掷到6,再掷一次!'}
  else{kind='';hint='没到起飞点数,换下一位'}
  var sub=(!pen&&!takeoff)?'已在天上的飞机可走 '+v+' 步':(!pen&&takeoff?'或让天上的飞机走 '+v+' 步':'');
  return{turn:turn,sixes:sixes,again:again,pen:pen,takeoff:takeoff,hint:hint,sub:sub,kind:kind};
 }
 var st,pl,root,rolling=false,cancel=null,api;
 function $f(i){return root.querySelector('#'+i)}
 function load(){
  pl=Players.create('flight',{palette:'flight',min:2,max:4,defN:4,suffix:'色飞机',kind:'plane'});
  var s=Store.get('flight',null);
  if(!s||!s.rules)s=blank();
  s.rules=Object.assign({},DEF,s.rules);st=s;
 }
 function blank(){return{rules:JSON.parse(JSON.stringify(DEF)),sixes:0,again:false,hist:[],last:null,cnt:[0,1,2,3].map(function(){return{h:4,f:0,d:0}})}}
 function fresh(){var r=st.rules;st=blank();st.rules=r;save()}
 function save(){Store.set('flight',st);pl.save()}
 function summary(){var r=st.rules;return '起飞: '+TLABEL[r.takeoff]+' · 掷6'+(r.again6?'再掷':'不再掷')+' · 三连6: '+(r.three==='off'?'关':r.three==='one'?'退1架':'全退')}
 function render(){
  var c=pl.cur(),multi=true;
  pl.strip($f('fplayers'),render);
  var big=$f('bigav');big.style.setProperty('--pc',c.color);big.style.color=c.color;big.innerHTML=pl.avatar(c);
  $f('who').innerHTML=UI.esc(c.name)+(st.again?'<br><span class="again">再掷一次!</span>':'');
  $f('who').style.color=c.color;
  var h=$f('hint'),L=st.last;
  if(rolling){h.className='hint';h.innerHTML='…'}
  else if(L){h.className='hint '+L.kind;h.innerHTML=UI.esc(L.hint)+(L.sub?'<small>'+UI.esc(L.sub)+'</small>':'');}
  else{h.className='hint';h.innerHTML='点骰子开始!<small>'+UI.esc(summary())+'</small>'}
  $f('lastroll').textContent=L?(L.who+' 掷出 '+L.v):'';
  var hh=$f('fhist');hh.innerHTML='';
  st.hist.slice(-12).reverse().forEach(function(e){var d=document.createElement('div');d.className='h';d.style.setProperty('--hc',e.color);d.innerHTML=e.v+'<small>'+UI.esc(e.cname)+'</small>';hh.appendChild(d)});
  $f('fUndo').disabled=!st.hist.length||rolling;$f('fRoll').disabled=rolling;
  $f('rules').textContent=summary();
 }
 function roll(){
  if(rolling)return;
  var v=Dice.d6(),stage=$f('fstage');rolling=true;
  var cur=pl.cur();
  render();
  cancel=Dice.roll(stage,[v],function(){
   rolling=false;
   var n=pl.count(),before={turn:pl.s.turn,sixes:st.sixes,again:st.again,last:st.last};
   var r=resolve({turn:pl.s.turn,sixes:st.sixes,rules:st.rules},n,v);
   st.hist.push({v:v,i:cur.i,color:cur.color,cname:cur.cname,who:cur.name,snap:before});if(st.hist.length>40)st.hist.shift();
   st.last={who:cur.name,v:v,hint:r.hint,sub:r.sub,kind:r.kind,pen:r.pen};
   pl.s.turn=r.turn;st.sixes=r.sixes;st.again=r.again;
   save();render();
   if(r.pen){Sound.seq([[392,.18,.18],[311,.18,.18],[233,.35,.18]]);Sound.vib([200,80,200,80,300])}
   else if(r.takeoff){Sound.seq([[523,.1],[659,.1],[784,.18]]);Sound.vib([40,30,40])}
   else{Sound.beep(300,.12);Sound.vib(25)}
   api.lastResult=r;
  });
 }
 function undo(){
  if(rolling||!st.hist.length)return;var e=st.hist.pop(),s=e.snap;
  pl.s.turn=s.turn;st.sixes=s.sixes;st.again=s.again;st.last=s.last;
  Dice.render($f('fstage'),[st.hist.length?st.hist[st.hist.length-1].v:1]);
  save();render();UI.toast('已撤销 '+e.who+' 的 '+e.v+' 点');
 }
 function skip(){if(rolling)return;pl.next();st.sixes=0;st.again=false;save();render()}
 function openRules(){
  function seg(k,opts){return '<div class="seg" data-k="'+k+'">'+opts.map(function(o){return '<button class="btn'+(String(st.rules[k])===String(o[0])?' on':'')+'" data-v="'+o[0]+'">'+o[1]+'</button>'}).join('')+'</div>'}
  UI.modal('<h2>🎛 规则设置</h2>'+
   '<div class="sec"><h3>起飞点数</h3>'+seg('takeoff',[['6','只有 6'],['56','5 或 6'],['even','偶数 2·4·6'],['any','任意点数']])+'</div>'+
   '<div class="sec"><h3>掷到 6 再掷一次</h3>'+seg('again6',[[true,'开'],[false,'关']])+'</div>'+
   '<div class="sec"><h3>连续三个 6</h3>'+seg('three',[['off','不惩罚'],['one','1 架回基地'],['all','全部回基地']])+'<p style="text-align:left;font-size:14px;margin:6px 0 0">需要先开「掷6再掷」才会连掷。</p></div>'+
   '<div class="row"><button class="btn" id="fReset">恢复默认</button><button class="btn pri" id="fOk">好了</button></div>');
  var b=$('box');
  Array.prototype.forEach.call(b.querySelectorAll('.seg'),function(s){s.onclick=function(e){var t=e.target.closest('.btn');if(!t)return;var k=s.getAttribute('data-k'),v=t.getAttribute('data-v');st.rules[k]=(k==='again6')?v==='true':v;Array.prototype.forEach.call(s.children,function(c){c.classList.toggle('on',c===t)});save();render()}});
  $('fReset').onclick=function(){st.rules=JSON.parse(JSON.stringify(DEF));save();render();openRules()};
  $('fOk').onclick=UI.close;
 }
 function openTracker(){
  function body(){
   var h='<h2>✈️ 飞机计数</h2><p>手动记录,可不用</p>';
   pl.list().forEach(function(p){var c=st.cnt[p.i];
    h+='<div class="cr"><div class="pl plane" style="color:'+p.color+'">'+pl.avatar(p)+'</div><div class="nmx" style="color:'+p.color+'">'+UI.esc(p.name)+'</div>';
    [['h','🏠基地'],['f','✈️天上'],['d','🏁到达']].forEach(function(k){h+='<div class="cc"><small>'+k[1]+'</small><div class="n"><button class="btn" data-i="'+p.i+'" data-k="'+k[0]+'" data-d="-1">−</button><span>'+c[k[0]]+'</span><button class="btn" data-i="'+p.i+'" data-k="'+k[0]+'" data-d="1">+</button></div></div>'});
    h+='</div>'});
   h+='<div class="row"><button class="btn" id="tReset">全部重置</button><button class="btn pri" id="tOk">好了</button></div>';return h;
  }
  function draw(){
   UI.modal(body());
   Array.prototype.forEach.call($('box').querySelectorAll('.cc .btn'),function(b){b.onclick=function(){
    var i=+b.getAttribute('data-i'),k=b.getAttribute('data-k'),d=+b.getAttribute('data-d'),c=st.cnt[i];
    var v=Math.max(0,Math.min(4,c[k]+d));if(v===c[k])return;c[k]=v;save();draw();Sound.beep(500+d*80,.05);
    if(k==='d'&&v===4)UI.toast('🏆 '+pl.list().filter(function(p){return p.i===i})[0].name+' 全部到达,获胜!',2500)}});
   $('tReset').onclick=function(){st.cnt=[0,1,2,3].map(function(){return{h:4,f:0,d:0}});save();draw()};
   $('tOk').onclick=UI.close;
  }
  draw();
 }
 api={logic:{resolve:resolve,TAKEOFF:TAKEOFF,DEF:DEF},state:function(){return st},players:function(){return pl},lastResult:null,roll:function(){roll()}};
 return{
  mount:function(r,ctx){
   root=r;rolling=false;load();
   r.innerHTML=
    '<div class="cl"><div class="pls" id="fplayers"></div><div class="fturn"><div class="bigav" id="bigav"></div><div class="who" id="who"></div></div></div>'+
    '<div class="stage" id="fstage"></div>'+
    '<div class="cr2"><div class="hint" id="hint"></div><div class="chips"><button class="chip" id="rules"></button></div><div class="lbl" id="lastroll" style="font-size:20px;min-height:1.3em"></div><div class="dhist" id="fhist"></div></div>'+
    '<div class="row"><button class="btn sq" id="fUndo" aria-label="撤销">↩️</button><button class="btn big" id="fRoll">🎲 掷骰子</button><button class="btn sq" id="fShake" aria-label="摇一摇">📳</button><button class="btn" id="fSkip">下一位 ➜</button></div>';
   var tr=ctx.nav('plane','计数',{id:'fTrack',aria:'飞机计数'}),rl=ctx.nav('list','规则',{id:'fRules'}),np=ctx.nav('users','玩家',{id:'fSet'});
   [tr,rl,np].forEach(function(b){ctx.slot.appendChild(b)});
   tr.onclick=openTracker;rl.onclick=openRules;$f('rules').onclick=openRules;
   function fNew(){UI.confirm({title:'开始新游戏?',text:'飞机计数和掷骰记录会清空,然后重新选角色。',yes:'新游戏',danger:true,icon:'refresh'}).then(function(ok){if(!ok)return;fresh();pl.s.started=false;pl.save();render();fSel()})}
   function fSel(){pl.choose(root,function(){st.sixes=0;st.again=false;save();render();UI.toast('选好啦,开始掷骰!',1800,'star')})}
   np.onclick=function(){pl.manage({onChange:function(k,i){if(k==='join')st.cnt[i]={h:4,f:0,d:0};st.sixes=0;st.again=false;save();render()},onNew:fNew})};
   var sh=$f('fShake');sh.classList.toggle('on',Dice.shakeOn);sh.onclick=function(){Dice.toggleShake(sh)};
   Dice.handler=roll;
   $f('fstage').addEventListener('click',roll);$f('fRoll').onclick=roll;$f('fUndo').onclick=undo;$f('fSkip').onclick=skip;
   Dice.render($f('fstage'),[st.hist.length?st.hist[st.hist.length-1].v:6]);
   if(window.ResizeObserver){this._ro=new ResizeObserver(function(){Dice.layout($f('fstage'),1)});this._ro.observe($f('fstage'))}
   render();
   if(!pl.s.started)fSel();
  },
  unmount:function(){if(cancel)cancel();if(this._ro)this._ro.disconnect();save()},
  api:api
 };
})();
__FLY__
__RABBIT__
__CHINA__
/* ======================= REGISTRY =======================
 添加新游戏 = 在这里 push 一项:
 {id:'xxx', name:'中文名', color:'#hex', desc:'≤6字', icon:'<svg viewBox="0 0 100 100">…</svg>',
  soon:true(可选,即将上线,磁贴禁用), mount:function(root,ctx){…}, unmount:function(){…}}
 路由 #/id 自动生效。ctx={slot(顶栏按钮区),Store,Sound,UI,Dice,Players,home()}。存档用 ctx.Store.get/set('名字空间',值),会自动进入全局导出/导入。 */
var ICON={
 cards:'<svg viewBox="0 0 100 100"><g transform="rotate(-16 50 60)"><rect x="14" y="16" width="46" height="66" rx="9" fill="#ffe6b8" stroke="#fff" stroke-width="4"/></g><g transform="rotate(12 50 60)"><rect x="38" y="14" width="46" height="66" rx="9" fill="#fff" stroke="#ffb703" stroke-width="3"/><g transform="translate(61 48) scale(.62) translate(-30 -42)"><use href="#carrotIcon"/></g></g></svg>',
 dice:'<svg viewBox="0 0 100 100"><g transform="rotate(-14 34 62)"><rect x="8" y="36" width="50" height="50" rx="12" fill="#fff"/><g fill="#3a2a5c"><circle cx="21" cy="49" r="5"/><circle cx="45" cy="49" r="5"/><circle cx="33" cy="61" r="5" fill="#e03a3a"/><circle cx="21" cy="73" r="5"/><circle cx="45" cy="73" r="5"/></g></g><g transform="rotate(14 68 40)"><rect x="46" y="12" width="46" height="46" rx="11" fill="#fff"/><g fill="#3a2a5c"><circle cx="60" cy="26" r="5"/><circle cx="78" cy="44" r="5"/><circle cx="69" cy="35" r="5"/></g></g></svg>',
 flight:'<svg viewBox="0 0 100 100"><path d="M10 82a12 12 0 0 1 2-24 16 16 0 0 1 30-3 14 14 0 0 1 26 8 10 10 0 0 1 2 19z" fill="#fff" opacity=".9"/><g transform="translate(54 40) rotate(40)"><path d="M0-34C5-34 7-26 7-16L34 6V14L7 4 7 22 17 30V36L0 32-17 36V30L-7 22-7 4-34 14V6L-7-16C-7-26-5-34 0-34Z" fill="#ff4d4d" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="0" cy="-18" r="4" fill="#9be3ff"/></g></svg>',
 china:'<svg viewBox="0 0 100 100"><rect x="10" y="12" width="80" height="76" rx="14" fill="#fff"/><rect x="18" y="20" width="64" height="60" rx="8" fill="#ffe8a8"/><path d="M28 56 50 38 72 56V76H28Z" fill="#e8302a" stroke="#8f130f" stroke-width="3" stroke-linejoin="round"/><path d="M20 58 50 30 80 58" fill="none" stroke="#6d1a10" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><rect x="43" y="60" width="14" height="16" rx="2" fill="#8f130f"/><circle cx="76" cy="24" r="12" fill="#ffd23f" stroke="#fff" stroke-width="3"/><text x="76" y="29" font-size="14" font-weight="900" text-anchor="middle" fill="#b87a00">¥</text></svg>',
 score:'<svg viewBox="0 0 100 100"><rect x="14" y="16" width="72" height="66" rx="12" fill="#fff"/><rect x="22" y="26" width="56" height="10" rx="4" fill="#b8e0ff"/><rect x="22" y="44" width="40" height="8" rx="4" fill="#ffd9a0"/><rect x="22" y="60" width="48" height="8" rx="4" fill="#ffc4de"/><path d="M76 62l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#ffd23f" stroke="#ffb703" stroke-width="2"/></svg>'
};
GC.games.push(
 {id:'fly',name:'飞行棋',color:'#ff5d73',desc:'起飞叠吃冲终点',icon:ICON.flight,mount:FLY.mount,unmount:FLY.unmount,api:FLY.api},
 {id:'rabbit',name:'兔子棋',color:'#ff9f1c',desc:'爬山拔萝卜',icon:ICON.cards,mount:RB.mount,unmount:RB.unmount,api:RB.api},
 {id:'china',name:'大富翁·中国之旅',color:'#9b7bff',desc:'买地盖房环游中国',icon:ICON.china,mount:CT.mount,unmount:CT.unmount,api:CT.api},
 {id:'dice',name:'骰子',color:'#34c3ff',desc:'1–3颗骰子',icon:ICON.dice,mount:dice.mount,unmount:dice.unmount,api:dice.api},
 {id:'cards',name:'抽牌助手',color:'#ffa94d',desc:'只抽牌不走棋',icon:ICON.cards,mount:cards.mount,unmount:cards.unmount,api:cards.api},
 {id:'flight',name:'飞行棋骰子',color:'#ff8a9a',desc:'只掷骰助手',icon:ICON.flight,mount:FL.mount,unmount:FL.unmount,api:FL.api},
 {id:'score',name:'记分牌',color:'#4cd38a',desc:'',icon:ICON.score,soon:true,mount:function(){},unmount:function(){}}
);
GC.start();
})();
