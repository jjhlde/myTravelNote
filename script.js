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

    // 페이지 파일 매핑
    const pageFiles = [
        'pages/info.html',
        'pages/day1.html',
        'pages/day2.html',
        'pages/day3.html',
        'pages/day4.html',
        'pages/budget.html'
    ];

    // 페이지 로드 상태 추적
    const loadedPages = new Set();

    // 페이지 콘텐츠 로드 함수
    async function loadPageContent(pageIndex) {
        if (loadedPages.has(pageIndex)) return;

        const pageElement = document.getElementById(`page-${pageIndex}`);
        if (!pageElement) return;

        try {
            const response = await fetch(pageFiles[pageIndex]);
            if (response.ok) {
                const content = await response.text();
                pageElement.innerHTML = content;
                loadedPages.add(pageIndex);
            } else {
                pageElement.innerHTML = '<div class="error">페이지를 불러올 수 없습니다.</div>';
            }
        } catch (error) {
            pageElement.innerHTML = '<div class="error">페이지 로딩 중 오류가 발생했습니다.</div>';
        }
    }

    // 인접 페이지 미리 로드
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

    // 페이지 업데이트 함수
    async function updatePage(pageIndex) {
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

        // 현재 페이지와 인접 페이지 로드
        await preloadAdjacentPages(currentPage);
        
        // 슬라이더 재초기화
        reinitializeSliders();
    }

    // 초기 페이지 로드
    updatePage(0);

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
        // 사진 영역에서 터치 시작한 경우 페이지 스와이프 방지
        if (e.target.closest('.place-images')) {
            return;
        }
        
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = false;
        isHorizontalSwipe = false;
    });

    pagesWrapper.addEventListener('touchmove', (e) => {
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
    });

    pagesWrapper.addEventListener('touchend', (e) => {
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
                // 모든 페이지 파일도 캐시에 추가
                pageFiles.forEach(file => cache.add(file));
            }).catch(err => {
                // 캐싱 실패해도 앱은 정상 작동
            });
        });
    }

    // 스크롤 시 헤더 애니메이션 제거 (헤더가 고정되지 않으므로)
    // 각 페이지는 독립적으로 스크롤됨
});

// 장소 이미지 슬라이더 기능
let sliderStates = {};

function initSlider(sliderId) {
    if (!sliderStates[sliderId]) {
        sliderStates[sliderId] = {
            currentSlide: 0,
            totalSlides: 0
        };
        
        const slider = document.getElementById(sliderId);
        if (slider) {
            const images = slider.querySelectorAll('.place-images-slider img');
            sliderStates[sliderId].totalSlides = images.length;
        }
    }
}

function showSlide(sliderId, slideIndex) {
    initSlider(sliderId);
    
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    
    const sliderTrack = slider.querySelector('.place-images-slider');
    const dots = slider.querySelectorAll('.place-images-dot');
    const counter = slider.querySelector('.place-images-counter');
    
    const totalSlides = sliderStates[sliderId].totalSlides;
    slideIndex = Math.max(0, Math.min(slideIndex, totalSlides - 1));
    
    sliderStates[sliderId].currentSlide = slideIndex;
    
    // 슬라이더 이동
    sliderTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
    
    // 도트 활성화
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
    
    // 카운터 업데이트
    if (counter) {
        counter.textContent = `${slideIndex + 1}/${totalSlides}`;
    }
}

function nextSlide(sliderId) {
    initSlider(sliderId);
    const currentSlide = sliderStates[sliderId].currentSlide;
    const totalSlides = sliderStates[sliderId].totalSlides;
    
    const nextSlide = currentSlide + 1 >= totalSlides ? 0 : currentSlide + 1;
    showSlide(sliderId, nextSlide);
}

function prevSlide(sliderId) {
    initSlider(sliderId);
    const currentSlide = sliderStates[sliderId].currentSlide;
    const totalSlides = sliderStates[sliderId].totalSlides;
    
    const prevSlide = currentSlide - 1 < 0 ? totalSlides - 1 : currentSlide - 1;
    showSlide(sliderId, prevSlide);
}

// 슬라이더 자동 초기화 (페이지 로드 시)
document.addEventListener('DOMContentLoaded', () => {
    // 즉시 초기화
    initAllSliders();
    
    // 추가 초기화 (페이지 로드 완료 후)
    setTimeout(() => {
        initAllSliders();
    }, 500);
});

// 모든 슬라이더 초기화 함수
function initAllSliders() {
    const sliders = document.querySelectorAll('.place-images');
    sliders.forEach(slider => {
        const sliderId = slider.id;
        if (sliderId) {
            initSlider(sliderId);
            showSlide(sliderId, 0);
        }
    });
}

// 페이지 전환 시 슬라이더 재초기화
function reinitializeSliders() {
    setTimeout(() => {
        initAllSliders();
        // 이미지 팝업 기능 재초기화
        initImagePopup();
    }, 500);
}

// 이미지 팝업 기능
function initImagePopup() {
    const images = document.querySelectorAll('.place-images-slider img');
    
    images.forEach(img => {
        // 기존 이벤트 리스너 제거
        img.removeEventListener('click', handleImageClick);
        // 새로운 이벤트 리스너 추가
        img.addEventListener('click', handleImageClick);
    });
}

function handleImageClick(e) {
    const img = e.target;
    const popupOverlay = document.getElementById('imagePopupOverlay');
    const popupImg = document.getElementById('popupImage');
    const popupTitle = document.getElementById('popupTitle');
    const popupDescription = document.getElementById('popupDescription');
    
    if (popupOverlay && popupImg) {
        popupImg.src = img.src;
        popupImg.alt = img.alt;
        
        // 팝업 정보 설정
        if (popupTitle) popupTitle.textContent = img.alt || '여행 사진';
        if (popupDescription) popupDescription.textContent = '클릭하거나 ESC 키를 눌러 닫기';
        
        popupOverlay.classList.add('show');
        
        // 스크롤 방지
        document.body.style.overflow = 'hidden';
    }
}

// 이미지 팝업 닫기
function closeImagePopup() {
    const popupOverlay = document.getElementById('imagePopupOverlay');
    
    if (popupOverlay) {
        popupOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// 구글맵 연동 함수
function openGoogleMaps(query) {
    const encodedQuery = encodeURIComponent(query);
    const googleMapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;
    window.open(googleMapsUrl, '_blank');
}

// 모든 위치 버튼에 구글맵 연동
function initLocationButtons() {
    const locationButtons = document.querySelectorAll('.map-btn');
    
    locationButtons.forEach(btn => {
        // 기존 href 제거하고 클릭 이벤트로 대체
        const originalHref = btn.getAttribute('href');
        if (originalHref && originalHref.includes('maps.google.com')) {
            btn.removeAttribute('href');
            btn.style.cursor = 'pointer';
            
            // 좌표 추출
            const coordMatch = originalHref.match(/q=([^&]+)/);
            if (coordMatch) {
                const coords = coordMatch[1];
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    openGoogleMaps(coords);
                });
            }
        }
        
        // 텍스트에서 장소명 추출하여 구글맵 연동
        const locationText = btn.textContent.trim().replace('📍', '').trim();
        if (locationText && !btn.hasAttribute('href')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openGoogleMaps(locationText + ' 마카오');
            });
        }
    });
}

// DOM 로드 완료 시 팝업 관련 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 이미지 팝업 초기화
    initImagePopup();
    
    // 위치 버튼 초기화
    initLocationButtons();
    
    // 팝업 닫기 이벤트
    const popupOverlay = document.getElementById('imagePopupOverlay');
    const popupClose = document.getElementById('popupClose');
    
    if (popupClose) {
        popupClose.addEventListener('click', closeImagePopup);
    }
    
    if (popupOverlay) {
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closeImagePopup();
            }
        });
    }
    
    // ESC 키로 팝업 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImagePopup();
        }
    });
});