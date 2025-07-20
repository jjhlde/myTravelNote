/**
 * 마카오 가족여행 샘플 앱 - pages/ 폴더 HTML 동적 로딩
 */

class MacaoTravelApp {
    constructor() {
        this.currentPage = 0;
        this.totalPages = 6;
        this.pageFiles = [
            'pages/info.html',
            'pages/day1.html', 
            'pages/day2.html',
            'pages/day3.html',
            'pages/day4.html',
            'pages/budget.html'
        ];
        
        this.init();
    }

    async init() {
        await this.loadPage(0); // 첫 페이지 로드
        this.setupEventListeners();
        this.showSwipeHint();
    }

    async loadPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.totalPages) return;

        const pageElement = document.getElementById(`page-${pageIndex}`);
        if (!pageElement) return;

        try {
            console.log(`Loading page: ${this.pageFiles[pageIndex]}`);
            const response = await fetch(this.pageFiles[pageIndex]);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            pageElement.innerHTML = html;
            
            console.log(`✅ Page ${pageIndex} loaded successfully`);
        } catch (error) {
            console.error(`❌ Failed to load page ${pageIndex}:`, error);
            pageElement.innerHTML = `
                <div class="error-message">
                    <h3>페이지를 불러올 수 없습니다</h3>
                    <p>파일: ${this.pageFiles[pageIndex]}</p>
                    <p>오류: ${error.message}</p>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // 탭 클릭 이벤트
        const tabs = document.querySelectorAll('.day-tab');
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                this.switchToPage(index);
            });
        });

        // 인디케이터 클릭 이벤트
        const indicators = document.querySelectorAll('.indicator-dot');
        indicators.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.switchToPage(index);
            });
        });

        // 터치/스와이프 이벤트
        this.setupSwipeEvents();

        // PWA 설치 가이드 이벤트
        this.setupInstallGuide();
    }

    async switchToPage(pageIndex) {
        if (pageIndex === this.currentPage) return;

        // 페이지가 로드되지 않았다면 로드
        const pageElement = document.getElementById(`page-${pageIndex}`);
        if (pageElement && pageElement.querySelector('.loading')) {
            await this.loadPage(pageIndex);
        }

        this.currentPage = pageIndex;
        this.updateUI();
    }

    updateUI() {
        // 페이지 위치 업데이트
        const wrapper = document.getElementById('pagesWrapper');
        if (wrapper) {
            wrapper.style.transform = `translateX(-${this.currentPage * 100}%)`;
        }

        // 탭 활성화 상태 업데이트
        const tabs = document.querySelectorAll('.day-tab');
        tabs.forEach((tab, index) => {
            tab.classList.toggle('active', index === this.currentPage);
        });

        // 인디케이터 활성화 상태 업데이트
        const indicators = document.querySelectorAll('.indicator-dot');
        indicators.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentPage);
        });
    }

    setupSwipeEvents() {
        const wrapper = document.getElementById('pagesWrapper');
        if (!wrapper) return;

        let startX = 0;
        let startY = 0;
        let isDragging = false;

        // 터치 시작
        wrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
        });

        // 터치 이동
        wrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
        });

        // 터치 끝
        wrapper.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = startX - endX;
            const deltaY = startY - endY;

            // 수직 스크롤이 더 큰 경우 무시
            if (Math.abs(deltaY) > Math.abs(deltaX)) return;

            // 최소 스와이프 거리
            if (Math.abs(deltaX) < 50) return;

            if (deltaX > 0 && this.currentPage < this.totalPages - 1) {
                // 왼쪽으로 스와이프 (다음 페이지)
                this.switchToPage(this.currentPage + 1);
            } else if (deltaX < 0 && this.currentPage > 0) {
                // 오른쪽으로 스와이프 (이전 페이지)
                this.switchToPage(this.currentPage - 1);
            }
        });

        // 마우스 이벤트 (데스크톱)
        let mouseStartX = 0;
        let isMouseDragging = false;

        wrapper.addEventListener('mousedown', (e) => {
            mouseStartX = e.clientX;
            isMouseDragging = true;
            e.preventDefault();
        });

        wrapper.addEventListener('mousemove', (e) => {
            if (!isMouseDragging) return;
            e.preventDefault();
        });

        wrapper.addEventListener('mouseup', (e) => {
            if (!isMouseDragging) return;
            isMouseDragging = false;

            const deltaX = mouseStartX - e.clientX;
            if (Math.abs(deltaX) < 50) return;

            if (deltaX > 0 && this.currentPage < this.totalPages - 1) {
                this.switchToPage(this.currentPage + 1);
            } else if (deltaX < 0 && this.currentPage > 0) {
                this.switchToPage(this.currentPage - 1);
            }
        });

        // 마우스가 영역을 벗어날 때
        wrapper.addEventListener('mouseleave', () => {
            isMouseDragging = false;
        });
    }

    setupInstallGuide() {
        const overlay = document.getElementById('installGuideOverlay');
        const closeBtn = document.getElementById('closeGuideBtn');
        const skipBtn = document.getElementById('skipInstallBtn');
        const installBtn = document.getElementById('installNowBtn');

        if (!overlay) return;

        // 앱 로드 3초 후 설치 가이드 표시
        setTimeout(() => {
            overlay.style.display = 'flex';
        }, 3000);

        // 닫기 버튼
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
        }

        // 나중에 버튼
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
        }

        // 설치하기 버튼
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                overlay.style.display = 'none';
                alert('브라우저의 공유 버튼(⬆️)을 터치한 후 "홈 화면에 추가"를 선택하세요!');
            });
        }

        // 오버레이 클릭시 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    }

    showSwipeHint() {
        const hint = document.getElementById('swipeHint');
        if (hint) {
            hint.style.display = 'block';
            setTimeout(() => {
                hint.style.display = 'none';
            }, 4000);
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🇲🇴 마카오 가족여행 앱 시작');
    new MacaoTravelApp();
});

// Service Worker 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('✅ SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('❌ SW registration failed: ', registrationError);
            });
    });
}