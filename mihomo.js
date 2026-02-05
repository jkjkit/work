export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      // --- 1. 订阅分发接口 ---
      if (url.pathname === '/sub') {
        const id = url.searchParams.get('id');
        const proxiesContent = await env.CLASH_KV.get(id);
        if (!proxiesContent) return new Response("Subscription Expired", { status: 404 });
        try {
          const templateUrl = "https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/mihomo.yaml";
          const templateRes = await fetch(templateUrl);
          const templateText = await templateRes.text();
          const finalConfig = "proxies:\n" + proxiesContent + "\n\n" + templateText;
          return new Response(finalConfig, { headers: { "content-type": "text/yaml;charset=UTF-8" } });
        } catch (e) {
          return new Response("Template Error", { status: 500 });
        }
      }
  
      // --- 2. 存储接口 ---
      if (request.method === 'POST' && url.pathname === '/save') {
        const { yaml } = await request.json();
        const id = crypto.randomUUID().slice(0, 8);
        const formatted = yaml.split('\n').filter(l => l.trim().startsWith('{')).map(l => "  - " + l.trim()).join('\n');
        await env.CLASH_KV.put(id, formatted, { expirationTtl: 86400 * 30 });
        return new Response(JSON.stringify({ id }), { headers: { "content-type": "application/json" } });
      }
  
      // --- 3. 抓取接口 ---
      if (url.searchParams.has('target')) {
        const targetUrl = url.searchParams.get('target');
        const res = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        return new Response(await res.text());
      }
  
      // --- 4. 前端交互界面 ---
      const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gemini Node Hub</title>
      <style>
          :root {
              --bg-color: #020617;
              --card-bg: #1e293b;
              --text-main: #f8fafc;
              --text-dim: #94a3b8;
              --accent: #3b82f6;
              --accent-hover: #2563eb;
              --danger: #ef4444;
              --success: #10b981;
              --border: #334155;
          }
  
          body { 
              background-color: var(--bg-color); 
              color: var(--text-main);
              margin: 0; 
              font-family: 'Inter', system-ui, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              width: 100vw;
          }
  
          /* 核心修改：限制宽度为 80%，高度 85% */
          .container { 
              display: grid; 
              grid-template-columns: 320px 1fr 1fr; 
              gap: 20px; 
              width: 85%; 
              max-width: 1400px;
              height: 85vh; 
              box-sizing: border-box;
              background: rgba(30, 41, 59, 0.5);
              padding: 20px;
              border-radius: 20px;
              border: 1px solid var(--border);
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              backdrop-filter: blur(10px);
          }
  
          .column { 
              background: var(--card-bg); 
              border-radius: 12px; 
              border: 1px solid var(--border); 
              display: flex; 
              flex-direction: column; 
              overflow: hidden;
          }
  
          header {
              padding: 12px 15px;
              background: rgba(0, 0, 0, 0.2);
              border-bottom: 1px solid var(--border);
              display: flex;
              justify-content: space-between;
              align-items: center;
          }
  
          h3 { margin: 0; font-size: 12px; letter-spacing: 0.1em; color: var(--text-dim); text-transform: uppercase; }
  
          .content { padding: 15px; flex-grow: 1; overflow-y: auto; }
  
          input, textarea {
              background: #0f172a;
              border: 1px solid var(--border);
              color: var(--text-main);
              padding: 10px;
              border-radius: 6px;
              width: 100%;
              box-sizing: border-box;
              margin-bottom: 10px;
              font-size: 13px;
          }
  
          button {
              background: var(--accent);
              color: white;
              border: none;
              padding: 10px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              width: 100%;
          }
  
          .btn-secondary { background: #475569; margin-top: 5px; }
          .btn-danger { background: var(--danger); padding: 3px 8px; font-size: 10px; width: auto; }
  
          .node-item {
              background: #111827;
              border: 1px solid var(--border);
              padding: 10px;
              margin-bottom: 8px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              gap: 10px;
          }
  
          .node-item.hidden-node { opacity: 0.3; }
  
          .vis-btn { font-size: 18px; cursor: pointer; }
  
          .node-info { flex-grow: 1; overflow: hidden; }
          .node-info span { font-size: 9px; color: var(--accent); display: block; margin-bottom: 2px; }
          .node-info input { margin: 0; padding: 2px 5px; font-size: 12px; background: transparent; border: 1px solid transparent; }
          .node-info input:focus { border-color: var(--border); background: #000; }
  
          pre {
              margin: 0;
              font-family: 'Monaco', monospace;
              font-size: 11px;
              color: #10b981;
              white-space: pre-wrap;
          }
  
          #linkBox {
              margin-top: 10px;
              background: rgba(16, 185, 129, 0.1);
              border: 1px solid var(--success);
              padding: 10px;
              border-radius: 6px;
              display: none;
              font-size: 12px;
          }
  
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="column">
              <header><h3>导入中心</h3></header>
              <div class="content">
                  <label style="font-size: 11px; color: var(--text-dim);">订阅链接</label>
                  <input type="text" id="urlInput" placeholder="https://...">
                  <button onclick="fetchNodes()">抓取解析</button>
                  <div style="margin-top:20px;">
                      <label style="font-size: 11px; color: var(--text-dim);">单条/手动</label>
                      <textarea id="manualInput" placeholder="粘贴 vmess/vless..."></textarea>
                      <button class="btn-secondary" onclick="addManualNodes()">追加节点</button>
                  </div>
                  <div id="linkBox"></div>
                  <button id="genBtn" style="display:none; margin-top:20px; background: var(--success);" onclick="generateLink()">保存并生成订阅</button>
              </div>
          </div>
  
          <div class="column">
              <header>
                  <h3>节点管理</h3>
                  <button class="btn-danger" onclick="clearAllNodes()">重置</button>
              </header>
              <div id="nodeEditor" class="content"></div>
          </div>
  
          <div class="column">
              <header><h3>预览</h3></header>
              <div class="content" style="background: #000;">
                  <pre id="outputYaml"></pre>
              </div>
          </div>
      </div>
  
      <script>
          let nodes = [];
          function toYamlLine(obj) {
              const wrap = (s) => (/[\\s:{}[\\]#|*!?,]/.test(s) ? '"' + s + '"' : s);
              const { visible, ...cleanObj } = obj;
              const parts = Object.entries(cleanObj).map(([k, v]) => {
                  if (k === 'ws-opts') return "ws-opts: { path: " + wrap(v.path) + ", headers: { Host: " + wrap(v.headers.Host) + " } }";
                  return k + ": " + (typeof v === 'string' ? wrap(v) : v);
              });
              return "{ " + parts.join(", ") + " }";
          }
          function renderYaml() {
              const activeNodes = nodes.filter(n => n.visible !== false);
              document.getElementById('outputYaml').innerText = activeNodes.map(n => toYamlLine(n)).join('\\n');
          }
          function refreshEditor() {
              const editor = document.getElementById('nodeEditor');
              if(nodes.length === 0) {
                  editor.innerHTML = '<div style="color:var(--text-dim);text-align:center;margin-top:40px;font-size:12px;">空池</div>';
                  document.getElementById('genBtn').style.display = "none";
              } else {
                  editor.innerHTML = nodes.map((n, i) => {
                      return '<div class="node-item ' + (n.visible ? '' : 'hidden-node') + '">' +
                          '<div class="vis-btn" onclick="toggleVisibility(' + i + ')">' + (n.visible ? '👁️' : '🚫') + '</div>' +
                          '<div class="node-info">' +
                              '<span>' + n.type.toUpperCase() + ' // ' + n.server + '</span>' +
                              '<input type="text" value="' + n.name + '" oninput="updateNodeName(' + i + ', this.value)">' +
                          '</div>' +
                      '</div>';
                  }).join('');
                  document.getElementById('genBtn').style.display = "block";
              }
              renderYaml();
          }
          function clearAllNodes() { if(confirm("清空？")) { nodes = []; refreshEditor(); } }
          function toggleVisibility(i) { nodes[i].visible = !nodes[i].visible; refreshEditor(); }
          function updateNodeName(i, name) { nodes[i].name = name; renderYaml(); }
          function parseTextToNodes(text) {
              const newNodes = [];
              const lines = text.match(/(vmess|vless|trojan|ss|hysteria2|hy2):\\/\\/[^\\s#]+(#?[^\\s]*)/g) || [];
              lines.forEach(line => {
                  try {
                      let p = null;
                      if(line.startsWith('vmess://')) {
                          const c = JSON.parse(atob(line.split('://')[1].split('#')[0]));
                          p = { name: c.ps, type: 'vmess', server: c.add, port: c.port, uuid: c.id, cipher: 'auto', udp: true };
                          if (c.tls === 'tls') { p.tls = true; p.sni = c.sni || c.host; p['skip-cert-verify'] = true; if(c.fp) p.client_fingerprint = c.fp; }
                          if (c.net === 'ws') { p.network = 'ws'; p['ws-opts'] = { path: c.path || "/", headers: { Host: c.host || c.add } }; }
                      } else if(line.startsWith('hysteria2://') || line.startsWith('hy2://')) {
                          const u = new URL(line.replace('hy2://', 'hysteria2://'));
                          p = { name: decodeURIComponent(u.hash.slice(1)) || 'HY2', type: 'hysteria2', server: u.hostname, port: parseInt(u.port), password: u.username, udp: true, 'skip-cert-verify': true };
                          if(new URLSearchParams(u.search).get('sni')) p.sni = new URLSearchParams(u.search).get('sni');
                      } else {
                          const u = new URL(line);
                          const type = u.protocol.slice(0,-1);
                          p = { name: decodeURIComponent(u.hash.slice(1)) || 'Node', type, server: u.hostname, port: parseInt(u.port), udp: true };
                          const cred = decodeURIComponent(u.username || u.password);
                          if(type === 'vless') p.uuid = cred; else p.password = cred;
                          const ps = new URLSearchParams(u.search);
                          if(ps.get('security') === 'tls' || ps.get('security') === 'reality' || type === 'trojan') { 
                              p.tls = true; p.sni = ps.get('sni') || ps.get('host'); p['skip-cert-verify'] = true;
                              if(ps.get('fp')) p.client_fingerprint = ps.get('fp');
                              if(ps.get('flow')) p.flow = ps.get('flow');
                          }
                      }
                      if(p) { p.visible = true; newNodes.push(p); }
                  } catch(e) {}
              });
              return newNodes;
          }
          async function fetchNodes() {
              const urlEl = document.getElementById('urlInput');
              if(!urlEl.value) return;
              const res = await fetch('?target=' + encodeURIComponent(urlEl.value));
              const decoded = atob((await res.text()).replace(/\\s/g, ''));
              nodes = [...nodes, ...parseTextToNodes(decoded)];
              urlEl.value = "";
              refreshEditor();
          }
          function addManualNodes() {
              const textEl = document.getElementById('manualInput');
              if(!textEl.value) return;
              nodes = [...nodes, ...parseTextToNodes(textEl.value)];
              textEl.value = "";
              refreshEditor();
          }
          async function generateLink() {
              const activeNodes = nodes.filter(n => n.visible !== false);
              const yamlText = activeNodes.map(n => toYamlLine(n)).join('\\n');
              const res = await fetch('/save', { method: 'POST', body: JSON.stringify({ yaml: yamlText }) });
              const { id } = await res.json();
              const subUrl = window.location.origin + '/sub?id=' + id;
              document.getElementById('linkBox').style.display = 'block';
              document.getElementById('linkBox').innerHTML = '<strong>订阅:</strong><br><input readonly value="' + subUrl + '" onclick="this.select()">';
          }
          refreshEditor();
      </script>
  </body>
  </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }
  };
