/**
 * 大福玩具房 - 后端服务器
 * 用于代理DeepSeek API请求，保护API密钥
 * 
 * 适合在Ubuntu VPS上运行
 * 内存占用低，适合1核1G配置
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置
const CONFIG = {
    port: process.env.PORT || 3000,
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    apiEndpoint: 'api.deepseek.com',
    apiPath: '/v1/chat/completions',
    // 安全配置
    maxRequestSize: 1024 * 1024, // 1MB 最大请求体
    allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://fufud.cc', 'https://www.fufud.cc', 'http://194.41.36.137:3000', 'https://fufud.cc:3000', 'http://fufud.cc', 'http://fufud.cc:3000'],
    rateLimitWindow: 60000, // 1分钟
    rateLimitMax: 100, // 每分钟最大请求数
    // 限流配置
    maxConcurrentUsers: 30, // 最大并发访问人数
    queueTimeout: 30000 // 排队超时时间（30秒）
};

// ========================================
// 访客统计系统
// ========================================
const STATS_FILE = path.join(__dirname, '/data/stats.json');

// 内存中的统计数据
let serverStats = {
    today: {
        date: new Date().toDateString(),
        uniqueVisitors: 0,
        totalVisits: 0,
        visitorIPs: new Set(),
        moduleUsage: {
            guessNumber: 0,
            whatToEat: 0,
            fortune: 0,
            blessing: 0,
            aiChat: 0,
            whackAMole: 0,
            luckyWheel: 0,
            passwordGen: 0,
            moodDiary: 0
        }
    },
    total: {
        uniqueVisitors: 0,
        totalVisits: 0,
        moduleUsage: {
            guessNumber: 0,
            whatToEat: 0,
            fortune: 0,
            blessing: 0,
            aiChat: 0,
            whackAMole: 0,
            luckyWheel: 0,
            passwordGen: 0,
            moodDiary: 0
        },
        lastUpdated: new Date().toISOString()
    }
};

// 加载统计数据
function loadStats() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
            const today = new Date().toDateString();
            
            // 检查是否是新的一天
            if (data.today && data.today.date === today) {
                serverStats.today = {
                    ...data.today,
                    visitorIPs: new Set(data.today.visitorIPs || [])
                };
            } else {
                // 新的一天，重置今日统计
                serverStats.today = {
                    date: today,
                    uniqueVisitors: 0,
                    totalVisits: 0,
                    visitorIPs: new Set(),
                    moduleUsage: {
                        guessNumber: 0,
                        whatToEat: 0,
                        fortune: 0,
                        blessing: 0,
                        aiChat: 0,
                        whackAMole: 0
                    }
                };
            }
            
            serverStats.total = data.total || serverStats.total;
            log('统计数据已加载');
        }
    } catch (error) {
        log('加载统计数据失败: ' + error.message, 'error');
    }
}

// 保存统计数据
function saveStats() {
    try {
        const dataToSave = {
            today: {
                ...serverStats.today,
                visitorIPs: Array.from(serverStats.today.visitorIPs)
            },
            total: serverStats.total
        };
        fs.writeFileSync(STATS_FILE, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
        log('保存统计数据失败: ' + error.message, 'error');
    }
}

// 简单的IP哈希函数（保护隐私）
function hashIP(ip) {
    // 使用简单的字符串哈希
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转为32位整数
    }
    return hash.toString(16);
}

// 记录访问
function recordVisit(clientIP) {
    const today = new Date().toDateString();
    
    // 对IP进行哈希处理，保护隐私
    const hashedIP = hashIP(clientIP);
    
    // 检查是否是新的一天
    if (serverStats.today.date !== today) {
        serverStats.today = {
            date: today,
            uniqueVisitors: 0,
            totalVisits: 0,
            visitorIPs: new Set(),
            moduleUsage: {
                guessNumber: 0,
                whatToEat: 0,
                fortune: 0,
                blessing: 0,
                aiChat: 0,
                whackAMole: 0
            }
        };
    }
    
    // 记录访问
    serverStats.today.totalVisits++;
    serverStats.total.totalVisits++;
    
    // 检查是否为新访客（使用哈希后的IP）
    if (!serverStats.today.visitorIPs.has(hashedIP)) {
        serverStats.today.visitorIPs.add(hashedIP);
        serverStats.today.uniqueVisitors++;
        serverStats.total.uniqueVisitors++;
    }
    
    serverStats.total.lastUpdated = new Date().toISOString();
    saveStats();
}

// 记录模块使用
function recordModuleUsage(moduleName) {
    // 如果模块不存在，自动初始化
    if (!serverStats.today.moduleUsage.hasOwnProperty(moduleName)) {
        serverStats.today.moduleUsage[moduleName] = 0;
    }
    if (!serverStats.total.moduleUsage.hasOwnProperty(moduleName)) {
        serverStats.total.moduleUsage[moduleName] = 0;
    }
    
    serverStats.today.moduleUsage[moduleName]++;
    serverStats.total.moduleUsage[moduleName]++;
    serverStats.total.lastUpdated = new Date().toISOString();
    saveStats();
}

// ========================================
// 并发访问限制系统
// ========================================
const ConnectionManager = {
    activeConnections: new Map(), // 存储活跃连接
    waitingQueue: [], // 等待队列
    
    // 添加新连接
    addConnection(clientIP) {
        const now = Date.now();
        
        // 清理超时的连接（超过5分钟无活动）
        this.cleanupConnections();
        
        // 检查是否已达到最大并发数
        if (this.activeConnections.size >= CONFIG.maxConcurrentUsers) {
            return false; // 拒绝连接
        }
        
        // 添加活跃连接
        this.activeConnections.set(clientIP, {
            ip: clientIP,
            connectedAt: now,
            lastActivity: now
        });
        
        return true;
    },
    
    // 更新连接活动
    updateActivity(clientIP) {
        if (this.activeConnections.has(clientIP)) {
            this.activeConnections.get(clientIP).lastActivity = Date.now();
        }
    },
    
    // 移除连接
    removeConnection(clientIP) {
        this.activeConnections.delete(clientIP);
    },
    
    // 清理超时连接
    cleanupConnections() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5分钟超时
        
        for (const [ip, conn] of this.activeConnections) {
            if (now - conn.lastActivity > timeout) {
                this.activeConnections.delete(ip);
                log(`清理超时连接: ${ip}`);
            }
        }
    },
    
    // 获取当前连接数
    getActiveCount() {
        this.cleanupConnections();
        return this.activeConnections.size;
    },
    
    // 检查是否已满
    isFull() {
        return this.getActiveCount() >= CONFIG.maxConcurrentUsers;
    }
};

// 获取统计数据的API
function handleStatsAPI(req, res) {
    const clientIP = getClientIP(req);
    
    log(`统计API请求: ${req.method} from ${clientIP}`);
    
    if (req.method === 'GET') {
        // 返回统计数据
        const responseData = {
            today: {
                date: serverStats.today.date,
                uniqueVisitors: serverStats.today.uniqueVisitors,
                totalVisits: serverStats.today.totalVisits,
                moduleUsage: serverStats.today.moduleUsage
            },
            total: serverStats.total
        };
        
        log(`返回统计数据: 今日访客=${responseData.today.uniqueVisitors}, 总访客=${responseData.total.uniqueVisitors}`);
        
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(responseData));
    } else if (req.method === 'POST') {
        // 记录访问
        recordVisit(clientIP);
        log(`记录访问成功，IP: ${clientIP}`);
        
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
    }
}

// 记录模块使用的API
function handleModuleStatsAPI(req, res) {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                log(`模块使用API: ${data.module}`);
                if (data.module) {
                    recordModuleUsage(data.module);
                    log(`模块使用记录成功: ${data.module}`);
                }
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                log(`模块使用API错误: ${e.message}`, 'error');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid data' }));
            }
        });
    }
}

// 初始化时加载统计数据
loadStats();

// MIME类型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// 日志函数
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

// 读取文件
function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 找不到页面 😿');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('500 服务器错误 😰');
            }
            return;
        }
        
        // 添加缓存控制，对HTML文件添加charset
        const headers = {
            'Content-Type': contentType + (ext === '.html' ? '; charset=utf-8' : ''),
            'Cache-Control': 'public, max-age=3600'
        };
        
        res.writeHead(200, headers);
        res.end(data);
    });
}

// 验证请求体
function validateRequestBody(body) {
    try {
        const data = JSON.parse(body);
        // 检查消息格式
        if (data.messages && Array.isArray(data.messages)) {
            for (const msg of data.messages) {
                if (msg.content && typeof msg.content === 'string') {
                    // 检查消息长度
                    if (msg.content.length > 4000) {
                        return { valid: false, error: '消息内容过长' };
                    }
                    // 只检查危险HTML标签，允许正常标点符号
                    if (/<script|<iframe|<object|<embed/i.test(msg.content)) {
                        return { valid: false, error: '消息包含非法内容' };
                    }
                }
            }
        }
        return { valid: true };
    } catch (e) {
        return { valid: false, error: '无效的JSON格式' };
    }
}

// 代理DeepSeek API请求
function proxyDeepSeekAPI(req, res) {
    let body = '';
    let bodySize = 0;
    
    req.on('data', chunk => {
        bodySize += chunk.length;
        // 检查请求体大小
        if (bodySize > CONFIG.maxRequestSize) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '请求体过大' }));
            req.destroy();
            return;
        }
        body += chunk.toString();
    });
    
    req.on('end', () => {
        log('收到AI聊天请求');
        log(`API端点: ${CONFIG.apiEndpoint}${CONFIG.apiPath}`);
        // 安全：不记录API密钥任何部分
        
        // 验证请求体
        const validation = validateRequestBody(body);
        if (!validation.valid) {
            log(`请求体验证失败: ${validation.error}`, 'error');
            res.writeHead(400, { 
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ error: validation.error }));
            return;
        }
        
        // 解析请求体
        let requestData;
        try {
            requestData = JSON.parse(body);
        } catch (e) {
            log('请求体解析失败', 'error');
            res.writeHead(400, { 
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ error: '无效的请求体' }));
            return;
        }
        
        // 构建DeepSeek API请求
        const apiRequestBody = JSON.stringify({
            model: requestData.model || 'deepseek-chat',
            messages: requestData.messages || [],
            max_tokens: requestData.max_tokens || 1000,
            temperature: requestData.temperature || 0.7,
            stream: false
        });
        
        const options = {
            hostname: CONFIG.apiEndpoint,
            port: 443,
            path: CONFIG.apiPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`,
                'Content-Length': Buffer.byteLength(apiRequestBody),
                'Accept': 'application/json'
            },
            timeout: 30000 // 30秒超时
        };
        
        log('正在发送请求到DeepSeek API...');
        
        const proxyReq = https.request(options, (proxyRes) => {
            let responseData = '';
            
            log(`API响应状态码: ${proxyRes.statusCode}`);
            
            proxyRes.on('data', (chunk) => {
                responseData += chunk;
            });
            
            proxyRes.on('end', () => {
                // 设置响应头
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                
                // 如果API返回错误，记录详细信息
                if (proxyRes.statusCode !== 200) {
                    log(`API错误响应: ${responseData}`, 'error');
                }
                
                res.end(responseData);
                
                if (proxyRes.statusCode === 200) {
                    log('AI请求成功', 'success');
                } else {
                    log(`AI请求失败: ${proxyRes.statusCode}`, 'error');
                }
            });
        });
        
        proxyReq.on('error', (error) => {
            log(`代理请求错误: ${error.message}`, 'error');
            res.writeHead(500, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ 
                error: '代理请求失败',
                message: error.message,
                code: error.code
            }));
        });
        
        proxyReq.on('timeout', () => {
            log('API请求超时', 'error');
            proxyReq.destroy();
            res.writeHead(504, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ 
                error: '请求超时',
                message: 'DeepSeek API响应超时'
            }));
        });
        
        proxyReq.write(apiRequestBody);
        proxyReq.end();
    });
}

// 生成祝福语（使用DeepSeek AI）
function generateBlessing(req, res) {
    log('收到祝福语生成请求');
    
    // 福福风格的祝福语提示词
    const systemPrompt = `你是大福玩具房的"福福"，一个可爱又调皮的送福小精灵。
你的说话风格：
1. 喜欢用"福福"自称
2. 经常使用谐音梗，特别是"伊布"（宝可梦）相关的梗，比如"伊起享福"
3. 语气活泼可爱，经常使用 Emoji
4. 祝福语要包含"福"字
5. 每句祝福语后面要有一句简短的解释说明

输出格式必须是JSON：
{
  "text": "福语内容（15字以内）",
  "emoji": "一个相关的emoji",
  "desc": "解释说明（20字以内）"
}`;

    const userPrompt = '请生成一句福福风格的祝福语，要有创意，可以玩谐音梗！';
    
    // 构建DeepSeek API请求
    const apiRequestBody = JSON.stringify({
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.9,
        stream: false
    });
    
    const options = {
        hostname: CONFIG.apiEndpoint,
        port: 443,
        path: CONFIG.apiPath,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.apiKey}`,
            'Content-Length': Buffer.byteLength(apiRequestBody),
            'Accept': 'application/json'
        },
        timeout: 10000 // 10秒超时
    };
    
    log('正在向DeepSeek请求生成祝福语...');
    
    const apiReq = https.request(options, (apiRes) => {
        let responseData = '';
        
        apiRes.on('data', (chunk) => {
            responseData += chunk;
        });
        
        apiRes.on('end', () => {
            try {
                const data = JSON.parse(responseData);
                
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    const aiResponse = data.choices[0].message.content;
                    log('AI生成成功，正在解析...');
                    
                    // 尝试解析JSON
                    let blessing;
                    try {
                        // 提取JSON部分
                        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            blessing = JSON.parse(jsonMatch[0]);
                        } else {
                            throw new Error('No JSON found');
                        }
                    } catch (e) {
                        // 如果解析失败，使用默认格式
                        log('JSON解析失败，使用默认格式', 'error');
                        blessing = {
                            text: aiResponse.substring(0, 15) || '福福祝你福气满满',
                            emoji: '🎀',
                            desc: '福福送你的专属祝福'
                        };
                    }
                    
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({ blessing }));
                    log('祝福语生成成功', 'success');
                } else {
                    throw new Error('Invalid API response');
                }
            } catch (error) {
                log(`生成失败: ${error.message}`, 'error');
                res.writeHead(500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ error: '生成失败' }));
            }
        });
    });
    
    apiReq.on('error', (error) => {
        log(`API请求错误: ${error.message}`, 'error');
        res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'API请求失败' }));
    });
    
    apiReq.on('timeout', () => {
        log('祝福语生成超时', 'error');
        apiReq.destroy();
        res.writeHead(504, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: '请求超时' }));
    });
    
    apiReq.write(apiRequestBody);
    apiReq.end();
}

// 简单的速率限制存储
const rateLimitMap = new Map();

// 检查速率限制
function checkRateLimit(clientIP) {
    const now = Date.now();
    const windowStart = now - CONFIG.rateLimitWindow;
    
    if (!rateLimitMap.has(clientIP)) {
        rateLimitMap.set(clientIP, []);
    }
    
    const requests = rateLimitMap.get(clientIP);
    // 清理过期请求
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= CONFIG.rateLimitMax) {
        return false;
    }
    
    validRequests.push(now);
    rateLimitMap.set(clientIP, validRequests);
    return true;
}

// 设置安全响应头
function setSecurityHeaders(res) {
    // 防止点击劫持
    res.setHeader('X-Frame-Options', 'DENY');
    // XSS保护
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // 防止MIME类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // 内容安全策略
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self'");
    // 引用策略
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // 权限策略
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    // HSTS - 强制HTTPS（提升到A+级）
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
}

// 获取客户端IP（支持反向代理）
function getClientIP(req) {
    // 按优先级尝试各种代理头
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
    
    // 记录原始信息用于调试
    const directIP = req.connection.remoteAddress || req.socket.remoteAddress;
    
    console.log(`[IP调试] forwarded: ${forwarded}, real-ip: ${realIP}, cf-ip: ${cfConnectingIP}, direct: ${directIP}`);
    
    // 优先使用代理头中的真实IP
    if (cfConnectingIP) {
        return cfConnectingIP.trim();
    }
    
    if (realIP) {
        return realIP.trim();
    }
    
    if (forwarded) {
        // x-forwarded-for 可能包含多个IP，取第一个（最原始的客户端IP）
        const ips = forwarded.split(',').map(ip => ip.trim());
        // 过滤掉内网IP和127.0.0.1
        const publicIP = ips.find(ip => 
            !ip.startsWith('10.') && 
            !ip.startsWith('192.168.') && 
            !ip.startsWith('172.') &&
            ip !== '127.0.0.1' &&
            ip !== '::1' &&
            !ip.startsWith('::ffff:127.')
        );
        return publicIP || ips[0];
    }
    
    return directIP || 'unknown';
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    const clientIP = getClientIP(req);
    
    // 设置安全响应头
    setSecurityHeaders(res);
    
    // 速率限制检查
    if (!checkRateLimit(clientIP)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '请求过于频繁，请稍后再试' }));
        log(`速率限制触发: ${clientIP}`, 'error');
        return;
    }
    
    // 设置CORS头 - 根据请求来源动态设置
    const origin = req.headers.origin;
    if (CONFIG.allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (origin) {
        // 对于统计API，允许任何来源访问
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // 预检请求缓存24小时
    
    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    log(`${req.method} ${pathname}`);
    
    // 并发访问限制检查（仅对主页面和API）
    const isMainPage = pathname === '/' || pathname === '/website/index.html';
    const isAPI = pathname.startsWith('/api/');
    
    if (isMainPage || isAPI) {
        // 检查是否已达到最大并发数
        if (ConnectionManager.isFull()) {
            // 检查该IP是否已在活跃连接中
            if (!ConnectionManager.activeConnections.has(clientIP)) {
                // 返回限流页面
                const rateLimitPage = path.join(__dirname, 'rate-limit.html');
                fs.readFile(rateLimitPage, (err, data) => {
                    if (err) {
                        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>服务繁忙，请稍后再试</h1>');
                    } else {
                        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(data);
                    }
                });
                log(`并发限制触发: ${clientIP}, 当前连接数: ${ConnectionManager.getActiveCount()}`, 'warn');
                return;
            }
        }
        
        // 添加或更新连接
        ConnectionManager.addConnection(clientIP);
        
        // 请求结束时移除连接
        res.on('finish', () => {
            ConnectionManager.removeConnection(clientIP);
        });
        
        // 定期更新活动状态
        ConnectionManager.updateActivity(clientIP);
    }
    
    // API路由
    if (pathname === '/api/chat' && req.method === 'POST') {
        proxyDeepSeekAPI(req, res);
        return;
    }
    
    // 祝福语生成API
    if (pathname === '/api/blessing' && req.method === 'POST') {
        generateBlessing(req, res);
        return;
    }
    
    // 统计数据API
    if (pathname === '/api/stats') {
        handleStatsAPI(req, res);
        return;
    }
    
    // 模块使用统计API
    if (pathname === '/api/stats/module') {
        handleModuleStatsAPI(req, res);
        return;
    }
    
    // 健康检查
    if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            service: '大福玩具房'
        }));
        return;
    }
    
    // 静态文件服务
    let filePath = '';
    if(pathname === '/'){
        filePath = path.join(__dirname,'website','index.html');
    }
    else{
        const websitePath = path.join(__dirname, 'website', pathname);
        if(fs.existsSync(websitePath) && fs.statSync(websitePath).isFile()){
            filePath = websitePath;
        }
        else{
            filePath = path.join(__dirname, pathname);
        }
    }

    // 安全检查：防止目录遍历
    const resolvedPath = path.resolve(filePath);
    const rootPath = path.resolve(__dirname);
    
    if (!resolvedPath.startsWith(rootPath)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 禁止访问 🚫');
        return;
    }
    
    serveFile(filePath, res);
});

// 创建本地文件
let statsDir = path.dirname(STATS_FILE);
if(!fs.existsSync(statsDir)){fs.mkdirSync(statsDir, {recursive:true});}
if(!fs.existsSync(STATS_FILE)){
    fs.copyFileSync(
        path.join(__dirname,'json','stats.json'), 
        STATS_FILE
    );
}

// 启动服务器
server.listen(CONFIG.port, () => {
    log('='.repeat(50));
    log('🎉 大福玩具房服务器已启动！');
    log(`📍 访问地址: http://localhost:${CONFIG.port}`);
    log(`🔑 API密钥状态: ${CONFIG.apiKey ? '已配置' : '未配置'}`);
    log('='.repeat(50));
});

// 优雅关闭
process.on('SIGTERM', () => {
    log('收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('收到SIGINT信号，正在关闭服务器...');
    server.close(() => {
        log('服务器已关闭');
        process.exit(0);
    });
});

// 错误处理
process.on('uncaughtException', (error) => {
    log(`未捕获的异常: ${error.message}`, 'error');
});

process.on('unhandledRejection', (reason, promise) => {
    log(`未处理的Promise拒绝: ${reason}`, 'error');
});
