# TripCrafter 로컬 개발 환경 설정 가이드

## 필수 요구사항

- Ruby 3.3.0
- Rails 7.1+
- PostgreSQL 15
- Redis
- Node.js 18+
- Yarn

## 설치 과정

### 1. Ruby 설치 (rbenv 사용 권장)

```bash
# rbenv 설치
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

# ruby-build 설치
git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build

# Ruby 3.3.0 설치
rbenv install 3.3.0
rbenv global 3.3.0
```

### 2. PostgreSQL 설치

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# PostgreSQL 사용자 설정
sudo -u postgres createuser -s $(whoami)
```

### 3. Redis 설치

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

### 4. Node.js & Yarn 설치

```bash
# nvm으로 Node.js 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Yarn 설치
npm install -g yarn
```

### 5. 프로젝트 설정

```bash
# 프로젝트 디렉토리로 이동
cd Travel-Master

# 의존성 설치
bundle install
yarn install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 API 키 입력

# 데이터베이스 생성
rails db:create
rails db:migrate
rails db:seed

# 개발 서버 실행
bin/dev
```

### 6. 환경 변수 설정

`.env` 파일에 다음 값들을 설정하세요:

```bash
# Gemini API 키 (필수)
GEMINI_API_KEY=your_actual_gemini_api_key

# Google Maps API 키 (필수)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# 데이터베이스 (기본값 사용 가능)
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Redis (기본값 사용 가능)
REDIS_URL=redis://localhost:6379/0
```

### 7. 개발 서버 실행

```bash
# 모든 프로세스를 한번에 실행 (권장)
bin/dev

# 또는 개별 실행
rails server              # 웹 서버
bin/rails tailwindcss:watch  # CSS 컴파일
yarn build --watch        # JavaScript 빌드
bundle exec sidekiq       # 백그라운드 작업
```

## 테스트

```bash
# 전체 테스트
rails test

# 특정 테스트
rails test test/models/travel_plan_test.rb
```

## 트러블슈팅

### PostgreSQL 연결 오류
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 서비스 재시작
sudo systemctl restart postgresql
```

### Redis 연결 오류
```bash
# Redis 상태 확인
redis-cli ping
# PONG이 나와야 정상

# 서비스 재시작
sudo systemctl restart redis
```

### Bundle 설치 오류
```bash
# 특정 gem 설치 실패 시
bundle config set --local build.pg --with-pg-config=/usr/bin/pg_config
bundle install
```

## 개발 팁

1. **Rails 콘솔**: `rails console`로 대화형 콘솔 실행
2. **로그 확인**: `tail -f log/development.log`로 실시간 로그 확인
3. **데이터베이스 리셋**: `rails db:reset` (주의: 모든 데이터 삭제)
4. **캐시 클리어**: `rails tmp:clear` 및 `rails cache:clear`

## API 키 발급

### Gemini API
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 방문
2. "Create API Key" 클릭
3. 생성된 키를 `.env` 파일에 복사

### Google Maps API
1. [Google Cloud Console](https://console.cloud.google.com/) 방문
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Credentials
4. Create Credentials > API Key
5. Maps JavaScript API, Places API, Geocoding API 활성화
6. 생성된 키를 `.env` 파일에 복사