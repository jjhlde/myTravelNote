# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**TripCrafter** - AI 기반 개인 맞춤형 여행 플래너
- Ruby on Rails 7.1 기반 웹 애플리케이션
- Gemini 2.5 Flash API를 활용한 여행 계획 자동 생성
- 사용자별 고유 PWA(Progressive Web App) 자동 생성
- DigitalOcean 배포 예정

## 기술 스택

### Backend
- **Language**: Ruby 3.3
- **Framework**: Rails 7.1
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis + Sidekiq
- **Real-time**: ActionCable
- **Server**: Nginx + Passenger

### Frontend
- **Framework**: Hotwire (Turbo + Stimulus)
- **CSS**: Tailwind CSS
- **Components**: ViewComponent
- **PWA**: Service Worker

### External APIs
- **AI**: Gemini 2.5 Flash API
- **Maps**: Google Maps API (Places, Geocoding, Photos)
- **Weather**: OpenWeatherMap API (optional)

## 프로젝트 구조

```
Travel-Master/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   ├── travel_plans_controller.rb
│   │   ├── chat_controller.rb
│   │   └── pwa_controller.rb
│   ├── models/
│   │   ├── user.rb
│   │   ├── travel_plan.rb
│   │   ├── day.rb
│   │   ├── activity.rb
│   │   └── restaurant.rb
│   ├── services/
│   │   ├── gemini_service.rb          # AI API 통합
│   │   ├── travel_planner_service.rb  # 여행 계획 생성 로직
│   │   ├── pwa_generator_service.rb   # PWA 생성 로직
│   │   └── google_places_service.rb   # Google Places API
│   ├── jobs/
│   │   ├── pwa_generation_job.rb      # PWA 비동기 생성
│   │   └── image_collection_job.rb    # 이미지 수집
│   └── views/
│       ├── layouts/
│       │   ├── application.html.erb
│       │   └── pwa.html.erb           # PWA 전용 레이아웃
│       ├── travel_plans/
│       └── pwa/
├── config/
├── db/
├── lib/
├── public/
│   └── pwa/                           # 생성된 PWA 파일들
└── test/
```

## 핵심 기능

### 1. AI 여행 플래너
- 사용자의 자연어 입력을 받아 Gemini API로 전송
- 구조화된 JSON 형태로 여행 계획 생성
- 동선 최적화, 시간 배분, 예산 고려

### 2. PWA 자동 생성
- 각 여행 계획별 고유 URL 생성 (`/plan/{unique-slug}`)
- 오프라인 사용 가능한 PWA 앱 자동 생성
- Service Worker를 통한 캐싱 구현

### 3. 실시간 업데이트
- ActionCable을 통한 생성 진행 상황 실시간 표시
- 백그라운드 작업으로 이미지 수집 및 추가 정보 업데이트

## 개발 명령어

### 프로젝트 초기 설정
```bash
# Rails 프로젝트 생성
rails new Travel-Master -d postgresql --css tailwind

# 의존성 설치
bundle install
yarn install

# 데이터베이스 생성
rails db:create
rails db:migrate

# 개발 서버 실행
bin/dev  # Procfile.dev 사용
```

### 주요 Gem
```ruby
# Gemfile
gem 'devise'              # 사용자 인증
gem 'sidekiq'             # 백그라운드 작업
gem 'redis'               # 캐싱 및 큐
gem 'httparty'            # API 호출
gem 'image_processing'    # 이미지 처리
gem 'view_component'      # 컴포넌트 시스템
gem 'turbo-rails'         # Hotwire
gem 'stimulus-rails'      # Hotwire
```

### 데이터베이스 명령어
```bash
# 마이그레이션 생성
rails generate migration CreateTravelPlans

# 마이그레이션 실행
rails db:migrate

# 시드 데이터 생성
rails db:seed
```

### 테스트 실행
```bash
# 전체 테스트
rails test

# 특정 테스트
rails test test/models/travel_plan_test.rb
```

## AI 프롬프트 관리

### Gemini API 프롬프트
- `app/services/prompts/travel_planner_prompt.rb`에 프롬프트 저장
- 버전 관리 및 A/B 테스트 가능하도록 구조화
- JSON 응답 형식 명확히 정의

### 응답 구조 예시
```json
{
  "title": "오사카 3박4일 가족여행",
  "days": [
    {
      "day": 1,
      "date": "2025-03-15",
      "theme": "도착 및 시내 탐방",
      "activities": [...],
      "restaurants": [...]
    }
  ]
}
```

## PWA 템플릿 구조

### 기본 템플릿
- `app/views/pwa/templates/`에 PWA 템플릿 저장
- ERB 템플릿으로 동적 데이터 삽입
- Service Worker 파일 자동 생성

### PWA 파일 구조
```
/public/pwa/{plan-id}/
├── index.html
├── manifest.json
├── sw.js
├── styles.css
└── images/
```

## 배포 전략

### DigitalOcean 설정
```bash
# 서버 초기 설정
apt update && apt upgrade
apt install ruby-full postgresql nginx

# Passenger 설치
gem install passenger
passenger-install-nginx-module

# SSL 설정 (Let's Encrypt)
certbot --nginx -d tripcrafter.com
```

### 배포 스크립트
```bash
# Capistrano 사용
cap production deploy
```

## 성능 최적화

### 캐싱 전략
- Redis를 통한 API 응답 캐싱
- 여행지별 기본 정보 캐싱
- 이미지 CDN 활용

### 백그라운드 작업
- Sidekiq을 통한 비동기 처리
- PWA 생성을 단계별로 분리
- 우선순위 큐 활용

## 보안 고려사항

### API 키 관리
```bash
# Rails credentials 사용
EDITOR="code --wait" rails credentials:edit

# 사용 예시
Rails.application.credentials.gemini[:api_key]
```

### 보안 설정
- CORS 설정
- Rate limiting (rack-attack)
- SQL injection 방지 (ActiveRecord)
- XSS 방지 (Rails 기본 제공)

## 개발 팁

### 로컬 개발
- `bin/dev`로 모든 프로세스 동시 실행
- `rails console`로 대화형 콘솔 사용
- `tail -f log/development.log`로 로그 확인

### 디버깅
- `byebug` gem 사용
- `rails server --debugger` 옵션
- Chrome DevTools 활용

### 코드 스타일
- RuboCop 설정 준수
- Rails 컨벤션 따르기
- 명확한 변수명 사용

## 확장성을 위한 개발 지침

### 기본 원칙
**모든 코드 작성 시 추후 기능 확장성을 반드시 고려하세요.**

### 구체적인 가이드라인

#### 1. 인터페이스 설계
- 추상화 레벨을 적절히 유지하여 향후 변경에 유연하게 대응
- Duck typing을 활용한 다형성 구현
- 모듈과 concern을 통한 기능 분리

```ruby
# 좋은 예: 확장 가능한 서비스 설계
class TravelPlannerService
  def initialize(ai_provider: GeminiService.new)
    @ai_provider = ai_provider
  end
  
  def generate_plan(input)
    # AI provider를 쉽게 교체 가능
    @ai_provider.generate(input)
  end
end

# 나쁜 예: 하드코딩된 의존성
class TravelPlannerService
  def generate_plan(input)
    # Gemini에 직접 의존
    GeminiService.new.generate(input)
  end
end
```

#### 2. 데이터베이스 설계
- JSONB 필드 활용으로 스키마 변경 없이 데이터 확장 가능
- 다형성 관계(Polymorphic associations) 적극 활용
- 인덱스와 제약조건은 처음부터 고려

```ruby
# 확장 가능한 마이그레이션 예시
class CreateActivities < ActiveRecord::Migration[7.1]
  def change
    create_table :activities do |t|
      t.references :day, null: false, foreign_key: true
      t.string :time_slot
      t.string :title
      t.text :description
      t.jsonb :metadata, default: {}  # 향후 필드 추가를 위한 공간
      t.jsonb :location_data          # 구조화된 위치 정보
      
      t.timestamps
    end
    
    add_index :activities, :metadata, using: :gin
  end
end
```

#### 3. 서비스 객체 패턴
- 단일 책임 원칙(SRP) 준수
- 의존성 주입(DI) 패턴 활용
- 체이닝 가능한 인터페이스 설계

```ruby
# 확장 가능한 서비스 객체
class BaseService
  def self.call(...)
    new(...).call
  end
  
  private
  
  def success(data = {})
    OpenStruct.new(success?: true, data: data, errors: [])
  end
  
  def failure(errors)
    OpenStruct.new(success?: false, data: {}, errors: errors)
  end
end
```

#### 4. 설정 관리
- 환경별 설정 분리
- Feature flags를 통한 점진적 기능 출시
- 설정값의 동적 로딩 지원

```ruby
# config/application.rb
config.feature_flags = config_for(:features)

# 사용 예시
if Rails.configuration.feature_flags[:new_ai_model]
  # 새로운 AI 모델 사용
else
  # 기존 모델 사용
end
```

#### 5. API 버저닝
- 처음부터 API 버전 관리 체계 구축
- 하위 호환성 유지
- Deprecation 정책 수립

```ruby
# routes.rb
namespace :api do
  namespace :v1 do
    resources :travel_plans
  end
  
  # 향후 v2 추가 시
  namespace :v2 do
    resources :travel_plans
  end
end
```

#### 6. 모듈화와 플러그인 시스템
- 핵심 기능과 확장 기능 분리
- 플러그인 아키텍처 고려
- 이벤트 기반 확장 포인트 제공

```ruby
# 이벤트 기반 확장
class TravelPlan < ApplicationRecord
  # 확장 포인트 제공
  after_create_commit :trigger_plan_created_event
  
  private
  
  def trigger_plan_created_event
    Rails.configuration.event_bus.publish(
      'travel_plan.created',
      plan_id: id,
      user_id: user_id
    )
  end
end
```

#### 7. 테스트 전략
- 인터페이스 기반 테스트 작성
- Mock과 Stub을 활용한 독립적 테스트
- 통합 테스트로 전체 흐름 검증

```ruby
# 확장 가능한 테스트 구조
class TravelPlannerServiceTest < ActiveSupport::TestCase
  def setup
    @ai_provider = mock('ai_provider')
    @service = TravelPlannerService.new(ai_provider: @ai_provider)
  end
  
  test "generates plan with any AI provider" do
    @ai_provider.expects(:generate).returns(sample_response)
    result = @service.generate_plan("오사카 여행")
    assert result.success?
  end
end
```

### 확장성 체크리스트
새로운 기능 개발 시 다음 사항을 확인하세요:

- [ ] 기존 코드를 수정하지 않고 새 기능을 추가할 수 있는가?
- [ ] 인터페이스가 충분히 추상화되어 있는가?
- [ ] 설정을 통해 동작을 변경할 수 있는가?
- [ ] 다른 구현체로 쉽게 교체 가능한가?
- [ ] 테스트가 구현이 아닌 인터페이스를 검증하는가?
- [ ] 향후 요구사항 변경에 대응 가능한가?

## 주요 작업 흐름

### 새 기능 추가
1. 브랜치 생성: `git checkout -b feature/feature-name`
2. 테스트 작성
3. 기능 구현
4. 테스트 통과 확인
5. PR 생성

### 버그 수정
1. 이슈 재현
2. 테스트 케이스 작성
3. 버그 수정
4. 테스트 통과 확인

## 자주 사용하는 Rails 명령어

```bash
# 콘솔
rails c

# 라우트 확인
rails routes | grep travel

# 태스크 실행
rails task_name

# 캐시 클리어
rails tmp:clear
rails cache:clear

# 로그 확인
tail -f log/development.log
```

## Git Workflow

### 커밋 메시지 규칙
- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 포맷팅
- `refactor:` 코드 리팩토링
- `test:` 테스트 추가
- `chore:` 기타 변경사항

### 브랜치 전략
- `main`: 프로덕션 배포
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정

## 문제 해결

### 자주 발생하는 이슈
1. **PostgreSQL 연결 오류**: `config/database.yml` 확인
2. **Redis 연결 오류**: Redis 서버 실행 확인
3. **Asset 컴파일 오류**: `rails assets:precompile` 실행

### 성능 이슈
1. **N+1 쿼리**: `includes` 사용
2. **느린 페이지 로드**: 캐싱 활용
3. **메모리 누수**: 백그라운드 작업 모니터링

## 참고 자료

- [Rails Guides](https://guides.rubyonrails.org/)
- [Hotwire Handbook](https://hotwired.dev/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Google Maps API](https://developers.google.com/maps)

## 중요 규칙

**코드 수정 후에는 반드시:**
1. 테스트 실행: `rails test`
2. RuboCop 검사: `rubocop`
3. Git commit & push