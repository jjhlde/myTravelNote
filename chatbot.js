/*
 * 채티플랜 - AI 여행 플래너 챗봇 JavaScript
 * Modern ES6+ implementation with state management
 */

// Load API key from config.js
// The API_KEY variable will be loaded from config.js script tag

// App Configuration
const APP_CONFIG = {
    backgrounds: [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop'
    ],
    typingDelay: 2000,
    sessionKey: 'chattyplan_session',
    userInfo: {
        name: '여행자',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop'
    },
    geminiAPI: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        temperature: 0.4,
        topP: 0.6,
        topK: 30
    }
};

// State Management
class AppState {
    constructor() {
        this.messageCount = 0;
        this.currentBgIndex = 0;
        this.isTyping = false;
        this.messages = [];
        this.sessionId = null;
        this.userName = APP_CONFIG.userInfo.name;
        this.isLoggedIn = true;
        this.currentSection = 'chat';
        
        // 3단계 여행 계획 시스템 상태
        this.currentStep = 1; // 1: 개요수집, 2: 상세계획, 3: PWA생성
        this.stepData = {}; // 단계간 데이터 전달
        this.progress = 0; // 진행률 (0-100)
        this.prompts = {}; // 로드된 프롬프트들
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    loadFromSession() {
        const saved = sessionStorage.getItem(APP_CONFIG.sessionKey);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                // Load session data (30분 내 데이터만)
                if (Date.now() - state.timestamp < 30 * 60 * 1000) {
                    this.messageCount = state.messageCount || 0;
                    this.currentBgIndex = state.currentBgIndex || 0;
                    this.messages = state.messages || [];
                    this.sessionId = state.sessionId;
                    
                    // 3단계 시스템 상태 복원
                    this.currentStep = state.currentStep || 1;
                    this.stepData = state.stepData || {};
                    this.progress = state.progress || 0;
                    
                    return true;
                }
            } catch (e) {
                console.error('Session data parsing error:', e);
            }
        }
        return false;
    }

    saveToSession() {
        const state = {
            messageCount: this.messageCount,
            currentBgIndex: this.currentBgIndex,
            messages: this.messages,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            
            // 3단계 시스템 상태 저장
            currentStep: this.currentStep,
            stepData: this.stepData,
            progress: this.progress
        };
        try {
            sessionStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify(state));
        } catch (e) {
            console.error('Session save error:', e);
        }
    }

    clearSession() {
        sessionStorage.removeItem(APP_CONFIG.sessionKey);
    }
}

// DOM Elements Management
class DOMManager {
    constructor() {
        this.elements = {
            chatContainer: document.getElementById('chat-container'),
            chatInput: document.getElementById('chat-input'),
            sendButton: document.getElementById('send-button'),
            mainContent: document.getElementById('main-content'),
            discoveryContainer: document.getElementById('discovery-container')
        };
    }

    get(elementId) {
        return this.elements[elementId] || document.getElementById(elementId);
    }

    addClass(element, className) {
        if (element) element.classList.add(className);
    }

    removeClass(element, className) {
        if (element) element.classList.remove(className);
    }

    toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    }
}

// Message Management
class MessageManager {
    constructor(appState, domManager) {
        this.appState = appState;
        this.dom = domManager;
    }

    createMessage(sender, text, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        if (isTyping) {
            messageDiv.innerHTML = `
                <div class="avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
        } else {
            const avatarSvg = sender === 'bot' 
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                   </svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                     <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                   </svg>`;

            messageDiv.innerHTML = `
                <div class="avatar">${avatarSvg}</div>
                <p>${this.escapeHtml(text)}</p>
            `;
        }
        
        return messageDiv;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addMessage(sender, text) {
        const message = this.createMessage(sender, text);
        const chatContainer = this.dom.get('chatContainer');
        
        if (chatContainer) {
            chatContainer.appendChild(message);
            this.scrollToBottom();
            
            // Save message to state
            this.appState.messages.push({ 
                sender, 
                text, 
                timestamp: Date.now() 
            });
            this.appState.saveToSession();
        }
    }

    addHTMLCard(htmlContent) {
        console.log('🎨 HTML 카드 추가:', htmlContent.substring(0, 100));
        
        const chatContainer = this.dom.get('chatContainer');
        if (!chatContainer) return;

        // 봇 메시지 형태로 HTML 카드 생성
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot');
        
        const avatarSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

        messageDiv.innerHTML = `
            <div class="avatar">${avatarSvg}</div>
            <div class="card-content">${htmlContent}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // 세션에 HTML 카드 저장 (단순화된 형태로)
        this.appState.messages.push({ 
            sender: 'bot', 
            text: '[여행계획 카드]', 
            timestamp: Date.now(),
            isCard: true
        });
        this.appState.saveToSession();
    }

    showTypingIndicator() {
        if (this.appState.isTyping) return;
        
        this.appState.isTyping = true;
        const typingMessage = this.createMessage('bot', '', true);
        typingMessage.id = 'typing-indicator';
        
        const chatContainer = this.dom.get('chatContainer');
        if (chatContainer) {
            chatContainer.appendChild(typingMessage);
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        this.appState.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const mainContent = this.dom.get('mainContent');
        if (mainContent) {
            setTimeout(() => {
                mainContent.scrollTop = mainContent.scrollHeight;
            }, 100);
        }
    }

    restoreMessages() {
        const chatContainer = this.dom.get('chatContainer');
        if (!chatContainer) return;

        // Clear existing messages except the initial ones
        const existingMessages = chatContainer.querySelectorAll('.message');
        existingMessages.forEach(msg => {
            if (!msg.dataset.initial) {
                msg.remove();
            }
        });

        // Restore from session
        this.appState.messages.forEach(msg => {
            const messageDiv = this.createMessage(msg.sender, msg.text);
            chatContainer.appendChild(messageDiv);
        });

        if (this.appState.messages.length > 0) {
            this.scrollToBottom();
        }
    }
}

// Gemini API Service
class GeminiAPIService {
    constructor() {
        // Load API key from global variable set by config.js
        this.apiKey = typeof API_KEY !== 'undefined' ? API_KEY : '';
        this.baseURL = APP_CONFIG.geminiAPI.baseURL;
        this.systemPrompt = null;
        
        console.log('🔑 API 키 상태:', this.apiKey ? '✅ 로드됨' : '❌ 누락');
        console.log('🌐 API URL:', this.baseURL);
        
        this.loadSystemPrompt();
    }

    async loadSystemPrompt() {
        try {
            const response = await fetch('./prompt2.txt');
            if (response.ok) {
                this.systemPrompt = await response.text();
                console.log('✅ 시스템 프롬프트 로드 완료');
            } else {
                console.warn('⚠️ prompt2.txt 파일을 찾을 수 없습니다.');
                this.systemPrompt = this.getDefaultPrompt();
            }
        } catch (error) {
            console.error('❌ 시스템 프롬프트 로드 실패:', error);
            this.systemPrompt = this.getDefaultPrompt();
        }
    }

    getDefaultPrompt() {
        return `당신은 20년 경력의 글로벌 여행 플래너입니다. 사용자의 요청에 따라 간결하고 실용적인 여행 계획을 JSON 형식으로 제공해주세요.

**중요: 응답은 반드시 완전한 JSON 형식이어야 하며, 간결하게 작성해주세요.**

응답 형식:
{
  "status": "success" | "need_info",
  "trip_info": {
    "title": "여행 제목",
    "duration": 숫자,
    "start_date": "YYYY-MM-DD",
    "destination": "목적지"
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD", 
      "theme": "그날의 테마",
      "activities": [
        {
          "start_time": "HH:MM",
          "end_time": "HH:MM",
          "title": "활동명",
          "location": "장소명",
          "description": "간단한 설명"
        }
      ]
    }
  ],
  "total_summary": {
    "total_estimated_budget_per_person": "금액",
    "summary_comment": "간단한 요약"
  }
}

**간단한 여행 요청의 경우 최대 2-3일 정도로 제한하여 응답해주세요.**
정보가 부족하면 "status": "need_info"와 "ask": ["질문1", "질문2"] 형식으로 응답하세요.`;
    }

    buildPrompt(userInput, conversationHistory = []) {
        // 간결한 프롬프트로 토큰 절약
        const prompt = `${this.systemPrompt}

사용자 요청: ${userInput}

JSON 응답:`;
        
        console.log('📝 최종 프롬프트 길이:', prompt.length);
        return prompt;
    }

    async generateTravelPlan(userInput, conversationHistory = []) {
        if (!this.apiKey) {
            throw new Error('API 키가 설정되지 않았습니다. config.js를 확인해주세요.');
        }

        const prompt = this.buildPrompt(userInput, conversationHistory);
        
        console.log('🚀 Gemini API 호출 시작...');
        console.log('📝 프롬프트:', prompt.substring(0, 200) + '...');

        try {
            const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: APP_CONFIG.geminiAPI.temperature,
                        topP: APP_CONFIG.geminiAPI.topP,
                        topK: APP_CONFIG.geminiAPI.topK,
                        maxOutputTokens: 18000
                    }
                })
            });

            console.log('📡 HTTP 응답 상태:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ API 응답 오류:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });
                throw new Error(`API 호출 실패: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            console.log('✅ Gemini API 응답 받음:', data);
            console.log('📊 응답 키 목록:', Object.keys(data));

            return this.parseResponse(data);

        } catch (error) {
            console.error('❌ Gemini API 호출 오류:', error);
            throw error;
        }
    }

    parseResponse(apiResponse) {
        try {
            console.log('🔍 API 응답 구조 확인:', apiResponse);
            
            // API 응답 구조 검증
            if (!apiResponse) {
                throw new Error('API 응답이 비어있습니다.');
            }

            if (!apiResponse.candidates || !Array.isArray(apiResponse.candidates) || apiResponse.candidates.length === 0) {
                console.error('❌ Candidates 배열이 없거나 비어있음:', apiResponse);
                throw new Error('API 응답에서 후보를 찾을 수 없습니다.');
            }

            const candidate = apiResponse.candidates[0];
            console.log('🔍 Candidate 구조:', candidate);
            
            if (!candidate || !candidate.content) {
                console.error('❌ 잘못된 candidate 구조:', candidate);
                throw new Error('API 응답의 content가 없습니다.');
            }

            // Gemini API 응답 구조 변화에 대응
            let textContent = '';
            
            if (candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
                // 기존 구조: content.parts[0].text
                textContent = candidate.content.parts[0].text;
            } else if (candidate.content.text) {
                // 새로운 구조: content.text 직접 접근
                textContent = candidate.content.text;
            } else if (typeof candidate.content === 'string') {
                // 문자열 직접 반환
                textContent = candidate.content;
            } else {
                console.error('❌ 텍스트 내용을 찾을 수 없음:', candidate.content);
                throw new Error('API 응답에서 텍스트 내용을 찾을 수 없습니다.');
            }

            if (!textContent) {
                console.error('❌ 빈 텍스트 내용:', textContent);
                throw new Error('API 응답에 텍스트 내용이 없습니다.');
            }

            // MAX_TOKENS로 잘린 경우 경고
            if (candidate.finishReason === 'MAX_TOKENS') {
                console.warn('⚠️ 응답이 최대 토큰 수에 도달하여 잘렸습니다.');
                console.warn('📊 토큰 사용량:', {
                    promptTokens: apiResponse.usageMetadata?.promptTokenCount,
                    candidatesTokens: apiResponse.usageMetadata?.candidatesTokenCount,
                    totalTokens: apiResponse.usageMetadata?.totalTokenCount,
                    maxOutputTokens: 18000
                });
            }

            console.log('📄 AI 응답 텍스트 길이:', textContent.length);
            console.log('📄 AI 응답 시작 부분:', textContent.substring(0, 500));

            // ```json 마크다운 코드 블록 제거
            let cleanText = textContent;
            if (cleanText.includes('```json')) {
                const jsonStart = cleanText.indexOf('```json') + 7;
                const jsonEnd = cleanText.lastIndexOf('```');
                if (jsonEnd > jsonStart) {
                    cleanText = cleanText.substring(jsonStart, jsonEnd).trim();
                } else {
                    // 닫는 ``` 없는 경우
                    cleanText = cleanText.substring(jsonStart).trim();
                }
                console.log('🧹 마크다운 코드 블록 제거 완료');
            }

            // JSON 추출 및 복구 시도
            const jsonResult = this.extractAndFixJSON(cleanText);
            
            if (!jsonResult.success) {
                // JSON 추출 실패 시 일반 텍스트 응답으로 처리
                return {
                    status: 'text_response',
                    message: textContent.length > 1000 ? 
                        textContent.substring(0, 1000) + '...' : 
                        textContent
                };
            }

            const parsedData = jsonResult.data;
            console.log('✅ JSON 파싱 성공:', parsedData);
            
            // 응답 검증
            this.validateResponse(parsedData);
            
            return parsedData;

        } catch (error) {
            console.error('❌ 응답 파싱 오류:', error);
            
            // 파싱 실패 시 fallback 응답
            return {
                status: 'parse_error',
                message: '응답이 너무 길거나 형식이 완전하지 않아서 처리 중이에요. 조금 더 간단하게 요청해주시거나 다시 시도해주세요! 😊',
                raw_response: apiResponse
            };
        }
    }

    extractAndFixJSON(text) {
        try {
            // 1차: 완전한 JSON 찾기
            const completeJsonMatch = text.match(/\{[\s\S]*?\}(?=\s*$|\s*[^}])/);
            if (completeJsonMatch) {
                try {
                    const data = JSON.parse(completeJsonMatch[0]);
                    return { success: true, data };
                } catch (e) {
                    console.log('완전한 JSON 파싱 실패, 부분 JSON 시도...');
                }
            }

            // 2차: 모든 중괄호 블록 찾기
            const allJsonBlocks = text.match(/\{[\s\S]*\}/g);
            if (allJsonBlocks) {
                for (const block of allJsonBlocks) {
                    try {
                        const data = JSON.parse(block);
                        if (data.status) { // 올바른 구조인지 확인
                            return { success: true, data };
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }

            // 3차: JSON 수동 복구 시도
            const jsonStart = text.indexOf('{');
            if (jsonStart !== -1) {
                let jsonText = text.substring(jsonStart);
                
                // 마지막 완전한 객체까지만 자르기
                const fixedJson = this.fixIncompleteJSON(jsonText);
                if (fixedJson) {
                    try {
                        const data = JSON.parse(fixedJson);
                        console.log('🔧 JSON 복구 성공');
                        return { success: true, data };
                    } catch (e) {
                        console.log('JSON 복구 실패:', e.message);
                    }
                }
            }

            return { success: false };

        } catch (error) {
            console.error('JSON 추출 오류:', error);
            return { success: false };
        }
    }

    fixIncompleteJSON(jsonText) {
        try {
            // 기본적인 JSON 구조 확인 및 수정
            let fixed = jsonText.trim();
            
            // 열린 중괄호와 닫힌 중괄호 개수 확인
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;
            
            // 닫는 중괄호가 부족한 경우 추가
            if (openBraces > closeBraces) {
                const missingBraces = openBraces - closeBraces;
                fixed += '}}'.repeat(missingBraces);
            }

            // 마지막 콤마 제거
            fixed = fixed.replace(/,\s*}/g, '}');
            fixed = fixed.replace(/,\s*]/g, ']');

            // 잘린 속성 제거 (마지막 불완전한 줄)
            const lines = fixed.split('\n');
            let validLines = [];
            let inString = false;
            let braceCount = 0;

            for (const line of lines) {
                let isValidLine = true;
                
                for (const char of line) {
                    if (char === '"' && !inString) inString = true;
                    else if (char === '"' && inString) inString = false;
                    else if (!inString && char === '{') braceCount++;
                    else if (!inString && char === '}') braceCount--;
                }

                // 마지막 줄이 불완전하면 제외
                if (line.trim() && !line.includes(':') && !line.includes('}') && !line.includes(']')) {
                    isValidLine = false;
                }

                if (isValidLine) {
                    validLines.push(line);
                }
            }

            fixed = validLines.join('\n');
            
            // 최종 검증
            JSON.parse(fixed);
            return fixed;

        } catch (error) {
            console.log('JSON 수정 실패:', error.message);
            return null;
        }
    }

    validateResponse(data) {
        if (!data.status) {
            throw new Error('응답에 status 필드가 없습니다.');
        }

        if (data.status === 'success') {
            // 유연한 필드 검증 - trip_info 객체가 있거나, 개별 필드들이 있으면 OK
            const hasTrip_info = data.trip_info;
            const hasIndividualFields = data.destination || data.trip_name || data.duration;
            
            if (!hasTrip_info && !hasIndividualFields) {
                throw new Error('성공 응답에 여행 정보 필드가 없습니다.');
            }
            
            // days 필드 검증 - 더 유연하게
            if (!data.days && !data.daily_itinerary && !data.itinerary) {
                console.warn('⚠️ 일정 정보가 없지만, 다른 형식일 수 있으므로 통과시킵니다.');
            }
            
            // days가 있으면 배열인지 확인
            if (data.days && (!Array.isArray(data.days) || data.days.length === 0)) {
                throw new Error('days 필드가 올바르지 않습니다.');
            }
        }

        if (data.status === 'need_info') {
            if (!data.ask || !Array.isArray(data.ask)) {
                throw new Error('정보 요청 응답에 ask 필드가 없습니다.');
            }
        }

        return true;
    }
}

// Response Validator
class ResponseValidator {
    static validateTripData(data) {
        const required = ['trip_info', 'days'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            throw new Error(`필수 필드 누락: ${missing.join(', ')}`);
        }
        
        // 각 day 데이터 검증
        data.days.forEach((day, index) => {
            if (!day.activities || !Array.isArray(day.activities)) {
                throw new Error(`${index + 1}일차에 activities가 없습니다.`);
            }
        });
        
        return true;
    }
}

// AI Response System
class AIResponseManager {
    constructor(messageManager) {
        this.messageManager = messageManager;
        this.geminiAPI = new GeminiAPIService();
        this.conversationHistory = [];
        
        this.responses = {
            welcome: [
                "안녕하세요! 어떤 여행을 꿈꾸시나요? 자유롭게 물어보세요! 🌍",
                "환영합니다! 오늘은 어디로 떠나볼까요? 🗺️",
                "안녕하세요! 특별한 여행 계획을 함께 만들어보세요! ✈️"
            ],
            loading: [
                "🤔 여행 계획을 분석하고 있어요...",
                "✈️ 최고의 여행지를 찾고 있어요...",
                "🗺️ 맞춤형 일정을 만들고 있어요...",
                "🎯 완벽한 루트를 설계하고 있어요..."
            ]
        };
    }

    async generateResponse(userMessage, messageCount) {
        try {
            // 대화 히스토리에 사용자 메시지 추가
            this.conversationHistory.push({
                sender: 'user',
                text: userMessage,
                timestamp: Date.now()
            });

            console.log('🎯 AI 응답 생성 시작:', userMessage);
            
            // Gemini API 호출
            const aiResponse = await this.geminiAPI.generateTravelPlan(
                userMessage, 
                this.conversationHistory
            );

            console.log('📊 AI 응답 데이터:', aiResponse);

            let responseMessage = '';
            
            // 응답 타입에 따른 처리
            switch (aiResponse.status) {
                case 'success':
                    responseMessage = this.handleSuccessResponse(aiResponse);
                    break;
                
                case 'need_info':
                    responseMessage = this.handleInfoRequest(aiResponse);
                    break;
                
                case 'text_response':
                    responseMessage = aiResponse.message;
                    break;
                
                case 'parse_error':
                    responseMessage = "죄송해요, 응답을 처리하는 중 문제가 발생했어요. 다시 한 번 말씀해주시겠어요? 🤔";
                    break;
                
                default:
                    responseMessage = "흥미로운 질문이네요! 더 자세히 알려주시면 완벽한 여행 계획을 만들어드릴게요! ✨";
            }

            // 대화 히스토리에 AI 응답 추가
            this.conversationHistory.push({
                sender: 'bot',
                text: responseMessage,
                timestamp: Date.now(),
                data: aiResponse
            });

            return responseMessage;

        } catch (error) {
            console.error('❌ AI 응답 생성 오류:', error);
            
            // 에러 메시지를 사용자 친화적으로 변환
            if (error.message.includes('API 키')) {
                return "죄송해요, 서비스 설정에 문제가 있어요. 잠시 후 다시 시도해주세요. 🔧";
            } else if (error.message.includes('API 호출 실패')) {
                return "네트워크 연결에 문제가 있는 것 같아요. 잠시 후 다시 시도해주세요. 🌐";
            } else {
                return "일시적인 문제가 발생했어요. 다시 한 번 말씀해주시겠어요? 😅";
            }
        }
    }

    handleSuccessResponse(aiResponse) {
        // 성공적인 여행 계획 응답 처리 - 유연한 필드 지원
        const tripInfo = aiResponse.trip_info || aiResponse;
        const title = tripInfo.title || aiResponse.trip_name || '여행 계획';
        const destination = tripInfo.destination || aiResponse.destination || '목적지';
        const duration = tripInfo.duration || aiResponse.duration || '';
        const totalDays = aiResponse.days?.length || (duration.includes('박') ? parseInt(duration) + 1 : 1);
        
        console.log('🎉 여행 계획 생성 완료!', {
            title: title,
            duration: totalDays,
            destination: destination,
            rawData: aiResponse
        });

        // UI에 JSON 데이터 표시 (개발자 도구에서 확인 가능)
        this.displayTripData(aiResponse);

        const startDate = tripInfo.start_date || aiResponse.start_date || '여행 일정';
        const budget = aiResponse.total_summary?.total_estimated_budget_per_person || 
                      aiResponse.estimated_budget_per_person_per_day || 
                      aiResponse.budget || '계산 중...';

        const responseMessage = `🎉 완벽한 ${title} 계획이 완성됐어요!

📍 **${destination}** ${duration || totalDays + '일'} 여행
🗓️ ${startDate}
💰 예상 비용: ${budget}

${aiResponse.total_summary?.summary_comment || aiResponse.summary_comment || '멋진 여행이 될 거예요!'}

💡 이 계획이 마음에 드시나요? 아래 버튼을 눌러 나만의 여행앱을 생성하세요!`;

        // 여행앱 생성 버튼을 메시지와 함께 표시
        setTimeout(() => {
            this.showTravelAppButton(aiResponse);
        }, 1000);

        return responseMessage;
    }

    handleInfoRequest(aiResponse) {
        // 추가 정보 요청 응답 처리
        const questions = aiResponse.ask || [];
        
        let responseMessage = "더 완벽한 여행 계획을 위해 몇 가지만 더 알려주세요! 😊\n\n";
        
        questions.forEach((question, index) => {
            responseMessage += `${index + 1}. ${question}\n`;
        });
        
        responseMessage += "\n자유롭게 답변해주시면 맞춤형 계획을 만들어드릴게요! ✨";
        
        return responseMessage;
    }

    displayTripData(tripData) {
        // 브라우저 콘솔과 UI에 여행 데이터 표시
        console.group('🌟 생성된 여행 계획 데이터');
        console.log('📋 기본 정보:', tripData.trip_info);
        console.log('📅 일정 데이터:', tripData.days);
        console.log('💰 예산 정보:', tripData.total_summary);
        console.log('🔗 전체 JSON:', tripData);
        console.groupEnd();

        // UI에도 표시 (개발용)
        this.showDataPreview(tripData);
    }

    showDataPreview(tripData) {
        // 개발자가 데이터를 확인할 수 있도록 UI에 간단히 표시
        const previewElement = document.createElement('div');
        previewElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            max-width: 300px;
            z-index: 1000;
            cursor: pointer;
        `;
        
        previewElement.innerHTML = `
            <div><strong>🎯 생성된 데이터</strong></div>
            <div>제목: ${tripData.trip_info?.title || 'N/A'}</div>
            <div>기간: ${tripData.days?.length || 0}일</div>
            <div>상태: ${tripData.status}</div>
            <div style="margin-top: 5px; font-size: 10px;">클릭하면 콘솔에서 전체 데이터 확인</div>
        `;
        
        previewElement.onclick = () => {
            console.log('📊 전체 여행 데이터:', tripData);
            previewElement.remove();
        };
        
        document.body.appendChild(previewElement);
        
        // 10초 후 자동 제거
        setTimeout(() => {
            if (previewElement.parentNode) {
                previewElement.remove();
            }
        }, 10000);
    }

    showTravelAppButton(aiResponse) {
        // 여행앱 생성 버튼을 채팅창에 추가
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer) return;

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('travel-app-button-container');
        buttonContainer.style.cssText = `
            margin: 20px 0;
            text-align: center;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
        `;

        // UTF-8 안전한 인코딩을 위해 데이터를 임시 저장
        const dataKey = 'tempTravelData_' + Date.now();
        window[dataKey] = aiResponse;

        buttonContainer.innerHTML = `
            <div class="travel-app-card" onclick="generateTravelApp('${dataKey}')">
                <div class="app-card-header">
                    <div class="app-card-icon">📱</div>
                    <div class="app-card-title">나만의 여행앱 생성하기</div>
                </div>
                <div class="app-card-features">
                    <div class="feature-item">
                        <span class="feature-icon">📅</span>
                        <span class="feature-text">일정 관리</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">💰</span>
                        <span class="feature-text">예산 추적</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✅</span>
                        <span class="feature-text">할일 체크</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🌐</span>
                        <span class="feature-text">오프라인 사용</span>
                    </div>
                </div>
                <div class="app-card-action">
                    <span class="action-text">클릭하여 앱 생성</span>
                    <span class="action-arrow">→</span>
                </div>
            </div>
        `;

        chatContainer.appendChild(buttonContainer);

        // 애니메이션 효과
        setTimeout(() => {
            buttonContainer.style.opacity = '1';
            buttonContainer.style.transform = 'translateY(0)';
        }, 100);

        // 채팅창 스크롤
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 600);
    }

    getRandomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

// Background Management
class BackgroundManager {
    constructor() {
        this.backgroundElement = document.querySelector('.background-blur');
    }

    setBackground(index) {
        if (this.backgroundElement && APP_CONFIG.backgrounds[index]) {
            this.backgroundElement.style.backgroundImage = `url('${APP_CONFIG.backgrounds[index]}')`;
        }
    }

    setRandomBackground() {
        const randomIndex = Math.floor(Math.random() * APP_CONFIG.backgrounds.length);
        this.setBackground(randomIndex);
        return randomIndex;
    }
}

// Event Management
class EventManager {
    constructor(appState, domManager, messageManager, aiResponseManager, tripPlanningManager) {
        this.appState = appState;
        this.dom = domManager;
        this.messageManager = messageManager;
        this.aiResponseManager = aiResponseManager;
        this.tripPlanningManager = tripPlanningManager;
    }

    initialize() {
        this.setupChatEvents();
        this.setupUIEvents();
        this.setupKeyboardEvents();
    }

    setupChatEvents() {
        const chatInput = this.dom.get('chatInput');
        const sendButton = this.dom.get('sendButton');

        if (sendButton) {
            sendButton.addEventListener('click', () => this.handleSendMessage());
        }

        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            chatInput.addEventListener('input', (e) => {
                const isEmpty = e.target.value.trim() === '';
                if (sendButton) {
                    sendButton.disabled = isEmpty || this.appState.isTyping;
                }
            });
        }
    }

    setupUIEvents() {
        // Discovery container interactions
        const discoveryContainer = this.dom.get('discoveryContainer');
        if (discoveryContainer) {
            discoveryContainer.addEventListener('click', (e) => {
                this.handleDiscoveryClick(e);
            });
        }

        // Profile icon click
        const profileIcon = document.querySelector('.profile-icon img');
        if (profileIcon) {
            profileIcon.addEventListener('click', () => {
                this.messageManager.addMessage('bot', '👋 프로필 설정 기능은 곧 추가될 예정입니다!');
            });
        }
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // ESC key for clearing focus
            if (e.key === 'Escape') {
                const chatInput = this.dom.get('chatInput');
                if (chatInput) chatInput.blur();
            }
        });
    }

    async handleSendMessage() {
        const chatInput = this.dom.get('chatInput');
        if (!chatInput) return;

        const messageText = chatInput.value.trim();
        if (messageText === '' || this.appState.isTyping) return;

        // Add user message
        this.messageManager.addMessage('user', messageText);
        chatInput.value = '';
        this.appState.messageCount++;

        // Update send button state
        const sendButton = this.dom.get('sendButton');
        if (sendButton) sendButton.disabled = true;

        // Show typing indicator
        this.messageManager.showTypingIndicator();

        try {
            // 3단계 여행 계획 시스템 사용
            const botResponse = await this.tripPlanningManager.processStepResponse(messageText);
            
            // Hide typing indicator and show response
            setTimeout(() => {
                this.messageManager.hideTypingIndicator();
                this.messageManager.addMessage('bot', botResponse);

                // Re-enable send button
                if (sendButton) sendButton.disabled = false;
                
                // 세션 저장
                this.appState.saveToSession();
            }, 500); // 짧은 지연으로 자연스러운 전환

        } catch (error) {
            console.error('❌ 메시지 처리 오류:', error);
            
            // Error handling
            setTimeout(() => {
                this.messageManager.hideTypingIndicator();
                this.messageManager.addMessage('bot', '죄송해요, 일시적인 문제가 발생했어요. 다시 시도해주세요! 😅');

                // Re-enable send button
                if (sendButton) sendButton.disabled = false;
            }, 500);
        }
    }

    handleDiscoveryClick(e) {
        const card = e.target.closest('.recommendation-card, .plan-card, .tip-card');
        if (!card) return;

        e.preventDefault();

        if (card.classList.contains('recommendation-card')) {
            this.messageManager.addMessage('bot', '🗾 도쿄 가족여행 계획을 분석하고 있어요! 아이들이 좋아할 만한 특별한 장소들을 찾아드릴게요.');
        } else if (card.classList.contains('plan-card')) {
            const title = card.querySelector('h5')?.textContent || '여행 계획';
            this.messageManager.addMessage('bot', `✨ ${title}에 대한 상세한 정보를 준비해드릴게요! 맞춤형 일정을 만들어드릴게요.`);
        } else if (card.classList.contains('tip-card')) {
            this.messageManager.addMessage('bot', '💡 좋은 팁이죠! 더 많은 여행 노하우를 알려드릴까요? 궁금한 것이 있으면 언제든 물어보세요!');
        }
    }
}

// 3단계 여행 계획 시스템 관리 클래스
class TripPlanningManager {
    constructor(appState, messageManager, aiResponseManager) {
        this.appState = appState;
        this.messageManager = messageManager;
        this.aiResponseManager = aiResponseManager;
        this.prompts = {};
        this.placeService = new PlaceEnrichmentService(); // Places API 서비스 추가
    }

    async initialize() {
        await this.loadPrompts();
        console.log('🚀 3단계 여행 계획 시스템 초기화 완료');
    }

    async loadPrompts() {
        console.log('📋 프롬프트 로딩 시작...');
        
        const promptFiles = [
            'first_step.txt',
            'second_step.txt', 
            'third_step.txt'
        ];

        for (const file of promptFiles) {
            try {
                const response = await fetch(`./prompts/${file}`);
                if (response.ok) {
                    const content = await response.text();
                    const stepName = file.replace('.txt', '');
                    this.prompts[stepName] = content;
                    console.log(`✅ ${file} 로드 완료`);
                } else {
                    console.error(`❌ ${file} 로드 실패:`, response.status);
                }
            } catch (error) {
                console.error(`❌ ${file} 로드 오류:`, error);
            }
        }

        this.appState.prompts = this.prompts;
        console.log('📁 모든 프롬프트 로드 완료:', Object.keys(this.prompts));
    }

    getCurrentStepPrompt() {
        const stepNames = ['first_step', 'second_step', 'third_step'];
        const currentStepName = stepNames[this.appState.currentStep - 1];
        return this.prompts[currentStepName] || '';
    }

    updateProgress() {
        const progressMap = { 1: 33, 2: 66, 3: 100 };
        this.appState.progress = progressMap[this.appState.currentStep] || 0;
        this.displayProgress();
    }

    displayProgress() {
        // 진행률 표시 UI 업데이트 (나중에 구현)
        const progressElement = document.querySelector('.progress-indicator');
        if (progressElement) {
            progressElement.style.width = `${this.appState.progress}%`;
        }
        
        console.log(`📊 진행률: ${this.appState.progress}% (${this.appState.currentStep}/3 단계)`);
    }

    async processStepResponse(userMessage) {
        console.log(`🎯 ${this.appState.currentStep}단계 처리 시작:`, userMessage);
        
        const stepPrompt = this.getCurrentStepPrompt();
        if (!stepPrompt) {
            console.error('❌ 해당 단계의 프롬프트를 찾을 수 없습니다');
            return '죄송합니다. 시스템 오류가 발생했습니다.';
        }

        try {
            // 단계별 처리
            switch (this.appState.currentStep) {
                case 1:
                    return await this.processStep1(userMessage, stepPrompt);
                case 2:
                    return await this.processStep2(userMessage, stepPrompt);
                case 3:
                    return await this.processStep3(userMessage, stepPrompt);
                default:
                    return '알 수 없는 단계입니다.';
            }
        } catch (error) {
            console.error('❌ 단계 처리 오류:', error);
            return '처리 중 오류가 발생했습니다. 다시 시도해주세요.';
        }
    }

    async processStep1(userMessage, prompt) {
        console.log('📋 1단계: 여행 개요 수집 처리');
        
        // 1단계 프롬프트와 사용자 메시지로 AI 호출
        const messages = this.buildConversationHistory();
        messages.push({ role: 'user', content: userMessage });

        const response = await this.callGeminiAPI(prompt, messages);
        
        // JSON 응답 확인
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                const stepData = JSON.parse(jsonMatch[1]);
                console.log('✅ 1단계 JSON 파싱 성공:', stepData);
                
                // 단계 데이터 저장
                this.appState.stepData.step1 = stepData;
                
                // 1단계 완료되면 자동으로 2단계 진행
                this.appState.currentStep = 2;
                this.updateProgress();
                this.appState.saveToSession();
                
                // 2단계 자동 호출
                console.log('🔄 2단계 자동 진행 시작...');
                const step2Response = await this.processStep2AutoCall();
                
                // 2단계에서 카드가 이미 추가되었으므로 1단계 메시지만 반환
                if (step2Response) {
                    return stepData.userMessage + '\n\n' + step2Response;
                } else {
                    return stepData.userMessage; // 카드는 이미 추가됨
                }
            } catch (error) {
                console.error('❌ JSON 파싱 오류:', error);
                return response; // JSON이 아닌 경우 그대로 반환
            }
        }
        
        return response;
    }

    async processStep2(userMessage, prompt) {
        console.log('🗓️ 2단계: 상세 여행계획 수립 처리');
        
        const step1Data = this.appState.stepData.step1;
        if (!step1Data) {
            console.error('❌ 1단계 데이터가 없습니다');
            return '1단계 데이터가 없습니다. 처음부터 다시 시작해주세요.';
        }

        // 2단계 프롬프트에 1단계 데이터 추가
        const fullPrompt = prompt + '\n\n[INPUT]\n' + JSON.stringify(step1Data.systemData, null, 2);
        
        const response = await this.callGeminiAPI(fullPrompt, []);
        
        // 2단계는 JSON + 요약 응답을 파싱
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                const travelData = JSON.parse(jsonMatch[1]);
                console.log('✅ 2단계 JSON 파싱 성공:', travelData);
                
                // 상세 여행 데이터 저장
                this.appState.stepData.step2 = travelData;
                
                // 3단계로 진행
                this.appState.currentStep = 3;
                this.updateProgress();
                this.appState.saveToSession();
                
                // 요약 메시지 추출 (JSON 이외 부분)
                const summaryMessage = response.replace(/```json[\s\S]*?```/, '').trim();
                
                return summaryMessage + '\n\n🚀 PWA 앱을 생성하겠습니다!';
            } catch (error) {
                console.error('❌ 2단계 JSON 파싱 오류:', error);
                return response;
            }
        }
        
        return response;
    }

    async processStep2AutoCall() {
        console.log('🗓️ 2단계: 자동 호출 - 상세 여행계획 생성');
        
        const step1Data = this.appState.stepData.step1;
        if (!step1Data) {
            console.error('❌ 1단계 데이터가 없습니다');
            return '오류가 발생했습니다. 다시 시도해주세요.';
        }

        try {
            // 2단계 프롬프트 로드 (currentStep이 이미 2로 설정됨)
            const step2Prompt = this.prompts['second_step'];
            if (!step2Prompt) {
                console.error('❌ 2단계 프롬프트가 로드되지 않았습니다');
                return '프롬프트 로딩 오류가 발생했습니다.';
            }

            // 2단계 프롬프트에 1단계 데이터 추가
            const fullPrompt = step2Prompt + '\n\n[INPUT]\n' + JSON.stringify(step1Data.systemData, null, 2);
            
            // AI 호출
            const response = await this.callGeminiAPI(fullPrompt, []);
            
            // JSON 파싱 시도
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const travelPlanData = JSON.parse(jsonMatch[0]);
                    console.log('✅ 2단계 JSON 파싱 성공:', travelPlanData);
                    
                    // Places API로 장소 정보 보강
                    console.log('🔄 Places API로 장소 데이터 보강 중...');
                    const enrichedData = await this.placeService.enrichTravelData(travelPlanData);
                    console.log('✅ Places API 데이터 보강 완료:', enrichedData);
                    
                    // 🆕 테스트용 JSON 파일 생성
                    console.log('📁 테스트용 JSON 파일 생성 중...');
                    const savedFileName = await this.placeService.saveToJsonFile(enrichedData);
                    if (savedFileName) {
                        console.log(`✅ JSON 파일 저장 완료: ${savedFileName}`);
                    }
                    
                    // 보강된 데이터로 2단계 데이터 저장
                    this.appState.stepData.step2 = enrichedData;
                    this.appState.progress = 67;
                    this.updateProgress();
                    this.appState.saveToSession();
                    
                    // 카드형 UI 생성 (메시지 직접 추가되므로 null 반환)
                    this.generateTravelPlanCard(enrichedData);
                    return null; // 메시지는 이미 추가됨
                    
                } catch (error) {
                    console.error('❌ 2단계 JSON 파싱 오류:', error);
                    return '계획 생성은 완료되었지만 형식 오류가 발생했습니다.';
                }
            }
            
            return '🔄 계획을 생성하고 있습니다...';
            
        } catch (error) {
            console.error('❌ 2단계 자동 호출 오류:', error);
            return '계획 생성 중 오류가 발생했습니다. 다시 시도해주세요.';
        }
    }

    generateTravelPlanCard(travelData) {
        console.log('🎨 여행계획 카드 생성:', travelData);
        
        const tripMeta = travelData.tripMeta || {};
        const mainPlan = travelData.mainPlan || {};
        const budgetBreakdown = travelData.budgetBreakdown || {};
        const essentialInfo = travelData.essentialInfo || {};
        
        // 텍스트 메시지 먼저 추가
        this.messageManager.addMessage('bot', '🎉 맞춤 여행계획이 완성되었습니다!\n\n📁 테스트용 JSON 파일이 자동으로 다운로드됩니다.');
        
        // 카드 HTML 생성
        const cardHtml = `
        <div class="travel-plan-card" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 25px;
            margin: 20px 0;
            color: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
            <div class="plan-header" style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
                    🏖️ ${tripMeta.destination || '여행지'} ${tripMeta.duration || '여행'}
                </h3>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 14px;">
                        ${tripMeta.tripType === 'family' ? '👨‍👩‍👧‍👦 가족여행' : tripMeta.tripType || '여행'}
                    </span>
                    <span style="font-size: 18px; font-weight: 600;">
                        💰 ${this.formatBudget(budgetBreakdown.total)}
                    </span>
                </div>
            </div>
            
            <div class="daily-overview" style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; font-size: 16px; opacity: 0.9;">📅 일정 개요</h4>
                ${this.generateDayThemes(mainPlan.dailyPlans)}
            </div>
            
            <div class="highlights" style="margin-bottom: 25px;">
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${this.generateFoodTags(essentialInfo.mustTryFood)}
                </div>
            </div>
            
            <div class="action-buttons" style="display: flex; gap: 12px;">
                <button onclick="approvePlan()" style="
                    flex: 1;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
                    ✅ 완벽해요!
                </button>
                <button onclick="modifyPlan()" style="
                    flex: 1;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid rgba(255,255,255,0.3);
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    ✏️ 조금 수정하기
                </button>
            </div>
        </div>`;
        
        // HTML 카드 직접 추가
        this.messageManager.addHTMLCard(cardHtml);
        
        // 성공 메시지만 반환 (더이상 HTML 포함하지 않음)
        return null; // 메시지는 이미 추가했으므로 null 반환
    }

    formatBudget(budgetData) {
        if (!budgetData || !budgetData.value) return '예산 미정';
        
        const value = budgetData.value;
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(0)}백만원/인`;
        } else if (value >= 10000) {
            return `${(value / 10000).toFixed(0)}만원/인`;
        }
        return `${value.toLocaleString()}원/인`;
    }

    generateDayThemes(dailyPlans) {
        if (!dailyPlans || !Array.isArray(dailyPlans)) {
            return '<div style="opacity: 0.7;">일정을 준비하고 있습니다...</div>';
        }
        
        return dailyPlans.map(day => `
            <div style="
                background: rgba(255,255,255,0.1);
                padding: 10px 15px;
                border-radius: 12px;
                margin-bottom: 8px;
                border-left: 4px solid #FFD700;
            ">
                <strong>Day ${day.day}</strong>: ${day.dayTheme || '알찬 하루'}
            </div>
        `).join('');
    }

    generateFoodTags(foods) {
        if (!foods || !Array.isArray(foods)) {
            return '<span style="opacity: 0.7;">맛집 정보 준비 중...</span>';
        }
        
        return foods.slice(0, 3).map(food => `
            <span style="
                background: rgba(255,193,7,0.9);
                color: #333;
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 14px;
                font-weight: 500;
            ">🍜 ${food}</span>
        `).join('');
    }

    async processStep3(userMessage, prompt) {
        console.log('📱 3단계: PWA 앱 생성 처리');
        
        const travelData = this.appState.stepData.step2;
        if (!travelData) {
            console.error('❌ 2단계 데이터가 없습니다');
            return '2단계 데이터가 없습니다.';
        }

        // 3단계 프롬프트에 여행 데이터 추가
        const fullPrompt = prompt + '\n\n[INPUT]\n' + JSON.stringify(travelData, null, 2);
        
        const response = await this.callGeminiAPI(fullPrompt, []);
        
        // PWA 생성 완료
        this.appState.progress = 100;
        this.updateProgress();
        this.appState.saveToSession();
        
        // PWA 앱 데이터 저장
        this.saveGeneratedApp(response);
        
        return response + '\n\n🎉 여행 앱이 완성되었습니다! 이제 사용하실 수 있습니다.';
    }

    buildConversationHistory() {
        // 현재 대화 히스토리를 Gemini 형식으로 변환
        return this.appState.messages
            .filter(msg => msg.sender !== 'typing')
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                content: msg.text
            }));
    }

    async callGeminiAPI(systemPrompt, messages) {
        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        // 시스템 메시지를 첫 번째 사용자 메시지에 포함 (Gemini API 특성상)
        const geminiMessages = [];
        if (messages.length > 0) {
            geminiMessages.push({
                role: 'user',
                content: systemPrompt + '\n\n' + messages[0].content
            });
            geminiMessages.push(...messages.slice(1));
        } else {
            geminiMessages.push({
                role: 'user',
                content: systemPrompt
            });
        }

        const requestBody = {
            contents: geminiMessages.map(msg => ({
                parts: [{ text: msg.content }],
                role: msg.role === 'user' ? 'user' : 'model'
            })),
            generationConfig: {
                temperature: APP_CONFIG.geminiAPI.temperature,
                topP: APP_CONFIG.geminiAPI.topP,
                topK: APP_CONFIG.geminiAPI.topK
            }
        };

        const response = await fetch(`${APP_CONFIG.geminiAPI.baseURL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || '응답을 받을 수 없습니다.';
    }

    isUserConfirmed(message) {
        const confirmWords = ['네', '좋아요', '좋습니다', '맞아요', '확인', '오케이', 'ok', 'OK'];
        return confirmWords.some(word => message.includes(word));
    }

    saveGeneratedApp(htmlResponse) {
        // PWA 앱 HTML을 localStorage에 저장
        const sessionId = this.appState.sessionId;
        const appData = {
            htmlContent: htmlResponse,
            travelData: this.appState.stepData.step2,
            generatedAt: Date.now()
        };
        
        localStorage.setItem(`generatedApp_${sessionId}`, JSON.stringify(appData));
        console.log('💾 생성된 PWA 앱 저장 완료:', sessionId);
    }

    resetToStep1() {
        this.appState.currentStep = 1;
        this.appState.stepData = {};
        this.appState.progress = 0;
        this.updateProgress();
        this.appState.saveToSession();
        console.log('🔄 1단계로 초기화됨');
    }
}

// Main Application Class
class ChattyPlanApp {
    constructor() {
        this.appState = new AppState();
        this.domManager = new DOMManager();
        this.messageManager = new MessageManager(this.appState, this.domManager);
        this.aiResponseManager = new AIResponseManager(this.messageManager);
        this.backgroundManager = new BackgroundManager();
        this.tripPlanningManager = new TripPlanningManager(
            this.appState,
            this.messageManager,
            this.aiResponseManager
        );
        this.eventManager = new EventManager(
            this.appState, 
            this.domManager, 
            this.messageManager, 
            this.aiResponseManager,
            this.tripPlanningManager
        );
    }

    async initialize() {
        try {
            // Set initial session ID
            if (!this.appState.sessionId) {
                this.appState.sessionId = this.appState.generateSessionId();
            }

            // Load session data
            const hasSession = this.appState.loadFromSession();
            
            // Set background
            if (hasSession && this.appState.currentBgIndex !== undefined) {
                this.backgroundManager.setBackground(this.appState.currentBgIndex);
            } else {
                this.appState.currentBgIndex = this.backgroundManager.setRandomBackground();
            }

            // Initialize 3-step trip planning system
            await this.tripPlanningManager.initialize();

            // Restore messages if session exists
            if (hasSession && this.appState.messages.length > 0) {
                this.messageManager.restoreMessages();
            } else {
                // Add welcome message for new users
                setTimeout(() => {
                    const welcomeMessage = this.aiResponseManager.getRandomFromArray(
                        this.aiResponseManager.responses.welcome
                    );
                    this.messageManager.addMessage('bot', welcomeMessage);
                }, 500);
            }

            // Initialize event listeners
            this.eventManager.initialize();

            // Set initial UI state
            this.updateUIState();

            // Auto-save session periodically
            setInterval(() => {
                this.appState.saveToSession();
            }, 30000); // Save every 30 seconds

            console.log('채티플랜 앱이 성공적으로 초기화되었습니다!');

        } catch (error) {
            console.error('앱 초기화 중 오류 발생:', error);
            this.handleError(error);
        }
    }

    updateUIState() {
        const sendButton = this.domManager.get('sendButton');
        const chatInput = this.domManager.get('chatInput');

        if (sendButton) {
            sendButton.disabled = true;
        }

        if (chatInput) {
            // Focus on input with delay
            setTimeout(() => {
                chatInput.focus();
            }, 100);
        }
    }

    handleError(error) {
        console.error('앱 오류:', error);
        this.messageManager.addMessage('bot', '😅 죄송합니다. 일시적인 문제가 발생했어요. 페이지를 새로고침해주세요.');
    }

    // Public methods for external use
    clearChat() {
        const chatContainer = this.domManager.get('chatContainer');
        if (chatContainer) {
            // Keep only initial messages
            const messages = chatContainer.querySelectorAll('.message:not([data-initial])');
            messages.forEach(msg => msg.remove());
        }
        
        this.appState.messages = [];
        this.appState.messageCount = 0;
        this.appState.saveToSession();
    }

    exportChat() {
        const chatData = {
            messages: this.appState.messages,
            sessionId: this.appState.sessionId,
            timestamp: Date.now()
        };
        
        const dataStr = JSON.stringify(chatData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `chattyplan_chat_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChattyPlanApp();
    app.initialize();

    // Make app globally available for debugging
    window.chattyPlanApp = app;
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.chattyPlanApp && document.visibilityState === 'visible') {
        window.chattyPlanApp.appState.saveToSession();
    }
});

// Handle before unload
window.addEventListener('beforeunload', () => {
    if (window.chattyPlanApp) {
        window.chattyPlanApp.appState.saveToSession();
    }
});

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.chattyPlanApp) {
        window.chattyPlanApp.handleError(event.reason);
    }
});

// PWA 생성 엔진
class PWAGenerator {
    constructor() {
        this.templates = {};
        this.loadTemplates();
    }

    async loadTemplates() {
        const templateFiles = [
            'main-template.html',
            'info-template.html', 
            'day-template.html',
            'budget-template.html',
            'todo-template.html',
            'manifest-template.json'
        ];

        for (const file of templateFiles) {
            try {
                const response = await fetch(`./templates/${file}`);
                if (response.ok) {
                    this.templates[file] = await response.text();
                    console.log(`✅ 템플릿 로드 완료: ${file}`);
                } else {
                    console.warn(`⚠️ 템플릿 로드 실패: ${file}`);
                }
            } catch (error) {
                console.error(`❌ 템플릿 로드 오류: ${file}`, error);
            }
        }
    }

    generatePWA(aiResponse) {
        console.log('🚀 PWA 생성 시작:', aiResponse);
        
        const destination = aiResponse.destination || aiResponse.trip_info?.destination || '여행지';
        const duration = aiResponse.duration || aiResponse.trip_info?.duration || '여행';
        const title = `${destination} ${duration}`;
        const sessionId = Date.now().toString();

        // 생성 진행상황 표시
        this.showProgressModal();

        // 실제 템플릿 기반 파일 생성
        setTimeout(() => {
            this.updateProgress('템플릿 처리 중...', 25);
            this.processTemplates(aiResponse, sessionId);
        }, 500);

        setTimeout(() => {
            this.updateProgress('페이지 생성 중...', 50);
        }, 1000);

        setTimeout(() => {
            this.updateProgress('PWA 설정 중...', 75);
        }, 1500);

        setTimeout(() => {
            this.updateProgress('완료!', 100);
            
            // 생성 완료 후 새 창으로 열기 (시뮬레이션)
            setTimeout(() => {
                this.hideProgressModal();
                this.openGeneratedApp(aiResponse, sessionId);
            }, 1000);
        }, 2000);
    }

    showProgressModal() {
        const modal = document.createElement('div');
        modal.id = 'pwa-progress-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 300px;
                width: 90%;
            ">
                <div style="font-size: 24px; margin-bottom: 15px;">📱</div>
                <h3 style="margin: 0 0 15px 0; color: #333;">여행앱 생성 중</h3>
                <div style="
                    width: 100%;
                    height: 8px;
                    background: #f0f0f0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 15px;
                ">
                    <div id="progress-bar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #4F46E5, #7C3AED);
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <div id="progress-text" style="color: #666; font-size: 14px;">시작 중...</div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    updateProgress(text, percentage) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) progressBar.style.width = percentage + '%';
        if (progressText) progressText.textContent = text;
    }

    hideProgressModal() {
        const modal = document.getElementById('pwa-progress-modal');
        if (modal) modal.remove();
    }

    processTemplates(aiResponse, sessionId) {
        try {
            // AI 응답에서 필요한 데이터 추출
            const travelData = this.extractTravelData(aiResponse);
            travelData.sessionId = sessionId;
            
            // localStorage에 여행 데이터 저장
            localStorage.setItem(`generatedApp_${sessionId}`, JSON.stringify(travelData));
            
            console.log('✅ 여행 데이터 저장 완료:', travelData);
        } catch (error) {
            console.error('❌ 데이터 처리 오류:', error);
        }
    }

    // 간단한 목적지별 이모지 매핑 (향후 확장 가능)
    getDestinationEmoji(destination) {
        const emojiMap = {
            '마카오': '🇲🇴', '일본': '🇯🇵', '중국': '🇨🇳', '태국': '🇹🇭',
            '베트남': '🇻🇳', '대만': '🇹🇼', '싱가포르': '🇸🇬', '말레이시아': '🇲🇾',
            '필리핀': '🇵🇭', '인도네시아': '🇮🇩', '제주도': '🏝️', '부산': '🏖️', '서울': '🏙️'
        };
        
        for (const [place, emoji] of Object.entries(emojiMap)) {
            if (destination.includes(place)) {
                return emoji;
            }
        }
        return '✈️';
    }


    extractTravelData(aiResponse) {
        const tripInfo = aiResponse.trip_info || {};
        const destination = aiResponse.destination || tripInfo.destination || '여행지';
        const duration = aiResponse.duration || tripInfo.duration || '여행';
        
        return {
            title: `${destination} ${duration}`,
            destination: destination,
            duration: duration,
            days: aiResponse.days || [],
            budget: aiResponse.budget || '예산 미정',
            tips: aiResponse.tips || [],
            todos: this.generateTodoList(destination, duration),
            sessionId: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
    }

    generateTodoList(destination, duration) {
        const baseTodos = [
            { category: 'pre-departure', text: '여권/신분증 확인', priority: 'high' },
            { category: 'pre-departure', text: '항공권/교통편 예약 확인', priority: 'high' },
            { category: 'pre-departure', text: '숙소 예약 확인', priority: 'high' },
            { category: 'packing', text: '의류 및 개인용품 준비', priority: 'medium' },
            { category: 'packing', text: '충전기 및 전자기기 준비', priority: 'medium' },
            { category: 'departure', text: '출발 전 짐 최종 점검', priority: 'high' },
            { category: 'local', text: '현지 교통카드/앱 설치', priority: 'medium' },
            { category: 'return', text: '기념품 구매', priority: 'low' },
            { category: 'return', text: '귀국 전 짐 정리', priority: 'medium' }
        ];
        
        // 목적지별 맞춤 할일 추가
        if (destination.includes('일본')) {
            baseTodos.push({ category: 'pre-departure', text: 'JR Pass 준비', priority: 'medium' });
        } else if (destination.includes('유럽')) {
            baseTodos.push({ category: 'pre-departure', text: '유럽 여행자보험 가입', priority: 'high' });
        }
        
        return baseTodos;
    }

    openGeneratedApp(aiResponse, sessionId) {
        const destination = aiResponse.destination || aiResponse.trip_info?.destination || '여행지';
        
        // 템플릿 기반 PWA URL 생성  
        const appUrl = `./templates/main-template.html?session=${sessionId}`;
        
        // 생성 완료 안내
        const confirmed = confirm(`🎉 ${destination} 여행앱이 생성되었습니다!\n\n📱 개인 맞춤형 PWA 앱으로 제작되었으며,\n🌐 오프라인에서도 사용 가능합니다.\n🔗 고유 URL로 언제든 접근할 수 있어요!\n\n지금 바로 확인해보시겠습니까?`);
        
        if (confirmed) {
            window.open(appUrl, '_blank');
        }

        // 생성 완료 메시지를 채팅에 추가
        this.addCompletionMessage(aiResponse, sessionId);
    }

    addCompletionMessage(aiResponse, sessionId) {
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer) return;

        const destination = aiResponse.destination || aiResponse.trip_info?.destination || '여행지';
        const appUrl = `./templates/main-template.html?session=${sessionId}`;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot');
        messageDiv.innerHTML = `
            <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <p>🎉 <strong>${destination} 여행앱 생성 완료!</strong><br><br>
            📱 개인 맞춤형 PWA 앱이 새 창에서 열렸습니다.<br>
            🌐 <strong>오프라인 사용 가능</strong> - 인터넷 없이도 OK!<br>
            📲 홈 화면에 추가하여 네이티브 앱처럼 사용하세요.<br><br>
            <a href="${appUrl}" target="_blank" style="color: #4F46E5; text-decoration: none; font-weight: bold;">🔗 여행앱 다시 열기</a><br><br>
            ✨ 즐거운 여행 되세요!</p>
        `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// 전역 함수들
window.generateTravelApp = function(dataKey) {
    try {
        // 임시 저장된 데이터 가져오기
        const aiResponse = window[dataKey];
        if (!aiResponse) {
            throw new Error('여행 데이터를 찾을 수 없습니다.');
        }
        
        const generator = new PWAGenerator();
        generator.generatePWA(aiResponse);
        
        // 사용 후 임시 데이터 정리
        delete window[dataKey];
        
    } catch (error) {
        console.error('❌ 여행앱 생성 오류:', error);
        alert('여행앱 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
};

// Google Places API 연동 서비스
class PlaceEnrichmentService {
    constructor() {
        this.apiKey = CONFIG.GOOGLE_PLACES_API_KEY;
        this.cache = new Map(); // 중복 호출 방지용 캐시
        this.rateLimitDelay = 100; // API 호출 간격 (밀리초)
    }

    async enrichTravelData(travelData) {
        console.log('🌍 Places API로 여행 데이터 보강 시작:', travelData);
        
        try {
            // 모든 placeQuery 추출
            const placeQueries = this.extractPlaceQueries(travelData);
            console.log('📍 발견된 장소 쿼리:', placeQueries);
            
            if (placeQueries.length === 0) {
                console.log('⚠️ 장소 쿼리가 없어 API 호출을 건너뜁니다');
                return travelData;
            }
            
            // 병렬로 장소 정보 조회 (Rate Limiting 적용)
            const enrichedPlaces = await this.batchEnrichPlaces(placeQueries);
            
            // 원본 데이터에 장소 정보 병합
            const enrichedData = this.mergePlaceData(travelData, enrichedPlaces);
            
            console.log('✅ Places API 데이터 보강 완료');
            return enrichedData;
            
        } catch (error) {
            console.error('❌ Places API 오류:', error);
            // API 실패 시 원본 데이터 반환
            return travelData;
        }
    }

    extractPlaceQueries(travelData) {
        const queries = [];
        
        // mainPlan의 활동들에서 placeQuery 추출
        if (travelData.mainPlan && travelData.mainPlan.dailyPlans) {
            travelData.mainPlan.dailyPlans.forEach(day => {
                if (day.activities) {
                    day.activities.forEach(activity => {
                        if (activity.placeQuery && activity.placeQuery.trim()) {
                            queries.push({
                                query: activity.placeQuery.trim(),
                                activityId: activity.id,
                                activityType: activity.type || null // 활동 타입 추가
                            });
                        }
                    });
                }
            });
        }
        
        // accommodations에서 placeQuery 추출
        if (travelData.accommodations) {
            travelData.accommodations.forEach((hotel, index) => {
                if (hotel.placeQuery && hotel.placeQuery.trim()) {
                    queries.push({
                        query: hotel.placeQuery.trim(),
                        accommodationIndex: index
                    });
                }
            });
        }
        
        return queries;
    }

    async batchEnrichPlaces(placeQueries) {
        const results = [];
        
        for (let i = 0; i < placeQueries.length; i++) {
            const placeQuery = placeQueries[i];
            
            try {
                // 캐시 확인
                if (this.cache.has(placeQuery.query)) {
                    console.log(`📋 캐시에서 로드: ${placeQuery.query}`);
                    results.push({
                        ...placeQuery,
                        placeData: this.cache.get(placeQuery.query)
                    });
                    continue;
                }
                
                // API 호출 (활동 타입 포함)
                console.log(`🔍 장소 검색: ${placeQuery.query} (타입: ${placeQuery.activityType || '일반'})`);
                const placeData = await this.searchAndEnrichPlace(placeQuery.query, placeQuery.activityType);
                
                // 캐시에 저장
                this.cache.set(placeQuery.query, placeData);
                
                results.push({
                    ...placeQuery,
                    placeData: placeData
                });
                
                // Rate Limiting
                if (i < placeQueries.length - 1) {
                    await this.delay(this.rateLimitDelay);
                }
                
            } catch (error) {
                // searchAndEnrichPlace 내부에서 폴백 처리되므로 여기서는 최종 오류만 처리
                console.error(`💥 ${placeQuery.query} 처리 중 예상치 못한 오류:`, error);
                results.push({
                    ...placeQuery,
                    placeData: this.createFallbackData(placeQuery.query)
                });
            }
        }
        
        return results;
    }

    async searchAndEnrichPlace(query, activityType = null) {
        try {
            // 1단계: Text Search로 Place ID 찾기
            const searchResult = await this.textSearch(query, activityType);
            if (!searchResult || !searchResult.place_id) {
                throw new Error('장소를 찾을 수 없습니다');
            }
            
            // 2단계: Place Details로 상세 정보 가져오기
            const placeDetails = await this.getPlaceDetails(searchResult.place_id, activityType);
            
            return placeDetails;
            
        } catch (error) {
            console.warn(`⚠️ ${query} 검색 실패, 폴백 데이터 사용:`, error.message);
            
            // 폴백 데이터 반환 (기본 정보 유지)
            return this.createFallbackData(query);
        }
    }

    createFallbackData(originalQuery) {
        return {
            name: originalQuery, // 원본 쿼리를 이름으로 사용
            coordinates: {
                lat: null,
                lng: null,
                googleMapsUrl: ''
            },
            rating: {
                score: null,
                reviewCount: 0
            },
            photos: [],
            reviews: [],
            fallback: true // 폴백 데이터임을 표시
        };
    }

    async textSearch(query, activityType = null) {
        // 활동 타입에 따른 검색 타입 추가
        let typeFilter = '';
        if (activityType === 'meal') {
            typeFilter = '&type=restaurant|food|meal_takeaway';
        } else if (activityType === 'sightseeing') {
            typeFilter = '&type=tourist_attraction|museum|amusement_park';
        } else if (activityType === 'shopping') {
            typeFilter = '&type=shopping_mall|store';
        }
        
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}&language=ko${typeFilter}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            throw new Error(`장소 검색 실패: ${data.status}`);
        }
        
        return data.results[0]; // 첫 번째 결과 반환
    }

    async getPlaceDetails(placeId, activityType = null) {
        // 핵심 필드만 요청하여 성능 최적화
        const essentialFields = [
            'place_id', 'name', 'formatted_address', 'geometry',
            'rating', 'user_ratings_total', 'photos', 'reviews', 'url'
        ].join(',');
        
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${essentialFields}&key=${this.apiKey}&language=ko`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status !== 'OK' || !data.result) {
            throw new Error(`장소 상세정보 실패: ${data.status}`);
        }
        
        const place = data.result;
        
        // 이미지 2-3장만 수집 (요청사항에 맞춤)
        const photos = this.generatePhotoUrls(place.photos, 3);
        
        // 요청된 형태의 간결한 JSON 구조
        return {
            name: place.name || '장소명 없음',
            coordinates: {
                lat: place.geometry?.location?.lat || null,
                lng: place.geometry?.location?.lng || null,
                googleMapsUrl: place.url || this.generateMapsUrl(place.geometry?.location)
            },
            rating: {
                score: place.rating || null,
                reviewCount: place.user_ratings_total || 0
            },
            photos: photos,
            reviews: this.formatSimpleReviews(place.reviews)
        };
    }

    generatePhotoUrls(photos, maxCount = 3) {
        if (!photos || !Array.isArray(photos)) return [];
        
        return photos.slice(0, maxCount).map(photo => {
            const maxWidth = 400;
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photo.photo_reference}&key=${this.apiKey}`;
        });
    }

    generateMapsUrl(location) {
        if (!location || !location.lat || !location.lng) return '';
        return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    }

    formatSimpleReviews(reviews) {
        if (!reviews || !Array.isArray(reviews)) return [];
        
        return reviews.slice(0, 2).map(review => ({
            author: review.author_name || '익명',
            rating: review.rating || 0,
            text: review.text ? (review.text.length > 80 ? review.text.substring(0, 80) + '...' : review.text) : '',
            date: review.relative_time_description || ''
        }));
    }

    formatOpeningHours(openingHours) {
        if (!openingHours || !openingHours.weekday_text) return '';
        
        const today = new Date().getDay();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const todayIndex = today === 0 ? 6 : today - 1; // API는 월요일부터 시작
        
        if (openingHours.weekday_text[todayIndex]) {
            return openingHours.weekday_text[todayIndex];
        }
        
        return openingHours.weekday_text[0] || '';
    }

    formatReviews(reviews) {
        if (!reviews || !Array.isArray(reviews)) return [];
        
        return reviews.slice(0, 2).map(review => ({
            author: review.author_name,
            rating: review.rating,
            text: review.text ? review.text.substring(0, 100) + '...' : '',
            time: review.relative_time_description
        }));
    }

    mergePlaceData(travelData, enrichedPlaces) {
        const updatedData = JSON.parse(JSON.stringify(travelData)); // 깊은 복사
        
        enrichedPlaces.forEach(enrichedPlace => {
            if (!enrichedPlace.placeData) return; // 실패한 경우 건너뛰기
            
            if (enrichedPlace.activityId) {
                // 활동 데이터 업데이트
                this.updateActivityPlaceData(updatedData, enrichedPlace.activityId, enrichedPlace.placeData);
            } else if (enrichedPlace.accommodationIndex !== undefined) {
                // 숙소 데이터 업데이트
                this.updateAccommodationPlaceData(updatedData, enrichedPlace.accommodationIndex, enrichedPlace.placeData);
            }
        });
        
        return updatedData;
    }

    updateActivityPlaceData(travelData, activityId, placeData) {
        if (!travelData.mainPlan || !travelData.mainPlan.dailyPlans) return;
        
        travelData.mainPlan.dailyPlans.forEach(day => {
            if (!day.activities) return;
            
            day.activities.forEach(activity => {
                if (activity.id === activityId) {
                    activity.placeDetails = placeData;
                    console.log(`✅ ${activityId} 장소 데이터 업데이트: ${placeData.name}`);
                }
            });
        });
    }

    updateAccommodationPlaceData(travelData, accommodationIndex, placeData) {
        if (!travelData.accommodations || !travelData.accommodations[accommodationIndex]) return;
        
        travelData.accommodations[accommodationIndex].placeDetails = placeData;
        console.log(`✅ 숙소 ${accommodationIndex} 데이터 업데이트: ${placeData.name}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async saveToJsonFile(enrichedData, filename = null) {
        try {
            // 파일명 생성
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const destination = enrichedData.tripMeta?.destination || '여행지';
            const defaultFileName = `travel_plan_${destination}_${timestamp}.json`;
            const fileName = filename || defaultFileName;
            
            // JSON 문자열 생성 (보기 좋게 포맷팅)
            const jsonContent = JSON.stringify(enrichedData, null, 2);
            
            // 브라우저에서 파일 다운로드
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 메모리 정리
            URL.revokeObjectURL(url);
            
            // 통계 정보 계산
            const stats = this.calculateDataStats(enrichedData);
            
            console.log('📁 JSON 파일 다운로드 완료:', fileName);
            console.log('📊 데이터 통계:', stats);
            
            return fileName;
            
        } catch (error) {
            console.error('❌ JSON 파일 저장 실패:', error);
            return null;
        }
    }

    calculateDataStats(data) {
        let totalActivities = 0;
        let enrichedPlaces = 0;
        let totalPhotos = 0;
        let totalReviews = 0;
        let ratingsSum = 0;
        let ratingsCount = 0;
        
        if (data.mainPlan && data.mainPlan.dailyPlans) {
            data.mainPlan.dailyPlans.forEach(day => {
                if (day.activities) {
                    totalActivities += day.activities.length;
                    
                    day.activities.forEach(activity => {
                        if (activity.placeDetails) {
                            enrichedPlaces++;
                            
                            if (activity.placeDetails.photos) {
                                totalPhotos += activity.placeDetails.photos.length;
                            }
                            
                            if (activity.placeDetails.reviews) {
                                totalReviews += activity.placeDetails.reviews.length;
                            }
                            
                            if (activity.placeDetails.rating && activity.placeDetails.rating.score) {
                                ratingsSum += activity.placeDetails.rating.score;
                                ratingsCount++;
                            }
                        }
                    });
                }
            });
        }
        
        return {
            totalActivities,
            enrichedPlaces,
            enrichmentRate: totalActivities > 0 ? Math.round((enrichedPlaces / totalActivities) * 100) : 0,
            totalPhotos,
            totalReviews,
            averageRating: ratingsCount > 0 ? Math.round((ratingsSum / ratingsCount) * 10) / 10 : null
        };
    }
}

// 카드 액션 버튼 전역 함수들
window.approvePlan = function() {
    console.log('✅ 사용자가 계획을 승인했습니다');
    
    if (window.chattyPlanApp && window.chattyPlanApp.tripPlanningManager) {
        // 3단계로 진행
        window.chattyPlanApp.tripPlanningManager.appState.currentStep = 3;
        window.chattyPlanApp.tripPlanningManager.updateProgress();
        
        // 승인 메시지 추가
        window.chattyPlanApp.messageManager.addMessage('bot', '🎉 감사합니다! 이제 여행앱을 생성하겠습니다. 잠시만 기다려주세요...');
        
        // 3단계 PWA 생성 (향후 구현)
        setTimeout(() => {
            window.chattyPlanApp.messageManager.addMessage('bot', '📱 곧 PWA 앱 생성 기능이 추가될 예정입니다!');
        }, 2000);
    }
};

window.modifyPlan = function() {
    console.log('✏️ 사용자가 계획 수정을 요청했습니다');
    
    if (window.chattyPlanApp && window.chattyPlanApp.messageManager) {
        // 수정 모드 안내
        window.chattyPlanApp.messageManager.addMessage('bot', '어떤 부분을 수정하고 싶으신가요? 구체적으로 말씀해주시면 계획을 조정해드릴게요! 😊\n\n예: "첫날 일정을 더 여유롭게", "예산을 줄여주세요", "아이들이 좋아할 곳으로"');
    }
};

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChattyPlanApp, APP_CONFIG, PWAGenerator };
}