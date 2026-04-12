const DEFAULT_DATA = {
  pinned: [],
  groups: [
    { id: "social", name: "社交", sites: [
      { id: "s1", name: "微博", desc: "中文社交平台", url: "https://weibo.com", icon: "https://favicon.im/weibo.com" },
      { id: "s2", name: "Twitter / X", desc: "全球社交媒体", url: "https://x.com", icon: "https://favicon.im/x.com" }
    ]},
    { id: "tech", name: "技术", sites: [
      { id: "t1", name: "GitHub", desc: "代码托管平台", url: "https://github.com", icon: "https://favicon.im/github.com" },
      { id: "t2", name: "Stack Overflow", desc: "技术问答社区", url: "https://stackoverflow.com", icon: "https://favicon.im/stackoverflow.com" }
    ]},
    { id: "design", name: "设计", sites: [
      { id: "d1", name: "Dribbble", desc: "设计师作品集", url: "https://dribbble.com", icon: "https://favicon.im/dribbble.com" },
      { id: "d2", name: "Figma", desc: "UI 设计协作", url: "https://figma.com", icon: "https://favicon.im/figma.com" }
    ]}
  ]
};

/* ─── 公共 CSS ─── */
const COMMON_CSS = `
:root{
  --bg:#f5f5f0;--surface:#ffffff;--border:#e4e4de;--text:#1c1c18;
  --muted:#8a8a82;--accent:#2563eb;--accent-dim:rgba(37,99,235,0.07);
  --danger:#ef4444;--danger-dim:rgba(239,68,68,0.08);
  --shadow:0 1px 4px rgba(0,0,0,0.07);--radius:10px;
}
[data-theme="dark"]{
  --bg:#0f0f11;--surface:#18181b;--border:#2a2a2e;--text:#f2f2f0;
  --muted:#6e6e78;--accent:#60a5fa;--accent-dim:rgba(96,165,250,0.1);
  --danger:#f87171;--danger-dim:rgba(248,113,113,0.1);
  --shadow:0 1px 4px rgba(0,0,0,0.3);
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans SC',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;transition:background .25s,color .25s}
header{display:flex;align-items:center;justify-content:space-between;padding:16px 32px;border-bottom:1px solid var(--border);background:var(--bg);position:sticky;top:0;z-index:50}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--text);text-decoration:none;letter-spacing:-0.5px}
.logo em{color:var(--accent);font-style:normal}
.hdr-right{display:flex;align-items:center;gap:8px}
.icon-btn{width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:var(--shadow);flex-shrink:0}
.icon-btn:hover{border-color:var(--accent);color:var(--accent)}
main{max-width:900px;margin:0 auto;padding:44px 24px 80px}
.search-wrap{margin-bottom:24px}
.search-box{display:flex;align-items:stretch;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);transition:border-color .2s,box-shadow .2s}
.search-box:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}
.search-input{flex:1;padding:13px 16px;background:none;border:none;outline:none;color:var(--text);font-size:15px;font-family:'Noto Sans SC',sans-serif}
.search-input::placeholder{color:var(--muted)}
.search-btn{padding:0 16px;background:none;border:none;border-left:1px solid var(--border);color:var(--muted);cursor:pointer;display:flex;align-items:center;transition:color .2s,background .2s}
.search-btn:hover{color:var(--accent);background:var(--accent-dim)}
.pills{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.pill{padding:4px 12px;border-radius:20px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:11px;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:.3px;cursor:pointer;transition:all .2s}
.pill.active{border-color:var(--accent);color:var(--accent);background:var(--accent-dim)}
.pill:hover:not(.active){border-color:var(--text);color:var(--text)}
#pinned-section{display:none;margin-bottom:20px}
.section-label{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:8px}
.section-label::after{content:'';flex:1;height:1px;background:var(--border)}
.pinned-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}
.groups{display:flex;flex-direction:column;gap:8px}
.group{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
.group-hd{display:flex;align-items:center;padding:12px 18px;user-select:none;transition:background .15s;cursor:pointer}
.group-hd:hover{background:var(--accent-dim)}
.group-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-right:8px}
.group-name-text{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);flex:1}
.group-count{font-family:'Syne',sans-serif;font-size:10px;color:var(--muted);opacity:.55;margin-right:8px}
.group-chevron{color:var(--muted);font-size:10px;transition:transform .25s;flex-shrink:0}
.group.open .group-chevron{transform:rotate(180deg)}
.group-bd{display:none;padding:4px 14px 14px;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}
.group.open .group-bd{display:grid}
.site-card{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;border:1px solid var(--border);color:var(--text);transition:all .2s;background:var(--bg);cursor:pointer;user-select:none}
.site-card:hover{border-color:var(--accent);background:var(--accent-dim);transform:translateY(-1px);box-shadow:var(--shadow)}
.site-icon{width:28px;height:28px;border-radius:6px;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;overflow:hidden}
.site-icon img{width:100%;height:100%;object-fit:cover;border-radius:6px}
.site-info{overflow:hidden;flex:1;min-width:0}
.site-name{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.site-desc{font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.site-from{font-size:9px;color:var(--accent);font-family:'Syne',sans-serif;font-weight:700;letter-spacing:.5px;margin-top:2px;opacity:.8}
#toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);padding:10px 18px;background:var(--text);color:var(--bg);border-radius:8px;font-size:13px;z-index:400;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap}
#toast.show{transform:translateX(-50%) translateY(0);opacity:1}
`;

/* ─── Admin 专用 CSS ─── */
const ADMIN_CSS = `
.admin-badge{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;padding:3px 8px;border-radius:5px;border:1px solid var(--accent);color:var(--accent);background:var(--accent-dim)}
.save-btn{font-family:'Noto Sans SC',sans-serif;font-size:13px;padding:0 16px;height:36px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer;transition:opacity .2s;box-shadow:var(--shadow)}
.save-btn:hover{opacity:.85}
.save-btn:disabled{opacity:.45;cursor:not-allowed}
.ctx-menu{position:fixed;background:var(--surface);border:1px solid var(--border);border-radius:9px;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:200;min-width:155px;padding:4px;display:none}
.ctx-menu.visible{display:block}
.ctx-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:6px;font-size:13px;cursor:pointer;transition:background .15s;color:var(--text);white-space:nowrap}
.ctx-item:hover{background:var(--accent-dim);color:var(--accent)}
.ctx-item.danger{color:var(--danger)}
.ctx-item.danger:hover{background:var(--danger-dim);color:var(--danger)}
.ctx-item .ci{font-size:13px;width:16px;text-align:center;flex-shrink:0}
.ctx-divider{height:1px;background:var(--border);margin:3px 0}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:150;display:none;align-items:center;justify-content:center;backdrop-filter:blur(2px)}
.overlay.visible{display:flex}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;width:min(420px,90vw);box-shadow:0 16px 40px rgba(0,0,0,0.15)}
.modal-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;margin-bottom:18px}
.form-group{margin-bottom:13px}
.form-label{font-size:10px;font-weight:500;color:var(--muted);letter-spacing:.5px;text-transform:uppercase;display:block;margin-bottom:5px}
.form-input{width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:13px;font-family:'Noto Sans SC',sans-serif;outline:none;transition:border-color .2s}
.form-input:focus{border-color:var(--accent)}
select.form-input option{background:var(--surface)}
.icon-row{display:flex;align-items:center;gap:10px;margin-top:6px}
.icon-prev{width:32px;height:32px;border-radius:7px;background:var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.icon-prev img{width:100%;height:100%;object-fit:cover}
.modal-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
.btn{padding:8px 16px;border-radius:7px;font-size:13px;font-family:'Noto Sans SC',sans-serif;cursor:pointer;border:1px solid var(--border);transition:all .2s}
.btn-ghost{background:transparent;color:var(--text)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}
.btn-primary:hover{opacity:.85}
.pw-hint{font-size:11px;color:var(--muted);margin-top:5px}
.pw-hint.error{color:var(--danger)}
.drag-list{display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto}
.drag-item{display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;cursor:grab;transition:all .2s;user-select:none}
.drag-item:hover{border-color:var(--accent);background:var(--accent-dim)}
.drag-item.is-drag-over{border-color:var(--accent);border-style:dashed;background:var(--accent-dim)}
.drag-item.is-dragging{opacity:.35}
.drag-handle{color:var(--muted);font-size:15px;cursor:grab;flex-shrink:0}
.drag-icon{width:24px;height:24px;border-radius:5px;background:var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.drag-icon img{width:100%;height:100%;object-fit:cover}
.move-list{display:flex;flex-direction:column;gap:6px}
.move-item{padding:9px 14px;border-radius:7px;border:1px solid var(--border);cursor:pointer;font-size:13px;transition:all .2s;background:var(--bg)}
.move-item:hover{border-color:var(--accent);background:var(--accent-dim);color:var(--accent)}
.move-item.current{opacity:.4;cursor:not-allowed;pointer-events:none}
#login-overlay{position:fixed;inset:0;background:var(--bg);z-index:500;display:flex;align-items:center;justify-content:center}
#login-overlay.hidden{display:none}
.login-box{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:32px;width:min(360px,90vw);box-shadow:0 16px 40px rgba(0,0,0,0.12)}
.login-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:6px}
.login-sub{font-size:12px;color:var(--muted);margin-bottom:24px}
`;

/* ─── 公共 JS ─── */
const COMMON_JS = (defaultDataJson, isAdmin) => `
var IS_ADMIN=${isAdmin};
var state={pinned:[],groups:[]};
var activeEngine=0;
var engines=[
  {label:'百度',url:'https://www.baidu.com/s?wd='},
  {label:'Google',url:'https://www.google.com/search?q='},
  {label:'GitHub',url:'https://github.com/search?q='}
];

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function uid(){return 'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function findSite(sid,gid){var g=state.groups.find(function(x){return x.id===gid;});return g?g.sites.find(function(x){return x.id===sid;}):null;}
function removeSite(sid,gid){var g=state.groups.find(function(x){return x.id===gid;});if(!g)return null;var i=g.sites.findIndex(function(x){return x.id===sid;});return i===-1?null:g.sites.splice(i,1)[0];}
function getDomain(url){try{return new URL(url.startsWith('http')?url:'https://'+url).hostname.replace(/^www\\./,'');}catch(e){return '';}}
function showToast(msg,isErr){
  var t=document.getElementById('toast');
  t.textContent=msg;
  t.style.background=isErr?'var(--danger)':'var(--text)';
  t.classList.add('show');clearTimeout(t._tid);
  t._tid=setTimeout(function(){t.classList.remove('show');},2600);
}

/* favicon：favicon.im 失败则回退首字母 */
function makeIcon(icon,name){
  var d=document.createElement('div');d.className='site-icon';
  if(icon){
    var img=document.createElement('img');img.alt='';
    img.onerror=function(){d.innerHTML='';d.textContent=name?name[0]:'?';};
    img.src=icon;d.appendChild(img);
  }else{d.textContent=name?name[0]:'?';}
  return d;
}

/* 主题持久化 */
(function(){if(localStorage.getItem('nav_theme')==='dark')document.documentElement.setAttribute('data-theme','dark');})();
document.getElementById('theme-btn').onclick=function(){
  var dark=document.documentElement.hasAttribute('data-theme');
  if(dark){document.documentElement.removeAttribute('data-theme');this.textContent='🌙';localStorage.setItem('nav_theme','light');}
  else{document.documentElement.setAttribute('data-theme','dark');this.textContent='☀️';localStorage.setItem('nav_theme','dark');}
};
(function(){if(localStorage.getItem('nav_theme')==='dark')document.getElementById('theme-btn').textContent='☀️';})();

/* 渲染 */
function render(){renderPills();renderPinned();renderGroups();}
function renderPills(){
  var el=document.getElementById('pills');el.innerHTML='';
  engines.forEach(function(e,i){
    var p=document.createElement('span');p.className='pill'+(i===activeEngine?' active':'');p.textContent=e.label;
    p.onclick=function(){activeEngine=i;renderPills();};el.appendChild(p);
  });
}
function renderPinned(){
  var sec=document.getElementById('pinned-section'),grid=document.getElementById('pinned-grid');
  if(!state.pinned||!state.pinned.length){sec.style.display='none';return;}
  sec.style.display='block';grid.innerHTML='';
  state.pinned.forEach(function(p){
    var grp=state.groups.find(function(g){return g.id===p.fromGroup;});
    grid.appendChild(buildCard(p,p.fromGroup,true,grp?grp.name:''));
  });
}
function renderGroups(){
  var c=document.getElementById('groups');c.innerHTML='';
  state.groups.forEach(function(g){c.appendChild(buildGroup(g));});
}
function buildGroup(group){
  var wrap=document.createElement('div');wrap.className='group'+(group.open?' open':'');wrap.id='grp-'+group.id;
  var hd=document.createElement('div');hd.className='group-hd';
  hd.innerHTML='<span class="group-dot"></span>'
    +'<span class="group-name-text">'+esc(group.name)+'</span>'
    +'<span class="group-count">('+group.sites.length+')</span>'
    +'<span class="group-chevron">▼</span>';
  hd.onclick=function(){group.open=!group.open;wrap.classList.toggle('open');};
  if(IS_ADMIN)hd.addEventListener('contextmenu',function(e){e.preventDefault();showGroupCtx(e.clientX,e.clientY,group.id);});
  var bd=document.createElement('div');bd.className='group-bd';
  group.sites.forEach(function(site){bd.appendChild(buildCard(site,group.id,false,''));});
  wrap.appendChild(hd);wrap.appendChild(bd);
  return wrap;
}
function buildCard(site,groupId,isPinned,fromName){
  var card=document.createElement('div');card.className='site-card';card.dataset.siteId=site.id;card.dataset.groupId=groupId;
  card.appendChild(makeIcon(site.icon,site.name));
  var info=document.createElement('div');info.className='site-info';
  var nm=document.createElement('div');nm.className='site-name';nm.textContent=site.name;info.appendChild(nm);
  if(site.desc){var ds=document.createElement('div');ds.className='site-desc';ds.textContent=site.desc;info.appendChild(ds);}
  if(isPinned&&fromName){var fr=document.createElement('div');fr.className='site-from';fr.textContent=fromName;info.appendChild(fr);}
  card.appendChild(info);
  card.onclick=function(e){if(!e._block)window.open(site.url,'_blank');};
  if(IS_ADMIN)card.addEventListener('contextmenu',function(e){e.preventDefault();e._block=true;showSiteCtx(e.clientX,e.clientY,site.id,groupId,isPinned);});
  return card;
}

/* 搜索 */
document.getElementById('search-btn').onclick=doSearch;
document.getElementById('search-input').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});
function doSearch(){var q=document.getElementById('search-input').value.trim();if(!q)return;window.open(engines[activeEngine].url+encodeURIComponent(q),'_blank');}

/* 数据加载（admin 验证后调用，viewer 直接调用） */
function loadData(){
  fetch('/api/data').then(function(r){return r.json();}).then(function(d){
    window._loadedAt=d._savedAt||0; // 记录服务端时间戳，用于冲突检测
    state=d;state.groups.forEach(function(g){g.open=false;});render();
  }).catch(function(){
    state=JSON.parse(JSON.stringify(${defaultDataJson}));
    state.groups.forEach(function(g){g.open=false;});render();
  });
}
`;

/* ─── Admin 专用 JS ─── */
const ADMIN_JS = () => `
var siteCtx=null,groupCtxId=null,sortGroupId=null;
var siteModalMode='add',groupModalMode='add';
var dragSiteIdx=null,dragGroupIdx=null;
var adminPassword='';

/* 登录 */
document.getElementById('login-form').onsubmit=function(e){
  e.preventDefault();
  var pw=document.getElementById('login-pw').value;
  var hint=document.getElementById('login-hint');
  var btn=document.getElementById('login-btn');
  btn.disabled=true;btn.textContent='验证中…';
  fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})})
  .then(function(r){
    btn.disabled=false;btn.textContent='进入管理';
    if(r.ok){
      adminPassword=pw;
      document.getElementById('login-overlay').classList.add('hidden');
      loadData();
    }else{
      hint.textContent='密码错误，请重试';hint.classList.add('error');
      document.getElementById('login-pw').value='';document.getElementById('login-pw').focus();
    }
  }).catch(function(){
    btn.disabled=false;btn.textContent='进入管理';
    hint.textContent='网络错误，请重试';hint.classList.add('error');
  });
};

/* 保存到 KV */
document.getElementById('save-btn').onclick=function(){
  var btn=this;btn.disabled=true;btn.textContent='保存中…';
  var payload=JSON.parse(JSON.stringify(state));
  payload.groups.forEach(function(g){delete g.open;});
  payload._savedAt=window._loadedAt||0; // 带上客户端拉取时间戳供服务端冲突检测
  fetch('/api/data',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+adminPassword},
    body:JSON.stringify(payload)
  }).then(function(r){
    btn.disabled=false;btn.textContent='保存';
    if(r.ok){
      window._loadedAt=Date.now(); // 更新本地时间戳
      showToast('已保存到云端 ✓');
    }else if(r.status===409){showToast('数据已被他处修改，请刷新后重试',true);}
    else if(r.status===401){showToast('密码已失效，请刷新页面重新登录',true);}
    else{showToast('保存失败，请重试',true);}
  }).catch(function(){btn.disabled=false;btn.textContent='保存';showToast('网络错误',true);});
};

/* 关闭工具 */
function closeCtx(){document.getElementById('site-ctx').classList.remove('visible');document.getElementById('group-ctx').classList.remove('visible');siteCtx=null;groupCtxId=null;}
function closeModals(){['site-overlay','group-overlay','sort-overlay','move-overlay','greorder-overlay'].forEach(function(id){document.getElementById(id).classList.remove('visible');});}
document.addEventListener('click',function(e){if(!document.getElementById('site-ctx').contains(e.target)&&!document.getElementById('group-ctx').contains(e.target))closeCtx();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeCtx();closeModals();}});

/* 站点右键菜单 */
function showSiteCtx(x,y,sid,gid,isPinned){
  closeCtx();siteCtx={siteId:sid,groupId:gid,isPinned:isPinned};
  var pinned=state.pinned.some(function(p){return p.id===sid;});
  document.getElementById('ctx-pin-label').textContent=pinned?'取消置顶':'置顶';
  var m=document.getElementById('site-ctx');
  m.style.left=Math.min(x,window.innerWidth-165)+'px';m.style.top=Math.min(y,window.innerHeight-230)+'px';
  m.classList.add('visible');
}
document.getElementById('ctx-pin').onclick=function(){
  if(!siteCtx)return;var t=siteCtx;closeCtx();
  var idx=state.pinned.findIndex(function(p){return p.id===t.siteId;});
  if(idx!==-1){state.pinned.splice(idx,1);showToast('已取消置顶');}
  else{var s=findSite(t.siteId,t.groupId);if(s)state.pinned.push(Object.assign({},s,{fromGroup:t.groupId}));showToast('已置顶');}
  render();
};
document.getElementById('ctx-edit').onclick=function(){if(!siteCtx)return;var t=siteCtx;closeCtx();openSiteModal('edit',t.siteId,t.groupId);};
document.getElementById('ctx-sort').onclick=function(){if(!siteCtx)return;var gid=siteCtx.groupId;closeCtx();openSortModal(gid);};
document.getElementById('ctx-move').onclick=function(){
  if(!siteCtx)return;if(siteCtx.isPinned){showToast('请在原分类内操作');closeCtx();return;}
  var t=siteCtx;closeCtx();openMoveModal(t.siteId,t.groupId);
};
document.getElementById('ctx-del').onclick=function(){
  if(!siteCtx)return;var t=siteCtx;closeCtx();
  document.querySelectorAll('.site-card').forEach(function(c){
    if(c.dataset.siteId===t.siteId){c.style.borderColor='var(--danger)';c.style.background='var(--danger-dim)';c.style.color='var(--danger)';}
  });
  setTimeout(function(){
    if(t.isPinned){state.pinned=state.pinned.filter(function(p){return p.id!==t.siteId;});}
    else{removeSite(t.siteId,t.groupId);state.pinned=state.pinned.filter(function(p){return p.id!==t.siteId;});}
    render();showToast('已删除');
  },350);
};

/* 分组右键菜单 */
function showGroupCtx(x,y,gid){
  closeCtx();groupCtxId=gid;
  var m=document.getElementById('group-ctx');
  m.style.left=Math.min(x,window.innerWidth-165)+'px';m.style.top=Math.min(y,window.innerHeight-200)+'px';
  m.classList.add('visible');
}
document.getElementById('gctx-rename').onclick=function(){if(!groupCtxId)return;var gid=groupCtxId;closeCtx();openGroupModal('edit',gid);};
document.getElementById('gctx-reorder').onclick=function(){closeCtx();openGreorderModal();};
document.getElementById('gctx-add-site').onclick=function(){if(!groupCtxId)return;var gid=groupCtxId;closeCtx();openSiteModal('add',null,gid);};
document.getElementById('gctx-add-group').onclick=function(){closeCtx();openGroupModal('add');};
document.getElementById('gctx-del').onclick=function(){
  if(!groupCtxId)return;var gid=groupCtxId;closeCtx();
  var g=state.groups.find(function(x){return x.id===gid;});if(!g)return;
  if(g.sites.length>0&&!confirm('分类"'+g.name+'"下有'+g.sites.length+'个站点，确认全部删除？'))return;
  state.pinned=state.pinned.filter(function(p){return p.fromGroup!==gid;});
  state.groups=state.groups.filter(function(x){return x.id!==gid;});
  render();showToast('"'+g.name+'" 已删除');
};

/* 站点弹窗 */
function populateSiteGroupSel(selectedGid){
  var sel=document.getElementById('s-group');sel.innerHTML='';
  state.groups.forEach(function(g){var o=document.createElement('option');o.value=g.id;o.textContent=g.name;if(g.id===selectedGid)o.selected=true;sel.appendChild(o);});
}
function updateSiteIconPrev(){
  var val=document.getElementById('s-icon').value,prev=document.getElementById('s-icon-prev');prev.innerHTML='';
  if(val){var img=document.createElement('img');img.src=val;img.onerror=function(){prev.textContent='?';};prev.appendChild(img);}else{prev.textContent='?';}
}
document.getElementById('s-url').addEventListener('blur',function(){
  var url=this.value.trim();if(!url)return;
  var domain=getDomain(url);if(!domain)return;
  if(!document.getElementById('s-icon').value){document.getElementById('s-icon').value='https://favicon.im/'+domain;updateSiteIconPrev();}
  if(!document.getElementById('s-name').value){var r=domain.split('.')[0];document.getElementById('s-name').value=r.charAt(0).toUpperCase()+r.slice(1);}
});
document.getElementById('s-icon').oninput=updateSiteIconPrev;
function openSiteModal(mode,sid,defaultGid){
  siteModalMode=mode;
  document.getElementById('site-modal-title').textContent=mode==='add'?'添加站点':'编辑站点';
  document.getElementById('s-save').textContent=mode==='add'?'添加':'保存';
  var ov=document.getElementById('site-overlay');ov._sid=sid;ov._gid=defaultGid||'';
  if(mode==='edit'&&sid){
    var site=findSite(sid,defaultGid);if(!site)return;
    document.getElementById('s-url').value=site.url||'';document.getElementById('s-name').value=site.name||'';
    document.getElementById('s-desc').value=site.desc||'';document.getElementById('s-icon').value=site.icon||'';
    populateSiteGroupSel(defaultGid);
  }else{
    document.getElementById('s-url').value='';document.getElementById('s-name').value='';
    document.getElementById('s-desc').value='';document.getElementById('s-icon').value='';
    populateSiteGroupSel(defaultGid||'');
  }
  updateSiteIconPrev();ov.classList.add('visible');
  setTimeout(function(){document.getElementById('s-url').focus();},100);
}
document.getElementById('s-cancel').onclick=function(){document.getElementById('site-overlay').classList.remove('visible');};
document.getElementById('site-overlay').onclick=function(e){if(e.target===this)this.classList.remove('visible');};
document.getElementById('s-save').onclick=function(){
  var url=document.getElementById('s-url').value.trim(),name=document.getElementById('s-name').value.trim();
  if(!url||!name){showToast('链接和名称不能为空',true);return;}
  if(!url.startsWith('http'))url='https://'+url;
  var desc=document.getElementById('s-desc').value.trim(),gid=document.getElementById('s-group').value;
  var iconVal=document.getElementById('s-icon').value.trim();
  var icon=iconVal||(getDomain(url)?'https://favicon.im/'+getDomain(url):'');
  var ov=document.getElementById('site-overlay');
  if(siteModalMode==='add'){
    var g=state.groups.find(function(x){return x.id===gid;});if(!g){showToast('请先创建一个分类',true);return;}
    g.sites.push({id:uid(),name:name,url:url,desc:desc,icon:icon});showToast('"'+name+'" 已添加');
  }else{
    var sid2=ov._sid,oldGid=ov._gid,newGid=gid;
    var site=findSite(sid2,oldGid);if(!site)return;
    site.name=name;site.url=url;site.desc=desc;site.icon=icon;
    if(newGid!==oldGid){var rv=removeSite(sid2,oldGid);var ng=state.groups.find(function(x){return x.id===newGid;});if(rv&&ng)ng.sites.push(rv);}
    var pi=state.pinned.findIndex(function(p){return p.id===sid2;});
    if(pi!==-1)state.pinned[pi]=Object.assign({},site,{fromGroup:newGid});
    showToast('已保存');
  }
  ov.classList.remove('visible');render();
};

/* 分类弹窗 */
function openGroupModal(mode,gid){
  groupModalMode=mode;
  document.getElementById('group-modal-title').textContent=mode==='add'?'添加分类':'重命名分类';
  document.getElementById('g-save').textContent=mode==='add'?'创建':'保存';
  var ov=document.getElementById('group-overlay');ov._gid=gid||null;
  document.getElementById('g-name').value=mode==='edit'&&gid?(state.groups.find(function(x){return x.id===gid;})||{}).name||'':'';
  ov.classList.add('visible');setTimeout(function(){document.getElementById('g-name').focus();},100);
}
document.getElementById('g-cancel').onclick=function(){document.getElementById('group-overlay').classList.remove('visible');};
document.getElementById('group-overlay').onclick=function(e){if(e.target===this)this.classList.remove('visible');};
document.getElementById('g-name').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('g-save').click();});
document.getElementById('g-save').onclick=function(){
  var name=document.getElementById('g-name').value.trim();if(!name){showToast('请输入分类名称',true);return;}
  var ov=document.getElementById('group-overlay');
  if(groupModalMode==='add'){state.groups.push({id:uid(),name:name,open:false,sites:[]});showToast('"'+name+'" 已创建');}
  else{var g=state.groups.find(function(x){return x.id===ov._gid;});if(g)g.name=name;showToast('已重命名');}
  ov.classList.remove('visible');render();
};

/* 站点排序 */
function openSortModal(gid){
  sortGroupId=gid;var group=state.groups.find(function(g){return g.id===gid;});if(!group)return;
  var list=document.getElementById('sort-list');list.innerHTML='';
  group.sites.forEach(function(site,i){
    var item=document.createElement('div');item.className='drag-item';item.draggable=true;item.dataset.idx=i;
    var handle=document.createElement('span');handle.className='drag-handle';handle.textContent='⠿';
    var ico=document.createElement('div');ico.className='drag-icon';
    if(site.icon){var img=document.createElement('img');img.src=site.icon;img.onerror=function(){ico.textContent=site.name[0];};ico.appendChild(img);}else{ico.textContent=site.name[0];}
    var nm=document.createElement('span');nm.textContent=site.name;nm.style.fontSize='13px';nm.style.flex='1';
    item.appendChild(handle);item.appendChild(ico);item.appendChild(nm);
    item.addEventListener('dragstart',function(e){dragSiteIdx=parseInt(this.dataset.idx);this.classList.add('is-dragging');e.dataTransfer.effectAllowed='move';});
    item.addEventListener('dragend',function(){this.classList.remove('is-dragging');list.querySelectorAll('.drag-item').forEach(function(el){el.classList.remove('is-drag-over');});});
    item.addEventListener('dragover',function(e){e.preventDefault();list.querySelectorAll('.drag-item').forEach(function(el){el.classList.remove('is-drag-over');});this.classList.add('is-drag-over');});
    item.addEventListener('drop',function(e){e.preventDefault();var to=parseInt(this.dataset.idx);var g=state.groups.find(function(x){return x.id===sortGroupId;});if(g&&dragSiteIdx!==to){var itm=g.sites.splice(dragSiteIdx,1)[0];g.sites.splice(to,0,itm);openSortModal(sortGroupId);}});
    list.appendChild(item);
  });
  document.getElementById('sort-overlay').classList.add('visible');
}
document.getElementById('sort-cancel').onclick=function(){document.getElementById('sort-overlay').classList.remove('visible');};
document.getElementById('sort-overlay').onclick=function(e){if(e.target===this)this.classList.remove('visible');};
document.getElementById('sort-save').onclick=function(){document.getElementById('sort-overlay').classList.remove('visible');render();showToast('排序已更新');};

/* 移动站点 */
function openMoveModal(sid,gid){
  var list=document.getElementById('move-list');list.innerHTML='';
  state.groups.forEach(function(g){
    var item=document.createElement('div');item.className='move-item'+(g.id===gid?' current':'');
    item.textContent=g.name+(g.id===gid?' (当前)':'');
    if(g.id!==gid){item.onclick=function(){
      var r=removeSite(sid,gid);if(r){
        g.sites.push(r);
        var pi=state.pinned.findIndex(function(p){return p.id===sid;});if(pi!==-1)state.pinned[pi].fromGroup=g.id;
        document.getElementById('move-overlay').classList.remove('visible');render();showToast('已移动到 '+g.name);
      }
    };}
    list.appendChild(item);
  });
  document.getElementById('move-overlay').classList.add('visible');
}
document.getElementById('move-cancel').onclick=function(){document.getElementById('move-overlay').classList.remove('visible');};
document.getElementById('move-overlay').onclick=function(e){if(e.target===this)this.classList.remove('visible');};

/* 分组排序 */
function openGreorderModal(){
  var list=document.getElementById('greorder-list');list.innerHTML='';
  state.groups.forEach(function(g,i){
    var item=document.createElement('div');item.className='drag-item';item.draggable=true;item.dataset.idx=i;
    var handle=document.createElement('span');handle.className='drag-handle';handle.textContent='⠿';
    var nm=document.createElement('span');nm.textContent=g.name;nm.style.fontSize='13px';nm.style.flex='1';
    var cnt=document.createElement('span');cnt.textContent=g.sites.length+' 个站点';cnt.style.fontSize='11px';cnt.style.color='var(--muted)';
    item.appendChild(handle);item.appendChild(nm);item.appendChild(cnt);
    item.addEventListener('dragstart',function(e){dragGroupIdx=parseInt(this.dataset.idx);this.classList.add('is-dragging');e.dataTransfer.effectAllowed='move';});
    item.addEventListener('dragend',function(){this.classList.remove('is-dragging');list.querySelectorAll('.drag-item').forEach(function(el){el.classList.remove('is-drag-over');});});
    item.addEventListener('dragover',function(e){e.preventDefault();list.querySelectorAll('.drag-item').forEach(function(el){el.classList.remove('is-drag-over');});this.classList.add('is-drag-over');});
    item.addEventListener('drop',function(e){e.preventDefault();var to=parseInt(this.dataset.idx);if(dragGroupIdx!==to){var itm=state.groups.splice(dragGroupIdx,1)[0];state.groups.splice(to,0,itm);openGreorderModal();}});
    list.appendChild(item);
  });
  document.getElementById('greorder-overlay').classList.add('visible');
}
document.getElementById('greorder-cancel').onclick=function(){document.getElementById('greorder-overlay').classList.remove('visible');};
document.getElementById('greorder-overlay').onclick=function(e){if(e.target===this)this.classList.remove('visible');};
document.getElementById('greorder-save').onclick=function(){document.getElementById('greorder-overlay').classList.remove('visible');render();showToast('顺序已更新');};
`;

/* ─── Viewer HTML ─── */
function getViewerHTML(defaultDataJson) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Nav.导航</title>
<link rel="icon" href="https://api.iconify.design/material-icon-theme:deepsource.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet">
<style>${COMMON_CSS}</style>
</head>
<body>
<header>
  <a class="logo" href="/">NAV<em>.</em></a>
  <div class="hdr-right"><button class="icon-btn" id="theme-btn" title="切换主题">🌙</button></div>
</header>
<main>
  <div class="search-wrap">
    <div class="search-box">
      <input class="search-input" id="search-input" type="text" placeholder="搜索…" autocomplete="off">
      <button class="search-btn" id="search-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></button>
    </div>
    <div class="pills" id="pills"></div>
  </div>
  <div id="pinned-section"><div class="section-label">📌 置顶</div><div class="pinned-grid" id="pinned-grid"></div></div>
  <div class="groups" id="groups"></div>
</main>
<div id="toast"></div>
<script>
${COMMON_JS(defaultDataJson, false)}
loadData();
</script>
</body></html>`;
}

/* ─── Admin HTML ─── */
function getAdminHTML(defaultDataJson) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Nav.管理</title>
<link rel="icon" href="https://api.iconify.design/material-icon-theme:deepsource.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet">
<style>${COMMON_CSS}${ADMIN_CSS}</style>
</head>
<body>

<!-- 登录遮罩 -->
<div id="login-overlay">
  <div class="login-box">
    <div class="login-title">NAV<em style="color:var(--accent);font-style:normal">.</em> 管理</div>
    <div class="login-sub">请输入管理密码以继续</div>
    <form id="login-form">
      <div class="form-group">
        <label class="form-label">密码</label>
        <input class="form-input" id="login-pw" type="password" placeholder="输入密码" autocomplete="current-password" autofocus>
        <div class="pw-hint" id="login-hint">验证成功后进入编辑模式</div>
      </div>
      <button class="btn btn-primary" id="login-btn" type="submit" style="width:100%;display:flex;justify-content:center">进入管理</button>
    </form>
  </div>
</div>

<header>
  <a class="logo" href="/">NAV<em>.</em></a>
  <div class="hdr-right">
    <span class="admin-badge">ADMIN</span>
    <button class="icon-btn" id="theme-btn" title="切换主题">🌙</button>
    <button class="save-btn" id="save-btn">保存</button>
  </div>
</header>

<main>
  <div class="search-wrap">
    <div class="search-box">
      <input class="search-input" id="search-input" type="text" placeholder="搜索…" autocomplete="off">
      <button class="search-btn" id="search-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></button>
    </div>
    <div class="pills" id="pills"></div>
  </div>
  <div id="pinned-section"><div class="section-label">📌 置顶</div><div class="pinned-grid" id="pinned-grid"></div></div>
  <div class="groups" id="groups"></div>
</main>

<div class="ctx-menu" id="site-ctx">
  <div class="ctx-item" id="ctx-pin"><span class="ci">📌</span><span id="ctx-pin-label">置顶</span></div>
  <div class="ctx-item" id="ctx-edit"><span class="ci">✏️</span>编辑</div>
  <div class="ctx-divider"></div>
  <div class="ctx-item" id="ctx-sort"><span class="ci">↕️</span>排序</div>
  <div class="ctx-item" id="ctx-move"><span class="ci">⇄</span>移动</div>
  <div class="ctx-divider"></div>
  <div class="ctx-item danger" id="ctx-del"><span class="ci">🗑</span>删除</div>
</div>
<div class="ctx-menu" id="group-ctx">
  <div class="ctx-item" id="gctx-rename"><span class="ci">✏️</span>重命名</div>
  <div class="ctx-item" id="gctx-reorder"><span class="ci">↕️</span>移动排序</div>
  <div class="ctx-divider"></div>
  <div class="ctx-item" id="gctx-add-site"><span class="ci">🌐</span>添加站点</div>
  <div class="ctx-item" id="gctx-add-group"><span class="ci">📁</span>添加分类</div>
  <div class="ctx-divider"></div>
  <div class="ctx-item danger" id="gctx-del"><span class="ci">🗑</span>删除分类</div>
</div>

<div class="overlay" id="site-overlay">
  <div class="modal">
    <div class="modal-title" id="site-modal-title">添加站点</div>
    <div class="form-group"><label class="form-label">链接</label><input class="form-input" id="s-url" type="text" placeholder="https://..."></div>
    <div class="form-group"><label class="form-label">名称</label><input class="form-input" id="s-name" type="text" placeholder="站点名称"></div>
    <div class="form-group"><label class="form-label">描述</label><input class="form-input" id="s-desc" type="text" placeholder="简短描述（可选）"></div>
    <div class="form-group"><label class="form-label">所属分类</label><select class="form-input" id="s-group"></select></div>
    <div class="form-group">
      <label class="form-label">图标 URL</label>
      <input class="form-input" id="s-icon" type="text" placeholder="留空则自动根据域名获取">
      <div class="icon-row"><div class="icon-prev" id="s-icon-prev">?</div><span style="font-size:11px;color:var(--muted)">预览</span></div>
    </div>
    <div class="modal-btns"><button class="btn btn-ghost" id="s-cancel">取消</button><button class="btn btn-primary" id="s-save">添加</button></div>
  </div>
</div>
<div class="overlay" id="group-overlay">
  <div class="modal" style="max-width:340px">
    <div class="modal-title" id="group-modal-title">添加分类</div>
    <div class="form-group"><label class="form-label">分类名称</label><input class="form-input" id="g-name" type="text" placeholder="例如：工具、资讯…"></div>
    <div class="modal-btns"><button class="btn btn-ghost" id="g-cancel">取消</button><button class="btn btn-primary" id="g-save">确认</button></div>
  </div>
</div>
<div class="overlay" id="sort-overlay">
  <div class="modal"><div class="modal-title">站点排序</div>
    <div class="drag-list" id="sort-list"></div>
    <div class="modal-btns"><button class="btn btn-ghost" id="sort-cancel">取消</button><button class="btn btn-primary" id="sort-save">确定</button></div>
  </div>
</div>
<div class="overlay" id="move-overlay">
  <div class="modal" style="max-width:320px"><div class="modal-title">移动到分类</div>
    <div class="move-list" id="move-list"></div>
    <div class="modal-btns"><button class="btn btn-ghost" id="move-cancel">取消</button></div>
  </div>
</div>
<div class="overlay" id="greorder-overlay">
  <div class="modal"><div class="modal-title">调整分类顺序</div>
    <div class="drag-list" id="greorder-list"></div>
    <div class="modal-btns"><button class="btn btn-ghost" id="greorder-cancel">取消</button><button class="btn btn-primary" id="greorder-save">确定</button></div>
  </div>
</div>

<div id="toast"></div>
<script>
${COMMON_JS(defaultDataJson, true)}
${ADMIN_JS()}
</script>
</body></html>`;
}

/* ─── 常量时间字符串比较 ─── */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const ba = enc.encode(a), bb = enc.encode(b);
  let diff = ba.length === bb.length ? 0 : 1;
  const len = Math.max(ba.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ba[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}

/* ─── Worker 入口 ─── */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const defaultDataJson = JSON.stringify(DEFAULT_DATA);
    const PASSWORD = env.PASSWORD || '';

    /* /api/auth */
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const { password } = await request.json();
        return timingSafeEqual(password, PASSWORD)
          ? new Response('ok')
          : new Response('unauthorized', { status: 401 });
      } catch { return new Response('bad request', { status: 400 }); }
    }

    /* /api/data */
    if (url.pathname === '/api/data') {
      if (request.method === 'GET') {
        const raw = await env.NAV_DB.get('data');
        return new Response(raw || defaultDataJson, {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
      }
      if (request.method === 'POST') {
        const auth = request.headers.get('Authorization') || '';
        const pw = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        if (!timingSafeEqual(pw, PASSWORD))
          return new Response('unauthorized', { status: 401 });

        const body = await request.text();
        let payload;
        try { payload = JSON.parse(body); }
        catch { return new Response('invalid json', { status: 400 }); }

        /* 冲突检测 */
        const existing = await env.NAV_DB.get('data');
        if (existing) {
          try {
            const serverTs = JSON.parse(existing)._savedAt || 0;
            const clientTs = payload._savedAt || 0;
            if (clientTs < serverTs)
              return new Response('conflict', { status: 409 });
          } catch { /* KV 数据损坏则覆盖 */ }
        }

        payload._savedAt = Date.now();
        await env.NAV_DB.put('data', JSON.stringify(payload));
        return new Response('ok');
      }
    }

    /* /admin */
    if (url.pathname === '/admin') {
      return new Response(getAdminHTML(defaultDataJson), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'no-store' }
      });
    }

    /* / viewer */
    return new Response(getViewerHTML(defaultDataJson), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=300' }
    });
  }
};
