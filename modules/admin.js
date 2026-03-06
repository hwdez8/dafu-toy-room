/**
 * 管理面板模块 👑
 * 积木式架构 - 可独立删除或替换
 * 功能：留言审核、黑名单管理、评论管理
 * 入口：点击版本号10次 或 访问 /admin
 */

(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        apiEndpoint: '/api/admin',
        adminPassword: 'O&0T89oAaDi7',  // 备用密码
        clickCount: 0,
        requiredClicks: 10
    };
    
    // 状态
    let isAuthenticated = false;
    let currentTab = 'pending';  // pending, approved, blacklist
    
    // 检测是否为管理员（IP白名单或密码）
    async function checkAdmin() {
        try {
            const res = await fetch(`${CONFIG.apiEndpoint}/check`);
            const data = await res.json();
            return data.isAdmin;
        } catch (err) {
            return false;
        }
    }
    
    // 显示登录界面
    function showLogin() {
        const loginHTML = `
            <div id="adminLoginModal" class="admin-login-modal">
                <div class="admin-login-content">
                    <h3>🔐 管理员登录</h3>
                    <p class="login-hint">请输入管理员密码</p>
                    <input type="password" id="adminPassword" placeholder="密码" maxlength="50">
                    <div class="login-buttons">
                        <button onclick="adminLogin()">登录</button>
                        <button onclick="closeAdminLogin()" class="cancel">取消</button>
                    </div>
                    <p class="login-error" id="loginError"></p>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loginHTML);
        addAdminStyles();
        
        // 回车登录
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') adminLogin();
        });
    }
    
    // 登录
    window.adminLogin = async function() {
        const password = document.getElementById('adminPassword').value;
        
        try {
            const res = await fetch(`${CONFIG.apiEndpoint}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            const data = await res.json();
            
            if (data.success) {
                isAuthenticated = true;
                closeAdminLogin();
                showAdminPanel();
            } else {
                document.getElementById('loginError').textContent = '密码错误！';
                document.getElementById('adminPassword').value = '';
            }
        } catch (err) {
            document.getElementById('loginError').textContent = '登录失败，请重试';
        }
    };
    
    // 关闭登录框
    window.closeAdminLogin = function() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) modal.remove();
    };
    
    // 显示管理面板
    function showAdminPanel() {
        const panelHTML = `
            <div id="adminPanel" class="admin-panel">
                <div class="admin-header">
                    <h2>👑 管理面板</h2>
                    <button class="admin-close" onclick="closeAdminPanel()">&times;</button>
                </div>
                <div class="admin-tabs">
                    <button class="admin-tab ${currentTab === 'pending' ? 'active' : ''}" onclick="switchAdminTab('pending')">
                        ⏳ 待审核
                    </button>
                    <button class="admin-tab ${currentTab === 'approved' ? 'active' : ''}" onclick="switchAdminTab('approved')">
                        ✅ 已发布
                    </button>
                    <button class="admin-tab ${currentTab === 'blacklist' ? 'active' : ''}" onclick="switchAdminTab('blacklist')">
                        🚫 黑名单
                    </button>
                </div>
                <div class="admin-content" id="adminContent">
                    <!-- 内容区域 -->
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        loadAdminContent();
    }
    
    // 切换标签
    window.switchAdminTab = function(tab) {
        currentTab = tab;
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        loadAdminContent();
    };
    
    // 加载内容
    async function loadAdminContent() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="admin-loading">加载中...</div>';
        
        try {
            const res = await fetch(`${CONFIG.apiEndpoint}/${currentTab}`);
            const data = await res.json();
            
            if (currentTab === 'pending') {
                renderPendingList(data.messages || []);
            } else if (currentTab === 'approved') {
                renderApprovedList(data.messages || []);
            } else if (currentTab === 'blacklist') {
                renderBlacklist(data.ips || []);
            }
        } catch (err) {
            content.innerHTML = '<div class="admin-error">加载失败</div>';
        }
    }
    
    // 渲染待审核列表
    function renderPendingList(messages) {
        const content = document.getElementById('adminContent');
        
        if (messages.length === 0) {
            content.innerHTML = '<div class="admin-empty">没有待审核的留言</div>';
            return;
        }
        
        content.innerHTML = messages.map(msg => `
            <div class="admin-item pending">
                <div class="admin-item-header">
                    <span class="admin-time">${msg.date} ${msg.time}</span>
                    <span class="admin-ip">IP: ${msg.ip}</span>
                </div>
                <div class="admin-item-content">${escapeHtml(msg.content)}</div>
                <div class="admin-item-actions">
                    <button class="btn-approve" onclick="handleMessage('${msg.id}', 'approve')">✅ 通过</button>
                    <button class="btn-delete" onclick="handleMessage('${msg.id}', 'delete')">🗑️ 删除</button>
                    <button class="btn-ban" onclick="handleMessage('${msg.id}', 'ban')">🚫 拉黑</button>
                </div>
            </div>
        `).join('');
    }
    
    // 渲染已发布列表
    function renderApprovedList(messages) {
        const content = document.getElementById('adminContent');
        
        if (messages.length === 0) {
            content.innerHTML = '<div class="admin-empty">没有已发布的留言</div>';
            return;
        }
        
        content.innerHTML = `
            <div class="admin-search">
                <input type="text" id="searchInput" placeholder="搜索留言内容..." onkeyup="searchMessages()">
            </div>
            <div class="admin-list" id="approvedList">
                ${messages.map(msg => `
                    <div class="admin-item approved" data-content="${msg.content.toLowerCase()}">
                        <div class="admin-item-header">
                            <span class="admin-time">${msg.date} ${msg.time}</span>
                            <span class="admin-ip">IP: ${msg.ip}</span>
                        </div>
                        <div class="admin-item-content">${escapeHtml(msg.content)}</div>
                        <div class="admin-item-actions">
                            <button class="btn-delete" onclick="handleMessage('${msg.id}', 'delete')">🗑️ 删除</button>
                            <button class="btn-ban" onclick="handleMessage('${msg.id}', 'ban')">🚫 拉黑</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 渲染黑名单
    function renderBlacklist(ips) {
        const content = document.getElementById('adminContent');
        
        if (ips.length === 0) {
            content.innerHTML = '<div class="admin-empty">黑名单为空</div>';
            return;
        }
        
        content.innerHTML = `
            <div class="admin-blacklist-header">
                <span>共 ${ips.length} 个被拉黑的IP</span>
            </div>
            ${ips.map(item => `
                <div class="admin-item blacklist">
                    <div class="admin-item-header">
                        <span class="admin-ip">🚫 ${item.ip}</span>
                        <span class="admin-time">拉黑时间: ${item.banDate}</span>
                    </div>
                    <div class="admin-item-content">
                        原因: ${escapeHtml(item.reason || '恶意留言')}
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-unban" onclick="unbanIp('${item.ip}')">✅ 解除拉黑</button>
                    </div>
                </div>
            `).join('')}
        `;
    }
    
    // 搜索留言
    window.searchMessages = function() {
        const keyword = document.getElementById('searchInput').value.toLowerCase();
        document.querySelectorAll('#approvedList .admin-item').forEach(item => {
            const content = item.dataset.content;
            item.style.display = content.includes(keyword) ? 'block' : 'none';
        });
    };
    
    // 处理留言（通过/删除/拉黑）
    window.handleMessage = async function(id, action) {
        if (!confirm(`确定要${getActionText(action)}吗？`)) return;
        
        try {
            const res = await fetch(`${CONFIG.apiEndpoint}/message/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            
            const data = await res.json();
            
            if (data.success) {
                alert('操作成功！');
                loadAdminContent();
            } else {
                alert(data.error || '操作失败');
            }
        } catch (err) {
            alert('操作失败，请重试');
        }
    };
    
    // 解除拉黑
    window.unbanIp = async function(ip) {
        if (!confirm(`确定要解除对 ${ip} 的拉黑吗？`)) return;
        
        try {
            const res = await fetch(`${CONFIG.apiEndpoint}/unban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });
            
            const data = await res.json();
            
            if (data.success) {
                alert('已解除拉黑！');
                loadAdminContent();
            } else {
                alert(data.error || '操作失败');
            }
        } catch (err) {
            alert('操作失败，请重试');
        }
    };
    
    // 获取操作文本
    function getActionText(action) {
        const texts = {
            approve: '通过这条留言',
            delete: '删除这条留言',
            ban: '删除并拉黑该用户'
        };
        return texts[action] || action;
    }
    
    // 关闭管理面板
    window.closeAdminPanel = function() {
        const panel = document.getElementById('adminPanel');
        if (panel) panel.remove();
        isAuthenticated = false;
    };
    
    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 添加样式
    function addAdminStyles() {
        const styles = `
            /* 登录框 */
            .admin-login-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 20000;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .admin-login-content {
                background: var(--card-bg);
                padding: 30px;
                border-radius: 20px;
                width: 90%;
                max-width: 400px;
                text-align: center;
            }
            
            .admin-login-content h3 {
                margin: 0 0 10px 0;
                color: var(--primary-color);
            }
            
            .login-hint {
                color: var(--text-light);
                margin-bottom: 20px;
            }
            
            .admin-login-content input {
                width: 100%;
                padding: 12px;
                border: 2px solid var(--primary-light);
                border-radius: 10px;
                font-size: 1rem;
                margin-bottom: 15px;
            }
            
            .login-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            
            .login-buttons button {
                padding: 10px 25px;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                font-size: 1rem;
            }
            
            .login-buttons button:first-child {
                background: var(--primary-color);
                color: white;
            }
            
            .login-buttons button.cancel {
                background: var(--bg-color);
                color: var(--text-color);
            }
            
            .login-error {
                color: #ff4757;
                margin-top: 10px;
                font-size: 0.9rem;
            }
            
            /* 管理面板 */
            .admin-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 800px;
                height: 80vh;
                background: var(--card-bg);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                z-index: 20000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .admin-header h2 {
                margin: 0;
            }
            
            .admin-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .admin-tabs {
                display: flex;
                border-bottom: 2px solid var(--bg-color);
            }
            
            .admin-tab {
                flex: 1;
                padding: 15px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 1rem;
                color: var(--text-light);
                transition: all 0.3s;
            }
            
            .admin-tab.active {
                color: var(--primary-color);
                border-bottom: 3px solid var(--primary-color);
            }
            
            .admin-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .admin-item {
                background: var(--bg-color);
                padding: 15px;
                border-radius: 15px;
                margin-bottom: 15px;
            }
            
            .admin-item.pending {
                border-left: 4px solid #ffa502;
            }
            
            .admin-item.approved {
                border-left: 4px solid #2ed573;
            }
            
            .admin-item.blacklist {
                border-left: 4px solid #ff4757;
            }
            
            .admin-item-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 0.85rem;
                color: var(--text-light);
            }
            
            .admin-item-content {
                color: var(--text-color);
                line-height: 1.6;
                margin-bottom: 15px;
                word-break: break-word;
            }
            
            .admin-item-actions {
                display: flex;
                gap: 10px;
            }
            
            .admin-item-actions button {
                padding: 8px 15px;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: transform 0.2s;
            }
            
            .admin-item-actions button:hover {
                transform: translateY(-2px);
            }
            
            .btn-approve {
                background: #2ed573;
                color: white;
            }
            
            .btn-delete {
                background: #ff4757;
                color: white;
            }
            
            .btn-ban {
                background: #2f3542;
                color: white;
            }
            
            .btn-unban {
                background: #2ed573;
                color: white;
            }
            
            .admin-search {
                margin-bottom: 15px;
            }
            
            .admin-search input {
                width: 100%;
                padding: 12px;
                border: 2px solid var(--primary-light);
                border-radius: 10px;
                font-size: 1rem;
            }
            
            .admin-empty, .admin-loading, .admin-error {
                text-align: center;
                padding: 40px;
                color: var(--text-light);
            }
            
            .admin-blacklist-header {
                margin-bottom: 15px;
                padding: 10px;
                background: var(--primary-light);
                border-radius: 10px;
                text-align: center;
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .admin-panel {
                    width: 95%;
                    height: 90vh;
                }
                
                .admin-item-actions {
                    flex-wrap: wrap;
                }
                
                .admin-item-actions button {
                    flex: 1;
                    min-width: 80px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // 版本号点击检测
    function initVersionClick() {
        const versionElements = document.querySelectorAll('.version, .gate-version');
        versionElements.forEach(el => {
            el.style.cursor = 'pointer';
            el.title = '点击10次进入管理面板';
            el.addEventListener('click', async () => {
                CONFIG.clickCount++;
                
                if (CONFIG.clickCount >= CONFIG.requiredClicks) {
                    CONFIG.clickCount = 0;
                    
                    // 检查是否是管理员
                    const isAdmin = await checkAdmin();
                    
                    if (isAdmin) {
                        isAuthenticated = true;
                        showAdminPanel();
                    } else {
                        showLogin();
                    }
                } else {
                    // 显示剩余点击次数
                    el.style.transform = 'scale(1.1)';
                    setTimeout(() => el.style.transform = '', 200);
                }
            });
        });
    }
    
    // 初始化
    function init() {
        addAdminStyles();
        initVersionClick();
        console.log('👑 管理面板模块已加载！点击版本号10次进入');
    }
    
    // 注册模块
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('admin', init);
    } else {
        init();
    }
})();
