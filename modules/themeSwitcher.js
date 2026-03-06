/**
 * 主题切换模块 🎨
 * 积木式架构 - 可独立删除或替换
 * 功能：白天/黑夜模式切换，粉色系/蓝色系/暗色系主题
 */

(function() {
    'use strict';
    
    // 主题配置
    const THEMES = {
        pink: {
            name: '粉色系',
            icon: '🎀',
            colors: {
                '--primary-color': '#ff6b9d',
                '--primary-light': '#ffc2d1',
                '--secondary-color': '#a8e6cf',
                '--accent-color': '#ffd93d',
                '--bg-color': '#fff5f7',
                '--card-bg': '#ffffff',
                '--text-color': '#5a4a4a',
                '--text-light': '#8a7a7a'
            }
        },
        blue: {
            name: '蓝色系',
            icon: '💙',
            colors: {
                '--primary-color': '#5c9dff',
                '--primary-light': '#b8d4ff',
                '--secondary-color': '#a8e6cf',
                '--accent-color': '#ffd93d',
                '--bg-color': '#f0f7ff',
                '--card-bg': '#ffffff',
                '--text-color': '#4a5a6a',
                '--text-light': '#7a8a9a'
            }
        },
        dark: {
            name: '暗色系',
            icon: '🌙',
            colors: {
                '--primary-color': '#ff6b9d',
                '--primary-light': '#ff8fab',
                '--secondary-color': '#7dd3c0',
                '--accent-color': '#ffd93d',
                '--bg-color': '#1a1a2e',
                '--card-bg': '#252542',
                '--text-color': '#e8e8ec',
                '--text-light': '#a0a0b0'
            }
        }
    };
    
    // 当前主题
    let currentTheme = localStorage.getItem('dafu-theme') || 'pink';
    
    // 应用主题
    function applyTheme(themeName) {
        const theme = THEMES[themeName];
        if (!theme) return;
        
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        
        currentTheme = themeName;
        localStorage.setItem('dafu-theme', themeName);
        updateSwitcherButton();
        
        console.log(`🎨 主题已切换: ${theme.name}`);
    }
    
    // 创建切换按钮
    function createThemeSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
            <button class="theme-btn" id="themeBtn" title="切换主题">
                ${THEMES[currentTheme].icon}
            </button>
            <div class="theme-panel" id="themePanel">
                ${Object.entries(THEMES).map(([key, theme]) => `
                    <div class="theme-option ${key === currentTheme ? 'active' : ''}" data-theme="${key}">
                        <span class="theme-icon">${theme.icon}</span>
                        <span class="theme-name">${theme.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(switcher);
        addSwitcherStyles();
        bindSwitcherEvents();
        applyTheme(currentTheme);
    }
    
    // 添加样式
    function addSwitcherStyles() {
        const styles = `
            .theme-switcher {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }
            
            .theme-btn {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: var(--card-bg);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                font-size: 1.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .theme-btn:hover {
                transform: scale(1.1) rotate(15deg);
                box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            }
            
            .theme-panel {
                position: absolute;
                top: 60px;
                right: 0;
                background: var(--card-bg);
                border-radius: 15px;
                padding: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                min-width: 150px;
            }
            
            .theme-panel.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .theme-option {
                display: flex;
                align-items: center;
                padding: 10px 15px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 5px;
            }
            
            .theme-option:last-child {
                margin-bottom: 0;
            }
            
            .theme-option:hover {
                background: var(--bg-color);
            }
            
            .theme-option.active {
                background: var(--primary-light);
            }
            
            .theme-icon {
                font-size: 1.2rem;
                margin-right: 10px;
            }
            
            .theme-name {
                font-size: 0.9rem;
                color: var(--text-color);
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .theme-switcher {
                    top: 10px;
                    right: 10px;
                }
                
                .theme-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 1.2rem;
                }
                
                .theme-panel {
                    top: 50px;
                    right: -10px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // 绑定事件
    function bindSwitcherEvents() {
        const btn = document.getElementById('themeBtn');
        const panel = document.getElementById('themePanel');
        
        // 点击按钮展开/收起面板
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('show');
        });
        
        // 点击选项切换主题
        panel.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                applyTheme(theme);
                panel.classList.remove('show');
                
                // 更新激活状态
                panel.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
            });
        });
        
        // 点击其他地方关闭面板
        document.addEventListener('click', () => {
            panel.classList.remove('show');
        });
    }
    
    // 更新按钮图标
    function updateSwitcherButton() {
        const btn = document.getElementById('themeBtn');
        if (btn) {
            btn.textContent = THEMES[currentTheme].icon;
        }
    }
    
    // 初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createThemeSwitcher);
        } else {
            createThemeSwitcher();
        }
        
        console.log('🎨 主题切换模块已加载！');
    }
    
    // 注册模块
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('themeSwitcher', init);
    } else {
        init();
    }
})();
