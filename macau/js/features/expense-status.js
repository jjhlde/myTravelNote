/**
 * 지출 현황 페이지 시스템
 */

import { getAllExpenses } from '../core/storage.js';
import { getElement } from '../utils/dom-helpers.js';

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

// 여행 날짜 정보
const TRAVEL_DATES = [
    { date: '2025-07-27', label: '첫째날', day: '7/27' },
    { date: '2025-07-28', label: '둘째날', day: '7/28' },
    { date: '2025-07-29', label: '셋째날', day: '7/29' },
    { date: '2025-07-30', label: '넷째날', day: '7/30' }
];

/**
 * 지출 현황 시스템 초기화
 */
export function initExpenseStatus() {
    initExpenseTracking();
    
    // 지출 추가 이벤트 리스너
    document.addEventListener('expenseAdded', (e) => {
        updateExpenseStatus();
    });
    
    console.log('Expense status system initialized');
}

/**
 * 지출 추적 시스템 초기화
 */
function initExpenseTracking() {
    updateExpenseStatus();
}

/**
 * 지출 현황 업데이트
 */
function updateExpenseStatus() {
    const expenses = getAllExpenses();
    
    updateTotalExpense(expenses);
    updateCategoryExpenses(expenses);
    updateDailyExpenses(expenses);
    updateRecentExpenses(expenses);
}

/**
 * 총 지출 현황 업데이트
 */
function updateTotalExpense(expenses) {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalAmountElement = getElement('#totalExpenseAmount');
    const progressElement = getElement('#expenseProgress');
    
    if (totalAmountElement) {
        totalAmountElement.textContent = `${totalAmount.toLocaleString()}원`;
    }
    
    // 진행률 계산 (예상 범위: 75만원 ~ 120만원)
    const minBudget = 750000;
    const maxBudget = 1200000;
    const progressPercent = Math.min((totalAmount / maxBudget) * 100, 100);
    
    if (progressElement) {
        progressElement.style.width = `${progressPercent}%`;
    }
}

/**
 * 카테고리별 지출 현황 업데이트
 */
function updateCategoryExpenses(expenses) {
    const categoryTotals = {};
    
    // 카테고리별 합계 계산
    expenses.forEach(expense => {
        const category = expense.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += expense.amount;
    });
    
    // 카테고리별 UI 업데이트
    Object.keys(categories).forEach(categoryId => {
        const amount = categoryTotals[categoryId] || 0;
        const categoryElement = document.querySelector(`[data-category="${categoryId}"] .category-amount`);
        
        if (categoryElement) {
            categoryElement.textContent = `${amount.toLocaleString()}원`;
            categoryElement.dataset.amount = amount;
        }
    });
}

/**
 * 날짜별 지출 현황 업데이트 (오늘 날짜 기준)
 */
function updateDailyExpenses(expenses) {
    const dailyTotals = {};
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    // 실제 지출된 날짜별로 계산
    expenses.forEach(expense => {
        let expenseDate;
        
        if (expense.date) {
            // expense.date가 있는 경우 (ISO 형식)
            expenseDate = expense.date.split('T')[0];
        } else if (expense.timestamp) {
            // timestamp만 있는 경우
            expenseDate = new Date(expense.timestamp).toISOString().split('T')[0];
        } else {
            // 둘 다 없는 경우 오늘 날짜로 처리
            expenseDate = todayString;
        }
        
        if (!dailyTotals[expenseDate]) {
            dailyTotals[expenseDate] = 0;
        }
        dailyTotals[expenseDate] += expense.amount;
    });
    
    // 여행 날짜별 UI 업데이트
    TRAVEL_DATES.forEach(travelDate => {
        const amount = dailyTotals[travelDate.date] || 0;
        const dailyElement = document.querySelector(`[data-date="${travelDate.date}"] .daily-amount`);
        
        if (dailyElement) {
            dailyElement.textContent = `${amount.toLocaleString()}원`;
            dailyElement.dataset.amount = amount;
        }
    });
    
    // 오늘 날짜가 여행 기간 외인 경우, 실제 지출이 있다면 임시로 표시
    if (!TRAVEL_DATES.find(d => d.date === todayString)) {
        const todayTotal = dailyTotals[todayString] || 0;
        if (todayTotal > 0) {
            // 오늘 지출이 있으면 콘솔에 로그 (디버깅용)
            console.log(`오늘(${todayString}) 지출: ${todayTotal.toLocaleString()}원`);
            
            // 첫 번째 날짜에 임시로 표시 (테스트용)
            const firstDayElement = document.querySelector(`[data-date="${TRAVEL_DATES[0].date}"] .daily-amount`);
            if (firstDayElement) {
                const existingAmount = parseInt(firstDayElement.dataset.amount) || 0;
                const totalAmount = existingAmount + todayTotal;
                firstDayElement.textContent = `${totalAmount.toLocaleString()}원`;
                firstDayElement.dataset.amount = totalAmount;
            }
        }
    }
}

/**
 * 최근 지출 내역 업데이트
 */
function updateRecentExpenses(expenses) {
    const recentExpensesList = getElement('#recentExpensesList');
    
    if (!recentExpensesList) return;
    
    if (expenses.length === 0) {
        recentExpensesList.innerHTML = `
            <div class="no-expenses-message">
                아직 지출 내역이 없습니다.<br>
                <small>하단 💰 버튼을 눌러 지출을 기록해보세요!</small>
            </div>
        `;
        return;
    }
    
    // 최근 5개 지출만 표시
    const recentExpenses = expenses
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5);
    
    const expenseHTML = recentExpenses.map(expense => {
        const category = categories[expense.category] || categories.other;
        const date = expense.timestamp ? new Date(expense.timestamp) : new Date();
        const timeString = date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `
            <div class="recent-expense-item">
                <div class="recent-expense-info">
                    <div class="recent-expense-icon">${category.icon}</div>
                    <div class="recent-expense-details">
                        <div class="recent-expense-category">${category.name}</div>
                        <div class="recent-expense-time">${timeString}</div>
                    </div>
                </div>
                <div class="recent-expense-amount">${expense.amount.toLocaleString()}원</div>
            </div>
        `;
    }).join('');
    
    recentExpensesList.innerHTML = expenseHTML;
}

/**
 * 날짜 문자열을 한국어 형식으로 변환
 */
function formatDateKorean(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

/**
 * 지출 현황 시스템 정리
 */
export function destroyExpenseStatus() {
    // 이벤트 리스너 제거는 자동으로 처리됨
    console.log('Expense status system destroyed');
}