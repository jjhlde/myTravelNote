#!/bin/bash

echo "=== PostgreSQL 개발 라이브러리 설치 ==="
echo ""

# PostgreSQL 개발 라이브러리 설치
echo "PostgreSQL 개발 패키지 설치 중..."
sudo apt-get update
sudo apt-get install -y libpq-dev

echo ""
echo "=== 설치 완료! ==="
echo "이제 bundle install을 실행할 수 있습니다."