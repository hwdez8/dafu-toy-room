/**
 * 幸运转盘模块 🎡
 * 积木式架构 - 可独立删除或替换
 */

(function() {
    'use strict';
    
    // 默认选项
    const DEFAULT_OPTIONS = [
        { text: '大吉', color: '#FF6B6B', emoji: '🌟' },
        { text: '中吉', color: '#4ECDC4', emoji: '✨' },
        { text: '小吉', color: '#45B7D1', emoji: '💫' },
        { text: '吉', color: '#96CEB4', emoji: '🍀' },
        { text: '平', color: '#FFEAA7', emoji: '🌸' },
        { text: '凶', color: '#DDA0DD', emoji: '🌧️' }
    ];
    
    // 预设模板
    const TEMPLATES = {
        eat: [
            { text: '火锅', color: '#FF6B6B', emoji: '🍲' },
            { text: '烧烤', color: '#FF8C42', emoji: '🍖' },
            { text: '寿司', color: '#4ECDC4', emoji: '🍣' },
            { text: '披萨', color: '#FFD93D', emoji: '🍕' },
            { text: '拉面', color: '#F7DC6F', emoji: '🍜' },
            { text: '沙拉', color: '#96CEB4', emoji: '🥗' }
        ],
        yesno: [
            { text: '是', color: '#2ECC71', emoji: '✅' },
            { text: '否', color: '#E74C3C', emoji: '❌' },
            { text: '再想想', color: '#F39C12', emoji: '🤔' },
            { text: '随缘', color: '#9B59B6', emoji: '🎲' }
        ],
        activity: [
            { text: '看电影', color: '#E74C3C', emoji: '🎬' },
            { text: '打游戏', color: '#3498DB', emoji: '🎮' },
            { text: '听音乐', color: '#9B59B6', emoji: '🎵' },
            { text: '读书', color: '#1ABC9C', emoji: '📚' },
            { text: '运动', color: '#F39C12', emoji: '⚽' },
            { text: '睡觉', color: '#34495E', emoji: '😴' }
        ]
    };
    
    let state = {
        options: [...DEFAULT_OPTIONS],
        isSpinning: false,
        rotation: 0
    };
    
    let elements = {};
    
    function getElements() {
        elements = {
            wheel: document.getElementById('luckyWheel'),
            pointer: document.getElementById('wheelPointer'),
            spinBtn: document.getElementById('spinWheelBtn'),
            result: document.getElementById('wheelResult'),
            templateBtns: document.querySelectorAll('.wheel-template-btn'),
            customInput: document.getElementById('wheelCustomInput')
        };
    }
    
    // 绘制转盘
    function drawWheel() {
        if (!elements.wheel) return;
        
        const canvas = elements.wheel;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const anglePerOption = (2 * Math.PI) / state.options.length;
        
        state.options.forEach((option, index) => {
            const startAngle = index * anglePerOption;
            const endAngle = (index + 1) * anglePerOption;
            
            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = option.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制文字
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerOption / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px "Segoe UI", sans-serif';
            ctx.fillText(option.emoji + ' ' + option.text, radius - 20, 5);
            ctx.restore();
        });
        
        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#ff6b9d';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    // 转动转盘
    function spin() {
        if (state.isSpinning) return;
        
        state.isSpinning = true;
        elements.spinBtn.disabled = true;
        elements.spinBtn.innerHTML = '<i class="fas fa-spinner spin"></i> 转动中...';
        elements.result.innerHTML = '';
        
        // 随机旋转角度（至少转5圈）
        const spins = 5;
        const randomAngle = Math.random() * 360;
        const totalRotation = spins * 360 + randomAngle;
        
        // 动画
        const duration = 4000;
        const startTime = Date.now();
        const startRotation = state.rotation;
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentRotation = startRotation + totalRotation * easeOut;
            
            elements.wheel.style.transform = `rotate(${currentRotation}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                state.rotation = currentRotation;
                showResult(currentRotation);
            }
        }
        
        animate();
    }
    
    // 显示结果
    function showResult(rotation) {
        // Canvas 0度在右侧（3点钟方向）
        // 指针在顶部（12点钟方向，即-90度或270度）
        // 转盘顺时针旋转，需要计算指针指向的扇形
        
        const normalizedRotation = (rotation % 360 + 360) % 360;
        const anglePerOption = 360 / state.options.length;
        
        // 指针在顶部（12点钟方向，对应Canvas的270度）
        // 当转盘顺时针旋转X度时，原来在(270 - X)度位置的扇形会转到顶部
        // 所以指针指向的扇形索引 = floor((270 - 旋转角度) / 每个扇形角度)
        const pointerAngle = (270 - normalizedRotation + 360) % 360;
        const selectedIndex = Math.floor(pointerAngle / anglePerOption) % state.options.length;
        const selected = state.options[selectedIndex];
        
        elements.result.innerHTML = `
            <div class="wheel-result" style="animation: wheel-result-pop 0.5s ease-out;">
                <div style="font-size: 4rem; margin-bottom: 10px;">${selected.emoji}</div>
                <div style="font-size: 2rem; font-weight: bold; color: ${selected.color};">
                    ${selected.text}
                </div>
            </div>
        `;
        
        // 添加CSS动画
        if (!document.getElementById('wheel-animations')) {
            const style = document.createElement('style');
            style.id = 'wheel-animations';
            style.textContent = `
                @keyframes wheel-result-pop {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        state.isSpinning = false;
        elements.spinBtn.disabled = false;
        elements.spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 再转一次';
        
        // 记录统计
        recordStats();
        
        // 庆祝
        celebrate();
    }
    
    // 切换模板
    function loadTemplate(templateName) {
        if (TEMPLATES[templateName]) {
            state.options = [...TEMPLATES[templateName]];
            drawWheel();
            elements.result.innerHTML = '';
        }
    }
    
    // 自定义选项
    function setCustomOptions() {
        const input = elements.customInput.value.trim();
        if (!input) return;
        
        const items = input.split(/[，,\n]/).map(item => item.trim()).filter(item => item);
        if (items.length < 2) {
            alert('请至少输入两个选项，用逗号或换行分隔');
            return;
        }
        
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFB6C1', '#98D8C8'];
        
        state.options = items.map((text, index) => ({
            text: text,
            color: colors[index % colors.length],
            emoji: ['🎯', '🎲', '⭐', '💫', '🌟', '✨'][index % 6]
        }));
        
        drawWheel();
        elements.result.innerHTML = '';
        elements.customInput.value = '';
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('luckyWheel');
        }
    }
    
    // 庆祝动画
    function celebrate() {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = '🎉';
                emoji.style.cssText = `
                    position: fixed;
                    left: ${50 + (Math.random() - 0.5) * 30}%;
                    top: 50%;
                    font-size: 2rem;
                    pointer-events: none;
                    z-index: 9999;
                    animation: wheel-celebrate 1s ease-out forwards;
                `;
                document.body.appendChild(emoji);
                setTimeout(() => emoji.remove(), 1000);
            }, i * 50);
        }
        
        if (!document.getElementById('wheel-celebrate-style')) {
            const style = document.createElement('style');
            style.id = 'wheel-celebrate-style';
            style.textContent = `
                @keyframes wheel-celebrate {
                    0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(-100px) scale(1.2) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    function bindEvents() {
        if (elements.spinBtn) {
            elements.spinBtn.addEventListener('click', spin);
        }
        
        elements.templateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                loadTemplate(btn.dataset.template);
                // 更新按钮状态
                elements.templateBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        const customBtn = document.getElementById('setCustomWheelBtn');
        if (customBtn) {
            customBtn.addEventListener('click', setCustomOptions);
        }
    }
    
    function init() {
        getElements();
        
        if (!elements.wheel) {
            console.warn('幸运转盘模块：未找到画布元素，跳过初始化');
            return;
        }
        
        // 设置画布大小
        elements.wheel.width = 300;
        elements.wheel.height = 300;
        
        drawWheel();
        bindEvents();
        
        console.log('🎡 幸运转盘模块已加载！');
    }
    
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('luckyWheel', init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
