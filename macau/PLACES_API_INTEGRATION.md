# 🗺️ Google Places API 통합 가이드

마카오 여행앱의 Google Places API 통합 시스템 가이드입니다.

## 📋 개요

### 해결된 문제
- ❌ **기존**: HTML에 하드코딩된 오래된 이미지 URL들이 깨져서 표시됨
- ✅ **개선**: Places API를 통한 실시간 최신 이미지 자동 로딩

### 주요 기능
- 🔄 **자동 이미지 갱신**: Places API로 최신 장소 이미지 자동 로드
- 📱 **폴백 시스템**: API 실패 시 우아한 폴백 UI 제공
- ⚡ **성능 최적화**: 캐싱 시스템으로 API 호출 최소화
- 🎨 **로딩 UI**: 사용자 친화적인 로딩 애니메이션

---

## 🏗️ 시스템 아키텍처

### 파일 구조
```
macau/
├── config/
│   └── places-api.js           # Places API 서비스 + 동적 이미지 로더
├── pages/
│   └── day1.html              # 개선된 페이지 (하드코딩 제거)
├── macau.css                  # 로딩/폴백 UI 스타일
└── test-places-integration.html # 테스트 페이지
```

### 클래스 구조
```javascript
PlacesService {
  - findPlaceByName()     // 장소명으로 Places 정보 검색
  - getPlaceDetails()     // Place ID로 상세 정보 조회
  - formatPlaceData()     // API 응답을 앱 형식으로 변환
  - getPlacePhotos()      // 장소 사진 URL 생성
}

DynamicImageLoader {
  - loadPlaceImages()     // 장소별 이미지 자동 로딩
  - updateImageSlider()   // 이미지 슬라이더 업데이트
  - showFallbackImages()  // 폴백 이미지 표시
  - refreshAllPlaceImages() // 페이지 전체 이미지 갱신
}
```

---

## ⚙️ 설정 방법

### 1. API 키 설정
```javascript
// config.js
const CONFIG = {
    GOOGLE_PLACES_API_KEY: 'your-google-places-api-key-here'
};
```

### 2. HTML 구조
```html
<!-- 기존 하드코딩된 이미지 대신 -->
<div class="place-images" id="slider-1-airport">
    <div class="place-images-slider">
        <div class="image-loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">최신 이미지 로딩 중...</div>
        </div>
    </div>
    <div class="place-images-nav">
        <!-- 동적으로 생성됨 -->
    </div>
    <div class="place-images-counter">로딩 중...</div>
</div>
```

### 3. 스크립트 로드 순서
```html
<script src="../config.js"></script>
<script src="./config/places-api.js"></script>
<!-- 페이지 로드 후 자동으로 이미지 갱신 시작 -->
```

---

## 🚀 사용 방법

### 자동 이미지 갱신
```javascript
// 페이지 로드 시 자동 실행됨 (places-api.js에서)
imageLoader.refreshAllPlaceImages();
```

### 수동 이미지 로딩
```javascript
// 특정 장소 이미지만 로딩
await imageLoader.loadPlaceImages('마카오국제공항', 'slider-1-airport');

// 폴백 이미지와 함께 로딩
const fallbackImages = [
    { url: '/images/airport-fallback-1.jpg' },
    { url: '/images/airport-fallback-2.jpg' }
];
await imageLoader.loadPlaceImages('마카오국제공항', 'slider-1-airport', fallbackImages);
```

### 장소 정보 검색
```javascript
// Places API로 장소 정보 검색
const placeData = await placesService.findPlaceByName('안다즈 마카오');

console.log(placeData);
// {
//   name: "안다즈 마카오",
//   rating: 4.5,
//   photos: [{ url: "https://...", reference: "..." }],
//   reviews: [...],
//   address: "...",
//   ...
// }
```

---

## 🧪 테스트 방법

### 테스트 페이지 접속
```
http://localhost:8000/macau/test-places-integration.html
```

### 주요 테스트 시나리오
1. **API 연결 테스트**: Places Service 초기화 확인
2. **장소 검색 테스트**: 마카오 주요 장소 검색 성공률
3. **이미지 로딩 테스트**: 실제 이미지 로딩 및 표시
4. **실시간 갱신 테스트**: 동적 이미지 슬라이더 동작
5. **전체 시스템 테스트**: 종합 기능 검증

### 콘솔 로그 확인
```javascript
// 개발자 도구 콘솔에서 확인 가능
🗺️ Places Service 초기화 완료
🖼️ Dynamic Image Loader 초기화 완료
✅ 마카오국제공항 이미지 로딩 성공: 3개
🖼️ 마카오국제공항 이미지 슬라이더 업데이트 완료
```

---

## 🔧 새로운 장소 추가

### 1. 장소 매핑 테이블 업데이트
```javascript
// places-api.js의 placeMapping 객체에 추가
const placeMapping = {
    'airport': '마카오국제공항',
    'andaz': '안다즈 마카오',
    'galaxy': '갤럭시 마카오',
    'new-place': '새로운 장소명'  // 추가
};
```

### 2. HTML에 이미지 컨테이너 추가
```html
<div class="place-images" id="slider-1-new-place">
    <div class="place-images-slider">
        <div class="image-loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">최신 이미지 로딩 중...</div>
        </div>
    </div>
    <!-- 네비게이션 등 나머지 구조 동일 -->
</div>
```

### 3. 검색어 최적화 (선택사항)
```javascript
// getMacauPlacesData()에 추가하여 검색 정확도 향상
'새로운 장소명': {
    name: '새로운 장소명',
    coordinates: { lat: 22.xxxx, lng: 113.xxxx },
    searchTerms: ['영어명', '다른 검색어']
}
```

---

## ⚠️ 주의사항 및 제한사항

### API 쿼터 관리
- **Places API 무료 한도**: 월 100회 Text Search + Details
- **Photo API 무료 한도**: 월 100회 
- **권장**: 프로덕션에서는 유료 플랜 고려

### 성능 최적화
- **캐싱 시스템**: 동일 장소 중복 요청 방지
- **요청 제한**: 500ms 딜레이로 API 제한 준수
- **에러 처리**: API 실패 시 폴백 시스템 동작

### 브라우저 호환성
- **Modern Browser**: ES6+ 기능 사용 (async/await, Map 등)
- **Fallback**: 구형 브라우저에서는 기본 UI만 표시

---

## 🐛 트러블슈팅

### 이미지가 로딩되지 않는 경우
1. **API 키 확인**: config.js의 GOOGLE_PLACES_API_KEY 설정
2. **네트워크 확인**: 브라우저 개발자 도구 Network 탭
3. **CORS 이슈**: 서버 프록시 엔드포인트(/api/places/*) 동작 확인

### Places API 검색 실패
1. **장소명 확인**: 영어/한국어 검색어 조합 시도
2. **좌표 확인**: 마카오 지역 좌표 범위 내인지 확인
3. **API 쿼터**: Google Cloud Console에서 사용량 확인

### 콘솔 에러 메시지
```javascript
❌ Places API 오류: [장소명] → API 키 또는 네트워크 문제
⚠️ Places API 결과 없음: [장소명] → 검색어 최적화 필요
⚠️ 컨테이너를 찾을 수 없음: [ID] → HTML 구조 확인
```

---

## 🔄 향후 개선 계획

### Phase 2: 완전 자동화
- [ ] day2.html, day3.html, day4.html 확장 적용
- [ ] 수동 데이터 → API 기반 자동 생성
- [ ] 실시간 평점, 리뷰, 운영시간 표시

### Phase 3: 고도화
- [ ] 사용자 맞춤 장소 추천
- [ ] 다국어 지원 (영어, 중국어)
- [ ] 오프라인 캐싱 강화

---

## 📞 지원

문제가 발생하거나 개선 사항이 있다면:
1. `test-places-integration.html`에서 전체 시스템 테스트 실행
2. 브라우저 콘솔 로그 확인
3. API 키 및 네트워크 상태 점검

**테스트 성공 시 예상 결과**:
- ✅ API 연결: 모든 서비스 정상 초기화
- ✅ 장소 검색: 마카오 주요 장소 검색 성공
- ✅ 이미지 로딩: 실제 Places 이미지 표시
- ✅ 실시간 갱신: 동적 슬라이더 정상 동작