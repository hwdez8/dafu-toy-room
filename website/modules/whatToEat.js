/**
 * 今天吃什么模块
 * 积木式架构 - 可独立删除或替换
 */

(function() {
    'use strict';
    
    // 食物数据库
    const FOOD_DATABASE = {
        all: [
            { name: '火锅', emoji: '🍲', desc: '热辣鲜香，聚餐首选！' },
            { name: '烧烤', emoji: '🍖', desc: '烟火气十足，啤酒配烤串！' },
            { name: '披萨', emoji: '🍕', desc: '芝士就是力量！' },
            { name: '汉堡', emoji: '🍔', desc: '经典美式，大口吃肉！' },
            { name: '寿司', emoji: '🍣', desc: '精致日式，新鲜美味！' },
            { name: '拉面', emoji: '🍜', desc: '汤浓面劲，暖心暖胃！' },
            { name: '炒饭', emoji: '🍛', desc: '粒粒分明，香气四溢！' },
            { name: '饺子', emoji: '🥟', desc: '皮薄馅大，家的味道！' },
            { name: '面条', emoji: '🍝', desc: '简单快捷，百吃不厌！' },
            { name: '沙拉', emoji: '🥗', desc: '清爽健康，轻食首选！' },
            { name: '三明治', emoji: '🥪', desc: '层次分明，方便携带！' },
            { name: '炸鸡', emoji: '🍗', desc: '外酥里嫩，快乐源泉！' },
            { name: '牛排', emoji: '🥩', desc: '肉质鲜嫩，品质之选！' },
            { name: '海鲜', emoji: '🦐', desc: '鲜美可口，营养丰富！' },
            { name: '麻辣烫', emoji: '🥘', desc: '麻辣鲜香，自选美味！' },
            { name: '盖浇饭', emoji: '🍚', desc: '饭菜一体，实惠管饱！' },
            { name: '包子', emoji: '🥠', desc: '软糯可口，早餐经典！' },
            { name: '煎饼果子', emoji: '🌯', desc: '街头美味，香脆可口！' },
            { name: '粥', emoji: '🥣', desc: '温润养胃，清淡舒适！' },
            { name: '甜品', emoji: '🍰', desc: '甜蜜治愈，饭后享受！' }
        ],
        spicy: [
            { name: '重庆火锅', emoji: '🍲', desc: '麻辣鲜香，巴适得板！' },
            { name: '麻辣烫', emoji: '🥘', desc: '自选食材，麻辣过瘾！' },
            { name: '麻辣香锅', emoji: '🍲', desc: '干香麻辣，下饭神器！' },
            { name: '水煮鱼', emoji: '🐟', desc: '鱼肉鲜嫩，麻辣入味！' },
            { name: '毛血旺', emoji: '🌶️', desc: '川味经典，麻辣鲜香！' },
            { name: '辣子鸡', emoji: '🍗', desc: '干香酥脆，辣椒里找鸡！' },
            { name: '酸辣粉', emoji: '🍜', desc: '酸辣开胃，粉条劲道！' },
            { name: '螺蛳粉', emoji: '🍜', desc: '闻着臭吃着香，上头！' }
        ],
        sweet: [
            { name: '蛋糕', emoji: '🎂', desc: '甜蜜绵软，幸福感爆棚！' },
            { name: '冰淇淋', emoji: '🍦', desc: '冰凉爽口，夏日必备！' },
            { name: '奶茶', emoji: '🧋', desc: '珍珠Q弹，奶香浓郁！' },
            { name: '甜甜圈', emoji: '🍩', desc: '外酥内软，甜蜜诱惑！' },
            { name: '巧克力', emoji: '🍫', desc: '丝滑浓郁，幸福滋味！' },
            { name: '布丁', emoji: '🍮', desc: '嫩滑Q弹，入口即化！' },
            { name: '蛋挞', emoji: '🥧', desc: '酥皮香脆，蛋馅嫩滑！' },
            { name: '红豆汤', emoji: '🫘', desc: '温润甜蜜，暖心暖胃！' }
        ],
        sour: [
            { name: '酸菜鱼', emoji: '🐟', desc: '酸爽开胃，鱼肉鲜嫩！' },
            { name: '醋溜白菜', emoji: '🥬', desc: '酸爽可口，家常美味！' },
            { name: '柠檬鸡', emoji: '🍋', desc: '清新酸爽，夏日首选！' },
            { name: '酸辣汤', emoji: '🥣', desc: '酸辣开胃，暖胃暖心！' },
            { name: '番茄炒蛋', emoji: '🍅', desc: '酸甜可口，国民美食！' },
            { name: '酸汤肥牛', emoji: '🥩', desc: '酸爽过瘾，牛肉鲜嫩！' },
            { name: '醋溜土豆丝', emoji: '🥔', desc: '酸爽脆嫩，下饭神器！' },
            { name: '柠檬茶', emoji: '🍵', desc: '清新解腻，维C满满！' }
        ],
        light: [
            { name: '清蒸鱼', emoji: '🐟', desc: '鲜美清淡，原汁原味！' },
            { name: '白切鸡', emoji: '🍗', desc: '肉质鲜嫩，清淡可口！' },
            { name: '蔬菜沙拉', emoji: '🥗', desc: '清爽健康，低卡美味！' },
            { name: '蒸蛋', emoji: '🥚', desc: '嫩滑可口，老少皆宜！' },
            { name: '清汤面', emoji: '🍜', desc: '汤清面滑，简单舒适！' },
            { name: '白粥', emoji: '🥣', desc: '温润养胃，清淡之选！' },
            { name: '蒸蔬菜', emoji: '🥦', desc: '保留原味，健康营养！' },
            { name: '豆腐汤', emoji: '🍲', desc: '清淡鲜美，蛋白质丰富！' }
        ],
        heavy: [
            { name: '红烧肉', emoji: '🥩', desc: '肥而不腻，入口即化！' },
            { name: '东坡肉', emoji: '🍖', desc: '软糯香浓，经典名菜！' },
            { name: '烤全羊', emoji: '🐑', desc: '外焦里嫩，香气四溢！' },
            { name: '酱肘子', emoji: '🍗', desc: '酱香浓郁，大口吃肉！' },
            { name: '扣肉', emoji: '🥓', desc: '肥瘦相间，下饭神器！' },
            { name: '猪蹄', emoji: '🐷', desc: '胶原蛋白满满，软糯Q弹！' },
            { name: '烤鸭', emoji: '🦆', desc: '皮脆肉嫩，北京特色！' },
            { name: '炸鸡', emoji: '🍗', desc: '外酥里嫩，罪恶但快乐！' }
        ],
        dafu: [
            // 主食 - 粗粮+蔬菜
            { name: '杂粮饭配时蔬', emoji: '🌾', desc: '糙米燕麦饭+清炒时蔬，健康又饱腹！' },
            { name: '全麦三明治', emoji: '🥪', desc: '全麦面包+蔬菜+鸡胸肉，营养均衡！' },
            { name: '藜麦沙拉碗', emoji: '🥗', desc: '藜麦+牛油果+蔬菜，超级食物组合！' },
            { name: '燕麦粥配水果', emoji: '🥣', desc: '燕麦+蓝莓+香蕉，早餐健康首选！' },
            { name: '紫薯糙米饭', emoji: '🍠', desc: '紫薯+糙米+西兰花，色彩营养满分！' },
            { name: '玉米蔬菜汤', emoji: '🌽', desc: '玉米+胡萝卜+青菜，清甜暖胃！' },
            // 饮品 - 苏打水/无糖/果汁
            { name: '柠檬苏打水', emoji: '🍋', desc: '清爽解渴，零糖零负担！' },
            { name: '无糖气泡水', emoji: '💧', desc: '咕噜咕噜，健康又满足！' },
            { name: '鲜榨橙汁', emoji: '🍊', desc: '维C满满，新鲜现榨！' },
            { name: '西瓜汁', emoji: '🍉', desc: '夏日清凉，天然甜蜜！' },
            { name: '苹果胡萝卜汁', emoji: '🥕', desc: '蔬果搭配，营养翻倍！' },
            // 轻食
            { name: '蒸蛋羹', emoji: '🥚', desc: '嫩滑可口，高蛋白低脂肪！' },
            { name: '清蒸鱼配蔬菜', emoji: '🐟', desc: '优质蛋白+膳食纤维，完美搭配！' },
            { name: '豆腐蔬菜汤', emoji: '🍲', desc: '植物蛋白+蔬菜，清淡鲜美！' },
            { name: '凉拌黄瓜木耳', emoji: '🥒', desc: '清爽解腻，低卡健康！' },
            { name: '番茄鸡蛋面', emoji: '🍅', desc: '番茄维C+鸡蛋蛋白，简单营养！' }
        ]
    };
    
    // 状态
    let state = {
        selectedType: 'all',
        isDeciding: false
    };
    
    // DOM元素
    let elements = {};
    
    // 获取DOM元素
    function getElements() {
        elements = {
            foodTags: document.querySelectorAll('.food-tag-large'),
            decideBtn: document.getElementById('decideFoodBtn'),
            result: document.getElementById('foodResult')
        };
    }
    
    // 选择食物类型
    function selectType(type) {
        state.selectedType = type;
        
        // 更新UI
        elements.foodTags.forEach(tag => {
            if (tag.dataset.type === type) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
        
        // 添加点击动画
        const activeTag = document.querySelector(`.food-tag-large[data-type="${type}"]`);
        if (activeTag) {
            DafuToyRoom.Utils.animate(activeTag, 'pulse', 300);
        }
    }
    
    // 决定吃什么
    function decideFood() {
        if (state.isDeciding) return;
        
        state.isDeciding = true;
        elements.decideBtn.disabled = true;
        elements.decideBtn.innerHTML = '<i class="fas fa-spinner spin"></i> 大福正在思考...';
        
        const foods = FOOD_DATABASE[state.selectedType] || FOOD_DATABASE.all;
        let shuffleCount = 0;
        const maxShuffles = 15;
        const shuffleInterval = 100;
        
        // 滚动动画
        const shuffleTimer = setInterval(() => {
            const randomFood = DafuToyRoom.Utils.randomChoice(foods);
            showTempResult(randomFood);
            shuffleCount++;
            
            if (shuffleCount >= maxShuffles) {
                clearInterval(shuffleTimer);
                finalizeDecision(foods);
                recordStats();
            }
        }, shuffleInterval);
    }
    
    // 显示临时结果
    function showTempResult(food) {
        elements.result.innerHTML = `
            <div class="temp-result" style="opacity: 0.5;">
                <div style="font-size: 3rem; margin-bottom: 10px;">${food.emoji}</div>
                <div style="font-size: 1.2rem;">${food.name}</div>
            </div>
        `;
    }
    
    // 最终决定
    function finalizeDecision(foods) {
        const selectedFood = DafuToyRoom.Utils.randomChoice(foods);
        
        // 添加庆祝效果
        elements.result.innerHTML = `
            <div class="final-result" style="animation: food-reveal 0.5s ease-out;">
                <div style="font-size: 4rem; margin-bottom: 15px; animation: food-bounce 1s ease-in-out infinite;">
                    ${selectedFood.emoji}
                </div>
                <div style="font-size: 1.8rem; font-weight: bold; color: var(--primary-color); margin-bottom: 10px;">
                    ${selectedFood.name}
                </div>
                <div style="font-size: 1rem; color: var(--text-light);">
                    ${selectedFood.desc}
                </div>
                <div style="margin-top: 15px; font-size: 1.2rem;">
                    ${getReactionEmoji()}
                </div>
            </div>
        `;
        
        // 添加CSS动画
        addFoodAnimations();
        
        // 恢复按钮
        state.isDeciding = false;
        elements.decideBtn.disabled = false;
        elements.decideBtn.innerHTML = '<i class="fas fa-magic"></i> 再选一次！';
        
        // 触发庆祝
        celebrateFood(selectedFood);
    }
    
    // 获取反应表情
    function getReactionEmoji() {
        const reactions = ['😋', '🤤', '😍', '👍', '✨', '🎉', '🥳', '👏'];
        return DafuToyRoom.Utils.randomChoice(reactions);
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('whatToEat');
        }
    }
    
    // 庆祝动画
    function celebrateFood(food) {
        // 创建飘落的表情
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = food.emoji;
                emoji.style.cssText = `
                    position: fixed;
                    left: ${30 + Math.random() * 40}%;
                    top: 40%;
                    font-size: 2rem;
                    pointer-events: none;
                    z-index: 9999;
                    animation: food-celebrate 1.5s ease-out forwards;
                `;
                document.body.appendChild(emoji);
                
                setTimeout(() => emoji.remove(), 1500);
            }, i * 100);
        }
    }
    
    // 添加食物动画CSS
    function addFoodAnimations() {
        if (document.getElementById('food-animations')) return;
        
        const style = document.createElement('style');
        style.id = 'food-animations';
        style.textContent = `
            @keyframes food-reveal {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes food-bounce {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-10px) scale(1.1); }
            }
            
            @keyframes food-celebrate {
                0% { transform: translateY(0) rotate(0deg) scale(0.5); opacity: 1; }
                100% { transform: translateY(-150px) rotate(360deg) scale(1.5); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 绑定事件
    function bindEvents() {
        elements.foodTags.forEach(tag => {
            tag.addEventListener('click', () => {
                selectType(tag.dataset.type);
            });
        });
        
        elements.decideBtn.addEventListener('click', decideFood);
    }
    
    // 模块初始化函数
    function init() {
        getElements();
        
        // 检查必要元素是否存在
        if (!elements.decideBtn) {
            console.warn('今天吃什么模块：未找到必要DOM元素，跳过初始化');
            return;
        }
        
        // 默认选中"全部"
        selectType('all');
        
        bindEvents();
        
        console.log('🍜 今天吃什么模块已加载！');
    }
    
    // 注册到模块系统
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('whatToEat', init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
