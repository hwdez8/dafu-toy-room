/**
 * 彩蛋模块 - "我不是按钮"
 * 积木式架构 - 可独立删除或替换
 * 隐藏在页脚的小惊喜
 */

(function() {
    'use strict';
    
    // 代码海洋内容 - 看起来像乱码的代码片段
    const CODE_OCEAN = [
        '// DeepSeek API Configuration',
        'const API_KEY = "sk-***REDACTED***";',
        'async function initFortune() {',
        '  const cat = new MagicalCat();',
        '  await cat.connectCrystalBall();',
        '}',
        '',
        '// 今日运势算法 v2.0',
        'function calculateLuck(userBirthday) {',
        '  const stars = ["✨", "🌟", "💫", "⭐"];',
        '  const randomStar = stars[Math.floor(Math.random() * stars.length)];',
        '  return {',
        '    level: Math.random() > 0.5 ? "大吉" : "吉",',
        '    emoji: randomStar',
        '  };',
        '}',
        '',
        '/* ========================================',
        '   神秘代码区域 - 请勿触碰',
        '   ======================================== */',
        'class SecretMessage {',
        '  constructor() {',
        '    this.hidden = true;',
        '    this.depth = 9999;',
        '  }',
        '',
        '  decode() {',
        '    return atob("5oKo5oKo5oKo"); // 神秘编码',
        '  }',
        '}',
        '',
        '// 大福的玩具房 - 核心算法',
        'const dafuCore = {',
        '  happiness: Infinity,',
        '  cuteness: 100,',
        '  magic: true,',
        '   更多秘密...',
        '};',
        '',
        'function createHeart() {',
        '  const heart = document.createElement("div");',
        '  heart.className = "floating-heart";',
        '  heart.innerHTML = ["💕", "💖", "💗"][Math.random() * 3 | 0];',
        '  return heart;',
        '}',
        '',
        '// 猜数字游戏 - 机密算法',
        'const SECRET_NUMBER = Math.floor(Math.random() * 100) + 1;',
        '// 提示: 答案在 1 到 100 之间 😏',
        '',
        '/* 警告: 以下代码包含高度机密信息',
        '   继续滚动后果自负 */',
        '',
        'const encryptedMessage = {',
        '  part1: "哎呀呀",',
        '  part2: "咱都藏到",',
        '  part3: "代码的海洋里了",',
        '  part4: "居然还是",',
        '  part5: "被发现了吗",',
        '};',
        '',
        '// 解码函数 - 仅供内部使用',
        'function decrypt(obj) {',
        '  return Object.values(obj).join("");',
        '}',
        '',
        '// 神秘变量 - 不要查看它的值',
        'const __SECRET__ = "反正来都来了就rua下大福叭~ :P";',
        '',
        '/* ========================================',
        '   你真的很执着呢...',
        '   好吧，秘密就在下面',
        '   ======================================== */',
        '',
        '// 最终彩蛋 - 只有坚持到最后的人才能看到',
        'const EASTER_EGG = {',
        '  message: decrypt(encryptedMessage) + __SECRET__,',
        '  reward: "🎀 大福的拥抱 🎀",',
        '  timestamp: new Date().toISOString(),',
        '};',
        '',
        'console.log("%c🎉 恭喜你发现了彩蛋！", "font-size: 20px; color: #ff6b9d;");',
        'console.log("%c" + EASTER_EGG.message, "font-size: 16px; color: #ff8fab;");',
        'console.log("%c奖励: " + EASTER_EGG.reward, "font-size: 14px; color: #ffd93d;");',
        '',
        '// 结束标记',
        '// EOF - End of Fun 🎀',
    ];
    
    // 更多装饰性代码
    const EXTRA_CODE = [
        '',
        '// 随机生成的代码片段',
        ...Array(30).fill(0).map((_, i) => {
            const types = [
                `const var_${i} = ${Math.random().toFixed(4)};`,
                `function process_${i}(data) { return data.map(x => x * ${i + 1}); }`,
                `// Line ${i + 100}: System check... OK`,
                `class Module_${i} extends BaseModule {}`,
                `import { helper_${i} } from './utils/${i}.js';`,
                `/* Debug: ${Math.random().toString(36).substring(7)} */`,
            ];
            return types[i % types.length];
        }),
        '',
        '// 看起来很重要的注释',
        '/**',
        ' * @deprecated 这个函数已经废弃了',
        ' * @param {string} input - 输入参数',
        ' * @returns {Promise<void>} - 什么都不返回',
        ' */',
        '',
        '// 更多神秘代码...',
        ...Array(20).fill(0).map((_, i) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const randomStr = Array(20).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
            return `// ${randomStr}`;
        }),
    ];
    
    // DOM元素
    let elements = {};
    
    // 初始化
    function init() {
        getElements();
        
        if (!elements.trigger) {
            console.warn('彩蛋模块：未找到触发元素');
            return;
        }
        
        bindEvents();
        console.log('🥚 彩蛋模块已加载（找找看我在哪里~）');
    }
    
    // 获取DOM元素
    function getElements() {
        elements = {
            trigger: document.getElementById('notAButton'),
            modal: document.getElementById('easterEggModal'),
            closeBtn: document.getElementById('closeEasterEgg'),
            codeContainer: document.getElementById('codeOcean'),
            eggMessage: document.getElementById('eggMessage')
        };
    }
    
    // 绑定事件
    function bindEvents() {
        elements.trigger.addEventListener('click', openEasterEgg);
        elements.closeBtn.addEventListener('click', closeEasterEgg);
        
        // 点击模态框外部关闭
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) {
                closeEasterEgg();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
                closeEasterEgg();
            }
        });
    }
    
    // 打开彩蛋
    function openEasterEgg() {
        elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 生成代码海洋
        generateCodeOcean();
        
        // 滚动到顶部，让用户自己探索
        elements.codeContainer.scrollTop = 0;
    }
    
    // 关闭彩蛋
    function closeEasterEgg() {
        elements.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // 生成代码海洋
    function generateCodeOcean() {
        const allCode = [...CODE_OCEAN, ...EXTRA_CODE];
        
        const html = allCode.map((line, index) => {
            // 为不同类型的代码添加不同的样式
            let className = 'code-line';
            let content = escapeHtml(line);
            
            if (line.startsWith('//')) {
                className += ' comment';
            } else if (line.startsWith('/*') || line.startsWith(' *') || line.startsWith('*/')) {
                className += ' comment-block';
            } else if (line.startsWith('const') || line.startsWith('let') || line.startsWith('var')) {
                className += ' declaration';
            } else if (line.startsWith('function') || line.startsWith('class')) {
                className += ' function';
            } else if (line.startsWith('return') || line.startsWith('console.')) {
                className += ' keyword';
            } else if (line.includes('"') || line.includes("'")) {
                className += ' string';
            }
            
            // 彩蛋消息特殊处理
            if (line.includes('哎呀呀') || line.includes('咱都藏到') || line.includes('代码的海洋里了') || 
                line.includes('居然还是') || line.includes('被发现了吗') || line.includes('反正来都来了')) {
                className += ' egg-line';
            }
            
            return `<div class="${className}" style="animation-delay: ${index * 0.01}s">${content}</div>`;
        }).join('');
        
        elements.codeContainer.innerHTML = html;
        
        // 添加彩蛋消息（在底部）
        const eggHtml = `
            <div class="egg-container">
                <div class="egg-decoration top-left">🎀</div>
                <div class="egg-decoration top-right">🎀</div>
                <div class="egg-decoration bottom-left">🎀</div>
                <div class="egg-decoration bottom-right">🎀</div>
                <div class="egg-emoji">🐱</div>
                <div class="egg-text">
                    哎呀呀咱都藏到代码的海洋里了居然还是被发现了吗，<br>
                    反正来都来了就rua下大福叭~ :P
                </div>
                <div class="egg-hint">（你已经翻到了最底部，真厉害！）</div>
            </div>
        `;
        
        elements.codeContainer.insertAdjacentHTML('beforeend', eggHtml);
    }
    
    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 立即初始化（确保DOM已加载）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 同时注册到模块系统（如果可用）
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('easterEgg', init);
    }
})();
