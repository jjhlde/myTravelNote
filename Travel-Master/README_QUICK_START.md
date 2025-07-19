# 🚀 TripCrafter 빠른 시작 가이드

## 필요한 것
- Windows 10/11 (WSL2 활성화)
- Docker Desktop for Windows

## 설치 및 실행 (3단계)

### 1️⃣ Docker Desktop 설치
1. https://www.docker.com/products/docker-desktop/ 에서 다운로드
2. 설치 후 Docker Desktop 실행
3. 시스템 트레이에 Docker 아이콘이 나타날 때까지 대기

### 2️⃣ WSL2 터미널에서 실행
```bash
cd /home/jjhlde/travel-master/myTravelNote/Travel-Master
./start-app.sh
```

### 3️⃣ 브라우저에서 접속
http://localhost:3000

## 첫 실행 시 예상 시간
- Docker 이미지 빌드: 5-10분
- 데이터베이스 설정: 1-2분
- 총 소요 시간: 약 10-15분

## 사용 방법

### 여행 계획 만들기
1. 홈페이지에서 "새 여행 계획" 클릭
2. 채팅창에 입력: "오사카 3박4일 가족여행 계획해줘"
3. AI가 생성한 여행 계획 확인
4. 개인 PWA 앱 다운로드

### 서버 관리
```bash
# 서버 중지
docker-compose down

# 서버 재시작
./start-app.sh

# 로그 보기
docker-compose logs -f
```

## 문제 해결

### "docker: command not found"
→ Docker Desktop이 실행 중인지 확인하세요

### "port 3000 already in use"
→ 다른 프로그램이 3000번 포트를 사용 중입니다
```bash
# Windows PowerShell에서 확인
netstat -ano | findstr :3000
```

### 페이지가 로드되지 않음
→ 모든 서비스가 시작되었는지 확인
```bash
docker-compose ps
```

## 기타 유용한 명령어

```bash
# Rails 콘솔 (데이터베이스 직접 조작)
docker-compose exec web rails console

# 데이터베이스 초기화
docker-compose exec web rails db:reset

# 컨테이너 쉘 접속
docker-compose exec web bash
```

---

준비되셨나요? 이제 AI 여행 플래너를 사용해보세요! 🎉