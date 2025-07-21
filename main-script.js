/**
 * 동적 생성된 여행 PWA 스크립트
 * localStorage에서 여행 데이터를 로드하여 템플릿에 적용
 */

class TravelAppLoader {
    constructor() {
        this.sessionId = this.getSessionIdFromURL();
        this.travelData = null;
        this.currentPage = 0;
        this.totalPages = 0;
        
        this.init();
    }

    getSessionIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('session');
    }

    init() {
        // URL에 세션 ID가 있으면 동적 데이터 로드, 없으면 기본 마카오 데이터 사용
        if (this.sessionId) {
            this.loadDynamicContent();
        } else {
            this.loadDefaultContent();
        }
        
        this.setupEventListeners();
        this.setupPWAInstallPrompt();
    }

    loadDynamicContent() {
        try {
            let rawData = null;
            
            console.log('🔍 세션 ID:', this.sessionId);
            console.log('🔍 localStorage 키들:', Object.keys(localStorage));
            
            // 1. localStorage에서 데이터 찾기 (우선순위)
            const storedData = localStorage.getItem(`generatedApp_${this.sessionId}`);
            console.log('🔍 찾는 키:', `generatedApp_${this.sessionId}`);
            console.log('🔍 저장된 데이터:', storedData);
            
            if (storedData) {
                rawData = JSON.parse(storedData);
                console.log('✅ localStorage 여행 데이터 로드:', rawData);
            }
            // 2. 서버에서 생성된 PWA의 경우 window.TRAVEL_DATA 사용 (폴백)
            else if (window.TRAVEL_DATA) {
                rawData = window.TRAVEL_DATA;
                console.log('✅ 서버 생성 여행 데이터 로드 (폴백):', rawData);
            }
            
            if (rawData) {
                // 데이터 구조 정규화 (mock_resp.json 또는 간단한 구조 모두 지원)
                this.travelData = this.normalizeData(rawData);
                console.log('✅ 정규화된 여행 데이터:', this.travelData);
                this.renderDynamicContent();
            } else {
                console.warn('⚠️ 세션 데이터를 찾을 수 없어 기본 콘텐츠로 대체');
                this.loadDefaultContent();
            }
        } catch (error) {
            console.error('❌ 동적 콘텐츠 로드 실패:', error);
            this.loadDefaultContent();
        }
    }

    normalizeData(rawData) {
        // mock_resp.json 구조 감지 (tripMeta, mainPlan 존재)
        if (rawData.tripMeta && rawData.mainPlan) {
            console.log('📊 mock_resp.json 구조 감지, 정규화 중...');
            return this.normalizeMockRespData(rawData);
        }
        // 기존 간단한 구조 (title, destination, days 등)
        else if (rawData.title && rawData.destination) {
            console.log('📊 간단한 구조 감지, 정규화 중...');
            return this.normalizeSimpleData(rawData);
        }
        // 알 수 없는 구조
        else {
            console.warn('⚠️ 알 수 없는 데이터 구조, 기본값 사용');
            return this.getDefaultData();
        }
    }

    normalizeMockRespData(mockData) {
        const tripMeta = mockData.tripMeta;
        const mainPlan = mockData.mainPlan;
        
        // 일차별 데이터 변환
        const days = mainPlan.dailyPlans.map(dayPlan => ({
            day: dayPlan.day,
            date: dayPlan.date,
            title: `DAY ${dayPlan.day}`,
            subtitle: dayPlan.dayTheme,
            description: dayPlan.dayDescription,
            activities: dayPlan.activities.map(activity => ({
                id: activity.id,
                time: activity.time,
                duration: activity.duration,
                type: activity.type,
                category: activity.category,
                title: activity.title,
                description: activity.description,
                place: activity.mainPlace ? {
                    name: activity.mainPlace.placeDetails?.name,
                    address: activity.mainPlace.placeDetails?.address,
                    rating: activity.mainPlace.placeDetails?.rating,
                    reviewCount: activity.mainPlace.placeDetails?.reviewCount,
                    photos: activity.mainPlace.placeDetails?.photos || [],
                    mapLink: activity.mainPlace.placeDetails?.mapLink,
                    placeId: activity.mainPlace.placeDetails?.placeId
                } : null,
                recommendedRestaurants: activity.recommendedRestaurants || [],
                alternativePlaces: activity.alternativePlaces || [],
                tips: activity.tips || [],
                cost: activity.estimatedCost || null
            }))
        }));

        return {
            title: `${tripMeta.destination} ${tripMeta.duration}`,
            destination: tripMeta.destination,
            duration: tripMeta.duration,
            startDate: tripMeta.startDate,
            endDate: tripMeta.endDate,
            tripType: tripMeta.tripType,
            planConfidence: tripMeta.planConfidence,
            seasonalConsiderations: tripMeta.seasonalConsiderations,
            planName: mainPlan.planName,
            planDescription: mainPlan.description,
            planHighlights: mainPlan.planHighlights,
            days: days,
            budget: mockData.budget || '예산 미정',
            tips: mockData.tips || [],
            todos: this.generateTodoList(tripMeta.destination, tripMeta.duration),
            sessionId: Date.now().toString(),
            createdAt: new Date().toISOString(),
            isEnriched: true
        };
    }

    normalizeSimpleData(simpleData) {
        return {
            ...simpleData,
            days: simpleData.days || [],
            budget: simpleData.budget || '예산 미정',
            tips: simpleData.tips || [],
            todos: simpleData.todos || [],
            isEnriched: false
        };
    }

    getDefaultData() {
        return {
            title: '마카오 가족여행',
            destination: '마카오',
            duration: '3박4일',
            days: [
                { day: 1, title: 'DAY 1', subtitle: '마카오 도착 & 세나도 광장 탐방' },
                { day: 2, title: 'DAY 2', subtitle: '코타이 리조트 & 베네치안 마카오' },
                { day: 3, title: 'DAY 3', subtitle: '마카오 타워 & 라자루스 섬' },
                { day: 4, title: 'DAY 4', subtitle: '기념품 쇼핑 & 출국' }
            ],
            budget: '1인당 약 80만원',
            isDefault: true,
            isEnriched: false
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

    loadDefaultContent() {
        // 기본 마카오 여행 데이터 (기존 main.html 콘텐츠)
        this.travelData = {
            title: '마카오 가족여행',
            destination: '마카오',
            duration: '3박4일',
            days: [
                { day: 1, theme: '마카오 도착 & 세나도 광장 탐방' },
                { day: 2, theme: '코타이 리조트 & 베네치안 마카오' },
                { day: 3, theme: '마카오 타워 & 라자루스 섬' },
                { day: 4, theme: '기념품 쇼핑 & 출국' }
            ],
            budget: '1인당 약 80만원',
            isDefault: true
        };
        
        console.log('📋 기본 마카오 데이터 사용');
        this.renderDynamicContent();
    }

    renderDynamicContent() {
        // 템플릿 플레이스홀더 치환
        this.replacePlaceholders();
        
        // 헤더 업데이트
        this.updateHeader();
        
        // 탭 구조 업데이트  
        this.updateTabs();
        
        // 페이지 콘텐츠 로드
        this.loadPages();
        
        // 페이지 인디케이터 업데이트
        this.updatePageIndicators();
        
        // PWA 매니페스트 동적 생성
        this.generateManifest();
    }

    replacePlaceholders() {
        if (!this.travelData) {
            console.warn('⚠️ 여행 데이터가 없어 플레이스홀더 치환을 건너뜁니다');
            return;
        }
        
        // 여행 기본 정보
        const title = this.travelData.title || '나의 여행';
        const destination = this.travelData.destination || '여행지';
        const destinationEmoji = this.getDestinationEmoji(destination);
        
        // title 태그 업데이트
        document.title = title;
        
        // 모든 플레이스홀더를 직접 치환
        const placeholders = [
            { selector: 'title', placeholder: '{{TRIP_TITLE}}', value: title },
            { selector: 'meta[name="apple-mobile-web-app-title"]', attribute: 'content', placeholder: '{{TRIP_TITLE}}', value: title },
            { selector: 'link[rel="icon"]', attribute: 'href', placeholder: '{{DESTINATION_EMOJI}}', value: destinationEmoji },
            { selector: 'link[rel="apple-touch-icon"]', attribute: 'href', placeholder: '{{DESTINATION_EMOJI}}', value: destinationEmoji }
        ];
        
        placeholders.forEach(item => {
            const elements = document.querySelectorAll(item.selector);
            elements.forEach(element => {
                if (item.attribute) {
                    const currentValue = element.getAttribute(item.attribute);
                    if (currentValue && currentValue.includes(item.placeholder)) {
                        element.setAttribute(item.attribute, currentValue.replace(new RegExp(item.placeholder, 'g'), item.value));
                    }
                } else {
                    if (element.textContent.includes(item.placeholder)) {
                        element.textContent = element.textContent.replace(new RegExp(item.placeholder, 'g'), item.value);
                    }
                }
            });
        });
        
        // DOM 전체에서 텍스트 플레이스홀더 치환
        this.replaceTextInDOM(document.body, '{{TRIP_TITLE}}', title);
        this.replaceTextInDOM(document.body, '{{DESTINATION}}', destination);
        this.replaceTextInDOM(document.body, '{{DESTINATION_EMOJI}}', destinationEmoji);
        this.replaceTextInDOM(document.body, '{{DURATION}}', this.travelData.duration || '여행');
        
        console.log('✅ 템플릿 플레이스홀더 치환 완료:', { title, destination, destinationEmoji });
    }
    
    replaceTextInDOM(element, placeholder, value) {
        if (element.nodeType === Node.TEXT_NODE) {
            if (element.textContent.includes(placeholder)) {
                element.textContent = element.textContent.replace(new RegExp(placeholder, 'g'), value);
            }
        } else if (element.nodeType === Node.ELEMENT_NODE) {
            // 스크립트 태그는 건드리지 않음
            if (element.tagName !== 'SCRIPT') {
                for (let child of element.childNodes) {
                    this.replaceTextInDOM(child, placeholder, value);
                }
            }
        }
    }

    updateHeader() {
        // 헤더 정보 업데이트
        const tripTitle = document.querySelector('.header h1');
        const tripSubtitle = document.querySelector('.header p');
        
        if (tripTitle) {
            tripTitle.textContent = this.travelData.title || '나의 여행';
        }
        
        if (tripSubtitle) {
            const destination = this.travelData.destination || '여행지';
            const duration = this.travelData.duration || '여행';
            const emoji = this.getDestinationEmoji(destination);
            tripSubtitle.innerHTML = `${emoji} ${destination} ${duration}`;
        }
    }

    getDestinationEmoji(destination = null) {
        const dest = (destination || this.travelData.destination || '').toLowerCase();
        const emojiMap = {
            '마카오': '🇲🇴',
            '일본': '🇯🇵',
            '중국': '🇨🇳',
            '태국': '🇹🇭',
            '베트남': '🇻🇳',
            '대만': '🇹🇼',
            '싱가포르': '🇸🇬',
            '말레이시아': '🇲🇾',
            '필리핀': '🇵🇭',
            '인도네시아': '🇮🇩',
            '제주도': '🏝️',
            '부산': '🏖️',
            '서울': '🏙️'
        };
        
        for (const [place, emoji] of Object.entries(emojiMap)) {
            if (dest.includes(place)) {
                return emoji;
            }
        }
        
        return '✈️'; // 기본 이모지
    }

    updateTabs() {
        const topNav = document.getElementById('top-nav');
        if (!topNav) {
            console.warn('⚠️ top-nav 요소를 찾을 수 없습니다');
            return;
        }

        const days = this.travelData.days || [];
        this.totalPages = days.length;

        // 탭 HTML 생성 (template-test 스타일)
        const tabsHtml = days.map((day, index) => `
            <button class="nav-tab flex-shrink-0 py-3 px-1 border-b-2 border-transparent text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition ${index === 0 ? 'active' : ''}" data-page="${index}">
                ${day.title || `DAY ${day.day}`}
            </button>
        `).join('');

        // top-nav 내부의 flex 컨테이너 찾기
        const flexContainer = topNav.querySelector('.flex.items-center.gap-4.overflow-x-auto.no-scrollbar');
        if (flexContainer) {
            flexContainer.innerHTML = tabsHtml;
        } else {
            // 컨테이너가 없으면 생성
            topNav.innerHTML = `
                <div class="flex items-center gap-4 overflow-x-auto no-scrollbar">
                    ${tabsHtml}
                </div>
            `;
        }

        console.log(`✅ ${days.length}개 탭 생성 완료`);
    }

    loadPages() {
        const pageContainer = document.getElementById('page-container');
        if (!pageContainer) {
            console.warn('⚠️ page-container 요소를 찾을 수 없습니다');
            return;
        }

        const days = this.travelData.days || [];
        
        // 일차별 페이지들 생성 (template-test 스타일)
        const pagesHtml = days.map((day, index) => `
            <div class="page-content h-full overflow-y-auto p-6">
                ${this.generateDayPage(day, index)}
            </div>
        `).join('');
        
        pageContainer.innerHTML = pagesHtml;
        console.log(`✅ ${days.length}개 페이지 생성 완료`);
    }

    generateInfoPage() {
        return `
            <div class="page-content">
                <h2>📍 여행 정보</h2>
                
                <div class="info-card">
                    <h3>🏷️ 여행 개요</h3>
                    <div class="info-item">
                        <span class="info-label">목적지</span>
                        <span class="info-value">${this.travelData.destination}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">여행 기간</span>
                        <span class="info-value">${this.travelData.duration}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">예상 비용</span>
                        <span class="info-value">${this.travelData.budget}</span>
                    </div>
                </div>

                ${this.travelData.tips ? `
                <div class="info-card">
                    <h3>💡 여행 팁</h3>
                    <div class="tips-list">
                        ${this.travelData.tips.map(tip => `
                            <div class="tip-item">• ${tip}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="info-card">
                    <h3>📱 앱 사용법</h3>
                    <div class="usage-tips">
                        <div class="tip-item">• 좌우 스와이프로 일정 확인</div>
                        <div class="tip-item">• 오프라인에서도 사용 가능</div>
                        <div class="tip-item">• 홈 화면에 추가하여 앱처럼 사용</div>
                    </div>
                </div>
            </div>
        `;
    }

    generateDayPage(day, dayIndex) {
        const activities = day.activities || [];
        
        console.log(`🔍 DAY ${day.day} 페이지 생성:`, day);
        console.log(`🔍 DAY ${day.day} 활동 개수:`, activities.length);
        activities.forEach((activity, index) => {
            console.log(`🔍 Activity ${index}:`, activity.type, activity.title, activity.recommendedRestaurants?.length || 0);
        });
        
        return `
            <div class="mb-8">
                <h2 class="text-3xl font-extrabold gradient-text">${day.title || `DAY ${day.day}`}</h2>
                <p class="text-slate-500 font-medium">${day.subtitle || day.dayTheme || day.description || `${day.day}일차 일정`}</p>
            </div>
            
            ${activities.length > 0 ? `
                <div class="relative">
                    <div class="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                    <div class="space-y-8">
                        ${activities.map((activity, index) => {
                            console.log(`🚀 generateTimelineActivity 호출: Activity ${index}, Type: ${activity.type}`);
                            return this.generateTimelineActivity(activity);
                        }).join('')}
                    </div>
                </div>
            ` : `
                <div class="bg-slate-50 rounded-xl p-8 text-center">
                    <div class="text-4xl mb-4">📅</div>
                    <h3 class="text-lg font-semibold text-slate-900 mb-2">${day.title || `DAY ${day.day}`}</h3>
                    <p class="text-slate-600">상세 일정이 곧 업데이트됩니다.</p>
                </div>
            `}
        `;
    }

    generateTimelineActivity(activity) {
        console.log('🎯 generateTimelineActivity 시작:', activity.type, activity.title);
        
        const place = activity.place;
        const hasPlace = place && place.name;
        
        return `
            <div class="relative flex items-start gap-4">
                <!-- 타임라인 점 -->
                <div class="relative z-10">
                    <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        ${this.getActivityTypeIcon(activity.type)}
                    </div>
                </div>
                
                <!-- 활동 카드 -->
                <div class="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-5 -mt-1">
                    <!-- 시간 및 제목 -->
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h3 class="text-lg font-bold text-slate-900 leading-tight">${activity.title}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    ${activity.time || '시간 미정'}
                                </span>
                                ${activity.duration ? `
                                    <span class="text-xs text-slate-500">
                                        ${activity.duration}분
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        ${activity.type ? `
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ml-2">
                                ${this.getActivityTypeName(activity.type)}
                            </span>
                        ` : ''}
                    </div>
                    
                    <!-- 설명 -->
                    ${activity.description ? `
                        <p class="text-slate-600 mb-4 leading-relaxed">${activity.description}</p>
                    ` : ''}
                    
                    ${hasPlace ? `
                        <!-- 장소 정보 -->
                        <div class="bg-slate-50 rounded-lg p-4 mb-4">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h4 class="font-semibold text-slate-900 mb-1">${place.name}</h4>
                                    ${place.address ? `
                                        <p class="text-sm text-slate-600 mb-2">${place.address}</p>
                                    ` : ''}
                                    <div class="flex items-center space-x-4">
                                        ${place.rating ? `
                                            <div class="flex items-center space-x-1">
                                                <span class="text-yellow-400">⭐</span>
                                                <span class="text-sm font-medium text-slate-700">${place.rating}</span>
                                                ${place.reviewCount ? `
                                                    <span class="text-xs text-slate-500">(${place.reviewCount})</span>
                                                ` : ''}
                                            </div>
                                        ` : ''}
                                        ${place.mapLink ? `
                                            <a href="${place.mapLink}" target="_blank" class="text-xs text-blue-600 hover:text-blue-800 transition">
                                                🗺️ 지도 보기
                                            </a>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                            
                            ${place.photos && place.photos.length > 0 ? `
                                <!-- 장소 사진 -->
                                <div class="mt-4">
                                    <div class="flex space-x-2 overflow-x-auto">
                                        ${place.photos.slice(0, 3).map(photo => `
                                            <img src="${photo}" alt="${place.name}" 
                                                 class="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition">
                                        `).join('')}
                                        ${place.photos.length > 3 ? `
                                            <div class="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-600 flex-shrink-0">
                                                +${place.photos.length - 3}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${activity.tips && activity.tips.length > 0 ? `
                        <!-- 팁 정보 -->
                        <div class="border-l-4 border-blue-200 pl-4 py-2">
                            <h5 class="text-sm font-semibold text-blue-900 mb-1">💡 팁</h5>
                            <ul class="text-sm text-blue-800 space-y-1">
                                ${activity.tips.map(tip => `<li>• ${tip}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${activity.cost ? `
                        <!-- 예상 비용 -->
                        <div class="mt-4 pt-4 border-t border-slate-100">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-slate-600">예상 비용</span>
                                <span class="font-semibold text-slate-900">${activity.cost}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    generateActivityCard(activity) {
        const place = activity.place;
        const hasPlace = place && place.name;
        
        return `
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <!-- 시간 및 카테고리 -->
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            ${activity.time || '시간 미정'}
                        </span>
                        ${activity.duration ? `
                            <span class="text-xs text-slate-500">
                                ${activity.duration}분
                            </span>
                        ` : ''}
                    </div>
                    ${activity.type ? `
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            ${this.getActivityTypeIcon(activity.type)} ${this.getActivityTypeName(activity.type)}
                        </span>
                    ` : ''}
                </div>
                
                <!-- 활동 제목 및 설명 -->
                <h3 class="text-lg font-bold text-slate-900 mb-2">${activity.title}</h3>
                ${activity.description ? `
                    <p class="text-slate-600 mb-4">${activity.description}</p>
                ` : ''}
                
                ${hasPlace ? `
                    <!-- 장소 정보 -->
                    <div class="bg-slate-50 rounded-lg p-4 mb-4">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-slate-900 mb-1">${place.name}</h4>
                                ${place.address ? `
                                    <p class="text-sm text-slate-600 mb-2">${place.address}</p>
                                ` : ''}
                                <div class="flex items-center space-x-4">
                                    ${place.rating ? `
                                        <div class="flex items-center space-x-1">
                                            <span class="text-yellow-400">⭐</span>
                                            <span class="text-sm font-medium text-slate-700">${place.rating}</span>
                                            ${place.reviewCount ? `
                                                <span class="text-xs text-slate-500">(${place.reviewCount})</span>
                                            ` : ''}
                                        </div>
                                    ` : ''}
                                    ${place.mapLink ? `
                                        <a href="${place.mapLink}" target="_blank" class="text-xs text-blue-600 hover:text-blue-800">
                                            🗺️ 지도 보기
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${place.photos && place.photos.length > 0 ? `
                            <!-- 장소 사진 -->
                            <div class="mt-4">
                                <div class="flex space-x-2 overflow-x-auto">
                                    ${place.photos.slice(0, 3).map(photo => `
                                        <img src="${photo}" alt="${place.name}" 
                                             class="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                                             onclick="this.classList.toggle('w-20'); this.classList.toggle('h-20'); this.classList.toggle('w-full'); this.classList.toggle('h-48');">
                                    `).join('')}
                                    ${place.photos.length > 3 ? `
                                        <div class="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-600 flex-shrink-0">
                                            +${place.photos.length - 3}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${activity.tips && activity.tips.length > 0 ? `
                    <!-- 팁 정보 -->
                    <div class="border-l-4 border-blue-200 pl-4 py-2">
                        <h5 class="text-sm font-semibold text-blue-900 mb-1">💡 팁</h5>
                        <ul class="text-sm text-blue-800 space-y-1">
                            ${activity.tips.map(tip => `<li>• ${tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${activity.cost ? `
                    <!-- 예상 비용 -->
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-slate-600">예상 비용</span>
                            <span class="font-semibold text-slate-900">${activity.cost}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${(() => {
                    console.log('🔍 Activity 타입 체크:', activity.type, activity.recommendedRestaurants?.length);
                    return activity.type === 'meal' && activity.recommendedRestaurants && activity.recommendedRestaurants.length > 0;
                })() ? `
                    <!-- 추천 레스토랑 -->
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <h5 class="text-sm font-bold text-slate-900 mb-3">🍽️ 추천 레스토랑</h5>
                        <div class="space-y-3">
                            ${activity.recommendedRestaurants.slice(0, 3).map((restaurant, index) => `
                                <div class="bg-gradient-to-r ${index === 0 ? 'from-orange-50 to-amber-50 border-orange-200' : 'from-slate-50 to-slate-100 border-slate-200'} border rounded-lg p-4">
                                    <div class="flex items-start justify-between mb-2">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-1">
                                                <h6 class="font-semibold text-slate-900">${restaurant.placeDetails?.name || restaurant.placeQuery}</h6>
                                                ${index === 0 ? '<span class="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">추천</span>' : ''}
                                            </div>
                                            ${restaurant.cuisineType ? `
                                                <p class="text-xs text-slate-600 mb-1">${restaurant.cuisineType}</p>
                                            ` : ''}
                                            ${restaurant.placeDetails?.address ? `
                                                <p class="text-xs text-slate-500 mb-2">${restaurant.placeDetails.address}</p>
                                            ` : ''}
                                            <div class="flex items-center space-x-4">
                                                ${restaurant.placeDetails?.rating ? `
                                                    <div class="flex items-center space-x-1">
                                                        <span class="text-yellow-400 text-sm">⭐</span>
                                                        <span class="text-sm font-medium text-slate-700">${restaurant.placeDetails.rating}</span>
                                                        ${restaurant.placeDetails?.reviewCount ? `
                                                            <span class="text-xs text-slate-500">(${restaurant.placeDetails.reviewCount})</span>
                                                        ` : ''}
                                                    </div>
                                                ` : ''}
                                                ${restaurant.operatingHours ? `
                                                    <span class="text-xs text-slate-600">⏰ ${restaurant.operatingHours}</span>
                                                ` : ''}
                                                ${restaurant.placeDetails?.mapLink ? `
                                                    <a href="${restaurant.placeDetails.mapLink}" target="_blank" class="text-xs text-blue-600 hover:text-blue-800 transition">
                                                        🗺️ 지도
                                                    </a>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${restaurant.reason ? `
                                        <p class="text-sm text-slate-700 mb-2">${restaurant.reason}</p>
                                    ` : ''}
                                    
                                    ${restaurant.placeDetails?.photos && restaurant.placeDetails.photos.length > 0 ? `
                                        <div class="flex space-x-2 overflow-x-auto mb-3">
                                            ${restaurant.placeDetails.photos.slice(0, 3).map(photo => `
                                                <img src="${photo}" alt="${restaurant.placeDetails.name}" 
                                                     class="w-16 h-16 object-cover rounded-lg flex-shrink-0">
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    ${restaurant.menuHighlights && restaurant.menuHighlights.length > 0 ? `
                                        <div class="mb-2">
                                            <p class="text-xs font-medium text-slate-700 mb-1">추천 메뉴:</p>
                                            <div class="flex flex-wrap gap-1">
                                                ${restaurant.menuHighlights.map(menu => `
                                                    <span class="text-xs bg-white px-2 py-1 rounded border ${menu.childRecommended ? 'border-green-200 text-green-700' : 'border-slate-200 text-slate-600'}">
                                                        ${menu.item}
                                                    </span>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${restaurant.diningTips && restaurant.diningTips.length > 0 ? `
                                        <div class="text-xs text-slate-600">
                                            <p class="font-medium mb-1">💡 팁:</p>
                                            <ul class="space-y-0.5">
                                                ${restaurant.diningTips.slice(0, 2).map(tip => `<li>• ${tip}</li>`).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                            ${activity.recommendedRestaurants.length > 3 ? `
                                <div class="text-center">
                                    <button class="text-sm text-blue-600 hover:text-blue-800 transition" onclick="alert('더 많은 레스토랑 정보는 곧 추가될 예정입니다.')">
                                        +${activity.recommendedRestaurants.length - 3}개 레스토랑 더 보기
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getActivityTypeIcon(type) {
        const iconMap = {
            'accommodation': '🏨',
            'sightseeing': '🏛️',
            'dining': '🍽️',
            'shopping': '🛍️',
            'transportation': '🚗',
            'entertainment': '🎪',
            'activity': '🎯',
            'rest': '😴'
        };
        return iconMap[type] || '📍';
    }

    getActivityTypeName(type) {
        const nameMap = {
            'accommodation': '숙박',
            'sightseeing': '관광',
            'dining': '식사',
            'shopping': '쇼핑',
            'transportation': '이동',
            'entertainment': '오락',
            'activity': '액티비티',
            'rest': '휴식'
        };
        return nameMap[type] || '기타';
    }

    generateBudgetPage() {
        return `
            <div class="page-content">
                <h2>💰 여행 예산</h2>
                
                <div class="budget-summary">
                    <div class="total-budget">
                        <span class="budget-label">총 예상 비용</span>
                        <span class="budget-amount">${this.travelData.budget}</span>
                    </div>
                </div>
                
                <div class="budget-breakdown">
                    <div class="budget-category">
                        <span class="category-icon">✈️</span>
                        <span class="category-name">교통비</span>
                        <span class="category-amount">상세 정보 준비 중</span>
                    </div>
                    <div class="budget-category">
                        <span class="category-icon">🏨</span>
                        <span class="category-name">숙박비</span>
                        <span class="category-amount">상세 정보 준비 중</span>
                    </div>
                    <div class="budget-category">
                        <span class="category-icon">🍽️</span>
                        <span class="category-name">식비</span>
                        <span class="category-amount">상세 정보 준비 중</span>
                    </div>
                    <div class="budget-category">
                        <span class="category-icon">🎫</span>
                        <span class="category-name">관광비</span>
                        <span class="category-amount">상세 정보 준비 중</span>
                    </div>
                </div>
                
                <div class="budget-note">
                    <p>💡 실제 비용은 여행 스타일과 환율에 따라 달라질 수 있습니다.</p>
                </div>
            </div>
        `;
    }

    generateTodoPage() {
        const todos = this.travelData.todos || [];
        
        return `
            <div class="page-content">
                <h2>✅ 여행 준비 체크리스트</h2>
                
                <div class="progress-info">
                    <span class="progress-text">완료: <span id="completedCount">0</span> / <span id="totalCount">${todos.length}</span></span>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                    </div>
                </div>
                
                ${this.generateTodoSections(todos)}
                
                <div class="todo-actions">
                    <button class="todo-action-btn" onclick="resetAllTodos()">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">체크 초기화</span>
                    </button>
                </div>
            </div>
        `;
    }

    generateTodoSections(todos) {
        const categories = ['pre-departure', 'packing', 'departure', 'local', 'return'];
        const categoryNames = {
            'pre-departure': '📋 출발 전 (1-2주 전)',
            'packing': '🎒 짐 준비 (1-3일 전)', 
            'departure': '🚀 출발 당일',
            'local': '🌟 현지에서',
            'return': '✈️ 귀국 전'
        };
        
        return categories.map(category => {
            const categoryTodos = todos.filter(todo => todo.category === category);
            if (categoryTodos.length === 0) return '';
            
            return `
                <div class="todo-section">
                    <h3>${categoryNames[category]}</h3>
                    <div class="todo-list" data-category="${category}">
                        ${categoryTodos.map(todo => `
                            <div class="todo-item" data-priority="${todo.priority}">
                                <label class="todo-checkbox">
                                    <input type="checkbox" onchange="updateProgress()">
                                    <span class="checkmark"></span>
                                </label>
                                <div class="todo-content">
                                    <div class="todo-text">${todo.text}</div>
                                    <div class="todo-meta">
                                        <span class="todo-priority ${todo.priority}">${this.getPriorityLabel(todo.priority)}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    getPriorityLabel(priority) {
        const labels = {
            'high': '중요',
            'medium': '보통', 
            'low': '선택'
        };
        return labels[priority] || '보통';
    }

    updatePageIndicators() {
        const pageIndicator = document.querySelector('.page-indicator');
        if (!pageIndicator) return;

        pageIndicator.innerHTML = Array.from({length: this.totalPages}, (_, i) => 
            `<div class="indicator-dot ${i === 0 ? 'active' : ''}" data-page="${i}"></div>`
        ).join('');
    }

    generateManifest() {
        if (!this.travelData.isDefault) {
            // 동적 생성된 앱의 경우 매니페스트도 동적으로 생성
            const manifest = {
                name: this.travelData.title,
                short_name: this.travelData.destination,
                description: `${this.travelData.destination} ${this.travelData.duration} 여행 가이드`,
                start_url: `./main.html?session=${this.sessionId}`,
                display: 'standalone',
                theme_color: '#4F46E5',
                background_color: '#ffffff',
                orientation: 'portrait',
                scope: './',
                categories: ['travel', 'lifestyle'],
                lang: 'ko',
                icons: [
                    {
                        src: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' fill='%234F46E5' rx='20'/><text x='96' y='140' font-size='120' text-anchor='middle' fill='white'>${this.getDestinationEmoji()}</text></svg>`,
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            };
            
            // Blob URL로 동적 매니페스트 생성
            const manifestBlob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
            const manifestUrl = URL.createObjectURL(manifestBlob);
            
            // 기존 매니페스트 링크 교체
            let manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                manifestLink.href = manifestUrl;
            } else {
                manifestLink = document.createElement('link');
                manifestLink.rel = 'manifest';
                manifestLink.href = manifestUrl;
                document.head.appendChild(manifestLink);
            }
        }
    }

    setupEventListeners() {
        // 탭 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-tab')) {
                const tab = e.target.closest('.nav-tab');
                const pageIndex = parseInt(tab.dataset.page);
                this.goToPage(pageIndex);
            }
            
            // Bottom sheet 이벤트
            if (e.target.closest('.bottom-nav-btn')) {
                const btn = e.target.closest('.bottom-nav-btn');
                const sheetType = btn.dataset.sheet;
                this.showBottomSheet(sheetType);
            }
            
            // Overlay 클릭으로 bottom sheet 닫기
            if (e.target.id === 'overlay') {
                this.hideBottomSheet();
            }
        });

        // 스와이프 이벤트 (간단한 구현)
        this.startX = 0;
        this.endX = 0;

        document.addEventListener('touchstart', (e) => {
            this.startX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            this.endX = e.changedTouches[0].clientX;
            this.handleSwipe();
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousPage();
            } else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
        });
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const diffX = this.startX - this.endX;

        if (Math.abs(diffX) > swipeThreshold) {
            if (diffX > 0) {
                this.nextPage();
            } else {
                this.previousPage();
            }
        }
    }

    goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.totalPages) return;
        
        this.currentPage = pageIndex;
        
        console.log(`📄 페이지 ${pageIndex} 전환 중...`);
        
        // 페이지 전환 애니메이션
        const pageContainer = document.getElementById('page-container');
        if (pageContainer) {
            pageContainer.style.transform = `translateX(-${pageIndex * 100}%)`;
            
            // 현재 페이지의 콘텐츠를 다시 렌더링 (지연 렌더링 방식)
            setTimeout(() => {
                const currentPageElement = pageContainer.children[pageIndex];
                if (currentPageElement && this.travelData.days[pageIndex]) {
                    const day = this.travelData.days[pageIndex];
                    const activities = day.activities || [];
                    
                    console.log(`🔄 페이지 ${pageIndex} 콘텐츠 재렌더링 시작`);
                    console.log(`🔍 활동 개수: ${activities.length}`);
                    
                    // 활동 카드들을 다시 렌더링
                    const timelineContainer = currentPageElement.querySelector('.space-y-8');
                    if (timelineContainer && activities.length > 0) {
                        timelineContainer.innerHTML = activities.map((activity, index) => {
                            console.log(`🚀 페이지 ${pageIndex} - generateTimelineActivity 호출: Activity ${index}, Type: ${activity.type}`);
                            return this.generateTimelineActivity(activity);
                        }).join('');
                    }
                }
            }, 300); // 애니메이션 완료 후 실행
        }
        
        // 탭 활성화 상태 업데이트 (template-test 스타일)
        document.querySelectorAll('.nav-tab').forEach((tab, index) => {
            if (index === pageIndex) {
                tab.classList.add('active');
                tab.classList.remove('text-slate-500');
                tab.classList.add('text-orange-600', 'border-orange-500');
            } else {
                tab.classList.remove('active', 'text-orange-600', 'border-orange-500');
                tab.classList.add('text-slate-500');
            }
        });
        
        // 인디케이터 업데이트
        document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === pageIndex);
        });
        
        console.log(`✅ 페이지 ${pageIndex} 이동 완료`);
    }

    showBottomSheet(sheetType) {
        // 모든 bottom sheet 숨기기
        document.querySelectorAll('[id^="sheet-"]').forEach(sheet => {
            sheet.classList.remove('active');
        });
        
        // 선택된 bottom sheet 표시
        const targetSheet = document.getElementById(`sheet-${sheetType}`);
        const overlay = document.getElementById('overlay');
        
        if (targetSheet && overlay) {
            targetSheet.classList.add('active');
            overlay.classList.add('active');
            
            // 내용 동적 생성
            this.populateBottomSheet(sheetType, targetSheet);
            
            console.log(`✅ Bottom sheet 표시: ${sheetType}`);
        }
    }

    hideBottomSheet() {
        document.querySelectorAll('[id^="sheet-"]').forEach(sheet => {
            sheet.classList.remove('active');
        });
        
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        console.log(`✅ Bottom sheet 숨김`);
    }

    populateBottomSheet(sheetType, sheetElement) {
        // template-test 스타일에 맞는 정확한 ID로 content 영역 찾기
        const contentArea = document.getElementById(`${sheetType}-content`);
        if (!contentArea) {
            console.warn(`⚠️ ${sheetType}-content 요소를 찾을 수 없습니다`);
            return;
        }
        
        switch(sheetType) {
            case 'info':
                contentArea.innerHTML = this.generateInfoContent();
                break;
            case 'budget':
                contentArea.innerHTML = this.generateBudgetContent();
                break;
            case 'todo':
                contentArea.innerHTML = this.generateTodoContent();
                break;
        }
        
        console.log(`✅ Bottom sheet 내용 업데이트: ${sheetType}`);
    }

    generateInfoContent() {
        // 새로운 구조(essentials) 또는 기존 구조 지원
        const info = this.travelData.essentials || this.travelData.essentialInfo || {};
        const defaultInfo = {
            transportation: this.travelData.transportation || '교통편 정보 준비 중',
            localTips: this.travelData.tips || this.travelData.localTips || ['여행 팁 준비 중'],
            weather: this.travelData.weather || this.travelData.seasonalConsiderations || '날씨 정보 준비 중',
            mustTryFood: this.travelData.food || this.travelData.mustTryFood || ['현지 음식 추천 준비 중']
        };

        return `
            <h2 class="text-2xl font-bold text-slate-800 mb-6">여행 정보</h2>
            <div class="space-y-4">
                <div class="p-5 bg-blue-50 rounded-xl">
                    <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3-3-4-1.5-1.5-3-2-3-4 0-2 2-2 2-2"></path>
                            <path d="M8.5 2.5a2.5 2.5 0 0 1 5 0"></path>
                            <path d="M12 22V8"></path>
                        </svg> 
                        교통편
                    </h3>
                    <p class="text-sm text-slate-600">${info.transportation || defaultInfo.transportation}</p>
                </div>

                <div class="p-5 bg-yellow-50 rounded-xl">
                    <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg> 
                        여행 팁
                    </h3>
                    <div class="text-sm text-slate-600 leading-relaxed">
                        ${(info.localTips || defaultInfo.localTips).map(tip => `<p class="mb-2">• ${tip}</p>`).join('')}
                    </div>
                </div>

                <div class="p-5 bg-red-50 rounded-xl">
                    <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg> 
                        날씨 정보
                    </h3>
                    <p class="text-sm text-slate-600 leading-relaxed">${info.weather || defaultInfo.weather}</p>
                </div>

                <div class="p-5 bg-purple-50 rounded-xl">
                    <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg> 
                        현지 문화 팁
                    </h3>
                    <div class="text-sm text-slate-600 leading-relaxed">
                        <p class="font-semibold mb-2">꼭 먹어봐야 할 음식:</p>
                        <p>${(info.mustTryFood || defaultInfo.mustTryFood).join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
    }

    generateBudgetContent() {
        // 새로운 구조(budget) 또는 기존 구조 지원
        const budget = this.travelData.budget || this.travelData.budgetBreakdown || {};
        const totalBudget = budget.total || { value: 500000 };
        const breakdown = budget.breakdown || [
            { category: 'accommodation', value: 200000, description: '숙박비 (1박당 약 100,000원)' },
            { category: 'meals', value: 150000, description: '식비 (1일 3식 기준)' },
            { category: 'activities', value: 100000, description: '관광지 입장료 및 체험비' },
            { category: 'transportation', value: 50000, description: '현지 교통비' }
        ];

        return `
            <h2 class="text-2xl font-bold text-slate-800 mb-6">여행 예산</h2>
            <div class="space-y-6">
                <div class="bg-slate-100 p-5 rounded-xl">
                    <div class="flex justify-between items-center mb-2">
                        <div>
                            <h3 class="font-bold text-slate-800 flex items-center gap-2">
                                총 예산
                            </h3>
                            <p class="text-xs text-slate-500">₩${totalBudget.value.toLocaleString()}</p>
                        </div>
                        <span class="font-bold text-orange-600 text-lg">₩0</span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2.5">
                        <div class="bg-gradient-to-r from-orange-400 to-amber-500 h-2.5 rounded-full transition-all" style="width: 0%"></div>
                    </div>
                </div>

                <div class="space-y-3">
                    <h3 class="font-bold text-slate-800 border-b pb-2">예상 비용 분석</h3>
                    
                    ${breakdown.map((item, index) => {
                        const colors = ['blue', 'green', 'amber', 'purple'];
                        const color = colors[index % colors.length];
                        const categoryNames = {
                            'accommodation': '숙박비',
                            'meals': '식비',
                            'activities': '관광/활동비',
                            'transportation': '교통비'
                        };
                        return `
                        <div class="p-4 bg-${color}-50 rounded-lg border border-${color}-100">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium text-slate-700">${categoryNames[item.category] || item.category}</span>
                                <span class="font-bold text-${color}-600">₩${item.value.toLocaleString()}</span>
                            </div>
                            <p class="text-xs text-slate-500">${item.description}</p>
                        </div>
                        `;
                    }).join('')}
                </div>

                <div>
                    <h3 class="font-bold text-slate-800 mb-4 border-b pb-2">실제 지출 내역</h3>
                    <div class="space-y-3" id="expense-list">
                        <p class="text-center text-slate-400 py-8">아직 지출 내역이 없습니다</p>
                    </div>
                </div>

                <div>
                    <h3 class="font-bold text-slate-800 mt-8 mb-4 border-b pb-2">지출 추가</h3>
                    <div class="space-y-3">
                        <input type="text" placeholder="항목 (예: 저녁 식사)" class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <input type="number" placeholder="금액 (원)" class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <button class="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition">추가하기</button>
                    </div>
                </div>
            </div>
        `;
    }

    generateTodoContent() {
        const todos = this.travelData.todos || [];
        
        // 기본 체크리스트를 카테고리별로 구성
        const defaultTodos = [
            {
                category: '✈️ 출발 전 필수',
                items: [
                    '여권 및 항공편 티켓',
                    '숙소 바우처 출력 또는 저장',
                    `${this.travelData.destination || '현지'} 화폐 환전`,
                    '해외 데이터 로밍 또는 유심'
                ]
            },
            {
                category: '👕 개인 용품',
                items: [
                    '날씨에 맞는 옷차림',
                    '편한 신발 (많이 걸을 예정)',
                    '개인 세면용품',
                    '상비약 (두통약, 소화제 등)'
                ]
            },
            {
                category: '📱 전자기기',
                items: [
                    '휴대폰 충전기',
                    '카메라 및 배터리',
                    '보조배터리',
                    '여행용 어댑터'
                ]
            }
        ];
        
        // 가족여행인 경우 아이 용품 추가
        if (this.travelData.travelers && this.travelData.travelers.includes('가족')) {
            defaultTodos.push({
                category: '👶 아이 용품',
                items: [
                    '기저귀, 물티슈, 휴대용 변기 커버',
                    '아이 전용 상비약 (해열제, 체온계, 밴드)',
                    '아이가 좋아하는 간식과 장난감'
                ]
            });
        }

        return `
            <h2 class="text-2xl font-bold text-slate-800 mb-6">여행 준비물</h2>
            <div class="space-y-6">
                ${defaultTodos.map(category => `
                    <div>
                        <h3 class="font-bold text-slate-800 mb-4 border-b pb-2">${category.category}</h3>
                        <div class="space-y-3">
                            ${category.items.map(item => `
                                <label class="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <input type="checkbox" class="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500">
                                    <span class="text-sm text-slate-700">${item}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}

                <div class="mt-8 flex gap-2">
                    <input type="text" placeholder="새 준비물 추가" class="flex-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <button class="bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition">추가</button>
                </div>
            </div>
        `;
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.goToPage(this.currentPage + 1);
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        }
    }

    setupPWAInstallPrompt() {
        // PWA 설치 가이드 표시
        setTimeout(() => {
            const installGuide = document.getElementById('installGuideOverlay');
            if (installGuide && !localStorage.getItem('pwa_install_prompted')) {
                installGuide.style.display = 'flex';
                localStorage.setItem('pwa_install_prompted', 'true');
            }
        }, 3000);

        // 설치 가이드 닫기
        document.getElementById('closeGuideBtn')?.addEventListener('click', () => {
            document.getElementById('installGuideOverlay').style.display = 'none';
        });

        document.getElementById('skipInstallBtn')?.addEventListener('click', () => {
            document.getElementById('installGuideOverlay').style.display = 'none';
        });

        document.getElementById('installNowBtn')?.addEventListener('click', () => {
            document.getElementById('installGuideOverlay').style.display = 'none';
            // 실제 설치 프롬프트는 브라우저에서 자동으로 처리
        });
    }
}

// Todo 관련 함수들 (전역 함수로 유지)
function updateProgress() {
    const allTodos = document.querySelectorAll('.todo-item input[type="checkbox"]');
    const completedTodos = document.querySelectorAll('.todo-item input[type="checkbox"]:checked');
    
    const total = allTodos.length;
    const completed = completedTodos.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    const completedCount = document.getElementById('completedCount');
    const totalCount = document.getElementById('totalCount');
    const progressFill = document.getElementById('progressFill');
    
    if (completedCount) completedCount.textContent = completed;
    if (totalCount) totalCount.textContent = total;
    if (progressFill) progressFill.style.width = percentage + '%';
    
    // 로컬 스토리지에 체크 상태 저장
    const checkStates = Array.from(allTodos).map(checkbox => checkbox.checked);
    localStorage.setItem('todoStates', JSON.stringify(checkStates));
}

function resetAllTodos() {
    if (confirm('모든 체크를 초기화하시겠습니까?')) {
        const allCheckboxes = document.querySelectorAll('.todo-item input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => checkbox.checked = false);
        updateProgress();
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.travelApp = new TravelAppLoader();
    
    // 체크박스 상태 복원
    setTimeout(() => {
        const savedStates = JSON.parse(localStorage.getItem('todoStates') || '[]');
        const allCheckboxes = document.querySelectorAll('.todo-item input[type="checkbox"]');
        
        allCheckboxes.forEach((checkbox, index) => {
            if (savedStates[index]) {
                checkbox.checked = true;
            }
        });
        
        updateProgress();
    }, 500);
});