#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Rails 프로젝트 자동 설정 스크립트 ===${NC}"
echo ""

# 1. Redis 설치 및 시작
echo -e "${YELLOW}1. Redis 설치 중...${NC}"
if ! command -v redis-server &> /dev/null; then
    sudo apt-get install -y redis-server
    sudo systemctl start redis
    sudo systemctl enable redis
    echo -e "${GREEN}✓ Redis 설치 완료${NC}"
else
    echo -e "${GREEN}✓ Redis가 이미 설치되어 있습니다${NC}"
    sudo systemctl start redis 2>/dev/null || true
fi

# Redis 테스트
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓ Redis 정상 작동 중${NC}"
else
    echo -e "${RED}✗ Redis 연결 실패${NC}"
fi

# 2. Node.js 설치 (nvm 사용)
echo -e "${YELLOW}2. Node.js 18 설치 중...${NC}"
if ! command -v node &> /dev/null; then
    # nvm 설치
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Node.js 18 설치
    nvm install 18
    nvm use 18
    nvm alias default 18
    echo -e "${GREEN}✓ Node.js 설치 완료${NC}"
else
    echo -e "${GREEN}✓ Node.js가 이미 설치되어 있습니다${NC}"
    node -v
fi

# 3. Yarn 설치
echo -e "${YELLOW}3. Yarn 설치 중...${NC}"
if ! command -v yarn &> /dev/null; then
    npm install -g yarn
    echo -e "${GREEN}✓ Yarn 설치 완료${NC}"
else
    echo -e "${GREEN}✓ Yarn이 이미 설치되어 있습니다${NC}"
    yarn -v
fi

# 4. Bundler 설치
echo -e "${YELLOW}4. Bundler 설치 중...${NC}"
gem install bundler
echo -e "${GREEN}✓ Bundler 설치 완료${NC}"

# 5. Ruby 의존성 설치
echo -e "${YELLOW}5. Ruby 의존성 설치 중...${NC}"
bundle install
echo -e "${GREEN}✓ Bundle install 완료${NC}"

# 6. JavaScript 의존성 설치
echo -e "${YELLOW}6. JavaScript 의존성 설치 중...${NC}"
yarn install
echo -e "${GREEN}✓ Yarn install 완료${NC}"

# 7. 데이터베이스 생성
echo -e "${YELLOW}7. 데이터베이스 설정 중...${NC}"
rails db:create
echo -e "${GREEN}✓ 데이터베이스 생성 완료${NC}"

# 8. 마이그레이션 실행
echo -e "${YELLOW}8. 데이터베이스 마이그레이션 중...${NC}"
rails db:migrate
echo -e "${GREEN}✓ 마이그레이션 완료${NC}"

# 9. 시드 데이터 생성 (옵션)
echo -e "${YELLOW}9. 시드 데이터 생성 중...${NC}"
rails db:seed
echo -e "${GREEN}✓ 시드 데이터 생성 완료${NC}"

echo ""
echo -e "${GREEN}=== 설정 완료! ===${NC}"
echo -e "${GREEN}서버를 시작하려면 다음 명령어를 실행하세요:${NC}"
echo -e "${YELLOW}bin/dev${NC}"
echo ""
echo -e "${GREEN}또는 개별적으로 실행:${NC}"
echo -e "${YELLOW}rails server${NC}"
echo ""
echo -e "${GREEN}브라우저에서 http://localhost:3000 으로 접속하세요${NC}"