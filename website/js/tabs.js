/**
 * 选项卡切换模块
 * 积木式架构 - 负责选项卡的切换逻辑
 */

(function() {
    'use strict';
    
    // DOM元素
    let tabButtons = null;
    let tabPanels = null;
    
    // 初始化
    function init() {
        tabButtons = document.querySelectorAll('.tab-btn');
        tabPanels = document.querySelectorAll('.tab-panel');
        
        if (tabButtons.length === 0 || tabPanels.length === 0) {
            console.warn('选项卡模块：未找到选项卡元素');
            return;
        }
        
        bindEvents();
        console.log('📑 选项卡模块已加载！');
    }
    
    // 绑定事件
    function bindEvents() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                switchTab(tabId);
            });
        });
    }
    
    // 切换选项卡
    function switchTab(tabId) {
        // 移除所有活动状态
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        tabPanels.forEach(panel => {
            panel.classList.remove('active');
        });
        
        // 添加新的活动状态
        const activeButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const activePanel = document.getElementById(`${tabId}Panel`);
        
        if (activePanel) {
            // 如果有对应的按钮，激活它
            if (activeButton) {
                activeButton.classList.add('active');
            }
            
            // 激活面板
            activePanel.classList.add('active');
            
            // 触发自定义事件，通知模块面板已切换
            const event = new CustomEvent('tabChanged', { 
                detail: { tabId: tabId } 
            });
            document.dispatchEvent(event);
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // 获取当前活动选项卡
    function getActiveTab() {
        const activeButton = document.querySelector('.tab-btn.active');
        return activeButton ? activeButton.dataset.tab : null;
    }
    
    // 导出API
    window.TabManager = {
        switchTab,
        getActiveTab
    };
    
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
