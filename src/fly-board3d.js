/* ===== 飞行棋 · 3D 卡通海岛棋盘（原创矢量）· 几何映射 + 静态美术 · window.FLY3D =====
   拓扑完全沿用 FLYE：RING52 / HOME5 / 横飞+12。每象限 13 格 = 端口 3 + 直道 3 + 内角 1 + 直道 3 + 端口 3，
   端口 7 格宽，中格为本色回家道起点（与引擎「跳过回家格」一致）。坐标系 1000×1000。 */
(function(root){
'use strict';
var E=root.FLYE;
var W=1000,C=500,T=80,P=60,D=180,PT=60,PH=61,OCT=140,TS=54,HS=56;
var HG_IN=36,HG_W=196,ROAD=82,CS=C-D-ROAD/2;
var PAL=[
 {top:'#ff8e9c',base:'#ec4d61',side:'#b52c43',deep:'#861a2f',light:'#ffd5da',pit:'#d23e54'},
 {top:'#ffe37e',base:'#f7c21a',side:'#c78d00',deep:'#946400',light:'#fff4c6',pit:'#e0a90c'},
 {top:'#86c1ff',base:'#3f8ae6',side:'#2360bb',deep:'#17448c',light:'#d8e9ff',pit:'#3274cf'},
 {top:'#8de27b',base:'#46b246',side:'#2b8333',deep:'#1c6024',light:'#d8f6d1',pit:'#3a9c3c'}
];

function n(v){return Math.round(v*10)/10}
function rot(p){return[W-p[1],p[0]]}
function seg0(){
 var a=[[T,C-PT],[T,C-2*PT],[T,C-D]],k;
 for(k=1;k<=3;k++)a.push([T+P*k,C-D]);
 a.push([C-D,C-D]);
 for(k=1;k<=3;k++)a.push([C-D,C-D-P*k]);
 a.push([C-D,T],[C-2*PT,T],[C-PT,T]);
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
 /* 平台向下有 3D 侧边，下方两角上移 10 以在角区内视觉居中 */
 return{x:left?HG_IN:W-HG_IN-HG_W,y:top?HG_IN:W-HG_IN-HG_W-10,w:HG_W,h:HG_W,left:left,top:top};
}
function pitXY(pid,k){
 var h=hangarRect(pid);
 var xs=[h.x+h.w*0.29,h.x+h.w*0.71],ys=[h.y+h.h*0.29,h.y+h.h*0.71];
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
/* 四角半径可不同的圆角矩形，r=[左上,右上,右下,左下] */
function rrc(x,y,w,h,r,a){
 var d='M'+n(x+r[0])+' '+n(y)+'H'+n(x+w-r[1])+(r[1]?'A'+r[1]+' '+r[1]+' 0 0 1 '+n(x+w)+' '+n(y+r[1]):'')+
  'V'+n(y+h-r[2])+(r[2]?'A'+r[2]+' '+r[2]+' 0 0 1 '+n(x+w-r[2])+' '+n(y+h):'')+
  'H'+n(x+r[3])+(r[3]?'A'+r[3]+' '+r[3]+' 0 0 1 '+n(x)+' '+n(y+h-r[3]):'')+
  'V'+n(y+r[0])+(r[0]?'A'+r[0]+' '+r[0]+' 0 0 1 '+n(x+r[0])+' '+n(y):'')+'Z';
 return '<path d="'+d+'" '+(a||'')+'/>';
}
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
/* 横飞航线：FLY_FROM → FLY_TO 的平滑 S 形，起止方向沿主轴，供地面彩绘与飞行高亮共用 */
function routeCtl(fi){
 var a=RXY[E.FLY_FROM[fi]],b=RXY[E.FLY_TO[fi]],vx=b[0]-a[0],vy=b[1]-a[1],c1,c2;
 if(Math.abs(vx)>Math.abs(vy)){c1=[a[0]+vx*0.42,a[1]];c2=[b[0]-vx*0.42,b[1]]}
 else{c1=[a[0],a[1]+vy*0.42];c2=[b[0],b[1]-vy*0.42]}
 return[a,c1,c2,b];
}
function routeD(fi){var p=routeCtl(fi);return 'M'+n(p[0][0])+' '+n(p[0][1])+'C'+n(p[1][0])+' '+n(p[1][1])+' '+n(p[2][0])+' '+n(p[2][1])+' '+n(p[3][0])+' '+n(p[3][1])}
function routeAt(fi,t){
 var p=routeCtl(fi),u=1-t,k,o=[0,0];
 var w=[u*u*u,3*u*u*t,3*u*t*t,t*t*t];
 for(k=0;k<4;k++){o[0]+=w[k]*p[k][0];o[1]+=w[k]*p[k][1]}
 return o;
}
function paintedRoutes(){
 /* 嵌在停机坪地面上的彩绘滑行道：凹槽（上暗下亮）+ 浅色道面 + 本色虚线中线 + 本色箭头；回家道像桥一样从上方跨过 */
 var h='',fi,d,t,p0,p1,ang;
 for(fi=0;fi<4;fi++){
  d=routeD(fi);
  h+='<path d="'+d+'" transform="translate(0,-2)" fill="none" stroke="#7d8894" stroke-width="40" stroke-linecap="round"/>';
  h+='<path d="'+d+'" transform="translate(0,2.5)" fill="none" stroke="#e8edf2" stroke-width="40" stroke-linecap="round"/>';
  h+='<path d="'+d+'" fill="none" stroke="#c6ced7" stroke-width="35" stroke-linecap="round"/>';
  h+='<path d="'+d+'" fill="none" stroke="'+PAL[fi].base+'" stroke-opacity=".8" stroke-width="5" stroke-dasharray="15 13" stroke-linecap="round"/>';
  [0.2,0.8].forEach(function(tt){
   p0=routeAt(fi,tt);p1=routeAt(fi,tt+0.02);ang=Math.atan2(p1[1]-p0[1],p1[0]-p0[0])*180/Math.PI;
   h+='<g transform="translate('+n(p0[0])+','+n(p0[1])+') rotate('+n(ang)+')" opacity=".9"><path d="M-12-9L-2 0L-12 9M0-9L10 0L0 9" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/><path d="M-12-9L-2 0L-12 9M0-9L10 0L0 9" fill="none" stroke="'+PAL[fi].base+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>';
  });
 }
 return h;
}
function asphalt(){
 var A0=C-D-84,AW=2*(D+84);
 var h=rr(A0,A0+6,AW,AW,70,'fill="#c9b07a"');
 h+=rr(A0,A0,AW,AW,70,'fill="#efe2bf"');
 h+=rr(A0+8,A0+8,AW-16,AW-16,62,'fill="url(#f3asph)"');
 return h+paintedRoutes();
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

/* ---------- 机库（小号停机坪）/ 塔台 ---------- */
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
function hangar(pid,eco){
 var hr=hangarRect(pid),p=PAL[pid],x=hr.x,y=hr.y,w=hr.w,hh=hr.h,h='',k,pp,r=29;
 /* 角区草地小岛：铺满跑道外侧角区，跑道压在其上 */
 var gs=CS+30,gx=hr.left?6:W-6-gs,gy=hr.top?6:W-6-gs;
 /* 内角（朝棋盘中心）为直角并压在跑道下，避免露出沙边缺口 */
 function cr(R){var a=[R,R,R,R];a[hr.left?(hr.top?2:1):(hr.top?3:0)]=0;return a}
 h+=rrc(gx-8,gy-8,gs+16,gs+16,cr(76),'fill="url(#f3shal)"');
 h+=rrc(gx,gy+6,gs,gs,cr(66),'fill="#d4b06a"');
 h+=rrc(gx,gy,gs,gs,cr(66),'fill="#f4dca2"');
 h+=rrc(hr.left?gx+9:gx,hr.top?gy+8:gy,gs-9,gs-8,cr(58),'fill="url(#f3grass)"');
 seed=31+pid*17;
 var vx=hr.left?(x+w+6+CS)/2:(W-CS+x-6)/2,hy=hr.top?(y+hh+15+CS)/2:(W-CS+y-6)/2;
 var ty=hr.top?y+74:y+hh-2,t0=hr.top?y+104:y-4,t1=hr.top?y+hh+30:y+hh-84;
 for(k=0;k<4;k++)h+=tree(vx+(rnd()-0.5)*6,t0+k*(t1-t0)/3,10+rnd()*3,false);
 for(k=0;k<5;k++)h+=tree(x+14+k*(w-4)/4+(hr.left?0:-26),hy+(rnd()-0.5)*6,10+rnd()*3,false);
 var ex=hr.left?20:W-20,ey=hr.top?20:W-20;
 for(k=0;k<6;k++){h+=tree(ex+(rnd()-0.5)*4,y+16+k*(hh-30)/5,8+rnd()*2,false);h+=tree(x+16+k*(w-30)/5,ey+(rnd()-0.5)*4,8+rnd()*2,false)}
 h+=tower(vx,ty,pid,0.4,!hr.left);
 /* 停机坪平台 */
 if(!eco)h+=rr(x+3,y+12,w,hh,26,'fill="#06324f" opacity=".3" filter="url(#f3blur)"');
 h+=rr(x-6,y+3,w+12,hh+12,28,'fill="#b9935c"');
 h+=rr(x-6,y-6,w+12,hh+12,28,'fill="url(#f3road)"');
 h+=rr(x,y+8,w,hh,22,'fill="'+p.side+'"');
 h+=rr(x,y,w,hh,22,'fill="url(#f3h'+pid+')"');
 h+=rr(x+4,y+3,w-8,hh-8,19,'fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.5"');
 h+='<path d="M'+n(x+w/2)+' '+n(y+14)+'V'+n(y+hh-14)+'M'+n(x+14)+' '+n(y+hh/2)+'H'+n(x+w-14)+'" stroke="#fff" stroke-opacity=".3" stroke-width="2.2" stroke-dasharray="7 7"/>';
 for(k=0;k<4;k++){
  pp=pitXY(pid,k);
  h+='<circle cx="'+n(pp[0])+'" cy="'+n(pp[1])+'" r="'+r+'" fill="url(#f3pit'+pid+')"/>';
  h+='<circle cx="'+n(pp[0])+'" cy="'+n(pp[1])+'" r="'+(r-1.5)+'" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2.6"/>';
  h+='<path d="M'+n(pp[0]-r+2)+' '+n(pp[1])+'A'+(r-2)+' '+(r-2)+' 0 0 1 '+n(pp[0]+r-2)+' '+n(pp[1])+'" fill="none" stroke="'+p.deep+'" stroke-opacity=".25" stroke-width="4"/>';
 }
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
  var pc=P(a,OCT*0.66);
  h+=iconPlane(pc[0],pc[1],a+180,2.4,'#fff');
 }
 h+='<polygon points="'+oct.map(function(p){var q=[C+(p[0]-C)*0.93,C+(p[1]-C)*0.93];return n(q[0])+','+n(q[1])}).join(' ')+'" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/>';
 /* 金色奖章 + 立体星 */
 h+='<circle cx="'+C+'" cy="'+C+'" r="86" fill="url(#f3glow)"/>';
 h+='<circle cx="'+C+'" cy="'+(C+7)+'" r="60" fill="#c26e00"/>';
 h+='<circle cx="'+C+'" cy="'+C+'" r="60" fill="url(#f3ring)"/>';
 h+='<circle cx="'+C+'" cy="'+C+'" r="50" fill="#fff1c2" stroke="#f0a020" stroke-width="2.8"/>';
 h+='<circle cx="'+C+'" cy="'+C+'" r="43" fill="#ffe28a" opacity=".6"/>';
 h+='<polygon transform="translate('+C+','+(C+6)+')" points="'+starPts(44,21)+'" fill="#d07a00" stroke="#d07a00" stroke-width="8" stroke-linejoin="round"/>';
 h+='<polygon transform="translate('+C+','+C+')" points="'+starPts(44,21)+'" fill="url(#f3gold)" stroke="#f29a00" stroke-width="8" stroke-linejoin="round"/>';
 h+='<polygon transform="translate('+(C-2)+','+(C-7)+') scale(.55)" points="'+starPts(44,21)+'" fill="#fff" opacity=".35"/>';
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
   var rc=routeCtl(fly);
   h+=colorTile(p[0],p[1],s,c,diamond)+iconPlane(p[0],p[1]-1,angTo(rc[0],rc[1]),1.55,'#fff');
  }else if(safe){
   h+=colorTile(p[0],p[1],s,c,diamond)+iconStar(p[0],p[1]-1,13,'#fff');
  }else{
   h+=creamTile(p[0],p[1],s,diamond);
   if(flyTo>=0)h+='<circle cx="'+n(p[0])+'" cy="'+n(p[1]-1)+'" r="16" fill="none" stroke="'+PAL[c].base+'" stroke-opacity=".5" stroke-width="3.5"/>';
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

/* ---------- 横飞高亮层：平时透明，只在真正横飞时沿地面航线闪一下 ---------- */
function flyOverlay(){
 var h='<svg class="fldash-layer fl3d-dash" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">',fi,d;
 for(fi=0;fi<4;fi++){
  d=routeD(fi);
  h+='<g class="fldash-path" id="fldash'+fi+'" data-fly="'+fi+'">';
  h+='<path d="'+d+'" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".7"/>';
  h+='<path class="fldash-stroke" d="'+d+'" fill="none" stroke="'+PAL[fi].base+'" stroke-width="8" stroke-dasharray="18 12" stroke-linecap="round"/>';
  h+='</g>';
 }
 return h+'</svg>';
}

/* ---------- 棋子：角色风味圆筹码 + 座位色粗描边（一眼认出是谁的飞机，又不抢海岛盘） ---------- */
function tokenDefs(){return ''}
function miniPlane(fill){
 return '<g transform="translate(0,34) scale(.38)"><path d="'+PLANE_D+'" fill="'+fill+'" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g>';
}
function chipFace(tok){
 /* tok 0小狗 1小狮子 2不不奥特曼 3哎呀公主 4温柔喷火龙 5猪肉战神 */
 if(tok===0){
  return '<ellipse cx="-28" cy="-6" rx="14" ry="20" transform="rotate(-28 -28 -6)" fill="#c47a3a" stroke="#8a4e1c" stroke-width="2"/>'+
   '<ellipse cx="28" cy="-6" rx="14" ry="20" transform="rotate(28 28 -6)" fill="#c47a3a" stroke="#8a4e1c" stroke-width="2"/>'+
   '<circle r="28" fill="#ffe0b0" stroke="#d49a5a" stroke-width="2"/>'+
   '<ellipse cx="-11" cy="-4" rx="5" ry="6" fill="#fff"/><ellipse cx="11" cy="-4" rx="5" ry="6" fill="#fff"/>'+
   '<circle cx="-10" cy="-3" r="2.6" fill="#2a1a10"/><circle cx="10" cy="-3" r="2.6" fill="#2a1a10"/>'+
   '<ellipse cy="8" rx="6" ry="4.2" fill="#5a2a18"/><circle cx="-2" cy="6.5" r="1.4" fill="#fff" opacity=".5"/>'+
   '<path d="M-10 16 Q0 22 10 16" fill="none" stroke="#c45a3a" stroke-width="2" stroke-linecap="round"/>'+
   '<circle cx="-18" cy="6" r="4.5" fill="#f2a090" opacity=".7"/><circle cx="18" cy="6" r="4.5" fill="#f2a090" opacity=".7"/>';
 }
 if(tok===1){
  var mane='',i,a;
  for(i=0;i<10;i++){a=-90+i*36;mane+='<ellipse cx="0" cy="-30" rx="8" ry="16" transform="rotate('+a+')" fill="'+(i%2?'#ff9a1a':'#ffc43a')+'" stroke="#e07800" stroke-width="1.2"/>';}
  return mane+'<circle r="24" fill="#ffe08a" stroke="#e0a020" stroke-width="2"/>'+
   '<ellipse cx="-8" cy="-4" rx="4.2" ry="5" fill="#3a2208"/><ellipse cx="8" cy="-4" rx="4.2" ry="5" fill="#3a2208"/>'+
   '<circle cx="-6.5" cy="-5.5" r="1.3" fill="#fff"/><circle cx="9.5" cy="-5.5" r="1.3" fill="#fff"/>'+
   '<ellipse cy="6" rx="5" ry="3.4" fill="#c45a20"/>'+
   '<path d="M-18 4 H-28 M18 4 H28 M-16 10 H-26 M16 10 H26" stroke="#7a4010" stroke-width="1.8" stroke-linecap="round"/>'+
   '<path d="M-8 14 Q0 20 8 14" fill="none" stroke="#c45a20" stroke-width="2" stroke-linecap="round"/>';
 }
 if(tok===2){
  return '<rect x="-22" y="-8" width="44" height="38" rx="10" fill="#dfe7f2" stroke="#7a8aa0" stroke-width="2"/>'+
   '<path d="M-30-18 Q-36-2 -28 16 L-18 10 Z" fill="#e0485e"/><path d="M30-18 Q36-2 28 16 L18 10 Z" fill="#e0485e"/>'+
   '<ellipse cy="-10" rx="26" ry="22" fill="#eef3f8" stroke="#9aacbf" stroke-width="2"/>'+
   '<path d="M-6-28 L0-38 L6-28 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="1.4"/>'+
   '<ellipse cx="-9" cy="-10" rx="7" ry="5.2" fill="#ffd23f" stroke="#c9a000" stroke-width="1.2"/>'+
   '<ellipse cx="9" cy="-10" rx="7" ry="5.2" fill="#ffd23f" stroke="#c9a000" stroke-width="1.2"/>'+
   '<path d="M-4-18 L0-8 L4-18" fill="none" stroke="#e0485e" stroke-width="2.4" stroke-linejoin="round"/>'+
   '<circle cy="14" r="6.5" fill="#e0485e" stroke="#fff" stroke-width="2"/>'+
   '<circle cy="14" r="2.6" fill="#ffd23f"/>';
 }
 if(tok===3){
  return '<circle r="30" fill="#e7f6ff"/><circle r="26" fill="none" stroke="#9ad8ff" stroke-width="3"/>'+
   '<g stroke="#fff" stroke-width="3.2" stroke-linecap="round">'+
   '<path d="M0-20 V20 M-20 0 H20 M-14-14 L14 14 M14-14 L-14 14"/>'+
   '</g>'+
   '<g stroke="#7ec8ff" stroke-width="1.8" stroke-linecap="round">'+
   '<path d="M0-20 V20 M-20 0 H20 M-14-14 L14 14 M14-14 L-14 14"/>'+
   '</g>'+
   '<circle r="7" fill="#c8eeff" stroke="#fff" stroke-width="2"/>'+
   '<polygon points="0,-32 -6,-22 0,-24 6,-22" fill="#fff" stroke="#9ad8ff" stroke-width="1.2"/>'+
   '<circle cx="-22" cy="-16" r="3.2" fill="#fff"/><circle cx="24" cy="-8" r="2.4" fill="#fff"/>'+
   '<circle cx="18" cy="16" r="2.8" fill="#d8f4ff"/><circle cx="-16" cy="18" r="2.2" fill="#fff"/>';
 }
 if(tok===4){
  return '<path d="M-34 6 Q-48 -8 -30 -22 Q-22 -4 -18 8 Z" fill="#f0b090" stroke="#c47858" stroke-width="1.6"/>'+
   '<path d="M34 6 Q48 -8 30 -22 Q22 -4 18 8 Z" fill="#f0b090" stroke="#c47858" stroke-width="1.6"/>'+
   '<path d="M-12-28 Q-16-42 -4-36 Q0-30 0-22 Z" fill="#ffe0c8" stroke="#d4a07a" stroke-width="1.4"/>'+
   '<path d="M12-28 Q16-42 4-36 Q0-30 0-22 Z" fill="#ffe0c8" stroke="#d4a07a" stroke-width="1.4"/>'+
   '<circle r="26" fill="#ffe6d2" stroke="#e0a888" stroke-width="2"/>'+
   '<path d="M-16-8 Q-10-12 -6-6" fill="none" stroke="#c47890" stroke-width="1.6" stroke-linecap="round"/>'+
   '<path d="M16-8 Q10-12 6-6" fill="none" stroke="#c47890" stroke-width="1.6" stroke-linecap="round"/>'+
   '<ellipse cx="-8" cy="-2" rx="3.6" ry="4.4" fill="#5a3040"/><ellipse cx="8" cy="-2" rx="3.6" ry="4.4" fill="#5a3040"/>'+
   '<circle cx="-6.6" cy="-3.4" r="1.2" fill="#fff"/><circle cx="9.4" cy="-3.4" r="1.2" fill="#fff"/>'+
   '<path d="M-8 10 Q0 16 8 10" fill="none" stroke="#d47890" stroke-width="2" stroke-linecap="round"/>'+
   '<path d="M-4 18 Q0 28 4 18 Q0 22 -4 18 Z" fill="#ffb070" stroke="#e07040" stroke-width="1.2"/>';
 }
 /* 猪肉战神：人类战厨，猪只作为食物道具 */
 return '<ellipse cy="-28" rx="20" ry="10" fill="#fff" stroke="#d8d0c4" stroke-width="2"/>'+
  '<rect x="-16" y="-24" width="32" height="8" rx="2" fill="#fff" stroke="#c8c0b4" stroke-width="1.4"/>'+
  '<circle r="24" fill="#f3c7a0" stroke="#d49a70" stroke-width="2"/>'+
  '<path d="M-14-6 Q-8-12 -2-6" fill="none" stroke="#6a3a28" stroke-width="2.2" stroke-linecap="round"/>'+
  '<path d="M2-6 Q8-12 14-6" fill="none" stroke="#6a3a28" stroke-width="2.2" stroke-linecap="round"/>'+
  '<ellipse cx="-8" cy="-1" rx="3.4" ry="4" fill="#3a2218"/><ellipse cx="8" cy="-1" rx="3.4" ry="4" fill="#3a2218"/>'+
  '<path d="M-10 10 Q0 6 10 10 Q0 16 -10 10 Z" fill="#c45a40"/>'+
  '<g transform="rotate(-38 18 16)"><rect x="8" y="12" width="28" height="3" rx="1.5" fill="#c0a070"/>'+
  '<ellipse cx="18" cy="13.5" rx="5" ry="3.6" fill="#c47848"/><ellipse cx="28" cy="13.5" rx="5" ry="3.6" fill="#a85830"/></g>'+
  '<polygon points="0,-36 -5,-28 0,-30 5,-28" fill="#ffd23f"/>';
}
function tokenSVG(pid,tok){
 tok=(tok==null?0:tok)|0;if(tok<0)tok=0;if(tok>5)tok=tok%6;
 var pal=PAL[((pid%4)+4)%4];
 var tint=['#fff4e4','#fff0c8','#eef3f8','#e7f6ff','#ffe6d2','#f8e0c8'][tok];
 return '<svg class="fl-plane fl3d-tok" viewBox="-56 -60 112 120" aria-hidden="true">'+
  '<ellipse cx="2" cy="53" rx="42" ry="7" fill="#000" opacity=".16"/>'+
  '<circle cy="7" r="50" style="fill:var(--tr,'+pal.side+')"/>'+
  '<circle r="50" style="fill:var(--tb,'+tint+')" stroke="#fff" stroke-width="2.4"/>'+
  '<circle r="46" fill="none" stroke="'+pal.base+'" stroke-width="7.5"/>'+
  '<circle r="40" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>'+
  '<g transform="translate(0,-4)">'+chipFace(tok)+'</g>'+
  miniPlane(pal.base)+
  '<ellipse cx="-20" cy="-30" rx="13" ry="5.5" transform="rotate(-32 -20 -30)" fill="#fff" opacity=".4"/>'+
  '</svg>';
}

/* ---------- 整盘 ---------- */
function boardSVG(opt){
 var eco=!!(opt&&opt.eco),h='<svg xmlns="http://www.w3.org/2000/svg" class="flplate fl3d-plate" width="1000" height="1000" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">';
 h+=defs(eco);
 h+='<rect width="1000" height="1000" fill="url(#f3sea)"/>';
 h+=waves();
 /* 臂间水道小岛（每臂两侧） */
 var q,gi=0,base=[[412,178,36,40],[588,178,36,40]];
 for(q=0;q<4;q++){
  base.forEach(function(g,j){
   var c=[g[0],g[1]],k;
   for(k=0;k<q;k++)c=rot(c);
   var rx=q%2?g[3]:g[2],ry=q%2?g[2]:g[3];
   h+=island(c[0],c[1],rx,ry,101+gi*13,eco);gi++;
  });
 }
 h+=asphalt();
 if(!eco)h+='<path d="'+roadPath()+'" transform="translate(4,16)" fill="none" stroke="#06324f" stroke-opacity=".35" stroke-width="'+(ROAD+6)+'" stroke-linejoin="round" filter="url(#f3blur)"/>';
 for(q=0;q<4;q++)h+=hangar(q,eco);
 h+='<path d="'+roadPath()+'" transform="translate(0,9)" fill="none" stroke="#b48c55" stroke-width="'+ROAD+'" stroke-linejoin="round"/>';
 h+='<path d="'+roadPath()+'" fill="none" stroke="url(#f3road)" stroke-width="'+ROAD+'" stroke-linejoin="round"/>';
 h+='<path d="'+roadPath()+'" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="'+(ROAD-12)+'" stroke-linejoin="round"/>';
 h+=homeStrips();
 h+=center(eco);
 h+=ringTiles();
 h+=homeTiles();
 h+=balloon(398,156,0.9,'#ff6b6b','#ffd166');
 h+=balloon(602,840,0.85,'#4fc3ff','#ffffff');
 h+=balloon(20,592,0.7,'#ffd23f','#ff8a3d');
 h+=balloon(980,420,0.7,'#7be16a','#ffffff');
 h+='</svg>';
 return h;
}

root.FLY3D={
 W:W,PAL:PAL,ringPos:ringPos,homePos:homePos,basePos:basePos,hangarPct:hangarPct,
 boardSVG:boardSVG,flyOverlay:flyOverlay,tokenDefs:tokenDefs,tokenSVG:tokenSVG,
 flyTrail:function(fi,m){var o=[],k;m=m||8;for(k=0;k<=m;k++)o.push(pct(routeAt(fi,k/m)));return o},
 _ring:RXY,_qk:QK
};
})(typeof window!=='undefined'?window:globalThis);
