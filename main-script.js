/**
 * 동적 생성된 여행 PWA 스크립트
 * localStorage에서 여행 데이터를 로드하여 템플릿에 적용
 */

class TravelAppLoader {
    constructor() {
        this.sessionId = this.getSessionIdFromURL();
        this.travelData = null;
        this.currentPage = 0;
        this.totalPages = 0;
        
        this.init();
    }

    getSessionIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('session');
    }

    init() {
        // URL에 세션 ID가 있으면 동적 데이터 로드, 없으면 기본 마카오 데이터 사용
        if (this.sessionId) {
            this.loadDynamicContent();
        } else {
            this.loadDefaultContent();
        }
        
        this.setupEventListeners();
        this.setupPWAInstallPrompt();
    }

    loadDynamicContent() {
        try {
            const storedData = localStorage.getItem(`generatedApp_${this.sessionId}`);
            if (storedData) {
                this.travelData = JSON.parse(storedData);
                console.log('✅ 동적 여행 데이터 로드 성공:', this.travelData);
                this.renderDynamicContent();
            } else {
                console.warn('⚠️ 세션 데이터를 찾을 수 없어 기본 콘텐츠로 대체');
                this.loadDefaultContent();
            }
        } catch (error) {
            console.error('❌ 동적 콘텐츠 로드 실패:', error);
            this.loadDefaultContent();
        }
    }

    loadDefaultContent() {
        // 기본 마카오 여행 데이터 (기존 main.html 콘텐츠)
        this.travelData = {
            title: '마카오 가족여행',
            destination: '마카오',
            duration: '3박4일',
            days: [
                { day: 1, theme: '마카오 도착 & 세나도 광장 탐방' },
                { day: 2, theme: '코타이 리조트 & 베네치안 마카오' },
                { day: 3, theme: '마카오 타워 & 라자루스 섬' },
                { day: 4, theme: '기념품 쇼핑 & 출국' }
            ],
            budget: '1인당 약 80만원',
            isDefault: true
        };
        
        console.log('📋 기본 마카오 데이터 사용');
        this.renderDynamicContent();
    }

    renderDynamicContent() {
        // 헤더 업데이트
        this.updateHeader();
        
        // 탭 구조 업데이트  
        this.updateTabs();
        
        // 페이지 콘텐츠 로드
        this.loadPages();
        
        // 페이지 인디케이터 업데이트
        this.updatePageIndicators();
        
        // PWA 매니페스트 동적 생성
        this.generateManifest();
    }

    updateHeader() {
        const tripTitle = document.querySelector('.header h1');
        const tripSubtitle = document.querySelector('.header p');
        
        if (tripTitle) {
            tripTitle.textContent = `${this.getDestinationEmoji()} ${this.travelData.title}`;
        }
        
        if (tripSubtitle) {
            const subtitle = this.travelData.isDefault 
                ? '37개월 딸과 함께하는 특별한 여행'
                : `${this.travelData.duration} • ${this.travelData.destination}`;
            tripSubtitle.textContent = subtitle;
        }
    }

    getDestinationEmoji() {
        const destination = this.travelData.destination.toLowerCase();
        const emojiMap = {
            '마카오': '🇲🇴',
            '일본': '🇯🇵',
            '중국': '🇨🇳',
            '태국': '🇹🇭',
            '베트남': '🇻🇳',
            '대만': '🇹🇼',
            '싱가포르': '🇸🇬',
            '말레이시아': '🇲🇾',
            '필리핀': '🇵🇭',
            '인도네시아': '🇮🇩',
            '제주도': '🏝️',
            '부산': '🏖️',
            '서울': '🏙️'
        };
        
        for (const [place, emoji] of Object.entries(emojiMap)) {
            if (destination.includes(place)) {
                return emoji;
            }
        }
        
        return '✈️'; // 기본 이모지
    }

    updateTabs() {
        const dayTabs = document.querySelector('.day-tabs');
        if (!dayTabs) return;

        const days = this.travelData.days || [];
        this.totalPages = days.length + 3; // 정보 + 일차들 + 예산 + 할일

        dayTabs.innerHTML = `
            <div class="day-tab active" data-page="0">
                <span class="tab-icon">📋</span>
                <span class="tab-text">정보</span>
            </div>
            ${days.map((day, index) => `
                <div class="day-tab" data-page="${index + 1}">
                    <span class="tab-icon">${index + 1}</span>
                    <span class="tab-text">${index + 1}일차</span>
                </div>
            `).join('')}
            <div class="day-tab" data-page="${days.length + 1}">
                <span class="tab-icon">💰</span>
                <span class="tab-text">예산</span>
            </div>
            <div class="day-tab" data-page="${days.length + 2}">
                <span class="tab-icon">✅</span>
                <span class="tab-text">할일</span>
            </div>
        `;
    }

    loadPages() {
        const pagesWrapper = document.getElementById('pagesWrapper');
        if (!pagesWrapper) return;

        const days = this.travelData.days || [];
        
        pagesWrapper.innerHTML = `
            <!-- 정보 페이지 -->
            <div class="page" id="page-0">
                ${this.generateInfoPage()}
            </div>
            
            <!-- 일차별 페이지들 -->
            ${days.map((day, index) => `
                <div class="page" id="page-${index + 1}">
                    ${this.generateDayPage(day, index + 1)}
                </div>
            `).join('')}
            
            <!-- 예산 페이지 -->
            <div class="page" id="page-${days.length + 1}">
                ${this.generateBudgetPage()}
            </div>
            
            <!-- 할일 페이지 -->
            <div class="page" id="page-${days.length + 2}">
                ${this.generateTodoPage()}
            </div>
        `;
    }

    generateInfoPage() {
        return `
            <div class="page-content">
                <h2>📍 여행 정보</h2>
                
                <div class="info-card">
                    <h3>🏷️ 여행 개요</h3>
                    <div class="info-item">
                        <span class="info-label">목적지</span>
                        <span class="info-value">${this.travelData.destination}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">여행 기간</span>
                        <span class="info-value">${this.travelData.duration}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">예상 비용</span>
                        <span class="info-value">${this.travelData.budget}</span>
                    </div>
                </div>

                ${this.travelData.tips ? `
                <div class="info-card">
                    <h3>💡 여행 팁</h3>
                    <div class="tips-list">
                        ${this.travelData.tips.map(tip => `
                            <div class="tip-item">• ${tip}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="info-card">
                    <h3>📱 앱 사용법</h3>
                    <div class="usage-tips">
                        <div class="tip-item">• 좌우 스와이프로 일정 확인</div>
                        <div class="tip-item">• 오프라인에서도 사용 가능</div>
                        <div class="tip-item">• 홈 화면에 추가하여 앱처럼 사용</div>
                    </div>
                </div>
            </div>
        `;
    }

    generateDayPage(day, dayNumber) {
        const activities = day.activities || [];
        
        return `
            <div class="page-content">
                <h2>📅 ${dayNumber}일차</h2>
                <div class="day-theme">${day.theme || `${dayNumber}일차 일정`}</div>
                
                ${activities.length > 0 ? `
                    <div class="timeline">
                        ${activities.map(activity => `
                            <div class="timeline-item">
                                <div class="timeline-time">${activity.start_time || '시간 미정'}</div>
                                <div class="timeline-content">
                                    <h4>${activity.title}</h4>
                                    <p class="location">${activity.location || ''}</p>
                                    <p class="description">${activity.description || ''}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="placeholder-content">
                        <p>🗓️ ${dayNumber}일차 상세 일정은 곧 업데이트됩니다.</p>
                        <p>궁금한 점이 있으시면 챗봇에서 다시 문의해주세요!</p>
                    </div>
                `}
            </div>
        `;
    }

    generateBudgetPage() {
        return `
            <div class="page-content">
                <h2>💰 여행 예산</h2>
                
                <div class="budget-summary">
                    <div class="total-budget">
                        <span class="budget-label">총 예상 비용</span>
                        <span class="budget-amount">${this.travelData.budget}</span>
                    </div>
                </div>
                
                <div class="budget-breakdown">
                    <div class="budget-category">
                        <span class="category-icon">✈️</span>
                        <span class="category-name">교통비</span>
                        <span class="category-amount">상세 정보 준비 중</span>
                    </div>
                    <div class="budget-category">
                        <span class="category-icon">🏨</span>
                        <span class="category-name">숙박비</span>
                        <span class="category-amount">상세 정보 준비 중</span>
                    </div>
                    <div class="budget-category">
                        <span class="category-icon">🍽️</span>
                        <span class="category-name">식비</span>
                        <span class="category-amount">상세 정보 준비 중</span>
                    </div>
                    <div class="budget-category">
                        <span class="category-icon">🎫</span>
                        <span class="category-name">관광비</span>
                        <span class="category-amount">상세 정보 준비 중</span>
                    </div>
                </div>
                
                <div class="budget-note">
                    <p>💡 실제 비용은 여행 스타일과 환율에 따라 달라질 수 있습니다.</p>
                </div>
            </div>
        `;
    }

    generateTodoPage() {
        const todos = this.travelData.todos || [];
        
        return `
            <div class="page-content">
                <h2>✅ 여행 준비 체크리스트</h2>
                
                <div class="progress-info">
                    <span class="progress-text">완료: <span id="completedCount">0</span> / <span id="totalCount">${todos.length}</span></span>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                    </div>
                </div>
                
                ${this.generateTodoSections(todos)}
                
                <div class="todo-actions">
                    <button class="todo-action-btn" onclick="resetAllTodos()">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">체크 초기화</span>
                    </button>
                </div>
            </div>
        `;
    }

    generateTodoSections(todos) {
        const categories = ['pre-departure', 'packing', 'departure', 'local', 'return'];
        const categoryNames = {
            'pre-departure': '📋 출발 전 (1-2주 전)',
            'packing': '🎒 짐 준비 (1-3일 전)', 
            'departure': '🚀 출발 당일',
            'local': '🌟 현지에서',
            'return': '✈️ 귀국 전'
        };
        
        return categories.map(category => {
            const categoryTodos = todos.filter(todo => todo.category === category);
            if (categoryTodos.length === 0) return '';
            
            return `
                <div class="todo-section">
                    <h3>${categoryNames[category]}</h3>
                    <div class="todo-list" data-category="${category}">
                        ${categoryTodos.map(todo => `
                            <div class="todo-item" data-priority="${todo.priority}">
                                <label class="todo-checkbox">
                                    <input type="checkbox" onchange="updateProgress()">
                                    <span class="checkmark"></span>
                                </label>
                                <div class="todo-content">
                                    <div class="todo-text">${todo.text}</div>
                                    <div class="todo-meta">
                                        <span class="todo-priority ${todo.priority}">${this.getPriorityLabel(todo.priority)}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    getPriorityLabel(priority) {
        const labels = {
            'high': '중요',
            'medium': '보통', 
            'low': '선택'
        };
        return labels[priority] || '보통';
    }

    updatePageIndicators() {
        const pageIndicator = document.querySelector('.page-indicator');
        if (!pageIndicator) return;

        pageIndicator.innerHTML = Array.from({length: this.totalPages}, (_, i) => 
            `<div class="indicator-dot ${i === 0 ? 'active' : ''}" data-page="${i}"></div>`
        ).join('');
    }

    generateManifest() {
        if (!this.travelData.isDefault) {
            // 동적 생성된 앱의 경우 매니페스트도 동적으로 생성
            const manifest = {
                name: this.travelData.title,
                short_name: this.travelData.destination,
                description: `${this.travelData.destination} ${this.travelData.duration} 여행 가이드`,
                start_url: `./main.html?session=${this.sessionId}`,
                display: 'standalone',
                theme_color: '#4F46E5',
                background_color: '#ffffff',
                orientation: 'portrait',
                scope: './',
                categories: ['travel', 'lifestyle'],
                lang: 'ko',
                icons: [
                    {
                        src: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' fill='%234F46E5' rx='20'/><text x='96' y='140' font-size='120' text-anchor='middle' fill='white'>${this.getDestinationEmoji()}</text></svg>`,
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            };
            
            // Blob URL로 동적 매니페스트 생성
            const manifestBlob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
            const manifestUrl = URL.createObjectURL(manifestBlob);
            
            // 기존 매니페스트 링크 교체
            let manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                manifestLink.href = manifestUrl;
            } else {
                manifestLink = document.createElement('link');
                manifestLink.rel = 'manifest';
                manifestLink.href = manifestUrl;
                document.head.appendChild(manifestLink);
            }
        }
    }

    setupEventListeners() {
        // 탭 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.closest('.day-tab')) {
                const tab = e.target.closest('.day-tab');
                const pageIndex = parseInt(tab.dataset.page);
                this.goToPage(pageIndex);
            }
        });

        // 스와이프 이벤트 (간단한 구현)
        let startX = 0;
        let endX = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            this.handleSwipe();
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousPage();
            } else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
        });
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const diffX = startX - endX;

        if (Math.abs(diffX) > swipeThreshold) {
            if (diffX > 0) {
                this.nextPage();
            } else {
                this.previousPage();
            }
        }
    }

    goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.totalPages) return;
        
        this.currentPage = pageIndex;
        
        // 페이지 전환 애니메이션
        const pagesWrapper = document.getElementById('pagesWrapper');
        if (pagesWrapper) {
            pagesWrapper.style.transform = `translateX(-${pageIndex * 100}%)`;
        }
        
        // 탭 활성화 상태 업데이트
        document.querySelectorAll('.day-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === pageIndex);
        });
        
        // 인디케이터 업데이트
        document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === pageIndex);
        });
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.goToPage(this.currentPage + 1);
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        }
    }

    setupPWAInstallPrompt() {
        // PWA 설치 가이드 표시
        setTimeout(() => {
            const installGuide = document.getElementById('installGuideOverlay');
            if (installGuide && !localStorage.getItem('pwa_install_prompted')) {
                installGuide.style.display = 'flex';
                localStorage.setItem('pwa_install_prompted', 'true');
            }
        }, 3000);

        // 설치 가이드 닫기
        document.getElementById('closeGuideBtn')?.addEventListener('click', () => {
            document.getElementById('installGuideOverlay').style.display = 'none';
        });

        document.getElementById('skipInstallBtn')?.addEventListener('click', () => {
            document.getElementById('installGuideOverlay').style.display = 'none';
        });

        document.getElementById('installNowBtn')?.addEventListener('click', () => {
            document.getElementById('installGuideOverlay').style.display = 'none';
            // 실제 설치 프롬프트는 브라우저에서 자동으로 처리
        });
    }
}

// Todo 관련 함수들 (전역 함수로 유지)
function updateProgress() {
    const allTodos = document.querySelectorAll('.todo-item input[type="checkbox"]');
    const completedTodos = document.querySelectorAll('.todo-item input[type="checkbox"]:checked');
    
    const total = allTodos.length;
    const completed = completedTodos.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    const completedCount = document.getElementById('completedCount');
    const totalCount = document.getElementById('totalCount');
    const progressFill = document.getElementById('progressFill');
    
    if (completedCount) completedCount.textContent = completed;
    if (totalCount) totalCount.textContent = total;
    if (progressFill) progressFill.style.width = percentage + '%';
    
    // 로컬 스토리지에 체크 상태 저장
    const checkStates = Array.from(allTodos).map(checkbox => checkbox.checked);
    localStorage.setItem('todoStates', JSON.stringify(checkStates));
}

function resetAllTodos() {
    if (confirm('모든 체크를 초기화하시겠습니까?')) {
        const allCheckboxes = document.querySelectorAll('.todo-item input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => checkbox.checked = false);
        updateProgress();
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.travelApp = new TravelAppLoader();
    
    // 체크박스 상태 복원
    setTimeout(() => {
        const savedStates = JSON.parse(localStorage.getItem('todoStates') || '[]');
        const allCheckboxes = document.querySelectorAll('.todo-item input[type="checkbox"]');
        
        allCheckboxes.forEach((checkbox, index) => {
            if (savedStates[index]) {
                checkbox.checked = true;
            }
        });
        
        updateProgress();
    }, 500);
});