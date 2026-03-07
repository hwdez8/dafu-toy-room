/**
 * 打地鼠游戏模块 🐹
 * 积木式架构 - 可独立删除或替换
 */

(function() {
    'use strict';
    
    // 游戏配置
    const CONFIG = {
        gridSize: 3,           // 3x3 网格
        gameDuration: 30,      // 游戏时长 30 秒
        minPeepTime: 400,      // 地鼠最短出现时间
        maxPeepTime: 1000,     // 地鼠最长出现时间
        pointsPerHit: 10,      // 每次击中得分
        pointsPerMiss: -10     // 每次点空扣分
    };
    
    // 游戏状态
    const state = {
        score: 0,
        timeLeft: CONFIG.gameDuration,
        isPlaying: false,
        lastHole: null,
        timer: null,
        peepTimer: null
    };
    
    // DOM 元素
    let elements = {};
    
    // 获取 DOM 元素
    function getElements() {
        elements = {
            grid: document.getElementById('moleGrid'),
            scoreDisplay: document.getElementById('moleScore'),
            timeDisplay: document.getElementById('moleTime'),
            startBtn: document.getElementById('startMoleBtn'),
            gameOverScreen: document.getElementById('moleGameOver'),
            finalScore: document.getElementById('moleFinalScore'),
            holes: []
        };
    }
    
    // 创建游戏网格
    function createGrid() {
        if (!elements.grid) return;
        
        elements.grid.innerHTML = '';
        elements.holes = [];
        
        for (let i = 0; i < CONFIG.gridSize * CONFIG.gridSize; i++) {
            const hole = document.createElement('div');
            hole.className = 'mole-hole';
            hole.dataset.index = i;
            
            const mole = document.createElement('div');
            mole.className = 'mole';
            mole.textContent = '🐹';
            
            hole.appendChild(mole);
            elements.grid.appendChild(hole);
            elements.holes.push({ hole, mole, isUp: false });
            
            // 点击事件绑定在地洞上
            hole.addEventListener('click', () => whack(i));
        }
    }
    
    // 随机时间
    function randomTime(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }
    
    // 随机地洞
    function randomHole() {
        const idx = Math.floor(Math.random() * elements.holes.length);
        const hole = elements.holes[idx];
        if (idx === state.lastHole || hole.isUp) {
            return randomHole();
        }
        state.lastHole = idx;
        return hole;
    }
    
    // 地鼠出现
    function peep() {
        if (!state.isPlaying) return;
        
        const time = randomTime(CONFIG.minPeepTime, CONFIG.maxPeepTime);
        const hole = randomHole();
        
        hole.isUp = true;
        hole.hole.classList.add('up');
        
        state.peepTimer = setTimeout(() => {
            hole.hole.classList.remove('up');
            hole.isUp = false;
            if (state.isPlaying) peep();
        }, time);
    }
    
    // 显示得分动画
    function showScorePopup(x, y, score) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = score > 0 ? `+${score}` : `${score}`;
        popup.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: ${score > 0 ? '#4CAF50' : '#f44336'};
            pointer-events: none;
            z-index: 9999;
            animation: score-popup-anim 0.8s ease-out forwards;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), 800);
    }
    
    // 打地鼠
    function whack(index, event) {
        if (!state.isPlaying) return;
        
        const hole = elements.holes[index];
        const rect = hole.hole.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        if (hole.isUp) {
            // 打中了！
            state.score += CONFIG.pointsPerHit;
            updateScore();
            
            // 显示 +10
            showScorePopup(x, y, CONFIG.pointsPerHit);
            
            hole.hole.classList.remove('up');
            hole.isUp = false;
            
            // 击中动画
            hole.mole.textContent = '💫';
            setTimeout(() => {
                hole.mole.textContent = '🐹';
            }, 200);
        } else {
            // 点空了！扣分
            state.score += CONFIG.pointsPerMiss;
            updateScore();
            
            // 显示 -10
            showScorePopup(x, y, CONFIG.pointsPerMiss);
            
            // 空点动画
            hole.hole.style.animation = 'shake 0.3s ease-in-out';
            setTimeout(() => {
                hole.hole.style.animation = '';
            }, 300);
        }
    }
    
    // 更新分数显示
    function updateScore() {
        if (elements.scoreDisplay) {
            elements.scoreDisplay.textContent = state.score;
        }
    }
    
    // 更新时间显示
    function updateTime() {
        if (elements.timeDisplay) {
            elements.timeDisplay.textContent = state.timeLeft + 's';
        }
    }
    
    // 开始游戏
    function startGame() {
        if (state.isPlaying) return;
        
        state.score = 0;
        state.timeLeft = CONFIG.gameDuration;
        state.isPlaying = true;
        state.lastHole = null;
        
        updateScore();
        updateTime();
        
        elements.startBtn.style.display = 'none';
        elements.gameOverScreen.style.display = 'none';
        
        // 开始计时
        state.timer = setInterval(() => {
            state.timeLeft--;
            updateTime();
            
            if (state.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
        
        // 开始出地鼠
        peep();
        
        // 记录统计
        recordStats();
        
        console.log('🐹 打地鼠游戏开始！');
    }
    
    // 结束游戏
    function endGame() {
        state.isPlaying = false;
        
        clearInterval(state.timer);
        clearTimeout(state.peepTimer);
        
        // 隐藏所有地鼠
        elements.holes.forEach(hole => {
            hole.hole.classList.remove('up');
            hole.isUp = false;
        });
        
        // 显示游戏结束
        elements.finalScore.textContent = state.score;
        elements.gameOverScreen.style.display = 'flex';
        elements.startBtn.style.display = 'inline-block';
        elements.startBtn.textContent = '再玩一次';
        
        console.log('🐹 游戏结束！得分：', state.score);
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('whackAMole');
        }
    }
    
    // 绑定事件
    function bindEvents() {
        if (elements.startBtn) {
            elements.startBtn.addEventListener('click', startGame);
        }
    }
    
    // 模块初始化
    function init() {
        getElements();
        
        if (!elements.grid) {
            console.warn('打地鼠模块：未找到游戏网格，跳过初始化');
            return;
        }
        
        createGrid();
        bindEvents();
        
        console.log('🐹 打地鼠游戏模块已加载！');
    }
    
    // 注册到模块系统
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('whackAMole', init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
