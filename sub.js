const YAML_TEMPLATE = "https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/c.yml";
const CONVERTER    = "https://subapi.cmliussss.net/sub";
const CONV_CONFIG  = "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/special/basic.ini";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const path = pathname.slice(1);

    // ── GET /{token}: serve saved subscription ──
    if (request.method === "GET" && path && !/^(convert-sub|check-sub|save-sub)$/.test(path)) {
      const raw = await env.SUB_KV.get(path);
      if (!raw) return new Response("404", { status: 404 });
      const { content, format } = JSON.parse(raw);
      if (format === "yaml") {
        try {
          const tmpl = await (await fetch(YAML_TEMPLATE)).text();
          const hasNodes = /proxies:\s*\n\s*-\s/.test(tmpl);
          const yaml = hasNodes
            ? tmpl.replace(/proxies:\s*\n/, "proxies:\n" + content + "\n")
            : tmpl.replace(/proxies:\s*/, "proxies:\n" + content + "\n");
          return new Response(yaml, { headers: { "Content-Type": "text/yaml;charset=UTF-8" } });
        } catch { return new Response("Template Error", { status: 500 }); }
      }
      return new Response(content, { headers: { "Content-Type": "text/plain;charset=UTF-8" } });
    }

    // ── POST endpoints ──
    if (request.method === "POST") {
      const body = await request.json();

      // Check if a token name is already taken
      if (pathname === "/check-sub") {
        const exists = (await env.SUB_KV.get(body.name)) !== null;
        return new Response(JSON.stringify({ exists }));
      }

      // Save subscription content to KV, return the token
      if (pathname === "/save-sub") {
        const name  = (body.name || "").replace(/[^a-zA-Z0-9_-]/g, "");
        const token = name || Math.random().toString(36).substring(2, 8);
        await env.SUB_KV.put(token, JSON.stringify({ content: body.content, format: body.format }));
        return new Response(JSON.stringify({ token }));
      }

      // Proxy subconverter request to avoid CORS
      if (pathname === "/convert-sub") {
        const { subUrl, target = "clash" } = body;
        const url = `${CONVERTER}?url=${encodeURIComponent(subUrl)}&target=${target}&config=${encodeURIComponent(CONV_CONFIG)}&emoji=true&append_type=false&append_info=false&scv=true&udp=false&list=true&sort=true&fdn=false&insert=false`;
        try {
          const text = await (await fetch(url, { headers: { "User-Agent": "Clash.Meta/1.16.0" } })).text();
          return new Response(JSON.stringify({ content: text }));
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
      }
    }

    return new Response(getHtml(), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};

// ─── Styles ───────────────────────────────────
function getStyles() {
  return `
    body { overflow:hidden; height:100vh; display:flex; align-items:center; justify-content:center; background:#f7f7f5; }
    .mono { font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; font-size:11px; }
    .readable-input { font-family:-apple-system,sans-serif; font-size:11px; font-weight:400; color:#374151; }
    .card { background:white; border-radius:12px; border:1px solid #e5e7eb; height:calc(100vh - 120px); display:flex; flex-direction:column; overflow:hidden; }
    .content-area { flex:1; overflow-y:auto; padding:16px; scrollbar-width:thin; }
    .input-box { background:#f1f1ee; border:1px solid #e5e7eb; border-radius:8px; padding:10px; width:100%; outline:none; font-size:11px; }
    #manualInput { height:160px !important; min-height:160px !important; flex:none !important; }
    .btn { transition:all 0.2s; border-radius:6px; font-weight:600; font-size:11px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; border:none; }
    .btn:disabled { opacity:0.5; cursor:not-allowed; }
    .node-tag { padding:2px 5px; border-radius:4px; font-weight:bold; font-size:9px; color:white; min-width:55px; text-align:center; text-transform:uppercase; }
    .color-vless{background:#f97316} .color-vmess{background:#3b82f6}
    .color-hy2,.color-hysteria2,.color-hysteria{background:#7c3aed}
    .color-ss{background:#10b981} .color-trojan{background:#ef4444}
    .color-tuic{background:#0891b2} .color-mieru{background:#db2777}
    .color-socks5{background:#65a30d} .color-http,.color-https{background:#d97706}
    .color-anytls{background:#0d9488} .color-wireguard,.color-wg{background:#6366f1}
    .color-snell{background:#ea580c} .color-juicity{background:#9333ea}
    .color-naive{background:#0284c7} .color-default{background:#64748b}
    .node-item { display:flex; align-items:center; gap:8px; padding:5px; border-bottom:1px solid #f9fafb; }
    .hidden-node { opacity:0.2; }
    .text-toggle-btn { font-size:10px; color:#9ca3af; cursor:pointer; user-select:none; }
    .tab-bar { display:none; }
    @media (max-width:768px) {
      .tab-bar { display:flex; position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid #e5e7eb; z-index:100; height:56px; }
      .tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; font-size:10px; font-weight:500; color:#9ca3af; cursor:pointer; transition:color .15s; border:none; background:none; font-family:inherit; }
      .tab.active { color:#2d2d2d; }
      .tab svg { width:20px; height:20px; stroke-width:1.8; }
    }
  `;
}

// ─── HTML body ────────────────────────────────
function getBody() {
  return `
<body class="px-6 text-gray-800">
  <div class="flex gap-6 w-full max-w-[1500px] mx-auto">

    <!-- Left: control panel -->
    <div class="w-72 card shrink-0" id="panel-0">
      <div class="p-4 border-b font-bold text-[13px]">控制面板</div>
      <div class="content-area space-y-5">

        <!-- Subscription fetch -->
        <div class="space-y-2">
          <p class="text-[10px] font-bold text-gray-400 uppercase">订阅链接</p>
          <input id="subInput" type="text" class="input-box" placeholder="订阅链接...">
          <p class="text-[10px] font-bold text-gray-400 uppercase pt-1">转换格式</p>
          <select id="convertTarget" class="input-box text-[11px]">
            <option value="clash">Clash (YAML)</option>
            <option value="mixed">URI List</option>
          </select>
          <div class="flex gap-2">
            <button id="btnParse"  onclick="handleFetch(false)" class="flex-1 bg-[#2d2d2d] btn">解析</button>
            <button id="btnAppend" onclick="handleFetch(true)"  class="flex-1 bg-[#4f8ef7] btn">追加</button>
          </div>
        </div>

        <!-- Manual input -->
        <div class="flex-1 flex flex-col min-h-0 space-y-2">
          <p class="text-[10px] font-bold text-gray-400 uppercase">手动输入</p>
          <textarea id="manualInput" class="input-box mono resize-none"></textarea>
          <button onclick="handleManualAdd()" class="w-full bg-[#168544] btn">导入节点</button>
        </div>

        <!-- Save & generate link -->
        <div class="pt-4 border-t space-y-2">
          <p class="text-[10px] font-bold text-gray-400 uppercase">订阅名称（选填）</p>
          <input id="subName" type="text" class="input-box" placeholder="留空则随机六位字符">
          <button id="btnSave" onclick="generateSub()" class="w-full bg-[#7c3aed] btn shadow-sm">保存并生成订阅</button>
          <div id="saveTip" class="hidden text-[10px] text-green-600 font-medium"></div>
          <div id="linkBox" class="hidden p-2 bg-gray-50 border rounded-lg">
            <div class="flex gap-1">
              <a id="genLink" target="_blank" class="flex-1 truncate text-[10px] mono text-blue-600 hover:underline bg-white border border-gray-200 px-2 py-1.5 rounded"></a>
              <button id="copyBtn" onclick="copySub()" class="bg-blue-500 hover:bg-blue-600 text-white text-[9px] px-3 rounded shrink-0">复制</button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Middle: node list -->
    <div class="w-[450px] card" id="panel-1">
      <div class="p-4 border-b flex justify-between items-center font-bold text-[13px]">
        <span>节点列表 <span id="nodeCount" class="text-gray-400 font-normal text-[11px]"></span></span>
        <button onclick="clearNodes()" class="text-red-400 font-normal hover:text-red-600">清空</button>
      </div>
      <div id="midDisp" class="content-area space-y-1"></div>
    </div>

    <!-- Right: raw preview -->
    <div class="flex-1 card" id="panel-2">
      <div class="p-4 border-b font-bold text-[13px]">节点预览</div>
      <div class="content-area bg-white">
        <pre id="rightDisp" class="mono text-gray-400 whitespace-pre-wrap break-all leading-relaxed"></pre>
      </div>
    </div>

  </div>

  <!-- Mobile bottom tab bar -->
  <nav class="tab-bar">
    <button class="tab active" data-p="0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18M3 6h18M3 18h18"/></svg>控制面板
    </button>
    <button class="tab" data-p="1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>节点列表
    </button>
    <button class="tab" data-p="2">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>节点预览
    </button>
  </nav>
</body>`;
}

// ─── Client-side JS ───────────────────────────
function getScript() {
  return `
    let nodes = [];
    let currentFormat = 'yaml';

    // ── Helpers ──
    const $ = id => document.getElementById(id);

    function setLoading(ids, on) {
      ids.forEach(id => {
        const el = $(id); if (!el) return;
        el.disabled = on;
        if (on) { el._t = el.innerText; el.innerText = '请稍候…'; }
        else     { el.innerText = el._t || el.innerText; }
      });
    }

    function post(path, body) {
      return fetch(path, { method: 'POST', body: JSON.stringify(body) });
    }

    // ── Node ops ──
    const upd = (id, v) => { const n = nodes.find(i => i.id === id); if (n) { n.name = v; render(); } };
    const tgl = id      => { const n = nodes.find(i => i.id === id); if (n) { n.hide = !n.hide; render(); } };
    const clearNodes    = () => { if (confirm('清空？')) { nodes = []; render(); } };

    // ── Mobile tabs ──
    document.querySelectorAll('.tab').forEach(tab => {
      tab.onclick = () => {
        const p = tab.dataset.p;
        document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.p === p));
        if (window.innerWidth <= 768) {
          ['panel-0','panel-1','panel-2'].forEach((id, i) => {
            $(id).style.cssText = String(i) === p
              ? 'display:flex;width:100%;border-radius:0;border:none;height:auto;min-height:calc(100vh - 56px);overflow:hidden;'
              : 'display:none';
          });
        }
      };
    });

    if (window.innerWidth <= 768) {
      document.body.style.cssText = 'overflow:auto;height:auto;display:block;padding-bottom:56px;background:#f7f7f5;';
      const w = document.querySelector('.flex.gap-6');
      if (w) w.style.cssText = 'display:block;width:100%;max-width:100%;margin:0;padding:0;';
      $('panel-0').style.cssText = 'display:flex;width:100%;border-radius:0;border:none;height:auto;min-height:calc(100vh - 56px);overflow:hidden;';
      $('panel-1').style.display = 'none';
      $('panel-2').style.display = 'none';
    }

    // ── Fetch & convert subscription ──
    async function handleFetch(append) {
      const url = $('subInput').value.trim(); if (!url) return;
      const target = $('convertTarget').value;
      setLoading(['btnParse','btnAppend'], true);
      try {
        const d = await (await post('/convert-sub', { subUrl: url, target })).json();
        if (d.error) { alert('转换失败: ' + d.error); return; }
        const isYaml = d.content.includes('proxies:') || d.content.startsWith('mixed-port');
        currentFormat = isYaml ? 'yaml' : 'uri';
        const parsed = parse(d.content.trim(), isYaml);
        nodes = append ? [...nodes, ...parsed] : parsed;
        render();
      } catch { alert('转换请求失败'); }
      finally { setLoading(['btnParse','btnAppend'], false); }
    }

    // ── Import from manual textarea ──
    function handleManualAdd() {
      const v = $('manualInput').value.trim(); if (!v) return;
      const isYaml = v.includes('proxies:');
      currentFormat = isYaml ? 'yaml' : 'uri';
      nodes = [...parse(v, isYaml), ...nodes];
      render();
      $('manualInput').value = '';
    }

    // ── Parse YAML proxy list or URI list ──
    function parse(t, y) {
      let ls = [];
      if (y) {
        let inP = false;
        t.split('\\n').forEach(l => {
          if (l.trim() === 'proxies:') inP = true;
          else if (inP && /^[a-z]/i.test(l)) inP = false;
          if (inP && l.includes('name:')) ls.push(l.trim().replace(/^- /, ''));
        });
      } else {
        let d = t;
        try { d = atob(t.replace(/[\\s]/g, '')); } catch {}
        ls = d.split(/[\\n\\r]+/).filter(l => l.trim());
      }
      return ls.map(l => {
        let name = 'unnamed', type = 'proxy';
        if (y || l.startsWith('{')) {
          const nm = l.match(/name:\\s*"?([^",}]+)"?/);
          const tm = l.match(/type:\\s*([^,}\\s]+)/);
          if (nm) name = nm[1];
          if (tm) type = tm[1].toLowerCase();
        } else if (l.includes('://')) {
          type = l.split('://')[0].toLowerCase();
          name = type === 'vmess'
            ? (() => { try { return JSON.parse(atob(l.replace('vmess://',''))).ps; } catch { return 'unnamed'; } })()
            : decodeURIComponent(l.split('#')[1] || 'unnamed');
        }
        return { id: Math.random().toString(36).substr(2, 7), name, type, hide: false, raw: l };
      }).filter(Boolean);
    }

    // ── Render node list and preview pane ──
    function renderList() {
      const mid = $('midDisp'); mid.innerHTML = '';
      nodes.forEach(n => {
        const item   = document.createElement('div');
        item.className = 'node-item' + (n.hide ? ' hidden-node' : '');

        const tag    = Object.assign(document.createElement('span'), { className: 'node-tag color-' + (n.type || 'default'), textContent: n.type });
        const input  = Object.assign(document.createElement('input'), { type: 'text', value: n.name, className: 'readable-input flex-1 bg-transparent border-none outline-none' });
        const toggle = Object.assign(document.createElement('span'), { className: 'text-toggle-btn', textContent: n.hide ? 'Show' : 'Hide' });

        input.onchange = () => upd(n.id, input.value);
        toggle.onclick = () => tgl(n.id);

        item.append(tag, input, toggle);
        mid.appendChild(item);
      });

      const vis = nodes.filter(n => !n.hide);
      $('nodeCount').innerText = nodes.length
        ? (vis.length < nodes.length ? vis.length + '/' + nodes.length : nodes.length) + ' 个节点'
        : '';
    }

    function render() {
      renderList();
      const vis    = nodes.filter(n => !n.hide);
      const isYaml = currentFormat === 'yaml';
      $('rightDisp').innerText = isYaml
        ? vis.map(n => '  - ' + n.raw.replace(/name:\\s*"?[^",}]+"?(,)?/, 'name: "' + n.name + '"$1').trim()).join('\\n')
        : vis.map(n => {
            if (n.type === 'vmess') {
              try { const j = JSON.parse(atob(n.raw.replace('vmess://', ''))); j.ps = n.name; return 'vmess://' + btoa(JSON.stringify(j)); }
              catch { return n.raw; }
            }
            return n.raw.split('#')[0] + '#' + encodeURIComponent(n.name);
          }).join('\\n');
    }

    // ── Save nodes to KV and generate shareable link ──
    async function generateSub() {
      const vis = nodes.filter(n => !n.hide);
      if (!vis.length) { alert('没有可保存的节点'); return; }

      let content;
      if (currentFormat === 'yaml') {
        content = vis.map(n => '  - ' + n.raw.replace(/name:\\s*"?[^",}]+"?(,)?/, 'name: "' + n.name + '"$1').trim()).join('\\n');
      } else {
        const uriList = vis.map(n => {
          if (n.type === 'vmess') {
            try { const j = JSON.parse(atob(n.raw.replace('vmess://', ''))); j.ps = n.name; return 'vmess://' + btoa(unescape(encodeURIComponent(JSON.stringify(j)))); }
            catch { return n.raw; }
          }
          return n.raw.split('#')[0] + '#' + encodeURIComponent(n.name);
        }).join('\\n');
        content = btoa(unescape(encodeURIComponent(uriList)));
      }

      const customName = $('subName').value.trim();
      const name = customName.replace(/[^a-zA-Z0-9_-]/g, '') || Math.random().toString(36).substring(2, 8);

      // Warn before overwriting an existing token
      if (customName) {
        const { exists } = await (await post('/check-sub', { name })).json();
        if (exists && !confirm('订阅名称 "' + name + '" 已存在，是否覆盖？')) return;
      }

      setLoading(['btnSave'], true);
      try {
        const { token } = await (await post('/save-sub', { content, format: currentFormat, name })).json();
        const link = window.location.origin + '/' + token;
        Object.assign($('genLink'), { innerText: link, href: link });
        $('linkBox').classList.remove('hidden');
        $('saveTip').innerText = '✓ 已保存 ' + vis.length + ' 个节点，订阅名称：' + token;
        $('saveTip').classList.remove('hidden');
      } catch { alert('保存失败'); }
      finally { setLoading(['btnSave'], false); }
    }

    function copySub() {
      navigator.clipboard.writeText($('genLink').innerText);
      const btn = $('copyBtn');
      btn.innerText = 'OK';
      setTimeout(() => btn.innerText = '复制', 1500);
    }
  `;
}

// ─── Assemble full HTML ───────────────────────
function getHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>节点管理</title>
  <link rel="icon" href="https://api.iconify.design/lucide:network.svg?color=%237c3aed" type="image/svg+xml">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>${getStyles()}</style>
</head>
${getBody()}
<script>${getScript()}<\/script>
</html>`;
}
