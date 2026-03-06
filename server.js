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
    allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://fufud.cc', 'https://www.fufud.cc', 'http://194.41.36.137:3000'],
    rateLimitWindow: 60000, // 1分钟
    rateLimitMax: 60, // 每分钟最大请求数（1核1G服务器建议）
    globalMaxConnections: 50, // 全局最大并发连接数（1核1G建议）
    // 管理员配置 - 支持多种IP格式
    adminIPs: [
        '175.4.244.62',           // 原始格式
        '::ffff:175.4.244.62',    // IPv6映射格式
        '::1',                    // 本地IPv6
        '127.0.0.1'               // 本地IPv4
    ],
    // 从环境变量读取密码，如果没有则使用随机密码（需要手动设置）
    adminPassword: process.env.ADMIN_PASSWORD || 'PleaseSetStrongPasswordInEnv'
};

// ========================================
// 访客统计系统
// ========================================
const STATS_FILE = path.join(__dirname, 'stats.json');

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
    
    // 检查总计数是否达到上限（999），达到则归零
    if (serverStats.total.totalVisits >= 999) {
        serverStats.total.totalVisits = 0;
        log('总访问量达到999，已归零重置', 'warn');
    }
    if (serverStats.total.uniqueVisitors >= 999) {
        serverStats.total.uniqueVisitors = 0;
        log('总访客数达到999，已归零重置', 'warn');
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
    
    // 检查模块总计数是否达到上限（999），达到则归零
    if (serverStats.total.moduleUsage[moduleName] >= 999) {
        serverStats.total.moduleUsage[moduleName] = 0;
        log(`模块 ${moduleName} 总使用次数达到999，已归零重置`, 'warn');
    }
    
    serverStats.total.lastUpdated = new Date().toISOString();
    saveStats();
}

// ==================== 留言板API处理函数 ====================

// 获取已审核留言
function handleGuestbookGet(req, res) {
    const approvedMessages = guestbookData.messages
        .filter(msg => msg.status === 'approved')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50); // 最多显示50条
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        success: true, 
        messages: approvedMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            date: msg.date,
            time: msg.time
        }))
    }));
}

// 检查是否可以留言（每天一次）
function canGuestbookToday(ip) {
    // 管理员IP不受限制
    if (CONFIG.adminIPs.includes(ip)) {
        return { allowed: true };
    }
    
    const today = new Date().toDateString();
    const lastPostDate = guestbookLimitMap.get(ip);
    
    if (lastPostDate === today) {
        return { 
            allowed: false, 
            error: '您今天已经留言过了，明天再来吧~' 
        };
    }
    
    return { allowed: true };
}

// 提交留言
// XSS 过滤函数
function sanitizeInput(input) {
    if (!input) return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

function handleGuestbookPost(req, res) {
    const clientIP = getClientIP(req);
    
    // 所有人（包括管理员）都检查每日留言限制
    const limitCheck = canGuestbookToday(clientIP);
    if (!limitCheck.allowed) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: limitCheck.error }));
        return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const rawContent = data.content?.trim();
            
            // XSS 过滤
            const content = sanitizeInput(rawContent);
            
            // 验证内容
            if (!content || content.length < 2) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '留言太短了' }));
                return;
            }
            
            if (content.length > 200) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '留言太长了' }));
                return;
            }
            
            // 创建留言 - 所有人都进待审核
            const now = new Date();
            const message = {
                id: guestbookData.nextId++,
                content: content,
                ip: clientIP,
                status: 'pending', // 所有人都进待审核
                timestamp: now.getTime(),
                date: now.toLocaleDateString('zh-CN'),
                time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            };
            
            guestbookData.messages.push(message);
            saveGuestbookData();
            
            // 记录该IP今天已留言
            guestbookLimitMap.set(clientIP, now.toDateString());
            
            log(`新留言提交: ID=${message.id}, IP=${clientIP}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                message: '提交成功，等待审核'
            }));
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '无效的请求' }));
        }
    });
}

// ==================== 管理员API处理函数 ====================

function loadGuestbookData() {
    try {
        if (fs.existsSync(GUESTBOOK_FILE)) {
            const data = fs.readFileSync(GUESTBOOK_FILE, 'utf8');
            guestbookData = JSON.parse(data);
        }
    } catch (e) {
        log('加载留言板数据失败', 'error');
    }
}

function saveGuestbookData() {
    try {
        fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(guestbookData, null, 2));
    } catch (e) {
        log('保存留言板数据失败', 'error');
    }
}

// 检查是否是管理员
function handleAdminCheck(req, res) {
    const isAdminUser = isAdmin(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ isAdmin: isAdminUser }));
}

// 管理员登录
function handleAdminLogin(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const password = data.password;
            
            if (verifyAdminPassword(password)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '密码错误' }));
            }
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '无效的请求' }));
        }
    });
}

// 获取待审核留言
function handleAdminPending(req, res) {
    const pendingMessages = guestbookData.messages
        .filter(msg => msg.status === 'pending')
        .sort((a, b) => b.timestamp - a.timestamp);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, messages: pendingMessages }));
}

// 获取已发布留言
function handleAdminApproved(req, res) {
    const approvedMessages = guestbookData.messages
        .filter(msg => msg.status === 'approved')
        .sort((a, b) => b.timestamp - a.timestamp);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, messages: approvedMessages }));
}

// 处理留言（通过/删除）
function handleAdminMessageAction(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const messageId = parseInt(parsedUrl.pathname.split('/').pop());
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const action = data.action; // 'approve', 'delete'
            
            const messageIndex = guestbookData.messages.findIndex(m => m.id === messageId);
            if (messageIndex === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '留言不存在' }));
                return;
            }
            
            switch (action) {
                case 'approve':
                    guestbookData.messages[messageIndex].status = 'approved';
                    log(`留言审核通过: ID=${messageId}`);
                    break;
                case 'delete':
                    guestbookData.messages.splice(messageIndex, 1);
                    log(`留言已删除: ID=${messageId}`);
                    break;
                default:
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: '无效的操作' }));
                    return;
            }
            
            saveGuestbookData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '无效的请求' }));
        }
    });
}

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

// 定期清理过期的速率限制记录（每10分钟）
setInterval(() => {
    const now = Date.now();
    const windowStart = now - CONFIG.rateLimitWindow;
    let cleanedCount = 0;
    
    for (const [ip, requests] of rateLimitMap.entries()) {
        // 清理过期请求
        const validRequests = requests.filter(time => time > windowStart);
        
        if (validRequests.length === 0) {
            // 如果没有有效请求，删除该IP记录
            rateLimitMap.delete(ip);
            cleanedCount++;
        } else {
            // 更新记录
            rateLimitMap.set(ip, validRequests);
        }
    }
    
    if (cleanedCount > 0) {
        log(`清理速率限制记录: ${cleanedCount} 个IP`);
    }
}, 10 * 60 * 1000); // 10分钟

// 留言限制存储 - 记录每个IP最后一次留言日期
const guestbookLimitMap = new Map();

// 留言板数据存储
const GUESTBOOK_FILE = path.join(__dirname, 'data', 'guestbook.json');
const BLACKLIST_FILE = path.join(__dirname, 'data', 'blacklist.json');

// 确保数据目录存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// 加载留言板数据
let guestbookData = {
    messages: [],
    nextId: 1
};
// 检查是否是管理员
function isAdmin(req) {
    const clientIP = getClientIP(req);
    // 处理IPv6映射的IPv4地址
    const normalizedIP = clientIP.replace(/^::ffff:/, '');
    console.log(`[Admin Check] Client IP: ${clientIP}, Normalized: ${normalizedIP}`);
    console.log(`[Admin Check] Whitelist: ${JSON.stringify(CONFIG.adminIPs)}`);
    const isAdminUser = CONFIG.adminIPs.includes(clientIP) || CONFIG.adminIPs.includes(normalizedIP);
    console.log(`[Admin Check] Result: ${isAdminUser}`);
    return isAdminUser;
}

// 验证管理员密码
function verifyAdminPassword(password) {
    return password === CONFIG.adminPassword;
}

// 初始化加载数据
loadGuestbookData();

// 速率限制提示页面
function getRateLimitPage() {
    return getLimitPage('rate');
}

// 服务器繁忙页面
function getBusyPage() {
    return getLimitPage('busy');
}

// 通用限制页面
function getLimitPage(type) {
    const isRateLimit = type === 'rate';
    const title = isRateLimit ? '大福玩具房 - 休息一下' : '大福玩具房 - 服务器繁忙';
    const icon = isRateLimit ? '🎀' : '😴';
    const heading = isRateLimit ? '哎呀，人太多啦！' : '服务器爆满啦！';
    const message = isRateLimit 
        ? '大福的玩具房现在有点挤<br>仙子伊布正在努力接待中...' 
        : '太多人同时访问啦<br>仙子伊布忙不过来了...';
    const countdownText = isRateLimit ? '请稍等 <span id="timer">60</span> 秒' : '请稍后再试';
    const tips = isRateLimit 
        ? `<span>💡 小贴士：</span>
            <span>• 每分钟最多 30 次访问</span>
            <span>• 稍后会自动恢复</span>
            <span>• 感谢你的耐心等待~</span>`
        : `<span>💡 小贴士：</span>
            <span>• 服务器最大承载 30 人</span>
            <span>• 请稍后再访问</span>
            <span>• 感谢你的理解~</span>`;
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #fff5f7 0%, #ffe4ec 50%, #fff0f3 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            text-align: center;
            background: white;
            padding: 50px 40px;
            border-radius: 30px;
            box-shadow: 0 10px 40px rgba(255, 107, 157, 0.2);
            max-width: 450px;
            width: 100%;
        }
        
        .icon {
            font-size: 5rem;
            margin-bottom: 20px;
            animation: ${isRateLimit ? 'bounce' : 'shake'} 2s infinite;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }
        
        @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
        }
        
        h1 {
            color: #ff6b9d;
            font-size: 1.8rem;
            margin-bottom: 15px;
        }
        
        p {
            color: #666;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        
        .countdown {
            background: linear-gradient(135deg, #ffc2d1, #ff8fab);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.2rem;
            display: inline-block;
            margin-bottom: 20px;
        }
        
        .tips {
            background: #fff5f7;
            padding: 15px 20px;
            border-radius: 15px;
            font-size: 0.95rem;
            color: #888;
            margin-top: 20px;
        }
        
        .tips span {
            display: block;
            margin: 5px 0;
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 40px 25px;
            }
            
            .icon {
                font-size: 4rem;
            }
            
            h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">${icon}</div>
        <h1>${heading}</h1>
        <p>${message}</p>
        <div class="countdown">⏰ ${countdownText}</div>
        <p style="font-size: 0.9rem; color: #999;">自动刷新中...</p>
        <div class="tips">
            ${tips}
        </div>
    </div>
    
    <script>
        // 5秒后自动尝试刷新
        setTimeout(() => {
            location.reload();
        }, 5000);
        
        ${isRateLimit ? `
        let seconds = 60;
        const timerEl = document.getElementById('timer');
        
        setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                seconds = 60;
                location.reload();
            }
            if (timerEl) timerEl.textContent = seconds;
        }, 1000);
        ` : ''}
    </script>
</body>
</html>`;
}

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

// 获取客户端IP
function getClientIP(req) {
    // 优先使用直接连接的IP
    const directIP = req.connection.remoteAddress || req.socket.remoteAddress;
    
    // 尝试从各种代理头获取真实IP（按优先级）
    const forwarded = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    const realIP = req.headers['x-real-ip'];
    
    // 如果有代理头，优先使用（VPS通常有Nginx反向代理）
    if (forwarded) return forwarded;
    if (realIP) return realIP;
    
    // 否则使用直接IP
    return directIP || 'unknown';
}

// 全局连接计数器
let activeConnections = 0;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    const clientIP = getClientIP(req);
    
    // 全局并发限制检查
    if (activeConnections >= CONFIG.globalMaxConnections) {
        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getBusyPage());
        log(`服务器繁忙，拒绝连接: ${clientIP} (当前连接: ${activeConnections})`, 'error');
        return;
    }
    
    // 增加连接计数
    activeConnections++;
    let connectionClosed = false;
    
    // 请求结束时减少计数（确保只减一次）
    const decreaseConnection = () => {
        if (!connectionClosed) {
            connectionClosed = true;
            activeConnections--;
        }
    };
    
    res.on('finish', decreaseConnection);
    res.on('close', decreaseConnection);
    
    // 设置安全响应头
    setSecurityHeaders(res);
    
    // 速率限制检查
    if (!checkRateLimit(clientIP)) {
        res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getRateLimitPage());
        log(`速率限制触发: ${clientIP}`, 'error');
        // 注意：不要在这里减 activeConnections，让 finish/close 事件处理
        return;
    }
    
    // 设置CORS头 - 根据请求来源动态设置
    const origin = req.headers.origin;
    if (CONFIG.allowedOrigins.includes(origin)) {
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
    
    // 查看我的IP（调试用）- 生产环境禁用
    if (pathname === '/myip' && process.env.NODE_ENV !== 'production') {
        const forwarded = req.headers['x-forwarded-for'];
        const remoteAddr = req.connection.remoteAddress;
        const socketAddr = req.socket.remoteAddress;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            'x-forwarded-for': forwarded,
            'connection.remoteAddress': remoteAddr,
            'socket.remoteAddress': socketAddr,
            'getClientIP()': getClientIP(req),
            'isAdmin': isAdmin(req)
        }));
        return;
    }
    
    // 留言板API - 获取已审核留言
    if (pathname === '/api/guestbook' && req.method === 'GET') {
        handleGuestbookGet(req, res);
        return;
    }
    
    // 留言板API - 检查今日是否可以留言
    if (pathname === '/api/guestbook/check' && req.method === 'GET') {
        const clientIP = getClientIP(req);
        const checkResult = canGuestbookToday(clientIP);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ canPost: checkResult.allowed }));
        return;
    }
    
    // 留言板API - 提交留言
    if (pathname === '/api/guestbook' && req.method === 'POST') {
        handleGuestbookPost(req, res);
        return;
    }
    
    // 管理员API - 检查是否是管理员
    if (pathname === '/api/admin/check' && req.method === 'GET') {
        handleAdminCheck(req, res);
        return;
    }
    
    // 管理员API - 登录
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        handleAdminLogin(req, res);
        return;
    }
    
    // 管理员API - 获取待审核留言
    if (pathname === '/api/admin/pending' && req.method === 'GET') {
        handleAdminPending(req, res);
        return;
    }
    
    // 管理员API - 获取已发布留言
    if (pathname === '/api/admin/approved' && req.method === 'GET') {
        handleAdminApproved(req, res);
        return;
    }
    
    // 管理员API - 处理留言（通过/删除）
    if (pathname.startsWith('/api/admin/message/') && req.method === 'POST') {
        handleAdminMessageAction(req, res);
        return;
    }
    
    // 静态文件服务
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);
    
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
