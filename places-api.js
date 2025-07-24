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
            let searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`;
            const params = new URLSearchParams({
                input: placeName,
                inputtype: 'textquery',
                fields: 'place_id,name,formatted_address,geometry,rating,photos,price_level,opening_hours,types',
                key: this.apiKey
            });

            // 좌표가 있으면 위치 바이어스 추가
            if (coordinates) {
                params.append('locationbias', `circle:2000@${coordinates.lat},${coordinates.lng}`);
            } else {
                // 마카오 지역으로 제한
                params.append('locationbias', `circle:${this.macauBounds.radius}@${this.macauBounds.lat},${this.macauBounds.lng}`);
            }

            const response = await fetch(`${searchUrl}?${params}`);
            const data = await response.json();

            if (data.status === 'OK' && data.candidates.length > 0) {
                const place = data.candidates[0];
                
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
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json`;
            const params = new URLSearchParams({
                place_id: placeId,
                fields: 'name,formatted_address,geometry,rating,user_ratings_total,photos,reviews,opening_hours,price_level,website,formatted_phone_number,types',
                key: this.apiKey,
                language: 'ko' // 한국어 우선
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

// 페이지 로드 시 맵 링크 자동 개선
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(improveMapLinks, 1000);
});