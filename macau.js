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
        'macau_todo.html'
    ];

    // 페이지 로드 상태 추적
    const loadedPages = new Set();

    // 페이지 콘텐츠 로드 함수
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
                
                // 준비물 페이지(macau_todo.html)가 로드된 경우 스크립트 실행
                if (pageFiles[pageIndex] === 'macau_todo.html') {
                    executeTodoScript();
                }
            } else {
                pageElement.innerHTML = '<div class="error">페이지를 불러올 수 없습니다.</div>';
            }
        } catch (error) {
            console.error('Page load error:', error);
            pageElement.innerHTML = '<div class="error">페이지 로딩 중 오류가 발생했습니다.<br>로컬 서버를 실행해주세요.</div>';
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

    // 간단한 캐시 기능 (ServiceWorker 없이) - HTTP/HTTPS에서만 작동
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

// 준비물 페이지 스크립트 실행 함수
function executeTodoScript() {
    console.log('Todo script execution started');
    
    const userCategoriesContainer = document.getElementById('macau-user-categories');
    const newTodoInput = document.getElementById('macau-new-todo-item');
    const addTodoBtn = document.getElementById('macau-add-todo-btn');
    const newCategoryInput = document.getElementById('macau-new-category-name');
    const addCategoryBtn = document.getElementById('macau-add-category-btn');
    
    // 점 세개 버튼이 있는지 확인
    setTimeout(() => {
        const menuButtons = document.querySelectorAll('.macau-todo-menu-btn');
        console.log('Found menu buttons:', menuButtons.length);
        menuButtons.forEach((btn, index) => {
            console.log(`Button ${index}:`, btn, 'Text:', btn.dataset.text);
        });
    }, 500);

    // 사용자 추가 카테고리 관리
    let userCategories = JSON.parse(localStorage.getItem('macao_todo_categories') || '{"기타": []}');

    // 체크박스 상태 저장
    function saveCheckboxStates() {
        const checkboxes = document.querySelectorAll('.macau-todo-checkbox');
        const states = {};
        checkboxes.forEach((checkbox, index) => {
            const todoItem = checkbox.closest('.macau-todo-item');
            const todoText = todoItem.querySelector('.macau-todo-text').textContent;
            states[todoText] = checkbox.checked;
            
            // 완료 상태 시각적 표시
            if (checkbox.checked) {
                todoItem.classList.add('completed');
            } else {
                todoItem.classList.remove('completed');
            }
        });
        localStorage.setItem('macao_todo_states', JSON.stringify(states));
    }

    // 기본 준비물 텍스트 저장
    function saveBasicItemTexts() {
        const basicTexts = {};
        document.querySelectorAll('.macau-todo-category .macau-todo-item .macau-todo-text').forEach((textElement, index) => {
            const originalTexts = [
                '여권 및 항공편 티켓', '숙소 바우처 출력 또는 저장', '마카오 파타카 환전', '해외 데이터 로밍 또는 유심',
                '날씨에 맞는 옷차림 (여름옷, 우산)', '편한 신발 (많이 걸을 예정)', '개인 세면용품', '상비약 (두통약, 소화제 등)',
                '기저귀, 물티슈, 휴대용 변기 커버', '아이 전용 상비약 (해열제, 체온계, 밴드)', '아이가 좋아하는 간식과 장난감', '유모차 또는 아기띠',
                '스마트폰 충전기', '보조배터리', '카메라 (또는 스마트폰으로 대체)', '멀티 어댑터 (해외용 플러그)',
                '자외선 차단제 (강한 햇볕 대비)', '수영복 및 수건 (리조트 데크)', '우산 또는 우비 (우기 대비)'
            ];
            if (index < originalTexts.length) {
                basicTexts[originalTexts[index]] = textElement.textContent;
            }
        });
        localStorage.setItem('macao_basic_texts', JSON.stringify(basicTexts));
    }

    // 기본 준비물 텍스트 복원
    function restoreBasicItemTexts() {
        const basicTexts = JSON.parse(localStorage.getItem('macao_basic_texts') || '{}');
        document.querySelectorAll('.macau-todo-category .macau-todo-item .macau-todo-text').forEach((textElement, index) => {
            const originalTexts = [
                '여권 및 항공편 티켓', '숙소 바우처 출력 또는 저장', '마카오 파타카 환전', '해외 데이터 로밍 또는 유심',
                '날씨에 맞는 옷차림 (여름옷, 우산)', '편한 신발 (많이 걸을 예정)', '개인 세면용품', '상비약 (두통약, 소화제 등)',
                '기저귀, 물티슈, 휴대용 변기 커버', '아이 전용 상비약 (해열제, 체온계, 밴드)', '아이가 좋아하는 간식과 장난감', '유모차 또는 아기띠',
                '스마트폰 충전기', '보조배터리', '카메라 (또는 스마트폰으로 대체)', '멀티 어댑터 (해외용 플러그)',
                '자외선 차단제 (강한 햇볕 대비)', '수영복 및 수건 (리조트 데크)', '우산 또는 우비 (우기 대비)'
            ];
            if (index < originalTexts.length && basicTexts[originalTexts[index]]) {
                textElement.textContent = basicTexts[originalTexts[index]];
            }
        });
    }

    // 삭제된 기본 준비물 복원
    function restoreDeletedBasicItems() {
        const deletedItems = JSON.parse(localStorage.getItem('macao_deleted_basic_items') || '[]');
        deletedItems.forEach(deletedText => {
            // 해당 텍스트를 가진 항목을 찾아서 숨기기
            const todoItems = document.querySelectorAll('.macau-todo-item');
            todoItems.forEach(item => {
                const textElement = item.querySelector('.macau-todo-text');
                if (textElement && textElement.textContent === deletedText) {
                    item.style.display = 'none';
                }
            });
        });
    }

    // 체크박스 상태 복원
    function restoreCheckboxStates() {
        const states = JSON.parse(localStorage.getItem('macao_todo_states') || '{}');
        const checkboxes = document.querySelectorAll('.macau-todo-checkbox');
        checkboxes.forEach(checkbox => {
            const todoItem = checkbox.closest('.macau-todo-item');
            const todoText = todoItem.querySelector('.macau-todo-text').textContent;
            if (states[todoText] !== undefined) {
                checkbox.checked = states[todoText];
                if (checkbox.checked) {
                    todoItem.classList.add('completed');
                }
            }
        });
    }

    // 새 준비물 추가
    addTodoBtn?.addEventListener('click', () => {
        if (newTodoInput.value.trim()) {
            if (!userCategories['기타']) {
                userCategories['기타'] = [];
            }
            userCategories['기타'].push({
                text: newTodoInput.value.trim(),
                done: false,
                id: Date.now()
            });
            localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
            renderUserCategories();
            newTodoInput.value = '';
        }
    });

    // 새 카테고리 추가
    addCategoryBtn?.addEventListener('click', () => {
        if (newCategoryInput.value.trim()) {
            const categoryName = newCategoryInput.value.trim();
            if (!userCategories[categoryName]) {
                userCategories[categoryName] = [];
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                renderUserCategories();
                newCategoryInput.value = '';
            }
        }
    });

    // 사용자 카테고리 렌더링
    function renderUserCategories() {
        if (!userCategoriesContainer) return;
        
        userCategoriesContainer.innerHTML = Object.keys(userCategories).map(categoryName => `
            <div class="tips-section macau-user-category" data-category="${categoryName}">
                <div class="macau-category-header">
                    <div class="tips-title">📝 ${categoryName}</div>
                    <div class="macau-category-actions">
                        <button class="macau-action-btn delete macau-delete-category-btn" data-category="${categoryName}">삭제</button>
                    </div>
                </div>
                <div class="macau-todo-category">
                    ${userCategories[categoryName].map(item => `
                        <div class="macau-todo-item ${item.done ? 'completed' : ''}" data-id="${item.id}">
                            <label class="macau-todo-label">
                                <input type="checkbox" class="macau-todo-checkbox" ${item.done ? 'checked' : ''}>
                                <span class="macau-todo-text">${item.text}</span>
                            </label>
                            <div class="macau-todo-menu-wrapper">
                                <button class="macau-todo-menu-btn" data-category="${categoryName}" data-id="${item.id}">⋯</button>
                                <div class="macau-todo-menu-dropdown" data-category="${categoryName}" data-id="${item.id}">
                                    <div class="macau-menu-item macau-edit-todo-btn" data-category="${categoryName}" data-id="${item.id}">✏️ 수정</div>
                                    <div class="macau-menu-item macau-delete-todo-btn" data-category="${categoryName}" data-id="${item.id}">🗑️ 삭제</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    <div class="macau-add-todo-section">
                        <input type="text" placeholder="이 카테고리에 항목 추가" class="macau-todo-input macau-category-item-input" data-category="${categoryName}">
                        <button class="macau-add-btn macau-add-to-category-btn" data-category="${categoryName}">추가</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 메뉴 토글 함수
    function toggleMenu(menuBtn) {
        console.log('toggleMenu called with:', menuBtn);
        const dropdown = menuBtn.nextElementSibling;
        console.log('dropdown found:', dropdown);
        const isOpen = dropdown.classList.contains('show');
        console.log('dropdown is open:', isOpen);
        
        // 모든 메뉴 닫기
        document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
            menu.classList.remove('show');
        });
        
        // 클릭한 메뉴만 토글
        if (!isOpen) {
            console.log('Adding show class to dropdown');
            dropdown.classList.add('show');
        }
    }

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.macau-todo-menu-wrapper')) {
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // 모든 클릭 이벤트 디버깅
    document.addEventListener('click', (e) => {
        console.log('Click detected on:', e.target, 'Classes:', e.target.className);
    });

    // 이벤트 위임으로 동적 버튼 처리
    document.addEventListener('click', (e) => {
        // 점 세개 메뉴 버튼 클릭
        if (e.target.classList.contains('macau-todo-menu-btn')) {
            e.stopPropagation();
            console.log('Menu button clicked:', e.target);
            toggleMenu(e.target);
            return;
        }
        
        // 카테고리별 항목 추가
        if (e.target.classList.contains('macau-add-to-category-btn')) {
            const categoryName = e.target.dataset.category;
            const input = document.querySelector(`.macau-category-item-input[data-category="${categoryName}"]`);
            if (input && input.value.trim()) {
                userCategories[categoryName].push({
                    text: input.value.trim(),
                    done: false,
                    id: Date.now()
                });
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                renderUserCategories();
                restoreCheckboxStates();
                input.value = '';
            }
        }

        // 준비물 삭제
        if (e.target.classList.contains('macau-delete-todo-btn')) {
            const categoryName = e.target.dataset.category;
            const itemId = parseInt(e.target.dataset.id);
            
            // 메뉴 닫기
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
            
            if (confirm('이 항목을 삭제하시겠습니까?')) {
                userCategories[categoryName] = userCategories[categoryName].filter(item => item.id !== itemId);
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                renderUserCategories();
                restoreCheckboxStates();
            }
        }

        // 준비물 편집
        if (e.target.classList.contains('macau-edit-todo-btn')) {
            const categoryName = e.target.dataset.category;
            const itemId = parseInt(e.target.dataset.id);
            const item = userCategories[categoryName].find(item => item.id === itemId);
            
            // 메뉴 닫기
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
            
            const newText = prompt('항목 수정:', item.text);
            if (newText && newText.trim()) {
                item.text = newText.trim();
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                renderUserCategories();
                restoreCheckboxStates();
            }
        }

        // 카테고리 삭제
        if (e.target.classList.contains('macau-delete-category-btn')) {
            const categoryName = e.target.dataset.category;
            if (confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
                delete userCategories[categoryName];
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                renderUserCategories();
            }
        }

        // 기본 준비물 수정 기능
        if (e.target.classList.contains('macau-edit-basic-btn')) {
            const text = e.target.dataset.text;
            
            // 메뉴 닫기
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
            
            const newText = prompt('항목 수정:', text);
            if (newText && newText.trim()) {
                // 해당 텍스트 요소 찾아서 업데이트
                const textElement = e.target.closest('.macau-todo-item').querySelector('.macau-todo-text');
                textElement.textContent = newText.trim();
                
                // 버튼의 data-text도 업데이트
                const menuBtn = e.target.closest('.macau-todo-menu-wrapper').querySelector('.macau-todo-menu-btn');
                menuBtn.dataset.text = newText.trim();
                e.target.dataset.text = newText.trim();
                
                // 같은 드롭다운의 삭제 버튼도 업데이트
                const deleteBtn = e.target.parentElement.querySelector('.macau-delete-basic-btn');
                if (deleteBtn) {
                    deleteBtn.dataset.text = newText.trim();
                }
                
                // 기본 준비물 텍스트와 체크박스 상태 저장
                saveBasicItemTexts();
                saveCheckboxStates();
            }
        }

        // 기본 준비물 삭제 기능
        if (e.target.classList.contains('macau-delete-basic-btn')) {
            const text = e.target.dataset.text;
            
            // 메뉴 닫기
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
            
            if (confirm(`"${text}" 항목을 삭제하시겠습니까?`)) {
                // 해당 todo-item 전체를 숨김 처리
                const todoItemElement = e.target.closest('.macau-todo-item');
                todoItemElement.style.display = 'none';
                
                // 삭제된 항목 리스트에 추가하여 영구 저장
                let deletedItems = JSON.parse(localStorage.getItem('macao_deleted_basic_items') || '[]');
                if (!deletedItems.includes(text)) {
                    deletedItems.push(text);
                    localStorage.setItem('macao_deleted_basic_items', JSON.stringify(deletedItems));
                }
                
                // 체크박스 상태도 업데이트
                saveCheckboxStates();
            }
        }
    });

    // 체크박스 상태 변경 감지
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('macau-todo-checkbox')) {
            saveCheckboxStates();
            
            // 사용자 추가 항목의 체크박스 상태도 저장
            if (e.target.closest('#macau-user-categories')) {
                const itemElement = e.target.closest('[data-id]');
                if (itemElement) {
                    const categoryElement = e.target.closest('[data-category]');
                    const categoryName = categoryElement.dataset.category;
                    const itemId = parseInt(itemElement.dataset.id);
                    const item = userCategories[categoryName].find(item => item.id === itemId);
                    if (item) {
                        item.done = e.target.checked;
                        localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                    }
                }
            }
        }
    });

    // Enter 키로 항목 추가
    newTodoInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodoBtn.click();
        }
    });

    newCategoryInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCategoryBtn.click();
        }
    });

    // 카테고리별 입력창에서 Enter 키
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('macau-category-item-input')) {
            const categoryButton = e.target.nextElementSibling;
            if (categoryButton) {
                categoryButton.click();
            }
        }
    });

    // 초기 로드
    renderUserCategories();
    restoreBasicItemTexts(); // 기본 준비물 텍스트 복원
    setTimeout(() => {
        restoreDeletedBasicItems(); // 삭제된 기본 준비물 복원
        restoreCheckboxStates();
    }, 100);
    
    console.log('Todo script execution completed');
}

// 환율 계산기 기능
document.addEventListener('DOMContentLoaded', () => {
    const exchangeRateBtn = document.getElementById('exchangeRateBtn');
    const exchangePopupOverlay = document.getElementById('exchangePopupOverlay');
    const exchangePopupClose = document.getElementById('exchangePopupClose');
    const mopInput = document.getElementById('mopInput');
    const krwOutput = document.getElementById('krwOutput');
    const shortcutBtns = document.querySelectorAll('.shortcut-btn');
    const currentRateElement = document.getElementById('currentRate');
    const rateDateElement = document.getElementById('rateDate');

    // 환율 변수 (실시간으로 업데이트됨)
    let MOP_TO_KRW_RATE = 170; // 기본값

    // 실시간 환율 가져오기
    async function fetchExchangeRate() {
        try {
            // ExchangeRate-API 사용 (무료, CORS 지원)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/MOP');
            const data = await response.json();
            
            if (data && data.rates && data.rates.KRW) {
                MOP_TO_KRW_RATE = data.rates.KRW;
                currentRateElement.textContent = `1 MOP = ${MOP_TO_KRW_RATE.toFixed(2)} KRW`;
                rateDateElement.textContent = `${new Date().toLocaleDateString('ko-KR')} 업데이트`;
                console.log('환율 업데이트 성공:', MOP_TO_KRW_RATE);
            } else {
                throw new Error('환율 데이터 없음');
            }
        } catch (error) {
            console.log('환율 API 오류, 백업 환율 사용:', error);
            // 백업: 간접 계산 (USD 기준)
            try {
                const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const usdData = await usdResponse.json();
                
                if (usdData && usdData.rates && usdData.rates.MOP && usdData.rates.KRW) {
                    MOP_TO_KRW_RATE = usdData.rates.KRW / usdData.rates.MOP;
                    currentRateElement.textContent = `1 MOP = ${MOP_TO_KRW_RATE.toFixed(2)} KRW`;
                    rateDateElement.textContent = `${new Date().toLocaleDateString('ko-KR')} 업데이트`;
                    console.log('백업 환율 업데이트 성공:', MOP_TO_KRW_RATE);
                } else {
                    throw new Error('백업 환율 데이터 없음');
                }
            } catch (backupError) {
                console.log('백업 환율도 실패, 기본값 사용:', backupError);
                currentRateElement.textContent = `1 MOP = ${MOP_TO_KRW_RATE} KRW (기본값)`;
                rateDateElement.textContent = '환율 업데이트 실패 - 기본값 사용';
            }
        }
    }

    // 페이지 로드 시 환율 가져오기
    fetchExchangeRate();

    // 환율 계산기 팝업 열기
    exchangeRateBtn?.addEventListener('click', () => {
        exchangePopupOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        // 팝업 열 때마다 최신 환율 가져오기
        fetchExchangeRate();
        // 포커스를 입력 필드로 이동 (약간의 딜레이 후)
        setTimeout(() => {
            mopInput.focus();
        }, 300);
    });

    // 환율 계산기 팝업 닫기
    function closeExchangePopup() {
        exchangePopupOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    exchangePopupClose?.addEventListener('click', closeExchangePopup);

    // 배경 클릭으로 닫기
    exchangePopupOverlay?.addEventListener('click', (e) => {
        if (e.target === exchangePopupOverlay) {
            closeExchangePopup();
        }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && exchangePopupOverlay.classList.contains('show')) {
            closeExchangePopup();
        }
    });

    // 환율 계산 함수
    function calculateExchange(mopAmount) {
        const krwAmount = mopAmount * MOP_TO_KRW_RATE;
        return Math.round(krwAmount);
    }

    // 숫자 포맷팅 (천 단위 콤마)
    function formatNumber(num) {
        return num.toLocaleString('ko-KR');
    }

    // MOP 입력 시 실시간 계산
    mopInput?.addEventListener('input', (e) => {
        const mopValue = parseFloat(e.target.value) || 0;
        const krwValue = calculateExchange(mopValue);
        krwOutput.value = mopValue > 0 ? formatNumber(krwValue) : '';
    });

    // 금액 단축 버튼 클릭
    shortcutBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseFloat(btn.dataset.amount);
            mopInput.value = amount;
            const krwValue = calculateExchange(amount);
            krwOutput.value = formatNumber(krwValue);
            
            // 버튼 클릭 시 입력 필드에 포커스
            mopInput.focus();
        });
    });

    // 입력 필드에 숫자만 입력 가능하도록 제한
    mopInput?.addEventListener('keypress', (e) => {
        const char = String.fromCharCode(e.which);
        if (!/[0-9.]/.test(char) && e.which !== 8 && e.which !== 46) {
            e.preventDefault();
        }
    });

    // 소수점 입력 제한 (한 번만 허용)
    mopInput?.addEventListener('input', (e) => {
        const value = e.target.value;
        const decimalCount = (value.match(/\./g) || []).length;
        if (decimalCount > 1) {
            e.target.value = value.substring(0, value.lastIndexOf('.'));
        }
    });

    console.log('Exchange rate calculator initialized');
});