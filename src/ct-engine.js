/* ===== 大富翁·中国之旅 engine (pure, no DOM). Works in browser (window.CTE) and node (module.exports) ===== */
(function(root){
'use strict';
var DATA=null,RNG=function(n){return Math.floor(Math.random()*n)};
var N=40;
var DEF_CFG={start:10000,salary:2000,
 loanRounds:3,          // v18 借款: 几轮后到期
 loanOn:true,           // v18 玩家互相借钱 / 送红包 / 卖房 开关
 hotelRest:'stop',      // 酒店: stop=只有停在酒店才歇息 / pass=路过也歇息一轮   (说明书"路过…歇息"，棋盘"休息一轮"，待核实)
 feeTo:'bank',          // 机会卡罚款去向: bank=银行 / pot=奖池(休息椅领取)       (未印，待核实)
 angelLevels:1,         // 天使降临提升级数 (未印，待核实)
 angelScope:'own',      // own=只提升自己的同色地产 / all=所有人的同色地产       (未印，待核实)
 monster:'one',         // 怪兽来袭: one=拆1级 / all=拆光该地产房屋               (未印，待核实)
 groupBy:'card',        // 同色系依据: card=契约卡颜色 / strip=棋盘价格条颜色     (待核实)
 mortRent:false,        // 抵押中的地产是否收观光费 (未印)
 buildAnywhere:false,   // 是否可随时盖房 (说明书:停在自己的地产时才可建)
 refundPct:50,          // 拆房退还建房费百分比 (未印)
 lostEffect:'land',     // 丢失物品退回上一城市后: land=照常结算那座城市(付观光费/买地/盖房,v22 默认) / none=不触发 (说明书未印)
 deckMode:'bottom',     // bottom=用过放回牌堆底(说明书) / reshuffle=进弃牌堆,抽完重洗
 maxRerolls:3,          // 每回合最多重掷几次 (0=不能重掷, -1=不限)   (自定义,给小朋友多几次机会)
 autoResolve:true,      // 前进后没有可选项时(买不起/罚款/路过起点…)自动处理,不再弹确认
 rentManual:true,      // 租金手动确认(v11): 付别人观光费必须玩家点「确认支付」,不受「自动处理」影响;false=付得起就自动付
 penaltyManual:true,   // 罚款/损失手动确认(v11): 楼市暴跌、机会卡罚款等必须点「确认支付」;false=付得起就自动付
 startManual:true,      // 起点奖励手动领取(v11): 经过/到达/回到起点要点「领取」;false=自动领
 autoEnd:true,          // 自动结束回合(v10): 玩家没有可操作的事时自动换人;false=一律手动点结束回合 (旧存档 true 沿用)
 finFx:true,            // 财务状态特效(危险抖动/富豪光环/动画)
 finSound:true,         // 财务状态音效(心跳声等)
 dangerAbs:1000,        // 现金低于此数 = 危险
 tenseAbs:3000,         // 现金低于此数 = 紧张
 rentAhead:true,        // 危险:现金不够付前方 1 次掷骰内最贵的观光费也算危险
 richPct:150,           // 现金 >= 起始×此百分比 = 富裕
 tycoonPct:200,         // 现金 >= 起始×此百分比 = 富豪
 luckyRoll:true         // 付不起钱时,每人每局 1 次「翻身机会」幸运骰
};
var CFG_DOC={loanRounds:'借款: 默认 3 轮后到期',loanOn:'玩家互动(借钱/红包/卖房): 默认开',
 hotelRest:'酒店歇息: 默认只有停在酒店格才歇息一轮',feeTo:'机会卡罚款: 默认付给银行',angelLevels:'天使降临: 默认提升 1 级(未印)',angelScope:'天使降临: 默认只提升自己的同色地产',
 monster:'怪兽来袭: 默认拆 1 级',groupBy:'同色系: 默认按契约卡颜色',mortRent:'抵押中的地产: 默认不收观光费',buildAnywhere:'盖房: 默认只能停在自己地产或「升级房产」格时建',
 finFx:'状态特效:危险/富裕时的抖动、光环、动画',finSound:'状态音效:心跳声等',dangerAbs:'危险线:现金低于 ¥1000',tenseAbs:'紧张线:现金低于 ¥3000',rentAhead:'前方观光费也算进危险判断',richPct:'富裕线:起始×1.5',tycoonPct:'富豪线:起始×2',luckyRoll:'翻身机会:付不起钱时可掷幸运骰一次',
 maxRerolls:'每回合重掷: 默认最多 3 次',penaltyManual:'罚款手动确认: 默认开',startManual:'起点奖励手动领取: 默认开',rentManual:'租金手动确认: 默认开,付观光费要点「确认支付」',autoResolve:'没得选的时候自动处理(气泡提示)',autoEnd:'自动结束回合: 没有可操作的事就自动换人',refundPct:'拆房退款: 默认退建房费 50%(未印)',lostEffect:'丢失物品: 默认退回后不再触发该城市',deckMode:'机会卡: 默认用完放回牌堆底部'};
function setData(d){DATA=d;DATA.byName={};d.squares.forEach(function(s){DATA.byName[s.name+(s.type==='property'?'':'#'+s.i)]=s});}
function setRng(f){RNG=f}
function clone(o){return JSON.parse(JSON.stringify(o))}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=RNG(i+1),t=a[i];a[i]=a[j];a[j]=t}return a}
function rint(n){return RNG(n)}
/* ---------- deed values (printed / suggested / user-edited) ---------- */
var FIELDS=['price','mortgage','redeem','rent0','rent1','rent2','rent3','rent4','build0','build1'];
function ovOf(S,name){return (S.ov&&S.ov[name])||{}}
function fieldInfo(S,name,f){ // {v, src:'user'|'printed'|'sug', flag:'miss'|'chk'|null}
 var d=DATA.deeds[name],o=ovOf(S,name);
 if(o.v&&o.v[f]!=null)return{v:o.v[f],src:'user',flag:null};
 var flag=d.flags[f]||null,ok=o.ok&&o.ok[f];
 if(d.val[f]!=null)return{v:d.val[f],src:'printed',flag:ok?null:flag};
 if(d.sug[f]!=null)return{v:d.sug[f],src:'sug',flag:ok?null:'miss'};
 return{v:0,src:'none',flag:'miss'};
}
function dv(S,name,f){return fieldInfo(S,name,f).v}
function deed(S,name){var d=DATA.deeds[name],r=[0,1,2,3,4].map(function(i){return dv(S,name,'rent'+i)});
 return{name:name,sq:d.sq,landmark:d.landmark,card:d.card,price:dv(S,name,'price'),mortgage:dv(S,name,'mortgage'),redeem:dv(S,name,'redeem'),rent:r,build:[dv(S,name,'build0'),dv(S,name,'build1')]}}
function setField(S,name,f,v){S.ov=S.ov||{};var o=S.ov[name]=S.ov[name]||{v:{},ok:{}};o.v=o.v||{};o.v[f]=Math.max(0,Math.round(+v)||0);return true}
function confirmField(S,name,f){S.ov=S.ov||{};var o=S.ov[name]=S.ov[name]||{v:{},ok:{}};o.ok=o.ok||{};o.ok[f]=true}
function resetField(S,name,f){var o=ovOf(S,name);if(o.v)delete o.v[f];if(o.ok)delete o.ok[f]}
function flaggedCount(S,name){var c=0;FIELDS.forEach(function(f){if(fieldInfo(S,name,f).flag)c++});return c}
function groupOf(S,name){var d=DATA.deeds[name];if((S.cfg.groupBy)==='strip'){var sq=DATA.squares[d.sq];return 'S:'+sq.strip}return 'C:'+d.card}
function groupMembers(S,name){var g=groupOf(S,name);return Object.keys(DATA.deeds).filter(function(n){return groupOf(S,n)===g})}
/* ---------- state ---------- */
function newState(o){
 o=o||{};
 var S={v:2,phase:'setup',cfg:Object.assign({},DEF_CFG,o.cfg||{}),ov:o.ov?clone(o.ov):{},players:[],props:{},deck:{q:[],disc:[]},pot:0,bankOut:0,
  turn:null,tp:'roll',roll:null,rr:0,again:false,pend:null,q:[],log:[],nid:1,winner:null,ev:[],round:1,undoable:false,fs:{},loans:[],lid:1};
 Object.keys(DATA.deeds).forEach(function(n){S.props[n]={owner:null,lvl:0,mort:false}});
 S.deck.q=shuffle(DATA.chance.map(function(c){return c.n}));
 return S;
}

/* ---------- 财务状态: 危险 / 紧张 / 正常 / 富裕 / 富豪 ---------- */
var FIN_ORDER={danger:0,tense:1,normal:2,rich:3,tycoon:4};
var FIN_NAME={danger:'危险',tense:'紧张',normal:'正常',rich:'富裕',tycoon:'富豪'};
function finCfg(S){var c=S.cfg,st=+c.start||10000;
 var rich=Math.max(100,+c.richPct||150),tyc=Math.max(rich+10,+c.tycoonPct||200);
 return{dangerAbs:Math.max(0,+c.dangerAbs>=0?+c.dangerAbs:1000),tenseAbs:Math.max(+c.dangerAbs||0,+c.tenseAbs>=0?+c.tenseAbs:3000),rentAhead:c.rentAhead!==false,rich:st*rich/100,tycoon:st*tyc/100,start:st,lead:st*0.5}}
/* 前方「一次掷骰」能走到的格子里,别人收的最贵观光费 */
function exposure(S,p){
 var steps=6;if(p.slow>0)steps=1;else if(p.forced)steps=p.forced;
 var dir=p.rev>0?-1:1,mx=0,sqn=null;
 for(var k=1;k<=steps;k++){var pos=(p.pos+dir*k+N*2)%N,sq=DATA.squares[pos];if(!sq||sq.type!=='property')continue;
  var q=S.props[sq.name];if(!q||q.owner==null||q.owner===p.id)continue;
  var o=P(S,q.owner);if(!o||o.out||o.sleep>0||o.seal>0)continue;
  if(q.mort&&!S.cfg.mortRent)continue;
  var r=rentFor(S,sq.name).amount;if(r>mx){mx=r;sqn=sq.name}}
 return{amount:mx,name:sqn}}
function finState(S,pid){
 var p=P(S,pid);if(!p||p.out)return null;var c=finCfg(S),cash=p.cash;
 var act=active(S),cashes=act.map(function(x){return x.cash}).sort(function(a,b){return b-a});
 var top=act.length>1&&cash===cashes[0]&&cash>cashes[1],gap=act.length>1?cash-(top?cashes[1]:cashes[0]):0;
 var ex=c.rentAhead?exposure(S,p):{amount:0,name:null};
 var id,why='';
 if(cash<c.dangerAbs){id='danger';why='现金不到 ¥'+c.dangerAbs}
 else if(ex.amount>0&&cash<ex.amount){id='danger';why='前方 '+ex.name+' 的观光费 ¥'+ex.amount+' 付不起'}
 else if(cash<c.tenseAbs||(ex.amount>0&&cash<ex.amount*1.5)){id='tense';why=cash<c.tenseAbs?'现金不到 ¥'+c.tenseAbs:'前方观光费 ¥'+ex.amount+' 有点悬'}
 else if(cash>=c.tycoon||(top&&gap>=c.start&&cash>=c.rich)){id='tycoon';why='现金很多'}
 else if(cash>=c.rich||(top&&gap>=c.lead&&cash>=c.start)){id='rich';why=cash>=c.rich?'现金 ≥ 起始×'+(c.rich/c.start):'现金遥遥领先'}
 else{id='normal'}
 var title='';
 if(id==='rich')title='小富翁';else if(id==='tycoon')title=cash>=c.start*3?'富可敌国':'大富翁';
 return{id:id,name:FIN_NAME[id],level:FIN_ORDER[id],title:title,why:why,exposure:ex.amount,exposureName:ex.name,top:top,cash:cash,danger:id==='danger'}
}
function finInit(S){S.fs=S.fs||{};active(S).forEach(function(p){if(!S.fs[p.id]){var f=finState(S,p.id);S.fs[p.id]={s:f.id,c:p.cash}}})}
/* 对比上次记录的状态,产生事件 + 台词 */
function finTrack(S){
 if(S.phase!=='play'&&S.phase!=='over')return;S.fs=S.fs||{};
 Object.keys(S.fs).forEach(function(k){var p=P(S,+k);if(!p||p.out)delete S.fs[k]});
 active(S).forEach(function(p){
  var f=finState(S,p.id),old=S.fs[p.id];
  if(!old){S.fs[p.id]={s:f.id,c:p.cash};return}
  var from=old.s,to=f.id,up=p.cash>old.c;
  if(from!==to){
   var kind=null;
   if(to==='danger'){ if(p.dr!==S.round&&(p.cash<old.c||p.id===S.turn)){kind='enterDanger';p.dr=S.round}}
   else if(from==='danger'){ if(up){kind=(FIN_ORDER[to]>=FIN_ORDER.normal)?'comeback':'escapedDanger'}}
   else if(FIN_ORDER[to]>=FIN_ORDER.rich&&FIN_ORDER[to]>FIN_ORDER[from])kind=to==='tycoon'?'enterTycoon':'enterRich';
   if(to==='danger'&&!kind){/* 同一回合内重复进入危险: 静默 */}
   S.fs[p.id]={s:to,c:p.cash};
   if(kind||from==='danger'||to==='danger'||FIN_ORDER[to]>=FIN_ORDER.rich||FIN_ORDER[from]>=FIN_ORDER.rich)ev(S,{k:'fin',pid:p.id,from:from,to:to,kind:kind,cash:p.cash});
   if(kind==='enterDanger'){log(S,p.name+' 快破产啦!现金只剩 ¥'+p.cash,'warn');say(S,p.id,'enterDanger')}
   else if(kind==='escapedDanger'){log(S,p.name+' 暂时脱离危险!','good');say(S,p.id,'escapedDanger')}
   else if(kind==='comeback'){log(S,p.name+' 翻身啦!','good');say(S,p.id,'comeback')}
   else if(kind==='enterRich'||kind==='enterTycoon'){log(S,p.name+' 成了「'+f.title+'」!','good');say(S,p.id,'enterRich')}
  }else S.fs[p.id].c=p.cash;
 });
}
/* 回合开始时: 危险的人嘀咕,有钱的人炫耀 */
function finTurnLines(S,p){
 var f=finState(S,p.id);if(!f)return;
 if(f.id==='danger')say(S,p.id,'stillDanger');
 else if(f.level>=FIN_ORDER.rich){p.fb=(p.fb||0)+1;if(p.fb%3===1)say(S,p.id,'richBoast')}
}
function luckyAvail(S,pid){var p=P(S,pid);return !!(p&&!p.out&&S.cfg.luckyRoll!==false&&!p.lucky)}
/* ---------- compat / helpers ---------- */
var OLDNAMES={'小男孩':'不不奥特曼','双马尾':'哎呀公主','红发妹':'温柔喷火龙','眼镜娃':'猪肉战神','双马尾女孩':'哎呀公主','红发女':'温柔喷火龙','眼镜男':'猪肉战神'};
var TKN=['小狗','小狮子','不不奥特曼','哎呀公主','温柔喷火龙','猪肉战神'];
function normalize(S){ // make an older saved state (v6 and before) usable
 S.cfg=Object.assign({},DEF_CFG,S.cfg||{});
 /* v22: every arrival on a city resolves it — old saves still on the old 丢失物品 default switch to 'land' once */
 if(!(S.cfgV>=22)){if(S.cfg.lostEffect==='none')S.cfg.lostEffect='land';S.cfgV=22}
 if(typeof S.rr!=='number')S.rr=0;
 if(typeof S.round!=='number'||S.round<1)S.round=1;
 if(!S.ev)S.ev=[];if(!S.log)S.log=[];if(!Array.isArray(S.loans))S.loans=[];if(typeof S.lid!=='number')S.lid=S.loans.reduce(function(m,l){return Math.max(m,(l.id||0)+1)},1);if(!S.fs||typeof S.fs!=='object')S.fs={};
 (S.players||[]).forEach(function(p){if(OLDNAMES[p.name])p.name=OLDNAMES[p.name];if(typeof p.lucky!=='number')p.lucky=0;if(typeof p.fb!=='number')p.fb=0;if(!Array.isArray(p.ack))p.ack=[]});
 // v17 migration: older saves marked eliminated players only with out=true. Recover why/order from the game log.
 var seq=S.outSeq||0,need=(S.players||[]).filter(function(p){return p.out&&!p.outWhy});
 if(need.length){var order=[];(S.log||[]).forEach(function(l,i){need.forEach(function(p){if(order.indexOf(p)<0&&typeof l.t==='string'&&(l.t.indexOf(p.name+' 破产了')===0||l.t.indexOf(p.name+' 离开了')===0))order.push(p)})});
  need.forEach(function(p){if(order.indexOf(p)<0)order.push(p)});
  order.forEach(function(p){var bk=(S.log||[]).some(function(l){return typeof l.t==='string'&&l.t.indexOf(p.name+' 破产了')===0});
   p.outWhy=bk?'bankrupt':'leave';p.outN=++seq;if(p.outR==null)p.outR=null;if(p.outTo===undefined)p.outTo=null;p.cash=p.cash||0})}
 (S.players||[]).forEach(function(p){if(p.out&&typeof p.outN==='number'&&p.outN>seq)seq=p.outN});S.outSeq=seq;
 if(S.phase==='play')finInit(S);
 return S;
}
function rerollsLeft(S){var m=+S.cfg.maxRerolls;if(m<0)return -1;return Math.max(0,m-(S.rr||0))}
function canReroll(S){
 if(S.phase!=='play'||S.tp!=='rolled'||S.pend||!S.roll)return false;
 if(S.roll.forced||S.roll.slow)return false;
 var l=rerollsLeft(S);return l<0||l>0;
}
function liquid(S,pid){var t=0;Object.keys(S.props).forEach(function(n){var q=S.props[n];if(q.owner===pid&&!q.mort)t+=deed(S,n).mortgage});return t}
function buildSpent(S,n){var q=S.props[n],d=deed(S,n),t=0;for(var l=1;l<=q.lvl;l++)t+=d.build[l===4?1:0];return t}
/* 净资产 = 现金 + 地价 + 已建房费 - 抵押中需要赎回的钱 */
function netWorth(S,pid){var p=P(S,pid),r={cash:p.cash,land:0,build:0,debt:0,props:0,lent:0,owe:0};
 (S.loans||[]).forEach(function(l){if(!loanOpen(l))return;if(l.from===pid)r.lent+=l.owe;if(l.to===pid)r.owe+=l.owe});
 Object.keys(S.props).forEach(function(n){var q=S.props[n];if(q.owner!==pid)return;var d=deed(S,n);r.props++;r.land+=d.price;r.build+=buildSpent(S,n);if(q.mort)r.debt+=d.redeem});
 r.total=r.cash+r.land+r.build-r.debt+r.lent-r.owe;return r}
function standings(S){return S.players.filter(function(p){return !p.out}).map(function(p){var w=netWorth(S,p.id);return{pid:p.id,name:p.name,tok:p.tok,cash:w.cash,props:w.props,total:w.total,w:w}}).sort(function(a,b){return (b.cash-a.cash)||(b.total-a.total)||(b.props-a.props)})}
/* ---------- v18 玩家互动: 借款 / 红包 / 卖房 ----------
   loan {id,from(出借人),to(借款人),amt(本金),rate(0|10 %),owe(还欠,含利息),r0(借出回合),due(到期回合),st:'open'|'overdue'|'paid'|'void',paid}
   到期规则: 借款人到期那一轮轮到自己时,自动把能还的现金还给出借人;还不完的变「逾期」,以后每次轮到TA时继续自动还(有多少还多少),不收罚息、不抢地产。 */
function loanOpen(l){return l.st==='open'||l.st==='overdue'}
function loansOf(S,pid){return (S.loans||[]).filter(function(l){return loanOpen(l)&&(l.from===pid||l.to===pid)})}
function loanOwe(amt,rate){return Math.round(amt*(100+rate)/100/10)*10}
function payLoan(S,l,amt,why){var b=P(S,l.to);amt=Math.min(amt,l.owe,b.cash);if(!(amt>0))return 0;
 xfer(S,l.to,l.from,amt,'loan');l.owe-=amt;l.paid=(l.paid||0)+amt;if(l.owe<=0){l.owe=0;l.st='paid'}
 ev(S,{k:'repay',id:l.id,from:l.to,to:l.from,amt:amt,done:l.st==='paid',why:why||''});return amt}
function loanDueCheck(S,p){ // called when p's turn starts
 (S.loans||[]).forEach(function(l){if(l.to!==p.id||!loanOpen(l)||(S.round||1)<l.due)return;
  var first=l.st==='open',paid=payLoan(S,l,l.owe,'due'),lend=P(S,l.from);
  if(l.st==='paid'){log(S,p.name+' 借款到期,自动还给 '+lend.name+' ¥'+paid,'good');if(first){say(S,p.id,'loanDue')}say(S,l.from,'thanks');ev(S,{k:'loanDue',id:l.id,pid:p.id,paid:paid,left:0})}
  else{if(first||paid){l.st='overdue';log(S,p.name+' 借款到期'+(paid?',先还 ¥'+paid:'')+',还欠 '+lend.name+' ¥'+l.owe,'warn');ev(S,{k:'loanDue',id:l.id,pid:p.id,paid:paid,left:l.owe});if(first)say(S,p.id,'loanDue')}}
 })}
function loanOnRemove(S,p,creditor){ // 破产/离开: 欠别人的 → 坏账作废; 别人欠TA的 → 转给债主(玩家)或作废
 (S.loans||[]).forEach(function(l){if(!loanOpen(l))return;
  if(l.to===p.id){l.st='void';l.voidWhy='borrower'}
  else if(l.from===p.id){if(creditor!=null&&creditor!==l.to){l.from=creditor;l.moved=p.id}else{l.st='void';l.voidWhy='lender'}}})}
/* v17: bankrupt players (kept for display; never take turns). Latest bankrupt first. */
function busted(S){return S.players.filter(function(p){return p.out&&p.outWhy==='bankrupt'}).sort(function(a,b){return (b.outN||0)-(a.outN||0)})}
/* v17: full ranking = active players (standings order) then bankrupt players by elimination (later bankrupt ranks higher). Players who left are not ranked. */
function ranking(S){var r=standings(S).map(function(x){x.out=false;return x});
 busted(S).forEach(function(p){var w=netWorth(S,p.id);r.push({pid:p.id,name:p.name,tok:p.tok,cash:w.cash,props:w.props,total:w.total,w:w,out:true,outR:p.outR||null,outN:p.outN||null,outTo:p.outTo!=null?p.outTo:null})});
 r.forEach(function(x,i){x.rank=i+1});return r}
function say(S,pid,type,x){ev(S,{k:'say',pid:pid,type:type,x:x||null})}
function P(S,id){for(var i=0;i<S.players.length;i++)if(S.players[i].id===id)return S.players[i];return null}
function active(S){return S.players.filter(function(p){return !p.out})}
function log(S,t,k){S.log.push({t:t,k:k||''});if(S.log.length>120)S.log.shift()}
function card(n){return DATA.chance[n-1]}
function pname(S,id){var p=P(S,id);return p?p.name:'?'}
function ev(S,e){S.ev.push(e)}
/* money: from/to = pid | 'bank' | 'pot' */
function xfer(S,from,to,amt,why){
 amt=Math.round(amt);if(!(amt>0))return true;
 if(typeof from==='number'){var a=P(S,from);if(a.cash<amt)return false;a.cash-=amt}else if(from==='bank')S.bankOut+=amt;else if(from==='pot'){if(S.pot<amt)return false;S.pot-=amt}
 if(typeof to==='number')P(S,to).cash+=amt;else if(to==='bank')S.bankOut-=amt;else if(to==='pot')S.pot+=amt;
 ev(S,{k:'coin',from:from,to:to,amt:amt,why:why||''});
 return true;
}
function invariant(S){var s=S.pot;S.players.forEach(function(p){s+=p.cash});return s===S.bankOut}
function totalAssets(S,pid){var p=P(S,pid),t=p.cash;Object.keys(S.props).forEach(function(n){var q=S.props[n];if(q.owner===pid){var d=deed(S,n);t+=q.mort?0:d.price}});return t}
function ownedBy(S,pid){return Object.keys(S.props).filter(function(n){return S.props[n].owner===pid}).sort(function(a,b){return DATA.deeds[a].sq-DATA.deeds[b].sq})}
/* ---------- rent ---------- */
function rentFor(S,name){
 var q=S.props[name],d=deed(S,name),base=d.rent[q.lvl],mult=1;
 if(q.owner!=null){var all=groupMembers(S,name).every(function(m){return S.props[m].owner===q.owner});if(all)mult=2}
 return{base:base,mult:mult,amount:base*mult,lvl:q.lvl}
}
var LVN=['空地','1间民宿','2间民宿','3间民宿','度假村'];
/* ---------- players ---------- */
function mkPlayer(S,name,tok){return{id:S.nid++,name:name||'',tok:tok,cash:0,pos:0,from:null,hand:[],rest:0,sleep:0,seal:0,slow:0,rev:0,forced:0,out:false,lucky:0,fb:0,dr:-9,ack:[],ackD:false}}
function addPlayer(S,name,tok,withMoney){
 if(active(S).length>=6)return{ok:false,err:'满员(最多6位)'};
 if(tok==null||tok<0||tok>5)return{ok:false,err:'请选择角色'};
 if(active(S).some(function(p){return p.tok===tok}))return{ok:false,err:'这个角色已被选走'};
 var p=mkPlayer(S,name,tok);p.name=(name||'').trim()||('玩家'+(S.players.length+1));S.players.push(p);
 if(withMoney!==false)xfer(S,'bank',p.id,S.cfg.start,'start');
 return{ok:true,id:p.id};
}
function startGame(S,list,firstIdx){
 S.players=[];S.nid=1;S.bankOut=0;S.pot=0;S.outSeq=0;S.loans=[];S.lid=1;
 for(var i=0;i<list.length;i++){var r=addPlayer(S,list[i].name,list[i].tok);if(!r.ok)return r}
 if(S.players.length<2)return{ok:false,err:'至少 2 位玩家'};
 S.cfgV=22;S.phase='play';S.round=1;S.rr=0;S.turn=S.players[Math.min(firstIdx||0,S.players.length-1)].id;S.tp='roll';S.roll=null;S.q=[];S.pend=null;S.again=false;S.winner=null;
 S.players.forEach(function(p){p.from=0});S.fs={};finInit(S);
 log(S,'游戏开始! 每位玩家 ¥'+S.cfg.start,'good');S.ev=[];return{ok:true}
}
function sync(S){S.pend=S.q[0]||null}
function push(S,p){S.q.push(p);sync(S)}
function pushFront(S,p){S.q.unshift(p);sync(S)}
function cur(S){return P(S,S.turn)}
/* ---------- deck ---------- */
function drawCard(S){
 var d=S.deck;if(!d.q.length){d.q=shuffle(d.disc.slice());d.disc=[]}
 if(!d.q.length)return null;return d.q.shift();
}
function releaseCard(S,n){S.players.forEach(function(q){if(q.ack){var i=q.ack.indexOf(n);if(i>=0)q.ack.splice(i,1)}});if(S.cfg.deckMode==='reshuffle')S.deck.disc.push(n);else S.deck.q.push(n)}
/* ---------- movement ---------- */
function movePlayer(S,p,steps,dir){
 var path=[],passed=0,passHotel=false;
 for(var k=1;k<=steps;k++){p.pos=(p.pos+dir+N)%N;path.push(p.pos);if(dir>0&&p.pos===0)passed++;if(p.pos===29&&k<steps)passHotel=true}
 ev(S,{k:'move',pid:p.id,path:path});
 return{path:path,passed:passed,passHotel:passHotel};
}
function jump(S,p,to){p.pos=to;ev(S,{k:'jump',pid:p.id,to:to})}
function prevCity(pos){for(var i=1;i<N;i++){var q=(pos-i+N)%N;if(DATA.squares[q].type==='property')return q}return pos}
/* ---------- landing ---------- */
function landOn(S,p,pos,o){
 o=o||{};var sq=DATA.squares[pos],t=sq.type,name=sq.name;
 if(t==='property'){
  var q=S.props[name],d=deed(S,name);
  if(q.owner==null){push(S,{t:'buy',pid:p.id,name:name,price:d.price});return}
  if(q.owner===p.id){
   if(q.mort){log(S,name+' 已抵押,可在「资产」里赎回');ev(S,{k:'note',txt:name+' 抵押中,可以在「资产」里赎回'});return}
   if(q.lvl<4)push(S,{t:'build',pid:p.id,name:name,cost:d.build[q.lvl===3?1:0],to:q.lvl+1,src:'land'});
   else{log(S,name+' 已经是度假村啦');ev(S,{k:'note',txt:name+' 已经是度假村啦!'})}
   return;
  }
  var own=P(S,q.owner);
  if(q.mort&&!S.cfg.mortRent){log(S,name+' 已抵押,免费通行','good');ev(S,{k:'note',txt:'已抵押,免费通行'});say(S,p.id,'freePass');return}
  if(own.sleep>0){log(S,own.name+' 在睡觉,无法收观光费','good');ev(S,{k:'note',txt:own.name+'睡着了,免费通行'});say(S,p.id,'freePass');return}
  if(own.seal>0){log(S,own.name+' 的地产被查封,免收观光费','good');ev(S,{k:'note',txt:'地产被查封,免费通行'});say(S,p.id,'freePass');return}
  var r=rentFor(S,name);
  push(S,{t:'pay',pid:p.id,to:own.id,amount:r.amount,reason:'rent',name:name,rent:r,why:'观光费 · '+name});return;
 }
 if(t==='chance'){push(S,{t:'chance',pid:p.id,stage:'back'});return}
 if(name==='天降横财'){push(S,{t:'windfall',pid:p.id,stage:'roll'});return}
 if(name==='楼市暴跌'){push(S,{t:'pay',pid:p.id,to:'bank',amount:1000,reason:'crash',why:'楼市暴跌 −¥1000'});return}
 if(name==='丢失物品'){var b=prevCity(pos);jump(S,p,b);log(S,p.name+' 丢失物品,返回上一城市 '+DATA.squares[b].name);
   if(S.cfg.lostEffect==='land')landOn(S,p,b,{noSalary:true});return}
 if(name==='酒店'){p.rest=Math.max(p.rest,1);log(S,p.name+' 在酒店歇息一轮','warn');say(S,p.id,'restTurn');return}
 if(name==='休息椅'){p.rest=Math.max(p.rest,1);log(S,p.name+' 坐下休息一轮','warn');say(S,p.id,'restTurn');
   if(S.pot>0)push(S,{t:'gain',pid:p.id,from:'pot',amount:S.pot,why:'奖池 · 休息椅领取'});return}
 if(name==='升级房产'){
  var opts=upgradeOpts(S,p);
  if(!opts.length){log(S,p.name+' 没有可升级的地产,轮空');ev(S,{k:'note',txt:'没有可升级的地产,轮空'});return}
  if(S.cfg.autoResolve&&!opts.some(function(o){return o.cost<=p.cash})){log(S,p.name+' 钱不够升级地产');ev(S,{k:'note',txt:'钱不够升级,轮空'});say(S,p.id,'cantAfford');return}
  push(S,{t:'pick',kind:'prop',purpose:'upgrade',pid:p.id,opts:opts,optional:true,title:'升级房产',text:'选择自己的 1 处地产盖房或升级'});return}
 if(name==='再掷一次'){S.again=true;log(S,p.name+' 再掷一次!','good');return}
 if(t==='airport'){
  push(S,{t:'pick',kind:'dest',purpose:'airport',pid:p.id,opts:destOpts(S),optional:true,title:'飞机场',text:'乘飞机前往任意城市(也可以不飞)'});return}
 // 起点: nothing more
}
function upgradeOpts(S,p){return ownedBy(S,p.id).filter(function(n){var q=S.props[n];return !q.mort&&q.lvl<4}).map(function(n){var q=S.props[n],d=deed(S,n);return{name:n,cost:d.build[q.lvl===3?1:0],to:q.lvl+1}})}
function destOpts(S){return Object.keys(DATA.deeds).sort(function(a,b){return DATA.deeds[a].sq-DATA.deeds[b].sq}).map(function(n){return{name:n,sq:DATA.deeds[n].sq}})}
/* ---------- turn flow ---------- */
function afterQueue(S){ // called whenever q becomes empty during play
 if(S.phase!=='play'||S.q.length||S.tp!=='resolve')return;
 var p=cur(S);
 if(S.again){S.again=false;S.tp='roll';S.roll=null;S.rr=0;p&&log(S,p.name+' 再掷一次','good')}
 else S.tp='end';
}
/* ---------- end-of-turn decision (v10) ----------
   endInfo(S) answers: at the end of the current player's turn (tp==='end'), is there still a meaningful choice?
   auto=true  → the UI advances to the next player by itself (banner ~0.8s, tap to skip)
   auto=false → show the manual 「结束回合」 button; reason/blockers say why. See docs/end-turn-rules.md */
function endInfo(S){
 var r={auto:false,wait:false,reason:'',blockers:[],hints:[],usable:[],held:[]};
 if(S.phase!=='play'||S.tp!=='end'||S.pend){r.wait=true;r.reason=S.pend?'pending':'notEnd';return r}
 var p=cur(S);if(!p||p.out){r.wait=true;r.reason='noPlayer';return r}
 p.hand.forEach(function(c){(canUse(S,p,c)===''?r.usable:r.held).push(c)});
 // 已「看过但没用」的手牌(上次手动结束回合时还拿着的)不再拦住自动结束; 新到手的可用牌会拦一次
 var ack=p.ack||[],fresh=r.usable.filter(function(c){return ack.indexOf(c)<0});
 if(fresh.length)r.blockers.push('card');
 if(r.usable.length&&!fresh.length)r.hints.push('cards')
 if(S.cfg.buildAnywhere&&upgradeOpts(S,p).some(function(o){return o.cost<=p.cash}))r.blockers.push('upgrade');
 var f=finState(S,p.id);
 if(f&&f.id==='danger'){
  var mortable=ownedBy(S,p.id).some(function(n){var q=S.props[n];return !q.mort||q.lvl>0});
  if(mortable&&!p.ackD)r.blockers.push('crisis');
 }
 if(r.held.length)r.hints.push('cards');
 if(!S.cfg.autoEnd){r.reason='manual';r.blockers.unshift('manual');return r}
 if(r.blockers.length){r.reason=r.blockers[0];return r}
 r.auto=true;r.reason='none';return r;
}
/* who will be next (no mutation): {pid, skipped:[{pid,why}]} */
function peekNext(S){
 var a=active(S);if(!a.length)return null;
 var idx=-1;a.forEach(function(p,i){if(p.id===S.turn)idx=i});
 var sl={},rs={},skipped=[],g=0;
 for(;;){idx=(idx+1)%a.length;var p=a[idx];if(++g>a.length*6)return{pid:S.turn,skipped:skipped};
  var sv=sl[p.id]!=null?sl[p.id]:p.sleep,rv=rs[p.id]!=null?rs[p.id]:p.rest;
  if(sv>0){sl[p.id]=sv-1;skipped.push({pid:p.id,why:'睡眠'});continue}
  if(rv>0){rs[p.id]=rv-1;skipped.push({pid:p.id,why:'休息'});continue}
  return{pid:p.id,skipped:skipped}}
}
function popPend(S){S.q.shift();sync(S);afterQueue(S)}
function checkWinner(S){
 var a=active(S);
 if(a.length===1&&S.players.length>1){S.phase='over';S.winner=a[0].id;S.q=[];S.pend=null;log(S,'🏆 '+a[0].name+' 成为超级小富翁!','good');ev(S,{k:'win',pid:a[0].id});say(S,a[0].id,'win');return true}
 return false;
}
function tickEnd(p){if(p.seal>0)p.seal--}
function nextTurn(S){
 var a=active(S);if(!a.length)return;
 var idx=-1;a.forEach(function(p,i){if(p.id===S.turn)idx=i});
 var skipped=[],guard=0,oldIdx=idx;
 for(;;){
  idx=(idx+1)%a.length;var p=a[idx];guard++;
  if(guard>a.length*6)break;
  if(p.sleep>0){p.sleep--;tickEnd(p);skipped.push({pid:p.id,why:'睡眠'});log(S,p.name+' 睡着了,跳过','warn');continue}
  if(p.rest>0){p.rest--;tickEnd(p);skipped.push({pid:p.id,why:'休息'});log(S,p.name+' 休息一轮,跳过','warn');continue}
  S.turn=p.id;if(idx<=oldIdx||a.length===1)S.round=(S.round||1)+1;break;
 }
 S.tp='roll';S.roll=null;S.rr=0;S.again=false;S.q=[];S.pend=null;
 if(skipped.length){skipped.forEach(function(x){say(S,x.pid,'restTurn')});ev(S,{k:'skip',list:skipped})}
 ev(S,{k:'turn',pid:S.turn});
 if(P(S,S.turn)){say(S,S.turn,'turnStart');loanDueCheck(S,P(S,S.turn));finTurnLines(S,P(S,S.turn))}
}
/* ---------- bankrupt / leave ---------- */
function removePlayer(S,p,creditor,why){
 var cashLeft=p.cash;
 if(cashLeft>0)xfer(S,p.id,creditor!=null?creditor:'bank',cashLeft,why);
 Object.keys(S.props).forEach(function(n){var q=S.props[n];if(q.owner===p.id){if(creditor!=null){q.owner=creditor}else{q.owner=null;q.lvl=0;q.mort=false}}});
 p.hand.forEach(function(c){releaseCard(S,c)});p.hand=[];
 loanOnRemove(S,p,creditor);
 p.out=true;p.rest=p.sleep=p.seal=p.slow=p.rev=p.forced=0;
 // v17: keep the player in S.players with elimination info (who/when/why) so the panel & ranking can still show them
 S.outSeq=(S.outSeq||0)+1;p.outWhy=why||'leave';p.outR=S.round||1;p.outN=S.outSeq;p.outTo=creditor!=null?creditor:null;
 // drop pends referring to p
 S.q=S.q.filter(function(x){return x.pid!==p.id});sync(S);
}
function afterRemoval(S,wasCurrent){
 if(checkWinner(S))return;
 if(wasCurrent){S.again=false;nextTurn(S)}
}
/* ---------- chance effects ---------- */
function playersOpts(S,p,incl){return active(S).filter(function(x){return incl||x.id!==p.id}).map(function(x){return x.id})}
function propsOf(S,pid){return ownedBy(S,pid)}
function othersProps(S,pid){return Object.keys(S.props).filter(function(n){var q=S.props[n];return q.owner!=null&&q.owner!==pid}).sort(function(a,b){return DATA.deeds[a].sq-DATA.deeds[b].sq})}
function feeTarget(S){return S.cfg.feeTo==='pot'?'pot':'bank'}
function applyChance(S,p,c){ // immediate effect; may push pends
 var fx=c.fx,d=c.fxd||{};
 function fee(a,payer){push(S,{t:'pay',pid:(payer||p).id,to:feeTarget(S),amount:a,reason:'chance',why:c.title+' · 付 ¥'+a})}
 switch(fx){
 case 'gain_bank':push(S,{t:'gain',pid:p.id,from:'bank',amount:+amountOf(c),why:c.title});break;
 case 'pay_bank':fee(amountOf(c));break;
 case 'gain_bank_all':push(S,{t:'gainAll',pid:p.id,amount:1000,why:c.title});break;
 case 'pay_bank_richest_player':{
   var mx=Math.max.apply(null,active(S).map(function(x){return x.cash}));
   active(S).filter(function(x){return x.cash===mx}).forEach(function(x){fee(1200,x)});break}
 case 'move_to_start_and_collect':{jump(S,p,0);log(S,p.name+' 回到起点');push(S,{t:'gain',pid:p.id,from:'bank',amount:2000,kind:'start',why:'回到原点 · 领取'});break}
 case 'rest':p.rest=Math.max(p.rest,+(d.rounds||1));log(S,p.name+' 原地休息 '+(d.rounds||1)+' 轮','warn');say(S,p.id,'restTurn');break;
 case 'reverse_direction':push(S,{t:'pick',kind:'player',purpose:'reverse',pid:p.id,opts:playersOpts(S,p,true),title:'向后转',text:'指定自己或其他玩家掉头向后转行棋 2 轮'});break;
 case 'seal_all_properties_of_other':{
   var o=playersOpts(S,p).filter(function(id){return ownedBy(S,id).length>0});
   if(!o.length){log(S,'没有人有地产,查封落空');break}
   push(S,{t:'pick',kind:'player',purpose:'seal',pid:p.id,opts:o,title:'查封地产',text:'选一位玩家,他的所有地产 2 轮不能收观光费'});break}
 case 'demolish_property_of_other':{
   var dp=othersProps(S,p.id).filter(function(n){return S.props[n].lvl>0});
   if(!dp.length){log(S,'没有可拆的房产,怪兽扑了个空');break}
   push(S,{t:'pick',kind:'prop',purpose:'monster',pid:p.id,opts:dp.map(function(n){return{name:n,owner:S.props[n].owner,lvl:S.props[n].lvl}}),title:'怪兽来袭!',text:'选一处其他玩家的房产让怪兽拆'});break}
 case 'raise_house_level_color_group':{
   var op=S.cfg.angelScope==='all'?Object.keys(S.props).filter(function(n){return S.props[n].owner!=null}):ownedBy(S,p.id);
   op=op.filter(function(n){return S.props[n].lvl<4||groupMembers(S,n).some(function(m){return S.props[m].lvl<4})});
   if(!op.length){log(S,'没有可提升的地产,天使飞走了');break}
   push(S,{t:'pick',kind:'prop',purpose:'angel',pid:p.id,opts:op.map(function(n){return{name:n,owner:S.props[n].owner,lvl:S.props[n].lvl}}),title:'天使降临',text:'指定一处地产,同色的地产全部提升 '+S.cfg.angelLevels+' 级'});break}
 case 'swap_property':{
   var mine=ownedBy(S,p.id),oth=othersProps(S,p.id);
   if(!mine.length||!oth.length){log(S,'无法交换地产(自己或对方没有地产)');break}
   push(S,{t:'pick',kind:'prop',purpose:'swap1',pid:p.id,opts:mine.map(function(n){return{name:n,owner:p.id,lvl:S.props[n].lvl}}),title:'交换地产 ①',text:'先选自己要换出去的地产'});break}
 }
}
function amountOf(c){if(c.fxd&&c.fxd.amount)return +c.fxd.amount;var m=c.text.match(/[¥￥]?\s*(\d{3,5})\s*元?/);return m?+m[1]:0}
var CARD_AMOUNT={};
/* ---------- hold-card use ---------- */
function canUse(S,p,n){ // returns '' ok or reason
 var c=card(n);if(S.phase!=='play')return '游戏未进行';
 if(p.hand.indexOf(n)<0)return '没有这张卡';
 if(p.id!==S.turn)return '要等到自己的回合才能使用';
 if(c.fx==='waive_one_rent'){return (S.pend&&S.pend.t==='pay'&&S.pend.reason==='rent'&&S.pend.pid===p.id)?'':'只能在要付观光费的时候使用'}
 if(S.pend)return '先完成当前步骤';
 if(c.fx==='dice_bonus')return (S.tp==='rolled'&&S.roll&&!S.roll.bonus)?'':'掷骰后、出发前才能使用';
 if(S.tp!=='roll'&&S.tp!=='end')return '现在不能使用(掷骰前或回合结束前)';
 if(c.fx==='choose_next_roll')return S.tp==='roll'?'':'要在掷骰前使用';
 if(c.fx==='force_buy_property'){return forceOpts(S,p).length?'':'没有可以强买的地产(或钱不够)'}
 if(c.fx==='slow_target'||c.fx==='sleep_other'){return playersOpts(S,p).length?'':'没有可选玩家'}
 return '';
}
function forceOpts(S,p){return othersProps(S,p.id).filter(function(n){return !S.props[n].mort}).map(function(n){var r=rentFor(S,n);return{name:n,owner:S.props[n].owner,lvl:S.props[n].lvl,price:r.amount,ok:p.cash>=r.amount&&r.amount>0}}).filter(function(o){return o.ok})}
function useCard(S,p,n){
 var why=canUse(S,p,n);if(why)return{ok:false,err:why};
 var c=card(n);
 switch(c.fx){
 case 'waive_one_rent':{p.hand.splice(p.hand.indexOf(n),1);releaseCard(S,n);log(S,p.name+' 使用「'+c.title+'」免付观光费','good');ev(S,{k:'note',txt:'免费通行!'});S.q.shift();sync(S);afterQueue(S);return{ok:true}}
 case 'dice_bonus':{p.hand.splice(p.hand.indexOf(n),1);releaseCard(S,n);S.roll.bonus=3;log(S,p.name+' 乘高铁,点数 +3','good');return{ok:true}}
 case 'choose_next_roll':pushFront(S,{t:'pick',kind:'num',purpose:'remote',pid:p.id,card:n,opts:[1,2,3,4,5,6],optional:true,title:c.title,text:'决定下次行棋的步数(1–6)'});return{ok:true};
 case 'force_buy_property':pushFront(S,{t:'pick',kind:'prop',purpose:'force',pid:p.id,card:n,opts:forceOpts(S,p),optional:true,title:c.title,text:'强制购买其他玩家的一处地产,价格=该地产现在的观光费'});return{ok:true};
 case 'slow_target':pushFront(S,{t:'pick',kind:'player',purpose:'slow',pid:p.id,card:n,opts:playersOpts(S,p),optional:true,title:c.title,text:'选一位玩家:他连续 2 轮只能前进一步'});return{ok:true};
 case 'sleep_other':pushFront(S,{t:'pick',kind:'player',purpose:'sleep',pid:p.id,card:n,opts:playersOpts(S,p),optional:true,title:c.title,text:'选一位玩家:他原地睡 2 轮,不能动也不能收观光费'});return{ok:true};
 case 'rewind_one_turn':pushFront(S,{t:'pick',kind:'player',purpose:'rewind',pid:p.id,card:n,opts:playersOpts(S,p,true),optional:true,title:c.title,text:'选一位玩家回到他上一回合开始前的位置'});return{ok:true};
 }
 return{ok:false,err:'这张卡不能这样用'};
}
function consumeHold(S,pd){if(pd.card){var p=P(S,pd.pid),i=p.hand.indexOf(pd.card);if(i>=0)p.hand.splice(i,1);releaseCard(S,pd.card)}}
/* ---------- pick resolution ---------- */
function resolvePick(S,pd,val){
 var p=P(S,pd.pid),pu=pd.purpose;
 function has(x){return pd.opts.some(function(o){return (o&&typeof o==='object')?o.name===x:o===x})}
 if(!has(val))return{ok:false,err:'这个选项不可用'};
 switch(pu){
 case 'remote':p.forced=val;consumeHold(S,pd);log(S,p.name+' 用遥控骰子:下次走 '+val+' 步','good');break;
 case 'slow':{var t=P(S,val);t.slow=2;ev(S,{k:'mood',pid:t.id,m:'angry'});consumeHold(S,pd);log(S,t.name+' 被龟速:2 轮只能走 1 步','warn');break}
 case 'sleep':{var t2=P(S,val);t2.sleep=2;ev(S,{k:'mood',pid:t2.id,m:'sleep'});consumeHold(S,pd);log(S,t2.name+' 睡着了 2 轮','warn');say(S,t2.id,'restTurn');break}
 case 'rewind':{var t3=P(S,val);if(t3.from!=null&&t3.from!==t3.pos){jump(S,t3,t3.from);log(S,t3.name+' 回到上一回合的位置','warn')}else log(S,t3.name+' 位置没变(时光机无效果)');consumeHold(S,pd);break}
 case 'reverse':{var t4=P(S,val);t4.rev=2;log(S,t4.name+' 掉头向后转 2 轮','warn');break}
 case 'seal':{var t5=P(S,val);t5.seal=2;ev(S,{k:'mood',pid:t5.id,m:'angry'});log(S,t5.name+' 的地产被查封 2 轮','warn');break}
 case 'force':{var q=S.props[val],r=rentFor(S,val),ow=q.owner;
   if(p.cash<r.amount)return{ok:false,err:'钱不够'};
   xfer(S,p.id,ow,r.amount,'force');q.owner=p.id;ev(S,{k:'mood',pid:ow,m:'angry'});consumeHold(S,pd);log(S,p.name+' 强买 '+val+' ¥'+r.amount,'good');say(S,p.id,'boughtProperty',val);break}
 case 'monster':{var q2=S.props[val];
   if(S.cfg.monster==='all')q2.lvl=0;else q2.lvl=Math.max(0,q2.lvl-1);ev(S,{k:'mood',pid:q2.owner,m:'angry'});log(S,'怪兽拆了 '+val+' 的房子','warn');break}
 case 'angel':{var grp=groupMembers(S,val);
   grp.forEach(function(m){var q3=S.props[m];if(q3.owner==null||q3.mort)return;if(S.cfg.angelScope==='own'&&q3.owner!==p.id)return;q3.lvl=Math.min(4,q3.lvl+(+S.cfg.angelLevels||1))});
   log(S,'天使降临:'+val+' 同色地产升级','good');break}
 case 'swap1':{pd.mine=val;pd.purpose='swap2';pd.kind='prop';pd.opts=othersProps(S,p.id).map(function(n){return{name:n,owner:S.props[n].owner,lvl:S.props[n].lvl}});pd.title='交换地产 ②';pd.text='再选对方的地产(对方不能拒绝)';pd.optional=false;sync(S);return{ok:true,stage:2}}
 case 'swap2':{var a=S.props[pd.mine],b=S.props[val],o2=b.owner;a.owner=o2;b.owner=p.id;ev(S,{k:'mood',pid:o2,m:'angry'});log(S,p.name+' 用 '+pd.mine+' 换了 '+val,'good');break}
 case 'upgrade':{var q4=S.props[val],dd=deed(S,val),cost=dd.build[q4.lvl===3?1:0];
   if(q4.mort||q4.lvl>=4)return{ok:false,err:'不能升级'};
   if(!xfer(S,p.id,'bank',cost,'build'))return{ok:false,err:'钱不够'};
   q4.lvl++;log(S,p.name+' 升级 '+val+' → '+LVN[q4.lvl],'good');ev(S,{k:'build',name:val});say(S,p.id,'builtUpgrade',val);break}
 case 'airport':{ var from=p.pos,to=DATA.deeds[val].sq,steps=(to-from+N)%N,passed=0,pos=from,k;
   for(k=1;k<=steps;k++){pos=(pos+1)%N;if(pos===0)passed++}
   jump(S,p,to);log(S,p.name+' 乘飞机飞往 '+val,'good');S.q.shift();sync(S);
   if(passed){push(S,{t:'gain',pid:p.id,from:'bank',amount:S.cfg.salary*passed,kind:'start',why:(p.pos===0?'到达起点':'经过起点')+' · 奖励'})}
   landOn(S,p,to,{noSalary:true});afterQueue(S);return{ok:true}}
 default:return{ok:false,err:'未知操作'};
 }
 popPend(S);return{ok:true};
}
/* v17: where 「上一步」 goes from the current pick: 'swap1' (swap step ② → ①), 'face' (chance pick → card face), 'card' (hold-card pick → card view), or null */
function backInfo(S){var pd=S.pend;if(!pd||pd.t!=='pick'||S.phase!=='play')return null;
 if(pd.purpose==='swap2')return 'swap1';if(pd.cc)return 'face';if(pd.card)return 'card';return null}
function unrelease(S,n){var d=S.deck,i=d.q.lastIndexOf(n);if(i>=0){d.q.splice(i,1);return}i=d.disc.lastIndexOf(n);if(i>=0)d.disc.splice(i,1)}
/* ---------- the action dispatcher ---------- */
function exec(S,type,a){
 a=a||{};
 if(S.phase==='over'&&type!=='nop')return{ok:false,err:'游戏已结束'};
 if(S.phase!=='play'&&['start','nop'].indexOf(type)<0)return{ok:false,err:'游戏还没开始'};
 var p=cur(S),pd=S.pend,r;
 switch(type){
 case 'roll':{
   if(S.tp!=='roll'||pd)return{ok:false,err:'现在不能掷骰'};
   var v=rint(6)+1,forced=0,slow=false;
   if(p.forced){v=p.forced;forced=p.forced;p.forced=0}
   if(p.slow>0){slow=true;p.slow--;v=1}
   S.roll={v:v,bonus:0,dir:p.rev>0?-1:1,forced:forced,slow:slow};S.tp='rolled';
   ev(S,{k:'roll',v:v,pid:p.id,forced:forced,slow:slow});
   log(S,p.name+' 掷出 '+v+(slow?'(龟速:只走1步)':forced?'(遥控)':''));
   if(!slow&&!forced)sayRoll(S,p,v);
   return{ok:true,v:v}}
 case 'reroll':{
   if(S.tp!=='rolled'||pd||!S.roll)return{ok:false,err:'现在不能重掷'};
   if(S.roll.forced)return{ok:false,err:'遥控骰子的点数已经定好了,不能重掷'};
   if(S.roll.slow)return{ok:false,err:'龟速前进只能走 1 步,不能重掷'};
   if(!canReroll(S))return{ok:false,err:'这回合的重掷机会用完啦'};
   var rv=rint(6)+1;S.rr=(S.rr||0)+1;S.roll.v=rv;
   ev(S,{k:'roll',v:rv,pid:p.id,forced:0,slow:false,reroll:true});
   log(S,p.name+' 重掷,这次是 '+rv+'(第 '+S.rr+' 次重掷)');
   sayRoll(S,p,rv);
   return{ok:true,v:rv,left:rerollsLeft(S)}}
 case 'go':{
   if(S.tp!=='rolled'||pd)return{ok:false,err:'现在不能出发'};
   var steps=S.roll.v+S.roll.bonus;if(S.roll.slow)steps=1;
   var dir=S.roll.dir;p.from=p.pos;
   var m=movePlayer(S,p,steps,dir);if(dir<0&&p.rev>0)p.rev--;
   S.roll=null;S.tp='resolve';
   var hotelPass=(S.cfg.hotelRest==='pass'&&m.passHotel);
   if(m.passed){push(S,{t:'gain',pid:p.id,from:'bank',amount:S.cfg.salary*m.passed,kind:'start',why:(p.pos===0?'到达起点':'经过起点')+' · 奖励'})}
   if(hotelPass){p.rest=Math.max(p.rest,1);log(S,p.name+' 路过酒店,歇息一轮','warn')}
   landOn(S,p,p.pos);
   afterQueue(S);
   return{ok:true,path:m.path}}
 case 'ok':{
   if(!pd)return{ok:false,err:'没有待确认的事'};
   var pl=P(S,pd.pid);
   if(pd.t==='gain'){
     if(pd.kind==='start'){var fs1=finState(S,pd.pid);ev(S,{k:'collect',pid:pd.pid,amount:pd.amount,big:!!(fs1&&fs1.id==='danger')})}
     if(!xfer(S,pd.from,pd.pid,pd.amount,'gain'))return{ok:false,err:'银行/奖池不足'};
     log(S,pl.name+' 获得 ¥'+pd.amount+'('+pd.why+')','good');say(S,pd.pid,/起点|原点/.test(pd.why)?'passedStart':'gotMoney',pd.amount);popPend(S);return{ok:true}}
   if(pd.t==='gainAll'){active(S).forEach(function(x){xfer(S,'bank',x.id,pd.amount,'all')});log(S,'共同富裕:每人 +¥'+pd.amount,'good');say(S,pd.pid,'gotMoney',pd.amount);popPend(S);return{ok:true}}
   if(pd.t==='pay'){
     if(pl.cash<pd.amount)return{ok:false,err:'cash',short:pd.amount-pl.cash};
     xfer(S,pd.pid,pd.to,pd.amount,pd.reason);log(S,pl.name+' 支付 ¥'+pd.amount+'('+pd.why+')');
     if(pd.reason==='rent'){say(S,pd.pid,'paidRent',pd.amount);if(typeof pd.to==='number')say(S,pd.to,'receivedRent',pd.amount)}else say(S,pd.pid,'fined',pd.amount);
     popPend(S);return{ok:true}}
   if(pd.t==='buy'){
     if(pl.cash<pd.price)return{ok:false,err:'cash',short:pd.price-pl.cash};
     if(S.props[pd.name].owner!=null)return{ok:false,err:'已有主人'};
     xfer(S,pd.pid,'bank',pd.price,'buy');S.props[pd.name].owner=pd.pid;log(S,pl.name+' 买下 '+pd.name+' ¥'+pd.price,'good');ev(S,{k:'own',name:pd.name,pid:pd.pid});say(S,pd.pid,'boughtProperty',pd.name);popPend(S);return{ok:true}}
   if(pd.t==='build'){
     var q=S.props[pd.name];if(q.lvl+1!==pd.to||q.mort)return{ok:false,err:'状态已变化'};
     if(pl.cash<pd.cost)return{ok:false,err:'cash',short:pd.cost-pl.cash};
     xfer(S,pd.pid,'bank',pd.cost,'build');q.lvl=pd.to;log(S,pl.name+' 在 '+pd.name+' 建成 '+LVN[q.lvl],'good');ev(S,{k:'build',name:pd.name});say(S,pd.pid,'builtUpgrade',pd.name);popPend(S);return{ok:true}}
   if(pd.t==='windfall'&&pd.stage==='pay'){
     xfer(S,'bank',pd.pid,pd.amount,'windfall');log(S,pl.name+' 天降横财 ¥'+pd.amount,'good');say(S,pd.pid,'gotMoney',pd.amount);popPend(S);return{ok:true}}
   if(pd.t==='chance'&&pd.stage==='face'){
     var c=card(pd.card);
     if(c.hold){pl.hand.push(c.n);log(S,pl.name+' 收好「'+c.title+'」','good');S.q.shift();sync(S);afterQueue(S);return{ok:true,held:true}}
     S.q.shift();sync(S);var q0=S.q.slice();applyChance(S,pl,c);S.q.forEach(function(x){if(q0.indexOf(x)<0&&x.t==='pick'&&!x.card)x.cc=c.n});releaseCard(S,c.n);afterQueue(S);sync(S);return{ok:true}}
   return{ok:false,err:'不能这样确认'}}
 case 'no':{ // decline buy / build / optional pick
   if(!pd)return{ok:false,err:'没有待确认的事'};
   if(pd.t==='buy'){log(S,P(S,pd.pid).name+' 放弃购买 '+pd.name);popPend(S);return{ok:true}}
   if(pd.t==='build'){popPend(S);return{ok:true}}
   if(pd.t==='pick'&&pd.optional){popPend(S);return{ok:true}}
   return{ok:false,err:'不能放弃'}}
 case 'flip':{
   if(!pd||pd.t!=='chance'||pd.stage!=='back')return{ok:false,err:'现在不能翻牌'};
   var dc=drawCard(S);if(dc==null){log(S,'机会卡都在大家手里,这次没有卡');popPend(S);return{ok:false,err:'牌堆空了'}}
   pd.card=dc;pd.stage='face';ev(S,{k:'flip',card:pd.card});log(S,P(S,pd.pid).name+' 抽到机会卡「'+card(pd.card).title+'」');return{ok:true,card:pd.card}}
 case 'wroll':{
   if(!pd||pd.t!=='windfall'||pd.stage!=='roll')return{ok:false,err:'现在不能掷'};
   var wv=rint(6)+1;pd.v=wv;pd.amount=wv*100;pd.stage='pay';ev(S,{k:'wroll',v:wv});return{ok:true,v:wv}}
 case 'pick':{
   if(!pd||pd.t!=='pick')return{ok:false,err:'没有待选择的事'};
   r=resolvePick(S,pd,a.value);return r}
 case 'loan':{ // a:{from:出借人,to:借款人,amount,rate} — 出借人已当面点了「同意」
   if(S.cfg.loanOn===false)return{ok:false,err:'玩家互动没有打开'};
   var lf=P(S,a.from),lt=P(S,a.to),la=Math.round(+a.amount||0),lr=+a.rate||0;
   if(!lf||!lt||lf.out||lt.out||lf===lt)return{ok:false,err:'玩家不对'};
   if(!(la>0)||la%100)return{ok:false,err:'金额要是 100 的整数倍'};if(lr!==0&&lr!==10)return{ok:false,err:'利息只能 0% 或 10%'};
   if(lf.cash<la)return{ok:false,err:lf.name+' 的钱不够借'};
   var ln={id:S.lid++,from:lf.id,to:lt.id,amt:la,rate:lr,owe:loanOwe(la,lr),r0:S.round||1,due:(S.round||1)+(+S.cfg.loanRounds||3),st:'open',paid:0};
   S.loans.push(ln);xfer(S,lf.id,lt.id,la,'loan');log(S,lf.name+' 借给 '+lt.name+' ¥'+la+(lr?'(利息 '+lr+'%)':'(不要利息)')+',第 '+ln.due+' 回合到期','good');
   ev(S,{k:'loan',id:ln.id,from:lf.id,to:lt.id,amt:la});say(S,lf.id,'lendYes');say(S,lt.id,'thanks');return{ok:true,id:ln.id}}
 case 'repay':{ // a:{id, amount?} 提前还(全部或部分)
   var rl=(S.loans||[]).filter(function(l){return l.id===a.id})[0];if(!rl||!loanOpen(rl))return{ok:false,err:'没有这笔借款'};
   var rb=P(S,rl.to);if(!rb||rb.out)return{ok:false,err:'玩家不对'};
   var want=a.amount!=null?Math.round(+a.amount):rl.owe;if(!(want>0))return{ok:false,err:'金额不对'};
   if(rb.cash<Math.min(want,rl.owe))return{ok:false,err:'cash',short:Math.min(want,rl.owe)-rb.cash};
   var pd2=payLoan(S,rl,want,'early');log(S,rb.name+' 还给 '+pname(S,rl.from)+' ¥'+pd2+(rl.st==='paid'?',还清啦':',还欠 ¥'+rl.owe),'good');
   say(S,rb.id,'repaid');return{ok:true,amount:pd2,done:rl.st==='paid'}}
 case 'gift':{ // 送红包 a:{from,to,amount}
   if(S.cfg.loanOn===false)return{ok:false,err:'玩家互动没有打开'};
   var gf=P(S,a.from),gt=P(S,a.to),ga=Math.round(+a.amount||0);if(!gf||!gt||gf.out||gt.out||gf===gt)return{ok:false,err:'玩家不对'};
   if(!(ga>0))return{ok:false,err:'金额不对'};if(gf.cash<ga)return{ok:false,err:'cash',short:ga-gf.cash};
   xfer(S,gf.id,gt.id,ga,'gift');log(S,gf.name+' 送给 '+gt.name+' 红包 ¥'+ga,'good');ev(S,{k:'gift',from:gf.id,to:gt.id,amt:ga});say(S,gf.id,'giftGive');say(S,gt.id,'thanks');return{ok:true}}
 case 'sell':{ // 房产买卖 a:{from:卖家,to:买家,name,price} — 买家已当面点了「同意」
   if(S.cfg.loanOn===false)return{ok:false,err:'玩家互动没有打开'};
   var sf=P(S,a.from),st2=P(S,a.to),sq2=S.props[a.name],sp2=Math.round(+a.price||0);
   if(!sf||!st2||sf.out||st2.out||sf===st2)return{ok:false,err:'玩家不对'};if(!sq2||sq2.owner!==sf.id)return{ok:false,err:'不是你的地产'};
   if(!(sp2>=0)||sp2%100)return{ok:false,err:'价格要是 100 的整数倍'};if(st2.cash<sp2)return{ok:false,err:'cash',short:sp2-st2.cash};
   if(sp2)xfer(S,st2.id,sf.id,sp2,'sell');sq2.owner=st2.id;log(S,sf.name+' 把 '+a.name+' 卖给 '+st2.name+' ¥'+sp2,'good');
   ev(S,{k:'own',name:a.name,pid:st2.id});say(S,sf.id,'deal');return{ok:true}}
 case 'giveup':{ // v17 放弃: works on every pick. hold card → stays in hand; immediate chance card → forfeited (already back in the deck)
   if(!pd||pd.t!=='pick')return{ok:false,err:'没有可以放弃的选择'};
   var gp=P(S,pd.pid),res={ok:true,purpose:pd.purpose};
   if(pd.card){res.kept=pd.card;log(S,gp.name+' 先不用「'+card(pd.card).title+'」,收回手牌')}
   else if(pd.cc){res.forfeit=pd.cc;log(S,gp.name+' 放弃了机会卡「'+card(pd.cc).title+'」,这张卡作废','warn')}
   else if(pd.purpose==='airport')log(S,gp.name+' 不坐飞机,留在机场');
   else if(pd.purpose==='upgrade')log(S,gp.name+' 放弃升级房产');
   else log(S,gp.name+' 放弃了选择');
   popPend(S);return res}
 case 'back':{ // v17 上一步
   var bk=backInfo(S);if(!bk)return{ok:false,err:'没有上一步'};
   if(bk==='swap1'){pd.purpose='swap1';pd.kind='prop';delete pd.mine;pd.opts=ownedBy(S,pd.pid).map(function(n){return{name:n,owner:pd.pid,lvl:S.props[n].lvl}});pd.title='交换地产 ①';pd.text='先选自己要换出去的地产';sync(S);return{ok:true,to:'swap1'}}
   if(bk==='face'){unrelease(S,pd.cc);S.q[0]={t:'chance',pid:pd.pid,stage:'face',card:pd.cc};sync(S);return{ok:true,to:'face',card:pd.cc}}
   if(bk==='card'){var hc=pd.card;S.q.shift();sync(S);afterQueue(S);return{ok:true,to:'card',card:hc,pid:pd.pid}}
   return{ok:false,err:'没有上一步'}}
 case 'free':{ // use 免费1次 on rent
   if(!pd||pd.t!=='pay'||pd.reason!=='rent')return{ok:false,err:'现在不能用'};
   var pp=P(S,pd.pid),cn=pp.hand.filter(function(n){return card(n).fx==='waive_one_rent'})[0];
   if(!cn)return{ok:false,err:'没有「免费1次!」'};return useCard(S,pp,cn)}
 case 'use':{
   var up=P(S,a.pid);if(!up)return{ok:false,err:'玩家不存在'};return useCard(S,up,a.card)}
 case 'end':{
   if(S.tp!=='end'||pd)return{ok:false,err:'现在不能结束回合'};
   p.ack=p.hand.slice();var fs0=finState(S,p.id);p.ackD=!!(fs0&&fs0.id==='danger');tickEnd(p);log(S,p.name+' 结束回合');nextTurn(S);return{ok:true}}
 case 'bankrupt':{
   if(!pd||pd.t!=='pay'&&pd.t!=='buy'&&pd.t!=='build')return{ok:false,err:'现在不能破产'};
   if(pd.t!=='pay')return{ok:false,err:'只有付不起钱时才能破产'};
   var bp=P(S,pd.pid);if(bp.cash>=pd.amount)return{ok:false,err:'你付得起,不用破产'};
   var cred=typeof pd.to==='number'?pd.to:null;
   var wasCur=bp.id===S.turn;
   log(S,bp.name+' 破产了!'+(cred!=null?' 财产归 '+pname(S,cred):' 财产回到银行'),'warn');
   var bkProps=ownedBy(S,bp.id).map(function(n){return{name:n,lvl:S.props[n].lvl,mort:S.props[n].mort}}),bkCash=bp.cash;
   removePlayer(S,bp,cred,'bankrupt');ev(S,{k:'bankrupt',pid:bp.id,tok:bp.tok,name:bp.name,creditor:cred,props:bkProps,cash:bkCash});say(S,bp.id,'bankruptcy');
   afterRemoval(S,wasCur);if(!wasCur&&S.phase==='play')afterQueue(S);return{ok:true}}
 case 'lucky':{ // 翻身机会: 付不起钱时掷一次幸运骰,5→+500 6→+1000
   if(!pd||pd.t!=='pay')return{ok:false,err:'现在不能用翻身机会'};
   var lp2=P(S,pd.pid);if(lp2.cash>=pd.amount)return{ok:false,err:'你付得起,不用求救'};
   if(S.cfg.luckyRoll===false)return{ok:false,err:'翻身机会没有打开'};
   if(lp2.lucky)return{ok:false,err:'这局的翻身机会已经用过啦'};
   lp2.lucky=1;var lv=rint(6)+1,bonus=lv===6?1000:lv===5?500:0;
   ev(S,{k:'lucky',pid:lp2.id,v:lv,bonus:bonus});log(S,lp2.name+' 用翻身机会掷出 '+lv+(bonus?',获得 ¥'+bonus:',这次没中'),bonus?'good':'warn');
   if(bonus)xfer(S,'bank',lp2.id,bonus,'lucky');
   return{ok:true,v:lv,bonus:bonus}}
 case 'mortgage':{
   var o=P(S,a.pid),n=a.name,q5=S.props[n];if(!q5||q5.owner!==a.pid)return{ok:false,err:'不是你的地产'};if(q5.mort)return{ok:false,err:'已经抵押了'};
   var mv=deed(S,n).mortgage;xfer(S,'bank',o.id,mv,'mort');q5.mort=true;log(S,o.name+' 抵押 '+n+' 得 ¥'+mv);return{ok:true,amount:mv}}
 case 'redeem':{
   var o3=P(S,a.pid),n3=a.name,q6=S.props[n3];if(!q6||q6.owner!==a.pid)return{ok:false,err:'不是你的地产'};if(!q6.mort)return{ok:false,err:'没有抵押'};
   var rc=deed(S,n3).redeem;if(o3.cash<rc)return{ok:false,err:'cash',short:rc-o3.cash};
   xfer(S,o3.id,'bank',rc,'redeem');q6.mort=false;log(S,o3.name+' 赎回 '+n3+' 付 ¥'+rc);return{ok:true,amount:rc}}
 case 'build':{ // manual build (only when cfg.buildAnywhere)
   if(!S.cfg.buildAnywhere)return{ok:false,err:'规则:只能停在自己的地产或「升级房产」格时盖房'};
   var o4=P(S,a.pid),n4=a.name,q7=S.props[n4];if(!q7||q7.owner!==a.pid||q7.mort||q7.lvl>=4)return{ok:false,err:'不能盖'};
   var cst=deed(S,n4).build[q7.lvl===3?1:0];if(!xfer(S,o4.id,'bank',cst,'build'))return{ok:false,err:'cash',short:cst-o4.cash};
   q7.lvl++;log(S,o4.name+' 在 '+n4+' 建成 '+LVN[q7.lvl],'good');ev(S,{k:'build',name:n4});return{ok:true}}
 case 'sellBuilding':{
   var o5=P(S,a.pid),n5=a.name,q8=S.props[n5];if(!q8||q8.owner!==a.pid||q8.lvl<1)return{ok:false,err:'没有房子可拆'};
   var cs=deed(S,n5).build[q8.lvl===4?1:0],rf=Math.floor(cs*S.cfg.refundPct/100);
   q8.lvl--;xfer(S,'bank',o5.id,rf,'sellb');log(S,o5.name+' 拆掉 '+n5+' 一级,退 ¥'+rf);return{ok:true,amount:rf}}
 case 'trade':{ // a:{from,to,give:[names],get:[names],cashGive,cashGet}
   var f=P(S,a.from),t=P(S,a.to);if(!f||!t||f.out||t.out||f===t)return{ok:false,err:'玩家不对'};
   var give=a.give||[],get=a.get||[],cg=+a.cashGive||0,ck=+a.cashGet||0;
   if(cg<0||ck<0)return{ok:false,err:'金额不对'};
   if(!give.every(function(n){return S.props[n]&&S.props[n].owner===f.id})||!get.every(function(n){return S.props[n]&&S.props[n].owner===t.id}))return{ok:false,err:'地产归属有误'};
   if(!give.length&&!get.length&&!cg&&!ck)return{ok:false,err:'没有交易内容'};
   if(f.cash<cg||t.cash<ck)return{ok:false,err:'有人钱不够'};
   if(cg)xfer(S,f.id,t.id,cg,'trade');if(ck)xfer(S,t.id,f.id,ck,'trade');
   give.forEach(function(n){S.props[n].owner=t.id});get.forEach(function(n){S.props[n].owner=f.id});
   log(S,f.name+' ⇄ '+t.name+' 交易完成','good');return{ok:true}}
 case 'join':{
   var jr=addPlayer(S,a.name,a.tok);if(!jr.ok)return jr;
   var jp=P(S,jr.id);jp.from=0;S.fs=S.fs||{};finInit(S);log(S,jp.name+' 加入游戏,领到 ¥'+S.cfg.start+',站在起点','good');ev(S,{k:'join',pid:jp.id});return{ok:true,id:jp.id}}
 case 'leave':{
   var lp=P(S,a.pid);if(!lp||lp.out)return{ok:false,err:'玩家不存在'};
   if(active(S).length<2)return{ok:false,err:'至少要留下 1 位'};
   if(S.pend&&lp.id!==S.turn)return{ok:false,err:'先完成当前步骤'};
   var wc=lp.id===S.turn;log(S,lp.name+' 离开了,财产回到银行','warn');
   removePlayer(S,lp,null,'leave');ev(S,{k:'leave',pid:lp.id});afterRemoval(S,wc);return{ok:true}}
 case 'sync':{ // align with the physical board; no effects, no salary
   var sp=P(S,a.pid);if(!sp||sp.out)return{ok:false,err:'玩家不存在'};
   var to=a.pos!=null?((+a.pos%N)+N)%N:((sp.pos+(+a.delta||0))%N+N)%N;
   if(to===sp.pos)return{ok:true};
   sp.pos=to;ev(S,{k:'jump',pid:sp.id,to:to});log(S,sp.name+' 的棋子对位到 '+DATA.squares[to].name);return{ok:true}}
 case 'setCfg':{if(!(a.key in DEF_CFG))return{ok:false,err:'未知设置'};S.cfg[a.key]=a.value;return{ok:true}}
 case 'nop':return{ok:true};
 }
 return{ok:false,err:'未知操作 '+type};
}
/* ---------- auto-resolve: steps that have no player choice ---------- */
function sayRoll(S,p,v){if(v===6)say(S,p.id,'roll6');else if(v===1)say(S,p.id,'lowRoll')}
function hasWaive(p){return p.hand.some(function(c){return card(c).fx==='waive_one_rent'})}
function autoKind(S,pd){ // 'ok' | 'cant' | null (null = the player has a real choice)
 if(!S.cfg.autoResolve)return null;
 var p=P(S,pd.pid);if(!p||p.out)return null;
 switch(pd.t){
 case 'gain':if(pd.kind==='start'&&S.cfg.startManual!==false)return null;return 'ok';
 case 'gainAll':return 'ok';
 case 'pay':if(pd.reason==='rent'?S.cfg.rentManual!==false:S.cfg.penaltyManual!==false)return null;return (p.cash>=pd.amount&&!(pd.reason==='rent'&&hasWaive(p)))?'ok':null;
 case 'buy':return (p.cash<pd.price&&p.cash+liquid(S,p.id)<pd.price)?'cant':null;
 case 'build':return p.cash<pd.cost?'cant':null;
 case 'windfall':return pd.stage==='pay'?'ok':null;
 }
 return null;
}
function autoRun(S){
 if(!S.cfg.autoResolve)return;
 for(var g=0;g<30&&S.phase==='play'&&S.pend;g++){
  var pd=S.pend,k=autoKind(S,pd);if(!k)break;
  if(k==='cant'){var pl=P(S,pd.pid);
   log(S,pl.name+(pd.t==='buy'?' 买不起 ':' 钱不够盖 ')+pd.name,'warn');say(S,pl.id,'cantAfford',pd.name);
   ev(S,{k:'note',txt:(pd.t==='buy'?'买不起 ':'钱不够盖 ')+pd.name});popPend(S);continue}
  var r=exec(S,'ok');if(!r.ok)break;
 }
}
var AUTO_AFTER={giveup:1,lucky:1,go:1,ok:1,no:1,pick:1,use:1,free:1,wroll:1,bankrupt:1,leave:1};
function act(S,type,a){
 S.ev=[];var r=exec(S,type,a);
 if(r&&r.ok&&AUTO_AFTER[type])autoRun(S);
 if(r&&r.ok&&S.phase!=='setup'&&type!=='nop')finTrack(S);
 return r;
}
/* ---------- save slots: snapshot / restore / summary ---------- */
function summary(S){return{players:S.players.filter(function(p){return !p.out}).map(function(p){return{name:p.name,tok:p.tok}}),round:S.round||1,phase:S.phase,turn:(P(S,S.turn)||{}).name||''}}
function snapshot(S,name){var s=clone(S);s.ev=[];return{v:1,name:name||'',ts:Date.now(),sum:summary(S),state:s}}
function restore(o){if(!o||!o.state||o.state.v!==2||!o.state.players||!o.state.props)return null;var s=clone(o.state);s.ev=[];return normalize(s)}
/* ---------- game wrapper with undo ---------- */
var UNDOABLE={loan:1,repay:1,gift:1,sell:1,giveup:1,back:1,ok:1,no:1,pick:1,mortgage:1,redeem:1,build:1,sellBuilding:1,trade:1,free:1,use:1,sync:1};
var CLEAR={lucky:1,roll:1,reroll:1,go:1,flip:1,wroll:1,end:1,join:1,leave:1,bankrupt:1};
function createGame(S){
 var G={S:S,undo:[],
  act:function(type,a){
   var snap=UNDOABLE[type]?JSON.stringify(G.S):null;
   var r=act(G.S,type,a);
   if(r.ok){if(CLEAR[type])G.undo=[];else if(snap){G.undo.push(snap);if(G.undo.length>25)G.undo.shift()}}
   return r;
  },
  undoOne:function(){if(!G.undo.length)return false;var s=JSON.parse(G.undo.pop());s.ev=[];G.S=s;return true}
 };
 return G;
}
var API={loansOf:loansOf,loanOpen:loanOpen,loanOwe:loanOwe,backInfo:backInfo,busted:busted,ranking:ranking,endInfo:endInfo,peekNext:peekNext,finState:finState,finCfg:finCfg,exposure:exposure,finTrack:finTrack,finInit:finInit,luckyAvail:luckyAvail,FIN_NAME:FIN_NAME,normalize:normalize,rerollsLeft:rerollsLeft,canReroll:canReroll,netWorth:netWorth,standings:standings,liquid:liquid,buildSpent:buildSpent,summary:summary,snapshot:snapshot,restore:restore,TKN:TKN,setData:setData,setRng:setRng,newState:newState,startGame:startGame,act:act,createGame:createGame,deed:deed,fieldInfo:fieldInfo,setField:setField,confirmField:confirmField,resetField:resetField,flaggedCount:flaggedCount,
 rentFor:rentFor,groupOf:groupOf,groupMembers:groupMembers,ownedBy:ownedBy,totalAssets:totalAssets,invariant:invariant,active:active,P:P,card:card,canUse:canUse,upgradeOpts:upgradeOpts,
 forceOpts:forceOpts,DEF_CFG:DEF_CFG,CFG_DOC:CFG_DOC,FIELDS:FIELDS,LVN:LVN,clone:clone,prevCity:prevCity,get DATA(){return DATA},N:N,cur:cur};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.CTE=API;
})(typeof window!=='undefined'?window:globalThis);
