// PWA 설치 가이드 팝업 관리
document.addEventListener('DOMContentLoaded', () => {
    const installGuideOverlay = document.getElementById('installGuideOverlay');
    const closeGuideBtn = document.getElementById('closeGuideBtn');
    const installNowBtn = document.getElementById('installNowBtn');
    const skipInstallBtn = document.getElementById('skipInstallBtn');

    // 팝업 표시 여부 확인 (localStorage 사용)
    const hasSeenInstallGuide = localStorage.getItem('macau-install-guide-seen');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;

    // 모든 브라우저에서 첫 방문 시 팝업 표시 (테스트용)
    if (!isInStandaloneMode && !hasSeenInstallGuide) {
        setTimeout(() => {
            installGuideOverlay.classList.add('show');
        }, 1000);
    }

    // 닫기 버튼 클릭
    closeGuideBtn.addEventListener('click', () => {
        hideInstallGuide();
    });

    // 나중에 버튼 클릭
    skipInstallBtn.addEventListener('click', () => {
        hideInstallGuide();
    });

    // 지금 설치하기 버튼 클릭
    installNowBtn.addEventListener('click', () => {
        hideInstallGuide();
        if (isIOS) {
            alert('📱 하단의 공유 버튼을 눌러 "홈 화면에 추가"를 선택해주세요!');
        } else {
            alert('📱 브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요!');
        }
    });

    // 배경 클릭으로 닫기
    installGuideOverlay.addEventListener('click', (e) => {
        if (e.target === installGuideOverlay) {
            hideInstallGuide();
        }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && installGuideOverlay.classList.contains('show')) {
            hideInstallGuide();
        }
    });

    function hideInstallGuide() {
        installGuideOverlay.classList.remove('show');
        localStorage.setItem('macau-install-guide-seen', 'true');
    }

    // Android Chrome PWA 설치 (기존 기능 유지)
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    // Android용 자동 설치 기능
    if (!isIOS) {
        installNowBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                hideInstallGuide();
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
            }
        });
    }

    // 스와이프 및 탭 네비게이션 기능
    const pagesWrapper = document.getElementById('pagesWrapper');
    const dayTabs = document.querySelectorAll('.day-tab');
    const indicatorDots = document.querySelectorAll('.indicator-dot');
    const swipeHint = document.getElementById('swipeHint');
    
    let currentPage = 0;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;
    let isHorizontalSwipe = false;

    // 페이지 업데이트 함수
    function updatePage(pageIndex) {
        currentPage = Math.max(0, Math.min(5, pageIndex));
        const translateX = -currentPage * (100 / 6);
        pagesWrapper.style.transform = `translateX(${translateX}%)`;
        
        // 탭 활성화
        dayTabs.forEach((tab, index) => {
            tab.classList.toggle('active', index === currentPage);
        });
        
        // 인디케이터 업데이트
        indicatorDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPage);
        });
    }

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

    // 스와이프 이벤트 (터치) - 세로 스크롤과 충돌 방지
    pagesWrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = false;
        isHorizontalSwipe = false;
    });

    pagesWrapper.addEventListener('touchmove', (e) => {
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
    });

    pagesWrapper.addEventListener('touchend', () => {
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
    });

    // 마우스 드래그 이벤트 (데스크톱) - 개선된 버전
    let startMouseY = 0;
    let isMouseHorizontalDrag = false;

    pagesWrapper.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startMouseY = e.clientY;
        isDragging = false;
        isMouseHorizontalDrag = false;
        pagesWrapper.style.cursor = 'grabbing';
    });

    pagesWrapper.addEventListener('mousemove', (e) => {
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
    });

    pagesWrapper.addEventListener('mouseup', () => {
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
    });

    pagesWrapper.addEventListener('mouseleave', () => {
        isDragging = false;
        pagesWrapper.style.cursor = 'grab';
    });

    // 키보드 네비게이션
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentPage > 0) {
            updatePage(currentPage - 1);
        } else if (e.key === 'ArrowRight' && currentPage < 5) {
            updatePage(currentPage + 1);
        }
    });

    // 스와이프 힌트 표시 (3초 후 사라짐)
    setTimeout(() => {
        swipeHint.classList.add('show');
        setTimeout(() => {
            swipeHint.classList.remove('show');
        }, 3000);
    }, 2000);

    // 간단한 캐시 기능 (ServiceWorker 없이)
    if ('caches' in window) {
        window.addEventListener('load', () => {
            caches.open('macau-travel-v1').then(cache => {
                cache.add(window.location.href);
            }).catch(err => {
                // 캐싱 실패해도 앱은 정상 작동
            });
        });
    }

    // 스크롤 시 헤더 애니메이션 제거 (헤더가 고정되지 않으므로)
    // 각 페이지는 독립적으로 스크롤됨
});
