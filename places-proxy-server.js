const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3002;

// CORS 설정
app.use(cors());
app.use(express.json());

// Google Places API 프록시 엔드포인트
app.get('/api/places/textsearch', async (req, res) => {
    try {
        const { query, key } = req.query;
        
        console.log(`🔍 Places API 프록시 요청: "${query}"`);
        
        if (!query || !key) {
            return res.status(400).json({ 
                error: 'Missing required parameters: query or key' 
            });
        }
        
        const apiUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
        const params = new URLSearchParams({
            query: query,
            key: key,
            language: 'ko',
            fields: 'place_id,name,formatted_address,geometry,rating,photos,reviews,website,opening_hours,price_level,types'
        });
        
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log(`   ✅ Places API 성공: ${data.results[0]?.name || 'Unknown'}`);
            res.json(data);
        } else {
            console.log(`   ❌ Places API 오류: ${data.status}`);
            res.status(400).json(data);
        }
        
    } catch (error) {
        console.error('❌ Places API 프록시 에러:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Place Details API 프록시 (리뷰와 사진을 위한 상세 정보)
app.get('/api/places/details', async (req, res) => {
    try {
        const { place_id, key } = req.query;
        
        console.log(`🔍 Place Details API 프록시 요청: "${place_id}"`);
        
        if (!place_id || !key) {
            return res.status(400).json({ 
                error: 'Missing required parameters: place_id or key' 
            });
        }
        
        const apiUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
        const params = new URLSearchParams({
            place_id: place_id,
            key: key,
            language: 'ko',
            fields: 'place_id,name,formatted_address,geometry,rating,reviews,photos,website,opening_hours,price_level,types,user_ratings_total'
        });
        
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log(`   ✅ Place Details 성공: ${data.result?.name || 'Unknown'}`);
            res.json(data);
        } else {
            console.log(`   ❌ Place Details 오류: ${data.status}`);
            res.status(400).json(data);
        }
        
    } catch (error) {
        console.error('❌ Place Details 프록시 에러:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Places API 프록시 서버 실행: http://localhost:${PORT}`);
    console.log(`📡 텍스트 검색: GET /api/places/textsearch?query=검색어&key=API키`);
    console.log(`📡 상세정보: GET /api/places/details?place_id=장소ID&key=API키`);
});