/**
 * Konami代码彩蛋模块 🎮
 * 积木式架构 - 可独立删除或替换
 * 功能：电脑Konami代码/手机点击🎉5次触发烟花特效
 */

(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
        mobileClicks: 5,
        clickTimeout: 2000 // 2秒内完成点击
    };
    
    // 状态
    let keyIndex = 0;
    let clickCount = 0;
    let lastClickTime = 0;
    let isTriggered = false;
    
    // 创建手机端彩蛋按钮
    function createMobileEasterEgg() {
        const btn = document.createElement('div');
        btn.className = 'easter-egg-mobile';
        btn.innerHTML = '🎉';
        btn.title = '点我5次有惊喜~';
        
        // 插入到大门的猫咪下方
        const gateFooter = document.querySelector('.gate-footer');
        if (gateFooter) {
            gateFooter.insertBefore(btn, gateFooter.firstChild);
            addMobileStyles();
            bindMobileEvents(btn);
        }
    }
    
    // 添加手机端样式
    function addMobileStyles() {
        const styles = `
            .easter-egg-mobile {
                font-size: 2rem;
                cursor: pointer;
                display: inline-block;
                margin: 10px;
                animation: easter-egg-bounce 2s infinite;
                transition: transform 0.3s;
            }
            
            .easter-egg-mobile:hover {
                transform: scale(1.2);
            }
            
            @keyframes easter-egg-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .easter-egg-mobile.clicked {
                animation: easter-egg-spin 0.5s ease-out;
            }
            
            @keyframes easter-egg-spin {
                0% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(180deg) scale(1.3); }
                100% { transform: rotate(360deg) scale(1); }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // 绑定手机端事件
    function bindMobileEvents(btn) {
        btn.addEventListener('click', () => {
            const now = Date.now();
            
            // 重置计数（超过2秒）
            if (now - lastClickTime > CONFIG.clickTimeout) {
                clickCount = 0;
            }
            
            clickCount++;
            lastClickTime = now;
            
            // 点击动画
            btn.classList.add('clicked');
            setTimeout(() => btn.classList.remove('clicked'), 500);
            
            // 显示进度
            if (clickCount < CONFIG.mobileClicks) {
                showToast(`再点 ${CONFIG.mobileClicks - clickCount} 次！`);
            } else if (clickCount === CONFIG.mobileClicks && !isTriggered) {
                triggerEasterEgg('mobile');
            }
        });
    }
    
    // 绑定电脑端Konami代码
    function bindKonamiCode() {
        document.addEventListener('keydown', (e) => {
            if (isTriggered) return;
            
            // 检查按键
            if (e.key === CONFIG.konamiCode[keyIndex]) {
                keyIndex++;
                
                // 完成代码
                if (keyIndex === CONFIG.konamiCode.length) {
                    triggerEasterEgg('konami');
                    keyIndex = 0;
                }
            } else {
                // 重置
                keyIndex = 0;
            }
        });
    }
    
    // 触发彩蛋
    function triggerEasterEgg(source) {
        isTriggered = true;
        
        // 显示提示
        const msg = source === 'konami' ? '🎮 Konami代码激活！' : '🎉 彩蛋触发！';
        showToast(msg + ' 烟花表演开始！');
        
        // 启动烟花
        startFireworks();
        
        console.log('🎮 彩蛋已触发！来源:', source);
    }
    
    // 烟花特效
    function startFireworks() {
        const duration = 5000; // 5秒烟花
        const endTime = Date.now() + duration;
        
        const interval = setInterval(() => {
            if (Date.now() > endTime) {
                clearInterval(interval);
                isTriggered = false;
                return;
            }
            createFirework();
        }, 300);
        
        // 立即发射几个
        for (let i = 0; i < 3; i++) {
            setTimeout(createFirework, i * 100);
        }
    }
    
    // 创建单个烟花
    function createFirework() {
        const colors = ['#ff6b9d', '#ffc2d1', '#a8e6cf', '#ffd93d', '#ff8fab', '#7dd3c0', '#ff6b6b', '#4ecdc4'];
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 创建爆炸点
        const burst = document.createElement('div');
        burst.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 10px;
            height: 10px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
        `;
        document.body.appendChild(burst);
        
        // 创建粒子
        const particleCount = 12 + Math.floor(Math.random() * 8);
        for (let i = 0; i < particleCount; i++) {
            createParticle(x, y, color);
        }
        
        // 移除爆炸点
        setTimeout(() => burst.remove(), 100);
    }
    
    // 创建烟花粒子
    function createParticle(x, y, color) {
        const particle = document.createElement('div');
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 6px;
            height: 6px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
            box-shadow: 0 0 6px ${color};
        `;
        
        document.body.appendChild(particle);
        
        // 动画
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800 + Math.random() * 400,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => particle.remove();
    }
    
    // Toast提示
    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1rem;
            z-index: 100000;
            animation: toast-fade 2s ease-out forwards;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    }
    
    // 添加Toast动画
    const toastStyle = document.createElement('style');
    toastStyle.textContent = `
        @keyframes toast-fade {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
    `;
    document.head.appendChild(toastStyle);
    
    // 初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createMobileEasterEgg();
                bindKonamiCode();
            });
        } else {
            createMobileEasterEgg();
            bindKonamiCode();
        }
        
        console.log('🎮 Konami彩蛋模块已加载！');
        console.log('💡 电脑：输入 ↑↑↓↓←→←→BA');
        console.log('💡 手机：点击大门上的 🎉 5次');
    }
    
    // 注册模块
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('easterEggKonami', init);
    } else {
        init();
    }
})();
