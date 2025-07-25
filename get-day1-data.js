// day1.html 장소 데이터 수집 스크립트
// places-api.js 사용

const placesData = {};

async function getDay1PlacesData() {
    console.log('🔄 Day1 장소 데이터 수집 시작...');
    
    try {
        // 1. 마카오 국제공항
        console.log('📍 마카오 국제공항 검색 중...');
        const airportData = await placesService.findPlaceByName('Macau International Airport', {lat: 22.1496, lng: 113.5919});
        placesData.airport = airportData;
        console.log('✅ 마카오 국제공항 완료:', airportData.name, airportData.rating);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 2. 안다즈 마카오
        console.log('📍 안다즈 마카오 검색 중...');
        const andazData = await placesService.findPlaceByName('Andaz Macau', {lat: 22.1489, lng: 113.5543});
        placesData.andaz = andazData;
        console.log('✅ 안다즈 마카오 완료:', andazData.name, andazData.rating);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 3. 브로드웨이 푸드스트리트
        console.log('📍 브로드웨이 푸드스트리트 검색 중...');
        const broadwayData = await placesService.findPlaceByName('Broadway Food Street Macau', {lat: 22.1472, lng: 113.5497});
        placesData.broadway = broadwayData;
        console.log('✅ 브로드웨이 푸드스트리트 완료:', broadwayData.name, broadwayData.rating);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 4. 팀호완
        console.log('📍 팀호완 검색 중...');
        const timHoWanData = await placesService.findPlaceByName('Tim Ho Wan Broadway Macau', {lat: 22.1472, lng: 113.5497});
        placesData.timHoWan = timHoWanData;
        console.log('✅ 팀호완 완료:', timHoWanData.name, timHoWanData.rating);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 5. 갤럭시 호텔
        console.log('📍 갤럭시 호텔 검색 중...');
        const galaxyData = await placesService.findPlaceByName('Galaxy Hotel Macau', {lat: 22.1489, lng: 113.5543});
        placesData.galaxy = galaxyData;
        console.log('✅ 갤럭시 호텔 완료:', galaxyData.name, galaxyData.rating);
        
        console.log('🎉 모든 장소 데이터 수집 완료!');
        console.log('📊 수집된 데이터:', placesData);
        
        return placesData;
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        throw error;
    }
}

// 전역에서 접근 가능하도록 설정
window.getDay1PlacesData = getDay1PlacesData;
window.day1PlacesData = placesData;