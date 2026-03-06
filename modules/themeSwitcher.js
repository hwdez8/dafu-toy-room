/**
 * 主题切换模块 🎨
 * 积木式架构 - 可独立删除或替换
 * 功能：白天/黑夜模式切换，粉色系/蓝色系/暗色系主题
 */

(function() {
    'use strict';
    
    // 彩虹 SVG
    const PALETTE_SVG = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 0 1 18 0"/><path d="M6 12a6 6 0 0 1 12 0"/><path d="M9 12a3 3 0 0 1 6 0"/></svg>';
    
    // 主题配置
    const THEMES = {
        pink: {
            name: '粉色系',
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
        
        console.log('主题已切换: ' + theme.name);
    }
    
    // 创建切换按钮
    function createThemeSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
            <button class="theme-btn" id="themeBtn" title="切换主题">
                ${PALETTE_SVG}
            </button>
            <div class="theme-panel" id="themePanel">
                <div class="theme-option ${currentTheme === 'pink' ? 'active' : ''}" data-theme="pink">
                    <span class="theme-dot" style="background:#ff6b9d"></span>
                    <span class="theme-name">粉色系</span>
                </div>
                <div class="theme-option ${currentTheme === 'blue' ? 'active' : ''}" data-theme="blue">
                    <span class="theme-dot" style="background:#5c9dff"></span>
                    <span class="theme-name">蓝色系</span>
                </div>
                <div class="theme-option ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                    <span class="theme-dot" style="background:#1a1a2e"></span>
                    <span class="theme-name">暗色系</span>
                </div>
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
                bottom: 100px;
                left: 30px;
                z-index: 1000;
            }
            
            .theme-btn {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: none;
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                cursor: pointer;
                box-shadow: 0 5px 20px rgba(255, 107, 157, 0.4);
                transition: transform 0.3s, box-shadow 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: theme-btn-appear 0.5s ease-out;
            }
            
            @keyframes theme-btn-appear {
                0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                70% { transform: scale(1.1) rotate(10deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            .theme-btn svg {
                width: 28px;
                height: 28px;
            }
            
            .theme-btn:hover {
                transform: scale(1.1) rotate(-10deg);
                box-shadow: 0 8px 30px rgba(255, 107, 157, 0.5);
            }
            
            .theme-btn::after {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: inherit;
                opacity: 0.4;
                animation: theme-pulse 2s infinite;
                z-index: -1;
            }
            
            @keyframes theme-pulse {
                0% { transform: scale(1); opacity: 0.4; }
                50% { transform: scale(1.3); opacity: 0; }
                100% { transform: scale(1); opacity: 0; }
            }
            
            .theme-panel {
                position: absolute;
                bottom: 60px;
                left: 0;
                background: var(--card-bg);
                border-radius: 15px;
                padding: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
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
            
            .theme-dot {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                margin-right: 10px;
                border: 2px solid rgba(0,0,0,0.1);
            }
            
            .theme-name {
                font-size: 0.9rem;
                color: var(--text-color);
            }
            
            @media (max-width: 768px) {
                .theme-switcher {
                    bottom: 85px;
                    left: 20px;
                }
                
                .theme-btn {
                    width: 50px;
                    height: 50px;
                }
                
                .theme-btn svg {
                    width: 24px;
                    height: 24px;
                }
                
                .theme-panel {
                    bottom: 60px;
                    left: 0;
                    top: auto;
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
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('show');
        });
        
        panel.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                applyTheme(theme);
                panel.classList.remove('show');
                
                panel.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
            });
        });
        
        document.addEventListener('click', () => {
            panel.classList.remove('show');
        });
    }
    
    // 初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createThemeSwitcher);
        } else {
            createThemeSwitcher();
        }
        
        console.log('主题切换模块已加载！');
    }
    
    // 注册模块
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('themeSwitcher', init);
    } else {
        init();
    }
})();
