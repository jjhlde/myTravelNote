const fs = require('fs');

/**
 * 목업 Places API 응답 생성 (실제 API 키 이슈 대안)
 */
function createMockPlaceData(placeQuery) {
    // 마카오 주요 장소들의 목업 데이터
    const mockData = {
        'Galaxy Macau': {
            placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: 'Galaxy Macau',
            address: 'Estrada da Baía de Nossa Senhora da Esperança, s/n, Taipa, Macao',
            coordinates: { lat: 22.1463, lng: 113.5585 },
            rating: 4.2,
            photos: [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400'
            ],
            reviews: '"Amazing resort with great facilities!" (5⭐) | "Perfect for family vacation" (4⭐) | "Excellent service and location" (5⭐)',
            website: 'https://www.galaxymacau.com',
            mapLink: 'https://maps.google.com/?q=22.1463,113.5585'
        },
        'Venetian Macao': {
            placeId: 'ChIJ5TCOcRauEmsRfstfuIabdDU',
            name: 'The Venetian Macao',
            address: 'Estrada da Baía de Nossa Senhora da Esperança, s/n, Taipa, Macao',
            coordinates: { lat: 22.1482, lng: 113.5644 },
            rating: 4.3,
            photos: [
                'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400',
                'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400'
            ],
            reviews: '"Beautiful Venice-themed resort!" (5⭐) | "Great shopping and dining" (4⭐)',
            website: 'https://www.venetianmacao.com',
            mapLink: 'https://maps.google.com/?q=22.1482,113.5644'
        },
        'Senado Square Macau': {
            placeId: 'ChIJrTLr-GyuEmsRnrXiPA0L_iw',
            name: 'Senado Square',
            address: 'Largo do Senado, Macao',
            coordinates: { lat: 22.1930, lng: 113.5387 },
            rating: 4.1,
            photos: [
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
            ],
            reviews: '"Historic and beautiful square!" (5⭐) | "Must-visit in Macau" (4⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=22.1930,113.5387'
        },
        'Ruins of St. Paul Macau': {
            placeId: 'ChIJ_a-wEGyuEmsRBtW0O4zdArI',
            name: 'Ruins of St. Paul\'s',
            address: 'R. de São Paulo, Macao',
            coordinates: { lat: 22.1977, lng: 113.5390 },
            rating: 4.0,
            photos: [
                'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
            ],
            reviews: '"Iconic landmark of Macau!" (5⭐) | "Historical significance" (4⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=22.1977,113.5390'
        },
        'Taipa Village Macau': {
            placeId: 'ChIJKxE8lxyuEmsR9NEBw_EaJkA',
            name: 'Taipa Village',
            address: 'Rua do Cunha, Taipa, Macao',
            coordinates: { lat: 22.1567, lng: 113.5493 },
            rating: 4.0,
            photos: [
                'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
            ],
            reviews: '"Charming old village atmosphere!" (4⭐) | "Great local food" (5⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=22.1567,113.5493'
        },
        'Macau International Airport': {
            placeId: 'ChIJW_vFsxyuEmsRJdE5OdW6WwI',
            name: 'Macau International Airport',
            address: 'Alameda Dr. Carlos d\'Assumpção, Taipa, Macao',
            coordinates: { lat: 22.1496, lng: 113.5919 },
            rating: 3.8,
            photos: [
                'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400'
            ],
            reviews: '"Modern and efficient airport" (4⭐) | "Good shopping options" (3⭐)',
            website: 'https://www.macau-airport.com',
            mapLink: 'https://maps.google.com/?q=22.1496,113.5919'
        },
        'Lord Stow Bakery Macau': {
            placeId: 'ChIJp0J8mRyuEmsRy3T5TQHxWUo',
            name: 'Lord Stow\'s Bakery',
            address: 'Rua do Tassara, Coloane, Macao',
            coordinates: { lat: 22.1282, lng: 113.5611 },
            rating: 4.2,
            photos: [
                'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'
            ],
            reviews: '"Best egg tarts in Macau!" (5⭐) | "Famous Portuguese pastries" (4⭐)',
            website: '',
            mapLink: 'https://maps.google.com/?q=22.1282,113.5611'
        }
    };
    
    // 검색어 매칭
    for (const [key, data] of Object.entries(mockData)) {
        if (placeQuery.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(placeQuery.toLowerCase())) {
            return data;
        }
    }
    
    // 기본 폴백 데이터
    return {
        placeId: '',
        name: placeQuery,
        address: 'Macau',
        coordinates: { lat: 22.1987, lng: 113.5439 },
        rating: null,
        photos: [],
        reviews: '장소 정보 확인 중...',
        website: '',
        mapLink: `https://maps.google.com/?q=${encodeURIComponent(placeQuery)} Macau`
    };
}

/**
 * 목업 데이터로 Places enrichment 테스트
 */
async function enrichPlaceWithMockData(placeQuery, originalData = {}) {
    console.log(`🔍 Processing: ${placeQuery}`);
    
    const mockPlaceData = createMockPlaceData(placeQuery);
    
    const enrichedData = {
        ...originalData,
        placeDetails: {
            placeId: mockPlaceData.placeId,
            name: mockPlaceData.name,
            address: mockPlaceData.address,
            coordinates: mockPlaceData.coordinates,
            rating: mockPlaceData.rating,
            photos: mockPlaceData.photos,
            reviews: mockPlaceData.reviews,
            website: mockPlaceData.website,
            mapLink: mockPlaceData.mapLink
        }
    };
    
    console.log(`   ✅ Enriched: ${mockPlaceData.name}`);
    return enrichedData;
}

/**
 * JSON 파일에서 모든 placeQuery 처리 (목업 데이터 사용)
 */
async function processJsonWithMockData(inputFile, outputFile) {
    console.log(`📂 Reading file: ${inputFile}`);
    
    const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    let processedCount = 0;
    
    // mainPlan의 dailyPlans 처리
    if (jsonData.mainPlan && jsonData.mainPlan.dailyPlans) {
        for (const day of jsonData.mainPlan.dailyPlans) {
            if (day.activities) {
                for (const activity of day.activities) {
                    if (activity.placeQuery) {
                        const enriched = await enrichPlaceWithMockData(activity.placeQuery, activity);
                        Object.assign(activity, enriched);
                        processedCount++;
                    }
                    
                    // alternatives 처리
                    if (activity.alternatives && activity.alternatives.length > 0) {
                        for (const alt of activity.alternatives) {
                            if (alt.placeQuery) {
                                const enriched = await enrichPlaceWithMockData(alt.placeQuery);
                                alt.placeDetails = enriched.placeDetails;
                                processedCount++;
                            }
                        }
                    }
                }
            }
        }
    }
    
    // accommodations 처리
    if (jsonData.accommodations) {
        for (const accommodation of jsonData.accommodations) {
            if (accommodation.placeQuery) {
                const enriched = await enrichPlaceWithMockData(accommodation.placeQuery, accommodation);
                Object.assign(accommodation, enriched);
                processedCount++;
            }
            
            // alternatives 처리
            if (accommodation.alternatives && accommodation.alternatives.length > 0) {
                for (const alt of accommodation.alternatives) {
                    if (alt.placeQuery) {
                        const enriched = await enrichPlaceWithMockData(alt.placeQuery);
                        alt.placeDetails = enriched.placeDetails;
                        processedCount++;
                    }
                }
            }
        }
    }
    
    // 완성된 JSON 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalOutputFile = outputFile || `mock_enriched_travel_plan_${timestamp}.json`;
    
    fs.writeFileSync(finalOutputFile, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Mock enriched JSON saved to: ${finalOutputFile}`);
    console.log(`📊 Statistics: ${processedCount} places processed with mock data`);
    
    return jsonData;
}

/**
 * 메인 실행 함수
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node test-place-enrichment.js <input-json-file> [output-json-file]');
        console.log('Example: node test-place-enrichment.js travel_plan_Macau_2025-07-20T11-53-26-928Z.json');
        return;
    }
    
    const inputFile = args[0];
    const outputFile = args[1];
    
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Input file not found: ${inputFile}`);
        return;
    }
    
    try {
        await processJsonWithMockData(inputFile, outputFile);
        console.log('🎉 Mock processing completed successfully!');
        console.log('📋 Note: This uses mock data. For real Places API, ensure API key has Places API enabled with billing.');
    } catch (error) {
        console.error('❌ Error processing file:', error);
    }
}

// 스크립트로 직접 실행될 때만 main 함수 호출
if (require.main === module) {
    main();
}

module.exports = {
    enrichPlaceWithMockData,
    processJsonWithMockData,
    createMockPlaceData
};