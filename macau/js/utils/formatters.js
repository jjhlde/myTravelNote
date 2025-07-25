/**
 * 포맷팅 유틸리티 함수들
 */

/**
 * 숫자를 한국 원화 형식으로 포맷
 * @param {number} amount - 금액
 * @returns {string} 포맷된 금액 문자열
 */
export function formatKoreanWon(amount) {
    if (amount === 0) return '0원';
    return amount.toLocaleString('ko-KR') + '원';
}

/**
 * 숫자를 천 단위 구분자와 함께 포맷
 * @param {number} number - 숫자
 * @returns {string} 포맷된 숫자 문자열
 */
export function formatNumber(number) {
    return number.toLocaleString('ko-KR');
}

/**
 * 날짜를 한국 형식으로 포맷
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatKoreanDate(date) {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * 시간을 한국 형식으로 포맷
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷된 시간 문자열
 */
export function formatKoreanTime(date) {
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 간단한 날짜 포맷 (MM/DD)
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatSimpleDate(date) {
    const dateObj = new Date(date);
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
}