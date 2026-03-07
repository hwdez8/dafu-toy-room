/**
 * AI聊天模块 - DeepSeek API
 * 积木式架构 - 可独立删除或替换
 * 
 * 注意：此模块需要配合后端服务器使用，以保护API密钥
 * 开发环境使用本地代理，生产环境请配置相应的服务端点
 */

(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        // API端点配置
        // 开发环境：使用本地代理服务器
        // 生产环境：请替换为您的实际后端API端点
        apiEndpoint: '/api/chat',
        
        // 模型配置
        model: 'deepseek-chat',
        
        // 请求配置
        maxTokens: 1000,
        temperature: 0.7,
        
        // 系统提示词
        systemPrompt: `你是大福玩具房的AI助手，一个友好、活泼、有点调皮的AI小伙伴。
你的特点：
1. 说话风格轻松可爱，经常使用Emoji表情
2. 对用户的问题耐心解答，偶尔开个小玩笑
3. 当用户感到沮丧时，会给予鼓励
4. 对不知道的问题会诚实承认，不会编造
5. 保持回答简洁，通常不超过200字

请记住，你在"一只大福的玩具房"网站上，要营造温暖有趣的氛围！`
    };
    
    // 状态
    let state = {
        messages: [],
        isTyping: false
    };
    
    // DOM元素
    let elements = {};
    
    // 获取DOM元素
    function getElements() {
        elements = {
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn')
        };
    }
    
    // 添加消息到聊天界面
    function addMessage(content, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        let icon = '';
        if (type === 'user') {
            icon = '<i class="fas fa-user"></i>';
        } else if (type === 'ai') {
            icon = '<i class="fas fa-robot"></i>';
        }
        
        messageDiv.innerHTML = `
            ${icon}
            <span>${escapeHtml(content)}</span>
        `;
        
        elements.chatMessages.appendChild(messageDiv);
        scrollToBottom();
        
        // 保存到状态
        if (type !== 'system') {
            state.messages.push({
                role: type === 'user' ? 'user' : 'assistant',
                content: content
            });
            
            // 限制历史记录长度，避免超出token限制
            if (state.messages.length > 10) {
                state.messages = state.messages.slice(-10);
            }
        }
    }
    
    // HTML转义，防止XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 滚动到底部
    function scrollToBottom() {
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
    
    // 显示输入中动画
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        elements.chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }
    
    // 隐藏输入中动画
    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // 发送消息到AI
    async function sendMessage() {
        const message = elements.chatInput.value.trim();
        
        if (!message || state.isTyping) return;
        
        // 添加用户消息
        addMessage(message, 'user');
        elements.chatInput.value = '';
        
        // 显示输入中
        state.isTyping = true;
        showTypingIndicator();
        elements.sendBtn.disabled = true;
        
        try {
            // 准备请求数据
            const requestData = {
                model: CONFIG.model,
                messages: [
                    { role: 'system', content: CONFIG.systemPrompt },
                    ...state.messages.slice(-6) // 只保留最近6轮对话
                ],
                max_tokens: CONFIG.maxTokens,
                temperature: CONFIG.temperature,
                stream: false
            };
            
            // 发送请求到后端API
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            hideTypingIndicator();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const aiResponse = data.choices[0].message.content;
                addMessage(aiResponse, 'ai');
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            hideTypingIndicator();
            console.error('AI聊天错误:', error);
            
            // 显示错误消息
            const errorMessages = [
                '哎呀，AI小伙伴好像走神了 😅 请稍后再试~',
                '网络有点问题，大福正在修复 🔧',
                'AI暂时 unavailable，请检查网络连接 📡',
                '服务器开小差了，稍等片刻再试试 ⏰'
            ];
            addMessage(DafuToyRoom.Utils.randomChoice(errorMessages), 'ai');
        } finally {
            state.isTyping = false;
            elements.sendBtn.disabled = false;
            elements.chatInput.focus();
            
            // 记录统计
            recordStats();
        }
    }
    
    // 记录统计
    function recordStats() {
        if (window.Statistics && window.Statistics.recordModuleUsage) {
            window.Statistics.recordModuleUsage('aiChat');
        }
    }
    
    // 模拟AI回复（用于演示或API不可用时）
    function simulateAIResponse(userMessage) {
        const responses = [
            '喵~ 这个问题真有趣！让我想想... 🤔',
            '哈哈，你真会聊天！😄',
            '嗯嗯，我明白了！继续说吧 👂',
            '这个问题有点难，但我可以试试 💪',
            '哇，你问到了我的知识盲区，但我可以学！📚',
            '我觉得你说得很有道理！👍',
            '来，让大福给你讲个笑话放松一下 😄'
        ];
        
        // 根据关键词返回特定回复
        const lowerMsg = userMessage.toLowerCase();
        
        if (lowerMsg.includes('你好') || lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
            return '你好呀！欢迎来到大福的玩具房 🎉 有什么我可以帮你的吗？';
        }
        
        if (lowerMsg.includes('笑话') || lowerMsg.includes('搞笑')) {
            return '为什么程序员总是分不清圣诞节和万圣节？因为 31 OCT = 25 DEC！😄';
        }
        
        if (lowerMsg.includes('运势') || lowerMsg.includes('运气')) {
            return '运势这东西，信则有不信则无~ 不过我觉得你今天的运气一定不错！✨';
        }
        
        if (lowerMsg.includes('吃什么') || lowerMsg.includes('食物')) {
            return '说到吃的我就来劲了！要不要试试用上面的"今天吃什么"功能？🍜';
        }
        
        if (lowerMsg.includes('谢谢') || lowerMsg.includes('感谢')) {
            return '不客气呀！能帮到你我也很开心 😊 随时来找我聊天哦~';
        }
        
        if (lowerMsg.includes('再见') || lowerMsg.includes('拜拜')) {
            return '再见啦！记得常来玩哦 👋 大福随时欢迎你~';
        }
        
        // 默认随机回复
        return DafuToyRoom.Utils.randomChoice(responses);
    }
    
    // 绑定事件
    function bindEvents() {
        elements.sendBtn.addEventListener('click', sendMessage);
        
        elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // 自动调整输入框高度
        elements.chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
    
    // 模块初始化函数
    function init() {
        getElements();
        
        // 检查必要元素是否存在
        if (!elements.chatMessages || !elements.chatInput) {
            console.warn('AI聊天模块：未找到必要DOM元素，跳过初始化');
            return;
        }
        
        bindEvents();
        
        console.log('🤖 AI聊天模块已加载！');
        console.log('提示：请确保已配置后端API服务，否则AI功能将无法正常工作');
    }
    
    // 注册到模块系统
    if (window.DafuToyRoom && window.DafuToyRoom.ModuleRegistry) {
        window.DafuToyRoom.ModuleRegistry.register('aiChat', init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
