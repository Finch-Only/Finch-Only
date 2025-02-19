// 图片轮播功能
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    let currentSlide = 0;

    // 初始化第一张图片
    slides[0].classList.add('active');

    function showSlide(index) {
        // 移除所有幻灯片的active类
        slides.forEach(slide => slide.classList.remove('active'));
        
        // 确保索引在有效范围内
        currentSlide = (index + slides.length) % slides.length;
        
        // 显示当前幻灯片
        slides[currentSlide].classList.add('active');
    }

    // 下一张
    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    // 上一张
    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // 添加按钮事件监听
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);

    // 自动轮播
    setInterval(nextSlide, 5000);

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

// API配置
const config = {
    API_KEY: 'sk-79ec7f451ed244f8b43fc1f1704a92fd',
    API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
};

// 初始化 OpenAI 客户端
const chatMessages = document.querySelector('.chat-messages');
const chatInput = document.querySelector('.chat-input input');
const chatButton = document.querySelector('.chat-input button');
const presetButtons = document.querySelectorAll('.preset-questions button');

// 使用情况跟踪
let lastRequestTime = 0;
const usage = {
    dailyCount: 0,
    lastResetDate: new Date().toDateString()
};

// 从本地存储加载使用情况
function loadUsage() {
    const savedUsage = localStorage.getItem('ai_chat_usage');
    if (savedUsage) {
        const parsed = JSON.parse(savedUsage);
        if (parsed.lastResetDate !== new Date().toDateString()) {
            resetDailyCount();
        } else {
            usage.dailyCount = parsed.dailyCount;
            usage.lastResetDate = parsed.lastResetDate;
        }
    }
}

// 保存使用情况
function saveUsage() {
    localStorage.setItem('ai_chat_usage', JSON.stringify(usage));
}

// 重置每日计数
function resetDailyCount() {
    usage.dailyCount = 0;
    usage.lastResetDate = new Date().toDateString();
    saveUsage();
}

// 模拟回答库
const mockResponses = {
    default: [
        "让我来帮您解答这个问题。根据我的理解，这个问题涉及到几个关键点：\n1. 首先...\n2. 其次...\n3. 最后...",
        "这是一个很好的问题。从技术角度来看，我们需要考虑以下几个方面：\n- 实现可行性\n- 性能优化\n- 用户体验",
        "我认为这个问题可以这样解决：\n1. 先分析需求\n2. 设计解决方案\n3. 评估效果"
    ],
    "你是谁？": "我是一个AI助手，专门设计来帮助回答问题和解决问题。我可以：\n1. 回答各类问题\n2. 提供技术建议\n3. 帮助学习和研究\n4. 进行友好交流",
    "你能做什么？": "作为AI助手，我的主要功能包括：\n1. 回答技术问题\n2. 提供学习建议\n3. 帮助解决问题\n4. 讨论各种话题\n\n您有什么具体想了解的吗？",
    "如何联系你？": "您可以：\n1. 直接在这里输入问题\n2. 点击预设问题按钮\n3. 查看页面上的其他联系方式\n\n我会及时回复您的问题！"
};

// 发送消息函数
async function sendMessage(message) {
    appendMessage('user', message);
    
    try {
        const loadingMessage = appendMessage('ai', '正在思考...');
        
        // 使用 Axios 发送请求
        const response = await axios({
            method: 'POST',
            url: config.API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.API_KEY}`,
                'Access-Control-Allow-Origin': '*'
            },
            data: {
                model: "qwen-plus",
                messages: [
                    {
                        role: "system",
                        content: "你是一个友好的中文AI助手，请用简短、清晰的中文回答问题。"
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            }
        });

        loadingMessage.remove();
        
        if (response.data.choices && response.data.choices[0]?.message?.content) {
            appendMessage('ai', response.data.choices[0].message.content);
        } else {
            appendMessage('system', '抱歉，我现在无法回答这个问题。');
        }
    } catch (error) {
        console.error('Error details:', error);
        appendMessage('system', `抱歉，发生了错误：${error.response?.data?.error?.message || error.message}`);
        
        // 使用备用回答
        let mockResponse = mockResponses[message];
        if (!mockResponse) {
            mockResponse = mockResponses.default[Math.floor(Math.random() * mockResponses.default.length)];
        }
        appendMessage('ai', '(备用回答) ' + mockResponse);
    }
}

// 添加消息到聊天框
function appendMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// 事件监听
chatButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        sendMessage(message);
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = chatInput.value.trim();
        if (message) {
            sendMessage(message);
            chatInput.value = '';
        }
    }
});

// 预设问题按钮
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        sendMessage(button.textContent);
    });
});

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // ... 其他现有的初始化代码 ...
}); 