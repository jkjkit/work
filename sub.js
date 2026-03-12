export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });

    if (url.pathname === "/api/fetch" && req.method === "GET") return apiFetch(url);
    if (url.pathname === "/api/parse" && req.method === "POST") return apiParse(req);
    if (url.pathname === "/api/gen" && req.method === "POST") return apiGen(req, env);
    if (req.method === "GET" && /^\/sub\/[A-Za-z0-9]{6}\.ya?ml$/i.test(url.pathname)) return apiSub(url, env);

    if (url.pathname === "/" && req.method === "GET") {
      return new Response(html(), { headers: { "content-type": "text/html; charset=UTF-8" } });
    }
    return new Response("Not Found", { status: 404 });
  },
};

const TEMPLATE_URL = "https://raw.githubusercontent.com/jkjkit/clash/refs/heads/main/Clash.yaml";
const TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TOKEN_LEN = 6;

const cors = () => ({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
});
const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { ...cors(), "content-type": "application/json; charset=UTF-8" },
  });

const compact = (o) =>
  Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== "" && v !== null && v !== undefined));
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const toBool = (v) => /^(1|true|yes|tls|reality)$/i.test(String(v || ""));

function token() {
  let out = "";
  for (let i = 0; i < TOKEN_LEN; i++) out += TOKEN_CHARS[(Math.random() * TOKEN_CHARS.length) | 0];
  return out;
}
async function uniqueToken(kv, retry = 12) {
  for (let i = 0; i < retry; i++) {
    const t = token();
    if (!(await kv.get(t))) return t;
  }
  return "";
}

/* ---------------- parse ---------------- */

const b64norm = (s) => String(s || "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
function b64decode(s) {
  const t = b64norm(s),
    m = t.length % 4;
  try {
    return atob(m ? t + "=".repeat(4 - m) : t);
  } catch {
    return "";
  }
}
function utf8(s) {
  try {
    return new TextDecoder("utf-8").decode(Uint8Array.from(String(s), (c) => c.charCodeAt(0)));
  } catch {
    return s;
  }
}
function pScalar(v) {
  const t = String(v || "").trim();
  if (!t) return "";
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (/^(true|false)$/i.test(t)) return /^true$/i.test(t);
  return t;
}
function splitKV(s) {
  let q = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i],
      pv = s[i - 1];
    if (q) {
      if (ch === q && pv !== "\\") q = "";
      continue;
    }
    if (ch === '"' || ch === "'") {
      q = ch;
      continue;
    }
    if (ch === ":") return { key: s.slice(0, i).trim().replace(/^['"]|['"]$/g, ""), value: pScalar(s.slice(i + 1).trim()) };
  }
  return null;
}
function parseInlineObj(s) {
  let t = String(s || "").trim();
  if (!t.startsWith("{") || !t.endsWith("}")) return null;
  t = t.slice(1, -1);
  const parts = [];
  let cur = "",
    q = "",
    depth = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i],
      pv = t[i - 1];
    if (q) {
      cur += ch;
      if (ch === q && pv !== "\\") q = "";
      continue;
    }
    if (ch === '"' || ch === "'") {
      q = ch;
      cur += ch;
      continue;
    }
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  const o = {};
  for (const p of parts) {
    const kv = splitKV(p);
    if (kv) o[kv.key] = kv.value;
  }
  return compact(o);
}

function parseVmess(link) {
  const raw = b64decode(link.slice(8).trim());
  if (!raw) return null;
  let j;
  try {
    j = JSON.parse(utf8(raw));
  } catch {
    return null;
  }
  return compact({
    name: j.ps || "",
    type: "vmess",
    server: j.add || "",
    port: toNum(j.port),
    uuid: j.id || "",
    alterId: toNum(j.aid),
    cipher: j.scy || "auto",
    network: j.net || "",
    tls: j.tls || "",
    servername: j.sni || "",
    wsPath: j.path || "",
    wsHeaders: j.host ? `Host:${j.host}` : "",
  });
}
function parseVless(link) {
  const u = new URL(link),
    sec = (u.searchParams.get("security") || "").toLowerCase(),
    host = u.searchParams.get("host") || "";
  return compact({
    name: decodeURIComponent((u.hash || "").slice(1)),
    type: "vless",
    server: u.hostname,
    port: toNum(u.port),
    uuid: decodeURIComponent(u.username || ""),
    flow: u.searchParams.get("flow") || "",
    network: u.searchParams.get("type") || "",
    tls: sec === "tls" || sec === "reality",
    servername: u.searchParams.get("sni") || "",
    realityPubKey: u.searchParams.get("pbk") || "",
    realityShortId: u.searchParams.get("sid") || "",
    wsPath: u.searchParams.get("path") || "",
    wsHeaders: host ? `Host:${host}` : "",
  });
}
function parseTrojan(link) {
  const u = new URL(link),
    host = u.searchParams.get("host") || "";
  return compact({
    name: decodeURIComponent((u.hash || "").slice(1)),
    type: "trojan",
    server: u.hostname,
    port: toNum(u.port),
    password: decodeURIComponent(u.username || ""),
    network: u.searchParams.get("type") || "",
    sni: u.searchParams.get("sni") || "",
    skipCertVerify: /^(1|true|yes)$/i.test(u.searchParams.get("allowInsecure") || ""),
    wsPath: u.searchParams.get("path") || "",
    wsHeaders: host ? `Host:${host}` : "",
  });
}
function parseSS(link) {
  const hash = link.indexOf("#"),
    query = link.indexOf("?");
  let end = link.length;
  if (hash >= 0) end = Math.min(end, hash);
  if (query >= 0) end = Math.min(end, query);
  const name = hash >= 0 ? decodeURIComponent(link.slice(hash + 1)) : "";
  let body = link.slice(5, end).trim();
  const q = query >= 0 ? link.slice(query + 1, hash >= 0 ? hash : undefined) : "";
  if (!body.includes("@")) {
    const d = b64decode(body);
    if (d) body = d;
  }
  if (!body.includes("@")) return null;
  const at = body.lastIndexOf("@"),
    left = body.slice(0, at),
    right = body.slice(at + 1),
    i = left.indexOf(":"),
    j = right.lastIndexOf(":");
  if (i < 0 || j < 0) return null;
  return compact({
    name,
    type: "ss",
    server: right.slice(0, j),
    port: toNum(right.slice(j + 1)),
    cipher: left.slice(0, i),
    password: left.slice(i + 1),
    plugin: new URLSearchParams(q).get("plugin") || "",
  });
}
function parseHY2(link) {
  const u = new URL(link);
  return compact({
    name: decodeURIComponent((u.hash || "").slice(1)),
    type: "hysteria2",
    server: u.hostname,
    port: toNum(u.port),
    password: decodeURIComponent(u.username || ""),
    sni: u.searchParams.get("sni") || "",
    skipCertVerify: /^(1|true|yes)$/i.test(u.searchParams.get("insecure") || ""),
    alpn: u.searchParams.get("alpn") || "",
  });
}
function parseLink(x) {
  const t = String(x || "").trim();
  try {
    if (t.startsWith("vmess://")) return parseVmess(t);
    if (t.startsWith("vless://")) return parseVless(t);
    if (t.startsWith("trojan://")) return parseTrojan(t);
    if (t.startsWith("ss://")) return parseSS(t);
    if (t.startsWith("hysteria2://")) return parseHY2(t);
  } catch {}
  return null;
}
function byLine(text) {
  return String(text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseLink)
    .filter(Boolean)
    .map((n) => compact({ ...n, __src: "uri" }));
}
// 递归解析一个 YAML 块（对象或列表），完整保留所有嵌套字段
function parseYamlBlock(lines, start, minIndent) {
  // 找到第一个有效行，确定本块缩进基准
  let baseIndent = -1;
  let i = start;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t) { baseIndent = lines[i].length - lines[i].trimStart().length; break; }
    i++;
  }
  if (baseIndent < minIndent) return { value: null, nextIndex: i };

  const firstT = lines[i].trim();

  if (firstT.startsWith("- ") || firstT === "-") {
    // 解析列表
    const arr = [];
    while (i < lines.length) {
      const l = lines[i], t = l.trim();
      if (!t) { i++; continue; }
      const ind = l.length - l.trimStart().length;
      if (ind < baseIndent) break;
      if (ind === baseIndent && (t.startsWith("- ") || t === "-")) {
        const rest = t.replace(/^-\s*/, "").trim();
        // inline object: - { key: val, ... }
        if (rest.startsWith("{")) {
          const o = parseInlineObj(rest);
          arr.push(o ?? rest);
          i++;
          continue;
        }
        // 读取 list-item 内的映射字段（block mapping）
        const obj = {};
        const kv0 = rest ? splitKV(rest) : null;
        if (kv0) {
          // 有可能值是空的（下方有子块）
          const afterColon = rest.slice(rest.indexOf(":") + 1).trim();
          if (afterColon === "" || afterColon === "|" || afterColon === ">") {
            const sub = parseYamlBlock(lines, i + 1, ind + 1);
            obj[kv0.key] = sub.value;
            i = sub.nextIndex;
          } else {
            obj[kv0.key] = kv0.value;
            i++;
          }
        } else if (rest) {
          // 纯标量列表元素
          arr.push(pScalar(rest));
          i++;
          continue;
        } else {
          i++;
        }
        // 读取同一 list-item 下更深缩进的字段
        while (i < lines.length) {
          const l2 = lines[i], t2 = l2.trim();
          if (!t2) { i++; continue; }
          const ind2 = l2.length - l2.trimStart().length;
          if (ind2 <= ind) break;
          const kv2 = splitKV(t2);
          if (kv2) {
            const afterColon2 = t2.slice(t2.indexOf(":") + 1).trim();
            if (afterColon2 === "" || afterColon2 === "|" || afterColon2 === ">") {
              const sub = parseYamlBlock(lines, i + 1, ind2 + 1);
              obj[kv2.key] = sub.value;
              i = sub.nextIndex;
            } else {
              obj[kv2.key] = kv2.value;
              i++;
            }
          } else {
            i++;
          }
        }
        arr.push(Object.keys(obj).length ? compact(obj) : null);
        continue;
      }
      i++;
    }
    return { value: arr.filter(x => x !== null), nextIndex: i };
  } else {
    // 解析对象映射
    const obj = {};
    while (i < lines.length) {
      const l = lines[i], t = l.trim();
      if (!t) { i++; continue; }
      const ind = l.length - l.trimStart().length;
      if (ind < baseIndent) break;
      const kv = splitKV(t);
      if (kv) {
        const afterColon = t.slice(t.indexOf(":") + 1).trim();
        if (afterColon === "" || afterColon === "|" || afterColon === ">") {
          const sub = parseYamlBlock(lines, i + 1, ind + 1);
          obj[kv.key] = sub.value;
          i = sub.nextIndex;
        } else {
          obj[kv.key] = kv.value;
          i++;
        }
      } else {
        i++;
      }
    }
    return { value: compact(obj), nextIndex: i };
  }
}

function yamlNodes(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0;
  // 找到 proxies: 行（支持有无尾随空格）
  while (i < lines.length) {
    if (/^proxies\s*:\s*$/.test(lines[i].trim())) { i++; break; }
    i++;
  }
  if (i >= lines.length) return out;
  const result = parseYamlBlock(lines, i, 0);
  if (!Array.isArray(result.value)) return out;
  for (const node of result.value) {
    if (node && typeof node === "object" && node.type) out.push({ ...node, __src: "yaml" });
  }
  return out;
}
function parseNodes(raw) {
  const text = String(raw || "").replace(/\r/g, "");
  if (!text.trim()) return { mode: "empty", nodes: [] };
  const y = yamlNodes(text);
  if (y.length) return { mode: "yaml", nodes: y };
  const l = byLine(text);
  if (l.length) return { mode: "link", nodes: l };
  const d = b64decode(text);
  if (d) {
    const t = utf8(d),
      y2 = yamlNodes(t);
    if (y2.length) return { mode: "base64-yaml", nodes: y2 };
    const l2 = byLine(t);
    if (l2.length) return { mode: "base64-link", nodes: l2 };
  }
  return { mode: "unknown", nodes: [] };
}

/* ---------------- inline yaml output ---------------- */

function yVal(v) {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";

  if (Array.isArray(v)) return `[${v.map(yVal).join(", ")}]`;

  if (v && typeof v === "object") {
    const kv = Object.entries(v)
      .filter(([, x]) => x !== "" && x !== null && x !== undefined)
      .map(([k, x]) => `${k}: ${yVal(x)}`);
    return `{ ${kv.join(", ")} }`;
  }

  const s = String(v ?? "");
  // 含特殊字符时加双引号
  if (/[:{}\[\],#&*?|<>=!%@`]/.test(s) || s.includes("'")) return `"${s.replace(/"/g, '\\"')}"`;
  return s;
}
function hostFromWsHeaders(s) {
  const m = String(s || "").match(/^\s*Host\s*:\s*(.+)\s*$/i);
  return m ? m[1].trim() : "";
}
function normalizeNode(n0) {
  const n = { ...(n0 || {}) };
  delete n.__hidden;

  // YAML 来源节点：字段已是 Clash 规范（如 ws-opts、skip-cert-verify），
  // 只做最小修复，不转换原始结构
  if (n.__src === "yaml") {
    delete n.__src;
    // 确保 tls 是布尔值（有时 YAML 解析为字符串）
    if (n.tls !== undefined && typeof n.tls !== "boolean") n.tls = toBool(n.tls);
    // alpn 若为逗号字符串则转数组
    if (typeof n.alpn === "string" && n.alpn.includes(","))
      n.alpn = n.alpn.split(",").map((x) => x.trim()).filter(Boolean);
    return compact(n);
  }

  // URI / Base64 来源节点：需要将中间格式字段转换为 Clash 规范字段
  delete n.__src;
  if (n.skipCertVerify !== undefined) {
    n["skip-cert-verify"] = !!n.skipCertVerify;
    delete n.skipCertVerify;
  }
  if (n.wsPath || n.wsHeaders) {
    const h = hostFromWsHeaders(n.wsHeaders);
    n["ws-opts"] = compact({ path: n.wsPath || "", headers: h ? { Host: h } : "" });
    delete n.wsPath;
    delete n.wsHeaders;
  }
  // realityPubKey / realityShortId → reality-opts
  if (n.realityPubKey || n.realityShortId) {
    n["reality-opts"] = compact({ "public-key": n.realityPubKey || "", "short-id": n.realityShortId || "" });
    delete n.realityPubKey;
    delete n.realityShortId;
  }
  if (typeof n.alpn === "string" && n.alpn.includes(","))
    n.alpn = n.alpn.split(",").map((x) => x.trim()).filter(Boolean);
  if (n.tls !== undefined && n.tls !== "") n.tls = toBool(n.tls) || n.tls === true;
  // servername → sni（Clash 统一用 servername，trojan/hy2 原本就是 sni，统一一下）
  if (n.sni && !n.servername) { n.servername = n.sni; delete n.sni; }

  return compact(n);
}
function buildInlineYaml(nodes) {
  const nameCount = {};
  const normalized = (Array.isArray(nodes) ? nodes : [])
    .map(normalizeNode)
    .filter((n) => n.type && n.server && n.port)
    .map((n) => {
      const orig = n.name || "节点";
      nameCount[orig] = (nameCount[orig] || 0) + 1;
      if (nameCount[orig] > 1) n = { ...n, name: `${orig} ${nameCount[orig]}` };
      return n;
    });

  const yamlLines = normalized
    .map((n) => {
      const kv = Object.entries(n)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${yVal(v)}`)
        .join(", ");
      return `  - { ${kv} }`;
    })
    .join("\n") + "\n";

  // 返回节点名称列表供 proxy-groups 替换使用
  const names = normalized.map((n) => n.name || "节点");
  return { yamlLines, names };
}

/* ---------------- proxy-groups name injection ---------------- */

// 将 proxy-groups 中每个 group 的 proxies 列表替换为实际节点名称
function fixProxyGroups(yaml, nodeNames) {
  if (!nodeNames.length) return yaml;
  const lines = yaml.split("\n");
  const out = [];
  let inGroups = false;
  let inProxies = false;
  let proxiesIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const t = l.trim();
    const ind = l.length - l.trimStart().length;

    // 进入 proxy-groups 区块
    if (/^proxy-groups\s*:/.test(t)) {
      inGroups = true;
      inProxies = false;
      out.push(l);
      continue;
    }

    // 离开 proxy-groups 区块（遇到同级或更高级的 key）
    if (inGroups && t && ind === 0 && !/^\s*-/.test(l)) {
      inGroups = false;
      inProxies = false;
    }

    if (!inGroups) {
      out.push(l);
      continue;
    }

    // 新的 group 条目开始，重置 proxies 状态
    if (/^\s*-\s+name\s*:/.test(l)) {
      inProxies = false;
      proxiesIndent = -1;
      out.push(l);
      continue;
    }

    // 遇到 proxies: 行，注入节点名并跳过旧条目
    if (/^\s*proxies\s*:/.test(l)) {
      inProxies = true;
      proxiesIndent = ind;
      out.push(l);
      // 注入新节点名称
      for (const name of nodeNames) {
        out.push(" ".repeat(ind + 2) + "- " + yVal(name));
      }
      // 跳过原有的 proxies 条目
      while (i + 1 < lines.length) {
        const nl = lines[i + 1];
        const nt = nl.trim();
        const ni = nl.length - nl.trimStart().length;
        if (nt.startsWith("- ") && ni > proxiesIndent) {
          i++;
          continue;
        }
        break;
      }
      inProxies = false;
      continue;
    }

    out.push(l);
  }

  return out.join("\n");
}

/* ---------------- apis ---------------- */

async function apiFetch(url) {
  const target = (url.searchParams.get("url") || "").trim();
  if (!target) return json({ ok: false, error: "缺少 url 参数" }, 400);
  let u;
  try {
    u = new URL(target);
  } catch {
    return json({ ok: false, error: "url 不合法" }, 400);
  }
  if (!/^https?:$/.test(u.protocol)) return json({ ok: false, error: "仅支持 http/https" }, 400);

  try {
    const r = await fetch(u.toString(), { headers: { "user-agent": "Mozilla/5.0 Worker" }, redirect: "follow" });
    const raw = await r.text(),
      p = parseNodes(raw);
    return json({ ok: true, status: r.status, mode: p.mode, nodes: p.nodes, message: `提取到 ${p.nodes.length} 条节点` });
  } catch (e) {
    return json({ ok: false, error: e?.message || "请求失败" }, 502);
  }
}
async function apiParse(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body.text || "");
    if (!text.trim()) return json({ ok: false, error: "缺少 text 内容" }, 400);
    const p = parseNodes(text);
    return json({ ok: true, mode: p.mode, nodes: p.nodes, message: `提取到 ${p.nodes.length} 条节点` });
  } catch (e) {
    return json({ ok: false, error: e?.message || "解析失败" }, 500);
  }
}
async function apiGen(req, env) {
  if (!env?.SUB_KV) return json({ ok: false, error: "未绑定 KV：SUB_KV" }, 500);
  try {
    const body = await req.json().catch(() => ({}));
    const nodes = Array.isArray(body.nodes) ? body.nodes : [];
    if (!nodes.length) return json({ ok: false, error: "缺少 nodes 内容" }, 400);

    const { yamlLines, names } = buildInlineYaml(nodes);
    if (!yamlLines.trim()) return json({ ok: false, error: "没有可用节点可生成" }, 400);

    const t = await uniqueToken(env.SUB_KV);
    if (!t) return json({ ok: false, error: "生成 token 失败，请重试" }, 500);

    // 将 yamlLines 和 names 一起存入 KV，以 JSON 格式保存
    await env.SUB_KV.put(t, JSON.stringify({ yamlLines, names }));
    return json({ ok: true, token: t, message: "已生成新的短链", createdAt: Date.now() });
  } catch (e) {
    return json({ ok: false, error: e?.message || "生成失败" }, 500);
  }
}
function mergeTemplate(template, subLines) {
  const lines = String(template || "").replace(/\r/g, "").split("\n");
  const idx = lines.findIndex((l) => /^\s*proxies\s*:\s*$/.test(l));
  if (idx < 0) return `${lines.join("\n")}\nproxies:\n${subLines}\n`;

  const head = lines.slice(0, idx + 1),
    rest = lines.slice(idx + 1);
  let cut = rest.length;
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i].trim();
    if (!t) continue;
    if (/^[A-Za-z0-9_-]+\s*:/.test(t)) {
      cut = i;
      break;
    }
  }
  return [...head, ...String(subLines || "").split("\n").filter(Boolean), "", ...rest.slice(cut)].join("\n");
}
async function apiSub(url, env) {
  if (!env?.SUB_KV)
    return new Response("未绑定 KV：SUB_KV", { status: 500, headers: { ...cors(), "content-type": "text/plain; charset=UTF-8" } });

  const m = url.pathname.match(/^\/sub\/([A-Za-z0-9]{6})\.ya?ml$/i),
    t = m ? m[1] : "";
  if (!t) return new Response("无效订阅参数", { status: 400, headers: { ...cors(), "content-type": "text/plain; charset=UTF-8" } });

  const raw = (await env.SUB_KV.get(t)) || "";
  if (!raw.trim()) return new Response("订阅不存在", { status: 404, headers: { ...cors(), "content-type": "text/plain; charset=UTF-8" } });

  // 兼容旧格式（纯 yamlLines 字符串）和新格式（JSON { yamlLines, names }）
  let yamlLines = raw;
  let names = [];
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.yamlLines) {
      yamlLines = parsed.yamlLines;
      names = Array.isArray(parsed.names) ? parsed.names : [];
    }
  } catch {
    // 旧格式，从 yamlLines 中提取 name 字段
    names = [...yamlLines.matchAll(/\bname:\s*"([^"]+)"|name:\s*([^,}\s][^,}]*)/g)]
      .map((r) => (r[1] || r[2] || "").trim())
      .filter(Boolean);
  }

  let tpl = "";
  try {
    const r = await fetch(TEMPLATE_URL, {
      headers: { "user-agent": "Mozilla/5.0 Worker", accept: "*/*" },
      redirect: "follow",
    });
    if (!r.ok)
      return new Response(`拉取模板失败: HTTP ${r.status}`, {
        status: 502,
        headers: { ...cors(), "content-type": "text/plain; charset=UTF-8" },
      });
    tpl = await r.text();
  } catch (e) {
    return new Response(`拉取模板异常: ${e?.message || "未知错误"}`, {
      status: 502,
      headers: { ...cors(), "content-type": "text/plain; charset=UTF-8" },
    });
  }

  const merged = mergeTemplate(tpl, yamlLines);
  const final = fixProxyGroups(merged, names);

  return new Response(final, {
    headers: { ...cors(), "content-type": "text/yaml; charset=UTF-8", "cache-control": "no-store" },
  });
}

/* ---------------- ui ---------------- */

function html() {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>节点管理</title>
<style>
:root{--bg:#faf9f5;--surface:#f2f0ea;--surface2:#eceae2;--border:#dedad0;--border2:#ccc9be;--text:#1a1916;--text2:#6b6860;--text3:#9c9a96;--accent:#2a2927;--blue:#1d4ed8;--green:#15803d;--amber:#b45309;--purple:#7c3aed;--cyan:#0e7490}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);height:100vh;overflow:hidden}
/* Desktop layout */
.layout{display:grid;grid-template-columns:360px 360px 1fr;gap:12px;height:calc(100vh * 0.88);width:calc(100vw * 0.88);margin:calc(100vh * 0.06) auto}
.panel{background:#fff;border:1px solid var(--border);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.03)}
.panel-header{padding:16px 18px 14px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text2);flex-shrink:0}
.panel-body{padding:16px 18px;overflow-y:auto;flex:1}
.panel-body::-webkit-scrollbar{width:4px}
.panel-body::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
/* Mobile tabs - hidden on desktop */
.tab-bar{display:none}
/* Form */
.field{margin-bottom:10px}
.field label{display:block;font-size:11px;font-weight:500;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
input[type=url],textarea{width:100%;padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:7px;font-size:13px;font-family:inherit;color:var(--text);outline:none;transition:border-color .15s}
input[type=url]:focus,textarea:focus{border-color:var(--border2);background:#fff}
textarea{resize:none;min-height:90px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.5}
#subLink{min-height:52px;font-size:11px;color:var(--text2)}
.divider{height:1px;background:var(--border);margin:14px 0}
/* Buttons */
.btn-row{display:flex;gap:6px;flex-wrap:wrap}
.btn{flex:1;min-width:0;padding:8px 10px;border:none;border-radius:7px;font-size:12px;font-family:inherit;font-weight:500;cursor:pointer;transition:opacity .15s,transform .1s;white-space:nowrap}
.btn:hover{opacity:.85}.btn:active{transform:scale(.97)}.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.btn-dark{background:var(--accent);color:#fff}.btn-green{background:var(--green);color:#fff}.btn-amber{background:var(--amber);color:#fff}.btn-purple{background:var(--purple);color:#fff}.btn-cyan{background:var(--cyan);color:#fff}.btn-ghost{background:var(--surface2);color:var(--text);border:1px solid var(--border)}
#status{margin-top:12px;font-size:12px;font-family:ui-monospace,Menlo,monospace;color:var(--text2);line-height:1.5;padding:8px 10px;background:var(--surface);border-radius:6px;border:1px solid var(--border);min-height:40px}
/* Node list */
.node{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:12.5px;margin-bottom:6px;background:var(--bg);transition:border-color .15s}
.node:hover{border-color:var(--border2)}.node.hidden{opacity:.45}
.tag{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;font-family:ui-monospace,Menlo,monospace;white-space:nowrap;color:#fff}
.t-vmess{background:var(--blue)}.t-vless{background:var(--green)}.t-trojan{background:#c2410c}.t-ss{background:var(--purple)}.t-hysteria2{background:#be185d}.t-other{background:var(--text3)}
.name{flex:1;min-width:0;padding:4px 7px;background:transparent;border:1px solid transparent;border-radius:5px;font-size:12.5px;font-family:inherit;color:var(--text);transition:border-color .15s,background .15s}
.name:focus{background:#fff;border-color:var(--border);outline:none}
.mini{padding:4px 9px;border:1px solid var(--border);border-radius:5px;background:#fff;color:var(--text2);font-size:11px;font-family:inherit;cursor:pointer;transition:background .15s;white-space:nowrap}
.mini:hover{background:var(--surface)}
.fmt-btn{padding:3px 9px;border:1px solid var(--border);border-radius:5px;background:#fff;color:var(--text2);font-size:10px;font-weight:600;font-family:ui-monospace,Menlo,monospace;cursor:pointer;transition:background .15s,color .15s,border-color .15s;white-space:nowrap;letter-spacing:.03em}
.fmt-btn:hover{background:var(--surface);border-color:var(--border2)}
.fmt-btn.active{background:var(--accent);color:#fff;border-color:var(--accent)}
#out{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.7;color:var(--text2);white-space:pre-wrap;word-break:break-all}
/* ---- Mobile ---- */
@media(max-width:768px){
  body{overflow:auto}
  .layout{display:block;height:auto;width:100%;margin:0;padding:0}
  .panel{border-radius:0;border:none;border-bottom:1px solid var(--border);box-shadow:none;display:none;min-height:calc(100vh - 56px)}
  .panel.active{display:flex}
  .panel-header{display:none}
  .panel-body{padding:16px}
  .tab-bar{display:flex;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--border);z-index:100;height:56px}
  .tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:10px;font-weight:500;color:var(--text3);cursor:pointer;transition:color .15s;border:none;background:none;font-family:inherit}
  .tab.active{color:var(--accent)}
  .tab svg{width:20px;height:20px;stroke-width:1.8}
  body{padding-bottom:56px}
}
</style></head>
<body>
<div class="layout">
  <div class="panel active" id="panel-0">
    <div class="panel-header">控制面板</div>
    <div class="panel-body">
      <div class="field"><label>订阅链接</label><input id="subUrl" type="url" placeholder="https://..."/></div>
      <div class="btn-row">
        <button id="fetchReplace" class="btn btn-dark">解析订阅</button>
        <button id="fetchAppend" class="btn btn-ghost">追加</button>
      </div>
      <div class="divider"></div>
      <div class="field"><label>手动添加节点</label><textarea id="addText" placeholder="支持 Base64 / vmess / vless / trojan / ss / hy2 / YAML"></textarea></div>
      <div class="btn-row"><button id="addTop" class="btn btn-green">添加到顶部</button></div>
      <div class="divider"></div>
      <div class="field">
        <label>生成订阅</label>
        <div class="btn-row" style="margin-bottom:8px">
          <button id="genSub" class="btn btn-purple">生成</button>
          <button id="copySub" class="btn btn-amber">复制</button>
          <button id="openSub" class="btn btn-cyan">预览</button>
        </div>
        <textarea id="subLink" readonly placeholder="点击「生成」后显示订阅链接"></textarea>
      </div>
      <div id="status">等待输入订阅链接。</div>
    </div>
  </div>
  <div class="panel" id="panel-1">
    <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between">
      <span>节点列表</span>
      <button id="clearNodes" class="fmt-btn" style="color:#c0392b;border-color:#e8c8c8">清除</button>
    </div>
    <div class="panel-body"><div id="mid"></div></div>
  </div>
  <div class="panel" id="panel-2">
    <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between">
      <span>节点数据</span>
      <div id="fmtBar" style="display:flex;gap:4px">
        <button class="fmt-btn active" data-fmt="yaml-inline">YAML</button>
        <button class="fmt-btn" data-fmt="uri">URI</button>
        <button class="fmt-btn" data-fmt="base64">Base64</button>
      </div>
    </div>
    <div class="panel-body"><pre id="out"></pre></div>
  </div>
</div>
<nav class="tab-bar">
  <button class="tab active" data-panel="0">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18M3 6h18M3 18h18"/></svg>控制面板
  </button>
  <button class="tab" data-panel="1">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>节点列表
  </button>
  <button class="tab" data-panel="2">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>节点数据
  </button>
</nav>
<script>
// Tab switching (mobile only)
document.querySelectorAll('.tab').forEach(tab=>{
  tab.onclick=()=>{
    const p=tab.dataset.panel;
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.panel===p));
    document.querySelectorAll('.panel').forEach((el,i)=>el.classList.toggle('active',String(i)===p));
  };
});
</script>
<script>(()=>{const $=id=>document.getElementById(id),el={sub:$("subUrl"),rep:$("fetchReplace"),app:$("fetchAppend"),add:$("addText"),top:$("addTop"),st:$("status"),mid:$("mid"),out:$("out"),gen:$("genSub"),cpy:$("copySub"),open:$("openSub"),subLink:$("subLink")};const typeMeta={vmess:["t-vmess","Vmess"],vless:["t-vless","Vless"],trojan:["t-trojan","Trojan"],ss:["t-ss","Ss"],hysteria2:["t-hysteria2","Hysteria2"],other:["t-other","Other"]};let nodes=[];const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),setStatus=s=>el.st.textContent=s,typeKey=x=>String(x||"other").toLowerCase(),visible=()=>nodes.filter(n=>!n.__hidden);function fmtVal(v){if(v===null||v===undefined)return "";if(typeof v==="boolean")return v?"true":"false";if(typeof v==="number")return String(v);if(Array.isArray(v))return "["+v.map(fmtVal).join(", ")+"]";if(typeof v==="object"){const kv=Object.entries(v).filter(([,x])=>x!==""&&x!==null&&x!==undefined).map(([k,x])=>k+": "+fmtVal(x));return "{ "+kv.join(", ")+" }";}const s=String(v);if(/[:{},#&*?|<>=!%@\x60]/.test(s)||s.includes("[")||s.includes("]")||s.includes("'"))return '"'+s.replace(/"/g,'\\"')+'"';return s;}const PRIO=["name","type","server","port","uuid","password","cipher","alterId","flow","network","tls","servername","sni","plugin","plugin-opts","ws-opts","reality-opts","skip-cert-verify","alpn"];function one(n){const seen=new Set(["__hidden","__src"]);const a=[];for(const k of PRIO){if(!(k in n))continue;const v=n[k];seen.add(k);if(v===""||v===null||v===undefined)continue;a.push(k+": "+fmtVal(v));}for(const [k,v] of Object.entries(n)){if(seen.has(k)||v===""||v===null||v===undefined)continue;a.push(k+": "+fmtVal(v));}return a.length?"{ "+a.join(", ")+" }":"";}
/* ---- URI/Base64 export ---- */
function getWsOpts(n){const wo=n["ws-opts"]||{};return{path:n.wsPath||wo.path||"",host:(wo.headers&&wo.headers.Host)||n.wsHeaders?.replace(/^Host:/i,"").trim()||""};}
function getRealityOpts(n){const ro=n["reality-opts"]||{};return{pbk:n.realityPubKey||ro["public-key"]||"",sid:n.realityShortId||ro["short-id"]||""};}
function toUri(n){
  const type=String(n.type||"").toLowerCase();
  const name=encodeURIComponent(n.name||"");
  try{
    if(type==="vmess"){
      const{path,host}=getWsOpts(n);
      const obj={v:"2",ps:n.name||"",add:n.server||"",port:n.port||0,id:n.uuid||"",aid:n.alterId||0,scy:n.cipher||"auto",net:n.network||"tcp",tls:n.tls?"tls":"",sni:n.servername||n.sni||"",path:path,host:host};
      return "vmess://"+btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    }
    if(type==="vless"){
      const{path,host}=getWsOpts(n);const{pbk,sid}=getRealityOpts(n);
      const sec=n.tls?(pbk?"reality":"tls"):"none";
      const p=new URLSearchParams();
      if(n.flow)p.set("flow",n.flow);if(n.network)p.set("type",n.network);p.set("security",sec);if(n.servername||n.sni)p.set("sni",n.servername||n.sni);if(path)p.set("path",path);if(host)p.set("host",host);if(pbk)p.set("pbk",pbk);if(sid)p.set("sid",sid);
      return "vless://"+encodeURIComponent(n.uuid||"")+"@"+n.server+":"+n.port+"?"+p.toString()+"#"+name;
    }
    if(type==="trojan"){
      const{path,host}=getWsOpts(n);
      const p=new URLSearchParams();
      if(n.network)p.set("type",n.network);if(n.sni||n.servername)p.set("sni",n.sni||n.servername);if(path)p.set("path",path);if(host)p.set("host",host);if(n["skip-cert-verify"]||n.skipCertVerify)p.set("allowInsecure","1");
      return "trojan://"+encodeURIComponent(n.password||"")+"@"+n.server+":"+n.port+(p.toString()?"?"+p.toString():"")+"#"+name;
    }
    if(type==="ss"){
      const userinfo=btoa(unescape(encodeURIComponent((n.cipher||"")+":"+(n.password||""))));
      let uri="ss://"+userinfo+"@"+n.server+":"+n.port;
      if(n.plugin){const p=new URLSearchParams();p.set("plugin",n.plugin+(n["plugin-opts"]?";mode="+(n["plugin-opts"].mode||""):""));uri+="?"+p.toString();}
      return uri+"#"+name;
    }
    if(type==="hysteria2"){
      const p=new URLSearchParams();
      if(n.sni||n.servername)p.set("sni",n.sni||n.servername);if(n["skip-cert-verify"]||n.skipCertVerify)p.set("insecure","1");if(n.alpn)p.set("alpn",Array.isArray(n.alpn)?n.alpn.join(","):n.alpn);
      return "hysteria2://"+encodeURIComponent(n.password||"")+"@"+n.server+":"+n.port+(p.toString()?"?"+p.toString():"")+"#"+name;
    }
  }catch{}
  return null;
}
function toB64(n){const u=toUri(n);return u?btoa(unescape(encodeURIComponent(u))):null;}
let outFmt="yaml-inline";
function renderR(){
  const vis=visible();
  let lines;
  if(outFmt==="uri")lines=vis.map(toUri).filter(Boolean);
  else if(outFmt==="base64")lines=vis.map(toB64).filter(Boolean);
  else lines=vis.map(one).filter(Boolean);
  el.out.textContent=lines.join("\\n");
}
document.getElementById("fmtBar").querySelectorAll(".fmt-btn").forEach(btn=>{btn.onclick=()=>{outFmt=btn.dataset.fmt;document.getElementById("fmtBar").querySelectorAll(".fmt-btn").forEach(b=>b.classList.toggle("active",b===btn));renderR();};});
function renderM(){el.mid.innerHTML=nodes.map((n,i)=>{const [c,t]=typeMeta[typeKey(n.type)]||typeMeta.other,cls=n.__hidden?"node hidden":"node",dis=n.__hidden?"disabled":"",txt=n.__hidden?"显示":"隐藏";return '<div class="'+cls+'"><span class="tag '+c+'">'+esc(t)+'</span><input class="name" data-i="'+i+'" value="'+esc(n.name||"")+'" '+dis+' /><button class="mini" data-h="'+i+'">'+txt+"</button></div>";}).join("");el.mid.querySelectorAll(".name").forEach(inp=>inp.oninput=e=>{const i=+e.target.dataset.i;if(!nodes[i])return;nodes[i].name=e.target.value;renderR();});el.mid.querySelectorAll(".mini").forEach(btn=>btn.onclick=e=>{const i=+e.target.dataset.h;if(!nodes[i])return;nodes[i].__hidden=!nodes[i].__hidden;renderM();renderR();setStatus("当前显示 "+visible().length+" / "+nodes.length+" 条");});}
async function reqJson(path,opt){const r=await fetch(path,opt),d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||("请求失败，HTTP "+r.status));return d;}
async function load(mode){const subUrl=el.sub.value.trim();if(!subUrl)return setStatus("请先输入订阅链接。");el.rep.disabled=el.app.disabled=true;setStatus("请求中...");try{const d=await reqJson("/api/fetch?url="+encodeURIComponent(subUrl));const list=(Array.isArray(d.nodes)?d.nodes:[]).map(n=>({...n,__hidden:false}));nodes=mode==="append"?[...nodes,...list]:list;renderM();renderR();setStatus((mode==="append"?"已追加，":"已覆盖，")+"上游HTTP "+d.status+"；来源 "+(d.mode||"unknown")+"；本次 "+list.length+" 条，总计 "+nodes.length+" 条");}catch(e){setStatus(e.message||"请求异常");}finally{el.rep.disabled=el.app.disabled=false;}}
async function addTop(){const text=el.add.value.trim();if(!text)return setStatus("请先粘贴节点内容。");el.top.disabled=true;setStatus("解析中...");try{const d=await reqJson("/api/parse",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text})});const list=(Array.isArray(d.nodes)?d.nodes:[]).map(n=>({...n,__hidden:false}));if(!list.length)return setStatus("未识别到可用节点。");nodes=[...list,...nodes];renderM();renderR();setStatus("已添加到顶部 "+list.length+" 条；当前 "+visible().length+" / "+nodes.length+" 条");el.add.value="";}catch(e){setStatus(e.message||"解析异常");}finally{el.top.disabled=false;}}
async function gen(){const vis=visible();if(!vis.length)return setStatus("没有可生成的可见节点。");el.gen.disabled=true;setStatus("生成短链中...");try{const d=await reqJson("/api/gen",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({nodes:vis})});const u=new URL(location.href);u.pathname="/sub/"+d.token+".yaml";u.search=u.hash="";el.subLink.value=u.toString();setStatus("已生成新的短链：/sub/"+d.token+".yaml");}catch(e){setStatus(e.message||"生成异常");}finally{el.gen.disabled=false;}}
async function cpy(){const u=el.subLink.value.trim();if(!u)return setStatus("请先生成订阅链接。");try{await navigator.clipboard.writeText(u);setStatus("已复制订阅链接。");}catch{el.subLink.focus();el.subLink.select();setStatus("复制失败，请手动复制。");}}
function open(){const u=el.subLink.value.trim();if(!u)return setStatus("请先生成订阅链接。");window.open(u,"_blank","noopener,noreferrer");}
el.rep.onclick=()=>load("replace");el.app.onclick=()=>load("append");el.top.onclick=addTop;el.gen.onclick=gen;el.cpy.onclick=cpy;el.open.onclick=open;
document.getElementById("clearNodes").onclick=()=>{nodes=[];renderM();renderR();setStatus("已清除所有节点。");};
el.sub.addEventListener("keydown",e=>{if(e.key==="Enter")load("replace")});el.add.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")addTop()});renderM();renderR();})();</script></body></html>`;
}
