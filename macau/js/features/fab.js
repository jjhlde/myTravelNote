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
        case 'galaxy-map':
            // 갤럭시 맵 팝업 열기 (기존 레거시 함수 호출)
            if (typeof window.MacauAppControls !== 'undefined') {
                // 모듈화된 갤럭시 맵이 있다면 그것을 사용
                console.log('갤럭시 맵 열기 - 모듈화된 버전');
            } else {
                console.log('갤럭시 맵 열기 - 레거시 버전');
            }
            // 갤럭시 맵은 이미 index.html의 레거시 코드에서 처리됨
            break;
        case 'scrap':
            // 링크 스크랩 bottom sheet 열기
            openScrapBottomSheet();
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
 * 스크랩 bottom sheet 열기
 */
function openScrapBottomSheet() {
    const scrapSheet = getElement('#scrapBottomSheet');
    if (!scrapSheet) return;
    
    addClass(scrapSheet, 'show');
    document.body.style.overflow = 'hidden';
    
    // 뒤로가기 버튼으로 닫기 등록
    if (typeof window.registerPopup === 'function') {
        window.registerPopup('scrap', closeScrapBottomSheet);
    }
    
    // 스크랩 시스템 초기화
    initScrapSystem();
}

/**
 * 스크랩 bottom sheet 닫기
 */
function closeScrapBottomSheet() {
    const scrapSheet = getElement('#scrapBottomSheet');
    if (!scrapSheet) return;
    
    removeClass(scrapSheet, 'show');
    document.body.style.overflow = '';
    
    // 뒤로가기 버튼 등록 해제
    if (typeof window.unregisterPopup === 'function') {
        window.unregisterPopup('scrap');
    }
}

/**
 * 스크랩 시스템 초기화
 */
function initScrapSystem() {
    // 이미 초기화된 경우 스킵
    if (window.scrapSystemInitialized) return;
    
    const closeBtn = getElement('#scrapSheetClose');
    const linkInput = getElement('#scrapLinkInput');
    const memoInput = getElement('#scrapMemoInput');
    const addBtn = getElement('#scrapAddBtn');
    const scrapSheet = getElement('#scrapBottomSheet');
    
    // 닫기 버튼
    if (closeBtn) {
        addEventListener(closeBtn, 'click', closeScrapBottomSheet);
    }
    
    // 오버레이 클릭으로 닫기
    if (scrapSheet) {
        addEventListener(scrapSheet, 'click', (e) => {
            if (e.target === scrapSheet) {
                closeScrapBottomSheet();
            }
        });
    }
    
    // 입력 필드 이벤트
    if (linkInput && memoInput && addBtn) {
        addEventListener(linkInput, 'input', updateScrapAddButton);
        addEventListener(memoInput, 'input', updateScrapAddButton);
        
        // Enter 키로 추가
        addEventListener(linkInput, 'keydown', (e) => {
            if (e.key === 'Enter' && !addBtn.disabled) {
                addScrapLink();
            }
        });
        
        addEventListener(memoInput, 'keydown', (e) => {
            if (e.key === 'Enter' && !addBtn.disabled) {
                addScrapLink();
            }
        });
        
        // 추가 버튼
        addEventListener(addBtn, 'click', addScrapLink);
    }
    
    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && scrapSheet.classList.contains('show')) {
            closeScrapBottomSheet();
        }
    });
    
    // 스크랩 데이터 로드
    loadScrapData();
    renderScrapGrid();
    updateScrapAddButton();
    
    window.scrapSystemInitialized = true;
    console.log('Scrap system initialized');
}

/**
 * 스크랩 데이터 관리
 */
let scrapData = [];

function loadScrapData() {
    try {
        const saved = localStorage.getItem('macauScrapData');
        scrapData = saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('스크랩 데이터 로드 실패:', error);
        scrapData = [];
    }
}

function saveScrapData() {
    try {
        localStorage.setItem('macauScrapData', JSON.stringify(scrapData));
    } catch (error) {
        console.error('스크랩 데이터 저장 실패:', error);
    }
}

/**
 * 추가 버튼 상태 업데이트
 */
function updateScrapAddButton() {
    const linkInput = getElement('#scrapLinkInput');
    const addBtn = getElement('#scrapAddBtn');
    
    if (!linkInput || !addBtn) return;
    
    const url = linkInput.value.trim();
    const isValid = url && isValidURL(url);
    
    addBtn.disabled = !isValid;
}

/**
 * URL 유효성 검사
 */
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * 링크 추가
 */
async function addScrapLink() {
    const linkInput = getElement('#scrapLinkInput');
    const memoInput = getElement('#scrapMemoInput');
    const addBtn = getElement('#scrapAddBtn');
    
    if (!linkInput || !memoInput || !addBtn) return;
    
    const url = linkInput.value.trim();
    const memo = memoInput.value.trim();
    
    if (!url || !isValidURL(url)) {
        showScrapToast('올바른 URL을 입력해주세요.', 'error');
        return;
    }
    
    // 버튼 비활성화 및 로딩 상태
    addBtn.disabled = true;
    addBtn.textContent = '추가 중...';
    
    try {
        // 로딩 카드 표시
        showScrapLoadingCard();
        
        // 메타데이터 추출
        const metadata = await extractScrapMetadata(url);
        
        // 스크랩 데이터에 추가
        const scrapItem = {
            id: Date.now().toString(),
            url: url,
            memo: memo,
            title: metadata.title || '제목 없음',
            description: metadata.description || '',
            image: metadata.image || '',
            favicon: metadata.favicon || '',
            addedAt: new Date().toISOString()
        };
        
        scrapData.unshift(scrapItem); // 최신 항목을 맨 앞에 추가
        saveScrapData();
        
        // 폼 초기화
        linkInput.value = '';
        memoInput.value = '';
        
        // 그리드 다시 렌더링
        renderScrapGrid();
        
        // 성공 피드백
        showScrapToast('링크가 추가되었습니다! 🎉', 'success');
        
    } catch (error) {
        console.error('링크 추가 실패:', error);
        showScrapToast('링크 추가에 실패했습니다.', 'error');
        hideScrapLoadingCard();
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = '추가';
        updateScrapAddButton();
    }
}

/**
 * 메타데이터 추출
 */
async function extractScrapMetadata(url) {
    try {
        // AllOrigins CORS 프록시 사용
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (!data.contents) {
            throw new Error('페이지 내용을 가져올 수 없습니다.');
        }
        
        // HTML 파싱
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // 메타데이터 추출
        const metadata = {
            title: getMetaContent(doc, 'og:title') || 
                   getMetaContent(doc, 'twitter:title') || 
                   doc.title || 
                   url,
            description: getMetaContent(doc, 'og:description') || 
                        getMetaContent(doc, 'twitter:description') || 
                        getMetaContent(doc, 'description') || '',
            image: getMetaContent(doc, 'og:image') || 
                   getMetaContent(doc, 'twitter:image') || '',
            favicon: getFavicon(doc, url)
        };
        
        return metadata;
        
    } catch (error) {
        console.warn('메타데이터 추출 실패, 기본값 사용:', error);
        
        // 기본값 반환
        return {
            title: new URL(url).hostname,
            description: '',
            image: '',
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
        };
    }
}

/**
 * 메타 태그 내용 추출
 */
function getMetaContent(doc, property) {
    const meta = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return meta ? meta.getAttribute('content') : null;
}

/**
 * 파비콘 추출
 */
function getFavicon(doc, url) {
    const favicon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicon) {
        const href = favicon.getAttribute('href');
        if (href.startsWith('http')) {
            return href;
        } else {
            const urlObj = new URL(url);
            return urlObj.origin + (href.startsWith('/') ? href : '/' + href);
        }
    }
    
    // 기본 파비콘
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
}

/**
 * 스크랩 그리드 렌더링
 */
function renderScrapGrid() {
    const grid = getElement('#scrapGrid');
    const emptyState = getElement('#scrapEmptyState');
    
    if (!grid) return;
    
    // 로딩 카드 제거
    hideScrapLoadingCard();
    
    if (scrapData.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        // 기존 카드들 제거
        Array.from(grid.children).forEach(child => {
            if (child.id !== 'scrapEmptyState') {
                child.remove();
            }
        });
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // 기존 카드들 제거 (빈 상태 제외)
    Array.from(grid.children).forEach(child => {
        if (child.id !== 'scrapEmptyState') {
            child.remove();
        }
    });
    
    // 카드 생성
    scrapData.forEach(item => {
        const card = createScrapLinkCard(item);
        grid.appendChild(card);
    });
}

/**
 * 링크 카드 생성
 */
function createScrapLinkCard(item) {
    const card = document.createElement('div');
    card.className = 'scrap-link-card';
    
    let imageHtml = '';
    if (item.image) {
        imageHtml = `<img src="${item.image}" alt="미리보기" class="scrap-link-image" onerror="this.style.display='none'">`;
    }
    
    let memoHtml = '';
    if (item.memo) {
        memoHtml = `<div class="scrap-link-memo">${escapeHtml(item.memo)}</div>`;
    }
    
    let faviconHtml = '';
    if (item.favicon) {
        faviconHtml = `<img src="${item.favicon}" alt="파비콘" class="scrap-link-favicon" onerror="this.style.display='none'">`;
    }
    
    card.innerHTML = `
        <button class="scrap-card-menu" onclick="event.stopPropagation(); showScrapDeleteModal('${item.id}')" title="삭제">
            ⋯
        </button>
        ${memoHtml}
        ${imageHtml}
        <div class="scrap-link-title">
            ${faviconHtml}${escapeHtml(item.title)}
        </div>
        <div class="scrap-link-url">${escapeHtml(item.url)}</div>
    `;
    
    // 카드 클릭으로 링크 열기
    card.addEventListener('click', () => {
        window.open(item.url, '_blank', 'noopener,noreferrer');
    });
    
    return card;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 로딩 카드 표시
 */
function showScrapLoadingCard() {
    const grid = getElement('#scrapGrid');
    const emptyState = getElement('#scrapEmptyState');
    
    if (!grid) return;
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    const loadingCard = document.createElement('div');
    loadingCard.className = 'scrap-loading-card';
    loadingCard.id = 'scrapLoadingCard';
    loadingCard.innerHTML = `
        <div class="scrap-loading-spinner"></div>
        <div>링크 정보를 가져오는 중...</div>
    `;
    
    grid.insertBefore(loadingCard, grid.firstChild);
}

/**
 * 로딩 카드 숨기기
 */
function hideScrapLoadingCard() {
    const loadingCard = getElement('#scrapLoadingCard');
    if (loadingCard) {
        loadingCard.remove();
    }
}

/**
 * 삭제 확인 모달 표시
 */
function showScrapDeleteModal(id) {
    // 기존 모달 제거
    const existingModal = document.querySelector('.scrap-delete-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'scrap-delete-modal';
    modal.innerHTML = `
        <div class="scrap-delete-content">
            <div class="scrap-delete-title">링크 삭제</div>
            <div class="scrap-delete-message">이 링크를 삭제하시겠습니까?</div>
            <div class="scrap-delete-actions">
                <button class="scrap-delete-cancel">취소</button>
                <button class="scrap-delete-confirm">삭제</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 애니메이션
    setTimeout(() => addClass(modal, 'show'), 10);
    
    // 이벤트 리스너
    const cancelBtn = modal.querySelector('.scrap-delete-cancel');
    const confirmBtn = modal.querySelector('.scrap-delete-confirm');
    
    function closeModal() {
        removeClass(modal, 'show');
        setTimeout(() => modal.remove(), 200);
    }
    
    if (cancelBtn) {
        addEventListener(cancelBtn, 'click', closeModal);
    }
    
    if (confirmBtn) {
        addEventListener(confirmBtn, 'click', () => {
            deleteScrapLink(id);
            closeModal();
        });
    }
    
    // 모달 배경 클릭으로 닫기
    addEventListener(modal, 'click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * 링크 삭제
 */
function deleteScrapLink(id) {
    scrapData = scrapData.filter(item => item.id !== id);
    saveScrapData();
    renderScrapGrid();
    showScrapToast('링크가 삭제되었습니다.', 'info');
}

/**
 * 토스트 메시지 표시
 */
function showScrapToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.scrap-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `scrap-toast scrap-toast-${type}`;
    toast.textContent = message;
    
    // 토스트 스타일
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#6B7280',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontWeight: '600',
        zIndex: '10001',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        opacity: '0',
        transform: 'translateX(-50%) translateY(20px)'
    });
    
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // 자동 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * 전역 함수로 노출 (HTML 인라인 이벤트용)
 */
if (typeof window !== 'undefined') {
    window.showScrapDeleteModal = showScrapDeleteModal;
}

/**
 * FAB 시스템 정리
 */
export function destroyFABSystem() {
    console.log('FAB system destroyed');
}