# TripCrafter 기술 아키텍처

## 시스템 개요

TripCrafter는 모놀리식 Rails 애플리케이션으로 시작하여, 향후 마이크로서비스로 확장 가능한 구조로 설계되었습니다.

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├─────────────────┬───────────────────┬───────────────────────┤
│   Web Browser   │   Mobile Browser  │    PWA Offline App    │
└────────┬────────┴─────────┬─────────┴───────────┬───────────┘
         │                  │                     │
         │              HTTPS/WSS                 │
         │                  │                     │
┌────────▼──────────────────▼─────────────────────▼───────────┐
│                      Application Layer                       │
├──────────────────────────────────────────────────────────────┤
│                    Rails Application                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Controllers │  │   Services    │  │      Jobs       │    │
│  │             │  │               │  │                 │    │
│  │ • Chat      │  │ • Gemini      │  │ • PWA Generator │    │
│  │ • Plans     │  │ • Planner     │  │ • Image Fetch   │    │
│  │ • PWA       │  │ • Google Maps │  │ • Data Enhance  │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   Models    │  │ ActionCable   │  │   ViewComponent │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
└──────────────────────────┬───────────────────────────────────┘
                          │
┌──────────────────────────▼───────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────┬────────────────┬──────────────────────┤
│    PostgreSQL       │     Redis       │   File Storage       │
│                     │                 │                      │
│ • Users             │ • Cache         │ • Generated PWAs     │
│ • Travel Plans      │ • Sessions      │ • Images             │
│ • Activities        │ • Job Queue     │ • Static Assets      │
└─────────────────────┴────────────────┴──────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                    External Services                         │
├─────────────────┬──────────────────┬────────────────────────┤
│  Gemini API     │  Google Maps API │  Weather API (opt)     │
└─────────────────┴──────────────────┴────────────────────────┘
```

## 컴포넌트 상세

### 1. Client Layer

#### Web/Mobile Browser
- 일반적인 웹 브라우저 접속
- Responsive Design으로 모바일 최적화
- Hotwire를 통한 SPA-like 경험

#### PWA Offline App
- Service Worker 기반 오프라인 지원
- IndexedDB를 통한 로컬 데이터 저장
- Background Sync for 업데이트

### 2. Application Layer

#### Controllers
```ruby
# 주요 컨트롤러 구조
ApplicationController
├── ChatController          # 챗봇 인터페이스
├── TravelPlansController   # 여행 계획 CRUD
├── PwaController          # PWA 관련 엔드포인트
└── Api::V1::BaseController # API 엔드포인트 (향후)
```

#### Services
```ruby
# 비즈니스 로직 캡슐화
Services::
├── GeminiService          # AI API 통신
├── TravelPlannerService   # 여행 계획 생성 로직
├── PwaGeneratorService    # PWA 파일 생성
└── GooglePlacesService    # 장소 정보 및 이미지
```

#### Background Jobs
```ruby
# Sidekiq 기반 비동기 작업
Jobs::
├── PwaGenerationJob       # PWA 생성 (우선순위: high)
├── ImageCollectionJob     # 이미지 수집 (우선순위: medium)
└── DataEnhancementJob     # 추가 정보 수집 (우선순위: low)
```

### 3. Data Layer

#### PostgreSQL Schema
```sql
-- 주요 테이블 구조
users (id, email, encrypted_password, ...)
travel_plans (id, user_id, title, destination, ai_response::jsonb, ...)
days (id, travel_plan_id, date, theme, ...)
activities (id, day_id, time_slot, location::point, ...)
restaurants (id, day_id, meal_type, ...)
```

#### Redis 사용
- **캐싱**: API 응답, 자주 조회되는 데이터
- **세션 관리**: 사용자 세션 정보
- **큐**: Sidekiq 작업 큐
- **실시간**: ActionCable pub/sub

#### File Storage
```
/public/pwa/{plan-id}/
├── index.html
├── manifest.json
├── sw.js
├── assets/
│   ├── styles.css
│   └── scripts.js
└── images/
    └── {cached-images}
```

## 데이터 플로우

### 1. 여행 계획 생성 플로우

```
User Input → ChatController 
    → GeminiService (AI API Call)
    → TravelPlannerService (Parse & Structure)
    → TravelPlan Model (Save to DB)
    → PwaGenerationJob (Enqueue)
    → Redirect to Plan Page
```

### 2. PWA 생성 플로우

```
PwaGenerationJob (Dequeue)
    → Load TravelPlan from DB
    → PwaGeneratorService
        → Render ERB Templates
        → Generate Manifest.json
        → Create Service Worker
        → Save Files to /public/pwa/
    → Broadcast Completion (ActionCable)
```

### 3. 실시간 업데이트 플로우

```
Background Job Progress
    → ActionCable Broadcast
    → WebSocket Connection
    → Stimulus Controller Update
    → DOM Update (Turbo)
```

## 보안 아키텍처

### 1. 인증 및 권한

```ruby
# Devise 기반 인증
before_action :authenticate_user!

# 권한 검증
class TravelPlanPolicy
  def show?
    record.user == user || record.public?
  end
end
```

### 2. API 보안

- **Rate Limiting**: Rack::Attack
- **API Keys**: Rails Credentials
- **CORS**: 화이트리스트 기반
- **Input Validation**: Strong Parameters

### 3. 데이터 보안

- **암호화**: bcrypt (passwords), Rails encryption (sensitive data)
- **SQL Injection 방지**: ActiveRecord parameterization
- **XSS 방지**: Rails 내장 헬퍼 사용

## 성능 최적화

### 1. 캐싱 전략

```ruby
# 다층 캐싱
class TravelPlannerService
  def destination_info(location)
    Rails.cache.fetch("destination:#{location}", expires_in: 1.day) do
      # Expensive API call
    end
  end
end
```

### 2. 데이터베이스 최적화

- **인덱스**: 주요 조회 컬럼
- **Eager Loading**: N+1 쿼리 방지
- **Materialized Views**: 복잡한 집계
- **Partitioning**: 대용량 테이블 (향후)

### 3. Asset 최적화

- **CDN**: 정적 파일 서빙
- **압축**: Gzip/Brotli
- **이미지 최적화**: WebP 변환
- **Code Splitting**: 필요시 로드

## 확장성 고려사항

### 설계 원칙
**모든 아키텍처 결정은 추후 기능 확장성을 최우선으로 고려합니다.**

### 1. 수평 확장 (Horizontal Scaling)

```yaml
# 로드 밸런서 뒤에 여러 앱 서버
Load Balancer (Nginx)
├── App Server 1 (Passenger)
├── App Server 2 (Passenger)
└── App Server N (Passenger)
```

#### 확장 전략
- **무상태 설계**: 세션은 Redis에 저장하여 서버 간 공유
- **스티키 세션 회피**: 모든 서버가 동일한 요청 처리 가능
- **자동 스케일링**: CPU/메모리 기반 Auto Scaling Group 설정

### 2. 서비스 분리 아키텍처 (Service-Oriented Architecture)

#### 현재: 모듈식 모놀리스
```ruby
# app/services/ 구조로 논리적 분리
Services/
├── AI/
│   ├── GeminiService
│   ├── OpenAIService (향후)
│   └── AIProviderInterface
├── Maps/
│   ├── GoogleMapsService
│   └── MapsProviderInterface
└── PWA/
    ├── GeneratorService
    └── TemplateEngine
```

#### 향후: 마이크로서비스 전환
```yaml
# 단계적 서비스 분리 계획
API Gateway
├── Auth Service
│   └── JWT 기반 인증
├── Planning Service (AI)
│   ├── 다중 AI Provider 지원
│   └── 프롬프트 버전 관리
├── PWA Service
│   ├── 템플릿 엔진
│   └── Asset Pipeline
├── Analytics Service
│   └── 이벤트 수집 및 분석
└── Notification Service (신규)
    ├── Email
    ├── Push
    └── SMS
```

### 3. 데이터베이스 확장 전략

#### 단기 전략 (0-6개월)
- **Read Replicas**: 읽기 부하 분산
- **Connection Pooling**: PgBouncer 도입
- **Query 최적화**: EXPLAIN ANALYZE 활용

```ruby
# 읽기/쓰기 분리 예시
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true
  
  connects_to database: {
    writing: :primary,
    reading: :replica
  }
end
```

#### 중기 전략 (6-12개월)
- **Partitioning**: 날짜별 데이터 분할
- **Materialized Views**: 복잡한 집계 쿼리 최적화
- **CQRS 패턴**: 명령과 조회 분리

```sql
-- 파티셔닝 예시
CREATE TABLE travel_plans_2025_q1 PARTITION OF travel_plans
FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
```

#### 장기 전략 (12개월+)
- **Sharding**: 사용자별 데이터 분리
- **Event Sourcing**: 모든 변경사항 이벤트로 저장
- **다중 데이터베이스**: 서비스별 독립 DB

### 4. 캐싱 계층 확장

#### 다층 캐싱 전략
```
┌─────────────┐
│   Browser   │ ← Service Worker Cache
└──────┬──────┘
       │
┌──────▼──────┐
│     CDN     │ ← Edge Cache
└──────┬──────┘
       │
┌──────▼──────┐
│   Varnish   │ ← HTTP Cache
└──────┬──────┘
       │
┌──────▼──────┐
│    Rails    │ ← Fragment Cache
└──────┬──────┘
       │
┌──────▼──────┐
│    Redis    │ ← Object Cache
└──────┬──────┘
       │
┌──────▼──────┐
│  PostgreSQL │
└─────────────┘
```

### 5. API 확장성

#### GraphQL 도입 (향후)
```ruby
# RESTful API와 GraphQL 동시 지원
module Types
  class TravelPlanType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :days, [Types::DayType], null: false
    
    # 필드별 권한 관리
    field :private_notes, String, null: true do
      authorize :owner
    end
  end
end
```

#### API Gateway 패턴
- **Rate Limiting**: 사용자별/IP별 제한
- **API Key Management**: 다중 키 지원
- **Request Routing**: 버전별 라우팅
- **Response Caching**: 공통 응답 캐싱

### 6. 이벤트 기반 아키텍처

#### 이벤트 버스 구현
```ruby
# 확장 가능한 이벤트 시스템
class EventBus
  def self.subscribe(event_type, handler)
    subscribers[event_type] ||= []
    subscribers[event_type] << handler
  end
  
  def self.publish(event_type, payload)
    Array(subscribers[event_type]).each do |handler|
      EventJob.perform_later(handler, payload)
    end
  end
end

# 사용 예시
EventBus.subscribe('travel_plan.created', EmailNotificationHandler)
EventBus.subscribe('travel_plan.created', AnalyticsHandler)
EventBus.subscribe('travel_plan.created', PwaGenerationHandler)
```

### 7. 플러그인 시스템

#### 확장 포인트 설계
```ruby
# 플러그인 인터페이스
module TripCrafter
  module Plugins
    class Base
      def self.register(name, klass)
        Registry.register(name, klass)
      end
      
      # 필수 구현 메서드
      def execute(context)
        raise NotImplementedError
      end
    end
  end
end

# 플러그인 예시
class WeatherPlugin < TripCrafter::Plugins::Base
  register :weather, self
  
  def execute(context)
    # 날씨 정보 추가
  end
end
```

### 8. 모니터링 및 관찰성 (Observability)

#### 분산 추적 (Distributed Tracing)
```ruby
# OpenTelemetry 통합
require 'opentelemetry/sdk'

OpenTelemetry::SDK.configure do |c|
  c.service_name = 'tripcrafter'
  c.use 'OpenTelemetry::Instrumentation::Rails'
  c.use 'OpenTelemetry::Instrumentation::Redis'
  c.use 'OpenTelemetry::Instrumentation::PG'
end
```

#### 메트릭 수집
- **Application Metrics**: 비즈니스 메트릭
- **System Metrics**: CPU, 메모리, 디스크
- **Custom Metrics**: 여행 계획 생성 시간 등

### 9. 확장성 체크포인트

#### 새로운 기능 추가 시 검토사항
- [ ] 기존 시스템에 미치는 영향 최소화
- [ ] 독립적으로 배포 가능한가?
- [ ] 롤백 전략이 있는가?
- [ ] 성능 영향도 측정 가능한가?
- [ ] 모니터링 지표가 준비되어 있는가?

#### 기술 부채 관리
- **정기적 리팩토링**: 분기별 기술 부채 해결
- **의존성 업데이트**: 월별 보안 패치
- **성능 프로파일링**: 주별 성능 분석

### 10. 향후 확장 로드맵

#### Phase 1 (현재 - 3개월)
- 모놀리식 애플리케이션 안정화
- 기본 캐싱 전략 구현
- 모니터링 시스템 구축

#### Phase 2 (3-6개월)
- Read Replica 도입
- API 버저닝 시스템
- 이벤트 버스 구현

#### Phase 3 (6-12개월)
- 서비스 분리 시작 (PWA Generator)
- GraphQL API 추가
- 플러그인 시스템 도입

#### Phase 4 (12개월+)
- 완전한 마이크로서비스 전환
- Multi-region 배포
- AI 모델 자체 호스팅

## 모니터링 및 로깅

### 1. Application Monitoring

- **APM**: New Relic / Datadog
- **Error Tracking**: Sentry
- **Uptime**: UptimeRobot

### 2. Infrastructure Monitoring

- **Server**: DigitalOcean Monitoring
- **Database**: pg_stat_statements
- **Redis**: redis-cli INFO

### 3. 로깅 전략

```ruby
# 구조화된 로깅
Rails.logger.tagged("PwaGeneration") do
  Rails.logger.info({
    event: "pwa_generated",
    plan_id: plan.id,
    duration: duration,
    user_id: plan.user_id
  }.to_json)
end
```

## 개발 환경

### 1. 로컬 개발

```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    
  redis:
    image: redis:7
```

### 2. 테스트 환경

- **Unit Tests**: RSpec/Minitest
- **Integration Tests**: Capybara
- **API Tests**: Request Specs
- **Performance Tests**: Apache Bench

## 배포 파이프라인

```yaml
# CI/CD Pipeline
1. Git Push
2. GitHub Actions
   - Run Tests
   - Security Scan
   - Build Assets
3. Deploy to Staging
4. Manual Approval
5. Deploy to Production
   - Database Migration
   - Asset Compilation
   - Service Restart
```

## 재해 복구

### 1. 백업 전략

- **Database**: 일일 자동 백업, 7일 보관
- **Files**: S3/Spaces 동기화
- **Code**: Git 저장소

### 2. 복구 절차

```bash
# Database 복구
pg_restore -d tripcrafter backup.dump

# File 복구
aws s3 sync s3://backup/pwa /public/pwa
```

## 향후 아키텍처 개선 계획

### Phase 1 (현재)
- 모놀리식 Rails 애플리케이션
- 단일 PostgreSQL 데이터베이스
- 기본 캐싱 및 백그라운드 작업

### Phase 2 (6개월)
- Read Replica 추가
- Redis Cluster
- CDN 통합
- 컨테이너화 (Docker)

### Phase 3 (12개월)
- API Gateway 도입
- 서비스 분리 시작
- Event-driven 아키텍처
- Kubernetes 배포