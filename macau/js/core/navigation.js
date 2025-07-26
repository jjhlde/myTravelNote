/**
 * 페이지 네비게이션 및 스와이프 시스템
 */

import { getElement, getElements, addClass, removeClass, smoothScrollTo } from '../utils/dom-helpers.js';

// 네비게이션 상태
let currentPage = 0;
let startX = 0;
let startY = 0;
let currentX = 0;
let isDragging = false;
let isHorizontalSwipe = false;

// 페이지 파일 매핑
const pageFiles = [
    './macau/pages/info.html',
    './macau/pages/day1.html',
    './macau/pages/day2.html',
    './macau/pages/day3.html',
    './macau/pages/day4.html',
    './macau/pages/budget.html'
];

// 페이지 로드 상태 추적
const loadedPages = new Set();

/**
 * 현재 날짜를 기반으로 초기 페이지 결정
 * @returns {number} 페이지 인덱스 (0: 정보, 1: 1일차, 2: 2일차, 3: 3일차, 4: 4일차)
 */
function getInitialPageByDate() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 0-based이므로 +1
    
    // 7월 기준 (여행 날짜: 7월 28일-31일)
    if (currentMonth === 7) {
        if (currentDay <= 27) {
            // 27일 이전: 정보 탭
            console.log('📅 여행 전 날짜 - 정보 탭으로 이동');
            return 0;
        } else if (currentDay === 28) {
            // 28일: 1일차
            console.log('📅 여행 1일차 - 1일차 탭으로 이동');
            return 1;
        } else if (currentDay === 29) {
            // 29일: 2일차
            console.log('📅 여행 2일차 - 2일차 탭으로 이동');
            return 2;
        } else if (currentDay === 30) {
            // 30일: 3일차
            console.log('📅 여행 3일차 - 3일차 탭으로 이동');
            return 3;
        } else if (currentDay === 31) {
            // 31일: 4일차 (마지막 날)
            console.log('📅 여행 4일차 - 4일차 탭으로 이동');
            return 4;
        }
    }
    
    // 기본값: 정보 탭
    console.log('📅 기본 설정 - 정보 탭으로 이동');
    return 0;
}

// 외부에서 접근 가능한 함수들을 위한 이벤트 핸들러
let onPageChangeCallbacks = [];
let onTodoScriptExecute = null;

/**
 * 페이지 변경 콜백 등록
 * @param {Function} callback - 페이지 변경 시 호출될 함수
 */
export function onPageChange(callback) {
    onPageChangeCallbacks.push(callback);
}

/**
 * Todo 스크립트 실행 함수 등록
 * @param {Function} executor - Todo 스크립트 실행 함수
 */
export function setTodoScriptExecutor(executor) {
    onTodoScriptExecute = executor;
}

/**
 * 현재 페이지 인덱스 반환
 * @returns {number} 현재 페이지 인덱스
 */
export function getCurrentPageIndex() {
    return currentPage;
}

/**
 * 페이지 콘텐츠 로드 함수
 * @param {number} pageIndex - 로드할 페이지 인덱스
 */
async function loadPageContent(pageIndex) {
    if (loadedPages.has(pageIndex)) return;

    const pageElement = document.getElementById(`page-${pageIndex}`);
    if (!pageElement) return;

    try {
        // file:// 프로토콜 감지 및 대응
        if (window.location.protocol === 'file:') {
            pageElement.innerHTML = '<div class="error">정적 파일 모드에서는 페이지를 로드할 수 없습니다.<br>로컬 서버를 실행해주세요. (예: python -m http.server 8000)</div>';
            return;
        }

        const response = await fetch(pageFiles[pageIndex]);
        if (response.ok) {
            const content = await response.text();
            pageElement.innerHTML = content;
            loadedPages.add(pageIndex);
            
            // 예산 페이지(budget.html)가 로드된 경우 스크립트 실행
            if (pageFiles[pageIndex] === './macau/pages/budget.html' && onTodoScriptExecute) {
                onTodoScriptExecute();
            }
        } else {
            pageElement.innerHTML = '<div class="error">페이지를 불러올 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('Page load error:', error);
        pageElement.innerHTML = '<div class="error">페이지 로딩 중 오류가 발생했습니다.<br>로컬 서버를 실행해주세요.</div>';
    }
}

/**
 * 인접 페이지 미리 로드
 * @param {number} pageIndex - 기준 페이지 인덱스
 */
async function preloadAdjacentPages(pageIndex) {
    // 현재 페이지 로드
    await loadPageContent(pageIndex);
    
    // 이전 페이지 미리 로드
    if (pageIndex > 0) {
        loadPageContent(pageIndex - 1);
    }
    
    // 다음 페이지 미리 로드
    if (pageIndex < pageFiles.length - 1) {
        loadPageContent(pageIndex + 1);
    }
}

/**
 * 페이지 업데이트 함수
 * @param {number} pageIndex - 이동할 페이지 인덱스
 */
export async function updatePage(pageIndex) {
    const pagesWrapper = getElement('#pagesWrapper');
    const dayTabs = getElements('.day-tab');
    const indicatorDots = getElements('.indicator-dot');
    
    if (!pagesWrapper) return;
    
    currentPage = Math.max(0, Math.min(5, pageIndex));
    const translateX = -currentPage * (100 / 6);
    pagesWrapper.style.transform = `translateX(${translateX}%)`;
    
    // 탭 활성화
    dayTabs.forEach((tab, index) => {
        if (index === currentPage) {
            addClass(tab, 'active');
        } else {
            removeClass(tab, 'active');
        }
    });
    
    // 인디케이터 업데이트
    indicatorDots.forEach((dot, index) => {
        if (index === currentPage) {
            addClass(dot, 'active');
        } else {
            removeClass(dot, 'active');
        }
    });

    // 현재 페이지와 인접 페이지 로드
    await preloadAdjacentPages(currentPage);
    
    // 페이지 변경 콜백 실행
    onPageChangeCallbacks.forEach(callback => {
        try {
            callback(currentPage);
        } catch (error) {
            console.error('Page change callback error:', error);
        }
    });
}

/**
 * 터치 시작 이벤트 핸들러
 * @param {TouchEvent} e - 터치 이벤트
 */
function handleTouchStart(e) {
    // 사진 영역에서 터치 시작한 경우 페이지 스와이프 방지
    if (e.target.closest('.place-images')) {
        return;
    }
    
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = false;
    isHorizontalSwipe = false;
}

/**
 * 터치 이동 이벤트 핸들러
 * @param {TouchEvent} e - 터치 이벤트
 */
function handleTouchMove(e) {
    // 사진 영역에서 터치 중인 경우 페이지 스와이프 방지
    if (e.target.closest('.place-images')) {
        return;
    }
    
    if (isDragging) {
        currentX = e.touches[0].clientX;
        e.preventDefault(); // 수평 스와이프 시에만 기본 동작 방지
        return;
    }

    const currentY = e.touches[0].clientY;
    currentX = e.touches[0].clientX;
    
    const deltaX = Math.abs(startX - currentX);
    const deltaY = Math.abs(startY - currentY);
    
    // 수평 스와이프인지 수직 스크롤인지 판단
    if (deltaX > deltaY && deltaX > 10) {
        // 수평 스와이프
        isHorizontalSwipe = true;
        isDragging = true;
        e.preventDefault(); // 수평 스와이프 시에만 기본 동작 방지
    } else if (deltaY > 10) {
        // 수직 스크롤 - 기본 동작 허용
        return;
    }
}

/**
 * 터치 종료 이벤트 핸들러
 * @param {TouchEvent} e - 터치 이벤트
 */
function handleTouchEnd(e) {
    // 사진 영역에서 터치 종료한 경우 페이지 스와이프 방지
    if (e.target.closest('.place-images')) {
        return;
    }
    
    if (!isDragging || !isHorizontalSwipe) return;
    isDragging = false;
    isHorizontalSwipe = false;
    
    const deltaX = startX - currentX;
    const threshold = 50;
    
    if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && currentPage < 5) {
            updatePage(currentPage + 1);
        } else if (deltaX < 0 && currentPage > 0) {
            updatePage(currentPage - 1);
        }
    }
}

/**
 * 마우스 드래그 이벤트 핸들러들
 */
let startMouseY = 0;
let isMouseHorizontalDrag = false;

function handleMouseDown(e) {
    const pagesWrapper = getElement('#pagesWrapper');
    if (!pagesWrapper) return;
    
    startX = e.clientX;
    startMouseY = e.clientY;
    isDragging = false;
    isMouseHorizontalDrag = false;
    pagesWrapper.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    if (isDragging && isMouseHorizontalDrag) {
        currentX = e.clientX;
        return;
    }

    if (!isDragging && !isMouseHorizontalDrag) {
        const deltaX = Math.abs(startX - e.clientX);
        const deltaY = Math.abs(startMouseY - e.clientY);
        
        if (deltaX > deltaY && deltaX > 10) {
            isMouseHorizontalDrag = true;
            isDragging = true;
            currentX = e.clientX;
        }
    }
}

function handleMouseUp() {
    const pagesWrapper = getElement('#pagesWrapper');
    if (!pagesWrapper) return;
    
    if (!isDragging || !isMouseHorizontalDrag) {
        pagesWrapper.style.cursor = 'grab';
        return;
    }
    
    isDragging = false;
    isMouseHorizontalDrag = false;
    pagesWrapper.style.cursor = 'grab';
    
    const deltaX = startX - currentX;
    const threshold = 50;
    
    if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && currentPage < 5) {
            updatePage(currentPage + 1);
        } else if (deltaX < 0 && currentPage > 0) {
            updatePage(currentPage - 1);
        }
    }
}

function handleMouseLeave() {
    const pagesWrapper = getElement('#pagesWrapper');
    if (pagesWrapper) {
        isDragging = false;
        pagesWrapper.style.cursor = 'grab';
    }
}

/**
 * 키보드 네비게이션 핸들러
 * @param {KeyboardEvent} e - 키보드 이벤트
 */
function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' && currentPage > 0) {
        updatePage(currentPage - 1);
    } else if (e.key === 'ArrowRight' && currentPage < 5) {
        updatePage(currentPage + 1);
    }
}

/**
 * 스와이프 힌트 표시
 */
function showSwipeHint() {
    const swipeHint = getElement('#swipeHint');
    if (swipeHint) {
        setTimeout(() => {
            addClass(swipeHint, 'show');
            setTimeout(() => {
                removeClass(swipeHint, 'show');
            }, 3000);
        }, 2000);
    }
}

/**
 * 캐시 기능 (ServiceWorker 없이) - HTTP/HTTPS에서만 작동
 */
function initCache() {
    if ('caches' in window && window.location.protocol !== 'file:') {
        window.addEventListener('load', () => {
            caches.open('macau-travel-v1').then(cache => {
                cache.add(window.location.href);
                // 모든 페이지 파일도 캐시에 추가
                pageFiles.forEach(file => cache.add(file));
            }).catch(err => {
                console.log('캐싱 실패:', err);
                // 캐싱 실패해도 앱은 정상 작동
            });
        });
    }
}

/**
 * 네비게이션 시스템 초기화
 */
export function initNavigation() {
    const pagesWrapper = getElement('#pagesWrapper');
    const dayTabs = getElements('.day-tab');
    const indicatorDots = getElements('.indicator-dot');
    
    if (!pagesWrapper) {
        console.error('Pages wrapper not found');
        return;
    }
    
    // 날짜 기반 초기 페이지 설정
    const initialPage = getInitialPageByDate();
    updatePage(initialPage);
    
    // 탭 클릭 이벤트
    dayTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            updatePage(index);
        });
    });
    
    // 인디케이터 클릭 이벤트
    indicatorDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            updatePage(index);
        });
    });
    
    // 터치 이벤트 등록
    pagesWrapper.addEventListener('touchstart', handleTouchStart);
    pagesWrapper.addEventListener('touchmove', handleTouchMove);
    pagesWrapper.addEventListener('touchend', handleTouchEnd);
    
    // 마우스 이벤트 등록
    pagesWrapper.addEventListener('mousedown', handleMouseDown);
    pagesWrapper.addEventListener('mousemove', handleMouseMove);
    pagesWrapper.addEventListener('mouseup', handleMouseUp);
    pagesWrapper.addEventListener('mouseleave', handleMouseLeave);
    
    // 키보드 네비게이션
    document.addEventListener('keydown', handleKeyDown);
    
    // 스와이프 힌트 표시
    showSwipeHint();
    
    // 캐시 초기화
    initCache();
    
    console.log('Navigation system initialized');
}

/**
 * 네비게이션 시스템 정리
 */
export function destroyNavigation() {
    const pagesWrapper = getElement('#pagesWrapper');
    
    if (pagesWrapper) {
        pagesWrapper.removeEventListener('touchstart', handleTouchStart);
        pagesWrapper.removeEventListener('touchmove', handleTouchMove);
        pagesWrapper.removeEventListener('touchend', handleTouchEnd);
        pagesWrapper.removeEventListener('mousedown', handleMouseDown);
        pagesWrapper.removeEventListener('mousemove', handleMouseMove);
        pagesWrapper.removeEventListener('mouseup', handleMouseUp);
        pagesWrapper.removeEventListener('mouseleave', handleMouseLeave);
    }
    
    document.removeEventListener('keydown', handleKeyDown);
    
    // 콜백 초기화
    onPageChangeCallbacks = [];
    onTodoScriptExecute = null;
    
    console.log('Navigation system destroyed');
}
