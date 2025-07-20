const fs = require('fs');
const path = require('path');

// config.js에서 API 키 가져오기
const configPath = path.join(__dirname, 'config.js');
let API_KEY;

try {
    // config.js 파일을 문자열로 읽어서 GOOGLE_PLACES_API_KEY 추출
    const configContent = fs.readFileSync(configPath, 'utf8');
    const placesApiKeyMatch = configContent.match(/GOOGLE_PLACES_API_KEY: ['"]([^'"]+)['"]/);
    if (placesApiKeyMatch) {
        API_KEY = placesApiKeyMatch[1];
        console.log('✅ config.js에서 Places API 키 로드 성공');
    } else {
        // 폴백으로 일반 API_KEY 사용
        const apiKeyMatch = configContent.match(/const API_KEY = ["']([^"']+)["']/);
        if (apiKeyMatch) {
            API_KEY = apiKeyMatch[1];
            console.log('⚠️  일반 API 키로 폴백');
        } else {
            throw new Error('config.js에서 API 키를 찾을 수 없습니다');
        }
    }
} catch (error) {
    console.error('❌ config.js 로드 실패:', error.message);
    API_KEY = "AIzaSyDERW_lRSOP3dcot_xSIgiTWhHRX4U1RXU"; // 새로운 Places API 키
    console.log('⚠️  하드코딩된 Places API 키 사용');
}
const BASE_URL = "https://maps.googleapis.com/maps/api/place";

/**
 * 검색 쿼리 최적화 - 너무 구체적인 검색어를 일반화
 */
function optimizeSearchQuery(originalQuery) {
    // 마카오 관련 최적화
    const macauOptimizations = {
        '갤럭시 마카오': 'Galaxy Macau',
        '갤럭시 마카오 그랜드 리조트 덱': 'Galaxy Macau Resort',
        '갤럭시 마카오 푸드코트': 'Galaxy Macau food court',
        '갤럭시 마카오 딘타이펑': 'Din Tai Fung Macau',
        '갤럭시 마카오 내 레스토랑': 'Galaxy Macau restaurant',
        '갤럭시 마카오 쇼핑 아케이드': 'Galaxy Macau shopping',
        '베네시안 마카오': 'Venetian Macao',
        '마카오 국제공항': 'Macau International Airport',
        '세나도 광장': 'Senado Square Macau',
        '성 바울 성당 유적': 'Ruins of St. Paul Macau',
        '타이파 빌리지': 'Taipa Village Macau',
        '마카오 로드 스토우': 'Lord Stow Bakery Macau',
        '웡치케이': 'Wong Chi Kei Macau'
    };
    
    // 정확한 매치 확인
    for (const [korean, english] of Object.entries(macauOptimizations)) {
        if (originalQuery.includes(korean)) {
            return english;
        }
    }
    
    // 일반적인 최적화
    let optimized = originalQuery
        .replace(/또는.*$/, '') // "또는 ..." 부분 제거
        .replace(/\(.*\)/, '') // 괄호 안 내용 제거
        .replace(/근처.*$/, '') // "근처 ..." 부분 제거
        .replace(/내.*$/, '') // "내 ..." 부분 제거
        .trim();
    
    return optimized || originalQuery;
}

/**
 * Google Places API 텍스트 검색
 */
async function searchPlace(query) {
    const optimizedQuery = optimizeSearchQuery(query);
    const url = `${BASE_URL}/textsearch/json?query=${encodeURIComponent(optimizedQuery)}&key=${API_KEY}&language=ko`;
    
    console.log(`   → Optimized: "${query}" → "${optimizedQuery}"`);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
            console.log(`   ✅ Found: ${data.results[0].name}`);
            return data.results[0]; // 첫 번째 결과 반환
        } else {
            console.warn(`   ❌ No results found for: ${optimizedQuery} (status: ${data.status})`);
            return null;
        }
    } catch (error) {
        console.error(`   💥 Error searching place ${optimizedQuery}:`, error.message);
        return null;
    }
}

/**
 * Place Details API로 상세 정보 가져오기 (더 많은 사진 포함)
 */
async function getPlaceDetails(placeId) {
    const fields = 'place_id,name,formatted_address,geometry,rating,reviews,photos,website,opening_hours';
    const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}&language=ko`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log(`   📷 Place Details found ${data.result.photos ? data.result.photos.length : 0} photos`);
            return data.result;
        } else {
            console.warn(`   ❌ No details found for place_id: ${placeId} (status: ${data.status})`);
            return null;
        }
    } catch (error) {
        console.error(`   💥 Error getting place details ${placeId}:`, error.message);
        return null;
    }
}

/**
 * 사진 URL 생성 (2-3장 가져오기)
 */
function getPhotoUrls(photos, maxPhotos = 3) {
    if (!photos || photos.length === 0) return [];
    
    // 최대 3장까지 사진 URL 생성
    const photoUrls = [];
    const numPhotos = Math.min(photos.length, maxPhotos);
    
    for (let i = 0; i < numPhotos; i++) {
        if (photos[i] && photos[i].photo_reference) {
            photoUrls.push(
                `${BASE_URL}/photo?maxwidth=400&photoreference=${photos[i].photo_reference}&key=${API_KEY}`
            );
        }
    }
    
    console.log(`   📸 Generated ${photoUrls.length} photo URLs from ${photos.length} available photos`);
    return photoUrls;
}

/**
 * 리뷰 요약 생성
 */
function summarizeReviews(reviews) {
    if (!reviews || reviews.length === 0) return "리뷰 정보 없음";
    
    // 최신 리뷰 2-3개 요약
    const topReviews = reviews.slice(0, 3);
    return topReviews.map(review => `"${review.text.substring(0, 50)}..." (${review.rating}⭐)`).join(' | ');
}

/**
 * Place 데이터 처리 및 enrichment
 */
async function enrichPlaceData(placeQuery, originalData = {}) {
    console.log(`🔍 Searching for: ${placeQuery}`);
    
    // 1. 텍스트 검색으로 기본 정보 가져오기
    const searchResult = await searchPlace(placeQuery);
    if (!searchResult) {
        return {
            ...originalData,
            placeDetails: {
                placeId: "",
                address: "",
                coordinates: { lat: null, lng: null },
                website: "",
                rating: null,
                photos: [],
                reviews: "장소 정보를 찾을 수 없습니다.",
                mapLink: ""
            }
        };
    }

    // 2. Place Details로 상세 정보 가져오기
    const detailResult = await getPlaceDetails(searchResult.place_id);
    
    // 3. 사진 통합 (Text Search + Place Details)
    let allPhotos = [];
    if (searchResult.photos) {
        allPhotos = allPhotos.concat(searchResult.photos);
    }
    if (detailResult && detailResult.photos) {
        // Place Details의 사진 중 중복되지 않는 것만 추가
        const existingPhotoRefs = allPhotos.map(p => p.photo_reference);
        const additionalPhotos = detailResult.photos.filter(p => 
            !existingPhotoRefs.includes(p.photo_reference)
        );
        allPhotos = allPhotos.concat(additionalPhotos);
    }
    
    // 4. 데이터 정리 및 구조화
    const enrichedData = {
        ...originalData,
        placeDetails: {
            placeId: searchResult.place_id,
            name: searchResult.name,
            address: searchResult.formatted_address,
            coordinates: {
                lat: searchResult.geometry.location.lat,
                lng: searchResult.geometry.location.lng
            },
            rating: searchResult.rating || null,
            photos: getPhotoUrls(allPhotos, 3), // 최대 3장
            reviews: detailResult ? summarizeReviews(detailResult.reviews) : "리뷰 정보 없음",
            website: detailResult?.website || "",
            mapLink: `https://maps.google.com/?q=${searchResult.geometry.location.lat},${searchResult.geometry.location.lng}`
        }
    };

    console.log(`✅ Enriched: ${searchResult.name}`);
    return enrichedData;
}

/**
 * JSON 파일에서 placeQuery가 있는 모든 항목 처리
 */
async function processJsonFile(inputFile, outputFile) {
    console.log(`📂 Reading file: ${inputFile}`);
    
    // JSON 파일 읽기
    const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    const processPromises = [];
    
    // mainPlan의 dailyPlans 처리
    if (jsonData.mainPlan && jsonData.mainPlan.dailyPlans) {
        for (const day of jsonData.mainPlan.dailyPlans) {
            if (day.activities) {
                for (const activity of day.activities) {
                    if (activity.placeQuery) {
                        processPromises.push(
                            enrichPlaceData(activity.placeQuery, activity)
                                .then(enriched => { Object.assign(activity, enriched); })
                        );
                    }
                    
                    // alternatives 처리
                    if (activity.alternatives && activity.alternatives.length > 0) {
                        for (const alt of activity.alternatives) {
                            if (alt.placeQuery) {
                                processPromises.push(
                                    enrichPlaceData(alt.placeQuery)
                                        .then(enriched => { 
                                            alt.placeDetails = enriched.placeDetails; 
                                        })
                                );
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
                processPromises.push(
                    enrichPlaceData(accommodation.placeQuery, accommodation)
                        .then(enriched => { Object.assign(accommodation, enriched); })
                );
            }
            
            // alternatives 처리
            if (accommodation.alternatives && accommodation.alternatives.length > 0) {
                for (const alt of accommodation.alternatives) {
                    if (alt.placeQuery) {
                        processPromises.push(
                            enrichPlaceData(alt.placeQuery)
                                .then(enriched => { 
                                    alt.placeDetails = enriched.placeDetails; 
                                })
                        );
                    }
                }
            }
        }
    }
    
    // 모든 API 호출 완료 대기
    console.log(`🚀 Processing ${processPromises.length} places...`);
    await Promise.all(processPromises);
    
    // 완성된 JSON 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalOutputFile = outputFile || `enriched_travel_plan_${timestamp}.json`;
    
    fs.writeFileSync(finalOutputFile, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Enriched JSON saved to: ${finalOutputFile}`);
    
    // 통계 출력
    const totalPlaces = processPromises.length;
    const enrichedPlaces = countEnrichedPlaces(jsonData);
    console.log(`📊 Statistics: ${enrichedPlaces}/${totalPlaces} places enriched`);
    
    return jsonData;
}

/**
 * enriched된 장소 개수 계산
 */
function countEnrichedPlaces(jsonData) {
    let count = 0;
    
    // mainPlan activities 확인
    if (jsonData.mainPlan && jsonData.mainPlan.dailyPlans) {
        for (const day of jsonData.mainPlan.dailyPlans) {
            if (day.activities) {
                for (const activity of day.activities) {
                    if (activity.placeDetails && activity.placeDetails.placeId) count++;
                    if (activity.alternatives) {
                        count += activity.alternatives.filter(alt => 
                            alt.placeDetails && alt.placeDetails.placeId
                        ).length;
                    }
                }
            }
        }
    }
    
    // accommodations 확인
    if (jsonData.accommodations) {
        for (const accommodation of jsonData.accommodations) {
            if (accommodation.placeDetails && accommodation.placeDetails.placeId) count++;
            if (accommodation.alternatives) {
                count += accommodation.alternatives.filter(alt => 
                    alt.placeDetails && alt.placeDetails.placeId
                ).length;
            }
        }
    }
    
    return count;
}

/**
 * 메인 실행 함수
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node place-api-server.js <input-json-file> [output-json-file]');
        console.log('Example: node place-api-server.js travel_plan_Macau_2025-07-20T11-53-26-928Z.json');
        return;
    }
    
    const inputFile = args[0];
    const outputFile = args[1];
    
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Input file not found: ${inputFile}`);
        return;
    }
    
    try {
        await processJsonFile(inputFile, outputFile);
        console.log('🎉 Processing completed successfully!');
    } catch (error) {
        console.error('❌ Error processing file:', error);
    }
}

// 스크립트로 직접 실행될 때만 main 함수 호출
if (require.main === module) {
    main();
}

module.exports = {
    enrichPlaceData,
    processJsonFile,
    searchPlace,
    getPlaceDetails
};