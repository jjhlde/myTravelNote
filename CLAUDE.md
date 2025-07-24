# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**TripCrafter** - AI 기반 개인 맞춤형 여행 플래너 MVP
- **목적**: 사용자가 30초 안에 전문가급 여행계획 생성 및 개인 전용 PWA 앱 다운로드
- **형태**: 대화형 AI 챗봇 + 자동 PWA 생성 서비스
- **핵심 가치**: 체험 후 로그인 전략으로 높은 사용자 전환율 달성
- **차별화**: 즉시 체험 → 가치 증명 → 자연스러운 로그인 유도

### 기존 자산 활용
- **현재 상태**: 마카오 가족여행 PWA는 예제/레퍼런스로 활용
- **랜딩 페이지**: TripBot 브랜딩 완료 (landing.html)
- **PWA 템플릿**: templates/main-template.html이 실제 여행앱 생성 템플릿

## 기술 스택 & 아키텍처

### 기술 스택
- **Frontend**: 순수 HTML/CSS/JavaScript (프레임워크 없음)
- **AI**: Gemini 2.5 Flash API 연동
- **PWA**: Service Worker, Web App Manifest 자동 생성
- **스토리지**: LocalStorage (임시세션) + 향후 서버 연동
- **인증**: Google OAuth (원클릭 로그인)
- **지도**: Google Maps API 연동

### 아키텍처 특징
- **체험 중심 구조**: 로그인 전 전체 기능 체험 가능
- **임시세션 관리**: 30분 임시 저장 → 로그인 시 정식 계정 이전
- **실시간 생성**: AI 응답 → PWA 템플릿 적용 → 즉시 접근 가능
- **템플릿 시스템**: templates/main-template.html 기반 동적 PWA 생성
- **모바일 퍼스트**: 터치 최적화 + 즉시 설치 가능
- **URL 기반 접근**: /app?session=abc123 형태로 각 사용자별 PWA 접근

## 파일 구조

### 📱 실제 MVP 챗봇 시스템 파일들 (핵심) ⭐ **현재 개발 완료**
```
myTravelNote/
├── chatbot_ver2_clean.html     # 🎯 메인 챗봇 인터페이스 (기본 베이스)
├── chatbot_ver2.js             # 🧠 완전한 대화 로직 + Gemini API 연동
├── chatbot_ver2.css            # 🎨 챗봇 전용 스타일시트
├── config.js                   # 🔑 API 설정 (Gemini API 키 포함)
├── server.js                   # 🖥️ Node.js 개발 서버 (포트 9000)
├── prompts/                    # 📋 AI 프롬프트 시스템
│   └── first_step.txt          # 1단계 정보 수집 지침 (완성)
└── package.json                # 📦 Node.js 의존성 관리
```

### 🚀 **2024-07-23 개발 완료 현황**
- ✅ **1단계**: Gemini API 연결 및 기본 대화 기능
- ✅ **2단계**: `first_step.txt` 프롬프트 시스템 연동
- ✅ **3단계**: 체계적 정보 수집 대화 로직 구현
- ✅ **4단계**: JSON 응답 파싱 및 구조화된 데이터 저장
- ✅ **5단계**: 완전한 여행 계획 대화 플로우 검증

### 📱 구축 예정인 PWA 생성 시스템 파일들
```
myTravelNote/
├── templates/          # PWA 생성용 템플릿 파일들
│   ├── main-template.html      # 메인 PWA 템플릿
│   ├── info-template.html      # 여행 정보 템플릿
│   ├── day-template.html       # 일차별 일정 템플릿
│   ├── budget-template.html    # 예산 정보 템플릿
│   ├── todo-template.html      # 할일 체크리스트 템플릿
│   └── manifest-template.json  # PWA 매니페스트 템플릿
├── main-script.js      # 동적 PWA 렌더링 스크립트
├── landing.html        # 마케팅 랜딩 페이지 (TripBot 브랜딩)
└── sw.js              # Service Worker (오프라인 캐싱)
```

### 📄 예제/레퍼런스 파일들 (참고용)
```
├── main.html           # 마카오 여행 PWA 예제
├── script.js           # 예제용 스크립트
├── styles.css          # 예제 스타일시트
├── manifest.json       # 예제 PWA 매니페스트
├── pages/              # 예제 페이지들
│   ├── info.html      # 마카오 여행 정보 예제
│   ├── day1.html      # 마카오 1일차 예제
│   ├── day2.html      # 마카오 2일차 예제
│   ├── day3.html      # 마카오 3일차 예제
│   ├── day4.html      # 마카오 4일차 예제
│   └── budget.html    # 마카오 예산 예제
└── images/            # 마카오 여행 이미지들
```

### 🔄 **현재 구현된 대화 플로우 (2024-07-23 완성)**
```
1. chatbot_ver2_clean.html에서 사용자 여행 의도 입력
   ↓
2. chatbot_ver2.js가 first_step.txt 프롬프트 로드
   ↓  
3. Gemini 2.5 Flash API로 적응형 질문 생성
   ↓
4. 3단계 정보 수집 (기본틀 → 실행조건 → 개인화)
   ↓
5. 사용자 확인 시 구조화된 JSON 응답 생성
   ↓
6. conversationState에 여행 데이터 저장 완료
```

### 🔄 **향후 구현할 PWA 생성 플로우**
```
6. 저장된 JSON 데이터 → 고유 session ID 생성
   ↓
7. /app?session=abc123 형태로 PWA 접근 URL 생성
   ↓
8. templates/main-template.html 로드
   ↓
9. main-script.js가 session 데이터를 PWA로 렌더링
```

## 🚀 MVP 핵심 전략

### 사용자 플로우: 체험 후 로그인
```
접속 → 즉시 채팅 시작 → AI 여행계획 체험 → 가치 증명 → 로그인 유도 → PWA 생성
```

#### 핵심 원칙
1. **진입장벽 제거**: 로그인 없이 전체 서비스 체험 가능
2. **가치 증명 우선**: 좋은 결과를 먼저 보여준 후 로그인 요구
3. **손실 회피 활용**: "만든 계획이 사라져요" 심리 활용
4. **즉시성 강조**: 30초 안에 완성되는 경험

### 임시세션 전략
- **체험 시간**: 30분 임시 저장
- **데이터 보관**: LocalStorage + 임시 서버 세션
- **로그인 연결**: 임시 데이터 → 사용자 계정 자동 이전
- **만료 처리**: 세션 만료 전 로그인 유도 알림

## 🎨 프론트엔드 UI/UX 설계

### index.html 구성 원칙

#### 사용자 상태별 UI 분기
```javascript
// 사용자 상태 관리
const UserState = {
  GUEST: 'guest',           // 미로그인 체험 사용자
  LOGIN_REQUIRED: 'login',  // 로그인 유도 시점
  AUTHENTICATED: 'user'     // 정식 로그인 사용자
};
```

#### 1. 신규 방문자 (GUEST) UI
```
┌─────────────────────────────────┐
│ 🤖 TripBot - 무료로 체험해보세요! │
│ 어디로 떠나고 싶으세요?           │
│ [입력창 - 자동 포커스]           │
│ 💡 로그인 없이 바로 체험 가능     │
└─────────────────────────────────┘
```

#### 2. 로그인 유도 (LOGIN_REQUIRED) UI
```
┌─────────────────────────────────┐
│ 🎉 여행계획이 완성됐어요!         │
│                                 │
│ [스마트 미리보기 영역]           │
│ ✅ 여행 하이라이트 (70% 공개)    │
│ 🔒 상세 일정 보기...            │
│                                 │
│ [📱 나만의 여행앱 만들기]         │
│ "로그인하면 평생 보관됩니다"      │
└─────────────────────────────────┘
```

#### 3. 기존 사용자 (AUTHENTICATED) UI
```
┌─────────────────────────────────┐
│ 👋 다시 오셨네요!               │
│ 새로운 여행 계획을 세워볼까요?     │
│ [입력창]                        │
│ 📚 내 여행 목록 | ⚙️ 설정        │
└─────────────────────────────────┘
```

### 스마트 미리보기 전략

#### 공개할 내용 (70% - 가치 증명)
- ✅ **여행 제목 & 기간**: "제주도 2박3일 가족여행"
- ✅ **일차별 하이라이트**: "DAY 1: 성산일출봉, DAY 2: 한라산..."
- ✅ **대표 맛집 2-3곳**: "흑돼지골목, 올레국수..."
- ✅ **예상 비용**: "1인당 약 30만원"
- ✅ **특별 팁 1개**: "렌터카 예약은 미리!"

#### 숨길 내용 (30% - 로그인 유도)
- 🔒 **상세 시간표**: "09:00 호텔 출발 → 09:30 성산일출봉..."
- 🔒 **구체적 주소 & 지도**: Google Maps 링크들
- 🔒 **맛집 메뉴 추천**: "흑돼지 부위별 추천"
- 🔒 **교통편 상세정보**: "버스 노선, 택시 요금"
- 🔒 **현지인 팁**: "포토스팟, 할인 정보"

### 채팅 인터페이스 설계

#### 대화 플로우 최적화
1. **첫 메시지**: "어디로 여행가고 싶으세요?"
2. **추가 질문**: 최대 2-3개로 제한 (기간, 예산, 동반자)
3. **생성 진행**: 실시간 단계별 진행상황 표시
4. **결과 제시**: 스마트 미리보기 + 로그인 유도

#### UI 컴포넌트
- **입력창**: 자동 포커스, 플레이스홀더 가이드
- **메시지 버블**: 사용자/AI 구분 디자인
- **진행 표시기**: 단계별 프로그레스 바
- **결과 카드**: 미리보기 + 로그인 버튼

## 주요 컴포넌트

### chatbot.js (메인 PWA 생성 엔진)
- **AI 챗봇 인터페이스**: Gemini API 연동 대화형 UI
- **PWA 생성 엔진**: 템플릿 기반 동적 여행앱 생성
- **임시세션 관리**: 30분 체험 데이터 보관
- **JSON 저장 시스템**: localStorage 기반 데이터 관리
- **사용자 상태 관리**: Guest/LoginRequired/Authenticated 분기

### main-script.js (동적 PWA 렌더링)
- **세션 기반 로딩**: URL의 session ID로 데이터 로드
- **동적 콘텐츠 렌더링**: JSON 데이터를 HTML로 변환
- **스와이프 네비게이션**: 터치 제스처 지원
- **PWA 기능 지원**: 오프라인 작동, 홈 화면 설치

### sw.js (Service Worker)
- **오프라인 캐싱**: 정적 파일들을 캐시하여 오프라인 사용 지원
- **캐시 전략**: Cache First 전략 사용
- **동적 캐싱**: 생성된 PWA 파일들 자동 캐싱

### config.js (API 설정)
- **Gemini API**: AI 여행계획 생성
- **Google OAuth**: 간편 로그인 설정
- **Google Maps API**: 위치 정보 연동

## 🔐 로그인 시스템 통합

### 인증 플로우 설계

#### Google OAuth 통합
```javascript
// OAuth 설정
const GOOGLE_CLIENT_ID = 'your-google-client-id';
const OAUTH_CONFIG = {
  client_id: GOOGLE_CLIENT_ID,
  callback: handleOAuthCallback,
  scope: 'profile email'
};
```

#### 로그인 시점 최적화
1. **타이밍**: AI 여행계획 완성 직후 (성취감 최고조)
2. **동기**: "이 계획을 저장하려면 로그인하세요"
3. **혜택**: 명확한 가치 제시 (보관, 수정, 공유, 오프라인 사용)
4. **마찰 최소화**: 원클릭 Google 로그인

### 임시세션 → 정식계정 연결

#### 데이터 구조
```javascript
// 임시세션 데이터
const tempSession = {
  id: generateTempId(),
  travelData: {
    destination: "제주도",
    duration: "2박3일", 
    travelers: "가족",
    aiResponse: { /* Gemini 응답 */ }
  },
  createdAt: Date.now(),
  expiresAt: Date.now() + (30 * 60 * 1000) // 30분
};

// 로그인 시 데이터 이전
const transferToUser = async (tempSessionId, userId) => {
  const tempData = localStorage.getItem(`temp_${tempSessionId}`);
  const userData = {
    userId: userId,
    travelPlans: [JSON.parse(tempData)],
    createdAt: Date.now()
  };
  // 서버에 저장 또는 LocalStorage 업데이트
  await saveUserData(userData);
  localStorage.removeItem(`temp_${tempSessionId}`);
};
```

#### 세션 관리 로직
1. **임시세션 생성**: 첫 방문 시 고유 ID 생성
2. **데이터 보관**: LocalStorage에 30분간 저장
3. **만료 경고**: 25분 후 로그인 유도 알림
4. **자동 정리**: 만료된 임시세션 자동 삭제

### 사용자 상태 관리

#### 상태 전환 흐름
```javascript
class UserStateManager {
  constructor() {
    this.currentState = this.detectUserState();
  }
  
  detectUserState() {
    const token = localStorage.getItem('authToken');
    const tempSession = localStorage.getItem('tempSession');
    
    if (token && this.isValidToken(token)) {
      return UserState.AUTHENTICATED;
    } else if (tempSession) {
      return UserState.GUEST;
    } else {
      return UserState.GUEST;
    }
  }
  
  transitionTo(newState, data = {}) {
    this.currentState = newState;
    this.renderUI(newState, data);
  }
}
```

#### UI 렌더링 분기
```javascript
const renderUI = (userState, data) => {
  switch(userState) {
    case UserState.GUEST:
      showGuestWelcome();
      break;
    case UserState.LOGIN_REQUIRED:
      showLoginPrompt(data.travelPlan);
      break;
    case UserState.AUTHENTICATED:
      showUserDashboard(data.user);
      break;
  }
};
```

### 로그인 버튼 최적화

#### 버튼 텍스트 전략
```javascript
const loginButtonTexts = {
  primary: "📱 나만의 여행앱 만들기",
  hover: "3초만에 Google 로그인하고 앱 받기",
  loading: "Google 계정 연결 중...",
  success: "🎉 앱 생성 중입니다!"
};
```

#### 심리적 유도 메시지
- **성취감**: "멋진 여행계획이 완성됐어요!"
- **실용성**: "앱으로 저장하면 오프라인에서도 볼 수 있어요"
- **독점감**: "나만의 전용 여행앱"
- **손실 회피**: "로그인하지 않으면 계획이 사라져요"

## 💻 개발 구현 가이드

### API 연동 구현

#### Gemini API 통합
```javascript
// Gemini API 호출
class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }
  
  async generateTravelPlan(userInput) {
    const prompt = this.buildTravelPrompt(userInput);
    const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    return this.parseResponse(await response.json());
  }
  
  buildTravelPrompt(input) {
    return `
    사용자 요청: ${input.destination} ${input.duration} ${input.travelers} 여행
    
    다음 JSON 형식으로 여행계획을 생성해주세요:
    {
      "title": "여행 제목",
      "duration": "기간",
      "budget": "예상 비용",
      "highlights": ["주요 명소들"],
      "restaurants": ["추천 맛집들"],
      "tips": ["여행 팁"],
      "detailed_schedule": {
        "day1": { /* 상세 일정 */ },
        "day2": { /* 상세 일정 */ }
      }
    }
    `;
  }
}
```

#### PWA 생성 엔진
```javascript
class PWAGenerator {
  constructor() {
    this.templates = {}; // 템플릿 파일들 로드
  }
  
  async generatePWA(aiResponse) {
    const sessionId = Date.now().toString();
    const travelData = this.extractTravelData(aiResponse);
    
    // localStorage에 JSON 저장
    localStorage.setItem(`generatedApp_${sessionId}`, JSON.stringify(travelData));
    
    // 생성된 앱 URL 반환
    return `/app?session=${sessionId}`;
  }
  
  extractTravelData(aiResponse) {
    return {
      title: `${aiResponse.destination} ${aiResponse.duration}`,
      destination: aiResponse.destination,
      duration: aiResponse.duration,
      days: aiResponse.days || [],
      budget: aiResponse.budget || '예산 미정',
      tips: aiResponse.tips || [],
      todos: this.generateTodoList(aiResponse.destination),
      createdAt: new Date().toISOString()
    };
  }
}
```

### 상태 관리 시스템

#### 중앙 상태 관리
```javascript
class AppStateManager {
  constructor() {
    this.state = {
      user: null,
      tempSession: null,
      currentTravelPlan: null,
      uiState: UserState.GUEST
    };
    this.subscribers = [];
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }
  
  subscribe(callback) {
    this.subscribers.push(callback);
  }
  
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }
}
```

#### 실시간 UI 업데이트
```javascript
class UIController {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.stateManager.subscribe(this.render.bind(this));
  }
  
  render(state) {
    this.updateHeader(state.user);
    this.updateMainContent(state.uiState, state.currentTravelPlan);
    this.updateActions(state.uiState);
  }
  
  updateMainContent(uiState, travelPlan) {
    const contentArea = document.getElementById('main-content');
    
    switch(uiState) {
      case UserState.GUEST:
        contentArea.innerHTML = this.renderChatInterface();
        break;
      case UserState.LOGIN_REQUIRED:
        contentArea.innerHTML = this.renderPreview(travelPlan);
        break;
      case UserState.AUTHENTICATED:
        contentArea.innerHTML = this.renderDashboard();
        break;
    }
  }
}
```

### 오류 처리 및 폴백

#### API 오류 처리
```javascript
class ErrorHandler {
  static handleAPIError(error, operation) {
    console.error(`${operation} failed:`, error);
    
    switch(error.status) {
      case 429: // Rate limit
        return '잠시 후 다시 시도해주세요.';
      case 401: // Unauthorized
        return '인증이 필요합니다.';
      case 500: // Server error
        return 'AI가 일시적으로 바빠요. 잠시만 기다려주세요.';
      default:
        return '문제가 발생했습니다. 새로고침 후 다시 시도해주세요.';
    }
  }
  
  static showUserFriendlyError(message) {
    // 사용자에게 친화적인 오류 메시지 표시
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
  }
}
```

### 성능 최적화

#### 지연 로딩
```javascript
// API 스크립트 지연 로딩
const loadGoogleAPI = () => {
  return new Promise((resolve) => {
    if (window.google) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

// 로그인 버튼 클릭 시에만 로드
document.getElementById('login-btn').addEventListener('click', async () => {
  await loadGoogleAPI();
  initializeAuth();
});
```

#### 캐싱 전략
```javascript
class CacheManager {
  static setTempCache(key, data, ttl = 30 * 60 * 1000) {
    const item = {
      data: data,
      expires: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  }
  
  static getTempCache(key) {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expires) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  }
}
```

## 개발 명령어

### 테스트 및 개발
```bash
# 로컬 개발 서버 실행 (PWA 기능 테스트용)
python -m http.server 8000
# 또는
npx serve .

# HTTPS 테스트 (OAuth 및 PWA 기능용)
npx serve . --ssl

# 모바일 테스트 (네트워크 IP로 접근)
npx serve . --host 0.0.0.0
```

### API 키 설정
```bash
# config.js에서 API 키 설정
const CONFIG = {
  GEMINI_API_KEY: 'your-gemini-api-key',
  GOOGLE_CLIENT_ID: 'your-google-client-id',
  GOOGLE_MAPS_API_KEY: 'your-maps-api-key'
};
```

### 빌드 및 배포
- **빌드**: 별도 빌드 과정 불필요 (정적 파일)
- **배포**: 정적 파일 호스팅 서비스 이용
- **환경변수**: API 키는 환경별로 분리 관리

### 디버깅 도구
```bash
# Chrome DevTools에서 PWA 테스트
# Application 탭 > Service Workers
# Application 탭 > Local Storage
# Network 탭 > API 호출 확인
```

## 🚀 MVP 개발 우선순위

### Phase 1: 핵심 체험 기능 (1-2주)
#### 목표: 로그인 없이 전체 서비스 체험 가능

**우선순위 1 (P1) - 즉시 구현**
- ✅ **기본 채팅 인터페이스**: 사용자 입력 받기
- ✅ **Gemini API 연동**: AI 여행계획 생성
- ✅ **임시세션 관리**: 30분 체험 데이터 보관
- ✅ **스마트 미리보기**: 70% 공개 + 로그인 유도

**우선순위 2 (P2) - 기본 완성**
- ✅ **사용자 상태 관리**: Guest/LoginRequired/Authenticated
- ✅ **기본 UI/UX**: TripBot 브랜딩 적용
- ✅ **오류 처리**: 사용자 친화적 에러 메시지

### Phase 2: 로그인 및 PWA 생성 (2-3주)
#### 목표: 완전한 MVP 기능 구현

**우선순위 1 (P1) - 필수 기능**
- ✅ **Google OAuth 연동**: 원클릭 로그인
- ✅ **세션 데이터 이전**: 임시세션 → 정식계정
- ✅ **PWA 생성 엔진**: 템플릿 기반 앱 생성
- ✅ **파일 호스팅**: 생성된 PWA 접근 가능

**우선순위 2 (P2) - 사용성 개선**
- ✅ **진행상황 표시**: 실시간 생성 과정 표시
- ✅ **모바일 최적화**: 터치 인터페이스 완성
- ✅ **PWA 설치 가이드**: 사용자 앱 설치 안내

### Phase 3: 최적화 및 안정화 (1-2주)
#### 목표: 사용자 경험 향상

**우선순위 1 (P1) - 핵심 최적화**
- ✅ **로딩 시간 개선**: API 응답 8-15초 목표
- ✅ **오류 복구**: Fallback 시나리오 구현
- ✅ **성능 모니터링**: 사용자 행동 추적

**우선순위 2 (P2) - 추가 개선**
- ✅ **캐싱 최적화**: 반복 요청 성능 향상
- ✅ **A/B 테스트 준비**: 로그인 전환율 측정
- ✅ **SEO 최적화**: 검색엔진 노출 준비

### Post-MVP: 확장 기능 (추후 개발)
#### 목표: 서비스 고도화

**확장 기능 목록**
- 🔄 **여행계획 수정**: 생성 후 편집 기능
- 📱 **소셜 공유**: 여행계획 공유 기능
- 🗂️ **사용자 대시보드**: 내 여행 목록 관리
- 🎨 **커스터마이징**: PWA 테마 선택
- 🌍 **다국어 지원**: 영어, 중국어, 일본어
- 💰 **예산 추적**: 실제 지출 기록
- 📸 **여행기 작성**: 사진 업로드 및 후기

### 개발 체크리스트

#### Phase 1 완료 기준
- [ ] 사용자가 여행지 입력 → AI 응답 받기 가능
- [ ] 임시세션으로 30분간 체험 데이터 보관
- [ ] 70% 미리보기 + 로그인 유도 UI 완성
- [ ] 모바일에서 정상 작동

#### Phase 2 완료 기준
- [ ] Google 로그인 → PWA 생성 → 다운로드 전체 플로우 완성
- [ ] 생성된 PWA가 독립적으로 설치/작동
- [ ] 사용자별 고유 URL 접근 가능
- [ ] 로그인 전환율 30% 이상 달성

#### Phase 3 완료 기준
- [ ] 전체 프로세스 30초 내 완성
- [ ] 에러율 5% 미만
- [ ] 모바일 사용성 점수 85점 이상
- [ ] 재방문율 20% 이상

### 성공 지표 (KPI)
- **초기 참여율**: 진입 후 첫 입력 시작 > 70%
- **체험 완료율**: 전체 프로세스 완료 > 60%
- **로그인 전환율**: 체험 후 로그인 > 30%
- **PWA 설치율**: 로그인 후 앱 설치 > 80%
- **30초 완성율**: 목표 시간 내 완성 > 90%

## 주요 기능

### PWA 기능
- **동적 앱 생성**: AI 응답 기반 개인 맞춤형 PWA 자동 생성
- **오프라인 사용**: Service Worker를 통한 캐싱
- **즉시 설치**: 생성 완료 즉시 홈 화면 설치 가능
- **고유 URL**: 사용자별 독립적인 앱 접근 주소

### AI 챗봇 기능
- **자연어 처리**: "제주도 2박3일 가족여행" 형태 입력 지원
- **대화형 정보 수집**: 최소한의 추가 질문으로 최적화
- **실시간 생성**: 8-15초 내 전문가급 여행계획 완성
- **스마트 미리보기**: 가치 증명 후 로그인 유도 전략

### 사용자 관리
- **체험 우선**: 로그인 없이 전체 서비스 체험 가능
- **원클릭 로그인**: Google OAuth 간편 인증
- **데이터 이전**: 체험 데이터 → 정식 계정 자동 연결
- **상태별 UI**: Guest/LoginRequired/Authenticated 분기

## 개발 시 주의사항

### 이미지 처리
- 이미지는 `images/` 폴더에 일차별로 정리
- 파일명 규칙: `day{N}_{장소명}_{번호}.png`
- 이미지 최적화를 위해 적절한 크기로 리사이징 필요
- 파일명은 반드시 영어로 작성

### PWA 개발
- Service Worker는 HTTPS 환경에서만 동작
- 로컬 테스트 시 `localhost`에서 실행 필요

### 모바일 최적화
- 터치 제스처 및 스와이프 기능 고려
- 작은 화면에서의 가독성 확보
- 버튼 크기 및 간격 조정

## Git 워크플로

### 중요 규칙
**코드 수정 후에는 반드시 git commit, push 해주세요.**

### 일반적인 워크플로
```bash
git add .
git commit -m "feature: 새로운 기능 추가"
git push origin main
```


## 클로드 코드에서의 mcp-installer를 사용한 MCP (Model Context Protocol) 설치 및 설정 가이드 
공통 주의사항
1. 현재 사용 환경을 확인할 것. 모르면 사용자에게 물어볼 것. 
2. OS(윈도우,리눅스,맥) 및 환경들(WSL,파워셀,명령프롬프트등)을 파악해서 그에 맞게 세팅할 것. 모르면 사용자에게 물어볼 것.
3. mcp-installer을 이용해 필요한 MCP들을 설치할 것
   (user 스코프로 설치 및 적용할것)
4. 특정 MCP 설치시, 바로 설치하지 말고, WebSearch 도구로 해당 MCP의 공식 사이트 확인하고 현재 OS 및 환경 매치하여, 공식 설치법부터 확인할 것
5. 공식 사이트 확인 후에는 context7 MCP 존재하는 경우, context7으로 다시 한번 확인할 것
6. MCP 설치 후, task를 통해 디버그 모드로 서브 에이전트 구동한 후, /mcp 를 통해 실제 작동여부를 반드시 확인할 것 
7. 설정 시, API KEY 환경 변수 설정이 필요한 경우, 가상의 API 키로 디폴트로 설치 및 설정 후, 올바른 API 키 정보를 입력해야 함을 사용자에게 알릴 것
8. Mysql MCP와 같이 특정 서버가 구동중 상태여만 정상 작동한 것은 에러가 나도 재설치하지 말고, 정상 구동을 위한 조건을 사용자에게 알릴 것
9. 현재 클로드 코드가 실행되는 환경이야.
10. 설치 요청 받은 MCP만 설치하면 돼. 혹시 이미 설치된 다른 MCP 에러 있어도, 그냥 둘 것
11. 일단, 터미널에서 설치하려는 MCP 작동 성공한 경우, 성공 시의 인자 및 환경 변수 이름을 활용해, 올바른 위치의 json 파일에 MCP 설정을 직접할 것

*윈도우에서의 주의사항*
1. 설정 파일 직접 세팅시, Windows 경로 구분자는 백슬래시(\)이며, JSON 내에서는 반드시 이스케이프 처리(\\\\)해야 해.
** OS 공통 주의사항**
1. Node.js가 %PATH%에 등록되어 있는지, 버전이 최소 v18 이상인지 확인할 것
2. npx -y 옵션을 추가하면 버전 호환성 문제를 줄일 수 있음

### MCP 서버 설치 순서

1. 기본 설치
	mcp-installer를 사용해 설치할 것

2. 설치 후 정상 설치 여부 확인하기	
	claude mcp list 으로 설치 목록에 포함되는지 내용 확인한 후,
	task를 통해 디버그 모드로 서브 에이전트 구동한 후 (claude --debug), 최대 2분 동안 관찰한 후, 그 동안의 디버그 메시지(에러 시 관련 내용이 출력됨)를 확인하고 /mcp 를 통해(Bash(echo "/mcp" | claude --debug)) 실제 작동여부를 반드시 확인할 것

3. 문제 있을때 다음을 통해 직접 설치할 것

	*User 스코프로 claude mcp add 명령어를 통한 설정 파일 세팅 예시*
	예시1:
	claude mcp add --scope user youtube-mcp \
	  -e YOUTUBE_API_KEY=$YOUR_YT_API_KEY \

	  -e YOUTUBE_TRANSCRIPT_LANG=ko \
	  -- npx -y youtube-data-mcp-server


4. 정상 설치 여부 확인 하기
	claude mcp list 으로 설치 목록에 포함되는지 내용 확인한 후,
	task를 통해 디버그 모드로 서브 에이전트 구동한 후 (claude --debug), 최대 2분 동안 관찰한 후, 그 동안의 디버그 메시지(에러 시 관련 내용이 출력됨)를 확인하고, /mcp 를 통해(Bash(echo "/mcp" | claude --debug)) 실제 작동여부를 반드시 확인할 것


5. 문제 있을때 공식 사이트 다시 확인후 권장되는 방법으로 설치 및 설정할 것
	(npm/npx 패키지를 찾을 수 없는 경우) pm 전역 설치 경로 확인 : npm config get prefix
	권장되는 방법을 확인한 후, npm, pip, uvx, pip 등으로 직접 설치할 것

	#### uvx 명령어를 찾을 수 없는 경우
	# uv 설치 (Python 패키지 관리자)
	curl -LsSf https://astral.sh/uv/install.sh | sh

	#### npm/npx 패키지를 찾을 수 없는 경우
	# npm 전역 설치 경로 확인
	npm config get prefix


	#### uvx 명령어를 찾을 수 없는 경우
	# uv 설치 (Python 패키지 관리자)
	curl -LsSf https://astral.sh/uv/install.sh | sh


	## 설치 후 터미널 상에서 작동 여부 점검할 것 ##
	
	## 위 방법으로, 터미널에서 작동 성공한 경우, 성공 시의 인자 및 환경 변수 이름을 활용해서, 클로드 코드의 올바른 위치의 json 설정 파일에 MCP를 직접 설정할 것 ##


	설정 예시
		(설정 파일 위치)
		**리눅스, macOS 또는 윈도우 WSL 기반의 클로드 코드인 경우**
		- **User 설정**: `~/.claude/` 디렉토리
		- **Project 설정**: 프로젝트 루트/.claude

		**윈도우 네이티브 클로드 코드인 경우**
		- **User 설정**: `C:\Users\{사용자명}\.claude` 디렉토리
		- *User 설정파일*  C:\Users\{사용자명}\.claude.json
		- **Project 설정**: 프로젝트 루트\.claude

		1. npx 사용

		{
		  "youtube-mcp": {
		    "type": "stdio",
		    "command": "npx",
		    "args": ["-y", "youtube-data-mcp-server"],
		    "env": {
		      "YOUTUBE_API_KEY": "YOUR_API_KEY_HERE",
		      "YOUTUBE_TRANSCRIPT_LANG": "ko"
		    }
		  }
		}


		2. cmd.exe 래퍼 + 자동 동의)
		{
		  "mcpServers": {
		    "mcp-installer": {
		      "command": "cmd.exe",
		      "args": ["/c", "npx", "-y", "@anaisbetts/mcp-installer"],
		      "type": "stdio"
		    }
		  }
		}

		3. 파워셀예시
		{
		  "command": "powershell.exe",
		  "args": [
		    "-NoLogo", "-NoProfile",
		    "-Command", "npx -y @anaisbetts/mcp-installer"
		  ]
		}

		4. npx 대신 node 지정
		{
		  "command": "node",
		  "args": [
		    "%APPDATA%\\npm\\node_modules\\@anaisbetts\\mcp-installer\\dist\\index.js"
		  ]
		}

		5. args 배열 설계 시 체크리스트
		토큰 단위 분리: "args": ["/c","npx","-y","pkg"] 와
			"args": ["/c","npx -y pkg"] 는 동일해보여도 cmd.exe 내부에서 따옴표 처리 방식이 달라질 수 있음. 분리가 안전.
		경로 포함 시: JSON에서는 \\ 두 번. 예) "C:\\tools\\mcp\\server.js".
		환경변수 전달:
			"env": { "UV_DEPS_CACHE": "%TEMP%\\uvcache" }
		타임아웃 조정: 느린 PC라면 MCP_TIMEOUT 환경변수로 부팅 최대 시간을 늘릴 수 있음 (예: 10000 = 10 초) 

**중요사항**
	윈도우 네이티브 환경이고 MCP 설정에 어려움이 있는데 npx 환경이라면, cmd나 node 등으로 다음과 같이 대체해 볼것:
	{
	"mcpServers": {
	      "context7": {
		 "command": "cmd",
		 "args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]
	      }
	   }
	}

	claude mcp add-json context7 -s user '{"type":"stdio","command":"cmd","args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]}'

(설치 및 설정한 후는 항상 아래 내용으로 검증할 것)
	claude mcp list 으로 설치 목록에 포함되는지 내용 확인한 후,
	task를 통해 디버그 모드로 서브 에이전트 구동한 후 (claude --debug), 최대 2분 동안 관찰한 후, 그 동안의 디버그 메시지(에러 시 관련 내용이 출력됨)를 확인하고 /mcp 를 통해 실제 작동여부를 반드시 확인할 것

	
** MCP 서버 제거가 필요할 때 예시: **
claude mcp remove youtube-mcp


## 윈도우 네이티브 클로드 코드에서 클로드 데스크탑의 MCP 가져오는 방법 ###
"C:\Users\jjhld\AppData\Roaming\Claude\claude_desktop_config.json" 이 파일이 존재한다면 클로드 데스크탑이 설치된 상태야.
이 파일의 mcpServers 내용을 클로드 코드 설정 파일(C:\Users\{사용자명}\.claude.json)의 user 스코프 위치(projects 항목에 속하지 않은 mcpServers가 user 스코프에 해당)로 그대로 가지고 오면 돼.
가지고 온 후, task를 통해 디버그 모드로 서브 에이전트 구동하여 (claude --debug) 클로드 코드에 문제가 없는지 확인할 것

---

## 📋 **2024-07-23 최신 개발 현황**

### ✅ **MVP 챗봇 시스템 완성**
- **기본 베이스**: `chatbot_ver2_clean.html` (외부 CSS/JS 분리 완료)
- **Gemini API 연동**: 완전한 대화형 AI 시스템 구축
- **프롬프트 시스템**: `first_step.txt` + `second_step.txt` 2단계 지침 완료
- **정보 수집 로직**: 3단계 그룹별 효율적 데이터 수집
- **JSON 구조화**: `userMessage` + `systemData` 완벽한 파싱
- **개발 서버**: Node.js (포트 8002) 안정적 운영

### 🎨 **최신 UI/UX 완성 (최종 단계)**
- **1단계 로딩**: Figma Community 기반 Preview 생성 애니메이션
  - Preview 건설 모킹, 플로팅 요소, 스파클 효과
  - 인디고/퍼플 색상으로 2단계와 차별화
- **2단계 로딩**: 여행 콜라주 애니메이션 (사용자 만족도 100%)
- **단계별 최적화**: 각 phase별 Gemini API generationConfig 최적화

### 🎯 **성공적으로 검증된 대화 시나리오**
```
사용자: "도쿄 여행 가고 싶어"
AI: "언제, 며칠, 몇 분이서 가실 예정이야?" (기본틀 그룹)

사용자: "다음 달 15일부터 3박 4일로 친구 2명과 함께"  
AI: "예산은 어느 정도로 생각하고, 항공편은 정해졌어?" (실행조건 그룹)

사용자: "예산은 1인당 100만원 정도, 항공편으로 갈 예정"
AI: "특별히 해보고 싶은 활동이나 가보고 싶은 곳 있어?" (개인화 그룹)

사용자: "문화체험과 맛집 탐방 위주로 하고 싶어"
AI: "도쿄 문화 & 미식 탐방 계획 세워볼게. 맞니?" (확인)

사용자: "네, 맞아요"
AI: ✅ JSON 출력 성공!
```

### 🔧 **핵심 기술 구현 사항**
- **Gemini 2.5 Flash API**: 안정적 연동 및 한국어 응답 최적화
- **프롬프트 로딩**: 동적 `first_step.txt` + `second_step.txt` 시스템
- **상태 관리**: `conversationState` 기반 대화 추적
- **JSON 파싱**: 마크다운 블록 및 다양한 형식 지원
- **에러 처리**: 포괄적 오류 복구 시스템
- **이미지 최적화**: Picsum Photos API로 안정적 이미지 표시
- **GenerationConfig 최적화**: Phase별 AI 응답 품질 차별화
  - Phase 1: temperature=0.7, topK=30, topP=0.8, maxOutputTokens=4000
  - Phase 2: temperature=0.8, topK=40, topP=0.85, maxOutputTokens=3500
  - Phase 3: temperature=0.6, topK=25, topP=0.75, maxOutputTokens=6000

### 📊 **출력되는 JSON 데이터 구조**
```json
{
  "userMessage": "확인 메시지",
  "systemData": {
    "destination": "여행지",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD", 
    "travelers": {"adults": "number", "children_age": "array"},
    "tripType": "solo|family|couple|friends|business",
    "budget": {"range": "budget|mid|luxury", "amount": "number"},
    "transport": {"type": "flight|train|car", "details": "string"},
    "preferences": ["선호사항 배열"],
    "notes": "여행 컨셉 요약"
  }
}
```

---

## 🛠️ **개발 환경 및 실행 방법**

### **로컬 개발 서버 실행**
```bash
cd "G:\Programming\travel-master\myTravelNote"
node server.js
# 서버 실행: http://localhost:8002
# 챗봇 접속: http://localhost:8002/chatbot_ver2_clean.html
```

### **API 키 설정**
- `config.js`에 Gemini API 키 설정 완료
- 현재 개발용 키 활성화 상태

### **디버깅 도구**
- **브라우저 콘솔**: API 호출 로그, JSON 파싱 상태 확인
- **네트워크 탭**: Gemini API 요청/응답 모니터링
- **conversationState**: 실시간 대화 상태 추적

---

## 📝 **개발 규칙 및 지침**

### **중요 규칙**
**코드 수정 후에는 반드시 git commit, push 해주세요.**

### **새로운 개발 지침 (2024-07-23 추가)**

#### **1. Context7 MCP 활용 지침** 🔍
- **모든 코드 작업**에서 **Context7 MCP**를 적극 활용할 것
- 라이브러리 문서 조회, API 레퍼런스 확인 시 Context7 우선 사용
- 새로운 기술 스택 도입 시 Context7로 최신 정보 확인
- 프레임워크별 베스트 프랙티스는 Context7를 통해 학습

**사용 예시:**
```
- React 컴포넌트 패턴 확인
- API 연동 방법 조회  
- 성능 최적화 기법 학습
- 에러 처리 방식 연구
```

#### **2. Figma Community 디자인 레퍼런스 지침** 🎨
- **모든 UI/UX 디자인 작업**에서 **Figma Community** 적극 참고
- 여행 앱, 챗봇 인터페이스 디자인 트렌드 조사
- 사용자 경험(UX) 패턴 및 플로우 연구
- 컬러 팔레트, 타이포그래피, 아이콘 시스템 참고

**참고 키워드:**
```
- Travel App UI Kit
- Chatbot Interface Design
- Mobile Travel Planner
- AI Chat Interface
- PWA Design System
```

#### **3. 기술 의사결정 프로세스**
1. 새로운 기능 구현 시 Context7로 기술 조사
2. 디자인 개선 시 Figma Community에서 레퍼런스 수집
3. 구현 후 기존 코드 스타일과 일관성 유지
4. 반드시 테스트 후 Git 커밋

---

## 🚀 **다음 개발 단계 로드맵**

### **Phase 1: PWA 생성 시스템 구축** (다음 우선순위)
- 저장된 JSON 데이터 → PWA 템플릿 렌더링
- 고유 session ID 기반 개인 전용 앱 생성
- Service Worker 및 오프라인 기능 구현

### **Phase 2: 사용자 인증 및 데이터 관리**
- Google OAuth 원클릭 로그인
- 임시세션 → 정식계정 데이터 이전
- 사용자별 여행 기록 관리

### **Phase 3: 고도화 기능**
- 2단계, 3단계 프롬프트 시스템 확장
- 실시간 여행 정보 API 연동
- 소셜 공유 및 협업 기능

---

## 📚 **참고 자료 및 문서**

### **API 문서**
- [Gemini API 공식 문서](https://ai.google.dev/docs)
- [Google Maps API](https://developers.google.com/maps)

### **디자인 레퍼런스**
- [Figma Community - Travel Apps](https://www.figma.com/community/search?model_type=files&q=travel%20app)
- [Figma Community - Chat Interface](https://www.figma.com/community/search?model_type=files&q=chat%20interface)

### **개발 도구**
- Context7 MCP를 통한 라이브러리 문서 조회
- Node.js 로컬 개발 서버 (포트 9000)
- 브라우저 개발자 도구 (Console, Network, Application)