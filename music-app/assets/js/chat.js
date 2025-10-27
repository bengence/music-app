// AI Assistant Chat functionality
class AIAssistant {
    constructor() {
        this.elements = {
            chatInput: document.getElementById('chat-input'),
            chatSendBtn: document.getElementById('chat-send-btn'),
            chatMessages: document.getElementById('chat-messages'),
            geminiStatus: document.getElementById('gemini-status')
        };

        this.isGenerating = false;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.elements.chatSendBtn?.addEventListener('click', () => this.handleChat());
        
        this.elements.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isGenerating) {
                this.handleChat();
            }
        });
    }

    async handleChat() {
        // Check if API key is missing
        if (API_KEY === "") {
            this.updateStatus("API key is missing. Please configure your Gemini API key.");
            return;
        }

        if (this.isGenerating) return;
        
        const userQuery = this.elements.chatInput?.value.trim();
        if (!userQuery) return;

        this.isGenerating = true;
        this.elements.chatInput.value = '';
        this.elements.chatInput.disabled = true;
        this.elements.chatSendBtn.disabled = true;
        this.updateStatus('Thinking...');

        // Display user message
        this.appendMessage(userQuery, 'user');
        
        // Save user message to database
        if (window.dbManager && APP_STATE.isAuthenticated) {
            window.dbManager.saveChatMessage(userQuery, true);
        }
        
        // Prepare payload for Gemini
        const payload = {
            contents: [{ 
                parts: [{ 
                    text: `You are a helpful AI music assistant. Answer the following music-related question: ${userQuery}` 
                }] 
            }],
            generationConfig: { 
                temperature: 0.7, 
                maxOutputTokens: 500 
            }
        };

        try {
            const result = await callGeminiApi(payload);
            const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || 
                                 "I apologize, but I couldn't generate a response. Please try asking your question again.";
            
            this.appendMessage(generatedText, 'ai');
            
            // Save AI response to database
            if (window.dbManager && APP_STATE.isAuthenticated) {
                window.dbManager.saveChatMessage(userQuery, false, generatedText);
            }
            
            this.updateStatus('Ready to assist.');
        } catch (error) {
            this.appendMessage("I'm sorry, but I encountered an error while processing your request. Please check your connection and try again.", 'ai');
            this.updateStatus('Error occurred. Ready to try again.');
            console.error("Gemini Chat Error:", error);
        } finally {
            this.isGenerating = false;
            this.elements.chatInput.disabled = false;
            this.elements.chatSendBtn.disabled = false;
            this.elements.chatInput?.focus();
        }
    }

    appendMessage(text, sender) {
        if (!this.elements.chatMessages) return;

        const messageContainer = document.createElement('div');
        messageContainer.classList.add('flex', sender === 'user' ? 'chat-user' : 'chat-ai');
        
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('p-3', 'rounded-xl', 'max-w-xs', 'md:max-w-lg', 'whitespace-pre-wrap');
        
        if (sender === 'user') {
            messageBubble.classList.add('bg-gray-700', 'text-white', 'rounded-tr-none');
        } else {
            messageBubble.classList.add('bg-purple-600', 'text-white', 'rounded-tl-none');
            // Add typing animation for AI messages
            messageBubble.style.opacity = '0';
            messageBubble.style.transform = 'translateY(10px)';
            messageBubble.style.transition = 'all 0.3s ease-out';
        }

        // Convert markdown-style formatting to HTML
        const formattedText = this.formatMessage(text);
        messageBubble.innerHTML = formattedText;
        
        messageContainer.appendChild(messageBubble);
        this.elements.chatMessages.appendChild(messageContainer);
        
        // Animate AI message appearance
        if (sender === 'ai') {
            setTimeout(() => {
                messageBubble.style.opacity = '1';
                messageBubble.style.transform = 'translateY(0)';
            }, 100);
        }
        
        // Scroll to bottom
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    formatMessage(text) {
        // Convert basic markdown formatting
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>') // Code
            .replace(/\n/g, '<br>'); // Line breaks
        
        // Convert bullet points
        formatted = formatted.replace(/^- (.+)$/gm, '• $1');
        formatted = formatted.replace(/^\* (.+)$/gm, '• $1');
        
        return formatted;
    }

    updateStatus(message) {
        if (this.elements.geminiStatus) {
            this.elements.geminiStatus.textContent = message;
        }
    }

    clearChat() {
        if (this.elements.chatMessages) {
            this.elements.chatMessages.innerHTML = `
                <div class="flex chat-ai">
                    <div class="p-3 rounded-xl max-w-xs md:max-w-lg bg-purple-600 text-white rounded-tl-none">
                        Hello! I'm your AI music assistant. Ask me about music theory, practice techniques, or anything music-related!
                    </div>
                </div>
            `;
        }
    }
}