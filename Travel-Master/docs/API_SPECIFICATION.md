# API Specification

TripCrafter API 명세 문서

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.tripcrafter.com/v1
```

## 인증

모든 API 요청은 Bearer Token을 통한 인증이 필요합니다.

```
Authorization: Bearer {token}
```

토큰은 로그인 API를 통해 발급받을 수 있습니다.

## API Endpoints

### 1. 인증 (Authentication)

#### POST /auth/login
사용자 로그인

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-02-01T00:00:00Z"
  }
}
```

#### POST /auth/register
새 사용자 등록

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "name": "Jane Doe"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 2,
      "email": "newuser@example.com",
      "name": "Jane Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/logout
사용자 로그아웃

**Response:**
```json
{
  "status": "success",
  "message": "Successfully logged out"
}
```

### 2. 여행 계획 (Travel Plans)

#### POST /travel_plans/generate
AI를 통한 새 여행 계획 생성

**Request:**
```json
{
  "user_input": "오사카 3박4일 가족여행 계획해줘",
  "preferences": {
    "budget": "medium",
    "travel_style": "relaxed",
    "interests": ["culture", "food", "shopping"]
  }
}
```

**Response:**
```json
{
  "status": "processing",
  "data": {
    "plan_id": "abc123",
    "estimated_time": 15,
    "websocket_channel": "TravelPlanChannel:abc123"
  }
}
```

**WebSocket Updates:**
```json
{
  "type": "progress",
  "status": "generating_plan",
  "progress": 25,
  "message": "AI가 여행 계획을 생성하고 있습니다..."
}
```

#### GET /travel_plans
사용자의 여행 계획 목록 조회

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 1)
- `per_page` (optional): 페이지당 항목 수 (기본값: 20)
- `status` (optional): draft, published, archived

**Response:**
```json
{
  "status": "success",
  "data": {
    "travel_plans": [
      {
        "id": "abc123",
        "title": "오사카 3박4일 가족여행",
        "destination": "오사카",
        "start_date": "2025-03-15",
        "end_date": "2025-03-18",
        "status": "published",
        "pwa_url": "/plan/abc123",
        "created_at": "2025-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 95
    }
  }
}
```

#### GET /travel_plans/:id
특정 여행 계획 상세 조회

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "abc123",
    "title": "오사카 3박4일 가족여행",
    "destination": "오사카",
    "start_date": "2025-03-15",
    "end_date": "2025-03-18",
    "travelers_count": 3,
    "budget_range": "medium",
    "status": "published",
    "pwa_url": "/plan/abc123",
    "days": [
      {
        "day": 1,
        "date": "2025-03-15",
        "theme": "도착 및 시내 탐방",
        "activities": [
          {
            "time_slot": "09:00-11:00",
            "title": "오사카성 방문",
            "description": "일본의 대표적인 성곽...",
            "location": {
              "name": "오사카성",
              "address": "1-1 Osakajo, Chuo Ward, Osaka",
              "coordinates": {
                "lat": 34.6873,
                "lng": 135.5262
              },
              "google_maps_url": "https://maps.google.com/?q=34.6873,135.5262"
            },
            "estimated_cost": 600,
            "activity_type": "sightseeing"
          }
        ],
        "restaurants": [
          {
            "meal_type": "lunch",
            "name": "이치란 라멘",
            "cuisine_type": "japanese",
            "price_range": "$$",
            "google_maps_url": "https://maps.google.com/?q=34.6690,135.5023",
            "recommended_dishes": ["돈코츠 라멘", "차슈 추가"]
          }
        ]
      }
    ],
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:15:00Z"
  }
}
```

#### PUT /travel_plans/:id
여행 계획 수정

**Request:**
```json
{
  "title": "오사카 & 교토 3박4일 가족여행",
  "status": "draft"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "abc123",
    "title": "오사카 & 교토 3박4일 가족여행",
    "status": "draft",
    "updated_at": "2025-01-20T11:00:00Z"
  }
}
```

#### DELETE /travel_plans/:id
여행 계획 삭제

**Response:**
```json
{
  "status": "success",
  "message": "Travel plan deleted successfully"
}
```

### 3. PWA 관련 (PWA)

#### GET /pwa/:id/manifest.json
PWA 매니페스트 파일 동적 생성

**Response:**
```json
{
  "name": "오사카 3박4일 가족여행",
  "short_name": "오사카 여행",
  "description": "2025년 3월 15일-18일 오사카 가족여행 일정",
  "start_url": "/plan/abc123",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/pwa/abc123/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa/abc123/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### GET /pwa/:id/status
PWA 생성 상태 확인

**Response:**
```json
{
  "status": "success",
  "data": {
    "generation_status": "completed",
    "progress": 100,
    "pwa_url": "/plan/abc123",
    "generated_at": "2025-01-20T10:15:00Z"
  }
}
```

### 4. 챗봇 (Chat)

#### POST /chat/message
챗봇에 메시지 전송

**Request:**
```json
{
  "message": "3일차 일정에 USJ 추가해줘",
  "context": {
    "travel_plan_id": "abc123",
    "conversation_id": "conv_xyz789"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "reply": "3일차 일정에 유니버설 스튜디오 재팬(USJ)을 추가했습니다. 입장권은 사전 예약을 권장드립니다.",
    "actions": [
      {
        "type": "plan_updated",
        "travel_plan_id": "abc123",
        "changes": ["day_3_activities"]
      }
    ],
    "conversation_id": "conv_xyz789"
  }
}
```

### 5. 외부 API 프록시 (External APIs)

#### GET /places/search
Google Places 검색 (프록시)

**Query Parameters:**
- `query`: 검색어
- `location`: 위도,경도
- `radius`: 반경 (미터)

**Response:**
```json
{
  "status": "success",
  "data": {
    "places": [
      {
        "place_id": "ChIJ...",
        "name": "오사카성",
        "address": "1-1 Osakajo, Chuo Ward, Osaka",
        "rating": 4.5,
        "photo_url": "https://maps.googleapis.com/maps/api/place/photo?...",
        "coordinates": {
          "lat": 34.6873,
          "lng": 135.5262
        }
      }
    ]
  }
}
```

## 에러 응답

모든 에러는 일관된 형식으로 반환됩니다.

```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid authentication token",
    "details": {
      "field": "token",
      "reason": "expired"
    }
  }
}
```

### 에러 코드

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | 인증 실패 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스를 찾을 수 없음 |
| VALIDATION_ERROR | 422 | 유효성 검사 실패 |
| RATE_LIMIT_EXCEEDED | 429 | API 요청 제한 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

## Rate Limiting

API 요청은 다음과 같이 제한됩니다:

- **인증된 사용자**: 분당 100회
- **미인증 사용자**: 분당 20회
- **AI 생성 요청**: 시간당 10회

Rate limit 정보는 응답 헤더에 포함됩니다:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400
```

## WebSocket 연결

실시간 업데이트를 위한 WebSocket 연결:

```javascript
// Connection URL
wss://api.tripcrafter.com/cable

// Authentication
{
  "command": "subscribe",
  "identifier": "{\"channel\":\"TravelPlanChannel\",\"plan_id\":\"abc123\"}",
  "token": "Bearer {token}"
}
```

### 이벤트 타입

- `progress`: 생성 진행 상황
- `completed`: 생성 완료
- `error`: 오류 발생
- `update`: 계획 업데이트

## SDK 예제

### JavaScript
```javascript
const TripCrafterAPI = require('@tripcrafter/sdk');

const client = new TripCrafterAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.tripcrafter.com/v1'
});

// 여행 계획 생성
const plan = await client.travelPlans.generate({
  userInput: '오사카 3박4일 가족여행'
});

// 진행 상황 모니터링
client.on('progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
});
```

### Ruby
```ruby
require 'tripcrafter'

client = TripCrafter::Client.new(
  api_key: 'your-api-key'
)

# 여행 계획 생성
plan = client.travel_plans.generate(
  user_input: '오사카 3박4일 가족여행'
)

# 계획 조회
plan = client.travel_plans.find('abc123')
```

## 변경 이력

### v1.0.0 (2025-01-20)
- 초기 API 릴리즈
- 기본 CRUD 기능
- AI 여행 계획 생성
- PWA 지원