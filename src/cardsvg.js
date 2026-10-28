function cardSVG(t){
 var s='<svg class="art" viewBox="0 0 150 200" preserveAspectRatio="xMidYMid meet">';
 if(t==='R'){
  s+='<rect width="150" height="200" fill="#fff"/>';
  s+='<g fill="none" stroke="#9aa" stroke-width="3" stroke-linecap="round"><ellipse cx="75" cy="70" rx="48" ry="9"/><ellipse cx="75" cy="100" rx="52" ry="10"/><ellipse cx="75" cy="130" rx="46" ry="9"/></g>';
  s+='<g transform="translate(75 98) scale(1.7) translate(-30 -40)"><path d="M30 22C14 24 8 40 27 76C30 79 33 79 35 76C52 40 46 24 30 22Z" fill="#f47a1f" stroke="#8a3208" stroke-width="2.2"/><path d="M30 22 21 8M30 22 30 3M30 22 39 8" stroke="#2d8a2d" stroke-width="6" stroke-linecap="round"/><circle cx="24" cy="38" r="5" fill="#fff" stroke="#522" stroke-width="1.2"/><circle cx="36" cy="38" r="5" fill="#fff" stroke="#522" stroke-width="1.2"/><circle cx="25" cy="39" r="2" fill="#222"/><circle cx="37" cy="39" r="2" fill="#222"/><path d="M22 47Q30 55 38 47" stroke="#522" stroke-width="1.8" fill="#a22"/></g>';
  s+='<path d="M118 160H46" stroke="#222" stroke-width="12" stroke-linecap="round"/><path d="M34 160l20-14v28z" fill="#222"/><text x="85" y="166" font-size="17" font-weight="900" fill="#fff" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei,sans-serif">旋转</text>';
  return s+'</svg>';
 }
 var n=+t;
 s+='<defs><linearGradient id="sky'+n+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb4e8"/><stop offset="1" stop-color="#eaf6ff"/></linearGradient></defs>';
 s+='<rect width="150" height="200" fill="#fff"/><rect width="150" height="120" fill="url(#sky'+n+')"/><ellipse cx="40" cy="60" rx="30" ry="9" fill="#fff" opacity=".7"/><ellipse cx="110" cy="40" rx="24" ry="7" fill="#fff" opacity=".7"/>';
 s+='<path d="M0 100Q70 80 150 105V200H0Z" fill="#4aa83a"/><path d="M0 130Q80 105 150 140V200H0Z" fill="#2f8a2a"/>';
 s+='<rect y="168" width="150" height="32" fill="#fff"/>';
 s+='<g transform="translate(75 102) scale(1.05)"><use href="#rb'+n+'"/></g>';
 var xs=n===1?[75]:n===2?[55,95]:[35,75,115];
 xs.forEach(function(x){s+='<g transform="translate('+x+' 184) scale(.9)"><use href="#coin"/></g>'});
 return s+'</svg>';
}
function label(t){return t==='R'?'旋转胡萝卜!':'走 '+t+' 步'}
