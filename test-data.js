/**
 * 테스트 데이터 생성 스크립트
 * localStorage에 PWA 템플릿 테스트용 데이터를 저장합니다.
 */

// 마카오 여행 테스트 데이터
const testTravelData = {
    tripTitle: "🇲🇴 마카오 가족여행",
    destination: "마카오",
    duration: "2박 3일",
    budget: "1인당 약 50만원",
    destinationEmoji: "🇲🇴",
    destinationFlag: "🇲🇴",
    tips: [
        "🎰 카지노는 21세 이상만 입장 가능해요",
        "🍜 포르투갈 요리와 중국 요리가 잘 어우러진 마카오 음식을 꼭 드세요",
        "🚌 무료 셔틀버스를 적극 활용하세요",
        "💰 파타카보다는 홍콩달러가 더 편리해요"
    ],
    days: [
        {
            dayNumber: "1",
            theme: "도착 & 세나도 광장 탐방",
            timeline: [
                {
                    time: "09:00",
                    title: "인천공항 출발",
                    description: "대한항공 KE693편으로 마카오 향발",
                    location: "인천국제공항 제2터미널"
                },
                {
                    time: "12:30",
                    title: "마카오 도착",
                    description: "마카오국제공항 도착 후 입국 수속",
                    location: "마카오국제공항"
                },
                {
                    time: "14:00",
                    title: "호텔 체크인",
                    description: "파리지앙 마카오 호텔 체크인 및 휴식",
                    location: "파리지앙 마카오"
                },
                {
                    time: "16:00",
                    title: "세나도 광장",
                    description: "마카오의 중심지이자 유네스코 세계문화유산 탐방",
                    location: "세나도 광장"
                },
                {
                    time: "18:00",
                    title: "포르투갈 정통 요리",
                    description: "마카오 전통 포르투갈 요리 디너",
                    location: "클럽 밀리터리 드 마카우"
                }
            ]
        },
        {
            dayNumber: "2",
            theme: "문화유산 & 관광지 투어",
            timeline: [
                {
                    time: "09:00",
                    title: "호텔 조식",
                    description: "파리지앙 마카오 호텔 뷔페 조식",
                    location: "파리지앙 마카오"
                },
                {
                    time: "10:30",
                    title: "몬테 요새",
                    description: "17세기 포르투갈 요새와 마카오 박물관 관람",
                    location: "몬테 요새"
                },
                {
                    time: "12:00",
                    title: "성 바울 대성당 유적",
                    description: "마카오의 상징적 랜드마크 방문",
                    location: "성 바울 대성당 유적"
                },
                {
                    time: "14:00",
                    title: "마카오 타워",
                    description: "338m 높이의 마카오 타워에서 시티뷰 감상",
                    location: "마카오 타워"
                },
                {
                    time: "16:30",
                    title: "카지노 체험",
                    description: "베네치안 마카오에서 카지노 문화 체험",
                    location: "베네치안 마카오"
                },
                {
                    time: "19:00",
                    title: "하우스 오브 댄싱 워터",
                    description: "세계적 수준의 워터쇼 관람",
                    location: "시티 오브 드림스"
                }
            ]
        },
        {
            dayNumber: "3",
            theme: "쇼핑 & 출발",
            timeline: [
                {
                    time: "09:00",
                    title: "호텔 조식 & 체크아웃",
                    description: "마지막 호텔 조식 후 체크아웃",
                    location: "파리지앙 마카오"
                },
                {
                    time: "10:30",
                    title: "갤럭시 마카오 쇼핑",
                    description: "면세점 쇼핑 및 기념품 구매",
                    location: "갤럭시 마카오"
                },
                {
                    time: "12:30",
                    title: "마지막 식사",
                    description: "유명한 마카오 에그타르트와 커피",
                    location: "로드 스토우 베이커리"
                },
                {
                    time: "14:00",
                    title: "공항 이동",
                    description: "마카오국제공항으로 이동 및 출국 수속",
                    location: "마카오국제공항"
                },
                {
                    time: "16:00",
                    title: "마카오 출발",
                    description: "대한항공 KE694편으로 인천 향발",
                    location: "마카오국제공항"
                },
                {
                    time: "20:30",
                    title: "인천 도착",
                    description: "인천국제공항 도착, 마카오 여행 완료",
                    location: "인천국제공항"
                }
            ]
        }
    ],
    budget_breakdown: [
        { icon: "✈️", category: "항공료", amount: "20만원" },
        { icon: "🏨", category: "숙박비", amount: "15만원" },
        { icon: "🍽️", category: "식비", amount: "10만원" },
        { icon: "🎡", category: "관광/쇼", amount: "3만원" },
        { icon: "🛍️", category: "쇼핑/기타", amount: "2만원" }
    ]
};

// localStorage에 테스트 데이터 저장
function setTestData() {
    localStorage.setItem('generatedApp_test123', JSON.stringify(testTravelData));
    console.log('✅ PWA 테스트 데이터가 localStorage에 저장되었습니다.');
    console.log('🔗 테스트 URL: http://localhost:8765/templates/main-template.html?session=test123');
}

// 즉시 실행
setTestData();