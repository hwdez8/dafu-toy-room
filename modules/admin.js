/**
 * 管理员模块 🔐
 * 积木式架构 - 可独立删除或替换
 */

(function() {
    'use strict';
    
    let clickCount = 0;
    let lastClickTime = 0;
    let isAdmin = false;
    let currentTab = 'pending';
    
    // 创建管理面板
    function createAdminPanel() {
        const panel = document.createElement('div');
        panel.className = 'admin-panel';
        panel.id = 'adminPanel';
        panel.innerHTML = `
            <div class="admin-overlay" onclick="closeAdminPanel()"></div>
            <div class="admin-container">
                <div class="admin-header">
                    <h3>🔐 管理面板</h3>
                    <button class="admin-close" onclick="closeAdminPanel()">✕</button>
                </div>
                <div class="admin-tabs">
                    <button class="admin-tab ${currentTab === 'pending' ? 'active' : ''}" onclick="switchAdminTab('pending')">⏳ 待审核</button>
                    <button class="admin-tab ${currentTab === 'approved' ? 'active' : ''}" onclick="switchAdminTab('approved')">✅ 已发布</button>
                </div>
                <div class="admin-content" id="adminContent">加载中...</div>
            </div>
        `;
        document.body.appendChild(panel);
        addAdminStyles();
    }
    
    function addAdminStyles() {
        const styles = `
            .admin-panel { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; display: none; }
            .admin-panel.show { display: block; }
            .admin-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
            .admin-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 20px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            .admin-header { background: linear-gradient(135deg, #ff6b9d, #ff8fab); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
            .admin-header h3 { margin: 0; font-size: 1.3rem; }
            .admin-close { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
            .admin-tabs { display: flex; border-bottom: 2px solid #f0f0f0; }
            .admin-tab { flex: 1; padding: 15px; border: none; background: none; cursor: pointer; font-size: 1rem; }
            .admin-tab.active { background: #fff5f7; color: #ff6b9d; font-weight: bold; }
            .admin-content { padding: 20px; max-height: 50vh; overflow-y: auto; }
            .admin-item { background: #f8f8f8; border-radius: 10px; padding: 15px; margin-bottom: 15px; }
            .admin-item p { margin: 0 0 10px 0; color: #333; }
            .admin-meta { font-size: 0.85rem; color: #999; margin-bottom: 10px; }
            .admin-actions { display: flex; gap: 10px; }
            .admin-actions button { padding: 8px 15px; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem; }
            .btn-approve { background: #a8e6cf; color: #2d6a4f; }
            .btn-delete { background: #ffc2d1; color: #9d4edd; }
            .admin-empty { text-align: center; padding: 40px; color: #999; }
            .admin-password { text-align: center; padding: 40px; }
            .admin-password input { padding: 12px 20px; border: 2px solid #ffc2d1; border-radius: 25px; font-size: 1rem; width: 200px; margin-bottom: 15px; }
            .admin-password button { padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d, #ff8fab); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; }
        `;
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    async function loadAdminData() {
        const content = document.getElementById('adminContent');
        if (!isAdmin) {
            content.innerHTML = `
                <div class="admin-password">
                    <p>🎉 彩蛋触发！请输入密码</p>
                    <input type="password" id="adminPassword" placeholder="输入密码"><br>
                    <button onclick="checkAdminPassword()">进入管理面板</button>
                </div>
            `;
            return;
        }
        
        try {
            const endpoint = currentTab === 'pending' ? '/pending' : '/approved';
            const res = await fetch(`/api/admin${endpoint}`);
            const data = await res.json();
            
            if (!data.success) {
                content.innerHTML = '<div class="admin-empty">加载失败</div>';
                return;
            }
            
            const messages = data.messages || [];
            if (messages.length === 0) {
                content.innerHTML = `<div class="admin-empty">${currentTab === 'pending' ? '没有待审核的留言' : '没有已发布的留言'}</div>`;
                return;
            }
            
            content.innerHTML = messages.map(msg => `
                <div class="admin-item">
                    <p>${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                    <div class="admin-meta">IP: ${msg.ip} | ${msg.date} ${msg.time}</div>
                    <div class="admin-actions">
                        ${currentTab === 'pending' ? `<button class="btn-approve" onclick="handleMessage(${msg.id}, 'approve')">✅ 通过</button>` : ''}
                        <button class="btn-delete" onclick="handleMessage(${msg.id}, 'delete')">🗑️ 删除</button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            content.innerHTML = '<div class="admin-empty">加载失败</div>';
        }
    }
    
    window.checkAdminPassword = async function() {
        const password = document.getElementById('adminPassword').value;
        try {
            const res = await fetch('/api/admin/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.isAdmin) {
                isAdmin = true;
                loadAdminData();
            } else {
                alert('密码错误！');
            }
        } catch (e) {
            alert('验证失败');
        }
    };
    
    window.switchAdminTab = function(tab) {
        currentTab = tab;
        const panel = document.getElementById('adminPanel');
        if (panel) panel.remove();
        createAdminPanel();
        document.getElementById('adminPanel').classList.add('show');
        loadAdminData();
    };
    
    window.closeAdminPanel = function() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.classList.remove('show');
            isAdmin = false;
            currentTab = 'pending';
        }
    };
    
    window.handleMessage = async function(id, action) {
        if (!confirm(`确定要${action === 'approve' ? '通过' : '删除'}这条留言吗？`)) return;
        try {
            const res = await fetch(`/api/admin/message/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (data.success) {
                alert('操作成功！');
                loadAdminData();
            } else {
                alert(data.error || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };
    
    function init() {
        const version = document.querySelector('.version');
        if (!version) {
            console.log('未找到版本号元素');
            return;
        }
        
        version.style.cursor = 'pointer';
        version.title = '点我10次有惊喜~';
        
        version.addEventListener('click', function() {
            const now = Date.now();
            if (now - lastClickTime > 5000) clickCount = 0;
            clickCount++;
            lastClickTime = now;
            console.log('点击:', clickCount);
            
            if (clickCount >= 10) {
                clickCount = 0;
                console.log('触发管理面板');
                let panel = document.getElementById('adminPanel');
                if (!panel) createAdminPanel();
                document.getElementById('adminPanel').classList.add('show');
                loadAdminData();
            }
        });
        
        console.log('管理员模块已加载');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
