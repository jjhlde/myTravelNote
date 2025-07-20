/**
 * PWA Local Storage Management System
 * 사용자 수동 입력 데이터 관리 (로그인 없이도 디바이스에 저장)
 */

class PWAStorageManager {
    constructor(tripId = null) {
        this.tripId = tripId || this.generateTripId();
        this.storagePrefix = `travel_${this.tripId}_`;
        this.init();
    }

    // 여행 ID 생성 (세션 기반)
    generateTripId() {
        return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 초기화
    init() {
        this.ensureStorageStructure();
        this.startAutoSave();
    }

    // 스토리지 구조 확보
    ensureStorageStructure() {
        const defaultData = {
            // 교통편 정보
            transport: {
                label: '',
                route: '',
                schedule: '',
                isManuallyAdded: false,
                lastUpdated: null
            },
            
            // 예산 정보
            budget: {
                total: 0,
                breakdown: {
                    accommodation: 0,
                    meals: 0,
                    activities: 0,
                    transport: 0,
                    shopping: 0
                },
                expenses: [],
                isManuallySet: false,
                lastUpdated: null
            },
            
            // 준비물 정보
            todo: {
                categories: {
                    '기타': []
                },
                checkboxStates: {},
                lastUpdated: null
            },
            
            // 일정 메모
            schedule: {
                notes: {},
                modifications: {},
                lastUpdated: null
            },
            
            // 앱 설정
            settings: {
                theme: 'default',
                notifications: true,
                autoSave: true,
                lastSynced: null
            }
        };

        // 기본 데이터가 없으면 생성
        Object.keys(defaultData).forEach(key => {
            const storageKey = this.storagePrefix + key;
            if (!localStorage.getItem(storageKey)) {
                localStorage.setItem(storageKey, JSON.stringify(defaultData[key]));
            }
        });
    }

    // 교통편 정보 관리
    getTransportInfo() {
        const key = this.storagePrefix + 'transport';
        return JSON.parse(localStorage.getItem(key) || '{}');
    }

    setTransportInfo(transportData) {
        const key = this.storagePrefix + 'transport';
        const data = {
            ...transportData,
            isManuallyAdded: true,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(data));
        this.triggerUpdateEvent('transport', data);
        return data;
    }

    // 예산 정보 관리
    getBudgetInfo() {
        const key = this.storagePrefix + 'budget';
        return JSON.parse(localStorage.getItem(key) || '{}');
    }

    setBudgetTotal(amount) {
        const key = this.storagePrefix + 'budget';
        const currentBudget = this.getBudgetInfo();
        const updatedBudget = {
            ...currentBudget,
            total: parseInt(amount),
            isManuallySet: true,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(updatedBudget));
        this.triggerUpdateEvent('budget', updatedBudget);
        return updatedBudget;
    }

    addExpense(expenseData) {
        const key = this.storagePrefix + 'budget';
        const currentBudget = this.getBudgetInfo();
        const newExpense = {
            id: Date.now(),
            ...expenseData,
            date: new Date().toISOString().split('T')[0]
        };
        
        currentBudget.expenses = currentBudget.expenses || [];
        currentBudget.expenses.push(newExpense);
        currentBudget.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(currentBudget));
        this.triggerUpdateEvent('budget', currentBudget);
        return newExpense;
    }

    removeExpense(expenseId) {
        const key = this.storagePrefix + 'budget';
        const currentBudget = this.getBudgetInfo();
        currentBudget.expenses = currentBudget.expenses.filter(exp => exp.id !== expenseId);
        currentBudget.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(currentBudget));
        this.triggerUpdateEvent('budget', currentBudget);
    }

    updateExpense(expenseId, updates) {
        const key = this.storagePrefix + 'budget';
        const currentBudget = this.getBudgetInfo();
        const expenseIndex = currentBudget.expenses.findIndex(exp => exp.id === expenseId);
        
        if (expenseIndex !== -1) {
            currentBudget.expenses[expenseIndex] = {
                ...currentBudget.expenses[expenseIndex],
                ...updates
            };
            currentBudget.lastUpdated = new Date().toISOString();
            
            localStorage.setItem(key, JSON.stringify(currentBudget));
            this.triggerUpdateEvent('budget', currentBudget);
        }
    }

    // 할일/준비물 관리
    getTodoInfo() {
        const key = this.storagePrefix + 'todo';
        return JSON.parse(localStorage.getItem(key) || '{}');
    }

    addTodoCategory(categoryName) {
        const key = this.storagePrefix + 'todo';
        const currentTodo = this.getTodoInfo();
        
        if (!currentTodo.categories[categoryName]) {
            currentTodo.categories[categoryName] = [];
            currentTodo.lastUpdated = new Date().toISOString();
            
            localStorage.setItem(key, JSON.stringify(currentTodo));
            this.triggerUpdateEvent('todo', currentTodo);
        }
        return currentTodo;
    }

    addTodoItem(categoryName, itemText) {
        const key = this.storagePrefix + 'todo';
        const currentTodo = this.getTodoInfo();
        
        if (!currentTodo.categories[categoryName]) {
            currentTodo.categories[categoryName] = [];
        }
        
        const newItem = {
            id: Date.now(),
            text: itemText,
            done: false,
            createdAt: new Date().toISOString()
        };
        
        currentTodo.categories[categoryName].push(newItem);
        currentTodo.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(currentTodo));
        this.triggerUpdateEvent('todo', currentTodo);
        return newItem;
    }

    updateTodoItem(categoryName, itemId, updates) {
        const key = this.storagePrefix + 'todo';
        const currentTodo = this.getTodoInfo();
        
        if (currentTodo.categories[categoryName]) {
            const itemIndex = currentTodo.categories[categoryName].findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                currentTodo.categories[categoryName][itemIndex] = {
                    ...currentTodo.categories[categoryName][itemIndex],
                    ...updates
                };
                currentTodo.lastUpdated = new Date().toISOString();
                
                localStorage.setItem(key, JSON.stringify(currentTodo));
                this.triggerUpdateEvent('todo', currentTodo);
            }
        }
    }

    removeTodoItem(categoryName, itemId) {
        const key = this.storagePrefix + 'todo';
        const currentTodo = this.getTodoInfo();
        
        if (currentTodo.categories[categoryName]) {
            currentTodo.categories[categoryName] = currentTodo.categories[categoryName].filter(item => item.id !== itemId);
            currentTodo.lastUpdated = new Date().toISOString();
            
            localStorage.setItem(key, JSON.stringify(currentTodo));
            this.triggerUpdateEvent('todo', currentTodo);
        }
    }

    setCheckboxState(checkboxIndex, isChecked) {
        const key = this.storagePrefix + 'todo';
        const currentTodo = this.getTodoInfo();
        
        currentTodo.checkboxStates = currentTodo.checkboxStates || {};
        currentTodo.checkboxStates[checkboxIndex] = isChecked;
        currentTodo.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(currentTodo));
        this.triggerUpdateEvent('todo', currentTodo);
    }

    // 일정 메모 관리
    getScheduleNotes() {
        const key = this.storagePrefix + 'schedule';
        return JSON.parse(localStorage.getItem(key) || '{}');
    }

    addScheduleNote(activityId, note) {
        const key = this.storagePrefix + 'schedule';
        const currentSchedule = this.getScheduleNotes();
        
        currentSchedule.notes = currentSchedule.notes || {};
        currentSchedule.notes[activityId] = {
            text: note,
            createdAt: new Date().toISOString()
        };
        currentSchedule.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(currentSchedule));
        this.triggerUpdateEvent('schedule', currentSchedule);
    }

    // 앱 설정 관리
    getSettings() {
        const key = this.storagePrefix + 'settings';
        return JSON.parse(localStorage.getItem(key) || '{}');
    }

    updateSettings(newSettings) {
        const key = this.storagePrefix + 'settings';
        const currentSettings = this.getSettings();
        const updatedSettings = {
            ...currentSettings,
            ...newSettings,
            lastSynced: new Date().toISOString()
        };
        
        localStorage.setItem(key, JSON.stringify(updatedSettings));
        this.triggerUpdateEvent('settings', updatedSettings);
        return updatedSettings;
    }

    // 데이터 백업 및 복원
    exportData() {
        const allData = {};
        
        ['transport', 'budget', 'todo', 'schedule', 'settings'].forEach(type => {
            const key = this.storagePrefix + type;
            allData[type] = JSON.parse(localStorage.getItem(key) || '{}');
        });
        
        return {
            tripId: this.tripId,
            exportedAt: new Date().toISOString(),
            data: allData
        };
    }

    importData(importedData) {
        if (!importedData.data) return false;
        
        try {
            Object.keys(importedData.data).forEach(type => {
                const key = this.storagePrefix + type;
                localStorage.setItem(key, JSON.stringify(importedData.data[type]));
            });
            
            this.triggerUpdateEvent('import', importedData);
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // 데이터 정리
    clearAllData() {
        ['transport', 'budget', 'todo', 'schedule', 'settings'].forEach(type => {
            const key = this.storagePrefix + type;
            localStorage.removeItem(key);
        });
        
        this.triggerUpdateEvent('clear', null);
    }

    // 자동 저장 시작
    startAutoSave() {
        // 30초마다 데이터 유효성 검사
        setInterval(() => {
            this.validateStorageIntegrity();
        }, 30000);
    }

    // 스토리지 무결성 검사
    validateStorageIntegrity() {
        const requiredKeys = ['transport', 'budget', 'todo', 'schedule', 'settings'];
        
        requiredKeys.forEach(type => {
            const key = this.storagePrefix + type;
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    JSON.parse(data); // JSON 유효성 검사
                }
            } catch (error) {
                console.warn(`Storage corruption detected for ${key}, reinitializing...`);
                localStorage.removeItem(key);
                this.ensureStorageStructure();
            }
        });
    }

    // 이벤트 시스템
    triggerUpdateEvent(type, data) {
        const event = new CustomEvent('pwaStorageUpdate', {
            detail: { type, data, tripId: this.tripId }
        });
        window.dispatchEvent(event);
    }

    // 스토리지 사용량 체크
    getStorageUsage() {
        let totalSize = 0;
        
        ['transport', 'budget', 'todo', 'schedule', 'settings'].forEach(type => {
            const key = this.storagePrefix + type;
            const data = localStorage.getItem(key);
            if (data) {
                totalSize += new Blob([data]).size;
            }
        });
        
        return {
            used: totalSize,
            usedMB: (totalSize / (1024 * 1024)).toFixed(2),
            keys: Object.keys(localStorage).filter(key => key.startsWith(this.storagePrefix)).length
        };
    }
}

// 전역에서 사용할 수 있도록 설정
window.PWAStorageManager = PWAStorageManager;