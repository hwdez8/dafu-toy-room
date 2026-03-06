/**
 * Konami代码彩蛋 + Sylveon飘落游戏 🎀
 * 积木式架构 - 可独立删除或替换
 * 触发方式：电脑按 Konami代码(↑↑↓↓←→←→BA) / 连续点击大门标题"🎀"5次
 * 游戏：点击飘落的 Sylveon 消除得分
 */

(function() {
    'use strict';
    
    // Konami 代码序列
    const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let keySequence = [];
    
    // 游戏状态
    let isGameActive = false;
    let score = 0;
    let spawnInterval;
    let endGameTimeout;
    
    // 检测 Konami 代码
    function initKonamiListener() {
        document.addEventListener('keydown', (e) => {
            keySequence.push(e.key);
            keySequence = keySequence.slice(-10);
            
            if (keySequence.join(',') === KONAMI_CODE.join(',')) {
                startEasterEgg();
            }
        });
    }
    
    // 存储覆盖层引用，以便游戏开始时隐藏
    let bowOverlay = null;
    
    // 检测连续点击大门标题的"🎀"
    function initBowClickListener() {
        let bowClickCount = 0;
        let lastBowClickTime = 0;
        const BOW_CLICK_TIMEOUT = 3000; // 3秒内完成5次点击
        
        // 等待大门页面加载完成
        const initBowListener = () => {
            const gateTitle = document.querySelector('.gate-title');
            const gateHeader = document.querySelector('.gate-header');
            
            if (!gateTitle || !gateHeader) {
                // 如果还没加载，稍后重试
                setTimeout(initBowListener, 500);
                return;
            }
            
            console.log('🎀 标题点击监听器已绑定');
            
            // 处理点击/触摸的函数
            const handleTap = (e) => {
                if (isGameActive) return;
                
                const now = Date.now();
                
                // 检查是否在超时时间内
                if (now - lastBowClickTime > BOW_CLICK_TIMEOUT) {
                    bowClickCount = 0;
                    console.log('🎀 点击超时，计数重置');
                }
                
                lastBowClickTime = now;
                bowClickCount++;
                
                console.log(`🎀 标题被点击 ${bowClickCount}/5 次`);
                
                // 点击5次触发彩蛋
                if (bowClickCount >= 5) {
                    bowClickCount = 0;
                    console.log('🎀 触发彩蛋！');
                    startEasterEgg();
                }
            };
            
            // 创建一个透明的覆盖层来捕获点击事件
            bowOverlay = document.createElement('div');
            bowOverlay.id = 'bowClickOverlay';
            bowOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            `;
            
            // 确保 gate-header 是相对定位
            if (getComputedStyle(gateHeader).position === 'static') {
                gateHeader.style.position = 'relative';
            }
            
            gateHeader.appendChild(bowOverlay);
            
            // 绑定点击事件到覆盖层
            bowOverlay.addEventListener('click', handleTap);
            bowOverlay.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleTap(e);
            }, { passive: false });
            
            // 也绑定到标题本身作为后备
            gateTitle.addEventListener('click', handleTap);
            gateTitle.style.cursor = 'pointer';
            gateTitle.style.userSelect = 'none';
            gateTitle.style.webkitUserSelect = 'none';
        };
        
        initBowListener();
    }
    
    // 启动彩蛋
    function startEasterEgg() {
        if (isGameActive) return;
        isGameActive = true;
        score = 0;
        
        // 隐藏标题点击覆盖层，避免阻挡游戏点击
        if (bowOverlay) {
            bowOverlay.style.display = 'none';
        }
        
        createGameUI();
        startGame();
        
        console.log('🎀 Konami彩蛋已触发！');
    }
    
    // 创建游戏界面
    function createGameUI() {
        const gameHTML = `
            <div id="konamiGame" class="konami-game">
                <div class="konami-score">🎀 x <span id="konamiScore">0</span></div>
                <button class="konami-close" onclick="closeKonamiGame()">✕</button>
                <div class="konami-hint">点击飘落的 Sylveon！</div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', gameHTML);
        addGameStyles();
    }
    
    // 添加样式
    function addGameStyles() {
        const styles = `
            .konami-game {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(255, 107, 157, 0.15), rgba(168, 230, 207, 0.15));
                z-index: 99999;
                overflow: hidden;
                cursor: crosshair;
                touch-action: none;
            }
            
            .konami-score {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 2rem;
                font-weight: bold;
                color: var(--primary-color);
                background: white;
                padding: 10px 30px;
                border-radius: 50px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                z-index: 100000;
            }
            
            .konami-close {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: rgba(255, 255, 255, 0.9);
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 100000;
                transition: transform 0.3s;
            }
            
            .konami-close:hover {
                transform: scale(1.1) rotate(90deg);
            }
            
            .konami-hint {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.2rem;
                color: var(--text-color);
                background: rgba(255, 255, 255, 0.9);
                padding: 10px 20px;
                border-radius: 25px;
                animation: konami-hint-pulse 2s infinite;
                z-index: 100000;
            }
            
            @keyframes konami-hint-pulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
            
            .sylveon-fall {
                position: absolute;
                font-size: 3rem;
                cursor: pointer;
                user-select: none;
                pointer-events: auto;
                filter: drop-shadow(0 5px 10px rgba(255, 107, 157, 0.4));
                transition: transform 0.1s;
                z-index: 1;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                will-change: transform;
            }
            
            .sylveon-fall:hover {
                transform: scale(1.2);
            }
            
            .sylveon-fall.pop {
                animation: none !important;
                transition: all 0.3s ease-out;
                transform: scale(1.5) !important;
                opacity: 0;
                pointer-events: none;
            }
            
            @keyframes sylveon-fall-anim {
                from {
                    transform: translateY(0) rotate(0deg);
                }
                to {
                    transform: translateY(calc(100vh + 150px)) rotate(360deg);
                }
            }
            
            @keyframes sylveon-pop {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.5);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(0);
                    opacity: 0;
                }
            }
            
            .score-popup {
                position: absolute;
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--primary-color);
                pointer-events: none;
                animation: score-popup-anim 0.8s ease-out forwards;
            }
            
            @keyframes score-popup-anim {
                0% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-50px) scale(1.2);
                    opacity: 0;
                }
            }
            
            .konami-end {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 40px 60px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 100001;
                animation: konami-end-anim 0.5s ease-out;
            }
            
            @keyframes konami-end-anim {
                from {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
            }
            
            .konami-end h2 {
                color: var(--primary-color);
                font-size: 2rem;
                margin-bottom: 20px;
            }
            
            .konami-end .final-score {
                font-size: 3rem;
                font-weight: bold;
                color: var(--secondary-color);
                margin: 20px 0;
            }
            
            .konami-end button {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                border: none;
                padding: 15px 40px;
                border-radius: 30px;
                font-size: 1.2rem;
                cursor: pointer;
                margin-top: 20px;
                transition: transform 0.3s;
            }
            
            .konami-end button:hover {
                transform: scale(1.05);
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // 开始游戏
    function startGame() {
        // 生成 Sylveon
        spawnInterval = setInterval(spawnSylveon, 800);
        
        // 30秒后结束
        endGameTimeout = setTimeout(endGame, 30000);
    }
    
    // 生成飘落的 Sylveon
    function spawnSylveon() {
        if (!isGameActive) return;
        
        const gameEl = document.getElementById('konamiGame');
        if (!gameEl) return;
        
        const sylveon = document.createElement('div');
        sylveon.className = 'sylveon-fall';
        sylveon.textContent = '🎀';
        
        // 随机水平位置
        const startX = Math.random() * 85 + 5; // 5% - 90% 容器宽度
        const duration = Math.random() * 2 + 3; // 3-5秒下落时间
        
        sylveon.style.left = startX + '%';
        sylveon.style.top = '-60px';
        sylveon.style.animation = `sylveon-fall-anim ${duration}s linear forwards`;
        
        // 点击处理 - 使用 pointerdown 统一处理鼠标和触摸
        const handleSylveonTap = (e) => {
            e.stopPropagation();
            
            // 防止重复触发
            if (sylveon.classList.contains('pop')) return;
            
            // 获取点击位置
            const rect = sylveon.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            popSylveon(sylveon, x, y);
        };
        
        // 使用 pointerdown 统一处理所有输入类型
        sylveon.addEventListener('pointerdown', handleSylveonTap);
        
        gameEl.appendChild(sylveon);
        
        // 动画结束后移除
        const removeTimer = setTimeout(() => {
            if (sylveon.parentNode) {
                sylveon.remove();
            }
        }, duration * 1000);
        
        // 如果提前被点击消除，清除定时器
        sylveon.dataset.removeTimer = removeTimer;
    }
    
    // 点击消除 Sylveon
    function popSylveon(element, x, y) {
        if (element.classList.contains('pop')) return;
        
        element.classList.add('pop');
        
        // 清除自动移除定时器
        if (element.dataset.removeTimer) {
            clearTimeout(parseInt(element.dataset.removeTimer));
        }
        
        score++;
        const scoreEl = document.getElementById('konamiScore');
        if (scoreEl) {
            scoreEl.textContent = score;
        }
        
        // 显示得分动画
        showScorePopup(x, y);
        
        // 播放音效（如果有的话）
        playPopSound();
        
        setTimeout(() => {
            if (element.parentNode) {
                element.remove();
            }
        }, 300);
    }
    
    // 显示得分弹出
    function showScorePopup(x, y) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = '+1';
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        
        const gameEl = document.getElementById('konamiGame');
        if (gameEl) {
            gameEl.appendChild(popup);
            setTimeout(() => popup.remove(), 800);
        }
    }
    
    // 播放音效
    function playPopSound() {
        // 简单的点击音效 - 使用 Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // 静音失败也没关系
        }
    }
    
    // 结束游戏
    function endGame() {
        clearInterval(spawnInterval);
        clearTimeout(endGameTimeout);
        
        const gameEl = document.getElementById('konamiGame');
        if (!gameEl) return;
        
        // 清除所有飘落的 Sylveon
        const fallingSylveons = gameEl.querySelectorAll('.sylveon-fall');
        fallingSylveons.forEach(el => {
            if (el.dataset.removeTimer) {
                clearTimeout(parseInt(el.dataset.removeTimer));
            }
            el.remove();
        });
        
        // 显示结束界面
        const endHTML = `
            <div class="konami-end">
                <h2>🎉 游戏结束！</h2>
                <div class="final-score">${score} 🎀</div>
                <p>你抓住了 ${score} 只 Sylveon！</p>
                <button onclick="closeKonamiGame()">再来一次</button>
            </div>
        `;
        
        gameEl.insertAdjacentHTML('beforeend', endHTML);
        
        // 5秒后自动关闭
        setTimeout(() => {
            closeKonamiGame();
        }, 5000);
    }
    
    // 关闭游戏
    window.closeKonamiGame = function() {
        clearInterval(spawnInterval);
        clearTimeout(endGameTimeout);
        
        const gameEl = document.getElementById('konamiGame');
        if (gameEl) {
            gameEl.remove();
        }
        
        isGameActive = false;
        score = 0;
        keySequence = [];
    };
    
    // 初始化
    function init() {
        initKonamiListener();
        initBowClickListener();
        console.log('🎀 Konami彩蛋已加载！按 ↑↑↓↓←→←→BA 或连续点击大门标题5次触发');
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
