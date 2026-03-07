/**
 * 今日份福气模块 🎀
 * 积木式架构 - 可独立删除或替换
 * 提供带有"福"字的祝福语，支持API调用防止词穷
 */

(function() {
    'use strict';
    
    // 本地祝福语数据库（福福风格 - 伊布谐音梗）
    const BLESSING_DATABASE = [
        { text: '福福祝大家福气满满', emoji: '🎀', desc: '福福带着满满的祝福来啦' },
        { text: '多幸多福，快乐加倍', emoji: '✨', desc: '幸运和福气都给你' },
        { text: '年年有福，岁岁平安', emoji: '🧧', desc: '每年都有福气相伴' },
        { text: '福来运转，好事连连', emoji: '🍀', desc: '福气一来，运气都变好了' },
        { text: '福气满满，幸福安康', emoji: '💖', desc: '福福希望你幸福满满' },
        { text: '福福贴贴，好运附体', emoji: '🤗', desc: '和福福贴贴，好运自然来' },
        { text: '有福同享，有难同当', emoji: '🤝', desc: '福福陪你一起度过每一天' },
        { text: '伊起享福，快乐无边', emoji: '🦊', desc: '和伊布一起享受福气吧' },
        { text: '福如东海，寿比南山', emoji: '🌊', desc: '福气如海，寿命如山' },
        { text: '福星高照，万事顺遂', emoji: '⭐', desc: '福星守护着你' },
        { text: '五福临门，喜气洋洋', emoji: '🏠', desc: '五种福气齐聚你家' },
        { text: '福至心灵，心想事成', emoji: '💫', desc: '福气到了，心想事竟成' },
        { text: '福寿安康，笑口常开', emoji: '😊', desc: '健康平安，笑容常在' },
        { text: '福禄双全，财源广进', emoji: '💰', desc: '福气和财运一起来' },
        { text: '福慧双修，吉祥如意', emoji: '📿', desc: '福气和智慧同步增长' },
        { text: '福缘深厚，贵人相助', emoji: '🌟', desc: '福缘深厚，有贵人扶持' },
        { text: '福泽绵长，世代兴旺', emoji: '🌳', desc: '福泽流传，家族兴旺' },
        { text: '福运亨通，步步高升', emoji: '📈', desc: '福运顺畅，步步高升' },
        { text: '福气东来，紫气西迎', emoji: '🌅', desc: '祥瑞之气从东方而来' },
        { text: '福满乾坤，喜乐安康', emoji: '🌈', desc: '福气充满天地，喜乐平安' },
        { text: '福到运到，好事成双', emoji: '🎊', desc: '福气运气一起来' },
        { text: '福旺财旺，事事顺心', emoji: '🐱', desc: '福气和财气都旺旺' },
        { text: '福乐绵绵，甜蜜无限', emoji: '🍬', desc: '福气像糖果一样甜蜜' },
        { text: '福星福将，护你周全', emoji: '🛡️', desc: '福福是你最坚强的后盾' },
        { text: '福临心至，笑颜常开', emoji: '🌸', desc: '福气到了，笑容自然来' }
    ];
    
    // 配置
    const CONFIG = {
        // API端点（用于生成祝福语，防止词穷）
        apiEndpoint: '/api/blessing',
        // 70%概率使用本地自定义福语，30%概率使用AI生成（防止词穷）
        localProbability: 0.7,
        // API超时时间
        apiTimeout: 5000
    };
    
    // 状态
    let state = {
        isLoading: false,
        todayBlessing: null,
        blessingCount: 0
    };
    
    // DOM元素
    let elements = {};
    
    // 获取DOM元素
    function getElements() {
        elements = {
            blessingBtn: document.getElementById('blessingBtn'),
            blessingResult: document.getElementById('blessingResult'),
            blessingCounter: document.getElementById('blessingCounter')
        };
    }
    
    // 获取今日份福气
    async function getBlessing() {
        if (state.isLoading) return;
        
        state.isLoading = true;
        updateButtonState(true);
        
        // 显示加载动画
        showLoading();
        
        let blessing = null;
        
        // 70%概率使用本地自定义福语，30%概率使用AI生成
        const useLocal = Math.random() < CONFIG.localProbability;
        
        if (useLocal) {
            // 使用本地福福风格福语
            console.log('使用本地福福风格福语');
            blessing = getRandomBlessing();
        } else {
            // 尝试从API获取AI生成的福语
            console.log('尝试使用AI生成福语');
            try {
                blessing = await fetchBlessingFromAPI();
            } catch (error) {
                console.log('API获取失败，回退到本地数据库:', error.message);
                blessing = getRandomBlessing();
            }
        }
        
        // 显示结果
        setTimeout(() => {
            displayBlessing(blessing);
            state.isLoading = false;
            state.blessingCount++;
            updateButtonState(false);
            updateCounter();
            
            // 触发庆祝动画
            celebrateBlessing();
            
            // 记录统计
            recordStats();
        }, 800);
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('blessing');
        }
    }
    
    // 从API获取祝福语
    async function fetchBlessingFromAPI() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.apiTimeout);
        
        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'blessing',
                    style: 'chinese_traditional',
                    includeFu: true
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.blessing) {
                return {
                    text: data.blessing.text,
                    emoji: data.blessing.emoji || '✨',
                    desc: data.blessing.desc || '愿你福气满满'
                };
            }
            
            throw new Error('Invalid API response');
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    // 从本地数据库获取随机祝福语
    function getRandomBlessing() {
        // 如果已经有今日福气，先排除
        let available = BLESSING_DATABASE;
        if (state.todayBlessing) {
            available = BLESSING_DATABASE.filter(b => b.text !== state.todayBlessing.text);
        }
        
        return DafuToyRoom.Utils.randomChoice(available);
    }
    
    // 显示加载状态
    function showLoading() {
        elements.blessingResult.innerHTML = `
            <div class="blessing-loading">
                <div class="fu-spin">福</div>
                <p>正在祈福中...</p>
            </div>
        `;
        elements.blessingResult.style.display = 'flex';
        
        // 福字旋转动画
        if (!document.getElementById('blessing-animations')) {
            const style = document.createElement('style');
            style.id = 'blessing-animations';
            style.textContent = `
                @keyframes fu-spin {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.2); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                .fu-spin {
                    font-size: 4rem;
                    color: var(--primary-color);
                    animation: fu-spin 1s ease-in-out infinite;
                    font-weight: bold;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 显示祝福语
    function displayBlessing(blessing) {
        state.todayBlessing = blessing;
        
        elements.blessingResult.innerHTML = `
            <div class="blessing-card" id="blessingCard">
                <div class="blessing-decoration top">🎀</div>
                <div class="blessing-decoration bottom">🎀</div>
                <div class="blessing-fu" id="fuCharacter">福</div>
                <div class="blessing-emoji-large">${blessing.emoji}</div>
                <div class="blessing-text-large">${blessing.text}</div>
                <div class="blessing-desc">${blessing.desc}</div>
                <div class="blessing-date">${new Date().toLocaleDateString('zh-CN')} 专属福气</div>
            </div>
        `;
        
        // 添加卡片动画
        const card = document.getElementById('blessingCard');
        if (card) {
            card.style.animation = 'blessing-appear 0.6s ease-out';
        }
        
        // 添加动画样式
        if (!document.getElementById('blessing-card-style')) {
            const style = document.createElement('style');
            style.id = 'blessing-card-style';
            style.textContent = `
                @keyframes blessing-appear {
                    0% { 
                        opacity: 0; 
                        transform: translateY(30px) scale(0.9) rotate(-5deg); 
                    }
                    50% {
                        transform: translateY(-10px) scale(1.02) rotate(2deg);
                    }
                    100% { 
                        opacity: 1; 
                        transform: translateY(0) scale(1) rotate(0deg); 
                    }
                }
                
                @keyframes fu-glow {
                    0%, 100% { 
                        text-shadow: 0 0 20px rgba(255, 107, 157, 0.5);
                        transform: scale(1);
                    }
                    50% { 
                        text-shadow: 0 0 40px rgba(255, 107, 157, 0.8), 0 0 60px rgba(255, 217, 61, 0.5);
                        transform: scale(1.1);
                    }
                }
                
                .blessing-fu {
                    animation: fu-glow 2s ease-in-out infinite;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 更新按钮状态
    function updateButtonState(loading) {
        if (loading) {
            elements.blessingBtn.disabled = true;
            elements.blessingBtn.innerHTML = `
                <span class="btn-fu">福</span>
                <span>祈福中...</span>
                <span class="btn-emoji">🙏</span>
            `;
        } else {
            elements.blessingBtn.disabled = false;
            elements.blessingBtn.innerHTML = `
                <span class="btn-fu">福</span>
                <span>${state.blessingCount > 0 ? '再求一福' : '点击领取今日份福气'}</span>
                <span class="btn-emoji">🎀</span>
            `;
        }
    }
    
    // 更新计数器
    function updateCounter() {
        if (elements.blessingCounter) {
            elements.blessingCounter.textContent = `今日已领取 ${state.blessingCount} 份福气`;
        }
    }
    
    // 庆祝动画
    function celebrateBlessing() {
        const emojis = ['🎀', '✨', '🌸', '💕', '🎉', '🧧', '福'];
        const colors = ['#ff6b9d', '#ffd93d', '#a8e6cf', '#ffc2d1'];
        
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                particle.style.cssText = `
                    position: fixed;
                    left: ${50 + (Math.random() - 0.5) * 40}%;
                    top: 50%;
                    font-size: ${1.5 + Math.random() * 1.5}rem;
                    pointer-events: none;
                    z-index: 9999;
                    animation: blessing-celebrate 1.5s ease-out forwards;
                    color: ${colors[Math.floor(Math.random() * colors.length)]};
                `;
                document.body.appendChild(particle);
                
                setTimeout(() => particle.remove(), 1500);
            }, i * 80);
        }
        
        // 添加庆祝动画CSS
        if (!document.getElementById('blessing-celebrate-style')) {
            const style = document.createElement('style');
            style.id = 'blessing-celebrate-style';
            style.textContent = `
                @keyframes blessing-celebrate {
                    0% { 
                        transform: translateY(0) rotate(0deg) scale(0); 
                        opacity: 1;
                    }
                    20% {
                        transform: translateY(-30px) rotate(45deg) scale(1.2); 
                        opacity: 1;
                    }
                    100% { 
                        transform: translateY(-200px) rotate(360deg) scale(0.5); 
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 绑定事件
    function bindEvents() {
        elements.blessingBtn.addEventListener('click', getBlessing);
    }
    
    // 模块初始化函数
    function init() {
        getElements();
        
        // 检查必要元素是否存在
        if (!elements.blessingBtn) {
            console.warn('今日份福气模块：未找到必要DOM元素，跳过初始化');
            return;
        }
        
        bindEvents();
        updateButtonState(false);
        
        console.log('🎀 今日份福气模块已加载！');
    }
    
    // 注册到模块系统
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('blessing', init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
