# AI 여행 플래너 PRD (Product Requirements Document)
*Rails + DigitalOcean 기반*

## 📋 제품 개요

### 프로젝트명
**TripCrafter** - AI 기반 개인 맞춤형 여행 플래너

### 미션
사용자가 간단한 자연어 입력만으로 전문가 수준의 여행 계획을 생성하고, 개인 전용 PWA 앱을 즉시 받을 수 있는 서비스

### 핵심 가치
- **간편함**: 복잡한 여행 계획을 30초 안에 생성
- **전문성**: 20년 경력 여행 플래너 수준의 상세한 일정
- **개인화**: 사용자별 고유 PWA 앱 자동 생성
- **접근성**: 오프라인에서도 사용 가능한 여행 앱

## 👥 사용자 시나리오

### 주요 타겟
- **메인 타겟**: 25-45세 여행 계획에 어려움을 느끼는 개인/가족
- **서브 타겟**: 여행 초보자, 시간이 부족한 직장인
- **확장 타겟**: 소규모 여행사, 프리랜서 가이드

### 사용자 플로우
```
1. 방문 → "오사카 3박4일 가족여행 계획해줘"
2. AI 챗봇 → 추가 질문 (예산, 선호도 등)
3. 생성 → 8-15초 내 기본 여행 계획 완성
4. 제공 → 고유 URL (tripcrafter.com/plan/abc123)
5. 사용 → PWA 설치 후 오프라인 사용
```

## 🚀 기능 명세

### 핵심 기능 (MVP)

#### 챗봇 인터페이스
- 자연어 입력 처리
- 맞춤형 질문 생성 (2-3개로 제한)
- 실시간 응답 처리
- 진행 상황 표시

#### AI 여행 플래너
- Gemini 2.5 Flash API 활용
- 구조화된 JSON 응답 생성
- 동선 최적화 및 시간 배분
- 현지 문화 및 팁 포함

#### PWA 생성 엔진
- 개인별 고유 URL 생성
- 템플릿 기반 HTML/CSS/JS 생성
- 오프라인 기능 지원
- 점진적 로딩 구현

#### 기본 데이터 관리
- 사용자 계정 (이메일/비밀번호)
- 생성된 여행 계획 저장
- 기본 통계 및 분석
- 사용자 피드백 수집

### 향후 기능 (Post-MVP)
- 소셜 로그인 (Google, Kakao)
- 여행 계획 공유 기능
- 실시간 정보 업데이트
- 예약 시스템 연동
- 다국어 지원 (영어, 중국어, 일본어)
- 여행 비용 추적
- 사진 업로드 및 여행기 작성

## 🏗️ 기술 아키텍처

### 기술 스택

#### Backend
```ruby
# Ruby on Rails 7.1
- Ruby 3.3
- Rails 7.1
- PostgreSQL 15
- Redis (캐싱 및 백그라운드 작업)
- Sidekiq (백그라운드 작업)
- ActionCable (실시간 업데이트)
```

#### Frontend
```ruby
# Rails 내장 + Modern Rails
- Hotwire (Turbo + Stimulus)
- Tailwind CSS
- ViewComponent
- PWA 지원 (Service Worker)
```

#### AI & External APIs
```yaml
- Gemini 2.5 Flash API
- Google Maps API (Places, Geocoding)
- Google Places Photos API
- OpenWeatherMap API (선택사항)
```

#### Infrastructure
```yaml
Server: DigitalOcean Droplet
- Ubuntu 22.04 LTS
- 2GB RAM (초기) → 4GB RAM (성장)
- Nginx + Passenger
- Let's Encrypt SSL

Database: PostgreSQL
- 자체 설치 및 관리
- 일일 백업 설정

Storage: DigitalOcean Spaces
- 이미지 및 정적 파일
- CDN 활용
```

### 시스템 아키텍처
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Rails App  │────▶│  Gemini API │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Sidekiq   │
                    └─────────────┘
```

## 📊 데이터 모델

### 주요 엔티티

```ruby
# User
- id: bigint (primary key)
- email: string (unique, not null)
- encrypted_password: string
- name: string
- created_at: datetime
- updated_at: datetime

# TravelPlan
- id: bigint (primary key)
- user_id: bigint (foreign key)
- title: string
- destination: string
- start_date: date
- end_date: date
- travelers_count: integer
- budget_range: string
- ai_response: jsonb
- status: string (draft/published)
- unique_slug: string (unique)
- created_at: datetime
- updated_at: datetime

# Day
- id: bigint (primary key)
- travel_plan_id: bigint (foreign key)
- date: date
- day_number: integer
- theme: string
- created_at: datetime

# Activity
- id: bigint (primary key)
- day_id: bigint (foreign key)
- time_slot: string
- title: string
- description: text
- location_name: string
- google_maps_url: string
- coordinates: jsonb (lat, lng)
- estimated_cost: decimal
- activity_type: string
- created_at: datetime

# Restaurant
- id: bigint (primary key)
- day_id: bigint (foreign key)
- meal_type: string (breakfast/lunch/dinner)
- name: string
- cuisine_type: string
- google_maps_url: string
- price_range: string
- recommended_dishes: text
- created_at: datetime
```

## 🎯 성능 목표

### 응답 시간
- **페이지 로드**: < 2초
- **AI 응답 생성**: < 15초
- **PWA 기본 생성**: < 5초
- **전체 완성**: < 30초

### 시스템 성능
- **동시 접속**: 100명 이상
- **일일 처리량**: 1,000 여행 계획
- **가동시간**: 99.9%
- **DB 응답시간**: < 100ms

## 📅 개발 계획

### Phase 1: MVP (4주)

#### Week 1: 프로젝트 설정
- Rails 프로젝트 초기화
- 데이터베이스 스키마 설계
- 기본 UI 레이아웃
- 개발 환경 구성

#### Week 2: AI 통합
- Gemini API 연동
- 프롬프트 엔지니어링
- JSON 응답 파싱
- 에러 처리

#### Week 3: PWA 생성
- 템플릿 시스템 구축
- 동적 라우팅 구현
- 오프라인 기능
- 기본 스타일링

#### Week 4: 배포 준비
- DigitalOcean 서버 설정
- 배포 스크립트
- 모니터링 설정
- 초기 테스트

### Phase 2: 안정화 (2주)

#### Week 5-6:
- 버그 수정
- 성능 최적화
- 사용자 피드백 반영
- 보안 강화

### Phase 3: 확장 (4주)

#### Week 7-10:
- 사용자 인증 고도화
- 실시간 업데이트
- 추가 기능 개발
- A/B 테스트

## 💰 비용 구조

### 초기 비용 (MVP)
```yaml
Infrastructure:
- DigitalOcean Droplet (2GB): $12/월
- 도메인: $12/년 = $1/월
- SSL: 무료 (Let's Encrypt)

APIs:
- Gemini API: $0.075/백만 토큰 (약 $10-30/월)
- Google Maps: $200 무료 크레딧/월
- 총 예상: $25-45/월
```

### 성장 단계 비용
```yaml
Infrastructure:
- DigitalOcean Droplet (4GB): $24/월
- DigitalOcean Spaces: $5/월
- 백업 서비스: $5/월

APIs:
- Gemini API: $50-100/월
- Google Maps: $50-100/월
- 총 예상: $150-250/월
```

## 🔒 보안 및 규정

### 보안 요구사항
- HTTPS 필수
- API 키 환경 변수 관리
- SQL Injection 방지
- XSS 방지
- Rate Limiting
- CORS 설정

### 개인정보 처리
- 최소 정보 수집 원칙
- 암호화 저장
- 정기적 데이터 삭제
- GDPR 준수 (향후)

## 📈 성공 지표 (KPI)

### 비즈니스 지표
- **MAU**: 100명 (3개월), 1,000명 (6개월)
- **여행 계획 생성**: 월 500건
- **PWA 설치율**: 30%
- **재방문율**: 40%
- **평균 세션 시간**: 5분 이상

### 기술 지표
- **평균 응답시간**: < 500ms
- **에러율**: < 1%
- **가동시간**: > 99.9%
- **페이지 속도 점수**: > 90

## ⚠️ 리스크 및 대응

### 기술적 리스크
- **AI API 비용 증가**: 캐싱 전략 강화, 사용량 모니터링
- **서버 과부하**: 자동 스케일링 준비, 로드 밸런서 고려
- **데이터 손실**: 일일 백업 + 오프사이트 백업

### 비즈니스 리스크
- **경쟁사 출현**: 차별화 기능 지속 개발
- **사용자 이탈**: UX 지속 개선, 사용자 피드백 적극 반영
- **수익화 지연**: 프리미엄 기능 준비, B2B 시장 타겟

## 🗺️ 향후 로드맵

### 단기 (6개월)
- B2C 서비스 안정화
- 모바일 앱 개발 (React Native)
- 예약 시스템 연동 (Booking.com API)
- 여행 커뮤니티 기능

### 중기 (12개월)
- B2B 서비스 출시
- 화이트라벨 솔루션
- 국제화 (다국어 지원)
- AI 모델 파인튜닝

### 장기 (24개월)
- AI 모델 자체 개발
- 여행 마켓플레이스
- 종합 여행 플랫폼화
- 글로벌 확장