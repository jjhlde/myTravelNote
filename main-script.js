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
        
        console.log('🚀🚀🚀 TravelAppLoader 새 버전 2024.01.21-v4-데이터보존 시작! 🚀🚀🚀');
        console.log('🔗 Session ID:', this.sessionId);
        console.log('⭐ 데이터 보존 기능: options 배열, note, reasonForSelection, transportation.options 모두 보존!');
        
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
        // mock_first_step_resp.json 구조 감지 (tripPlan.tripInfo, tripPlan.itinerary 존재)
        else if (rawData.tripPlan && rawData.tripPlan.tripInfo && rawData.tripPlan.itinerary) {
            console.log('📊 mock_first_step_resp.json 구조 감지, 정규화 중...');
            return this.normalizeFirstStepRespData(rawData);
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

    normalizeFirstStepRespData(firstStepData) {
        const tripPlan = firstStepData.tripPlan;
        const tripInfo = tripPlan.tripInfo;
        const itinerary = tripPlan.itinerary;
        const dailyTips = tripPlan.dailyTips || [];
        
        console.log('🔄 First step response data 정규화 시작:', tripInfo);
        console.log('📊 원본 일정 데이터에서 options 배열 존재 여부 확인...');
        
        // 원본 데이터에서 options 배열 존재 여부 로깅
        itinerary.forEach((dayPlan, dayIndex) => {
            dayPlan.activities?.forEach((activity, actIndex) => {
                if (activity.options && activity.options.length > 0) {
                    console.log(`✅ Day ${dayPlan.dayNumber} Activity ${actIndex}: "${activity.activityName}" - ${activity.options.length}개 옵션 발견`);
                }
                if (activity.transportation?.options && activity.transportation.options.length > 0) {
                    console.log(`✅ Day ${dayPlan.dayNumber} Activity ${actIndex}: Transportation - ${activity.transportation.options.length}개 옵션 발견`);
                }
            });
        });
        
        // 일차별 데이터 변환
        const days = itinerary.map(dayPlan => ({
            day: dayPlan.dayNumber,
            date: dayPlan.date,
            title: `DAY ${dayPlan.dayNumber}`,
            subtitle: dayPlan.dayTheme,
            dayTheme: dayPlan.dayTheme,
            description: dayPlan.dayNote || dayPlan.dayTheme,
            dayNote: dayPlan.dayNote,
            activities: (dayPlan.activities || []).map(activity => ({
                id: `activity_${dayPlan.dayNumber}_${activity.timeSlot?.start || 'notime'}`,
                time: activity.timeSlot?.start,
                duration: activity.timeSlot?.end ? 
                    this.calculateDuration(activity.timeSlot.start, activity.timeSlot.end) : null,
                type: activity.activityType,
                category: activity.activityType,
                title: activity.activityName,
                description: activity.description || '',
                note: activity.note, // ✅ note 항목 보존
                reasonForSelection: activity.reasonForSelection, // ✅ reasonForSelection 보존
                place: this.extractMainPlaceFromFirstStep(activity),
                recommendedRestaurants: this.extractRestaurantsFromFirstStep(activity),
                alternativePlaces: this.extractAlternativesFromFirstStep(activity),
                tips: this.extractTipsFromFirstStep(activity),
                cost: null, // 1단계에서는 비용 정보 없음
                transportation: this.extractTransportationFromFirstStep(activity),
                // ✅ 핵심: options 배열 보존!
                options: activity.options ? activity.options.map(option => ({
                    name: option.name,
                    nameLocal: option.nameLocal,
                    placeQuery: option.placeQuery,
                    recommended: option.recommended || false,
                    reasonForSelection: option.reasonForSelection,
                    tips: option.tips || [],
                    note: option.note,
                    placeDetails: option.placeDetails ? {
                        name: option.placeDetails.name,
                        nameLocal: option.placeDetails.nameLocal,
                        address: option.placeDetails.address,
                        rating: option.placeDetails.rating,
                        reviewCount: option.placeDetails.reviewCount,
                        photos: option.placeDetails.photos || [],
                        mapLink: option.placeDetails.mapLink,
                        placeId: option.placeDetails.placeId,
                        reviews: option.placeDetails.reviews || []
                    } : null
                })) : null
            }))
        }));

        // 여행 팁 추출
        const tips = dailyTips.reduce((acc, tip) => {
            if (tip.details && tip.details.length > 0) {
                acc.push(...tip.details);
            }
            if (tip.spots && tip.spots.length > 0) {
                acc.push(...tip.spots.map(spot => `${spot.name}: ${spot.tip}`));
            }
            return acc;
        }, []);

        const normalizedData = {
            title: tripInfo.tripTitle || `${tripInfo.destination} ${this.calculateDays(tripInfo.startDate, tripInfo.endDate)}`,
            destination: tripInfo.destination,
            duration: this.calculateDays(tripInfo.startDate, tripInfo.endDate),
            startDate: tripInfo.startDate,
            endDate: tripInfo.endDate,
            totalDays: tripInfo.totalDays,
            tripTheme: tripInfo.tripTheme || [],
            planConfidence: 'high',
            planName: tripInfo.tripTitle,
            planDescription: `${tripInfo.travelers?.adults || 0}명 ${tripInfo.travelers?.children ? `(어린이 ${tripInfo.travelers.children}명)` : ''} 여행`,
            planHighlights: this.generateHighlightsFromFirstStep(itinerary),
            days: days,
            budget: this.formatBudget(tripInfo.estimatedBudget),
            flightInfo: tripInfo.flightInfo,
            travelers: tripInfo.travelers,
            tips: tips,
            dailyTips: dailyTips,
            todos: this.generateTodoList(tripInfo.destination + ' ' + (tripInfo.tripTitle || ''), this.calculateDays(tripInfo.startDate, tripInfo.endDate)),
            transportation: dailyTips.filter(tip => tip.type === 'transportation').flatMap(tip => tip.details || []).join(' '),
            sessionId: Date.now().toString(),
            createdAt: new Date().toISOString(),
            isEnriched: false,
            dataSource: 'first_step_response'
        };
        
        // ✅ 정규화 후 options 데이터 보존 확인
        console.log('📊 정규화 완료 후 options 배열 보존 상태 확인...');
        normalizedData.days.forEach((day, dayIndex) => {
            day.activities?.forEach((activity, actIndex) => {
                if (activity.options && activity.options.length > 0) {
                    console.log(`✅ 보존 성공! Day ${day.day} Activity ${actIndex}: "${activity.title}" - ${activity.options.length}개 옵션 보존됨`);
                }
                if (activity.transportation?.options && activity.transportation.options.length > 0) {
                    console.log(`✅ 보존 성공! Day ${day.day} Activity ${actIndex}: Transportation - ${activity.transportation.options.length}개 옵션 보존됨`);
                }
            });
        });
        
        return normalizedData;
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
        if (destination.includes('일본') || destination.includes('도쿄')) {
            baseTodos.push(
                { category: 'pre-departure', text: 'JR Pass 또는 도쿄 메트로 패스 구매', priority: 'medium' },
                { category: 'pre-departure', text: '일본 엔화 환전 (현금 필수)', priority: 'high' },
                { category: 'pre-departure', text: 'IC 카드(스이카/파스모) 준비 방법 확인', priority: 'medium' },
                { category: 'packing', text: '일본 콘센트 어댑터 (A타입)', priority: 'medium' },
                { category: 'packing', text: '편한 걸음신발 (걷기 많음)', priority: 'high' },
                { category: 'local', text: 'Google 번역 앱 다운로드', priority: 'medium' },
                { category: 'local', text: '하이퍼디아/구글맵 오프라인 지도', priority: 'medium' },
                { category: 'return', text: '면세점 쇼핑 (화장품, 과자)', priority: 'low' }
            );
            
            // 도쿄 게임쇼 특화 준비물 추가
            if (destination.includes('게임쇼') || destination.includes('TGS')) {
                baseTodos.push(
                    { category: 'pre-departure', text: '도쿄 게임쇼 티켓 준비', priority: 'high' },
                    { category: 'packing', text: '보조배터리 (게임 시연 대기용)', priority: 'high' },
                    { category: 'packing', text: '편한 신발 (장시간 서서 대기)', priority: 'high' },
                    { category: 'local', text: '마쿠하리 멧세 교통편 확인', priority: 'medium' },
                    { category: 'return', text: '게임쇼 한정 굿즈 구매', priority: 'medium' }
                );
            }
        } else if (destination.includes('유럽')) {
            baseTodos.push(
                { category: 'pre-departure', text: '유럽 여행자보험 가입', priority: 'high' },
                { category: 'pre-departure', text: '유로 환전', priority: 'high' },
                { category: 'packing', text: '유럽 콘센트 어댑터 (C타입)', priority: 'medium' }
            );
        } else if (destination.includes('동남아')) {
            baseTodos.push(
                { category: 'pre-departure', text: '현지 화폐 환전', priority: 'medium' },
                { category: 'packing', text: '선크림 및 모기퇴치제', priority: 'high' },
                { category: 'packing', text: '가벼운 여름옷 위주', priority: 'medium' }
            );
        }
        
        return baseTodos;
    }

    // First step response 데이터 처리를 위한 헬퍼 함수들
    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return null;
        try {
            const start = this.parseTime(startTime);
            const end = this.parseTime(endTime);
            const diffMs = end - start;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return diffMins > 0 ? diffMins : null;
        } catch (error) {
            return null;
        }
    }

    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes || 0, 0, 0);
        return date;
    }

    calculateDays(startDate, endDate) {
        if (!startDate || !endDate) return '여행';
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const nights = Math.max(0, diffDays - 1);
            return `${nights}박${diffDays}일`;
        } catch (error) {
            return '여행';
        }
    }

    extractMainPlaceFromFirstStep(activity) {
        // mainLocation이 있는 경우
        if (activity.mainLocation && activity.mainLocation.name) {
            return {
                name: activity.mainLocation.name,
                nameLocal: activity.mainLocation.nameLocal,
                address: activity.mainLocation.placeDetails?.address || '주소 정보 없음',
                rating: activity.mainLocation.placeDetails?.rating || null,
                reviewCount: activity.mainLocation.placeDetails?.reviewCount || 0,
                photos: activity.mainLocation.placeDetails?.photos || [],
                mapLink: activity.mainLocation.placeDetails?.mapLink || '',
                placeId: activity.mainLocation.placeDetails?.placeId || null,
                placeQuery: activity.mainLocation.placeQuery
            };
        }
        
        // options에서 첫 번째 장소를 main place로 사용
        if (activity.options && activity.options.length > 0) {
            const firstOption = activity.options[0];
            return {
                name: firstOption.name || firstOption.nameLocal,
                nameLocal: firstOption.nameLocal,
                address: firstOption.placeDetails?.address || '주소 정보 없음',
                rating: firstOption.placeDetails?.rating || null,
                reviewCount: firstOption.placeDetails?.reviewCount || 0,
                photos: firstOption.placeDetails?.photos || [],
                mapLink: firstOption.placeDetails?.mapLink || '',
                placeId: firstOption.placeDetails?.placeId || null,
                placeQuery: firstOption.placeQuery
            };
        }
        
        return null;
    }

    extractRestaurantsFromFirstStep(activity) {
        if (activity.activityType === 'meal' && activity.options) {
            return activity.options.map(option => ({
                placeQuery: option.placeQuery,
                placeDetails: {
                    name: option.name || option.nameLocal,
                    address: option.placeDetails?.address,
                    rating: option.placeDetails?.rating,
                    reviewCount: option.placeDetails?.reviewCount,
                    photos: option.placeDetails?.photos || [],
                    mapLink: option.placeDetails?.mapLink
                },
                reason: option.reasonForSelection,
                recommended: option.recommended || false,
                tips: option.tips || []
            }));
        }
        return [];
    }

    extractAlternativesFromFirstStep(activity) {
        if (activity.options && activity.options.length > 1) {
            return activity.options.slice(1).map(option => ({
                placeQuery: option.placeQuery,
                placeDetails: {
                    name: option.name || option.nameLocal,
                    address: option.placeDetails?.address,
                    rating: option.placeDetails?.rating,
                    reviewCount: option.placeDetails?.reviewCount,
                    photos: option.placeDetails?.photos || [],
                    mapLink: option.placeDetails?.mapLink
                },
                reason: option.reasonForSelection
            }));
        }
        return [];
    }

    extractTipsFromFirstStep(activity) {
        const tips = [];
        
        // activity level tips
        if (activity.tips && activity.tips.length > 0) {
            tips.push(...activity.tips);
        }
        
        // options에서 tips 추출
        if (activity.options) {
            activity.options.forEach(option => {
                if (option.tips && option.tips.length > 0) {
                    tips.push(...option.tips);
                }
            });
        }
        
        return tips;
    }

    extractTransportationFromFirstStep(activity) {
        if (activity.transportation) {
            const transport = activity.transportation;
            
            // ✅ 전체 transportation 객체를 보존하면서 텍스트 요약도 함께 제공
            const result = {
                from: transport.from,
                to: transport.to,
                note: transport.note,
                // ✅ transportation 자체의 정보도 보존
                method: transport.method,
                estimatedDuration: transport.estimatedDuration,
                estimatedCost: transport.estimatedCost,
                currency: transport.currency,
                // ✅ transportation 자체의 placeDetails 보존
                placeDetails: transport.placeDetails ? {
                    name: transport.placeDetails.name,
                    nameLocal: transport.placeDetails.nameLocal,
                    address: transport.placeDetails.address,
                    rating: transport.placeDetails.rating,
                    reviewCount: transport.placeDetails.reviewCount,
                    photos: transport.placeDetails.photos || [],
                    mapLink: transport.placeDetails.mapLink,
                    placeId: transport.placeDetails.placeId,
                    reviews: transport.placeDetails.reviews || []
                } : null,
                // ✅ transportation options 배열 보존!
                options: transport.options ? transport.options.map(option => ({
                    method: option.method,
                    estimatedDuration: option.estimatedDuration,
                    estimatedCost: option.estimatedCost,
                    currency: option.currency,
                    note: option.note,
                    recommended: option.recommended || false,
                    placeDetails: option.placeDetails ? {
                        name: option.placeDetails.name,
                        nameLocal: option.placeDetails.nameLocal,
                        address: option.placeDetails.address,
                        rating: option.placeDetails.rating,
                        reviewCount: option.placeDetails.reviewCount,
                        photos: option.placeDetails.photos || [],
                        mapLink: option.placeDetails.mapLink,
                        placeId: option.placeDetails.placeId,
                        reviews: option.placeDetails.reviews || []
                    } : null
                })) : null
            };
            
            // 기본 교통편 정보 구성 (텍스트 요약)
            let transportInfo = '';
            if (transport.from && transport.to) {
                transportInfo += `${transport.from} → ${transport.to}`;
            }
            
            // 옵션들 중 추천 옵션 또는 첫 번째 옵션 선택
            if (transport.options && transport.options.length > 0) {
                const selectedOption = transport.options.find(opt => opt.recommended) || transport.options[0];
                
                if (selectedOption) {
                    const parts = [];
                    parts.push(selectedOption.method);
                    
                    if (selectedOption.estimatedDuration) {
                        parts.push(`${selectedOption.estimatedDuration}분 소요`);
                    }
                    
                    if (selectedOption.estimatedCost && selectedOption.estimatedCost > 0) {
                        const currency = selectedOption.currency === 'MOP' ? 'MOP' : '원';
                        parts.push(`약 ${selectedOption.estimatedCost.toLocaleString()}${currency}`);
                    }
                    
                    if (selectedOption.note) {
                        parts.push(`(${selectedOption.note})`);
                    }
                    
                    if (transportInfo) {
                        transportInfo += `: ${parts.join(', ')}`;
                    } else {
                        transportInfo = parts.join(', ');
                    }
                }
            }
            
            // 텍스트 요약을 summary 필드에 추가
            result.summary = transportInfo || 'Transportation information';
            
            return result;
        }
        
        return null;
    }

    generateHighlightsFromFirstStep(itinerary) {
        const highlights = [];
        
        itinerary.forEach(day => {
            if (day.activities) {
                day.activities.forEach(activity => {
                    if (activity.activityType === 'attraction' && activity.activityName) {
                        highlights.push(`DAY ${day.dayNumber}: ${activity.activityName}`);
                    }
                });
            }
        });
        
        return highlights.slice(0, 5); // 최대 5개만
    }

    formatBudget(budgetInfo) {
        if (!budgetInfo) return '예산 미정';
        
        if (budgetInfo.total) {
            const total = budgetInfo.total;
            const currency = budgetInfo.currency === 'KRW' ? '원' : budgetInfo.currency;
            return `총 ${total.toLocaleString()}${currency}`;
        }
        
        return '예산 미정';
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
        
        // 여행 날짜 정보 생성
        const tripDates = this.generateTripDates();
        
        // DOM 전체에서 텍스트 플레이스홀더 치환
        this.replaceTextInDOM(document.body, '{{TRIP_TITLE}}', title);
        this.replaceTextInDOM(document.body, '{{DESTINATION}}', destination);
        this.replaceTextInDOM(document.body, '{{DESTINATION_EMOJI}}', destinationEmoji);
        this.replaceTextInDOM(document.body, '{{DURATION}}', this.travelData.duration || '여행');
        this.replaceTextInDOM(document.body, '{{TRIP_DATES}}', tripDates);
        
        // tripTheme 해시태그 생성 및 삽입
        const tripThemesContainer = document.getElementById('trip-themes');
        if (tripThemesContainer) {
            tripThemesContainer.innerHTML = this.generateTripThemeHashtags();
        }
        
        console.log('✅ 템플릿 플레이스홀더 치환 완료:', { title, destination, destinationEmoji });
    }

    generateTripThemeHashtags() {
        // tripTheme 배열을 해시태그로 변환
        const themes = this.travelData.tripTheme || [];
        if (themes.length === 0) return '';
        
        return themes.map(theme => 
            `<span class="inline-block px-2 py-1 text-xs font-medium bg-orange-50 text-orange-600 rounded-full">#${theme}</span>`
        ).join('');
    }
    
    generateTripDates() {
        // startDate와 endDate에서 날짜 정보 추출
        const startDate = this.travelData.startDate;
        const endDate = this.travelData.endDate;
        const duration = this.travelData.duration;
        
        if (startDate && endDate) {
            try {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                const startMonth = start.getMonth() + 1;
                const startDay = start.getDate();
                const endMonth = end.getMonth() + 1;
                const endDay = end.getDate();
                
                if (startMonth === endMonth) {
                    return `${startMonth}월 ${startDay}일~${endDay}일`;
                } else {
                    return `${startMonth}월 ${startDay}일~${endMonth}월 ${endDay}일`;
                }
            } catch (error) {
                console.warn('날짜 파싱 오류:', error);
            }
        }
        
        // 날짜 정보가 없으면 duration 사용
        return duration || '여행 일정';
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

        // ✅ 첫 번째 페이지만 로드 (단일 페이지 방식)
        this.loadSinglePage(0);
        console.log(`✅ 단일 페이지 방식으로 첫 번째 페이지 로드 완료`);
        
        // ✅ 초기 페이지 로드 후 option chip 스크롤 보호 설정
        setTimeout(() => {
            console.log('🔄 초기 로드 후 option chip 보호 설정');
            this.setupOptionChipTouchProtection();
            
            // ✅ 강제로 모든 높이 관련 스타일 제거
            this.forceRemoveHeightStyles();
        }, 100); // DOM 렌더링 완료 후 실행
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
        console.log('🔍 Activity 데이터 구조:', activity);
        
        // 옵션이 있는 경우 캐러셀 형태로 처리
        const hasDirectOptions = activity.options && activity.options.length > 0;
        const hasTransportOptions = activity.transportation && activity.transportation.options && activity.transportation.options.length > 0;
        
        if (hasDirectOptions) {
            console.log('✅ 직접 옵션 발견! 캐러셀 생성:', activity.options.length, '개');
            return this.generateActivityWithOptions(activity, activity.options);
        }
        
        if (hasTransportOptions) {
            console.log('✅ 교통 옵션 발견! 캐러셀 생성:', activity.transportation.options.length, '개');
            return this.generateActivityWithOptions(activity, activity.transportation.options);
        }
        
        // 단일 활동 처리
        // transportation 정보 먼저 추출
        const transportation = activity.transportation;
        const isTransportation = activity.type === 'transportation' || transportation;
        
        const place = activity.place || activity.mainLocation;
        const hasPlace = place && (place.name || place.placeDetails);
        
        // transportation.placeDetails도 확인
        const transportationPlaceDetails = transportation?.placeDetails;
        const hasTransportationPlace = transportationPlaceDetails && (transportationPlaceDetails.name || transportationPlaceDetails.address);
        
        // 우선순위: place.placeDetails > place > transportation.placeDetails
        const placeDetails = place?.placeDetails || place || transportationPlaceDetails;
        
        return `
            <div class="relative pl-12">
                <!-- 타임라인 점 -->
                <div class="absolute left-0 top-1.5 flex items-center">
                    <div class="w-8 h-8 ${this.getActivityTypeColor(activity.type)} rounded-full flex items-center justify-center ring-4 ring-white">
                        ${this.getActivityTypeIcon(activity.type)}
                    </div>
                </div>
                
                <!-- 활동 카드 -->
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <!-- 시간 및 제목 -->
                    <p class="text-sm font-semibold ${this.getActivityTypeTextColor(activity.type)} mb-1">
                        ${activity.time || activity.timeSlot?.start || '시간 미정'} ${activity.duration ? `(${activity.duration}분)` : ''}
                    </p>
                    <h3 class="text-lg font-bold mb-3">${activity.title || activity.activityName}</h3>
                    
                    <!-- 활동 노트 (있는 경우) - Transportation의 첫 번째 옵션 또는 직접 note에서 추출 -->
                    ${activity.note || (transportation && transportation.options && transportation.options[0] && transportation.options[0].note) || (transportation && transportation.note) ? `
                        <div class="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                            <p class="text-sm text-blue-800 leading-relaxed">${activity.note || (transportation && transportation.options && transportation.options[0] && transportation.options[0].note) || (transportation && transportation.note)}</p>
                        </div>
                    ` : ''}
                    
                    <!-- Transportation 정보 (단일 옵션이 아닌 경우) -->
                    ${isTransportation && transportation && !transportation.options ? `
                        <div class="space-y-3 mb-4">
                            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                ${transportation.method ? `<p class="text-sm font-semibold text-slate-800">${transportation.method}</p>` : ''}
                                ${transportation.estimatedDuration ? `<p class="text-xs text-slate-600 mt-1">소요시간: ${transportation.estimatedDuration}분</p>` : ''}
                                ${transportation.estimatedCost ? `<p class="text-xs text-slate-600">비용: 약 ${transportation.estimatedCost.toLocaleString()}${transportation.currency || '원'}</p>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- 이미지 슬라이더 (장소 정보가 있는 경우) -->
                    ${placeDetails && placeDetails.photos && placeDetails.photos.length > 0 ? `
                        <div class="relative -mx-5 mb-4 rounded-lg overflow-hidden image-slider-container">
                            ${this.createImageSlider(placeDetails.photos, placeDetails.name)}
                        </div>
                    ` : ''}
                    
                    <!-- 활동 설명 -->
                    ${activity.description ? `
                        <p class="text-sm text-slate-600 leading-relaxed mb-4">${activity.description}</p>
                    ` : ''}
                    
                    <!-- 장소 상세정보 -->
                    ${(hasPlace || hasTransportationPlace) ? this.generatePlaceDetails(placeDetails, activity) : ''}
                    
                    <!-- 여행 팁 및 선택 이유 -->
                    ${this.generateTipsAndReasons(activity)}
                </div>
            </div>
        `;
    }

    generateActivityWithOptions(activity, options) {
        console.log('🎪 generateActivityWithOptions 실행:', activity);
        console.log('🎪 옵션 배열:', options);
        
        // 옵션 배열이 비어있는 경우 보호
        if (!options || options.length === 0) {
            console.warn('⚠️ 옵션 배열이 비어있어 단일 활동으로 처리');
            // 단일 활동 처리 (무한 루프 방지)
            const place = activity.place || activity.mainLocation;
            const hasPlace = place && (place.name || place.placeDetails);
            const placeDetails = place?.placeDetails || place;
            
            return `
                <div class="relative pl-12">
                    <div class="absolute left-0 top-1.5 flex items-center">
                        <div class="w-8 h-8 ${this.getActivityTypeColor(activity.type)} rounded-full flex items-center justify-center ring-4 ring-white">
                            ${this.getActivityTypeIcon(activity.type)}
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <p class="text-sm font-semibold ${this.getActivityTypeTextColor(activity.type)} mb-1">
                            ${activity.time || '시간 미정'}
                        </p>
                        <h3 class="text-lg font-bold mb-3">${activity.title || activity.activityName}</h3>
                        <p class="text-sm text-slate-600">옵션 데이터 로드 중 오류가 발생했습니다.</p>
                    </div>
                </div>
            `;
        }
        
        const recommendedIndex = Math.max(0, options.findIndex(opt => opt.recommended));
        const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🎯 추천 옵션 인덱스:', recommendedIndex);
        
        return `
            <div class="relative pl-12 activity-with-options" data-activity-id="${activityId}">
                <!-- 타임라인 점 -->
                <div class="absolute left-0 top-1.5 flex items-center">
                    <div class="w-8 h-8 ${this.getActivityTypeColor(activity.activityType || activity.type)} rounded-full flex items-center justify-center ring-4 ring-white">
                        ${this.getActivityTypeIcon(activity.activityType || activity.type)}
                    </div>
                </div>
                
                <!-- 활동 카드 -->
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <!-- 시간 및 제목 -->
                    <p class="text-sm font-semibold ${this.getActivityTypeTextColor(activity.activityType || activity.type)} mb-1">
                        ${activity.timeSlot?.start || activity.time || '시간 미정'} ${activity.duration ? `(${activity.duration}분)` : ''}
                    </p>
                    <h3 class="text-lg font-bold mb-3">${activity.title || activity.activityName}</h3>
                    
                    <!-- 옵션 캐러셀 -->
                    <div class="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 mb-4">
                        ${options.map((option, index) => `
                            <button data-index="${index}" class="option-chip ${index === recommendedIndex ? 'active' : ''}">
                                ${option.recommended ? '⭐ ' : ''}${option.name || option.method}
                            </button>
                        `).join('')}
                    </div>
                    
                    <!-- 선택된 옵션 상세 정보 -->
                    <div class="option-details-container border-t border-slate-100 pt-4">
                        ${this.generateOptionDetails(options[recommendedIndex])}
                    </div>
                </div>
            </div>
        `;
    }

    generatePlaceDetails(placeDetails, activity) {
        if (!placeDetails) return '';
        
        return `
            <div class="space-y-3 pt-2">
                <!-- 장소 이름 -->
                ${placeDetails.name ? `
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${placeDetails.name}
                        </h4>
                        ${placeDetails.nameLocal && placeDetails.nameLocal !== placeDetails.name ? `
                            <p class="text-xs text-slate-600 mt-1">${placeDetails.nameLocal}</p>
                        ` : ''}
                    </div>
                ` : ''}
                
                <!-- 별점 -->
                ${placeDetails.rating ? `
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-amber-500">${placeDetails.rating}</span>
                        <div class="flex text-amber-400">
                            ${this.renderStars(placeDetails.rating)}
                        </div>
                        ${placeDetails.reviewCount ? `
                            <span class="text-xs text-slate-500">(${placeDetails.reviewCount} 리뷰)</span>
                        ` : ''}
                    </div>
                ` : ''}
                
                <!-- 주소 -->
                ${placeDetails.address ? `
                    <div class="flex items-start gap-2 text-sm text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${placeDetails.address}</span>
                    </div>
                ` : ''}
                
                <!-- 리뷰 정보 -->
                ${placeDetails.reviews ? `
                    <div class="border-t border-slate-100 pt-3">
                        <p class="text-xs text-slate-500 mb-1">"${this.extractReviewText(placeDetails.reviews)}"</p>
                        <p class="text-xs text-slate-400 text-right">- ${this.extractReviewAuthor(placeDetails.reviews)}</p>
                    </div>
                ` : ''}
                
                <!-- 액션 버튼 -->
                <div class="mt-4 flex gap-3">
                    ${placeDetails.mapLink ? `
                        <a href="${placeDetails.mapLink}" target="_blank" class="flex-1 text-center bg-orange-50 text-orange-700 text-sm font-bold py-2 px-4 rounded-lg hover:bg-orange-100 transition">
                            지도 보기
                        </a>
                    ` : ''}
                    ${placeDetails.website ? `
                        <a href="${placeDetails.website}" target="_blank" class="flex-1 text-center bg-slate-100 text-slate-700 text-sm font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition">
                            웹사이트
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    generateTipsAndReasons(activity) {
        const tips = activity.tips || [];
        const reason = activity.reasonForSelection;
        
        if (tips.length === 0 && !reason) return '';
        
        return `
            <div class="mt-4 border-t border-slate-100 pt-3">
                ${tips.length > 0 ? `
                    <h4 class="text-xs font-bold text-slate-500 mb-2">💡 전문가 팁</h4>
                    <ul class="list-disc list-inside text-xs text-slate-500 space-y-1">
                        ${tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                ` : ''}
                ${reason ? `
                    <div class="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-700">
                        <span class="font-semibold">선택 이유:</span> ${reason}
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateOptionDetails(option) {
        console.log('🔧 generateOptionDetails 호출:', option);
        
        // 안전한 placeDetails 접근
        const placeDetails = option?.placeDetails || null;
        const hasPlaceDetails = placeDetails && (placeDetails.name || placeDetails.address);
        
        // transportation 옵션인지 확인
        const isTransportation = option.method || option.duration || option.estimatedDuration;
        
        let content = '';
        
        // Note 표시 (transportation, 일반 활동 모두)
        if (option.note) {
            content += `
                <div class="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                    <p class="text-sm text-blue-800 leading-relaxed">${option.note}</p>
                </div>
            `;
        }
        
        // 이미지 슬라이더 (장소 정보가 있는 경우)
        if (placeDetails && placeDetails.photos && placeDetails.photos.length > 0) {
            content += `
                <div class="relative -mx-5 mb-4 rounded-lg overflow-hidden image-slider-container">
                    ${this.createImageSlider(placeDetails.photos, placeDetails.name)}
                </div>
            `;
        }
        
        // Transportation 정보 (method가 있는 경우)
        if (isTransportation) {
            content += `
                <div class="space-y-3 mb-4">
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        ${option.method ? `<p class="text-sm font-semibold text-slate-800">${option.method}</p>` : ''}
                        ${option.estimatedDuration ? `<p class="text-xs text-slate-600 mt-1">소요시간: ${option.estimatedDuration}분</p>` : ''}
                        ${option.estimatedCost ? `<p class="text-xs text-slate-600">비용: 약 ${option.estimatedCost.toLocaleString()}${option.currency || '원'}</p>` : ''}
                    </div>
                </div>
            `;
        }
        
        // 장소 상세 정보 (transportation, 일반 활동 모두)
        if (hasPlaceDetails) {
            content += this.generatePlaceDetails(placeDetails, option);
        }
        
        // 팁과 이유 (transportation, 일반 활동 모두)
        content += this.generateTipsAndReasons(option);
        
        return content;
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
            // 모든 아이콘을 흰색 SVG로 통일
            'accommodation': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
            'sightseeing': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
            'dining': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 13v9"></path><path d="M17 2v20"></path></svg>`,
            'shopping': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
            'transportation': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-2.2-1.8-4-4-4H6c-2.2 0-4 1.8-4 4v3c0 .6.4 1 1 1h2"></path><circle cx="9" cy="17" r="2"></circle><circle cx="15" cy="17" r="2"></circle></svg>`,
            'entertainment': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72z"></path><path d="m14 7 3 3"></path></svg>`,
            'activity': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72z"></path><path d="m14 7 3 3"></path></svg>`,
            'rest': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22h6a2 2 0 0 0 2-2v-2"></path><path d="M4 18v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"></path><path d="M2 14h20"></path><path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"></path></svg>`,
            // 새로운 타입별 분류 
            'restaurant': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 13v9"></path><path d="M17 2v20"></path></svg>`,
            'attraction': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
            'transport': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-2.2-1.8-4-4-4H6c-2.2 0-4 1.8-4 4v3c0 .6.4 1 1 1h2"></path><circle cx="9" cy="17" r="2"></circle><circle cx="15" cy="17" r="2"></circle></svg>`,
            'spot': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
            'meal': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 13v9"></path><path d="M17 2v20"></path></svg>`,
            'general': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`
        };
        return iconMap[type] || `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    }

    createImageSlider(photos, altText) {
        if (!photos || photos.length === 0) return '';
        const sliderId = `slider-${Math.random().toString(36).substr(2, 9)}`;
        return `
            <div class="relative image-slider-container bg-slate-100 rounded-lg overflow-hidden">
                <div id="${sliderId}" class="flex overflow-x-auto snap-x snap-mandatory no-scrollbar image-list">
                    ${photos.map(src => `<div class="snap-center flex-shrink-0 w-full aspect-video"><img src="${src}" class="w-full h-full object-cover cursor-pointer lightbox-trigger" alt="${altText}" loading="lazy"></div>`).join('')}
                </div>
                ${photos.length > 1 ? `
                <button class="slider-arrow absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center prev-btn" data-slider="${sliderId}">&lt;</button>
                <button class="slider-arrow absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center next-btn" data-slider="${sliderId}">&gt;</button>
                <div class="slider-dots absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                    ${photos.map((_, i) => `<div class="dot w-2 h-2 rounded-full bg-white/60 transition-all duration-300 ${i === 0 ? 'w-4 bg-white' : ''}" data-index="${i}"></div>`).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }

    navigateSlider(sliderId, direction) {
        const slider = document.getElementById(sliderId);
        if (!slider) return;
        
        const scrollAmount = slider.offsetWidth;
        slider.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
        
        // 도트 업데이트
        setTimeout(() => {
            this.updateSliderDots(slider);
        }, 300);
    }

    updateSliderDots(slider) {
        const dotsContainer = slider.parentElement?.querySelector('.slider-dots');
        if (!dotsContainer) return;
        
        const dots = dotsContainer.querySelectorAll('.dot');
        const currentIndex = Math.round(slider.scrollLeft / slider.offsetWidth);
        
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('w-4', 'bg-white');
                dot.classList.remove('w-2', 'bg-white/60');
            } else {
                dot.classList.add('w-2', 'bg-white/60');
                dot.classList.remove('w-4', 'bg-white');
            }
        });
    }

    getActivityTypeName(type) {
        const nameMap = {
            // 기존 타입들
            'accommodation': '숙박',
            'sightseeing': '관광',
            'dining': '식사',
            'shopping': '쇼핑',
            'transportation': '이동',
            'entertainment': '오락',
            'activity': '액티비티',
            'rest': '휴식',
            // 새로운 타입별 분류
            'restaurant': '맛집',
            'attraction': '명소',
            'transport': '교통',
            'spot': '추천장소',
            'meal': '식사',
            'general': '일반'
        };
        return nameMap[type] || '기타';
    }

    getActivityTypeColor(type) {
        const colorMap = {
            // 기존 타입들
            'accommodation': 'bg-teal-500',
            'sightseeing': 'bg-purple-500',
            'dining': 'bg-amber-500',
            'shopping': 'bg-pink-500',
            'transportation': 'bg-blue-500',
            'entertainment': 'bg-rose-500',
            'activity': 'bg-emerald-500',
            'rest': 'bg-slate-500',
            // 새로운 타입별 분류
            'restaurant': 'bg-amber-500',  // 주황색 (맛집)
            'attraction': 'bg-purple-500', // 보라색 (명소)
            'transport': 'bg-blue-500',    // 파란색 (교통)
            'spot': 'bg-emerald-500',      // 초록색 (추천장소)
            'meal': 'bg-amber-500',        // 주황색 (식사)
            'general': 'bg-slate-500'      // 회색 (일반)
        };
        return colorMap[type] || 'bg-slate-500';
    }

    getActivityTypeTextColor(type) {
        const colorMap = {
            'accommodation': 'text-teal-600',
            'sightseeing': 'text-purple-600',
            'dining': 'text-amber-600',
            'shopping': 'text-pink-600',
            'transportation': 'text-blue-600',
            'entertainment': 'text-rose-600',
            'activity': 'text-emerald-600',
            'rest': 'text-slate-600',
            'restaurant': 'text-amber-600',
            'attraction': 'text-purple-600',
            'transport': 'text-blue-600',
            'spot': 'text-emerald-600',
            'meal': 'text-amber-600',
            'general': 'text-slate-600'
        };
        return colorMap[type] || 'text-slate-600';
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHtml = '';
        
        // 채워진 별
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
        }
        
        // 반 별
        if (hasHalfStar) {
            starsHtml += '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="#d1d5db"/></linearGradient></defs><path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
        }
        
        // 빈 별
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<svg class="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
        }
        
        return starsHtml;
    }

    extractReviewText(reviews) {
        if (typeof reviews === 'string') {
            // "리뷰 텍스트" (별점) 형태 파싱
            const match = reviews.match(/^"([^"]+)"/);
            return match ? match[1] : reviews.split('(')[0].replace(/"/g, '').trim();
        }
        if (Array.isArray(reviews) && reviews.length > 0) {
            // 배열에서 첫 번째 리뷰의 text 추출
            const firstReview = reviews[0];
            if (typeof firstReview === 'object' && firstReview.text) {
                // 긴 리뷰는 첫 문장만 추출
                const text = firstReview.text.split('\n')[0].split('.')[0];
                return text.length > 50 ? text.substring(0, 50) + '...' : text;
            }
            return firstReview.text || firstReview;
        }
        return '좋은 곳입니다';
    }

    extractReviewAuthor(reviews) {
        if (typeof reviews === 'string') {
            // (5⭐) 형태에서 별점 추출하거나 기본값
            const match = reviews.match(/\(([\d⭐]+)\)$/);
            return match ? match[1] : '방문객';
        }
        if (Array.isArray(reviews) && reviews.length > 0) {
            // 배열에서 첫 번째 리뷰의 author 추출
            const firstReview = reviews[0];
            if (typeof firstReview === 'object' && firstReview.author) {
                return firstReview.author;
            }
            return firstReview.author || '방문객';
        }
        return '방문객';
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
            
            // 이미지 슬라이더 네비게이션
            if (e.target.closest('.prev-btn')) {
                const btn = e.target.closest('.prev-btn');
                const sliderId = btn.dataset.slider;
                this.navigateSlider(sliderId, -1);
            }
            
            if (e.target.closest('.next-btn')) {
                const btn = e.target.closest('.next-btn');  
                const sliderId = btn.dataset.slider;
                this.navigateSlider(sliderId, 1);
            }
            
            // 라이트박스 이미지 클릭
            if (e.target.classList.contains('lightbox-trigger')) {
                e.preventDefault();
                this.openLightbox(e.target);
            }
            
            // 라이트박스 닫기
            if (e.target.id === 'lightbox-close' || e.target.closest('#lightbox-close') || e.target.id === 'lightbox-modal') {
                e.preventDefault();
                e.stopPropagation();
                this.closeLightbox();
            }
            
            // 라이트박스 네비게이션
            if (e.target.id === 'lightbox-prev' || e.target.closest('#lightbox-prev')) {
                e.preventDefault();
                e.stopPropagation();
                this.navigateLightbox(-1);
            }
            
            if (e.target.id === 'lightbox-next' || e.target.closest('#lightbox-next')) {
                e.preventDefault();
                e.stopPropagation();
                this.navigateLightbox(1);
            }
            
            // 옵션 칩 클릭
            if (e.target.classList.contains('option-chip')) {
                this.handleOptionChipClick(e.target);
            }
        });

        // 스와이프 이벤트 (간단한 구현)
        this.startX = 0;
        this.endX = 0;

        document.addEventListener('touchstart', (e) => {
            // option chip 캐러셀 영역인지 직접 확인 (더 정확한 방법)
            const touchTarget = e.target;
            const optionChipContainer = touchTarget.closest('.overflow-x-auto.no-scrollbar');
            const isOptionChipArea = optionChipContainer && optionChipContainer.querySelector('.option-chip');
            
            // option chip 컨테이너 내부 터치인지 확인
            if (isOptionChipArea && optionChipContainer.contains(touchTarget)) {
                console.log('🚫 Option chip 캐러셀 영역 터치 - day 스와이프 비활성화');
                this.isSwipeDisabled = true;
                return;
            }
            
            this.isSwipeDisabled = false;
            this.startX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            // option chip 영역 터치였으면 스와이프 무시
            if (this.isSwipeDisabled) {
                console.log('🚫 Option chip 영역 터치였으므로 day 스와이프 무시');
                this.isSwipeDisabled = false; // 상태 리셋
                return;
            }
            
            this.endX = e.changedTouches[0].clientX;
            this.handleSwipe();
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            // 라이트박스가 열려있는 경우
            const lightboxModal = document.getElementById('lightbox-modal');
            if (lightboxModal && !lightboxModal.classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeLightbox();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.navigateLightbox(-1);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.navigateLightbox(1);
                }
                return; // 라이트박스가 열려있으면 다른 키보드 이벤트 무시
            }
            
            // 일반 페이지 네비게이션
            if (e.key === 'ArrowLeft') {
                this.previousPage();
            } else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
        });
    }
    
    setupOptionChipTouchProtection() {
        console.log('⚙️ Option chip 터치 이벤트 보호 설정 시작');
        
        // 모든 option chip 캐러셀 영역 찾기
        const optionContainers = document.querySelectorAll('.overflow-x-auto.no-scrollbar');
        
        optionContainers.forEach(container => {
            if (container.querySelector('.option-chip')) {
                console.log('✅ Option chip 캐러셀 발견, 기본 스크롤 속성 확인');
                
                // 강제로 스크롤 속성 설정
                container.style.overflowX = 'auto';
                container.style.overflowY = 'visible';
                container.style.webkitOverflowScrolling = 'touch';
                
                // 스크롤바 숨김 CSS 강제 적용
                container.style.scrollbarWidth = 'none';
                container.style.msOverflowStyle = 'none';
                
                // 디버깅용 로그
                console.log('🔧 Container styles applied:', {
                    overflowX: container.style.overflowX,
                    scrollWidth: container.scrollWidth,
                    clientWidth: container.clientWidth,
                    canScroll: container.scrollWidth > container.clientWidth
                });
            }
        });
    }

    loadSinglePage(pageIndex) {
        const pageContainer = document.getElementById('page-container');
        if (!pageContainer) return;
        
        const days = this.travelData.days || [];
        if (pageIndex < 0 || pageIndex >= days.length) return;
        
        const day = days[pageIndex];
        const pageHtml = `
            <div class="page-content overflow-y-auto p-6 pb-32" style="width: 100%; height: auto;">
                ${this.generateDayPage(day, pageIndex)}
            </div>
        `;
        
        pageContainer.innerHTML = pageHtml;
        console.log(`✅ 페이지 ${pageIndex} 단일 로드 완료`);
        
        // 스타일 강제 설정
        setTimeout(() => {
            this.forceRemoveHeightStyles();
            this.setupOptionChipTouchProtection();
        }, 50);
    }

    forceRemoveHeightStyles() {
        console.log('🔧 강제로 모든 높이 관련 스타일 제거 시작');
        
        // 메인 컨테이너들
        const mainContainer = document.querySelector('.container');
        const main = document.querySelector('main');
        const pageContainer = document.getElementById('page-container');
        
        if (mainContainer) {
            mainContainer.style.height = 'auto';
            mainContainer.style.minHeight = 'auto';
            mainContainer.style.maxHeight = 'none';
            console.log('✅ 메인 컨테이너 높이 스타일 제거');
        }
        
        if (main) {
            main.style.height = 'auto';
            main.style.minHeight = 'auto';
            main.style.maxHeight = 'none';
            console.log('✅ main 태그 높이 스타일 제거');
        }
        
        if (pageContainer) {
            pageContainer.style.height = 'auto';
            pageContainer.style.minHeight = 'auto';
            pageContainer.style.maxHeight = 'none';
            console.log('✅ page-container 높이 스타일 제거');
        }
        
        // 모든 페이지 콘텐츠
        document.querySelectorAll('.page-content').forEach((page, index) => {
            page.style.height = 'auto';
            page.style.minHeight = 'auto';
            page.style.maxHeight = 'none';
            console.log(`✅ 페이지 ${index} 높이 스타일 제거`);
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
        
        console.log(`📄 단일 페이지 방식으로 페이지 ${pageIndex} 전환 중...`);
        
        // 단일 페이지 로딩 방식 사용 (높이 문제 해결)
        this.loadSinglePage(pageIndex);
        
        console.log(`✅ 페이지 ${pageIndex} 단일 로딩 완료`);
        
        // 스타일 강제 설정 및 보호 기능 설정
        setTimeout(() => {
            this.forceRemoveHeightStyles();
            this.setupOptionChipTouchProtection();
        }, 100);
        
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
        
        // First step response 데이터의 특별한 처리
        let flightInfoHtml = '';
        let dailyTipsHtml = '';
        
        if (this.travelData.flightInfo) {
            const flight = this.travelData.flightInfo;
            flightInfoHtml = `
                <div class="p-5 bg-green-50 rounded-xl">
                    <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 17.5v1.5a1.5 1.5 0 0 0 3 0v-1.5a7.5 7.5 0 0 1 7.5-7.5H21a2 2 0 0 0 0-4h-1.5a7.5 7.5 0 0 1-7.5-7.5V3a1.5 1.5 0 0 0-3 0v1.5a7.5 7.5 0 0 1-7.5 7.5H3a2 2 0 0 0 0 4h1.5a7.5 7.5 0 0 1 7.5 7.5z"/>
                        </svg> 
                        항공편 정보
                    </h3>
                    <div class="text-sm text-slate-600 leading-relaxed">
                        <p><strong>출국:</strong> ${flight.outbound?.airline || ''} ${flight.outbound?.time || ''} (${flight.outbound?.date || ''})</p>
                        <p><strong>귀국:</strong> ${flight.return?.airline || ''} ${flight.return?.time || ''} (${flight.return?.date || ''})</p>
                    </div>
                </div>
            `;
        }
        
        if (this.travelData.dailyTips && this.travelData.dailyTips.length > 0) {
            dailyTipsHtml = this.travelData.dailyTips.map(tip => `
                <div class="p-5 bg-amber-50 rounded-xl">
                    <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span class="text-lg">${tip.icon || '💡'}</span>
                        ${tip.content || '여행 팁'}
                    </h3>
                    <div class="text-sm text-slate-600 leading-relaxed">
                        ${(tip.details || []).map(detail => `<p class="mb-2">• ${detail}</p>`).join('')}
                        ${(tip.spots || []).map(spot => `<p class="mb-2"><strong>${spot.name}:</strong> ${spot.tip}</p>`).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        const defaultInfo = {
            transportation: this.travelData.transportation || '교통편 정보 준비 중',
            localTips: this.travelData.tips || this.travelData.localTips || ['여행 팁 준비 중'],
            weather: this.travelData.weather || this.travelData.seasonalConsiderations || '날씨 정보 준비 중',
            mustTryFood: this.travelData.food || this.travelData.mustTryFood || ['현지 음식 추천 준비 중']
        };

        return `
            <h2 class="text-2xl font-bold text-slate-800 mb-6">여행 정보</h2>
            <div class="space-y-4">
                ${flightInfoHtml}
                
                ${dailyTipsHtml}
                
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
        // 새로운 구조(estimatedBudget) 또는 기존 구조 지원
        const budget = this.travelData.estimatedBudget || this.travelData.budget || this.travelData.budgetBreakdown || {};
        
        // First step response 구조에서 총 예산 추출
        let totalBudgetValue = 500000; // 기본값
        if (budget.total) {
            totalBudgetValue = budget.total;
        } else if (budget.value) {
            totalBudgetValue = budget.value;
        }
        
        // 인당 예산 정보 추가
        const perPersonBudget = budget.perPerson || Math.floor(totalBudgetValue / (this.travelData.travelers?.adults || 1));
        const currency = budget.currency || 'KRW';
        
        // 기본 비용 분석 (총 예산을 기준으로 비례 배분)
        const breakdown = budget.breakdown || [
            { category: 'accommodation', value: Math.floor(totalBudgetValue * 0.4), description: '숙박비 (1박당 기준)' },
            { category: 'meals', value: Math.floor(totalBudgetValue * 0.3), description: '식비 (1일 3식 기준)' },
            { category: 'activities', value: Math.floor(totalBudgetValue * 0.2), description: '관광지 입장료 및 체험비' },
            { category: 'transportation', value: Math.floor(totalBudgetValue * 0.1), description: '현지 교통비' }
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
                            <p class="text-xs text-slate-500">₩${totalBudgetValue.toLocaleString()}</p>
                            ${perPersonBudget ? `<p class="text-xs text-slate-400">1인당 약 ₩${perPersonBudget.toLocaleString()}</p>` : ''}
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
        console.log('🧳 준비물 데이터 확인:', todos);
        
        // generateTodoList에서 생성된 todos가 있으면 사용하고, 없으면 기본 체크리스트 사용
        if (todos.length > 0) {
            // todos 배열을 카테고리별로 그룹화
            const categorizedTodos = {};
            
            todos.forEach(todo => {
                const category = this.getCategoryDisplayName(todo.category);
                if (!categorizedTodos[category]) {
                    categorizedTodos[category] = [];
                }
                categorizedTodos[category].push(todo);
            });

            return `
                <h2 class="text-2xl font-bold text-slate-800 mb-6">여행 준비물</h2>
                <div class="space-y-6">
                    ${Object.entries(categorizedTodos).map(([category, items]) => `
                        <div>
                            <h3 class="font-bold text-slate-800 mb-4 border-b pb-2">${category}</h3>
                            <div class="space-y-3">
                                ${items.map(item => `
                                    <label class="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <input type="checkbox" class="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500">
                                        <span class="text-sm text-slate-700">${item.text}</span>
                                        <span class="ml-auto text-xs px-2 py-1 rounded ${this.getPriorityClass(item.priority)}">${this.getPriorityLabel(item.priority)}</span>
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
        
        // 기본 체크리스트를 카테고리별로 구성 (폴백)
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

    getCategoryDisplayName(category) {
        const categoryMap = {
            'pre-departure': '✈️ 출발 전 필수',
            'packing': '👕 개인 용품',
            'departure': '🚀 출발 당일',
            'local': '🗺️ 현지 도착 후',
            'return': '🏠 귀국 준비'
        };
        return categoryMap[category] || `📋 ${category}`;
    }

    getPriorityClass(priority) {
        const priorityClasses = {
            'high': 'bg-red-100 text-red-700',
            'medium': 'bg-yellow-100 text-yellow-700', 
            'low': 'bg-green-100 text-green-700'
        };
        return priorityClasses[priority] || 'bg-gray-100 text-gray-700';
    }

    getPriorityLabel(priority) {
        const priorityLabels = {
            'high': '필수',
            'medium': '중요',
            'low': '옵션'
        };
        return priorityLabels[priority] || priority;
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

    // 라이트박스 제어 함수들
    openLightbox(imgElement) {
        const modal = document.getElementById('lightbox-modal');
        const lightboxImage = document.getElementById('lightbox-image');
        const currentImageEl = document.getElementById('current-image');
        const totalImagesEl = document.getElementById('total-images');
        const counter = document.getElementById('lightbox-counter');
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');

        if (!modal || !lightboxImage) return;

        // 현재 이미지가 속한 슬라이더 컨테이너 찾기
        const sliderContainer = imgElement.closest('.image-slider-container');
        if (sliderContainer) {
            // 슬라이더의 모든 이미지 수집
            const allImages = Array.from(sliderContainer.querySelectorAll('.lightbox-trigger'));
            this.lightboxImages = allImages.map(img => ({
                src: img.src,
                alt: img.alt
            }));
            this.currentLightboxIndex = allImages.indexOf(imgElement);
        } else {
            // 단일 이미지
            this.lightboxImages = [{
                src: imgElement.src,
                alt: imgElement.alt
            }];
            this.currentLightboxIndex = 0;
        }

        // 라이트박스 업데이트
        this.updateLightboxImage();

        // 네비게이션 버튼 표시/숨기기
        if (this.lightboxImages.length > 1) {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
            counter.classList.remove('hidden');
        } else {
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            counter.classList.add('hidden');
        }

        // 모달 표시
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // 스크롤 방지
    }

    closeLightbox() {
        const modal = document.getElementById('lightbox-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; // 스크롤 복원
            this.lightboxImages = [];
            this.currentLightboxIndex = 0;
        }
    }

    navigateLightbox(direction) {
        if (!this.lightboxImages || this.lightboxImages.length <= 1) return;

        this.currentLightboxIndex += direction;

        // 순환 네비게이션
        if (this.currentLightboxIndex >= this.lightboxImages.length) {
            this.currentLightboxIndex = 0;
        } else if (this.currentLightboxIndex < 0) {
            this.currentLightboxIndex = this.lightboxImages.length - 1;
        }

        this.updateLightboxImage();
    }

    updateLightboxImage() {
        const lightboxImage = document.getElementById('lightbox-image');
        const currentImageEl = document.getElementById('current-image');
        const totalImagesEl = document.getElementById('total-images');

        if (!lightboxImage || !this.lightboxImages) return;

        const currentImage = this.lightboxImages[this.currentLightboxIndex];
        lightboxImage.src = currentImage.src;
        lightboxImage.alt = currentImage.alt;

        // 카운터 업데이트
        if (currentImageEl && totalImagesEl) {
            currentImageEl.textContent = this.currentLightboxIndex + 1;
            totalImagesEl.textContent = this.lightboxImages.length;
        }
    }

    handleOptionChipClick(chipElement) {
        const activityContainer = chipElement.closest('.activity-with-options');
        const optionIndex = parseInt(chipElement.dataset.index);
        
        if (!activityContainer) return;
        
        // 모든 칩의 active 클래스 제거
        activityContainer.querySelectorAll('.option-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        
        // 클릭된 칩에 active 클래스 추가
        chipElement.classList.add('active');
        
        // 선택된 옵션의 상세 정보를 가져와서 업데이트
        // (mock_resp.json의 데이터 구조에 맞춰 옵션 데이터를 찾아야 함)
        this.updateOptionDetails(activityContainer, optionIndex);
    }
    
    updateOptionDetails(activityContainer, optionIndex) {
        // 현재 페이지와 활동을 찾아서 옵션 데이터 업데이트
        const currentPageIndex = this.currentPage;
        const currentDay = this.travelData.days[currentPageIndex];
        
        if (!currentDay || !currentDay.activities) return;
        
        // 활동 찾기 (DOM 순서와 데이터 순서가 일치한다고 가정)
        const activityIndex = Array.from(activityContainer.parentElement.children)
            .indexOf(activityContainer);
        
        const activity = currentDay.activities[activityIndex];
        if (!activity) return;
        
        // 옵션 데이터 찾기 (직접 options 또는 transportation.options)
        let options = null;
        if (activity.options && activity.options.length > 0) {
            options = activity.options;
        } else if (activity.transportation && activity.transportation.options && activity.transportation.options.length > 0) {
            options = activity.transportation.options;
        }
        
        if (!options || !options[optionIndex]) return;
        
        const selectedOption = options[optionIndex];
        const detailsContainer = activityContainer.querySelector('.option-details-container');
        
        if (detailsContainer) {
            detailsContainer.innerHTML = this.generateOptionDetails(selectedOption);
            
            // 이미지 슬라이더 재초기화
            setTimeout(() => {
                this.initializeImageSlidersInContainer(detailsContainer);
            }, 100);
        }
    }
    
    initializeImageSlidersInContainer(container) {
        const sliders = container.querySelectorAll('.image-slider-container');
        sliders.forEach(sliderContainer => {
            // 기존 이미지 슬라이더 초기화 로직 적용
            this.initializeSingleImageSlider(sliderContainer);
        });
    }
    
    initializeSingleImageSlider(sliderContainer) {
        const imageList = sliderContainer.querySelector('.image-list');
        const prevBtn = sliderContainer.querySelector('.prev-btn');
        const nextBtn = sliderContainer.querySelector('.next-btn');
        const dotsContainer = sliderContainer.querySelector('.slider-dots');
        const images = imageList?.querySelectorAll('div');
        
        if (!imageList || !prevBtn || !nextBtn || !images) return;
        
        if (images.length <= 1) {
            if (dotsContainer) dotsContainer.style.display = 'none';
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            return;
        }
        
        let currentIndex = 0;
        
        const updateSlider = (smooth = true) => {
            imageList.scrollTo({
                left: imageList.offsetWidth * currentIndex,
                behavior: smooth ? 'smooth' : 'auto'
            });
        };
        
        prevBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
            updateSlider();
        };
        
        nextBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
            updateSlider();
        };
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