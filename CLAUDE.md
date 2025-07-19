# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

마카오 가족여행(3박4일)을 위한 PWA(Progressive Web App) 여행 계획 관리 앱입니다.
- **목적**: 37개월 딸과 함께하는 마카오 여행 일정 관리
- **형태**: 모바일 최적화된 단일 페이지 애플리케이션
- **주요 특징**: 오프라인 사용 가능, 홈 화면 앱 설치 지원

## 기술 스택 & 아키텍처

### 기술 스택
- **Frontend**: 순수 HTML/CSS/JavaScript (프레임워크 없음)
- **PWA**: Service Worker, Web App Manifest
- **스토리지**: LocalStorage
- **지도**: Google Maps API 연동

### 아키텍처 특징
- **SPA 구조**: 단일 HTML 파일에서 동적 페이지 로딩
- **모듈화**: 일차별 여행 일정을 별도 HTML 파일로 분리
- **반응형**: 모바일 퍼스트 디자인
- **PWA**: 오프라인 캐싱 및 앱 설치 지원

## 파일 구조

```
myTravelNote/
├── index.html          # 메인 HTML 파일
├── script.js           # 메인 애플리케이션 로직
├── styles.css          # CSS 스타일시트
├── sw.js              # Service Worker (오프라인 캐싱)
├── manifest.json      # PWA 매니페스트
├── pages/             # 일차별 여행 일정 HTML 파일들
│   ├── info.html      # 여행 정보
│   ├── day1.html      # 1일차 일정
│   ├── day2.html      # 2일차 일정
│   ├── day3.html      # 3일차 일정
│   ├── day4.html      # 4일차 일정
│   └── budget.html    # 예산 정보
└── images/            # 여행지 사진들 (일차별 정리)
```

## 주요 컴포넌트

### script.js (메인 애플리케이션 로직)
- **PWA 설치 가이드**: 사용자에게 홈 화면 설치 안내
- **페이지 네비게이션**: 탭 클릭 및 스와이프 제스처 지원
- **동적 페이지 로딩**: `pages/` 폴더의 HTML 파일들을 동적으로 로드
- **이미지 갤러리**: 슬라이더와 팝업 기능
- **LocalStorage**: 설정 및 사용자 선택 저장

### sw.js (Service Worker)
- **오프라인 캐싱**: 정적 파일들을 캐시하여 오프라인 사용 지원
- **캐시 전략**: Cache First 전략 사용

### pages/*.html 파일들
- **구조**: 각 페이지는 독립적인 HTML 컨텐츠
- **이미지 슬라이더**: 각 장소별 사진 갤러리 포함
- **구글 맵스 링크**: 각 장소의 위치 정보 연결

## 개발 명령어

### 테스트 및 개발
```bash
# 로컬 테스트 - 브라우저에서 직접 열기
open index.html

# 또는 로컬 서버 실행 (PWA 기능 테스트용)
python -m http.server 8000
# 또는
npx serve .
```

### 빌드 및 배포
- **빌드**: 별도 빌드 과정 불필요 (정적 파일)
- **배포**: 정적 파일 호스팅 서비스 이용 (GitHub Pages, Netlify 등)

### 사용 가능한 npm 스크립트
```bash
npm run update-places  # 장소 정보 업데이트 (스크립트 파일 누락)
```

## 주요 기능

### PWA 기능
- **앱 설치**: 홈 화면에 앱으로 설치 가능
- **오프라인 사용**: Service Worker를 통한 캐싱
- **설치 가이드**: 사용자에게 앱 설치 방법 안내

### 네비게이션
- **탭 네비게이션**: 상단 탭으로 일차별 이동
- **스와이프 제스처**: 좌우 스와이프로 페이지 이동
- **페이지 인디케이터**: 현재 페이지 표시

### 이미지 기능
- **이미지 슬라이더**: 각 장소별 사진 갤러리
- **이미지 팝업**: 사진 클릭 시 확대 보기
- **자동 슬라이드**: 터치/클릭으로 사진 이동

### 위치 정보
- **구글 맵스 연동**: 각 장소의 위치 정보 제공
- **리뷰 정보**: 각 장소별 평점 및 리뷰 표시

## 개발 시 주의사항

### 이미지 처리
- 이미지는 `images/` 폴더에 일차별로 정리
- 파일명 규칙: `day{N}_{장소명}_{번호}.png`
- 이미지 최적화를 위해 적절한 크기로 리사이징 필요
- 파일명은 반드시 영어로 작성

### PWA 개발
- Service Worker는 HTTPS 환경에서만 동작
- 로컬 테스트 시 `localhost`에서 실행 필요

### 모바일 최적화
- 터치 제스처 및 스와이프 기능 고려
- 작은 화면에서의 가독성 확보
- 버튼 크기 및 간격 조정

## Git 워크플로

### 중요 규칙
**코드 수정 후에는 반드시 git commit, push 해주세요.**

### 일반적인 워크플로
```bash
git add .
git commit -m "feature: 새로운 기능 추가"
git push origin main
```
