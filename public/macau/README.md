# 🇲🇴 마카오 여행앱 (모듈화 버전)

마카오 가족여행을 위한 PWA 앱입니다. JavaScript 모듈화를 통해 코드를 체계적으로 정리했습니다.

## 🏗️ 프로젝트 구조

```
/macau/
├── macau.html              # 메인 HTML 파일
├── macau.css               # 스타일시트
├── manifest.json           # PWA 매니페스트
├── sw.js                   # Service Worker
├── pages/                  # 페이지 콘텐츠
├── images/                 # 이미지 리소스
├── js/                     # 모듈화된 JavaScript
│   ├── core/               # 핵심 시스템
│   │   ├── app.js          # 메인 애플리케이션
│   │   ├── navigation.js   # 페이지 네비게이션
│   │   └── storage.js      # 데이터 관리
│   ├── features/           # 기능별 모듈
│   │   ├── pwa-install.js  # PWA 설치
│   │   ├── exchange.js     # 환율 계산기
│   │   ├── fab.js          # FAB 시스템
│   │   ├── expense.js      # 지출 입력
│   │   ├── expense-status.js # 지출 현황
│   │   ├── budget.js       # 예산 관리
│   │   ├── image-popup.js  # 이미지 팝업
│   │   └── todo.js         # 준비물 관리
│   └── utils/              # 유틸리티
│       ├── dom-helpers.js  # DOM 조작
│       └── formatters.js   # 포맷팅
└── config/                 # 설정 파일
    ├── config.js           # 기본 설정
    ├── places-api.js       # Places API
    └── enhance-places.js   # Places 개선
```

## 🚀 실행 방법

### 로컬 서버 실행
ES6 모듈을 사용하므로 반드시 HTTP 서버를 통해 실행해야 합니다.

```bash
# Python 서버
python -m http.server 8000

# Node.js 서버
npx serve .

# 또는 프로젝트 루트의 server.js 사용
node server.js
```

### 접속
```
http://localhost:8000/macau/macau.html
```

## 🎯 주요 기능

### ✅ 구현 완료
- **모듈화 구조**: ES6 모듈로 코드 분리
- **네비게이션**: 페이지 스와이프 및 탭 전환
- **PWA 설치**: 설치 가이드 팝업
- **환율 계산기**: MOP ↔ KRW 환율 계산
- **FAB 시스템**: 하단 플로팅 버튼

### 🚧 진행 중 (스텁 구현)
- **지출 입력**: 카테고리별 지출 관리
- **지출 현황**: 실시간 지출 통계
- **예산 관리**: 기존 시스템 호환성
- **이미지 슬라이더**: 장소별 사진 갤러리
- **준비물 관리**: 체크리스트 기능

## 🔧 개발 상태

### 모듈 초기화 상태
브라우저 개발자 도구에서 확인 가능:
```javascript
// 앱 상태 확인
console.log(window.MacauApp);

// 모듈 상태 확인
console.log(window.MacauAppControls.getStatus());

// 디버그 모드 활성화
window.MacauAppControls.setDebug(true);
```

### 디버그 모드
URL에 `?debug=true` 추가하면 상세 로그 확인 가능:
```
http://localhost:8000/macau/macau.html?debug=true
```

## 📝 다음 단계

1. **기존 기능 이전**: 나머지 features 모듈 완성
2. **레거시 코드 제거**: 임시 전역 함수들 정리
3. **테스트 추가**: 모듈별 단위 테스트
4. **성능 최적화**: 코드 스플리팅 및 지연 로딩
5. **타입스크립트**: 점진적 타입 추가

## 🚨 알려진 이슈

- 일부 기능이 스텁으로 구현됨 (콘솔 로그만 출력)
- 기존 슬라이더 함수들이 레거시 모드로 동작
- Service Worker 캐시 정책 미완성

## 🤝 기여 방법

1. 각 모듈은 독립적으로 개발 가능
2. `features/` 폴더의 스텁 파일들을 완성
3. 모든 모듈은 init/destroy 함수 쌍 제공
4. utils 함수들을 적극 활용