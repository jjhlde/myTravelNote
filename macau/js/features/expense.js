/**
 * 지출 입력 시스템
 */

import { getElement, addClass, removeClass, addEventListener } from '../utils/dom-helpers.js';
import { saveExpenseData, getCurrentExpenses } from '../core/storage.js';

// 지출 입력 상태
let expenseState = {
    category: 'transport',
    amount: 0,
    memo: '',
    isOpen: false,
    currency: 'MOP', // 기본 통화 MOP
    exchangeRate: 174.25 // 기본 환율 (1 MOP = 174.25 KRW)
};

// 카테고리 정보
const categories = {
    transport: { icon: '🚗', name: '교통비', color: '#3B82F6' },
    food: { icon: '🍽️', name: '식비', color: '#F59E0B' },
    snack: { icon: '🍿', name: '간식', color: '#10B981' },
    shopping: { icon: '🛍️', name: '쇼핑', color: '#8B5CF6' },
    souvenir: { icon: '🎁', name: '기념품', color: '#EF4444' },
    attraction: { icon: '🎡', name: '관광', color: '#F97316' },
    accommodation: { icon: '🏨', name: '숙박비', color: '#059669' },
    other: { icon: '💳', name: '기타', color: '#6B7280' }
};

/**
 * 지출 입력 시스템 초기화
 */
export function initExpenseInput() {
    initExpensePopup();
    initCategoryTabs();
    initCurrencyTabs();
    initAmountInput();
    initQuickAmountButtons();
    initMemoInput();
    initActionButtons();
    loadExchangeRate();
    
    console.log('Expense input system initialized');
}

/**
 * 지출 팝업 초기화
 */
function initExpensePopup() {
    const overlay = getElement('#expensePopupOverlay');
    const closeBtn = getElement('#expensePopupClose');
    
    if (!overlay) return;
    
    // 팝업 닫기 이벤트들
    if (closeBtn) {
        addEventListener(closeBtn, 'click', closeExpensePopup);
    }
    
    addEventListener(overlay, 'click', (e) => {
        if (e.target === overlay) {
            closeExpensePopup();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && expenseState.isOpen) {
            closeExpensePopup();
        }
    });
}

/**
 * 카테고리 탭 초기화
 */
function initCategoryTabs() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    
    categoryTabs.forEach(tab => {
        addEventListener(tab, 'click', () => {
            const category = tab.dataset.category;
            selectCategory(category);
        });
    });
}

/**
 * 카테고리 선택
 */
function selectCategory(category) {
    expenseState.category = category;
    
    // 탭 활성화 상태 업데이트
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        if (tab.dataset.category === category) {
            addClass(tab, 'active');
        } else {
            removeClass(tab, 'active');
        }
    });
    
    updateAddButton();
}

/**
 * 통화 탭 초기화
 */
function initCurrencyTabs() {
    const currencyTabs = document.querySelectorAll('.currency-tab');
    
    currencyTabs.forEach(tab => {
        addEventListener(tab, 'click', () => {
            const currency = tab.dataset.currency;
            selectCurrency(currency);
        });
    });
}

/**
 * 통화 선택
 */
function selectCurrency(currency) {
    expenseState.currency = currency;
    
    // 탭 활성화 상태 업데이트
    const currencyTabs = document.querySelectorAll('.currency-tab');
    currencyTabs.forEach(tab => {
        if (tab.dataset.currency === currency) {
            addClass(tab, 'active');
        } else {
            removeClass(tab, 'active');
        }
    });
    
    // UI 업데이트
    updateCurrencyDisplay();
    updateQuickAmountButtons();
    resetAmount();
}

/**
 * 통화 표시 업데이트
 */
function updateCurrencyDisplay() {
    const displaySymbol = getElement('#displayCurrencySymbol');
    const inputUnit = getElement('#inputCurrencyUnit');
    const amountInput = getElement('#expenseAmountInput');
    
    if (expenseState.currency === 'MOP') {
        if (displaySymbol) displaySymbol.textContent = 'MOP';
        if (inputUnit) inputUnit.textContent = 'MOP';
        if (amountInput) {
            amountInput.placeholder = '금액을 입력하세요 (MOP)';
            amountInput.step = '1';
        }
    } else {
        if (displaySymbol) displaySymbol.textContent = '₩';
        if (inputUnit) inputUnit.textContent = '원';
        if (amountInput) {
            amountInput.placeholder = '금액을 입력하세요 (원)';
            amountInput.step = '100';
        }
    }
    
    // 환율 정보 표시/숨김
    const exchangeInfo = getElement('#exchangeInfo');
    if (exchangeInfo) {
        if (expenseState.currency === 'MOP') {
            exchangeInfo.style.display = 'block';
            updateExchangeDisplay();
        } else {
            exchangeInfo.style.display = 'none';
        }
    }
}

/**
 * 환율 정보 로드 (환율 계산기에서 가져오기)
 */
async function loadExchangeRate() {
    try {
        // 환율 계산기의 캐시된 데이터 확인
        const { exchangeRateCache } = await import('../core/storage.js');
        const cachedRate = exchangeRateCache.get();
        
        if (cachedRate && cachedRate.rate) {
            expenseState.exchangeRate = cachedRate.rate;
        }
        
        updateExchangeDisplay();
    } catch (error) {
        console.warn('환율 정보 로드 실패, 기본값 사용:', error);
        expenseState.exchangeRate = 174.25;
        updateExchangeDisplay();
    }
}

/**
 * 환율 표시 업데이트
 */
function updateExchangeDisplay() {
    const rateText = getElement('.rate-text');
    if (rateText) {
        rateText.textContent = `1 MOP = ${Math.round(expenseState.exchangeRate)}원`;
    }
    
    // 현재 금액이 있으면 변환된 금액 표시
    if (expenseState.amount > 0 && expenseState.currency === 'MOP') {
        const convertedAmount = getElement('#convertedAmount');
        if (convertedAmount) {
            const krwAmount = Math.round(expenseState.amount * expenseState.exchangeRate);
            convertedAmount.textContent = `≈ ${krwAmount.toLocaleString()}원`;
        }
    }
}

/**
 * 금액 입력 초기화
 */
function initAmountInput() {
    const amountInput = getElement('#expenseAmountInput');
    const amountDisplay = getElement('#amountDisplay');
    
    if (!amountInput) return;
    
    addEventListener(amountInput, 'input', (e) => {
        const value = parseInt(e.target.value) || 0;
        expenseState.amount = value;
        
        // 금액 디스플레이 업데이트
        if (amountDisplay) {
            amountDisplay.textContent = value.toLocaleString();
        }
        
        updateAddButton();
    });
    
    // Enter 키로 추가
    addEventListener(amountInput, 'keydown', (e) => {
        if (e.key === 'Enter' && expenseState.amount > 0) {
            addExpense();
        }
    });
}

/**
 * 빠른 금액 버튼 초기화
 */
function initQuickAmountButtons() {
    const quickButtons = document.querySelectorAll('.quick-amount-btn');
    
    quickButtons.forEach(btn => {
        addEventListener(btn, 'click', () => {
            const amount = parseInt(btn.dataset.amount) || 0;
            const currentAmount = expenseState.amount || 0;
            const newAmount = currentAmount + amount;
            
            setAmount(newAmount);
        });
    });
}

/**
 * 빠른 금액 버튼 업데이트 (통화별로)
 */
function updateQuickAmountButtons() {
    const buttonsContainer = getElement('#quickAmountButtons');
    if (!buttonsContainer) return;
    
    if (expenseState.currency === 'MOP') {
        buttonsContainer.innerHTML = `
            <button class="quick-amount-btn" data-amount="10" data-currency="MOP">+10</button>
            <button class="quick-amount-btn" data-amount="50" data-currency="MOP">+50</button>
            <button class="quick-amount-btn" data-amount="100" data-currency="MOP">+100</button>
            <button class="quick-amount-btn" data-amount="200" data-currency="MOP">+200</button>
        `;
    } else {
        buttonsContainer.innerHTML = `
            <button class="quick-amount-btn" data-amount="1000" data-currency="KRW">+1천</button>
            <button class="quick-amount-btn" data-amount="5000" data-currency="KRW">+5천</button>
            <button class="quick-amount-btn" data-amount="10000" data-currency="KRW">+1만</button>
            <button class="quick-amount-btn" data-amount="50000" data-currency="KRW">+5만</button>
        `;
    }
    
    // 새로운 버튼들에 이벤트 리스너 다시 등록
    const newButtons = buttonsContainer.querySelectorAll('.quick-amount-btn');
    newButtons.forEach(btn => {
        addEventListener(btn, 'click', () => {
            const amount = parseInt(btn.dataset.amount) || 0;
            const currentAmount = expenseState.amount || 0;
            const newAmount = currentAmount + amount;
            
            setAmount(newAmount);
        });
    });
}

/**
 * 금액 초기화
 */
function resetAmount() {
    setAmount(0);
}

/**
 * 금액 설정
 */
function setAmount(amount) {
    expenseState.amount = amount;
    
    const amountInput = getElement('#expenseAmountInput');
    const amountDisplay = getElement('#amountDisplay');
    
    if (amountInput) {
        amountInput.value = amount;
    }
    
    if (amountDisplay) {
        if (expenseState.currency === 'MOP') {
            amountDisplay.textContent = amount.toLocaleString();
        } else {
            amountDisplay.textContent = amount.toLocaleString();
        }
    }
    
    // 환율 변환 표시 업데이트
    updateExchangeDisplay();
    updateAddButton();
}

/**
 * 메모 입력 초기화
 */
function initMemoInput() {
    const memoInput = getElement('#expenseMemoInput');
    
    if (!memoInput) return;
    
    addEventListener(memoInput, 'input', (e) => {
        expenseState.memo = e.target.value.trim();
    });
}

/**
 * 액션 버튼 초기화
 */
function initActionButtons() {
    const cancelBtn = getElement('#expenseCancelBtn');
    const addBtn = getElement('#expenseAddBtn');
    
    if (cancelBtn) {
        addEventListener(cancelBtn, 'click', closeExpensePopup);
    }
    
    if (addBtn) {
        addEventListener(addBtn, 'click', addExpense);
    }
}

/**
 * 추가 버튼 상태 업데이트
 */
function updateAddButton() {
    const addBtn = getElement('#expenseAddBtn');
    
    if (!addBtn) return;
    
    const isValid = expenseState.amount > 0;
    
    if (isValid) {
        addBtn.disabled = false;
        removeClass(addBtn, 'disabled');
    } else {
        addBtn.disabled = true;
        addClass(addBtn, 'disabled');
    }
}

/**
 * 지출 팝업 열기
 */
export function openExpensePopup() {
    const overlay = getElement('#expensePopupOverlay');
    
    if (!overlay) return;
    
    // 상태 초기화
    resetExpenseState();
    
    addClass(overlay, 'show');
    expenseState.isOpen = true;
    
    // 뒤로가기 버튼으로 닫기 등록
    if (typeof window.registerPopup === 'function') {
        window.registerPopup('expense', () => {
            closeExpensePopup();
        });
    }
    
    // 금액 입력 필드에 포커스
    setTimeout(() => {
        const amountInput = getElement('#expenseAmountInput');
        if (amountInput) {
            amountInput.focus();
        }
    }, 300);
}

/**
 * 지출 팝업 닫기
 */
export function closeExpensePopup() {
    const overlay = getElement('#expensePopupOverlay');
    
    if (!overlay) return;
    
    removeClass(overlay, 'show');
    expenseState.isOpen = false;
    
    // 뒤로가기 버튼 등록 해제
    if (typeof window.unregisterPopup === 'function') {
        window.unregisterPopup('expense');
    }
    
    // 상태 초기화
    setTimeout(() => {
        resetExpenseState();
    }, 300);
}

/**
 * 지출 상태 초기화
 */
function resetExpenseState() {
    expenseState.category = 'transport';
    expenseState.amount = 0;
    expenseState.memo = '';
    expenseState.currency = 'MOP'; // 기본 통화 MOP
    
    // UI 초기화
    const amountInput = getElement('#expenseAmountInput');
    const amountDisplay = getElement('#amountDisplay');
    const memoInput = getElement('#expenseMemoInput');
    
    if (amountInput) amountInput.value = '';
    if (amountDisplay) amountDisplay.textContent = '0';
    if (memoInput) memoInput.value = '';
    
    // 첫 번째 카테고리 선택
    selectCategory('transport');
    
    // 기본 통화 선택
    selectCurrency('MOP');
}

/**
 * 고유 ID 생성 (중복 방지)
 * @returns {string} 고유 ID
 */
function generateUniqueId() {
    // 현재 시간 + 랜덤 숫자 조합으로 중복 방지
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${random}`;
}

/**
 * 지출 추가
 */
function addExpense() {
    if (expenseState.amount <= 0) return;
    
    // 원화로 변환하여 저장 (MOP인 경우 환율 적용)
    let krwAmount = expenseState.amount;
    if (expenseState.currency === 'MOP') {
        krwAmount = Math.round(expenseState.amount * expenseState.exchangeRate);
    }
    
    const expense = {
        id: generateUniqueId(),
        category: expenseState.category,
        amount: krwAmount, // 항상 원화로 저장
        originalAmount: expenseState.amount, // 원래 입력 금액
        originalCurrency: expenseState.currency, // 원래 입력 통화
        exchangeRate: expenseState.currency === 'MOP' ? expenseState.exchangeRate : 1, // 적용된 환율
        memo: expenseState.memo,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    // 저장
    try {
        saveExpenseData(expense);
        
        // 성공 피드백
        showSuccessMessage();
        
        // 팝업 닫기
        closeExpensePopup();
        
        // 지출 현황 업데이트 (이벤트 발송)
        document.dispatchEvent(new CustomEvent('expenseAdded', { 
            detail: expense 
        }));
        
    } catch (error) {
        console.error('지출 저장 실패:', error);
        showErrorMessage('지출 저장에 실패했습니다.');
    }
}

/**
 * 성공 메시지 표시
 */
function showSuccessMessage() {
    const categoryInfo = categories[expenseState.category];
    let message;
    
    if (expenseState.currency === 'MOP') {
        const krwAmount = Math.round(expenseState.amount * expenseState.exchangeRate);
        message = `${categoryInfo.icon} ${categoryInfo.name} ${expenseState.amount.toLocaleString()} MOP (${krwAmount.toLocaleString()}원)이 추가되었습니다.`;
    } else {
        message = `${categoryInfo.icon} ${categoryInfo.name} ${expenseState.amount.toLocaleString()}원이 추가되었습니다.`;
    }
    
    // 간단한 토스트 메시지
    showToast(message, 'success');
}

/**
 * 에러 메시지 표시
 */
function showErrorMessage(message) {
    showToast(message, 'error');
}

/**
 * 토스트 메시지 표시
 */
function showToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.expense-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `expense-toast expense-toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => addClass(toast, 'show'), 100);
    
    // 자동 제거
    setTimeout(() => {
        removeClass(toast, 'show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * 지출 입력 시스템 정리
 */
export function destroyExpenseInput() {
    expenseState = {
        category: 'transport',
        amount: 0,
        memo: '',
        isOpen: false
    };
    
    console.log('Expense input system destroyed');
}