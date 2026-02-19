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

function getHTML() {
return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>导航</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet">
<style>
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

/* Header */
header{display:flex;align-items:center;justify-content:space-between;padding:16px 32px;border-bottom:1px solid var(--border);background:var(--bg);position:sticky;top:0;z-index:50}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--text);text-decoration:none;letter-spacing:-0.5px}
.logo em{color:var(--accent);font-style:normal}
.hdr-right{display:flex;align-items:center;gap:8px}
.admin-badge{display:none;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(37,99,235,0.1);border:1px solid var(--accent);font-size:11px;font-family:'Syne',sans-serif;font-weight:700;color:var(--accent);letter-spacing:.5px}
[data-theme="dark"] .admin-badge{background:rgba(96,165,250,0.1)}
.admin-badge.on{display:flex}
.admin-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
.icon-btn{width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:var(--shadow)}
.icon-btn:hover{border-color:var(--accent);color:var(--accent)}
.icon-btn.active{border-color:var(--accent);color:var(--accent);background:var(--accent-dim)}

/* Main */
main{max-width:900px;margin:0 auto;padding:44px 24px 100px}

/* Search */
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

/* Pinned */
#pinned-section{display:none;margin-bottom:20px}
.section-label{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:8px}
.section-label::after{content:'';flex:1;height:1px;background:var(--border)}
.pinned-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}

/* Groups */
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

/* Site card */
.site-card{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;border:1px solid var(--border);color:var(--text);transition:all .2s;background:var(--bg);cursor:pointer;user-select:none}
.site-card:hover{border-color:var(--accent);background:var(--accent-dim);transform:translateY(-1px);box-shadow:var(--shadow)}
.site-icon{width:28px;height:28px;border-radius:6px;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;overflow:hidden}
.site-icon img{width:100%;height:100%;object-fit:cover;border-radius:6px}
.site-info{overflow:hidden;flex:1;min-width:0}
.site-name{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.site-desc{font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.site-from{font-size:9px;color:var(--accent);font-family:'Syne',sans-serif;font-weight:700;letter-spacing:.5px;margin-top:2px;opacity:.8}

/* Context menus */
.ctx-menu{position:fixed;background:var(--surface);border:1px solid var(--border);border-radius:9px;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:200;min-width:155px;padding:4px;display:none}
.ctx-menu.visible{display:block}
.ctx-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:6px;font-size:13px;cursor:pointer;transition:background .15s;color:var(--text);white-space:nowrap}
.ctx-item:hover{background:var(--accent-dim);color:var(--accent)}
.ctx-item.danger{color:var(--danger)}
.ctx-item.danger:hover{background:var(--danger-dim);color:var(--danger)}
.ctx-item .ci{font-size:13px;width:16px;text-align:center;flex-shrink:0}
.ctx-divider{height:1px;background:var(--border);margin:3px 0}

/* Overlay / Modal */
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

/* Drag list */
.drag-list{display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto}
.drag-item{display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;cursor:grab;transition:all .2s;user-select:none}
.drag-item:hover{border-color:var(--accent);background:var(--accent-dim)}
.drag-item.is-drag-over{border-color:var(--accent);border-style:dashed;background:var(--accent-dim)}
.drag-item.is-dragging{opacity:.35}
.drag-handle{color:var(--muted);font-size:15px;cursor:grab;flex-shrink:0}
.drag-icon{width:24px;height:24px;border-radius:5px;background:var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.drag-icon img{width:100%;height:100%;object-fit:cover}

/* Move */
.move-list{display:flex;flex-direction:column;gap:6px}
.move-item{padding:9px 14px;border-radius:7px;border:1px solid var(--border);cursor:pointer;font-size:13px;transition:all .2s;background:var(--bg)}
.move-item:hover{border-color:var(--accent);background:var(--accent-dim);color:var(--accent)}
.move-item.current{opacity:.4;cursor:not-allowed;pointer-events:none}

/* Password modal hint */
.pw-hint{font-size:11px;color:var(--muted);margin-top:6px}
.pw-hint.error{color:var(--danger)}

/* Save bar — fixed bottom, appears when pendingChanges in admin mode */
#save-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:120;
  display:none;
  justify-content:center;
  padding:0;
  pointer-events:none;
}
#save-bar.visible{display:flex;}
#save-bar-inner{
  display:flex;align-items:center;gap:12px;
  background:var(--surface);border:1px solid var(--border);border-bottom:none;
  border-radius:12px 12px 0 0;padding:12px 20px;
  box-shadow:0 -4px 20px rgba(0,0,0,0.1);
  pointer-events:auto;
}
.save-bar-msg{font-size:12px;color:var(--muted);font-family:'Syne',sans-serif;font-weight:700;letter-spacing:.3px}
.save-bar-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:blink 1.5s infinite;flex-shrink:0}

/* Toast */
#toast{position:fixed;bottom:60px;left:50%;transform:translateX(-50%) translateY(60px);padding:10px 18px;background:var(--text);color:var(--bg);border-radius:8px;font-size:13px;z-index:400;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap}
#toast.show{transform:translateX(-50%) translateY(0);opacity:1}
</style>
</head>
<body>

<header>
  <a class="logo" href="/">NAV<em>.</em></a>
  <div class="hdr-right">
    <div class="admin-badge" id="admin-badge"><span class="admin-dot"></span>管理中</div>
    <!-- 主题切换 -->
    <button class="icon-btn" id="theme-btn" title="切换主题">🌙</button>
    <!-- 编辑/管理模式 -->
    <button class="icon-btn" id="admin-btn" title="管理模式">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>
  </div>
</header>

<main id="main-content">
  <div class="search-wrap">
    <div class="search-box">
      <input class="search-input" id="search-input" type="text" placeholder="搜索…" autocomplete="off">
      <button class="search-btn" id="search-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </button>
    </div>
    <div class="pills" id="pills"></div>
  </div>
  <div id="pinned-section">
    <div class="section-label">📌 置顶</div>
    <div class="pinned-grid" id="pinned-grid"></div>
  </div>
  <div class="groups" id="groups"></div>
</main>

<!-- 悬浮保存条 -->
<div id="save-bar">
  <div id="save-bar-inner">
    <span class="save-bar-dot"></span>
    <span class="save-bar-msg">有未保存的更改</span>
    <button class="btn btn-ghost" id="save-discard" style="padding:5px 12px;font-size:12px">放弃</button>
    <button class="btn btn-primary" id="save-commit" style="padding:5px 14px;font-size:12px">保存到云端</button>
  </div>
</div>

<!-- 站点右键菜单 -->
<div class="ctx-menu" id="site-ctx">
  <div class="ctx-item" id="ctx-pin"><span class="ci">📌</span><span id="ctx-pin-label">置顶</span></div>
  <div class="ctx-item" id="ctx-edit"><span class="ci">✏️</span>编辑</div>
  <div class="ctx-divider"></div>
  <div class="ctx-item" id="ctx-sort"><span class="ci">↕️</span>排序</div>
  <div class="ctx-item" id="ctx-move"><span class="ci">⇄</span>移动</div>
  <div class="ctx-divider"></div>
  <div class="ctx-item danger" id="ctx-del"><span class="ci">🗑</span>删除</div>
</div>

<!-- 分组右键菜单 -->
<div class="ctx-menu" id="group-ctx">
  <div class="ctx-item" id="gctx-rename"><span class="ci">✏️</span>重命名</div>
  <div class="ctx-item" id="gctx-reorder"><span class="ci">↕️</span>移动排序</div>
  <div class="ctx-divider"></div>
  <div class="ctx-item" id="gctx-add-site"><span class="ci">🌐</span>添加站点</div>
  <div class="ctx-item" id="gctx-add-group"><span class="ci">📁</span>添加分类</div>
  <div class="ctx-divider"></div>
  <div class="ctx-item danger" id="gctx-del"><span class="ci">🗑</span>删除分类</div>
</div>

<!-- 添加/编辑站点 -->
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
    <div class="modal-btns">
      <button class="btn btn-ghost" id="s-cancel">取消</button>
      <button class="btn btn-primary" id="s-save">添加</button>
    </div>
  </div>
</div>

<!-- 添加/重命名分类 -->
<div class="overlay" id="group-overlay">
  <div class="modal" style="max-width:340px">
    <div class="modal-title" id="group-modal-title">添加分类</div>
    <div class="form-group"><label class="form-label">分类名称</label><input class="form-input" id="g-name" type="text" placeholder="例如：工具、资讯…"></div>
    <div class="modal-btns">
      <button class="btn btn-ghost" id="g-cancel">取消</button>
      <button class="btn btn-primary" id="g-save">确认</button>
    </div>
  </div>
</div>

<!-- 站点排序 -->
<div class="overlay" id="sort-overlay">
  <div class="modal"><div class="modal-title">站点排序</div>
    <div class="drag-list" id="sort-list"></div>
    <div class="modal-btns">
      <button class="btn btn-ghost" id="sort-cancel">取消</button>
      <button class="btn btn-primary" id="sort-save">确定</button>
    </div>
  </div>
</div>

<!-- 移动站点 -->
<div class="overlay" id="move-overlay">
  <div class="modal" style="max-width:320px"><div class="modal-title">移动到分类</div>
    <div class="move-list" id="move-list"></div>
    <div class="modal-btns"><button class="btn btn-ghost" id="move-cancel">取消</button></div>
  </div>
</div>

<!-- 分组排序 -->
<div class="overlay" id="greorder-overlay">
  <div class="modal"><div class="modal-title">调整分类顺序</div>
    <div class="drag-list" id="greorder-list"></div>
    <div class="modal-btns">
      <button class="btn btn-ghost" id="greorder-cancel">取消</button>
      <button class="btn btn-primary" id="greorder-save">确定</button>
    </div>
  </div>
</div>

<!-- 密码验证 -->
<div class="overlay" id="pw-modal">
  <div class="modal" style="max-width:320px">
    <div class="modal-title">🔐 进入管理模式</div>
    <div class="form-group">
      <label class="form-label">密码</label>
      <input class="form-input" id="pw-input" type="password" placeholder="输入管理密码">
      <div class="pw-hint" id="pw-hint">验证后可将修改保存到云端</div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-ghost" id="pw-cancel">取消</button>
      <button class="btn btn-primary" id="pw-confirm">验证</button>
    </div>
  </div>
</div>

<div id="toast"></div>

<script>
/* ---- state ---- */
var state={pinned:[],groups:[]};
var siteCtx=null, groupCtxId=null, sortGroupId=null;
var siteModalMode='add', groupModalMode='add';
var dragSiteIdx=null, dragGroupIdx=null;
var adminMode=false, adminPassword='';
var pendingChanges=false;
/* open state is kept in memory only, NOT in KV */
var groupOpenState={};

var engines=[
  {label:'百度',url:'https://www.baidu.com/s?wd='},
  {label:'Google',url:'https://www.google.com/search?q='},
  {label:'GitHub',url:'https://github.com/search?q='}
];
var activeEngine=0;

/* ---- Data ---- */
function loadData(){
  fetch('/api/data').then(function(r){return r.json();}).then(function(d){
    /* strip 'open' from groups — only keep in memory */
    state=d;
    state.groups.forEach(function(g){
      g.open=false; /* always collapsed on load */
    });
    render();
  }).catch(function(){
    state=JSON.parse(JSON.stringify(${JSON.stringify(DEFAULT_DATA)}));
    render();
  });
}

function saveToCloud(){
  if(!adminMode){showToast('请先进入管理模式');return;}
  /* strip open state before saving */
  var payload=JSON.parse(JSON.stringify(state));
  payload.groups.forEach(function(g){delete g.open;});
  fetch('/api/data',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+adminPassword},
    body:JSON.stringify(payload)
  }).then(function(r){
    if(r.status===401){showToast('密码已失效，请重新验证');exitAdmin();}
    else if(r.ok){pendingChanges=false;updateSaveBar();showToast('已保存到云端 ✓');}
    else{showToast('保存失败，请重试');}
  }).catch(function(){showToast('网络错误，保存失败');});
}

/* markDirty: called after every edit */
function markDirty(){
  if(adminMode){
    pendingChanges=true;
    updateSaveBar();
  } else {
    showToast('修改仅在本地有效，未保存到云端');
  }
}

/* ---- Save bar ---- */
function updateSaveBar(){
  var bar=document.getElementById('save-bar');
  bar.classList.toggle('visible', adminMode && pendingChanges);
}
document.getElementById('save-commit').onclick=function(){saveToCloud();};
document.getElementById('save-discard').onclick=function(){
  pendingChanges=false;updateSaveBar();
  /* reload from cloud to revert local changes */
  loadData();showToast('已放弃修改');
};

/* Clicking the blank left/right area (outside main) shows save bar if pending */
document.addEventListener('click',function(e){
  var main=document.getElementById('main-content');
  var inMain=main&&main.contains(e.target);
  var inOverlay=['site-overlay','group-overlay','sort-overlay','move-overlay',
    'greorder-overlay','pw-modal','save-bar','site-ctx','group-ctx']
    .some(function(id){var el=document.getElementById(id);return el&&el.contains(e.target);});
  var inHeader=document.querySelector('header').contains(e.target);
  if(!inMain&&!inOverlay&&!inHeader){
    if(adminMode&&pendingChanges){
      /* nudge save bar */
      var bar=document.getElementById('save-bar');
      bar.style.transition='none';bar.style.transform='translateY(-4px)';
      setTimeout(function(){bar.style.transition='';bar.style.transform='';},200);
    }
  }
  /* close ctx menus */
  if(!document.getElementById('site-ctx').contains(e.target)&&
     !document.getElementById('group-ctx').contains(e.target))closeCtx();
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closeCtx();closeModals();}
});

/* ---- Admin ---- */
function enterAdmin(pw){
  adminMode=true;adminPassword=pw;
  document.getElementById('admin-badge').classList.add('on');
  document.getElementById('admin-btn').classList.add('active');
  showToast('管理模式已开启，修改将可保存到云端');
}
function exitAdmin(){
  if(pendingChanges&&!confirm('有未保存的更改，确认退出管理模式？将丢失修改。'))return;
  adminMode=false;adminPassword='';pendingChanges=false;
  document.getElementById('admin-badge').classList.remove('on');
  document.getElementById('admin-btn').classList.remove('active');
  updateSaveBar();
  showToast('已退出管理模式');
}
document.getElementById('admin-btn').onclick=function(){
  if(adminMode)exitAdmin();else openPwModal();
};

/* ---- Theme ---- */
document.getElementById('theme-btn').onclick=function(){
  var dark=document.documentElement.hasAttribute('data-theme');
  if(dark){document.documentElement.removeAttribute('data-theme');this.textContent='🌙';}
  else{document.documentElement.setAttribute('data-theme','dark');this.textContent='☀️';}
};

/* ---- Password Modal ---- */
function openPwModal(){
  document.getElementById('pw-input').value='';
  document.getElementById('pw-hint').textContent='验证后可将修改保存到云端';
  document.getElementById('pw-hint').classList.remove('error');
  document.getElementById('pw-modal').classList.add('visible');
  setTimeout(function(){document.getElementById('pw-input').focus();},100);
}
document.getElementById('pw-cancel').onclick=function(){document.getElementById('pw-modal').classList.remove('visible');};
document.getElementById('pw-modal').onclick=function(e){if(e.target===this)this.classList.remove('visible');};
document.getElementById('pw-input').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('pw-confirm').click();});
document.getElementById('pw-confirm').onclick=function(){
  var pw=document.getElementById('pw-input').value;
  if(!pw){document.getElementById('pw-hint').textContent='请输入密码';document.getElementById('pw-hint').classList.add('error');return;}
  fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})})
  .then(function(r){
    if(r.ok){document.getElementById('pw-modal').classList.remove('visible');enterAdmin(pw);}
    else{document.getElementById('pw-hint').textContent='密码错误，请重试';document.getElementById('pw-hint').classList.add('error');document.getElementById('pw-input').value='';document.getElementById('pw-input').focus();}
  }).catch(function(){document.getElementById('pw-hint').textContent='验证失败，请检查网络';document.getElementById('pw-hint').classList.add('error');});
};

/* ---- Utils ---- */
function uid(){return 'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function findSite(sid,gid){var g=state.groups.find(function(x){return x.id===gid;});return g?g.sites.find(function(x){return x.id===sid;}):null;}
function removeSite(sid,gid){var g=state.groups.find(function(x){return x.id===gid;});if(!g)return null;var i=g.sites.findIndex(function(x){return x.id===sid;});return i===-1?null:g.sites.splice(i,1)[0];}
function getDomain(url){try{return new URL(url.startsWith('http')?url:'https://'+url).hostname.replace(/^www\./,'');}catch(e){return '';}}
function showToast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2600);}
function makeIcon(icon,name){var d=document.createElement('div');d.className='site-icon';if(icon){var img=document.createElement('img');img.src=icon;img.alt='';img.onerror=function(){d.textContent=name?name[0]:'?';};d.appendChild(img);}else{d.textContent=name?name[0]:'?';}return d;}
function closeCtx(){document.getElementById('site-ctx').classList.remove('visible');document.getElementById('group-ctx').classList.remove('visible');siteCtx=null;groupCtxId=null;}
function closeModals(){['site-overlay','group-overlay','sort-overlay','move-overlay','greorder-overlay','pw-modal'].forEach(function(id){document.getElementById(id).classList.remove('visible');});}

/* ---- Render ---- */
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
  if(!state.pinned||state.pinned.length===0){sec.style.display='none';return;}
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
  /* open state lives only in group.open (in-memory, not persisted) */
  var isOpen=!!group.open;
  var wrap=document.createElement('div');wrap.className='group'+(isOpen?' open':'');wrap.id='grp-'+group.id;
  var hd=document.createElement('div');hd.className='group-hd';
  hd.innerHTML='<span class="group-dot"></span>'
    +'<span class="group-name-text">'+group.name+'</span>'
    +'<span class="group-count">('+group.sites.length+')</span>'
    +'<span class="group-chevron">▼</span>';
  hd.onclick=function(){group.open=!group.open;wrap.classList.toggle('open');};
  hd.addEventListener('contextmenu',function(e){e.preventDefault();showGroupCtx(e.clientX,e.clientY,group.id);});
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
  card.addEventListener('contextmenu',function(e){e.preventDefault();e._block=true;showSiteCtx(e.clientX,e.clientY,site.id,groupId,isPinned);});
  return card;
}

/* ---- Site ctx ---- */
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
  else{var s=findSite(t.siteId,t.groupId);if(s){state.pinned.push(Object.assign({},s,{fromGroup:t.groupId}));showToast('已置顶');}}
  markDirty();render();
};
document.getElementById('ctx-edit').onclick=function(){
  if(!siteCtx)return;var t=siteCtx;closeCtx();openSiteModal('edit',t.siteId,t.groupId);
};
document.getElementById('ctx-sort').onclick=function(){
  if(!siteCtx)return;var gid=siteCtx.groupId;closeCtx();openSortModal(gid);
};
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
    markDirty();render();showToast('已删除');
  },350);
};

/* ---- Group ctx ---- */
function showGroupCtx(x,y,gid){
  closeCtx();groupCtxId=gid;
  var m=document.getElementById('group-ctx');
  m.style.left=Math.min(x,window.innerWidth-165)+'px';m.style.top=Math.min(y,window.innerHeight-200)+'px';
  m.classList.add('visible');
}
document.getElementById('gctx-rename').onclick=function(){
  if(!groupCtxId)return;var gid=groupCtxId;closeCtx();openGroupModal('edit',gid);
};
document.getElementById('gctx-reorder').onclick=function(){closeCtx();openGreorderModal();};
document.getElementById('gctx-add-site').onclick=function(){
  if(!groupCtxId)return;var gid=groupCtxId;closeCtx();openSiteModal('add',null,gid);
};
document.getElementById('gctx-add-group').onclick=function(){closeCtx();openGroupModal('add');};
document.getElementById('gctx-del').onclick=function(){
  if(!groupCtxId)return;var gid=groupCtxId;closeCtx();
  var g=state.groups.find(function(x){return x.id===gid;});if(!g)return;
  if(g.sites.length>0&&!confirm('分类"'+g.name+'"下有'+g.sites.length+'个站点，确认全部删除？'))return;
  state.pinned=state.pinned.filter(function(p){return p.fromGroup!==gid;});
  state.groups=state.groups.filter(function(x){return x.id!==gid;});
  markDirty();render();showToast('"'+g.name+'" 已删除');
};

/* ---- Site Modal ---- */
function populateSiteGroupSel(selectedGid){
  var sel=document.getElementById('s-group');sel.innerHTML='';
  state.groups.forEach(function(g){
    var o=document.createElement('option');o.value=g.id;o.textContent=g.name;
    if(g.id===selectedGid)o.selected=true;sel.appendChild(o);
  });
}
function updateSiteIconPrev(){
  var val=document.getElementById('s-icon').value,prev=document.getElementById('s-icon-prev');prev.innerHTML='';
  if(val){var img=document.createElement('img');img.src=val;img.onerror=function(){prev.textContent='?';};prev.appendChild(img);}
  else{prev.textContent='?';}
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
    document.getElementById('s-url').value=site.url||'';
    document.getElementById('s-name').value=site.name||'';
    document.getElementById('s-desc').value=site.desc||'';
    document.getElementById('s-icon').value=site.icon||'';
    populateSiteGroupSel(defaultGid);
  } else {
    document.getElementById('s-url').value='';document.getElementById('s-name').value='';
    document.getElementById('s-desc').value='';document.getElementById('s-icon').value='';
    populateSiteGroupSel(defaultGid||'');
  }
  updateSiteIconPrev();
  ov.classList.add('visible');
  setTimeout(function(){document.getElementById('s-url').focus();},100);
}
document.getElementById('s-cancel').onclick=function(){document.getElementById('site-overlay').classList.remove('visible');};
document.getElementById('site-overlay').onclick=function(e){if(e.target===this)this.classList.remove('visible');};
document.getElementById('s-save').onclick=function(){
  var url=document.getElementById('s-url').value.trim();
  var name=document.getElementById('s-name').value.trim();
  if(!url||!name){showToast('链接和名称不能为空');return;}
  if(!url.startsWith('http'))url='https://'+url;
  var desc=document.getElementById('s-desc').value.trim();
  var gid=document.getElementById('s-group').value;
  var iconVal=document.getElementById('s-icon').value.trim();
  var icon=iconVal||(getDomain(url)?'https://favicon.im/'+getDomain(url):'');
  var ov=document.getElementById('site-overlay');
  if(siteModalMode==='add'){
    var g=state.groups.find(function(x){return x.id===gid;});
    if(!g){showToast('请先创建一个分类');return;}
    g.sites.push({id:uid(),name:name,url:url,desc:desc,icon:icon});
    showToast('"'+name+'" 已添加');
  } else {
    var sid2=ov._sid,oldGid=ov._gid,newGid=gid;
    var site=findSite(sid2,oldGid);if(!site)return;
    site.name=name;site.url=url;site.desc=desc;site.icon=icon;
    if(newGid!==oldGid){var r=removeSite(sid2,oldGid);var ng=state.groups.find(function(x){return x.id===newGid;});if(r&&ng)ng.sites.push(r);}
    var pi=state.pinned.findIndex(function(p){return p.id===sid2;});
    if(pi!==-1)state.pinned[pi]=Object.assign({},site,{fromGroup:newGid});
    showToast('已保存');
  }
  ov.classList.remove('visible');markDirty();render();
};

/* ---- Group Modal ---- */
function openGroupModal(mode,gid){
  groupModalMode=mode;
  document.getElementById('group-modal-title').textContent=mode==='add'?'添加分类':'重命名分类';
  document.getElementById('g-save').textContent=mode==='add'?'创建':'保存';
  var ov=document.getElementById('group-overlay');ov._gid=gid||null;
  document.getElementById('g-name').value=mode==='edit'&&gid?(state.groups.find(function(x){return x.id===gid;})||{}).name||'':'';
  ov.classList.add('visible');
  setTimeout(function(){document.getElementById('g-name').focus();},100);
}
document.getElementById('g-cancel').onclick=function(){document.getElementById('group-overlay').classList.remove('visible');};
document.getElementById('group-overlay').onclick=function(e){if(e.target===this)this.classList.remove('visible');};
document.getElementById('g-name').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('g-save').click();});
document.getElementById('g-save').onclick=function(){
  var name=document.getElementById('g-name').value.trim();if(!name){showToast('请输入分类名称');return;}
  var ov=document.getElementById('group-overlay');
  if(groupModalMode==='add'){
    state.groups.push({id:uid(),name:name,open:false,sites:[]});showToast('"'+name+'" 已创建');
  } else {
    var g=state.groups.find(function(x){return x.id===ov._gid;});if(g)g.name=name;showToast('已重命名');
  }
  ov.classList.remove('visible');markDirty();render();
};

/* ---- Sort Sites ---- */
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
document.getElementById('sort-save').onclick=function(){document.getElementById('sort-overlay').classList.remove('visible');markDirty();render();showToast('排序已更新');};

/* ---- Move ---- */
function openMoveModal(sid,gid){
  var list=document.getElementById('move-list');list.innerHTML='';
  state.groups.forEach(function(g){
    var item=document.createElement('div');item.className='move-item'+(g.id===gid?' current':'');
    item.textContent=g.name+(g.id===gid?' (当前)':'');
    if(g.id!==gid){item.onclick=function(){
      var r=removeSite(sid,gid);if(r){
        g.sites.push(r);
        var pi=state.pinned.findIndex(function(p){return p.id===sid;});if(pi!==-1)state.pinned[pi].fromGroup=g.id;
        document.getElementById('move-overlay').classList.remove('visible');markDirty();render();showToast('已移动到 '+g.name);
      }
    };}
    list.appendChild(item);
  });
  document.getElementById('move-overlay').classList.add('visible');
}
document.getElementById('move-cancel').onclick=function(){document.getElementById('move-overlay').classList.remove('visible');};
document.getElementById('move-overlay').onclick=function(e){if(e.target===this)this.classList.remove('visible');};

/* ---- Group Reorder ---- */
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
document.getElementById('greorder-save').onclick=function(){document.getElementById('greorder-overlay').classList.remove('visible');markDirty();render();showToast('顺序已更新');};

/* ---- Search ---- */
document.getElementById('search-btn').onclick=doSearch;
document.getElementById('search-input').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});
function doSearch(){var q=document.getElementById('search-input').value.trim();if(!q)return;window.open(engines[activeEngine].url+encodeURIComponent(q),'_blank');}

loadData();
</script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const { password } = await request.json();
        if (password === (env.PASSWORD || '')) return new Response('ok');
        return new Response('unauthorized', { status: 401 });
      } catch { return new Response('bad request', { status: 400 }); }
    }

    if (url.pathname === '/api/data') {
      if (request.method === 'GET') {
        const data = await env.NAV_DB.get('data');
        return new Response(data || JSON.stringify(DEFAULT_DATA), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (request.method === 'POST') {
        const auth = request.headers.get('Authorization') || '';
        const pw = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        if (!env.PASSWORD || pw !== env.PASSWORD)
          return new Response('unauthorized', { status: 401 });
        const body = await request.text();
        try { JSON.parse(body); } catch { return new Response('invalid json', { status: 400 }); }
        await env.NAV_DB.put('data', body);
        return new Response('ok');
      }
    }

    return new Response(getHTML(), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
