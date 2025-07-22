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
                maxOutputTokens: 30000,
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
        console.log('📊 원본 텍스트 길이:', text.length, '문자');
        console.log('🔍 텍스트 시작 100자:', text.substring(0, 100));
        console.log('🔍 텍스트 끝 100자:', text.substring(text.length - 100));
        
        // JSON 코드 블록에서 추출 (```json ... ```)
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            console.log('📦 JSON 코드 블록 발견');
            console.log('📊 추출된 JSON 길이:', jsonMatch[1].length, '문자');
            
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                console.log('✅ JSON 코드 블록 파싱 성공!');
                return parsed;
            } catch (parseError) {
                console.log('❌ JSON 코드 블록 파싱 실패:', parseError.message);
                console.log('🔍 파싱 실패한 JSON 시작 200자:', jsonMatch[1].substring(0, 200));
            }
        }
        
        // 중괄호로 시작하는 JSON 찾기
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            console.log('🔧 JSON 객체 패턴 발견');
            console.log('📊 추출된 JSON 길이:', braceMatch[0].length, '문자');
            
            try {
                const parsed = JSON.parse(braceMatch[0]);
                console.log('✅ JSON 객체 파싱 성공!');
                return parsed;
            } catch (parseError) {
                console.log('❌ JSON 객체 파싱 실패:', parseError.message);
                console.log('🔍 파싱 실패한 JSON 시작 200자:', braceMatch[0].substring(0, 200));
                
                // 파싱 실패한 JSON을 localStorage에 저장 (디버깅용)
                const debugId = Date.now();
                localStorage.setItem(`json_parse_fail_${debugId}`, braceMatch[0]);
                console.log(`💾 파싱 실패 JSON 저장됨: json_parse_fail_${debugId}`);
            }
        }
        
        console.log('❌ JSON 패턴을 찾을 수 없음 - 전체 텍스트 확인:');
        console.log('📄 전체 텍스트:', text);
        return null;
        
    } catch (e) {
        console.log('❌ JSON 파싱 전체 오류:', e.message);
        console.log('📄 오류 발생 텍스트:', text);
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
        
        // 2단계 원본 응답을 먼저 localStorage에 저장 (파싱 오류 디버깅용)
        const step2SessionId = Date.now();
        localStorage.setItem(`step2_raw_${step2SessionId}`, detailedPlanResponse);
        console.log(`💾 2단계 원본 응답 저장됨: step2_raw_${step2SessionId}`);
        console.log(`📊 원본 응답 크기: ${detailedPlanResponse.length} 문자`);
        
        // JSON 응답 파싱
        console.log('🔄 2단계 JSON 파싱 시작...');
        const parsedDetailedPlan = tryParseJSON(detailedPlanResponse);
        
        if (parsedDetailedPlan) {
            console.log('📋 파싱된 상세 계획:', parsedDetailedPlan);
            console.log('🔍 실제 응답 타입:', parsedDetailedPlan.responseType);
            console.log('✅ 예상과 일치여부:', parsedDetailedPlan.responseType === 'preview' ? '일치 (preview)' : `불일치 (${parsedDetailedPlan.responseType})`);
            
            // 파싱된 데이터도 localStorage에 저장 (디버깅용)
            localStorage.setItem(`step2_parsed_${step2SessionId}`, JSON.stringify(parsedDetailedPlan));
            console.log(`💾 2단계 파싱된 데이터 저장됨: step2_parsed_${step2SessionId}`);
            
            // JSON 파일로 다운로드 저장
            await downloadJSONFile(parsedDetailedPlan, `step2_detailed_plan_${step2SessionId}.json`);
            console.log(`📁 2단계 JSON 파일 저장 완료: step2_detailed_plan_${step2SessionId}.json`);
            
            if (parsedDetailedPlan.responseType === 'preview') {
                // 프리뷰 모드: 기존 showPreviewCard 함수 사용
                console.log('▶️ 프리뷰 카드 표시 시작...');
                showPreviewCard(parsedDetailedPlan.summary);
            } else if (parsedDetailedPlan.responseType === 'final') {
                // 최종 모드: 전체 여행 계획 표시
                console.log('▶️ 최종 여행 계획 표시 시작...');
                showFinalTravelPlan(parsedDetailedPlan);
            } else {
                console.log('❓ 알 수 없는 응답 타입:', parsedDetailedPlan.responseType);
                console.log('🔄 텍스트 응답으로 폴백...');
                showTextResponse(detailedPlanResponse);
            }
        } else {
            // JSON 파싱 실패시 에러 메시지와 함께 텍스트 응답으로 표시
            console.log('💭 JSON 파싱 실패 - 텍스트 응답으로 표시');
            console.log('🔄 사용자에게 파싱 실패 안내...');
            showErrorMessage('AI 응답을 처리하는 중 문제가 발생했습니다. 다시 시도해 주세요.');
            
            // 디버깅을 위해 원본 텍스트도 표시 (개발 모드에서만)
            if (window.location.search.includes('debug=true')) {
                showTextResponse(`디버그: ${detailedPlanResponse}`);
            }
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
            
            // 확정하기 전 원본 데이터 JSON 파일 저장
            const confirmSessionId = Date.now();
            await downloadJSONFile(finalData, `step3_before_enrichment_${confirmSessionId}.json`);
            console.log(`📁 확정 전 원본 JSON 파일 저장 완료: step3_before_enrichment_${confirmSessionId}.json`);
            
            // Places API 호출로 placeDetails 보강
            console.log('📍 Places API로 장소 정보 보강 중...');
            const enrichedData = await enrichWithPlacesAPI(finalData);
            
            // 보강된 데이터 JSON 파일 저장
            await downloadJSONFile(enrichedData, `step3_after_enrichment_${confirmSessionId}.json`);
            console.log(`📁 보강 후 JSON 파일 저장 완료: step3_after_enrichment_${confirmSessionId}.json`);
            
            // 보강된 데이터를 localStorage에 저장 (PWA에서 사용)
            const enrichedSessionId = Date.now();
            localStorage.setItem(`travel_enriched_${enrichedSessionId}`, JSON.stringify(enrichedData));
            console.log(`💾 보강된 데이터 저장됨: travel_enriched_${enrichedSessionId}`);
            console.log(`📊 보강된 데이터 크기: ${JSON.stringify(enrichedData).length} 문자`);
            
            // 로딩 완료 및 완성 메시지 표시
            stopPwaLoadingAnimation(pwaLoadingInterval);
            showPWACompletedMessage();
            
        } catch (error) {
            console.error('❌ 최종 확정 오류:', error);
            if (pwaLoadingInterval) {
                stopPwaLoadingAnimation(pwaLoadingInterval);
            }
            showErrorMessage('앱 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
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

// localStorage에서 가장 최근 데이터 키 찾기 (enriched 우선, 없으면 final)
function findLatestFinalData() {
    const keys = Object.keys(localStorage);
    
    // 1. 보강된 데이터 우선 검색
    const enrichedKeys = keys.filter(key => key.startsWith('travel_enriched_'));
    if (enrichedKeys.length > 0) {
        enrichedKeys.sort((a, b) => {
            const timeA = parseInt(a.replace('travel_enriched_', ''));
            const timeB = parseInt(b.replace('travel_enriched_', ''));
            return timeB - timeA;
        });
        console.log('✅ 보강된 데이터 발견:', enrichedKeys[0]);
        return enrichedKeys[0];
    }
    
    // 2. 보강된 데이터가 없으면 기본 final 데이터 검색
    const finalKeys = keys.filter(key => key.startsWith('travel_final_'));
    if (finalKeys.length === 0) {
        console.log('❌ 여행 데이터를 찾을 수 없음');
        return null;
    }
    
    finalKeys.sort((a, b) => {
        const timeA = parseInt(a.replace('travel_final_', ''));
        const timeB = parseInt(b.replace('travel_final_', ''));
        return timeB - timeA;
    });
    
    console.log('⚠️ 기본 데이터 사용:', finalKeys[0]);
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

// --- 파일 저장 유틸리티 함수 ---

/**
 * JSON 데이터를 파일로 다운로드
 */
async function downloadJSONFile(jsonData, filename) {
    try {
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log(`✅ JSON 파일 다운로드 완료: ${filename}`);
    } catch (error) {
        console.error(`❌ JSON 파일 다운로드 실패: ${filename}`, error);
    }
}

// --- Place API 연동 함수들 ---

/**
 * 목업 Places API 응답 생성 (실제 API 키 이슈 대안)
 */
function createMockPlaceData(placeQuery) {
    // 마카오 및 도쿄 주요 장소들의 목업 데이터
    const mockData = {
        // 마카오 장소들
        'Galaxy Macau': {
            placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: 'Galaxy Macau',
            address: 'Estrada da Baía de Nossa Senhora da Esperança, s/n, Taipa, Macao',
            coordinates: { lat: 22.1463, lng: 113.5585 },
            rating: 4.2,
            photos: [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400'
            ],
            reviews: '"Amazing resort with great facilities!" (5⭐) | "Perfect for family vacation" (4⭐) | "Excellent service and location" (5⭐)',
            website: 'https://www.galaxymacau.com',
            mapLink: 'https://maps.google.com/?q=22.1463,113.5585'
        },
        'Venetian Macao': {
            placeId: 'ChIJ5TCOcRauEmsRfstfuIabdDU',
            name: 'The Venetian Macao',
            address: 'Estrada da Baía de Nossa Senhora da Esperança, s/n, Taipa, Macao',
            coordinates: { lat: 22.1482, lng: 113.5644 },
            rating: 4.3,
            photos: [
                'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400',
                'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400'
            ],
            reviews: '"Beautiful Venice-themed resort!" (5⭐) | "Great shopping and dining" (4⭐)',
            website: 'https://www.venetianmacao.com',
            mapLink: 'https://maps.google.com/?q=22.1482,113.5644'
        },
        'Senado Square': {
            placeId: 'ChIJrTLr-GyuEmsRnrXiPA0L_iw',
            name: 'Senado Square',
            address: 'Largo do Senado, Macao',
            coordinates: { lat: 22.1930, lng: 113.5387 },
            rating: 4.1,
            photos: [
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
            ],
            reviews: '"Historic and beautiful square!" (5⭐) | "Must-visit in Macau" (4⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=22.1930,113.5387'
        },
        'Ruins of St. Paul': {
            placeId: 'ChIJsf7D-myuEmsRtVVpYahAkF0',
            name: 'Ruins of St. Paul\'s',
            address: 'Largo de São Paulo, Macau',
            coordinates: { lat: 22.1976, lng: 113.5411 },
            rating: 4.0,
            photos: [
                'https://images.unsplash.com/photo-1555400503-cb939ea4b1a6?w=400'
            ],
            reviews: '"Historical landmark, must see!" (5⭐) | "Beautiful ruins with great views" (4⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=22.1976,113.5411'
        },
        
        // 도쿄 장소들
        'Tokyo Game Show': {
            placeId: 'ChIJMzPKgyeJGGARzU5sJmwpLbE',
            name: 'Tokyo Game Show (Makuhari Messe)',
            address: '2-1 Nakase, Mihama-ku, Chiba City, Chiba 261-8550',
            coordinates: { lat: 35.6475, lng: 140.0338 },
            rating: 4.1,
            photos: [
                'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
                'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'
            ],
            reviews: '"Amazing gaming event!" (5⭐) | "Best place for game lovers" (5⭐) | "Great exhibition space" (4⭐)',
            website: 'https://tgs.cesa.or.jp/',
            mapLink: 'https://maps.google.com/?q=35.6475,140.0338'
        },
        'Shibuya': {
            placeId: 'ChIJxailyD-MGGARho3x6PUiV6A',
            name: 'Shibuya Crossing',
            address: 'Shibuya, Tokyo, Japan',
            coordinates: { lat: 35.6598, lng: 139.7006 },
            rating: 4.5,
            photos: [
                'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
                'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400'
            ],
            reviews: '"Iconic Tokyo crossing!" (5⭐) | "Must visit in Tokyo" (5⭐) | "Bustling and exciting" (4⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=35.6598,139.7006'
        },
        'Tsukiji': {
            placeId: 'ChIJazqQNbKJGGARAP5nQRVjK7I',
            name: 'Tsukiji Outer Market',
            address: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045',
            coordinates: { lat: 35.6654, lng: 139.7707 },
            rating: 4.3,
            photos: [
                'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400'
            ],
            reviews: '"Fresh sushi and seafood!" (5⭐) | "Food lover paradise" (5⭐) | "Early morning market experience" (4⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=35.6654,139.7707'
        },
        'Asakusa': {
            placeId: 'ChIJ3-2-5dOMGGARUqBjm5LYfL4',
            name: 'Asakusa Sensoji Temple',
            address: '2-3-1 Asakusa, Taito City, Tokyo 111-0032',
            coordinates: { lat: 35.7148, lng: 139.7967 },
            rating: 4.2,
            photos: [
                'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400'
            ],
            reviews: '"Historic temple experience!" (5⭐) | "Traditional Japan" (4⭐) | "Beautiful architecture" (5⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=35.7148,139.7967'
        },
        'Harajuku': {
            placeId: 'ChIJzdqRS_mLGGARdVZhU8gJ1KM',
            name: 'Harajuku Takeshita Street',
            address: 'Takeshita Street, Shibuya City, Tokyo 150-0001',
            coordinates: { lat: 35.6702, lng: 139.7064 },
            rating: 4.1,
            photos: [
                'https://images.unsplash.com/photo-1493804714600-6edb1cd93080?w=400'
            ],
            reviews: '"Youth culture hub!" (4⭐) | "Unique shopping street" (4⭐) | "Colorful and vibrant" (5⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=35.6702,139.7064'
        }
    };
    
    // 검색어 매칭
    for (const [key, data] of Object.entries(mockData)) {
        if (placeQuery.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(placeQuery.toLowerCase()) ||
            placeQuery.includes(data.name.toLowerCase())) {
            return data;
        }
    }
    
    // 기본 폴백 데이터 (검색 키워드 기반)
    return {
        placeId: `mock_${Date.now()}`,
        name: placeQuery,
        address: 'Macau',
        coordinates: { lat: 22.1987, lng: 113.5439 },
        rating: null,
        photos: ['https://images.unsplash.com/photo-1555400503-cb939ea4b1a6?w=400'],
        reviews: '장소 정보 확인 중...',
        website: '',
        mapLink: `https://maps.google.com/?q=${encodeURIComponent(placeQuery)} Macau`
    };
}

/**
 * Unsplash API로 고품질 여행 사진 생성
 */
async function generateUnsplashPhotos(placeName, placeQuery) {
    try {
        // 검색 키워드 정리 (도시명, 관광지명 등 핵심 키워드만 추출)
        let searchQuery = placeName || placeQuery;
        
        // 마카오 관련 검색어 매핑
        const macauKeywords = {
            'Galaxy Macau': 'macau casino resort',
            'Venetian Macao': 'venetian macau casino',
            'Senado Square': 'macau senado square',
            'Ruins of St. Paul': 'macau ruins saint paul',
            'Taipa Village': 'macau taipa village',
            'Lord Stow': 'macau egg tart',
            'Macau Tower': 'macau tower',
            'A-Ma Temple': 'macau temple',
            'Macau International Airport': 'macau airport'
        };
        
        // 키워드 매칭
        const matchedKeyword = Object.keys(macauKeywords).find(key => 
            searchQuery.toLowerCase().includes(key.toLowerCase())
        );
        
        if (matchedKeyword) {
            searchQuery = macauKeywords[matchedKeyword];
        } else if (searchQuery.toLowerCase().includes('macau')) {
            searchQuery += ' macau';
        }
        
        console.log(`🖼️ Generating Unsplash images for: ${searchQuery}`);
        
        // 고정된 고품질 Unsplash 이미지 (마카오 여행 관련)
        const macauImages = [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop&crop=center'
        ];
        
        // 랜덤하게 2-3개 선택
        const selectedImages = [];
        const numImages = Math.floor(Math.random() * 2) + 2; // 2-3개
        const shuffled = [...macauImages].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < numImages && i < shuffled.length; i++) {
            selectedImages.push(shuffled[i]);
        }
        
        console.log(`   ✅ Generated ${selectedImages.length} Unsplash images`);
        return selectedImages;
        
    } catch (error) {
        console.error(`❌ Unsplash photo generation error:`, error);
        // 폴백: 기본 마카오 이미지
        return [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop&crop=center'
        ];
    }
}

/**
 * Google Places API Text Search 호출
 */
async function searchPlaceWithGoogleAPI(query) {
    try {
        console.log(`🌐 Google Places API 호출: "${query}"`);
        
        const apiUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
        const params = new URLSearchParams({
            query: query,
            key: CONFIG.GOOGLE_PLACES_API_KEY,
            language: 'ko',
            fields: 'place_id,name,formatted_address,geometry,rating,photos,reviews,website,opening_hours,price_level,types'
        });
        
        // CORS 문제로 인해 서버 프록시를 통해 호출하거나, 브라우저에서 직접 호출이 안될 수 있습니다.
        // 일단 fetch로 시도해보고, 안되면 JSONP 방식이나 서버 프록시를 고려해야 합니다.
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
            console.log(`   ✅ Places API 응답 성공: ${data.results[0].name}`);
            return data.results[0]; // 첫 번째 결과 반환
        } else {
            console.log(`   ⚠️ Places API 결과 없음: ${data.status}`);
            return null;
        }
        
    } catch (error) {
        console.error(`❌ Places API 호출 실패:`, error);
        
        // CORS 오류인 경우 대안적인 접근 방법 제안
        if (error.message.includes('CORS') || error.name === 'TypeError') {
            console.log('🔄 CORS 오류로 인해 서버 프록시 또는 JSONP 방식 필요');
            
            // 임시로 목업 데이터 반환 (실제 서비스에서는 서버 프록시 구현 필요)
            console.log('🔄 임시로 목업 데이터로 폴백...');
            return await searchPlaceWithMockData(query);
        }
        
        throw error;
    }
}

/**
 * CORS 문제 시 목업 데이터로 폴백 (임시 방안)
 */
async function searchPlaceWithMockData(query) {
    console.log(`🔄 Mock data fallback for: ${query}`);
    const mockPlaceData = createMockPlaceData(query);
    
    // Google Places API 응답 형식으로 변환
    return {
        place_id: mockPlaceData.placeId,
        name: mockPlaceData.name,
        formatted_address: mockPlaceData.address,
        geometry: {
            location: {
                lat: mockPlaceData.coordinates.lat,
                lng: mockPlaceData.coordinates.lng
            }
        },
        rating: mockPlaceData.rating,
        photos: mockPlaceData.photos.map((url, index) => ({
            photo_reference: `mock_photo_ref_${index}`,
            url: url
        })),
        reviews: mockPlaceData.reviews ? [
            { text: mockPlaceData.reviews, rating: mockPlaceData.rating }
        ] : [],
        website: mockPlaceData.website,
        types: ['establishment', 'point_of_interest']
    };
}

/**
 * 실제 Google Places API로 장소 정보 보강
 */
async function enrichPlaceWithRealAPI(placeQuery, originalData = {}) {
    console.log(`🔍 Processing place with real API: ${placeQuery}`);
    
    try {
        // Google Places API Text Search 호출
        const placeData = await searchPlaceWithGoogleAPI(placeQuery);
        
        if (placeData) {
            const enrichedData = {
                ...originalData,
                placeDetails: {
                    placeId: placeData.place_id,
                    name: placeData.name,
                    address: placeData.formatted_address || placeData.vicinity || '',
                    coordinates: {
                        lat: placeData.geometry?.location?.lat || 0,
                        lng: placeData.geometry?.location?.lng || 0
                    },
                    rating: placeData.rating || null,
                    photos: placeData.photos ? await generateUnsplashPhotos(placeData.name, placeQuery) : [],
                    reviews: placeData.reviews ? placeData.reviews.slice(0, 3).map(review => 
                        `"${review.text}" (${review.rating}⭐)`
                    ).join(' | ') : '리뷰 정보 없음',
                    website: placeData.website || '',
                    mapLink: `https://maps.google.com/?q=${encodeURIComponent(placeData.name + ' ' + (placeData.formatted_address || ''))}`,
                    priceLevel: placeData.price_level || null,
                    openingHours: placeData.opening_hours?.weekday_text || null,
                    types: placeData.types || []
                }
            };
            
            console.log(`   ✅ Real API Enriched: ${placeData.name}`);
            return enrichedData;
        } else {
            // API에서 결과를 찾지 못한 경우 기본 정보만 반환
            console.log(`   ⚠️ No results from API for: ${placeQuery}`);
            return {
                ...originalData,
                placeDetails: {
                    placeId: '',
                    name: placeQuery,
                    address: 'Address not found',
                    coordinates: { lat: 0, lng: 0 },
                    rating: null,
                    photos: [],
                    reviews: 'No reviews available',
                    website: '',
                    mapLink: `https://maps.google.com/?q=${encodeURIComponent(placeQuery)}`,
                    priceLevel: null,
                    openingHours: null,
                    types: []
                }
            };
        }
    } catch (error) {
        console.error(`❌ Places API error for ${placeQuery}:`, error);
        
        // 오류 발생 시 기본 정보 반환
        return {
            ...originalData,
            placeDetails: {
                placeId: '',
                name: placeQuery,
                address: 'API Error - Address unavailable',
                coordinates: { lat: 0, lng: 0 },
                rating: null,
                photos: [],
                reviews: 'API Error - Reviews unavailable',
                website: '',
                mapLink: `https://maps.google.com/?q=${encodeURIComponent(placeQuery)}`,
                priceLevel: null,
                openingHours: null,
                types: [],
                error: error.message
            }
        };
    }
}

/**
 * finalData에서 모든 placeQuery를 찾아서 Places API로 보강
 */
async function enrichWithPlacesAPI(finalData) {
    console.log('🚀 Places API로 데이터 보강 시작...');
    console.log('📊 원본 데이터:', finalData);
    
    const enrichedData = JSON.parse(JSON.stringify(finalData)); // Deep copy
    let processedCount = 0;
    
    try {
        // 데이터 구조 분석
        console.log('🔍 데이터 구조 분석 중...');
        console.log('📋 tripPlan 존재:', !!enrichedData.tripPlan);
        console.log('📋 itinerary 존재:', !!enrichedData.tripPlan?.itinerary);
        console.log('📋 itinerary 길이:', enrichedData.tripPlan?.itinerary?.length);
        
        // tripPlan.itinerary 처리
        if (enrichedData.tripPlan && enrichedData.tripPlan.itinerary) {
            console.log('🔄 itinerary 처리 시작...');
            for (let dayIndex = 0; dayIndex < enrichedData.tripPlan.itinerary.length; dayIndex++) {
                const day = enrichedData.tripPlan.itinerary[dayIndex];
                console.log(`📅 Day ${dayIndex + 1} 처리 중:`, day);
                console.log(`📍 activities 존재:`, !!day.activities, '개수:', day.activities?.length);
                
                if (day.activities) {
                    for (let actIndex = 0; actIndex < day.activities.length; actIndex++) {
                        const activity = day.activities[actIndex];
                        console.log(`   🎯 Activity ${actIndex + 1}:`, activity);
                        console.log(`   🔍 정확한 필드 구조 체크 (second_step.txt 기준):`);
                        console.log(`     - activityType:`, activity.activityType);
                        console.log(`     - transportation?.placeQuery:`, activity.transportation?.placeQuery);
                        console.log(`     - mainLocation?.placeQuery:`, activity.mainLocation?.placeQuery);
                        console.log(`     - options 개수:`, activity.options?.length);
                        
                        // second_step.txt 구조에 맞는 정확한 처리
                        let processedInActivity = 0;
                        
                        // 1. transport 활동: transportation.placeQuery 처리
                        if (activity.activityType === 'transport' && activity.transportation?.placeQuery) {
                            console.log(`   🚗 transport 장소 처리: "${activity.transportation.placeQuery}"`);
                            const enriched = await enrichPlaceWithRealAPI(activity.transportation.placeQuery);
                            activity.transportation.placeDetails = enriched.placeDetails;
                            processedInActivity++;
                        }
                        
                        // 2. attraction/rest 활동: mainLocation.placeQuery 처리
                        if ((activity.activityType === 'attraction' || activity.activityType === 'rest') && activity.mainLocation?.placeQuery) {
                            console.log(`   🏛️ attraction 메인 장소 처리: "${activity.mainLocation.placeQuery}"`);
                            const enriched = await enrichPlaceWithRealAPI(activity.mainLocation.placeQuery);
                            activity.mainLocation.placeDetails = enriched.placeDetails;
                            processedInActivity++;
                        }
                        
                        // 3. 모든 활동: options[].placeQuery 처리
                        if (activity.options && activity.options.length > 0) {
                            console.log(`   🎯 options 처리 중... (${activity.options.length}개)`);
                            for (let optIndex = 0; optIndex < activity.options.length; optIndex++) {
                                const option = activity.options[optIndex];
                                if (option.placeQuery) {
                                    console.log(`     📍 Option ${optIndex + 1}: "${option.placeQuery}"`);
                                    const enriched = await enrichPlaceWithRealAPI(option.placeQuery);
                                    option.placeDetails = enriched.placeDetails;
                                    processedInActivity++;
                                } else {
                                    console.log(`     ❌ Option ${optIndex + 1}: placeQuery 없음`);
                                }
                            }
                        }
                        
                        if (processedInActivity > 0) {
                            console.log(`   ✅ Activity ${actIndex + 1}에서 ${processedInActivity}개 장소 처리됨`);
                            processedCount += processedInActivity;
                        } else {
                            console.log(`   ❌ Activity ${actIndex + 1}: 처리 가능한 장소 정보 없음`);
                        }
                        
                        // alternatives 처리 (second_step.txt에는 없지만 legacy 지원)
                        if (activity.alternatives && activity.alternatives.length > 0) {
                            console.log(`   🔄 alternatives 처리 중... (${activity.alternatives.length}개)`);
                            for (const alt of activity.alternatives) {
                                if (alt.placeQuery) {
                                    console.log(`     🔀 Alternative: "${alt.placeQuery}"`);
                                    const enriched = await enrichPlaceWithRealAPI(alt.placeQuery);
                                    alt.placeDetails = enriched.placeDetails;
                                    processedCount++;
                                } else {
                                    console.log(`     ❌ Alternative: placeQuery 없음`);
                                }
                            }
                        }
                    }
                } else {
                    console.log(`📅 Day ${dayIndex + 1}: activities가 없습니다.`);
                }
            }
        } else {
            console.log('❌ tripPlan.itinerary를 찾을 수 없습니다.');
        }
        
        // accommodations 처리
        console.log('🔄 accommodations 처리 중...');
        if (enrichedData.accommodations) {
            console.log('🏨 accommodations 발견:', enrichedData.accommodations.length, '개');
            for (const accommodation of enrichedData.accommodations) {
                const searchQuery = accommodation.placeQuery || accommodation.placeName || accommodation.name || accommodation.hotelName;
                if (searchQuery) {
                    console.log('🏨 숙박시설 처리:', searchQuery);
                    const enriched = await enrichPlaceWithRealAPI(searchQuery, accommodation);
                    Object.assign(accommodation, enriched);
                    processedCount++;
                }
            }
        } else {
            console.log('❌ accommodations를 찾을 수 없습니다.');
        }
        
        console.log(`✅ Places API 보강 완료! ${processedCount}개 장소 처리됨`);
        console.log('🎯 보강된 데이터:', enrichedData);
        
        return enrichedData;
        
    } catch (error) {
        console.error('❌ Places API 보강 중 오류:', error);
        // 오류 발생 시 원본 데이터 반환
        return finalData;
    }
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
    
    // 디버그 모드 전역 함수들 추가
    window.debugChattyPlan = {
        // localStorage의 모든 ChattyPlan 데이터 확인
        showAllData: () => {
            const keys = Object.keys(localStorage);
            const chattyPlanKeys = keys.filter(k => 
                k.startsWith('step2_') || k.startsWith('travel_') || k.startsWith('json_parse_fail_')
            );
            console.log('📊 ChattyPlan localStorage 데이터:');
            chattyPlanKeys.forEach(key => {
                const data = localStorage.getItem(key);
                console.log(`${key}: ${data ? data.length + '문자' : '없음'}`);
            });
            return chattyPlanKeys;
        },
        
        // 특정 키의 데이터 상세보기
        showData: (key) => {
            const data = localStorage.getItem(key);
            if (data) {
                console.log(`📄 ${key}:`, data);
                try {
                    const parsed = JSON.parse(data);
                    console.log(`🔄 ${key} (파싱됨):`, parsed);
                } catch (e) {
                    console.log(`❌ ${key} JSON 파싱 실패:`, e.message);
                }
            } else {
                console.log(`❌ ${key} 데이터를 찾을 수 없습니다.`);
            }
        },
        
        // 파싱 실패 데이터 재시도
        retryParse: (key) => {
            const data = localStorage.getItem(key);
            if (data) {
                console.log('🔄 JSON 파싱 재시도 중...');
                return tryParseJSON(data);
            }
            return null;
        },
        
        // localStorage 정리
        clearData: () => {
            const keys = Object.keys(localStorage);
            const chattyPlanKeys = keys.filter(k => 
                k.startsWith('step2_') || k.startsWith('travel_') || k.startsWith('json_parse_fail_')
            );
            chattyPlanKeys.forEach(key => localStorage.removeItem(key));
            console.log(`🗑️ ${chattyPlanKeys.length}개의 ChattyPlan 데이터를 삭제했습니다.`);
        },
        
        // JSON 파일로 다운로드
        downloadData: (key, filename) => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsedData = JSON.parse(data);
                    const finalFilename = filename || `${key}_${Date.now()}.json`;
                    downloadJSONFile(parsedData, finalFilename);
                    console.log(`📁 ${key} 데이터를 ${finalFilename}으로 다운로드했습니다.`);
                } catch (e) {
                    console.log(`❌ ${key} 데이터 파싱 실패:`, e.message);
                }
            } else {
                console.log(`❌ ${key} 데이터를 찾을 수 없습니다.`);
            }
        }
    };
    
    console.log('🔧 디버그 도구 사용법:');
    console.log('  window.debugChattyPlan.showAllData() - 모든 데이터 목록');
    console.log('  window.debugChattyPlan.showData("키이름") - 특정 데이터 보기');
    console.log('  window.debugChattyPlan.retryParse("키이름") - 파싱 재시도');
    console.log('  window.debugChattyPlan.downloadData("키이름", "파일명.json") - JSON 파일 다운로드');
    console.log('  window.debugChattyPlan.clearData() - 데이터 정리');
});