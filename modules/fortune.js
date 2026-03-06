/**
 * 小魔法猫咪今日运势占卜模块
 * 积木式架构 - 可独立删除或替换
 */

(function() {
    'use strict';
    
    // 运势数据库
    const FORTUNE_DATA = {
        levels: [
            { name: '大吉', class: 'fortune-excellent', probability: 0.15 },
            { name: '吉', class: 'fortune-good', probability: 0.30 },
            { name: '平', class: 'fortune-normal', probability: 0.40 },
            { name: '凶', class: 'fortune-poor', probability: 0.15 }
        ],
        love: {
            excellent: [
                { desc: '桃花运爆棚！今天可能会遇到心动的人哦 💘', advice: '多出门走走，缘分就在转角处' },
                { desc: '爱情运势超旺，适合表白或约会 💕', advice: '勇敢表达你的心意吧' },
                { desc: '甜蜜指数爆表，感情会有新进展 🥰', advice: '给对方一个小惊喜' }
            ],
            good: [
                { desc: '爱情运势不错，适合增进感情 💝', advice: '多关心对方的感受' },
                { desc: '有机会认识新朋友，保持开放心态 💌', advice: '参加社交活动' },
                { desc: '感情稳定，适合深入交流 💑', advice: '找个安静的地方聊聊天' }
            ],
            normal: [
                { desc: '爱情运势平稳，顺其自然就好 💫', advice: '不要强求，慢慢来' },
                { desc: '今天适合独处，整理心情 🌸', advice: '给自己一些空间' },
                { desc: '感情没有大波动，享受平淡 💭', advice: '珍惜当下的平静' }
            ],
            poor: [
                { desc: '今天容易有误会，说话要注意 💔', advice: '三思而后言' },
                { desc: '感情运势较低，避免争吵 😔', advice: '退一步海阔天空' },
                { desc: '可能会有小摩擦，保持冷静 🌧️', advice: '暂时避开敏感话题' }
            ]
        },
        career: {
            excellent: [
                { desc: '事业运势极佳，把握机会！🚀', advice: '大胆提出你的想法' },
                { desc: '工作效率超高，事半功倍 💼', advice: '把重要任务安排在今天' },
                { desc: '有贵人相助，事业会有突破 🌟', advice: '多和同事交流合作' }
            ],
            good: [
                { desc: '工作状态不错，保持专注 📊', advice: '按部就班完成任务' },
                { desc: '适合学习新技能，提升自己 📚', advice: '利用空闲时间充电' },
                { desc: '团队合作顺利，氛围融洽 🤝', advice: '积极参与团队活动' }
            ],
            normal: [
                { desc: '工作平稳，没有大波动 📋', advice: '做好本职工作' },
                { desc: '可能会遇到小困难，耐心解决 🔧', advice: '寻求帮助不丢人' },
                { desc: '今天适合整理和规划 📅', advice: '制定未来计划' }
            ],
            poor: [
                { desc: '工作压力较大，注意休息 😰', advice: '适当放松，别太累' },
                { desc: '容易出错，做事要仔细 ⚠️', advice: '多检查几遍' },
                { desc: '可能会遇到阻碍，保持耐心 🚧', advice: '明天会更好' }
            ]
        },
        wealth: {
            excellent: [
                { desc: '财运亨通，可能有意外之财！💰', advice: '可以买张彩票试试' },
                { desc: '投资运势佳，适合理财 💎', advice: '关注投资机会' },
                { desc: '赚钱机会多，把握时机 🎯', advice: '积极寻找副业' }
            ],
            good: [
                { desc: '财运不错，有小额进账 💵', advice: '合理规划支出' },
                { desc: '适合储蓄，积少成多 🏦', advice: '制定存钱计划' },
                { desc: '消费运势平稳，理性购物 🛍️', advice: '买需要的东西' }
            ],
            normal: [
                { desc: '财运平稳，收支平衡 ⚖️', advice: '量入为出' },
                { desc: '没有大进账，也没有大支出 📊', advice: '保持现状' },
                { desc: '适合整理财务状况 📝', advice: '记账是个好习惯' }
            ],
            poor: [
                { desc: '容易破财，注意保管财物 🛡️', advice: '小心丢失东西' },
                { desc: '不适合大额消费，节制一点 💸', advice: '忍住购物欲' },
                { desc: '投资需谨慎，避免冒险 ⚡', advice: '保守理财' }
            ]
        },
        health: {
            excellent: [
                { desc: '身体状态超好，精力充沛！💪', advice: '适合运动锻炼' },
                { desc: '健康运势佳，身心愉悦 🌈', advice: '保持好心情' },
                { desc: '元气满满，活力四射 ⚡', advice: '挑战一些有难度的运动' }
            ],
            good: [
                { desc: '身体状况良好，继续保持 🌿', advice: '规律作息' },
                { desc: '精神状态不错，适合户外活动 🏃', advice: '多呼吸新鲜空气' },
                { desc: '免疫力在线，不容易生病 🛡️', advice: '均衡饮食' }
            ],
            normal: [
                { desc: '健康状况平稳，注意休息 😌', advice: '不要熬夜' },
                { desc: '可能会有些小疲劳，放松一下 🧘', advice: '适当休息' },
                { desc: '身体状况一般，注意保养 🍵', advice: '多喝热水' }
            ],
            poor: [
                { desc: '容易疲劳，注意休息 😴', advice: '早点睡觉' },
                { desc: '可能会有小毛病，注意预防 🤒', advice: '注意保暖' },
                { desc: '身体状态不佳，别太劳累 🛌', advice: '给自己放个假' }
            ]
        }
    };
    
    // 猫咪语录
    const CAT_QUOTES = [
        '喵~ 让本喵看看你的运势 ✨',
        '水晶球告诉我，今天会有好事发生 🔮',
        '喵呜~ 我来为你占卜一下 🐱',
        '星星说，今天适合你 🌟',
        '本喵的直觉很准的哦 💫'
    ];
    
    // 幸运物品
    const LUCKY_ITEMS = [
        '粉色水晶', '四叶草', '幸运星', '彩虹', '月亮石',
        '向日葵', '贝壳', '羽毛', '星星瓶', '许愿瓶'
    ];
    
    // 幸运数字
    function getLuckyNumbers() {
        const numbers = [];
        while (numbers.length < 3) {
            const num = Math.floor(Math.random() * 99) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        return numbers.sort((a, b) => a - b);
    }
    
    // 幸运颜色
    const LUCKY_COLORS = [
        { name: '粉色', emoji: '🩷', hex: '#FFB6C1' },
        { name: '蓝色', emoji: '💙', hex: '#87CEEB' },
        { name: '绿色', emoji: '💚', hex: '#98FB98' },
        { name: '黄色', emoji: '💛', hex: '#FFD700' },
        { name: '紫色', emoji: '💜', hex: '#DDA0DD' },
        { name: '橙色', emoji: '🧡', hex: '#FFA500' },
        { name: '红色', emoji: '❤️', hex: '#FF6B6B' },
        { name: '白色', emoji: '🤍', hex: '#FFFFFF' }
    ];
    
    // 状态
    let state = {
        isFortuning: false
    };
    
    // DOM元素
    let elements = {};
    
    // 获取DOM元素
    function getElements() {
        elements = {
            fortuneBtns: document.querySelectorAll('.fortune-btn-large'),
            generalBtn: document.getElementById('generalFortuneBtn'),
            result: document.getElementById('fortuneResult'),
            catSpeech: document.querySelector('.cat-speech-large')
        };
    }
    
    // 随机选择运势等级
    function getFortuneLevel() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const level of FORTUNE_DATA.levels) {
            cumulative += level.probability;
            if (rand <= cumulative) {
                return level;
            }
        }
        return FORTUNE_DATA.levels[2]; // 默认返回"平"
    }
    
    // 获取运势详情
    function getFortuneDetail(type, levelKey) {
        const details = FORTUNE_DATA[type][levelKey];
        return DafuToyRoom.Utils.randomChoice(details);
    }
    
    // 更新猫咪语录
    function updateCatQuote() {
        if (elements.catSpeech) {
            const quote = DafuToyRoom.Utils.randomChoice(CAT_QUOTES);
            elements.catSpeech.textContent = quote;
        }
    }
    
    // 显示运势结果
    function showFortune(type) {
        if (state.isFortuning) return;
        
        state.isFortuning = true;
        updateCatQuote();
        
        // 显示加载动画
        elements.result.innerHTML = `
            <div class="fortune-loading" style="text-align: center; padding: 30px;">
                <div style="font-size: 3rem; animation: cat-bounce 0.5s ease-in-out infinite;">🔮</div>
                <p style="margin-top: 15px; color: var(--text-light);">小猫咪正在为你占卜...</p>
            </div>
        `;
        
        // 模拟占卜延迟
        setTimeout(() => {
            if (type === 'general') {
                showGeneralFortune();
            } else {
                showSpecificFortune(type);
            }
            state.isFortuning = false;
            
            // 记录统计
            recordStats();
        }, 1500);
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('fortune');
        }
    }
    
    // 显示综合运势
    function showGeneralFortune() {
        const level = getFortuneLevel();
        const levelKey = level.class.replace('fortune-', '');
        
        const love = getFortuneDetail('love', levelKey);
        const career = getFortuneDetail('career', levelKey);
        const wealth = getFortuneDetail('wealth', levelKey);
        const health = getFortuneDetail('health', levelKey);
        
        const luckyItem = DafuToyRoom.Utils.randomChoice(LUCKY_ITEMS);
        const luckyNumbers = getLuckyNumbers();
        const luckyColor = DafuToyRoom.Utils.randomChoice(LUCKY_COLORS);
        
        elements.result.innerHTML = `
            <div class="fortune-result" style="animation: fortune-reveal 0.5s ease-out; width: 100%;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span class="fortune-level ${level.class}">${level.name}</span>
                </div>
                
                <div style="display: grid; gap: 15px; margin-bottom: 20px;">
                    <div class="fortune-item" style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 10px;">
                        <strong>💕 爱情：</strong>${love.desc}<br>
                        <small style="color: var(--text-light);">建议：${love.advice}</small>
                    </div>
                    <div class="fortune-item" style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 10px;">
                        <strong>💼 事业：</strong>${career.desc}<br>
                        <small style="color: var(--text-light);">建议：${career.advice}</small>
                    </div>
                    <div class="fortune-item" style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 10px;">
                        <strong>💰 财运：</strong>${wealth.desc}<br>
                        <small style="color: var(--text-light);">建议：${wealth.advice}</small>
                    </div>
                    <div class="fortune-item" style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 10px;">
                        <strong>🌟 健康：</strong>${health.desc}<br>
                        <small style="color: var(--text-light);">建议：${health.advice}</small>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, rgba(255,200,221,0.3), rgba(255,230,240,0.3)); padding: 15px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 1.1rem; margin-bottom: 10px;">✨ 今日幸运指南 ✨</div>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <span>🎁 幸运物：${luckyItem}</span>
                        <span>🔢 幸运数字：${luckyNumbers.join(', ')}</span>
                        <span>${luckyColor.emoji} 幸运色：${luckyColor.name}</span>
                    </div>
                </div>
            </div>
        `;
        
        addFortuneAnimations();
    }
    
    // 显示特定运势
    function showSpecificFortune(type) {
        const level = getFortuneLevel();
        const levelKey = level.class.replace('fortune-', '');
        const detail = getFortuneDetail(type, levelKey);
        
        const typeNames = {
            love: '💕 爱情运',
            career: '💼 事业运',
            wealth: '💰 财运',
            health: '🌟 健康运'
        };
        
        const luckyItem = DafuToyRoom.Utils.randomChoice(LUCKY_ITEMS);
        
        elements.result.innerHTML = `
            <div class="fortune-result" style="animation: fortune-reveal 0.5s ease-out; width: 100%;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 1.2rem; margin-bottom: 10px;">${typeNames[type]}</div>
                    <span class="fortune-level ${level.class}">${level.name}</span>
                </div>
                
                <div style="background: rgba(255,255,255,0.5); padding: 20px; border-radius: 15px; margin-bottom: 15px;">
                    <div style="font-size: 1.1rem; margin-bottom: 10px;">${detail.desc}</div>
                    <div style="color: var(--text-light); padding-top: 10px; border-top: 1px dashed var(--primary-light);">
                        <strong>💡 小猫咪的建议：</strong>${detail.advice}
                    </div>
                </div>
                
                <div style="text-align: center; color: var(--text-light); font-size: 0.9rem;">
                    🎁 今日幸运物：${luckyItem}
                </div>
            </div>
        `;
        
        addFortuneAnimations();
    }
    
    // 添加运势动画
    function addFortuneAnimations() {
        if (document.getElementById('fortune-animations')) return;
        
        const style = document.createElement('style');
        style.id = 'fortune-animations';
        style.textContent = `
            @keyframes fortune-reveal {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .fortune-item {
                animation: item-slide 0.3s ease-out;
                animation-fill-mode: both;
            }
            
            .fortune-item:nth-child(1) { animation-delay: 0.1s; }
            .fortune-item:nth-child(2) { animation-delay: 0.2s; }
            .fortune-item:nth-child(3) { animation-delay: 0.3s; }
            .fortune-item:nth-child(4) { animation-delay: 0.4s; }
            
            @keyframes item-slide {
                0% { opacity: 0; transform: translateX(-20px); }
                100% { opacity: 1; transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 绑定事件
    function bindEvents() {
        elements.fortuneBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                showFortune(type);
            });
        });
        
        elements.generalBtn.addEventListener('click', () => {
            showFortune('general');
        });
    }
    
    // 模块初始化函数
    function init() {
        getElements();
        
        // 检查必要元素是否存在
        if (!elements.result) {
            console.warn('运势占卜模块：未找到必要DOM元素，跳过初始化');
            return;
        }
        
        bindEvents();
        
        console.log('🔮 小魔法猫咪运势占卜模块已加载！');
    }
    
    // 注册到模块系统
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('fortune', init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
