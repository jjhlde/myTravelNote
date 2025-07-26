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
    isOpen: false
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
    initAmountInput();
    initQuickAmountButtons();
    initMemoInput();
    initActionButtons();
    
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
        amountDisplay.textContent = amount.toLocaleString();
    }
    
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
    
    // UI 초기화
    const amountInput = getElement('#expenseAmountInput');
    const amountDisplay = getElement('#amountDisplay');
    const memoInput = getElement('#expenseMemoInput');
    
    if (amountInput) amountInput.value = '';
    if (amountDisplay) amountDisplay.textContent = '0';
    if (memoInput) memoInput.value = '';
    
    // 첫 번째 카테고리 선택
    selectCategory('transport');
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
    
    const expense = {
        id: generateUniqueId(),
        category: expenseState.category,
        amount: expenseState.amount,
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
    const message = `${categoryInfo.icon} ${categoryInfo.name} ${expenseState.amount.toLocaleString()}원이 추가되었습니다.`;
    
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