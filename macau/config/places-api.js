// Google Places API 연동 시스템
// 마카오 여행 PWA를 위한 장소 정보 관리

class PlacesService {
    constructor() {
        this.apiKey = CONFIG.GOOGLE_PLACES_API_KEY;
        this.cache = new Map(); // 장소 정보 캐싱
        this.macauBounds = {
            lat: 22.1987,
            lng: 113.5439,
            radius: 15000 // 15km 반경
        };
    }

    // 장소명으로 상세 정보 검색
    async findPlaceByName(placeName, coordinates = null) {
        const cacheKey = `${placeName}_${coordinates?.lat}_${coordinates?.lng}`;
        
        // 캐시 확인
        if (this.cache.has(cacheKey)) {
            console.log(`📍 캐시에서 로드: ${placeName}`);
            return this.cache.get(cacheKey);
        }

        try {
            // 서버 프록시 엔드포인트 사용 (CORS 우회)
            let searchUrl = `/api/places/textsearch`;
            const params = new URLSearchParams({
                query: placeName,
                key: this.apiKey,
                language: 'ko'
            });

            // 좌표가 있으면 위치 정보 추가 (텍스트 검색에서는 location 포함)
            if (coordinates) {
                params.append('query', `${placeName} near ${coordinates.lat},${coordinates.lng}`);
            } else {
                // 마카오 지역으로 제한
                params.append('query', `${placeName} 마카오`);
            }

            const response = await fetch(`${searchUrl}?${params}`);
            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const place = data.results[0]; // Text Search API는 results 배열 사용
                
                // 상세 정보 가져오기
                const detailedInfo = await this.getPlaceDetails(place.place_id);
                
                // 캐시에 저장
                this.cache.set(cacheKey, detailedInfo);
                
                console.log(`✅ Places API 성공: ${placeName}`, detailedInfo);
                return detailedInfo;
            } else {
                console.warn(`⚠️ Places API 결과 없음: ${placeName}`, data);
                return this.createFallbackData(placeName, coordinates);
            }
        } catch (error) {
            console.error(`❌ Places API 오류: ${placeName}`, error);
            return this.createFallbackData(placeName, coordinates);
        }
    }

    // Place ID로 상세 정보 가져오기
    async getPlaceDetails(placeId) {
        try {
            // 서버 프록시 엔드포인트 사용 (CORS 우회)
            const detailsUrl = `/api/places/details`;
            const params = new URLSearchParams({
                place_id: placeId,
                key: this.apiKey,
                language: 'ko', // 한국어 우선
                fields: 'name,formatted_address,geometry,rating,user_ratings_total,photos,reviews,opening_hours,price_level,website,formatted_phone_number,types'
            });

            const response = await fetch(`${detailsUrl}?${params}`);
            const data = await response.json();

            if (data.status === 'OK') {
                return this.formatPlaceData(data.result);
            } else {
                throw new Error(`Places Details API 오류: ${data.status}`);
            }
        } catch (error) {
            console.error('Place Details API 오류:', error);
            throw error;
        }
    }

    // Places API 데이터를 우리 앱 형식으로 변환
    formatPlaceData(place) {
        return {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            },
            rating: place.rating || 0,
            userRatingsTotal: place.user_ratings_total || 0,
            priceLevel: place.price_level,
            photos: this.getPlacePhotos(place.photos),
            reviews: this.getTopReviews(place.reviews),
            openingHours: place.opening_hours?.weekday_text || [],
            website: place.website,
            phoneNumber: place.formatted_phone_number,
            types: place.types || [],
            mapLink: this.generateMapLink(place.name, place.geometry.location),
            updated: new Date().toISOString()
        };
    }

    // 장소 사진 URL 생성
    getPlacePhotos(photos, maxPhotos = 3) {
        if (!photos) return [];
        
        return photos.slice(0, maxPhotos).map(photo => ({
            reference: photo.photo_reference,
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photo.photo_reference}&key=${this.apiKey}`,
            attribution: photo.html_attributions?.[0] || ''
        }));
    }

    // 상위 리뷰 가져오기
    getTopReviews(reviews, maxReviews = 2) {
        if (!reviews) return [];
        
        return reviews
            .slice(0, maxReviews)
            .map(review => ({
                author: review.author_name,
                rating: review.rating,
                text: review.text.length > 100 
                    ? review.text.substring(0, 100) + '...' 
                    : review.text,
                time: review.relative_time_description
            }));
    }

    // 개선된 구글맵 링크 생성
    generateMapLink(placeName, location) {
        const encodedName = encodeURIComponent(placeName);
        return `https://maps.google.com/maps/search/${encodedName}/@${location.lat},${location.lng},15z`;
    }

    // 모바일 친화적 맵 링크 생성 (앱 우선)
    generateMobileMapLink(placeName, location, placeId = null) {
        // Place ID가 있으면 가장 정확한 방법 사용
        if (placeId) {
            return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
        }
        
        // 좌표 기반 네비게이션 링크 (모바일 앱에서 바로 열림)
        if (location && location.lat && location.lng) {
            return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&destination_place_id=${placeId || ''}`;
        }
        
        // 폴백: 장소명 검색
        const encodedName = encodeURIComponent(placeName);
        return `https://www.google.com/maps/search/${encodedName}`;
    }

    // API 실패 시 기본 데이터 생성
    createFallbackData(placeName, coordinates) {
        return {
            placeId: null,
            name: placeName,
            address: '마카오',
            location: coordinates || { lat: this.macauBounds.lat, lng: this.macauBounds.lng },
            rating: 0,
            userRatingsTotal: 0,
            photos: [],
            reviews: [],
            openingHours: [],
            website: null,
            phoneNumber: null,
            types: [],
            mapLink: coordinates 
                ? this.generateMapLink(placeName, coordinates)
                : `https://maps.google.com/maps/search/${encodeURIComponent(placeName)}`,
            updated: new Date().toISOString(),
            fallback: true
        };
    }

    // 마카오 주요 장소들의 기본 데이터
    getMacauPlacesData() {
        return {
            '마카오국제공항': {
                name: '마카오국제공항',
                coordinates: { lat: 22.1496, lng: 113.5913 },
                searchTerms: ['Macau International Airport', 'MFM Airport']
            },
            '갤럭시 마카오': {
                name: '갤럭시 마카오',
                coordinates: { lat: 22.1489, lng: 113.5543 },
                searchTerms: ['Galaxy Macau', 'Galaxy Hotel']
            },
            '안다즈 마카오': {
                name: '안다즈 마카오',
                coordinates: { lat: 22.1489, lng: 113.5543 },
                searchTerms: ['Andaz Macau', 'Galaxy Macau Andaz']
            },
            '세나도 광장': {
                name: '세나도 광장',
                coordinates: { lat: 22.1935, lng: 113.5398 },
                searchTerms: ['Senado Square', 'Senate Square Macau']
            },
            '성 바울 성당 유적': {
                name: '성 바울 성당 유적',
                coordinates: { lat: 22.1975, lng: 113.5412 },
                searchTerms: ['Ruins of St Paul', 'St Paul Church Macau']
            },
            '마카오 과학관': {
                name: '마카오 과학관',
                coordinates: { lat: 22.1814, lng: 113.5476 },
                searchTerms: ['Macao Science Center', 'Macau Science Museum']
            },
            '베네시안 마카오': {
                name: '베네시안 마카오',
                coordinates: { lat: 22.1452, lng: 113.5599 },
                searchTerms: ['Venetian Macau', 'The Venetian Resort']
            }
        };
    }

    // 장소 데이터 대량 업데이트
    async updateAllPlaces() {
        const places = this.getMacauPlacesData();
        const results = {};

        console.log('🔄 마카오 주요 장소 데이터 업데이트 시작...');
        
        for (const [key, placeInfo] of Object.entries(places)) {
            console.log(`📍 처리 중: ${key}`);
            
            // 여러 검색어로 시도
            let bestResult = null;
            for (const searchTerm of placeInfo.searchTerms) {
                const result = await this.findPlaceByName(searchTerm, placeInfo.coordinates);
                if (result && !result.fallback) {
                    bestResult = result;
                    break;
                }
            }
            
            // 기본 검색어로 한 번 더 시도
            if (!bestResult) {
                bestResult = await this.findPlaceByName(placeInfo.name, placeInfo.coordinates);
            }
            
            results[key] = bestResult;
            
            // API 요청 제한을 위한 딜레이
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('✅ 장소 데이터 업데이트 완료:', results);
        return results;
    }
}

// 전역 인스턴스 생성
let placesService;

// DOM이 로드된 후 서비스 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_PLACES_API_KEY) {
        placesService = new PlacesService();
        window.placesService = placesService; // 전역으로 노출
        console.log('🗺️ Places Service 초기화 완료');
    } else {
        console.warn('⚠️ Google Places API 키가 설정되지 않았습니다.');
    }
});

// 기존 맵 링크를 개선된 형식으로 업데이트하는 유틸리티 함수
function improveMapLinks() {
    const mapButtons = document.querySelectorAll('a[href*="maps.google.com"]');
    
    mapButtons.forEach(button => {
        const href = button.href;
        const coordMatch = href.match(/q=([0-9.-]+),([0-9.-]+)/);
        
        if (coordMatch) {
            const lat = coordMatch[1];
            const lng = coordMatch[2];
            const locationTitle = button.textContent.replace('📍 ', '').trim();
            
            // 개선된 링크 생성
            const improvedLink = `https://maps.google.com/maps/search/${encodeURIComponent(locationTitle)}/@${lat},${lng},15z`;
            button.href = improvedLink;
            
            console.log(`🔗 맵 링크 개선: ${locationTitle}`);
        }
    });
}

// 동적 이미지 로딩 시스템
class DynamicImageLoader {
    constructor(placesService) {
        this.placesService = placesService;
        this.loadingPlaces = new Set(); // 중복 요청 방지
    }

    // 장소별 이미지 자동 로딩
    async loadPlaceImages(placeName, containerId, fallbackImages = []) {
        if (this.loadingPlaces.has(placeName)) {
            console.log(`⏳ 이미 로딩 중: ${placeName}`);
            return;
        }

        this.loadingPlaces.add(placeName);
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`⚠️ 컨테이너를 찾을 수 없음: ${containerId}`);
            this.loadingPlaces.delete(placeName);
            return;
        }

        try {
            // 로딩 상태 표시
            this.showLoadingState(container);
            
            // Places API로 최신 이미지 정보 가져오기
            const placeData = await this.placesService.findPlaceByName(placeName);
            
            if (placeData.photos && placeData.photos.length > 0) {
                console.log(`✅ ${placeName} 이미지 로딩 성공:`, placeData.photos.length, '개');
                this.updateImageSlider(container, placeData.photos, placeName);
            } else {
                console.warn(`⚠️ ${placeName} API 이미지 없음, 폴백 이미지 사용`);
                this.showFallbackImages(container, fallbackImages, placeName);
            }
        } catch (error) {
            console.error(`❌ ${placeName} 이미지 로딩 실패:`, error);
            this.showFallbackImages(container, fallbackImages, placeName);
        } finally {
            this.loadingPlaces.delete(placeName);
        }
    }

    // 로딩 상태 표시
    showLoadingState(container) {
        const slider = container.querySelector('.place-images-slider');
        if (slider) {
            slider.innerHTML = `
                <div class="image-loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">최신 이미지 로딩 중...</div>
                </div>
            `;
        }
    }

    // 이미지 슬라이더 업데이트
    updateImageSlider(container, photos, placeName) {
        const slider = container.querySelector('.place-images-slider');
        const nav = container.querySelector('.place-images-nav');
        const counter = container.querySelector('.place-images-counter');
        
        if (!slider) return;

        // 슬라이더 이미지 업데이트
        slider.innerHTML = photos.map((photo, index) => `
            <img src="${photo.url}" 
                 alt="${placeName} 이미지 ${index + 1}" 
                 onclick="openImageModal(this.src, this.alt)"
                 onerror="this.style.display='none'">
        `).join('');

        // 네비게이션 점 업데이트
        if (nav) {
            nav.innerHTML = photos.map((_, index) => `
                <div class="place-images-dot ${index === 0 ? 'active' : ''}" 
                     onclick="showSlide('${container.id}', ${index})"></div>
            `).join('');
        }

        // 카운터 업데이트
        if (counter) {
            counter.textContent = `1/${photos.length}`;
        }

        console.log(`🖼️ ${placeName} 이미지 슬라이더 업데이트 완료`);
    }

    // 폴백 이미지 시스템
    showFallbackImages(container, fallbackImages, placeName) {
        const slider = container.querySelector('.place-images-slider');
        if (!slider) return;

        if (fallbackImages.length > 0) {
            // 사용자 제공 폴백 이미지 사용
            this.updateImageSlider(container, fallbackImages.map((url, index) => ({
                url: url,
                reference: null
            })), placeName);
        } else {
            // 기본 폴백 이미지
            slider.innerHTML = `
                <div class="fallback-image-placeholder">
                    <div class="placeholder-icon">📍</div>
                    <div class="placeholder-text">${placeName}</div>
                    <div class="placeholder-subtitle">이미지를 불러올 수 없습니다</div>
                </div>
            `;
        }
    }

    // 페이지의 모든 장소 이미지 자동 갱신
    async refreshAllPlaceImages() {
        const imageContainers = document.querySelectorAll('.place-images[id*="slider"]');
        console.log(`🔄 총 ${imageContainers.length}개 장소 이미지 갱신 시작`);

        for (const container of imageContainers) {
            const containerId = container.id;
            // ID에서 장소명 추출 (예: "slider-1-airport" -> "airport")
            const placeKey = containerId.split('-').pop();
            
            // 장소 매핑 테이블
            const placeMapping = {
                'airport': 'Macau International Airport',
                'andaz': 'Andaz Macau',
                'galaxy': 'Galaxy Macau',
                'broadway': 'Broadway Macau',
                'venetian': 'The Venetian Macao',
                'grand-resort-deck': 'Grand Resort Deck'
            };

            const placeName = placeMapping[placeKey];
            if (placeName) {
                await this.loadPlaceImages(placeName, containerId);
                // API 요청 제한을 위한 딜레이
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('✅ 모든 장소 이미지 갱신 완료');
    }
}

// 전역 이미지 로더 인스턴스
let imageLoader;

// 전역 함수: 단순하고 확실한 Google Maps 링크
function openMobileMap(placeName, lat, lng, placeId = null) {
    console.log(`🗺️ 구글맵 열기 요청: ${placeName}`);
    
    // 가장 단순하고 확실한 방법: 장소명으로 검색
    const searchQuery = encodeURIComponent(placeName);
    const mapUrl = `https://www.google.com/maps/search/${searchQuery}`;
    
    console.log(`📍 구글맵 URL: ${mapUrl}`);
    
    // 새 탭으로 열기
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
}

// 페이지 로드 시 맵 링크 자동 개선 및 이미지 로더 초기화
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(improveMapLinks, 1000);
    
    // 이미지 로더 초기화
    if (typeof placesService !== 'undefined') {
        imageLoader = new DynamicImageLoader(placesService);
        window.imageLoader = imageLoader; // 전역으로 노출
        console.log('🖼️ Dynamic Image Loader 초기화 완료');
        
        // 자동 이미지 갱신 실행 (정적 호스팅에서는 비활성화)
        // setTimeout(() => {
        //     imageLoader.refreshAllPlaceImages();
        // }, 3000);
        console.log('📸 정적 호스팅 모드: API 이미지 로딩 비활성화됨');
    }
    
    // 전역 함수 등록
    window.openMobileMap = openMobileMap;
    console.log('📱 모바일 맵 함수 등록 완료');
});