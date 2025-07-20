/**
 * PWA Template Script - 동적 생성된 여행 앱용
 * localStorage에서 여행 데이터를 불러와서 템플릿에 적용
 */

class PWATravelApp {
    constructor() {
        this.currentPage = 0;
        this.totalPages = 6;
        this.sessionId = this.getSessionId();
        this.travelData = null;
        
        this.init();
    }

    getSessionId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('session');
    }

    async init() {
        console.log('🚀 PWA 여행 앱 초기화 시작');
        console.log('📍 세션 ID:', this.sessionId);
        
        // localStorage에서 여행 데이터 로드
        await this.loadTravelData();
        
        // 데이터가 있으면 템플릿에 적용
        if (this.travelData) {
            console.log('✅ 데이터 로드 성공, 렌더링 시작');
            this.renderContent();
        } else {
            console.warn('⚠️ 데이터가 없어서 기본 템플릿 표시');
            this.hideTemplateVariables();
        }
        
        this.setupEventListeners();
        this.showSwipeHint();
    }

    async loadTravelData() {
        if (!this.sessionId) {
            console.error('❌ Session ID가 없습니다');
            console.log('💡 URL에 ?session=test123 파라미터를 추가해보세요');
            return;
        }

        const storageKey = `generatedApp_${this.sessionId}`;
        console.log('🔍 localStorage 키 확인:', storageKey);

        try {
            const data = localStorage.getItem(storageKey);
            console.log('📦 localStorage에서 가져온 원본 데이터:', data);
            
            if (data) {
                this.travelData = JSON.parse(data);
                console.log('✅ 여행 데이터 파싱 완료:', this.travelData);
                console.log('📋 여행 제목:', this.travelData.tripTitle);
                console.log('📅 일정 수:', this.travelData.days?.length || 0);
            } else {
                console.warn('⚠️ 세션 데이터를 찾을 수 없습니다:', storageKey);
                console.log('🔍 현재 localStorage 키들:', Object.keys(localStorage));
            }
        } catch (error) {
            console.error('❌ 데이터 파싱 오류:', error);
        }
    }

    renderContent() {
        if (!this.travelData) {
            // 데이터가 없으면 템플릿 변수들을 기본값으로 대체
            this.hideTemplateVariables();
            return;
        }

        // 모든 템플릿 변수들을 실제 데이터로 교체
        this.replaceTemplateVariables();
        
        // 헤더 정보 업데이트 (이미 replaceTemplateVariables에서 처리되지만 확실히 하기 위해)
        const titleElement = document.querySelector('.trip-title');
        if (titleElement) {
            titleElement.textContent = this.travelData.tripTitle || '여행 계획';
        }

        const durationElement = document.querySelector('.trip-duration');
        if (durationElement) {
            durationElement.textContent = `${this.travelData.duration || '기간 미정'} • ${this.travelData.destination || '목적지'}`;
        }

        const budgetElement = document.querySelector('.budget-amount');
        if (budgetElement) {
            budgetElement.textContent = this.travelData.budget || '예산 미정';
        }

        // 탭 생성
        this.renderTabs();
        
        // 페이지 콘텐츠 생성
        this.renderPages();
        
        // 인디케이터 생성
        this.renderIndicators();
    }

    replaceTemplateVariables() {
        if (!this.travelData) return;

        console.log('🔄 템플릿 변수 교체 시작');

        // 템플릿 변수 매핑
        const templateVars = {
            '{{TRIP_TITLE}}': this.travelData.tripTitle || '여행 계획',
            '{{DESTINATION}}': this.travelData.destination || '목적지',
            '{{DURATION}}': this.travelData.duration || '기간 미정',
            '{{DESTINATION_FLAG}}': this.travelData.destinationFlag || '🌍',
            '{{DESTINATION_EMOJI}}': this.travelData.destinationEmoji || '🌍',
            '{{BUDGET_TAB_INDEX}}': String(this.totalPages - 1),
            '{{DAY_TABS}}': '', // 빈 문자열로 교체 (JavaScript로 동적 생성)
            '{{PAGE_CONTENT}}': '', // 빈 문자열로 교체 (JavaScript로 동적 생성)
            '{{PAGE_INDICATORS}}': '' // 빈 문자열로 교체 (JavaScript로 동적 생성)
        };

        // document.title 업데이트
        document.title = `${this.travelData.tripTitle} ${this.travelData.destinationFlag || ''}`.trim();

        // 모든 텍스트 노드에서 템플릿 변수 교체
        this.replaceInTextNodes(document.body, templateVars);

        // meta 태그들도 업데이트
        const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (appleTitle) {
            appleTitle.setAttribute('content', this.travelData.tripTitle || '여행 계획');
        }

        // 설치 가이드 제목 업데이트
        const installSubtitle = document.querySelector('.install-guide-subtitle');
        if (installSubtitle) {
            installSubtitle.innerHTML = `${this.travelData.tripTitle}을 언제든<br>빠르게 확인할 수 있어요`;
        }

        console.log('✅ 템플릿 변수 교체 완료');
    }

    replaceInTextNodes(element, templateVars) {
        // 텍스트 노드 찾기
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        // 텍스트 노드들에서 템플릿 변수 교체
        textNodes.forEach(textNode => {
            let text = textNode.textContent;
            let hasChanges = false;

            Object.keys(templateVars).forEach(template => {
                if (text.includes(template)) {
                    text = text.replace(new RegExp(template.replace(/[{}]/g, '\\$&'), 'g'), templateVars[template]);
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                textNode.textContent = text;
            }
        });
    }

    hideTemplateVariables() {
        // 템플릿 변수들을 기본값으로 대체
        const titleElement = document.querySelector('.trip-title');
        if (titleElement && titleElement.textContent.includes('{{')) {
            titleElement.textContent = '여행 계획을 불러오는 중...';
        }

        const durationElement = document.querySelector('.trip-duration');
        if (durationElement && durationElement.textContent.includes('{{')) {
            durationElement.textContent = '세션 데이터를 확인해주세요';
        }

        const budgetElement = document.querySelector('.budget-amount');
        if (budgetElement && budgetElement.textContent.includes('{{')) {
            budgetElement.textContent = '예산 미정';
        }

        // 탭도 기본 탭으로 설정
        this.renderTabs();

        // 페이지 콘텐츠도 기본 안내 메시지로 대체
        const pagesWrapper = document.querySelector('.pages-wrapper');
        if (pagesWrapper) {
            pagesWrapper.innerHTML = `
                <div class="page">
                    <div class="page-content">
                        <div class="tips-section">
                            <div class="tips-title">📱 PWA 템플릿</div>
                            <div class="tip-item">
                                세션 ID: <strong>${this.sessionId || '없음'}</strong>
                            </div>
                            <div class="tip-item">
                                localStorage에서 여행 데이터를 찾을 수 없습니다.
                            </div>
                            <div class="tip-item">
                                개발자 도구 Console에서 테스트 데이터를 추가해보세요.
                            </div>
                        </div>
                    </div>
                </div>
                <div class="page">
                    <div class="page-content">
                        <div class="budget-section">
                            <div class="budget-title">💰 여행 예산</div>
                            <div class="budget-item budget-total">
                                <span>데이터를 불러오는 중...</span>
                                <span>-</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 인디케이터도 기본값으로 설정
        this.renderIndicators();
    }

    renderTabs() {
        const tabsContainer = document.querySelector('.day-tabs');
        if (!tabsContainer) return;

        // 모든 탭을 다시 생성
        let tabsHTML = `
            <div class="day-tab active" data-page="0">📋 정보</div>
        `;

        // 여행 데이터가 있으면 일차별 탭 추가
        if (this.travelData && this.travelData.days) {
            this.travelData.days.forEach((day, index) => {
                tabsHTML += `<div class="day-tab" data-page="${index + 1}">${day.dayNumber}일차</div>`;
            });
            tabsHTML += `<div class="day-tab" data-page="${this.travelData.days.length + 1}">💰 예산</div>`;
            this.totalPages = this.travelData.days.length + 2; // 정보 + 일차들 + 예산
        } else {
            // 데이터가 없으면 기본 탭만
            tabsHTML += `<div class="day-tab" data-page="1">💰 예산</div>`;
            this.totalPages = 2;
        }

        tabsContainer.innerHTML = tabsHTML;
    }

    renderPages() {
        const pagesWrapper = document.querySelector('.pages-wrapper');
        if (!pagesWrapper) return;

        // 기존 페이지들 제거
        pagesWrapper.innerHTML = '';

        // 정보 페이지
        this.createInfoPage(pagesWrapper);

        // 일차별 페이지들
        if (this.travelData.days) {
            this.travelData.days.forEach((day, index) => {
                this.createDayPage(pagesWrapper, day, index + 1);
            });
        }

        // 예산 페이지
        this.createBudgetPage(pagesWrapper);
    }

    createInfoPage(container) {
        const page = document.createElement('div');
        page.className = 'page';
        page.innerHTML = `
            <div class="page-content">
                <div class="day-header" style="background: linear-gradient(45deg, #667eea, #764ba2);">
                    <h2>📋 여행 정보</h2>
                    <div class="date">${this.travelData.duration || '기간 미정'}</div>
                </div>

                <div class="tips-section">
                    <div class="tips-title">✈️ 기본 정보</div>
                    <div class="tip-item">
                        <strong>목적지:</strong> ${this.travelData.destination || '미정'}
                    </div>
                    <div class="tip-item">
                        <strong>기간:</strong> ${this.travelData.duration || '미정'}
                    </div>
                    <div class="tip-item">
                        <strong>예상 비용:</strong> ${this.travelData.budget || '미정'}
                    </div>
                </div>

                ${this.travelData.tips ? `
                <div class="tips-section">
                    <div class="tips-title">🌟 여행 팁</div>
                    ${this.travelData.tips.map(tip => `
                        <div class="tip-item">${tip}</div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
        container.appendChild(page);
    }

    createDayPage(container, day, pageIndex) {
        const page = document.createElement('div');
        page.className = 'page';
        page.innerHTML = `
            <div class="page-content">
                <div class="day-header">
                    <h2>${day.dayNumber}일차</h2>
                    <div class="date">${day.theme || '특별한 하루'}</div>
                </div>

                ${day.timeline ? day.timeline.map(item => `
                    <div class="activity">
                        <div class="activity-time">${item.time}</div>
                        <div class="activity-title">${item.title}</div>
                        <div class="activity-desc">${item.description}</div>
                        ${item.location ? `<div class="location-info">${item.location}</div>` : ''}
                    </div>
                `).join('') : '<div class="activity"><div class="activity-desc">일정 정보가 없습니다.</div></div>'}
            </div>
        `;
        container.appendChild(page);
    }

    createBudgetPage(container) {
        const page = document.createElement('div');
        page.className = 'page';
        page.innerHTML = `
            <div class="page-content">
                <div class="budget-section">
                    <div class="budget-title">💰 여행 예산</div>
                    
                    <div class="budget-item budget-total">
                        <span>총 예상 비용</span>
                        <span>${this.travelData.budget || '미정'}</span>
                    </div>

                    ${this.travelData.budget_breakdown ? this.travelData.budget_breakdown.map(item => `
                        <div class="budget-item">
                            <span>${item.icon || '💵'} ${item.category}</span>
                            <span>${item.amount}</span>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        `;
        container.appendChild(page);
    }

    renderIndicators() {
        const indicatorContainer = document.querySelector('.page-indicator');
        if (!indicatorContainer) return;

        indicatorContainer.innerHTML = '';
        for (let i = 0; i < this.totalPages; i++) {
            const dot = document.createElement('div');
            dot.className = `indicator-dot ${i === 0 ? 'active' : ''}`;
            dot.setAttribute('data-page', i);
            indicatorContainer.appendChild(dot);
        }
    }

    setupEventListeners() {
        // 탭 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('day-tab')) {
                const pageIndex = parseInt(e.target.getAttribute('data-page'));
                this.switchToPage(pageIndex);
            }
            
            if (e.target.classList.contains('indicator-dot')) {
                const pageIndex = parseInt(e.target.getAttribute('data-page'));
                this.switchToPage(pageIndex);
            }
        });

        // 터치/스와이프 이벤트
        this.setupSwipeEvents();

        // PWA 설치 가이드 이벤트
        this.setupInstallGuide();
    }

    switchToPage(pageIndex) {
        if (pageIndex === this.currentPage || pageIndex < 0 || pageIndex >= this.totalPages) return;

        this.currentPage = pageIndex;
        this.updateUI();
    }

    updateUI() {
        // 페이지 위치 업데이트
        const wrapper = document.querySelector('.pages-wrapper');
        if (wrapper) {
            const translateX = -this.currentPage * (100 / this.totalPages);
            wrapper.style.transform = `translateX(${translateX}%)`;
        }

        // 탭 활성화 상태 업데이트
        const tabs = document.querySelectorAll('.day-tab');
        tabs.forEach((tab, index) => {
            const tabPage = parseInt(tab.getAttribute('data-page'));
            tab.classList.toggle('active', tabPage === this.currentPage);
        });

        // 인디케이터 활성화 상태 업데이트
        const indicators = document.querySelectorAll('.indicator-dot');
        indicators.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentPage);
        });
    }

    setupSwipeEvents() {
        const wrapper = document.querySelector('.pages-wrapper');
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
            setTimeout(() => overlay.classList.add('show'), 100);
        }, 3000);

        // 닫기 버튼
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.style.display = 'none', 300);
            });
        }

        // 나중에 버튼
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.style.display = 'none', 300);
            });
        }

        // 설치하기 버튼
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.style.display = 'none', 300);
                alert('브라우저의 공유 버튼(⬆️)을 터치한 후 "홈 화면에 추가"를 선택하세요!');
            });
        }

        // 오버레이 클릭시 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('show');
                setTimeout(() => overlay.style.display = 'none', 300);
            }
        });
    }

    showSwipeHint() {
        const hint = document.getElementById('swipeHint');
        if (hint) {
            hint.classList.add('show');
            setTimeout(() => {
                hint.classList.remove('show');
            }, 4000);
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 PWA 여행 앱 시작');
    new PWATravelApp();
});

// Service Worker 등록 (선택사항)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('../sw.js')
            .then((registration) => {
                console.log('✅ SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('❌ SW registration failed: ', registrationError);
            });
    });
}