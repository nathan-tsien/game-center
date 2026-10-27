/* ===== 飞行棋 · 3D 卡通海岛棋盘（原创矢量）· 几何映射 + 静态美术 · window.FLY3D =====
   拓扑完全沿用 FLYE：RING52 / HOME5 / 横飞+12。每象限 13 格 = 端口 2 + 直道 4 + 内角 1 + 直道 4 + 端口 2，
   端口 5 格宽，中格为本色回家道起点（与引擎「跳过回家格」一致）。坐标系 1000×1000。 */
(function(root){
'use strict';
var E=root.FLYE;
var W=1000,C=500,T=78,P=56.4,D=140,PT=70,PH=63,OCT=122,TS=52,HS=54;
var HG_IN=34,HG_W=282;
var PAL=[
 {top:'#ff8e9c',base:'#ec4d61',side:'#b52c43',deep:'#861a2f',light:'#ffd5da',pit:'#d23e54'},
 {top:'#ffe37e',base:'#f7c21a',side:'#c78d00',deep:'#946400',light:'#fff4c6',pit:'#e0a90c'},
 {top:'#86c1ff',base:'#3f8ae6',side:'#2360bb',deep:'#17448c',light:'#d8e9ff',pit:'#3274cf'},
 {top:'#8de27b',base:'#46b246',side:'#2b8333',deep:'#1c6024',light:'#d8f6d1',pit:'#3a9c3c'}
];
var MOODS=['smile','wink','happy','laugh'];

function n(v){return Math.round(v*10)/10}
function rot(p){return[W-p[1],p[0]]}
function seg0(){
 var a=[[T,C-PT],[T,C-D]],k;
 for(k=1;k<=4;k++)a.push([T+P*k,C-D]);
 a.push([C-D,C-D]);
 for(k=1;k<=4;k++)a.push([C-D,C-D-P*k]);
 a.push([C-D,T],[C-PT,T]);
 return a;
}
/* 引擎 om 环（与 fly-engine makeOmRing 同序）→ 海岛坐标，按格子坐标匹配，避免硬编码偏移 */
var RXY=[],QK=[];
(function(){
 var gs=[],c,r,q,s,t,gom=[],iom=[],qk=[];
 for(c=0;c<=5;c++)gs.push([c,6]);
 gs.push([6,6]);
 for(r=5;r>=0;r--)gs.push([6,r]);
 s=gs;t=seg0();
 for(q=0;q<4;q++){
  gom=gom.concat(s);iom=iom.concat(t);
  for(c=0;c<13;c++)qk.push([q,c]);
  s=s.map(function(p){return[14-p[1],p[0]]});t=t.map(rot);
 }
 var key={};gom.forEach(function(p,j){key[p[0]+','+p[1]]=j});
 E.RING.forEach(function(p,i){
  var j=key[p[0]+','+p[1]];
  if(j==null){RXY.push([(p[0]+0.5)/15*W,(p[1]+0.5)/15*W]);QK.push([0,-1])}
  else{RXY.push(iom[j]);QK.push(qk[j])}
 });
})();
function homeDir(pid){
 var t=E.HOME_CELLS[pid][0];
 return[Math.sign(t[0]-7),Math.sign(t[1]-7)];
}
function homeXY(pid,h){
 var u=homeDir(pid),d=C-T-h*PH;
 return[C+u[0]*d,C+u[1]*d];
}
function hangarRect(pid){
 var br=E.BASE_RECT[pid],left=br[0]<7,top=br[1]<7;
 return{x:left?HG_IN:W-HG_IN-HG_W,y:top?HG_IN:W-HG_IN-HG_W,w:HG_W,h:HG_W,left:left,top:top};
}
function pitXY(pid,k){
 var h=hangarRect(pid);
 var xs=[h.x+h.w*0.29,h.x+h.w*0.71],ys=[h.y+h.h*0.56,h.y+h.h*0.835];
 return[xs[k%2],ys[(k>>1)%2]];
}
function pct(p){return{x:p[0]/10,y:p[1]/10}}
function ringPos(i){return pct(RXY[((i%E.TRACK)+E.TRACK)%E.TRACK])}
function homePos(pid,idx){
 if(idx<0)idx=0;
 if(idx>=E.HOME_CELLS[pid].length)return{x:50,y:50};
 return pct(homeXY(pid,idx));
}
function basePos(pid,k){return pct(pitXY(pid,k||0))}
function hangarPct(pid){var h=hangarRect(pid);return{x:h.x/10,y:h.y/10,w:h.w/10,h:h.h/10}}

/* ---------- 小工具 ---------- */
var seed=7;
function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
function rr(x,y,w,h,rx,a){return '<rect x="'+n(x)+'" y="'+n(y)+'" width="'+n(w)+'" height="'+n(h)+'" rx="'+n(rx)+'" '+(a||'')+'/>'}
function starPts(R,r){
 var a=[],i,ang,rad;
 for(i=0;i<10;i++){ang=-Math.PI/2+i*Math.PI/5;rad=i%2?r:R;a.push(n(Math.cos(ang)*rad)+','+n(Math.sin(ang)*rad))}
 return a.join(' ');
}
function star(x,y,R,fill,a){return '<polygon transform="translate('+n(x)+','+n(y)+')" points="'+starPts(R,R*0.47)+'" fill="'+fill+'" stroke="'+fill+'" stroke-width="'+n(R*0.22)+'" stroke-linejoin="round" '+(a||'')+'/>'}
var PLANE_D='M0-11C1.8-11 2.6-8 2.6-4.5L9 3.2V5.4L2.6 2.2V7.2L5.8 10V11.6L0 10.2-5.8 11.6V10L-2.6 7.2V2.2L-9 5.4V3.2L-2.6-4.5C-2.6-8-1.8-11 0-11Z';
function angTo(a,b){return Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI}

/* ---------- defs ---------- */
function defs(eco){
 var h='<defs>',i,p;
 h+='<linearGradient id="f3sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fd6f2"/><stop offset=".55" stop-color="#2fb3e6"/><stop offset="1" stop-color="#1c93d2"/></linearGradient>';
 h+='<radialGradient id="f3shal" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9ff0f4" stop-opacity=".95"/><stop offset=".7" stop-color="#7fe2ef" stop-opacity=".55"/><stop offset="1" stop-color="#5fd6f2" stop-opacity="0"/></radialGradient>';
 h+='<linearGradient id="f3tC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#f1e2c4"/></linearGradient>';
 h+='<linearGradient id="f3road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6c3"/><stop offset="1" stop-color="#e9d1a0"/></linearGradient>';
 h+='<linearGradient id="f3asph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3bcc6"/><stop offset="1" stop-color="#98a3af"/></linearGradient>';
 h+='<linearGradient id="f3gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a6"/><stop offset=".5" stop-color="#ffd23a"/><stop offset="1" stop-color="#f6a400"/></linearGradient>';
 h+='<linearGradient id="f3ring" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd76a"/><stop offset="1" stop-color="#e88a00"/></linearGradient>';
 h+='<radialGradient id="f3glow" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#fff6c0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>';
 h+='<linearGradient id="f3twr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e9eef4"/><stop offset="1" stop-color="#c7d1dc"/></linearGradient>';
 h+='<linearGradient id="f3glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfeaff"/><stop offset="1" stop-color="#3a9ad8"/></linearGradient>';
 h+='<radialGradient id="f3wh" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset=".75" stop-color="#f4f6f8"/><stop offset="1" stop-color="#d9dee5"/></radialGradient>';
 h+='<linearGradient id="f3grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd363"/><stop offset="1" stop-color="#4fae48"/></linearGradient>';
 for(i=0;i<4;i++){
  p=PAL[i];
  h+='<linearGradient id="f3t'+i+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+p.top+'"/><stop offset="1" stop-color="'+p.base+'"/></linearGradient>';
  h+='<radialGradient id="f3g'+i+'" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="'+p.top+'"/><stop offset=".7" stop-color="'+p.base+'"/><stop offset="1" stop-color="'+p.side+'"/></radialGradient>';
  h+='<linearGradient id="f3h'+i+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+p.top+'"/><stop offset=".55" stop-color="'+p.base+'"/><stop offset="1" stop-color="'+p.base+'"/></linearGradient>';
  h+='<radialGradient id="f3pit'+i+'" cx=".5" cy=".38" r=".62"><stop offset="0" stop-color="'+p.top+'" stop-opacity=".55"/><stop offset=".8" stop-color="'+p.pit+'"/><stop offset="1" stop-color="'+p.side+'"/></radialGradient>';
  h+='<linearGradient id="f3bd'+i+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+p.light+'"/><stop offset=".3" stop-color="'+p.top+'"/><stop offset=".7" stop-color="'+p.base+'"/><stop offset="1" stop-color="'+p.side+'"/></linearGradient>';
  h+='<linearGradient id="f3o'+i+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+p.top+'"/><stop offset="1" stop-color="'+p.base+'"/></linearGradient>';
 }
 if(!eco){
  h+='<filter id="f3blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>';
  h+='<filter id="f3blur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>';
 }
 h+='</defs>';
 return h;
}

/* ---------- 海面 / 小岛 / 气球 / 云 ---------- */
function waves(){
 var h='<g stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".55">',i,x,y,w;
 seed=11;
 for(i=0;i<70;i++){
  x=rnd()*W;y=rnd()*W;w=8+rnd()*10;
  h+='<path d="M'+n(x)+' '+n(y)+'q'+n(w/2)+' -'+n(w*0.45)+' '+n(w)+' 0"/>';
 }
 return h+'</g>';
}
function tree(x,y,r,palm){
 var h='<ellipse cx="'+n(x+r*0.25)+'" cy="'+n(y+r*0.85)+'" rx="'+n(r*0.95)+'" ry="'+n(r*0.38)+'" fill="#1f6b2e" opacity=".28"/>';
 if(palm){
  h+='<path d="M'+n(x)+' '+n(y+r)+'q'+n(r*0.15)+' -'+n(r*0.8)+' '+n(r*0.05)+' -'+n(r*1.5)+'" stroke="#a36a35" stroke-width="'+n(r*0.28)+'" fill="none" stroke-linecap="round"/>';
  var tx=x+r*0.05,ty=y-r*0.5,k,a;
  for(k=0;k<5;k++){a=-Math.PI/2+(k-2)*0.75;h+='<ellipse cx="'+n(tx+Math.cos(a)*r*0.6)+'" cy="'+n(ty+Math.sin(a)*r*0.45+r*0.2)+'" rx="'+n(r*0.62)+'" ry="'+n(r*0.24)+'" transform="rotate('+n(a*180/Math.PI)+' '+n(tx+Math.cos(a)*r*0.6)+' '+n(ty+Math.sin(a)*r*0.45+r*0.2)+')" fill="'+(k%2?'#3fae4a':'#2e9440')+'"/>'}
  return h;
 }
 h+='<rect x="'+n(x-r*0.12)+'" y="'+n(y+r*0.3)+'" width="'+n(r*0.24)+'" height="'+n(r*0.6)+'" rx="'+n(r*0.1)+'" fill="#9a6433"/>';
 h+='<circle cx="'+n(x)+'" cy="'+n(y)+'" r="'+n(r)+'" fill="#2f9a46"/>';
 h+='<circle cx="'+n(x-r*0.25)+'" cy="'+n(y-r*0.3)+'" r="'+n(r*0.62)+'" fill="#4fc35a"/>';
 h+='<circle cx="'+n(x-r*0.35)+'" cy="'+n(y-r*0.42)+'" r="'+n(r*0.25)+'" fill="#8fe27a" opacity=".8"/>';
 return h;
}
function island(cx,cy,rx,ry,s,eco){
 seed=s;
 var h='<ellipse cx="'+n(cx)+'" cy="'+n(cy)+'" rx="'+n(rx+16)+'" ry="'+n(ry+16)+'" fill="url(#f3shal)"/>';
 h+='<ellipse cx="'+n(cx)+'" cy="'+n(cy+4)+'" rx="'+n(rx)+'" ry="'+n(ry)+'" fill="#d9b978"/>';
 h+='<ellipse cx="'+n(cx)+'" cy="'+n(cy)+'" rx="'+n(rx)+'" ry="'+n(ry)+'" fill="#f6dfa6"/>';
 h+='<ellipse cx="'+n(cx-rx*0.04)+'" cy="'+n(cy-ry*0.06)+'" rx="'+n(rx*0.8)+'" ry="'+n(ry*0.8)+'" fill="url(#f3grass)"/>';
 var k,m=Math.max(3,Math.round((rx*ry)/520)),tx,ty,tr;
 for(k=0;k<m;k++){
  tx=cx+(rnd()-0.5)*rx*1.1;ty=cy+(rnd()-0.5)*ry*1.1;tr=8+rnd()*6;
  h+=tree(tx,ty,tr,rnd()<0.3);
 }
 return h;
}
function balloon(x,y,s,c1,c2){
 var h='<g transform="translate('+n(x)+','+n(y)+') scale('+s+')">';
 h+='<ellipse cx="6" cy="62" rx="12" ry="4" fill="#0b4f7a" opacity=".18"/>';
 h+='<path d="M-6 30L-5 40M6 30L5 40" stroke="#7a5a3a" stroke-width="1.4"/>';
 h+=rr(-6,39,12,9,2,'fill="#b9793e" stroke="#8a5528" stroke-width="1.2"');
 h+='<path d="M0-30C-20-30-24-10-20 4C-16 18-8 26-6 30H6C8 26 16 18 20 4C24-10 20-30 0-30Z" fill="'+c1+'"/>';
 h+='<path d="M0-30C-8-30-10-10-8 4C-6 18-3 26-2 30H2C3 26 6 18 8 4C10-10 8-30 0-30Z" fill="'+c2+'"/>';
 h+='<path d="M-20 4C-16 18-8 26-6 30H6C8 26 16 18 20 4" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="3"/>';
 h+='<ellipse cx="-9" cy="-14" rx="4" ry="9" fill="#fff" opacity=".45"/>';
 return h+'</g>';
}
function cloud(x,y,s){
 var h='<g transform="translate('+n(x)+','+n(y)+') scale('+s+')" opacity=".96">';
 h+='<ellipse cx="0" cy="14" rx="58" ry="12" fill="#bfe3f5" opacity=".6"/>';
 h+='<circle cx="-30" cy="4" r="20" fill="#fff"/><circle cx="-4" cy="-8" r="28" fill="#fff"/><circle cx="26" cy="0" r="22" fill="#fff"/><circle cx="46" cy="10" r="14" fill="#fff"/>';
 h+='<ellipse cx="0" cy="12" rx="56" ry="11" fill="#fff"/>';
 h+='<ellipse cx="-10" cy="-18" rx="14" ry="6" fill="#fff" opacity=".9"/>';
 return h+'</g>';
}

/* ---------- 中央跑道区 / 圆角凸起格 ---------- */
function asphalt(){
 var h=rr(332,332,336,336,40,'fill="url(#f3asph)"');
 h+=rr(332,332,336,336,40,'fill="none" stroke="#7f8a96" stroke-width="3" opacity=".5"');
 var i,a,cx,cy,d;
 h+='<g stroke="#fff" stroke-width="4" stroke-dasharray="14 12" stroke-linecap="round" opacity=".85" fill="none">';
 for(i=0;i<4;i++){
  a=(45+i*90)*Math.PI/180;
  h+='<path d="M'+n(C+Math.cos(a)*138)+' '+n(C+Math.sin(a)*138)+'L'+n(C+Math.cos(a)*200)+' '+n(C+Math.sin(a)*200)+'"/>';
 }
 h+='</g>';
 /* 斜角金色小箭头（指向中心） */
 for(i=0;i<4;i++){
  a=(45+i*90)*Math.PI/180;d=150;cx=C+Math.cos(a)*d;cy=C+Math.sin(a)*d;
  h+='<g transform="translate('+n(cx)+','+n(cy)+') rotate('+n(i*90+45+180)+')">';
  h+='<path d="M0-13L13 0L0 13L-13 0Z" fill="#f7e9c8" stroke="#d9b56e" stroke-width="2"/>';
  h+='<path d="M-5-5L3 0L-5 5" fill="none" stroke="#e89a10" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
  h+='</g>';
 }
 return h;
}
function roadPath(){
 var pts=[],q,k,i,om=[];
 var t=seg0(),tips=[[C,T],[W-T,C],[C,W-T],[T,C]];
 var tipBefore=[[T,C],[C,T],[W-T,C],[C,W-T]];
 for(q=0;q<4;q++){
  pts.push(tipBefore[q]);
  for(k=0;k<13;k++)pts.push(t[k]);
  t=t.map(rot);
 }
 var d='M'+n(pts[0][0])+' '+n(pts[0][1]);
 for(i=1;i<pts.length;i++)d+='L'+n(pts[i][0])+' '+n(pts[i][1]);
 return d+'Z';
}
function raised(shape,top,side,dz,gloss){
 /* shape(fill,extra) → 同一形状；先画侧面（下移 dz），再画顶面 */
 var h='<g transform="translate(0,'+n(dz)+')">'+shape(side,'')+'</g>'+shape(top,'');
 if(gloss)h+=gloss;
 return h;
}
function tile(x,y,s,top,side,edge,diamond,glossOp){
 var hw=s/2,dz=s*0.15,rx=s*0.24;
 var sh=function(fill){
  if(diamond)return '<rect x="'+n(-hw*0.86)+'" y="'+n(-hw*0.86)+'" width="'+n(s*0.86)+'" height="'+n(s*0.86)+'" rx="'+n(rx*0.8)+'" transform="rotate(45)" fill="'+fill+'"/>';
  return rr(-hw,-hw,s,s,rx,'fill="'+fill+'"');
 };
 var h='<g transform="translate('+n(x)+','+n(y)+')">';
 h+='<g transform="translate(0,'+n(dz+1.5)+')" opacity=".35">'+sh(edge)+'</g>';
 h+='<g transform="translate(0,'+n(dz)+')">'+sh(side)+'</g>';
 h+=sh(top);
 if(diamond)h+='<rect x="'+n(-hw*0.52)+'" y="'+n(-hw*0.86)+'" width="'+n(s*0.52)+'" height="'+n(s*0.3)+'" rx="'+n(rx*0.5)+'" fill="#fff" opacity="'+glossOp+'"/>';
 else h+=rr(-hw+4,-hw+3,s-8,s*0.36,rx*0.7,'fill="#fff" opacity="'+glossOp+'"');
 return h+'</g>';
}
function creamTile(x,y,s,diamond){return tile(x,y,s,'url(#f3tC)','#d3b98a','#8a6a3a',diamond,.6)}
function colorTile(x,y,s,c,diamond){return tile(x,y,s,'url(#f3t'+c+')',PAL[c].side,PAL[c].deep,diamond,.3)}
function gem(x,y,c,r){
 r=r||9.5;
 return '<circle cx="'+n(x)+'" cy="'+n(y+1.5)+'" r="'+n(r+1.2)+'" fill="'+PAL[c].deep+'" opacity=".25"/>'+
  '<circle cx="'+n(x)+'" cy="'+n(y)+'" r="'+n(r)+'" fill="url(#f3g'+c+')"/>'+
  '<circle cx="'+n(x-r*0.32)+'" cy="'+n(y-r*0.36)+'" r="'+n(r*0.28)+'" fill="#fff" opacity=".85"/>';
}
function whiteDot(x,y,r){
 return '<circle cx="'+n(x)+'" cy="'+n(y+1.2)+'" r="'+n(r+1)+'" fill="#000" opacity=".14"/><circle cx="'+n(x)+'" cy="'+n(y)+'" r="'+n(r)+'" fill="url(#f3wh)"/>';
}
function iconPlane(x,y,ang,sc,fill){
 return '<g transform="translate('+n(x)+','+n(y)+') rotate('+n(ang+90)+') scale('+sc+')"><path d="'+PLANE_D+'" fill="#000" opacity=".16" transform="translate(0.6,1.2)"/><path d="'+PLANE_D+'" fill="'+(fill||'#fff')+'"/></g>';
}
function iconStar(x,y,R,fill){return star(x,y+1.4,R,'#000','opacity=".14"')+star(x,y,R,fill||'#fff')}
function iconChev(x,y,ang,col){
 return '<g transform="translate('+n(x)+','+n(y)+') rotate('+n(ang)+')"><path d="M-9-8L-1 0L-9 8M1-8L9 0L1 8" fill="none" stroke="'+col+'" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></g>';
}

/* ---------- 机库 / 吉祥物 / 塔台 ---------- */
function mascot(c,mood){
 var p=PAL[c],h='';
 h+='<ellipse cx="0" cy="62" rx="80" ry="9" fill="#000" opacity=".18"/>';
 h+='<path d="M-8 30L-10 50M50 28L52 46" stroke="#6a7480" stroke-width="5" stroke-linecap="round"/>';
 h+='<circle cx="-10" cy="52" r="9" fill="#2d2f3a"/><circle cx="-10" cy="52" r="3.6" fill="#c9d1da"/>';
 h+='<circle cx="52" cy="48" r="8.5" fill="#2d2f3a"/><circle cx="52" cy="48" r="3.4" fill="#c9d1da"/>';
 h+='<path d="M-6-16C4-34 16-52 30-62C40-68 52-64 47-53L24-12Z" fill="'+p.side+'"/>';
 h+='<path d="M-60-6C-68-28-78-48-86-60C-90-67-83-72-76-67C-60-56-44-36-34-14Z" fill="url(#f3bd'+c+')" stroke="'+p.side+'" stroke-width="2.4" stroke-linejoin="round"/>';
 h+=star(-68,-36,7.5,'#fff');
 h+='<ellipse cx="-80" cy="5" rx="22" ry="9" fill="'+p.side+'"/>';
 h+='<path d="M-92 6C-92-12-54-33 0-35C54-37 100-21 100 8C100 37 64 51 12 49C-44 47-92 26-92 6Z" fill="url(#f3bd'+c+')" stroke="'+p.deep+'" stroke-opacity=".35" stroke-width="2.2"/>';
 h+='<path d="M-86 14C-46 30 40 36 97 16C92 35 66 47 14 47C-38 46-76 32-86 14Z" fill="#fff" opacity=".94"/>';
 h+='<path d="M-64-6C-34-14 4-17 30-15" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".9"/>';
 h+='<ellipse cx="-4" cy="-25" rx="46" ry="6" fill="#fff" opacity=".55"/>';
 h+='<path d="M-14 12C-26 30-40 50-50 61C-56 68-47 74-37 69C-14 59 12 38 28 19Z" fill="url(#f3bd'+c+')" stroke="'+p.deep+'" stroke-opacity=".45" stroke-width="2.2" stroke-linejoin="round"/>';
 h+=star(-26,46,8,'#fff');
 /* face */
 var ex1=58,ex2=82,ey=-6;
 function eye(x,y){return '<ellipse cx="'+x+'" cy="'+y+'" rx="10.5" ry="13" fill="#fff" stroke="#2b2140" stroke-opacity=".25" stroke-width="1.5"/><circle cx="'+(x+2)+'" cy="'+(y+2)+'" r="6.6" fill="#2b2140"/><circle cx="'+(x+2.6)+'" cy="'+(y+2.6)+'" r="3.2" fill="#4a3a7a"/><circle cx="'+(x-0.4)+'" cy="'+(y-1.6)+'" r="2.5" fill="#fff"/>'}
 function shut(x,y){return '<path d="M'+(x-9)+' '+(y+2)+'Q'+x+' '+(y-9)+' '+(x+9)+' '+(y+2)+'" fill="none" stroke="#2b2140" stroke-width="3.6" stroke-linecap="round"/>'}
 if(mood==='laugh'){h+=shut(ex1,ey)+shut(ex2,ey-2)}
 else if(mood==='wink'){h+=eye(ex1,ey)+shut(ex2,ey-2)}
 else{h+=eye(ex1,ey)+eye(ex2,ey-2)}
 h+='<ellipse cx="46" cy="16" rx="7.5" ry="4.5" fill="#ff7f98" opacity=".55"/><ellipse cx="93" cy="12" rx="5.5" ry="4" fill="#ff7f98" opacity=".55"/>';
 if(mood==='smile')h+='<path d="M60 18Q71 29 84 16" fill="none" stroke="#2b2140" stroke-width="3.4" stroke-linecap="round"/>';
 else h+='<path d="M59 16Q71 34 86 14Z" fill="#7a2338" stroke="#2b2140" stroke-width="2.6" stroke-linejoin="round"/><path d="M65 24Q72 30 79 23" fill="#ff8aa0"/>';
 return h;
}
function tower(x,y,c,s,flip){
 var p=PAL[c],h='<g transform="translate('+n(x)+','+n(y)+') scale('+(flip?-s:s)+','+s+')">';
 h+='<ellipse cx="4" cy="2" rx="40" ry="9" fill="#000" opacity=".18"/>';
 h+=rr(-30,-36,60,36,6,'fill="#f3f6fa" stroke="#b8c4d2" stroke-width="2"');
 h+=rr(-30,-27,60,7,0,'fill="'+p.base+'"');
 h+=rr(-7,-18,14,18,3,'fill="#5f86b4"');
 h+=rr(-11,-94,22,60,4,'fill="url(#f3twr)" stroke="#b8c4d2" stroke-width="1.6"');
 h+=rr(-13,-72,26,6,2,'fill="'+p.base+'"');
 h+='<path d="M-30-94H30L24-120H-24Z" fill="#eef4fa" stroke="#b8c4d2" stroke-width="2"/>';
 h+='<path d="M-25-98H25L20-116H-20Z" fill="url(#f3glass)"/>';
 h+='<path d="M-8-98L-7-116M8-98L7-116" stroke="#e9f4ff" stroke-width="2.4"/>';
 h+='<path d="M-27-120H27Q20-136 0-138Q-20-136-27-120Z" fill="'+p.base+'" stroke="'+p.side+'" stroke-width="2"/>';
 h+='<ellipse cx="-8" cy="-128" rx="8" ry="3" fill="#fff" opacity=".5"/>';
 h+='<path d="M0-138V-154" stroke="#7b8794" stroke-width="2.6"/><circle cx="0" cy="-156" r="3.6" fill="#ff4d4d"/>';
 return h+'</g>';
}
function windsock(x,y,s,flip){
 var h='<g transform="translate('+n(x)+','+n(y)+') scale('+(flip?-s:s)+','+s+')">';
 h+='<path d="M0 0V-58" stroke="#7b8794" stroke-width="3" stroke-linecap="round"/>';
 h+='<path d="M0-56L30-52L30-42L0-38Z" fill="#fff"/>';
 h+='<path d="M0-56L10-54.7V-39.3L0-38ZM20-53.3L30-52V-42L20-40.7Z" fill="#ff4d5e"/>';
 return h+'</g>';
}
function hangar(pid,eco){
 var hr=hangarRect(pid),p=PAL[pid],x=hr.x,y=hr.y,w=hr.w,hh=hr.h,h='',k;
 /* 草地小岛底座 + 树 */
 var gx=hr.left?x-26:x-8,gy=hr.top?y-26:y-8,gw=w+34,gh=hh+34;
 h+=rr(gx-6,gy-6,gw+12,gh+12,64,'fill="url(#f3shal)"');
 h+=rr(gx,gy+6,gw,gh,56,'fill="#d4b06a"');
 h+=rr(gx,gy,gw,gh,56,'fill="#f4dca2"');
 h+=rr(gx+8,gy+6,gw-16,gh-16,48,'fill="url(#f3grass)"');
 seed=31+pid*17;
 var ox=hr.left?x-8:x+w+8,oy=hr.top?y-8:y+hh+8;
 for(k=0;k<6;k++){h+=tree(x+24+k*(w-48)/5+(rnd()-0.5)*10,oy+(rnd()-0.5)*6,11+rnd()*4,false)}
 for(k=0;k<6;k++){h+=tree(ox+(rnd()-0.5)*6,y+24+k*(hh-48)/5+(rnd()-0.5)*10,11+rnd()*4,false)}
 /* 托盘边 + 机库平台 */
 if(!eco)h+=rr(x+4,y+16,w,hh,30,'fill="#06324f" opacity=".35" filter="url(#f3blur)"');
 h+=rr(x-7,y+4,w+14,hh+14,34,'fill="#b9935c"');
 h+=rr(x-7,y-7,w+14,hh+14,34,'fill="url(#f3road)"');
 h+=rr(x,y+10,w,hh,28,'fill="'+p.side+'"');
 h+=rr(x,y,w,hh,28,'fill="url(#f3h'+pid+')"');
 h+=rr(x+5,y+4,w-10,hh-10,24,'fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3"');
 /* 停机坪（浅色方区）+ 跑道标线 */
 var ax=x+w*0.08,ay=y+hh*0.40,aw=w*0.84,ah=hh*0.555;
 h+=rr(ax,ay,aw,ah,18,'fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"');
 h+='<path d="M'+n(ax+aw/2)+' '+n(ay+8)+'V'+n(ay+ah-8)+'M'+n(ax+8)+' '+n(ay+ah/2)+'H'+n(ax+aw-8)+'" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-dasharray="8 8"/>';
 var sx=hr.left?x+w-16:x+16;
 h+='<path d="M'+n(sx)+' '+n(y+24)+'V'+n(y+hh*0.36)+'" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="round"/>';
 var mx=hr.left?x+10:x+w-10;
 for(k=0;k<3;k++)h+=rr(mx-(hr.left?0:14),y+hh*0.46+k*22,14,9,2,'fill="#fff" opacity=".55"');
 /* 4 个停机位 */
 for(k=0;k<4;k++){
  var pp=pitXY(pid,k),r=36;
  h+='<circle cx="'+n(pp[0])+'" cy="'+n(pp[1])+'" r="'+r+'" fill="url(#f3pit'+pid+')"/>';
  h+='<circle cx="'+n(pp[0])+'" cy="'+n(pp[1])+'" r="'+(r-1.5)+'" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="3"/>';
  h+='<path d="M'+n(pp[0]-r+2)+' '+n(pp[1])+'A'+(r-2)+' '+(r-2)+' 0 0 1 '+n(pp[0]+r-2)+' '+n(pp[1])+'" fill="none" stroke="'+p.deep+'" stroke-opacity=".28" stroke-width="5"/>';
 }
 /* 塔台 + 风向袋 + 吉祥物 */
 var tx=hr.left?x+38:x+w-38;
 h+=tower(tx,y+hh*0.34,pid,0.62,!hr.left);
 h+=windsock(hr.left?x+78:x+w-78,y+hh*0.18,0.7,!hr.left);
 var mcx=hr.left?x+w*0.6:x+w*0.4;
 h+='<g transform="translate('+n(mcx)+','+n(y+hh*0.2)+') scale('+(hr.left?0.78:-0.78)+',0.78)">'+mascot(pid,MOODS[pid])+'</g>';
 return h;
}

/* ---------- 中央八角 + 金星 ---------- */
function center(eco){
 var h='',i,u,a,vs,pts,pid;
 var Rv=OCT/Math.cos(Math.PI/8);
 function P(ang,r){return[C+Math.cos(ang*Math.PI/180)*r,C+Math.sin(ang*Math.PI/180)*r]}
 var oct=[];for(i=0;i<8;i++)oct.push(P(22.5+45*i,Rv+12));
 var octS=oct.map(function(p){return n(p[0])+','+n(p[1])}).join(' ');
 if(!eco)h+='<polygon points="'+octS+'" transform="translate(4,16)" fill="#06324f" opacity=".3" filter="url(#f3blur)"/>';
 h+='<polygon points="'+octS+'" transform="translate(0,10)" fill="#b9935c"/>';
 h+='<polygon points="'+octS+'" fill="url(#f3road)"/>';
 for(pid=0;pid<4;pid++){
  u=homeDir(pid);a=Math.atan2(u[1],u[0])*180/Math.PI;
  pts=[[C,C],P(a-45,OCT),P(a-22.5,Rv),P(a+22.5,Rv),P(a+45,OCT)];
  vs=pts.map(function(p){return n(p[0])+','+n(p[1])}).join(' ');
  h+='<polygon points="'+vs+'" transform="translate(0,8)" fill="'+PAL[pid].side+'"/>';
 }
 for(pid=0;pid<4;pid++){
  u=homeDir(pid);a=Math.atan2(u[1],u[0])*180/Math.PI;
  pts=[[C,C],P(a-45,OCT),P(a-22.5,Rv),P(a+22.5,Rv),P(a+45,OCT)];
  vs=pts.map(function(p){return n(p[0])+','+n(p[1])}).join(' ');
  h+='<polygon points="'+vs+'" fill="url(#f3o'+pid+')" stroke="#fff6e2" stroke-width="4" stroke-linejoin="round"/>';
  var pc=P(a,OCT*0.68);
  h+=iconPlane(pc[0],pc[1],a+180,2.1,'#fff');
 }
 h+='<polygon points="'+oct.map(function(p){var q=[C+(p[0]-C)*0.93,C+(p[1]-C)*0.93];return n(q[0])+','+n(q[1])}).join(' ')+'" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/>';
 /* 金色奖章 + 立体星 */
 h+='<circle cx="'+C+'" cy="'+C+'" r="74" fill="url(#f3glow)"/>';
 h+='<circle cx="'+C+'" cy="'+(C+6)+'" r="52" fill="#c26e00"/>';
 h+='<circle cx="'+C+'" cy="'+C+'" r="52" fill="url(#f3ring)"/>';
 h+='<circle cx="'+C+'" cy="'+C+'" r="43" fill="#fff1c2" stroke="#f0a020" stroke-width="2.5"/>';
 h+='<circle cx="'+C+'" cy="'+C+'" r="37" fill="#ffe28a" opacity=".6"/>';
 h+='<polygon transform="translate('+C+','+(C+5)+')" points="'+starPts(38,18)+'" fill="#d07a00" stroke="#d07a00" stroke-width="7" stroke-linejoin="round"/>';
 h+='<polygon transform="translate('+C+','+C+')" points="'+starPts(38,18)+'" fill="url(#f3gold)" stroke="#f29a00" stroke-width="7" stroke-linejoin="round"/>';
 h+='<polygon transform="translate('+(C-2)+','+(C-6)+') scale(.55)" points="'+starPts(38,18)+'" fill="#fff" opacity=".35"/>';
 return h;
}

/* ---------- 跑道格 + 回家道 ---------- */
function ringTiles(){
 var h='',i,p,c,ent,safe,fly,flyTo,gate,q;
 for(i=0;i<E.TRACK;i++){
  p=RXY[i];c=E.cellColor(i);
  ent=E.ENTRY.indexOf(i);fly=E.FLY_FROM.indexOf(i);flyTo=E.FLY_TO.indexOf(i);gate=E.HOME_GATE.indexOf(i);
  safe=E.isSafe(i);
  var diamond=QK[i][1]===6;
  var s=diamond?TS+2:TS;
  if(ent>=0){
   h+=colorTile(p[0],p[1],s,c,diamond)+iconStar(p[0],p[1]-1,15,'#fff');
  }else if(fly>=0){
   var to=RXY[E.FLY_TO[fly]];
   h+=colorTile(p[0],p[1],s,c,diamond)+iconPlane(p[0],p[1]-1,angTo(p,to),1.55,'#fff');
  }else if(safe){
   h+=colorTile(p[0],p[1],s,c,diamond)+iconStar(p[0],p[1]-1,13,'#fff');
  }else{
   h+=creamTile(p[0],p[1],s,diamond);
   if(flyTo>=0)h+='<circle cx="'+n(p[0])+'" cy="'+n(p[1]-1)+'" r="15" fill="none" stroke="'+PAL[c].base+'" stroke-width="3" stroke-dasharray="4 4"/>';
   h+=gem(p[0],p[1]-1,c);
  }
 }
 return h;
}
function homeStrips(){
 var h='',pid,u,a,x0,y0,x1,y1,hw=34;
 for(pid=0;pid<4;pid++){
  u=homeDir(pid);
  var s=homeXY(pid,0),e=[C+u[0]*(OCT-6),C+u[1]*(OCT-6)];
  x0=Math.min(s[0],e[0])-(u[0]?HS/2+6:hw);x1=Math.max(s[0],e[0])+(u[0]?HS/2+6:hw);
  y0=Math.min(s[1],e[1])-(u[1]?HS/2+6:hw);y1=Math.max(s[1],e[1])+(u[1]?HS/2+6:hw);
  if(u[0]<0)x1=C-OCT+8;if(u[0]>0)x0=C+OCT-8;if(u[1]<0)y1=C-OCT+8;if(u[1]>0)y0=C+OCT-8;
  h+=rr(x0,y0+10,x1-x0,y1-y0,20,'fill="'+PAL[pid].deep+'"');
  h+=rr(x0,y0,x1-x0,y1-y0,20,'fill="'+PAL[pid].side+'"');
  h+=rr(x0+4,y0+4,x1-x0-8,y1-y0-8,16,'fill="'+PAL[pid].base+'" opacity=".55"');
 }
 return h;
}
function homeTiles(){
 var h='',pid,k,p,u,a;
 for(pid=0;pid<4;pid++){
  u=homeDir(pid);a=Math.atan2(-u[1],-u[0])*180/Math.PI;
  for(k=0;k<E.HOME_CELLS[pid].length;k++){
   p=homeXY(pid,k);
   if(k===1){h+=tile(p[0],p[1],HS,'url(#f3tC)','#d3b98a','#8a6a3a',false,.6)+iconChev(p[0],p[1]-1,a,PAL[pid].base);continue}
   h+=colorTile(p[0],p[1],HS,pid,false);
   if(k===0)h+=iconPlane(p[0],p[1]-1,a,1.7,'#fff');
   else if(k===E.HOME_CELLS[pid].length-1)h+=whiteDot(p[0],p[1]-1,12)+'<circle cx="'+n(p[0])+'" cy="'+n(p[1]-1)+'" r="5.5" fill="'+PAL[pid].base+'"/>';
   else h+=whiteDot(p[0],p[1]-1,11);
  }
 }
 return h;
}

/* ---------- 横飞航线（覆盖层，位于格子之上、棋子之下） ---------- */
function flyOverlay(){
 var h='<svg class="fldash-layer fl3d-dash" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">',fi;
 for(fi=0;fi<4;fi++){
  var a=RXY[E.FLY_FROM[fi]],b=RXY[E.FLY_TO[fi]];
  var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.sqrt(dx*dx+dy*dy)||1;
  var nx=-dy/len,ny=dx/len;
  if((mx-C)*nx+(my-C)*ny<0){nx=-nx;ny=-ny}
  var bow=len*0.22,cx=mx+nx*bow,cy=my+ny*bow;
  var t0=0.16,t1=0.86;
  function qp(t){var u=1-t;return[u*u*a[0]+2*u*t*cx+t*t*b[0],u*u*a[1]+2*u*t*cy+t*t*b[1]]}
  var p0=qp(t0),p1=qp(t1),pm=qp(0.5),c2=[(cx*(1)+0)];
  var d='M'+n(p0[0])+' '+n(p0[1])+'Q'+n(cx)+' '+n(cy)+' '+n(p1[0])+' '+n(p1[1]);
  var pm2=qp(0.52),ang=Math.atan2(pm2[1]-pm[1],pm2[0]-pm[0])*180/Math.PI;
  h+='<g class="fldash-path" id="fldash'+fi+'" data-fly="'+fi+'">';
  h+='<path d="'+d+'" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".75"/>';
  h+='<path class="fldash-stroke" d="'+d+'" fill="none" stroke="'+PAL[fi].base+'" stroke-width="4.5" stroke-dasharray="2 10" stroke-linecap="round"/>';
  h+='<g transform="translate('+n(pm[0])+','+n(pm[1])+') rotate('+n(ang+90)+')"><circle r="14" fill="#fff" stroke="'+PAL[fi].base+'" stroke-width="3"/><g transform="scale(1.1)"><path d="'+PLANE_D+'" fill="'+PAL[fi].base+'"/></g></g>';
  h+='</g>';
 }
 return h+'</svg>';
}

/* ---------- 棋子：俯视光滑玩具飞机 ---------- */
function tokenDefs(){
 var h='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>',i,p;
 for(i=0;i<4;i++){
  p=PAL[i];
  h+='<linearGradient id="f3k'+i+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+p.light+'"/><stop offset=".35" stop-color="'+p.top+'"/><stop offset=".75" stop-color="'+p.base+'"/><stop offset="1" stop-color="'+p.side+'"/></linearGradient>';
  var body='<path d="M-46-2C-46-9-40-12-33-12H-12V-34C-12-44-6-50 0-50C6-50 12-44 12-34V-12H33C40-12 46-9 46-2V6C46 12 41 14 35 13L12 9V26H24C30 26 32 30 32 34V38C32 42 29 44 24 44H-24C-29 44-32 42-32 38V34C-32 30-30 26-24 26H-12V9L-35 13C-41 14-46 12-46 6Z"';
  h+='<symbol id="f3tok'+i+'" viewBox="-56 -60 112 120">';
  h+='<ellipse cx="2" cy="46" rx="40" ry="9" fill="#000" opacity=".22"/>';
  h+='<g transform="translate(0,6)">'+body+' fill="'+p.deep+'"/></g>';
  h+=body+' fill="url(#f3k'+i+')" stroke="'+p.side+'" stroke-width="2.4" stroke-linejoin="round"/>';
  h+='<path d="M-40-6H-14M14-6H40" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>';
  h+='<ellipse cx="0" cy="-36" rx="6.5" ry="9" fill="#bfeaff" stroke="#fff" stroke-width="2"/>';
  h+='<polygon transform="translate(0,2)" points="'+starPts(11,5.2)+'" fill="#fff" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>';
  h+='<ellipse cx="-4" cy="-24" rx="3" ry="10" fill="#fff" opacity=".45"/>';
  h+='</symbol>';
 }
 return h+'</defs></svg>';
}
function tokenSVG(pid){return '<svg class="fl-plane fl3d-tok" viewBox="0 0 112 120" aria-hidden="true"><use href="#f3tok'+(pid%4)+'" width="112" height="120"/></svg>'}

/* ---------- 整盘 ---------- */
function boardSVG(opt){
 var eco=!!(opt&&opt.eco),h='<svg class="flplate fl3d-plate" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">';
 h+=defs(eco);
 h+='<rect width="1000" height="1000" fill="url(#f3sea)"/>';
 h+=waves();
 /* 臂间水道小岛（每臂两侧） */
 var q,gi=0,base=[[431,222,24,62],[569,222,24,62]];
 for(q=0;q<4;q++){
  base.forEach(function(g,j){
   var c=[g[0],g[1]],k;
   for(k=0;k<q;k++)c=rot(c);
   var rx=q%2?g[3]:g[2],ry=q%2?g[2]:g[3];
   h+=island(c[0],c[1],rx,ry,101+gi*13,eco);gi++;
  });
 }
 h+=asphalt();
 if(!eco)h+='<path d="'+roadPath()+'" transform="translate(4,16)" fill="none" stroke="#06324f" stroke-opacity=".35" stroke-width="80" stroke-linejoin="round" filter="url(#f3blur)"/>';
 for(q=0;q<4;q++)h+=hangar(q,eco);
 h+='<path d="'+roadPath()+'" transform="translate(0,9)" fill="none" stroke="#b48c55" stroke-width="76" stroke-linejoin="round"/>';
 h+='<path d="'+roadPath()+'" fill="none" stroke="url(#f3road)" stroke-width="76" stroke-linejoin="round"/>';
 h+='<path d="'+roadPath()+'" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="64" stroke-linejoin="round"/>';
 h+=homeStrips();
 h+=center(eco);
 h+=ringTiles();
 h+=homeTiles();
 h+=balloon(431,170,1.05,'#ff6b6b','#ffd166');
 h+=balloon(569,846,0.95,'#4fc3ff','#ffffff');
 h+=balloon(24,610,0.8,'#ffd23f','#ff8a3d');
 h+=balloon(976,402,0.8,'#7be16a','#ffffff');
 h+=cloud(30,980,0.9)+cloud(975,975,0.8)+cloud(990,20,0.7)+cloud(-6,36,0.65);
 h+='</svg>';
 return h;
}

root.FLY3D={
 W:W,PAL:PAL,ringPos:ringPos,homePos:homePos,basePos:basePos,hangarPct:hangarPct,
 boardSVG:boardSVG,flyOverlay:flyOverlay,tokenDefs:tokenDefs,tokenSVG:tokenSVG,
 _ring:RXY,_qk:QK
};
})(typeof window!=='undefined'?window:globalThis);
