/**
 * 鼠标特效模块 ✨
 * 积木式架构 - 可独立删除或替换
 * 功能：鼠标移动时有爱心/星星跟随，点击有爆炸效果
 */

(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        trailEnabled: true,      // 是否启用轨迹
        clickEffect: true,       // 是否启用点击效果
        trailInterval: 50,       // 轨迹生成间隔(ms)
        maxTrails: 20,           // 最大轨迹数量
        colors: ['#ff6b9d', '#ffc2d1', '#ffd93d', '#a8e6cf', '#c7ceea'],
        emojis: ['💖', '✨', '🎀', '💕', '⭐', '🌸', '💫', '🍬']
    };
    
    // 状态
    let state = {
        lastTrailTime: 0,
        trailCount: 0,
        isTouchDevice: false
    };
    
    // 检测是否为触摸设备
    function detectTouchDevice() {
        state.isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        return state.isTouchDevice;
    }
    
    // 创建轨迹效果
    function createTrail(x, y) {
        if (state.trailCount >= CONFIG.maxTrails) return;
        
        const now = Date.now();
        if (now - state.lastTrailTime < CONFIG.trailInterval) return;
        state.lastTrailTime = now;
        
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.textContent = DafuToyRoom.Utils.randomChoice(CONFIG.emojis);
        trail.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: ${1 + Math.random()}rem;
            pointer-events: none;
            z-index: 9998;
            animation: trail-fade 1s ease-out forwards;
            transform: translate(-50%, -50%);
        `;
        
        document.body.appendChild(trail);
        state.trailCount++;
        
        setTimeout(() => {
            trail.remove();
            state.trailCount--;
        }, 1000);
    }
    
    // 创建点击爆炸效果
    function createClickExplosion(x, y) {
        const particleCount = 8 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'click-particle';
            particle.textContent = DafuToyRoom.Utils.randomChoice(CONFIG.emojis);
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: ${0.8 + Math.random() * 0.8}rem;
                pointer-events: none;
                z-index: 9999;
                animation: particle-explode 0.8s ease-out forwards;
                --tx: ${tx}px;
                --ty: ${ty}px;
                transform: translate(-50%, -50%);
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 800);
        }
    }
    
    // 添加样式
    function addStyles() {
        const styles = `
            .cursor-trail {
                opacity: 0.8;
            }
            
            @keyframes trail-fade {
                0% {
                    opacity: 0.8;
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5) translateY(-30px);
                }
            }
            
            .click-particle {
                opacity: 1;
            }
            
            @keyframes particle-explode {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.3);
                }
            }
            
            /* 移动端禁用鼠标特效 */
            @media (pointer: coarse) {
                .cursor-trail, .click-particle {
                    display: none !important;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // 绑定事件
    function bindEvents() {
        // 鼠标移动轨迹
        if (CONFIG.trailEnabled && !state.isTouchDevice) {
            document.addEventListener('mousemove', (e) => {
                createTrail(e.clientX, e.clientY);
            });
        }
        
        // 点击爆炸效果
        if (CONFIG.clickEffect) {
            document.addEventListener('click', (e) => {
                // 排除按钮和链接点击
                if (e.target.tagName === 'BUTTON' || 
                    e.target.tagName === 'A' ||
                    e.target.closest('button') ||
                    e.target.closest('a')) {
                    return;
                }
                createClickExplosion(e.clientX, e.clientY);
            });
        }
    }
    
    // 初始化
    function init() {
        detectTouchDevice();
        
        // 触摸设备不启用
        if (state.isTouchDevice) {
            console.log('📱 触摸设备 detected，鼠标特效已禁用');
            return;
        }
        
        addStyles();
        bindEvents();
        
        console.log('✨ 鼠标特效模块已加载！');
    }
    
    // 注册模块
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('cursorEffects', init);
    } else {
        init();
    }
})();
