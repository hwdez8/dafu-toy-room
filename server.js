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
    apiKey: 'sk-6e1ba6b86479412f86086262082066a1',
    apiEndpoint: 'api.deepseek.com',
    apiPath: '/v1/chat/completions'
};

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
        
        // 添加缓存控制
        const headers = {
            'Content-Type': contentType,
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
