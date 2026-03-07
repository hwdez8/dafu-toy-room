/**
 * 心情日记模块 📔
 * 积木式架构 - 可独立删除或替换
 */

(function() {
    'use strict';
    
    // 心情选项
    const MOODS = [
        { emoji: '😊', name: '开心', color: '#FFD93D', desc: '今天心情超棒！' },
        { emoji: '😌', name: '平静', color: '#96CEB4', desc: '内心很宁静~' },
        { emoji: '😔', name: '低落', color: '#B8B8B8', desc: '有点不开心...' },
        { emoji: '😤', name: '生气', color: '#FF6B6B', desc: '气鼓鼓的！' },
        { emoji: '😰', name: '焦虑', color: '#DDA0DD', desc: '有点紧张...' },
        { emoji: '🥰', name: '幸福', color: '#FF8FAB', desc: '满满的幸福感！' },
        { emoji: '😴', name: '疲惫', color: '#A8D8EA', desc: '需要休息...' },
        { emoji: '🤩', name: '兴奋', color: '#FF8C42', desc: '超级激动！' }
    ];
    
    // 每日一言
    const QUOTES = [
        { text: '每一天都是新的开始', emoji: '🌅' },
        { text: '保持微笑，好运会来', emoji: '😊' },
        { text: '做最好的自己', emoji: '⭐' },
        { text: '相信自己，你可以的', emoji: '💪' },
        { text: '生活明朗，万物可爱', emoji: '🌸' },
        { text: '今天也要加油鸭', emoji: '🦆' },
        { text: '心怀希望，未来可期', emoji: '🌟' },
        { text: '慢慢来，比较快', emoji: '🐌' }
    ];
    
    let state = {
        entries: [],
        selectedMood: null
    };
    
    let elements = {};
    
    function getElements() {
        elements = {
            moodGrid: document.getElementById('moodGrid'),
            noteInput: document.getElementById('moodNote'),
            saveBtn: document.getElementById('saveMoodBtn'),
            entriesList: document.getElementById('moodEntries'),
            todayQuote: document.getElementById('todayQuote'),
            moodStats: document.getElementById('moodStats')
        };
    }
    
    // 从本地存储加载
    function loadEntries() {
        const saved = localStorage.getItem('dafuMoodDiary');
        if (saved) {
            try {
                state.entries = JSON.parse(saved);
            } catch (e) {
                console.error('加载心情日记失败:', e);
            }
        }
    }
    
    // 保存到本地存储
    function saveEntries() {
        localStorage.setItem('dafuMoodDiary', JSON.stringify(state.entries));
    }
    
    // 渲染心情选择器
    function renderMoodGrid() {
        if (!elements.moodGrid) return;
        
        elements.moodGrid.innerHTML = MOODS.map((mood, index) => `
            <div class="mood-item ${state.selectedMood === index ? 'selected' : ''}" 
                 data-index="${index}"
                 style="--mood-color: ${mood.color};">
                <span class="mood-emoji">${mood.emoji}</span>
                <span class="mood-name">${mood.name}</span>
            </div>
        `).join('');
        
        // 绑定点击事件
        elements.moodGrid.querySelectorAll('.mood-item').forEach(item => {
            item.addEventListener('click', () => {
                state.selectedMood = parseInt(item.dataset.index);
                renderMoodGrid();
            });
        });
    }
    
    // 保存心情
    function saveMood() {
        if (state.selectedMood === null) {
            alert('请先选择一个心情~');
            return;
        }
        
        const entry = {
            mood: MOODS[state.selectedMood],
            note: elements.noteInput.value.trim(),
            date: new Date().toISOString(),
            id: Date.now()
        };
        
        state.entries.unshift(entry);
        if (state.entries.length > 30) state.entries.pop(); // 只保留最近30条
        
        saveEntries();
        renderEntries();
        updateStats();
        
        // 重置表单
        state.selectedMood = null;
        elements.noteInput.value = '';
        renderMoodGrid();
        
        // 显示成功提示
        showSuccessMessage();
        
        // 记录统计
        recordStats();
    }
    
    // 显示成功提示
    function showSuccessMessage() {
        const msg = document.createElement('div');
        msg.className = 'mood-success-msg';
        msg.innerHTML = '✨ 心情已记录！';
        msg.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff6b9d, #ff8fab);
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            font-weight: 600;
            z-index: 9999;
            animation: mood-success-pop 0.5s ease-out;
        `;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.remove(), 2000);
        
        if (!document.getElementById('mood-success-style')) {
            const style = document.createElement('style');
            style.id = 'mood-success-style';
            style.textContent = `
                @keyframes mood-success-pop {
                    0% { transform: translateX(-50%) scale(0); opacity: 0; }
                    50% { transform: translateX(-50%) scale(1.1); }
                    100% { transform: translateX(-50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 渲染历史记录
    function renderEntries() {
        if (!elements.entriesList) return;
        
        if (state.entries.length === 0) {
            elements.entriesList.innerHTML = `
                <div class="mood-empty">
                    <span style="font-size: 3rem;">📝</span>
                    <p>还没有记录哦，快来写下第一条心情吧~</p>
                </div>
            `;
            return;
        }
        
        elements.entriesList.innerHTML = state.entries.slice(0, 7).map((entry, index) => {
            const date = new Date(entry.date);
            const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            return `
                <div class="mood-entry" style="--mood-color: ${entry.mood.color}; animation: mood-entry-slide 0.3s ease-out ${index * 0.05}s both;">
                    <div class="mood-entry-header">
                        <span class="mood-entry-emoji">${entry.mood.emoji}</span>
                        <span class="mood-entry-name">${entry.mood.name}</span>
                        <span class="mood-entry-date">${dateStr}</span>
                    </div>
                    ${entry.note ? `<div class="mood-entry-note">${entry.note}</div>` : ''}
                </div>
            `;
        }).join('');
        
        if (!document.getElementById('mood-entry-style')) {
            const style = document.createElement('style');
            style.id = 'mood-entry-style';
            style.textContent = `
                @keyframes mood-entry-slide {
                    0% { transform: translateX(-20px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 更新统计
    function updateStats() {
        if (!elements.moodStats) return;
        
        const total = state.entries.length;
        if (total === 0) {
            elements.moodStats.innerHTML = '';
            return;
        }
        
        // 计算最近7天的心情分布
        const last7Days = state.entries.filter(e => {
            const days = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
            return days <= 7;
        });
        
        const moodCounts = {};
        last7Days.forEach(e => {
            moodCounts[e.mood.name] = (moodCounts[e.mood.name] || 0) + 1;
        });
        
        const topMood = Object.entries(moodCounts)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topMood) {
            const mood = MOODS.find(m => m.name === topMood[0]);
            elements.moodStats.innerHTML = `
                <div class="mood-stats-content">
                    <span>最近7天记录了 ${last7Days.length} 次心情</span>
                    <span class="mood-top">最常出现：${mood.emoji} ${mood.name}</span>
                </div>
            `;
        }
    }
    
    // 显示每日一言
    function showTodayQuote() {
        if (!elements.todayQuote) return;
        
        const today = new Date().getDate();
        const quote = QUOTES[today % QUOTES.length];
        
        elements.todayQuote.innerHTML = `
            <div class="today-quote-content">
                <span class="quote-emoji">${quote.emoji}</span>
                <span class="quote-text">${quote.text}</span>
            </div>
        `;
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('moodDiary');
        }
    }
    
    function bindEvents() {
        if (elements.saveBtn) {
            elements.saveBtn.addEventListener('click', saveMood);
        }
    }
    
    function init() {
        getElements();
        
        if (!elements.moodGrid) {
            console.warn('心情日记模块：未找到必要元素，跳过初始化');
            return;
        }
        
        loadEntries();
        renderMoodGrid();
        renderEntries();
        updateStats();
        showTodayQuote();
        bindEvents();
        
        console.log('📔 心情日记模块已加载！');
    }
    
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('moodDiary', init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
