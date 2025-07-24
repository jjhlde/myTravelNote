// Global State - 3단계: 대화 상태 관리 개선
let conversationState = {
    step: 'collecting', // 'collecting' -> 'confirming' -> 'completed'
    messages: [], // 전체 대화 기록
    userData: {
        destination: null,
        startDate: null,
        endDate: null,
        travelers: null,
        tripType: null,
        budget: null,
        transport: null,
        preferences: [],
        notes: null
    }
};

// 기존 변수들 (호환성 유지)
let currentStep = 'initial';
let conversationHistory = [];
let systemData = {};
let previewPlan = {};
let detailedPlan = {};

// --- Gemini API 설정 ---
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_STREAM_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

// 단계별 Generation Config 설정
const GENERATION_CONFIGS = {
    // 1단계: 정보 수집 (정확성과 일관성 중시)
    phase1: {
        temperature: 0.7,      // 적당한 창의성으로 친근한 질문
        topK: 30,             // 적절한 후보군으로 안정성 확보
        topP: 0.8,            // 일관된 응답 스타일
        maxOutputTokens: 4000  // Preview 생성까지 충분한 토큰 (2400 → 4000)
    },
    
    // 2단계: 상세 여행계획 생성 (정확성과 창의성 균형)
    phase2: {
        temperature: 0.6,        // 0.7보다 약간 낮춰서 일관성 향상
        topK: 30,               // 40보다 낮춰서 품질 높은 선택지 집중  
        topP: 0.85,             // 0.9보다 낮춰서 안정성 증가
        maxOutputTokens: 15000  // 12000보다 여유있게 (복잡한 JSON 구조)
    },
    
    // 일반 대화용 (기존 설정 유지)
    conversation: {
        temperature: 0.5,
        topK: 25,
        topP: 0.8,
        maxOutputTokens: 2000
    }
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
        console.log('📄 프롬프트 내용 미리보기:', promptText.substring(0, 200) + '...');
        return promptText;
    } catch (error) {
        console.error('❌ 프롬프트 로드 오류:', error);
        throw error;
    }
}

// --- 실시간 스트리밍 프로그레스 추적 ---
const PROGRESS_KEYWORDS = {
    // 1단계: 정보 수집 단계
    phase1: {
        '분석': 10,
        '정보': 15,
        '수집': 20,
        '파악': 25,
        '확인': 30,
        '질문': 35,
        '대화': 40,
        '언제': 45,
        '기간': 50,
        '예산': 55,
        '동반': 60,
        '선호': 65,
        '추천': 70,
        '계획': 75,
        '맞나': 80,
        '확인': 85,
        '완료': 90,
        'JSON': 95,
        '출력': 100
    },
    
    // 2단계: Preview 생성 단계
    phase2: {
        '여행': 10,
        '목적지': 15,
        '명소': 20,
        '관광': 25,
        '맛집': 30,
        '레스토랑': 35,
        '음식': 40,
        '활동': 45,
        '체험': 50,
        '문화': 55,
        '역사': 60,
        '자연': 65,
        '쇼핑': 70,
        '교통': 75,
        '숙박': 80,
        '예상': 85,
        '비용': 90,
        '완성': 95,
        '출력': 100
    }
};

// --- 실시간 스트리밍 시뮬레이션 API 함수 ---
async function callGeminiStreamAPI(userMessage, conversationHistory = [], phase = 'phase1', onProgress = null) {
    try {
        console.log('🎬 Gemini 스트리밍 시뮬레이션 API 호출 시작...', { userMessage, phase });
        
        // 일반 API 호출을 백그라운드에서 시작
        const apiPromise = callRegularAPI(userMessage, conversationHistory, phase);
        
        // 스트리밍 시뮬레이션: 프로그레스바 업데이트
        if (onProgress) {
            const keywords = PROGRESS_KEYWORDS[phase] || PROGRESS_KEYWORDS.phase1;
            const keywordEntries = Object.entries(keywords).sort((a, b) => a[1] - b[1]); // 진행률 순으로 정렬
            
            let currentIndex = 0;
            const progressInterval = setInterval(() => {
                if (currentIndex < keywordEntries.length) {
                    const [keyword, progress] = keywordEntries[currentIndex];
                    onProgress(progress, `${keyword} 처리 중...`);
                    console.log(`🔥 시뮬레이션 프로그레스: ${progress}% - "${keyword}"`);
                    currentIndex++;
                } else {
                    clearInterval(progressInterval);
                }
            }, 300); // 300ms마다 프로그레스 업데이트
            
            // API 응답 완료 대기
            const response = await apiPromise;
            clearInterval(progressInterval);
            
            // 최종 프로그레스
            onProgress(100, '응답 완료');
            
            return response;
        } else {
            return await apiPromise;
        }
        
    } catch (error) {
        console.error('❌ 스트리밍 시뮬레이션 API 오류:', error);
        throw error;
    }
}

// --- 일반 API 호출 함수 (스트리밍용) ---
async function callRegularAPI(userMessage, conversationHistory = [], phase = 'phase1') {
    // 해당 단계 프롬프트 로드
    const promptFile = phase === 'phase1' ? 'first_step.txt' : 'second_step.txt';
    const systemPrompt = await loadPrompt(promptFile);
    
    // 프롬프트와 대화 히스토리 구성
    let fullPrompt = systemPrompt + '\n\n=== 대화 기록 ===\n';
    
    conversationHistory.forEach((msg) => {
        fullPrompt += `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}\n`;
    });
    
    fullPrompt += `\n=== 현재 사용자 메시지 ===\n사용자: ${userMessage}\n\n응답해주세요:`;

    const requestBody = {
        contents: [{
            parts: [{
                text: fullPrompt
            }]
        }],
        generationConfig: GENERATION_CONFIGS[phase]
    };

    console.log('📤 API 요청:', requestBody);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API 오류:', errorData);
        throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('🔍 Gemini API 응답:', data);
    
    // 응답 구조 확인 및 안전한 접근
    if (!data.candidates || data.candidates.length === 0) {
        console.error('❌ candidates 없음:', data);
        throw new Error('API 응답에 candidates가 없습니다.');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('❌ content.parts 없음:', candidate);
        throw new Error('API 응답에 content가 없습니다.');
    }

    const aiResponse = candidate.content.parts[0].text;
    console.log('✅ AI 응답 추출 성공:', aiResponse.substring(0, 200) + '...');
    
    return aiResponse;
}

// --- 프로그레스바 업데이트 함수 ---
function updateProgressBar(progress, currentText = '', phase = 'phase1') {
    console.log(`📊 프로그레스 업데이트: ${progress}% - ${currentText}`);
    
    // 1단계 분석 프로그레스 UI 업데이트
    if (phase === 'phase1') {
        updateAnalysisProgress(progress, currentText);
    }
}

// --- 병렬 분석 상태 업데이트 ---
function updateAnalysisProgress(progress, currentText = '') {
    // 모든 항목이 동시에 진행 중인 상태 유지
    // 상태 메시지만 업데이트
    updateAnalysisStatusMessage(currentText);
}

// --- 분석 상태 메시지 업데이트 ---
function updateAnalysisStatusMessage(responseText = '') {
    const statusElement = document.getElementById('currentAnalysisText');
    if (!statusElement) return;
    
    // 고정된 메시지로 변경 (산만한 타이핑 효과 제거)
    statusElement.textContent = "AI가 여행 정보를 종합 분석하고 있어요...";
}


// --- JSON 응답 감지 및 처리 함수 (중괄호 매칭 개선 버전) ---
// JSON 추출 전용 함수 (2단계 Preview API용)
function extractJSONFromResponse(aiResponse) {
    try {
        console.log('🔍 2단계 AI 응답 전문:', aiResponse);
        
        // 1단계: 마크다운 코드 블록 제거
        let cleanResponse = aiResponse;
        
        // ```json ... ``` 블록 찾기 및 제거
        const codeBlockMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            cleanResponse = codeBlockMatch[1];
            console.log('📋 2단계 코드 블록에서 추출:', cleanResponse);
        }
        
        // 2단계: 중괄호 매칭을 통한 완전한 JSON 추출
        function extractCompleteJSON(text) {
            const firstBrace = text.indexOf('{');
            if (firstBrace === -1) return null;
            
            let braceCount = 0;
            let inString = false;
            let escaped = false;
            
            for (let i = firstBrace; i < text.length; i++) {
                const char = text[i];
                
                if (escaped) {
                    escaped = false;
                    continue;
                }
                
                if (char === '\\') {
                    escaped = true;
                    continue;
                }
                
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                
                if (!inString) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            return text.substring(firstBrace, i + 1);
                        }
                    }
                }
            }
            
            return null;
        }
        
        // 3단계: JSON 추출 시도
        let jsonStr = extractCompleteJSON(cleanResponse);
        
        if (!jsonStr) {
            console.log('❌ 2단계에서 완전한 JSON 구조를 찾을 수 없습니다.');
            console.log('🔍 응답에서 첫 번째 중괄호 찾기:', cleanResponse.indexOf('{'));
            return null;
        }
        
        console.log('🔍 2단계 완전한 JSON 문자열 추출:', jsonStr);
        return jsonStr;
        
    } catch (error) {
        console.error('❌ 2단계 JSON 추출 오류:', error);
        return null;
    }
}

function parseJSONResponse(aiResponse) {
    try {
        console.log('🔍 AI 응답 전문:', aiResponse);
        
        // 1단계: 마크다운 코드 블록 제거
        let cleanResponse = aiResponse;
        
        // ```json ... ``` 블록 찾기 및 제거
        const codeBlockMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            cleanResponse = codeBlockMatch[1];
            console.log('📋 코드 블록에서 추출:', cleanResponse);
        }
        
        // 2단계: 중괄호 매칭을 통한 완전한 JSON 추출
        function extractCompleteJSON(text) {
            const firstBrace = text.indexOf('{');
            if (firstBrace === -1) return null;
            
            let braceCount = 0;
            let inString = false;
            let escaped = false;
            
            for (let i = firstBrace; i < text.length; i++) {
                const char = text[i];
                
                if (escaped) {
                    escaped = false;
                    continue;
                }
                
                if (char === '\\') {
                    escaped = true;
                    continue;
                }
                
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                
                if (!inString) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            return text.substring(firstBrace, i + 1);
                        }
                    }
                }
            }
            
            return null;
        }
        
        // 3단계: JSON 추출 시도
        let jsonStr = extractCompleteJSON(cleanResponse);
        
        if (!jsonStr) {
            console.log('❌ 완전한 JSON 구조를 찾을 수 없습니다.');
            console.log('🔍 응답에서 첫 번째 중괄호 찾기:', cleanResponse.indexOf('{'));
            console.log('🔍 응답 마지막 100자:', cleanResponse.slice(-100));
            return null;
        }
        
        console.log('🔍 완전한 JSON 문자열 추출:', jsonStr);
        console.log('📏 JSON 길이:', jsonStr.length, '문자');
        
        // 4단계: JSON 파싱 시도
        try {
            const jsonData = JSON.parse(jsonStr);
            console.log('✅ JSON 파싱 성공:', jsonData);
            
            // 필수 필드 검증
            if (jsonData.userMessage && jsonData.systemData) {
                console.log('✅ 필수 필드 검증 통과');
                return jsonData;
            } else {
                console.warn('⚠️ 필수 필드 누락:', {
                    hasUserMessage: !!jsonData.userMessage,
                    hasSystemData: !!jsonData.systemData
                });
                return null;
            }
        } catch (parseError) {
            console.error('❌ JSON 파싱 실패:', parseError.message);
            console.log('🔍 파싱 실패한 JSON 문자열:', jsonStr);
            return null;
        }
        
    } catch (error) {
        console.error('❌ JSON 파싱 전체 오류:', error);
        return null;
    }
}

// --- 2단계 Preview 응답 처리 함수 ---
function handlePreviewResponse(jsonData) {
    console.log('🎨 Preview 응답 처리 시작:', jsonData);
    
    if (jsonData.userMessage && jsonData.systemData && jsonData.systemData.previewUI) {
        // userMessage를 UI에 표시
        addMessage(jsonData.userMessage, false);
        
        // systemData 저장
        conversationState.userData = { 
            ...conversationState.userData, 
            ...jsonData.systemData 
        };
        conversationState.step = 'preview';
        
        console.log('💾 Preview 데이터 저장 완료:', conversationState.userData);
        
        // Preview UI 표시
        setTimeout(() => {
            showPreviewModal(jsonData.systemData.previewUI);
        }, 1000);
        
        return true;
    }
    
    return false;
}

// --- Preview 모달 표시 함수 ---
function showPreviewModal(previewUI) {
    console.log('🖼️ Preview 모달 생성:', previewUI);
    
    const modal = document.getElementById('previewModal');
    const content = document.getElementById('previewContent');
    
    // 여행지별 이미지 ID 매핑 (Picsum Photos 사용)
    const destinationImages = {
        '제주도': { header: 1, spots: [2, 3, 4, 5, 6] },
        '부산': { header: 7, spots: [8, 9, 10, 11, 12] },
        '서울': { header: 13, spots: [14, 15, 16, 17, 18] },
        '도쿄': { header: 19, spots: [20, 21, 22, 23, 24] },
        '오사카': { header: 25, spots: [26, 27, 28, 29, 30] },
        '방콕': { header: 31, spots: [32, 33, 34, 35, 36] },
        '싱가포르': { header: 37, spots: [38, 39, 40, 41, 42] },
        '파리': { header: 43, spots: [44, 45, 46, 47, 48] },
        '런던': { header: 49, spots: [50, 51, 52, 53, 54] },
        '뉴욕': { header: 55, spots: [56, 57, 58, 59, 60] }
    };
    
    // 안정한 이미지 URL 생성 함수
    function getStableImage(destination, type = 'header', index = 0, width = 400, height = 200) {
        const defaultImages = { header: 100, spots: [101, 102, 103, 104, 105] };
        let imageId;
        
        if (destinationImages[destination]) {
            if (type === 'header') {
                imageId = destinationImages[destination].header;
            } else {
                imageId = destinationImages[destination].spots[index] || destinationImages[destination].spots[0];
            }
        } else {
            if (type === 'header') {
                imageId = defaultImages.header;
            } else {
                imageId = defaultImages.spots[index] || defaultImages.spots[0];
            }
        }
        
        return `https://picsum.photos/id/${imageId}/${width}/${height}`;
    }
    
    // 목적지 추출 (previewUI.header.title에서)
    const destination = previewUI.header.title.split(' ')[0]; // "제주도 2박 3일" -> "제주도"
    
    console.log('🏞️ 목적지:', destination, '이미지 생성 시작');
    
    // Preview HTML 생성
    const previewHTML = `
        <div class="space-y-4">
            <!-- Header with Background -->
            <div class="relative rounded-xl overflow-hidden h-32">
                <img src="${getStableImage(destination, 'header', 0, 400, 200)}" 
                     alt="${previewUI.header.title}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='https://picsum.photos/400/200?random=1'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                    <div>
                        <h3 class="font-bold text-white text-xl">${previewUI.header.title}</h3>
                        <p class="text-sm text-white/90">${previewUI.header.subtitle} • ${previewUI.header.budget}</p>
                    </div>
                </div>
            </div>
            
            <!-- Highlights -->
            <div>
                <p class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <i class="fas fa-star text-amber-500"></i>
                    주요 방문지
                </p>
                <div class="space-y-2">
                    ${previewUI.highlights.map((item, index) => `
                        <div class="flex gap-3 bg-white rounded-lg p-3 border border-gray-200">
                            <img src="${getStableImage(destination, 'spot', index, 200, 150)}" 
                                 alt="${item.name}" 
                                 class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                 onerror="this.src='https://picsum.photos/200/150?random=${10 + index}'">
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-800 text-sm">${item.name}</h4>
                                <p class="text-xs text-gray-600 mt-1">${item.description}</p>
                            </div>
                            <div class="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <span class="text-red-500 font-bold text-xs">${item.order}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Next Step Info -->
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div class="flex gap-3">
                    <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                    <div>
                        <p class="text-sm font-semibold text-gray-800">다음 단계</p>
                        <p class="text-xs text-gray-600 mt-1">
                            이 계획이 마음에 드시면 상세 일정과 맛집, 교통편을 포함한 완전한 여행 계획을 만들어드릴게요!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = previewHTML;
    modal.classList.remove('hidden');
    
    console.log('✅ Preview 모달 표시 완료 - 안정한 이미지 적용');
}

// --- UX Expert Approved: 채팅 상태 관리 함수들 ---
function disableChatInput() {
    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.querySelector('button[onclick="sendMessage()"]');
    
    // 입력창 비활성화
    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = "확인 버튼을 선택해주세요...";
    }
    
    // 전송 버튼 비활성화
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.style.opacity = '0.5';
        sendButton.style.cursor = 'not-allowed';
    }
    
    // 컨테이너에 비활성화 클래스 추가
    if (chatContainer) {
        chatContainer.classList.add('input-disabled');
    }
    
    console.log('🔒 채팅 입력 비활성화 완료');
}

function enableChatInput() {
    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.querySelector('button[onclick="sendMessage()"]');
    
    // 입력창 활성화
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = "메시지를 입력하세요...";
    }
    
    // 전송 버튼 활성화
    if (sendButton) {
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        sendButton.style.cursor = 'pointer';
    }
    
    // 컨테이너에서 비활성화 클래스 제거
    if (chatContainer) {
        chatContainer.classList.remove('input-disabled');
    }
    
    console.log('🔓 채팅 입력 활성화 완료');
}

function showConfirmationPanel(aiMessage) {
    const confirmationPanel = document.getElementById('confirmationPanel');
    const summaryText = document.getElementById('summaryText');
    
    if (!confirmationPanel || !summaryText) {
        console.error('❌ 확인 패널 요소를 찾을 수 없습니다');
        return;
    }
    
    // AI 메시지를 요약 영역에 표시
    summaryText.textContent = aiMessage;
    
    // 패널 표시 애니메이션
    confirmationPanel.classList.remove('hidden');
    setTimeout(() => {
        confirmationPanel.classList.add('show');
    }, 50);
    
    // 채팅 입력 비활성화
    disableChatInput();
    
    console.log('✨ 확인 패널 표시 완료');
}

function hideConfirmationPanel() {
    const confirmationPanel = document.getElementById('confirmationPanel');
    
    if (!confirmationPanel) {
        console.error('❌ 확인 패널 요소를 찾을 수 없습니다');
        return;
    }
    
    // 패널 숨기기 애니메이션
    confirmationPanel.classList.remove('show');
    setTimeout(() => {
        confirmationPanel.classList.add('hidden');
    }, 400);
    
    // 채팅 입력 활성화
    enableChatInput();
    
    console.log('🙈 확인 패널 숨김 완료');
}

// 버튼 이벤트 핸들러들
function handleModifyRequest() {
    console.log('✏️ 수정 요청 처리');
    
    // 확인 패널 숨기기
    hideConfirmationPanel();
    
    // 사용자에게 수정 요청 메시지 표시
    addMessage("수정하고 싶은 부분을 알려주세요! 장소, 테마, 일정 등 어떤 것이든 조정해드릴게요 😊", false);
    
    // 대화 상태를 다시 collecting으로 변경
    conversationState.step = 'collecting';
}

function handleConfirmPlan() {
    console.log('🚀 여행 계획 확정 처리');
    
    // 버튼 로딩 상태 표시
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.classList.add('loading');
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>계획 생성 중...</span>';
    }
    
    // 확인 패널 숨기기
    hideConfirmationPanel();
    
    // 확정 메시지 표시
    addMessage("완벽하네요! 지금 바로 상세한 여행 계획을 만들어드릴게요 ✨", false);
    
    // 1단계 로딩 시작
    setTimeout(() => {
        testLoading1();
    }, 1000);
    
    // 상태 업데이트
    conversationState.step = 'generating_plan';
}

// --- JSON 응답 처리 및 UI 업데이트 ---
function handleJSONResponse(jsonData) {
    console.log('🎯 JSON 응답 처리 시작:', jsonData);
    
    if (jsonData.userMessage && jsonData.systemData) {
        // systemData 저장
        conversationState.userData = { ...conversationState.userData, ...jsonData.systemData };
        conversationState.step = 'waiting_for_confirmation'; // 사용자 확인 대기 상태로 변경
        
        console.log('💾 사용자 데이터 저장 완료:', conversationState.userData);
        
        // UX Expert Approved: 버튼 기반 확인 UI 표시
        showConfirmationPanel(jsonData.userMessage);
        
        console.log('✨ 버튼 기반 확인 UI 표시 완료');
        
        return true;
    }
    
    return false;
}

// --- 2단계: Preview 생성 전용 API 호출 함수 ---
async function callPhase2PreviewAPI(systemData) {
    try {
        console.log('🎨 2단계 Preview 생성 API 호출 시작...', { systemData });
        
        // 2단계 프롬프트 로드
        const phase2Prompt = await loadPrompt('second_step.txt');
        
        // 2단계 전용 프롬프트 구성
        const previewPrompt = `
=== 2단계 지침 ===  
${phase2Prompt}

=== 1단계에서 수집된 여행 정보 ===
${JSON.stringify(systemData, null, 2)}

=== 요구사항 ===
- 위 여행 정보를 바탕으로 Preview UI 생성
- highlights는 4-6개의 매력적인 추천
- 각 highlight는 구체적이고 생생한 설명
- userMessage는 친근하고 기대감을 주는 톤 (40자 이내)

2단계 JSON 형식으로 응답해주세요:`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: previewPrompt
                }]
            }],
            generationConfig: GENERATION_CONFIGS.phase2
        };

        console.log('📤 2단계 API 요청:', requestBody);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 2단계 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ 2단계 API 오류:', errorData);
            throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log('🔍 2단계 API 응답:', data);
        
        if (!data.candidates || data.candidates.length === 0) {
            console.error('❌ candidates 없음:', data);
            throw new Error('Gemini API에서 candidates가 없습니다.');
        }
        
        const candidate = data.candidates[0];
        
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.error('❌ content 구조 오류:', candidate);
            throw new Error('Gemini API 응답에서 content가 없습니다.');
        }
        
        const aiResponse = candidate.content.parts[0].text;
        console.log('✅ 2단계 AI 응답 텍스트:', aiResponse);
        
        // JSON 파싱
        try {
            const jsonString = extractJSONFromResponse(aiResponse);
            if (jsonString) {
                const parsedData = JSON.parse(jsonString);
                console.log('✅ 2단계 JSON 파싱 성공:', parsedData);
                return parsedData;
            } else {
                console.error('❌ 2단계 응답에서 JSON을 찾을 수 없음');
                return null;
            }
        } catch (parseError) {
            console.error('❌ 2단계 JSON 파싱 실패:', parseError);
            console.error('원본 응답:', aiResponse);
            return null;
        }
        
    } catch (error) {
        console.error('❌ 2단계 API 호출 오류:', error);
        return `죄송합니다. Preview 생성 중 오류가 발생했습니다. 다시 시도해주세요. (오류: ${error.message})`;
    }
}

// --- 3단계: 상세 계획 생성 전용 API 호출 함수 ---
async function callPhase3DetailedAPI(systemData, previewData) {
    try {
        console.log('📋 3단계 상세 계획 생성 API 호출 시작...', { systemData, previewData });
        
        // 3단계 프롬프트 로드 (향후 third_step.txt 추가 시)
        // const phase3Prompt = await loadPrompt('third_step.txt');
        
        // 임시 3단계 프롬프트 (나중에 파일로 분리)
        const phase3Prompt = `
당신은 전문 여행 플래너입니다. 수집된 여행 정보와 Preview 데이터를 바탕으로 상세한 일정을 생성해주세요.

출력 형식:
{
  "userMessage": "상세 계획이 완성되었습니다!",
  "systemData": {
    "detailedPlan": {
      "days": [
        {
          "day": "Day 1",
          "date": "날짜",
          "title": "일차 제목",
          "activities": [
            {
              "time": "09:00",
              "activity": "활동명",
              "detail": "상세 설명",
              "cost": "비용",
              "duration": "소요시간",
              "transport": "교통편"
            }
          ]
        }
      ],
      "totalBudget": {
        "transportation": 0,
        "accommodation": 0,
        "food": 0,
        "activities": 0,
        "total": 0
      }
    }
  }
}`;
        
        // 3단계 프롬프트 구성
        const detailedPrompt = `
=== 3단계 지침 ===  
${phase3Prompt}

=== 1단계 수집 정보 ===
${JSON.stringify(systemData, null, 2)}

=== 2단계 Preview 정보 ===
${JSON.stringify(previewData, null, 2)}

=== 요구사항 ===
- 시간별 상세 일정 (교통편, 소요시간, 비용 포함)
- 실제 운영시간과 이동시간을 고려한 현실적인 계획
- 맛집과 관광지의 정확한 정보
- 총 예산 계산서

3단계 JSON 형식으로 응답해주세요:`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: detailedPrompt
                }]
            }],
            generationConfig: GENERATION_CONFIGS.phase2
        };

        console.log('📤 3단계 API 요청:', requestBody);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 3단계 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ 3단계 API 오류:', errorData);
            throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log('🔍 3단계 API 응답:', data);
        
        if (!data.candidates || data.candidates.length === 0) {
            console.error('❌ candidates 없음:', data);
            throw new Error('Gemini API에서 candidates가 없습니다.');
        }
        
        const candidate = data.candidates[0];
        
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.error('❌ content 구조 오류:', candidate);
            throw new Error('Gemini API 응답에서 content가 없습니다.');
        }
        
        const aiResponse = candidate.content.parts[0].text;
        console.log('✅ 3단계 AI 응답 텍스트:', aiResponse);
        
        return aiResponse;
        
    } catch (error) {
        console.error('❌ 3단계 API 호출 오류:', error);
        return `죄송합니다. 상세 계획 생성 중 오류가 발생했습니다. 다시 시도해주세요. (오류: ${error.message})`;
    }
}

// --- 1+2단계 통합 API 호출 함수 ---
async function callCombinedPhaseAPI(userMessage) {
    try {
        console.log('🚀 1+2단계 통합 API 호출 시작...', { userMessage });
        
        // 1단계와 2단계 프롬프트 로드
        const phase1Prompt = await loadPrompt('first_step.txt');
        const phase2Prompt = await loadPrompt('second_step.txt');
        
        // 통합 프롬프트 구성
        const combinedPrompt = `
=== 1단계 지침 ===
${phase1Prompt}

=== 2단계 지침 ===  
${phase2Prompt}

=== 처리 방식 ===
1. 먼저 사용자 메시지를 1단계 지침에 따라 처리하여 systemData를 생성
2. 생성된 systemData를 바탕으로 2단계 지침에 따라 previewUI를 생성
3. 최종 출력은 2단계 JSON 형식 사용 (previewUI 포함)

=== 사용자 입력 ===
사용자: ${userMessage}

=== 요구사항 ===
- 1단계에서 수집한 정보를 기반으로 즉시 2단계 preview 생성
- highlights는 4-6개 추천
- imageKeyword는 Unsplash용 영문 키워드
- userMessage는 친근한 preview 소개 (40자 이내)

응답해주세요:`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: combinedPrompt
                }]
            }],
            generationConfig: GENERATION_CONFIGS.phase1
        };

        console.log('📤 통합 API 요청:', requestBody);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ API 오류:', errorData);
            throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log('🔍 통합 API 응답:', data);
        
        if (!data.candidates || data.candidates.length === 0) {
            console.error('❌ candidates 없음:', data);
            throw new Error('Gemini API에서 candidates가 없습니다.');
        }
        
        const candidate = data.candidates[0];
        
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.error('❌ content 구조 오류:', candidate);
            throw new Error('Gemini API 응답에서 content가 없습니다.');
        }
        
        const aiResponse = candidate.content.parts[0].text;
        console.log('✅ 통합 AI 응답 텍스트:', aiResponse);
        console.log('📏 응답 길이:', aiResponse.length, '문자');
        
        // finishReason 확인 (토큰 부족 여부 확인)
        if (candidate.finishReason) {
            console.log('🏁 완료 이유:', candidate.finishReason);
            if (candidate.finishReason === 'MAX_TOKENS') {
                console.warn('⚠️ 경고: 최대 토큰에 도달하여 응답이 잘렸을 수 있습니다!');
            }
        }
        
        return aiResponse;
        
    } catch (error) {
        console.error('❌ 통합 API 호출 오류:', error);
        return `죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요. (오류: ${error.message})`;
    }
}

// --- Gemini API 호출 함수 ---
async function callGeminiAPI(userMessage, conversationHistory = []) {
    try {
        console.log('🤖 Gemini API 호출 시작...', { userMessage });
        
        // first_step.txt 프롬프트 로드
        const systemPrompt = await loadPrompt('first_step.txt');
        
        // 프롬프트와 대화 히스토리 구성
        let fullPrompt = systemPrompt + '\n\n=== 대화 기록 ===\n';
        
        // 대화 히스토리 추가
        conversationHistory.forEach((msg) => {
            fullPrompt += `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}\n`;
        });
        
        fullPrompt += `\n=== 현재 사용자 메시지 ===\n사용자: ${userMessage}\n\n응답해주세요:`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }],
            generationConfig: GENERATION_CONFIGS.phase1  // 1단계용 4000 토큰 설정 사용
        };

        console.log('📤 API 요청:', requestBody);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ API 오류:', errorData);
            throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log('🔍 Gemini API 응답:', data);
        
        // 응답 구조 확인 및 안전한 접근
        if (!data.candidates || data.candidates.length === 0) {
            console.error('❌ candidates 없음:', data);
            throw new Error('Gemini API에서 candidates가 없습니다.');
        }
        
        const candidate = data.candidates[0];
        console.log('🔍 candidate 구조:', candidate);
        console.log('🔍 candidate.content:', candidate.content);
        
        // Gemini API의 새로운 응답 구조 확인
        if (candidate.content) {
            console.log('🔍 content keys:', Object.keys(candidate.content));
            if (candidate.content.parts) {
                console.log('🔍 candidate.content.parts:', candidate.content.parts);
            }
        }
        
        // finishReason 확인
        console.log('🔍 finishReason:', candidate.finishReason);
        
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.error('❌ content 구조 오류:', candidate);
            console.error('❌ 전체 응답 구조:', JSON.stringify(data, null, 2));
            
            // MAX_TOKENS 오류인 경우 더 자세한 안내 제공
            if (candidate.finishReason === 'MAX_TOKENS') {
                throw new Error('응답이 너무 길어서 잘렸습니다. 질문을 더 구체적으로 해주세요.');
            } else {
                throw new Error('Gemini API 응답에서 content가 없습니다.');
            }
        }
        
        const aiResponse = candidate.content.parts[0].text;
        console.log('✅ AI 응답 텍스트:', aiResponse);
        
        return aiResponse;
        
    } catch (error) {
        console.error('❌ Gemini API 호출 오류:', error);
        return `죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요. (오류: ${error.message})`;
    }
}

// Progress Management
function showProgress() {
    document.getElementById('progressBar').style.display = 'block';
}

// Planning Loader Management - 새로 추가 (Modern UI)
function showPlanningLoader() {
    const loader = document.getElementById('planningLoader');
    loader.classList.remove('hidden');
    
    // 현대적 로딩 애니메이션 시작
    setTimeout(() => {
        startModernLoadingAnimation();
    }, 500);
}

function hidePlanningLoader() {
    const loader = document.getElementById('planningLoader');
    loader.classList.add('hidden');
    
    // 로딩 인터벌 정리
    if (window.currentLoadingInterval) {
        clearInterval(window.currentLoadingInterval);
        window.currentLoadingInterval = null;
        console.log('🧽 로딩 인터벌 정리 완료');
    }
}

function updateLoadingMessages(userMessage) {
    // 사용자 메시지에서 여행 정보 추출
    let destination = "여행지";
    let duration = "일정";
    let travelers = "인원";
    let budget = "예산";
    
    // 간단한 패턴 매칭으로 정보 추출
    const destinationMatch = userMessage.match(/(제주도|부산|서울|도쿄|오사카|후쿠오카|대구|인천|광주|대전|울산|방콕|싱가포르|홍콩|마카오|타이베이|상하이|베이징|파리|런던|로마|바르셀로나|뉴욕|LA|라스베가스|하와이|괌|사이판|세부|보라카이|푸켓|다낭|호치민|앙코르와트|쿠알라룸푸르|랑카위|코타키나발루)/);
    if (destinationMatch) destination = destinationMatch[1];
    
    const durationMatch = userMessage.match(/(\d+박\s*\d+일|\d+일)/);
    if (durationMatch) duration = durationMatch[1];
    
    const travelersMatch = userMessage.match(/(혼자|커플|가족|친구|동료|2명|3명|4명|5명|6명)/);
    if (travelersMatch) travelers = travelersMatch[1];
    
    const budgetMatch = userMessage.match(/(\d+만원|\d+백만원|\d+억)/);
    if (budgetMatch) budget = budgetMatch[1];
    
    console.log('🏷️ 추출된 여행 정보:', { destination, duration, travelers, budget });
    
    // 목적지별 맞춤 로딩 메시지 생성
    return generateLoadingMessages(destination, duration, travelers, budget);
}

// 현대적 로딩 메시지 생성 함수
function generateLoadingMessages(destination, duration, travelers, budget) {
    const baseMessages = [
        `${destination} ${duration} 여행 정보를 분석하고 있어요...`,
        `${travelers} 여행에 딱 맞는 코스를 찾는 중이에요 🔍`,
        `${destination}의 숨은 명소들을 발굴하고 있어요 ✨`,
        `가성비 최고의 맛집들을 선별하고 있어요 🍜`,
        `최적의 이동 경로를 계산하고 있어요 🗺️`,
        `${budget} 예산에 맞는 플랜을 세우고 있어요 💰`,
        `현지인이 추천하는 핫플레이스를 조사중이에요 🎯`,
        `AI가 ${destination}의 베스트 코스를 완성하고 있어요 🤖`
    ];
    
    // 목적지별 특별 메시지 추가
    const specialMessages = {
        '제주도': [
            '제주도의 아름다운 자연 명소를 찾고 있어요 🌊',
            '제주 흑돼지 맛집을 찾는 중이에요 🐷',
            '한라산 등반 코스를 확인하고 있어요 ⛰️'
        ],
        '도쿄': [
            '도쿄의 최신 트렌드 스팟을 조사중이에요 🗼',
            '스시 맛집과 라멘 전문점을 찾고 있어요 🍣',
            '아키하바라와 하라주쿠 쇼핑 코스를 만들고 있어요 🛍️'
        ],
        '부산': [
            '부산의 해변과 온천 정보를 확인중이에요 🏖️',
            '부산 국제시장 맛집을 조사하고 있어요 🦀',
            '감천문화마을 포토존을 찾고 있어요 📸'
        ]
    };
    
    if (specialMessages[destination]) {
        return [...baseMessages, ...specialMessages[destination]];
    }
    
    return baseMessages;
}

// 현대적 로딩 애니메이션 함수
function startModernLoadingAnimation() {
    const messageDisplay = document.getElementById('loadingMessage');
    const dotsDisplay = document.getElementById('loadingDots');
    
    console.log('🎬 현대적 로딩 애니메이션 시작');
    
    // 커스텀 메시지 우선 사용, 없으면 기본 메시지
    let messages = window.currentLoadingMessages || [
        '완벽한 여행 계획을 세우고 있어요...',
        'AI가 최고의 여행 코스를 찾고 있어요 🔍',
        '숨은 명소와 맛집들을 발굴하고 있어요 ✨',
        '가성비 최고의 플랜을 만들고 있어요 💰',
        '현지인이 추천하는 핫플을 조사중이에요 🎯',
        '최적의 여행 루트를 계산하고 있어요 🗺️'
    ];
    
    console.log('📋 로딩 메시지 배열:', messages.length, '개 -', messages[0]);
    
    let currentMessageIndex = 0;
    
    // 메시지 순환 함수
    function cycleMessages() {
        if (!messageDisplay) return;
        
        // 페이드 아웃
        messageDisplay.style.opacity = '0';
        
        setTimeout(() => {
            // 메시지 변경
            messageDisplay.textContent = messages[currentMessageIndex];
            currentMessageIndex = (currentMessageIndex + 1) % messages.length;
            
            // 페이드 인
            messageDisplay.style.opacity = '1';
            
            console.log('💬 로딩 메시지 업데이트:', messageDisplay.textContent);
        }, 300);
    }
    
    // 처음 메시지 표시
    if (messageDisplay) {
        messageDisplay.textContent = messages[0];
        currentMessageIndex = 1;
    }
    
    // 3초마다 메시지 변경
    const messageInterval = setInterval(cycleMessages, 3000);
    
    // 전역 변수에 저장 (나중에 정리용)
    window.currentLoadingInterval = messageInterval;
    
    // 점들 애니메이션은 CSS로 처리됨
    console.log('✨ 로딩 메시지 순환 시작 - 3초마다 변경');
}

// 진행상황 업데이트 함수 - Figma 디자인 적용
function updateProgress(step, text) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    // 진행도 바 표시
    if (progressBar.style.display === 'none') {
        progressBar.style.display = 'block';
        progressBar.classList.add('show');
    }
    
    // 텍스트 업데이트
    if (progressText) {
        progressText.textContent = text || `${step}/3 단계`;
    }
    
    // 진행도 바 애니메이션으로 업데이트
    if (progressFill) {
        const percentage = (step / 3) * 100;
        progressFill.style.width = `${percentage}%`;
        
        // 진행도가 변경될 때 글로우 효과 추가
        progressFill.style.animation = 'progress-glow 0.5s ease-out';
        setTimeout(() => {
            progressFill.style.animation = '';
        }, 500);
    }
}

// UI Helper Functions
function hideInitialScreen() {
    document.getElementById('initialScreen').style.display = 'none';
    showProgress();
}

function showTypingIndicator() {
    document.getElementById('typingIndicator').classList.remove('hidden');
    scrollToBottom();
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').classList.add('hidden');
}

function scrollToBottom() {
    const container = document.getElementById('chatContainer');
    container.scrollTop = container.scrollHeight;
}

// Modal Functions
function closePreviewModal() {
    document.getElementById('previewModal').classList.add('hidden');
}

function closeDetailedModal() {
    document.getElementById('detailedModal').classList.add('hidden');
}

// Sample Selection
function selectSample(text) {
    document.getElementById('chatInput').value = text;
    sendMessage();
}

// Message Handling
function addMessage(content, isUser = false) {
    hideInitialScreen();
    const messagesContainer = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-enter';
    
    if (isUser) {
        messageDiv.innerHTML = `
            <div class="flex justify-end">
                <div class="bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-2xl rounded-tr-none p-4 max-w-[85%] shadow-sm">
                    <p class="text-sm">${content}</p>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="flex gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i class="fas fa-magic text-white text-sm"></i>
                </div>
                <div class="bg-white rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-sm">
                    <p class="text-sm text-gray-800">${content}</p>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Send Message - 2단계 통합: 로딩 화면 + 1+2단계 지침 통합
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 완료 상태에서는 입력 차단
    if (conversationState.step === 'completed') {
        addMessage("여행 정보 수집이 완료되었습니다. 새로운 여행을 계획하시려면 페이지를 새로고침해주세요.", false);
        return;
    }
    
    addMessage(message, true);
    input.value = '';
    
    // 첫 메시지인 경우 초기 화면 숨기기
    const isFirstMessage = conversationState.messages.length === 0;
    
    if (isFirstMessage) {
        hideInitialScreen();
    }
    
    // 모든 메시지에서 AI 응답 대기 중 타이핑 인디케이터 표시
    showTypingIndicator();
    
    try {
        // 대화 상태 업데이트
        conversationState.messages.push({role: 'user', content: message});
        conversationHistory.push({role: 'user', content: message});
        
        // 모든 메시지에서 일반 API 사용 (로딩 프로그레스 없음)
        // 스트리밍은 JSON 응답 처리 후 Preview 단계에서만 사용
        let aiResponse = await callGeminiAPI(message, conversationState.messages);
        
        // 모든 메시지에서 타이핑 인디케이터 숨기기
        hideTypingIndicator();
        
        console.log('🤖 AI 응답:', aiResponse);
        
        // 사용자 확인 응답 처리 (1단계 완료 후 상태인 경우)
        // UX Expert Approved: 키워드 매칭 제거 - 버튼 기반 UI로 대체됨
        if (conversationState.step === 'waiting_for_confirmation') {
            console.log('⚠️ 확인 대기 중에는 텍스트 입력이 제한됩니다. 확인 버튼을 사용해주세요.');
            addMessage("확인 버튼을 통해 선택해주세요! 😊", false);
            return; // 추가 처리 없이 종료
        }
        
        // JSON 응답 확인
        const jsonData = parseJSONResponse(aiResponse);
        
        if (jsonData) {
            console.log('📋 JSON 응답 감지됨!');
            
            // 2단계 응답인지 확인 (previewUI 포함)
            if (jsonData.systemData && jsonData.systemData.previewUI) {
                const handled = handlePreviewResponse(jsonData);
                if (handled) return;
            }
            
            // 1단계 응답 처리
            const handled = handleJSONResponse(jsonData);
            if (handled) return;
        }
        
        // 일반 응답 처리
        addMessage(aiResponse, false);
        
        // 대화 히스토리에 AI 응답 추가
        conversationState.messages.push({role: 'assistant', content: aiResponse});
        conversationHistory.push({role: 'assistant', content: aiResponse});
        
        console.log('💬 현재 대화 상태:', conversationState);
        
    } catch (error) {
        if (isFirstMessage) {
            hidePlanningLoader();
        } else {
            hideTypingIndicator();
        }
        console.error('❌ sendMessage 오류:', error);
        addMessage("죄송합니다. 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.", false);
    }
}

// Preview Actions (올바른 testLoading1 함수는 아래쪽에 위치)


// Preview Actions
function confirmPreview() {
    document.getElementById('previewModal').classList.add('hidden');
    document.getElementById('detailLoader').classList.remove('hidden');
    
    // Show tip text after 7 seconds
    setTimeout(() => {
        const tipText = document.getElementById('tipText');
        if (tipText) {
            tipText.classList.remove('opacity-0');
            tipText.classList.add('opacity-100');
        }
    }, 7000);
    
    // Dynamic tip changes
    const tips = [
        "💡 Tip: 현지인이 추천하는 숨은 명소도 찾고 있어요!",
        "🌟 Tip: 이동 시간을 최소화하는 최적 경로를 계산 중이에요",
        "🎯 Tip: 예산에 맞는 최고의 장소들을 선별하고 있어요"
    ];
    
    let tipIndex = 0;
    const tipInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % tips.length;
        const tipText = document.getElementById('tipText');
        if (tipText) {
            tipText.style.opacity = '0';
            setTimeout(() => {
                tipText.textContent = tips[tipIndex];
                tipText.style.opacity = '1';
            }, 300);
        }
    }, 2500);
    
    setTimeout(() => {
        clearInterval(tipInterval);
        document.getElementById('detailLoader').classList.add('hidden');
        showDetailedPlan();
        updateProgress(3);
    }, 10000); // 10 seconds
}

function editPreview() {
    document.getElementById('previewModal').classList.add('hidden');
    document.getElementById('chatInputContainer').style.display = 'block';
    addMessage("어떤 부분을 수정하고 싶으신가요? 구체적으로 말씀해주세요 😊");
    currentStep = 'editing';
}

// Detailed Plan
function showDetailedPlan() {
    // Sample detailed data
    detailedPlan = {
        days: [
            {
                day: "Day 1",
                date: "3월 15일 (금)",
                title: "도쿄 도착 & 아사쿠사",
                image: "https://picsum.photos/400/200?random=17",
                activities: [
                    { time: "14:00", activity: "나리타 공항 도착", detail: "공항 리무진 버스로 호텔 이동 (90분, ¥3,200)", icon: "✈️", type: "transport" },
                    { time: "16:00", activity: "호텔 체크인", detail: "신주쿠 그란벨 호텔", icon: "🏨", type: "accommodation" },
                    { time: "18:00", activity: "아사쿠사 관광", detail: "센소지 절, 나카미세 거리 쇼핑", icon: "⛩️", type: "sightseeing" },
                    { time: "20:00", activity: "저녁 식사", detail: "우나기동 맛집 '나카가와' (¥3,500)", icon: "🍜", type: "food" }
                ]
            },
            {
                day: "Day 2",
                date: "3월 16일 (토)",
                title: "시부야 & 하라주쿠",
                image: "https://picsum.photos/400/200?random=18",
                activities: [
                    { time: "09:00", activity: "호텔 조식", detail: "호텔 뷔페", icon: "🍳", type: "food" },
                    { time: "10:30", activity: "메이지 신궁", detail: "일본 전통 신사 관람 (무료)", icon: "⛩️", type: "sightseeing" },
                    { time: "12:00", activity: "하라주쿠 타케시타도리", detail: "쇼핑 & 크레페 맛집", icon: "🛍️", type: "shopping" },
                    { time: "15:00", activity: "시부야 스카이", detail: "전망대에서 도쿄 전경 (¥2,500)", icon: "🌃", type: "sightseeing" }
                ]
            }
        ]
    };
    
    const detailedContent = `
        <div class="space-y-4">
            ${detailedPlan.days.map((day, index) => `
                <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                    <!-- Day Header with Image -->
                    <div class="relative h-24">
                        <img src="${day.image}" alt="${day.title}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                            <div class="flex items-center justify-between w-full">
                                <div>
                                    <h4 class="font-bold text-white">${day.day}: ${day.title}</h4>
                                    <p class="text-white/80 text-xs">${day.date}</p>
                                </div>
                                <div class="bg-white/20 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center">
                                    <span class="text-white font-bold text-sm">${index + 1}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Activities -->
                    <div class="p-4 space-y-3">
                        ${day.activities.map((act, actIndex) => `
                            <div class="flex gap-3">
                                <div class="flex flex-col items-center">
                                    <span class="text-red-500 font-bold text-sm">${act.time}</span>
                                    ${actIndex < day.activities.length - 1 ? '<div class="w-0.5 h-12 bg-gray-200 mt-1"></div>' : ''}
                                </div>
                                <div class="flex-1">
                                    <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                        <div class="flex items-start gap-3">
                                            <span class="text-2xl">${act.icon}</span>
                                            <div class="flex-1">
                                                <p class="font-semibold text-gray-800 text-sm">${act.activity}</p>
                                                <p class="text-gray-600 text-xs mt-1">${act.detail}</p>
                                                ${act.type === 'food' || act.type === 'sightseeing' ? 
                                                    `<span class="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                        <i class="fas fa-check-circle mr-1"></i>예약 가능
                                                    </span>` : ''
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            
            <!-- Warning Box -->
            <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div class="flex gap-3">
                    <i class="fas fa-exclamation-triangle text-orange-500 mt-0.5"></i>
                    <div>
                        <p class="text-sm font-semibold text-gray-800">최종 확정 전 안내</p>
                        <p class="text-xs text-gray-600 mt-1">
                            확정 시 각 장소의 실시간 정보(영업시간, 가격 등)를 확인하여 최종 계획을 완성합니다.
                            확정 후에는 수정이 제한됩니다.
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Cost Summary -->
            <div class="bg-gray-50 rounded-xl p-4">
                <h5 class="font-semibold text-gray-800 text-sm mb-2">예상 비용 요약</h5>
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between">
                        <span class="text-gray-600">교통비</span>
                        <span class="font-semibold">¥12,400</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">입장료</span>
                        <span class="font-semibold">¥5,000</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">식사</span>
                        <span class="font-semibold">¥15,000</span>
                    </div>
                    <div class="border-t pt-1 mt-2">
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-800">총 예상 비용</span>
                            <span class="font-bold text-red-500">¥32,400</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('detailedContent').innerHTML = detailedContent;
    document.getElementById('detailedModal').classList.remove('hidden');
}

// Final Actions
function finalizeplan() {
    document.getElementById('detailedModal').classList.add('hidden');
    document.getElementById('finalLoader').classList.remove('hidden');
    
    // Animate API calls
    const apiItems = document.querySelectorAll('.api-item');
    apiItems.forEach((item, index) => {
        const delay = parseInt(item.dataset.delay);
        setTimeout(() => {
            const statusIcon = item.querySelector('.status-icon');
            statusIcon.innerHTML = '<i class="fas fa-check-circle text-green-500 text-xl api-complete"></i>';
        }, delay + 1000);
    });
    
    // Show success after all API calls
    setTimeout(() => {
        document.getElementById('finalLoader').classList.add('hidden');
        document.getElementById('successScreen').classList.remove('hidden');
    }, 4000);
}

function backToChat() {
    document.getElementById('detailedModal').classList.add('hidden');
    document.getElementById('chatInputContainer').style.display = 'block';
    addMessage("네, 다시 상담해드릴게요! 어떤 부분이 마음에 안 드셨나요? 🤔");
    currentStep = 'revising';
}

// PWA Actions
function viewApp() {
    window.open('https://your-pwa-link.com/trip/12345', '_blank');
}

function downloadPWA() {
    // PWA download logic
    alert('무료 앱 다운로드가 시작됩니다!');
}

// Input Handler
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Test Loading Functions
async function testLoading1() {
    const loader = document.getElementById('planningLoader');
    if (loader.classList.contains('hidden')) {
        loader.classList.remove('hidden');
        
        console.log('📋 1단계 로딩 화면 표시 + 즉시 2단계 API 호출 시작...');
        
        try {
            // 🎯 개선: 로딩과 동시에 즉시 2단계 Preview API 호출
            console.log('🎨 2단계 Preview 생성 API 호출 시작 (로딩과 동기화)');
            const previewData = await callPhase2PreviewAPI(conversationState.userData);
            
            console.log('✅ 2단계 Preview 생성 완료 - 로딩 종료 + Preview 표시');
            
            // API 응답 완료 즉시 로딩 숨기기
            loader.classList.add('hidden');
            
            // Preview 모달 표시
            if (previewData && previewData.systemData && previewData.systemData.previewUI) {
                showPreviewModal(previewData.systemData.previewUI);
            } else {
                console.log('⚠️ Preview 데이터 구조 확인:', previewData);
                // Preview UI 구조가 없는 경우 대체 표시
                addMessage("여행 계획 미리보기를 준비 중입니다. 잠시만 기다려주세요.", false);
            }
        } catch (error) {
            console.error('❌ 1단계 로딩 중 2단계 Preview 생성 실패:', error);
            loader.classList.add('hidden'); // 오류 시에도 로딩 숨기기
            addMessage("죄송합니다. Preview 생성 중 오류가 발생했습니다. 다시 시도해주세요.", false);
        }
    } else {
        loader.classList.add('hidden');
    }
}

async function testLoading2() {
    console.log('🧪 2단계 로딩 애니메이션 테스트 시작');
    
    // 2단계 로딩 애니메이션 시작
    const intervalId = startPlanLoadingAnimation();
    
    // 5초 후 자동으로 중지 (테스트용)
    setTimeout(() => {
        stopPlanLoadingAnimation(intervalId);
        console.log('🧪 2단계 로딩 애니메이션 테스트 완료');
    }, 5000);
}


// Parse Second Step JSON to UI Format
function parseSecondStepJSON(aiResponse) {
    try {
        console.log('🔍 2단계 JSON 응답 파싱 시작...');
        
        // Extract JSON from AI response (similar to existing parseJSONResponse)
        let cleanResponse = aiResponse;
        
        // Remove markdown code blocks if present
        const codeBlockMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            cleanResponse = codeBlockMatch[1];
        }
        
        // Extract complete JSON object
        function extractCompleteJSON(text) {
            const firstBrace = text.indexOf('{');
            if (firstBrace === -1) return null;
            
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;
            
            for (let i = firstBrace; i < text.length; i++) {
                const char = text[i];
                
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                
                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }
                
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                
                if (!inString) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            return text.substring(firstBrace, i + 1);
                        }
                    }
                }
            }
            
            return null;
        }
        
        const jsonStr = extractCompleteJSON(cleanResponse);
        if (!jsonStr) {
            console.error('❌ 완전한 JSON 구조를 찾을 수 없습니다.');
            return null;
        }
        
        const secondStepData = JSON.parse(jsonStr);
        console.log('✅ 2단계 JSON 파싱 완료:', secondStepData);
        
        // Convert complex second step structure to simple UI format
        const tripPlan = secondStepData.tripPlan;
        if (!tripPlan || !tripPlan.itinerary) {
            console.error('❌ tripPlan 또는 itinerary가 없습니다.');
            return null;
        }
        
        // Map to current UI structure
        const uiData = {
            destination: tripPlan.tripInfo?.destination || '목적지',
            period: `${tripPlan.tripInfo?.totalDays || 3}일`,
            travelers: formatTravelers(tripPlan.tripInfo?.travelers),
            timeline: tripPlan.itinerary.map((day, index) => ({
                title: day.dayTheme || `${day.dayNumber}일차`,
                date: day.date || `2024-09-${25 + index}`,
                day: day.dayNumber || (index + 1),
                activities: day.activities.map(activity => ({
                    time: activity.timeSlot?.start || '00:00',
                    activity: activity.mainLocation?.name || activity.activityName || '활동',
                    location: activity.mainLocation?.description || '위치',
                    emoji: activity.emoji || '📍',
                    duration: activity.mainLocation?.duration || '',
                    tips: selectBestTip(activity)
                }))
            })),
            // Add budget info if available
            totalBudget: tripPlan.budgetBreakdown?.totalBudget || Math.floor(Math.random() * 150000 + 120000)
        };
        
        console.log('✅ UI 형식으로 변환 완료:', uiData);
        return uiData;
        
    } catch (error) {
        console.error('❌ 2단계 JSON 파싱 오류:', error);
        return null;
    }
}

// Helper function to format travelers info
function formatTravelers(travelers) {
    if (!travelers) return '1명';
    
    const adults = travelers.adults || 0;
    const children = travelers.children || 0;
    
    if (adults === 1 && children === 0) return '혼자';
    if (adults === 2 && children === 0) return '커플';
    if (adults >= 2 && children > 0) return '가족';
    if (adults > 2 && children === 0) return '친구들';
    
    return `성인 ${adults}명${children > 0 ? `, 아이 ${children}명` : ''}`;
}

// Helper function to select best tip from activity data
function selectBestTip(activity) {
    // Priority order for tip selection
    if (activity.tips && activity.tips.length > 0) {
        return activity.tips[0];
    }
    
    if (activity.mainLocation?.reasonForSelection) {
        return activity.mainLocation.reasonForSelection;
    }
    
    if (activity.description) {
        return activity.description;
    }
    
    return null;
}

// Enhanced Mock Data Generation Function - 2024 Figma Community Style
function getMockTravelData() {
    return {
        title: "🗾 제주도 2박3일 가족여행",
        destination: "제주도",
        period: "2박3일", 
        budget: "35만원/인",
        travelers: "가족 4명",
        
        // Preview Section Data (주요 방문지 하이라이트)
        highlights: [
            {
                emoji: "🌋",
                title: "성산일출봉",
                description: "세계자연유산 일출 명소",
                time: "첫째날 오전"
            },
            {
                emoji: "🏛️",
                title: "우도",
                description: "에메랄드 바다 섬 여행",
                time: "첫째날 오후"
            },
            {
                emoji: "🌺",
                title: "한라산 1100도로",
                description: "단풍과 자연휴양림",
                time: "둘째날 오전"
            },
            {
                emoji: "🏖️",
                title: "협재해수욕장",
                description: "에메랄드빛 해변",
                time: "둘째날 오후"
            }
        ],
        
        // Detailed Timeline Data (상세 일정)
        timeline: [
            {
                day: 1,
                title: "첫째날 - 동부 지역 탐방",
                date: "2024년 8월 15일 (목)",
                activities: [
                    {
                        time: "07:00",
                        activity: "김포공항 출발",
                        location: "김포국제공항",
                        duration: "1시간 30분",
                        tips: "온라인 체크인 미리 완료",
                        emoji: "✈️"
                    },
                    {
                        time: "09:30",
                        activity: "제주공항 도착 후 렌터카 픽업",
                        location: "제주국제공항",
                        duration: "1시간",
                        tips: "국제면허증 준비 필수",
                        emoji: "🚗"
                    },
                    {
                        time: "11:00",
                        activity: "성산일출봉 등반",
                        location: "성산일출봉",
                        duration: "2시간",
                        tips: "편한 운동화 착용 권장",
                        emoji: "🌋"
                    },
                    {
                        time: "14:00",
                        activity: "우도 페리 및 섬 관광",
                        location: "우도",
                        duration: "3시간",
                        tips: "우도 땅콩아이스크림 필수",
                        emoji: "🏛️"
                    },
                    {
                        time: "18:00",
                        activity: "성산포 해산물 저녁식사",
                        location: "성산포항",
                        duration: "1시간 30분",
                        tips: "싱싱한 회와 성게미역국",
                        emoji: "🦞"
                    },
                    {
                        time: "20:00",
                        activity: "숙소 체크인 및 휴식",
                        location: "제주시 호텔",
                        duration: "",
                        tips: "내일 일정 확인",
                        emoji: "🏨"
                    }
                ]
            },
            {
                day: 2,
                title: "둘째날 - 중산간 & 서부 지역",
                date: "2024년 8월 16일 (금)",
                activities: [
                    {
                        time: "08:00",
                        activity: "호텔 조식 및 체크아웃",
                        location: "제주시 호텔",
                        duration: "1시간",
                        tips: "짐은 차에 보관",
                        emoji: "🍳"
                    },
                    {
                        time: "09:30",
                        activity: "한라산 1100도로 드라이브",
                        location: "1100고지 휴양림",
                        duration: "2시간",
                        tips: "단풍 사진 촬영 명소",
                        emoji: "🌺"
                    },
                    {
                        time: "12:00",
                        activity: "중문관광단지 점심",
                        location: "중문단지",
                        duration: "1시간",
                        tips: "흑돼지 맛집 추천",
                        emoji: "🍖"
                    },
                    {
                        time: "14:00",
                        activity: "협재해수욕장 해변 산책",
                        location: "협재해수욕장",
                        duration: "2시간",
                        tips: "에메랄드빛 바다 감상",
                        emoji: "🏖️"
                    },
                    {
                        time: "17:00",
                        activity: "한림공원 관람",
                        location: "한림공원",
                        duration: "1시간 30분",
                        tips: "아이들이 좋아하는 식물원",
                        emoji: "🌺"
                    },
                    {
                        time: "19:00",
                        activity: "애월 맛집 저녁식사",
                        location: "애월읍",
                        duration: "1시간 30분",
                        tips: "애월 고등어구이 맛집",
                        emoji: "🐟"
                    }
                ]
            },
            {
                day: 3,
                title: "셋째날 - 마무리 및 출발",
                date: "2024년 8월 17일 (토)",
                activities: [
                    {
                        time: "09:00",
                        activity: "동문시장 쇼핑",
                        location: "제주 동문시장",
                        duration: "1시간 30분",
                        tips: "제주 특산품 구매",
                        emoji: "🛍️"
                    },
                    {
                        time: "11:00",
                        activity: "용두암 관광",
                        location: "용두암",
                        duration: "30분",
                        tips: "빠른 포토타임",
                        emoji: "🗿"
                    },
                    {
                        time: "12:00",
                        activity: "공항 이동 및 렌터카 반납",
                        location: "제주국제공항",
                        duration: "1시간",
                        tips: "출발 2시간 전 도착",
                        emoji: "🚗"
                    },
                    {
                        time: "14:30",
                        activity: "제주공항 출발",
                        location: "제주국제공항",
                        duration: "1시간 30분",
                        tips: "기념품 마지막 구매",
                        emoji: "✈️"
                    },
                    {
                        time: "16:00",
                        activity: "김포공항 도착",
                        location: "김포국제공항",
                        duration: "",
                        tips: "즐거운 여행 마무리",
                        emoji: "🏠"
                    }
                ]
            }
        ]
    };
}

// Integrated Plan Modal Functions
function showIntegratedPlanModal(travelData) {
    const modal = document.getElementById('integratedPlanModal');
    
    // Update modal title
    document.getElementById('integratedTitle').textContent = travelData.title;
    
    // Populate highlights grid
    const highlightsGrid = document.getElementById('highlightsGrid');
    highlightsGrid.innerHTML = travelData.highlights.map(highlight => `
        <div class="highlight-card flex-shrink-0 bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 w-32">
            <div class="text-2xl mb-1 text-center">${highlight.emoji}</div>
            <h3 class="font-semibold text-gray-800 mb-1 text-sm text-center">${highlight.title}</h3>
            <p class="text-xs text-gray-600 mb-1 text-center line-clamp-2">${highlight.description}</p>
            <span class="text-xs bg-blue-100 text-blue-600 px-1 py-0.5 rounded text-center block">${highlight.time}</span>
        </div>
    `).join('');
    
    // Populate detailed timeline (initially hidden)
    const detailedSection = document.getElementById('detailedSection');
    detailedSection.innerHTML = `
        <div class="px-6 pb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <!-- Budget Card -->
                <div class="budget-card bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-green-800">예상 예산</h3>
                            <p class="text-2xl font-bold text-green-600">${travelData.budget}</p>
                        </div>
                        <div class="text-3xl floating-emoji">💰</div>
                    </div>
                </div>
                
                <!-- Travelers Card -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-purple-800">여행인원</h3>
                            <p class="text-sm text-purple-600">${travelData.travelers}</p>
                        </div>
                        <div class="text-3xl">👨‍👩‍👧‍👦</div>
                    </div>
                </div>
                
                <!-- Period Card -->
                <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-orange-800">여행기간</h3>
                            <p class="text-lg font-bold text-orange-600">${travelData.period}</p>
                        </div>
                        <div class="text-3xl">📅</div>
                    </div>
                </div>
            </div>
            
            <!-- Timeline -->
            <div class="space-y-6">
                ${travelData.timeline.map(day => `
                    <div class="timeline-day border-l-4 border-blue-300 pl-6 relative">
                        <div class="absolute w-4 h-4 bg-blue-500 rounded-full -left-2.5 top-0"></div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${day.title}</h3>
                        <p class="text-sm text-gray-500 mb-4">${day.date}</p>
                        
                        <div class="space-y-3">
                            ${day.activities.map(activity => `
                                <div class="timeline-activity bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                                    <div class="flex items-start gap-3">
                                        <div class="flex-shrink-0">
                                            <span class="text-2xl">${activity.emoji}</span>
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-1">
                                                <span class="text-sm font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">${activity.time}</span>
                                                ${activity.duration ? `<span class="text-xs text-gray-500">${activity.duration}</span>` : ''}
                                            </div>
                                            <h4 class="font-bold text-gray-800 mb-1">${activity.activity}</h4>
                                            <p class="text-sm text-gray-600 mb-2">📍 ${activity.location}</p>
                                            ${activity.tips ? `<p class="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200">💡 ${activity.tips}</p>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Show modal with animation
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('show');
    }, 50);
}

function toggleDetailedView() {
    const detailedSection = document.getElementById('detailedSection');
    const toggleBtn = document.getElementById('toggleDetailBtn');
    
    if (detailedSection.classList.contains('hidden')) {
        // Show detailed view
        detailedSection.classList.remove('hidden');
        toggleBtn.innerHTML = '📋 상세 일정 접기 ▲';
        toggleBtn.classList.add('active');
        
        // Smooth expand animation
        setTimeout(() => {
            detailedSection.style.maxHeight = detailedSection.scrollHeight + 'px';
        }, 10);
        
    } else {
        // Hide detailed view
        detailedSection.style.maxHeight = '0';
        toggleBtn.innerHTML = '📋 상세 일정 보기 ▼';
        toggleBtn.classList.remove('active');
        
        setTimeout(() => {
            detailedSection.classList.add('hidden');
        }, 300);
    }
}

function closeIntegratedModal() {
    const modal = document.getElementById('integratedPlanModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function requestModification() {
    closeIntegratedModal();
    
    // Re-enable chat and show modification request message
    enableChatInput();
    addMessage('system', '✏️ 어떤 부분을 수정하고 싶으신가요? 구체적으로 말씀해 주시면 반영해드릴게요!');
    
    console.log('🔄 사용자가 여행계획 수정을 요청했습니다.');
}

function confirmIntegratedPlan() {
    closeIntegratedModal();
    
    // Show final confirmation and proceed to next step
    addMessage('system', '🎉 멋진 여행계획이 확정되었습니다! 이제 개인 전용 여행앱을 생성해드릴게요.');
    
    // Start final loading (3rd phase)
    setTimeout(() => {
        testLoading3();
    }, 2000);
    
    console.log('✅ 사용자가 여행계획을 최종 확정했습니다.');
}

// Restored Detail Modal Function - Original Design
function showModernDetailModal(travelData) {
    // Generate detailed content based on original design from chatbot_ver2_exam.html
    const detailedContent = `
        <div class="space-y-4">
            ${travelData.timeline.map((day, dayIndex) => `
                <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                    <!-- Day Header with Image -->
                    <div class="relative h-24">
                        <img src="https://picsum.photos/400/200?random=${dayIndex + 100}" alt="${day.title}" class="w-full h-full object-cover" 
                             onerror="this.src='https://picsum.photos/400/200?random=${dayIndex + 200}'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                            <div class="flex items-center justify-between w-full">
                                <div>
                                    <h4 class="font-bold text-white">${day.title}</h4>
                                    <p class="text-white/80 text-xs">${day.date}</p>
                                </div>
                                <div class="bg-white/20 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center">
                                    <span class="text-white font-bold text-sm">${day.day}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Activities -->
                    <div class="p-4 space-y-3">
                        ${day.activities.map((activity, actIndex) => `
                            <div class="flex gap-3">
                                <div class="flex flex-col items-center">
                                    <span class="text-red-500 font-bold text-sm">${activity.time}</span>
                                    ${actIndex < day.activities.length - 1 ? '<div class="w-0.5 h-16 bg-gray-200 mt-1"></div>' : ''}
                                </div>
                                <div class="flex-1">
                                    <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                        <div class="flex items-start gap-3">
                                            <span class="text-2xl">${activity.emoji}</span>
                                            <div class="flex-1">
                                                <p class="font-semibold text-gray-800 text-sm">${activity.activity}</p>
                                                <p class="text-gray-600 text-xs mt-1">${activity.location}${activity.duration ? ` (${activity.duration})` : ''}</p>
                                                ${activity.tips ? `
                                                    <span class="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full tip-text-short">
                                                        <i class="fas fa-lightbulb mr-1"></i>${optimizeTipText(activity.tips)}
                                                    </span>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            
            <!-- Warning Box -->
            <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div class="flex gap-3">
                    <i class="fas fa-exclamation-triangle text-orange-500 mt-0.5"></i>
                    <div>
                        <p class="text-sm font-semibold text-gray-800">최종 확정 전 안내</p>
                        <p class="text-xs text-gray-600 mt-1">
                            확정 시 각 장소의 실시간 정보(영업시간, 가격 등)를 확인하여 최종 계획을 완성합니다.
                            확정 후에는 수정이 제한됩니다.
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Cost Summary -->
            <div class="bg-gray-50 rounded-xl p-4">
                <h5 class="font-semibold text-gray-800 text-sm mb-2">예상 비용 요약</h5>
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between">
                        <span class="text-gray-600">교통비</span>
                        <span class="font-semibold">${Math.floor(Math.random() * 50000 + 30000).toLocaleString()}원</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">입장료</span>
                        <span class="font-semibold">${Math.floor(Math.random() * 30000 + 20000).toLocaleString()}원</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">식사</span>
                        <span class="font-semibold">${Math.floor(Math.random() * 80000 + 60000).toLocaleString()}원</span>
                    </div>
                    <div class="border-t pt-1 mt-2">
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-800">총 예상 비용</span>
                            <span class="font-bold text-red-500">${Math.floor(Math.random() * 150000 + 120000).toLocaleString()}원</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('detailedContent').innerHTML = detailedContent;
    document.getElementById('detailedModal').classList.remove('hidden');
}

function testLoading3() {
    const loader = document.getElementById('finalLoader');
    if (loader.classList.contains('hidden')) {
        loader.classList.remove('hidden');
        
        // Animate API calls
        const apiItems = document.querySelectorAll('.api-item');
        apiItems.forEach((item, index) => {
            // Reset to spinner first
            const statusIcon = item.querySelector('.status-icon');
            statusIcon.innerHTML = '<div class="w-5 h-5 border-2 border-gray-300 rounded-full spinner"></div>';
            
            // Then animate to check
            const delay = parseInt(item.dataset.delay);
            setTimeout(() => {
                statusIcon.innerHTML = '<i class="fas fa-check-circle text-green-500 text-xl api-complete"></i>';
            }, delay + 1000);
        });
    } else {
        loader.classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Focus on input
    document.getElementById('chatInput').focus();
    
    // UX Expert Approved: 확인 버튼 이벤트 리스너 추가
    const modifyBtn = document.getElementById('modifyBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    
    if (modifyBtn) {
        modifyBtn.addEventListener('click', handleModifyRequest);
        console.log('✅ 수정 버튼 이벤트 리스너 등록 완료');
    } else {
        console.warn('⚠️ 수정 버튼 요소를 찾을 수 없습니다');
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleConfirmPlan);
        console.log('✅ 확정 버튼 이벤트 리스너 등록 완료');
    } else {
        console.warn('⚠️ 확정 버튼 요소를 찾을 수 없습니다');
    }
    
    console.log('🎯 UX 개선: 버튼 기반 확인 시스템 초기화 완료');
    
    // Initialize image carousel
    initializeImageCarousel();
    
    // Initialize flippable hint cards
    initializeFlippableHints();
});

// 2단계 로딩 애니메이션 함수들
const startPlanLoadingAnimation = () => {
    const planGenerationLoader = document.getElementById('planGenerationLoader');
    const loadingIconContainer = document.getElementById('plan-loading-icon-container');
    const loadingText = document.getElementById('plan-loading-text');
    const icons = loadingIconContainer.querySelectorAll('i');
    const texts = [
        "항공편 정보를 확인 중입니다...", 
        "최적의 숙소를 검색 중입니다...",
        "현지 맛집을 수집 중입니다...", 
        "최고의 동선을 분석 중입니다..."
    ];
    let currentIndex = 0;

    // 로딩 오버레이 표시
    planGenerationLoader.classList.remove('hidden');
    setTimeout(() => planGenerationLoader.classList.add('active'), 10);

    // 아이콘과 텍스트 순환 애니메이션
    const intervalId = setInterval(() => {
        // 모든 아이콘에서 active 클래스 제거
        icons.forEach(icon => icon.classList.remove('active'));
        
        // 다음 아이콘으로 이동
        currentIndex = (currentIndex + 1) % icons.length;
        
        // 현재 아이콘 활성화 및 텍스트 변경
        icons[currentIndex].classList.add('active');
        loadingText.textContent = texts[currentIndex];
    }, 1500);

    console.log('🔄 2단계 로딩 애니메이션 시작');
    return intervalId;
};

const stopPlanLoadingAnimation = (intervalId) => {
    const planGenerationLoader = document.getElementById('planGenerationLoader');
    
    // 애니메이션 중지
    if (intervalId) {
        clearInterval(intervalId);
    }
    
    // 오버레이 숨기기
    planGenerationLoader.classList.remove('active');
    setTimeout(() => planGenerationLoader.classList.add('hidden'), 300);
    
    console.log('✅ 2단계 로딩 애니메이션 중지');
};

// Image Carousel Functionality
function initializeImageCarousel() {
    const carouselImages = document.querySelectorAll('.carousel-image');
    let currentIndex = 0;
    
    if (carouselImages.length === 0) return;
    
    // Start carousel rotation
    setInterval(() => {
        // Hide current image
        carouselImages[currentIndex].classList.remove('active');
        carouselImages[currentIndex].classList.add('exiting');
        
        // Move to next image
        currentIndex = (currentIndex + 1) % carouselImages.length;
        
        // Show next image
        setTimeout(() => {
            carouselImages.forEach(img => img.classList.remove('exiting'));
            carouselImages[currentIndex].classList.add('active');
        }, 400);
        
    }, 2000); // Change image every 2 seconds
    
    console.log('🎠 이미지 캐러셀 초기화 완료');
}

// Calculate and Update Trip Duration
function calculateTripDuration(startDate, endDate) {
    if (!startDate || !endDate) return '기간 계산중';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const nights = daysDiff - 1;
    
    if (nights <= 0) return '당일여행';
    return `${nights}박 ${daysDiff}일`;
}

// Update duration display when loading starts
function updateTripDurationDisplay() {
    const firstStepData = localStorage.getItem('firstStepData');
    if (firstStepData) {
        try {
            const data = JSON.parse(firstStepData);
            const systemData = data.systemData;
            if (systemData && systemData.startDate && systemData.endDate) {
                const duration = calculateTripDuration(systemData.startDate, systemData.endDate);
                const durationDisplay = document.getElementById('tripDurationDisplay');
                if (durationDisplay) {
                    durationDisplay.textContent = duration;
                    console.log('📅 여행 기간 업데이트:', duration);
                }
            }
        } catch (error) {
            console.error('❌ 여행 기간 계산 오류:', error);
        }
    }
}

// Optimize tip text length
function optimizeTipText(tipText, maxLength = 25) {
    if (!tipText || tipText.length <= maxLength) return tipText;
    return tipText.substring(0, maxLength - 3) + '...';
}

// Initialize flippable hint cards
function initializeFlippableHints() {
    const hintCards = document.querySelectorAll('.hint-card');
    
    hintCards.forEach((card, index) => {
        // Make cards flippable
        card.classList.add('flippable');
        
        // Create front and back content
        const originalContent = card.innerHTML;
        const backTexts = [
            '🎮 TGS 2024 최신 정보 수집중',
            '🍜 미슐랭 가이드 맛집 분석중', 
            '💰 최고 가성비 루트 탐색중'
        ];
        
        const backContent = originalContent.replace(
            card.querySelector('span').textContent, 
            backTexts[index] || '특별한 정보 준비중'
        );
        
        card.innerHTML = `
            <div class="hint-front">${originalContent}</div>
            <div class="hint-back">${backContent}</div>
        `;
        
        // Add flip animation on interval
        setTimeout(() => {
            setInterval(() => {
                card.classList.toggle('flipped');
            }, 4000 + index * 500); // Staggered flip timing
        }, 2000 + index * 300);
    });
    
    console.log('🔄 힌트 카드 플립 애니메이션 초기화 완료');
}

// Enhanced timeline height adjustment
function adjustTimelineHeight() {
    const timelineConnectors = document.querySelectorAll('.w-0\\.5.h-12');
    timelineConnectors.forEach(connector => {
        const parentActivity = connector.closest('.flex.gap-3');
        if (parentActivity) {
            const activityContent = parentActivity.querySelector('.bg-gray-50');
            if (activityContent) {
                const contentHeight = activityContent.offsetHeight;
                connector.style.height = `${Math.max(48, contentHeight - 8)}px`;
            }
        }
    });
}

