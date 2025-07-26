/**
 * 메인 애플리케이션 초기화 및 관리
 */

import { initNavigation, onPageChange } from './navigation.js';
import { initImageSystem, reinitializeSliders, openFlightTicket } from '../features/image-popup.js';
import { initPWAInstall } from '../features/pwa-install.js';
import { initExchange } from '../features/exchange.js';
import { initFABSystem } from '../features/fab.js';
import { initExpenseInput } from '../features/expense.js';
import { initExpenseStatus } from '../features/expense-status.js';
import { initBudgetManager } from '../features/budget.js';
import { setTodoExecutor } from '../features/todo.js';
import { setTodoScriptExecutor } from './navigation.js';
import { isInStandaloneMode, getElement } from '../utils/dom-helpers.js';

// 안드로이드 뒤로가기 버튼 처리 시스템
class BackButtonHandler {
    constructor() {
        this.popupStack = [];
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        // popstate 이벤트 리스너 등록 (뒤로가기 버튼 감지)
        window.addEventListener('popstate', this.handlePopState.bind(this));
        
        // beforeunload 이벤트로 추가 보호 (브라우저 새로고침/닫기 방지)
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '마카오 여행 앱을 종료하시겠습니까?';
            return '마카오 여행 앱을 종료하시겠습니까?';
        });
        
        // 초기 히스토리 상태 설정 (뒤로가기 감지를 위해 엔트리 추가)
        history.replaceState({ page: 'main', appInit: true }, '', window.location.href);
        // PWA 앱 종료 감지를 위한 추가 히스토리 엔트리
        history.pushState({ page: 'main', canExit: true }, '', window.location.href);
        
        this.isInitialized = true;
        console.log('🔙 안드로이드 뒤로가기 버튼 핸들러 초기화 완료');
    }

    // 팝업이 열릴 때 히스토리 스택에 추가
    pushPopupState(popupId, closeFunction) {
        const state = {
            page: 'popup',
            popupId: popupId,
            timestamp: Date.now()
        };
        
        history.pushState(state, '', window.location.href);
        this.popupStack.push({
            popupId: popupId,
            closeFunction: closeFunction
        });
        
        console.log(`📱 팝업 열림: ${popupId}, 스택 크기: ${this.popupStack.length}`);
    }

    // 팝업이 닫힐 때 히스토리 스택에서 제거
    popPopupState(popupId) {
        const index = this.popupStack.findIndex(popup => popup.popupId === popupId);
        if (index !== -1) {
            this.popupStack.splice(index, 1);
            console.log(`📱 팝업 닫힘: ${popupId}, 스택 크기: ${this.popupStack.length}`);
        }
    }

    // 뒤로가기 버튼 처리
    handlePopState(event) {
        console.log('🔙 뒤로가기 버튼 감지:', event.state);
        console.log('🔙 현재 팝업 스택 크기:', this.popupStack.length);
        console.log('🔙 팝업 스택:', this.popupStack);
        
        // 이벤트 기본 동작 방지
        event.preventDefault && event.preventDefault();
        
        if (this.popupStack.length > 0) {
            // 가장 최근에 열린 팝업 닫기
            const latestPopup = this.popupStack.pop();
            console.log(`🔙 팝업 닫기: ${latestPopup.popupId}`);
            
            // 팝업 닫기 함수 실행
            if (typeof latestPopup.closeFunction === 'function') {
                latestPopup.closeFunction();
            }
            
            // 추가 팝업이 있다면 히스토리 유지
            if (this.popupStack.length > 0) {
                history.pushState({ page: 'popup' }, '', window.location.href);
            }
        } else {
            // 팝업이 없으면 PWA 앱 종료 확인
            console.log('🔙 메인 페이지에서 뒤로가기 - 앱 종료 확인');
            this.handleAppExit();
        }
    }

    // PWA 앱 종료 처리
    handleAppExit() {
        // 종료 확인 다이얼로그
        const confirmExit = confirm('마카오 여행 앱을 종료하시겠습니까?');
        
        if (confirmExit) {
            // 앱 종료
            if (window.navigator.standalone) {
                // iOS PWA에서는 다른 페이지로 이동
                window.location.href = 'about:blank';
            } else {
                // 일반 브라우저에서는 창 닫기 시도
                window.close();
            }
        } else {
            // 취소 시 히스토리 상태 복원 (뒤로가기 감지를 위해)
            history.pushState({ page: 'main', canExit: true }, '', window.location.href);
        }
    }

    // 팝업 상태 확인
    hasOpenPopups() {
        return this.popupStack.length > 0;
    }

    // 스택 초기화 (강제 모든 팝업 닫기)
    clearStack() {
        this.popupStack = [];
        console.log('🔙 팝업 스택 초기화');
    }
}

// 전역 뒤로가기 핸들러 인스턴스
const backButtonHandler = new BackButtonHandler();

// 애플리케이션 상태
const app = {
    initialized: false,
    modules: new Set(),
    debug: false
};

/**
 * 디버그 모드 설정
 * @param {boolean} enabled - 디버그 모드 활성화 여부
 */
export function setDebugMode(enabled) {
    app.debug = enabled;
    if (enabled) {
        console.log('Macau Travel App - Debug Mode Enabled');
    }
}

/**
 * 로그 출력 (디버그 모드에서만)
 * @param {string} message - 로그 메시지
 * @param {...any} args - 추가 인수들
 */
function debugLog(message, ...args) {
    if (app.debug) {
        console.log(`[MacauApp] ${message}`, ...args);
    }
}

/**
 * 모듈 초기화 상태 추적
 * @param {string} moduleName - 모듈명
 * @param {boolean} success - 초기화 성공 여부
 */
function trackModule(moduleName, success) {
    if (success) {
        app.modules.add(moduleName);
        debugLog(`Module "${moduleName}" initialized successfully`);
    } else {
        debugLog(`Module "${moduleName}" failed to initialize`);
    }
}

/**
 * 핵심 시스템 초기화
 */
async function initCoreSystem() {
    debugLog('Initializing core system...');
    
    try {
        // 안드로이드 뒤로가기 버튼 핸들러 초기화
        backButtonHandler.init();
        trackModule('back-button-handler', true);
        
        // 네비게이션 시스템 초기화
        initNavigation();
        trackModule('navigation', true);
        
        // 이미지 시스템 초기화
        initImageSystem();
        trackModule('image-system', true);
        
        // 페이지 변경 시 슬라이더 재초기화 연결
        onPageChange((pageIndex) => {
            debugLog(`Page changed to: ${pageIndex}`);
            reinitializeSliders();
        });
        
        return true;
    } catch (error) {
        console.error('Core system initialization failed:', error);
        return false;
    }
}

/**
 * PWA 기능 초기화
 */
async function initPWAFeatures() {
    debugLog('Initializing PWA features...');
    
    try {
        // PWA 설치 가이드만 PWA 모드가 아닐 때 초기화
        if (!isInStandaloneMode()) {
            initPWAInstall();
            trackModule('pwa-install', true);
        }
        
        return true;
    } catch (error) {
        console.error('PWA features initialization failed:', error);
        trackModule('pwa-install', false);
        return false;
    }
}

/**
 * 유틸리티 기능 초기화
 */
async function initUtilityFeatures() {
    debugLog('Initializing utility features...');
    
    try {
        // 환율 계산기 초기화
        initExchange();
        trackModule('exchange', true);
        
        // 기존 예산 관리 시스템 (호환성)
        initBudgetManager();
        trackModule('budget', true);
        
        return true;
    } catch (error) {
        console.error('Utility features initialization failed:', error);
        return false;
    }
}

/**
 * 새로운 지출 관리 시스템 초기화
 */
async function initExpenseSystem() {
    debugLog('Initializing expense system...');
    
    try {
        // FAB 시스템 초기화
        initFABSystem();
        trackModule('fab', true);
        
        // 지출 입력 시스템 초기화
        initExpenseInput();
        trackModule('expense-input', true);
        
        // 지출 현황 시스템 초기화
        initExpenseStatus();
        trackModule('expense-status', true);
        
        return true;
    } catch (error) {
        console.error('Expense system initialization failed:', error);
        return false;
    }
}

/**
 * Todo 기능 초기화
 */
async function initTodoFeatures() {
    debugLog('Initializing todo features...');
    
    try {
        // Todo 실행자 등록 (네비게이션에서 호출됨)
        const { executeTodoScript } = await import('../features/todo.js');
        setTodoScriptExecutor(executeTodoScript);
        trackModule('todo', true);
        
        return true;
    } catch (error) {
        console.error('Todo features initialization failed:', error);
        trackModule('todo', false);
        return false;
    }
}

/**
 * 애플리케이션 초기화 상태 체크
 */
function checkInitializationStatus() {
    const totalModules = 8; // 예상 모듈 수
    const initializedModules = app.modules.size;
    
    debugLog(`Initialization complete: ${initializedModules}/${totalModules} modules`);
    debugLog('Initialized modules:', Array.from(app.modules));
    
    if (initializedModules >= 6) { // 최소 6개 모듈이 초기화되면 성공
        debugLog('Application successfully initialized');
        return true;
    } else {
        console.warn('Some modules failed to initialize, but app may still function');
        return false;
    }
}

/**
 * 애플리케이션 메인 초기화 함수
 */
export async function initMacauApp() {
    if (app.initialized) {
        debugLog('App already initialized');
        return true;
    }
    
    debugLog('Starting Macau Travel App initialization...');
    
    try {
        // 순서대로 시스템 초기화
        await initCoreSystem();
        await initPWAFeatures();
        await initUtilityFeatures();
        await initExpenseSystem();
        await initTodoFeatures();
        
        // 초기화 상태 체크
        const success = checkInitializationStatus();
        
        app.initialized = true;
        
        // 전역 객체에 앱 정보 등록 (디버깅용)
        if (typeof window !== 'undefined') {
            window.MacauApp = {
                version: '1.0.0',
                modules: Array.from(app.modules),
                debug: app.debug,
                initialized: app.initialized
            };
        }
        
        debugLog('Macau Travel App initialization completed');
        return success;
        
    } catch (error) {
        console.error('Fatal error during app initialization:', error);
        return false;
    }
}

/**
 * 애플리케이션 정리 함수
 */
export function destroyMacauApp() {
    if (!app.initialized) {
        debugLog('App not initialized, nothing to destroy');
        return;
    }
    
    debugLog('Destroying Macau Travel App...');
    
    try {
        // 각 모듈의 정리 함수 호출 (있는 경우)
        // 실제 구현에서는 각 모듈에서 destroy 함수를 export하고 여기서 호출
        
        app.initialized = false;
        app.modules.clear();
        
        if (typeof window !== 'undefined') {
            delete window.MacauApp;
        }
        
        debugLog('Macau Travel App destroyed');
    } catch (error) {
        console.error('Error during app destruction:', error);
    }
}

/**
 * 애플리케이션 재시작
 */
export async function restartMacauApp() {
    debugLog('Restarting Macau Travel App...');
    destroyMacauApp();
    return await initMacauApp();
}

/**
 * DOM 로드 완료 시 자동 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    // URL 파라미터에서 디버그 모드 확인
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';
    
    if (debugMode) {
        setDebugMode(true);
    }
    
    // 애플리케이션 초기화
    initMacauApp().then(success => {
        if (success) {
            debugLog('Application ready');
        } else {
            console.warn('Application initialized with some errors');
        }
    }).catch(error => {
        console.error('Failed to initialize application:', error);
    });
});

// 안드로이드 뒤로가기 버튼 핸들러 export 함수들
export function registerPopup(popupId, closeFunction) {
    backButtonHandler.pushPopupState(popupId, closeFunction);
}

export function unregisterPopup(popupId) {
    backButtonHandler.popPopupState(popupId);
}

export function hasOpenPopups() {
    return backButtonHandler.hasOpenPopups();
}

export function clearAllPopups() {
    backButtonHandler.clearStack();
}

// 활동 상세 정보 토글 함수
function toggleActivityDetails(button) {
    const activity = button.closest('.activity');
    const details = activity.querySelector('.activity-details');
    const expandIcon = button.querySelector('.expand-icon');
    const expandText = button.querySelector('.expand-text');
    
    if (!details) return;
    
    const isVisible = details.style.display !== 'none';
    
    if (isVisible) {
        // 숨기기
        details.style.display = 'none';
        expandIcon.textContent = '▼';
        expandText.textContent = '자세히 보기';
        button.classList.remove('expanded');
    } else {
        // 보이기
        details.style.display = 'block';
        expandIcon.textContent = '▲';
        expandText.textContent = '간단히 보기';
        button.classList.add('expanded');
    }
}

// 개발자 도구에서 접근 가능한 함수들
if (typeof window !== 'undefined') {
    window.MacauAppControls = {
        restart: restartMacauApp,
        destroy: destroyMacauApp,
        setDebug: setDebugMode,
        getStatus: () => ({
            initialized: app.initialized,
            modules: Array.from(app.modules),
            debug: app.debug
        }),
        // 뒤로가기 버튼 관련 함수들
        registerPopup: registerPopup,
        unregisterPopup: unregisterPopup,
        hasOpenPopups: hasOpenPopups,
        clearAllPopups: clearAllPopups
    };
    
    // 레거시 호환성을 위한 전역 함수들
    window.openFlightTicket = openFlightTicket;
    window.registerPopup = registerPopup;
    window.unregisterPopup = unregisterPopup;
    window.toggleActivityDetails = toggleActivityDetails;
}

export default {
    init: initMacauApp,
    destroy: destroyMacauApp,
    restart: restartMacauApp,
    setDebug: setDebugMode
};