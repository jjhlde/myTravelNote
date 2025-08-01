/**
 * 이미지 팝업 및 슬라이더 기능
 */

import { getElement, getElements, addClass, removeClass, addEventListener } from '../utils/dom-helpers.js';

// 슬라이더 상태 관리
let sliderStates = {};

/**
 * 슬라이더 초기화
 * @param {string} sliderId - 슬라이더 ID
 */
function initSlider(sliderId) {
    if (!sliderStates[sliderId]) {
        sliderStates[sliderId] = {
            currentSlide: 0,
            totalSlides: 0
        };
        
        const slider = document.getElementById(sliderId);
        if (slider) {
            const images = slider.querySelectorAll('.place-images-slider img');
            sliderStates[sliderId].totalSlides = images.length;
        }
    }
}

/**
 * 슬라이드 표시
 * @param {string} sliderId - 슬라이더 ID
 * @param {number} slideIndex - 슬라이드 인덱스
 */
export function showSlide(sliderId, slideIndex) {
    initSlider(sliderId);
    
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    
    const sliderTrack = slider.querySelector('.place-images-slider');
    const dots = slider.querySelectorAll('.place-images-dot');
    const counter = slider.querySelector('.place-images-counter');
    
    const totalSlides = sliderStates[sliderId].totalSlides;
    
    if (slideIndex < 0) slideIndex = totalSlides - 1;
    if (slideIndex >= totalSlides) slideIndex = 0;
    
    sliderStates[sliderId].currentSlide = slideIndex;
    
    if (sliderTrack) {
        sliderTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
    }
    
    // 점 업데이트
    dots.forEach((dot, index) => {
        if (index === slideIndex) {
            addClass(dot, 'active');
        } else {
            removeClass(dot, 'active');
        }
    });
    
    // 카운터 업데이트
    if (counter) {
        counter.textContent = `${slideIndex + 1} / ${totalSlides}`;
    }
}

/**
 * 다음 슬라이드로 이동
 * @param {string} sliderId - 슬라이더 ID
 */
export function nextSlide(sliderId) {
    initSlider(sliderId);
    const currentSlide = sliderStates[sliderId].currentSlide;
    showSlide(sliderId, currentSlide + 1);
}

/**
 * 이전 슬라이드로 이동
 * @param {string} sliderId - 슬라이더 ID
 */
export function prevSlide(sliderId) {
    initSlider(sliderId);
    const currentSlide = sliderStates[sliderId].currentSlide;
    showSlide(sliderId, currentSlide - 1);
}

/**
 * 모든 슬라이더 초기화
 */
export function initAllSliders() {
    const sliders = getElements('.place-images');
    sliders.forEach(slider => {
        const sliderId = slider.id;
        if (sliderId) {
            initSlider(sliderId);
            showSlide(sliderId, 0);
        }
    });
}

/**
 * 슬라이더 재초기화 (페이지 변경 시)
 */
export function reinitializeSliders() {
    setTimeout(() => {
        initAllSliders();
    }, 100);
}

/**
 * 이미지 팝업 초기화
 */
export function initImagePopup() {
    const imagePopupOverlay = getElement('#imagePopupOverlay');
    const popupImage = getElement('#popupImage');
    const popupTitle = getElement('#popupTitle');
    const popupDescription = getElement('#popupDescription');
    const popupClose = getElement('#popupClose');
    
    if (!imagePopupOverlay) return;
    
    // 이미지 클릭 이벤트 (동적으로 추가되는 이미지들도 처리)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.place-images img')) {
            const img = e.target;
            const title = img.alt || '여행 사진';
            const description = img.dataset.description || '클릭하거나 ESC 키를 눌러 닫기';
            
            if (popupImage) popupImage.src = img.src;
            if (popupTitle) popupTitle.textContent = title;
            if (popupDescription) popupDescription.textContent = description;
            
            addClass(imagePopupOverlay, 'show');
        }
    });
    
    // 팝업 닫기 이벤트들
    if (popupClose) {
        addEventListener(popupClose, 'click', closeImagePopup);
    }
    
    addEventListener(imagePopupOverlay, 'click', (e) => {
        if (e.target === imagePopupOverlay) {
            closeImagePopup();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imagePopupOverlay.classList.contains('show')) {
            closeImagePopup();
        }
    });
    
    console.log('Image popup initialized');
}

/**
 * 이미지 팝업 닫기
 */
export function closeImagePopup() {
    const imagePopupOverlay = getElement('#imagePopupOverlay');
    if (imagePopupOverlay) {
        removeClass(imagePopupOverlay, 'show');
    }
}

/**
 * 위치 버튼 초기화
 */
export function initLocationButtons() {
    // 위치 버튼 클릭 이벤트 (동적으로 추가되는 버튼들도 처리)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.location-btn') || e.target.closest('.location-btn')) {
            const btn = e.target.closest('.location-btn') || e.target;
            const location = btn.dataset.location;
            
            if (location) {
                // Google Maps에서 위치 열기
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
                window.open(mapsUrl, '_blank');
            }
        }
    });
    
    console.log('Location buttons initialized');
}

/**
 * 항공권 이미지 팝업 초기화
 */
export function initFlightTicketPopup() {
    // 항공권 버튼 클릭 이벤트 (동적으로 추가되는 버튼들도 처리)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.ticket-btn') || e.target.closest('.ticket-btn')) {
            const btn = e.target.closest('.ticket-btn') || e.target;
            const passenger = btn.dataset.passenger;
            
            if (passenger) {
                openFlightTicketImage(passenger);
            }
        }
    });
    
    console.log('Flight ticket popup initialized');
}

/**
 * 항공권 이미지 팝업 열기
 * @param {string} passenger - 탑승자명 (영어)
 */
export function openFlightTicketImage(passenger) {
    const imagePopupOverlay = getElement('#imagePopupOverlay');
    const popupImage = getElement('#popupImage');
    const popupTitle = getElement('#popupTitle');
    const popupDescription = getElement('#popupDescription');
    
    if (!imagePopupOverlay || !popupImage) return;
    
    // 탑승자명을 한국어로 변환
    const passengerNames = {
        'jangjungho': '장정호',
        'ohnamgeum': '오남금', 
        'jangsunwoo': '장선우'
    };
    
    const koreanName = passengerNames[passenger] || passenger;
    const imagePath = `../images/tickets/${passenger}.png`;
    
    // 이미지 로딩 처리
    const img = new Image();
    img.onload = () => {
        if (popupImage) popupImage.src = imagePath;
        if (popupTitle) popupTitle.textContent = `${koreanName} 항공권`;
        if (popupDescription) popupDescription.textContent = '에어마카오 NX0821/NX0826 • 클릭하거나 ESC 키를 눌러 닫기';
        
        addClass(imagePopupOverlay, 'show');
    };
    
    img.onerror = () => {
        console.error(`항공권 이미지를 찾을 수 없습니다: ${imagePath}`);
        if (popupTitle) popupTitle.textContent = `${koreanName} 항공권`;
        if (popupDescription) popupDescription.textContent = '항공권 이미지를 불러올 수 없습니다.';
        if (popupImage) popupImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmNGY0ZjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuq1rOuggOuKpSDsnbTrr7jsp4Drpbwg7LC+7J2EIOyImCDsl4bsnYzrgqjri6QuPC90ZXh0Pjwvc3ZnPg==';
        
        addClass(imagePopupOverlay, 'show');
    };
    
    img.src = imagePath;
}

/**
 * 레거시 openFlightTicket 함수 (기존 호환성 유지)
 */
export function openFlightTicket() {
    // 기본적으로 첫 번째 탑승자 항공권 표시
    openFlightTicketImage('jangjungho');
}

/**
 * 이미지 및 슬라이더 시스템 초기화
 */
export function initImageSystem() {
    initImagePopup();
    initLocationButtons();
    initFlightTicketPopup();
    initAllSliders();
    
    console.log('Image system initialized');
}

/**
 * 이미지 시스템 정리
 */
export function destroyImageSystem() {
    sliderStates = {};
    console.log('Image system destroyed');
}