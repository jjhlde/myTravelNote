/**
 * localStorage 통합 관리 시스템
 */

/**
 * 안전한 localStorage 읽기
 * @param {string} key - 키
 * @param {*} defaultValue - 기본값
 * @returns {*} 저장된 값 또는 기본값
 */
export function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        return defaultValue;
    }
}

/**
 * 안전한 localStorage 쓰기
 * @param {string} key - 키
 * @param {*} value - 값
 * @returns {boolean} 성공 여부
 */
export function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing localStorage key "${key}":`, error);
        return false;
    }
}

/**
 * localStorage 키 제거
 * @param {string} key - 키
 * @returns {boolean} 성공 여부
 */
export function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
        return false;
    }
}

/**
 * localStorage 전체 정리
 * @param {string[]} keysToKeep - 유지할 키들
 */
export function clearStorage(keysToKeep = []) {
    try {
        const itemsToKeep = {};
        
        // 유지할 항목들 백업
        keysToKeep.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                itemsToKeep[key] = value;
            }
        });
        
        // 전체 정리
        localStorage.clear();
        
        // 백업한 항목들 복원
        Object.entries(itemsToKeep).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
        
        return true;
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
    }
}

// ========================================
// 지출 데이터 관리
// ========================================

/**
 * 모든 지출 데이터를 가져오는 함수 (기존 데이터 호환성 포함)
 * @returns {Array} 지출 데이터 배열
 */
export function getAllExpenses() {
    // 새로운 데이터 구조 확인
    const macauExpenseData = getStorageItem('macau_expense_data');
    if (macauExpenseData && macauExpenseData.expenses) {
        return macauExpenseData.expenses;
    }
    
    // 기존 데이터 구조 확인 (호환성)
    const legacyData = getStorageItem('travelExpenses');
    if (legacyData && Array.isArray(legacyData)) {
        // 기존 형식을 새로운 형식으로 변환
        return legacyData.map(expense => ({
            id: expense.id,
            amount: expense.amount,
            date: expense.date,
            category: expense.category?.id || 'other',
            memo: expense.memo || '',
            timestamp: expense.timestamp || Date.now()
        }));
    }
    
    // travelBudget에서 데이터 확인 (최후 호환성)
    const budgetData = getStorageItem('travelBudget');
    if (budgetData && budgetData.expenses && Array.isArray(budgetData.expenses)) {
        return budgetData.expenses.map(expense => ({
            id: expense.id,
            amount: expense.amount,
            date: new Date(expense.timestamp).toISOString(),
            category: expense.category?.id || 'other',
            memo: expense.memo || '',
            timestamp: expense.timestamp || Date.now()
        }));
    }
    
    return [];
}

/**
 * 지출 데이터 저장 (통합 형식)
 * @param {Object} expense - 지출 데이터
 * @returns {boolean} 성공 여부
 */
export function saveExpense(expense) {
    try {
        // 새로운 통합 데이터 구조에 저장
        const macauExpenseData = getStorageItem('macau_expense_data', { expenses: [] });
        if (!macauExpenseData.expenses) macauExpenseData.expenses = [];
        
        // 새로운 형식으로 변환
        const normalizedExpense = {
            id: expense.id,
            amount: expense.amount,
            date: expense.date,
            category: expense.category.id || expense.category,
            memo: expense.memo || '',
            timestamp: Date.now()
        };
        
        macauExpenseData.expenses.push(normalizedExpense);
        setStorageItem('macau_expense_data', macauExpenseData);
        
        // 기존 데이터 구조와도 동기화 (호환성 유지)
        const existingData = getStorageItem('travelExpenses', []);
        existingData.push(expense);
        setStorageItem('travelExpenses', existingData);
        
        // 기존 예산 데이터와도 동기화
        const budgetData = getStorageItem('travelBudget', {});
        if (!budgetData.expenses) budgetData.expenses = [];
        
        const legacyExpense = {
            id: expense.id,
            amount: expense.amount,
            timestamp: Date.now(),
            category: {
                id: expense.category.id || expense.category,
                name: expense.category.name || expense.category,
                icon: expense.category.icon || '💳'
            },
            memo: expense.memo || ''
        };
        
        budgetData.expenses.push(legacyExpense);
        setStorageItem('travelBudget', budgetData);
        
        return true;
    } catch (error) {
        console.error('Error saving expense:', error);
        return false;
    }
}

/**
 * 예산 데이터 가져오기
 * @returns {Object} 예산 데이터
 */
export function getBudgetData() {
    return getStorageItem('travelBudget', {
        totalBudget: 0,
        startDate: null,
        endDate: null,
        expenses: []
    });
}

/**
 * 예산 데이터 저장
 * @param {Object} budgetData - 예산 데이터
 * @returns {boolean} 성공 여부
 */
export function saveBudgetData(budgetData) {
    return setStorageItem('travelBudget', budgetData);
}

/**
 * PWA 설치 가이드 표시 여부 확인
 * @returns {boolean} 이미 본 여부
 */
export function hasSeenInstallGuide() {
    return getStorageItem('macau-install-guide-seen', false);
}

/**
 * PWA 설치 가이드 표시 완료 저장
 */
export function markInstallGuideSeen() {
    setStorageItem('macau-install-guide-seen', true);
}

/**
 * 환율 데이터 캐시 관리
 */
export const exchangeRateCache = {
    /**
     * 캐시된 환율 데이터 가져오기
     * @returns {Object|null} 환율 데이터 또는 null
     */
    get() {
        const cached = getStorageItem('macau_exchange_rate_cache');
        if (cached && cached.timestamp) {
            // 1시간 캐시
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - cached.timestamp < oneHour) {
                return cached.data;
            }
        }
        return null;
    },
    
    /**
     * 환율 데이터 캐시
     * @param {Object} data - 환율 데이터
     */
    set(data) {
        setStorageItem('macau_exchange_rate_cache', {
            data: data,
            timestamp: Date.now()
        });
    },
    
    /**
     * 환율 캐시 삭제
     */
    clear() {
        removeStorageItem('macau_exchange_rate_cache');
    }
};

/**
 * 체크박스 상태 관리
 */
export const checkboxStates = {
    /**
     * 체크박스 상태 저장
     * @param {Object} states - 체크박스 상태 객체
     */
    save(states) {
        setStorageItem('macau_checkbox_states', states);
    },
    
    /**
     * 체크박스 상태 가져오기
     * @returns {Object} 체크박스 상태 객체
     */
    get() {
        return getStorageItem('macau_checkbox_states', {});
    },
    
    /**
     * 체크박스 상태 삭제
     */
    clear() {
        removeStorageItem('macau_checkbox_states');
    }
};

/**
 * 기본 아이템 텍스트 관리
 */
export const basicItemTexts = {
    /**
     * 기본 아이템 텍스트 저장
     * @param {Object} texts - 텍스트 객체
     */
    save(texts) {
        setStorageItem('macau_basic_item_texts', texts);
    },
    
    /**
     * 기본 아이템 텍스트 가져오기
     * @returns {Object} 텍스트 객체
     */
    get() {
        return getStorageItem('macau_basic_item_texts', {});
    },
    
    /**
     * 기본 아이템 텍스트 삭제
     */
    clear() {
        removeStorageItem('macau_basic_item_texts');
    }
};

/**
 * 지출 데이터 저장 (새로운 형식)
 * @param {Object} expense - 지출 데이터
 * @returns {boolean} 성공 여부
 */
export function saveExpenseData(expense) {
    try {
        // 현재 지출 데이터 가져오기
        const allExpenses = getAllExpenses();
        
        // 새로운 지출 추가
        allExpenses.push(expense);
        
        // 새로운 통합 데이터 구조에 저장
        const macauExpenseData = {
            expenses: allExpenses,
            lastUpdated: Date.now()
        };
        
        setStorageItem('macau_expense_data', macauExpenseData);
        
        // 기존 데이터 구조와도 동기화 (호환성 유지)
        const legacyExpenses = getStorageItem('travelExpenses', []);
        legacyExpenses.push({
            id: expense.id,
            amount: expense.amount,
            date: expense.date,
            category: {
                id: expense.category,
                name: getCategoryName(expense.category),
                icon: getCategoryIcon(expense.category)
            },
            memo: expense.memo,
            timestamp: expense.timestamp
        });
        setStorageItem('travelExpenses', legacyExpenses);
        
        return true;
    } catch (error) {
        console.error('Error saving expense data:', error);
        return false;
    }
}

/**
 * 현재 지출 데이터 가져오기 (간소화 버전)
 * @returns {Array} 지출 데이터 배열
 */
export function getCurrentExpenses() {
    return getAllExpenses();
}

/**
 * 카테고리명 가져오기
 * @param {string} categoryId - 카테고리 ID
 * @returns {string} 카테고리명
 */
function getCategoryName(categoryId) {
    const categoryNames = {
        transport: '교통비',
        food: '식비',
        snack: '간식',
        shopping: '쇼핑',
        souvenir: '기념품',
        attraction: '관광',
        accommodation: '숙박비',
        other: '기타'
    };
    return categoryNames[categoryId] || '기타';
}

/**
 * 카테고리 아이콘 가져오기
 * @param {string} categoryId - 카테고리 ID
 * @returns {string} 카테고리 아이콘
 */
function getCategoryIcon(categoryId) {
    const categoryIcons = {
        transport: '🚗',
        food: '🍽️',
        snack: '🍿',
        shopping: '🛍️',
        souvenir: '🎁',
        attraction: '🎡',
        accommodation: '🏨',
        other: '💳'
    };
    return categoryIcons[categoryId] || '💳';
}

/**
 * 지출 데이터 업데이트
 * @param {string} expenseId - 지출 ID
 * @param {Object} updatedExpense - 업데이트된 지출 데이터
 * @returns {boolean} 성공 여부
 */
export function updateExpenseInStorage(expenseId, updatedExpense) {
    try {
        // 메인 데이터 업데이트
        const macauExpenseData = getStorageItem('macau_expense_data', { expenses: [] });
        const expenseIndex = macauExpenseData.expenses.findIndex(e => e.id === expenseId);
        
        if (expenseIndex !== -1) {
            macauExpenseData.expenses[expenseIndex] = updatedExpense;
            macauExpenseData.lastUpdated = Date.now();
            setStorageItem('macau_expense_data', macauExpenseData);
        }
        
        // 레거시 데이터도 업데이트
        const legacyExpenses = getStorageItem('travelExpenses', []);
        const legacyIndex = legacyExpenses.findIndex(e => e.id === expenseId);
        
        if (legacyIndex !== -1) {
            legacyExpenses[legacyIndex] = {
                id: updatedExpense.id,
                amount: updatedExpense.amount,
                date: updatedExpense.date,
                category: {
                    id: updatedExpense.category,
                    name: getCategoryName(updatedExpense.category),
                    icon: getCategoryIcon(updatedExpense.category)
                },
                memo: updatedExpense.memo,
                timestamp: updatedExpense.timestamp
            };
            setStorageItem('travelExpenses', legacyExpenses);
        }
        
        return true;
    } catch (error) {
        console.error('Error updating expense:', error);
        return false;
    }
}

/**
 * 지출 데이터 삭제
 * @param {string} expenseId - 지출 ID
 * @returns {boolean} 성공 여부
 */
export function removeExpenseFromStorage(expenseId) {
    try {
        console.log('🗑️ 지출 삭제 시작 - ID:', expenseId, 'Type:', typeof expenseId);
        
        // 메인 데이터에서 삭제
        const macauExpenseData = getStorageItem('macau_expense_data', { expenses: [] });
        console.log('삭제 전 지출 개수:', macauExpenseData.expenses.length);
        console.log('삭제 전 ID 목록:', macauExpenseData.expenses.map(e => `${e.id}(${typeof e.id})`));
        
        const beforeCount = macauExpenseData.expenses.length;
        macauExpenseData.expenses = macauExpenseData.expenses.filter(e => {
            const shouldKeep = e.id !== expenseId;
            if (!shouldKeep) {
                console.log('✅ 삭제 대상 발견:', e.id, '===', expenseId, '?', e.id === expenseId);
            }
            return shouldKeep;
        });
        const afterCount = macauExpenseData.expenses.length;
        
        console.log('삭제 후 지출 개수:', afterCount, '(변화:', beforeCount - afterCount, ')');
        console.log('삭제 후 ID 목록:', macauExpenseData.expenses.map(e => e.id));
        
        if (beforeCount === afterCount) {
            console.warn('⚠️ 삭제되지 않음! ID 불일치 가능성');
            // ID 타입 변환 시도
            const numericId = parseInt(expenseId);
            if (!isNaN(numericId)) {
                console.log('숫자 ID로 재시도:', numericId);
                macauExpenseData.expenses = macauExpenseData.expenses.filter(e => {
                    return e.id !== expenseId && e.id !== numericId && parseInt(e.id) !== numericId;
                });
                console.log('숫자 변환 후 지출 개수:', macauExpenseData.expenses.length);
            }
        }
        
        macauExpenseData.lastUpdated = Date.now();
        setStorageItem('macau_expense_data', macauExpenseData);
        
        // 레거시 데이터에서도 삭제
        const legacyExpenses = getStorageItem('travelExpenses', []);
        const filteredLegacy = legacyExpenses.filter(e => e.id !== expenseId);
        setStorageItem('travelExpenses', filteredLegacy);
        
        // 예산 데이터에서도 삭제
        const budgetData = getStorageItem('travelBudget', {});
        if (budgetData.expenses) {
            budgetData.expenses = budgetData.expenses.filter(e => e.id !== expenseId);
            setStorageItem('travelBudget', budgetData);
        }
        
        console.log('✅ 지출 삭제 완료');
        return true;
    } catch (error) {
        console.error('❌ Error removing expense:', error);
        return false;
    }
}