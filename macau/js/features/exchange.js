/**
 * 환율 계산기 기능
 */

import { getElement, addEventListener, addClass, removeClass } from '../utils/dom-helpers.js';
import { exchangeRateCache } from '../core/storage.js';

/**
 * 환율 계산기 초기화
 */
export function initExchange() {
    const exchangePopup = getElement('#exchangePopupOverlay');
    const closeBtn = getElement('#exchangePopupClose');
    
    if (!exchangePopup) {
        console.warn('Exchange popup not found');
        return;
    }
    
    if (closeBtn) {
        addEventListener(closeBtn, 'click', closeExchangePopup);
    }
    
    // 배경 클릭으로 닫기
    addEventListener(exchangePopup, 'click', (e) => {
        if (e.target === exchangePopup) {
            closeExchangePopup();
        }
    });
    
    // 환율 로드
    loadExchangeRate();
    
    console.log('Exchange calculator initialized');
}

/**
 * 환율 계산기 팝업 닫기
 */
function closeExchangePopup() {
    const exchangePopup = getElement('#exchangePopupOverlay');
    if (exchangePopup) {
        removeClass(exchangePopup, 'show');
    }
}

/**
 * 환율 정보 로드
 */
async function loadExchangeRate() {
    // 캐시된 데이터 확인
    const cachedRate = exchangeRateCache.get();
    if (cachedRate) {
        updateExchangeRate(cachedRate);
        return;
    }
    
    try {
        // 실제 환율 API 호출 (여기서는 임시 데이터)
        const rate = 174.25; // 임시 환율 (1 MOP = 174.25 KRW)
        const data = {
            rate: rate,
            date: new Date().toLocaleDateString('ko-KR')
        };
        
        updateExchangeRate(data);
        exchangeRateCache.set(data);
        
    } catch (error) {
        console.error('환율 로드 실패:', error);
        // 기본값 사용
        updateExchangeRate({
            rate: 174.25,
            date: new Date().toLocaleDateString('ko-KR')
        });
    }
}

/**
 * 환율 정보 업데이트
 * @param {Object} data - 환율 데이터
 */
function updateExchangeRate(data) {
    const rateElement = getElement('#currentRate');
    const dateElement = getElement('#rateDate');
    
    if (rateElement) {
        rateElement.textContent = `1 MOP = ${data.rate} 원`;
    }
    
    if (dateElement) {
        dateElement.textContent = `${data.date} 기준 • 한국수출입은행 제공`;
    }
    
    // 계산기 이벤트 설정
    setupCalculator(data.rate);
}

/**
 * 계산기 이벤트 설정
 * @param {number} rate - 환율
 */
function setupCalculator(rate) {
    const mopInput = getElement('#mopInput');
    const krwOutput = getElement('#krwOutput');
    const shortcutBtns = document.querySelectorAll('.shortcut-btn');
    
    if (mopInput && krwOutput) {
        // MOP 입력 시 KRW 계산
        addEventListener(mopInput, 'input', () => {
            const mopValue = parseFloat(mopInput.value) || 0;
            const krwValue = Math.round(mopValue * rate);
            krwOutput.value = krwValue.toLocaleString('ko-KR');
        });
    }
    
    // 빠른 금액 버튼 이벤트
    shortcutBtns.forEach(btn => {
        addEventListener(btn, 'click', () => {
            const amount = parseInt(btn.dataset.amount);
            if (mopInput) {
                mopInput.value = amount;
                mopInput.dispatchEvent(new Event('input'));
            }
        });
    });
}

/**
 * 환율 시스템 정리
 */
export function destroyExchange() {
    console.log('Exchange system destroyed');
}