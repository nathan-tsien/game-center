/* ======================= 兔子棋 QA-v1 · 一体山体底板 + 粘土兔 ======================= */
var RB=(function(){
'use strict';
var E=window.RBE,Store=GC.Store,Sound=GC.Sound,UI=GC.UI,Select=GC.Select;
var TKN=E.TKN,TKC=['#2f80ed','#f2b705','#e53935','#ff4fa3','#1fae5b','#8e44ec'];
var BUN_KEYS=['pink','purple','yellow','blue'];
var root,S,busy=false,selv=null,timers=[],ro=null,fxLayer=null;
function $q(s){return root.querySelector(s)}
function later(f,ms){var t=setTimeout(f,ms);timers.push(t);return t}
function esc(s){return UI.esc(s)}
function avSrc(tok){var A=window.CT_AV;return(A&&A[tok])?A[tok]:null}
function tkAv(tok,sz,cls){var src=avSrc(tok),inn=src?'<img class="tkimg" src="'+src+'" alt="" draggable="false" decoding="async">':'<svg viewBox="-24 -24 48 48"><use href="#tk'+tok+'"/></svg>';return '<span class="tkm '+(cls||'')+'" style="width:'+sz+'px;height:'+sz+'px">'+inn+'</span>'}
function eco(){try{return GC.Gfx&&GC.Gfx.mode()==='eco'}catch(e){return false}}
function save(){if(S)S.sv=Date.now();Store.set('rabbit',S)}
function load(){var s=Store.get('rabbit',null);if(s&&s.players&&s.players.length)S=s;else S=E.newState()}

function padList(){
 if(window.RB_PADS&&window.RB_PADS.length>=E.PADS-1)return window.RB_PADS;
 var out=[],n=E.PADS-1,i;
 for(i=0;i<n;i++){
  var t=i/(n-1),ang=-Math.PI*0.55+t*Math.PI*2.55,rad=36-t*26;
  out.push({x:50+Math.cos(ang)*rad*1.05,y:56+Math.sin(ang)*rad*0.78});
 }
 return out;
}
function padPos(i){
 var pads=padList(),n=E.PADS-1;
 if(i>=n){var s=window.RB_SUMMIT||{x:50,y:18};return{x:s.x,y:s.y}}
 var p=pads[i]||pads[pads.length-1];
 return{x:p.x,y:p.y};
}
function bunnyImg(colorIdx){
 var key=BUN_KEYS[colorIdx%BUN_KEYS.length];
 var src=(window.RB_BUNNIES&&window.RB_BUNNIES[key])||'';
 if(src)return '<img class="rb-bun-img" src="'+src+'" alt="" draggable="false" decoding="async">';
 return '<span class="rb-bun-fallback" style="background:'+(E.RCOLS[colorIdx]||'#ff5fa8')+'"></span>';
}
function cardFace(card){
 if(!card)return '';
 if(card.t==='carrot')return '<div class="rfc carrot"><span>🥕</span><b>胡萝卜</b></div>';
 if(card.t==='step')return '<div class="rfc step"><b>'+card.n+'</b><small>步</small></div>';
 var c=E.RCOLS[card.c]||'#999',n=E.RNAMES[card.c]||'';
 return '<div class="rfc color" style="--cc:'+c+'"><i></i><b>'+n+'兔</b></div>';
}
function ensureFx(){if(!fxLayer){fxLayer=$q('.rbfx')}return fxLayer}
function sparkAt(xPct,yPct,cls,n){
 if(eco())return;
 var layer=ensureFx();if(!layer)return;
 n=n||8;
 for(var i=0;i<n;i++){
  var s=document.createElement('i');
  s.className='rbsp '+(cls||'');
  var ang=Math.random()*Math.PI*2,dist=10+Math.random()*30;
  s.style.left=xPct+'%';s.style.top=yPct+'%';
  s.style.setProperty('--dx',(Math.cos(ang)*dist)+'px');
  s.style.setProperty('--dy',(Math.sin(ang)*dist)+'px');
  layer.appendChild(s);
  (function(el){later(function(){try{el.remove()}catch(e){}},900)})(s);
 }
}

function buildBoard(){
 var b=$q('#rbb'),h='',i,pads=padList();
 var bg=(window.RB_BOARD_BG)||'';
 h+='<div class="rbmtn'+(bg?' has-art':'')+'" id="rbMtn" aria-hidden="true"></div>';
 /* invisible pad slots — art already has yellow pads; only trap glow overlays */
 for(i=0;i<pads.length;i++){
  var p=pads[i],trap=E.TRAPS.indexOf(i)>=0||!!p.trap;
  h+='<div class="rbp'+(trap?' trap':'')+'" data-i="'+i+'" style="left:'+p.x+'%;top:'+p.y+'%"></div>';
 }
 /* soft glow rings over baked carrot when spinning — no cardboard labels */
 h+='<div class="rbsum" id="rbSum"><div class="rbrings" aria-hidden="true"><i></i><i></i><i></i></div></div>';
 h+='<div id="rbtok"></div>';
 h+='<div class="rbfx" aria-hidden="true"></div>';
 b.innerHTML=h;fxLayer=$q('.rbfx');
 if(bg){var mtn=$q('#rbMtn'); if(mtn) mtn.style.backgroundImage='url("'+bg+'")';}
}
function renderTokens(){
 var el=$q('#rbtok');if(!el||!S.players)return;
 var h='',opts=S.pending?S.pending.opts:[];
 S.players.forEach(function(p){
  p.rabbits.forEach(function(r){
   var pos,can=opts.some(function(o){return o.pid===p.id&&o.rid===r.id});
   if(r.pos<0)pos={x:12+p.id*8,y:92};
   else if(r.pos>=E.PADS-1)pos=padPos(E.PADS-1);
   else pos=padPos(r.pos);
   h+='<button type="button" class="rbtok'+(can?' go':'')+'" data-p="'+p.id+'" data-r="'+r.id+'" style="left:'+pos.x+'%;top:'+pos.y+'%;--pc:'+p.color+'" aria-label="'+esc(p.cname)+'兔">'+bunnyImg(p.id)+'</button>';
  });
 });
 el.innerHTML=h;
 Array.prototype.forEach.call(el.querySelectorAll('.rbtok.go'),function(b){
  b.onclick=function(){pickRabbit(+b.getAttribute('data-p'),+b.getAttribute('data-r'))};
 });
 var open=!!S.trapsOpen;
 Array.prototype.forEach.call(root.querySelectorAll('.rbp.trap'),function(el){el.classList.toggle('open',open)});
}
function renderPanel(){
 var el=$q('#rbpnl');if(!el)return;
 var h='';
 (S.players||[]).forEach(function(p){
  var cur=S.phase==='play'&&p.id===S.turn,pos=p.rabbits[0].pos;
  var step=pos<0?'起点':(pos>=E.PADS-1?'登顶':(pos+1)+'/'+E.PADS);
  h+='<div class="pc av1 rbpc'+(cur?' cur':'')+(S.winner===p.id?' win':'')+'" style="--pc:'+TKC[p.tok]+'">'+
   '<div class="pcm">'+tkAv(p.tok,72,'av')+'<div class="pci"><div class="pn">'+esc(p.name)+(cur?'<em>▶</em>':'')+'</div>'+
   '<div class="pcb"><span class="np">🐰'+step+'</span><span class="bd" style="background:'+p.color+'">'+p.cname+'</span></div></div></div></div>';
 });
 el.innerHTML=h;
}
function renderDock(){
 var el=$q('#rbdock');if(!el)return;
 var hint='';
 if(S.phase==='over'){hint='🏆 '+esc(S.players[S.winner].name)+' 登顶!'}
 else if(S.phase!=='play'){hint='选角色开始'}
 else if(S.pending){hint='点发光的兔子前进'}
 else{hint='轮到 <b style="color:'+TKC[E.cur(S).tok]+'">'+esc(E.cur(S).name)+'</b>'}
 el.innerHTML='<div class="rbcard" id="rbCard">'+cardFace(S.cur)+'</div>'+
  '<div class="rbhint">'+hint+'</div>'+
  (S.phase==='play'&&!S.pending?'<button class="btn big" id="rbDraw">🃏 抽卡</button>':'')+
  (S.phase==='over'?'<button class="btn pri" id="rbAgain">再来一局</button>':'')+
  '<div class="rbdeck"><small>牌堆 '+(S.deck?S.deck.length:0)+'</small></div>';
 var d=$q('#rbDraw'),a=$q('#rbAgain'),c=$q('#rbCard');
 if(d)d.onclick=function(){doDraw()};
 if(a)a.onclick=function(){startNew()};
 if(c&&S.phase==='play'&&!S.pending)c.onclick=function(){doDraw()};
}
function render(){
 if(!root||!S)return;
 root.classList.toggle('over',S.phase==='over');
 root.classList.toggle('traps-open',!!S.trapsOpen);
 var sum=$q('#rbSum');
 if(sum)sum.classList.toggle('spinning',!!S.trapsOpen||(S.cur&&S.cur.t==='carrot'));
 renderTokens();renderPanel();renderDock();
}
function doDraw(){
 if(busy||S.phase!=='play'||S.pending)return;
 busy=true;
 var r=null,guard=0,carrotEv=null;
 while(guard++<8){
  r=E.draw(S);
  if(!r.ok){busy=false;save();UI.toast(r.err||'不能抽',1400,'warn');render();return}
  if(r.card&&r.card.t==='carrot'){carrotEv=r;break}
  if(r.skipped)continue;
  break;
 }
 busy=false;save();
 if(carrotEv){
  Sound.seq([[520,.1],[780,.1],[400,.15]]);
  root.classList.add('traps-open');S.trapsOpen=true;render();
  sparkAt(50,18,'carrot',12);
  E.TRAPS.forEach(function(ti){var p=padPos(ti);sparkAt(p.x,p.y,'trap',6)});
  UI.toast(carrotEv.fell&&carrotEv.fell.length?'胡萝卜!有兔子掉下去啦':'胡萝卜转了转,没人掉下去',1600,'star');
  later(function(){root.classList.remove('traps-open');S.trapsOpen=false;render()},1100);
  return;
 }
 if(r.skipped||!r.opts||!r.opts.length){Sound.beep(280,.1);UI.toast('暂时没法走,换下一位',1400,'info');render();return}
 Sound.pop();render();
 if(r.opts.length===1)later(function(){pickRabbit(r.opts[0].pid,r.opts[0].rid)},260);
}
function pickRabbit(pid,rid){
 if(busy||!S.pending)return;
 busy=true;
 var r=E.move(S,pid,rid);
 busy=false;
 if(!r.ok){UI.toast(r.err||'不能走',1400,'warn');return}
 save();Sound.hi();
 if(r.to!=null&&r.to>=0){var p=padPos(Math.min(r.to,E.PADS-2));sparkAt(p.x,p.y,'hop',6)}
 if(S.phase==='over'){var w=S.players[S.winner];sparkAt(50,16,'carrot',16);try{GC.Intro.banner(w.tok,w.name,'登顶啦!')}catch(e){}UI.toast('🏆 '+w.name+' 先到山顶!',2500,'star')}
 else UI.toast('跳到第 '+(r.to+1)+' 格',900,'info');
 render();
}
function rulesModal(){
 UI.modal('<h2>兔子棋规则</h2><p style="text-align:left;line-height:1.45">• 点<strong>抽卡</strong><br>• <b>颜色卡</b>：走对应颜色兔 1 格<br>• <b>步数卡</b>：走自己的兔 N 格<br>• <b>胡萝卜</b>：山顶胡萝卜转圈,陷阱打开,洞上的兔掉回起点<br>• 先到山顶「终点胡萝卜」获胜<br>• 棋盘兔子是原创造型</p><div class="row"><button class="btn pri" id="rbRk">知道了</button></div>');
 document.getElementById('rbRk').onclick=UI.close;
}
function startSelect(){
 if(selv){try{selv.remove()}catch(e){}selv=null}
 selv=Select.screen(root,{kind:'tk',min:2,max:4,title:'兔子棋 · 选角色',sub:'2–4 人 · 每位玩家一只原创彩兔 · 爬山拔萝卜',ok:'开始爬山',
  onDone:function(list){
   selv=null;S=E.newState();E.startGame(S,list.map(function(x){return{tok:x.tok,name:x.name||TKN[x.tok]}}));save();
   buildBoard();render();fit();
   var go=function(){try{GC.Intro.banner(S.players[0].tok,S.players[0].name,'先抽卡!')}catch(e){}UI.toast(S.players[0].name+' 先抽!',1600,'star')};
   var did=false;try{did=GC.Intro.vs(S.players.map(function(p){return{tok:p.tok,name:p.name}}),go)}catch(e){}if(!did)go();
  }});
}
function startNew(){UI.confirm({title:'开始新的一局?',text:'当前进度会清空,再选一次角色。',yes:'新局',danger:true,icon:'refresh'}).then(function(ok){if(!ok)return;S=E.newState();save();startSelect()})}
function fit(){
 if(!root)return;
 var land=root.clientWidth>root.clientHeight;
 root.classList.toggle('land',land);
 document.documentElement.classList.toggle('rb-land',land);
}
var api={state:function(){return S},engine:E,render:function(){render()},draw:function(){return doDraw()}};
return{
 mount:function(r,ctx){
  root=r;busy=false;selv=null;timers=[];fxLayer=null;load();
  r.classList.add('gm-rabbit');
  r.innerHTML='<div class="rblay"><div class="rbbw"><div id="rbb" class="rbb"></div></div><div class="rbside"><div class="rbpnl" id="rbpnl"></div><div class="rbdock" id="rbdock"></div></div></div>';
  var nr=ctx.nav('list','规则',{id:'rbRules'}),nn=ctx.nav('refresh','新局',{id:'rbNew'}),ne=ctx.nav('star','省电',{id:'rbEco'});
  ctx.slot.appendChild(nr);ctx.slot.appendChild(nn);ctx.slot.appendChild(ne);
  nr.onclick=function(){Sound.tap();rulesModal()};
  nn.onclick=function(){Sound.tap();startNew()};
  function syncEco(){var m=(GC.Gfx&&GC.Gfx.mode())||'std';ne.classList.toggle('on',m==='eco');ne.querySelector('span').textContent=m==='eco'?'省电':'画质'}
  syncEco();
  ne.onclick=function(){Sound.tap();var o=['eco','std','hi'],m=o[(o.indexOf(GC.Gfx.mode())+1)%3];GC.Sound.cfg.gfx=m;GC.Sound.save();GC.Gfx.apply();syncEco();UI.toast(GC.Gfx.NAMES[m],1600,'info')};
  if(S.phase==='setup'||!S.players||!S.players.length)startSelect();
  else{buildBoard();render();fit()}
  if(window.ResizeObserver){ro=new ResizeObserver(function(){fit()});ro.observe(root)}else window.addEventListener('resize',fit);
  fit();
 },
 unmount:function(){timers.forEach(clearTimeout);timers=[];if(ro)ro.disconnect();ro=null;if(S)save();if(selv){try{selv.remove()}catch(e){}}selv=null;document.documentElement.classList.remove('rb-land');fxLayer=null;root=null},
 api:api
};
})();
