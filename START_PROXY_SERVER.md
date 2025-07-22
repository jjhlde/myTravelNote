# Google Places API 프록시 서버 실행 가이드

## 개요
ChattyPlan에서 실제 Google Places API를 사용하기 위해 CORS 문제를 해결하는 프록시 서버입니다.

## 서버 실행

### 1. 터미널에서 서버 시작
```bash
cd G:\Programming\travel-master\myTravelNote
npm run places-proxy
```

또는 직접 실행:
```bash
node places-proxy-server.js
```

### 2. 서버 실행 확인
서버가 성공적으로 실행되면 다음과 같은 메시지가 표시됩니다:
```
🚀 Places API 프록시 서버 실행: http://localhost:3002
📡 텍스트 검색: GET /api/places/textsearch?query=검색어&key=API키
📡 상세정보: GET /api/places/details?place_id=장소ID&key=API키
```

## API 엔드포인트

### 1. Places Text Search
- **URL**: `http://localhost:3002/api/places/textsearch`
- **Method**: GET
- **Parameters**:
  - `query`: 검색할 장소명 (예: "Galaxy Macau")
  - `key`: Google Places API 키

### 2. Place Details
- **URL**: `http://localhost:3002/api/places/details`
- **Method**: GET
- **Parameters**:
  - `place_id`: Google Place ID
  - `key`: Google Places API 키

## 사용 예시

### ChattyPlan 실행 순서
1. **프록시 서버 실행** (필수):
   ```bash
   npm run places-proxy
   ```

2. **웹 서버 실행** (별도 터미널):
   ```bash
   python -m http.server 8000
   ```
   또는
   ```bash
   npx serve . -p 8000
   ```

3. **브라우저에서 접속**:
   ```
   http://localhost:8000/chatbot.html
   ```

## 중요 사항
- 프록시 서버가 실행되어야 실제 Places API가 작동합니다
- API 키가 `config.js`에 올바르게 설정되어 있어야 합니다
- 서버 실행 중 터미널 창을 닫지 마세요

## 문제 해결

### 포트 충돌 시
`Error: listen EADDRINUSE` 오류 발생 시 `places-proxy-server.js`에서 PORT 번호를 변경하고 `chatbot.js`의 proxyUrl도 함께 변경하세요.

### API 키 문제 시
`config.js`에서 `GOOGLE_PLACES_API_KEY`가 올바른지 확인하세요.