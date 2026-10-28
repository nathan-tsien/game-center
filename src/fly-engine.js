/* ===== 飞行棋 Phase-1b engine · 经典十字内拐L 15×15 · v13 一比一印刷复原(BS=3.50 gap≈2.1 hangar≈0.23) · 同色跳/虚线飞/叠吃/掷6再掷. window.FLYE ===== */
(function(root){
'use strict';
var COLORS=['#e0485e','#f2c200','#4a8fe0','#4cae4c'];
var CNAMES=['红','黄','蓝','绿'];
var TKN=['小狗','小狮子','不不奥特曼','哎呀公主','温柔喷火龙','猪肉战神'];
var TRACK=52, HOME=6, PLANES=4;
var ENTRY=[0,13,26,39];
var HOME_GATE=ENTRY.map(function(e){return (e+TRACK-1)%TRACK});
/* 虚线起飞垫：本色格，飞 +12 到对侧同色（经典横飞） */
var FLY_FROM=[20,33,46,7];
var FLY_TO=FLY_FROM.map(function(f){return (f+12)%TRACK});

/* ---- 经典 15×15 十字几何（红BL / 黄TL / 蓝TR / 绿BR） ---- */
function rot90(pts){return pts.map(function(p){return [14-p[1],p[0]]})}
function makeOmRing(){
 /* 十字内拐 L：每角 13 格，四角基地在 0..5 外侧，跑道贴基地内沿绕行 */
 var seg0=[],c,r;
 for(c=0;c<=5;c++)seg0.push([c,6]);
 seg0.push([6,6]);
 for(r=5;r>=0;r--)seg0.push([6,r]);
 /* → [0,6]..[5,6],[6,6],[6,5]..[6,0]；段间中点缺口留给 HOME */
 var seg1=rot90(seg0),seg2=rot90(seg1),seg3=rot90(seg2);
 return seg0.concat(seg1,seg2,seg3);
}
var _om=makeOmRing();
/* 平移：找 om 中 [6,14]（红起飞，底臂 HOME[7,14] 左侧）→ RING[0] */
var RING=[];
(function(){
 var off=0;
 for(var i=0;i<_om.length;i++){if(_om[i][0]===6&&_om[i][1]===14){off=i;break}}
 for(var j=0;j<52;j++)RING.push(_om[(j+off)%52]);
})();
/* 终点道 5 个可见圆（引擎 home idx 0..4，第 6 步 done） */
var HOME_CELLS=[
 [[7,14],[7,13],[7,12],[7,11],[7,10]],
 [[0,7],[1,7],[2,7],[3,7],[4,7]],
 [[7,0],[7,1],[7,2],[7,3],[7,4]],
 [[14,7],[13,7],[12,7],[11,7],[10,7]]
];
/* hangar inset（cells）— print/plastic 共用；机库圆坑相对 BASE_RECT 内缩 */
var HANGAR_INSET={l:0.18,t:0.18,r:0.18,b:0.18};
/* v13：一比一复原参考 hangarFrac≈0.22–0.24。BS=3.50 @ inset 0.40 → hangarFrac≈0.23，gap≈2.1（放起飞圆）
   覆盖 t142「填空白」的 BS=4.50；以用户参考图为准 */
var _BS=3.50, _IN=0.40, _FAR=15-_IN-_BS; /* _FAR=11.10 */
var BASE_RECT=[[_IN,_FAR,_BS,_BS],[_IN,_IN,_BS,_BS],[_FAR,_IN,_BS,_BS],[_FAR,_FAR,_BS,_BS]];
function baseSlotsFromRect(br){
 var x0=br[0]+HANGAR_INSET.l, y0=br[1]+HANGAR_INSET.t;
 var w=br[2]-HANGAR_INSET.l-HANGAR_INSET.r, h=br[3]-HANGAR_INSET.t-HANGAR_INSET.b;
 var xs=[x0+w*0.30-0.5, x0+w*0.70-0.5], ys=[y0+h*0.30-0.5, y0+h*0.70-0.5];
 return [[xs[0],ys[0]],[xs[1],ys[0]],[xs[0],ys[1]],[xs[1],ys[1]]];
}
var BASE_SLOTS=BASE_RECT.map(baseSlotsFromRect);
/* Phase A：格心落在 15×15 整数格，LANE_NUDGE=0（印刷棋无「撑开」） */
var LANE_NUDGE=0;
function gridPct(c,r){return{x:(c+0.5)/15*100,y:(r+0.5)/15*100}}
function ringNudge(c,r){
 var dc=0,dr=0,n=LANE_NUDGE;
 if(c===6)dc=-n; else if(c===8)dc=n;
 if(r===6)dr=-n; else if(r===8)dr=n;
 return[c+dc,r+dr];
}
function homeNudge(c,r){
 /* 向十字中轴微收，与两侧 RING 让出米色带 */
 var n=LANE_NUDGE*0.35;
 if(c===7){ /* 竖向回家道：保持 c，不横移 */ }
 else if(r===7){ /* 横向回家道 */ }
 /* 回家道已在中轴；微缩由 UI 格宽处理，坐标只做极小内收（朝中心） */
 var dc=0,dr=0;
 if(c===7){ if(r>7)dr=-n*0.15; else if(r<7)dr=n*0.15; }
 if(r===7){ if(c>7)dc=-n*0.15; else if(c<7)dc=n*0.15; }
 return[c+dc,r+dr];
}
/* 起飞实心圆：基地外缘与 ENTRY 之间，贴参考「基地旁大圆 + 箭头进跑道」 */
function takeoffCell(pid){
 var br=BASE_RECT[pid], ep=RING[ENTRY[pid]];
 var bx=br[0]+br[2]/2, by=br[1]+br[3]/2;
 var ex=ep[0]+0.5, ey=ep[1]+0.5;
 var dx=ex-bx, dy=ey-by;
 /* 与基地矩形求交 */
 var xL=br[0], yT=br[1], xR=br[0]+br[2], yB=br[1]+br[3];
 var ts=[], t;
 if(dx>1e-9){t=(xR-bx)/dx; if(t>0)ts.push(t)}
 if(dx<-1e-9){t=(xL-bx)/dx; if(t>0)ts.push(t)}
 if(dy>1e-9){t=(yB-by)/dy; if(t>0)ts.push(t)}
 if(dy<-1e-9){t=(yT-by)/dy; if(t>0)ts.push(t)}
 var tHit=Math.min.apply(null, ts.length?ts:[0.5]);
 /* 垫心：出基地后停在米色缺口中（约 tHit→ENTRY 的 28%；v13/v10a 缺口≈2.1） */
 var tPad=tHit + (1-tHit)*0.28;
 return [bx+dx*tPad-0.5, by+dy*tPad-0.5]; /* store as cell-ish so gridPct(s+0.5) works */
}
var TAKEOFF_CELLS=[0,1,2,3].map(takeoffCell);
function takeoffPos(pid){var s=TAKEOFF_CELLS[pid];return gridPct(s[0],s[1])}
function ringPos(i){var p=RING[((i%TRACK)+TRACK)%TRACK];var q=ringNudge(p[0],p[1]);return gridPct(q[0],q[1])}
function homePos(pid,idx){
 var cells=HOME_CELLS[pid];
 if(idx<0)idx=0;
 if(idx>=cells.length)return{x:50,y:50};
 var q=homeNudge(cells[idx][0],cells[idx][1]);
 return gridPct(q[0],q[1]);
}
function basePos(pid,k){var s=BASE_SLOTS[pid][k%4];return gridPct(s[0],s[1])}
function donePos(pid,k){
 /* finished planes display back in hangar slot (UI primary); keep API compat */
 return basePos(pid, k!=null?k:0);
}

function cellColor(i){return ((i%TRACK)+TRACK)%TRACK%4}
function isFlyPad(pid,idx){return FLY_FROM[pid]===idx}
function isSafe(idx){
 if(ENTRY.indexOf(idx)>=0)return true;
 if([4,17,30,43].indexOf(idx)>=0)return true;
 return false;
}
function nextSameColor(idx){return (idx+4)%TRACK}

function newState(){
 return{phase:'setup',players:[],turn:0,roll:null,pending:null,winner:null,hist:[],again:false,sixes:0,sv:0};
}
function seatOf(p){
 if(!p)return 0;
 var s=p.seat;
 if(s==null||s<0||s>3)s=p.id;
 return ((s%4)+4)%4;
}
function startGame(S,list){
 var used={};
 S.players=list.slice(0,4).map(function(p,i){
  var seat=p.seat;
  if(seat==null||seat<0||seat>3||used[seat]){
   seat=null;
   for(var s=0;s<4;s++)if(!used[s]){seat=s;break}
   if(seat==null)seat=i%4;
  }
  used[seat]=1;
  return{id:i,seat:seat,tok:p.tok,name:p.name||TKN[p.tok],color:COLORS[seat],cname:CNAMES[seat],
   planes:[0,1,2,3].map(function(k){return{id:k,where:'base',idx:0,lap:0}})};
 });
 S.phase='play';S.turn=0;S.roll=null;S.pending=null;S.winner=null;S.again=false;S.sixes=0;S.hist=[];S.sv=Date.now();
 return{ok:true};
}
function cur(S){return S.players[S.turn]}
function planesAt(S,where,idx,exceptPid,exceptPl){
 var out=[];
 S.players.forEach(function(p){
  p.planes.forEach(function(pl){
   if(exceptPid!=null&&p.id===exceptPid&&pl.id===exceptPl)return;
   if(pl.where===where&&pl.idx===idx)out.push({pid:p.id,pl:pl.id,color:p.color});
  });
 });
 return out;
}
function captureAt(S,pid,plId,where,idx,ev,sent){
 if(where!=='track'||isSafe(idx))return;
 planesAt(S,'track',idx,pid,plId).forEach(function(o){
  if(o.pid===pid)return;
  var op=S.players[o.pid].planes[o.pl];
  op.where='base';op.idx=0;op.lap=0;
  sent.push({pid:o.pid,pl:o.pl});
  ev.push({k:'capture',pid:pid,victim:o.pid,pl:o.pl,at:idx});
 });
}
function dashEatCells(from,to){
 var cells=[],c=nextSameColor(from);
 while(c!==to&&c!==from){
  cells.push(c);
  c=nextSameColor(c);
  if(cells.length>12)break;
 }
 cells.push(to);
 return cells;
}

function movable(S,v){
 var p=cur(S),seat=seatOf(p),out=[];
 p.planes.forEach(function(pl){
  if(pl.where==='done')return;
  if(pl.where==='base'){if(v===6)out.push(pl.id);return}
  if(pl.where==='home'){
   var dest=pl.idx+v;
   if(dest<=HOME)out.push(pl.id);
   return;
  }
  var idx=pl.idx,lap=pl.lap||0,ok=true;
  for(var s=0;s<v;s++){
   if(lap>=1&&idx===HOME_GATE[seat]){
    var rem=v-s-1;
    if(rem+1>HOME){ok=false}
    break;
   }
   idx=(idx+1)%TRACK;
   if(idx===ENTRY[seat])lap++;
  }
  if(ok)out.push(pl.id);
 });
 return out;
}
function pathFor(S,plId,v){
 var p=cur(S),seat=seatOf(p),pl=p.planes[plId],path=[];
 if(pl.where==='base'){path.push({where:'track',idx:ENTRY[seat],lap:0,kind:'takeoff'});return path}
 if(pl.where==='home'){
  for(var i=1;i<=v;i++){
   var d=pl.idx+i;
   if(d>HOME)break;
   path.push(d===HOME?{where:'done',idx:0,kind:'finish'}:{where:'home',idx:d,kind:'step'});
  }
  return path;
 }
 var idx=pl.idx,lap=pl.lap||0;
 for(var s=0;s<v;s++){
  if(lap>=1&&idx===HOME_GATE[seat]){
   var rem=v-s;
   for(var h=0;h<rem;h++){
    if(h+1>HOME)break;
    if(h+1===HOME)path.push({where:'done',idx:0,kind:'finish'});
    else path.push({where:'home',idx:h,kind:'step'});
   }
   return path;
  }
  idx=(idx+1)%TRACK;
  if(idx===ENTRY[seat])lap++;
  path.push({where:'track',idx:idx,lap:lap,kind:'step'});
 }
 return path;
}
function applyBonuses(S,p,pl,ev,sent,arrivedBy){
 /* 起飞落点不触发同色跳/横飞（经典规则） */
 if(arrivedBy==='takeoff')return;
 var seat=seatOf(p),guard=0;
 while(guard++<4){
  if(pl.where!=='track')return;
  if(isFlyPad(seat,pl.idx)&&(arrivedBy==='roll'||arrivedBy==='jump')){
   var from=pl.idx,to=FLY_TO[seat];
   var eat=dashEatCells(from,to);
   eat.forEach(function(ci){
    if(ci===to)return;
    captureAt(S,p.id,pl.id,'track',ci,ev,sent);
   });
   pl.idx=to;
   if(to===ENTRY[seat])pl.lap=(pl.lap||0)+1;
   ev.push({k:'fly',pid:p.id,pl:pl.id,from:from,to:to,seat:seat});
   captureAt(S,p.id,pl.id,'track',to,ev,sent);
   arrivedBy='fly';
   continue;
  }
  if(cellColor(pl.idx)===seat&&arrivedBy!=='jump'){
   var jfrom=pl.idx,jto=nextSameColor(pl.idx);
   pl.idx=jto;
   if(jto===ENTRY[seat])pl.lap=(pl.lap||0)+1;
   ev.push({k:'jump',pid:p.id,pl:pl.id,from:jfrom,to:jto,seat:seat});
   captureAt(S,p.id,pl.id,'track',jto,ev,sent);
   arrivedBy='jump';
   continue;
  }
  break;
 }
}
function sendOwnPlaneHome(S,pid){
 var p=S.players[pid],best=null,bestScore=-1;
 p.planes.forEach(function(pl){
  if(pl.where==='track'){
   var sc=100+(pl.lap||0)*TRACK+pl.idx;
   if(sc>bestScore){bestScore=sc;best=pl}
  }else if(pl.where==='home'){
   var sc2=50+pl.idx;
   if(sc2>bestScore){bestScore=sc2;best=pl}
  }
 });
 if(!best)return null;
 var was={where:best.where,idx:best.idx};
 best.where='base';best.idx=0;best.lap=0;
 return{pl:best.id,was:was};
}
function applyMove(S,plId){
 if(S.phase!=='play'||S.winner!=null||S.roll==null)return{ok:false,err:'还不能走'};
 var v=S.roll,p=cur(S),seat=seatOf(p),pl=p.planes[plId];
 if(!pl)return{ok:false,err:'没有这架飞机'};
 var mov=movable(S,v);
 if(mov.indexOf(plId)<0)return{ok:false,err:'这架不能走'};
 var ev=[],sent=[],path=pathFor(S,plId,v);
 var fromBase=pl.where==='base';
 if(fromBase){
  pl.where='track';pl.idx=ENTRY[seat];pl.lap=0;
  ev.push({k:'takeoff',pid:p.id,pl:plId,idx:ENTRY[seat],seat:seat});
 }else{
  path.forEach(function(step){
   pl.where=step.where;pl.idx=step.idx;
   if(step.lap!=null)pl.lap=step.lap;
  });
 }
 if(pl.where==='track')captureAt(S,p.id,plId,'track',pl.idx,ev,sent);
 if(pl.where==='track')applyBonuses(S,p,pl,ev,sent,fromBase?'takeoff':'roll');
 if(pl.where==='done')ev.push({k:'finish',pid:p.id,pl:plId});
 var allDone=p.planes.every(function(x){return x.where==='done'});
 if(allDone){S.winner=p.id;S.phase='over';ev.push({k:'win',pid:p.id})}
 S.hist.push({pid:p.id,pl:plId,v:v,path:path,sent:sent,ev:ev.slice()});
 var again=(v===6&&!allDone);
 S.roll=null;S.pending=null;
 if(!again&&!allDone){S.turn=(S.turn+1)%S.players.length;S.sixes=0;S.again=false}
 else if(again){
  S.again=true;S.sixes=(S.sixes||0)+1;
  if(S.sixes>=3){
   var bounced=sendOwnPlaneHome(S,p.id);
   if(bounced)ev.push({k:'triple6',pid:p.id,pl:bounced.pl,was:bounced.was});
   else ev.push({k:'triple6',pid:p.id});
   S.turn=(S.turn+1)%S.players.length;S.sixes=0;S.again=false;again=false;
  }
 }else{S.again=false;S.sixes=0}
 S.sv=Date.now();
 return{ok:true,ev:ev,path:path,again:again&&S.again,sent:sent};
}
function roll(S,forced){
 if(S.phase!=='play'||S.winner!=null)return{ok:false,err:'不能掷'};
 if(S.roll!=null)return{ok:false,err:'先走棋'};
 var v=forced!=null?forced:(1+Math.floor(Math.random()*6));
 S.roll=v;
 var mov=movable(S,v);
 S.pending={mov:mov,takeoff:v===6};
 if(!mov.length){
  var again=v===6;
  S.roll=null;S.pending=null;
  if(again){
   S.again=true;S.sixes=(S.sixes||0)+1;
   if(S.sixes>=3){
    var bounced=sendOwnPlaneHome(S,S.turn);
    S.turn=(S.turn+1)%S.players.length;S.sixes=0;S.again=false;
    return{ok:true,v:v,mov:[],passed:true,again:false,triple6:true,bounced:bounced};
   }
  }else{S.turn=(S.turn+1)%S.players.length;S.sixes=0;S.again=false}
  return{ok:true,v:v,mov:[],passed:true,again:again&&S.again};
 }
 return{ok:true,v:v,mov:mov,passed:false,takeoff:v===6};
}
function snapshot(S){return JSON.parse(JSON.stringify(S))}
function restore(S,snap){Object.keys(snap).forEach(function(k){S[k]=snap[k]});return S}

var API={COLORS:COLORS,CNAMES:CNAMES,TKN:TKN,TRACK:TRACK,HOME:HOME,ENTRY:ENTRY,HOME_GATE:HOME_GATE,PLANES:PLANES,
 FLY_FROM:FLY_FROM,FLY_TO:FLY_TO,RING:RING,HOME_CELLS:HOME_CELLS,BASE_SLOTS:BASE_SLOTS,BASE_RECT:BASE_RECT,HANGAR_INSET:HANGAR_INSET,LANE_NUDGE:LANE_NUDGE,TAKEOFF_CELLS:TAKEOFF_CELLS,baseSlotsFromRect:baseSlotsFromRect,ringNudge:ringNudge,homeNudge:homeNudge,takeoffCell:takeoffCell,
 gridPct:gridPct,ringPos:ringPos,homePos:homePos,basePos:basePos,donePos:donePos,takeoffPos:takeoffPos,
 cellColor:cellColor,isFlyPad:isFlyPad,nextSameColor:nextSameColor,seatOf:seatOf,
 newState:newState,startGame:startGame,cur:cur,movable:movable,pathFor:pathFor,applyMove:applyMove,roll:roll,
 planesAt:planesAt,isSafe:isSafe,snapshot:snapshot,restore:restore,dashEatCells:dashEatCells};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
root.FLYE=API;
})(typeof window!=='undefined'?window:globalThis);
