// 虎牙直播代理 - 版权强绑定+流畅播放版（修复秒卡问题）
addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request));
});

// 核心请求处理函数（版权校验为前置条件，不影响签名）
async function handleRequest(request) {
    // 版权核心标识（Unicode+硬编码双重绑定）
    var AUTHOR = "\u5947\u54C8\u5A31\u4E50";
    var COPYRIGHT_KEY = AUTHOR + "_HUYA_PROXY";
   
    // 跨域配置
    var headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'text/plain; charset=utf-8'
    };

    // 处理OPTIONS预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: headers });
    }

    try {
        // 第一步：强制版权校验（删除这部分则下面的key参数缺失）
        if (AUTHOR !== "\u5947\u54C8\u5A31\u4E50" || !COPYRIGHT_KEY.includes(AUTHOR)) {
            throw new Error("\u8BF7\u5C0A\u91CD\u52B3\u52A8\u6210\u679C\uff0c\u4FDD\u7559\u4F5C\u8005");
        }

        // 解析参数
        var url = new URL(request.url);
        var idParam = url.searchParams.get('id');
       
        // 无ID：显示使用说明（含版权提示）
        if (idParam === null || idParam.trim() === '') {
            var helpText = "使用说明:\n?id=\u864E\u7259\u623F\u95F4\u53F7\uff08\u793A\u4F8B\uff1A?id=11342387\uff09\n\u66F4\u591A\u4EE3\u7406\u6E90\u7801\uff0c\u8BF7\u8BBF\u95EE\u516C\u4F17\u53F7\uff1A" + AUTHOR + "\n";
            return new Response(helpText, { headers: headers });
        }

        // 校验ID是否为数字
        var roomId = idParam.trim();
        if (isNaN(roomId)) {
            var errorText = "参数错误：房间号必须为纯数字！\n使用说明:\n?id=\u864E\u7259\u623F\u95F4\u53F7\uff08\u793A\u4F8B\uff1A?id=11342387\uff09\n\u66F4\u591A\u4EE3\u7406\u6E90\u7801\uff0c\u8BF7\u8BBF\u95EE\u516C\u4F17\u53F7\uff1A" + AUTHOR + "\n";
            return new Response(errorText, { headers: headers, status: 400 });
        }

        // 第二步：核心功能调用（必须传入版权key，删版权则key不存在）
        var playUrl = await getHuyaPlayUrl(roomId, COPYRIGHT_KEY);
        return new Response(null, {
            status: 302,
            headers: { ...headers, 'Location': playUrl }
        });

    } catch (error) {
        var errorMsg = "获取失败: " + error.message + "\n\u66F4\u591A\u4EE3\u7406\u6E90\u7801\uff0c\u8BF7\u8BBF\u95EE\u516C\u4F17\u53F7\uff1A" + (AUTHOR || "\u5947\u54C8\u5A31\u4E50") + "\n";
        return new Response(errorMsg, { headers: headers, status: 500 });
    }
}

// 核心功能：生成直播地址（恢复原虎牙官方签名规则，保证流畅播放）
async function getHuyaPlayUrl(roomId, copyrightKey) {
    // 关键：版权key缺失/篡改 → 直接抛出异常，功能失效（不影响签名）
    if (!copyrightKey || !copyrightKey.includes("\u5947\u54C8\u5A31\u4E50")) {
        throw new Error("\u7F16\u7801\u88AB\u7BE1\u6539\uff0c\u529F\u80FD\u5931\u6548");
    }

    // 1. 请求房间信息（和原版一致）
    var roomUrl = "https://mp.huya.com/cache.php?m=Live&do=profileRoom&roomid=" + roomId;
    var roomRes = await fetch(roomUrl, {
        cf: { timeout: 10000 },
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36' }
    });

    if (!roomRes.ok) {
        throw new Error("房间信息请求失败（状态码：" + roomRes.status + "）");
    }

    var roomData = await roomRes.json();
    if (!roomData.data) {
        throw new Error(roomId + " 房间号错误或未开播");
    }

    // 2. 解析核心参数（和原版一致）
    var uid = roomData.data.profileInfo?.uid || '';
    var streamName = roomData.data.stream?.baseSteamInfoList?.[0]?.sStreamName || '';
   
    if (!streamName) {
        throw new Error("未获取到直播流信息（房间可能未开播）");
    }

    // 3. 恢复原虎牙官方签名规则（移除多余的版权key，保证签名有效）
    var now = Math.floor(Date.now() / 1000);
    var seqid = parseInt(uid) + "" + now;
    var ss = await md5(seqid + "|huya_adr|102"); // 恢复原版签名规则
    var wsTime = (now + 21600).toString(16);
    var wsSecret = await md5("DWq8BcJ3h6DJt6TY_" + uid + "_" + streamName + "_" + ss + "_" + wsTime); // 恢复原版签名

    // 4. 拼接最终播放地址（和原版一致，保证流畅播放）
    return "http://al.flv.huya.com/src/" + streamName + ".flv?wsSecret=" + wsSecret + "&wsTime=" + wsTime + "&ctype=huya_adr&seqid=" + seqid + "&uid=" + uid + "&fs=bgct&ver=1&t=102";
}

// MD5工具函数（和原版一致）
async function md5(str) {
    var encoder = new TextEncoder();
    var data = encoder.encode(str);
    var hashBuffer = await crypto.subtle.digest('MD5', data);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function(b) {
        return b.toString(16).padStart(2, '0');
    }).join('');
}
