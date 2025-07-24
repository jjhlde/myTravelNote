const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8008;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// JSON 요청 본문을 파싱하는 헬퍼 함수
function parseJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const jsonData = JSON.parse(body);
      callback(null, jsonData);
    } catch (error) {
      callback(error, null);
    }
  });
}

const server = http.createServer((req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // URL에서 쿼리 파라미터 제거
  let pathname;
  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    pathname = parsedUrl.pathname;
  } catch (e) {
    pathname = req.url.split('?')[0]; // Fallback
  }

  // API 엔드포인트 처리
  if (req.method === 'POST' && pathname === '/api/save-mock-response') {
    console.log('📥 /api/save-mock-response 요청 받음');
    
    parseJsonBody(req, (err, travelData) => {
      if (err) {
        console.error('❌ JSON 파싱 실패:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON data' }));
        return;
      }

      // mock_resp.json 파일로 저장
      const mockRespPath = path.join(__dirname, 'mock_resp.json');
      fs.writeFile(mockRespPath, JSON.stringify(travelData, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('❌ mock_resp.json 저장 실패:', writeErr);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'File save failed' }));
        } else {
          console.log('✅ mock_resp.json 파일 저장 완료');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            filePath: mockRespPath,
            message: 'mock_resp.json saved successfully' 
          }));
        }
      });
    });
    return;
  }

  // PWA 생성 API
  if (req.method === 'POST' && pathname === '/api/generate-pwa') {
    console.log('🚀 /api/generate-pwa 요청 받음');
    
    parseJsonBody(req, (err, travelData) => {
      if (err) {
        console.error('❌ JSON 파싱 실패:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON data' }));
        return;
      }

      // 세션 ID 생성
      const sessionId = Date.now().toString();
      const pwaUrl = `/templates/main-template.html?session=${sessionId}`;

      console.log('✅ PWA 데이터 준비 완료, 세션 ID:', sessionId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        sessionId: sessionId,
        pwaUrl: pwaUrl,
        travelData: travelData,
        message: 'PWA data prepared successfully' 
      }));
    });
    return;
  }

  // Places API 프록시 엔드포인트
  if (req.method === 'GET' && pathname === '/api/places/textsearch') {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const query = parsedUrl.searchParams.get('query');
    const key = parsedUrl.searchParams.get('key');
    const language = parsedUrl.searchParams.get('language') || 'ko';
    const type = parsedUrl.searchParams.get('type');
    
    if (!query || !key) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing query or API key' }));
      return;
    }

    console.log('🗺️ Places API 검색:', query);

    // Google Places API Text Search URL 구성
    let apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}&language=${language}`;
    
    if (type) {
      apiUrl += `&type=${type}`;
    }

    // Google Places API 호출
    const https = require('https');
    https.get(apiUrl, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Places API 응답 (${query}):`, jsonData.status);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        } catch (parseError) {
          console.error('❌ Places API 응답 파싱 실패:', parseError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid API response' }));
        }
      });
    }).on('error', (error) => {
      console.error('❌ Places API 요청 실패:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API request failed' }));
    });
    
    return;
  }

  // Places API Details 엔드포인트
  if (req.method === 'GET' && pathname === '/api/places/details') {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const placeId = parsedUrl.searchParams.get('place_id');
    const key = parsedUrl.searchParams.get('key');
    const language = parsedUrl.searchParams.get('language') || 'ko';
    const fields = parsedUrl.searchParams.get('fields') || 'name,formatted_address,geometry,rating,photos,reviews,url';
    
    if (!placeId || !key) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing place_id or API key' }));
      return;
    }

    console.log('🏢 Places API Details:', placeId);

    // Google Places API Details URL 구성
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${key}&language=${language}&fields=${encodeURIComponent(fields)}`;

    // Google Places API 호출
    const https = require('https');
    https.get(apiUrl, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Places API Details 응답 (${placeId}):`, jsonData.status);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        } catch (parseError) {
          console.error('❌ Places API Details 응답 파싱 실패:', parseError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid API response' }));
        }
      });
    }).on('error', (error) => {
      console.error('❌ Places API Details 요청 실패:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API request failed' }));
    });
    
    return;
  }

  // 정적 파일 서빙 (기존 로직)
  // 기본 경로 처리
  if (pathname === '/') {
    pathname = '/chatbot.html';
  } else if (pathname === '/test') {
    pathname = '/test-template-rendering.html';
  }

  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1>');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`📱 메인 페이지: http://localhost:${PORT}/chatbot.html`);
  console.log(`🧪 템플릿 테스트: http://localhost:${PORT}/test`);
  console.log(`🏠 랜딩 페이지: http://localhost:${PORT}/landing.html`);
  console.log(`🔧 기존 예제: http://localhost:${PORT}/main.html`);
});