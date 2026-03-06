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
    apiPath: '/v1/chat/completions'
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

// 记录访问
function recordVisit(clientIP) {
    const today = new Date().toDateString();
    
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
    
    // 检查是否为新访客（按IP）
    if (!serverStats.today.visitorIPs.has(clientIP)) {
        serverStats.today.visitorIPs.add(clientIP);
        serverStats.today.uniqueVisitors++;
        serverStats.total.uniqueVisitors++;
    }
    
    serverStats.total.lastUpdated = new Date().toISOString();
    saveStats();
}

// 记录模块使用
function recordModuleUsage(moduleName) {
    if (serverStats.today.moduleUsage.hasOwnProperty(moduleName)) {
        serverStats.today.moduleUsage[moduleName]++;
        serverStats.total.moduleUsage[moduleName]++;
        serverStats.total.lastUpdated = new Date().toISOString();
        saveStats();
    }
}

// 获取统计数据的API
function handleStatsAPI(req, res) {
    const clientIP = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress;
    
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

// 代理DeepSeek API请求
function proxyDeepSeekAPI(req, res) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        log('收到AI聊天请求');
        log(`API端点: ${CONFIG.apiEndpoint}${CONFIG.apiPath}`);
        log(`API密钥前10位: ${CONFIG.apiKey.substring(0, 10)}...`);
        
        // 解析请求体
        let requestData;
        try {
            requestData = JSON.parse(body);
        } catch (e) {
            log('请求体解析失败', 'error');
            res.writeHead(400, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
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

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
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
