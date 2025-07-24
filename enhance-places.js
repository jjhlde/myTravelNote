// Enhanced Places Integration for Existing Travel Pages
// This script dynamically enhances existing place cards with Places API data

class PlaceEnhancer {
    constructor() {
        this.placesService = null;
        this.enhanced = new Set(); // Track enhanced places to avoid duplicates
        this.init();
    }

    async init() {
        // Wait for Places API to be available
        await this.waitForPlacesService();
        
        // Start enhancing places
        this.enhanceAllPlaces();
        
        console.log('🚀 Place Enhancer initialized');
    }

    waitForPlacesService() {
        return new Promise((resolve) => {
            const checkService = () => {
                if (window.placesService && typeof window.placesService.findPlaceByName === 'function') {
                    this.placesService = window.placesService;
                    resolve();
                } else {
                    setTimeout(checkService, 100);
                }
            };
            checkService();
        });
    }

    // Extract place name and coordinates from existing HTML structure
    extractPlaceInfo(element) {
        const locationTitle = element.querySelector('.location-title');
        const mapLink = element.querySelector('a[href*="maps.google.com"]');
        
        if (!locationTitle) return null;

        let placeName = locationTitle.textContent.replace(/[🛬🏨🚌🍽️🌃🛏️🚣🎨🌊🎢🏊]/g, '').trim();
        let coordinates = null;

        // Extract coordinates from map link
        if (mapLink) {
            const coordMatch = mapLink.href.match(/q=([0-9.-]+),([0-9.-]+)/);
            if (coordMatch) {
                coordinates = {
                    lat: parseFloat(coordMatch[1]),
                    lng: parseFloat(coordMatch[2])
                };
            }
            
            // Also try to extract from @coordinates format
            const atCoordMatch = mapLink.href.match(/@([0-9.-]+),([0-9.-]+)/);
            if (atCoordMatch && !coordinates) {
                coordinates = {
                    lat: parseFloat(atCoordMatch[1]),
                    lng: parseFloat(atCoordMatch[2])
                };
            }
        }

        return { placeName, coordinates, element };
    }

    // Find all place elements in the current page
    findPlaceElements() {
        const activities = document.querySelectorAll('.activity');
        const places = [];

        activities.forEach(activity => {
            const placeInfo = this.extractPlaceInfo(activity);
            if (placeInfo && !this.enhanced.has(placeInfo.placeName)) {
                places.push(placeInfo);
            }
        });

        return places;
    }

    // Enhance a single place card with API data
    async enhancePlace(placeInfo) {
        const { placeName, coordinates, element } = placeInfo;
        
        if (this.enhanced.has(placeName)) return;
        
        try {
            console.log(`🔍 Enhancing place: ${placeName}`);
            
            // Get enhanced data from Places API
            const placeData = await this.placesService.findPlaceByName(placeName, coordinates);
            
            // Update existing place card
            this.updatePlaceCard(element, placeData);
            
            this.enhanced.add(placeName);
            console.log(`✅ Enhanced: ${placeName}`);
            
        } catch (error) {
            console.warn(`⚠️ Failed to enhance ${placeName}:`, error);
        }
    }

    // Update existing place card with new data
    updatePlaceCard(element, placeData) {
        let infoCard = element.querySelector('.place-info-card');
        
        if (!infoCard) {
            // Create new info card if it doesn't exist
            infoCard = document.createElement('div');
            infoCard.className = 'place-info-card';
            element.appendChild(infoCard);
        }

        // Update rating information
        this.updateRating(infoCard, placeData);
        
        // Update address information
        this.updateAddress(infoCard, placeData);
        
        // Add new enhanced information
        this.addEnhancedInfo(infoCard, placeData);
        
        // Update map link
        this.updateMapLink(element, placeData);
        
        // Add real photos if available
        this.addPhotos(element, placeData);
    }

    updateRating(infoCard, placeData) {
        let ratingDiv = infoCard.querySelector('.place-rating');
        
        if (!ratingDiv) {
            ratingDiv = document.createElement('div');
            ratingDiv.className = 'place-rating';
            infoCard.insertBefore(ratingDiv, infoCard.firstChild);
        }

        const starsHtml = placeData.rating > 0 
            ? '⭐'.repeat(Math.floor(placeData.rating)) + (placeData.rating % 1 >= 0.5 ? '✨' : '')
            : '⭐⭐⭐';

        ratingDiv.innerHTML = `
            <div class="rating-stars">${starsHtml}</div>
            <div class="rating-score">${placeData.rating > 0 ? `${placeData.rating}/5` : '평점 정보 없음'}</div>
            ${placeData.userRatingsTotal > 0 ? `<div class="rating-count">(${placeData.userRatingsTotal}개 리뷰)</div>` : ''}
        `;
    }

    updateAddress(infoCard, placeData) {
        let addressDiv = infoCard.querySelector('.place-address');
        
        if (!addressDiv) {
            addressDiv = document.createElement('div');
            addressDiv.className = 'place-address';
            infoCard.appendChild(addressDiv);
        }

        // Use more specific address if available
        const address = placeData.address !== '마카오' && placeData.address 
            ? placeData.address 
            : addressDiv.querySelector('.address-text')?.textContent || '마카오';

        addressDiv.innerHTML = `
            <span class="address-icon">📍</span>
            <span class="address-text">${address}</span>
        `;
    }

    addEnhancedInfo(infoCard, placeData) {
        // Remove existing enhanced info to avoid duplicates
        const existingEnhanced = infoCard.querySelector('.place-enhanced-info');
        if (existingEnhanced) {
            existingEnhanced.remove();
        }

        const enhancedDiv = document.createElement('div');
        enhancedDiv.className = 'place-enhanced-info';

        let enhancedHtml = '';

        // Business status and opening hours
        if (placeData.openingHoursStatus && placeData.openingHoursStatus.text !== '영업시간 정보 없음') {
            enhancedHtml += `
                <div class="business-status ${placeData.openingHoursStatus.status}">
                    🕒 ${placeData.openingHoursStatus.text}
                </div>
            `;
        }

        // Price level
        if (placeData.priceLevelText !== '가격 정보 없음') {
            enhancedHtml += `<div class="price-level">💰 ${placeData.priceLevelText}</div>`;
        }

        // Service options (for restaurants)
        if (placeData.serviceOptions && placeData.serviceOptions.length > 0) {
            enhancedHtml += `
                <div class="service-info">
                    <span class="service-label">🏪 서비스:</span> ${placeData.serviceOptions.join(', ')}
                </div>
            `;
        }

        // Meal times (for restaurants)
        if (placeData.mealTimes && placeData.mealTimes.length > 0) {
            enhancedHtml += `
                <div class="service-info">
                    <span class="service-label">🍽️ 식사:</span> ${placeData.mealTimes.join(', ')}
                </div>
            `;
        }

        // Contact information
        if (placeData.website || placeData.phoneNumber) {
            enhancedHtml += '<div class="place-contacts">';
            if (placeData.website) {
                enhancedHtml += `<a href="${placeData.website}" target="_blank" class="contact-link">🌐 웹사이트</a>`;
            }
            if (placeData.phoneNumber) {
                enhancedHtml += `<a href="tel:${placeData.phoneNumber}" class="contact-link">📞 ${placeData.phoneNumber}</a>`;
            }
            enhancedHtml += '</div>';
        }

        if (enhancedHtml) {
            enhancedDiv.innerHTML = enhancedHtml;
            infoCard.appendChild(enhancedDiv);
        }
    }

    updateMapLink(element, placeData) {
        const mapLink = element.querySelector('a[href*="maps.google.com"]');
        if (mapLink && placeData.mapLink) {
            mapLink.href = placeData.mapLink;
        }
    }

    addPhotos(element, placeData) {
        if (!placeData.photos || placeData.photos.length === 0) return;

        // Check if photos already exist
        const existingPhotos = element.querySelector('.place-images');
        if (existingPhotos) return; // Don't replace existing photos

        // Create new photos section
        const photosDiv = document.createElement('div');
        photosDiv.className = 'place-photos-api';
        
        const sliderId = `api-slider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        photosDiv.innerHTML = `
            <div class="place-images" id="${sliderId}">
                <div class="place-images-slider">
                    ${placeData.photos.map(photo => `
                        <img src="${photo.url}" alt="${placeData.name}" loading="lazy" onerror="this.style.display='none'">
                    `).join('')}
                </div>
                <div class="place-images-nav">
                    ${placeData.photos.map((_, i) => `
                        <div class="place-images-dot ${i === 0 ? 'active' : ''}" onclick="showSlide('${sliderId}', ${i})"></div>
                    `).join('')}
                </div>
                <button class="place-images-arrows place-images-prev" onclick="prevSlide('${sliderId}')">‹</button>
                <button class="place-images-arrows place-images-next" onclick="nextSlide('${sliderId}')">›</button>
                <div class="place-images-counter">1/${placeData.photos.length}</div>
            </div>
        `;

        // Insert photos before the activity description
        const activityDesc = element.querySelector('.activity-desc');
        if (activityDesc) {
            activityDesc.appendChild(photosDiv);
        }
    }

    // Enhance all places on the current page
    async enhanceAllPlaces() {
        const places = this.findPlaceElements();
        
        if (places.length === 0) {
            console.log('ℹ️ No places found to enhance on this page');
            return;
        }

        console.log(`🔍 Found ${places.length} places to enhance`);

        // Enhance places with delay to avoid API rate limits
        for (const place of places) {
            await this.enhancePlace(place);
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log('✅ All places enhanced');
    }

    // Public method to manually trigger enhancement
    refresh() {
        this.enhanced.clear();
        this.enhanceAllPlaces();
    }
}

// CSS for enhanced elements
const enhancedCSS = `
<style>
.place-enhanced-info {
    margin: 12px 0;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 3px solid #10b981;
}

.business-status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    margin: 4px 0;
}

.business-status.open {
    background: #dcfce7;
    color: #166534;
}

.business-status.closed {
    background: #fef2f2;
    color: #dc2626;
}

.business-status.unknown {
    background: #f3f4f6;
    color: #6b7280;
}

.price-level {
    display: inline-block;
    padding: 4px 12px;
    background: #fef3c7;
    color: #92400e;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    margin: 4px 0;
}

.service-info {
    margin: 6px 0;
    font-size: 14px;
}

.service-label {
    font-weight: bold;
    color: #374151;
}

.place-contacts {
    margin: 12px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.contact-link {
    display: inline-block;
    padding: 6px 12px;
    background: #e5e7eb;
    color: #374151;
    text-decoration: none;
    border-radius: 6px;
    font-size: 12px;
    transition: background 0.2s;
}

.contact-link:hover {
    background: #d1d5db;
}

.rating-count {
    font-size: 12px;
    color: #6b7280;
    margin-left: 8px;
}

.place-photos-api {
    margin: 15px 0;
}
</style>
`;

// Inject CSS
document.head.insertAdjacentHTML('beforeend', enhancedCSS);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.placeEnhancer = new PlaceEnhancer();
    });
} else {
    window.placeEnhancer = new PlaceEnhancer();
}

// Make it available globally
window.PlaceEnhancer = PlaceEnhancer;