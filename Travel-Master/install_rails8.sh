#!/bin/bash

echo "=== Rails 8 설치 스크립트 ==="
echo ""

# PostgreSQL 개발 라이브러리 설치
echo "1. PostgreSQL 개발 라이브러리 설치 중..."
sudo apt-get install -y libpq-dev

# Bundle install
echo "2. Rails 8 의존성 설치 중..."
bundle install

# Yarn install
echo "3. JavaScript 의존성 설치 중..."
yarn install

# 데이터베이스 생성
echo "4. 데이터베이스 생성 중..."
rails db:create

# 마이그레이션
echo "5. 마이그레이션 실행 중..."
rails db:migrate

# 시드 데이터
echo "6. 시드 데이터 생성 중..."
rails db:seed

echo ""
echo "=== Rails 8 설치 완료! ==="
echo "서버 실행: bin/dev 또는 rails server"
echo "브라우저에서 http://localhost:3000 접속"