/**
 * 数据统计模块 📊
 * 积木式架构 - 可独立删除或替换
 * 记录访客人数和功能使用次数
 */

(function() {
    'use strict';
    
    // 存储键名
    const STORAGE_KEYS = {
        today: 'dafu_stats_today',
        total: 'dafu_stats_total',
        visitorId: 'dafu_visitor_id',
        lastVisit: 'dafu_last_visit'
    };
    
    // 统计配置
    const CONFIG = {
        maxTotal: 999,
        modules: ['guessNumber', 'whatToEat', 'fortune', 'blessing', 'aiChat']
    };
    
    // 今日统计数据结构
    const defaultTodayStats = {
        date: new Date().toDateString(),
        uniqueVisitors: 0,
        totalVisits: 0,
        moduleUsage: {
            guessNumber: 0,
            whatToEat: 0,
            fortune: 0,
            blessing: 0,
            aiChat: 0
        }
    };
    
    // 总统计数据结构
    const defaultTotalStats = {
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
    };
    
    // 当前统计数据
    let todayStats = null;
    let totalStats = null;
    let currentVisitorId = null;
    let isNewVisitor = false;
    
    // DOM元素
    let elements = {};
    
    // 初始化
    function init() {
        loadStats();
        recordVisit();
        getElements();
        
        if (elements.panel) {
            bindEvents();
            updateDisplay();
        }
        
        // 监听标签页切换，更新显示
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && elements.panel) {
                updateDisplay();
            }
        });
        
        console.log('📊 数据统计模块已加载！');
        console.log(`今日访客: ${todayStats.uniqueVisitors}, 总访客: ${totalStats.uniqueVisitors}`);
    }
    
    // 加载统计数据
    function loadStats() {
        const savedToday = localStorage.getItem(STORAGE_KEYS.today);
        const savedTotal = localStorage.getItem(STORAGE_KEYS.total);
        const today = new Date().toDateString();
        
        // 加载今日统计
        if (savedToday) {
            todayStats = JSON.parse(savedToday);
            // 检查是否是新的一天
            if (todayStats.date !== today) {
                todayStats = { ...defaultTodayStats, date: today };
            }
        } else {
            todayStats = { ...defaultTodayStats };
        }
        
        // 加载总统计
        if (savedTotal) {
            totalStats = JSON.parse(savedTotal);
        } else {
            totalStats = { ...defaultTotalStats };
        }
        
        // 加载访客ID
        currentVisitorId = localStorage.getItem(STORAGE_KEYS.visitorId);
        if (!currentVisitorId) {
            currentVisitorId = generateVisitorId();
            localStorage.setItem(STORAGE_KEYS.visitorId, currentVisitorId);
            isNewVisitor = true;
        }
    }
    
    // 生成唯一访客ID
    function generateVisitorId() {
        return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 记录访问
    function recordVisit() {
        const lastVisit = sessionStorage.getItem(STORAGE_KEYS.lastVisit);
        const now = Date.now();
        
        // 检查是否是新会话（30分钟无操作算新会话）
        const isNewSession = !lastVisit || (now - parseInt(lastVisit)) > 30 * 60 * 1000;
        
        if (isNewSession) {
            // 今日统计
            todayStats.totalVisits++;
            if (isNewVisitor) {
                todayStats.uniqueVisitors++;
            }
            
            // 总统计（上限999）
            if (totalStats.uniqueVisitors < CONFIG.maxTotal) {
                totalStats.totalVisits++;
                if (isNewVisitor) {
                    totalStats.uniqueVisitors++;
                }
            }
            
            // 更新时间
            totalStats.lastUpdated = new Date().toISOString();
            
            // 保存
            saveStats();
            
            // 标记会话
            sessionStorage.setItem(STORAGE_KEYS.lastVisit, now.toString());
            isNewVisitor = false;
        }
    }
    
    // 记录模块使用
    function recordModuleUsage(moduleName) {
        if (!CONFIG.modules.includes(moduleName)) return;
        
        // 今日统计
        todayStats.moduleUsage[moduleName]++;
        
        // 总统计
        totalStats.moduleUsage[moduleName]++;
        
        // 更新时间
        totalStats.lastUpdated = new Date().toISOString();
        
        // 保存
        saveStats();
        
        // 如果统计面板打开，实时更新
        if (elements.panel && elements.panel.classList.contains('active')) {
            updateDisplay();
        }
        
        console.log(`📊 记录模块使用: ${moduleName}`);
    }
    
    // 保存统计数据
    function saveStats() {
        localStorage.setItem(STORAGE_KEYS.today, JSON.stringify(todayStats));
        localStorage.setItem(STORAGE_KEYS.total, JSON.stringify(totalStats));
    }
    
    // 获取DOM元素
    function getElements() {
        elements = {
            panel: document.getElementById('statsPanel'),
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
    }
    
    // 绑定事件
    function bindEvents() {
        // 监听标签页切换事件，更新显示
        document.addEventListener('tabChanged', (e) => {
            if (e.detail.tabId === 'statistics') {
                updateDisplay();
            }
        });
    }
    
    // 更新显示
    function updateDisplay() {
        if (!elements.todayVisitors) return;
        
        // 今日数据
        elements.todayVisitors.textContent = todayStats.uniqueVisitors;
        elements.todayVisits.textContent = todayStats.totalVisits;
        
        // 总数据
        elements.totalVisitors.textContent = Math.min(totalStats.uniqueVisitors, CONFIG.maxTotal);
        elements.totalVisits.textContent = Math.min(totalStats.totalVisits, CONFIG.maxTotal);
        
        // 模块使用统计
        Object.keys(elements.moduleStats).forEach(moduleName => {
            const el = elements.moduleStats[moduleName];
            if (el) {
                const today = todayStats.moduleUsage[moduleName] || 0;
                const total = totalStats.moduleUsage[moduleName] || 0;
                el.innerHTML = `<span class="stat-today">${today}</span> / <span class="stat-total">${total}</span>`;
            }
        });
        
        // 最后更新时间
        if (elements.lastUpdated && totalStats.lastUpdated) {
            const date = new Date(totalStats.lastUpdated);
            elements.lastUpdated.textContent = formatDateTime(date);
        }
    }
    
    // 格式化日期时间
    function formatDateTime(date) {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
    
    // 导出API供其他模块使用
    window.Statistics = {
        recordModuleUsage,
        getTodayStats: () => ({ ...todayStats }),
        getTotalStats: () => ({ ...totalStats })
    };
    
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 同时注册到模块系统
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('statistics', init);
    }
})();
