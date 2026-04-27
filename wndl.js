#万能代理，慎用（封号）

export default {
  async fetch(request) {
    const url = new URL(request.url)

    const CONFIG = {
      // 🌐 白名单
      // 👉 留空 "" = 所有网站允许
      // 👉 写域名 = 只允许这些
      ALLOW_DOMAINS: [""]
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      })
    }

    if (url.pathname === "/" && !url.searchParams.get("url")) {
      return new Response(home(), {
        headers: { "content-type": "text/html;charset=utf-8" }
      })
    }

    const inputUrl = url.searchParams.get("url")
    if (!inputUrl) {
      return new Response("❌ 缺少 url 参数", { status: 400 })
    }

    let targetURL
    try {
      targetURL = new URL(inputUrl)
    } catch {
      return new Response("❌ URL错误", { status: 400 })
    }

    const host = targetURL.hostname
    const allowed = CONFIG.ALLOW_DOMAINS.some(d =>
      d === "" || host === d || host.endsWith("." + d)
    )

    if (CONFIG.ALLOW_DOMAINS.length > 0 && !allowed) {
      return new Response("🚫 不在白名单", { status: 403 })
    }

    const newHeaders = new Headers()

    for (let [k, v] of request.headers) {
      const key = k.toLowerCase()
      if (["host", "cf-ray", "cf-connecting-ip"].includes(key)) continue
      newHeaders.set(k, v)
    }

    newHeaders.set(
      "user-agent",
      request.headers.get("user-agent") ||
      "Mozilla/5.0 Chrome/120 Safari/537.36"
    )

    newHeaders.set("referer", targetURL.origin)
    newHeaders.set("origin", targetURL.origin)

    let response
    try {
      response = await fetch(targetURL.toString(), {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        redirect: "follow"
      })
    } catch {
      return new Response("❌ 请求失败", { status: 502 })
    }

    let res = new Response(response.body, response)

    const h = corsHeaders()
    for (let k in h) res.headers.set(k, h[k])

    const setCookie = response.headers.get("set-cookie")
    if (setCookie) res.headers.set("set-cookie", setCookie)

    res.headers.delete("content-security-policy")
    res.headers.delete("x-frame-options")

    return res
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Credentials": "true"
  }
}

// =========================
// UI（横向输入版）
// =========================
function home() {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{
  margin:0;
  height:100vh;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  font-family:-apple-system,sans-serif;
  background:url('https://img.netbian.com/file/2026/0424/2244060ey8L.jpg') no-repeat center;
  background-size:cover;
}

/* 标题 */
.title{
  color:#fff;
  font-size:22px;
  margin-bottom:10px;
}

/* 引流 */
.link{
  margin-bottom:20px;
}
.link a{
  color:#00d4ff;
  text-decoration:none;
}

/* 输入区域 */
.wrap{
  width:90%;
  max-width:420px;
  display:flex;
  gap:10px;
}

/* 输入框 */
input{
  flex:1;
  padding:14px;
  border-radius:25px;
  border:none;
  outline:none;

  background:rgba(255,255,255,0.25);
  backdrop-filter:blur(10px);

  color:#fff;
}

/* 进入按钮 */
.go{
  padding:0 18px;
  border:none;
  border-radius:25px;
  background:rgba(0,212,255,0.9);
  color:#000;
  font-weight:bold;
}
</style>
</head>
<body>

<div class="title">万能代理</div>


<div class="wrap">
<input id="u" placeholder="输入网址..."
onkeydown="if(event.key==='Enter') go()">

<button class="go" onclick="go()">进入</button>
</div>

<script>
function go(){
  let v = document.getElementById('u').value.trim()
  if(!v) return

  if(!/^https?:\\/\\//i.test(v)){
    v = "https://" + v
  }

  location.href='/?url='+encodeURIComponent(v)
}
</script>

</body>
</html>
`
}
