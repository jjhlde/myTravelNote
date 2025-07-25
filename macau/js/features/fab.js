/**
 * FAB (Floating Action Button) 시스템
 */

import { getElement, addEventListener, addClass, removeClass, toggleClass } from '../utils/dom-helpers.js';

/**
 * FAB 시스템 초기화
 */
export function initFABSystem() {
    const fabMain = getElement('#fabMain');
    const fabMenu = getElement('#fabMenu');
    const fabOverlay = getElement('#fabOverlay');
    
    if (!fabMain || !fabMenu) {
        console.warn('FAB elements not found');
        return;
    }
    
    // 메인 FAB 클릭 이벤트
    addEventListener(fabMain, 'click', () => {
        toggleClass(fabMenu, 'show');
        toggleClass(fabOverlay, 'show');
        toggleClass(fabMain, 'active');
    });
    
    // 오버레이 클릭으로 닫기
    if (fabOverlay) {
        addEventListener(fabOverlay, 'click', closeFABMenu);
    }
    
    // FAB 아이템 클릭 이벤트
    const fabItems = document.querySelectorAll('.fab-item');
    fabItems.forEach(item => {
        addEventListener(item, 'click', (e) => {
            const action = item.dataset.action;
            handleFABAction(action);
            closeFABMenu();
        });
    });
    
    console.log('FAB system initialized');
}

/**
 * FAB 메뉴 닫기
 */
function closeFABMenu() {
    const fabMain = getElement('#fabMain');
    const fabMenu = getElement('#fabMenu');
    const fabOverlay = getElement('#fabOverlay');
    
    if (fabMenu) removeClass(fabMenu, 'show');
    if (fabOverlay) removeClass(fabOverlay, 'show');
    if (fabMain) removeClass(fabMain, 'active');
}

/**
 * FAB 액션 처리
 * @param {string} action - 액션 타입
 */
function handleFABAction(action) {
    switch (action) {
        case 'expense':
            // 지출 입력 팝업 열기
            const expensePopup = getElement('#expensePopupOverlay');
            if (expensePopup) {
                addClass(expensePopup, 'show');
            }
            break;
        case 'exchange':
            // 환율 계산기 팝업 열기
            const exchangePopup = getElement('#exchangePopupOverlay');
            if (exchangePopup) {
                addClass(exchangePopup, 'show');
            }
            break;
        case 'weather':
            // 날씨 정보 (임시)
            alert('🌦️ 마카오 날씨: 26°C, 흐림');
            break;
        case 'time':
            // 시차 정보 (임시)
            const macauTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Macau' });
            alert(`⏰ 마카오 현재 시간: ${macauTime}`);
            break;
        case 'translate':
            // 번역 도구 (임시)
            alert('🗣️ 번역 기능은 개발 중입니다.');
            break;
        default:
            console.warn(`Unknown FAB action: ${action}`);
    }
}

/**
 * FAB 시스템 정리
 */
export function destroyFABSystem() {
    console.log('FAB system destroyed');
}