export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 短链路由: /0/ ~ /6/ + 目标地址
    const shortMatch = url.pathname.match(/^\/([0-6])\/(.+)$/);
    if (shortMatch) {
      const idx = parseInt(shortMatch[1]);
      const target = decodeURIComponent(shortMatch[2]);
      const full = target.startsWith('http') ? target : 'https://' + target;
      // 0: CDN
      if (idx === 0) {
        const m = full.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 短链路由: /0/ ~ /6/ + 目标地址
    const fullPath = url.pathname + url.search;
    const shortMatch = fullPath.match(/^\/([0-6])\/(.+)$/);
    if (shortMatch) {
      const idx = parseInt(shortMatch[1]);
      const target = shortMatch[2];
      const full = target.startsWith('http') ? target : 'https://' + target;
      // 0: CDN
      if (idx === 0) {
        const m = full.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
        if (!m) return new Response('格式错误', { status: 400 });
        return Response.redirect(CDN_PREFIX + m[1] + '/' + m[2] + '@' + m[3] + '/' + m[4], 302);
      }
      // 1-3: GH Proxy
      if (idx >= 1 && idx <= 3) {
        const proxies = [GH_PROXY_1, GH_PROXY_2, GH_PROXY_3];
        const p = proxies[idx - 1];
        return Response.redirect(p.endsWith('/') ? p + full : p + '/' + full, 302);
      }
      // 4-6: 订阅转换
      const convertUrl = new URL('/convert', url.origin);
      convertUrl.searchParams.set('sub', full);
      convertUrl.searchParams.set('tpl', String(idx - 4));
      return Response.redirect(convertUrl.toString(), 302);
    }

    if (url.pathname === '/convert') {
      try {
        let subUrl, tplIndex;
        if (request.method === 'POST') {
          const body = await request.json();
          subUrl = body.subUrl; tplIndex = body.tplIndex;
        } else {
          subUrl = url.searchParams.get('sub');
          tplIndex = parseInt(url.searchParams.get('tpl') || '0');
        }
        if (!subUrl) return new Response(JSON.stringify({ error: '缺少订阅链接' }), { status: 400 });
        const tpls = [SUB_TPL_1, SUB_TPL_2, SUB_TPL_3];
        const tplUrl = tpls[tplIndex];
        if (!tplUrl) return new Response(JSON.stringify({ error: '模板未配置' }), { status: 400 });
        const r = await fetch(tplUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } });
        if (!r.ok) return new Response(JSON.stringify({ error: '拉取模板失败: ' + r.status }), { status: 502 });
        const yaml = await r.text();
        const result = yaml.replace(/url:\s*['"]订阅链接['"]/g, "url: '" + subUrl + "'")
        .replace(/,?\s*(strategy|uselightgbm|collectdata|sample-rate|prefer-asn):\s*[^,}]+/g, '')
        .replace(/type:\s*smart/g, 'type: url-test')
        return new Response(result, { headers: { 'Content-Type': 'text/yaml; charset=utf-8', 'Cache-Control': 'no-store' } });
      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

// ====== 配置区 ======
const CDN_PREFIX = 'https://cdn.jsdelivr.net/gh/';

const GH_PROXY_1 = 'https://gh-proxy.com/';
const GH_PROXY_2 = 'https://gh.llkk.cc/';
const GH_PROXY_3 = 'https://gh-proxy.org/';

const SUB_TPL_1 = 'https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/a.yml';
const SUB_TPL_2 = 'https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/b.yml';
const SUB_TPL_3 = 'https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/c.yml';

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>链接工具箱</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  background:linear-gradient(135deg,#4a5568,#2d3748);
  display:flex;align-items:center;justify-content:center;
}
.box{width:94%;max-width:1000px}
.title{text-align:center;color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-bottom:20px;letter-spacing:2px}
.row{
  display:flex;align-items:center;gap:10px;
  margin-bottom:10px;
}
.row input{
  flex:1;
  padding:10px 14px;
  border:1px solid rgba(255,255,255,.15);
  border-radius:8px;
  background:rgba(255,255,255,.08);
  color:#e2e8f0;
  font-size:.82rem;
  outline:none;
  backdrop-filter:blur(4px);
}
.row input::placeholder{color:rgba(255,255,255,.35)}
.row input:focus{border-color:rgba(255,255,255,.4)}
.row button{
  padding:10px 0;width:80px;flex-shrink:0;
  border:none;border-radius:8px;
  font-size:.8rem;cursor:pointer;
  color:#fff;transition:opacity .2s;
}
.row button:hover{opacity:.85}
.btn-cdn{background:#38a169}
.btn-gh{background:#4a9eff}
.btn-sub{background:#d69e2e}
.row a{
  flex:1;
  display:block;
  padding:10px 14px;
  border:1px solid rgba(255,255,255,.1);
  border-radius:8px;
  background:rgba(255,255,255,.05);
  color:rgba(255,255,255,.3);
  font-size:.8rem;
  text-decoration:none;
  word-break:break-all;
  line-height:1.3;
  min-height:38px;
  backdrop-filter:blur(4px);
  transition:color .2s,border-color .2s;
}
.row a.active{color:#90cdf4;border-color:rgba(144,205,244,.3)}
.row a.active:hover{color:#bee3f8;text-decoration:underline}
.sep{height:1px;background:rgba(255,255,255,.08);margin:6px 0}
@media(max-width:768px){
  html,body{overflow:auto}
  .row{flex-wrap:wrap}
  .row input,.row a{flex:1 1 100%}
  .row button{width:100%}
}
</style>
</head>
<body>
<div class="box">
  <div class="title">链接工具箱</div>

  <div class="row">
    <input id="i0" placeholder="GitHub 文件链接（CDN 加速）">
    <button class="btn-cdn" onclick="cdn(0)">CDN</button>
    <a id="o0">等待输入</a>
  </div>

  <div class="sep"></div>

  <div class="row">
    <input id="i1" placeholder="GitHub 链接（gh-proxy.com）">
    <button class="btn-gh" onclick="gh(1,0)">加速</button>
    <a id="o1">等待输入</a>
  </div>
  <div class="row">
    <input id="i2" placeholder="GitHub 链接（github.akams.cn）">
    <button class="btn-gh" onclick="gh(2,1)">加速</button>
    <a id="o2">等待输入</a>
  </div>
  <div class="row">
    <input id="i3" placeholder="GitHub 链接（gh-proxy.org）">
    <button class="btn-gh" onclick="gh(3,2)">加速</button>
    <a id="o3">等待输入</a>
  </div>

  <div class="sep"></div>

  <div class="row">
    <input id="i4" placeholder="订阅链接（FallBack Smart）">
    <button class="btn-sub" onclick="sub(4,0)">转换</button>
    <a id="o4">等待输入</a>
  </div>
  <div class="row">
    <input id="i5" placeholder="订阅链接（OneSmart 极简版）">
    <button class="btn-sub" onclick="sub(5,1)">转换</button>
    <a id="o5">等待输入</a>
  </div>
  <div class="row">
    <input id="i6" placeholder="订阅链接（Mihomo_Smart）">
    <button class="btn-sub" onclick="sub(6,2)">转换</button>
    <a id="o6">等待输入</a>
  </div>
</div>

<script>
const GP=['${GH_PROXY_1}','${GH_PROXY_2}','${GH_PROXY_3}'];
const ST=['${SUB_TPL_1}','${SUB_TPL_2}','${SUB_TPL_3}'];

function out(n,url){
  const a=document.getElementById('o'+n);
  a.textContent=url;a.href=url;a.target='_blank';a.classList.add('active');
}
function err(n,msg){
  const a=document.getElementById('o'+n);
  a.textContent=msg;a.removeAttribute('href');a.classList.remove('active');
}

function cdn(n){
  const v=document.getElementById('i'+n).value.trim();
  if(!v){err(n,'等待输入');return}
  const m=v.match(/github\\.com\\/([^/]+)\\/([^/]+)\\/blob\\/([^/]+)\\/(.+)/);
  if(!m){err(n,'格式错误：需要 github.com/.../blob/... 链接');return}
  out(n,'${CDN_PREFIX}'+m[1]+'/'+m[2]+'@'+m[3]+'/'+m[4]);
}

function gh(n,i){
  const v=document.getElementById('i'+n).value.trim();
  if(!v){err(n,'等待输入');return}
  if(!GP[i]){err(n,'未配置');return}
  const url=v.startsWith('http')?v:'https://'+v;
  const p=GP[i];
  out(n,p.endsWith('/')?p+url:p+'/'+url);
}

async function sub(n,i){
  const v=document.getElementById('i'+n).value.trim();
  if(!v){err(n,'等待输入');return}
  const a=document.getElementById('o'+n);
  a.textContent='转换中...';a.removeAttribute('href');a.classList.remove('active');
  try{
    const r=await fetch('/convert',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({subUrl:v,tplIndex:i})});
    if(!r.ok){const d=await r.json().catch(()=>({}));err(n,d.error||'转换失败');return}
    out(n,location.origin+'/convert?sub='+encodeURIComponent(v)+'&tpl='+i);
  }catch(e){err(n,e.message||'请求失败');}
}
</script>
</body>
</html>`;
