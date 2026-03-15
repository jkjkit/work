// ============================================================
//  Cloudflare Worker — 链接转换工具 v5
//  直接粘贴到 CF Workers 部署即可
//
//  路径规则（直接访问，无需前端）：
//  /{github_url}            → jsDelivr CDN 转换后跳转
//  /1/{github_url}          → gh-proxy.com 代理跳转
//  /2/{github_url}          → gh.llkk.cc 代理跳转
//  /3/{github_url}          → gh-proxy.org 代理跳转
//  /4/{sub_url}             → 订阅注入模板 A 返回 YAML
//  /5/{sub_url}             → 订阅注入模板 B 返回 YAML
//  /6/{sub_url}             → 订阅注入模板 C 返回 YAML
// ============================================================

const GH_PROXIES = [
  'https://gh-proxy.com/',   // /1/
  'https://gh.llkk.cc/',     // /2/
  'https://gh-proxy.org/',   // /3/
];

const TEMPLATES = {
  4: 'https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/a.yml',
  5: 'https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/b.yml',
  6: 'https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/c.yml',
};

// ── jsDelivr 转换 ──────────────────────────────────────────
function toJsdelivr(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'raw.githubusercontent.com') {
      const [, user, repo, branch, ...rest] = u.pathname.split('/');
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${rest.join('/')}`;
    }
    if (u.hostname === 'github.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length < 4) throw new Error('链接格式不正确，需包含文件路径');
      const [user, repo, , branch, ...rest] = parts;
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${rest.join('/')}`;
    }
    throw new Error('非 GitHub 链接');
  } catch (e) {
    throw new Error(e.message || '链接解析失败');
  }
}

// ── 订阅注入 ──────────────────────────────────────────────
async function buildSub(tmplUrl, subUrl) {
  const resp = await fetch(tmplUrl, { cf: { cacheTtl: 300 } });
  if (!resp.ok) throw new Error(`模板获取失败: ${resp.status}`);
  const text = await resp.text();
  return text
    .replace(/"订阅链接"/g, `"${subUrl}"`)
    .replace(/订阅链接/g, subUrl);
}

// ── HTML 前端 ─────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>链接转换工具</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;800&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg: #0a0a0f; --surface: #111118; --border: #1e1e2e;
    --accent: #7c6af7; --accent2: #4fc3f7; --accent3: #a8edaf;
    --text: #e8e8f0; --muted: #5a5a78; --card: #14141f; --radius: 12px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center;
    padding: 48px 16px;
  }
  body::before {
    content: ''; position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0; opacity: .5;
  }
  .glow {
    position: fixed; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,106,247,.12) 0%, transparent 70%);
    top: -200px; left: 50%; transform: translateX(-50%);
    pointer-events: none; z-index: 0;
  }
  .wrap { position: relative; z-index: 1; width: 100%; max-width: 700px; }

  header { text-align: center; margin-bottom: 48px; }
  .badge {
    display: inline-block; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 3px; color: var(--accent);
    border: 1px solid var(--accent); border-radius: 100px;
    padding: 4px 14px; margin-bottom: 16px; text-transform: uppercase;
  }
  header h1 {
    font-size: clamp(28px,5vw,42px); font-weight: 800; letter-spacing: -1px;
    background: linear-gradient(135deg,#fff 30%,var(--accent) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  header p { color: var(--muted); margin-top: 10px; font-size: 14px; }

  .tabs {
    display: flex; gap: 4px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 4px; margin-bottom: 24px;
  }
  .tab-btn {
    flex: 1; padding: 10px 8px; border: none; border-radius: 8px;
    background: transparent; color: var(--muted);
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .2s; white-space: nowrap;
  }
  .tab-btn.active { background: var(--accent); color: #fff; box-shadow: 0 0 20px rgba(124,106,247,.4); }
  .tab-btn:hover:not(.active) { color: var(--text); background: var(--border); }

  .card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 28px;
    display: none; flex-direction: column; gap: 20px;
    animation: fadeUp .3s ease;
  }
  .card.active { display: flex; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .card-title {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 600; color: var(--muted);
    letter-spacing: 1px; text-transform: uppercase;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot-purple { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
  .dot-blue   { background: var(--accent2); box-shadow: 0 0 8px var(--accent2); }
  .dot-green  { background: var(--accent3); box-shadow: 0 0 8px var(--accent3); }

  label { font-size: 13px; font-weight: 600; color: var(--muted); display: block; margin-bottom: 8px; }

  input[type=text] {
    width: 100%; background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px 14px; color: var(--text);
    font-family: 'JetBrains Mono', monospace; font-size: 13px; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,106,247,.15); }
  input::placeholder { color: var(--muted); }

  .seg-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .seg-btn {
    padding: 7px 14px; border-radius: 6px; border: 1px solid var(--border);
    background: transparent; color: var(--muted);
    font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all .2s; white-space: nowrap;
  }
  .seg-btn:hover { border-color: var(--accent); color: var(--accent); }
  .seg-btn.sel-blue  { border-color: var(--accent2); background: rgba(79,195,247,.12); color: var(--accent2); font-weight: 600; }
  .seg-btn.sel-green { border-color: var(--accent3); background: rgba(168,237,175,.12); color: var(--accent3); font-weight: 600; }

  .btn {
    width: 100%; padding: 13px; border: none; border-radius: 8px;
    background: var(--accent); color: #fff;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all .2s; box-shadow: 0 4px 20px rgba(124,106,247,.3);
  }
  .btn:hover { background: #9a8af9; transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }

  .hint {
    font-size: 12px; color: var(--muted); font-family: 'JetBrains Mono', monospace;
    padding: 10px 12px; background: var(--surface);
    border-left: 3px solid var(--accent); border-radius: 0 6px 6px 0; line-height: 1.6;
  }

  .result-row {
    display: none; align-items: center; gap: 8px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px 14px; transition: border-color .2s;
    animation: fadeUp .25s ease;
  }
  .result-row.show { display: flex; }
  .result-row:hover { border-color: rgba(124,106,247,.35); }

  .result-link {
    flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 12px;
    color: var(--accent2); text-decoration: none;
    word-break: break-all; line-height: 1.5; transition: color .15s;
  }
  .result-link:hover { color: #fff; text-decoration: underline; }

  .copy-btn {
    flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px;
    padding: 6px 13px; border-radius: 6px; border: 1px solid var(--border);
    background: transparent; color: var(--muted);
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all .2s; white-space: nowrap;
  }
  .copy-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(124,106,247,.08); }
  .copy-btn.ok { border-color: var(--accent3); color: var(--accent3); background: rgba(168,237,175,.08); }

  /* API 说明卡片 */
  .api-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px 24px;
    margin-top: 28px; display: flex; flex-direction: column; gap: 10px;
  }
  .api-title {
    font-size: 11px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: var(--muted); margin-bottom: 4px;
  }
  .api-row {
    display: flex; align-items: baseline; gap: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.7;
  }
  .api-path { color: var(--accent2); flex-shrink: 0; }
  .api-desc { color: var(--muted); }

  .sub-note {
    font-size: 12px; color: var(--muted); font-family: 'JetBrains Mono', monospace;
    padding: 10px 12px; background: var(--surface);
    border-left: 3px solid var(--accent3); border-radius: 0 6px 6px 0;
    line-height: 1.7; display: none;
  }
  .sub-note.show { display: block; }

  footer {
    margin-top: 48px; font-size: 12px; color: var(--muted);
    font-family: 'JetBrains Mono', monospace; text-align: center;
  }
</style>
</head>
<body>
<div class="glow"></div>
<div class="wrap">
  <header>
    <div class="badge">Link Converter</div>
    <h1>链接转换工具</h1>
    <p>GitHub CDN 加速 &amp; 机场订阅注入</p>
  </header>

  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab(0)">jsDelivr CDN</button>
    <button class="tab-btn" onclick="switchTab(1)">GitHub 代理加速</button>
    <button class="tab-btn" onclick="switchTab(2)">订阅注入</button>
  </div>

  <!-- Tab 0 -->
  <div class="card active" id="tab0">
    <div class="card-title"><span class="dot dot-purple"></span>GitHub → jsDelivr CDN</div>
    <div class="hint">支持 github.com/blob/ 或 raw.githubusercontent.com 格式</div>
    <div>
      <label>GitHub 链接</label>
      <input type="text" id="jsdelivr-input" placeholder="https://github.com/user/repo/blob/main/file.js"/>
    </div>
    <button class="btn" onclick="convertJsdelivr()">转 换</button>
    <div class="result-row" id="jsdelivr-row">
      <a class="result-link" id="jsdelivr-link" href="#" target="_blank" rel="noopener"></a>
      <button class="copy-btn" onclick="doCopy('jsdelivr-link',this)">⎘ 复制</button>
    </div>
  </div>

  <!-- Tab 1 -->
  <div class="card" id="tab1">
    <div class="card-title"><span class="dot dot-blue"></span>GitHub 代理加速</div>
    <div class="hint">选择线路后输入链接，只输出单条加速地址</div>
    <div>
      <label>选择代理线路</label>
      <div class="seg-group" id="proxy-seg">
        <button class="seg-btn sel-blue" data-idx="0" onclick="selSeg('proxy-seg',this,'sel-blue')">gh-proxy.com</button>
        <button class="seg-btn"          data-idx="1" onclick="selSeg('proxy-seg',this,'sel-blue')">gh.llkk.cc</button>
        <button class="seg-btn"          data-idx="2" onclick="selSeg('proxy-seg',this,'sel-blue')">gh-proxy.org</button>
      </div>
    </div>
    <div>
      <label>GitHub 链接</label>
      <input type="text" id="ghproxy-input" placeholder="https://github.com/user/repo/releases/download/v1/file.zip"/>
    </div>
    <button class="btn" onclick="convertGhProxy()">转 换</button>
    <div class="result-row" id="ghproxy-row">
      <a class="result-link" id="ghproxy-link" href="#" target="_blank" rel="noopener"></a>
      <button class="copy-btn" onclick="doCopy('ghproxy-link',this)">⎘ 复制</button>
    </div>
  </div>

  <!-- Tab 2 -->
  <div class="card" id="tab2">
    <div class="card-title"><span class="dot dot-green"></span>机场订阅注入 Clash 配置</div>
    <div class="hint">选择模板 → 输入订阅链接 → 生成可直接填入 Clash 的配置直链</div>
    <div>
      <label>选择模板</label>
      <div class="seg-group" id="tpl-seg">
        <button class="seg-btn sel-green" data-idx="4" onclick="selSeg('tpl-seg',this,'sel-green')">模板 A</button>
        <button class="seg-btn"           data-idx="5" onclick="selSeg('tpl-seg',this,'sel-green')">模板 B</button>
        <button class="seg-btn"           data-idx="6" onclick="selSeg('tpl-seg',this,'sel-green')">模板 C</button>
      </div>
    </div>
    <div>
      <label>机场订阅链接</label>
      <input type="text" id="sub-input" placeholder="https://your-airport.com/api/v1/client/subscribe?token=xxx"/>
    </div>
    <button class="btn" onclick="convertSub()">生成配置链接</button>
    <div class="result-row" id="sub-row">
      <a class="result-link" id="sub-link" href="#" target="_blank" rel="noopener"></a>
      <button class="copy-btn" onclick="doCopy('sub-link',this)">⎘ 复制</button>
    </div>
    <div class="sub-note" id="sub-note">
      ✦ 点击链接直接在浏览器查看注入后的完整 YAML<br>
      ✦ 复制链接后可直接填入 Clash / Mihomo 订阅地址栏
    </div>
  </div>

  <footer>Cloudflare Workers · All in one worker.js</footer>
</div>

<script>
const GH_PROXIES = ['https://gh-proxy.com/','https://gh.llkk.cc/','https://gh-proxy.org/'];

function switchTab(idx) {
  document.querySelectorAll('.tab-btn').forEach((b,i)=>b.classList.toggle('active',i===idx));
  document.querySelectorAll('.card').forEach((c,i)=>c.classList.toggle('active',i===idx));
}
function selSeg(gid, btn, cls) {
  document.querySelectorAll('#'+gid+' .seg-btn').forEach(b=>b.classList.remove('sel-blue','sel-green'));
  btn.classList.add(cls);
}
function getSegIdx(gid) {
  const b = document.querySelector('#'+gid+' .seg-btn.sel-blue, #'+gid+' .seg-btn.sel-green');
  return b ? parseInt(b.dataset.idx) : 0;
}
function setResult(linkId, rowId, url) {
  const a = document.getElementById(linkId);
  a.href = url; a.textContent = url;
  document.getElementById(rowId).classList.add('show');
}
function doCopy(linkId, btn) {
  navigator.clipboard.writeText(document.getElementById(linkId).href).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ 已复制'; btn.classList.add('ok');
    setTimeout(()=>{ btn.innerHTML = orig; btn.classList.remove('ok'); }, 2000);
  });
}

async function convertJsdelivr() {
  const url = document.getElementById('jsdelivr-input').value.trim();
  if (!url) return;
  const res = await fetch('/api/jsdelivr', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url})
  });
  const data = await res.json();
  if (data.error) { alert(data.error); return; }
  setResult('jsdelivr-link','jsdelivr-row', data.result);
}

function convertGhProxy() {
  const url = document.getElementById('ghproxy-input').value.trim();
  if (!url) return;
  if (!url.startsWith('http')) { alert('请输入完整链接'); return; }
  const prefix = GH_PROXIES[getSegIdx('proxy-seg')];
  setResult('ghproxy-link','ghproxy-row', prefix + url);
}

function convertSub() {
  const url = document.getElementById('sub-input').value.trim();
  if (!url) return;
  const idx = getSegIdx('tpl-seg'); // 4/5/6
  const subUrl = location.origin + '/' + idx + '/' + encodeURIComponent(url);
  setResult('sub-link','sub-row', subUrl);
  document.getElementById('sub-note').classList.add('show');
}
</script>
</body>
</html>`;

// ============================================================
//  Worker 路由
// ============================================================

export default {
  async fetch(request) {
    const reqUrl = new URL(request.url);
    const raw    = reqUrl.pathname; // e.g. /1/https://github.com/...

    // ── 首页 ────────────────────────────────────────────────
    if (raw === '/' || raw === '') {
      return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // ── POST API（前端 AJAX 调用） ───────────────────────────
    if (raw === '/api/jsdelivr' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ error: '请求体解析失败' }, 400); }
      try { return json({ result: toJsdelivr(body.url) }); }
      catch (e) { return json({ error: e.message }, 400); }
    }

    // ── 直链路由解析 ─────────────────────────────────────────
    // 格式：/[前缀数字/]<完整URL>
    // 例：  /https://github.com/...
    //       /1/https://github.com/...
    //       /4/https://airport.com/...

    // 去掉开头的 /
    const stripped = raw.slice(1);

    // 判断是否以数字前缀开头：/1/... /2/... /3/... /4/... /5/... /6/...
    const prefixMatch = stripped.match(/^([1-6])\/(https?:\/\/.+)$/s);
    const plainMatch  = !prefixMatch && stripped.match(/^(https?:\/\/.+)$/s);

    let prefix = 0;   // 0 = jsDelivr
    let targetUrl = '';

    if (prefixMatch) {
      prefix    = parseInt(prefixMatch[1]);
      targetUrl = prefixMatch[2];
    } else if (plainMatch) {
      prefix    = 0;
      targetUrl = plainMatch[1];
    } else {
      return new Response('Not Found', { status: 404 });
    }

    // 还原可能被编码的 URL
    try { targetUrl = decodeURIComponent(targetUrl); } catch {}

    // ── prefix 0：jsDelivr，302 跳转 ────────────────────────
    if (prefix === 0) {
      try {
        const cdn = toJsdelivr(targetUrl);
        return Response.redirect(cdn, 302);
      } catch (e) {
        return new Response(e.message, { status: 400 });
      }
    }

    // ── prefix 1-3：gh-proxy，302 跳转 ──────────────────────
    if (prefix >= 1 && prefix <= 3) {
      const proxyBase = GH_PROXIES[prefix - 1];
      return Response.redirect(proxyBase + targetUrl, 302);
    }

    // ── prefix 4-6：订阅注入，返回 YAML ─────────────────────
    if (prefix >= 4 && prefix <= 6) {
      const tmplUrl = TEMPLATES[prefix];
      try {
        const yaml = await buildSub(tmplUrl, targetUrl);
        return new Response(yaml, {
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
            'Content-Disposition': 'inline; filename="clash-config.yaml"',
            'Profile-Update-Interval': '24',
            'Subscription-Userinfo': 'upload=0; download=0; total=0; expire=0',
          },
        });
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  });
}
