/**
 * ChattyPlan - 자연스러운 페이지 전환 시스템
 * 사용자가 index.html에서 chatbot.html로 이동할 때 끊김없는 경험 제공
 */

class PageTransition {
    constructor() {
        this.transitionKey = 'chattyplan_transition';
        this.sessionKey = 'chattyplan_session';
        this.isTransitioning = false;
        this.transitionDuration = 1000; // 1초
    }

    /**
     * 전환 시작 - index.html에서 호출
     */
    startTransition(targetPage = 'chatbot.html') {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // 현재 상태 캡처
        const currentState = this.captureCurrentState();
        
        // 전환 데이터 저장
        const transitionData = {
            fromPage: window.location.pathname,
            toPage: targetPage,
            state: currentState,
            timestamp: Date.now(),
            transitionType: 'login-flow'
        };
        
        sessionStorage.setItem(this.transitionKey, JSON.stringify(transitionData));
        
        // 전환 애니메이션 시작
        this.animateOut(() => {
            // 페이지 이동
            window.location.href = targetPage;
        });
    }

    /**
     * 전환 완료 - chatbot.html에서 호출
     */
    completeTransition() {
        const transitionData = this.getTransitionData();
        
        if (!transitionData || !this.isValidTransition(transitionData)) {
            // 일반적인 페이지 로드
            this.animateIn();
            return false;
        }
        
        // 전환 데이터 기반으로 애니메이션
        this.animateInFromTransition(transitionData);
        
        // 전환 데이터 정리
        sessionStorage.removeItem(this.transitionKey);
        
        return true;
    }

    /**
     * 현재 페이지 상태 캡처
     */
    captureCurrentState() {
        const backgroundElement = document.getElementById('background-layer');
        const chatMessages = document.getElementById('chat-messages');
        const brandLogo = document.querySelector('.brand-logo');
        
        return {
            backgroundImage: backgroundElement ? backgroundElement.style.backgroundImage : '',
            messagesHTML: chatMessages ? chatMessages.innerHTML : '',
            scrollPosition: chatMessages ? chatMessages.scrollTop : 0,
            brandPosition: brandLogo ? this.getElementPosition(brandLogo) : null,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    /**
     * 요소의 위치 정보 획득
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * 페이지 나가는 애니메이션
     */
    animateOut(callback) {
        const appWrapper = document.getElementById('app-wrapper');
        if (!appWrapper) {
            callback();
            return;
        }

        // 브랜드 로고 중앙으로 이동 애니메이션
        const brandLogo = document.querySelector('.brand-logo');
        if (brandLogo) {
            brandLogo.style.transition = 'all 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)';
            brandLogo.style.transform = 'translate(-50%, -50%) scale(1.2)';
            brandLogo.style.position = 'fixed';
            brandLogo.style.top = '50%';
            brandLogo.style.left = '50%';
            brandLogo.style.zIndex = '1000';
        }

        // 배경 확대 및 블러
        const backgroundLayer = document.getElementById('background-layer');
        if (backgroundLayer) {
            backgroundLayer.style.transition = 'all 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)';
            backgroundLayer.style.transform = 'scale(1.1)';
            backgroundLayer.style.filter = 'blur(10px)';
        }

        // 채팅 창 fade out
        const chatWindow = document.querySelector('.chat-window');
        if (chatWindow) {
            chatWindow.style.transition = 'all 0.6s ease-out';
            chatWindow.style.opacity = '0';
            chatWindow.style.transform = 'translateY(30px)';
        }

        // 랜딩 텍스트 fade out
        const landingText = document.querySelector('.landing-text');
        if (landingText) {
            landingText.style.transition = 'all 0.4s ease-out';
            landingText.style.opacity = '0';
            landingText.style.transform = 'translateY(-20px)';
        }

        // 전환 완료 후 콜백 실행
        setTimeout(callback, this.transitionDuration);
    }

    /**
     * 페이지 들어오는 애니메이션 (일반)
     */
    animateIn() {
        const appWrapper = document.getElementById('app-wrapper');
        if (!appWrapper) return;

        appWrapper.style.opacity = '0';
        appWrapper.style.transform = 'translateY(20px)';

        // 페이지 로드 후 fade in
        requestAnimationFrame(() => {
            appWrapper.style.transition = 'all 0.6s ease-out';
            appWrapper.style.opacity = '1';
            appWrapper.style.transform = 'translateY(0)';
        });
    }

    /**
     * 전환 데이터 기반 들어오는 애니메이션
     */
    animateInFromTransition(transitionData) {
        const appWrapper = document.getElementById('app-wrapper');
        const backgroundLayer = document.getElementById('background-layer');
        const brandLogo = document.querySelector('.brand-logo');
        
        if (!appWrapper) return;

        // 배경 이미지 복원
        if (backgroundLayer && transitionData.state.backgroundImage) {
            backgroundLayer.style.backgroundImage = transitionData.state.backgroundImage;
        }

        // 초기 상태 설정 (landing 모드처럼)
        if (brandLogo) {
            brandLogo.style.position = 'fixed';
            brandLogo.style.top = '50%';
            brandLogo.style.left = '50%';
            brandLogo.style.transform = 'translate(-50%, -50%) scale(1.2)';
            brandLogo.style.zIndex = '1000';
            brandLogo.style.transition = 'all 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)';
        }

        // 배경 초기 상태
        if (backgroundLayer) {
            backgroundLayer.style.transform = 'scale(1.1)';
            backgroundLayer.style.filter = 'blur(10px)';
        }

        // 약간의 지연 후 app 모드로 전환
        setTimeout(() => {
            // state-app 클래스 확인 및 애니메이션
            if (appWrapper.classList.contains('state-app')) {
                // 배경 블러 및 스케일 적용
                if (backgroundLayer) {
                    backgroundLayer.style.transition = 'all 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)';
                    backgroundLayer.style.transform = 'scale(1.1)';
                    backgroundLayer.style.filter = 'blur(20px)';
                }

                // 브랜드 로고 헤더로 이동
                if (brandLogo) {
                    brandLogo.style.position = '';
                    brandLogo.style.top = '';
                    brandLogo.style.left = '';
                    brandLogo.style.transform = '';
                    brandLogo.style.zIndex = '';
                }

                // 채팅 창 fade in
                const chatWindow = document.querySelector('.chat-window');
                if (chatWindow) {
                    chatWindow.style.opacity = '1';
                    chatWindow.style.transform = 'translateY(0)';
                }
            }
        }, 300);
    }

    /**
     * 전환 데이터 획득
     */
    getTransitionData() {
        const data = sessionStorage.getItem(this.transitionKey);
        return data ? JSON.parse(data) : null;
    }

    /**
     * 전환 데이터 유효성 검사
     */
    isValidTransition(transitionData) {
        if (!transitionData || !transitionData.timestamp) return false;
        
        // 5초 이내의 전환만 유효
        const timeDiff = Date.now() - transitionData.timestamp;
        return timeDiff < 5000;
    }

    /**
     * 뒤로가기 감지 및 처리
     */
    handleBackNavigation() {
        // 뒤로가기 시 자연스러운 전환
        window.addEventListener('popstate', (e) => {
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/') {
                // index.html로 돌아가는 경우 역방향 애니메이션
                this.reverseTransition();
            }
        });
    }

    /**
     * 역방향 전환 (chatbot.html → index.html)
     */
    reverseTransition() {
        const appWrapper = document.getElementById('app-wrapper');
        if (!appWrapper) return;

        // state-app에서 state-landing으로 역전환
        const brandLogo = document.querySelector('.brand-logo');
        const backgroundLayer = document.getElementById('background-layer');

        if (brandLogo) {
            brandLogo.style.transition = 'all 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)';
            brandLogo.style.position = 'fixed';
            brandLogo.style.top = '50%';
            brandLogo.style.left = '50%';
            brandLogo.style.transform = 'translate(-50%, -50%)';
            brandLogo.style.zIndex = '1000';
        }

        if (backgroundLayer) {
            backgroundLayer.style.transition = 'all 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)';
            backgroundLayer.style.transform = 'scale(1)';
            backgroundLayer.style.filter = 'blur(0px)';
        }
    }

    /**
     * 스무스 스크롤 복원
     */
    restoreScrollPosition(position) {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && position) {
            chatMessages.scrollTop = position;
        }
    }

    /**
     * 메시지 내용 복원
     */
    restoreMessages(messagesHTML) {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && messagesHTML) {
            chatMessages.innerHTML = messagesHTML;
        }
    }
}

// 전역 전환 관리자 인스턴스
window.pageTransition = new PageTransition();

/**
 * 유틸리티 함수들
 */

// 페이지 전환 시작 (index.html에서 사용)
function startPageTransition(targetPage = 'chatbot.html') {
    if (window.pageTransition) {
        window.pageTransition.startTransition(targetPage);
    } else {
        // fallback
        window.location.href = targetPage;
    }
}

// 페이지 전환 완료 (chatbot.html에서 사용)
function completePageTransition() {
    if (window.pageTransition) {
        return window.pageTransition.completeTransition();
    }
    return false;
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (window.pageTransition) {
        // 뒤로가기 처리 초기화
        window.pageTransition.handleBackNavigation();
        
        // chatbot.html인 경우 전환 완료 처리
        if (window.location.pathname.includes('chatbot.html')) {
            window.pageTransition.completeTransition();
        }
    }
});

// View Transition API 지원 체크 및 사용
if ('startViewTransition' in document) {
    // 최신 브라우저에서 View Transition API 활용
    function enhancedPageTransition(updateCallback) {
        document.startViewTransition(updateCallback);
    }
    
    window.enhancedPageTransition = enhancedPageTransition;
}

// CSS 애니메이션 지원 체크
function supportsAnimation() {
    const elm = document.createElement('div');
    const animationProps = ['animation', 'webkitAnimation', 'mozAnimation', 'oAnimation', 'msAnimation'];
    
    for (let i = 0; i < animationProps.length; i++) {
        if (elm.style[animationProps[i]] !== undefined) {
            return true;
        }
    }
    return false;
}

// Reduced motion 설정 체크
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// 전환 효과 설정 조정
if (prefersReducedMotion()) {
    // 접근성: 움직임 감소 설정이 켜진 경우 전환 시간 단축
    if (window.pageTransition) {
        window.pageTransition.transitionDuration = 200;
    }
}

// Global exports for non-module usage
window.PageTransition = PageTransition;
window.startPageTransition = startPageTransition;
window.completePageTransition = completePageTransition;