// --- API 설정 ---
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// --- 대화 상태 관리 ---
let conversationState = {
    step: 1, // 1: 첫 대화, 2-3: 추가 질문, 4: 최종 확인
    messages: [], // 전체 대화 기록
    userData: {} // 수집된 사용자 데이터
};

// --- 프롬프트 로더 함수 ---
async function loadPrompt(filename) {
    try {
        const response = await fetch(`prompts/${filename}`);
        if (!response.ok) {
            throw new Error(`프롬프트 파일 로드 실패: ${response.status}`);
        }
        const promptText = await response.text();
        console.log(`📋 프롬프트 로드 성공: ${filename}`);
        return promptText;
    } catch (error) {
        console.error('❌ 프롬프트 로드 오류:', error);
        throw error;
    }
}

// --- Gemini API 호출 함수 ---
async function callGeminiAPI(systemPrompt, userMessage, conversationHistory = []) {
    try {
        console.log('🤖 Gemini API 호출 시작...', { userMessage, step: conversationState.step });
        
        // 대화 히스토리 구성
        let fullPrompt = systemPrompt + '\n\n=== 대화 기록 ===\n';
        
        conversationHistory.forEach((msg, index) => {
            fullPrompt += `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}\n`;
        });
        
        fullPrompt += `\n=== 현재 사용자 메시지 ===\n사용자: ${userMessage}\n\n응답해주세요:`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.9,
                maxOutputTokens: 18000,
            }
        };

        console.log('📤 요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log('🔗 API URL:', `${GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY ? '***' : 'MISSING'}`);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.text(); // JSON이 아닐 수 있으니 text로 먼저 받기
            console.log('❌ 오류 응답:', errorData);
            try {
                const parsedError = JSON.parse(errorData);
                throw new Error(`Gemini API 오류: ${response.status} - ${JSON.stringify(parsedError)}`);
            } catch (parseError) {
                throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
            }
        }

        const data = await response.json();
        console.log('🔍 Gemini API 원본 응답:', data);
        
        // 응답 구조 확인 및 안전한 접근
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('Gemini API에서 candidates가 없습니다. 콘텐츠가 차단되었을 가능성이 있습니다: ' + JSON.stringify(data));
        }
        
        const candidate = data.candidates[0];
        
        // finishReason이 SAFETY인 경우 처리
        if (candidate.finishReason === 'SAFETY') {
            throw new Error('Gemini API가 안전 정책으로 인해 응답을 차단했습니다. 다른 표현으로 시도해주세요.');
        }
        
        if (!candidate.content) {
            throw new Error(`Gemini API 응답에서 content가 없습니다. finishReason: ${candidate.finishReason}, 전체 응답: ${JSON.stringify(candidate)}`);
        }
        
        if (!candidate.content.parts || candidate.content.parts.length === 0) {
            throw new Error('Gemini API 응답에서 content.parts가 없습니다: ' + JSON.stringify(candidate));
        }
        
        const aiResponse = candidate.content.parts[0].text;
        
        console.log('✅ Gemini API 응답 성공');
        console.log('📄 원본 응답:', aiResponse);
        return aiResponse;
        
    } catch (error) {
        console.error('❌ Gemini API 호출 오류:', error);
        throw error;
    }
}

// --- DOM 요소 ---
const mainContent = document.getElementById('main-content');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const planLoadingOverlay = document.getElementById('plan-loading-overlay');
const pwaLoadingOverlay = document.getElementById('pwa-loading-overlay');
const chatInputArea = document.querySelector('.chat-input-area');

const scrollToBottom = () => { mainContent.scrollTop = mainContent.scrollHeight; };

// --- 채팅 인터페이스 활성화/비활성화 ---
function disableChatInterface() {
    chatInputArea.classList.add('disabled');
    chatInput.classList.add('disabled');
    sendButton.classList.add('disabled');
    chatInput.placeholder = '버튼을 클릭해 주세요...';
    chatInput.disabled = true;
}

function enableChatInterface() {
    chatInputArea.classList.remove('disabled');
    chatInput.classList.remove('disabled');
    sendButton.classList.remove('disabled');
    chatInput.placeholder = '또는 직접 입력해 보세요 (Shift+Enter: 줄바꿈)';
    chatInput.disabled = false;
}

// --- 타이핑 인디케이터 관리 ---
function showTypingIndicator() {
    const typingId = 'typing-indicator';
    
    // 이미 있다면 제거
    const existing = document.getElementById(typingId);
    if (existing) existing.remove();
    
    const typingHTML = `
        <div class="typing-indicator" id="${typingId}">
            <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="typing-bubble">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    
    chatContainer.insertAdjacentHTML('beforeend', typingHTML);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// --- 실제 AI 응답 처리 함수 ---
async function processUserMessage(userMessage) {
    try {
        // 타이핑 인디케이터 시작
        showTypingIndicator();
        
        // 대화 기록에 사용자 메시지 추가
        conversationState.messages.push({
            role: 'user',
            content: userMessage
        });
        
        // 프롬프트 로드
        const systemPrompt = await loadPrompt('first_step.txt');
        
        // Gemini API 호출
        const aiResponse = await callGeminiAPI(
            systemPrompt, 
            userMessage, 
            conversationState.messages.slice(0, -1) // 현재 메시지 제외한 히스토리
        );
        
        // 타이핑 인디케이터 제거
        hideTypingIndicator();
        
        // AI 응답을 대화 기록에 추가
        conversationState.messages.push({
            role: 'ai',
            content: aiResponse
        });
        
        // AI 응답 표시
        showAIResponse(aiResponse);
        
        // 단계 증가
        conversationState.step++;
        
    } catch (error) {
        console.error('❌ 메시지 처리 오류:', error);
        hideTypingIndicator();
        showErrorMessage('죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해 주세요.');
    }
}

// --- JSON 응답 감지 및 파싱 함수 ---
function tryParseJSON(text) {
    try {
        console.log('🔍 JSON 파싱 시도 중...');
        
        // JSON 코드 블록에서 추출 (```json ... ```)
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            console.log('📦 JSON 코드 블록 발견:', jsonMatch[1]);
            return JSON.parse(jsonMatch[1]);
        }
        
        // 중괄호로 시작하는 JSON 찾기
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            console.log('🔧 JSON 객체 발견:', braceMatch[0]);
            return JSON.parse(braceMatch[0]);
        }
        
        console.log('❌ JSON 패턴을 찾을 수 없음');
        return null;
    } catch (e) {
        console.log('❌ JSON 파싱 오류:', e.message);
        return null;
    }
}

// --- AI 응답 표시 함수 ---
function showAIResponse(aiResponse) {
    // JSON 응답인지 확인
    const parsedJSON = tryParseJSON(aiResponse);
    
    if (parsedJSON && parsedJSON.userMessage && parsedJSON.systemData) {
        // JSON 형태의 최종 여행 계획 응답
        console.log('🎯 JSON 응답 감지됨!');
        console.log('📋 파싱된 데이터:', parsedJSON);
        console.log('💬 사용자 메시지:', parsedJSON.userMessage);
        console.log('🗂️ 시스템 데이터:', parsedJSON.systemData);
        showTravelPlanCard(parsedJSON);
    } else {
        // 일반 텍스트 응답
        console.log('💭 일반 텍스트 응답');
        showTextResponse(aiResponse);
    }
}

// --- 일반 텍스트 응답 표시 ---
function showTextResponse(aiResponse) {
    const messageId = `msg-${Date.now()}`;
    const messageHTML = `
        <div class="message bot" id="${messageId}">
            <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5C6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <p>${aiResponse.replace(/\n/g, '<br>')}</p>
        </div>
    `;
    
    chatContainer.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
}

// --- 여행 플랜 카드 표시 함수 ---
function showTravelPlanCard(travelData) {
    const messageId = `msg-${Date.now()}`;
    const systemData = travelData.systemData;
    
    // 1단계 전체 데이터 저장 (2단계에서 사용)
    conversationState.userData = travelData; // systemData만이 아닌 전체 travelData 저장
    console.log('💾 1단계 전체 데이터 저장됨:', conversationState.userData);
    
    // 채팅 인터페이스 비활성화
    disableChatInterface();
    
    // 목적지별 배경 이미지 매핑
    const getDestinationImage = (destination) => {
        if (destination.includes('도쿄') || destination.includes('일본')) {
            return 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop';
        } else if (destination.includes('제주')) {
            return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop';
        } else if (destination.includes('부산')) {
            return 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?q=80&w=2070&auto=format&fit=crop';
        } else if (destination.includes('서울')) {
            return 'https://images.unsplash.com/photo-1499982509017-ad1e5a6f81ca?q=80&w=2070&auto=format&fit=crop';
        }
        // 기본 이미지
        return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop';
    };
    
    // 교통편 정보 구성
    const getTransportationInfo = () => {
        if (systemData.flights && systemData.flights.confirmed) {
            return `<i class="fa-solid fa-plane"></i><strong>항공편:</strong> 확정 (${systemData.flights.departure?.from || 'ICN'} → ${systemData.flights.departure?.to || systemData.destination})`;
        } else if (systemData.destination.includes('일본') || systemData.destination.includes('해외')) {
            return `<i class="fa-solid fa-plane"></i><strong>항공편:</strong> 미정 (추후 예약)`;
        } else {
            return `<i class="fa-solid fa-car"></i><strong>교통편:</strong> 미정 (KTX, 버스, 자차 등)`;
        }
    };
    
    // 인원 정보 구성
    const getTravelersInfo = () => {
        const adults = systemData.travelers.adults || 1;
        const children = systemData.travelers.children_age;
        
        let result = `성인 ${adults}명`;
        if (children && children.length > 0) {
            result += `, 아이 ${children.length}명 (${children.join(', ')}세)`;
        }
        return result;
    };
    
    // 선호사항 텍스트 생성
    const getPreferencesText = () => {
        if (!systemData.preferences || systemData.preferences.length === 0) {
            return '일반적인 여행';
        }
        
        const preferenceMap = {
            'kids_friendly': '아이동반',
            'comfortable_pace': '여유로운일정',
            'sea_view': '바다뷰',
            'local_food': '현지맛집',
            'cultural': '문화체험',
            'photo_spot': '포토스팟',
            'shopping': '쇼핑'
        };
        
        return systemData.preferences
            .map(pref => preferenceMap[pref] || pref)
            .join(', ');
    };

    const planCardHTML = `
        <div class="message bot request-summary-message" id="${messageId}">
            <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="summary-card-image">
                   <img src="${getDestinationImage(systemData.destination)}" alt="${systemData.destination} 배경 이미지">
                   <h3>${systemData.destination} 여행</h3>
                </div>
                <div class="summary-card-details">
                    <p>${travelData.userMessage}</p>
                    <ul>
                        <li><i class="fa-solid fa-calendar-days"></i><strong>일정:</strong> ${systemData.startDate} ~ ${systemData.endDate}</li>
                        <li><i class="fa-solid fa-user"></i><strong>인원:</strong> ${getTravelersInfo()}</li>
                        <li>${getTransportationInfo()}</li>
                        <li><i class="fa-solid fa-heart"></i><strong>선호사항:</strong> ${getPreferencesText()}</li>
                        ${systemData.budget && systemData.budget.total ? `<li><i class="fa-solid fa-won-sign"></i><strong>예산:</strong> ${systemData.budget.total.toLocaleString()}원</li>` : ''}
                    </ul>
                    <div class="action-button-container">
                        <button class="create-plan-btn">완벽해요! 상세 플랜 짜줘 🪄</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    chatContainer.insertAdjacentHTML('beforeend', planCardHTML);
    scrollToBottom();

    // 버튼 클릭 이벤트
    const newCard = document.getElementById(messageId);
    const createPlanBtn = newCard.querySelector('.create-plan-btn');
    createPlanBtn.addEventListener('click', () => {
        // 여기서 2단계 상세 플랜 생성 시작
        startDetailedPlanGeneration(travelData);
    });
}

// --- 상세 플랜 생성 시작 ---
async function startDetailedPlanGeneration(travelData) {
    console.log('🚀 상세 플랜 생성 시작:', travelData);
    
    let loadingInterval = null;
    
    try {
        // 로딩 애니메이션 시작
        loadingInterval = startPlanLoadingAnimation();
        
        // 2단계 프롬프트 로드
        const secondStepPrompt = await loadPrompt('second_step.txt');
        console.log('📋 2단계 프롬프트 로드 완료');
        
        // 2단계 입력 데이터 구성 (명령어 기반 preview 모드)
        const secondStepInput = {
            ...conversationState.userData,
            userMessage: "[COMMAND:PREVIEW]" // 명확한 명령어로 preview 모드 강제
        };
        
        console.log('🗂️ 2단계 입력 데이터:', secondStepInput);
        console.log('💬 2단계 userMessage:', secondStepInput.userMessage);
        console.log('🎯 예상 응답 모드: preview ([COMMAND:PREVIEW] 명령어 사용)');
        
        // Gemini API 호출 (2단계 프롬프트 사용)
        const detailedPlanResponse = await callGeminiAPI(
            secondStepPrompt,
            JSON.stringify(secondStepInput),
            [] // 새로운 대화 세션이므로 히스토리 없음
        );
        
        // 로딩 애니메이션 중지
        stopPlanLoadingAnimation(loadingInterval);
        
        console.log('✅ 2단계 Gemini 응답:', detailedPlanResponse);
        
        // JSON 응답 파싱
        const parsedDetailedPlan = tryParseJSON(detailedPlanResponse);
        
        if (parsedDetailedPlan) {
            console.log('📋 파싱된 상세 계획:', parsedDetailedPlan);
            console.log('🔍 실제 응답 타입:', parsedDetailedPlan.responseType);
            console.log('✅ 예상과 일치여부:', parsedDetailedPlan.responseType === 'preview' ? '일치 (preview)' : `불일치 (${parsedDetailedPlan.responseType})`);
            
            if (parsedDetailedPlan.responseType === 'preview') {
                // 프리뷰 모드: 기존 showPreviewCard 함수 사용
                showPreviewCard(parsedDetailedPlan.summary);
            } else if (parsedDetailedPlan.responseType === 'final') {
                // 최종 모드: 전체 여행 계획 표시
                showFinalTravelPlan(parsedDetailedPlan);
            } else {
                console.log('❓ 알 수 없는 응답 타입:', parsedDetailedPlan.responseType);
                showTextResponse(detailedPlanResponse);
            }
        } else {
            // JSON 파싱 실패시 텍스트 응답으로 표시
            console.log('💭 일반 텍스트 응답으로 표시');
            showTextResponse(detailedPlanResponse);
        }
        
    } catch (error) {
        console.error('❌ 상세 플랜 생성 오류:', error);
        if (loadingInterval) {
            stopPlanLoadingAnimation(loadingInterval);
        }
        showErrorMessage('상세 플랜 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
        enableChatInterface(); // 오류 발생 시 채팅 인터페이스 다시 활성화
    }
}

// --- 최종 여행 계획 표시 ---
function showFinalTravelPlan(finalData) {
    console.log('🎉 최종 여행 계획 표시:', finalData);
    
    // 2단계 final 응답을 localStorage에 저장 (디버깅용)
    const sessionId = Date.now();
    localStorage.setItem(`travel_final_${sessionId}`, JSON.stringify(finalData));
    console.log(`💾 Final 데이터 저장됨: travel_final_${sessionId}`);
    console.log(`📊 데이터 크기: ${JSON.stringify(finalData).length} 문자`);
    
    // 기존 PWA 바로 생성 대신 최종 확정 UI 표시
    showFinalConfirmationCard(finalData);
}

// --- 최종 확정 UI 표시 ---
function showFinalConfirmationCard(finalData) {
    console.log('✨ 최종 확정 UI 표시:', finalData);
    
    const messageId = `msg-${Date.now()}`;
    const tripPlan = finalData.tripPlan;
    const tripInfo = tripPlan.tripInfo;
    
    // 일정 미리보기 생성 (각 날짜별 주요 활동 요약)
    const dayPreviews = tripPlan.itinerary.map(day => {
        const mainActivities = day.activities
            .filter(activity => activity.activityType !== 'transport')
            .slice(0, 3) // 주요 활동 3개만
            .map(activity => {
                if (activity.activityType === 'meal') return '식사';
                if (activity.activityType === 'attraction') return '관광';
                if (activity.activityType === 'shopping') return '쇼핑';
                return '활동';
            });
        return `<div class="day-preview">Day ${day.dayNumber}: ${mainActivities.join('→')}</div>`;
    }).join('');
    
    const confirmationHTML = `
        <div class="message bot" id="${messageId}">
            <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="message-content final-confirmation-card">
                <div class="confirmation-header">
                    <h3>🎉 여행 계획 완성!</h3>
                    <p>${tripInfo.totalDays}일 완벽 일정</p>
                </div>
                
                <div class="confirmation-preview">
                    ${dayPreviews}
                </div>
                
                <div class="warning-section">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-content">
                        <h4>확정 전 체크!</h4>
                        <ul>
                            <li>확정 후 <strong>수정 어려움</strong></li>
                            <li>실시간 <strong>장소 정보 수집</strong></li>
                            <li><strong>전용 앱</strong> 생성됨</li>
                        </ul>
                    </div>
                </div>
                
                <div class="confirmation-actions">
                    <button class="final-confirm-btn">확정하기 🚀</button>
                    <button class="back-modify-btn">다시 수정</button>
                </div>
            </div>
        </div>
    `;
    
    chatContainer.insertAdjacentHTML('beforeend', confirmationHTML);
    scrollToBottom();
    
    // 버튼 이벤트 설정
    const newCard = document.getElementById(messageId);
    
    // 최종 확정 버튼
    newCard.querySelector('.final-confirm-btn').addEventListener('click', async () => {
        console.log('🚀 최종 확정 클릭됨 - Places API 호출 시작');
        
        try {
            // PWA 생성 로딩 시작
            const pwaLoadingInterval = startPwaLoadingAnimation();
            
            // TODO: Places API 호출로 placeDetails 보강
            // const enrichedData = await enrichWithPlacesAPI(finalData);
            
            // 현재는 4.5초 후 완성 메시지 (추후 Places API로 대체)
            setTimeout(() => {
                stopPwaLoadingAnimation(pwaLoadingInterval);
                showPWACompletedMessage();
            }, 4500);
            
        } catch (error) {
            console.error('❌ 최종 확정 오류:', error);
            showErrorMessage('앱 생성 중 오류가 발생했습니다.');
        }
    });
    
    // 다시 수정 버튼
    newCard.querySelector('.back-modify-btn').addEventListener('click', () => {
        enableChatInterface();
        showTextResponse('어떤 부분을 수정하고 싶으신가요? 😊');
    });
}

// --- PWA 완성 메시지 표시 ---
function showPWACompletedMessage() {
    const messageHTML = `
        <div class="message bot plan-confirmed-message">
            <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="summary-card-image">
                    <img src="https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=2072&auto=format&fit=crop" alt="여행 앱 완성 이미지">
                    <h3>여행 앱 완성! 🎉</h3>
                </div>
                <div class="summary-card-details">
                    <p>실시간 장소 정보가 반영된 나만의 여행 앱이 완성됐어요!</p>
                    <div class="action-button-container">
                        <button onclick="openGeneratedPWA()">앱 열기 🚀</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    chatContainer.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
    
    // 채팅 인터페이스 다시 활성화
    enableChatInterface();
}

// --- 오류 메시지 표시 함수 ---
function showErrorMessage(errorText) {
    const messageHTML = `
        <div class="message bot">
            <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <p style="color: #ef4444;">${errorText}</p>
        </div>
    `;
    
    chatContainer.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
}

// --- 2단계: 프리뷰 생성 로딩 애니메이션 ---
const startPlanLoadingAnimation = () => {
    const loadingIconContainer = document.getElementById('plan-loading-icon-container');
    const loadingText = document.getElementById('plan-loading-text');
    const icons = loadingIconContainer.querySelectorAll('i');
    const texts = [
        "항공편 정보를 확인 중입니다...", "최적의 숙소를 검색 중입니다...",
        "현지 맛집을 수집 중입니다...", "최고의 동선을 분석 중입니다..."
    ];
    let currentIndex = 0;

    planLoadingOverlay.classList.remove('hidden');
    setTimeout(() => planLoadingOverlay.classList.add('active'), 10);

    const intervalId = setInterval(() => {
        icons.forEach(icon => icon.classList.remove('active'));
        currentIndex = (currentIndex + 1) % icons.length;
        icons[currentIndex].classList.add('active');
        loadingText.textContent = texts[currentIndex];
    }, 1500);

    return intervalId;
};

const stopPlanLoadingAnimation = (intervalId) => {
    clearInterval(intervalId);
    planLoadingOverlay.classList.remove('active');
    setTimeout(() => planLoadingOverlay.classList.add('hidden'), 300);
};

// --- 3단계: PWA 생성 로딩 애니메이션 ---
const startPwaLoadingAnimation = () => {
    const loadingText = document.getElementById('pwa-loading-text');
    const progressBar = document.getElementById('pwa-progress-bar');
    const texts = [
        "앱 아이콘을 생성하는 중...",
        "오프라인 데이터를 저장하는 중...",
        "최종 패키징을 진행하는 중..."
    ];
    let textIndex = 0;
    let progress = 0;

    pwaLoadingOverlay.classList.remove('hidden');
    setTimeout(() => pwaLoadingOverlay.classList.add('active'), 10);
    
    loadingText.textContent = texts[textIndex];
    setTimeout(() => { progressBar.style.width = '30%'; }, 100);

    const intervalId = setInterval(() => {
        textIndex++;
        progress += 35;
        if(textIndex < texts.length) {
            loadingText.textContent = texts[textIndex];
            progressBar.style.width = `${progress}%`;
        } else {
            progressBar.style.width = '100%';
        }
    }, 1500);

    return intervalId;
};

const stopPwaLoadingAnimation = (intervalId) => {
    clearInterval(intervalId);
    pwaLoadingOverlay.classList.remove('active');
    setTimeout(() => pwaLoadingOverlay.classList.add('hidden'), 300);
};


// --- 2단계: 프리뷰 카드 표시 ---
const showPreviewCard = (summary) => {
    const messageId = `msg-${Date.now()}`;
    const previewCardHTML = `
        <div class="message bot" id="${messageId}">
            <div class="avatar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="message-content preview-card">
                <div class="preview-header">
                    <div class="header-content">
                        <h3>${summary.destination}</h3>
                        <p>${summary.period} / ${summary.travelers}</p>
                    </div>
                </div>
                <div class="preview-body">
                    <div class="preview-section">
                        <h4><i class="fa-solid fa-map-signs"></i>일정 요약</h4>
                        <ul class="preview-day-plans"></ul>
                    </div>
                    <div class="preview-section">
                        <h4><i class="fa-solid fa-star"></i>여행 하이라이트</h4>
                        <div class="highlights-grid"></div>
                    </div>
                </div>
                <div class="confirmation-buttons">
                    <button class="confirm-btn">나만의 여행 앱 만들기 🚀</button>
                    <button class="modify-btn">수정하기</button>
                </div>
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', previewCardHTML);
    
    const newCard = document.getElementById(messageId);
    
    const dayPlansList = newCard.querySelector('.preview-day-plans');
    dayPlansList.innerHTML = '';
    summary.dayPlans.forEach((plan, index) => {
        const li = document.createElement('li');
        li.className = 'day-plan-item';
        li.innerHTML = `
            <div class="day-number">
                DAY<span>${index + 1}</span>
            </div>
            <div class="day-details">
                <div class="day-summary">${plan}</div>
            </div>
        `;
        dayPlansList.appendChild(li);
    });

    const highlightsGrid = newCard.querySelector('.highlights-grid');
    highlightsGrid.innerHTML = '';
    summary.highlights.forEach(highlight => {
        const div = document.createElement('div');
        div.className = 'highlight-chip';
        div.textContent = highlight;
        highlightsGrid.appendChild(div);
    });
    
    scrollToBottom();

    // 버튼 이벤트 리스너 추가 (2단계 플로우에 맞게 수정)
    newCard.querySelector('.confirm-btn').addEventListener('click', async () => {
        console.log('✨ 최종 확정 클릭됨');
        
        try {
            // 로딩 애니메이션 시작
            const loadingInterval = startPlanLoadingAnimation();
            
            // 확정 요청으로 다시 API 호출
            const secondStepPrompt = await loadPrompt('second_step.txt');
            // 1단계 데이터를 복사하고 userMessage를 FINAL 명령어로 변경
            const finalInput = {
                ...conversationState.userData,
                userMessage: "[COMMAND:FINAL]" // 명확한 명령어로 final 모드 강제
            };
            
            const finalPlanResponse = await callGeminiAPI(
                secondStepPrompt,
                JSON.stringify(finalInput),
                []
            );
            
            stopPlanLoadingAnimation(loadingInterval);
            
            const parsedFinalPlan = tryParseJSON(finalPlanResponse);
            if (parsedFinalPlan && parsedFinalPlan.responseType === 'final') {
                showFinalTravelPlan(parsedFinalPlan);
            } else {
                // 파싱 실패 시에도 응답이 있으면 임시 구조로 처리
                console.log('⚠️ JSON 파싱 실패, 텍스트 응답으로 처리:', finalPlanResponse);
                showTextResponse('응답 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
                enableChatInterface();
            }
            
        } catch (error) {
            console.error('❌ 최종 확정 오류:', error);
            showErrorMessage('최종 확정 중 오류가 발생했습니다.');
        }
    });

    newCard.querySelector('.modify-btn').addEventListener('click', () => {
        enableChatInterface(); // 채팅 인터페이스 재활성화
        showTextResponse('어떤 부분을 수정하고 싶으신가요? 편하게 말씀해주세요. 😊');
        // 향후 수정 기능: userMessage에 "[COMMAND:MODIFY] " + 사용자입력 으로 처리 예정
    });
};

// --- PWA 생성 및 열기 함수 ---
function openGeneratedPWA() {
    try {
        console.log('🚀 PWA 앱 열기 시작...');
        
        // localStorage에서 가장 최근 Final 데이터 찾기
        const finalDataKey = findLatestFinalData();
        
        if (!finalDataKey) {
            alert('여행 데이터를 찾을 수 없습니다. 다시 생성해 주세요.');
            return;
        }
        
        const finalDataJson = localStorage.getItem(finalDataKey);
        const finalData = JSON.parse(finalDataJson);
        
        // PWA용 세션 ID 생성
        const pwaSessionId = `pwa_${Date.now()}`;
        
        // PWA용 데이터 구조로 변환 (main-template.html에서 사용할 수 있도록)
        const pwaData = convertToPWAFormat(finalData);
        
        // PWA 데이터를 localStorage에 저장
        localStorage.setItem(`generatedApp_${pwaSessionId}`, JSON.stringify(pwaData));
        
        console.log(`💾 PWA 데이터 저장됨: generatedApp_${pwaSessionId}`);
        console.log('🎯 PWA 데이터:', pwaData);
        
        // PWA 페이지 열기 (새 창에서)
        const pwaUrl = `/templates/main-template.html?session=${pwaSessionId}`;
        window.open(pwaUrl, '_blank');
        
        console.log('✅ PWA 앱 열기 완료:', pwaUrl);
        
    } catch (error) {
        console.error('❌ PWA 앱 열기 오류:', error);
        alert('앱을 여는 중 오류가 발생했습니다.');
    }
}

// localStorage에서 가장 최근 Final 데이터 키 찾기
function findLatestFinalData() {
    const keys = Object.keys(localStorage);
    const finalKeys = keys.filter(key => key.startsWith('travel_final_'));
    
    if (finalKeys.length === 0) return null;
    
    // 타임스탬프 기준으로 정렬하여 가장 최근 것 반환
    finalKeys.sort((a, b) => {
        const timeA = parseInt(a.replace('travel_final_', ''));
        const timeB = parseInt(b.replace('travel_final_', ''));
        return timeB - timeA;
    });
    
    return finalKeys[0];
}

// Final 데이터를 PWA 형식으로 변환
function convertToPWAFormat(finalData) {
    const tripPlan = finalData.tripPlan;
    const tripInfo = tripPlan.tripInfo;
    
    return {
        title: `${tripInfo.destination} ${tripInfo.totalDays}일 여행`,
        destination: tripInfo.destination,
        duration: `${tripInfo.totalDays}일`,
        days: tripPlan.itinerary.map(day => ({
            day: day.dayNumber,
            date: day.date,
            dayOfWeek: day.dayOfWeek,
            theme: day.dayTheme,
            activities: day.activities
        })),
        budget: tripInfo.estimatedBudget ? `${(tripInfo.estimatedBudget.total / 10000).toFixed(0)}만원` : '예산 미정',
        tips: tripPlan.dailyTips || [],
        todos: generateTodoList(tripInfo.destination),
        createdAt: new Date().toISOString(),
        tripMeta: {
            destination: tripInfo.destination,
            duration: `${tripInfo.totalDays}일`,
            travelers: `성인 ${tripInfo.travelers.adults}명${tripInfo.travelers.children ? `, 아이 ${tripInfo.travelers.children}명` : ''}`
        }
    };
}

// TODO 리스트 생성 (기본 여행 준비사항)
function generateTodoList(destination) {
    const baseTodos = [
        { text: "여권/신분증 확인", completed: false },
        { text: "숙소 예약 확인", completed: false },
        { text: "교통편 예약", completed: false },
        { text: "여행 보험 가입", completed: false },
        { text: "현지 통화 준비", completed: false }
    ];
    
    // 목적지별 추가 TODO
    if (destination.includes('일본') || destination.includes('도쿄') || destination.includes('오사카')) {
        baseTodos.push({ text: "JR 패스 구매", completed: false });
        baseTodos.push({ text: "포켓 와이파이 대여", completed: false });
    }
    
    if (destination.includes('해외')) {
        baseTodos.push({ text: "국제 로밍 설정", completed: false });
        baseTodos.push({ text: "플러그 어댑터 준비", completed: false });
    }
    
    return baseTodos;
}

// --- 구 버전 최종 메시지 (더 이상 사용 안함, 삭제 예정) ---
// const showFinalMessage = () => { ... 생략 ... };

const showModificationPrompt = () => {
    const modificationMessageHTML = `
        <div class="message bot">
             <div class="avatar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 13.5094 2.80808 14.9546 3.37524 16.25M8.5 16.5L11.5 13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
             <p>알겠습니다. 어느 부분을 수정하고 싶으신가요? 편하게 말씀해주세요. 😊</p>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', modificationMessageHTML);
    chatInput.focus();
    scrollToBottom();
};

// --- 채팅 기능 구현 ---
const handleSendMessage = (messageText = chatInput.value.trim()) => {
    if (!messageText) return;

    // 사용자 메시지 표시
    const userMessageHTML = `
        <div class="message user">
            <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <p>${messageText}</p>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', userMessageHTML);
    chatInput.value = '';
    
    // 입력창 높이 초기화
    autoResizeTextarea(chatInput);
    
    scrollToBottom();

    // 실제 AI 응답 처리
    processUserMessage(messageText);
};

// --- 이벤트 리스너 등록 ---
sendButton.addEventListener('click', () => handleSendMessage());
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            // Shift+Enter: 줄바꿈 (기본 동작 유지)
            setTimeout(() => {
                autoResizeTextarea(chatInput);
            }, 10); // 줄바꿈 후 높이 조정
            return; // 기본 동작(줄바꿈)을 허용
        } else {
            // Enter만: 메시지 전송
            e.preventDefault(); // 기본 줄바꿈 방지
            handleSendMessage();
        }
    }
});

// --- 자동 높이 조정 함수 ---
function autoResizeTextarea(textarea) {
    // 높이 초기화
    textarea.style.height = 'auto';
    
    // 스크롤 높이에 따라 높이 조정
    const newHeight = Math.min(textarea.scrollHeight, 120); // 최대 120px
    textarea.style.height = newHeight + 'px';
    
    // 스크롤 위치를 맨 아래로 조정 (긴 텍스트일 때)
    if (textarea.scrollHeight > 120) {
        textarea.scrollTop = textarea.scrollHeight;
    }
}

// --- 페이지 로드 후 이벤트 등록 ---
document.addEventListener('DOMContentLoaded', () => {
    // 샘플 카드 클릭 이벤트
    document.querySelectorAll('.sample-card').forEach(card => {
        card.addEventListener('click', () => {
            const promptText = card.dataset.prompt;
            handleSendMessage(promptText);
        });
    });
    
    // textarea 자동 크기 조정 이벤트
    chatInput.addEventListener('input', () => {
        autoResizeTextarea(chatInput);
    });
    
    // 페이스트 이벤트도 처리
    chatInput.addEventListener('paste', () => {
        setTimeout(() => {
            autoResizeTextarea(chatInput);
        }, 10); // 페이스트 후 약간의 지연
    });
    
    // 초기 높이 설정
    autoResizeTextarea(chatInput);
    
    console.log('✅ ChattyPlan 챗봇이 준비되었습니다!');
    console.log('🔗 API 키 상태:', CONFIG.GEMINI_API_KEY ? '설정됨' : '누락');
});