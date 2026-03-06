/**
 * 加载动画模块 🎬
 * 积木式架构 - 可独立删除或替换
 * 功能：进入网站时显示可爱的加载画面
 */

(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        minDisplayTime: 2000,  // 最少显示2秒
        fadeOutTime: 500,      // 淡出时间
        messages: [
            '正在召唤仙子伊布...',
            '大福正在准备玩具...',
            '正在加载快乐能量...',
            '正在布置玩具房...',
            '仙子伊布正在梳妆...'
        ]
    };
    
    // 创建加载画面
    function createLoadingScreen() {
        const loadingHTML = `
            <div id="loadingScreen" class="loading-screen">
                <div class="loading-content">
                    <div class="sylveon-loader">🎀</div>
                    <div class="loading-text">${DafuToyRoom.Utils.randomChoice(CONFIG.messages)}</div>
                    <div class="loading-progress">
                        <div class="progress-bar"></div>
                    </div>
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', loadingHTML);
        
        // 添加样式
        addLoadingStyles();
        
        // 模拟进度
        simulateProgress();
    }
    
    // 添加加载样式
    function addLoadingStyles() {
        const styles = `
            .loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #fff5f7 0%, #ffe4ec 50%, #fff0f3 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                transition: opacity ${CONFIG.fadeOutTime}ms ease-out;
            }
            
            .loading-screen.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .loading-content {
                text-align: center;
                padding: 20px;
            }
            
            .sylveon-loader {
                font-size: 5rem;
                animation: sylveon-bounce 1s ease-in-out infinite;
                margin-bottom: 20px;
                filter: drop-shadow(0 5px 15px rgba(255, 107, 157, 0.4));
            }
            
            @keyframes sylveon-bounce {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-20px) scale(1.1); }
            }
            
            .loading-text {
                font-size: 1.2rem;
                color: var(--primary-color);
                margin-bottom: 20px;
                font-weight: 500;
            }
            
            .loading-progress {
                width: 200px;
                height: 6px;
                background: rgba(255, 107, 157, 0.2);
                border-radius: 3px;
                overflow: hidden;
                margin: 0 auto 15px;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                border-radius: 3px;
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .loading-dots span {
                display: inline-block;
                width: 10px;
                height: 10px;
                background: var(--primary-color);
                border-radius: 50%;
                margin: 0 5px;
                animation: loading-dot 1.4s ease-in-out infinite both;
            }
            
            .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
            .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes loading-dot {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .sylveon-loader {
                    font-size: 4rem;
                }
                .loading-text {
                    font-size: 1rem;
                }
                .loading-progress {
                    width: 150px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // 模拟进度
    function simulateProgress() {
        const progressBar = document.querySelector('.progress-bar');
        const loadingText = document.querySelector('.loading-text');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            // 随机更换文字
            if (Math.random() > 0.7 && loadingText) {
                loadingText.textContent = DafuToyRoom.Utils.randomChoice(CONFIG.messages);
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(hideLoading, 300);
            }
        }, 200);
    }
    
    // 隐藏加载画面
    function hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, CONFIG.fadeOutTime);
        }
    }
    
    // 初始化
    function init() {
        // 页面加载完成后显示加载动画
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createLoadingScreen);
        } else {
            createLoadingScreen();
        }
        
        console.log('🎬 加载动画模块已加载！');
    }
    
    // 注册模块
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('loading', init);
    } else {
        init();
    }
})();
