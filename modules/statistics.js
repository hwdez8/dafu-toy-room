/**
 * 数据统计模块 📊
 * 积木式架构 - 可独立删除或替换
 * 记录访客人数和功能使用次数（使用服务器端统计）
 */

(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        apiEndpoint: '/api/stats',
        moduleApiEndpoint: '/api/stats/module',
        maxTotal: 999
    };
    
    // 统计数据
    let stats = {
        today: {
            uniqueVisitors: 0,
            totalVisits: 0,
            moduleUsage: {
                guessNumber: 0,
                whatToEat: 0,
                fortune: 0,
                blessing: 0,
                aiChat: 0
            }
        },
        total: {
            uniqueVisitors: 0,
            totalVisits: 0,
            moduleUsage: {
                guessNumber: 0,
                whatToEat: 0,
                fortune: 0,
                blessing: 0,
                aiChat: 0
            },
            lastUpdated: null
        }
    };
    
    // DOM元素缓存
    let elements = {};
    let isInitialized = false;
    
    // 初始化
    async function init() {
        console.log('📊 统计模块初始化开始...');
        
        // 记录本次访问
        try {
            console.log('📊 正在记录访问...');
            await recordVisit();
            console.log('📊 访问记录完成');
        } catch (error) {
            console.error('📊 记录访问失败:', error);
        }
        
        // 绑定标签页切换事件
        bindEvents();
        
        // 如果统计面板当前是激活的，立即加载数据
        const statsPanel = document.getElementById('statisticsPanel');
        if (statsPanel && statsPanel.classList.contains('active')) {
            console.log('📊 统计面板当前激活，立即加载数据');
            await loadAndDisplay();
        }
        
        isInitialized = true;
        console.log('📊 数据统计模块初始化完成！');
    }
    
    // 获取DOM元素
    function getElements() {
        elements = {
            todayVisitors: document.getElementById('todayVisitors'),
            todayVisits: document.getElementById('todayVisits'),
            totalVisitors: document.getElementById('totalVisitors'),
            totalVisits: document.getElementById('totalVisits'),
            lastUpdated: document.getElementById('lastUpdated'),
            moduleStats: {
                guessNumber: document.getElementById('statGuessNumber'),
                whatToEat: document.getElementById('statWhatToEat'),
                fortune: document.getElementById('statFortune'),
                blessing: document.getElementById('statBlessing'),
                aiChat: document.getElementById('statAiChat')
            }
        };
        console.log('📊 获取DOM元素:', elements);
    }
    
    // 从服务器加载统计数据并显示
    async function loadAndDisplay() {
        console.log('📊 开始加载并显示数据...');
        await loadStats();
        getElements();
        updateDisplay();
    }
    
    // 从服务器加载统计数据
    async function loadStats() {
        try {
            console.log('📊 请求URL:', CONFIG.apiEndpoint);
            const response = await fetch(CONFIG.apiEndpoint);
            console.log('📊 响应状态:', response.status);
            if (response.ok) {
                const data = await response.json();
                stats = data;
                console.log('📊 统计数据已更新:', stats);
            } else {
                console.error('📊 加载统计数据失败，状态码:', response.status);
            }
        } catch (error) {
            console.error('📊 加载统计数据失败:', error);
        }
    }
    
    // 记录访问
    async function recordVisit() {
        try {
            console.log('📊 发送POST请求到:', CONFIG.apiEndpoint);
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('📊 记录访问响应:', response.status);
        } catch (error) {
            console.error('📊 记录访问失败:', error);
        }
    }
    
    // 记录模块使用
    async function recordModuleUsage(moduleName) {
        try {
            console.log('📊 记录模块使用:', moduleName);
            await fetch(CONFIG.moduleApiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module: moduleName })
            });
            
            // 重新加载统计数据
            await loadStats();
            
            // 如果统计面板打开，更新显示
            const statsPanel = document.getElementById('statisticsPanel');
            if (statsPanel && statsPanel.classList.contains('active')) {
                getElements();
                updateDisplay();
            }
        } catch (error) {
            console.error('📊 记录模块使用失败:', error);
        }
    }
    
    // 绑定事件
    function bindEvents() {
        console.log('📊 绑定标签页切换事件...');
        
        // 监听标签页切换
        document.addEventListener('tabChanged', async (e) => {
            console.log('📊 标签页切换到:', e.detail.tabId);
            if (e.detail.tabId === 'statistics') {
                console.log('📊 切换到统计面板，加载数据...');
                await loadAndDisplay();
            }
        });
        
        // 监听大门访客数更新
        document.addEventListener('DOMContentLoaded', () => {
            updateGateVisitorCount();
        });
    }
    
    // 更新大门访客数显示
    async function updateGateVisitorCount() {
        const gateVisitorCount = document.getElementById('gateVisitorCount');
        if (!gateVisitorCount) return;
        
        try {
            await loadStats();
            gateVisitorCount.textContent = stats.today.uniqueVisitors;
            console.log('📊 大门访客数已更新:', stats.today.uniqueVisitors);
        } catch (error) {
            console.error('📊 更新大门访客数失败:', error);
        }
    }
    
    // 更新显示
    function updateDisplay() {
        console.log('📊 更新显示，当前数据:', stats);
        console.log('📊 DOM元素:', elements);
        
        if (!elements.todayVisitors) {
            console.warn('📊 今日访客元素未找到');
            return;
        }
        
        // 今日数据
        elements.todayVisitors.textContent = stats.today.uniqueVisitors;
        elements.todayVisits.textContent = stats.today.totalVisits;
        console.log('📊 今日数据已更新:', stats.today.uniqueVisitors, stats.today.totalVisits);
        
        // 总数据
        elements.totalVisitors.textContent = Math.min(stats.total.uniqueVisitors, CONFIG.maxTotal);
        elements.totalVisits.textContent = Math.min(stats.total.totalVisits, CONFIG.maxTotal);
        
        // 模块使用统计
        Object.keys(elements.moduleStats).forEach(moduleName => {
            const el = elements.moduleStats[moduleName];
            if (el) {
                const today = stats.today.moduleUsage[moduleName] || 0;
                const total = stats.total.moduleUsage[moduleName] || 0;
                el.innerHTML = `<span class="stat-today">${today}</span> / <span class="stat-total">${total}</span>`;
            }
        });
        
        // 最后更新时间
        if (elements.lastUpdated) {
            if (stats.total.lastUpdated) {
                const date = new Date(stats.total.lastUpdated);
                elements.lastUpdated.textContent = formatDateTime(date);
            } else {
                elements.lastUpdated.textContent = '暂无更新记录';
            }
        }
        
        console.log('📊 显示更新完成');
    }
    
    // 格式化日期时间
    function formatDateTime(date) {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
    
    // 导出API供其他模块使用
    window.Statistics = {
        recordModuleUsage,
        getTodayStats: () => ({ ...stats.today }),
        getTotalStats: () => ({ ...stats.total })
    };
    
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
