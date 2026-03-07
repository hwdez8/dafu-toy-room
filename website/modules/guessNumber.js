/**
 * 猜数字游戏模块
 * 积木式架构 - 可独立删除或替换
 */

(function() {
    'use strict';
    
    // 模块配置
    const CONFIG = {
        minNumber: 1,
        maxNumber: 100,
        maxAttempts: 10
    };
    
    // 游戏状态
    const state = {
        targetNumber: null,
        attempts: 0,
        history: [],
        isGameOver: false
    };
    
    // DOM元素
    let elements = {};
    
    // 初始化游戏
    function initGame() {
        state.targetNumber = Math.floor(Math.random() * 
            (CONFIG.maxNumber - CONFIG.minNumber + 1)) + CONFIG.minNumber;
        state.attempts = 0;
        state.history = [];
        state.isGameOver = false;
        
        console.log('🎲 猜数字游戏已初始化！目标数字：', state.targetNumber);
    }
    
    // 获取DOM元素
    function getElements() {
        elements = {
            input: document.getElementById('guessInput'),
            guessBtn: document.getElementById('guessBtn'),
            result: document.getElementById('guessResult'),
            history: document.getElementById('guessHistory'),
            restartBtn: document.getElementById('restartGuess')
        };
    }
    
    // 处理猜测
    function handleGuess() {
        if (state.isGameOver) return;
        
        const guess = parseInt(elements.input.value);
        
        // 验证输入
        if (isNaN(guess) || guess < CONFIG.minNumber || guess > CONFIG.maxNumber) {
            showResult(`请输入 ${CONFIG.minNumber}-${CONFIG.maxNumber} 之间的数字！😅`, 'error');
            DafuToyRoom.Utils.animate(elements.input, 'shake');
            return;
        }
        
        state.attempts++;
        state.history.push(guess);
        
        // 更新历史记录显示
        updateHistory();
        
        // 判断结果
        if (guess === state.targetNumber) {
            handleWin();
            recordStats();
        } else if (state.attempts >= CONFIG.maxAttempts) {
            handleLoss();
            recordStats();
        } else {
            handleHint(guess);
        }
        
        // 清空输入框
        elements.input.value = '';
        elements.input.focus();
    }
    
    // 显示提示
    function handleHint(guess) {
        const diff = Math.abs(guess - state.targetNumber);
        let hint = '';
        let emoji = '';
        
        if (guess < state.targetNumber) {
            hint = '太小了';
            emoji = '📈';
        } else {
            hint = '太大了';
            emoji = '📉';
        }
        
        // 根据差距大小给出额外提示
        let tempHint = '';
        if (diff <= 5) {
            tempHint = '很接近了！🔥';
        } else if (diff <= 15) {
            tempHint = '有点接近了~ 🌡️';
        } else {
            tempHint = '还差得远呢 😅';
        }
        
        const remaining = CONFIG.maxAttempts - state.attempts;
        showResult(
            `${emoji} ${hint}！${tempHint}<br>还有 ${remaining} 次机会`,
            'hint'
        );
    }
    
    // 处理胜利
    function handleWin() {
        state.isGameOver = true;
        
        const messages = [
            `🎉 恭喜你猜中了！就是 ${state.targetNumber}！`,
            `🌟 太棒了！你用了 ${state.attempts} 次就猜中了！`,
            `🏆 厉害！答案就是 ${state.targetNumber}！`
        ];
        
        const message = DafuToyRoom.Utils.randomChoice(messages);
        showResult(message, 'success');
        
        // 添加庆祝动画
        celebrate();
        
        showRestartButton();
        
        // 记录统计
        recordStats();
    }
    
    // 处理失败
    function handleLoss() {
        state.isGameOver = true;
        
        showResult(
            `😿 游戏结束！正确答案是 ${state.targetNumber}<br>下次再接再厉！`,
            'error'
        );
        
        showRestartButton();
        
        // 记录统计
        recordStats();
    }
    
    // 显示结果
    function showResult(message, type) {
        DafuToyRoom.Utils.showResult(elements.result, message, type);
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('guessNumber');
        }
    }
    
    // 更新历史记录
    function updateHistory() {
        if (state.history.length === 0) {
            elements.history.innerHTML = '';
            return;
        }
        
        const historyText = state.history.map((num, index) => {
            const indicator = num < state.targetNumber ? '↑' : 
                             num > state.targetNumber ? '↓' : '✓';
            return `<span class="history-item">第${index + 1}次: ${num} ${indicator}</span>`;
        }).join(' | ');
        
        elements.history.innerHTML = `📋 猜测记录：${historyText}`;
    }
    
    // 显示重新开始按钮
    function showRestartButton() {
        elements.guessBtn.style.display = 'none';
        elements.input.style.display = 'none';
        elements.restartBtn.style.display = 'inline-flex';
    }
    
    // 重新开始游戏
    function restartGame() {
        initGame();
        
        elements.guessBtn.style.display = 'inline-flex';
        elements.input.style.display = 'block';
        elements.restartBtn.style.display = 'none';
        elements.result.innerHTML = '';
        elements.result.className = 'result-area';
        elements.history.innerHTML = '';
        elements.input.value = '';
        elements.input.focus();
    }
    
    // 庆祝动画
    function celebrate() {
        const emojis = ['🎉', '🎊', '✨', '🌟', '🎈', '🎁'];
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}%;
                    top: 50%;
                    font-size: 2rem;
                    pointer-events: none;
                    z-index: 9999;
                    animation: celebrate-fall 1s ease-out forwards;
                `;
                document.body.appendChild(emoji);
                
                setTimeout(() => emoji.remove(), 1000);
            }, i * 100);
        }
        
        // 添加CSS动画
        if (!document.getElementById('celebrate-style')) {
            const style = document.createElement('style');
            style.id = 'celebrate-style';
            style.textContent = `
                @keyframes celebrate-fall {
                    0% { transform: translateY(0) scale(0); opacity: 1; }
                    50% { transform: translateY(-50px) scale(1.5); opacity: 1; }
                    100% { transform: translateY(100px) scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 绑定事件
    function bindEvents() {
        elements.guessBtn.addEventListener('click', handleGuess);
        
        elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleGuess();
            }
        });
        
        elements.restartBtn.addEventListener('click', restartGame);
    }
    
    // 模块初始化函数
    function init() {
        getElements();
        
        // 检查必要元素是否存在
        if (!elements.input || !elements.guessBtn) {
            console.warn('猜数字游戏模块：未找到必要DOM元素，跳过初始化');
            return;
        }
        
        initGame();
        bindEvents();
        
        console.log('🎲 猜数字游戏模块已加载！');
    }
    
    // 注册到模块系统
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('guessNumber', init);
    } else {
        // 如果主模块未加载，等待DOMContentLoaded
        document.addEventListener('DOMContentLoaded', init);
    }
})();
