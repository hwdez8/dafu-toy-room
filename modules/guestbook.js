/**
 * 留言板模块 💬
 * 积木式架构 - 可独立删除或替换
 * 功能：用户留言、显示已审核留言
 */

(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        apiEndpoint: '/api/guestbook',
        maxLength: 200,
        minLength: 2,
        maxEmojis: 5
    };
    
    // 敏感词列表
    const BLOCKED_WORDS = ['脏话', '广告', '政治', '色情', '赌博', '诈骗'];
    
    // 检查今日是否已留言
    async function checkTodayPostStatus() {
        try {
            const res = await fetch(`${CONFIG.apiEndpoint}/check`);
            const data = await res.json();
            return data.canPost;
        } catch (err) {
            return true;
        }
    }
    
    // 创建留言板UI
    async function createGuestbookUI() {
        const canPost = await checkTodayPostStatus();
        
        const modalHTML = `
            <div id="guestbookModal" class="guestbook-modal">
                <div class="guestbook-content">
                    <div class="guestbook-header">
                        <h3>💬 留言板</h3>
                        <button class="guestbook-close" onclick="closeGuestbook()">&times;</button>
                    </div>
                    <div class="guestbook-body">
                        <div class="guestbook-form">
                            <div class="textarea-wrapper">
                                <textarea id="guestbookInput" 
                                    placeholder="${canPost ? '发一条友善的留言吧~' : '您今天已经留言过了，明天再来吧~'}" 
                                    maxlength="200" 
                                    ${canPost ? '' : 'disabled'}
                                    class="${canPost ? '' : 'disabled'}"></textarea>
                                <div class="textarea-hint">💝 每一条留言都会经过审核后显示哦~</div>
                            </div>
                            <div class="guestbook-form-footer">
                                <span class="char-count">0/200</span>
                                <button class="submit-btn ${canPost ? '' : 'disabled'}" onclick="submitGuestbook()" ${canPost ? '' : 'disabled'}>
                                    ${canPost ? '提交留言' : '今日已留言'}
                                </button>
                            </div>
                        </div>
                        <div class="guestbook-list" id="guestbookList">
                            <!-- 留言列表 -->
                        </div>
                    </div>
                </div>
            </div>
            <div id="guestbookToast" class="guestbook-toast"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        addGuestbookStyles();
        bindGuestbookEvents();
        loadGuestbookMessages();
    }
    
    // 添加样式
    function addGuestbookStyles() {
        const styles = `
            .guestbook-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                justify-content: center;
                align-items: center;
            }
            
            .guestbook-modal.show {
                display: flex;
            }
            
            .guestbook-content {
                background: var(--card-bg);
                border-radius: 20px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            
            .guestbook-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
            }
            
            .guestbook-header h3 {
                margin: 0;
                font-size: 1.3rem;
            }
            
            .guestbook-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.3s;
            }
            
            .guestbook-close:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .guestbook-body {
                padding: 20px;
                max-height: calc(80vh - 80px);
                overflow-y: auto;
            }
            
            .guestbook-form {
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 2px dashed var(--primary-light);
            }
            
            .textarea-wrapper {
                position: relative;
                margin-bottom: 10px;
            }
            
            .guestbook-form textarea {
                width: 100%;
                min-height: 120px;
                padding: 15px;
                padding-bottom: 35px;
                border: 2px solid var(--primary-light);
                border-radius: 15px;
                font-size: 1rem;
                resize: vertical;
                background: var(--bg-color);
                color: var(--text-color);
                font-family: inherit;
                transition: all 0.3s ease;
            }
            
            .guestbook-form textarea:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
            }
            
            .guestbook-form textarea:disabled,
            .guestbook-form textarea.disabled {
                background: #f5f5f5;
                color: #999;
                cursor: not-allowed;
                border-color: #ddd;
            }
            
            .guestbook-form textarea::placeholder {
                color: #aaa;
                font-size: 0.95rem;
            }
            
            /* B站风格提示文字 */
            .textarea-hint {
                position: absolute;
                bottom: 10px;
                left: 15px;
                font-size: 0.8rem;
                color: rgba(0, 0, 0, 0.35);
                pointer-events: none;
                transition: all 0.3s ease;
            }
            
            .guestbook-form textarea:focus + .textarea-hint,
            .guestbook-form textarea:not(:placeholder-shown) + .textarea-hint {
                opacity: 0;
            }
            
            /* Toast提示样式 */
            .guestbook-toast {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 1rem;
                z-index: 20000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                white-space: nowrap;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            
            .guestbook-toast.show {
                opacity: 1;
                visibility: visible;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .guestbook-toast.success {
                background: rgba(46, 213, 115, 0.9);
            }
            
            .guestbook-toast.warning {
                background: rgba(255, 165, 2, 0.9);
            }
            
            .guestbook-toast.error {
                background: rgba(255, 71, 87, 0.9);
            }
            
            .submit-btn:disabled,
            .submit-btn.disabled {
                background: #ccc !important;
                cursor: not-allowed !important;
                transform: none !important;
                box-shadow: none !important;
            }
            
            .guestbook-form-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
            }
            
            .char-count {
                color: var(--text-light);
                font-size: 0.9rem;
            }
            
            .submit-btn {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                border: none;
                padding: 10px 25px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 1rem;
                transition: transform 0.3s, box-shadow 0.3s;
            }
            
            .submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 107, 157, 0.4);
            }
            
            .guestbook-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .guestbook-item {
                background: var(--bg-color);
                padding: 15px;
                border-radius: 15px;
                border-left: 4px solid var(--primary-color);
            }
            
            .guestbook-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                font-size: 0.85rem;
                color: var(--text-light);
            }
            
            .guestbook-item-content {
                color: var(--text-color);
                line-height: 1.6;
                word-break: break-word;
            }
            
            .guestbook-empty {
                text-align: center;
                padding: 40px;
                color: var(--text-light);
            }
            
            /* 留言按钮 - 移到左侧避免挡住彩蛋按钮 */
            .guestbook-float-btn {
                position: fixed;
                bottom: 30px;
                left: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                box-shadow: 0 5px 20px rgba(255, 107, 157, 0.4);
                transition: transform 0.3s, box-shadow 0.3s;
                z-index: 999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .guestbook-float-btn:hover {
                transform: scale(1.1) rotate(-10deg);
                box-shadow: 0 8px 30px rgba(255, 107, 157, 0.5);
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .guestbook-content {
                    width: 95%;
                    max-height: 90vh;
                }
                
                .guestbook-float-btn {
                    width: 50px;
                    height: 50px;
                    font-size: 1.2rem;
                    bottom: 20px;
                    left: 20px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // 绑定事件
    function bindGuestbookEvents() {
        // 字符计数
        const textarea = document.getElementById('guestbookInput');
        if (textarea) {
            textarea.addEventListener('input', function() {
                document.querySelector('.char-count').textContent = this.value.length + '/200';
            });
        }
        
        // 点击模态框外部关闭
        const modal = document.getElementById('guestbookModal');
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeGuestbook();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeGuestbook();
            }
        });
    }
    
    // 打开留言板
    window.openGuestbook = function() {
        const modal = document.getElementById('guestbookModal');
        if (modal) {
            modal.classList.add('show');
            loadGuestbookMessages();
        }
    };
    
    // 关闭留言板
    window.closeGuestbook = function() {
        const modal = document.getElementById('guestbookModal');
        if (modal) {
            modal.classList.remove('show');
        }
    };
    
    // 显示Toast提示
    function showToast(message, type = 'info') {
        const toast = document.getElementById('guestbookToast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `guestbook-toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // 提交留言
    window.submitGuestbook = function() {
        const textarea = document.getElementById('guestbookInput');
        const content = textarea.value.trim();
        
        // 验证
        if (content.length < CONFIG.minLength) {
            showToast('留言太短啦，多说几句吧~', 'warning');
            return;
        }
        
        if (content.length > CONFIG.maxLength) {
            showToast('留言太长啦，精简一下~', 'warning');
            return;
        }
        
        // 检查敏感词
        for (const word of BLOCKED_WORDS) {
            if (content.includes(word)) {
                showToast('留言包含不当内容，请修改后重试~', 'error');
                return;
            }
        }
        
        // 检查emoji数量
        const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
        if (emojiCount > CONFIG.maxEmojis) {
            showToast('emoji太多啦，最多5个哦~', 'warning');
            return;
        }
        
        // 提交到服务器
        fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('✅ 留言提交成功！等待审核后显示~', 'success');
                textarea.value = '';
                document.querySelector('.char-count').textContent = '0/200';
                // 禁用输入框和按钮
                textarea.disabled = true;
                textarea.classList.add('disabled');
                textarea.placeholder = '您今天已经留言过了，明天再来吧~';
                const submitBtn = document.querySelector('.submit-btn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('disabled');
                    submitBtn.textContent = '今日已留言';
                }
            } else {
                showToast(data.error || '提交失败，请稍后重试', 'error');
            }
        })
        .catch(err => {
            console.error('提交留言失败:', err);
            showToast('提交失败，请检查网络连接', 'error');
        });
    };
    
    // 加载留言列表
    function loadGuestbookMessages() {
        fetch(CONFIG.apiEndpoint)
            .then(res => res.json())
            .then(data => {
                const listContainer = document.getElementById('guestbookList');
                if (!listContainer) return;
                
                if (!data.messages || data.messages.length === 0) {
                    listContainer.innerHTML = '<div class="guestbook-empty">还没有留言，快来抢沙发吧~</div>';
                    return;
                }
                
                listContainer.innerHTML = data.messages.map(msg => `
                    <div class="guestbook-item">
                        <div class="guestbook-item-header">
                            <span>${msg.date}</span>
                            <span>👤 访客</span>
                        </div>
                        <div class="guestbook-item-content">${escapeHtml(msg.content)}</div>
                    </div>
                `).join('');
            })
            .catch(err => {
                console.error('加载留言失败:', err);
            });
    }
    
    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 创建浮动按钮
    function createFloatButton() {
        const btn = document.createElement('button');
        btn.className = 'guestbook-float-btn';
        btn.innerHTML = '💬';
        btn.title = '留言板';
        btn.onclick = openGuestbook;
        document.body.appendChild(btn);
    }
    
    // 初始化
    function init() {
        createGuestbookUI();
        createFloatButton();
        console.log('💬 留言板模块已加载！');
    }
    
    // 注册模块
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('guestbook', init);
    } else {
        init();
    }
})();
