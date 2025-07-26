/**
 * DOM 조작 헬퍼 함수들
 */

/**
 * 요소가 존재하는지 확인하고 반환
 * @param {string} selector - CSS 선택자
 * @returns {Element|null} DOM 요소 또는 null
 */
export function getElement(selector) {
    return document.querySelector(selector);
}

/**
 * 여러 요소를 선택하고 반환
 * @param {string} selector - CSS 선택자
 * @returns {NodeList} DOM 요소들
 */
export function getElements(selector) {
    return document.querySelectorAll(selector);
}

/**
 * 요소에 클래스 토글
 * @param {Element} element - DOM 요소
 * @param {string} className - 클래스명
 */
export function toggleClass(element, className) {
    if (element) {
        element.classList.toggle(className);
    }
}

/**
 * 요소에 클래스 추가
 * @param {Element} element - DOM 요소
 * @param {string} className - 클래스명
 */
export function addClass(element, className) {
    if (element) {
        element.classList.add(className);
    }
}

/**
 * 요소에서 클래스 제거
 * @param {Element} element - DOM 요소
 * @param {string} className - 클래스명
 */
export function removeClass(element, className) {
    if (element) {
        element.classList.remove(className);
    }
}

/**
 * 요소에 이벤트 리스너 추가 (안전하게)
 * @param {Element} element - DOM 요소
 * @param {string} event - 이벤트 타입
 * @param {Function} handler - 이벤트 핸들러
 */
export function addEventListener(element, event, handler) {
    if (element && typeof handler === 'function') {
        element.addEventListener(event, handler);
    }
}

/**
 * 터치 디바이스 감지
 * @returns {boolean} 터치 디바이스 여부
 */
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * iOS 디바이스 감지
 * @returns {boolean} iOS 디바이스 여부
 */
export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * PWA 모드에서 실행 중인지 감지
 * @returns {boolean} PWA 모드 여부
 */
export function isInStandaloneMode() {
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * 요소를 부드럽게 스크롤
 * @param {Element} element - 스크롤할 요소
 * @param {number} position - 스크롤 위치
 */
export function smoothScrollTo(element, position) {
    if (element) {
        element.scrollTo({
            left: position,
            behavior: 'smooth'
        });
    }
}

/**
 * 간단한 토스트 메시지 표시
 * @param {string} message - 메시지 내용
 * @param {string} type - 메시지 타입 (success, error, info)
 * @param {number} duration - 표시 시간 (ms)
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    
    // 기본 스타일
    const baseStyles = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 90%;
        text-align: center;
    `;
    
    // 타입별 색상
    const typeColors = {
        success: 'linear-gradient(135deg, #10B981, #059669)',
        error: 'linear-gradient(135deg, #EF4444, #DC2626)', 
        info: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    };
    
    toast.style.cssText = baseStyles + `background: ${typeColors[type] || typeColors.info};`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 표시 애니메이션
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // 제거 애니메이션
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * 햅틱 피드백 (지원하는 기기에서만)
 * @param {string} type - 햅틱 타입 (light, medium, heavy)
 */
export function triggerHapticFeedback(type = 'light') {
    if (window.navigator && window.navigator.vibrate) {
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30]
        };
        window.navigator.vibrate(patterns[type] || patterns.light);
    }
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}