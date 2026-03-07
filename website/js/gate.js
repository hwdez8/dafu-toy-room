/**
 * 大门界面控制模块 🏰
 * 积木式架构 - 负责大门与主应用的切换
 */

(function() {
    'use strict';
    
    // DOM元素
    let elements = {};
    
    // 装饰元素配置
    const DECORATION_ITEMS = ['🎀', '💖'];
    const DECORATION_COUNT = 12;
    
    // 初始化
    function init() {
        getElements();
        bindEvents();
        updateVisitorCount();
        initBackgroundDecoration();
        
        console.log('🏰 大门模块已加载！');
    }
    
    // 初始化背景装饰
    function initBackgroundDecoration() {
        const container = document.getElementById('gateBgDecoration');
        if (!container) return;
        
        // 创建初始装饰元素
        for (let i = 0; i < DECORATION_COUNT; i++) {
            setTimeout(() => {
                createFloatItem(container);
            }, i * 800);
        }
        
        // 持续生成新的装饰元素
        setInterval(() => {
            createFloatItem(container);
        }, 2000);
    }
    
    // 创建飘动的装饰元素
    function createFloatItem(container) {
        const item = document.createElement('div');
        item.className = 'gate-float-item';
        item.textContent = DECORATION_ITEMS[Math.floor(Math.random() * DECORATION_ITEMS.length)];
        
        // 随机位置
        const left = Math.random() * 100;
        const duration = 8 + Math.random() * 6; // 8-14秒
        const delay = Math.random() * 2;
        const size = 1.2 + Math.random() * 0.8; // 1.2-2rem
        
        item.style.left = `${left}%`;
        item.style.animationDuration = `${duration}s`;
        item.style.animationDelay = `${delay}s`;
        item.style.fontSize = `${size}rem`;
        
        container.appendChild(item);
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (item.parentNode) {
                item.parentNode.removeChild(item);
            }
        }, (duration + delay) * 1000);
    }
    
    // 获取DOM元素
    function getElements() {
        elements = {
            gatePage: document.getElementById('gatePage'),
            mainApp: document.getElementById('mainApp'),
            gateCards: document.querySelectorAll('.gate-card'),
            backToGate: document.getElementById('backToGate'),
            gateVisitorCount: document.getElementById('gateVisitorCount'),
            tabButtons: document.querySelectorAll('.tab-btn')
        };
    }
    
    // 绑定事件
    function bindEvents() {
        // 游戏卡片点击事件
        elements.gateCards.forEach(card => {
            card.addEventListener('click', () => {
                const game = card.dataset.game;
                enterGame(game);
            });
        });
        
        // 返回大门按钮
        elements.backToGate.addEventListener('click', backToGate);
        
        // 监听统计模块加载完成事件，更新访客数
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(updateVisitorCount, 500);
        });
    }
    
    // 进入游戏
    function enterGame(gameName) {
        // 如果是今天吃什么，先播放仙子伊布动画
        if (gameName === 'whatToEat') {
            const card = document.querySelector('.gate-card[data-game="whatToEat"]');
            if (card) {
                card.classList.add('jumping');
                // 等待动画完成后再进入（0.5秒）
                setTimeout(() => {
                    card.classList.remove('jumping');
                    doEnterGame(gameName);
                }, 500);
                return;
            }
        }
        
        // 其他游戏直接进入
        doEnterGame(gameName);
    }
    
    // 实际进入游戏的逻辑
    function doEnterGame(gameName) {
        // 隐藏大门
        elements.gatePage.classList.add('hidden');
        
        // 显示主应用
        elements.mainApp.classList.remove('hidden');
        
        // 切换到对应选项卡
        switchToTab(gameName);
        
        // 记录模块使用（如果统计模块已加载）
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage(gameName);
        }
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`🏰 进入游戏: ${gameName}`);
    }
    
    // 返回大门
    function backToGate() {
        // 显示大门
        elements.gatePage.classList.remove('hidden');
        
        // 隐藏主应用
        elements.mainApp.classList.add('hidden');
        
        // 更新访客数
        updateVisitorCount();
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('🏰 返回大门');
    }
    
    // 切换到指定选项卡
    function switchToTab(tabId) {
        // 移除所有活动状态
        elements.tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // 添加新的活动状态
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const targetPanel = document.getElementById(`${tabId}Panel`);
        
        if (targetPanel) {
            // 激活面板
            targetPanel.classList.add('active');
            
            // 如果有对应的按钮，也激活它
            if (targetBtn) {
                targetBtn.classList.add('active');
            }
        }
    }
    
    // 更新访客数显示
    function updateVisitorCount() {
        if (!elements.gateVisitorCount) return;
        
        // 从统计模块获取数据
        if (window.Statistics && window.Statistics.getTodayStats) {
            const stats = window.Statistics.getTodayStats();
            elements.gateVisitorCount.textContent = stats.uniqueVisitors || 0;
        } else {
            // 如果统计模块未加载，尝试从localStorage读取
            try {
                const savedToday = localStorage.getItem('dafu_stats_today');
                if (savedToday) {
                    const stats = JSON.parse(savedToday);
                    elements.gateVisitorCount.textContent = stats.uniqueVisitors || 0;
                }
            } catch (e) {
                elements.gateVisitorCount.textContent = '0';
            }
        }
    }
    
    // 导出API
    window.GateController = {
        enterGame,
        backToGate,
        updateVisitorCount
    };
    
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
