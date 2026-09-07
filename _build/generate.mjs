// Guidebook generator.
//
//   node guidebook/_build/generate.mjs     (run from the repo root)
//
// Builds guidebook/index.html plus one self-contained guidebook per game.
// Curriculum content is imported straight from each level's shipped
// src/config/missions.js + gameData.js, so the units, competency codes and
// objectives always match what a learner actually sees in the game. Nothing in
// the "what you will learn" section is written by hand.
//
// Every page is one HTML file: no build step, no CDN, no external assets. Icons
// are inline SVG (the platform forbids emoji, and SVG prints cleanly).
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'guidebook');
const BASE = 'https://games.honeytreatacademy.com/gbl';

const GAMES = [
  ['aquafarmOP', 'AquaFarm', 'Fish Farming & Aquaculture'],
  ['growsmartOP', 'GrowSmart', 'Crop Production & Greenhouse'],
  ['poultryproOP', 'PoultryPro', 'Poultry Farm Management'],
  ['agriventureOP', 'AgriVenture', 'Agribusiness & Enterprise'],
  ['venturebuilderOP', 'VentureBuilder', 'Startup & Venture Building'],
  ['bricklayerOP', 'BrickLayer', 'Bricklaying & Masonry'],
  ['tilesetOP', 'TileSet', 'Tiling & Floor Finishing'],
  ['decorproOP', 'DecorPro', 'Painting & Decorating'],
  ['pipecraftOP', 'PipeCraft', 'Plumbing & Pipefitting'],
  ['timbercraftOP', 'TimberCraft', 'Carpentry & Joinery'],
  ['wireupOP', 'WireUp', 'Electrical Installation'],
  ['safesiteOP', 'SafeSite', 'Health & Safety on Site'],
  ['dataquestOP', 'DataQuest', 'Data Analytics'],
  ['codecraftOP', 'CodeCraft', 'Software Development'],
  ['cybershieldOP', 'CyberShield', 'Cybersecurity'],
  ['vaproOP', 'VaPro', 'Virtual Assistance & Business Admin'],
  ['campaignproOP', 'CampaignPro', 'Digital Marketing'],
  ['creativestudioOP', 'CreativeStudio', 'Graphic & Creative Design'],
  ['beatlabOP', 'BeatLab', 'Music Production'],
  ['lensworkOP', 'LensWork', 'Photography'],
  ['frameshotOP', 'FrameShot', 'Videography & Film'],
  ['eventproOP', 'EventPro', 'Event Planning & Management'],
  ['workreadyOP', 'WorkReady', 'Employability & Work Readiness']
];
const TRACKS = {
  AGR: 'Agriculture', CON: 'Construction', DIG: 'Digital Skills',
  ENT: 'Entertainment & Creative', HSE: 'Health & Safety', SS: 'Soft Skills & Enterprise'
};

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const folderFor = (g, l) => l === 'l1' ? g : `${g}-${l}`;
const LVL = { l1: 'Level 1', l2: 'Level 2', l3: 'Level 3' };

/* ------------------------------------------------------------- extract --- */
async function tryImport(p) { try { return await import(pathToFileURL(p).href); } catch { return null; } }
function grepId(dir) {
  for (const f of ['gameData.js', 'content.js', 'missions.js']) {
    try {
      const m = fs.readFileSync(path.join(dir, 'src', 'config', f), 'utf8').match(/GAME_ID\s*=\s*['"]([^'"]+)['"]/);
      if (m) return m[1];
    } catch { /* next */ }
  }
  return null;
}
async function collect() {
  const out = [];
  for (const [key, name, trade] of GAMES) {
    const game = { key, name, trade, levels: [] };
    for (const lvl of ['l1', 'l2', 'l3']) {
      const dir = path.join(ROOT, folderFor(key, lvl));
      if (!fs.existsSync(dir)) continue;
      const gd = await tryImport(path.join(dir, 'src', 'config', 'gameData.js'));
      const mm = await tryImport(path.join(dir, 'src', 'config', 'missions.js'));
      const MIS = mm && (mm.MISSIONS || mm.default);
      game.levels.push({
        level: lvl, gameId: (gd && gd.GAME_ID) || grepId(dir),
        units: (Array.isArray(MIS) ? MIS : []).map(u => ({
          id: u.id, title: u.title || '', competency: u.competency || '', brief: u.brief || '',
          speaker: (u.intro && u.intro.speaker) || '', role: (u.intro && u.intro.role) || '',
          objectives: (u.objectives || []).map(o => ({ id: o.id, text: o.text || '' })),
          reward: (u.reward && u.reward.text) || ''
        }))
      });
    }
    const anyId = game.levels.map(l => l.gameId).find(Boolean) || '';
    const tm = anyId.match(/^HTA-([A-Z]+)-/);
    game.trackCode = tm ? tm[1] : '';
    game.track = TRACKS[game.trackCode] || '';
    out.push(game);
  }
  return out;
}

/* --------------------------------------------------------------- icons --- */
const ico = {
  joystick: `<circle cx="12" cy="12" r="9"/><circle cx="15.5" cy="8.5" r="3.6" class="f"/>`,
  dpad: `<rect x="9.5" y="2.5" width="5" height="19" rx="1.5" class="f"/><rect x="2.5" y="9.5" width="19" height="5" rx="1.5" class="f"/>`,
  swap: `<path d="M4 8h13l-3.5-3.5"/><path d="M20 16H7l3.5 3.5"/>`,
  key: `<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>`,
  tap: `<circle cx="12" cy="12" r="8.5"/><path d="M9.5 8.5v7M9.5 8.5h5M9.5 12h4M9.5 15.5h5"/>`,
  pin: `<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><path d="M12 6.5v4.5M12 14h.01"/>`,
  compass: `<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z" class="f"/>`,
  map: `<path d="M3 6.5l6-2.5 6 2.5 6-2.5v14l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v14M15 6.5v14"/>`,
  list: `<path d="M4 7h.01M4 12h.01M4 17h.01M8.5 7H20M8.5 12H20M8.5 17H20"/>`,
  slider: `<path d="M3 12h18"/><circle cx="9" cy="12" r="3.5" class="f"/>`,
  chat: `<path d="M4 5h16v11H9l-5 4z"/>`,
  medal: `<circle cx="12" cy="14" r="6"/><path d="M8 3l2.5 5M16 3l-2.5 5M9.8 14l1.6 1.6 3-3.2"/>`,
  save: `<path d="M4 4h13l3 3v13H4z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>`,
  expand: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>`,
  sound: `<path d="M4 9.5h4l4.5-4v13L8 14.5H4z"/><path d="M16.5 9a4.5 4.5 0 0 1 0 6"/>`,
  warn: `<path d="M12 3.5L21.5 20h-19z"/><path d="M12 9.5v5M12 17.5h.01"/>`,
  check: `<path d="M4.5 12.5l5 5 10-11"/>`,
  book: `<path d="M4 4.5h7a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H4z"/><path d="M20 4.5h-7a3 3 0 0 0-3 3V20a2.5 2.5 0 0 1 2.5-2.5H20z"/>`,
  target: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" class="f"/>`,
  person: `<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c0-4.2 3.4-6.5 7.5-6.5s7.5 2.3 7.5 6.5"/>`,
  phone: `<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>`,
  search: `<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>`,
  print: `<path d="M7 9V3.5h10V9M7 18H4.5v-7h15v7H17"/><rect x="7" y="14.5" width="10" height="6"/>`,
  up: `<path d="M12 19V5M6 11l6-6 6 6"/>`
};
const I = n => `<span class="i"><svg viewBox="0 0 24 24">${ico[n] || ''}</svg></span>`;

/* --------------------------------------------------------------- style --- */
const CSS = `
*{box-sizing:border-box}
:root{--ink:#241a10;--pap:#f6f3ec;--card:#fff;--line:#e2d8c6;--amber:#e6b95c;--deep:#241810;--mut:#5a4126}
body{margin:0;background:var(--pap);color:var(--ink);font:16px/1.62 system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:#8a5a12}
header.top{background:linear-gradient(160deg,#241810,#3a2817);color:#f4ecd6;padding:40px 0 34px;border-bottom:5px solid var(--amber)}
.wrap{max-width:1080px;margin:0 auto;padding:0 22px}
.eyebrow{letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-weight:800;color:var(--amber);margin:0 0 8px}
h1{font-size:39px;line-height:1.1;margin:0 0 10px;font-weight:850}
.sub{font-size:19px;color:#d6c4a2;margin:0}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.badge{background:rgba(230,185,92,.15);border:1px solid rgba(230,185,92,.5);color:#f2cd76;padding:5px 12px;border-radius:999px;font-size:13px;font-weight:700}
.layout{display:grid;grid-template-columns:236px 1fr;gap:36px;max-width:1080px;margin:0 auto;padding:26px 22px 90px}
nav.toc{position:sticky;top:16px;align-self:start;max-height:calc(100vh - 32px);overflow:auto;font-size:14.5px}
nav.toc a{display:block;padding:6px 10px;border-radius:7px;color:var(--mut);text-decoration:none;border-left:3px solid transparent}
nav.toc a:hover{background:#efe7d8}
nav.toc a.on{background:#fff;border-left-color:var(--amber);color:var(--ink);font-weight:700}
nav.toc .lbl{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:#8a7a5e;font-weight:800;margin:14px 0 4px;padding-left:10px}
h2{font-size:26px;margin:40px 0 6px;padding-top:14px;border-top:2px solid #e0d6c2;font-weight:820;scroll-margin-top:14px}
h2:first-of-type{border-top:0;margin-top:6px}
h3{font-size:18.5px;margin:24px 0 8px;font-weight:800}
h4{font-size:15.5px;margin:16px 0 6px;font-weight:800;color:var(--mut)}
p{margin:.55em 0}.lead{font-size:17.5px;color:#4a3a26}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:19px 21px;margin:16px 0;box-shadow:0 1px 3px rgba(60,40,10,.05)}
.rowlist{list-style:none;padding:0;margin:12px 0}
.rowlist li{display:flex;gap:13px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #ece4d6}
.rowlist li:last-child{border-bottom:0}
.i{flex:0 0 auto;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;background:#f2e6cd;border-radius:8px;color:#7a5a1e}
.i svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.i svg .f{fill:currentColor;stroke:none}
.rowlist>li>div>b{display:block;font-size:15.5px}
.rowlist .d{color:#54452f;font-size:15px}
.rowlist .d b,.rowlist .d kbd{display:inline}
table{border-collapse:collapse;width:100%;margin:14px 0;font-size:15px}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid #e6dccb;vertical-align:top}
th{background:#f0e8d8;font-weight:800;font-size:13.5px}
kbd{background:var(--deep);color:#f2cd76;border-radius:5px;padding:2px 8px;font:600 13px/1.5 ui-monospace,monospace;display:inline-block}
.note{background:#fdf6e6;border:1px solid #e8d6a8;border-left:4px solid var(--amber);border-radius:0 10px 10px 0;padding:14px 18px;margin:16px 0;display:flex;gap:12px;align-items:flex-start}
.ucode{font:600 12.5px ui-monospace,monospace;color:#8a7a5e}
footer{margin-top:50px;padding-top:18px;border-top:2px solid #e0d6c2;color:#6a5a42;font-size:14px}
/* ---- interactive bits ---- */
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}
.tab{background:#efe7d8;border:1px solid var(--line);color:var(--mut);border-radius:9px;padding:8px 16px;font:800 14.5px system-ui;cursor:pointer}
.tab[aria-selected="true"]{background:var(--deep);border-color:var(--deep);color:#f2cd76}
.pane[hidden]{display:none}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0}
.srch{flex:1 1 220px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 12px}
.srch input{border:0;outline:0;font:15px system-ui;flex:1;background:transparent;color:inherit}
.btn{background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 14px;font:700 14px system-ui;color:var(--mut);cursor:pointer}
.btn:hover{border-color:#c9a25e}
.bar{height:9px;background:#e8dfcd;border-radius:99px;overflow:hidden;margin:8px 0 2px}
.bar>i{display:block;height:100%;background:linear-gradient(90deg,#e6b95c,#c98f2e);width:0;transition:width .25s}
.prog{font-size:13.5px;color:var(--mut);font-weight:700}
details.unit{border:1px solid var(--line);border-left:4px solid var(--amber);background:#fff;border-radius:0 12px 12px 0;margin:12px 0;overflow:hidden}
details.unit>summary{cursor:pointer;list-style:none;padding:14px 18px;display:flex;gap:11px;align-items:center;flex-wrap:wrap}
details.unit>summary::-webkit-details-marker{display:none}
details.unit>summary:hover{background:#fbf7ee}
.unum{background:var(--deep);color:#f2cd76;font-weight:800;font-size:12.5px;border-radius:7px;padding:3px 10px}
.utitle{font-weight:800;font-size:16.5px;flex:1 1 auto}
.chev{width:15px;height:15px;flex:0 0 auto;transition:transform .18s;color:#a08a63}
details.unit[open] .chev{transform:rotate(90deg)}
.ubody{padding:0 18px 16px;border-top:1px solid #f0e8da}
.objs{list-style:none;padding:0;margin:6px 0}
.objs li{display:flex;gap:10px;padding:5px 0;font-size:15px;align-items:flex-start}
.objs input{margin:3px 0 0;width:16px;height:16px;accent-color:#a8792a;flex:0 0 auto;cursor:pointer}
.objs label{cursor:pointer}
.objs input:checked+label{color:#7a6a52;text-decoration:line-through}
.who{color:var(--mut);font-size:14.5px;font-style:italic}
/* joystick + dpad demos */
.demo{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:14px 0}
@media(max-width:860px){.demo{grid-template-columns:1fr}.layout{grid-template-columns:1fr}nav.toc{position:static;max-height:none;margin-bottom:10px}}
.pad{position:relative;height:210px;background:#241810;border-radius:14px;overflow:hidden;touch-action:none;cursor:grab;user-select:none}
.pad:active{cursor:grabbing}
.pad .hint{position:absolute;inset:auto 0 10px;text-align:center;color:#b9a179;font-size:12.5px;pointer-events:none}
.ring{position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border:3px solid rgba(230,185,92,.55);border-radius:50%;background:rgba(230,185,92,.06);opacity:.55;transition:opacity .15s}
.ring.on{opacity:1}
.nub{position:absolute;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:#e6b95c;border:2px solid rgba(27,19,10,.55)}
.read{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;font-size:14.5px}
.read dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:8px 0 0}
.read dt{color:var(--mut);font-weight:700}
.read dd{margin:0;font:600 14px ui-monospace,monospace}
.stage{position:relative;height:96px;background:#efe7d8;border:1px solid var(--line);border-radius:10px;margin-top:10px;overflow:hidden}
.guy{position:absolute;width:19px;height:19px;border-radius:50%;background:#8a5a12;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);left:50%;top:50%;margin:-9px 0 0 -9px}
.dpadwrap{position:relative;height:210px;background:#241810;border-radius:14px;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none}
.dbtn{position:absolute;width:62px;height:62px;border-radius:50%;background:rgba(42,28,16,.9);border:2.5px solid rgba(230,185,92,.85);color:#f2cd76;display:flex;align-items:center;justify-content:center;cursor:pointer}
.dbtn.hit{background:#e6b95c;color:#241810}
.dbtn svg{width:20px;height:20px;fill:currentColor}
.pressed{margin-top:10px;font:700 14px system-ui;color:var(--mut)}
.pressed b{color:var(--ink)}
#top{position:fixed;right:18px;bottom:18px;background:var(--deep);color:#f2cd76;border:0;border-radius:50%;width:44px;height:44px;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.25)}
#top svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
#top.show{display:flex}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:15px;margin:16px 0}
.gcard{display:block;background:#fff;border:1px solid var(--line);border-radius:13px;padding:16px 18px;text-decoration:none;color:inherit}
.gcard:hover{border-color:#c9a25e;box-shadow:0 3px 10px rgba(60,40,10,.09)}
.gcard b{display:block;font-size:17px}
.gcard span{color:var(--mut);font-size:14.5px}
.trk{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:#8a7a5e;font-weight:800;margin-top:8px;display:block}
@media print{
  body{background:#fff}nav.toc,#top,.toolbar,.tabs,.demo{display:none !important}
  .layout{grid-template-columns:1fr;padding-top:0}
  details.unit>.ubody{display:block !important}details.unit{break-inside:avoid}
  header.top{background:#241810 !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pane[hidden]{display:block !important}
  a{color:inherit;text-decoration:none}
}
`;

/* ------------------------------------------------- interactive demos JS --- */
const DEMOJS = `
// Live joystick demo — mirrors the real control: the press point becomes the
// origin, the thumb is clamped to MAX, strength = distance / MAX.
(function(){
  var pad=document.getElementById('jspad'); if(!pad) return;
  var ring=document.getElementById('jsring'), nub=document.getElementById('jsnub');
  var oa=document.getElementById('jsang'), os=document.getElementById('jsstr'), ov=document.getElementById('jsvec'), om=document.getElementById('jsmode');
  var guy=document.getElementById('jsguy'), stage=document.getElementById('jsstage');
  var MAX=60, id=null, ox=0, oy=0, gx=50, gy=50, vx=0, vy=0;
  function place(el,x,y){ el.style.left=x+'px'; el.style.top=y+'px'; }
  function home(){
    var r=pad.getBoundingClientRect(); ox=r.width/2; oy=r.height/2;
    place(ring,ox,oy); place(nub,ox,oy); ring.classList.remove('on');
    vx=vy=0; out(0,0,0);
  }
  function out(x,y,s){
    ov.textContent='x '+x.toFixed(2)+'   y '+y.toFixed(2);
    os.textContent=(s*100).toFixed(0)+'%';
    oa.textContent=(s>0.02? (Math.atan2(y,x)*180/Math.PI).toFixed(0)+'\\u00B0' : '--');
    om.textContent = s<=0.02?'stopped' : s<0.45?'walking slowly' : s<0.85?'walking' : 'running';
  }
  function move(e){
    if(id===null) return;
    var r=pad.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    var dx=px-ox, dy=py-oy, d=Math.hypot(dx,dy), c=Math.min(d,MAX);
    var nx=d>0?dx/d:0, ny=d>0?dy/d:0, s=c/MAX;
    place(nub, ox+nx*c, oy+ny*c);
    vx=nx*s; vy=ny*s; out(vx,vy,s);
  }
  pad.addEventListener('pointerdown',function(e){
    id=e.pointerId; try{ pad.setPointerCapture(id); }catch(_){}
    var r=pad.getBoundingClientRect();
    ox=Math.max(MAX+8,Math.min(r.width-MAX-8,e.clientX-r.left));
    oy=Math.max(MAX+8,Math.min(r.height-MAX-8,e.clientY-r.top));
    place(ring,ox,oy); ring.classList.add('on'); move(e);
  });
  pad.addEventListener('pointermove',move);
  ['pointerup','pointercancel','pointerleave'].forEach(function(t){
    pad.addEventListener(t,function(){ if(id!==null){ try{pad.releasePointerCapture(id);}catch(_){} } id=null; home(); });
  });
  // the demo character moves at a speed proportional to strength, like the game
  setInterval(function(){
    if(!stage) return;
    var w=stage.clientWidth, h=stage.clientHeight;
    gx=Math.max(4,Math.min(w-4,gx+vx*3.2)); gy=Math.max(4,Math.min(h-4,gy+vy*3.2));
    guy.style.left=gx+'px'; guy.style.top=gy+'px';
  },16);
  window.addEventListener('resize',home); home();
  gx=stage.clientWidth/2; gy=stage.clientHeight/2;
})();

// D-pad demo — the buttons use CIRCULAR hit areas, so the diagonal gaps between
// them deliberately register nothing. That is the fix for the old mis-taps.
(function(){
  var wrap=document.getElementById('dpwrap'); if(!wrap) return;
  var out=document.getElementById('dpout');
  var btns=[].slice.call(wrap.querySelectorAll('.dbtn'));
  function hitAt(cx,cy){
    var r=wrap.getBoundingClientRect(), x=cx-r.left, y=cy-r.top, found=null;
    btns.forEach(function(b){
      var br=b.getBoundingClientRect();
      var bx=br.left-r.left+br.width/2, by=br.top-r.top+br.height/2;
      if(Math.hypot(x-bx,y-by)<=br.width/2) found=b;
    });
    return found;
  }
  function clear(){ btns.forEach(function(b){b.classList.remove('hit');}); }
  wrap.addEventListener('pointerdown',function(e){
    var b=hitAt(e.clientX,e.clientY); clear();
    if(b){ b.classList.add('hit'); out.innerHTML='Registered: <b>'+b.dataset.dir+'</b>'; }
    else { out.innerHTML='Registered: <b>nothing</b> \\u2014 you are in the gap between buttons, so no direction fires.'; }
  });
  ['pointerup','pointerleave','pointercancel'].forEach(function(t){
    wrap.addEventListener(t,function(){ clear(); out.innerHTML='Press a button, then try the diagonal gap between two of them.'; });
  });
})();

// tabs, accordions, search, progress, scrollspy, back-to-top
(function(){
  var tabs=[].slice.call(document.querySelectorAll('.tab'));
  tabs.forEach(function(t){ t.addEventListener('click',function(){
    tabs.forEach(function(o){ o.setAttribute('aria-selected', o===t?'true':'false');
      var p=document.getElementById(o.dataset.pane); if(p) p.hidden = (o!==t); });
  });});

  var KEY='hta-gb-'+(document.body.dataset.game||'x')+'-';
  [].forEach.call(document.querySelectorAll('.objs input'),function(cb){
    var k=KEY+cb.dataset.k;
    try{ if(localStorage.getItem(k)==='1') cb.checked=true; }catch(_){}
    cb.addEventListener('change',function(){
      try{ cb.checked?localStorage.setItem(k,'1'):localStorage.removeItem(k); }catch(_){}
      prog();
    });
  });
  function prog(){
    [].forEach.call(document.querySelectorAll('.pane'),function(p){
      var all=p.querySelectorAll('.objs input'), done=p.querySelectorAll('.objs input:checked');
      var bar=p.querySelector('.bar>i'), lab=p.querySelector('.prog');
      if(!all.length||!bar) return;
      var pc=Math.round(done.length/all.length*100);
      bar.style.width=pc+'%';
      if(lab) lab.textContent=done.length+' of '+all.length+' objectives ticked  ('+pc+'%)';
    });
  }
  prog();

  var q=document.getElementById('q');
  if(q) q.addEventListener('input',function(){
    var s=q.value.trim().toLowerCase();
    [].forEach.call(document.querySelectorAll('details.unit'),function(d){
      var hit=!s || d.textContent.toLowerCase().indexOf(s)>=0;
      d.style.display=hit?'':'none';
      if(s&&hit) d.open=true;
    });
  });

  var ex=document.getElementById('expand');
  if(ex) ex.addEventListener('click',function(){
    var us=[].slice.call(document.querySelectorAll('.pane:not([hidden]) details.unit'));
    var anyClosed=us.some(function(d){return !d.open;});
    us.forEach(function(d){ d.open=anyClosed; });
    ex.textContent=anyClosed?'Collapse all units':'Expand all units';
  });

  var pr=document.getElementById('printme');
  if(pr) pr.addEventListener('click',function(){ window.print(); });

  var links=[].slice.call(document.querySelectorAll('nav.toc a'));
  var heads=links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  if('IntersectionObserver' in window && heads.length){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href')==='#'+e.target.id); });
      });
    },{rootMargin:'0px 0px -72% 0px'});
    heads.forEach(function(h){ io.observe(h); });
  }

  var top=document.getElementById('top');
  if(top){
    top.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });
    window.addEventListener('scroll',function(){ top.classList.toggle('show', window.scrollY>600); });
  }
})();
`;

/* ---------------------------------------------------- how to play block --- */
function howToPlay(g) {
  const n = esc(g.name);
  return `
<h2 id="howtoplay">How to play &mdash; the complete guide</h2>
<p class="lead">${n} is a living world, not a quiz. Nobody asks you multiple-choice questions. You walk to a real
workstation, open it, and <b>do the job</b> &mdash; and the objective ticks the moment the work is actually correct.
This section covers every control and every part of the screen. <b>The two demos below are live: try them.</b></p>

<h3>1. Try the joystick</h3>
<p>This is the real control, running here in the page. <b>Press anywhere in the dark panel and drag.</b> Notice that
wherever you press becomes the centre, that any direction works, and that how far you drag changes the speed.</p>
<div class="demo">
  <div class="pad" id="jspad">
    <div class="ring" id="jsring"></div><div class="nub" id="jsnub"></div>
    <div class="hint">press and drag anywhere in here</div>
  </div>
  <div class="read">
    <b>What the game receives</b>
    <dl>
      <dt>Direction</dt><dd id="jsvec">x 0.00&nbsp;&nbsp; y 0.00</dd>
      <dt>Angle</dt><dd id="jsang">--</dd>
      <dt>Strength</dt><dd id="jsstr">0%</dd>
      <dt>Result</dt><dd id="jsmode">stopped</dd>
    </dl>
    <div class="stage" id="jsstage"><div class="guy" id="jsguy"></div></div>
    <p style="margin:8px 0 0;font-size:13.5px;color:#5a4126">The dot moves at the speed your drag is asking for.</p>
  </div>
</div>
<ul class="rowlist">
  <li>${I('joystick')}<div><b>Press anywhere on the left half</b><span class="d">You never have to find a fixed stick
    or look down &mdash; wherever your thumb lands becomes the centre.</span></div></li>
  <li>${I('compass')}<div><b>Any direction, not just four</b><span class="d">Full 360-degree movement. Drag
    diagonally and you walk diagonally.</span></div></li>
  <li>${I('slider')}<div><b>Drag distance sets speed</b><span class="d">A small drag walks slowly &mdash; ideal for
    lining up with a bench. Dragging to the edge runs. Dragging further does not go faster; it is capped.</span></div></li>
  <li>${I('check')}<div><b>Let go to stop</b><span class="d">The stick springs back to centre and the character
    stops immediately.</span></div></li>
</ul>

<h3>2. Try the direction pad</h3>
<p>If you prefer buttons, switch to the pad. Press the buttons below &mdash; then deliberately press the
<b>diagonal gap</b> between two of them.</p>
<div class="demo">
  <div class="dpadwrap" id="dpwrap">
    <div class="dbtn" data-dir="Up" style="transform:translateY(-62px)"><svg viewBox="0 0 24 24"><path d="M12 5l7 11H5z"/></svg></div>
    <div class="dbtn" data-dir="Down" style="transform:translateY(62px)"><svg viewBox="0 0 24 24"><path d="M12 19L5 8h14z"/></svg></div>
    <div class="dbtn" data-dir="Left" style="transform:translateX(-62px)"><svg viewBox="0 0 24 24"><path d="M5 12l11-7v14z"/></svg></div>
    <div class="dbtn" data-dir="Right" style="transform:translateX(62px)"><svg viewBox="0 0 24 24"><path d="M19 12L8 19V5z"/></svg></div>
  </div>
  <div class="read">
    <b>What registers</b>
    <p class="pressed" id="dpout">Press a button, then try the diagonal gap between two of them.</p>
    <p style="font-size:13.5px;color:#5a4126;margin-top:10px">Each button only responds inside its own circle. That is
    why pressing near the edge of one can never trigger its neighbour &mdash; the gap simply does nothing, instead of
    sending you the wrong way.</p>
  </div>
</div>
<ul class="rowlist">
  <li>${I('dpad')}<div><b>Press and hold to walk</b><span class="d">Hold a button to keep walking that way; release
    to stop. Each button shows the direction it moves you.</span></div></li>
  <li>${I('swap')}<div><b>Switch between joystick and pad any time</b><span class="d">Tap the small switch button
    beside the controls. It is labelled with what you will switch <b>to</b>, and your choice is remembered.</span></div></li>
</ul>

<h3>3. Before you start</h3>
<ul class="rowlist">
  <li>${I('phone')}<div><b>Hold the phone sideways (landscape)</b><span class="d">The world is a wide view. In
    portrait you get a "rotate your device" screen; turn the phone and it starts immediately.</span></div></li>
  <li>${I('expand')}<div><b>Go fullscreen</b><span class="d">Tap the expand button in the corner. On a phone this
    hides the address bar and makes every control noticeably bigger.</span></div></li>
  <li>${I('sound')}<div><b>Sound is on by default</b><span class="d">There is an <b>SFX</b> toggle in the top bar. A
    chime confirms each objective, but the game is fully playable silent.</span></div></li>
</ul>

<h3>4. What is on the screen</h3>
<ul class="rowlist">
  <li>${I('list')}<div><b>Objectives panel &mdash; top left</b><span class="d">Your current unit and its tasks. The
    task you are on has an arrow; finished tasks show a tick. Tap the header to collapse it if it covers the view; it
    remembers your choice.</span></div></li>
  <li>${I('target')}<div><b>Status bar &mdash; across the top</b><span class="d">Day and clock, the unit dots showing
    how far you have come, and your running <b>Standard</b> percentage.</span></div></li>
  <li>${I('tap')}<div><b>Action button &mdash; bottom right</b><span class="d">The round <b>E</b> button: how you use
    whatever you are standing next to.</span></div></li>
  <li>${I('map')}<div><b>Site Plan button &mdash; top right</b><span class="d">Opens the full map of the site.</span></div></li>
</ul>

<h3>5. On a computer</h3>
<ul class="rowlist">
  <li>${I('key')}<div><b>Keyboard</b><span class="d"><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or the arrow
    keys to walk, <kbd>E</kbd> to use, <kbd>Space</kbd> to advance dialogue, <kbd>Esc</kbd> to close,
    <kbd>M</kbd> for the map.</span></div></li>
  <li>${I('tap')}<div><b>Click to walk there</b><span class="d">Click a spot and the character walks to it. Click a
    workstation and they walk over and open it.</span></div></li>
</ul>

<h3>6. Doing the work</h3>
<ul class="rowlist">
  <li>${I('tap')}<div><b>Walk close, then press <kbd>E</kbd> or the round button</b><span class="d">When you are near
    something usable, a label appears over it, e.g. "[E] Sorting bench". That label means the action button will
    work.</span></div></li>
  <li>${I('warn')}<div><b>No label means you are not close enough</b><span class="d">Walk nearer until it shows.
    Pressing with nothing nearby does nothing &mdash; you have not broken anything.</span></div></li>
  <li>${I('person')}<div><b>People work the same way</b><span class="d">Stand next to a colleague and press the same
    button to talk. They give you the unit's instructions.</span></div></li>
</ul>

<h3>7. Being shown where to go</h3>
<p>You should never wander wondering what to do. Three cues point at your next task and all update the instant you
finish one.</p>
<ul class="rowlist">
  <li>${I('pin')}<div><b>The "!" marker</b><span class="d">Floats over the building holding your next task; once
    inside it moves onto the exact bench or desk. It hides when you are close enough for that station's own label to
    appear &mdash; at which point just press the action button.</span></div></li>
  <li>${I('compass')}<div><b>The heading arrow</b><span class="d">Always points toward your target, so you know which
    way to set off.</span></div></li>
  <li>${I('map')}<div><b>The edge arrow</b><span class="d">If the target is off screen, the arrow pins to the screen
    edge in that direction.</span></div></li>
</ul>

<h3>8. The Site Plan (the map)</h3>
<ul class="rowlist">
  <li>${I('map')}<div><b>Open it any time</b><span class="d">Tap <b>Site Plan</b> top right, or press <kbd>M</kbd>.
    It fills the screen.</span></div></li>
  <li>${I('target')}<div><b>What it shows</b><span class="d">Every building and the paths between them, to scale. A
    coloured dot is <b>you</b>; a ring marks the building you need next.</span></div></li>
  <li>${I('check')}<div><b>Close it</b><span class="d">Tap the <b>X</b>, tap outside the panel, press <kbd>Esc</kbd>,
    or press <kbd>M</kbd> again. You do not move while it is open.</span></div></li>
</ul>

<h3>9. Task panels &mdash; where the work happens</h3>
<ul class="rowlist">
  <li>${I('slider')}<div><b>Sliders and dials</b><span class="d">Where you set a real value &mdash; a temperature, a
    depth, a mix consistency &mdash; <b>drag</b> the slider roughly into place, then use <b>&minus;</b> and <b>+</b> to
    fine-tune exactly.</span></div></li>
  <li>${I('list')}<div><b>Choice cards and checklists</b><span class="d">Tap a card to select, or tick items in order.
    Some tasks require the correct <b>sequence</b>, not just the correct items.</span></div></li>
  <li>${I('check')}<div><b>Confirm buttons</b><span class="d">Nothing is recorded until you press the confirm button,
    so you can change your mind freely.</span></div></li>
  <li>${I('tap')}<div><b>Closing a panel</b><span class="d">Tap the <b>X</b> or press <kbd>Esc</kbd>. Anything already
    completed stays completed.</span></div></li>
</ul>
<div class="note">${I('check')}<div><b>Objectives tick straight away.</b> The moment your work is correct the objective
ticks and you hear a chime &mdash; while you are still at the bench. You do not have to leave the building for it to
register.</div></div>

<h3>10. Conversations, finishing, and saving</h3>
<ul class="rowlist">
  <li>${I('chat')}<div><b>Advance a line</b><span class="d">Tap the dialogue box, or press <kbd>E</kbd> or
    <kbd>Space</kbd>. Press <kbd>Esc</kbd> to leave early &mdash; instructions stay in the objectives panel.</span></div></li>
  <li>${I('medal')}<div><b>Finishing a level</b><span class="d">A congratulations screen shows units mastered, your
    <b>Standard</b> percentage and the certificate level reached. The marker then points at the certification
    board.</span></div></li>
  <li>${I('save')}<div><b>Saving is automatic</b><span class="d">There is no save button; progress reloads when you
    return. It is stored in that browser on that device, so a different phone or clearing browsing data starts fresh.
    Each level saves separately.</span></div></li>
</ul>

<h3>11. If something goes wrong</h3>
<table>
  <tr><th>What you see</th><th>What to do</th></tr>
  <tr><td>You do not know where to go</td><td>Follow the "!" marker, or open the <b>Site Plan</b> and find the ringed building.</td></tr>
  <tr><td>The action button does nothing</td><td>You are not close enough &mdash; walk nearer until the "[E] ..." label appears.</td></tr>
  <tr><td>An objective will not tick</td><td>Re-read it in the objectives panel; some need a specific value or order. Reopen the station and check each step.</td></tr>
  <tr><td>The controls feel awkward</td><td>Switch between joystick and pad with the button beside the controls, and use fullscreen.</td></tr>
  <tr><td>Part of the screen is cut off</td><td>Turn the phone to landscape and tap fullscreen.</td></tr>
  <tr><td>You want to start over</td><td>Clearing your browser data for the site resets that level.</td></tr>
</table>

<h3>12. Quick reference</h3>
<table>
  <tr><th>Action</th><th>Touch</th><th>Keyboard</th></tr>
  <tr><td>Walk</td><td>Drag anywhere on the left, or hold a pad arrow</td><td><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows</td></tr>
  <tr><td>Walk to a spot</td><td>Tap the ground</td><td>Click the ground</td></tr>
  <tr><td>Use / talk</td><td>Round <b>E</b> button</td><td><kbd>E</kbd></td></tr>
  <tr><td>Advance dialogue</td><td>Tap the dialogue box</td><td><kbd>E</kbd> or <kbd>Space</kbd></td></tr>
  <tr><td>Open the map</td><td><b>Site Plan</b> button</td><td><kbd>M</kbd></td></tr>
  <tr><td>Close panel / map / dialogue</td><td><b>X</b> or tap outside</td><td><kbd>Esc</kbd></td></tr>
  <tr><td>Show / hide objectives</td><td>Tap the panel header</td><td>&mdash;</td></tr>
  <tr><td>Switch joystick / pad</td><td>Switch button by the controls</td><td>&mdash;</td></tr>
  <tr><td>Fullscreen</td><td>Corner expand button</td><td>Corner expand button</td></tr>
</table>`;
}

/* ------------------------------------------------------------ game page --- */
function gamePage(g) {
  const chev = `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`;
  const tabs = g.levels.map((L, i) =>
    `<button class="tab" role="tab" data-pane="pane-${L.level}" aria-selected="${i === 0}">${LVL[L.level]}</button>`).join('');

  const panes = g.levels.map((L, i) => {
    const units = L.units.map((u, j) => `
      <details class="unit"${j === 0 ? ' open' : ''}>
        <summary>${chev}<span class="unum">Unit ${j + 1}</span>
          <span class="utitle">${esc(u.title)}</span>
          ${u.competency ? `<span class="ucode">${esc(u.competency)}</span>` : ''}</summary>
        <div class="ubody">
          ${u.brief ? `<p>${esc(u.brief)}</p>` : ''}
          ${u.speaker ? `<p class="who">Taught on the job by ${esc(u.speaker)}${u.role ? `, ${esc(u.role)}` : ''}.</p>` : ''}
          <h4>What you actually do &mdash; tick these off as you go</h4>
          <ul class="objs">${u.objectives.map(o => {
            const k = `${L.level}-${u.id}-${o.id}`;
            return `<li><input type="checkbox" id="c-${k}" data-k="${esc(k)}"><label for="c-${k}">${esc(o.text)}</label></li>`;
          }).join('')}</ul>
          ${u.reward ? `<p style="margin-top:10px;color:#5a4126"><b>On completion:</b> ${esc(u.reward)}</p>` : ''}
        </div>
      </details>`).join('');
    return `<section class="pane" id="pane-${L.level}"${i === 0 ? '' : ' hidden'}>
      <p style="margin:10px 0 2px">
        ${L.gameId ? `<span class="ucode">${esc(L.gameId)}</span> &nbsp;` : ''}
        ${L.units.length} units &nbsp;
        <a href="${BASE}/${g.key}/${L.level}/index.html">Play ${LVL[L.level]}</a></p>
      <div class="bar"><i></i></div><div class="prog"></div>
      ${units}
    </section>`;
  }).join('');

  const totalUnits = g.levels.reduce((n, l) => n + l.units.length, 0);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(g.name)} &mdash; Player Guidebook | Honeytreat Trade Academy</title>
<style>${CSS}</style></head>
<body data-game="${esc(g.key)}">
<header class="top"><div class="wrap">
  <p class="eyebrow"><a href="../index.html" style="color:inherit;text-decoration:none">Honeytreat Trade Academy</a> &middot; Player Guidebook</p>
  <h1>${esc(g.name)}</h1><p class="sub">${esc(g.trade)}</p>
  <div class="badges">
    ${g.track ? `<span class="badge">${esc(g.track)} track</span>` : ''}
    <span class="badge">${g.levels.length} levels</span>
    <span class="badge">${totalUnits} units</span>
    <span class="badge">Learn by doing &mdash; no quizzes</span>
  </div>
</div></header>

<div class="layout">
<nav class="toc">
  <div class="lbl">Guidebook</div>
  <a href="#about">About this game</a>
  <a href="#howtoplay">How to play</a>
  <a href="#learn">What you will learn</a>
  <a href="#assessment">How you are assessed</a>
  <div class="lbl">Play</div>
  ${g.levels.map(L => `<a href="${BASE}/${g.key}/${L.level}/index.html">${LVL[L.level]}</a>`).join('')}
</nav>

<main>
<h2 id="about">About this game</h2>
<div class="card">
  <p class="lead">${esc(g.name)} teaches <b>${esc(g.trade)}</b> by putting you on a working site as an apprentice.
  You walk around, talk to the people who work there, and carry out the real tasks of the trade at real
  workstations. There are no multiple-choice questions anywhere: you are assessed on the work you actually do.</p>
  <div class="toolbar">
    <button class="btn" id="printme">${I('print')} Print / save as PDF</button>
  </div>
</div>

${howToPlay(g)}

<h2 id="learn">What you will learn</h2>
<p class="lead">Every unit is completed by doing the job. The objectives below are exactly the ones the game checks.
Tick them off as you go &mdash; your progress is saved in this browser.</p>
<div class="tabs" role="tablist">${tabs}</div>
<div class="toolbar">
  <span class="srch">${I('search')}<input id="q" type="search" placeholder="Search units and objectives..." aria-label="Search units"></span>
  <button class="btn" id="expand">Expand all units</button>
</div>
${panes}

<h2 id="assessment">How you are assessed</h2>
<div class="card"><ul class="rowlist">
  <li>${I('check')}<div><b>By your actions, not your answers</b><span class="d">Every objective is a check against
    what you have actually done &mdash; the right PPE on, the mix at the right consistency, the delivery sorted
    correctly. Nothing to memorise, nothing to guess.</span></div></li>
  <li>${I('target')}<div><b>The Standard percentage</b><span class="d">The figure in the top bar rises as you
    demonstrate competence. It records the quality of what you did, not just that you finished.</span></div></li>
  <li>${I('medal')}<div><b>Your certificate level</b><span class="d">The completion screen shows the standard you
    reached, and the certification board in the office records it.</span></div></li>
  <li>${I('person')}<div><b>You can retry</b><span class="d">Nothing is lost by getting something wrong. Reopen the
    station and do it properly &mdash; the objective ticks when the work is right.</span></div></li>
</ul></div>

<footer>
  <p><b>${esc(g.name)}</b> &mdash; ${esc(g.trade)}${g.track ? ` &middot; ${esc(g.track)} track` : ''}</p>
  <p>Honeytreat Trade Academy &mdash; Game-Based Learning. <a href="../index.html">All guidebooks</a></p>
</footer>
</main></div>
<button id="top" aria-label="Back to top"><svg viewBox="0 0 24 24">${ico.up}</svg></button>
<script>${DEMOJS}</script>
</body></html>`;
}

/* ------------------------------------------------------------- hub page --- */
function hubPage(games) {
  const byTrack = {};
  for (const g of games) (byTrack[g.track || 'Other'] ||= []).push(g);
  const order = ['Agriculture', 'Construction', 'Health & Safety', 'Digital Skills', 'Entertainment & Creative', 'Soft Skills & Enterprise'];
  const tracks = Object.keys(byTrack).sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  const totalUnits = games.reduce((n, g) => n + g.levels.reduce((m, l) => m + l.units.length, 0), 0);
  const totalLevels = games.reduce((n, g) => n + g.levels.length, 0);

  const sections = tracks.map(t => `
  <h2 data-track>${esc(t)}</h2>
  <div class="grid">${byTrack[t].map(g => `<a class="gcard" data-name="${esc(g.name + ' ' + g.trade + ' ' + t)}" href="${encodeURIComponent(g.name)}/index.html">
    <b>${esc(g.name)}</b><span>${esc(g.trade)}</span>
    <span class="trk">${g.levels.length} levels &middot; ${g.levels.reduce((n, l) => n + l.units.length, 0)} units</span></a>`).join('')}</div>`).join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Player Guidebooks | Honeytreat Trade Academy</title>
<style>${CSS}</style></head><body>
<header class="top"><div class="wrap">
  <p class="eyebrow">Honeytreat Trade Academy</p>
  <h1>Player Guidebooks</h1>
  <p class="sub">How to play every game, and what each one teaches.</p>
  <div class="badges"><span class="badge">${games.length} games</span>
    <span class="badge">${totalLevels} levels</span><span class="badge">${totalUnits} units</span></div>
</div></header>
<div class="wrap" style="padding-bottom:90px">
  <div class="card" style="margin-top:26px">
    <p class="lead">Every game is an explorable world, not a quiz. You play an apprentice: you walk the site, talk to
    the people who work there, and do the real tasks of the trade. Each guidebook explains the controls in full
    &mdash; with a <b>live joystick you can try</b> &mdash; and lists exactly what that game teaches, unit by unit.</p>
    <div class="toolbar"><span class="srch">${I('search')}<input id="gq" type="search" placeholder="Search games or trades..." aria-label="Search games"></span></div>
  </div>
  ${sections}
  <footer><p>Honeytreat Trade Academy &mdash; Game-Based Learning.</p></footer>
</div>
<button id="top" aria-label="Back to top"><svg viewBox="0 0 24 24">${ico.up}</svg></button>
<script>
(function(){
  var q=document.getElementById('gq');
  if(q) q.addEventListener('input',function(){
    var s=q.value.trim().toLowerCase();
    [].forEach.call(document.querySelectorAll('.gcard'),function(c){
      c.style.display = (!s || c.dataset.name.toLowerCase().indexOf(s)>=0) ? '' : 'none';
    });
    [].forEach.call(document.querySelectorAll('h2[data-track]'),function(h){
      var grid=h.nextElementSibling, any=[].some.call(grid.querySelectorAll('.gcard'),function(c){return c.style.display!=='none';});
      h.style.display=any?'':'none'; grid.style.display=any?'':'none';
    });
  });
  var top=document.getElementById('top');
  if(top){ top.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
    window.addEventListener('scroll',function(){ top.classList.toggle('show', window.scrollY>500); }); }
})();
</script>
</body></html>`;
}

/* ------------------------------------------------------------------ run --- */
const data = await collect();
fs.mkdirSync(OUT, { recursive: true });
for (const g of data) {
  const dir = path.join(OUT, g.name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), gamePage(g), 'utf8');
}
fs.writeFileSync(path.join(OUT, 'index.html'), hubPage(data), 'utf8');
const units = data.reduce((n, g) => n + g.levels.reduce((m, l) => m + l.units.length, 0), 0);
const levels = data.reduce((n, g) => n + g.levels.length, 0);
console.log(`wrote ${data.length} guidebooks + hub  (${levels} levels, ${units} units)`);
const empty = data.flatMap(g => g.levels.filter(l => !l.units.length).map(l => `${g.key}/${l.level}`));
console.log(empty.length ? `WARNING empty levels: ${empty.join(', ')}` : 'all levels have units');
