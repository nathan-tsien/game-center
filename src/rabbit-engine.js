/* ===== 兔子棋 Phase-1 engine (pure). window.RBE — 拔萝卜山 ===== */
(function(root){
'use strict';
var RCOLS=['#ff5fa8','#8e4fd0','#f5c518','#3a7bff'];
var RNAMES=['粉','紫','黄','蓝'];
var TKN=['小狗','小狮子','不不奥特曼','哎呀公主','温柔喷火龙','猪肉战神'];
var PADS=24; /* 0..22 path, 23 = summit */
var TRAPS=(typeof window!=="undefined"&&window.RB_TRAP_IDX&&window.RB_TRAP_IDX.length)?window.RB_TRAP_IDX.slice():[5,15,16,18,21];

function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function fullDeck(nPlayers){
 var d=[],i,c;
 for(c=0;c<nPlayers;c++){for(i=0;i<5;i++)d.push({t:'color',c:c})}
 for(i=0;i<6;i++)d.push({t:'step',n:1});
 for(i=0;i<4;i++)d.push({t:'step',n:2});
 for(i=0;i<2;i++)d.push({t:'step',n:3});
 for(i=0;i<4;i++)d.push({t:'carrot'});
 return shuffle(d);
}
function newState(){
 return{phase:'setup',players:[],turn:0,deck:[],disc:[],cur:null,trapsOpen:false,winner:null,hist:[],pending:null,sv:0};
}
function startGame(S,list){
 S.players=list.slice(0,4).map(function(p,i){
  return{id:i,tok:p.tok,name:p.name||TKN[p.tok],color:RCOLS[i],cname:RNAMES[i],
   rabbits:[{id:0,pos:-1}]};
 });
 S.deck=fullDeck(S.players.length);S.disc=[];S.cur=null;S.trapsOpen=false;
 S.phase='play';S.turn=0;S.winner=null;S.pending=null;S.hist=[];S.sv=Date.now();
 return{ok:true};
}
function cur(S){return S.players[S.turn]}
function draw(S){
 if(S.phase!=='play'||S.winner!=null)return{ok:false,err:'不能抽'};
 if(S.pending)return{ok:false,err:'先走完'};
 if(S.deck.length===0){S.deck=shuffle(S.disc);S.disc=[];}
 if(S.cur)S.disc.push(S.cur);
 var card=S.deck.pop();S.cur=card;
 var p=cur(S),ev=[];
 if(card.t==='carrot'){
  S.trapsOpen=true;
  var fell=[];
  S.players.forEach(function(pl){
   pl.rabbits.forEach(function(r){
    if(r.pos>=0&&TRAPS.indexOf(r.pos)>=0){
     r.pos=-1;fell.push({pid:pl.id,rid:r.id});ev.push({k:'fall',pid:pl.id,rid:r.id});
    }
   });
  });
  S.pending=null;
  S.hist.push({pid:p.id,card:card,fell:fell});
  S.turn=(S.turn+1)%S.players.length;
  S.trapsOpen=false;
  S.sv=Date.now();
  return{ok:true,card:card,auto:true,ev:ev,fell:fell};
 }
 var opts=[];
 if(card.t==='color'){
  if(card.c<S.players.length){
   S.players[card.c].rabbits.forEach(function(r){if(r.pos<PADS-1)opts.push({pid:card.c,rid:r.id})});
  }
 }else if(card.t==='step'){
  p.rabbits.forEach(function(r){if(r.pos<PADS-1)opts.push({pid:p.id,rid:r.id})});
 }
 if(!opts.length){
  S.hist.push({pid:p.id,card:card,skip:true});
  S.turn=(S.turn+1)%S.players.length;S.pending=null;S.sv=Date.now();
  return{ok:true,card:card,auto:true,skipped:true,ev:[]};
 }
 S.pending={card:card,opts:opts};
 S.sv=Date.now();
 return{ok:true,card:card,auto:false,opts:opts};
}
function move(S,pid,rid){
 if(!S.pending)return{ok:false,err:'先抽卡'};
 var ok=S.pending.opts.some(function(o){return o.pid===pid&&o.rid===rid});
 if(!ok)return{ok:false,err:'不能走这只'};
 var card=S.pending.card,pl=S.players[pid],r=pl.rabbits[rid];
 var steps=card.t==='step'?card.n:1;
 var from=r.pos,to;
 if(from<0)to=Math.min(PADS-1,steps-1);
 else to=Math.min(PADS-1,from+steps);
 r.pos=to;
 var ev=[{k:'move',pid:pid,rid:rid,from:from,to:to,steps:steps}];
 if(to===PADS-1){S.winner=pid;S.phase='over';ev.push({k:'win',pid:pid})}
 S.hist.push({pid:S.turn,card:card,moved:{pid:pid,rid:rid,from:from,to:to}});
 S.pending=null;
 if(S.phase!=='over')S.turn=(S.turn+1)%S.players.length;
 S.sv=Date.now();
 return{ok:true,ev:ev,to:to};
}
function snapshot(S){return JSON.parse(JSON.stringify(S))}
function restore(S,snap){Object.keys(snap).forEach(function(k){S[k]=snap[k]});return S}

var API={RCOLS:RCOLS,RNAMES:RNAMES,TKN:TKN,PADS:PADS,TRAPS:TRAPS,
 newState:newState,startGame:startGame,cur:cur,draw:draw,move:move,snapshot:snapshot,restore:restore,fullDeck:fullDeck};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
root.RBE=API;
})(typeof window!=='undefined'?window:globalThis);
