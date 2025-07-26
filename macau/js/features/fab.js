/**
 * FAB (Floating Action Button) 시스템
 */

import { getElement, addEventListener, addClass, removeClass, toggleClass } from '../utils/dom-helpers.js';
import { openExpensePopup } from './expense.js';

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
        toggleClass(fabMenu, 'active');
        toggleClass(fabOverlay, 'active');
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
    
    if (fabMenu) removeClass(fabMenu, 'active');
    if (fabOverlay) removeClass(fabOverlay, 'active');
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
            openExpensePopup();
            break;
        case 'exchange':
            // 환율 계산기 팝업 열기
            const exchangePopup = getElement('#exchangePopupOverlay');
            if (exchangePopup) {
                addClass(exchangePopup, 'show');
                // 뒤로가기 버튼으로 닫기 등록
                if (typeof window.registerPopup === 'function') {
                    window.registerPopup('exchange', () => {
                        removeClass(exchangePopup, 'show');
                        if (typeof window.unregisterPopup === 'function') {
                            window.unregisterPopup('exchange');
                        }
                    });
                }
            }
            break;
        case 'time':
            // 시차 정보 팝업 (개선된 형태)
            showTimePopup();
            break;
        default:
            console.warn(`Unknown FAB action: ${action}`);
    }
}

/**
 * 시차 정보 팝업 표시
 */
function showTimePopup() {
    // 시차 정보 팝업이 없으면 동적으로 생성
    let timePopup = getElement('#timePopupOverlay');
    if (!timePopup) {
        timePopup = createTimePopup();
    }
    
    if (timePopup) {
        addClass(timePopup, 'show');
        
        // 뒤로가기 버튼으로 닫기 등록
        if (typeof window.registerPopup === 'function') {
            window.registerPopup('time', () => {
                removeClass(timePopup, 'show');
                if (typeof window.unregisterPopup === 'function') {
                    window.unregisterPopup('time');
                }
            });
        }
    }
}

/**
 * 시차 정보 팝업 생성
 */
function createTimePopup() {
    const popup = document.createElement('div');
    popup.id = 'timePopupOverlay';
    popup.className = 'exchange-popup-overlay';
    
    const seoulTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const macauTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Macau' });
    
    popup.innerHTML = `
        <div class="exchange-popup-content">
            <div class="exchange-popup-header">
                <h3>⏰ 시차 정보</h3>
                <button class="exchange-popup-close" id="timePopupClose">✕</button>
            </div>
            
            <div class="time-info">
                <div class="time-zone">
                    <div class="time-label">🇰🇷 한국 시간</div>
                    <div class="time-value">${seoulTime}</div>
                </div>
                
                <div class="time-zone">
                    <div class="time-label">🇲🇴 마카오 시간</div>
                    <div class="time-value">${macauTime}</div>
                </div>
                
                <div class="time-note">
                    💡 마카오와 한국은 시차가 동일합니다 (UTC+8)
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // 닫기 버튼 이벤트
    const closeBtn = popup.querySelector('#timePopupClose');
    if (closeBtn) {
        addEventListener(closeBtn, 'click', () => {
            removeClass(popup, 'show');
            if (typeof window.unregisterPopup === 'function') {
                window.unregisterPopup('time');
            }
        });
    }
    
    // 오버레이 클릭으로 닫기
    addEventListener(popup, 'click', (e) => {
        if (e.target === popup) {
            removeClass(popup, 'show');
            if (typeof window.unregisterPopup === 'function') {
                window.unregisterPopup('time');
            }
        }
    });
    
    return popup;
}

/**
 * FAB 시스템 정리
 */
export function destroyFABSystem() {
    console.log('FAB system destroyed');
}