// 优化版 - 斗鱼直播流获取（带详细日志 + 更强的风控规避）
export default {
  async fetch(request, env, ctx) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'text/plain; charset=utf-8'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      const url = new URL(request.url);
      const roomId = url.searchParams.get('id');
     
      if (!roomId || isNaN(roomId) || roomId.trim() === '') {
        return new Response("使用: ?id=房间号\n示例: ?id=2206405\n", { headers });
      }

      console.log(`开始处理房间号: ${roomId}`);
      const douyuStream = new DouyuStream(parseInt(roomId));
      const streamUrl = await douyuStream.getStreamUrl();

      if (streamUrl) {
        console.log(`获取成功: ${streamUrl}`);
        return new Response(null, {
          status: 302,
          headers: { ...headers, 'Location': streamUrl }
        });
      } else {
        console.log('获取失败：未解析到流地址');
        return new Response("获取失败\n", { headers });
      }
    } catch (error) {
      console.error('全局错误:', error.stack || error.message);
      return new Response(`获取失败: ${error.message}\n`, { 
        headers,
        status: 500
      });
    }
  }
};

class DouyuStream {
  constructor(roomId) {
    this.roomId = roomId;
    this.did = '';
    this.cookies = {};
    // 优化：模拟真实浏览器的请求头
    this.baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Upgrade-Insecure-Requests': '1',
      'Priority': 'u=0, i',
      'Connection': 'keep-alive'
    };
  }

  // 优化：获取 Cookie 时增加更多浏览器头
  async getCookies() {
    try {
      console.log('开始获取 Cookie');
      const response = await fetch(`https://www.douyu.com/${this.roomId}`, {
        method: 'GET',
        headers: {
          ...this.baseHeaders,
          'Referer': 'https://www.douyu.com/'
        },
        redirect: 'follow',
        cf: {
          timeout: 8000, // 延长超时到8秒
          cacheTtl: 0, // 禁用缓存
          resolveOverride: 'www.douyu.com' // 强制解析主域名
        }
      });

      console.log(`Cookie请求状态码: ${response.status}`);
      const setCookieHeaders = response.headers.getSetCookie();
      console.log(`获取到Cookie数量: ${setCookieHeaders.length}`);
     
      for (const cookieLine of setCookieHeaders) {
        const [cookiePair] = cookieLine.split(';');
        if (cookiePair) {
          const [name, value] = cookiePair.split('=').map(item => item.trim());
          if (name && value) {
            this.cookies[name] = value;
            console.log(`解析Cookie: ${name}=${value}`);
          }
        }
      }
    } catch (error) {
      console.error('获取Cookie失败:', error.message);
      throw new Error(`获取Cookie失败: ${error.message}`);
    }
  }

  extractDid() {
    if (this.cookies.dy_did) {
      this.did = this.cookies.dy_did;
      console.log(`从Cookie获取did: ${this.did}`);
    } else {
      this.did = Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      this.cookies.dy_did = this.did;
      console.log(`生成随机did: ${this.did}`);
    }

    if (!this.cookies['mantine-color-scheme-value']) {
      this.cookies['mantine-color-scheme-value'] = 'light';
    }
  }

  getCookiesString() {
    const cookieStr = Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    console.log(`拼接Cookie字符串: ${cookieStr}`);
    return cookieStr;
  }

  // 优化：加密接口请求头更贴近浏览器
  async getEncryptionKey() {
    try {
      console.log('开始请求加密密钥接口');
      const response = await fetch(`https://www.douyu.com/wgapi/livenc/liveweb/websec/getEncryption?did=${this.did}`, {
        method: 'GET',
        headers: {
          ...this.baseHeaders,
          'authority': 'www.douyu.com',
          'referer': `https://www.douyu.com/${this.roomId}`,
          'origin': 'https://www.douyu.com',
          'content-type': 'application/x-www-form-urlencoded',
          'x-requested-with': 'XMLHttpRequest',
          'cookie': this.getCookiesString(),
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"'
        },
        cf: { timeout: 8000 }
      });

      console.log(`加密密钥接口状态码: ${response.status}`);
      const data = await response.json();
      console.log(`加密密钥接口返回: ${JSON.stringify(data)}`);
     
      if (data && data.error === 0) {
        return data.data;
      } else {
        console.error('加密密钥接口返回错误:', data);
        return false;
      }
    } catch (error) {
      console.error('获取加密密钥失败:', error.message);
      return false;
    }
  }

  // 修复：MD5 改为同步执行（避免异步顺序问题）
  async md5(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async calculateAuth(keyData, timestamp) {
    const { key, rand_str: randStr, enc_time: encTime } = keyData;
    let u = randStr;
   
    console.log(`开始计算auth: key=${key}, randStr=${randStr}, encTime=${encTime}`);
    for (let i = 0; i < encTime; i++) {
      u = await this.md5(u + key);
    }
   
    const auth = await this.md5(u + key + this.roomId + timestamp);
    console.log(`计算出auth: ${auth}`);
    return auth;
  }

  updateDidFromStream(streamData) {
    if (streamData.rtmp_live) {
      const match = streamData.rtmp_live.match(/did=([a-f0-9]{32})/);
      if (match && match[1] && match[1] !== this.did) {
        console.log(`更新did: ${this.did} → ${match[1]}`);
        this.did = match[1];
        this.cookies.dy_did = this.did;
        return true;
      }
    }
    return false;
  }

  async getStreamUrl() {
    try {
      await this.getCookies();
      this.extractDid();

      const keyData = await this.getEncryptionKey();
      if (!keyData) {
        throw new Error('加密密钥获取失败');
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const auth = await this.calculateAuth(keyData, timestamp);
     
      const postData = new URLSearchParams({
        enc_data: keyData.enc_data,
        tt: timestamp.toString(),
        did: this.did,
        auth: auth,
        cdn: '',
        rate: '',
        hevc: '0',
        fa: '0',
        ive: '0'
      });

      const fetchStreamData = async () => {
        console.log('开始请求直播流接口');
        const response = await fetch(`https://www.douyu.com/lapi/live/getH5PlayV1/${this.roomId}`, {
          method: 'POST',
          body: postData,
          headers: {
            ...this.baseHeaders,
            'authority': 'www.douyu.com',
            'referer': `https://www.douyu.com/${this.roomId}`,
            'origin': 'https://www.douyu.com',
            'content-type': 'application/x-www-form-urlencoded',
            'x-requested-with': 'XMLHttpRequest',
            'cookie': this.getCookiesString(),
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty'
          },
          cf: { timeout: 8000 }
        });

        console.log(`直播流接口状态码: ${response.status}`);
        const data = await response.json();
        console.log(`直播流接口返回: ${JSON.stringify(data)}`);
        
        return (data && data.error === 0) ? data.data : false;
      };

      let streamData = await fetchStreamData();
      if (!streamData) return false;

      if (this.updateDidFromStream(streamData)) {
        const newKeyData = await this.getEncryptionKey();
        if (newKeyData) {
          const newAuth = await this.calculateAuth(newKeyData, timestamp);
          postData.set('did', this.did);
          postData.set('auth', newAuth);
          streamData = await fetchStreamData();
          if (!streamData) return false;
        }
      }

      if (streamData.rtmp_url && streamData.rtmp_live) {
        const rtmpUrl = `${streamData.rtmp_url}/${streamData.rtmp_live}`;
        console.log(`解析到RTMP流地址: ${rtmpUrl}`);
        return rtmpUrl;
      }
      if (streamData.hls_url && streamData.hls_url) {
        console.log(`解析到HLS流地址: ${streamData.hls_url}`);
        return streamData.hls_url;
      }

      console.log('未解析到任何流地址');
      return false;
    } catch (error) {
      console.error('获取流地址失败:', error.message);
      return false;
    }
  }
}
