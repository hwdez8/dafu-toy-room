# 🎉 欢迎来到一只大福的玩具房

一个充满趣味的互动网站，包含猜数字游戏、今天吃什么决策助手、小魔法猫咪运势占卜和AI聊天功能。

## ✨ 功能特性

### 1. 🎲 猜数字游戏
- 1-100数字猜测
- 智能提示系统（太大/太小/接近程度）
- 猜测历史记录
- 10次机会挑战
- 胜利庆祝动画

### 2. 🍜 今天吃什么
- 多种口味偏好选择（辣/甜/酸/清淡/重口味）
- 丰富的食物数据库
- 滚动选择动画
- 食物Emoji展示

### 3. 🔮 小魔法猫咪运势占卜
- 综合运势（爱情/事业/财运/健康）
- 单项运势详细占卜
- 幸运数字、幸运色、幸运物
- 可爱猫咪互动

### 4. 🤖 AI聊天助手
- 接入DeepSeek AI API
- 可爱的AI助手人格
- 实时对话
- 打字指示器动画

### 5. 🎨 UI设计
- 粉色系可爱风格
- 飘浮爱心背景动画
- 响应式布局
- 丰富的Emoji装饰
- 图标动画效果

## 🚀 部署指南

### 环境要求
- Ubuntu 22.04 LTS
- Node.js 14+ 
- 1核1G内存（最低配置）
- 50GB云盘

### 快速部署

1. **上传代码到服务器**
```bash
# 在本地打包
cd dafu-toy-room
tar -czvf dafu-toy-room.tar.gz .

# 上传到服务器（使用scp或其他方式）
scp dafu-toy-room.tar.gz user@your-vps-ip:/home/user/
```

2. **在服务器上解压并安装**
```bash
# 连接到服务器
ssh user@your-vps-ip

# 解压
cd /home/user
tar -xzvf dafu-toy-room.tar.gz
cd dafu-toy-room

# 安装依赖（Node.js内置，无需额外安装）
# 确保Node.js版本 >= 14
node --version
```

3. **配置环境变量（可选）**
```bash
# 编辑环境变量（推荐方式，更安全）
export DEEPSEEK_API_KEY=your-api-key-here
export PORT=3000

# 或者写入 ~/.bashrc
echo 'export DEEPSEEK_API_KEY=your-api-key-here' >> ~/.bashrc
source ~/.bashrc
```

4. **启动服务**
```bash
# 前台运行（测试用）
npm start

# 后台运行（生产环境）
nohup npm start > app.log 2>&1 &

# 使用PM2管理（推荐）
npm install -g pm2
pm2 start server.js --name "dafu-toy-room"
pm2 save
pm2 startup
```

5. **配置Nginx反向代理（可选）**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **配置SSL（使用Let's Encrypt）**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "dafu-toy-room"

# 查看状态
pm2 status

# 查看日志
pm2 logs dafu-toy-room

# 重启
pm2 restart dafu-toy-room

# 停止
pm2 stop dafu-toy-room

# 开机自启
pm2 startup
pm2 save
```

## 🏗️ 积木式架构

本项目采用积木式架构设计，每个功能模块都是独立的：

```
dafu-toy-room/
├── index.html          # 主页面（可修改布局和样式）
├── css/
│   └── style.css       # 全局样式
├── js/
│   └── main.js         # 主入口和工具函数
├── modules/            # 功能模块目录
│   ├── guessNumber.js  # 猜数字模块 ✅ 可删除
│   ├── whatToEat.js    # 今天吃什么模块 ✅ 可删除
│   ├── fortune.js      # 运势占卜模块 ✅ 可删除
│   └── aiChat.js       # AI聊天模块 ✅ 可删除
└── server.js           # 后端服务器
```

### 如何删除模块

1. **删除猜数字游戏**
   - 删除 `modules/guessNumber.js`
   - 删除 `index.html` 中的猜数字模块HTML代码
   - 删除 `index.html` 中的 `<script src="modules/guessNumber.js"></script>`

2. **添加新模块**
   - 创建 `modules/yourModule.js`
   - 在 `index.html` 中添加对应的HTML结构
   - 引入新模块的JS文件
   - 使用 `DafuToyRoom.ModuleRegistry.register('moduleName', initFn)` 注册

## 🔧 配置说明

### AI API配置

在 `server.js` 中配置：

```javascript
const CONFIG = {
    port: process.env.PORT || 3000,
    apiKey: process.env.DEEPSEEK_API_KEY || 'your-api-key-here',
    apiEndpoint: 'api.deepseek.com',
    apiPath: '/chat/completions'
};
```

### 前端API端点

在 `modules/aiChat.js` 中配置：

```javascript
const CONFIG = {
    apiEndpoint: '/api/chat',  // 如果使用反向代理保持默认
    // 或者使用完整URL
    // apiEndpoint: 'http://your-domain.com/api/chat'
};
```

## 📁 文件结构

```
dafu-toy-room/
├── index.html              # 主页面
├── package.json            # 项目配置
├── server.js               # Node.js服务器
├── README.md               # 说明文档
├── css/
│   └── style.css           # 样式文件
├── js/
│   └── main.js             # 主脚本
└── modules/                # 功能模块
    ├── guessNumber.js      # 猜数字游戏
    ├── whatToEat.js        # 今天吃什么
    ├── fortune.js          # 运势占卜
    └── aiChat.js           # AI聊天
```

## 🎨 自定义主题

修改 `css/style.css` 中的CSS变量：

```css
:root {
    --primary-color: #ff6b9d;      /* 主色调 */
    --primary-light: #ffc2d1;      /* 浅色 */
    --secondary-color: #a8e6cf;    /* 次要色 */
    --accent-color: #ffd93d;       /* 强调色 */
    --bg-color: #fff5f7;           /* 背景色 */
}
```

## 🔒 安全说明

- API密钥存储在服务器端，不会暴露给客户端
- 使用CORS限制跨域请求
- 静态文件服务有目录遍历保护
- 输入内容经过HTML转义，防止XSS攻击

## 🐛 故障排除

### 端口被占用
```bash
# 查找占用3000端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
PORT=8080 npm start
```

### API请求失败
- 检查API密钥是否正确
- 检查网络连接
- 查看服务器日志：`pm2 logs`

### 静态文件404
- 检查文件路径是否正确
- 检查文件权限
- 查看服务器日志

## 📄 许可证

MIT License

## 🙏 致谢

- 图标：Font Awesome
- AI服务：DeepSeek API
- 设计灵感：各种可爱的工具网站

---

Made with 💕 by 大福
