/**
 * 大福的玩具房 - 主入口文件
 * 积木式架构 - 负责初始化和协调各模块
 */

// 全局配置
const CONFIG = {
    heartsCount: 15,
    heartEmojis: ['💕', '💖', '💗', '💓', '💝', '❤️', '🧡', '💛', '💚', '💙', '💜'],
    animationDuration: {
        min: 8,
        max: 15
    }
};

// 爱心背景管理器
const HeartsManager = {
    container: null,
    
    init() {
        this.container = document.getElementById('heartsContainer');
        if (!this.container) return;
        
        this.createHearts();
        // 定期补充爱心
        setInterval(() => this.addHeart(), 2000);
    },
    
    createHearts() {
        for (let i = 0; i < CONFIG.heartsCount; i++) {
            setTimeout(() => this.addHeart(), i * 300);
        }
    },
    
    addHeart() {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = this.getRandomHeart();
        
        const left = Math.random() * 100;
        const duration = CONFIG.animationDuration.min + 
            Math.random() * (CONFIG.animationDuration.max - CONFIG.animationDuration.min);
        const delay = Math.random() * 5;
        const size = 15 + Math.random() * 20;
        
        heart.style.left = `${left}%`;
        heart.style.animationDuration = `${duration}s`;
        heart.style.animationDelay = `${delay}s`;
        heart.style.fontSize = `${size}px`;
        
        this.container.appendChild(heart);
        
        // 动画结束后移除
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, (duration + delay) * 1000);
    },
    
    getRandomHeart() {
        return CONFIG.heartEmojis[Math.floor(Math.random() * CONFIG.heartEmojis.length)];
    }
};

// 工具函数
const Utils = {
    // 随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 随机数组元素
    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 添加动画类
    animate(element, animationClass, duration = 500) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    },
    
    // 显示结果
    showResult(element, message, type = 'normal') {
        element.innerHTML = message;
        element.className = 'result-area';
        if (type === 'success') element.classList.add('result-success');
        if (type === 'error') element.classList.add('result-error');
        if (type === 'hint') element.classList.add('result-hint');
        Utils.animate(element, 'pulse', 500);
    }
};

// 模块注册器 - 积木式架构核心
const ModuleRegistry = {
    modules: new Map(),
    
    register(name, initFn) {
        this.modules.set(name, initFn);
    },
    
    unregister(name) {
        this.modules.delete(name);
    },
    
    initAll() {
        this.modules.forEach((initFn, name) => {
            try {
                initFn();
            } catch (error) {
                console.error(`模块 ${name} 初始化失败:`, error);
            }
        });
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化爱心背景
    HeartsManager.init();
    
    // 初始化所有注册的模块
    ModuleRegistry.initAll();
    
    console.log('🎉 欢迎来到大福的玩具房！所有模块已加载完成~');
});

// 导出全局对象供模块使用
window.DafuToyRoom = {
    Utils,
    ModuleRegistry,
    CONFIG
};
