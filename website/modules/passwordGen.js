/**
 * 随机密码生成器模块 🔐
 * 积木式架构 - 可独立删除或替换
 */

(function() {
    'use strict';
    
    // 字符集
    const CHAR_SETS = {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
    
    // 预设密码类型
    const PRESETS = {
        simple: { length: 8, lowercase: true, uppercase: true, numbers: true, symbols: false },
        normal: { length: 12, lowercase: true, uppercase: true, numbers: true, symbols: true },
        strong: { length: 16, lowercase: true, uppercase: true, numbers: true, symbols: true },
        pin: { length: 6, lowercase: false, uppercase: false, numbers: true, symbols: false }
    };
    
    let state = {
        options: { ...PRESETS.normal },
        history: []
    };
    
    let elements = {};
    
    function getElements() {
        elements = {
            lengthSlider: document.getElementById('passwordLength'),
            lengthDisplay: document.getElementById('passwordLengthDisplay'),
            checkboxes: {
                lowercase: document.getElementById('pwdLowercase'),
                uppercase: document.getElementById('pwdUppercase'),
                numbers: document.getElementById('pwdNumbers'),
                symbols: document.getElementById('pwdSymbols')
            },
            generateBtn: document.getElementById('generatePasswordBtn'),
            result: document.getElementById('passwordResult'),
            copyBtn: document.getElementById('copyPasswordBtn'),
            strengthBar: document.getElementById('passwordStrength'),
            history: document.getElementById('passwordHistory'),
            presetBtns: document.querySelectorAll('.password-preset-btn')
        };
    }
    
    // 生成密码
    function generatePassword() {
        let chars = '';
        if (state.options.lowercase) chars += CHAR_SETS.lowercase;
        if (state.options.uppercase) chars += CHAR_SETS.uppercase;
        if (state.options.numbers) chars += CHAR_SETS.numbers;
        if (state.options.symbols) chars += CHAR_SETS.symbols;
        
        if (chars === '') {
            alert('请至少选择一种字符类型！');
            return null;
        }
        
        let password = '';
        const array = new Uint32Array(state.options.length);
        window.crypto.getRandomValues(array);
        
        for (let i = 0; i < state.options.length; i++) {
            password += chars[array[i] % chars.length];
        }
        
        return password;
    }
    
    // 计算密码强度
    function calculateStrength(password) {
        let score = 0;
        
        // 长度得分
        if (password.length >= 8) score += 20;
        if (password.length >= 12) score += 20;
        if (password.length >= 16) score += 10;
        
        // 字符类型得分
        if (/[a-z]/.test(password)) score += 15;
        if (/[A-Z]/.test(password)) score += 15;
        if (/[0-9]/.test(password)) score += 10;
        if (/[^a-zA-Z0-9]/.test(password)) score += 10;
        
        return Math.min(score, 100);
    }
    
    // 获取强度标签
    function getStrengthLabel(score) {
        if (score >= 80) return { text: '超强', color: '#2ECC71', emoji: '💪' };
        if (score >= 60) return { text: '强', color: '#27AE60', emoji: '🔒' };
        if (score >= 40) return { text: '中等', color: '#F39C12', emoji: '🔓' };
        if (score >= 20) return { text: '弱', color: '#E67E22', emoji: '⚠️' };
        return { text: '极弱', color: '#E74C3C', emoji: '❌' };
    }
    
    // 生成并显示密码
    function generate() {
        const password = generatePassword();
        if (!password) return;
        
        const strength = calculateStrength(password);
        const strengthLabel = getStrengthLabel(strength);
        
        // 显示结果
        elements.result.innerHTML = `
            <div class="password-display" style="animation: password-pop 0.3s ease-out;">
                <span class="password-text">${password}</span>
            </div>
        `;
        
        // 更新强度条
        elements.strengthBar.innerHTML = `
            <div class="strength-bar-container">
                <div class="strength-bar-fill" style="width: ${strength}%; background: ${strengthLabel.color};"></div>
            </div>
            <div class="strength-label" style="color: ${strengthLabel.color};">
                ${strengthLabel.emoji} 密码强度：${strengthLabel.text} (${strength}%)
            </div>
        `;
        
        // 添加到历史
        addToHistory(password, strengthLabel);
        
        // 记录统计
        recordStats();
        
        // 添加CSS动画
        if (!document.getElementById('password-animations')) {
            const style = document.createElement('style');
            style.id = 'password-animations';
            style.textContent = `
                @keyframes password-pop {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .strength-bar-container {
                    width: 100%;
                    height: 10px;
                    background: #eee;
                    border-radius: 5px;
                    overflow: hidden;
                    margin: 10px 0;
                }
                .strength-bar-fill {
                    height: 100%;
                    transition: all 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 复制密码
    function copyPassword() {
        const passwordText = elements.result.querySelector('.password-text');
        if (!passwordText) {
            alert('请先生成密码！');
            return;
        }
        
        const password = passwordText.textContent;
        
        // 尝试使用现代剪贴板 API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(password).then(() => {
                showCopySuccess();
            }).catch(err => {
                console.error('复制失败:', err);
                // 降级方案：使用传统方法
                fallbackCopy(password);
            });
        } else {
            // 降级方案
            fallbackCopy(password);
        }
    }
    
    // 降级复制方案
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        
        try {
            textarea.select();
            textarea.setSelectionRange(0, 99999); // 移动端兼容
            const successful = document.execCommand('copy');
            if (successful) {
                showCopySuccess();
            } else {
                alert('复制失败，请手动复制密码');
            }
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制密码');
        } finally {
            document.body.removeChild(textarea);
        }
    }
    
    // 显示复制成功
    function showCopySuccess() {
        const originalText = elements.copyBtn.innerHTML;
        elements.copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制！';
        elements.copyBtn.style.background = '#2ECC71';
        setTimeout(() => {
            elements.copyBtn.innerHTML = originalText;
            elements.copyBtn.style.background = '';
        }, 2000);
    }
    
    // 添加到历史
    function addToHistory(password, strengthLabel) {
        state.history.unshift({ password, strength: strengthLabel, time: new Date() });
        if (state.history.length > 5) state.history.pop();
        
        renderHistory();
    }
    
    // 渲染历史
    function renderHistory() {
        if (!elements.history) return;
        
        elements.history.innerHTML = state.history.map((item, index) => `
            <div class="password-history-item" style="animation: password-pop 0.3s ease-out ${index * 0.1}s both;">
                <span class="history-password">${item.password.substring(0, 3)}${'*'.repeat(item.password.length - 3)}</span>
                <span class="history-strength" style="color: ${item.strength.color};">${item.strength.emoji}</span>
            </div>
        `).join('');
    }
    
    // 加载预设
    function loadPreset(presetName) {
        if (PRESETS[presetName]) {
            state.options = { ...PRESETS[presetName] };
            updateUI();
        }
    }
    
    // 更新UI
    function updateUI() {
        if (elements.lengthSlider) {
            elements.lengthSlider.value = state.options.length;
            elements.lengthDisplay.textContent = state.options.length;
        }
        
        Object.keys(elements.checkboxes).forEach(key => {
            if (elements.checkboxes[key]) {
                elements.checkboxes[key].checked = state.options[key];
            }
        });
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('passwordGen');
        }
    }
    
    function bindEvents() {
        if (elements.generateBtn) {
            elements.generateBtn.addEventListener('click', generate);
        }
        
        if (elements.copyBtn) {
            elements.copyBtn.addEventListener('click', copyPassword);
        }
        
        if (elements.lengthSlider) {
            elements.lengthSlider.addEventListener('input', (e) => {
                state.options.length = parseInt(e.target.value);
                elements.lengthDisplay.textContent = state.options.length;
            });
        }
        
        Object.keys(elements.checkboxes).forEach(key => {
            if (elements.checkboxes[key]) {
                elements.checkboxes[key].addEventListener('change', (e) => {
                    state.options[key] = e.target.checked;
                });
            }
        });
        
        elements.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                loadPreset(btn.dataset.preset);
                elements.presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    function init() {
        getElements();
        
        if (!elements.generateBtn) {
            console.warn('密码生成器模块：未找到必要元素，跳过初始化');
            return;
        }
        
        updateUI();
        bindEvents();
        
        console.log('🔐 密码生成器模块已加载！');
    }
    
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('passwordGen', init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
