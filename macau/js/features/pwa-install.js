/**
 * PWA 설치 가이드 팝업 관리
 */

import { getElement, addEventListener, addClass, removeClass, isIOS, isInStandaloneMode } from '../utils/dom-helpers.js';
import { hasSeenInstallGuide, markInstallGuideSeen } from '../core/storage.js';

// PWA 설치 상태
let deferredPrompt = null;

/**
 * 설치 가이드 숨기기
 */
function hideInstallGuide() {
    const installGuideOverlay = getElement('#installGuideOverlay');
    if (installGuideOverlay) {
        removeClass(installGuideOverlay, 'show');
        markInstallGuideSeen();
    }
}

/**
 * Android용 PWA 설치 처리
 */
async function handleAndroidInstall() {
    if (deferredPrompt) {
        hideInstallGuide();
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA install outcome: ${outcome}`);
        deferredPrompt = null;
    }
}

/**
 * iOS용 설치 안내
 */
function handleIOSInstall() {
    hideInstallGuide();
    alert('📱 하단의 공유 버튼을 눌러 "홈 화면에 추가"를 선택해주세요!');
}

/**
 * 일반 브라우저용 설치 안내
 */
function handleGenericInstall() {
    hideInstallGuide();
    alert('📱 브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요!');
}

/**
 * 설치 버튼 클릭 처리
 */
function handleInstallClick() {
    if (isIOS()) {
        handleIOSInstall();
    } else if (deferredPrompt) {
        handleAndroidInstall();
    } else {
        handleGenericInstall();
    }
}

/**
 * ESC 키 처리
 * @param {KeyboardEvent} e - 키보드 이벤트
 */
function handleKeyDown(e) {
    const installGuideOverlay = getElement('#installGuideOverlay');
    if (e.key === 'Escape' && installGuideOverlay && installGuideOverlay.classList.contains('show')) {
        hideInstallGuide();
    }
}

/**
 * beforeinstallprompt 이벤트 처리
 * @param {Event} e - beforeinstallprompt 이벤트
 */
function handleBeforeInstallPrompt(e) {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA install prompt captured');
}

/**
 * 설치 가이드 표시
 */
function showInstallGuide() {
    const installGuideOverlay = getElement('#installGuideOverlay');
    if (installGuideOverlay && !hasSeenInstallGuide()) {
        setTimeout(() => {
            addClass(installGuideOverlay, 'show');
        }, 1000);
    }
}

/**
 * PWA 설치 시스템 초기화
 */
export function initPWAInstall() {
    // PWA 모드에서는 설치 가이드를 표시하지 않음
    if (isInStandaloneMode()) {
        console.log('Running in PWA mode, install guide disabled');
        return;
    }
    
    const installGuideOverlay = getElement('#installGuideOverlay');
    const closeGuideBtn = getElement('#closeGuideBtn');
    const installNowBtn = getElement('#installNowBtn');
    const skipInstallBtn = getElement('#skipInstallBtn');
    
    if (!installGuideOverlay) {
        console.warn('Install guide overlay not found');
        return;
    }
    
    // 버튼 이벤트 등록
    if (closeGuideBtn) {
        addEventListener(closeGuideBtn, 'click', hideInstallGuide);
    }
    
    if (skipInstallBtn) {
        addEventListener(skipInstallBtn, 'click', hideInstallGuide);
    }
    
    if (installNowBtn) {
        addEventListener(installNowBtn, 'click', handleInstallClick);
    }
    
    // 배경 클릭으로 닫기
    addEventListener(installGuideOverlay, 'click', (e) => {
        if (e.target === installGuideOverlay) {
            hideInstallGuide();
        }
    });
    
    // ESC 키로 닫기
    document.addEventListener('keydown', handleKeyDown);
    
    // beforeinstallprompt 이벤트 리스너
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // 설치 가이드 표시 (아직 보지 않은 경우에만)
    showInstallGuide();
    
    console.log('PWA install system initialized');
}

/**
 * PWA 설치 시스템 정리
 */
export function destroyPWAInstall() {
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    deferredPrompt = null;
    
    console.log('PWA install system destroyed');
}

/**
 * 수동으로 설치 가이드 표시
 */
export function showPWAInstallGuide() {
    if (!isInStandaloneMode()) {
        showInstallGuide();
    }
}

/**
 * PWA 설치 가능 여부 확인
 * @returns {boolean} 설치 가능 여부
 */
export function canInstallPWA() {
    return !isInStandaloneMode() && (deferredPrompt !== null || isIOS());
}