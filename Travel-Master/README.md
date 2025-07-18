# TripCrafter - AI 여행 플래너

AI 기반 개인 맞춤형 여행 계획 생성 및 PWA 앱 제공 서비스

## 🌟 프로젝트 소개

TripCrafter는 사용자가 간단한 자연어 입력만으로 전문가 수준의 여행 계획을 생성하고, 개인 전용 PWA(Progressive Web App)를 즉시 받을 수 있는 혁신적인 여행 플래닝 서비스입니다.

### 주요 특징

- 🤖 **AI 기반 여행 계획**: Gemini 2.5 Flash API를 활용한 지능형 여행 일정 생성
- 📱 **개인 맞춤 PWA**: 각 사용자별 고유한 여행 앱 자동 생성
- 🌐 **오프라인 지원**: 인터넷 없이도 여행 일정 확인 가능
- ⚡ **빠른 생성**: 30초 이내에 완전한 여행 계획 제공
- 🗺️ **Google Maps 연동**: 모든 장소에 대한 정확한 위치 정보

## 🚀 시작하기

### 필수 요구사항

- Ruby 3.3 이상
- Rails 7.1 이상
- PostgreSQL 15
- Redis
- Node.js 18 이상

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/yourusername/Travel-Master.git
cd Travel-Master
```

2. 의존성 설치
```bash
bundle install
yarn install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일에 필요한 API 키 입력
```

4. 데이터베이스 설정
```bash
rails db:create
rails db:migrate
rails db:seed
```

5. 개발 서버 실행
```bash
bin/dev
```

## 📋 사용 방법

1. 웹사이트 접속 (http://localhost:3000)
2. 챗봇에 여행 계획 입력 (예: "오사카 3박4일 가족여행")
3. AI가 생성한 여행 계획 확인
4. 개인 PWA URL 받기
5. PWA 앱 설치 및 오프라인 사용

## 🏗️ 기술 스택

- **Backend**: Ruby on Rails 7.1
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis + Sidekiq
- **Frontend**: Hotwire (Turbo + Stimulus) + Tailwind CSS
- **AI**: Gemini 2.5 Flash API
- **Maps**: Google Maps API
- **Deployment**: DigitalOcean

## 📁 프로젝트 구조

```
Travel-Master/
├── app/              # Rails 애플리케이션 코드
├── config/           # 설정 파일
├── db/              # 데이터베이스 스키마 및 마이그레이션
├── public/          # 정적 파일 및 생성된 PWA
├── test/            # 테스트 코드
├── PRD.md           # Product Requirements Document
├── CLAUDE.md        # Claude Code 가이드
├── ARCHITECTURE.md  # 기술 아키텍처 문서
└── README.md        # 이 파일
```

## 🧪 테스트

```bash
# 전체 테스트 실행
rails test

# 특정 테스트 실행
rails test test/models/travel_plan_test.rb

# 시스템 테스트
rails test:system
```

## 🚢 배포

### DigitalOcean 배포

1. 서버 준비 (Ubuntu 22.04 LTS)
2. 필요한 소프트웨어 설치
3. Capistrano를 사용한 자동 배포

```bash
cap production deploy
```

자세한 배포 가이드는 [DEPLOYMENT.md](docs/DEPLOYMENT.md) 참고

## 📊 API 문서

API 명세는 [API_SPECIFICATION.md](docs/API_SPECIFICATION.md)를 참고하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 📞 문의

- 이메일: contact@tripcrafter.com
- 웹사이트: https://tripcrafter.com

## 🙏 감사의 말

- Google Gemini API 팀
- Ruby on Rails 커뮤니티
- 모든 오픈소스 기여자들