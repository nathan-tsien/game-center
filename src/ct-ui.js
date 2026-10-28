/* ======================= GAME 4: 大富翁·中国之旅 (电子版) ======================= */
var CT=(function(){
 var E=window.CTE,DATA=E.DATA,SQ=DATA.squares;
 E.setRng(function(n){return Dice.int(n)});
 var TKN=E.TKN.slice(),LM=window.CTE_LM,LN=window.CTE_LINES,TKC=['#2f80ed','#f2b705','#e53935','#ff4fa3','#1fae5b','#8e44ec']; // v19: 6 clearly distinct owner colours (blue/gold/red/pink/green/purple), shared by board + chips
 var CFGS=[
  ['maxRerolls','每回合可重掷',[[0,'不能重掷'],[1,'1 次'],[3,'3 次'],[5,'5 次'],[-1,'不限']],'掷完骰子后可以选「再掷一次」,每回合最多几次(给小朋友多几次机会,默认 3 次)'],
  ['penaltyManual','罚款确认',[[true,'每次手动确认支付'],[false,'付得起就自动付']],'楼市暴跌、机会卡罚款等要付钱的倒霉事,默认弹出原因和金额,点「确认支付」才扣钱'],
  ['startManual','起点奖励',[[true,'手动点「领取」'],[false,'自动领取']],'经过或走到起点,默认弹出「领取 ¥2000」,点了才拿钱'],
  ['rentManual','租金确认',[[true,'每次手动确认支付'],[false,'付得起就自动付']],'走到别人地产要付观光费时,默认弹出地契和算式,玩家点「确认支付」才付,不受下面「自动处理」影响'],
  ['autoResolve','没得选的时候',[[true,'自动处理 + 气泡'],[false,'都要点确认']],'买不起、罚款、路过起点、付得起的观光费这类「没有选择」的事,自动办好并用气泡提示'],
  ['autoEnd','自动结束回合',[[true,'没得操作就自动换人'],[false,'一律手动结束']],'处理完后如果没有可做的事(没有能用的手牌、没有要抢救的危机),0.8 秒后自动换下一位,点一下可立刻跳过;有可操作的事时才显示「结束回合」按钮'],
  ['hotelRest','酒店歇息',[['stop','只有停在酒店'],['pass','路过也歇息']],'说明书写「路过酒店,在此歇息一轮」,棋盘写「休息一轮」,不确定'],
  ['feeTo','机会卡罚款去向',[['bank','给银行'],['pot','进奖池']],'卡上没写付给谁。进奖池:谁坐到「休息椅」就领走奖池'],
  ['angelLevels','天使降临提升',[[1,'1 级'],[2,'2 级'],[3,'3 级']],'卡上只写「提升房屋等级」,没写几级(待核实)'],
  ['angelScope','天使降临范围',[['own','只提升自己的'],['all','所有人的']],'卡上没说是谁的地产(待核实)'],
  ['monster','怪兽来袭拆多少',[['one','拆 1 级'],['all','全部拆光']],'卡上只写「拆除任意一处房产」(待核实)'],
  ['groupBy','同色系按',[['card','契约卡颜色'],['strip','棋盘价格条颜色']],'契约卡颜色和棋盘价格条颜色不一样,不知道规则指哪个(待核实)'],
  ['mortRent','抵押中的地产',[[false,'不收观光费'],[true,'照常收费']],'说明书没写'],
  ['buildAnywhere','盖房时机',[[false,'停在自己地产/升级格'],[true,'随时可盖']],'说明书:停在自己的地产时才能盖'],
  ['refundPct','拆房退款',[[0,'不退'],[50,'退一半'],[100,'全退']],'说明书没有拆房规则,这是自定义'],
  ['lostEffect','丢失物品退回后',[['land','照常结算那座城市'],['none','不触发']],'说明书没写;默认退回的城市照常结算(别人的地要付观光费,无主可买,自己的可盖房)'],
  ['finFx','状态特效',[[true,'开'],[false,'关']],'危险时抖动红框、富裕时金光皇冠、危机时刻提示和各种小动画'],
  ['finSound','状态音效',[[true,'开'],[false,'关']],'危险时的心跳声、变富的金币声、翻身的欢呼声(总音效关掉时也不响)'],
  ['dangerAbs','危险线(现金低于)',[[500,'¥500'],[1000,'¥1000'],[2000,'¥2000']],'现金低于这个数就是「危险」,会显示「快破产啦!」'],
  ['rentAhead','前方观光费也算危险',[[true,'算'],[false,'不算']],'现金不够付前方 6 格内最贵的别人的观光费,也算危险'],
  ['tenseAbs','紧张线(现金低于)',[[2000,'¥2000'],[3000,'¥3000'],[5000,'¥5000']],'低于这个数是「紧张」(橙色提醒)'],
  ['richPct','富裕线(起始的)',[[120,'1.2 倍'],[150,'1.5 倍'],[200,'2 倍']],'现金达到起始金额的这个倍数就是「富裕」(小富翁);遥遥领先也算'],
  ['tycoonPct','富豪线(起始的)',[[200,'2 倍'],[300,'3 倍'],[400,'4 倍']],'达到就是「富豪」(大富翁),3 倍以上是「富可敌国」'],
  ['luckyRoll','翻身机会',[[true,'开'],[false,'关']],'付不起钱、要破产前,每人每局 1 次幸运骰:掷到 5 得 ¥500,6 得 ¥1000'],
  ['loanOn','玩家互动',[[true,'开'],[false,'关']],'借钱、送红包、卖房子(在「互动」按钮或「资产」里)'],
  ['loanRounds','借款期限',[[2,'2 轮'],[3,'3 轮'],[5,'5 轮']],'借的钱几轮后到期;到期时轮到借款人会自动还(钱不够先还一部分,剩下的以后继续还)'],
  ['deckMode','用过的机会卡',[['bottom','放回牌堆底'],['reshuffle','弃牌后重洗']],'说明书:放回牌堆底部']
 ];
 var HOLDSHORT={2:'遥控骰子',5:'拿来把你',8:'龟速前进',10:'乘坐高铁',11:'睡吧睡吧',14:'免费1次',21:'时光机'};
 var RULETXT={'起点':'每次路过或停在起点,银行奖励 ¥2000。','机会':'抽一张机会卡,翻开、确认后按卡片执行。','天降横财':'再掷骰 1 次,获得 点数×100 的奖金。','休息椅':'公共座椅,在此休息一轮。','升级房产':'选自己的 1 处地产盖房或升级;没有地产就轮空。','再掷一次':'重新掷一次骰子。','飞机场':'乘飞机前往任意城市(也可以不飞)。沿棋盘前进路过起点时同样领取 ¥2000。','楼市暴跌':'遭遇楼市暴跌,损失 ¥1000。','丢失物品':'丢了东西,返回上一座城市寻找。','酒店':'酒店休息一轮。'};
 var entryOpen=false,bubs={},autoEndTimer=null,crisisOpen=false,crisisQ=[];
 var G,S,root,busy=false,shown={},cashShown={},sync={on:false,pid:null},ro=null,shownKey='',dieVal=null,timers=[],selv=null,lastToastTurn=null;
 var esc=UI.esc;
 function fmt(n){n=Math.round(n);return (n<0?'-':'')+String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',')}
 function Y(n){return '¥'+fmt(n)}
 function $q(s){return root.querySelector(s)}
 function later(f,ms){var t=setTimeout(f,ms);timers.push(t);return t}
 function wait(ms){return new Promise(function(r){later(r,UI.reduce()?Math.min(ms,30):ms)})}
 /* ---------- v23 line pacing: nothing auto-advances (turn switch, next banner) until the current line is over + a breath ----------
    voice on  → wait for the clip's ended (Voice.busy / lastEnd; TTS onend with a length cap)
    voice off → bubble read time 1.5 s + 0.12 s/char (≤ 4 s). A tap skips the wait; auto-advance never cuts a line. */
 var readUntil=0,skipAt=0,TL=[];
 function tl(k,x){var e={k:k,t:Date.now()};if(x)for(var i in x)e[i]=x[i];TL.push(e);if(TL.length>120)TL.shift()}
 function PAUSE(){return UI.reduce()?250:Math.round(900*((GC.Intro&&GC.Intro.speed)?GC.Intro.speed():1))}
 function readMs(txt){return Math.min(4000,1500+120*String(txt||'').length)}
 function lineFree(){var V=GC.Voice;if(V&&V.busy&&V.busy())return false;var le=V&&V.lastEnd?V.lastEnd():0;
  if(skipAt&&skipAt>=le&&readUntil<=skipAt)return true;
  return Date.now()>=Math.max(readUntil,le)+PAUSE()}
 function skipLine(){skipAt=Date.now();readUntil=0;try{GC.Voice.cancel()}catch(x){}tl('skip')}
 function lineGate(){return new Promise(function(res){
  if(lineFree()){res();return}
  var done=false,t0=Date.now();function fin(){if(done)return;done=true;document.removeEventListener('pointerdown',tap,true);res()}
  function tap(){skipLine();fin()}
  document.addEventListener('pointerdown',tap,true);
  (function poll(){if(done)return;if(lineFree()||Date.now()-t0>15000){fin();return}later(poll,100)})()})}
 function P(id){return E.P(S,id)}
 /* v29: mood expression chips (CT_AV_MOOD); proud→happy face */
 function avSrc(tok,mood){var M=window.CT_AV_MOOD,A=window.CT_AV,k=mood==='proud'?'happy':mood;if(k&&M&&M[k]&&M[k][tok])return M[k][tok];if(A&&A[tok])return A[tok];return null}
 function persistMood(p){if(!p||p.out)return null;if(p.rest>0||p.sleep>0)return 'sleep';var f=fxOn()?E.finState(S,p.id):null;if(f&&f.id==='danger')return 'worried';if(f&&(f.id==='rich'||f.id==='tycoon'))return 'happy';return null}
 function tkAv(tok,sz,cls,mood){var src=avSrc(tok,mood),inn=src?'<img class="tkimg" src="'+src+'" alt="" draggable="false" decoding="async">':'<svg viewBox="-24 -24 48 48"><use href="#tk'+tok+'"/></svg>';return '<span class="tkm '+(cls||'')+'"'+(mood?' data-mood="'+mood+'"':'')+' style="width:'+sz+'px;height:'+sz+'px">'+inn+'</span>'}
 function pTok(id){var p=P(id);return p?tkAv(p.tok,34,null,persistMood(p)):''}
 function pName(id){var p=P(id);return p?esc(p.name):'?'}
 /* ---------- persistence ---------- */
 function save(){if(S)S.sv=Date.now();Store.set('china',S)}
 function load(){
  var s=Store.get('china',null);
  if(s&&s.v===2&&s.players&&s.props){S=E.normalize(s);S.ev=[]}else{S=E.newState();}
  G=E.createGame(S);S=G.S;
 }
 function newGameState(){var old=S;S=E.newState({cfg:old.cfg,ov:old.ov});G=E.createGame(S);S=G.S;shown={};cashShown={};bubs={};dieVal=null;crisisQ=[];crisisOpen=false;sync.on=false;clearTimeout(autoEndTimer);dropBanner();save()}
 /* ---------- geometry ---------- */
 function cellRC(i){if(i<=9)return[11,9-i];if(i<=19)return[10-(i-10),0];if(i<=29)return[0,i-20];return[1+(i-30),9]}
 function side(i){return i<=9?'b':i<=19?'l':i<=29?'t':'r'}
 /* ---------- small SVG helpers ---------- */
 function lvSVG(l){
  if(!l)return '';
  if(l===4)return '<svg class="lvs r" viewBox="-12 -12 24 24"><use href="#hotelR"/></svg>';
  var s='';for(var i=0;i<l;i++)s+='<svg class="lvs" viewBox="-12 -12 24 24"><use href="#houseG"/></svg>';return s;
 }
 var SQI={
  '起点':'<path d="M19 12H6M11 7l-5 5 5 5"/>','机会':'<path d="M9.5 9a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1 1-1.1 1.8M12 17v.3"/>','天降横财':'<circle cx="12" cy="12" r="7.5"/><path d="M9.5 9 12 12.5 14.5 9M12 12.5V17M9.5 13.5h5"/>',
  '休息椅':'<path d="M5 11h14v4H5zM7 15v4M17 15v4M6 11V6h12v5"/>','升级房产':'<path d="M4 12 12 5l8 7M7 10.5V19h10v-8.5M12 17v-5M9.5 14.5 12 12l2.5 2.5"/>','再掷一次':'<rect x="4.5" y="4.5" width="15" height="15" rx="4"/><circle cx="9" cy="9" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="15" cy="9" r="1.3"/><circle cx="9" cy="15" r="1.3"/>',
  '飞机场':'<path d="M12 3c1 0 1.5 1.5 1.5 4l7 5.5V15l-7-2v4l2 1.7V21L12 20l-3.5 1v-1.3L10.5 17v-4l-7 2v-2.5L10.5 7c0-2.5.5-4 1.5-4z"/>','楼市暴跌':'<path d="M4 6l5 6 3-3 7 8M19 12v5h-5"/>','丢失物品':'<path d="M15 6 9 12l6 6M6 12h12"/><circle cx="18" cy="6" r="1.5"/>','酒店':'<path d="M4 18V8M4 15h16v3M4 12h9a3 3 0 0 1 3 3M7.5 10.5a1.5 1.5 0 1 1 0 .1"/>'
 };

 var SQC={
  '天降横财':'<g class="an coin c1"><circle cx="11" cy="9" r="4.5" fill="#ffd23f"/><path d="M11 7v4" stroke-width="1.6"/></g><g class="an coin c2"><circle cx="38" cy="7" r="4.5" fill="#ffd23f"/><path d="M38 5v4" stroke-width="1.6"/></g><g class="an coin c3"><circle cx="24" cy="4" r="3.6" fill="#ffd23f"/></g><g class="an bag"><path d="M17 18c-4 3-8 8-8 14 0 7 6 11 15 11s15-4 15-11c0-6-4-11-8-14l3-6c-3-1.5-6 1-10 1s-7-2.500-10-1z" fill="#c98a3d"/><path d="M18 17c3 2 9 2 12 0" fill="none"/><text x="24" y="38" font-size="16" font-weight="900" text-anchor="middle" fill="#ffe36b" stroke="none">¥</text></g>',
  '机会':'<g class="an card"><rect x="10" y="5" width="28" height="38" rx="5" fill="#fff"/><rect x="14" y="9" width="20" height="30" rx="3" fill="#ffb347" stroke="none"/><text x="24" y="33" font-size="24" font-weight="900" text-anchor="middle" fill="#fff" stroke="none">?</text></g><path class="an spk" d="M40 7l1.6 3.600L45 12l-3.400 1.600L40 17l-1.600-3.400L35 12l3.400-1.400z" fill="#fff36b" stroke-width="1.2"/>',
  '休息椅':'<g class="an chair"><rect x="11" y="7" width="26" height="17" rx="7" fill="#ff8fb8"/><rect x="7" y="22" width="34" height="11" rx="5.500" fill="#ff5fa8"/><path d="M13 33v9M35 33v9" stroke-width="3.500"/></g><text class="an z" x="35" y="12" font-size="12" font-weight="900" fill="#fff" stroke="none">z</text><text class="an z z2" x="40" y="7" font-size="9" font-weight="900" fill="#fff" stroke="none">z</text>',
  '升级房产':'<g class="an house"><path d="M5 25 23 9l18 16z" fill="#e8483c"/><rect x="9" y="25" width="28" height="17" fill="#fff3c9"/><rect x="19" y="30" width="9" height="12" fill="#7a4b2a"/></g><path class="an up" d="M41 22V6M35 12l6-6 6 6" stroke="#2fcf6a" stroke-width="4.500" fill="none"/>',
  '酒店':'<rect x="11" y="15" width="26" height="27" rx="2" fill="#fff"/><g fill="#ffd23f" stroke-width="1.400"><rect x="15" y="19" width="6" height="5"/><rect x="27" y="19" width="6" height="5"/><rect x="15" y="27" width="6" height="5"/><rect x="27" y="27" width="6" height="5"/></g><rect x="20" y="35" width="8" height="7" fill="#7a4b2a"/><g class="an bell"><path d="M18 12a6 6 0 0 1 12 0z" fill="#ffc400"/><circle cx="24" cy="14" r="1.800" fill="#ffc400"/><path d="M24 4v2"/></g>',
  '起点':'<path d="M13 43V5" stroke-width="3.500"/><path class="an flag" d="M13 6h26l-7 8 7 8H13z" fill="#ffd23f"/><path d="M6 43h16" stroke-width="3.500"/>',
  '丢失物品':'<g class="an case"><rect x="7" y="17" width="34" height="25" rx="5" fill="#ff9d3b"/><path d="M17 17v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" fill="none"/><rect x="7" y="27" width="34" height="3.500" fill="#c96a10"/><rect x="21" y="25" width="6" height="8" rx="1.500" fill="#ffe36b"/></g><text class="an q" x="39" y="12" font-size="15" font-weight="900" fill="#fff" stroke="none">?</text>',
  '楼市暴跌':'<g class="an dn"><path d="M5 9l12 12 8-6 13 15" fill="none" stroke="#3b2b2b" stroke-width="9"/><path d="M5 9l12 12 8-6 13 15" fill="none" stroke="#ff3b30" stroke-width="5"/><path d="M42 24v18H24z" fill="#ff3b30"/></g>',
  '再掷一次':'<g class="an dice"><rect x="8" y="8" width="32" height="32" rx="8" fill="#fff"/><g fill="#ff5fa8" stroke="none"><circle cx="17" cy="17" r="3"/><circle cx="31" cy="17" r="3"/><circle cx="24" cy="24" r="3"/><circle cx="17" cy="31" r="3"/><circle cx="31" cy="31" r="3"/></g></g>',
  '飞机场':'<g class="an plane"><path d="M24 3c2.500 0 3.500 3.500 3.500 9L43 24v5l-15.500-4.500v8l5.500 4.500v3.500L24 38.500 15 41.500V38l5.500-4.500v-8L5 29v-5l15.500-12c0-5.500 1-9 3.500-9z" fill="#fff"/><path d="M24 8v8" stroke="#35a7e0" stroke-width="3"/></g>'
 };
 function sqIcon(n){return SQC[n]?'<svg class="si c" viewBox="0 0 48 48">'+SQC[n]+'</svg>':'<svg class="si" viewBox="0 0 24 24">'+(SQI[n]||'')+'</svg>'}

 /* ---------- board ---------- */
 function cellInner(s){return '<i class="strip"><b>'+s.price+'</b></i><div class="sb"><div class="lmw">'+LM.svg(s.name)+'<span class="own"></span><span class="lvl"></span></div><span class="nm">'+s.name+'</span></div><span class="mt"></span>'}
 function paintCell(el,q,otok){
  var own=el.querySelector('.own'),lv=el.querySelector('.lvl'),o=q.owner!=null?P(q.owner):null,tok=otok!=null?otok:(o?o.tok:null);
  if(tok!=null){el.style.setProperty('--oc',TKC[tok]);el.classList.add('owned');var om=o?persistMood(o):null,src=avSrc(tok,om),art=src?'<img class="tkimg" src="'+src+'" alt="">':'<svg viewBox="-24 -24 48 48"><use href="#tk'+tok+'"/></svg>';var ok=String(tok)+'|'+(om||'');if(el.getAttribute('data-otok')!==ok){el.setAttribute('data-otok',ok);own.innerHTML=art}}
  else{el.classList.remove('owned');el.removeAttribute('data-otok');own.innerHTML=''}
  var lvK=String(q.lvl||0);if(lv.getAttribute('data-k')!==lvK){lv.setAttribute('data-k',lvK);lv.innerHTML=lvSVG(q.lvl)}el.classList.toggle('mort',!!q.mort);el.classList.toggle('hotel',q.lvl===4);
  /* v21: building bar — the price strip becomes N houses + ×N (民宿) or a 度假村 badge once built */
  var st=el.querySelector('.strip'),sd=SQ[+el.getAttribute('data-i')],bl=tok!=null&&q.lvl>0?q.lvl:0,bk=bl+'|'+(sd?sd.price:'');
  var okey=(tok!=null?tok:'-')+(q.mort?'m':'');if(el.getAttribute('data-o')!==okey){el.setAttribute('data-o',okey);var nm2=el.querySelector('.nm');if(nm2&&root)fitOne(nm2)}
  for(var lv4=0;lv4<5;lv4++)el.classList.toggle('lv'+lv4,tok!=null&&q.lvl===lv4);
  if(st&&st.getAttribute('data-k')!==bk){st.setAttribute('data-k',bk);
   if(!bl){st.className='strip';st.innerHTML='<b>'+(sd?sd.price:'')+'</b>'}
   else if(bl===4){st.className='strip bbar r4';st.innerHTML='<svg class="bh r" viewBox="-12 -12 24 24"><use href="#hotelR"/></svg><em class="lvt">度假村</em>'}
   else{var hs='';for(var k=0;k<bl;k++)hs+='<svg class="bh" viewBox="-10 -10 20 20"><use href="#houseG"/></svg>';st.className='strip bbar';st.innerHTML='<span class="bhs">'+hs+'</span><em class="bdg">×'+bl+'</em>'}}
  var nm=el.querySelector('.nm');if(nm)el.setAttribute('title',nm.textContent+(tok!=null?' · '+TKN[tok]:' · 空地')+(q.lvl?' · '+E.LVN[q.lvl]:'')+(q.mort?' · 抵押中':''));
 }
 function buildBoard(){
  var b=$q('#ctb'),h='';
  SQ.forEach(function(s){
   var rc=cellRC(s.i),sd=side(s.i),st='grid-row:'+(rc[0]+1)+';grid-column:'+(rc[1]+1);
   if(s.type==='property'){
    h+='<div class="sq prop s'+sd+'" data-i="'+s.i+'" style="'+st+';--sc:'+s.stripHex+'">'+cellInner(s)+'</div>';
   }else{
    var cls=s.type==='chance'?'chance':(s.type==='corner'?'corner':s.type==='airport'?'air':'event');
    var sub=s.name==='起点'?'+2000':s.name==='楼市暴跌'?'-1000':'';
    h+='<div class="sq sp '+cls+' n'+s.i+' s'+sd+'" data-i="'+s.i+'" style="'+st+'" data-n="'+s.name+'">'+sqIcon(s.name)+'<span class="nm">'+s.name+'</span>'+(sub?'<small>'+sub+'</small>':'')+'</div>';
   }
  });
  h+='<div class="ctc"><svg class="deco" viewBox="0 0 80 100" preserveAspectRatio="xMidYMid slice"><rect x="6" y="14" width="68" height="72" rx="6" fill="#fdf3d2" stroke="#222" stroke-width="1.4"/>'+
   '<rect x="8" y="16" width="22" height="22" rx="3" fill="#ffc94a"/><rect x="50" y="16" width="22" height="22" rx="3" fill="#59c767"/><rect x="8" y="62" width="22" height="22" rx="3" fill="#6fb8f2"/><rect x="50" y="62" width="22" height="22" rx="3" fill="#f2584d"/>'+
   '<g fill="#fff"><circle cx="15" cy="23" r="3"/><circle cx="23" cy="23" r="3"/><circle cx="15" cy="31" r="3"/><circle cx="23" cy="31" r="3"/><circle cx="57" cy="23" r="3"/><circle cx="65" cy="23" r="3"/><circle cx="57" cy="31" r="3"/><circle cx="65" cy="31" r="3"/><circle cx="15" cy="69" r="3"/><circle cx="23" cy="69" r="3"/><circle cx="15" cy="77" r="3"/><circle cx="23" cy="77" r="3"/><circle cx="57" cy="69" r="3"/><circle cx="65" cy="69" r="3"/><circle cx="57" cy="77" r="3"/><circle cx="65" cy="77" r="3"/></g>'+
   '<g fill="none" stroke="#222" stroke-width=".5"><path d="M30 18h20v20H30zM30 62h20v20H30z"/></g>'+
   '<g><rect x="32" y="40" width="4" height="20" fill="#59c767"/><rect x="44" y="40" width="4" height="20" fill="#f2584d"/><rect x="8" y="46" width="24" height="4" fill="#ffc94a"/><rect x="48" y="50" width="24" height="4" fill="#f2584d"/><rect x="8" y="50" width="24" height="4" fill="#6fb8f2"/><rect x="48" y="46" width="24" height="4" fill="#59c767"/></g><path d="M34 46 40 50 46 46 40 54Z" fill="#ffd23f" stroke="#222" stroke-width=".6"/></svg>'+
   '<div class="pad pt"><b>机会</b><small>剩余 <em id="ctDeck">24</em> 张</small></div><div class="pad pb"><b>机会</b></div><div class="ctui" id="ctui"></div></div><div id="ctok"></div><div id="ctbub"></div>';
  b.innerHTML=h;
  Array.prototype.forEach.call(b.querySelectorAll('.sq'),function(el){el.onclick=function(){cellTap(+el.getAttribute('data-i'))}});
  b.querySelector('.pt').onclick=function(){UI.toast('机会卡堆还剩 '+S.deck.q.length+' 张,在「机会」格抽取',1800,'info')};
 }
 function tokPos(i,k,m){
  var rc=cellRC(i),offs=[[[0,0]],[[-.2,0],[.2,0]],[[-.22,-.16],[.22,-.16],[0,.2]],[[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]],[[-.22,-.22],[.22,-.22],[0,0],[-.22,.22],[.22,.22]],[[-.24,-.24],[0,-.24],[.24,-.24],[-.24,.2],[0,.2],[.24,.2]]];
  var o=(offs[Math.min(m,6)-1]||offs[5])[k]||[0,0];
  return{l:(rc[1]+.5)*10+'%',t:(rc[0]+.5)/12*100+'%',dx:o[0],dy:o[1]};
 }
 function renderTokens(){
  var layer=$q('#ctok'),act=E.active(S),by={};
  act.forEach(function(p){var s=shown[p.id]!=null?shown[p.id]:p.pos;(by[s]=by[s]||[]).push(p)});
  var want={};
  Object.keys(by).forEach(function(sq){by[sq].forEach(function(p,k){
   want[p.id]=1;var el=layer.querySelector('.tok[data-p="'+p.id+'"]');
   if(!el){el=document.createElement('div');el.className='tok';el.setAttribute('data-p',p.id);layer.appendChild(el);el.classList.add('pop')}
   var pm=persistMood(p),src=avSrc(p.tok,pm),art=src?'<img class="tkimg" src="'+src+'" alt="" draggable="false">':'<svg viewBox="-24 -24 48 48"><use href="#tk'+p.tok+'"/></svg>';
   var key=String(p.tok)+'|'+(pm||'');
   var need=el.getAttribute('data-tok')!=key;
   if(!need){var img=el.querySelector('img.tkimg');need=!!src&&(!img||img.getAttribute('src')!==src)}
   if(need){el.setAttribute('data-tok',key);el.setAttribute('data-mood',pm||'');el.innerHTML=art}
   var q=tokPos(+sq,k,by[sq].length);el.style.left=q.l;el.style.top=q.t;el.style.setProperty('--dx',q.dx);el.style.setProperty('--dy',q.dy);
   var tf=fxOn()?E.finState(S,p.id):null;['danger','tense','rich','tycoon'].forEach(function(k){el.classList.toggle('fs-'+k,!!tf&&tf.id===k)});el.classList.toggle('fs-sleep',!!(p.rest>0||p.sleep>0));
   var isc=p.id===S.turn&&S.phase==='play';el.classList.toggle('cur',isc);el.classList.toggle('dim',!isc&&S.phase==='play');el.classList.toggle('sm',by[sq].length>1);el.style.zIndex=isc?5:2;el.style.setProperty('--hc',TKC[p.tok]);
   if(isc)hereMark(+sq,p,q);
   el.setAttribute('aria-label',p.name+' 在 '+SQ[+sq].name);
  })});
  Array.prototype.forEach.call(layer.querySelectorAll('.tok'),function(el){if(!want[el.getAttribute('data-p')])el.remove()});
  var mk=layer.querySelector('.heremk');if(mk&&!(S.phase==='play'&&want[S.turn]))mk.remove();
 }
 /* v19: bouncing arrow over the current player's square (below it on the top row so it stays on the board) */
 function hereMark(i,p,q){var layer=$q('#ctok'),mk=layer.querySelector('.heremk');
  if(!mk){mk=document.createElement('div');mk.className='heremk';mk.innerHTML='<svg viewBox="0 0 24 28"><path d="M12 27 2 13h6V2h8v11h6z"/></svg>';layer.appendChild(mk)}
  var top=side(i)==='t';mk.classList.toggle('up',top);mk.style.left=q.l;mk.style.top='calc('+q.t+(top?' + ':' - ')+'var(--ch,8.33%) * .62)';mk.style.setProperty('--hc',TKC[p.tok])}
 function renderCells(){
  var cp=S.phase==='play'?E.cur(S):null;
  Array.prototype.forEach.call(root.querySelectorAll('.sq.prop'),function(el){
   var n=SQ[+el.getAttribute('data-i')].name,q=S.props[n];
   paintCell(el,{owner:(q.owner!=null&&P(q.owner)&&!P(q.owner).out)?q.owner:null,lvl:q.lvl,mort:q.mort});
  });
  var pd=S.pend,dec=!!(cp&&pd&&pd.pid===cp.id&&(pd.t==='buy'||pd.t==='build'||(pd.t==='pay'&&pd.reason==='rent')));
  Array.prototype.forEach.call(root.querySelectorAll('.sq'),function(el){var i=+el.getAttribute('data-i'),hr=!!cp&&cp.pos===i&&!sync.on;el.classList.toggle('here',hr);el.classList.toggle('decide',hr&&dec);if(hr)el.style.setProperty('--hc',TKC[cp.tok]);el.classList.toggle('syncable',sync.on);
   var sqd=SQ[i],q=sqd.type==='property'?S.props[sqd.name]:null;el.classList.toggle('mine',!!(cp&&q&&q.owner===cp.id));el.classList.toggle('free',!!(q&&q.owner==null))});
  var d=$q('#ctDeck');if(d)d.textContent=S.deck.q.length;
 }
 /* ---------- fit board to the viewport ---------- */
 function fit(){
  if(!root)return;var W=root.clientWidth,H=root.clientHeight;if(!W||!H)return;
  var land=W>H*1.12&&W>=900,cw,b=$q('#ctb'),de=document.documentElement,sd=root.querySelector('.ctside');
  root.classList.toggle('land',land);de.classList.toggle('ct-land',land);de.classList.remove('ct-mside');
  if(land){
   /* v13: 横屏平板 — 棋盘铺满全屏(拉伸到屏幕比例),玩家信息浮在棋盘中央空白区 */
   var bw=W-8,bh=H-4,cx=bw/10,cy=bh/12;cw=Math.max(18,Math.floor(Math.min(cy*1.12,cx*.78)*10)/10);
   root.style.setProperty('--cw',cw+'px');b.style.width=bw+'px';b.style.height=bh+'px';
   if(sd){var L=4+cx*5.35,T=2+cy+8;sd.style.left=L+'px';sd.style.top=T+'px';sd.style.width=(4+cx*9-L-8)+'px';sd.style.height=(cy*10-16)+'px'}
   var nav=document.getElementById('nav');de.style.setProperty('--ctx',(4+cx*7.17)+'px');de.style.setProperty('--ctxw',(cx*3.4)+'px');de.style.setProperty('--ctt',((nav?nav.getBoundingClientRect().bottom:50)+cy+12)+'px');
  }else{
   cw=Math.min((W-6)/10,(H*(H>=1000?.7:.62))/12);if(W>H*1.12)cw=Math.min((H-6)/12,(W*.58)/10);
   cw=Math.max(18,Math.floor(cw*10)/10);root.style.setProperty('--cw',cw+'px');b.style.width=cw*10+'px';b.style.height=cw*12+'px';
   if(sd)sd.style.left=sd.style.top=sd.style.width=sd.style.height='';
  }
  if(sd&&!sd.querySelector('#ctFold')){var fb=document.createElement('button');fb.id='ctFold';fb.className='ctfold';fb.textContent='收起';fb.onclick=function(){var f=root.classList.toggle('fold');fb.textContent=f?'玩家':'收起'};var ph=sd.querySelector('.ctph');ph&&ph.appendChild(fb)}
  fitNames();
  if(!fit.bound){fit.bound=1;window.addEventListener('hashchange',function(){if(!/china/.test(location.hash))de.classList.remove('ct-land')})}
 }
 /* v14: 名字过长时自动缩小字号,保证完整显示 */
 function fitOne(e){e.style.fontSize='';e.style.letterSpacing='';var w=e.clientWidth,sw=e.scrollWidth;if(w&&sw>w+.5){var f=parseFloat(getComputedStyle(e).fontSize);e.style.fontSize=Math.max(8,Math.floor(f*w/sw*10)/10-.2)+'px'}}
 function fitNames(){if(!root)return;Array.prototype.forEach.call(root.querySelectorAll('.sq .nm,.sq.sp small'),fitOne)}
 /* ---------- panels ---------- */


 /* ---------- 到达格子特效 (v9): 落地时触发,不阻塞流程,点屏幕可跳过 ---------- */
 var sqSkipBound=false;
 function sqSkip(){Array.prototype.forEach.call(document.querySelectorAll('.sqfx'),function(x){x.remove()});Array.prototype.forEach.call(document.querySelectorAll('.sq.fxon'),function(x){x.classList.remove('fxon')});var b=document.getElementById('ctb');if(b)b.classList.remove('crash')}
 function sqLayer(){var d=document.createElement('div');d.className='ctfx sqfx';document.body.appendChild(d);if(!sqSkipBound){sqSkipBound=true;document.addEventListener('pointerdown',sqSkip,true)}later(function(){d.remove()},1500);return d}
 function sqGeo(i){var c=root&&root.querySelector('.sq[data-i="'+i+'"]'),bd=$q('#ctb');if(!c||!bd)return null;var r=c.getBoundingClientRect(),b=bd.getBoundingClientRect();return{c:c,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,bx:b.left,by:b.top,bw:b.width,bh:b.height}}
 function dots(l,x,y,n,dist,cols,cls){var h='';for(var k=0;k<n;k++){var a=k/n*6.283;h+='<i class="'+(cls||'sqd')+'" style="left:'+x+'px;top:'+y+'px;--dx:'+Math.round(Math.cos(a)*dist)+'px;--dy:'+Math.round(Math.sin(a)*dist)+'px;background:'+cols[k%cols.length]+';animation-delay:'+(k%3)*.04+'s"></i>'}l.insertAdjacentHTML('beforeend',h)}
 function sqFx(i,pid){
  var sq=SQ[i];if(!sq||sq.type==='property'||!root)return;
  var n=sq.name,t=sq.type,g=sqGeo(i);if(!g)return;
  var key=t==='chance'?'机会':n;
  // sounds are independent of the visual toggle
  if(key==='天降横财')Sound.seq([[1319,.07,.06],[1568,.07,.06],[1319,.07,.06],[1760,.14,.06]]);
  else if(key==='机会')Sound.seq([[784,.07,.07],[988,.07,.07],[1319,.12,.07]]);
  else if(key==='休息椅')Sound.seq([[330,.2,.2],[262,.3,.2]]);
  else if(key==='升级房产'){Sound.beep(220,.05,0,'square',.15);Sound.beep(240,.05,.14,'square',.15);Sound.seq([[784,.08,.08],[1047,.15,.08]])}
  else if(key==='酒店'){Sound.beep(1568,.5,0,'sine',.3);Sound.beep(2093,.4,.02,'sine',.12)}
  else if(key==='起点')Sound.seq([[523,.07,.07],[659,.07,.07],[784,.07,.07],[1047,.16,.07]]);
  else if(key==='楼市暴跌'){Sound.seq([[440,.1,.1],[330,.1,.1],[247,.1,.1],[165,.3,.1]]);Sound.vib([40,30,80])}
  else if(key==='丢失物品')Sound.seq([[600,.08,.07],[800,.08,.07],[1000,.12,.07]]);
  else if(key==='再掷一次')Sound.seq([[500,.05,.05],[620,.05,.05],[740,.05,.05],[880,.1,.05]]);
  else if(key==='飞机场')Sound.seq([[300,.12,.1],[420,.12,.1],[560,.2,.1]]);
  if(!fxOn()||UI.reduce())return;
  var l=sqLayer(),cols=['#ff4f9a','#ffd23f','#3a7bff','#2bb673','#ff8a1f'],h='',k;
  g.c.classList.add('fxon');later(function(){g.c.classList.remove('fxon')},1300);
  if(key==='天降横财'){for(k=0;k<16;k++)h+='<i class="sqcoin" style="left:'+(g.bx+(k+.5)/16*g.bw)+'px;top:'+g.by+'px;--h:'+Math.round(g.bh*(.5+(k%4)*.1))+'px;animation-delay:'+((k*37)%9)*.07+'s">¥</i>';l.innerHTML=h}
  else if(key==='机会'){for(k=0;k<3;k++)h+='<b class="sqq" style="left:'+(g.x+(k-1)*26)+'px;top:'+g.y+'px;animation-delay:'+k*.12+'s">?</b>';l.innerHTML=h;dots(l,g.x,g.y,10,g.w*.9,['#fff36b','#ffffff','#ffb347'])}
  else if(key==='休息椅'){var tk=root.querySelector('.tok[data-p="'+pid+'"]'),r=tk?tk.getBoundingClientRect():{left:g.x,top:g.y,width:0};for(k=0;k<3;k++)h+='<b class="sqz" style="left:'+(r.left+r.width/2+k*10)+'px;top:'+(r.top-4)+'px;animation-delay:'+k*.3+'s;font-size:'+(15+k*5)+'px">Z</b>';h+='<span class="sqyawn" style="left:'+(r.left+r.width/2)+'px;top:'+(r.top-30)+'px">啊~呵欠</span>';l.innerHTML=h}
  else if(key==='升级房产'){dots(l,g.x,g.y,12,g.w*.8,['#ffd23f','#ff8a1f','#fff'],'sqd spark');l.insertAdjacentHTML('beforeend','<b class="sqham" style="left:'+(g.x+g.w*.2)+'px;top:'+(g.y-g.w*.5)+'px">🔨</b>')}
  else if(key==='酒店'){var cx=[[.25,.3],[.75,.25],[.5,.55]];cx.forEach(function(c,j){var x=g.bx+g.bw*c[0],y=g.by+g.bh*c[1],q=document.createElement('div');q.className='sqfw';l.appendChild(q);dots(q,x,y,12,60,cols,'sqd fw');Array.prototype.forEach.call(q.children,function(d){d.style.animationDelay=j*.2+'s'})});l.insertAdjacentHTML('beforeend','<b class="sqt" style="left:'+g.x+'px;top:'+g.y+'px">叮~</b>')}
  else if(key==='起点'){for(k=0;k<26;k++)h+='<i class="sqcf" style="left:'+(g.bx+(k+.5)/26*g.bw)+'px;top:'+(g.by+g.bh*.55)+'px;background:'+cols[k%5]+';--dx:'+((k%7)-3)*14+'px;animation-delay:'+(k%6)*.05+'s"></i>';l.innerHTML=h}
  else if(key==='楼市暴跌'){var b=$q('#ctb');if(b){b.classList.remove('crash');void b.offsetWidth;b.classList.add('crash');later(function(){b.classList.remove('crash')},600)}l.innerHTML='<div class="sqcrash" style="left:'+g.bx+'px;top:'+g.by+'px;width:'+g.bw+'px;height:'+g.bh+'px"><svg viewBox="0 0 100 70"><path d="M8 8l30 28 18-14 36 38" fill="none" stroke="#3b2b2b" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8l30 28 18-14 36 38" fill="none" stroke="#ff3b30" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg><b>暴跌!</b></div>'}
  else if(key==='丢失物品'){l.innerHTML='<svg class="sqfly" viewBox="0 0 48 48" style="left:'+g.x+'px;top:'+g.y+'px;width:'+g.w*.8+'px;height:'+g.w*.8+'px">'+SQC['丢失物品']+'</svg>'}
  else if(key==='再掷一次'){l.innerHTML='<svg class="sqdice" viewBox="0 0 48 48" style="left:'+g.x+'px;top:'+g.y+'px;width:'+g.w*.9+'px;height:'+g.w*.9+'px">'+SQC['再掷一次']+'</svg>';dots(l,g.x,g.y,10,g.w*1.1,cols)}
  else if(key==='飞机场'){l.innerHTML='<svg class="sqplane" viewBox="0 0 48 48" style="top:'+g.y+'px;--w:'+g.bw+'px;left:'+g.bx+'px;width:'+g.w*1.1+'px;height:'+g.w*1.1+'px">'+SQC['飞机场']+'</svg>'}
 }
 /* ---------- 财务状态: 徽章 / 特效 / 危机时刻 ---------- */
 function fxOn(){return S&&S.cfg.finFx!==false}
 function fsnd(f){if(S&&S.cfg.finSound!==false)f()}
 var CROWN='<svg class="crn" viewBox="0 0 24 24"><path d="M3 18 2 7l5 4 5-7 5 7 5-4-1 11z" fill="#ffc400" stroke="#c98a00" stroke-width="1.4" stroke-linejoin="round"/><circle cx="12" cy="4" r="1.6" fill="#ff5fa8"/><circle cx="2.4" cy="7" r="1.3" fill="#ff5fa8"/><circle cx="21.6" cy="7" r="1.3" fill="#ff5fa8"/></svg>';
 function finBadge(f,all){
  if(!f)return '';
  if(f.id==='danger')return all?'<i class="fsb d" title="'+esc(f.why)+'">快破产啦!</i>':'<i class="fsb d icb" title="快破产啦! '+esc(f.why)+'">⚠️</i>';
  if(f.id==='tense')return all?'<i class="fsb t" title="'+esc(f.why)+'">手头紧</i>':'<i class="fsb t icb" title="手头紧 · '+esc(f.why)+'">😰</i>';
  if(f.id==='rich'||f.id==='tycoon')return all?'<i class="fsb '+(f.id==='rich'?'r':'y')+'">'+CROWN+f.title+'</i>':'<i class="fsb '+(f.id==='rich'?'r':'y')+' icb" title="'+esc(f.title)+'">'+CROWN+'</i>';
  return all?'<i class="fsb n">状态正常</i>':'';
 }
 function finCls(f){return (fxOn()&&f)?' fs-'+f.id:''}
 function heart(){fsnd(function(){Sound.beep(150,.13,0,'sine',.42);Sound.beep(120,.16,.17,'sine',.38);Sound.beep(150,.13,.75,'sine',.42);Sound.beep(120,.16,.92,'sine',.38);Sound.vib([60,80,60])})}
 function fxLayer(kls){var d=document.createElement('div');d.className='ctfx '+kls;document.body.appendChild(d);later(function(){d.remove()},2600);return d}
 function rectOf(pid){var el=root&&(root.querySelector('.pc[data-pid="'+pid+'"] .av')||root.querySelector('.pc[data-pid="'+pid+'"]'));if(!el)return{x:innerWidth/2,y:innerHeight/2};var r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
 function fxPlay(pid,kind){
  if(!fxOn()||!root)return;var c=rectOf(pid),l,h='',i;c.x=Math.max(90,Math.min(innerWidth-90,c.x));c.y=Math.max(80,c.y);
  if(kind==='danger'){l=fxLayer('fxd');l.innerHTML='<b class="fxflash"></b><span class="fxt red" style="left:'+c.x+'px;top:'+c.y+'px">快破产啦!</span>'}
  else if(kind==='rich'||kind==='tycoon'){var nn=kind==='tycoon'?22:14;l=fxLayer('fxr');for(i=0;i<nn;i++){var a=i/nn*6.283,d=70+(i%3)*34;h+='<i class="fxc" style="left:'+c.x+'px;top:'+c.y+'px;--dx:'+Math.round(Math.cos(a)*d)+'px;--dy:'+Math.round(Math.sin(a)*d-40)+'px;animation-delay:'+(i%4)*.05+'s">¥</i>'}
   l.innerHTML=h+'<span class="fxt gold" style="left:'+c.x+'px;top:'+c.y+'px">'+(kind==='tycoon'?'大富翁!':'小富翁!')+'</span>'}
  else if(kind==='escape'){l=fxLayer('fxe');l.innerHTML='<i class="fxdrop" style="left:'+(c.x+16)+'px;top:'+(c.y-18)+'px"></i><span class="fxt blue" style="left:'+c.x+'px;top:'+c.y+'px">呼~ 好险!</span>'}
  else if(kind==='comeback'){l=fxLayer('fxb');for(i=0;i<22;i++)h+='<i class="fxcf" style="left:'+(c.x+(i-11)*14)+'px;top:'+(c.y-30)+'px;background:'+['#ff4f9a','#ffd23f','#3a7bff','#2bb673','#ff8a1f'][i%5]+';animation-delay:'+(i%6)*.07+'s"></i>';
   l.innerHTML=h+'<span class="fxt green" style="left:'+c.x+'px;top:'+c.y+'px">翻身啦!</span>'}
 }
 function fxCollect(pid,big){
  if(!root)return;var c=rectOf(pid),l,h='',i,nn=big?26:16;Sound.seq([[1047,.06,.0],[1319,.06,.06],[1568,.06,.12],[2093,.14,.18]]);Sound.vib(big?[40,40,80]:20);
  if(UI.reduce()){return}
  l=fxLayer('fxr gold'+(big?' big':''));for(i=0;i<nn;i++){var a=i/nn*6.283,d=60+(i%3)*(big?44:30);h+='<i class="fxc" style="left:'+c.x+'px;top:'+c.y+'px;--dx:'+Math.round(Math.cos(a)*d)+'px;--dy:'+Math.round(Math.sin(a)*d-40)+'px;animation-delay:'+(i%4)*.04+'s">'+(i%3?'¥':'✦')+'</i>'}
  l.innerHTML=h+'<span class="fxt gold" style="left:'+c.x+'px;top:'+c.y+'px">'+(big?'救命钱!':'+¥2000')+'</span>';
 }
 var bkSaid={};
 /* v20: character mood effects — game event → mood; plays at the player's avatar in an open popup, else at their board token, else their chip */
 var MOODOF={paidRent:'sad',fined:'sad',cantAfford:'worried',enterDanger:'worried',stillDanger:'worried',lendNo:'angry',receivedRent:'happy',passedStart:'happy',gotMoney:'happy',boughtProperty:'happy',thanks:'happy',comeback:'happy',escapedDanger:'happy',deal:'happy',builtUpgrade:'happy',enterRich:'proud',richBoast:'proud',win:'proud',bankruptcy:'sad',restTurn:'sleep'};
 function moodTarget(pid){var m=$('modal');if(m&&m.classList.contains('show')){var a=$('box').querySelector('.mwho[data-pid="'+pid+'"] .av');if(a&&a.getBoundingClientRect().width)return a}
  var t=root&&root.querySelector('.tok[data-p="'+pid+'"]');if(t&&t.getBoundingClientRect().width)return t;
  var c=root&&root.querySelector('.pc[data-pid="'+pid+'"] .av');return c&&c.getBoundingClientRect().width?c:null}
 /* v29: swap chip face to exaggerated mood (even in eco); do NOT abort FS if target missing */
 function flashMoodFace(pid,kind){var p=P(pid);if(!p)return;var src=avSrc(p.tok,kind);if(!src)return;
  ['.tok[data-p="'+pid+'"] img.tkimg','.pc[data-pid="'+pid+'"] img.tkimg','.mwho[data-pid="'+pid+'"] img.tkimg'].forEach(function(sel){
   var img=document.querySelector(sel);if(!img)return;img.setAttribute('src',src);img.setAttribute('data-flash-mood',kind);
   setTimeout(function(){if(img.getAttribute('data-flash-mood')!==kind)return;var back=avSrc(p.tok,persistMood(p));if(back)img.setAttribute('src',back);img.removeAttribute('data-flash-mood')},2200)})}
 function mood(pid,kind,o){if(!fxOn()||!GC.Mood)return;var p=P(pid);if(!p)return;try{flashMoodFace(pid,kind)}catch(e){}
  var t=moodTarget(pid);try{GC.Mood.play(p.tok,kind,t||document.body,Object.assign({key:'p'+pid},o||{}))}catch(x){}}
 function bankruptFx(e){ // v17: kid-friendly explanation popup + property icons flying to the creditor/bank, confirmed with 「知道啦」
  return new Promise(function(res){
   var pc=root.querySelector('.pc[data-pid="'+e.pid+'"]'),tk=root.querySelector('.tok[data-p="'+e.pid+'"]'),cr=e.creditor!=null?P(e.creditor):null,props=e.props||[],anim=fxOn()&&!UI.reduce();
   var pk=function(tok,t){return LN&&LN.pick(tok,t,function(n){return Dice.int(n)})||''};
   var l1=pk(e.tok,'bustComfort'),l2=cr?pk(cr.tok,'bustKind'):'';bkSaid[e.pid]=1;
   var what=props.length?'房子':'钱',sent=cr?esc(e.name)+'的'+what+'都送给'+esc(cr.name)+'啦'+(props.length&&e.cash>0?',还有现金 '+Y(e.cash):''):esc(e.name)+'的'+what+'都回到银行啦'+(props.length?',变成空地':'');
   var plist=props.length?'<div class="bkpl">'+props.map(function(q){return '<span class="bkp" data-n="'+esc(q.name)+'"><span class="pchip" style="background:'+DATA.cardHex[DATA.deeds[q.name].card]+'"></span>'+esc(q.name)+(cr&&q.lvl?'<span class="plv">'+lvSVG(q.lvl)+'</span>':'')+(cr&&q.mort?'<em>抵押</em>':'')+'</span>'}).join('')+'</div>':'';
   var l=fxLayer('fxk');l.style.setProperty('--pc',TKC[e.tok]);
   l.innerHTML='<div class="bkc bk2"><div class="bkrow"><div class="bkt sm">'+tkAv(e.tok,76,'av')+(anim?'<i class="tear l"></i><i class="tear r"></i>':'')+'</div><span class="bkar">➜</span><div class="bkto">'+(cr?tkAv(cr.tok,76,'av'):'<span class="bkbank">🏦</span>')+'<b>'+(cr?esc(cr.name):'银行')+'</b></div></div>'+
    '<h2>'+esc(e.name)+' 破产啦</h2><p class="bksent">'+sent+'</p>'+plist+
    (l1?'<div class="bksay"><span class="bkwho">'+tkAv(e.tok,30,'av')+'</span><span>“'+esc(l1)+'”</span></div>':'')+
    (l2?'<div class="bksay k"><span class="bkwho">'+tkAv(cr.tok,30,'av')+'</span><span>“'+esc(l2)+'”</span></div>':'')+
    '<button class="btn pri big bkok" id="bkOk">知道啦</button></div>';
   fsnd(function(){Sound.seq([[392,.18,.2],[330,.18,.2],[262,.18,.2],[196,.5,.2]])});Sound.vib([80,60,200]);
   try{if(l1)GC.Voice.say(l1,e.tok);if(l2)GC.Voice.say(l2,cr.tok,{queue:1})}catch(x){}
   if(tk)tk.classList.add('poof');
   if(anim&&props.length){ // fly little house icons from the bankrupt chip to the creditor chip / bank
    var a=rectOf(e.pid),bEl=cr?null:$q('#ctBank'),b=cr?rectOf(cr.id):(bEl?(function(r){return{x:r.left+r.width/2,y:r.top+r.height/2}})(bEl.getBoundingClientRect()):{x:innerWidth/2,y:40});
    props.forEach(function(q,i){later(function(){var f=document.createElement('div');f.className='bkfly';f.style.left=a.x+'px';f.style.top=a.y+'px';f.style.setProperty('--c',DATA.cardHex[DATA.deeds[q.name].card]);f.innerHTML='<svg viewBox="-12 -12 24 24"><use href="#houseG"/></svg>';document.body.appendChild(f);
     requestAnimationFrame(function(){f.style.transform='translate('+(b.x-a.x)+'px,'+(b.y-a.y)+'px) scale(.8)';f.style.opacity='.2'});later(function(){f.remove()},1100);
     var chip=l.querySelector('.bkp[data-n="'+q.name+'"]');if(chip)chip.classList.add('go')},500+i*180)});
   }
   var done=false,fin=function(){if(done)return;done=true;Sound.tap();l.classList.add('out');if(pc)pc.classList.add('elim');later(function(){l.remove();res()},UI.reduce()?10:450)};
   l.querySelector('#bkOk').onclick=fin;
  });
 }
 function crisisFor(pid){
  var p=P(pid);if(!p||p.out)return null;var ow=E.ownedBy(S,pid),m=0,mc=0,sc=0,sn=0,hold=[];
  ow.forEach(function(n){var q=S.props[n],d=E.deed(S,n);if(!q.mort){m+=d.mortgage;mc++}
   for(var l=q.lvl;l>=1;l--){sc+=Math.floor(d.build[l===4?1:0]*S.cfg.refundPct/100)}if(q.lvl>0)sn++});
  p.hand.forEach(function(c){hold.push(c)});
  return{p:p,mort:m,mortN:mc,sell:sc,sellN:sn,hold:hold};
 }
 function maybeCrisis(){
  while(crisisQ.length){
   var pid=crisisQ.shift(),p=P(pid);if(!p||p.out||S.phase!=='play')continue;
   var f=E.finState(S,pid);if(!f||f.id!=='danger')continue;
   if(S.pend&&S.pend.t==='pay'&&S.pend.pid===pid)continue; // v18: the pay sheet already offers 借钱/抵押/翻身
   return pid;
  }
  return null;
 }
 function crisisModal(pid){
  var c=crisisFor(pid),f=E.finState(S,pid);if(!c||!f){crisisDone();return}
  var p=c.p,h='<div class="crisis"><div class="cri-h"><span class="cri-i">!</span><h2>危机时刻!</h2></div>'+who(pid)+'<div class="cri-cash">现金 '+Y(p.cash)+'</div><p class="cri-w">'+esc(f.why)+'。再不想办法就要破产啦,试试下面的求生办法:</p><div class="cri-btns">'+
   '<button class="btn cb" id="crMg"'+(c.mortN?'':' disabled')+'><b>抵押地产</b><small>'+(c.mortN?c.mortN+' 处可抵押 · 最多 +'+Y(c.mort):'没有可抵押的地产')+'</small></button>'+
   '<button class="btn cb" id="crSl"'+(c.sellN?'':' disabled')+'><b>卖房子</b><small>'+(c.sellN?c.sellN+' 处有房 · 最多 +'+Y(c.sell):'没有房子可卖')+'</small></button>'+
   (socOn()&&E.active(S).length>1?'<button class="btn cb" id="crLn"><b>找人借钱</b><small>向好朋友借,'+(+S.cfg.loanRounds||3)+' 回合内还</small></button>':'')+
   '<button class="btn cb" id="crHd"'+(c.hold.length?'':' disabled')+'><b>使用手牌</b><small>'+(c.hold.length?c.hold.length+' 张手牌':'没有手牌')+'</small></button></div>';
  h+='<div class="row"><button class="btn pri" id="crOk">我知道了</button></div></div>';
  UI.modal(h,{cls:'sticky crisism'});
  fsnd(Sound.bad);
  $('crOk').onclick=function(){Sound.tap();crisisDone()};
  function go(f2){crisisOpen=false;shownKey='';f2()}
  $('crMg').onclick=function(){go(function(){assets(pid)})};
  $('crSl').onclick=function(){go(function(){assets(pid)})};
  if($('crLn'))$('crLn').onclick=function(){go(function(){borrowFlow(pid,0,function(){UI.close();shownKey='';render()})})};
  $('crHd').onclick=function(){go(function(){if(c.hold.length===1)handCard(pid,c.hold[0]);else assets(pid)})};
 }
 function crisisDone(){crisisOpen=false;UI.close();shownKey='';render();maybeAutoEnd()}
 function badges(p){
  var b='';
  if(p.rest>0)b+='<i class="bd z icb" title="休息'+p.rest+'轮">💤'+p.rest+'</i>';
  if(p.sleep>0)b+='<i class="bd z icb" title="睡着'+p.sleep+'轮">😴'+p.sleep+'</i>';
  if(p.seal>0)b+='<i class="bd s icb" title="查封'+p.seal+'">🔒'+p.seal+'</i>';
  if(p.slow>0)b+='<i class="bd w icb" title="龟速'+p.slow+'">🐢'+p.slow+'</i>';
  if(p.rev>0)b+='<i class="bd w icb" title="倒走'+p.rev+'">↩'+p.rev+'</i>';
  if(p.forced)b+='<i class="bd g icb" title="遥控骰子">🎮</i>';
  return b;
 }
 function outK(p){var l=E.busted(S).slice().reverse();return l.indexOf(p)+1}
 function outTxt(p){return (p.outR?'第'+p.outR+'回合 · ':'')+'第'+outK(p)+'个出局'}
 function fmtW(n){return Math.abs(n)>=10000?(Math.round(n/100)/100)+'万':fmt(n)}
 function renderPanel(){
  var el=$q('#ctp'),h='';
  E.active(S).forEach(function(p){
   var np=E.ownedBy(S,p.id).length,cur=(p.id===S.turn&&S.phase==='play'),fin=E.finState(S,p.id);
   /* v31: avatar-first card — big face + iconified meta */
   h+='<div class="pc av1'+(cur?' cur':'')+finCls(fin)+(p.rest>0||p.sleep>0?' fs-sleep':'')+'" data-pid="'+p.id+'" style="--pc:'+TKC[p.tok]+'">'+
    '<div class="pcm">'+(fxOn()&&fin&&(fin.id==='rich'||fin.id==='tycoon')?'<span class="crnw">'+CROWN+'</span>':'')+tkAv(p.tok,100,'av',persistMood(p))+
    '<div class="pci"><div class="pn">'+esc(p.name)+(cur?'<em title="轮到TA">▶</em>':'')+'</div>'+
    '<div class="cash" data-c="'+p.id+'"><i class="ci" aria-hidden="true">💰</i>'+Y(cashShown[p.id]!=null?cashShown[p.id]:p.cash)+'</div>'+
    '<div class="pcb"><span class="np" title="地产 '+np+' 处">🏠'+np+'</span><span class="nw" title="净资产">≈'+fmtW(E.netWorth(S,p.id).total)+'</span>'+finBadge(fin)+badges(p)+loanBadges(p)+'</div></div></div>'+
    '<div class="hand">'+p.hand.map(function(c){return '<button class="hc" data-pid="'+p.id+'" data-c="'+c+'">'+HOLDSHORT[c]+'</button>'}).join('')+'</div>'+(bubs[p.id]?'<div class="pbub still t-'+bubs[p.id].type+'">'+esc(bubs[p.id].txt)+'</div>':'')+'</div>';
  });
  E.busted(S).forEach(function(p){ // v17: bankrupt players stay visible (greyed, after active ones)
   h+='<div class="pc av1 bust" data-pid="'+p.id+'" style="--pc:'+TKC[p.tok]+'" aria-label="'+esc(p.name)+' 已破产"><div class="pcm">'+tkAv(p.tok,100,'av')+'<div class="pci"><div class="pn">'+esc(p.name)+'</div><div class="bustl"><i class="bkb">已破产</i><small>'+esc(outTxt(p))+'</small></div></div></div></div>';
  });
  el.innerHTML=h;
  Array.prototype.forEach.call(el.querySelectorAll('.pc'),function(c){c.onclick=function(e){if(e.target.closest('.hc'))return;if(e.target.closest('.pbub')){dismissBub(+c.getAttribute('data-pid'));return}assets(+c.getAttribute('data-pid'))}});
  Array.prototype.forEach.call(el.querySelectorAll('.hc'),function(c){c.onclick=function(e){e.stopPropagation();handCard(+c.getAttribute('data-pid'),+c.getAttribute('data-c'))}});
  var pot=$q('#ctPot');pot.style.display=(S.cfg.feeTo==='pot'||S.pot>0)?'':'none';pot.querySelector('b').textContent=Y(S.pot);
  var last=S.log[S.log.length-1];$q('#ctTick').innerHTML=last?'<span class="'+esc(last.k)+'">'+esc(last.t)+'</span>':'';
  $q('#dkUndo').disabled=!G.undo.length||busy;
 }
 function qdie(){return '<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="18" fill="#fff" stroke="#d3dae2" stroke-width="3"/><text x="50" y="68" text-anchor="middle" font-size="58" font-weight="900" fill="#ff7a1f">?</text></svg>'}
 function renderCenter(){
  var el=$q('#ctui'),p=S.phase==='play'?E.cur(S):null,h='';
  if(S.phase==='over'){var w=P(S.winner);el.innerHTML='<div class="cwin">'+tkAv(w.tok,64,'av')+'<b>'+esc(w.name)+'</b><span>成为超级小富翁!</span></div>';return}
  if(sync.on){
   var pid=sync.pid!=null&&P(sync.pid)&&!P(sync.pid).out?sync.pid:S.turn;sync.pid=pid;
   h='<div class="csync"><b>对位模式</b><span>选棋子,再点棋盘格子;或用 ± 步数</span><div class="stks">'+E.active(S).map(function(q){return '<button class="stk'+(q.id===pid?' on':'')+'" data-p="'+q.id+'" style="--pc:'+TKC[q.tok]+'">'+tkAv(q.tok,34)+'</button>'}).join('')+'</div>'+
    '<div class="row"><button class="btn sm" id="syM">◀ -1</button><button class="btn sm" id="syP">+1 ▶</button></div><div class="at">在 <b>'+SQ[P(pid).pos].name+'</b></div><div class="row"><button class="btn pri sm" id="syOk">完成</button></div></div>';
   el.innerHTML=h;
   Array.prototype.forEach.call(el.querySelectorAll('.stk'),function(b){b.onclick=function(){sync.pid=+b.getAttribute('data-p');renderCenter()}});
   $q('#syM').onclick=function(){doSync({pid:pid,delta:-1})};$q('#syP').onclick=function(){doSync({pid:pid,delta:1})};
   $q('#syOk').onclick=function(){sync.on=false;render();UI.toast('对位完成',1200,'check')};return;
  }
  var tp=S.tp,rolled=S.roll,dv=rolled?rolled.v:dieVal;
  var hint,btn='',cls='',cls0='';
  if(tp==='roll'){cls0='lite';hint='轮到 <b style="color:'+TKC[p.tok]+'">'+esc(p.name)+'</b> 掷骰子';btn='<button class="btn big" id="ctRoll">掷骰子</button>';
   var st=[];if(+S.cfg.maxRerolls!==0&&!p.forced&&!p.slow)st.push('不满意可以重掷'+(+S.cfg.maxRerolls<0?'(不限次)':'最多 '+S.cfg.maxRerolls+' 次'));if(p.forced)st.push('遥控:这次走 '+p.forced+' 步');if(p.slow>0)st.push('龟速:只能走 1 步');if(p.rev>0)st.push('掉头:倒着走');if(st.length)hint+='<small>'+st.join(' · ')+'</small>'}
  else if(tp==='rolled'){var n=rolled.slow?1:rolled.v+rolled.bonus,left=E.rerollsLeft(S),canR=E.canReroll(S),mx=+S.cfg.maxRerolls;
   hint='掷出 <b>'+rolled.v+'</b>!要走 <b>'+n+'</b> 步'+(rolled.bonus?'<small>含高铁 +'+rolled.bonus+'</small>':'')+(rolled.dir<0?'<small>倒着走</small>':'')+(rolled.forced?'<small>遥控骰子:点数已定,不能重掷</small>':rolled.slow?'<small>龟速前进:只能走 1 步</small>':'');
   var dots='';if(!rolled.forced&&!rolled.slow){if(mx<0)dots='<span class="rrd inf">重掷机会 ∞ 不限</span>';else if(mx>0){dots='<span class="rrd" aria-label="还剩 '+left+' 次重掷">重掷机会 ';for(var di=0;di<Math.min(mx,8);di++)dots+='<i class="'+(di<left?'on':'')+'"></i>';dots+=' <b>剩 '+left+' 次</b></span>'}else dots='<span class="rrd">这局不能重掷</span>'}
   btn='<button class="btn big go" id="ctGo">就这个,出发 ▶</button>'+((rolled.forced||rolled.slow)?'':'<button class="btn rr" id="ctRe"'+(canR?'':' disabled')+'>'+UI.ICO.dice+(canR?'再掷一次':(mx===0?'不能重掷':'机会用完啦'))+'</button>')+dots;cls='rolled'}
  else if(tp==='end'){var ei=E.endInfo(S);
   if(ei.auto){cls0='lite';hint='这一步完成啦<small>点这里可以马上继续</small>'}
   else{var RT={card:'你有现在能用的手牌,用完或不用都点结束',upgrade:'钱够,可以去「资产」里升级房产',crisis:'快破产啦!可以去「资产」抵押或卖房',manual:'可以管理地产、用手牌,然后结束回合'};
    hint=RT[ei.reason]||RT.manual;btn='<button class="btn big" id="ctEnd">结束回合 ➜</button>'}
   if(ei.hints.indexOf('cards')>=0)hint+='<small>你还有手牌,需要时在自己回合点「使用」</small>'}
  else{hint='处理中…'}
  h='<div class="cwho" style="--pc:'+TKC[p.tok]+'">'+tkAv(p.tok,96,'av',persistMood(p))+'<b>'+esc(p.name)+'</b></div><div class="cdie '+cls+'" id="ctDie" role="button" aria-label="骰子">'+(dv?Dice.svg(dv):qdie())+'</div><div class="chint'+(cls0?' '+cls0:'')+'">'+hint+'</div>'+btn;
  var hh=p.hand.filter(function(c){return !E.canUse(S,p,c)});
  if(p.hand.length)h+='<div class="chand">'+p.hand.map(function(c){var ok=!E.canUse(S,p,c);return '<button class="hc'+(ok?' ok':'')+'" data-pid="'+p.id+'" data-c="'+c+'">'+HOLDSHORT[c]+(ok?' · 可用':'')+'</button>'}).join('')+'</div>';
  el.innerHTML=h;
  var r=$q('#ctRoll');if(r)r.onclick=doRoll;var g=$q('#ctGo');if(g)g.onclick=doGo;var e=$q('#ctEnd');if(e)e.onclick=doEnd;var rr=$q('#ctRe');if(rr)rr.onclick=doReroll;
  var d=$q('#ctDie');d.onclick=function(){if(S.tp==='roll')doRoll();else if(S.tp==='rolled'){d.classList.remove('wig');void d.offsetWidth;d.classList.add('wig')}};
  Array.prototype.forEach.call(el.querySelectorAll('.hc'),function(c){c.onclick=function(){handCard(+c.getAttribute('data-pid'),+c.getAttribute('data-c'))}});
 }
 function render(){
  if(!root)return;
  if(S.phase==='setup'){renderCells();return}
  if(S.phase==='play'&&GC.Gfx&&!render.pb){render.pb=1;setTimeout(function(){GC.Gfx.probe()},6000)}
  renderCells();renderTokens();renderPanel();renderCenter();if(root.classList.contains('pview')){if(S.phase!=='play')propView(false);else propView(true)}var bd=$q('#ctb');if(bd)bd.classList.toggle('fxoff',!fxOn());
  if(!busy&&!selv&&!entryOpen&&!crisisOpen)showPend();
  if(S.phase==='over'&&!busy&&shownKey!=='over')showWinner();
 }
 /* ---------- speech bubbles (角色台词) ---------- */
 var HOLD={enterDanger:1000,escapedDanger:900,comeback:1000,enterRich:900,stillDanger:900,richBoast:900,bankruptcy:10,cantAfford:1000,paidRent:900,receivedRent:900,fined:1000,freePass:600,bankrupt:1200,win:300,restTurn:900,turnStart:700},bubT={};
 var SND={richBoast:'pop',cantAfford:'bad',fined:'bad',paidRent:'bad',bankrupt:'bad',roll6:'hi',passedStart:'coin'};
 function sayEv(e){
  var p=P(e.pid);if(!p||!LN)return Promise.resolve();
  var mk=MOODOF[e.type];if(e.type==='builtUpgrade'&&e.x&&S.props[e.x]&&S.props[e.x].lvl===4)mk='proud';if(mk){var mo=mk==='sleep'?{key:'sleep'+e.pid+'r'+(S.round||0)}:{};if(e.type==='boughtProperty'||e.type==='builtUpgrade')mo.tiny=1;mood(e.pid,mk,mo)}if(e.type==='enterRich'){try{GC.Intro.banner(p.tok,p.name,'成为大富豪!')}catch(x){}}
  if(e.type==='bankruptcy'&&bkSaid[e.pid]){delete bkSaid[e.pid];return Promise.resolve()}
  var txt=LN.pick(p.tok,e.type,function(n){return Dice.int(n)});if(!txt)return Promise.resolve();
  showBubble(p,txt,e.type);try{GC.Voice.say(txt,p.tok,{queue:1,prot:1})}catch(x){}
  var sn=SND[e.type];if(sn&&Sound[sn])Sound[sn]();
  return wait(HOLD[e.type]||450);
 }
 function showBubble(p,txt,type){
  bubs[p.id]={txt:txt,type:type};
  var pc=root.querySelector('.pc[data-pid="'+p.id+'"]');
  if(pc){var ob=pc.querySelector('.pbub');if(ob)ob.remove();var b=document.createElement('div');b.className='pbub t-'+type;b.textContent=txt;pc.appendChild(b);pc.classList.remove('shake');void pc.offsetWidth;pc.classList.add('shake')}
  var lay=$q('#ctbub');
  if(lay){
   var o=lay.querySelector('.sbub[data-p="'+p.id+'"]');if(o)o.remove();
   var pos=shown[p.id]!=null?shown[p.id]:p.pos,tp=tokPos(pos,0,1),x=parseFloat(tp.l),y=parseFloat(tp.t);
   var el=document.createElement('div');el.className='sbub t-'+type+' '+(x<30?'al':x>70?'ar':'ac')+' '+(y<42?'bl':'ab');el.setAttribute('data-p',p.id);
   el.style.left=tp.l;el.style.top=tp.t;el.style.setProperty('--pc',TKC[p.tok]);
   el.innerHTML='<span class="sbt">'+esc(txt)+'</span>';
   el.onclick=function(ev){ev.stopPropagation();dismissBub(p.id)};
   lay.appendChild(el);
  }
  /* v23: the bubble stays until its line has finished (+0.8 s); without voice: read time by length */
  var V=GC.Voice,will=false;try{will=!!(V&&V.will&&V.will(txt,p.tok))}catch(x){}
  var t0=Date.now(),minT=will?1500:readMs(txt),endSeen=0;readUntil=Math.max(readUntil,t0+(will?1200:readMs(txt)));tl('line',{txt:txt,pid:p.id,voice:will});
  clearTimeout(bubT[p.id]);
  (function chk(){if(!bubs[p.id]||bubs[p.id].txt!==txt)return;var pl=false;try{pl=V&&V.playing&&V.playing(txt)}catch(x){}
   if(pl){endSeen=0;bubT[p.id]=later(chk,150);return}if(!endSeen)endSeen=Date.now();
   if(Date.now()<Math.max(t0+minT,endSeen+800)){bubT[p.id]=later(chk,150);return}tl('bubbleOff',{pid:p.id});dismissBub(p.id)})();
 }
 function dismissBub(pid){
  delete bubs[pid];clearTimeout(bubT[pid]);
  if(!root)return;
  Array.prototype.forEach.call(root.querySelectorAll('.sbub[data-p="'+pid+'"],.pc[data-pid="'+pid+'"] .pbub'),function(el){el.classList.add('out');later(function(){el.remove()},UI.reduce()?0:200)});
 }
 /* ---------- event playback (dice, steps, coins) ---------- */
 function elOf(x){
  if(typeof x==='number'){return root.querySelector('.pc[data-pid="'+x+'"] .av')||root.querySelector('.pc[data-pid="'+x+'"]')}
  return $q(x==='pot'?'#ctPot':'#ctBank');
 }
 function tweenCash(pid,delta){
  var cur=cashShown[pid]!=null?cashShown[pid]:P(pid).cash-delta;
  var nv=cur+delta;cashShown[pid]=nv;
  var el=root.querySelector('[data-c="'+pid+'"]');if(el)UI.tween(el,cur,nv,650,Y);
  if(el){el.classList.remove('up','dn');void el.offsetWidth;el.classList.add(delta>0?'up':'dn')}
 }
 function handle(e){
  switch(e.k){
  case 'roll':return new Promise(function(res){
    var st=$q('#ctDie');dieVal=e.v;if(!st){res();return}
    st.classList.remove('rolled');var wrap=document.createElement('div');wrap.className='ctdw';st.innerHTML='';st.appendChild(wrap);Dice.render(wrap,[1]);
    wrap.style.setProperty('--ds','100%');
    Dice.roll(wrap,[e.v],function(){Sound.vib(25);res()})}).then(function(){return wait(250)});
  case 'move':return stepPath(e);
  case 'jump':return new Promise(function(res){
    var el=root.querySelector('.tok[data-p="'+e.pid+'"]');if(el){el.classList.add('poof')}Sound.flip();
    later(function(){shown[e.pid]=e.to;renderTokens();var el2=root.querySelector('.tok[data-p="'+e.pid+'"]');if(el2){el2.classList.remove('poof');el2.classList.add('pop')}later(function(){if(el2)el2.classList.remove('pop');res()},420)},300)});
  case 'coin':return new Promise(function(res){
    var a=elOf(e.from),b=elOf(e.to);
    var n=Math.max(2,Math.min(8,Math.round(e.amt/500)+2));
    UI.coinFly(a,b,n);
    if(typeof e.from==='number')tweenCash(e.from,-e.amt);
    if(typeof e.to==='number')tweenCash(e.to,e.amt);
    var pot=$q('#ctPot');if(pot&&(e.from==='pot'||e.to==='pot')){pot.style.display='';pot.querySelector('b').textContent=Y(S.pot)}
    later(res,UI.reduce()?20:520)});
  case 'collect':return new Promise(function(res){fxCollect(e.pid,e.big);later(res,UI.reduce()?20:(e.big?500:300))});
  case 'note':UI.toast(e.txt,1500,'info');return wait(700);
  case 'skip':e.list.forEach(function(x){UI.toast(pName(x.pid)+' '+x.why+'中,跳过这一轮',1700,'warn')});return wait(e.list.length?600:200);
  case 'say':return sayEv(e);
  case 'turn':{var p=P(e.pid);if(!p||lastToastTurn===e.pid)return Promise.resolve();lastToastTurn=e.pid;tl('turnEv',{pid:e.pid});
    return lineGate().then(function(){var bn=false;tl('banner',{pid:e.pid});try{if(bannerOn())bn=GC.Intro.banner(p.tok,p.name,'轮到你啦!',{sub:'下一位 · 第 '+S.round+' 回合'})}catch(x){}if(!bn)Sound.pop()})}
  case 'own':case 'build':return new Promise(function(res){var d=DATA.deeds[e.name];renderCells();var c=root.querySelector('.sq[data-i="'+d.sq+'"]');if(c){c.classList.remove('stamp');void c.offsetWidth;c.classList.add('stamp')}Sound.buy();later(res,400)});
  case 'bankrupt':return bankruptFx(e);
  case 'lucky':return handle({k:'roll',v:e.v}).then(function(){
    if(e.bonus){fsnd(Sound.win);UI.toast('好运!翻身机会掷出 '+e.v+',获得 '+Y(e.bonus),2200,'star')}else UI.toast('掷出 '+e.v+',这次没中…还可以抵押卖房哦',2200,'info');
    return wait(e.bonus?500:900)});
  case 'fin':{
    if(!fxOn())return Promise.resolve();
    var k=e.kind;
    if(e.to==='danger'&&k==='enterDanger'){heart();fxPlay(e.pid,'danger');crisisQ.push(e.pid);return wait(900)}
    if(k==='escapedDanger'){fsnd(function(){Sound.seq([[392,.12,.1],[523,.2,.1]])});fxPlay(e.pid,'escape');return wait(1000)}
    if(k==='comeback'){fsnd(Sound.win);fxPlay(e.pid,'comeback');return wait(1200)}
    if(k==='enterRich'||k==='enterTycoon'){fsnd(function(){Sound.coin();Sound.seq([[1319,.08,.08],[1568,.08,.08],[1976,.2,.08]])});fxPlay(e.pid,k==='enterTycoon'?'tycoon':'rich');return wait(1100)}
    return Promise.resolve()}
  case 'join':{Sound.hi();return wait(250)}
  case 'mood':mood(e.pid,e.m,e.m==='sleep'?{key:'sleep'+e.pid+'r'+(S.round||0)}:undefined);return wait(e.m==='sleep'?900:250);
  case 'loan':UI.toast(pName(e.from)+' 借给 '+pName(e.to)+' '+Y(e.amt),1800,'star');return wait(300);
  case 'gift':Sound.coin();UI.toast('🧧 '+pName(e.from)+' 送给 '+pName(e.to)+' 红包 '+Y(e.amt),1800,'star');return wait(300);
  case 'repay':if(e.why==='early')UI.toast(pName(e.from)+' 还给 '+pName(e.to)+' '+Y(e.amt)+(e.done?',还清啦!':''),1800,'check');return wait(200);
  case 'loanDue':{try{GC.Voice.say(e.left?'借款到期啦,钱不够的,下次轮到你时继续还哦':'借款到期啦,有借有还,真棒!','n',{queue:1})}catch(x){}
    UI.toast(pName(e.pid)+' 借款到期:'+(e.paid?'还了 '+Y(e.paid):'现在没钱还')+(e.left?',还欠 '+Y(e.left):',还清啦!'),2400,e.left?'warn':'check');return wait(900)}
  case 'win':Sound.win();return Promise.resolve();
  }
  return Promise.resolve();
 }
 function stepPath(e){
  var i=0;return new Promise(function(res){
   (function nx(){
    if(i>=e.path.length){var el=root.querySelector('.tok[data-p="'+e.pid+'"]');if(el){el.classList.remove('land');void el.offsetWidth;el.classList.add('land')}try{sqFx(e.path[e.path.length-1],e.pid)}catch(x){}later(res,260);return}
    shown[e.pid]=e.path[i++];renderTokens();Sound.step();
    // mark the square we pass
    var c=root.querySelector('.sq[data-i="'+shown[e.pid]+'"]');if(c){c.classList.remove('hit');void c.offsetWidth;c.classList.add('hit');var mp=P(e.pid);if(mp){c.style.setProperty('--tc',TKC[mp.tok]);c.classList.add('trail');(function(cc){later(function(){cc.classList.remove('trail')},1400)})(c)}}
    later(nx,UI.reduce()?20:200);
   })();
  });
 }
 function playEvents(evs){
  busy=true;if(root)root.classList.add('pbusy');var p=Promise.resolve();
  evs.forEach(function(e){p=p.then(function(){return handle(e)})});
  return p.then(function(){busy=false;if(root)root.classList.remove('pbusy');E.active(S).forEach(function(q){delete shown[q.id];delete cashShown[q.id]})});
 }
 /* ---------- actions ---------- */
 function after(){
  S=G.S;var evs=S.ev.slice();S.ev=[];save();
  return playEvents(evs).then(function(){
   var cp=fxOn()?maybeCrisis():null;
   if(cp!=null)crisisOpen=true;
   render();
   if(cp!=null)crisisModal(cp);else maybeAutoEnd()});
 }
 /* v25: the turn banner (character animation) is the one main signal; 「下一位」 chip only when there is no banner (登场动画关闭 / 画质省电) */
 function bannerOn(){try{return GC.Intro.mode()!=='off'&&!(GC.Gfx&&GC.Gfx.mode()==='eco')}catch(x){return false}}
 function nextBanner(){
  var pk=E.peekNext(S);if(!pk)return null;
  var q=P(pk.pid),sk=pk.skipped.map(function(x){return P(x.pid).name+x.why+'中'}).join('、');
  var el=document.createElement('div');el.className='ctnext';el.setAttribute('role','button');el.setAttribute('aria-label','下一位,点一下跳过');
  el.innerHTML='<div class="nx-in" style="--pc:'+TKC[q.tok]+'">'+tkAv(q.tok,80,'av',persistMood(q))+'<div><small>下一位</small><b>'+esc(q.name)+'</b>'+(sk?'<em>'+esc(sk)+',跳过</em>':'')+'</div><span class="nx-go">▶</span></div>';
  return el;
 }
 function maybeAutoEnd(){
  clearTimeout(autoEndTimer);dropBanner();
  if(!S||S.phase!=='play'||S.tp!=='end'||S.pend)return;
  var ei=E.endInfo(S);if(!ei.auto)return;
  var turn=S.turn,rd=S.round,quick=UI.reduce();
  function blocked(){return !S||busy||S.phase!=='play'||S.tp!=='end'||S.turn!==turn||S.round!==rd||S.pend||crisisOpen||$('modal').classList.contains('show')}
  function stale(){return !S||S.phase!=='play'||S.tp!=='end'||S.turn!==turn||S.round!==rd}
  function start(){
   if(stale())return;if(blocked()){autoEndTimer=later(start,300);return}
   if(!E.endInfo(S).auto)return;
   var el=nextBanner(),fired=false;
   function fire(){if(fired)return;fired=true;clearTimeout(autoEndTimer);dropBanner();if(stale()||busy||S.pend)return;tl('autoEnd');act('end')}
   var hn=root&&root.querySelector('.chint');if(hn){hn.classList.add('tap');hn.onclick=function(){Sound.tap();skipLine();fire()}}
   if(el&&root&&!quick&&!bannerOn()){root.appendChild(el);banner=el;el.onclick=function(){Sound.tap();skipLine();fire()};requestAnimationFrame(function(){el.classList.add('on')})}
   /* v23: show 「下一位」 now (tap = skip), but only switch once the current line is over + a breath */
   function w(){if(stale())return;if(blocked()){fired=true;dropBanner();autoEndTimer=later(start,300);return}if(!lineFree()){autoEndTimer=later(w,120);return}fire()}
   autoEndTimer=later(w,quick?60:900);
  }
  autoEndTimer=later(start,quick?20:350);
 }
 var banner=null;
 function dropBanner(){if(banner){var b=banner;banner=null;b.classList.remove('on');setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b)},200)}}
 function act(type,a,o){
  o=o||{};if(busy)return{ok:false,err:'busy'};
  var r=G.act(type,a);S=G.S;
  if(!r.ok){if(r.err==='cash')UI.toast('钱不够,还差 '+Y(r.short),1800,'warn');else if(r.err&&!o.quiet)UI.toast(r.err,2000,'warn');Sound.bad();return r}
  if(o.defer){r.evs=S.ev.slice();S.ev=[];save();return r}
  if(o.noAfter){S.ev=[];save();return r}
  after();return r;
 }
 function doRoll(){
  if(busy||S.tp!=='roll'||S.pend)return;UI.close();
  var r=act('roll');if(r.ok)Sound.vib(20);
 }
 function doReroll(){if(busy||!E.canReroll(S))return;UI.close();var r=act('reroll');if(r.ok)Sound.vib(20)}
 function doGo(){if(busy||S.tp!=='rolled'||S.pend)return;act('go')}
 function doEnd(){if(busy)return;tl('manualEnd');act('end')}
 function doSync(a){var r=act('sync',a,{quiet:true});if(r.ok)Sound.step()}
 function cellTap(i){
  if(sync.on){var pid=sync.pid!=null?sync.pid:S.turn;doSync({pid:pid,pos:i});return}
  var s=SQ[i];
  if(s.type==='property'){sqPop(i);return}
  else{UI.modal('<div class="spc">'+(SQC[s.name]?'<svg class="si big c" viewBox="0 0 48 48">'+SQC[s.name]+'</svg>':'<svg class="si big" viewBox="0 0 24 24">'+(SQI[s.name]||'')+'</svg>')+'</div><h2>'+s.name+'</h2><p>'+RULETXT[s.name]+'</p><div class="row"><button class="btn pri" id="cOk">好的</button></div>',{cls:'dlg'});$('cOk').onclick=UI.close}
 }
 /* v19: quick info popover for a property square (owner / level / rent now); 「地契」 opens the full deed */
 function sqPop(i){var s=SQ[i],q=S.props[s.name],o=q.owner!=null?P(q.owner):null,b=$q('#ctb'),old=b.querySelector('.sqpop');if(old){var same=+old.getAttribute('data-i')===i;old.remove();if(same)return}
  Sound.tap();var cp=S.phase==='play'?E.cur(S):null,r=E.rentFor(S,s.name),d=E.deed(S,s.name),el=document.createElement('div');el.className='sqpop';el.setAttribute('data-i',i);
  el.style.setProperty('--oc',o?TKC[o.tok]:'#9aa3b5');
  el.innerHTML='<b class="spn"><span class="pchip" style="background:'+s.stripHex+'"></span>'+esc(s.name)+'</b>'+
   (o?'<span class="spo">'+tkAv(o.tok,24)+esc(o.name)+(cp&&o.id===cp.id?' <em class="spme">★ 我的</em>':'')+'</span><span>'+(q.lvl?lvSVG(q.lvl)+' ':'')+E.LVN[q.lvl]+(q.mort?' · <b class="red">抵押中</b>':'')+'</span><span>观光费 <b>'+(q.mort&&!S.cfg.mortRent?'免费(抵押)':Y(r.amount))+'</b>'+(r.mult>1?' (同色×2)':'')+'</span>'
     :'<span class="spo">空地 · 可以买</span><span>价格 <b>'+Y(d.price)+'</b></span><span>空地观光费 '+Y(d.rent[0])+'</span>')+
   '<div class="spb"><button class="btn sm" data-a="deed">地契</button><button class="btn sm pri" data-a="x">好</button></div>';
  b.appendChild(el);var c=b.querySelector('.sq[data-i="'+i+'"]'),br=b.getBoundingClientRect(),cr=c.getBoundingClientRect(),pw=el.offsetWidth,ph=el.offsetHeight;
  var x=cr.left-br.left+cr.width/2-pw/2,y=side(i)==='t'?cr.bottom-br.top+6:cr.top-br.top-ph-6;if(side(i)==='l'){x=cr.right-br.left+6;y=cr.top-br.top+cr.height/2-ph/2}if(side(i)==='r'){x=cr.left-br.left-pw-6;y=cr.top-br.top+cr.height/2-ph/2}
  el.style.left=Math.max(4,Math.min(br.width-pw-4,x))+'px';el.style.top=Math.max(4,Math.min(br.height-ph-4,y))+'px';
  el.onclick=function(ev){ev.stopPropagation();var a=ev.target.closest('[data-a]');if(!a)return;el.remove();if(a.getAttribute('data-a')==='deed')deedView(s.name)};
  later(function(){if(el.parentNode)el.remove()},6000);
 }
 /* ---------- deed card (契约卡) ---------- */
 function fbadge(f){return f==='miss'?'<em class="vb miss">待核实·建议值</em>':f==='chk'?'<em class="vb chk">待核实</em>':''}
 function deedCard(name,o){
  o=o||{};var d=E.deed(S,name),dd=DATA.deeds[name],col=DATA.cardHex[dd.card],q=S.props[name];
  function fv(f){return E.fieldInfo(S,name,f)}
  function cell(f,label){var i=fv(f);return '<tr class="'+(i.flag?'fl '+i.flag:'')+'"><td>'+label+'</td><td>'+Y(i.v)+fbadge(i.flag)+'</td></tr>'}
  var ow=q.owner!=null?P(q.owner):null;
  var art='<div class="dart">'+LM.svg(name)+(ow?'<span class="dao">'+tkAv(ow.tok,34)+'</span>':'')+(q.lvl?'<span class="dal">'+lvSVG(q.lvl)+'</span>':'')+(q.mort?'<span class="dastamp">抵押</span>':'')+'</div>';
  var h='<div class="deedc'+(q.mort?' mort':'')+'" style="--dc:'+col+'"><div class="dh"><b>'+name+'</b><i>'+dd.landmark+'</i><span class="dprice">'+Y(d.price)+(fv('price').flag?fbadge('chk'):'')+'</span></div>'+art+'<div class="dbd"><table>';
  ['空地观光费','1间民宿','2间民宿','3间民宿','度假村'].forEach(function(l,k){h+=cell('rent'+k,l+(q.lvl===k&&o.cur?' ◀':''))});
  h+='</table><div class="dbr"><span>盖民宿 '+cell1('build0')+'</span><span>盖度假村 '+cell1('build1')+'</span></div><div class="dbr"><span>抵押价值 '+cell1('mortgage')+'</span><span>赎回价值 '+cell1('redeem')+'</span></div><div class="dfoot">持有同色系所有土地观光费翻倍 · 盖3间民宿后可盖度假村</div></div></div>';
  function cell1(f){var i=fv(f);return '<b>'+Y(i.v)+'</b>'+fbadge(i.flag)}
  return h;
 }
 function deedView(name,back){
  var q=S.props[name],o=q.owner!=null?P(q.owner):null,lv=E.LVN[q.lvl];
  var h=deedCard(name,{cur:true})+'<div class="dstat'+(o?'':' free')+'">'+(o?'<span class="dsow">'+tkAv(o.tok,28)+esc(o.name)+'</span><span>'+lvSVG(q.lvl)+lv+'</span>'+(q.mort?'<span class="dsm">抵押中</span>':'')+'<span>观光费 <b>'+Y(E.rentFor(S,name).amount)+'</b></span>':'<span>🏷 无人拥有,停下来可以买 '+Y(E.deed(S,name).price)+'</span>')+'</div><div class="row"><button class="btn" id="dvEd">编辑地契</button><button class="btn pri" id="dvOk">好的</button></div>';
  UI.modal(h,{cls:'deedm'});$('dvOk').onclick=function(){if(back)back();else UI.close()};$('dvEd').onclick=function(){deedEdit(name,'')};
 }
 /* ---------- pend modals ---------- */
 function pkey(pd){return pd?[pd.t,pd.stage,pd.purpose,pd.pid,pd.name,pd.card,pd.kind,pd.v,pd.mine,S.turn,S.log.length].join('|'):''}
 function showPend(force){
  var pd=S.pend;
  if(!pd||S.phase!=='play'){if(shownKey&&shownKey!=='over'){shownKey='';if($('box').classList.contains('sticky'))UI.close()}return}
  var k=pkey(pd);if(!force&&k===shownKey&&$('modal').classList.contains('show'))return;
  shownKey=k;
  switch(pd.t){
  case 'buy':return mBuy(pd);case 'pay':return mPay(pd);case 'gain':return mGain(pd);case 'gainAll':return mGainAll(pd);
  case 'build':return mBuild(pd);case 'chance':return mChance(pd);case 'windfall':return mWind(pd);case 'pick':return mPick(pd);
  }
 }
 function who(pid,sfx){var p=P(pid);return '<div class="mwho" data-pid="'+pid+'" style="--pc:'+TKC[p.tok]+'">'+tkAv(p.tok,52,'av',persistMood(p))+'<b>'+esc(p.name)+'</b>'+(sfx?'<span>'+sfx+'</span>':'')+'</div>'}
 function closeThen(f){UI.close();shownKey='';f()}
 function mBuy(pd){
  var p=P(pd.pid),afford=p.cash>=pd.price;
  var h=who(pd.pid,'停在了 <b>'+pd.name+'</b>')+deedCard(pd.name)+'<p class="dst">你有 '+Y(p.cash)+(afford?',买后剩 '+Y(p.cash-pd.price):' <b class="red">· 钱不够,还差 '+Y(pd.price-p.cash)+'</b>')+'</p><div class="row"><button class="btn" id="bNo">放弃</button><button class="btn pri" id="bYes"'+(afford?'':' disabled')+'>确认购买 '+Y(pd.price)+'</button></div>'+(afford?'':'<div class="row"><button class="btn sm" id="bMg">先去抵押凑钱</button></div>');
  UI.modal(h,{cls:'sticky deedm'});
  $('bNo').onclick=function(){closeThen(function(){act('no')})};
  $('bYes').onclick=function(){closeThen(function(){act('ok')})};
  if(!afford)$('bMg').onclick=function(){assets(pd.pid,true)};
 }
 function mBuild(pd){
  var p=P(pd.pid),afford=p.cash>=pd.cost,nm=pd.to===4?'度假村':'第 '+pd.to+' 间民宿';
  var h=who(pd.pid,'回到了自己的 <b>'+pd.name+'</b>')+'<div class="bld">'+lvSVG(pd.to-1)+'<span class="arw">➜</span>'+lvSVG(pd.to)+'</div><h2>盖'+nm+'?</h2><p>费用 <b>'+Y(pd.cost)+'</b> · 观光费 '+Y(E.deed(S,pd.name).rent[pd.to-1])+' ➜ <b>'+Y(E.deed(S,pd.name).rent[pd.to])+'</b>'+(afford?'':'<br><b class="red">钱不够,还差 '+Y(pd.cost-p.cash)+'</b>')+'</p><div class="row"><button class="btn" id="bNo">不盖</button><button class="btn pri" id="bYes"'+(afford?'':' disabled')+'>确认建造 '+Y(pd.cost)+'</button></div>';
  UI.modal(h,{cls:'sticky'});
  $('bNo').onclick=function(){closeThen(function(){act('no')})};$('bYes').onclick=function(){closeThen(function(){act('ok')})};
 }
 function mPay(pd){
  var p=P(pd.pid),short=Math.max(0,pd.amount-p.cash),toTxt=typeof pd.to==='number'?who(pd.to):'<div class="mwho bankw"><b>'+(pd.to==='pot'?'奖池':'银行')+'</b></div>';
  var hasFree=pd.reason==='rent'&&p.hand.some(function(c){return E.card(c).fx==='waive_one_rent'});
  var br='';
  try{GC.Voice.say(pd.reason==='rent'?'支付观光费'+pd.amount+'元':pd.reason==='crash'?'楼市暴跌了,罚款'+pd.amount+'元':'要付'+pd.amount+'元','n')}catch(x){}
  if(pd.reason==='rent'){var r=pd.rent,q=S.props[pd.name],ow=P(pd.to);br='<div class="rcard"><div class="rart">'+LM.svg(pd.name)+'<span class="rown">'+tkAv(ow.tok,34)+'</span></div><div class="rinf"><b>'+esc(pd.name)+'</b><span class="rowner">地主:'+esc(ow.name)+'</span><span class="rlv">'+lvSVG(r.lvl)+E.LVN[r.lvl]+'</span></div></div><div class="brk"><div>'+E.LVN[r.lvl]+' 观光费</div><div>'+Y(r.base)+'</div>'+(r.mult>1?'<div>同色系全部拥有 ×2</div><div>'+Y(r.amount)+'</div>':'')+'<div class="tot">应付合计</div><div class="tot">'+Y(pd.amount)+'</div></div><div class="cashba"><span>支付前<b>'+Y(p.cash)+'</b></span><i>➜</i><span class="'+(short?'neg':'')+'">支付后<b id="payAfter">'+Y(p.cash-pd.amount)+'</b></span></div>'}
  if(pd.reason!=='rent'){var ttl=String(pd.why).split(' · ')[0].replace(/\s*[−-]¥\d+$/,''),cc=E.DATA.chance.filter(function(c){return c.title===ttl})[0],crash=pd.reason==='crash';
   br='<div class="rcard pen"><div class="rart pic">'+(crash?'<svg viewBox="0 0 48 48"><path d="M6 40V22l8-6v24M16 40V12l9-6 8 6v28M35 40V24l7 5v11" fill="#c9d3e8" stroke="#5a6a8a" stroke-width="2"/><path d="M4 8l8 6 4-8 6 10 5-8 4 9 7-6" fill="none" stroke="#e0485e" stroke-width="3" stroke-linecap="round"/></svg>':'<svg viewBox="0 0 48 48"><rect x="8" y="9" width="32" height="30" rx="5" fill="#fff4c4" stroke="#e0a800" stroke-width="2.5"/><text x="24" y="33" text-anchor="middle" font-size="22" font-weight="900" fill="#e0485e">!</text></svg>')+'</div><div class="rinf"><b>'+esc(ttl)+'</b>'+(cc?'<span class="rowner">'+esc(cc.text)+'</span>':'<span class="rowner">'+(crash?'楼市暴跌,每个路过的人都要缴 ¥1000':'')+'</span>')+'</div></div><div class="brk"><div>'+(crash?'楼市暴跌 罚款':'应付')+'</div><div>'+Y(pd.amount)+'</div><div>付给</div><div>'+(typeof pd.to==='number'?esc(P(pd.to).name):pd.to==='pot'?'奖池':'银行')+'</div></div><div class="cashba"><span>支付前<b>'+Y(p.cash)+'</b></span><i>➜</i><span class="'+(short?'neg':'')+'">支付后<b>'+Y(p.cash-pd.amount)+'</b></span></div>'}
  var h='<h2>'+(pd.reason==='rent'?'支付观光费':'🌧 '+(pd.reason==='crash'?'楼市暴跌了!':'要付钱啦'))+'</h2><div class="payrow">'+who(pd.pid)+'<span class="arw">➜</span>'+toTxt+'</div><div class="bigamt" id="payAmt">'+Y(pd.amount)+'</div>'+br+'<p>'+(pd.reason==='rent'?'':esc(pd.why)+' · 你有 '+Y(p.cash))+(short?'<br><b class="red">还差 '+Y(short)+'!</b> 可以先抵押地产,实在不行就破产':'')+'</p>';
  h+='<div class="row">'+(hasFree?'<button class="btn" id="pFree">使用「免费1次!」</button>':'')+'<button class="btn pri big" id="pYes"'+(short?' disabled':'')+'>确认支付 '+Y(pd.amount)+'</button></div>';
  if(short&&E.luckyAvail(S,pd.pid))h+='<div class="row"><button class="btn luckyb" id="pLk">🍀 翻身机会 · 掷幸运骰<small>掷到 5 得 ¥500 · 掷到 6 得 ¥1000</small></button></div>';
  if(short&&socOn()&&E.active(S).some(function(q){return q.id!==pd.pid&&q.cash>=100}))h+='<div class="row"><button class="btn sm socbtn" id="pLn">🤝 找人借钱</button></div>';
  if(short)h+='<div class="row"><button class="btn sm" id="pMg">去抵押/变卖</button><button class="btn warn sm" id="pBk">宣告破产</button></div>';
  UI.modal(h,{cls:'sticky'});
  later(function(){mood(pd.pid,short?'worried':'angry')},350);
  $('pYes').onclick=function(){closeThen(function(){act('ok')})};
  if(hasFree)$('pFree').onclick=function(){closeThen(function(){act('free')})};
  if($('pLn'))$('pLn').onclick=function(){Sound.tap();borrowFlow(pd.pid,short,function(){showPend(true)})};
  if(short){$('pMg').onclick=function(){assets(pd.pid,true)};
   if($('pLk'))$('pLk').onclick=function(){closeThen(function(){act('lucky')})};
   $('pBk').onclick=function(){if(E.luckyAvail(S,pd.pid)){UI.confirm({title:'等一下!还有翻身机会',text:p.name+' 还有 1 次幸运骰:掷到 5 得 ¥500,6 得 ¥1000。不试试就破产吗?',yes:'试试手气',no:'直接破产',icon:'star'}).then(function(ok){if(ok){closeThen(function(){act('lucky')})}else bk2()});return}bk2()};
   function bk2(){UI.confirm({title:'确定破产吗?',text:p.name+' 的现金和地产会'+(typeof pd.to==='number'?'全部交给 '+P(pd.to).name:'回到银行')+',退出游戏。',yes:'宣告破产',danger:true}).then(function(ok){if(ok){shownKey='';act('bankrupt')}else showPend(true)})}}
 }
 function mGain(pd){
  if(pd.kind==='start'){
   var gp=P(pd.pid),gf=E.finState(S,pd.pid),dg=gf&&gf.id==='danger';
   try{GC.Voice.say((dg?'救命钱来啦,':'')+'领取'+pd.amount+'元','n')}catch(x){}
   var gh=who(pd.pid,dg?'救命钱来啦!':'走到起点')+'<div class="gold-coin">'+UI.ICO.coin+'<i></i><i></i><i></i></div><h2>'+esc(pd.why)+'</h2><div class="cashba"><span>领取前<b>'+Y(gp.cash)+'</b></span><i>➜</i><span class="pos">领取后<b>'+Y(gp.cash+pd.amount)+'</b></span></div><div class="row"><button class="btn pri big gold" id="gOk">领取 '+Y(pd.amount)+'</button></div>';
   UI.modal(gh,{cls:'sticky gainm'+(dg?' danger':'')});later(function(){mood(pd.pid,'happy')},350);$('gOk').onclick=function(){closeThen(function(){act('ok')})};return}
  var h=who(pd.pid)+'<div class="gainic">'+UI.ICO.coin+'</div><h2>'+esc(pd.why)+'</h2><div class="bigamt up">+'+Y(pd.amount)+'</div><div class="row"><button class="btn pri" id="gOk">领取</button></div>';
  UI.modal(h,{cls:'sticky'});later(function(){mood(pd.pid,'happy')},350);$('gOk').onclick=function(){closeThen(function(){act('ok')})};
 }
 function mGainAll(pd){
  var h='<div class="gainic">'+UI.ICO.users+'</div><h2>'+esc(pd.why)+'</h2><p>所有玩家从银行各领 <b>'+Y(pd.amount)+'</b></p><div class="avrow">'+E.active(S).map(function(p){return tkAv(p.tok,44,'av')}).join('')+'</div><div class="row"><button class="btn pri" id="gOk">大家一起领</button></div>';
  UI.modal(h,{cls:'sticky'});$('gOk').onclick=function(){closeThen(function(){act('ok')})};
 }
 function cardFace(n){var c=E.card(n);return '<div class="ccard"><div class="cch"><b>'+esc(c.title)+'</b></div><div class="ccb"><p>'+esc(c.text)+'</p></div><div class="cct '+(c.hold?'hold':'now')+'">'+(c.hold?'收好 · 需要时「使用」':'立即生效')+'</div></div>'}
 function mChance(pd){
  var p=P(pd.pid),flipped=pd.stage==='face';
  var h=who(pd.pid,'停在「机会」')+'<div class="flipw"><div class="flipc'+(flipped?' f':'')+'" id="flipc"><div class="ff back"><div class="cb"><b>机会</b><div class="qm">?</div><small>点一下翻开</small></div></div><div class="ff front" id="ffront">'+(flipped?cardFace(pd.card):'')+'</div></div></div><div class="row" id="chRow">'+(flipped?chBtn(pd):'')+'</div>';
  UI.modal(h,{cls:'sticky chm'});
  var fc=$('flipc');
  function doFlip(){
   if(fc.classList.contains('f')||fc.getAttribute('data-b'))return;fc.setAttribute('data-b',1);
   var r=act('flip',null,{noAfter:true});if(!r.ok){fc.removeAttribute('data-b');return}
   try{GC.Voice.say('机会卡,'+E.card(r.card).title,'n')}catch(x){}
   $('ffront').innerHTML=cardFace(r.card);Sound.flip();Sound.vib(20);fc.classList.add('f');
   shownKey=pkey(S.pend);
   later(function(){$('chRow').innerHTML=chBtn(S.pend);bindCh()},UI.reduce()?0:650);
  }
  fc.onclick=doFlip;
  function bindCh(){var b=$('chOk');if(b)b.onclick=function(){closeThen(function(){act('ok')})}}
  bindCh();
 }
 function chBtn(pd){var c=E.card(pd.card);return '<button class="btn pri" id="chOk">'+(c.hold?'收进手牌':'确认执行')+'</button>'}
 function mWind(pd){
  var stage=pd.stage;
  var h=who(pd.pid,'天降横财!')+'<h2>再掷一次骰子</h2><p>获得 点数 × ¥100 的奖金</p><div class="wdie" id="wdie">'+(pd.v?Dice.svg(pd.v):qdie())+'</div><div class="bigamt up" id="wamt">'+(stage==='pay'?'+'+Y(pd.amount):'')+'</div><div class="row" id="wRow">'+(stage==='pay'?'<button class="btn pri" id="wOk">领取</button>':'<button class="btn big" id="wRoll">掷骰子</button>')+'</div>';
  UI.modal(h,{cls:'sticky'});
  function bindOk(){var b=$('wOk');if(b)b.onclick=function(){closeThen(function(){act('ok')})}}
  bindOk();
  var rb=$('wRoll');
  if(rb){var go=function(){
    if(rb.getAttribute('data-b'))return;rb.setAttribute('data-b',1);
    var r=act('wroll',null,{defer:true});if(!r.ok){rb.removeAttribute('data-b');return}
    shownKey=pkey(S.pend)+'|w';var wd=$('wdie');wd.innerHTML='';var w=document.createElement('div');w.className='ctdw';wd.appendChild(w);Dice.render(w,[1]);w.style.setProperty('--ds','100%');
    Dice.roll(w,[r.v],function(){if(!$('wamt')||!$('wRow')){shownKey='';render();return} /* modal was closed meanwhile → showPend re-opens the right step */
     $('wamt').textContent='+'+Y(r.v*100);Sound.coin();
     if(S.pend&&S.pend.t==='windfall'){$('wRow').innerHTML='<button class="btn pri" id="wOk">领取</button>';bindOk()}
     else{$('wRow').innerHTML='';later(function(){shownKey='';UI.close();playEvents(r.evs||[]).then(function(){render();maybeAutoEnd()})},UI.reduce()?30:900)}});
   };rb.onclick=go;$('wdie').onclick=go}
 }
 /* generic picker: players / properties / numbers / destinations */
 function mPick(pd){
  var items=[],sel=null,body='';
  var pu=pd.purpose,yesTxt={upgrade:'确认升级',force:'确认强买',monster:'确认拆除',angel:'确认降临',swap1:'选好了 ➜',swap2:'确认交换',airport:'起飞!',remote:'确认步数',reverse:'确认',seal:'确认查封',slow:'确认',sleep:'确认',rewind:'确认'}[pu]||'确认';
  function propRow(o){
   var q=S.props[o.name],dd=DATA.deeds[o.name],col=DATA.cardHex[dd.card],own=q.owner!=null?P(q.owner):null,extra='';
   if(pu==='upgrade'){extra='<b>'+Y(o.cost)+'</b><small>→ '+E.LVN[o.to]+'</small>'}
   else if(pu==='force'){extra='<b>'+Y(o.price)+'</b><small>= 现在的观光费</small>'}
   else if(pu==='angel'){var grp=E.groupMembers(S,o.name).filter(function(m){return S.props[m].owner!=null&&(S.cfg.angelScope==='all'||S.props[m].owner===pd.pid)&&!S.props[m].mort});extra='<small>同色 '+grp.length+' 处一起升</small>'}
   var dis=pu==='upgrade'&&P(pd.pid).cash<o.cost;
   return{val:o.name,dis:dis,html:'<span class="pchip" style="background:'+col+'"></span><span class="pnm">'+o.name+'</span><span class="plv">'+lvSVG(q.lvl)+'</span>'+(own&&pu!=='upgrade'&&pu!=='angel'?tkAv(own.tok,26):'')+'<span class="pex">'+extra+'</span>'};
  }
  if(pd.kind==='player'){
   items=pd.opts.map(function(id){var p=P(id);return{val:id,html:tkAv(p.tok,40,'av')+'<span class="pnm">'+esc(p.name)+(id===pd.pid?'(自己)':'')+'</span><span class="pex"><small>'+Y(p.cash)+(p.rev||p.sleep||p.seal||p.slow?'':'')+'</small></span>'}});
  }else if(pd.kind==='prop'){items=pd.opts.map(propRow)}
  else if(pd.kind==='num'){items=pd.opts.map(function(n){return{val:n,html:'<span class="nd">'+Dice.svg(n)+'</span>',num:true}})}
  else if(pd.kind==='dest'){items=pd.opts.map(function(o){var s=SQ[o.sq];return{val:o.name,html:'<span class="pchip" style="background:'+s.stripHex+'"></span><span class="pnm">'+o.name+'</span>',dest:true}})}
  var cls=(pd.kind==='num'?' nums':pd.kind==='dest'?' dests':'');
  function draw(){
   var h='<h2>'+esc(pd.title)+'</h2><p>'+esc(pd.text)+'</p><div class="plist'+cls+'">'+items.map(function(it,i){return '<button class="pit'+(sel===i?' on':'')+(it.dis?' dis':'')+'" data-i="'+i+'"'+(it.dis?' disabled':'')+'>'+it.html+'</button>'}).join('')+'</div>';
   if(!items.length)h+='<p class="red">没有可以选的</p>';
   var bk=E.backInfo(S),src=pd.card?'<div class="pksrc">手牌「'+esc(E.card(pd.card).title)+'」</div>':pd.cc?'<div class="pksrc">机会卡「'+esc(E.card(pd.cc).title)+'」</div>':'';
   h=src+h+'<div class="row pkrow">'+(bk?'<button class="btn" id="pkBack">↩ 上一步</button>':'')+'<button class="btn" id="pkNo">'+giveTxt(pd)+'</button><button class="btn pri" id="pkOk"'+(sel==null?' disabled':'')+'>'+yesTxt+'</button></div>';
   UI.modal(h,{cls:'sticky pickm'});
   Array.prototype.forEach.call($('box').querySelectorAll('.pit'),function(b){b.onclick=function(){sel=+b.getAttribute('data-i');Sound.tap();draw()}});
   $('pkNo').onclick=function(){ // v17 放弃
    if(pd.cc){UI.confirm({title:'放弃「'+E.card(pd.cc).title+'」?',text:'这张机会卡会作废(放回牌堆),这回合就当没抽到它。',yes:'放弃',no:'再想想',icon:'info'}).then(function(ok){if(ok)closeThen(function(){act('giveup')});else draw()});return}
    closeThen(function(){var r=act('giveup');if(r.ok&&r.kept)UI.toast('「'+E.card(r.kept).title+'」收回手牌',1500,'info')})};
   if($('pkBack'))$('pkBack').onclick=function(){Sound.tap();shownKey='';var r=act('back',null,{noAfter:true});if(!r.ok)return;UI.close();render();if(r.to==='card')handCard(r.pid,r.card)};
   $('pkOk').onclick=function(){
    var it=items[sel];if(!it)return;var v=it.val;
    if(pu==='swap1'){shownKey='';var r=act('pick',{value:v},{noAfter:true});if(r.ok){S.ev=[];save();render()}return}
    UI.confirm({title:confirmTitle(pd,v),text:confirmText(pd,v),yes:yesTxt,icon:'check'}).then(function(ok){if(!ok){draw();return}shownKey='';act('pick',{value:v})});
   };
  }
  draw();
 }
 function giveTxt(pd){return pd.card?'先不用':pd.purpose==='airport'?'不飞了':pd.purpose==='upgrade'?'不升级':'放弃'}
 function confirmTitle(pd,v){var pu=pd.purpose;
  if(pu==='upgrade')return '升级 '+v+'?';if(pu==='force')return '强买 '+v+'?';if(pu==='monster')return '让怪兽拆 '+v+'?';if(pu==='angel')return '降临在 '+v+'?';
  if(pu==='swap2')return '交换 '+pd.mine+' ⇄ '+v+'?';if(pu==='airport')return '飞往 '+v+'?';if(pu==='remote')return '下次走 '+v+' 步?';
  return '就选 '+(P(v)?P(v).name:v)+'?'}
 function confirmText(pd,v){var pu=pd.purpose;
  if(pu==='upgrade'){var o=pd.opts.filter(function(x){return x.name===v})[0];return '支付 '+Y(o.cost)+',升到'+E.LVN[o.to]+'。'}
  if(pu==='force'){var f=pd.opts.filter(function(x){return x.name===v})[0];return '向 '+pName(f.owner)+' 支付 '+Y(f.price)+' 买下,对方不能拒绝。'}
  if(pu==='swap2')return '对方不可以拒绝,地产上的房子跟着地产走。';
  if(pu==='monster')return S.cfg.monster==='all'?'这处地产的房子会被拆光。':'这处地产会被拆掉 1 级。';
  if(pu==='angel')return '同色的地产全部提升 '+S.cfg.angelLevels+' 级(免费)。';
  if(pu==='airport')return '乘飞机沿棋盘前进直达;路过起点可领 ¥2000,到了按那里规则办。';
  if(pu==='remote')return '这次掷骰直接走 '+v+' 步(龟速时只走1步)。';
  if(pu==='sleep')return P(v).name+' 原地睡 2 轮,不能动也不能收观光费。';
  if(pu==='slow')return P(v).name+' 连续 2 轮只能前进一步。';
  if(pu==='reverse')return P(v).name+' 掉头倒着走 2 轮。';
  if(pu==='seal')return P(v).name+' 的所有地产 2 轮不能收观光费。';
  if(pu==='rewind')return P(v).name+' 回到上一回合开始的位置。';
  return '确认吗?'}
 /* ---------- hand cards ---------- */
 function handCard(pid,n){
  var p=P(pid),why=E.canUse(S,p,n),c=E.card(n),mine=pid===S.turn;
  var h='<div class="hcw">'+who(pid,'的手牌')+cardFace(n)+'<p>'+(why?'<span class="red">现在不能用:'+esc(why)+'</span>':'可以使用!')+'</p></div><div class="row"><button class="btn" id="hcNo">关闭</button><button class="btn pri" id="hcUse"'+(why?' disabled':'')+'>使用</button></div>';
  UI.modal(h,{cls:'handm'});
  $('hcNo').onclick=UI.close;
  $('hcUse').onclick=function(){
   UI.confirm({title:'使用「'+c.title+'」?',text:c.text,yes:'确认使用',icon:'star'}).then(function(ok){
    if(!ok){handCard(pid,n);return}
    shownKey='';var r=act('use',{pid:pid,card:n},{noAfter:true});
    if(r.ok){S.ev=[];save();render()}
   });
  };
 }
 /* ---------- assets (mortgage / redeem / sell / build) ---------- */
 function assets(pid,fromPay){
  var p=P(pid);if(p&&p.out&&p.outWhy==='bankrupt'){bustInfo(pid);return}
  if(!p||p.out){UI.close();return}
  var ow=E.ownedBy(S,pid),w=E.netWorth(S,pid),rank=E.standings(S).map(function(x){return x.pid}).indexOf(pid)+1;
  var h='<h2 class="ah2">我的资产</h2><div class="ash">'+who(pid)+'<div class="ashc" data-a="c">'+Y(p.cash)+'</div></div>';
  h+=swRow(pid);
  h+='<div class="fsrow">'+finBadge(E.finState(S,pid),true)+'<small>'+esc((E.finState(S,pid)||{}).why||'')+'</small></div><div class="astat"><div><small>现金</small><b>'+Y(w.cash)+'</b></div><div><small>现金排名</small><b>第 '+rank+' / '+E.active(S).length+' 名</b></div><div><small>地产</small><b>'+ow.length+' 处</b></div></div><div class="anote">净资产 '+Y(w.total)+'</div>';
  h+='<div class="anote">净资产 = 现金 '+Y(w.cash)+' + 地价 '+Y(w.land)+' + 已建房费 '+Y(w.build)+(w.debt?' − 抵押待赎回 '+Y(w.debt):'')+(w.lent?' + 借出 '+Y(w.lent):'')+(w.owe?' − 欠款 '+Y(w.owe):'')+'</div>';
  h+=loanSection(pid);
  if(p.hand.length)h+='<h3 class="ah3">手牌 · 点一下查看/使用</h3><div class="chand ahand">'+p.hand.map(function(c){var ok=!E.canUse(S,p,c);return '<button class="hc'+(ok?' ok':'')+'" data-hc="'+c+'">'+HOLDSHORT[c]+(ok?' · 可用':'')+'</button>'}).join('')+'</div>';
  h+='<h3 class="ah3">地产</h3><div class="alist">'+(ow.length?ow.map(function(n){
   var q=S.props[n],d=E.deed(S,n),dd=DATA.deeds[n],btns='';
   if(q.mort)btns+='<button class="btn sm" data-a="rd" data-n="'+n+'">赎回 −'+Y(d.redeem)+'</button>';
   else{btns+='<button class="btn sm" data-a="mg" data-n="'+n+'">抵押 +'+Y(d.mortgage)+'</button>';
    if(q.lvl<4)btns+='<button class="btn sm" data-a="bd" data-n="'+n+'">升级 −'+Y(d.build[q.lvl===3?1:0])+'</button>';
    if(q.lvl>0)btns+='<button class="btn sm" data-a="sb" data-n="'+n+'">拆1级 +'+Y(Math.floor(d.build[q.lvl===4?1:0]*S.cfg.refundPct/100))+'</button>'}
   return '<div class="arow'+(q.mort?' mort':'')+'"><div class="ar1"><button class="alm" data-view="'+n+'" aria-label="查看 '+n+'">'+LM.svg(n)+(q.mort?'<span class="almt">抵押</span>':'')+'</button><div class="ari"><b><span class="pchip" style="background:'+DATA.cardHex[dd.card]+'"></span>'+n+'</b><span class="ark"><span class="plv">'+lvSVG(q.lvl)+'</span>'+(q.mort?'<em class="bdm">抵押中</em>':'<em>'+E.LVN[q.lvl]+'</em>')+'</span><small>'+(q.mort?(S.cfg.mortRent?'观光费 '+Y(E.rentFor(S,n).amount):'不收观光费')+' · 赎回 '+Y(d.redeem):'观光费 '+Y(E.rentFor(S,n).amount)+(E.rentFor(S,n).mult>1?'(同色×2)':''))+' · 地价 '+Y(d.price)+'</small></div></div><div class="ar2">'+btns+'</div></div>';
  }).join(''):'<p class="none">还没有地产,停在空地时可以买哦</p>')+'</div>';
  h+='<div class="row">'+(E.active(S).length>1?'<button class="btn" id="asTr">交易</button>':'')+''+(socOn()&&E.active(S).length>1?'<button class="btn" id="asSo">🤝 互动</button>':'')+'<button class="btn" id="asLb">排行榜</button><button class="btn warn" id="asLv">离开游戏</button></div><div class="row"><button class="btn pri" id="asOk">'+(fromPay?'回去付款':'关闭')+'</button></div>';
  UI.modal(h,{cls:'sticky assm'});
  $('asOk').onclick=function(){UI.close();shownKey='';render()};
  $('asLb').onclick=function(){leaderboard(pid)};
  if($('asSo'))$('asSo').onclick=function(){social(pid,function(){assets(pid,fromPay)})};
  Array.prototype.forEach.call($('box').querySelectorAll('[data-rp]'),function(b){b.onclick=function(){var l=S.loans.filter(function(x){return x.id===+b.getAttribute('data-rp')})[0],amt=Math.min(l.owe,p.cash);UI.confirm({title:'还给 '+P(l.from).name+' '+Y(amt)+'?',text:amt<l.owe?'先还一部分,还欠 '+Y(l.owe-amt)+'。':'还清这笔借款。',yes:'还钱',icon:'coin'}).then(function(ok){if(!ok){assets(pid,fromPay);return}shownKey='';var r=act('repay',{id:l.id,amount:amt},{noAfter:false});if(!r.ok)assets(pid,fromPay)})}});
  if($('asTr'))$('asTr').onclick=function(){trade(pid)};
  Array.prototype.forEach.call($('box').querySelectorAll('[data-sw]'),function(b){b.onclick=function(){Sound.tap();assets(+b.getAttribute('data-sw'),fromPay)}});
  Array.prototype.forEach.call($('box').querySelectorAll('[data-hc]'),function(b){b.onclick=function(){handCard(pid,+b.getAttribute('data-hc'))}});
  Array.prototype.forEach.call($('box').querySelectorAll('[data-view]'),function(b){b.onclick=function(){deedView(b.getAttribute('data-view'),function(){assets(pid,fromPay)})}});
  $('asLv').onclick=function(){UI.confirm({title:p.name+' 要离开吗?',text:'现金 '+Y(p.cash)+' 和所有地产都会回到银行。',yes:'确认离开',danger:true,icon:'users'}).then(function(ok){if(!ok){assets(pid,fromPay);return}shownKey='';var r=act('leave',{pid:pid});if(!r.ok)assets(pid,fromPay)})};
  Array.prototype.forEach.call($('box').querySelectorAll('[data-a][data-n]'),function(b){b.onclick=function(){
   var a=b.getAttribute('data-a'),n=b.getAttribute('data-n');
   if(a==='bd'&&!S.cfg.buildAnywhere){
    UI.confirm({title:'现在不能随便盖房',text:'说明书:只能停在自己的地产,或走到「升级房产」格时才能盖房。要把规则改成「随时可盖」吗?',yes:'改成随时可盖',no:'算了',icon:'house'}).then(function(ok){if(ok){S.cfg.buildAnywhere=true;save();doAsset(a,n)}else assets(pid,fromPay)});return}
   doAsset(a,n);
  }});
  function doAsset(a,n){
   var d=E.deed(S,n),q=S.props[n];
   var cfg={mg:['抵押 '+n+'?','抵押后从银行拿 '+Y(d.mortgage)+','+(S.cfg.mortRent?'':'抵押期间不收观光费,')+'赎回要付 '+Y(d.redeem)+'。','mortgage','确认抵押'],
    rd:['赎回 '+n+'?','付给银行 '+Y(d.redeem)+' 赎回。','redeem','确认赎回'],
    sb:['拆掉 '+n+' 一级房子?','退还 '+Y(Math.floor(d.build[q.lvl===4?1:0]*S.cfg.refundPct/100))+'(按建房费 '+S.cfg.refundPct+'%)。','sellBuilding','确认拆除'],
    bd:['升级 '+n+'?','付 '+Y(d.build[q.lvl===3?1:0])+',从「'+E.LVN[q.lvl]+'」升到「'+E.LVN[q.lvl+1]+'」,观光费 '+Y(d.rent[q.lvl])+' → '+Y(d.rent[q.lvl+1])+'。','build','确认建造']}[a];
   UI.confirm({title:cfg[0],text:cfg[1],yes:cfg[3],icon:'house'}).then(function(ok){
    if(!ok){assets(pid,fromPay);return}
    shownKey='';var r=act(cfg[2],{pid:pid,name:n},{noAfter:true});
    if(r.ok){UI.toast(a==='mg'?'抵押成功 +'+Y(r.amount):a==='rd'?'已赎回':a==='sb'?'已拆除 +'+Y(r.amount):'建好啦!',1500,'check');
     var evs=S.ev.slice();S.ev=[];save();busy=true;playEvents(evs).then(function(){render();assets(pid,fromPay)})}
    else assets(pid,fromPay);
   });
  }
 }
 function swRow(pid){var l=E.active(S).concat(E.busted(S));if(l.length<2)return '';
  return '<div class="stks">'+l.map(function(q){return '<button class="stk'+(q.id===pid?' on':'')+(q.out?' bust':'')+'" data-sw="'+q.id+'" style="--pc:'+TKC[q.tok]+'" aria-label="'+esc(q.name)+(q.out?' 已破产':'')+'">'+tkAv(q.tok,30)+'</button>'}).join('')+'</div>'}
 /* v17: assets view of a bankrupt player — read-only info */
 function bustInfo(pid){
  var p=P(pid),rk=E.ranking(S),me=rk.filter(function(x){return x.pid===pid})[0],to=p.outTo!=null?P(p.outTo):null;
  var h='<h2 class="ah2">资产</h2><div class="ash">'+who(pid,'<i class="bkb">已破产</i>')+'<div class="ashc">'+Y(p.cash)+'</div></div>'+swRow(pid)+
   '<div class="astat"><div><small>现金</small><b>'+Y(p.cash)+'</b></div><div><small>排名</small><b>第 '+(me?me.rank:'-')+' / '+rk.length+' 名</b></div><div><small>地产</small><b>'+E.ownedBy(S,pid).length+' 处</b></div></div>'+
   '<div class="anote bustn">'+esc(outTxt(p))+' · 财产'+(to?'交给 '+esc(to.name):'回到银行')+'。破产后不再轮到 TA,下局再来加油!</div>'+
   '<div class="row"><button class="btn" id="asLb">排行榜</button><button class="btn pri" id="asOk">关闭</button></div>';
  UI.modal(h,{cls:'sticky assm'});
  $('asOk').onclick=function(){UI.close();shownKey='';render()};$('asLb').onclick=function(){leaderboard(pid)};
  Array.prototype.forEach.call($('box').querySelectorAll('[data-sw]'),function(b){b.onclick=function(){Sound.tap();assets(+b.getAttribute('data-sw'))}});
 }
 function rankRow(x,i,mx){
  var pl=P(x.pid),cur=!x.out&&x.pid===S.turn&&S.phase==='play',med=i<3&&(!x.out||S.phase==='over');
  return '<button class="lbrow r'+i+(cur?' cur':'')+(x.out?' bust':'')+'" data-pid="'+x.pid+'" style="--pc:'+TKC[pl.tok]+'"><span class="lbr">'+(med?['🥇','🥈','🥉'][i]:(i+1))+'</span>'+tkAv(pl.tok,40,'av')+'<div class="lbi"><b>'+esc(x.name)+(cur?'<em>轮到TA</em>':'')+(x.out?'<i class="bkb">已破产</i>':finBadge(E.finState(S,x.pid)))+'</b><i class="lbbar"><u style="width:'+(x.out?0:Math.max(4,Math.round(Math.max(0,x.cash)/mx*100)))+'%"></u></i><small>'+(x.out?esc(outTxt(pl))+(pl.outTo!=null&&P(pl.outTo)?' · 财产归 '+esc(P(pl.outTo).name):' · 财产回到银行'):'净资产 '+Y(x.total)+' · 地产 '+x.props+' 处'+(x.w.build?' · 建房 '+Y(x.w.build):'')+(x.w.owe?' · <b class="red">欠款 '+Y(x.w.owe)+'</b>':'')+(x.w.lent?' · 借出 '+Y(x.w.lent):''))+'</small></div><span class="lbt"><small>现金流</small>'+Y(x.cash)+'</span></button>'}
 /* ---------- v18 玩家互动: 借钱 / 送红包 / 卖房子 / 还钱 ---------- */
 function socOn(){return S.cfg.loanOn!==false&&S.phase==='play'}
 function socBack(back){return back||function(){UI.close();shownKey='';render()}}
 function sayLine(pid,type){var p=P(pid);if(!p||!LN)return '';var t=LN.pick(p.tok,type,function(n){return Dice.int(n)});if(t){try{GC.Voice.say(t,p.tok)}catch(x){}}return t}
 function chipsHTML(list,val,max){return '<div class="amch">'+list.map(function(v){return '<button class="btn amc'+(v===val?' on':'')+'" data-v="'+v+'"'+(max!=null&&v>max?' disabled':'')+'>'+Y(v)+'</button>'}).join('')+'</div><div class="amst"><button class="btn sm" data-d="-100">−100</button><b class="amv">'+Y(val)+'</b><button class="btn sm" data-d="100">+100</button></div>'}
 function bindChips(get,set,max,redraw){Array.prototype.forEach.call($('box').querySelectorAll('.amc'),function(b){b.onclick=function(){Sound.tap();set(+b.getAttribute('data-v'));redraw()}});
  Array.prototype.forEach.call($('box').querySelectorAll('[data-d]'),function(b){b.onclick=function(){Sound.tap();var v=get()+(+b.getAttribute('data-d'));v=Math.max(100,Math.min(max!=null?max:99900,v));set(v);redraw()}})}
 function plRows(list,sub){return '<div class="plist socpl">'+list.map(function(q){return '<button class="pit" data-p="'+q.id+'">'+tkAv(q.tok,40,'av')+'<span class="pnm">'+esc(q.name)+'</span><span class="pex"><small>'+sub(q)+'</small></span></button>'}).join('')+'</div>'}
 function social(pid,back){
  back=socBack(back);var p=P(pid);if(!p||p.out||!socOn()){back();return}
  var owes=E.loansOf(S,pid).filter(function(l){return l.to===pid});
  var h='<h2>互动</h2>'+who(pid,'想做什么?')+'<div class="socg">'+
   '<button class="btn socb" id="soLoan"><span class="soci">🤝</span><b>借钱</b><small>向别的玩家借钱</small></button>'+
   '<button class="btn socb" id="soGift"'+(p.cash>=100?'':' disabled')+'><span class="soci">🧧</span><b>送红包</b><small>送钱给好朋友</small></button>'+
   '<button class="btn socb" id="soSell"'+(E.ownedBy(S,pid).length?'':' disabled')+'><span class="soci">🏠</span><b>卖房子</b><small>把地产卖给别人</small></button>'+
   (owes.length?'<button class="btn socb" id="soPay"><span class="soci">💰</span><b>还钱</b><small>欠 '+Y(owes.reduce(function(s,l){return s+l.owe},0))+'</small></button>':'')+
   '</div><div class="row"><button class="btn pri" id="soX">关闭</button></div>';
  UI.modal(h,{cls:'sticky socm'});
  var me=function(){social(pid,back)};
  $('soX').onclick=function(){back()};
  $('soLoan').onclick=function(){Sound.tap();borrowFlow(pid,0,me)};
  $('soGift').onclick=function(){Sound.tap();giftFlow(pid,me)};
  $('soSell').onclick=function(){Sound.tap();sellFlow(pid,me)};
  if($('soPay'))$('soPay').onclick=function(){Sound.tap();assets(pid)};
 }
 function borrowFlow(pid,need,back){
  var st='lender',lender=null,amt=need>0?Math.ceil(need/100)*100:1000,rate=0,line='';
  var others=E.active(S).filter(function(q){return q.id!==pid});
  function draw(){
   var b=P(pid),h='';
   if(st==='lender'){
    h='<div class="pksrc">🤝 借钱 · 第 1 步</div><h2>向谁借钱?</h2>'+(need>0?'<p>还差 <b class="red">'+Y(need)+'</b>,找好朋友帮帮忙</p>':'<p>点一位玩家</p>')+plRows(others,function(q){return '有 '+Y(q.cash)})+
     '<div class="row"><button class="btn" id="soBk">↩ 上一步</button></div>';
   }else if(st==='amt'){
    var L=P(lender),mx=L.cash-L.cash%100;if(amt>mx)amt=Math.max(100,mx);
    var ch=[500,1000,2000];if(need>0&&ch.indexOf(Math.ceil(need/100)*100)<0)ch.unshift(Math.ceil(need/100)*100);
    h='<div class="pksrc">🤝 借钱 · 第 2 步</div><h2>借多少?</h2><div class="payrow">'+who(lender)+'<span class="arw">➜</span>'+who(pid)+'</div>'+chipsHTML(ch,amt,mx)+'<p class="sub">'+esc(L.name)+' 有 '+Y(L.cash)+' · 第 '+((S.round||1)+(+S.cfg.loanRounds||3))+' 回合到期</p>'+
     '<div class="row"><button class="btn" id="soBk">↩ 上一步</button><button class="btn pri" id="soNx"'+(mx<100?' disabled':'')+'>问问 TA ➜</button></div>';
   }else{
    var L2=P(lender),owe=E.loanOwe(amt,rate);
    h='<div class="handoff" style="--pc:'+TKC[L2.tok]+'"><div class="hoico">📱</div><b>请把 iPad 交给</b>'+who(lender)+'</div>'+
     '<div class="askb">'+tkAv(b.tok,44,'av')+'<div><b>'+esc(b.name)+' 想借 '+Y(amt)+'</b>'+(line?'<span>“'+esc(line)+'”</span>':'')+'</div></div>'+
     '<div class="sec"><h3>要利息吗?(出借人选)</h3><div class="seg" id="soRate"><button class="btn'+(rate===0?' on':'')+'" data-r="0">不要利息</button><button class="btn'+(rate===10?' on':'')+'" data-r="10">利息 10%</button></div><small>到期要还 <b>'+Y(owe)+'</b> · 第 '+((S.round||1)+(+S.cfg.loanRounds||3))+' 回合到期,也可以提前还</small></div>'+
     '<div class="row"><button class="btn" id="soBk">↩ 上一步</button><button class="btn warn" id="soNo">拒绝</button><button class="btn pri big" id="soYes">同意</button></div>';
   }
   UI.modal(h,{cls:'sticky socm'});
   $('soBk').onclick=function(){Sound.tap();if(st==='lender'){back();return}st=st==='hand'?'amt':'lender';draw()};
   if(st==='lender')Array.prototype.forEach.call($('box').querySelectorAll('.pit[data-p]'),function(x){x.onclick=function(){Sound.tap();lender=+x.getAttribute('data-p');st='amt';draw()}});
   if(st==='amt'){bindChips(function(){return amt},function(v){amt=v},P(lender).cash-P(lender).cash%100,draw);$('soNx').onclick=function(){Sound.tap();st='hand';line=sayLine(pid,'askLoan');draw()}}
   if(st==='hand'){Array.prototype.forEach.call($('box').querySelectorAll('#soRate .btn'),function(x){x.onclick=function(){Sound.tap();rate=+x.getAttribute('data-r');draw()}});
    $('soNo').onclick=function(){var t=sayLine(lender,'lendNo');UI.toast(P(lender).name+':'+(t||'这次不借'),2000,'info');back()};
    $('soYes').onclick=function(){UI.close();shownKey='';var r=act('loan',{from:lender,to:pid,amount:amt,rate:rate});if(!r.ok)draw()}}
  }
  draw();
 }
 function giftFlow(pid,back){
  var st='to',to=null,amt=500;var others=E.active(S).filter(function(q){return q.id!==pid});
  function draw(){var g=P(pid),mx=g.cash-g.cash%100,h;if(amt>mx)amt=Math.max(100,mx);
   if(st==='to')h='<div class="pksrc">🧧 送红包 · 第 1 步</div><h2>送给谁?</h2>'+plRows(others,function(q){return Y(q.cash)})+'<div class="row"><button class="btn" id="soBk">↩ 上一步</button></div>';
   else h='<div class="pksrc">🧧 送红包 · 第 2 步</div><h2>红包多大?</h2><div class="payrow">'+who(pid)+'<span class="arw">🧧</span>'+who(to)+'</div>'+chipsHTML([100,200,500,1000],amt,mx)+'<div class="row"><button class="btn" id="soBk">↩ 上一步</button><button class="btn pri" id="soYes">送出 '+Y(amt)+'</button></div>';
   UI.modal(h,{cls:'sticky socm'});
   $('soBk').onclick=function(){Sound.tap();if(st==='to')back();else{st='to';draw()}};
   if(st==='to')Array.prototype.forEach.call($('box').querySelectorAll('.pit[data-p]'),function(x){x.onclick=function(){Sound.tap();to=+x.getAttribute('data-p');st='amt';draw()}});
   else{bindChips(function(){return amt},function(v){amt=v},mx,draw);$('soYes').onclick=function(){UI.close();shownKey='';var r=act('gift',{from:pid,to:to,amount:amt});if(!r.ok)draw()}}
  }
  draw();
 }
 function sellFlow(pid,back){
  var st='prop',name=null,to=null,price=0;var others=E.active(S).filter(function(q){return q.id!==pid});
  function draw(){var h;
   if(st==='prop'){h='<div class="pksrc">🏠 卖房子 · 第 1 步</div><h2>卖哪一处?</h2><div class="plist">'+E.ownedBy(S,pid).map(function(n){var q=S.props[n];return '<button class="pit" data-n="'+n+'"><span class="pchip" style="background:'+DATA.cardHex[DATA.deeds[n].card]+'"></span><span class="pnm">'+n+'</span><span class="plv">'+lvSVG(q.lvl)+'</span><span class="pex"><small>'+(q.mort?'抵押中 · ':'')+'地价 '+Y(E.deed(S,n).price)+'</small></span></button>'}).join('')+'</div><div class="row"><button class="btn" id="soBk">↩ 上一步</button></div>'}
   else if(st==='to'){h='<div class="pksrc">🏠 卖房子 · 第 2 步</div><h2>卖给谁?</h2><p>'+esc(name)+'</p>'+plRows(others,function(q){return '有 '+Y(q.cash)})+'<div class="row"><button class="btn" id="soBk">↩ 上一步</button></div>'}
   else if(st==='price'){var d=E.deed(S,name).price,r=function(x){return Math.max(100,Math.round(x/100)*100)},ch=[r(d*.5),r(d),r(d*1.5)];if(!price)price=r(d);
    h='<div class="pksrc">🏠 卖房子 · 第 3 步</div><h2>卖多少钱?</h2><p>'+esc(name)+(S.props[name].lvl?' · 房子跟着一起卖':'')+(S.props[name].mort?' · 抵押中(买家以后自己赎回)':'')+'</p>'+chipsHTML(ch,price,P(to).cash-P(to).cash%100)+'<div class="row"><button class="btn" id="soBk">↩ 上一步</button><button class="btn pri" id="soNx">问问 TA ➜</button></div>'}
   else{var B=P(to);h='<div class="handoff" style="--pc:'+TKC[B.tok]+'"><div class="hoico">📱</div><b>请把 iPad 交给</b>'+who(to)+'</div><div class="askb">'+tkAv(P(pid).tok,44,'av')+'<div><b>'+esc(P(pid).name)+' 想把 '+esc(name)+' 卖给你</b><span>价格 '+Y(price)+' · 你有 '+Y(B.cash)+'</span></div></div>'+
     '<div class="row"><button class="btn" id="soBk">↩ 上一步</button><button class="btn warn" id="soNo">不买</button><button class="btn pri big" id="soYes"'+(B.cash<price?' disabled':'')+'>买下</button></div>'}
   UI.modal(h,{cls:'sticky socm'});
   $('soBk').onclick=function(){Sound.tap();if(st==='prop'){back();return}st={to:'prop',price:'to',hand:'price'}[st];draw()};
   if(st==='prop')Array.prototype.forEach.call($('box').querySelectorAll('.pit[data-n]'),function(x){x.onclick=function(){Sound.tap();name=x.getAttribute('data-n');price=0;st='to';draw()}});
   if(st==='to')Array.prototype.forEach.call($('box').querySelectorAll('.pit[data-p]'),function(x){x.onclick=function(){Sound.tap();to=+x.getAttribute('data-p');st='price';draw()}});
   if(st==='price'){bindChips(function(){return price},function(v){price=v},P(to).cash-P(to).cash%100,draw);$('soNx').onclick=function(){Sound.tap();st='hand';draw()}}
   if(st==='hand'){$('soNo').onclick=function(){UI.toast(P(to).name+' 不买,下次再说',1600,'info');back()};
    $('soYes').onclick=function(){UI.close();shownKey='';var r=act('sell',{from:pid,to:to,name:name,price:price});if(!r.ok)draw()}}
  }
  draw();
 }
 function loanBadges(p){var w=E.netWorth(S,p.id),b='';if(w.owe)b+='<i class="bd ln icb" title="欠款 '+Y(w.owe)+'">💸'+fmtW(w.owe)+'</i>';if(w.lent)b+='<i class="bd lt icb" title="借出 '+Y(w.lent)+'">🤝'+fmtW(w.lent)+'</i>';return b}
 function loanSection(pid){var ls=E.loansOf(S,pid);if(!ls.length)return '';
  return '<h3 class="ah3">借款</h3><div class="alist loans">'+ls.map(function(l){var mine=l.to===pid,o=P(mine?l.from:l.to),od=l.st==='overdue',me=P(pid),can=mine&&me.cash>0;
   return '<div class="arow lnr'+(od?' od':'')+'"><div class="ar1">'+tkAv(o.tok,34,'av')+'<div class="ari"><b>'+(mine?'欠 '+esc(o.name)+' '+Y(l.owe):esc(o.name)+' 欠我 '+Y(l.owe))+'</b><small>'+(od?'<em class="bdm">已逾期</em> 轮到时自动还':'第 '+l.due+' 回合到期')+' · 借了 '+Y(l.amt)+(l.rate?' · 利息 '+l.rate+'%':' · 无利息')+'</small></div></div>'+
    (mine?'<div class="ar2"><button class="btn sm pri" data-rp="'+l.id+'"'+(can?'':' disabled')+'>'+(me.cash>=l.owe?'还清 '+Y(l.owe):'先还 '+Y(me.cash))+'</button></div>':'')+'</div>'}).join('')+'</div>'}
 /* ---------- leaderboard (排行榜) ---------- */
 function leaderboard(back){
  var st=E.ranking(S),mx=Math.max(1,st.length?Math.max.apply(null,st.map(function(x){return x.cash})):1);
  var h='<h2>排行榜</h2><p>'+(S.phase==='over'?'最终排名 · ':'')+'第 '+(S.round||1)+' 回合 · 按现金流排名（现金多的排前面）'+(E.busted(S).length?',破产的排在后面(越晚破产排越前)':'')+'</p><div class="lbl">'+st.map(function(x,i){return rankRow(x,i,mx)}).join('')+'</div><div class="anote">排名先比现金，现金一样再比净资产、地产数。净资产 = 现金 + 地价 + 已建房费 − 抵押待赎回 + 借出 − 欠款。点一行可以看 TA 的资产。</div><div class="row"><button class="btn pri" id="lbOk">关闭</button></div>';
  UI.modal(h,{cls:'sticky lbm'});
  $('lbOk').onclick=function(){UI.close();shownKey='';render()};
  Array.prototype.forEach.call($('box').querySelectorAll('.lbrow'),function(b){b.onclick=function(){assets(+b.getAttribute('data-pid'))}});
 }
 /* ---------- legend (图例) ---------- */
 /* v21: 看地产 — dim everything except owned cities, per-player legend with counts */
 function propView(on){
  if(on&&S.phase!=='play'){UI.toast('游戏还没开始',1400,'info');return}
  root.classList.toggle('pview',!!on);['ctOwn','dkOwn'].forEach(function(id){var b=$(id);if(b)b.classList.toggle('on',!!on)});
  var old=root.querySelector('.pvleg');if(old)old.remove();if(!on)return;
  var h='<div class="pvh"><b>看地产</b><button class="pvx" aria-label="关闭">✕</button></div>';
  E.active(S).forEach(function(p){var n=0,hs=0,rs=0,mg=0;Object.keys(S.props).forEach(function(k){var q=S.props[k];if(q.owner!==p.id)return;n++;if(q.lvl===4)rs++;else hs+=q.lvl;if(q.mort)mg++});
   h+='<div class="pvr" style="--oc:'+TKC[p.tok]+'"><i class="pvc"></i>'+tkAv(p.tok,30,'av')+'<b class="pvn">'+esc(p.name)+'</b><span class="pvs"><em>'+n+'</em>块地'+(hs?' · <svg class="bh" viewBox="-10 -10 20 20"><use href="#houseG"/></svg>×'+hs:'')+(rs?' · <svg class="bh r" viewBox="-12 -12 24 24"><use href="#hotelR"/></svg>×'+rs:'')+(mg?' · 抵押'+mg:'')+'</span></div>'});
  var d=document.createElement('div');d.className='pvleg';d.innerHTML=h;root.appendChild(d);
  d.querySelector('.pvx').onclick=function(){Sound.tap();propView(false)};
 }
 function legendModal(){
  var smp=SQ.filter(function(s){return s.type==='property'});
  function cell(i,cls){var sm=smp[i];return '<div class="sq prop sb lgc '+cls+'" style="--cw:50px;--sc:'+sm.stripHex+'" data-lg="'+i+'">'+cellInner(sm)+'</div>'}
  var h='<h2>地图图例</h2><div class="lg4"><div>'+cell(0,'')+'<small>空地<br>没人买</small></div><div>'+cell(1,'')+'<small>有主人<br>边框=主人颜色<br>右上=主人头像</small></div><div>'+cell(2,'')+'<small>民宿 1~3 间<br>绿色小房子</small></div><div>'+cell(3,'')+'<small>度假村<br>红色大房子</small></div><div>'+cell(4,'')+'<small>抵押中<br>变灰+「抵押」章</small></div></div>'+
   '<div class="lgl"><span><i style="background:#ffd23f"></i>黄色闪烁框 = 当前玩家所在的格子</span><span><i class="lgs"></i>色条上的数字 = 地价</span><span>点任意地产格可以看大图和契约卡</span></div><div class="row"><button class="btn pri" id="lgOk2">知道了</button></div>';
  UI.modal(h,{cls:'lgm'});
  var st=[[null,0,0],[0,0,0],[1,2,0],[2,4,0],[3,1,1]];
  Array.prototype.forEach.call($('box').querySelectorAll('.lgc'),function(el,k){var c=st[k];paintCell(el,{owner:null,lvl:c[1],mort:!!c[2]},c[0]===null?null:c[0])});
  $('lgOk2').onclick=UI.close;
 }
 /* ---------- save slots (存档) ---------- */
 var SLOTN=[1,2,3];
 function slotKey(i){return 'china.s'+i}
 function pad2(n){return n<10?'0'+n:''+n}
 function tfmt(ts){if(!ts)return '';var d=new Date(ts);return (d.getMonth()+1)+'月'+d.getDate()+'日 '+pad2(d.getHours())+':'+pad2(d.getMinutes())}
 function sumHTML(sm){return '<span class="svav">'+sm.players.map(function(x){return tkAv(x.tok,26)}).join('')+'</span><span class="svt">'+(sm.phase==='setup'?'还没开始':sm.phase==='over'?'已结束':'第 '+sm.round+' 回合')+(sm.turn&&sm.phase==='play'?' · 轮到 '+esc(sm.turn):'')+' · '+sm.players.length+' 位玩家</span>'}
 function loadObj(o){
  var st=E.restore(o);if(!st){UI.toast('这个存档打不开',2000,'warn');return false}
  clearTimeout(autoEndTimer);dropBanner();busy=false;S=st;G=E.createGame(S);S=G.S;shown={};cashShown={};bubs={};dieVal=null;crisisQ=[];crisisOpen=false;sync.on=false;shownKey='';lastToastTurn=null;entryOpen=false;
  if(selv){selv.remove();selv=null}
  UI.close();save();render();
  if(S.phase==='setup')startSelect();else if(S.phase==='play')UI.toast('已载入存档',1500,'check');
  return true;
 }
 function saveModal(back){
  var auto=Store.get('china',null),asm=(auto&&auto.players&&auto.props)?E.summary(auto):null;
  var h='<h2>存档</h2><p>每走一步都会<b>自动存档</b>。也可以手动存 3 份,换个时间再玩。存档只放在这台设备的浏览器里,想换设备请用首页「设置 → 导出进度」。</p><div class="svl">';
  h+='<div class="svrow auto"><div class="svh"><b>自动存档</b><small>'+(auto&&auto.sv?tfmt(auto.sv):'')+'</small></div>'+(asm?'<div class="svs">'+sumHTML(asm)+'</div><div class="row"><button class="btn sm pri" data-sv="loadauto">载入</button></div>':'<div class="svs"><span class="svt">还没有</span></div>')+'</div>';
  SLOTN.forEach(function(i){
   var o=Store.get(slotKey(i),null),ok=o&&o.state&&o.sum;
   h+='<div class="svrow'+(ok?'':' empty')+'"><div class="svh"><input class="svn" id="svn'+i+'" maxlength="8" value="'+esc(ok&&o.name?o.name:'存档 '+i)+'" aria-label="存档名字"><small>'+(ok?tfmt(o.ts):'空位')+'</small></div>'+(ok?'<div class="svs">'+sumHTML(o.sum)+'</div>':'<div class="svs"><span class="svt">还没存过</span></div>')+
    '<div class="row"><button class="btn sm pri" data-sv="save" data-i="'+i+'">'+(ok?'覆盖保存':'保存')+'</button>'+(ok?'<button class="btn sm" data-sv="load" data-i="'+i+'">载入</button><button class="btn sm warn" data-sv="del" data-i="'+i+'">删除</button>':'')+'</div></div>';
  });
  h+='</div><div class="row"><button class="btn pri" id="svOk">'+(back?'返回':'关闭')+'</button></div>';
  UI.modal(h,{cls:'sticky savem'});
  $('svOk').onclick=function(){if(back)back();else{UI.close();shownKey='';render()}};
  function again(){saveModal(back)}
  Array.prototype.forEach.call($('box').querySelectorAll('[data-sv]'),function(b){b.onclick=function(){
   var k=b.getAttribute('data-sv'),i=+b.getAttribute('data-i'),o=i?Store.get(slotKey(i),null):null,nm=i&&$('svn'+i)?$('svn'+i).value.trim():'';
   if(k==='save'){
    if(S.phase==='setup'){UI.toast('游戏还没开始,先选好角色再存档',1800,'warn');return}
    var doSave=function(){Store.set(slotKey(i),E.snapshot(S,nm||'存档 '+i));Sound.coin();UI.toast('已保存到「'+(nm||'存档 '+i)+'」',1500,'check');again()};
    if(o&&o.state)UI.confirm({title:'覆盖这个存档吗?',text:'「'+esc(o.name||'存档 '+i)+'」('+tfmt(o.ts)+')里的旧进度会被现在的游戏替换。',yes:'覆盖保存',icon:'refresh'}).then(function(ok){if(ok)doSave();else again()});else doSave();
   }else if(k==='load'||k==='loadauto'){
    var src=k==='load'?o:E.snapshot(auto,'自动存档');
    UI.confirm({title:'载入这个存档?',text:'现在进行中的游戏会被替换'+(k==='load'?'(自动存档也会变成这个存档)':'')+'。没有存档的话就找不回来了。',yes:'载入',icon:'refresh'}).then(function(ok){if(!ok){again();return}loadObj(src)});
   }else if(k==='del'){
    UI.confirm({title:'删除这个存档?',text:'「'+esc(o.name||'存档 '+i)+'」删除后找不回来。',yes:'删除',danger:true,icon:'warn'}).then(function(ok){if(ok){Store.del(slotKey(i));UI.toast('已删除',1200,'info')}again()});
   }
  }});
 }
 function entryModal(){
  entryOpen=true;var sm=E.summary(S);
  UI.modal('<div class="enic">'+UI.ICO.star+'</div><h2>欢迎回来!</h2><div class="svs en">'+sumHTML(sm)+'</div><p>'+(S.sv?'上次玩到 '+tfmt(S.sv)+'。':'')+'接着玩,还是换一局?</p><div class="row col"><button class="btn big" id="enGo">继续上次游戏 ▶</button></div><div class="row"><button class="btn" id="enSv">读取存档</button><button class="btn" id="enNew">开始新游戏</button></div>',{cls:'sticky dlg enm'});
  $('enGo').onclick=function(){entryOpen=false;UI.close();shownKey='';Sound.hi();render();UI.toast(P(S.turn)?P(S.turn).name+' 继续!':'继续游戏',1400,'star')};
  $('enSv').onclick=function(){saveModal(entryModal)};
  $('enNew').onclick=function(){UI.confirm({title:'开始新的一局?',text:'现在的游戏会结束(最近的自动存档会被覆盖;想留着请先手动存档)。',yes:'新的一局',danger:true,icon:'refresh'}).then(function(ok){if(ok){entryOpen=false;startNew()}else entryModal()})};
 }
 /* ---------- trade ---------- */
 function trade(pid){
  var others=E.active(S).filter(function(p){return p.id!==pid}),partner=others[0].id,give={},get={},cg=0,ck=0;
  function draw(){
   var me=P(pid),pt=P(partner);
   function plist(owner,m){var l=E.ownedBy(S,owner);return l.length?l.map(function(n){return '<button class="pit sm'+(m[n]?' on':'')+'" data-n="'+n+'" data-s="'+(m===give?'g':'k')+'"><span class="pchip" style="background:'+DATA.cardHex[DATA.deeds[n].card]+'"></span><span class="pnm">'+n+'</span><span class="plv">'+lvSVG(S.props[n].lvl)+'</span></button>'}).join(''):'<small class="none">没有地产</small>'}
   var h='<h2>玩家交易</h2><div class="stks">'+others.map(function(q){return '<button class="stk'+(q.id===partner?' on':'')+'" data-p="'+q.id+'" style="--pc:'+TKC[q.tok]+'">'+tkAv(q.tok,34)+'</button>'}).join('')+'</div>'+
    '<div class="trc"><div class="trs"><h3>'+esc(me.name)+' 给出</h3><div class="plist col">'+plist(pid,give)+'</div><label>+ 现金 ¥<input id="trG" type="number" inputmode="numeric" min="0" step="100" value="'+(cg||'')+'"></label></div>'+
    '<div class="trs"><h3>'+esc(pt.name)+' 给出</h3><div class="plist col">'+plist(partner,get)+'</div><label>+ 现金 ¥<input id="trK" type="number" inputmode="numeric" min="0" step="100" value="'+(ck||'')+'"></label></div></div>'+
    '<div class="row"><button class="btn" id="trNo">返回</button><button class="btn pri" id="trOk">发起交易</button></div>';
   UI.modal(h,{cls:'sticky assm'});
   Array.prototype.forEach.call($('box').querySelectorAll('.stk'),function(b){b.onclick=function(){partner=+b.getAttribute('data-p');get={};ck=0;cg=+($('trG').value)||0;draw()}});
   Array.prototype.forEach.call($('box').querySelectorAll('.pit[data-n]'),function(b){b.onclick=function(){var n=b.getAttribute('data-n'),m=b.getAttribute('data-s')==='g'?give:get;if(m[n])delete m[n];else m[n]=1;cg=+($('trG').value)||0;ck=+($('trK').value)||0;Sound.tap();draw()}});
   $('trNo').onclick=function(){assets(pid)};
   $('trOk').onclick=function(){
    cg=Math.max(0,+($('trG').value)||0);ck=Math.max(0,+($('trK').value)||0);
    var gv=Object.keys(give),gt=Object.keys(get);
    if(!gv.length&&!gt.length&&!cg&&!ck){UI.toast('先选要交换的东西',1500,'warn');return}
    UI.confirm({title:'请 '+pt.name+' 确认交易',text:esc(me.name)+' 给出:'+(gv.join('、')||'无')+(cg?' + '+Y(cg):'')+'<br>'+esc(pt.name)+' 给出:'+(gt.join('、')||'无')+(ck?' + '+Y(ck):'')+'<br>双方都同意吗?',yes:'双方同意,成交',icon:'users'}).then(function(ok){
     if(!ok){draw();return}
     shownKey='';var r=act('trade',{from:pid,to:partner,give:gv,get:gt,cashGive:cg,cashGet:ck},{noAfter:true});
     if(r.ok){UI.toast('交易成交!',1500,'check');var evs=S.ev.slice();S.ev=[];save();busy=true;playEvents(evs).then(function(){render();assets(pid)})}else draw();
    });
   };
  }
  draw();
 }
 /* ---------- deeds list / editor (待核实) ---------- */
 function flaggedTotal(){var t=0;Object.keys(DATA.deeds).forEach(function(n){t+=E.flaggedCount(S,n)});return t}
 function deedsList(){
  var names=Object.keys(DATA.deeds).sort(function(a,b){return DATA.deeds[a].sq-DATA.deeds[b].sq}),ft=flaggedTotal();
  var h='<h2>地契 · 契约卡</h2><p class="'+(ft?'red':'')+'">'+(ft?'有 <b>'+ft+'</b> 个数字待核实(照片看不清),请对着实物卡检查,点进去可以修改。':'所有数字都核对过了')+'</p><div class="dlist">';
  names.forEach(function(n){var dd=DATA.deeds[n],q=S.props[n],c=E.flaggedCount(S,n),o=q.owner!=null?P(q.owner):null;
   h+='<button class="drow" data-n="'+n+'"><span class="pchip" style="background:'+DATA.cardHex[dd.card]+'"></span><span class="pnm">'+n+'</span><small>'+Y(E.deed(S,n).price)+'</small>'+(o?tkAv(o.tok,24):'')+(c?'<em class="vb '+(hasMiss(n)?'miss':'chk')+'">待核实 '+c+'</em>':'')+'</button>'});
  h+='</div><div class="row"><button class="btn pri" id="dlOk">关闭</button></div>';
  UI.modal(h,{cls:'deedm'});$('dlOk').onclick=function(){UI.close();shownKey='';render()};
  Array.prototype.forEach.call($('box').querySelectorAll('.drow'),function(b){b.onclick=function(){deedEdit(b.getAttribute('data-n'),'list')}});
 }
 function hasMiss(n){return E.FIELDS.some(function(f){return E.fieldInfo(S,n,f).flag==='miss'})}
 var FLABEL={price:'价格',mortgage:'抵押价值',redeem:'赎回价值',rent0:'空地观光费',rent1:'1间民宿',rent2:'2间民宿',rent3:'3间民宿',rent4:'度假村',build0:'盖1间民宿',build1:'盖1间度假村'};
 function deedEdit(name,from){
  var dd=DATA.deeds[name],col=DATA.cardHex[dd.card];
  var h='<div class="deedc ed" style="--dc:'+col+'"><div class="dh"><b>'+name+'</b><i>'+dd.landmark+'</i></div><div class="dbd">';
  ['rent0','rent1','rent2','rent3','rent4','build0','build1','mortgage','redeem','price'].forEach(function(f){
   var i=E.fieldInfo(S,name,f);
   h+='<div class="fr '+(i.flag||'')+(i.src==='user'?' usr':'')+'"><label>'+FLABEL[f]+'</label><div class="fi"><span>¥</span><input type="number" inputmode="numeric" min="0" step="10" data-f="'+f+'" value="'+i.v+'"></div><div class="fb">'+(i.flag?fbadge(i.flag)+'<button class="btn sm" data-ok="'+f+'">已核对</button>':i.src==='user'?'<em class="vb usr">已修改</em><button class="btn sm" data-rs="'+f+'">还原</button>':'')+'</div></div>';
  });
  h+='<p class="dnote">'+(dd.note?(/[\u4e00-\u9fff]/.test(dd.note)?'照片备注:'+esc(dd.note):'照片中带「待核实」的数字较模糊,已填入参考值,请对照实物卡核对后点「已核对」'):'')+'</p></div></div>';
  var tier=dd.tier&&Object.keys(dd.sug).length;
  h+='<div class="row">'+(tier?'<button class="btn sm" id="dTier">套用同价位「'+dd.tier+'」的数字</button>':'')+'</div><div class="row"><button class="btn" id="deBack">'+(from==='list'?'返回列表':'关闭')+'</button><button class="btn pri" id="deOk">完成</button></div>';
  UI.modal(h,{cls:'deedm ed'});
  var box=$('box');
  Array.prototype.forEach.call(box.querySelectorAll('input[data-f]'),function(inp){inp.onchange=function(){var f=inp.getAttribute('data-f');E.setField(S,name,f,inp.value);save();var sc=box.scrollTop;deedEdit(name,from);box.scrollTop=sc;UI.toast('已保存 '+FLABEL[f],1100,'check')};inp.onclick=function(e){e.stopPropagation()}});
  Array.prototype.forEach.call(box.querySelectorAll('[data-ok]'),function(b){b.onclick=function(){E.confirmField(S,name,b.getAttribute('data-ok'));save();var sc=box.scrollTop;deedEdit(name,from);box.scrollTop=sc}});
  Array.prototype.forEach.call(box.querySelectorAll('[data-rs]'),function(b){b.onclick=function(){E.resetField(S,name,b.getAttribute('data-rs'));save();var sc=box.scrollTop;deedEdit(name,from);box.scrollTop=sc}});
  if(tier)$('dTier').onclick=function(){
   var t=dd.tier,td=E.deed(S,t);
   var fields=Object.keys(dd.sug);fields.forEach(function(f){var m=f.match(/^rent(\d)$/);var v=m?td.rent[+m[1]]:td[f];E.setField(S,name,f,v)});save();deedEdit(name,from);UI.toast('已套用 '+t+' 的数字(仍请核对)',1800,'info')};
  $('deBack').onclick=function(){if(from==='list')deedsList();else{UI.close();shownKey='';render()}};
  $('deOk').onclick=function(){UI.close();shownKey='';render()};
 }
 /* ---------- rules / log / winner ---------- */
 function rulesModal(){
  var h='<h2>规则设置</h2><p>带「待核实」的是说明书没写清楚的地方,可按你们的习惯改。</p><div class="rl">'+CFGS.map(function(c){
   return '<div class="sec"><h3>'+c[1]+'</h3><div class="seg" data-k="'+c[0]+'">'+c[2].map(function(o){return '<button class="btn'+(String(S.cfg[c[0]])===String(o[0])?' on':'')+'" data-v="'+o[0]+'">'+o[1]+'</button>'}).join('')+'</div><small>'+c[3]+'</small></div>'}).join('')+'</div>'+
   '<div class="sec"><h3>固定规则(说明书)</h3><small>每人起始 ¥10,000 · 起点奖励 ¥2,000 · 民宿最多3间,再盖度假村 · 抵押/赎回按地契上印的数字 · 没有监狱、税、拍卖、利息</small></div>'+
   '<div class="row"><button class="btn" id="rlReset">全部恢复默认</button><button class="btn pri" id="rlOk">好了</button></div>';
  UI.modal(h,{cls:'rulesm'});
  Array.prototype.forEach.call($('box').querySelectorAll('.seg'),function(sg){sg.onclick=function(e){var t=e.target.closest('.btn');if(!t)return;var k=sg.getAttribute('data-k'),v=t.getAttribute('data-v');
   var cur=E.DEF_CFG[k];v=typeof cur==='number'?+v:typeof cur==='boolean'?v==='true':v;S.cfg[k]=v;save();Array.prototype.forEach.call(sg.children,function(c){c.classList.toggle('on',c===t)});Sound.tap()}});
  $('rlReset').onclick=function(){Object.keys(E.DEF_CFG).forEach(function(k){S.cfg[k]=E.DEF_CFG[k]});save();rulesModal()};
  $('rlOk').onclick=function(){UI.close();shownKey='';if(S.phase==='play')render()};
 }
 function logModal(){
  var h='<h2>游戏记录</h2><div class="loglist">'+S.log.slice().reverse().map(function(l){return '<div class="lg '+esc(l.k)+'">'+esc(l.t)+'</div>'}).join('')+'</div><div class="row"><button class="btn pri" id="lgOk">关闭</button></div>';
  UI.modal(h,{cls:'logm'});$('lgOk').onclick=UI.close;
 }
 function finalRank(){var rk=E.ranking(S);if(rk.length<2)return '';
  return '<div class="frank"><h3>最终排名</h3>'+rk.map(function(x,i){var pl=P(x.pid);return '<div class="frr'+(x.out?' bust':'')+'" style="--pc:'+TKC[pl.tok]+'"><span class="lbr">'+(i<3?['🥇','🥈','🥉'][i]:(i+1))+'</span>'+tkAv(pl.tok,30,'av')+'<b>'+esc(x.name)+'</b>'+(x.out?'<i class="bkb">已破产</i><small>'+esc(outTxt(pl))+'</small>':'<small>现金 '+Y(x.cash)+'</small>')+'</div>'}).join('')+'</div>'}
 function showWinner(){
  shownKey='over';var w=P(S.winner);
  var conf='';for(var i=0;i<26;i++)conf+='<i style="left:'+(i*4)+'%;background:'+['#ff4f9a','#ffd23f','#3a7bff','#2bb673','#ff8a1f'][i%5]+';animation-delay:'+(i%7)*.12+'s"></i>';
  UI.modal('<div class="confetti">'+conf+'</div><div class="winc">'+tkAv(w.tok,92,'av')+'</div><h2>'+esc(w.name)+' 获胜!</h2><p>成为超级小富翁 · 现金 '+Y(w.cash)+'</p>'+finalRank()+'<div class="row"><button class="btn" id="wvLook">看看棋盘</button><button class="btn pri" id="wvNew">再来一局</button></div>',{cls:'sticky winm'});
  Sound.win();
  $('wvLook').onclick=UI.close;$('wvNew').onclick=function(){UI.close();startNew()};
 }
 /* ---------- setup / join / new ---------- */
 function startSelect(){
  shownKey='';UI.close();if(selv){selv.remove();selv=null}
  selv=Select.screen(root,{kind:'tk',min:2,max:6,title:'选择你的角色',sub:'每位玩家点一个棋子 · 点第一个的人先走 · 每人领 ¥10,000',ok:'开始游戏',
   onDraw:function(el){var s=el.querySelector('.self');var b=document.createElement('button');b.className='btn sm selrule';b.textContent='规则设置';b.onclick=rulesModal;s.insertBefore(b,s.firstChild)},
   onDone:function(list){
    selv=null;
    var r=E.startGame(S,list.map(function(x){return{name:x.name||TKN[x.tok],tok:x.tok}}),0);
    if(!r.ok){UI.toast(r.err,2000,'warn');startSelect();return}
    S.ev=[];G=E.createGame(S);S=G.S;shown={};cashShown={};bubs={};dieVal=null;save();render();
    var fp=P(S.turn);lastToastTurn=S.turn;
    var go=function(){if(!fp)return;try{GC.Intro.banner(fp.tok,fp.name,'先掷骰子!')}catch(x){}UI.toast(fp.name+' 先掷骰子!',1800,'star')};
    var did=false;try{did=GC.Intro.vs(E.active(S).map(function(p){return{tok:p.tok,name:p.name}}),go)}catch(x){}if(!did)go();
   }});
  GC.setBack(null);
 }
 function startNew(){entryOpen=false;newGameState();render();startSelect()}
 function joinFlow(){
  if(S.phase!=='play'){UI.toast('游戏还没开始',1500,'info');return}
  var taken=E.active(S).map(function(p){return p.tok});
  if(taken.length>=6){UI.toast('最多 6 位玩家',1500,'warn');return}
  Select.join({kind:'tk',taken:taken,hint:'会领到 '+Y(S.cfg.start)+' 并站在起点',onDone:function(r){
   var res=act('join',{name:r.name||TKN[r.tok],tok:r.tok});if(res.ok)UI.toast(TKN[r.tok]+' 加入啦!',1600,'star')}});
 }
 /* ---------- mount ---------- */
 var api={tl:TL,lineFree:function(){return lineFree()},sqFx:function(i,p){sqFx(i,p)},fxPlay:function(p,k){fxPlay(p,k)},crisis:function(pid){crisisOpen=true;render();crisisModal(pid)},state:function(){return S},game:function(){return G},engine:E,render:function(){render()},busy:function(){return busy},act:function(t,a){return act(t,a)},playAll:function(){return Promise.resolve()}};
 return{
  mount:function(r,ctx){
   root=r;busy=false;shown={};cashShown={};bubs={};bubT={};entryOpen=false;crisisQ=[];crisisOpen=false;autoEndTimer=null;shownKey='';selv=null;sync.on=false;lastToastTurn=null;load();
   r.innerHTML='<div class="ctlay"><div class="ctbw"><div id="ctb" class="ctb"></div></div><div class="ctside"><div class="ctph"><div class="ctbank" id="ctBank">'+UI.ICO.coin+'<span>银行</span></div><div class="ctpot" id="ctPot"><span>奖池</span><b>¥0</b></div><div class="cttick" id="ctTick"></div></div><div class="ctp" id="ctp"></div><div class="ctdock" id="ctdock"></div></div></div>';
   var dk=$q('#ctdock');
   function dkb(id,ic,tx,fn){var b=UI.navBtn(ic,tx,{id:id,cls:'dk'});b.onclick=function(){Sound.tap();fn()};dk.appendChild(b);return b}
   dkb('dkAssets','coin','资产',function(){if(S.phase!=='play')return;assets(S.turn)});
   dkb('dkDeeds','list','地契',deedsList);
   dkb('dkSync','pin','对位',function(){if(S.phase!=='play')return;sync.on=!sync.on;sync.pid=S.turn;render();UI.toast(sync.on?'对位模式:选棋子,点格子':'对位结束',1500,'info')});
   dkb('dkJoin','plus','加入',joinFlow);
   dkb('dkSoc','users','互动',function(){if(!socOn()){UI.toast(S.phase==='play'?'玩家互动在规则设置里关掉了':'游戏还没开始',1500,'info');return}if(busy)return;social(S.turn)});
   dkb('dkUndo','undo','撤销',function(){if(busy)return;if(G.undoOne()){S=G.S;shownKey='';save();UI.close();render();UI.toast('已撤销上一步',1200,'info')}});
   dkb('dkLog','info','记录',logModal);
   dkb('dkSave','<svg viewBox="0 0 24 24"><path d="M5 4.5h11l3 3V19.5H5z"/><path d="M8 4.5v5h7v-5M8 19.5v-6h8v6"/></svg>','存档',function(){saveModal()});
   dkb('dkLegend','house','图例',legendModal);
   var dko=dkb('dkOwn','house','看地产',function(){propView(!root.classList.contains('pview'))});dko.classList.add('ownv');
   var no=ctx.nav('house','看地产',{id:'ctOwn',cls:'ownv'});ctx.slot.appendChild(no);no.onclick=function(){Sound.tap();propView(!root.classList.contains('pview'))};
   var nk=ctx.nav('star','排行',{id:'ctRank'}),nr=ctx.nav('list','规则',{id:'ctRules'}),nn=ctx.nav('refresh','新局',{id:'ctNew'});ctx.slot.appendChild(nk);ctx.slot.appendChild(nr);ctx.slot.appendChild(nn);
   nk.onclick=function(){Sound.tap();if(S.phase==='setup'){UI.toast('游戏还没开始',1400,'info');return}leaderboard()};
   nr.onclick=rulesModal;
   nn.onclick=function(){UI.confirm({title:'开始新的一局?',text:'现在的游戏会结束,地契修改和规则设置会保留。',yes:'新的一局',danger:true,icon:'refresh'}).then(function(ok){if(ok)startNew()})};
   buildBoard();fit();
   if(window.ResizeObserver){ro=new ResizeObserver(function(){fit()});ro.observe(root)}else window.addEventListener('resize',fit);
   if(S.phase==='setup')startSelect();else if(S.phase==='play'){entryOpen=true;render();entryModal()}else render();
  },
  unmount:function(){sqSkip();timers.forEach(clearTimeout);timers=[];Array.prototype.forEach.call(document.querySelectorAll('.ctfx'),function(x){x.remove()});entryOpen=false;if(ro)ro.disconnect();ro=null;busy=false;if(S&&G)save();root=null},
  api:api
 };
})();
