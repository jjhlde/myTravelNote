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