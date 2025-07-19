#!/bin/bash

echo "=== Ruby 및 Rails 의존성 설치 스크립트 ==="
echo "이 스크립트는 sudo 권한이 필요합니다."
echo ""

# 색상 정의
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 1. 시스템 패키지 업데이트
echo -e "${GREEN}1. 시스템 패키지 업데이트 중...${NC}"
sudo apt-get update

# 2. Ruby 빌드 의존성 설치
echo -e "${GREEN}2. Ruby 빌드 의존성 설치 중...${NC}"
sudo apt-get install -y build-essential libssl-dev libreadline-dev zlib1g-dev libffi-dev libyaml-dev

# 3. PostgreSQL 설치
echo -e "${GREEN}3. PostgreSQL 15 설치 중...${NC}"
sudo apt-get install -y postgresql postgresql-contrib

# 4. Redis 설치
echo -e "${GREEN}4. Redis 설치 중...${NC}"
sudo apt-get install -y redis-server

# 5. Node.js 의존성 설치
echo -e "${GREEN}5. Node.js 의존성 설치 중...${NC}"
sudo apt-get install -y curl

# 6. ImageMagick 설치 (이미지 처리용)
echo -e "${GREEN}6. ImageMagick 설치 중...${NC}"
sudo apt-get install -y imagemagick

# 7. PostgreSQL 사용자 생성
echo -e "${GREEN}7. PostgreSQL 사용자 설정 중...${NC}"
sudo -u postgres createuser -s $(whoami) 2>/dev/null || echo "PostgreSQL 사용자가 이미 존재합니다."

# 8. 서비스 시작
echo -e "${GREEN}8. 서비스 시작 중...${NC}"
sudo systemctl start postgresql
sudo systemctl start redis

echo -e "${GREEN}=== 의존성 설치 완료! ===${NC}"
echo "이제 다음 명령어를 실행하세요:"
echo "rbenv install 3.3.0"