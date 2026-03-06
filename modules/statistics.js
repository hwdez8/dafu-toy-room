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
                aiChat: 0,
                whackAMole: 0,
                luckyWheel: 0,
                passwordGen: 0,
                moodDiary: 0
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
                aiChat: 0,
                whackAMole: 0,
                luckyWheel: 0,
                passwordGen: 0,
                moodDiary: 0
            },
            lastUpdated: null
        }
    };
    
    // 标记是否已记录访问
    let visitRecorded = false;
    
    // 初始化
    function init() {
        console.log('📊 统计模块初始化...');
        
        // 绑定标签页切换事件
        bindEvents();
        
        // 延迟记录访问（确保页面加载完成）
        setTimeout(function() {
            recordVisit();
        }, 1000);
        
        // 定期刷新数据（每10秒）
        setInterval(function() {
            loadStats(function() {
                // 如果统计面板当前显示，更新UI
                var statsPanel = document.getElementById('statisticsPanel');
                if (statsPanel && statsPanel.classList.contains('active')) {
                    updateDisplay();
                }
            });
        }, 10000);
        
        console.log('📊 统计模块初始化完成');
    }
    
    // 绑定事件
    function bindEvents() {
        console.log('📊 绑定事件...');
        
        // 监听标签页切换
        document.addEventListener('tabChanged', function(e) {
            console.log('📊 标签页切换:', e.detail.tabId);
            if (e.detail.tabId === 'statistics') {
                console.log('📊 切换到统计面板');
                loadStats(function() {
                    updateDisplay();
                });
            }
        });
    }
    
    // 加载统计数据（使用回调而不是Promise）
    function loadStats(callback) {
        console.log('📊 加载统计数据...');
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', CONFIG.apiEndpoint, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('📊 响应状态:', xhr.status);
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        stats = data;
                        console.log('📊 数据已更新:', stats);
                        if (callback) callback();
                    } catch (e) {
                        console.error('📊 解析数据失败:', e);
                    }
                } else {
                    console.error('📊 加载失败，状态码:', xhr.status);
                }
            }
        };
        xhr.onerror = function() {
            console.error('📊 请求失败');
        };
        xhr.send();
    }
    
    // 记录访问（使用XMLHttpRequest）
    function recordVisit() {
        if (visitRecorded) {
            console.log('📊 访问已记录，跳过');
            return;
        }
        
        console.log('📊 记录访问...');
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', CONFIG.apiEndpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('📊 记录访问响应:', xhr.status);
                if (xhr.status === 200) {
                    visitRecorded = true;
                    console.log('📊 访问记录成功');
                    // 记录成功后立即加载数据
                    loadStats(function() {
                        // 更新大门访客数
                        updateGateVisitorCount();
                    });
                }
            }
        };
        xhr.send(JSON.stringify({}));
    }
    
    // 记录模块使用
    function recordModuleUsage(moduleName) {
        console.log('📊 记录模块使用:', moduleName);
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', CONFIG.moduleApiEndpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log('📊 模块使用记录成功');
                // 重新加载数据
                loadStats(function() {
                    // 如果统计面板打开，更新显示
                    var statsPanel = document.getElementById('statisticsPanel');
                    if (statsPanel && statsPanel.classList.contains('active')) {
                        updateDisplay();
                    }
                });
            }
        };
        xhr.send(JSON.stringify({ module: moduleName }));
    }
    
    // 更新大门访客数
    function updateGateVisitorCount() {
        var gateVisitorCount = document.getElementById('gateVisitorCount');
        if (gateVisitorCount) {
            gateVisitorCount.textContent = stats.today.uniqueVisitors;
            console.log('📊 大门访客数更新:', stats.today.uniqueVisitors);
        }
    }
    
    // 更新显示
    function updateDisplay() {
        console.log('📊 更新显示，数据:', stats);
        
        // 获取DOM元素
        var todayVisitors = document.getElementById('todayVisitors');
        var todayVisits = document.getElementById('todayVisits');
        var totalVisitors = document.getElementById('totalVisitors');
        var totalVisits = document.getElementById('totalVisits');
        var lastUpdated = document.getElementById('lastUpdated');
        
        // 今日数据
        if (todayVisitors) {
            todayVisitors.textContent = stats.today.uniqueVisitors;
            console.log('📊 今日访客:', stats.today.uniqueVisitors);
        } else {
            console.warn('📊 今日访客元素未找到');
        }
        
        if (todayVisits) {
            todayVisits.textContent = stats.today.totalVisits;
        }
        
        // 总数据
        if (totalVisitors) {
            totalVisitors.textContent = Math.min(stats.total.uniqueVisitors, CONFIG.maxTotal);
        }
        
        if (totalVisits) {
            totalVisits.textContent = Math.min(stats.total.totalVisits, CONFIG.maxTotal);
        }
        
        // 模块使用统计
        var modules = ['guessNumber', 'whatToEat', 'fortune', 'blessing', 'aiChat', 'whackAMole', 'luckyWheel', 'passwordGen', 'moodDiary'];
        modules.forEach(function(moduleName) {
            var el = document.getElementById('stat' + moduleName.charAt(0).toUpperCase() + moduleName.slice(1));
            if (el) {
                var today = stats.today.moduleUsage[moduleName] || 0;
                var total = stats.total.moduleUsage[moduleName] || 0;
                el.innerHTML = '<span class="stat-today">' + today + '</span> / <span class="stat-total">' + total + '</span>';
            }
        });
        
        // 最后更新时间
        if (lastUpdated) {
            if (stats.total.lastUpdated) {
                var date = new Date(stats.total.lastUpdated);
                lastUpdated.textContent = formatDateTime(date);
            } else {
                lastUpdated.textContent = '暂无更新记录';
            }
        }
        
        console.log('📊 显示更新完成');
    }
    
    // 格式化日期时间
    function formatDateTime(date) {
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        return date.getFullYear() + '-' + 
               pad(date.getMonth() + 1) + '-' + 
               pad(date.getDate()) + ' ' + 
               pad(date.getHours()) + ':' + 
               pad(date.getMinutes()) + ':' + 
               pad(date.getSeconds());
    }
    
    // 导出API
    window.Statistics = {
        recordModuleUsage: recordModuleUsage,
        getTodayStats: function() { return stats.today; },
        getTotalStats: function() { return stats.total; }
    };
    
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
